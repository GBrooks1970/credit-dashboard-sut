using System.Net;
using System.Text.Json.Nodes;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// CDS-38 F11b (the confirmation pass): R2-A-04 (the mobile code attempt limit under parallel requests), R2-A-07 (a future month is
/// never listed as missed), R2-A-08 with R2-B-06 (a closed account's utilisation follows the balance it reports), R2-A-10 (the account
/// half of the year-window test uses an identifier that reaches the handler).
/// </summary>
[TestFixture]
public class RulesAndRacesTests
{
    private ServiceHost _service = null!;

    [SetUp]
    public void SetUp() => _service = new ServiceHost();

    [TearDown]
    public void TearDown() => _service.Dispose();

    private async Task<JsonNode> Get(string path)
    {
        var response = await _service.Send(HttpMethod.Get, path, token: await _service.Token());
        var text = await response.Content.ReadAsStringAsync();
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK), $"{path}: {text}");
        return JsonNode.Parse(text)!;
    }

    // ---- R2-A-04: PR-11 under parallel requests

    [Test]
    public async Task Parallel_wrong_codes_share_the_attempt_limit_of_two_wrong_then_void()
    {
        for (var burst = 0; burst < 10; burst++)
        {
            await _service.Control(HttpMethod.Post, "/reset");
            await _service.Freeze("2026-10-03T09:00:00Z");
            var token = await _service.Token();
            var added = await _service.Send(HttpMethod.Put, "/me/profile/mobile", """{"number":"07700 900456"}""", token);
            Assert.That(added.StatusCode, Is.EqualTo(HttpStatusCode.OK), await added.Content.ReadAsStringAsync());

            var gate = new TaskCompletionSource();
            var calls = Enumerable.Range(0, 40).Select(async _ =>
            {
                await gate.Task;
                var response = await _service.Send(HttpMethod.Post, "/me/profile/mobile/verification", """{"code":"000000"}""", token);
                return JsonNode.Parse(await response.Content.ReadAsStringAsync())!["type"]!.GetValue<string>();
            }).ToArray();
            gate.SetResult();
            var types = await Task.WhenAll(calls);
            Assert.That(types.Count(t => t == "/problems/rule-violation/code-wrong"), Is.EqualTo(2), $"burst {burst}: {string.Join(",", types.Select(t => t[^10..]))}");
            Assert.That(types.Count(t => t == "/problems/rule-violation/code-invalid"), Is.EqualTo(38), $"burst {burst}");
        }
    }

    // ---- R2-A-07: a future month is never missed

    private static string[] Months(JsonNode history) => history["missed"]!.AsArray().Select(m => m!["month"]!.GetValue<string>()).ToArray();

    [Test]
    public async Task A_clock_before_the_missed_months_lists_none_of_them()
    {
        await _service.Freeze("2026-01-15T09:00:00Z");
        await _service.Bind("alex", "struggling");
        Assert.That(Months(await Get("/reports/bureau-a/payment-history?year=2026")).All(m => string.CompareOrdinal(m, "2026-01") <= 0), Is.True);
    }

    [Test]
    public async Task The_current_month_is_listed_and_a_later_one_is_not_on_both_payment_history_operations()
    {
        // Learn the months with a clock late in the year, then move the clock into the middle of them.
        await _service.Freeze("2026-12-15T09:00:00Z");
        await _service.Bind("alex", "struggling");
        var all = await Get("/reports/bureau-a/payment-history?year=2026");
        var months = Months(all).Distinct().OrderBy(m => m, StringComparer.Ordinal).ToArray();
        Assert.That(months.Length, Is.GreaterThanOrEqualTo(2), "the persona must hold at least two missed months in 2026 for this test to mean anything");
        var cut = months[0];
        await _service.Freeze($"{cut}-15T09:00:00Z");

        var report = await Get("/reports/bureau-a/payment-history?year=2026");
        Assert.That(Months(report).Distinct().ToArray(), Is.EqualTo(new[] { cut }), "the current month itself is listed, a later month is not");

        foreach (var accountId in all["missed"]!.AsArray().Select(m => m!["accountId"]!.GetValue<string>()).Distinct())
        {
            var account = await Get($"/accounts/{accountId}/payment-history?year=2026");
            Assert.That(Months(account).All(m => string.CompareOrdinal(m, cut) <= 0), Is.True, $"{accountId}: {string.Join(",", Months(account))}");
        }
    }

    // ---- R2-A-08, R2-B-06: a closed account's utilisation follows the balance it reports

    [Test]
    public async Task A_closed_account_with_a_stored_balance_and_a_limit_reports_balance_zero_and_utilisation_zero()
    {
        await _service.Freeze("2026-10-03T09:00:00Z");
        await _service.Bind("alex", "drilldown");
        var list = await Get("/reports/bureau-a/accounts?status=closed");
        var card = list.AsArray().Single(a => a!["id"]!.GetValue<string>() == "acc_ddcl01")!;
        Assert.That(card["limit"]!["amountMinor"]!.GetValue<long>(), Is.Not.Zero, "the fixture holds a limit, or the test could not tell");
        Assert.That(card["balance"]!["amountMinor"]!.GetValue<long>(), Is.Zero);
        Assert.That(card["utilisation"]!.GetValue<int>(), Is.Zero, "utilisation follows the reported balance");

        var detail = await Get("/accounts/acc_ddcl01");
        Assert.That((detail["utilisation"]!.GetValue<int>(), detail["utilisationRaw"]!.GetValue<int>()), Is.EqualTo((0, 0)));
    }

    // ---- R2-A-10: the account half of the year-window test reaches the handler

    [Test]
    public async Task An_out_of_window_year_is_a_400_before_a_well_formed_unknown_account_is_looked_up()
    {
        await _service.Freeze("2026-10-03T09:00:00Z");
        var response = await _service.Send(HttpMethod.Get, "/accounts/acc_nope00/payment-history?year=2018", token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest), await response.Content.ReadAsStringAsync());
        // The same identifier with a year in the window is the 404 the lookup gives, so the 400 above came from the year check.
        var inWindow = await _service.Send(HttpMethod.Get, "/accounts/acc_nope00/payment-history?year=2025", token: await _service.Token());
        Assert.That(inWindow.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
