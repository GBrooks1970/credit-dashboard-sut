using System.Net;
using System.Text;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// CDS-38 F11a (the confirmation pass): R2-A-01 and R2-C-13 (a body that is not text is a 400, never a fault), R2-A-09 (the real service
/// uses the fault handler), R2-A-02 (latency numbers), R2-A-03 (dates in an override), R2-A-05 and R2-A-11 (the clock), R2-A-06 (a signed
/// year or page), R2-A-12 (a stored number is the number), R2-A-15 (a path parameter is decoded once).
/// </summary>
[TestFixture]
public class ParsingAndClockTests
{
    private ServiceHost _service = null!;

    [SetUp]
    public void SetUp() => _service = new ServiceHost();

    [TearDown]
    public void TearDown() => _service.Dispose();

    private static ByteArrayContent Bytes(byte[] raw)
    {
        var content = new ByteArrayContent(raw);
        content.Headers.ContentType = new("application/json");
        return content;
    }

    private async Task<(HttpStatusCode Status, string Type)> Post(string path, byte[] body, string? token = null, HttpMethod? method = null)
    {
        var request = new HttpRequestMessage(method ?? HttpMethod.Post, ServiceHost.Base + path) { Content = Bytes(body) };
        if (token is not null) request.Headers.Authorization = new("Bearer", token);
        var response = await _service.Client.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();
        var type = text.StartsWith('{') ? JsonNode.Parse(text)!["type"]?.GetValue<string>() ?? "" : "";
        return (response.StatusCode, type);
    }

    // ---- R2-A-01, R2-C-13: a body that is not text

    private static readonly byte[] LoneSurrogate = Encoding.UTF8.GetBytes("""{"username":"alex","password":"\ud800"}""");
    private static readonly byte[] InvalidUtf8 = [.. Encoding.UTF8.GetBytes("{\"username\":\"x"), 0xC3, 0x28, .. Encoding.UTF8.GetBytes("\",\"password\":\"demo-only\"}")];

    [Test]
    public async Task A_login_body_that_is_not_text_is_a_400_not_a_fault()
    {
        foreach (var (name, body) in new[] { ("a lone surrogate escape", LoneSurrogate), ("invalid UTF-8", InvalidUtf8) })
        {
            var (status, type) = await Post("/auth/login", body);
            Assert.That(status, Is.EqualTo(HttpStatusCode.BadRequest), name);
            Assert.That(type, Is.EqualTo("/problems/validation"), name);
        }
    }

    [TestCase("PATCH", "/me/profile/preferred-name", """{"preferredName":"\ud800"}""")]
    [TestCase("PUT", "/me/profile/email", """{"address":"\ud800"}""")]
    [TestCase("PUT", "/me/profile/mobile", """{"number":"\ud800"}""")]
    [TestCase("POST", "/me/profile/mobile/verification", """{"code":"\ud800"}""")]
    [TestCase("POST", "/assistant/messages", """{"message":"\ud800"}""")]
    public async Task Every_string_field_of_a_signed_in_operation_refuses_a_lone_surrogate(string method, string path, string json)
    {
        var token = await _service.Token();
        var (status, type) = await Post(path, Encoding.UTF8.GetBytes(json), token, new HttpMethod(method));
        Assert.That(status, Is.EqualTo(HttpStatusCode.BadRequest), $"{method} {path}");
        Assert.That(type, Is.EqualTo("/problems/validation"));
    }

    [Test]
    public async Task A_body_with_a_valid_non_ascii_string_is_still_accepted()
    {
        var token = await _service.Token();
        var (status, _) = await Post("/me/profile/preferred-name", Encoding.UTF8.GetBytes("""{"preferredName":"Zoë"}"""), token, HttpMethod.Patch);
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        var (pair, _) = await Post("/me/profile/preferred-name", Encoding.UTF8.GetBytes("""{"preferredName":"𐐀"}"""), token, HttpMethod.Patch);
        Assert.That(pair, Is.EqualTo(HttpStatusCode.OK), "a surrogate pair is a letter outside the BMP, not a lone surrogate");
    }

    // ---- R2-A-09: the real service, not a pipeline of the test's own

    private sealed class FaultyTime : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => throw new InvalidOperationException("secret-detail-from-the-real-service");
    }

    [TestCase("Production")]
    [TestCase("Development")]
    public async Task A_fault_inside_the_real_service_is_a_500_problem_with_no_trace(string environment)
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("environment", environment);
            builder.ConfigureTestServices(services => services.AddSingleton<TimeProvider>(new FaultyTime()));
        });
        using var client = factory.CreateClient();
        // The sign-in reads the clock; the clock reads the (faulty) real time because test control has not frozen it.
        var response = await client.PostAsync(ServiceHost.Base + "/auth/login", new StringContent("""{"username":"alex","password":"demo-only"}""", Encoding.UTF8, "application/json"));
        var text = await response.Content.ReadAsStringAsync();
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError), text);
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/problem+json"));
        Assert.That(JsonNode.Parse(text)!["type"]!.GetValue<string>(), Is.EqualTo("/problems/internal"));
        Assert.That(text, Does.Not.Contain("secret-detail").And.Not.Contain("InvalidOperationException").And.Not.Contain(" at "));
    }

    // ---- R2-A-05, R2-A-11: the clock

    [TestCase("2026-10-03T09:00:00Z", 204)]
    [TestCase("2026-10-03T09:00:00Z\\n", 400)]       // a trailing newline: `$` matched before it
    [TestCase("２０２６-10-03T09:00:00Z", 400)] // full-width digits: `\d` matches them
    [TestCase("1990-01-01T00:00:00Z", 204)]
    [TestCase("1989-12-31T23:59:59Z", 400)]
    [TestCase("2100-12-31T23:59:59Z", 204)]
    [TestCase("2101-01-01T00:00:00Z", 400)]
    [TestCase("0001-01-01T00:00:00Z", 400)]
    [TestCase("9999-12-31T23:59:59Z", 400)]
    public async Task The_clock_takes_an_RFC_3339_date_time_between_1990_and_2100(string now, int expected)
    {
        var response = await _service.Control(HttpMethod.Put, "/clock", "{\"now\":\"" + now + "\"}");
        Assert.That((int)response.StatusCode, Is.EqualTo(expected), now);
        // Whatever the clock holds, the next sign-in works.
        Assert.That((await _service.Send(HttpMethod.Post, "/auth/login", """{"username":"alex","password":"demo-only"}""")).StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    // ---- R2-A-02: latency numbers

    [TestCase("""{"fixedMs":1000}""", 204)]
    [TestCase("""{"minMs":10,"maxMs":20}""", 204)]
    [TestCase("""{"fixedMs":1e3}""", 400)]
    [TestCase("""{"fixedMs":1E3}""", 400)]
    [TestCase("""{"minMs":1e1,"maxMs":20}""", 400)]
    public async Task Latency_numbers_are_whole_numbers_written_plainly(string json, int expected)
    {
        Assert.That((int)(await _service.Control(HttpMethod.Put, "/latency", json)).StatusCode, Is.EqualTo(expected), json);
        await _service.Control(HttpMethod.Post, "/reset");
    }

    // ---- R2-A-03: dates in an override

    [TestCase("openedDate", "x")]
    [TestCase("openedDate", "2020-01-01x")]
    [TestCase("closedDate", "soon")]
    [TestCase("lastUpdated", "garbage")]
    [TestCase("openedDate", "2020-13-01")]
    public async Task An_override_with_a_value_that_is_not_a_date_is_a_422_at_bind_and_never_a_fault_later(string field, string value)
    {
        var sample = JsonNode.Parse(File.ReadAllText(ServiceHost.RepoFile("fixtures", "overrides", "br13-closed-anniversary.json")))!.AsObject();
        sample["overrides"]!["bureaux"]![0]!["accounts"]![0]![field] = value;
        var body = new JsonObject { ["persona"] = sample["base"]!.DeepClone(), ["overrides"] = sample["overrides"]!.DeepClone() }.ToJsonString();
        var response = await _service.Control(HttpMethod.Put, "/users/alex/persona", body);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.UnprocessableEntity), await response.Content.ReadAsStringAsync());
        Assert.That(await response.Content.ReadAsStringAsync(), Does.Contain("not a date"));
        Assert.That((await _service.Send(HttpMethod.Get, "/reports/bureau-a/payment-history", token: await _service.Token())).StatusCode, Is.EqualTo(HttpStatusCode.OK), "the read after a refused bind");
    }

    // ---- R2-A-06: a signed year or page

    [TestCase("/reports/bureau-a/payment-history?year=%2B2025", 200, 2025)]
    [TestCase("/reports/bureau-a/payment-history?year=%2B2018", 400, 0)]
    [TestCase("/accounts/acc_ddcc01/payment-history?year=%2B2025", 200, 2025)]
    [TestCase("/accounts/acc_ddcc01/payment-history?year=%2B2018", 400, 0)]
    public async Task A_signed_year_is_read_as_the_number_it_is(string path, int expected, int year)
    {
        await _service.Freeze("2026-10-03T09:00:00Z");
        await _service.Bind("alex", "drilldown");
        var response = await _service.Send(HttpMethod.Get, path, token: await _service.Token());
        Assert.That((int)response.StatusCode, Is.EqualTo(expected), await response.Content.ReadAsStringAsync());
        if (expected == 200) Assert.That(JsonNode.Parse(await response.Content.ReadAsStringAsync())!["selectedYear"]!.GetValue<int>(), Is.EqualTo(year));
    }

    [Test]
    public async Task A_signed_page_is_read_as_the_number_it_is()
    {
        await _service.Bind("alex", "drilldown");
        var response = await _service.Send(HttpMethod.Get, "/reports/bureau-a/changes?page=%2B2&pageSize=1", token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(JsonNode.Parse(await response.Content.ReadAsStringAsync())!["page"]!.GetValue<int>(), Is.EqualTo(2));
    }

    // ---- R2-A-12: the stored number is the number

    [TestCase("""{"field":"apr","value":-0}""", "apr", "0")]
    [TestCase("""{"field":"promoPeriodMonths","value":6e1}""", "promoPeriodMonths", "60")]
    [TestCase("""{"field":"interestRate","value":2.9E1}""", "interestRate", "29")]
    public async Task A_detail_is_stored_and_echoed_as_the_number_it_is(string json, string field, string expected)
    {
        await _service.Bind("alex", "drilldown");
        var response = await _service.Send(HttpMethod.Patch, "/accounts/acc_ddcc01/details", json, token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK), await response.Content.ReadAsStringAsync());
        Assert.That(JsonNode.Parse(await response.Content.ReadAsStringAsync())![field]!.ToJsonString(), Is.EqualTo(expected));
    }

    [Test]
    public async Task A_payment_amount_beyond_a_64_bit_integer_is_out_of_range()
    {
        await _service.Bind("alex", "drilldown");
        var body = """{"field":"minPayment","value":{"amount":{"amountMinor":1e20,"currency":"GBP"}}}""";
        var response = await _service.Send(HttpMethod.Patch, "/accounts/acc_ddcc01/details", body, token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.UnprocessableEntity), await response.Content.ReadAsStringAsync());
    }

    // ---- R2-A-15: a path parameter is decoded once

    [Test]
    public async Task A_path_parameter_is_not_decoded_a_second_time_by_the_edge()
    {
        await _service.Bind("alex", "drilldown");
        // %2561 is the text %61, which is not an account ID (the pattern needs letters and digits). Decoding twice made the edge see 'a'.
        var response = await _service.Send(HttpMethod.Get, "/accounts/acc_%2561bcde", token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest), await response.Content.ReadAsStringAsync());
    }
}
