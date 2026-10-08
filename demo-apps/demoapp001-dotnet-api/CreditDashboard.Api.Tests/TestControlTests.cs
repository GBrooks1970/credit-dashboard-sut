using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// Test control (DR-008, DR-020, API specification 6.5, CDS-21): the gate, the seven operations, the overrides rules and
/// reset. Every problem body is checked against the contract's own Problem schema.
/// </summary>
public class TestControlTests
{
    private const string Key = "test-key";
    private const string Base = "/api/v1/__test";

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    [SetUp]
    public void Start() => Start(enabled: true, key: Key);

    private void Start(bool enabled, string? key)
    {
        _client?.Dispose();
        _factory?.Dispose();
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("TEST_CONTROL", enabled ? "true" : "false");
            if (key is not null) builder.UseSetting("TEST_CONTROL_KEY", key);
        });
        _client = _factory.CreateClient();
    }

    [TearDown]
    public void Stop()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    private static string RepoFile(params string[] parts)
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
            if (File.Exists(Path.Combine(dir.FullName, "DOCS", ".design", "api-specification.md"))) return Path.Combine([dir.FullName, .. parts]);
        throw new DirectoryNotFoundException("repository root not found");
    }

    private Task<HttpResponseMessage> Send(HttpMethod method, string path, string? json = null, string? key = Key)
    {
        var request = new HttpRequestMessage(method, Base + path)
        {
            Content = json is null ? null : new StringContent(json, Encoding.UTF8, "application/json"),
        };
        if (key is not null) request.Headers.Add(TestControlGate.KeyHeader, key);
        return _client.SendAsync(request);
    }

    private async Task<JsonElement> Problem(HttpResponseMessage response, HttpStatusCode status, string type)
    {
        var text = await response.Content.ReadAsStringAsync();
        Assert.That(response.StatusCode, Is.EqualTo(status), text);
        var body = JsonDocument.Parse(text).RootElement.Clone();
        var schema = _factory.Services.GetRequiredService<ContractModel>().ComponentSchema("Problem");
        Assert.That(schema.Evaluate(body).IsValid, Is.True, $"body does not match the contract's Problem schema: {text}");
        Assert.That(body.GetProperty("type").GetString(), Is.EqualTo(type));
        return body;
    }

    private async Task<JsonObject> State()
    {
        var response = await Send(HttpMethod.Get, "/state");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        return JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
    }

    // The gate (DR-008)

    [Test]
    public async Task With_test_control_off_every_operation_is_a_404_even_with_the_key()
    {
        Start(enabled: false, key: Key);
        await Problem(await Send(HttpMethod.Post, "/reset"), HttpStatusCode.NotFound, "/problems/not-found");
        await Problem(await Send(HttpMethod.Get, "/state"), HttpStatusCode.NotFound, "/problems/not-found");
    }

    [Test]
    public async Task Without_the_key_header_the_answer_is_the_same_404() =>
        await Problem(await Send(HttpMethod.Post, "/reset", key: null), HttpStatusCode.NotFound, "/problems/not-found");

    [Test]
    public async Task With_the_wrong_key_the_answer_is_the_same_404() =>
        await Problem(await Send(HttpMethod.Post, "/reset", key: "not-the-key"), HttpStatusCode.NotFound, "/problems/not-found");

    [Test]
    public async Task With_the_right_key_a_reset_is_a_204() =>
        Assert.That((await Send(HttpMethod.Post, "/reset")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

    [Test]
    public void Test_control_on_without_a_key_stops_the_service_from_starting()
    {
        using var keyless = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.UseSetting("TEST_CONTROL", "true"));
        var failure = Assert.Throws<InvalidOperationException>(() => keyless.CreateClient());
        Assert.That(failure!.Message, Does.Contain("TEST_CONTROL_KEY"));
    }

    [Test]
    public async Task The_gate_does_not_touch_other_paths()
    {
        var response = await _client.GetAsync("/api/v1/debt/overview");
        await Problem(response, HttpStatusCode.NotFound, "/problems/not-found");
    }

    // State and reset

    [Test]
    public async Task The_initial_state_binds_each_user_to_their_default_persona()
    {
        var state = await State();
        Assert.That(state["personas"]!["alex"]!.GetValue<string>(), Is.EqualTo("excellent"));
        Assert.That(state["personas"]!["sam"]!.GetValue<string>(), Is.EqualTo("struggling"));
        Assert.That(state["overridden"]!["alex"]!.GetValue<bool>(), Is.False);
        Assert.That(state["flags"]!.AsArray(), Is.Empty);
        Assert.That(state["now"], Is.Null);
        Assert.That(state["latency"]!.AsObject(), Is.Empty);
    }

    [Test]
    public async Task A_reset_clears_every_part_of_the_state()
    {
        await Send(HttpMethod.Put, "/users/alex/persona", """{"persona":"drilldown"}""");
        await Send(HttpMethod.Put, "/bugs", """{"flags":["idor"]}""");
        await Send(HttpMethod.Put, "/clock", """{"now":"2026-10-03T09:00:00Z"}""");
        await Send(HttpMethod.Put, "/latency", """{"fixedMs":10}""");
        await Send(HttpMethod.Post, "/verify-email", """{"username":"alex"}""");

        Assert.That((await Send(HttpMethod.Post, "/reset")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        var state = await State();
        Assert.That(state["personas"]!["alex"]!.GetValue<string>(), Is.EqualTo("excellent"));
        Assert.That(state["flags"]!.AsArray(), Is.Empty);
        Assert.That(state["now"], Is.Null);
        Assert.That(state["latency"]!.AsObject(), Is.Empty);
        Assert.That(_factory.Services.GetRequiredService<PersonaStore>().IsEmailMarkedVerified("alex"), Is.False);
    }

    // Bind a persona

    [Test]
    public async Task Binding_a_persona_shows_in_the_state()
    {
        Assert.That((await Send(HttpMethod.Put, "/users/alex/persona", """{"persona":"drilldown"}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That((await State())["personas"]!["alex"]!.GetValue<string>(), Is.EqualTo("drilldown"));
    }

    [Test]
    public async Task Binding_an_unknown_user_is_a_404() =>
        await Problem(await Send(HttpMethod.Put, "/users/nobody/persona", """{"persona":"drilldown"}"""), HttpStatusCode.NotFound, "/problems/not-found");

    [Test]
    public async Task Binding_a_persona_outside_the_contract_is_a_400() =>
        await Problem(await Send(HttpMethod.Put, "/users/alex/persona", """{"persona":"nobody"}"""), HttpStatusCode.BadRequest, "/problems/validation");

    private static IEnumerable<string> Samples() =>
        Directory.GetFiles(RepoFile("fixtures", "overrides"), "*.json").Order().Select(Path.GetFileNameWithoutExtension)!;

    private static JsonObject Sample(string name) =>
        JsonNode.Parse(File.ReadAllText(RepoFile("fixtures", "overrides", name + ".json")))!.AsObject();

    private static string BindBody(JsonObject sample) =>
        new JsonObject { ["persona"] = sample["base"]!.DeepClone(), ["overrides"] = sample["overrides"]!.DeepClone() }.ToJsonString();

    [TestCaseSource(nameof(Samples))]
    public async Task Every_override_sample_the_fixture_check_accepts_is_accepted_here(string name)
    {
        var response = await Send(HttpMethod.Put, "/users/alex/persona", BindBody(Sample(name)));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent), await response.Content.ReadAsStringAsync());
        Assert.That((await State())["overridden"]!["alex"]!.GetValue<bool>(), Is.True);
    }

    [Test]
    public async Task Binding_again_without_overrides_clears_them()
    {
        await Send(HttpMethod.Put, "/users/alex/persona", BindBody(Sample("br03-one-credit-card")));
        await Send(HttpMethod.Put, "/users/alex/persona", """{"persona":"drilldown"}""");
        Assert.That((await State())["overridden"]!["alex"]!.GetValue<bool>(), Is.False);
    }

    [Test]
    public async Task Overrides_replace_only_the_lists_they_name()
    {
        await Send(HttpMethod.Put, "/users/alex/persona", BindBody(Sample("br03-one-credit-card")));
        var document = _factory.Services.GetRequiredService<PersonaStore>().Document("alex");
        var bureau = document["bureaux"]!.AsArray().Select(b => b!.AsObject()).First(b => b["id"]!.GetValue<string>() == "bureau-a");
        Assert.That(bureau["accounts"]!.AsArray().Select(a => a!["id"]!.GetValue<string>()), Is.EqualTo(new[] { "acc_ovcc01" }));
        Assert.That(bureau["changes"]!.AsArray(), Is.Not.Empty, "the changes list is kept from the persona");
    }

    [Test]
    public async Task Overrides_for_a_bureau_the_persona_does_not_have_are_a_404()
    {
        var sample = Sample("br03-one-credit-card");
        sample["overrides"]!["bureaux"]![0]!["id"] = "bureau-zzz";
        await Problem(await Send(HttpMethod.Put, "/users/alex/persona", BindBody(sample)), HttpStatusCode.NotFound, "/problems/not-found");
    }

    [Test]
    public async Task Overrides_with_a_body_that_fails_the_schema_are_a_400()
    {
        var sample = Sample("br03-one-credit-card");
        sample["overrides"]!["bureaux"]![0]!["accounts"]![0]!.AsObject().Remove("balance");
        await Problem(await Send(HttpMethod.Put, "/users/alex/persona", BindBody(sample)), HttpStatusCode.BadRequest, "/problems/validation");
    }

    private static JsonObject Account(JsonObject sample) => sample["overrides"]!["bureaux"]![0]!["accounts"]![0]!.AsObject();

    private async Task<string> Refused(JsonObject sample)
    {
        var body = await Problem(await Send(HttpMethod.Put, "/users/alex/persona", BindBody(sample)), HttpStatusCode.UnprocessableEntity, "/problems/rule-violation/overrides-inconsistent");
        Assert.That((await State())["overridden"]!["alex"]!.GetValue<bool>(), Is.False, "a refused binding changes nothing");
        return body.GetProperty("detail").GetString()!;
    }

    [Test]
    public async Task BR_03_a_utilisation_that_does_not_match_the_balance_and_limit_is_a_422()
    {
        var sample = Sample("br03-one-credit-card");
        Account(sample)["utilisation"] = 40;
        Assert.That(await Refused(sample), Does.Contain("BR-03").And.Contain("acc_ovcc01"));
    }

    [Test]
    public async Task BR_06_a_raw_utilisation_that_does_not_match_is_a_422()
    {
        var sample = Sample("br03-one-credit-card");
        Account(sample)["utilisationRaw"] = 49;
        Assert.That(await Refused(sample), Does.Contain("BR-06"));
    }

    [Test]
    public async Task BR_05_a_loan_without_a_limit_that_is_included_in_totals_is_a_422()
    {
        var sample = Sample("br03-one-credit-card");
        var account = Account(sample);
        account["type"] = "loan";
        account["limit"] = null;
        account["utilisation"] = null;
        account["utilisationRaw"] = null;
        account["includedInTotals"] = true;
        Assert.That(await Refused(sample), Does.Contain("BR-05"));
    }

    [Test]
    public async Task BR_09_a_mask_that_does_not_match_its_source_is_a_422()
    {
        var sample = Sample("br09-source-mask");
        Account(sample)["maskedNumber"] = "*9999";
        Assert.That(await Refused(sample), Does.Contain("BR-09"));
    }

    [Test]
    public async Task BR_12_a_missed_month_outside_the_window_is_a_422()
    {
        var sample = Sample("br03-one-credit-card");
        var account = Account(sample);
        account["openedDate"] = "2010-01-01";
        account["missedMonths"] = new JsonArray("2018-05");
        Assert.That(await Refused(sample), Does.Contain("BR-12").And.Contain("seven-year window"));
    }

    [Test]
    public async Task BR_12_a_missed_month_before_the_account_opened_is_a_422()
    {
        var sample = Sample("br03-one-credit-card");
        var account = Account(sample);
        account["openedDate"] = "2024-01-15";
        account["missedMonths"] = new JsonArray("2023-12");
        Assert.That(await Refused(sample), Does.Contain("before the account opened"));
    }

    [Test]
    public async Task BR_13_a_closed_account_with_a_balance_is_a_422()
    {
        var sample = Sample("br13-closed-anniversary");
        Account(sample)["balance"]!["amountMinor"] = 100;
        Assert.That(await Refused(sample), Does.Contain("BR-13"));
    }

    [Test]
    public async Task BR_15_an_account_id_used_in_another_persona_is_a_422()
    {
        var sample = Sample("br03-one-credit-card");
        Account(sample)["id"] = "acc_exln02"; // an excellent persona account; the base here is drilldown
        Assert.That(await Refused(sample), Does.Contain("BR-15"));
    }

    [Test]
    public async Task BR_15_an_account_id_repeated_within_a_list_is_a_422()
    {
        var sample = Sample("br03-one-credit-card");
        var accounts = sample["overrides"]!["bureaux"]![0]!["accounts"]!.AsArray();
        accounts.Add(accounts[0]!.DeepClone());
        Assert.That(await Refused(sample), Does.Contain("not unique"));
    }

    // Bug flags

    [Test]
    public async Task Bug_flags_from_the_contract_are_stored_and_reported()
    {
        Assert.That((await Send(HttpMethod.Put, "/bugs", """{"flags":["idor","util-mismatch"]}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That((await State())["flags"]!.AsArray().Select(f => f!.GetValue<string>()), Is.EqualTo(new[] { "idor", "util-mismatch" }));
    }

    [Test]
    public async Task Setting_the_flags_again_replaces_them()
    {
        await Send(HttpMethod.Put, "/bugs", """{"flags":["idor"]}""");
        await Send(HttpMethod.Put, "/bugs", """{"flags":[]}""");
        Assert.That((await State())["flags"]!.AsArray(), Is.Empty);
    }

    [Test]
    public async Task A_bug_flag_outside_the_contract_is_a_400_and_changes_nothing()
    {
        var body = await Problem(await Send(HttpMethod.Put, "/bugs", """{"flags":["idor","not-a-flag"]}"""), HttpStatusCode.BadRequest, "/problems/validation");
        Assert.That(body.GetProperty("errors").GetArrayLength(), Is.GreaterThan(0));
        Assert.That((await State())["flags"]!.AsArray(), Is.Empty);
    }

    // Clock

    [Test]
    public async Task The_clock_can_be_frozen_and_the_controlled_clock_follows()
    {
        Assert.That((await Send(HttpMethod.Put, "/clock", """{"now":"2026-10-03T09:00:00Z"}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That((await State())["now"]!.GetValue<string>(), Is.EqualTo("2026-10-03T09:00:00Z"));
        Assert.That(_factory.Services.GetRequiredService<IControlledClock>().UtcNow, Is.EqualTo(DateTimeOffset.Parse("2026-10-03T09:00:00Z")));
    }

    [Test]
    public async Task A_clock_value_that_is_not_a_date_time_is_a_400()
    {
        await Problem(await Send(HttpMethod.Put, "/clock", """{"now":"tomorrow"}"""), HttpStatusCode.BadRequest, "/problems/validation");
        await Problem(await Send(HttpMethod.Put, "/clock", """{"now":"2026-10-03"}"""), HttpStatusCode.BadRequest, "/problems/validation");
    }

    [Test]
    public async Task Until_it_is_frozen_the_clock_follows_real_time()
    {
        var clock = _factory.Services.GetRequiredService<IControlledClock>();
        Assert.That(clock.Frozen, Is.Null);
        Assert.That((DateTimeOffset.UtcNow - clock.UtcNow).Duration(), Is.LessThan(TimeSpan.FromSeconds(5)));
    }

    // Latency

    [Test]
    public async Task A_fixed_latency_is_reported_and_delays_other_requests_but_not_test_control()
    {
        Assert.That((await Send(HttpMethod.Put, "/latency", """{"fixedMs":300}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That((await State())["latency"]!["fixedMs"]!.GetValue<int>(), Is.EqualTo(300));

        var watch = Stopwatch.StartNew();
        await _client.GetAsync("/api/v1/debt/overview");
        Assert.That(watch.ElapsedMilliseconds, Is.GreaterThanOrEqualTo(250), "a normal request is delayed");

        watch.Restart();
        await Send(HttpMethod.Get, "/state");
        Assert.That(watch.ElapsedMilliseconds, Is.LessThan(250), "test control is not delayed");
    }

    [Test]
    public async Task A_latency_range_is_stored()
    {
        await Send(HttpMethod.Put, "/latency", """{"minMs":0,"maxMs":50}""");
        var latency = (await State())["latency"]!;
        Assert.That((latency["minMs"]!.GetValue<int>(), latency["maxMs"]!.GetValue<int>()), Is.EqualTo((0, 50)));
    }

    [TestCase("""{"fixedMs":10,"minMs":0,"maxMs":50}""", TestName = "A fixed latency with a range is a 400")]
    [TestCase("""{"minMs":0}""", TestName = "A minimum without a maximum is a 400")]
    [TestCase("""{"maxMs":50}""", TestName = "A maximum without a minimum is a 400")]
    [TestCase("""{"minMs":60,"maxMs":50}""", TestName = "A minimum above the maximum is a 400")]
    [TestCase("""{"fixedMs":10001}""", TestName = "A latency over ten seconds is a 400")]
    public async Task An_unusable_latency_is_a_400(string body) =>
        await Problem(await Send(HttpMethod.Put, "/latency", body), HttpStatusCode.BadRequest, "/problems/validation");

    [Test]
    public async Task An_empty_latency_clears_it()
    {
        await Send(HttpMethod.Put, "/latency", """{"fixedMs":10}""");
        await Send(HttpMethod.Put, "/latency", "{}");
        Assert.That((await State())["latency"]!.AsObject(), Is.Empty);
    }

    // Verify email

    [Test]
    public async Task Marking_an_email_verified_is_remembered()
    {
        Assert.That((await Send(HttpMethod.Post, "/verify-email", """{"username":"sam"}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That(_factory.Services.GetRequiredService<PersonaStore>().IsEmailMarkedVerified("sam"), Is.True);
    }

    [Test]
    public async Task Marking_an_unknown_user_verified_is_a_404() =>
        await Problem(await Send(HttpMethod.Post, "/verify-email", """{"username":"nobody"}"""), HttpStatusCode.NotFound, "/problems/not-found");
}
