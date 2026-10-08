using System.Net;
using System.Text.Json.Nodes;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// Slice S3 of CDS-25: the six account operations. Cases: DOCS/.design/operations-cases.md section 4. The clock is frozen at the
/// personas' reference time, 2026-10-03T09:00:00Z; the user holds the drilldown persona (ten accounts, every type) unless stated.
/// Every response is checked against the contract.
/// </summary>
public class AccountTests
{
    private ServiceHost _service = null!;
    private const string A = "/reports/bureau-a";

    [SetUp]
    public async Task Start()
    {
        _service = new ServiceHost();
        await _service.Freeze("2026-10-03T09:00:00Z");
        await _service.Bind("alex", "drilldown");
    }

    [TearDown]
    public void Stop() => _service.Dispose();

    private async Task<(HttpStatusCode Status, JsonNode? Body)> Call(string operationId, string path, HttpMethod? method = null, string? json = null)
    {
        var response = await _service.Send(method ?? HttpMethod.Get, path, json, await _service.Token());
        return (response.StatusCode, await _service.Checked(operationId, response));
    }

    private static string[] Ids(JsonNode? list) => list!.AsArray().Select(a => a!["id"]!.GetValue<string>()).ToArray();

    // listAccounts

    [Test]
    public async Task The_open_accounts_are_listed_in_stored_order_by_default()
    {
        var (status, body) = await Call("listAccounts", A + "/accounts");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(Ids(body), Is.EqualTo(new[] { "acc_ddcc01", "acc_ddcc02", "acc_ddln01", "acc_ddln02", "acc_ddmg01", "acc_ddca01", "acc_ddtu01", "acc_ddtu02", "acc_ddlc01" }));
    }

    [Test]
    public async Task The_type_filter_narrows_the_list()
    {
        var (_, body) = await Call("listAccounts", A + "/accounts?type=creditcard");
        Assert.That(Ids(body), Is.EqualTo(new[] { "acc_ddcc01", "acc_ddcc02" }));
    }

    [Test]
    public async Task The_closed_list_has_closed_accounts_with_balance_zero()
    {
        var (_, body) = await Call("listAccounts", A + "/accounts?status=closed");
        Assert.That(Ids(body), Is.EqualTo(new[] { "acc_ddcl01" }));
        Assert.That(body![0]!["balance"]!["amountMinor"]!.GetValue<long>(), Is.Zero);
    }

    [Test]
    public async Task A_closed_account_drops_off_on_its_sixth_anniversary_and_is_then_a_404_to_fetch()
    {
        await _service.BindSample("alex", "br13-closed-anniversary");
        await _service.Freeze("2026-10-02T09:00:00Z");
        Assert.That(Ids((await Call("listAccounts", A + "/accounts?status=closed")).Body), Is.EqualTo(new[] { "acc_ovcl01" }), "the day before");
        Assert.That((await Call("getAccount", "/accounts/acc_ovcl01")).Status, Is.EqualTo(HttpStatusCode.OK));

        await _service.Freeze("2026-10-03T09:00:00Z");
        Assert.That(Ids((await Call("listAccounts", A + "/accounts?status=closed")).Body), Is.Empty, "on the anniversary");
        Assert.That((await Call("getAccount", "/accounts/acc_ovcl01")).Status, Is.EqualTo(HttpStatusCode.NotFound), "Reading: not listed, so not found");
    }

    [TestCase("?type=boat")]
    [TestCase("?status=bogus")]
    public async Task A_type_or_status_outside_the_contract_is_a_400(string query)
    {
        var response = await _service.Send(HttpMethod.Get, A + "/accounts" + query, token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Listing_the_accounts_of_an_unknown_bureau_is_a_404() =>
        Assert.That((await Call("listAccounts", "/reports/bureau-zzz/accounts")).Status, Is.EqualTo(HttpStatusCode.NotFound));

    [Test]
    public async Task The_utilisation_is_computed_from_balance_and_limit()
    {
        var (_, body) = await Call("listAccounts", A + "/accounts");
        var byId = body!.AsArray().ToDictionary(a => a!["id"]!.GetValue<string>(), a => a!["utilisation"]?.GetValue<int>());
        Assert.That((byId["acc_ddcc01"], byId["acc_ddcc02"], byId["acc_ddlc01"], byId["acc_ddln01"]), Is.EqualTo(((int?)8, (int?)0, (int?)25, (int?)83)));
        Assert.That(byId["acc_ddtu01"], Is.Null, "no limit, no utilisation");
    }

    // getAccountTotals

    [Test]
    public async Task Credit_card_totals_sum_the_included_accounts_and_sum_a_credit_balance_as_it_is()
    {
        var (_, body) = await Call("getAccountTotals", A + "/accounts/totals?type=creditcard");
        Assert.That(body!["balance"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(37960), "423.60 and -44.00");
        Assert.That(body["limit"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(610000));
        Assert.That((body["utilisation"]!.GetValue<int>(), body["includedCount"]!.GetValue<int>()), Is.EqualTo((6, 2)));
        Assert.That(body["excluded"]!.AsArray(), Is.Empty);
    }

    [Test]
    public async Task A_loan_without_a_limit_is_listed_as_excluded_and_not_summed()
    {
        var (_, body) = await Call("getAccountTotals", A + "/accounts/totals?type=loan");
        Assert.That(body!["balance"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(1252400));
        Assert.That((body["utilisation"]!.GetValue<int>(), body["includedCount"]!.GetValue<int>()), Is.EqualTo((83, 1)));
        Assert.That(Ids(body["excluded"]), Is.EqualTo(new[] { "acc_ddln02" }));
        Assert.That(body["excluded"]![0]!["balance"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(116100));
    }

    [Test]
    public async Task Totals_for_a_type_with_no_account_are_zero_with_no_limit_or_utilisation()
    {
        await _service.Bind("alex", "thin-file");
        var (_, body) = await Call("getAccountTotals", A + "/accounts/totals?type=creditcard");
        Assert.That(body!["balance"]!["amountMinor"]!.GetValue<long>(), Is.Zero);
        Assert.That((body["limit"], body["utilisation"], body["includedCount"]!.GetValue<int>()), Is.EqualTo(((JsonNode?)null, (JsonNode?)null, 0)));
    }

    [Test]
    public async Task Totals_without_a_type_are_a_400_and_for_an_unknown_bureau_a_404()
    {
        var response = await _service.Send(HttpMethod.Get, A + "/accounts/totals", token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        Assert.That((await Call("getAccountTotals", "/reports/bureau-zzz/accounts/totals?type=loan")).Status, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task The_one_credit_card_sample_gives_the_totals_its_scenario_asserts()
    {
        await _service.BindSample("alex", "br03-one-credit-card");
        var (_, body) = await Call("getAccountTotals", A + "/accounts/totals?type=creditcard");
        Assert.That((body!["balance"]!["amountMinor"]!.GetValue<long>(), body["limit"]!["amountMinor"]!.GetValue<long>(), body["utilisation"]!.GetValue<int>()), Is.EqualTo((4950L, 10000L, 50)));
    }

    // getAccount

    [Test]
    public async Task An_account_is_returned_without_the_fixture_only_fields()
    {
        var (status, body) = await Call("getAccount", "/accounts/acc_ddcc01");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["id"]!.GetValue<string>(), Is.EqualTo("acc_ddcc01"));
        Assert.That(body["details"]!["apr"]!.GetValue<double>(), Is.EqualTo(24.9));
        Assert.That(body.AsObject().ContainsKey("missedMonths") || body.AsObject().ContainsKey("balanceHistory") || body.AsObject().ContainsKey("sourceMask"), Is.False);
        Assert.That((body["closed"]!.GetValue<bool>(), body["utilisationRaw"]!.GetValue<int>()), Is.EqualTo((false, 8)));
    }

    [Test]
    public async Task An_account_in_credit_shows_its_raw_utilisation_below_zero_and_a_displayed_zero()
    {
        var (_, body) = await Call("getAccount", "/accounts/acc_ddcc02");
        Assert.That((body!["balance"]!["amountMinor"]!.GetValue<long>(), body["utilisation"]!.GetValue<int>(), body["utilisationRaw"]!.GetValue<int>()), Is.EqualTo((-4400L, 0, -4)));
    }

    [TestCase("acc_exln02", TestName = "Another personas account is a 404 (BR-15)")]
    [TestCase("acc_nope00", TestName = "An unknown account is a 404")]
    public async Task An_account_that_is_not_the_users_is_a_404(string id)
    {
        var (status, body) = await Call("getAccount", "/accounts/" + id);
        Assert.That(status, Is.EqualTo(HttpStatusCode.NotFound));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/not-found"));
    }

    [Test]
    public async Task An_account_id_breaking_the_pattern_is_a_400()
    {
        var response = await _service.Send(HttpMethod.Get, "/accounts/not-an-id", token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // getBalanceHistory and getAccountPaymentHistory

    [Test]
    public async Task The_balance_history_is_six_months_oldest_first()
    {
        var (_, body) = await Call("getBalanceHistory", "/accounts/acc_ddcc01/balance-history");
        Assert.That(body!.AsArray().Select(p => p!["month"]!.GetValue<string>()), Is.EqualTo(new[] { "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10" }));
    }

    [Test]
    public async Task An_account_payment_history_has_seven_years_and_the_selected_years_missed_months()
    {
        var (_, body) = await Call("getAccountPaymentHistory", "/accounts/acc_ddmg01/payment-history?year=2025");
        Assert.That(body!["years"]!.AsArray(), Has.Count.EqualTo(7));
        Assert.That(body["years"]!.AsArray().Single(y => y!["year"]!.GetValue<int>() == 2025)!["status"]!.GetValue<string>(), Is.EqualTo("missed"));
        Assert.That(body["missed"]!.AsArray().Select(m => $"{m!["accountId"]!.GetValue<string>()} {m["month"]!.GetValue<string>()}"), Is.EqualTo(new[] { "acc_ddmg01 2025-02" }));
    }

    [Test]
    public async Task An_account_opened_mid_history_has_no_data_for_the_years_before_it()
    {
        var (_, body) = await Call("getAccountPaymentHistory", "/accounts/acc_ddcc01/payment-history");
        var statuses = body!["years"]!.AsArray().ToDictionary(y => y!["year"]!.GetValue<int>(), y => y!["status"]!.GetValue<string>());
        Assert.That((statuses[2020], statuses[2026]), Is.EqualTo(("on-time", "on-time")), "opened April 2019, never missed");
        Assert.That(body["selectedYear"]!.GetValue<int>(), Is.EqualTo(2026));
    }

    [Test]
    public async Task A_payment_history_year_outside_the_window_is_a_400()
    {
        var (status, body) = await Call("getAccountPaymentHistory", "/accounts/acc_ddcc01/payment-history?year=2018");
        Assert.That(status, Is.EqualTo(HttpStatusCode.BadRequest));
        Assert.That(body!["errors"]![0]!["field"]!.GetValue<string>(), Is.EqualTo("year"));
    }

    [Test]
    public async Task The_balance_and_payment_history_of_another_personas_account_are_404s()
    {
        Assert.That((await Call("getBalanceHistory", "/accounts/acc_exln02/balance-history")).Status, Is.EqualTo(HttpStatusCode.NotFound));
        Assert.That((await Call("getAccountPaymentHistory", "/accounts/acc_exln02/payment-history")).Status, Is.EqualTo(HttpStatusCode.NotFound));
    }

    // updateAccountDetail

    private Task<(HttpStatusCode Status, JsonNode? Body)> Patch(string json, string id = "acc_ddcc01") =>
        Call("updateAccountDetail", $"/accounts/{id}/details", new HttpMethod("PATCH"), json);

    private async Task<JsonNode?> Details(string id = "acc_ddcc01") => (await Call("getAccount", "/accounts/" + id)).Body!["details"];

    [Test]
    public async Task A_valid_edit_is_returned_and_shown_on_the_account()
    {
        var (status, body) = await Patch("""{"field":"apr","value":29.9}""");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["apr"]!.GetValue<double>(), Is.EqualTo(29.9));
        Assert.That((await Details())!["apr"]!.GetValue<double>(), Is.EqualTo(29.9));
    }

    [TestCase("""{"field":"apr","value":100.01}""")]
    [TestCase("""{"field":"apr","value":-0.01}""")]
    [TestCase("""{"field":"interestRate","value":29.999}""")]
    [TestCase("""{"field":"promoPeriodMonths","value":61}""")]
    [TestCase("""{"field":"promoPeriodMonths","value":1.5}""")]
    [TestCase("""{"field":"minPayment","value":{"percent":100.01}}""")]
    [TestCase("""{"field":"minPayment","value":{"amount":{"amountMinor":-1,"currency":"GBP"}}}""")]
    [TestCase("""{"field":"paymentMethod","value":"cheque"}""")]
    public async Task A_value_out_of_range_is_a_422_and_changes_nothing(string json)
    {
        var (status, body) = await Patch(json);
        Assert.That(status, Is.EqualTo(HttpStatusCode.UnprocessableEntity));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/rule-violation/out-of-range"));
        Assert.That((await Details())!["apr"]!.GetValue<double>(), Is.EqualTo(24.9), "the stored details are unchanged");
    }

    [TestCase("""{"field":"apr","value":0}""")]
    [TestCase("""{"field":"apr","value":100}""")]
    [TestCase("""{"field":"interestRate","value":29.99}""")]
    [TestCase("""{"field":"promoPeriodMonths","value":60}""")]
    [TestCase("""{"field":"minPayment","value":{"percent":5}}""")]
    [TestCase("""{"field":"minPayment","value":{"amount":{"amountMinor":2500,"currency":"GBP"}}}""")]
    [TestCase("""{"field":"paymentMethod","value":"direct-debit"}""")]
    public async Task A_value_in_range_is_accepted(string json) =>
        Assert.That((await Patch(json)).Status, Is.EqualTo(HttpStatusCode.OK));

    [Test]
    public async Task A_null_clears_the_field()
    {
        await Patch("""{"field":"apr","value":29.9}""");
        var (status, body) = await Patch("""{"field":"apr","value":null}""");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["apr"], Is.Null);
    }

    [TestCase("""{"field":"colour","value":1}""", TestName = "An unknown field is a 400")]
    [TestCase("""{"field":"apr","value":"high"}""", TestName = "A string for a number is a 400")]
    [TestCase("""{"field":"minPayment","value":{"percent":5,"amount":{"amountMinor":1,"currency":"GBP"}}}""", TestName = "A minimum payment with both an amount and a percent is a 400")]
    [TestCase("""{"field":"minPayment","value":{}}""", TestName = "A minimum payment with neither is a 400")]
    [TestCase("""{"field":"apr"}""", TestName = "A missing value is a 400")]
    public async Task An_unusable_edit_is_a_400(string json) =>
        Assert.That((await Patch(json)).Status, Is.EqualTo(HttpStatusCode.BadRequest));

    [Test]
    public async Task Editing_another_personas_account_is_a_404() =>
        Assert.That((await Patch("""{"field":"apr","value":10}""", "acc_exln02")).Status, Is.EqualTo(HttpStatusCode.NotFound));

    [Test]
    public async Task A_rebind_or_a_reset_returns_the_details_to_the_stored_ones()
    {
        await Patch("""{"field":"apr","value":29.9}""");
        await _service.Bind("alex", "drilldown");
        Assert.That((await Details())!["apr"]!.GetValue<double>(), Is.EqualTo(24.9), "after a rebind");

        await Patch("""{"field":"apr","value":29.9}""");
        await _service.Control(HttpMethod.Post, "/reset");
        await _service.Bind("alex", "drilldown");
        Assert.That((await Details())!["apr"]!.GetValue<double>(), Is.EqualTo(24.9), "after a reset");
    }

    [Test]
    public async Task One_users_edit_is_not_anothers()
    {
        await Patch("""{"field":"apr","value":29.9}""");
        await _service.Bind("sam", "drilldown");
        var response = await _service.Send(HttpMethod.Get, "/accounts/acc_ddcc01", token: await _service.Token("sam"));
        var body = await _service.Checked("getAccount", response);
        Assert.That(body!["details"]!["apr"]!.GetValue<double>(), Is.EqualTo(24.9));
    }

    // The error persona

    [TestCase("/accounts", "listAccounts")]
    [TestCase("/accounts/totals?type=loan", "getAccountTotals")]
    public async Task The_error_persona_fails_the_report_account_operations_with_a_500(string suffix, string operationId)
    {
        await _service.Bind("alex", "error");
        var (status, body) = await Call(operationId, A + suffix);
        Assert.That(status, Is.EqualTo(HttpStatusCode.InternalServerError));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/internal"));
    }
}
