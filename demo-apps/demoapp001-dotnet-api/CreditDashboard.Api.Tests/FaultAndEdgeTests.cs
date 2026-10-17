using System.Net;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// CDS-38 F3: the review's service findings about faults and the edge. A-01 and A-02 (an unhandled fault is a 500 Problem with
/// no trace, in every environment; a body that repeats a property name is a 400), A-03 (the test-control gate holds for every
/// spelling of the path), A-05 (<c>X-Correlation-Id</c>), A-06 (the clock takes RFC 3339 and nothing else), A-07 (the year
/// window is checked before the target), A-08 (a test-control error is never plain text), A-18 (the clock is read whole), A-20
/// (the hosted UI).
/// </summary>
[TestFixture]
public class FaultAndEdgeTests
{
    private const string DuplicateKeyLogin = """{"username":"alex","username":"sam","password":"demo-only"}""";

    // ---- A-01, A-02

    [TestCase("Production")]
    [TestCase("Development")]
    public async Task A_login_body_that_repeats_a_property_is_a_400_problem_in_every_environment(string environment)
    {
        using var host = new ServiceHost(("environment", environment));
        var response = await host.Send(HttpMethod.Post, "/auth/login", DuplicateKeyLogin);
        var text = await response.Content.ReadAsStringAsync();
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest), text);
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/problem+json"));
        Assert.That(JsonNode.Parse(text)!["type"]!.GetValue<string>(), Is.EqualTo("/problems/validation"));
        Assert.That(text, Does.Not.Contain("System.").And.Not.Contain("CreditDashboard.Api."));
    }

    [TestCase("Production")]
    [TestCase("Development")]
    public async Task An_unhandled_fault_is_a_500_problem_with_no_trace_in_every_environment(string environment)
    {
        using var host = await new HostBuilder()
            .ConfigureWebHost(web => web
                .UseTestServer()
                .UseEnvironment(environment)
                .ConfigureServices(services => services.AddLogging())
                .Configure(app =>
                {
                    app.UseMiddleware<FaultHandler>();
                    app.Run(_ => throw new InvalidOperationException("secret-detail-from-the-fault"));
                }))
            .StartAsync();
        var response = await host.GetTestClient().GetAsync("/anything");
        var text = await response.Content.ReadAsStringAsync();
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/problem+json"));
        var problem = JsonNode.Parse(text)!;
        Assert.That(problem["type"]!.GetValue<string>(), Is.EqualTo("/problems/internal"));
        Assert.That(problem["status"]!.GetValue<int>(), Is.EqualTo(500));
        Assert.That(text, Does.Not.Contain("secret-detail").And.Not.Contain("InvalidOperationException").And.Not.Contain(" at "));
    }

    // ---- A-03

    [TestCase("/api/v1/__test/reset")]
    [TestCase("/api/v1//__test/reset")]
    [TestCase("/api/v1/__test//reset")]
    [TestCase("/api/v1///__test///reset")]
    [TestCase("/API/V1/__TEST/RESET")]
    [TestCase("/api/v1/__test")]
    [TestCase("/api/v1//__test")]
    public async Task With_test_control_off_every_spelling_of_a_test_control_path_is_the_same_404(string path)
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();
        foreach (var method in new[] { HttpMethod.Get, HttpMethod.Post, HttpMethod.Put })
        {
            var response = await client.SendAsync(new HttpRequestMessage(method, path));
            var text = await response.Content.ReadAsStringAsync();
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound), $"{method} {path}: {text}");
            Assert.That(response.Content.Headers.Allow, Is.Empty, $"{method} {path} must not reveal the methods of a test-control path");
            Assert.That(JsonNode.Parse(text)!["detail"]!.GetValue<string>(), Is.EqualTo("Test control is not enabled."));
        }
    }

    [Test]
    public async Task With_test_control_on_a_double_slash_path_without_the_key_is_the_gates_404()
    {
        using var host = new ServiceHost();
        var without = await host.Client.SendAsync(new HttpRequestMessage(HttpMethod.Post, "/api/v1//__test/reset"));
        Assert.That(without.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        Assert.That(JsonNode.Parse(await without.Content.ReadAsStringAsync())!["detail"]!.GetValue<string>(), Is.EqualTo("Test control is not enabled."));
        // The right spelling with the key still works.
        Assert.That((await host.Control(HttpMethod.Post, "/reset")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    // ---- A-05

    [Test]
    public async Task A_supplied_correlation_id_is_echoed_on_every_kind_of_response()
    {
        using var host = new ServiceHost();
        var token = await host.Token();
        foreach (var (method, path, bearer) in new[]
                 {
                     (HttpMethod.Get, "/me", token),            // 200
                     (HttpMethod.Get, "/me", null),             // 401
                     (HttpMethod.Get, "/nothing-here", null),   // 404
                     (HttpMethod.Delete, "/me", token),         // 405
                 })
        {
            var request = new HttpRequestMessage(method, ServiceHost.Base + path);
            request.Headers.Add("X-Correlation-Id", "abc-123.DEF_4");
            if (bearer is not null) request.Headers.Authorization = new("Bearer", bearer);
            var response = await host.Client.SendAsync(request);
            Assert.That(response.Headers.GetValues("X-Correlation-Id"), Is.EqualTo(new[] { "abc-123.DEF_4" }), $"{method} {path} -> {(int)response.StatusCode}");
        }
    }

    [Test]
    public async Task A_correlation_id_is_generated_when_the_request_has_none_and_replaced_when_it_is_not_a_short_token()
    {
        using var host = new ServiceHost();
        var generated = (await host.Client.GetAsync(ServiceHost.Base + "/bureaux")).Headers.GetValues("X-Correlation-Id").Single();
        Assert.That(Guid.TryParse(generated, out _), Is.True, generated);
        foreach (var unsafeValue in new[] { new string('a', 129), "has space", "semi;colon", "" })
        {
            var request = new HttpRequestMessage(HttpMethod.Get, ServiceHost.Base + "/bureaux");
            request.Headers.TryAddWithoutValidation("X-Correlation-Id", unsafeValue);
            var echoed = (await host.Client.SendAsync(request)).Headers.GetValues("X-Correlation-Id").Single();
            Assert.That(echoed, Is.Not.EqualTo(unsafeValue), $"'{unsafeValue}' must not be echoed");
            Assert.That(Guid.TryParse(echoed, out _), Is.True, echoed);
        }
    }

    // ---- A-06

    [TestCase("2026-10-03T09:00:00Z", 204)]
    [TestCase("2026-10-03T09:00:00+01:00", 204)]
    [TestCase("2026-10-03T09:00:00.5Z", 204)]
    [TestCase("2026-10-03t09:00:00z", 204)]
    [TestCase("2026-10-03T09:00:00", 400)]       // no offset
    [TestCase("2026-10-03T09:00", 400)]          // no seconds
    [TestCase("2026-10-03T09:00Z", 400)]         // no seconds
    [TestCase("2026-10-03 09:00:00Z", 400)]      // a space for the T
    [TestCase("2026-13-03T09:00:00Z", 400)]      // no month 13
    [TestCase("2026-02-30T09:00:00Z", 400)]      // no 30 February
    [TestCase("2026-10-03T09:00:00+0100", 400)]  // the offset needs its colon
    [TestCase("Oct 3 2026 9am", 400)]
    public async Task The_clock_takes_an_RFC_3339_date_time_and_nothing_else(string now, int expected)
    {
        using var host = new ServiceHost();
        var response = await host.Control(HttpMethod.Put, "/clock", $$"""{"now":"{{now}}"}""");
        Assert.That((int)response.StatusCode, Is.EqualTo(expected), now);
        if (expected == 400)
            Assert.That(JsonNode.Parse(await response.Content.ReadAsStringAsync())!["type"]!.GetValue<string>(), Is.EqualTo("/problems/validation"));
        else
            Assert.That(host.Services.GetService(typeof(IControlledClock)) is IControlledClock { Frozen: not null });
    }

    // ---- A-07

    [Test]
    public async Task An_out_of_window_year_is_a_400_before_the_bureau_and_the_persona_are_looked_at()
    {
        using var host = new ServiceHost();
        await host.Freeze("2026-10-03T09:00:00Z");
        var token = await host.Token();
        var unknownBureau = await host.Send(HttpMethod.Get, "/reports/bureau-zzz/payment-history?year=2018", token: token);
        Assert.That(unknownBureau.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest), await unknownBureau.Content.ReadAsStringAsync());
        var unknownAccount = await host.Send(HttpMethod.Get, "/accounts/acc_nope00/payment-history?year=2018", token: token);
        Assert.That(unknownAccount.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest), await unknownAccount.Content.ReadAsStringAsync());

        await host.Bind("alex", "error");
        var errorPersona = await host.Send(HttpMethod.Get, "/reports/bureau-a/payment-history?year=2018", token: await host.Token());
        Assert.That(errorPersona.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest), await errorPersona.Content.ReadAsStringAsync());
    }

    [Test]
    public async Task An_in_window_year_still_gets_the_404_for_an_unknown_bureau_and_the_500_for_the_error_persona()
    {
        using var host = new ServiceHost();
        await host.Freeze("2026-10-03T09:00:00Z");
        Assert.That((await host.Send(HttpMethod.Get, "/reports/bureau-zzz/payment-history?year=2025", token: await host.Token())).StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        await host.Bind("alex", "error");
        Assert.That((await host.Send(HttpMethod.Get, "/reports/bureau-a/payment-history?year=2025", token: await host.Token())).StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));
    }

    // ---- A-08

    [Test]
    public async Task With_problem_json_missing_on_a_test_control_error_is_still_a_problem_and_a_product_error_is_plain_text()
    {
        using var host = new ServiceHost();
        Assert.That((await host.Control(HttpMethod.Put, "/bugs", """{"flags":["problem-json-missing"]}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        var control = await host.Control(HttpMethod.Put, "/bugs", """{"flags":["no-such-flag"]}""");
        Assert.That(control.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        Assert.That(control.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/problem+json"));

        var product = await host.Send(HttpMethod.Get, "/me");
        Assert.That(product.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        Assert.That(product.Content.Headers.ContentType?.MediaType, Is.EqualTo("text/plain"), "the flag still breaks the product's own errors");
    }

    // ---- A-18

    [Test]
    public void The_clock_is_never_seen_half_written()
    {
        var clock = new ControlledClock(TimeProvider.System);
        var a = new DateTimeOffset(2026, 10, 3, 9, 0, 0, TimeSpan.Zero);
        var b = new DateTimeOffset(2031, 1, 2, 3, 4, 5, TimeSpan.Zero);
        using var stop = new CancellationTokenSource(TimeSpan.FromMilliseconds(400));
        var bad = new List<DateTimeOffset?>();
        var writers = new[] { a, b }.Select(instant => Task.Run(() =>
        {
            while (!stop.IsCancellationRequested) { clock.Freeze(instant); clock.Release(); }
        })).ToArray();
        var reader = Task.Run(() =>
        {
            while (!stop.IsCancellationRequested)
            {
                var seen = clock.Frozen;
                if (seen is not null && seen != a && seen != b) lock (bad) bad.Add(seen);
            }
        });
        Task.WaitAll([.. writers, reader]);
        Assert.That(bad, Is.Empty, "a reader saw an instant nobody wrote");
    }

    // ---- A-20

    private static (string Folder, Func<ServiceHost> Host) UiFolder()
    {
        var folder = Path.Combine(Path.GetTempPath(), "cds-ui-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Path.Combine(folder, "assets"));
        File.WriteAllText(Path.Combine(folder, "index.html"), "<!doctype html><title>cds</title><div id=\"root\"></div>");
        File.WriteAllText(Path.Combine(folder, "assets", "app.js"), "console.log('cds');");
        return (folder, () => new ServiceHost(("UI_DIRECTORY", folder)));
    }

    [Test]
    public async Task The_hosted_UI_never_caches_index_html_whichever_path_reaches_it_and_answers_a_head_like_a_get()
    {
        var (folder, host) = UiFolder();
        try
        {
            using var service = host();
            foreach (var path in new[] { "/", "/login", "/index.html" })
            {
                var response = await service.Client.GetAsync(path);
                Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK), path);
                Assert.That(response.Headers.CacheControl?.NoStore, Is.True, $"{path} must be no-store");
            }
            var head = await service.Client.SendAsync(new HttpRequestMessage(HttpMethod.Head, "/login"));
            Assert.That(head.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(head.Content.Headers.ContentType?.MediaType, Is.EqualTo("text/html"));
        }
        finally { Directory.Delete(folder, recursive: true); }
    }

    [Test]
    public async Task A_missing_file_under_assets_is_a_404_problem_and_a_present_one_is_served()
    {
        var (folder, host) = UiFolder();
        try
        {
            using var service = host();
            var missing = await service.Client.GetAsync("/assets/missing.js");
            Assert.That(missing.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
            Assert.That(missing.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/problem+json"));
            var present = await service.Client.GetAsync("/assets/app.js");
            Assert.That(present.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(await present.Content.ReadAsStringAsync(), Does.Contain("console.log"));
        }
        finally { Directory.Delete(folder, recursive: true); }
    }

    [Test]
    public async Task The_hosted_UI_carries_a_correlation_id_too()
    {
        var (folder, host) = UiFolder();
        try
        {
            using var service = host();
            Assert.That((await service.Client.GetAsync("/")).Headers.Contains("X-Correlation-Id"), Is.True);
        }
        finally { Directory.Delete(folder, recursive: true); }
    }
}
