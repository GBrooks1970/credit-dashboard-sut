using System.Net;
using System.Text.Json.Nodes;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// Slice S2 of CDS-25: the nine report operations. Cases: DOCS/.design/operations-cases.md section 3. The clock is frozen at the
/// personas' reference time, 2026-10-03T09:00:00Z, so derived values are stable; every response is checked against the contract.
/// </summary>
public class ReportTests
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

    /// <summary>Signs in (after any clock move), sends the request and checks the response against the contract.</summary>
    private async Task<(HttpStatusCode Status, JsonNode? Body)> Get(string operationId, string path, string user = "alex", HttpMethod? method = null, string? json = null)
    {
        var response = await _service.Send(method ?? HttpMethod.Get, path, json, await _service.Token(user));
        var body = await _service.Checked(operationId, response);
        return (response.StatusCode, body);
    }

    private const string A = "/reports/bureau-a";

    // getScore, getImpact, getPersonalDetails

    [Test]
    public async Task The_score_is_the_stored_score()
    {
        var (status, body) = await Get("getScore", A + "/score");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((body!["current"]!.GetValue<int>(), body["max"]!.GetValue<int>(), body["nationalAverage"]!.GetValue<int>(), body["localAverage"]!.GetValue<int>()), Is.EqualTo((720, 1000, 600, 615)));
    }

    [Test]
    public async Task The_impact_is_the_stored_impact()
    {
        await _service.Bind("alex", "drilldown");
        var (_, body) = await Get("getImpact", A + "/impact");
        Assert.That((body!["actionNeeded"]!.GetValue<int>(), body["monitor"]!.GetValue<int>(), body["doingWell"]!.GetValue<int>()), Is.EqualTo((1, 3, 7)));
    }

    [Test]
    public async Task Personal_details_carry_the_users_legal_name()
    {
        var (_, alex) = await Get("getPersonalDetails", A + "/personal-details", "alex");
        var (_, sam) = await Get("getPersonalDetails", A + "/personal-details", "sam");
        Assert.That((alex!["name"]!.GetValue<string>(), sam!["name"]!.GetValue<string>()), Is.EqualTo(("Alex Example", "Sam Sample")));
    }

    [TestCase("/score", "getScore")]
    [TestCase("/impact", "getImpact")]
    [TestCase("/personal-details", "getPersonalDetails")]
    [TestCase("/overview", "getReportOverview")]
    [TestCase("/changes", "listChanges")]
    [TestCase("/payment-history", "getReportPaymentHistory")]
    public async Task An_unknown_bureau_is_a_404(string suffix, string operationId)
    {
        var (status, body) = await Get(operationId, "/reports/bureau-zzz" + suffix);
        Assert.That(status, Is.EqualTo(HttpStatusCode.NotFound));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/not-found"));
    }

    // getScoreHistory

    [TestCase("3m", 3)]
    [TestCase("6m", 6)]
    [TestCase("1y", 12)]
    public async Task The_history_has_the_months_of_its_range_oldest_first_ending_at_the_current_month(string range, int count)
    {
        var (_, body) = await Get("getScoreHistory", A + "/score/history?range=" + range);
        var months = body!.AsArray().Select(p => p!["month"]!.GetValue<string>()).ToList();
        Assert.That(months, Has.Count.EqualTo(count));
        Assert.That(months[^1], Is.EqualTo("2026-10"));
        Assert.That(months, Is.Ordered);
        Assert.That(body.AsArray().All(p => p!["score"] is not null), Is.True, "every month of the persona history has a score");
    }

    [Test]
    public async Task A_month_with_no_stored_score_is_null_and_nothing_is_carried_forward()
    {
        await _service.Freeze("2026-12-15T09:00:00Z");
        var (_, body) = await Get("getScoreHistory", A + "/score/history?range=3m");
        var points = body!.AsArray().Select(p => (p!["month"]!.GetValue<string>(), p["score"]?.GetValue<int>())).ToList();
        Assert.That(points.Select(p => p.Item1), Is.EqualTo(new[] { "2026-10", "2026-11", "2026-12" }));
        Assert.That(points[0].Item2, Is.Not.Null);
        Assert.That((points[1].Item2, points[2].Item2), Is.EqualTo(((int?)null, (int?)null)));
    }

    [TestCase("2m")]
    [TestCase("")]
    public async Task A_history_range_that_is_missing_or_not_allowed_is_a_400(string range)
    {
        var path = A + "/score/history" + (range.Length == 0 ? "" : "?range=" + range);
        var response = await _service.Send(HttpMethod.Get, path, token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // listChanges

    [Test]
    public async Task Changes_are_newest_first_with_the_true_total()
    {
        await _service.Bind("alex", "drilldown");
        var (_, body) = await Get("listChanges", A + "/changes");
        Assert.That(body!["total"]!.GetValue<int>(), Is.EqualTo(5));
        Assert.That(body["items"]!.AsArray().Select(c => c!["date"]!.GetValue<string>()),
            Is.EqualTo(new[] { "2026-09-29", "2026-09-20", "2026-08-11", "2026-07-30", "2026-06-15" }));
    }

    [Test]
    public async Task The_sentiment_filter_narrows_the_list_and_the_total()
    {
        await _service.Bind("alex", "drilldown");
        var (_, body) = await Get("listChanges", A + "/changes?sentiment=positive");
        Assert.That(body!["total"]!.GetValue<int>(), Is.EqualTo(2));
        Assert.That(body["items"]!.AsArray().All(c => c!["sentiment"]!.GetValue<string>() == "positive"), Is.True);
    }

    [Test]
    public async Task Paging_slices_the_list_and_a_page_beyond_the_end_is_empty()
    {
        await _service.Bind("alex", "drilldown");
        var (_, second) = await Get("listChanges", A + "/changes?pageSize=2&page=2");
        Assert.That(second!["items"]!.AsArray().Select(c => c!["date"]!.GetValue<string>()), Is.EqualTo(new[] { "2026-08-11", "2026-07-30" }));
        var (_, beyond) = await Get("listChanges", A + "/changes?page=99");
        Assert.That((beyond!["items"]!.AsArray().Count, beyond["total"]!.GetValue<int>()), Is.EqualTo((0, 5)));
    }

    [Test]
    public async Task Twenty_five_changes_are_twenty_on_the_first_page_and_five_on_the_second()
    {
        await _service.BindSample("alex", "changes-twenty-five");
        var (_, first) = await Get("listChanges", A + "/changes");
        var (_, second) = await Get("listChanges", A + "/changes?page=2");
        Assert.That((first!["items"]!.AsArray().Count, second!["items"]!.AsArray().Count, first["total"]!.GetValue<int>()), Is.EqualTo((20, 5, 25)));
    }

    [Test]
    public async Task Changes_that_arrive_unsorted_are_returned_newest_first()
    {
        await _service.BindSample("alex", "br11-unsorted-changes");
        var (_, body) = await Get("listChanges", A + "/changes");
        Assert.That(body!["items"]!.AsArray().Select(c => c!["date"]!.GetValue<string>()), Is.EqualTo(new[] { "2026-09-28", "2026-08-31", "2026-07-15" }));
    }

    [Test]
    public async Task A_page_number_beyond_any_integer_type_is_valid_and_empty_for_changes_and_searches()
    {
        var (status, changes) = await Get("listChanges", A + "/changes?page=976590856586021400090628849664");
        Assert.That((status, changes!["items"]!.AsArray().Count, changes["total"]!.GetValue<int>()), Is.EqualTo((HttpStatusCode.OK, 0, 2)));
        var (_, searches) = await Get("listSearches", A + "/searches?kind=hard&page=2638427293580793399476224&pageSize=100");
        Assert.That((searches!["items"]!.AsArray().Count, searches["total"]!.GetValue<int>()), Is.EqualTo((0, 1)));
    }

    [TestCase("?sentiment=bad")]
    [TestCase("?pageSize=101")]
    [TestCase("?page=0")]
    public async Task A_filter_or_page_that_breaks_the_contract_is_a_400(string query)
    {
        var response = await _service.Send(HttpMethod.Get, A + "/changes" + query, token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // getReportPaymentHistory

    [Test]
    public async Task Payment_history_has_seven_years_and_the_selected_years_missed_months()
    {
        await _service.Bind("alex", "struggling");
        var (_, body) = await Get("getReportPaymentHistory", A + "/payment-history");
        var years = body!["years"]!.AsArray().Select(y => (y!["year"]!.GetValue<int>(), y["status"]!.GetValue<string>())).ToList();
        Assert.That(years, Is.EqualTo(new[]
        {
            (2020, "on-time"), (2021, "missed"), (2022, "on-time"), (2023, "on-time"), (2024, "missed"), (2025, "missed"), (2026, "missed"),
        }));
        Assert.That(body["selectedYear"]!.GetValue<int>(), Is.EqualTo(2026));
        Assert.That(body["missed"]!.AsArray().Select(m => $"{m!["month"]!.GetValue<string>()} {m["accountId"]!.GetValue<string>()}"),
            Is.EqualTo(new[] { "2026-06 acc_stcc01", "2026-08 acc_stcc01", "2026-09 acc_sttu01" }));
    }

    [Test]
    public async Task A_chosen_year_lists_that_years_missed_months()
    {
        await _service.Bind("alex", "struggling");
        var (_, body) = await Get("getReportPaymentHistory", A + "/payment-history?year=2025");
        Assert.That(body!["selectedYear"]!.GetValue<int>(), Is.EqualTo(2025));
        Assert.That(body["missed"]!.AsArray().Select(m => m!["accountId"]!.GetValue<string>()), Is.EqualTo(new[] { "acc_stcc02" }));
    }

    [Test]
    public async Task A_year_with_no_missed_month_has_an_empty_list()
    {
        await _service.Bind("alex", "struggling");
        var (_, body) = await Get("getReportPaymentHistory", A + "/payment-history?year=2023");
        Assert.That(body!["missed"]!.AsArray(), Is.Empty);
    }

    [TestCase(2018)]
    [TestCase(2027)]
    public async Task A_year_outside_the_window_is_a_400(int year)
    {
        var (status, body) = await Get("getReportPaymentHistory", A + $"/payment-history?year={year}");
        Assert.That(status, Is.EqualTo(HttpStatusCode.BadRequest));
        Assert.That(body!["errors"]![0]!["field"]!.GetValue<string>(), Is.EqualTo("year"));
    }

    [TestCase("br12-all-on-time-2025", "on-time")]
    [TestCase("br12-no-data-2025", "no-data")]
    [TestCase("br12-part-year-2025", "on-time")]
    [TestCase("br12-payments-2025", "missed")]
    public async Task The_payment_samples_give_the_statuses_their_scenarios_assert(string sample, string status2025)
    {
        await _service.BindSample("alex", sample);
        var (_, body) = await Get("getReportPaymentHistory", A + "/payment-history?year=2025");
        Assert.That(body!["years"]!.AsArray().Single(y => y!["year"]!.GetValue<int>() == 2025)!["status"]!.GetValue<string>(), Is.EqualTo(status2025));
    }

    // listSearches

    [TestCase("hard", 1)]
    [TestCase("soft", 1)]
    public async Task Searches_are_filtered_by_kind(string kind, int expected)
    {
        var (_, body) = await Get("listSearches", A + "/searches?kind=" + kind);
        Assert.That(body!["total"]!.GetValue<int>(), Is.EqualTo(expected));
        Assert.That(body["items"]!.AsArray().All(s => s!["kind"]!.GetValue<string>() == kind), Is.True);
    }

    [Test]
    public async Task Searches_are_newest_first()
    {
        await _service.Bind("alex", "struggling");
        var (_, body) = await Get("listSearches", A + "/searches?kind=hard");
        Assert.That(body!["items"]!.AsArray().Select(s => s!["date"]!.GetValue<string>()), Is.EqualTo(new[] { "2026-09-02", "2026-07-19", "2026-05-06" }));
    }

    [Test]
    public async Task The_thin_file_persona_has_no_searches()
    {
        await _service.Bind("alex", "thin-file");
        var (_, body) = await Get("listSearches", A + "/searches?kind=soft");
        Assert.That((body!["items"]!.AsArray().Count, body["total"]!.GetValue<int>()), Is.EqualTo((0, 0)));
    }

    [Test]
    public async Task A_search_kind_that_is_missing_is_a_400()
    {
        var response = await _service.Send(HttpMethod.Get, A + "/searches", token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Searches_for_an_unknown_bureau_are_a_404()
    {
        var (status, _) = await Get("listSearches", "/reports/bureau-zzz/searches?kind=hard");
        Assert.That(status, Is.EqualTo(HttpStatusCode.NotFound));
    }

    // setSummaryFeedback

    private Task<(HttpStatusCode Status, JsonNode? Body)> Feedback(string value) =>
        Get("setSummaryFeedback", A + "/summary/feedback", method: HttpMethod.Put, json: $$"""{"value":"{{value}}"}""");

    private async Task<string> OverviewFeedback() =>
        (await Get("getReportOverview", A + "/overview")).Body!["summary"]!["feedback"]!.GetValue<string>();

    [Test]
    public async Task Feedback_is_set_replaced_and_cleared_and_the_overview_reflects_it()
    {
        Assert.That(await OverviewFeedback(), Is.EqualTo("none"));
        Assert.That((await Feedback("like")).Body!["value"]!.GetValue<string>(), Is.EqualTo("like"));
        Assert.That(await OverviewFeedback(), Is.EqualTo("like"));
        await Feedback("dislike");
        Assert.That(await OverviewFeedback(), Is.EqualTo("dislike"), "BR-10: the new value replaces the old");
        await Feedback("none");
        Assert.That(await OverviewFeedback(), Is.EqualTo("none"));
    }

    [Test]
    public async Task A_rebind_clears_the_feedback()
    {
        await Feedback("like");
        await _service.Bind("alex", "excellent");
        Assert.That(await OverviewFeedback(), Is.EqualTo("none"));
    }

    [Test]
    public async Task A_feedback_value_outside_the_contract_is_a_400()
    {
        var response = await _service.Send(HttpMethod.Put, A + "/summary/feedback", """{"value":"love"}""", await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // getReportOverview

    [Test]
    public async Task The_overview_composes_every_block()
    {
        await _service.Bind("alex", "drilldown");
        var (status, body) = await Get("getReportOverview", A + "/overview");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["bureau"]!["id"]!.GetValue<string>(), Is.EqualTo("bureau-a"));
        Assert.That(body["score"]!["current"]!.GetValue<int>(), Is.EqualTo(655));
        Assert.That(body["recentChanges"]!.AsArray().Select(c => c!["date"]!.GetValue<string>()), Is.EqualTo(new[] { "2026-09-29", "2026-09-20", "2026-08-11" }));
        Assert.That(body["changesTotal"]!.GetValue<int>(), Is.EqualTo(5));
        Assert.That(body["impact"]!["monitor"]!.GetValue<int>(), Is.EqualTo(3));
        Assert.That(body["debt"]!["total"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(19827960), "198,279.60 (BR-07)");
        Assert.That(body["accountTypes"]!.AsArray().Select(t => t!["type"]!.GetValue<string>()),
            Is.EqualTo(new[] { "creditcard", "loan", "mortgage", "currentaccount", "telecomsandutilities", "lineofcredit" }));
    }

    [Test]
    public async Task The_overview_lists_only_types_that_have_an_open_account()
    {
        await _service.Bind("alex", "struggling");
        var (_, body) = await Get("getReportOverview", A + "/overview");
        Assert.That(body!["accountTypes"]!.AsArray().Select(t => t!["type"]!.GetValue<string>()), Is.EqualTo(new[] { "creditcard", "loan", "telecomsandutilities" }));
    }

    [TestCase("excellent", 0, 0)]
    [TestCase("drilldown", 0, 1)]
    [TestCase("struggling", 2, 8)]
    public async Task The_payments_block_counts_missed_account_months(string persona, int newMissed, int onReport)
    {
        await _service.Bind("alex", persona);
        var (_, body) = await Get("getReportOverview", A + "/overview");
        Assert.That((body!["payments"]!["newMissed"]!.GetValue<int>(), body["payments"]!["onReport"]!.GetValue<int>()), Is.EqualTo((newMissed, onReport)));
    }

    [Test]
    public async Task A_missed_month_four_months_back_is_on_the_report_but_not_new()
    {
        await _service.Bind("alex", "struggling");
        await _service.Freeze("2026-10-03T09:00:00Z"); // new missed months: 2026-08 and 2026-09
        await _service.Freeze("2026-12-03T09:00:00Z"); // the last three months are now 2026-10 to 2026-12
        var (_, body) = await Get("getReportOverview", A + "/overview");
        Assert.That((body!["payments"]!["newMissed"]!.GetValue<int>(), body["payments"]!["onReport"]!.GetValue<int>()), Is.EqualTo((0, 8)));
    }

    [Test]
    public async Task The_thin_file_overview_has_empty_blocks()
    {
        await _service.Bind("alex", "thin-file");
        var (_, body) = await Get("getReportOverview", A + "/overview");
        Assert.That(body!["accountTypes"]!.AsArray(), Is.Empty);
        Assert.That(body["recentChanges"]!.AsArray(), Is.Empty);
        Assert.That(body["debt"]!["total"]!["amountMinor"]!.GetValue<long>(), Is.Zero);
    }

    // The error persona

    [TestCase("/overview", "getReportOverview", "GET")]
    [TestCase("/score", "getScore", "GET")]
    [TestCase("/score/history?range=3m", "getScoreHistory", "GET")]
    [TestCase("/changes", "listChanges", "GET")]
    [TestCase("/impact", "getImpact", "GET")]
    [TestCase("/payment-history", "getReportPaymentHistory", "GET")]
    [TestCase("/searches?kind=hard", "listSearches", "GET")]
    [TestCase("/personal-details", "getPersonalDetails", "GET")]
    [TestCase("/summary/feedback", "setSummaryFeedback", "PUT")]
    public async Task The_error_persona_fails_every_report_operation_with_a_500(string suffix, string operationId, string method)
    {
        await _service.Bind("alex", "error");
        var (status, body) = await Get(operationId, A + suffix, method: new HttpMethod(method), json: method == "PUT" ? """{"value":"like"}""" : null);
        Assert.That(status, Is.EqualTo(HttpStatusCode.InternalServerError));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/internal"));
        Assert.That(body.ToJsonString(), Does.Not.Contain("   at "), "no stack trace in the body");
    }

    [Test]
    public async Task The_error_persona_still_gets_a_404_for_an_unknown_bureau_first()
    {
        await _service.Bind("alex", "error");
        var (status, _) = await Get("getScore", "/reports/bureau-zzz/score");
        Assert.That(status, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
