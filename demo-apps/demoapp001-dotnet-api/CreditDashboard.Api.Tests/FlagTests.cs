using System.Net;
using System.Runtime.Serialization;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Contract;
using CreditDashboard.Api.Control;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// Bug flags in the service (CDS-39, decision brief 13, DR-064): the registry in fixtures/bug-flags.json and the contract agree,
/// the service implements exactly the flags the registry says it does, a flag changes a response only while it is on, and a
/// reset switches it off. The BusinessRules library is untouched by any flag.
/// </summary>
public class FlagTests
{
    private ServiceHost _service = null!;

    [SetUp]
    public async Task Start()
    {
        _service = new ServiceHost();
        await _service.Freeze("2026-10-03T09:00:00Z");
    }

    [TearDown]
    public void Stop() => _service.Dispose();

    private static JsonArray Registry() =>
        JsonNode.Parse(File.ReadAllText(ServiceHost.RepoFile("fixtures", "bug-flags.json")))!["flags"]!.AsArray();

    private static string[] ContractFlags() =>
        Enum.GetValues<BugFlag>().Select(f => typeof(BugFlag).GetField(f.ToString())!.GetCustomAttributes(typeof(EnumMemberAttribute), false).Cast<EnumMemberAttribute>().Single().Value!).ToArray();

    [Test]
    public void Every_flag_in_the_contract_is_in_the_registry_once_and_nothing_else_is()
    {
        var listed = Registry().Select(f => f!["flag"]!.GetValue<string>()).ToArray();
        Assert.That(listed, Is.Unique);
        Assert.That(listed, Is.EquivalentTo(ContractFlags()));
        Assert.That(listed, Has.Length.EqualTo(30));
    }

    [Test]
    public void The_service_implements_exactly_the_service_flags_the_registry_marks_implemented()
    {
        var implemented = Registry()
            .Where(f => f!["layer"]!.GetValue<string>() == "service" && f["status"]!.GetValue<string>() == "implemented")
            .Select(f => f!["flag"]!.GetValue<string>());
        Assert.That(Flags.Implemented, Is.EquivalentTo(implemented));
    }

    [Test]
    public void A_flag_the_service_does_not_implement_is_not_claimed_as_implemented_in_the_service()
    {
        var uiOnly = Registry().Where(f => f!["layer"]!.GetValue<string>() == "ui").Select(f => f!["flag"]!.GetValue<string>());
        Assert.That(Flags.Implemented, Has.None.AnyOf(uiOnly));
    }

    [Test]
    public void Flags_are_off_outside_a_request_and_for_a_request_that_began_without_them()
    {
        Flags.Begin(new HashSet<string>());
        Assert.That(Flags.Has("rounding-down"), Is.False);
        Flags.Begin(new HashSet<string> { "rounding-down" });
        Assert.That(Flags.Has("rounding-down"), Is.True);
        Flags.Begin(new HashSet<string>());
    }

    [TestCase(4950, 10000, 50, 49)]   // 49.5% rounds half up to 50 (BR-03); cut off it is 49
    [TestCase(4949, 10000, 49, 49)]
    [TestCase(1250, 10000, 13, 12)]
    [TestCase(10000, 10000, 100, 100)]
    [TestCase(115000, 100000, 115, 115)]
    [TestCase(0, 50000, 0, 0)]
    public void Rounding_down_cuts_the_utilisation_off_instead_of_rounding_half_up(long balance, long limit, int rounded, int cut)
    {
        Flags.Begin(new HashSet<string>());
        Assert.That(Defects.Utilisation(balance, limit).Display, Is.EqualTo(rounded));
        Flags.Begin(new HashSet<string> { "rounding-down" });
        try
        {
            Assert.That(Defects.Utilisation(balance, limit).Display, Is.EqualTo(cut));
            Assert.That(Defects.Utilisation(balance, limit).Raw, Is.EqualTo(cut));
        }
        finally
        {
            Flags.Begin(new HashSet<string>());
        }
    }

    [Test]
    public void Rounding_down_leaves_a_missing_limit_and_a_credit_balance_as_the_rules_have_them()
    {
        Flags.Begin(new HashSet<string> { "rounding-down" });
        try
        {
            Assert.That(Defects.Utilisation(5000, null).Display, Is.Null);
            Assert.That(Defects.Utilisation(5000, 0).Display, Is.Null);
            Assert.That(Defects.Utilisation(-4400, 100000).Display, Is.EqualTo(0));
            Assert.That(Defects.Utilisation(-4400, 100000).Raw, Is.EqualTo(-4));
        }
        finally
        {
            Flags.Begin(new HashSet<string>());
        }
    }

    private async Task<int?> TotalsUtilisation()
    {
        await _service.BindSample("alex", "br03-one-credit-card");
        var response = await _service.Send(HttpMethod.Get, "/reports/bureau-a/accounts/totals?type=creditcard", token: await _service.Token("alex"));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await _service.Checked("getAccountTotals", response);
        return body!["utilisation"]?.GetValue<int>();
    }

    [Test]
    public async Task The_totals_round_half_up_until_the_flag_is_switched_on_and_again_after_it_is_switched_off()
    {
        // The sample is one card with 49.50 against a limit of 100.00 (the scenario's first row).
        Assert.That(await TotalsUtilisation(), Is.EqualTo(50));
        Assert.That((await _service.Control(HttpMethod.Put, "/bugs", """{"flags":["rounding-down"]}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That(await TotalsUtilisation(), Is.EqualTo(49));
        Assert.That((await _service.Control(HttpMethod.Put, "/bugs", """{"flags":[]}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That(await TotalsUtilisation(), Is.EqualTo(50));
    }

    [Test]
    public async Task A_reset_switches_every_flag_off()
    {
        await _service.Control(HttpMethod.Put, "/bugs", """{"flags":["rounding-down"]}""");
        Assert.That(await TotalsUtilisation(), Is.EqualTo(49));
        Assert.That((await _service.Control(HttpMethod.Post, "/reset")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That(await TotalsUtilisation(), Is.EqualTo(50));
    }

    [Test]
    public async Task The_flag_applies_to_the_account_summary_and_the_raw_value_too()
    {
        await _service.BindSample("alex", "br03-one-credit-card");
        await _service.Control(HttpMethod.Put, "/bugs", """{"flags":["rounding-down"]}""");
        var token = await _service.Token("alex");
        var list = await _service.Checked("listAccounts", await _service.Send(HttpMethod.Get, "/reports/bureau-a/accounts?type=creditcard", token: token));
        var card = list!.AsArray().Select(a => a!.AsObject()).Single(a => a["id"]!.GetValue<string>() == "acc_ovcc01");
        Assert.That(card["utilisation"]!.GetValue<int>(), Is.EqualTo(49));
        var detail = await _service.Checked("getAccount", await _service.Send(HttpMethod.Get, "/accounts/acc_ovcc01", token: token));
        Assert.That(detail!["utilisation"]!.GetValue<int>(), Is.EqualTo(49));
        Assert.That(detail["utilisationRaw"]!.GetValue<int>(), Is.EqualTo(49));
    }

    // ---- The six flags of P2 (CDS-40): each changes one thing while it is on, and nothing else ----------------------------------

    private async Task Flag(params string[] flags) =>
        Assert.That((await _service.Control(HttpMethod.Put, "/bugs", new JsonObject { ["flags"] = new JsonArray(flags.Select(f => (JsonNode)JsonValue.Create(f)!).ToArray()) }.ToJsonString())).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

    private async Task<JsonNode?> Get(string operationId, string path, string user = "alex", bool check = true)
    {
        var response = await _service.Send(HttpMethod.Get, path, token: await _service.Token(user));
        return check ? await _service.Checked(operationId, response) : JsonNode.Parse(await response.Content.ReadAsStringAsync());
    }

    [Test]
    public async Task Excluded_in_total_counts_a_loan_the_bureau_leaves_out_of_the_totals()
    {
        await _service.Bind("alex", "drilldown");
        var before = await Get("getAccountTotals", "/reports/bureau-a/accounts/totals?type=loan");
        Assert.That(before!["balance"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(1252400)); // BR-05: the 1161.00 loan is left out
        await Flag("excluded-in-total");
        var after = await Get("getAccountTotals", "/reports/bureau-a/accounts/totals?type=loan");
        Assert.That(after!["balance"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(1252400 + 116100));
        await Flag();
        Assert.That((await Get("getAccountTotals", "/reports/bureau-a/accounts/totals?type=loan"))!["balance"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(1252400));
    }

    [Test]
    public async Task History_carry_forward_fills_a_missing_month_with_the_previous_score()
    {
        await _service.Bind("sam", "drilldown"); // drilldown has no score for January 2026
        var gap = (await Get("getScoreHistory", "/reports/bureau-a/score/history?range=1y", "sam"))!.AsArray().Single(p => p!["month"]!.GetValue<string>() == "2026-01");
        Assert.That(gap!["score"], Is.Null); // BR-02
        await Flag("history-carry-forward");
        var filled = (await Get("getScoreHistory", "/reports/bureau-a/score/history?range=1y", "sam"))!.AsArray();
        var previous = filled.Single(p => p!["month"]!.GetValue<string>() == "2025-12")!["score"]!.GetValue<int>();
        Assert.That(filled.Single(p => p!["month"]!.GetValue<string>() == "2026-01")!["score"]!.GetValue<int>(), Is.EqualTo(previous));
    }

    [Test]
    public async Task History_carry_forward_leaves_the_months_before_the_first_score_missing()
    {
        await _service.Bind("alex", "thin-file");
        await Flag("history-carry-forward");
        var points = (await Get("getScoreHistory", "/reports/bureau-a/score/history?range=1y"))!.AsArray();
        Assert.That(points.Where(p => string.CompareOrdinal(p!["month"]!.GetValue<string>(), "2026-08") < 0).Select(p => p!["score"]), Is.All.Null);
        Assert.That(points.Single(p => p!["month"]!.GetValue<string>() == "2026-08")!["score"]!.GetValue<int>(), Is.EqualTo(470));
    }

    [Test]
    public async Task Idor_lets_one_customer_read_another_customers_account()
    {
        await _service.Bind("alex", "drilldown");
        await _service.Bind("sam", "excellent");
        var refused = await _service.Send(HttpMethod.Get, "/accounts/acc_excc01", token: await _service.Token("alex"));
        Assert.That(refused.StatusCode, Is.EqualTo(HttpStatusCode.NotFound)); // BR-15
        await Flag("idor");
        var read = await _service.Send(HttpMethod.Get, "/accounts/acc_excc01", token: await _service.Token("alex"));
        Assert.That(read.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((await Get("getAccount", "/accounts/acc_ddcc01"))!["id"]!.GetValue<string>(), Is.EqualTo("acc_ddcc01"), "their own account is still theirs");
        Assert.That((await _service.Send(HttpMethod.Get, "/accounts/acc_nosuch", token: await _service.Token("alex"))).StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task Problem_json_missing_sends_an_error_as_plain_text()
    {
        var token = await _service.Token("alex");
        var proper = await _service.Send(HttpMethod.Get, "/accounts/acc_nosuch", token: token);
        Assert.That(proper.Content.Headers.ContentType!.MediaType, Is.EqualTo("application/problem+json"));
        await Flag("problem-json-missing");
        var plain = await _service.Send(HttpMethod.Get, "/accounts/acc_nosuch", token: token);
        Assert.That(plain.StatusCode, Is.EqualTo(HttpStatusCode.NotFound), "the status is still right");
        Assert.That(plain.Content.Headers.ContentType!.MediaType, Is.EqualTo("text/plain"));
        Assert.That(await plain.Content.ReadAsStringAsync(), Does.StartWith("Not found"));
    }

    [Test]
    public async Task Mask_format_returns_the_whole_source_number_where_one_is_known()
    {
        await _service.BindSample("alex", "br09-source-mask");
        Assert.That((await Get("getAccount", "/accounts/acc_ovcc03"))!["maskedNumber"]!.GetValue<string>(), Is.EqualTo("*5678")); // BR-09
        await Flag("mask-format");
        Assert.That((await Get("getAccount", "/accounts/acc_ovcc03", check: false))!["maskedNumber"]!.GetValue<string>(), Is.EqualTo("12345678"));
    }

    [Test]
    public async Task Currency_float_sends_money_as_a_float_of_pounds()
    {
        await _service.BindSample("alex", "br03-one-credit-card");
        var proper = await Get("getAccountTotals", "/reports/bureau-a/accounts/totals?type=creditcard");
        Assert.That(proper!["balance"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(4950));
        await Flag("currency-float");
        var floated = await Get("getAccountTotals", "/reports/bureau-a/accounts/totals?type=creditcard", check: false);
        Assert.That(floated!["balance"]!["amountMinor"]!.GetValue<double>(), Is.EqualTo(49.5));
        Assert.That(floated["balance"]!["currency"]!.GetValue<string>(), Is.EqualTo("GBP"));
    }
}
