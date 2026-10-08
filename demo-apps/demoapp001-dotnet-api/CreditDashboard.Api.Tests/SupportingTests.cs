using System.Net;
using System.Text.Json.Nodes;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// Slice S4 of CDS-25: the debt overview, the two notification operations and the assistant. Cases:
/// DOCS/.design/operations-cases.md section 5. The clock is frozen at the personas' reference time, 2026-10-03T09:00:00Z;
/// every response is checked against the contract.
/// </summary>
public class SupportingTests
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

    private async Task<(HttpStatusCode Status, JsonNode? Body)> Call(string operationId, string path, HttpMethod? method = null, string? json = null, string user = "alex")
    {
        var response = await _service.Send(method ?? HttpMethod.Get, path, json, await _service.Token(user));
        return (response.StatusCode, await _service.Checked(operationId, response));
    }

    // getDebtOverview

    [TestCase("drilldown", 19827960L)]
    [TestCase("excellent", 1294760L)]
    [TestCase("thin-file", 0L)]
    public async Task The_total_debt_follows_BR_07_for_each_persona(string persona, long total)
    {
        await _service.Bind("alex", persona);
        var (status, body) = await Call("getDebtOverview", "/debt/overview");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["total"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(total));
    }

    [Test]
    public async Task The_breakdown_is_in_enum_order_omits_zero_types_and_adds_up_to_the_total()
    {
        await _service.Bind("alex", "drilldown");
        var (_, body) = await Call("getDebtOverview", "/debt/overview");
        var types = body!["byType"]!.AsArray().Select(t => t!["type"]!.GetValue<string>()).ToList();
        Assert.That(types, Is.EqualTo(new[] { "creditcard", "loan", "mortgage", "telecomsandutilities", "lineofcredit" }), "no current account, no type at zero");
        Assert.That(body["byType"]!.AsArray().Sum(t => t!["amount"]!["amountMinor"]!.GetValue<long>()), Is.EqualTo(body["total"]!["amountMinor"]!.GetValue<long>()));
    }

    [Test]
    public async Task Debt_that_fell_more_than_one_percent_is_down()
    {
        await _service.Bind("alex", "excellent");
        Assert.That((await Call("getDebtOverview", "/debt/overview")).Body!["trend"]!.GetValue<string>(), Is.EqualTo("down"), "1,294,760 against 1,315,160 three months earlier");
    }

    [Test]
    public async Task A_rise_of_exactly_one_percent_is_steady()
    {
        await _service.BindSample("alex", "br07-debt-trend");
        var (_, body) = await Call("getDebtOverview", "/debt/overview");
        Assert.That((body!["total"]!["amountMinor"]!.GetValue<long>(), body["trend"]!.GetValue<string>()), Is.EqualTo((101000L, "steady")), "1000.00 to 1010.00");
    }

    [Test]
    public async Task A_current_account_is_not_in_the_debt()
    {
        await _service.BindSample("alex", "br07-current-account");
        var (_, body) = await Call("getDebtOverview", "/debt/overview");
        Assert.That(body!["total"]!["amountMinor"]!.GetValue<long>(), Is.EqualTo(42360));
        Assert.That(body["byType"]!.AsArray().Select(t => t!["type"]!.GetValue<string>()), Is.EqualTo(new[] { "creditcard" }));
    }

    [Test]
    public async Task The_debt_overview_is_not_a_report_operation_so_the_error_persona_still_gets_it()
    {
        await _service.Bind("alex", "error");
        Assert.That((await Call("getDebtOverview", "/debt/overview")).Status, Is.EqualTo(HttpStatusCode.OK));
    }

    // listNotifications

    [Test]
    public async Task Notifications_are_unread_first_then_newest_first_with_the_unread_count()
    {
        await _service.Bind("alex", "struggling");
        var (status, body) = await Call("listNotifications", "/notifications");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["items"]!.AsArray().Select(n => n!["id"]!.GetValue<string>()), Is.EqualTo(new[] { "ntf_st02", "ntf_st01" }));
        Assert.That((body["unread"]!.GetValue<int>(), body["total"]!.GetValue<int>()), Is.EqualTo((2, 2)));
    }

    [Test]
    public async Task A_read_notification_sorts_after_the_unread_ones()
    {
        var (_, body) = await Call("listNotifications", "/notifications"); // excellent: ntf_ex01 unread, ntf_ex02 read
        Assert.That(body!["items"]!.AsArray().Select(n => n!["id"]!.GetValue<string>()), Is.EqualTo(new[] { "ntf_ex01", "ntf_ex02" }));
        Assert.That(body["unread"]!.GetValue<int>(), Is.EqualTo(1));
    }

    [Test]
    public async Task An_older_unread_notification_sorts_before_a_newer_read_one()
    {
        // ntf_ex01 is the newer (3 October) and ntf_ex02 the older (3 September): read the first, unread the second.
        await Mark("ntf_ex01", true);
        await Mark("ntf_ex02", false);
        var (_, body) = await Call("listNotifications", "/notifications");
        Assert.That(body!["items"]!.AsArray().Select(n => n!["id"]!.GetValue<string>()), Is.EqualTo(new[] { "ntf_ex02", "ntf_ex01" }), "unread first, whatever the date");
    }

    [Test]
    public async Task Paging_slices_the_list_but_the_unread_count_covers_every_page()
    {
        await _service.Bind("alex", "struggling");
        var (_, body) = await Call("listNotifications", "/notifications?pageSize=1");
        Assert.That(body!["items"]!.AsArray(), Has.Count.EqualTo(1));
        Assert.That((body["total"]!.GetValue<int>(), body["unread"]!.GetValue<int>()), Is.EqualTo((2, 2)));
    }

    [Test]
    public async Task The_thin_file_persona_has_no_notifications()
    {
        await _service.Bind("alex", "thin-file");
        var (_, body) = await Call("listNotifications", "/notifications");
        Assert.That((body!["items"]!.AsArray().Count, body["total"]!.GetValue<int>(), body["unread"]!.GetValue<int>()), Is.EqualTo((0, 0, 0)));
    }

    [TestCase("?page=59720084612818352996352")]
    public async Task A_page_number_beyond_any_integer_type_is_valid_and_empty(string query)
    {
        var (status, body) = await Call("listNotifications", "/notifications" + query);
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((body!["items"]!.AsArray().Count, body["total"]!.GetValue<int>()), Is.EqualTo((0, 2)), "the excellent persona holds two notifications");
    }

    [TestCase("?pageSize=101")]
    [TestCase("?page=0")]
    public async Task A_page_that_breaks_the_contract_is_a_400(string query)
    {
        var (status, body) = await Call("listNotifications", "/notifications" + query);
        Assert.That(status, Is.EqualTo(HttpStatusCode.BadRequest));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/validation"));
    }

    // markNotificationRead

    private Task<(HttpStatusCode Status, JsonNode? Body)> Mark(string id, bool read, string user = "alex") =>
        Call("markNotificationRead", "/notifications/" + id, new HttpMethod("PATCH"), $$"""{"read":{{(read ? "true" : "false")}}}""", user);

    [Test]
    public async Task Marking_a_notification_read_returns_it_and_lowers_the_unread_count()
    {
        var (status, body) = await Mark("ntf_ex01", true);
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((body!["id"]!.GetValue<string>(), body["read"]!.GetValue<bool>()), Is.EqualTo(("ntf_ex01", true)));
        Assert.That((await Call("listNotifications", "/notifications")).Body!["unread"]!.GetValue<int>(), Is.Zero);
    }

    [Test]
    public async Task A_notification_can_be_marked_unread_again()
    {
        await Mark("ntf_ex02", false);
        var (_, body) = await Call("listNotifications", "/notifications");
        Assert.That(body!["unread"]!.GetValue<int>(), Is.EqualTo(2));
        Assert.That(body["items"]!.AsArray().Select(n => n!["id"]!.GetValue<string>()), Is.EqualTo(new[] { "ntf_ex01", "ntf_ex02" }), "both unread, newest first");
    }

    [TestCase("ntf_nope")]
    [TestCase("ntf_st01")]
    public async Task An_unknown_notification_or_another_personas_is_a_404(string id)
    {
        var (status, body) = await Mark(id, true);
        Assert.That(status, Is.EqualTo(HttpStatusCode.NotFound));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/not-found"));
    }

    [TestCase("""{}""")]
    [TestCase("""{"read":"yes"}""")]
    public async Task A_body_that_breaks_the_contract_is_a_400(string json)
    {
        var (status, _) = await Call("markNotificationRead", "/notifications/ntf_ex01", new HttpMethod("PATCH"), json);
        Assert.That(status, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task A_rebind_returns_the_notifications_to_their_stored_flags()
    {
        await Mark("ntf_ex01", true);
        await _service.Bind("alex", "excellent");
        Assert.That((await Call("listNotifications", "/notifications")).Body!["unread"]!.GetValue<int>(), Is.EqualTo(1));
    }

    [Test]
    public async Task One_users_read_flags_are_not_anothers()
    {
        await _service.Bind("sam", "excellent");
        await Mark("ntf_ex01", true, "alex");
        Assert.That((await Call("listNotifications", "/notifications", user: "sam")).Body!["unread"]!.GetValue<int>(), Is.EqualTo(1));
    }

    // sendAssistantMessage

    private Task<(HttpStatusCode Status, JsonNode? Body)> Ask(string message) =>
        Call("sendAssistantMessage", "/assistant/messages", HttpMethod.Post, new JsonObject { ["message"] = message }.ToJsonString());

    [TestCase("What is my SCORE?", "Your credit score is on the overview page, shown against the national and local averages.")]
    [TestCase("how much debt do I have", "Your total debt, and how it is split by account type, is on the debt page.")]
    [TestCase("late payments", "Your payment history shows each year as on time, missed or no data.")]
    [TestCase("my score and my debt", "Your credit score is on the overview page, shown against the national and local averages.")]
    [TestCase("hello", "I can help with your score, your debt and your payments.")]
    public async Task The_reply_follows_the_first_intent_in_the_table(string message, string reply)
    {
        var (status, body) = await Ask(message);
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["reply"]!.GetValue<string>(), Is.EqualTo(reply));
        Assert.That(body["disclaimer"]!.GetValue<string>(), Is.EqualTo("This is a demonstration assistant. It does not give financial advice."));
    }

    [Test]
    public async Task A_message_of_five_hundred_characters_is_accepted_and_one_more_is_a_400()
    {
        Assert.That((await Ask(new string('a', 500))).Status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((await Ask(new string('a', 501))).Status, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task An_empty_message_is_a_400() => Assert.That((await Ask("")).Status, Is.EqualTo(HttpStatusCode.BadRequest));
}
