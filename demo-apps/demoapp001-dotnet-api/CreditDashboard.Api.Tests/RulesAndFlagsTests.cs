using System.Net;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Control;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// CDS-38 F4: A-04 (the resend limit holds when requests arrive together), A-09 (<c>currency-float</c> reaches every money amount),
/// A-10 (<c>mask-format</c> reaches the excluded list), A-11 (what <c>excluded-in-total</c> reaches, pinned), A-21 (one source for the
/// email status). The rule changes (A-16, A-17, A-23) are tested in the BusinessRules tests.
/// </summary>
[TestFixture]
public class RulesAndFlagsTests
{
    private ServiceHost _service = null!;

    [SetUp]
    public void SetUp() => _service = new ServiceHost();

    [TearDown]
    public void TearDown() => _service.Dispose();

    private async Task Flag(params string[] flags) =>
        Assert.That((await _service.Control(HttpMethod.Put, "/bugs", new JsonObject { ["flags"] = new JsonArray(flags.Select(f => (JsonNode)JsonValue.Create(f)!).ToArray()) }.ToJsonString())).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

    private async Task<JsonNode> Get(string path, string? token = null)
    {
        var response = await _service.Send(HttpMethod.Get, path, token: token ?? await _service.Token());
        var text = await response.Content.ReadAsStringAsync();
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK), $"{path}: {text}");
        return JsonNode.Parse(text)!;
    }

    // ---- A-04

    [Test]
    public async Task Requests_that_arrive_together_cannot_all_pass_the_sixty_second_resend_rule()
    {
        await _service.Freeze("2026-10-03T09:00:00Z");
        for (var burst = 0; burst < 10; burst++)
        {
            await _service.Control(HttpMethod.Post, "/reset");
            await _service.Freeze("2026-10-03T09:00:00Z");
            await _service.Bind("alex", "thin-file"); // an unverified email with no link sent yet
            var token = await _service.Token();
            var gate = new TaskCompletionSource();
            var calls = Enumerable.Range(0, 12).Select(async _ =>
            {
                await gate.Task;
                return (await _service.Send(HttpMethod.Post, "/me/profile/email/verification", token: token)).StatusCode;
            }).ToArray();
            gate.SetResult();
            var codes = await Task.WhenAll(calls);
            Assert.That(codes.Count(c => c == HttpStatusCode.Accepted), Is.EqualTo(1), $"burst {burst}: {string.Join(",", codes)}");
            Assert.That(codes.Count(c => c == (HttpStatusCode)429), Is.EqualTo(11), $"burst {burst}: {string.Join(",", codes)}");
        }
    }

    // ---- A-09

    private static IEnumerable<(string Path, JsonNode Node)> MoneyIn(JsonNode? node, string path = "$")
    {
        switch (node)
        {
            case JsonObject obj:
                if (obj["amountMinor"] is JsonValue && obj.ContainsKey("currency")) yield return (path, obj);
                foreach (var (name, child) in obj)
                    foreach (var found in MoneyIn(child, $"{path}.{name}")) yield return found;
                break;
            case JsonArray array:
                for (var i = 0; i < array.Count; i++)
                    foreach (var found in MoneyIn(array[i], $"{path}[{i}]")) yield return found;
                break;
        }
    }

    [TestCase("/reports/bureau-a/accounts/totals?type=creditcard")]
    [TestCase("/reports/bureau-a/accounts/totals?type=loan")]
    [TestCase("/reports/bureau-a/accounts")]
    [TestCase("/accounts/acc_ddcc01")]
    [TestCase("/accounts/acc_ddcc01/balance-history")]
    [TestCase("/debt/overview")]
    [TestCase("/reports/bureau-a/overview")]
    public async Task Currency_float_turns_every_money_amount_into_pounds_not_only_some(string path)
    {
        await _service.Bind("alex", "drilldown");
        var proper = await Get(path);
        await Flag("currency-float");
        var floated = await Get(path);
        var before = MoneyIn(proper).ToList();
        var after = MoneyIn(floated).ToList();
        Assert.That(before, Is.Not.Empty, $"{path} should hold money");
        Assert.That(after.Select(a => a.Path), Is.EqualTo(before.Select(b => b.Path)));
        for (var i = 0; i < before.Count; i++)
        {
            var minor = before[i].Node["amountMinor"]!.GetValue<long>();
            Assert.That(after[i].Node["amountMinor"]!.GetValue<double>(), Is.EqualTo(minor / 100.0), $"{path} {before[i].Path}");
        }
        Assert.That(before.Any(b => b.Node["amountMinor"]!.GetValue<long>() != 0), Is.True, $"{path}: a zero amount would hide the flag");
    }

    [Test]
    public async Task Currency_float_does_not_change_the_stored_data()
    {
        await _service.Bind("alex", "drilldown");
        await Flag("currency-float");
        await Get("/accounts/acc_ddcc01/balance-history");
        await Flag();
        var after = await Get("/accounts/acc_ddcc01/balance-history");
        Assert.That(after.ToJsonString(), Does.Not.Contain("."), "a response read after the flag is off holds whole minor units again");
    }

    // ---- A-10

    [Test]
    public async Task Mask_format_returns_the_whole_source_number_in_the_excluded_list_too()
    {
        var sample = JsonNode.Parse(File.ReadAllText(ServiceHost.RepoFile("fixtures", "overrides", "br09-source-mask.json")))!.AsObject();
        var account = sample["overrides"]!["bureaux"]![0]!["accounts"]![0]!.AsObject();
        account["type"] = "loan";
        account["includedInTotals"] = false;
        account["limit"] = null;
        account["utilisation"] = null;
        account["utilisationRaw"] = null;
        account.Remove("limit");
        var body = new JsonObject { ["persona"] = sample["base"]!.DeepClone(), ["overrides"] = sample["overrides"]!.DeepClone() }.ToJsonString();
        var bound = await _service.Control(HttpMethod.Put, "/users/alex/persona", body);
        Assert.That(bound.StatusCode, Is.EqualTo(HttpStatusCode.NoContent), await bound.Content.ReadAsStringAsync());

        string Mask(JsonNode totals) => totals["excluded"]!.AsArray().Single(e => e!["id"]!.GetValue<string>() == "acc_ovcc03")!["maskedNumber"]!.GetValue<string>();
        Assert.That(Mask(await Get("/reports/bureau-a/accounts/totals?type=loan")), Is.EqualTo("*5678"));
        await Flag("mask-format");
        Assert.That(Mask(await Get("/reports/bureau-a/accounts/totals?type=loan")), Is.EqualTo("12345678"));
    }

    // ---- A-11

    [Test]
    public async Task Excluded_in_total_reaches_the_type_totals_and_the_debt_total_and_breakdown_that_use_them()
    {
        await _service.Bind("alex", "drilldown");
        var properLoans = await Get("/reports/bureau-a/accounts/totals?type=loan");
        var properDebt = await Get("/debt/overview");
        await Flag("excluded-in-total");
        var flaggedLoans = await Get("/reports/bureau-a/accounts/totals?type=loan");
        var flaggedDebt = await Get("/debt/overview");

        Assert.That(flaggedLoans["balance"]!["amountMinor"]!.GetValue<long>(), Is.GreaterThan(properLoans["balance"]!["amountMinor"]!.GetValue<long>()), "the type total counts the excluded loan");
        Assert.That(flaggedDebt["total"]!["amountMinor"]!.GetValue<long>(), Is.GreaterThan(properDebt["total"]!["amountMinor"]!.GetValue<long>()), "so does the BR-07 debt total");
        long Loan(JsonNode debt) => debt["byType"]!.AsArray().Single(t => t!["type"]!.GetValue<string>() == "loan")!["amount"]!["amountMinor"]!.GetValue<long>();
        Assert.That(Loan(flaggedDebt), Is.GreaterThan(Loan(properDebt)), "and the loan row of the breakdown");
        Assert.That(flaggedDebt["total"]!["amountMinor"]!.GetValue<long>() - properDebt["total"]!["amountMinor"]!.GetValue<long>(),
            Is.EqualTo(Loan(flaggedDebt) - Loan(properDebt)), "the whole difference is the loan row");
    }

    // ---- A-21

    [Test]
    public async Task The_email_status_has_one_source_so_test_control_the_profile_and_a_change_agree()
    {
        await _service.Bind("alex", "thin-file");
        var store = _service.Services.GetRequiredService<PersonaStore>();
        Assert.That(store.IsEmailMarkedVerified("alex"), Is.False);
        Assert.That((await Get("/me/profile"))["email"]!["status"]!.GetValue<string>(), Is.EqualTo("unverified"));

        Assert.That((await _service.Control(HttpMethod.Post, "/verify-email", """{"username":"alex"}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That(store.IsEmailMarkedVerified("alex"), Is.True);
        Assert.That((await Get("/me/profile"))["email"]!["status"]!.GetValue<string>(), Is.EqualTo("verified"));

        var changed = await _service.Send(HttpMethod.Put, "/me/profile/email", """{"address":"someone.else@example.com"}""", token: await _service.Token());
        Assert.That(changed.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((await Get("/me/profile"))["email"]!["status"]!.GetValue<string>(), Is.EqualTo("unverified"));
        Assert.That(store.IsEmailMarkedVerified("alex"), Is.False, "the state test control reads agrees with the profile after a change");

        await _service.Bind("alex", "thin-file"); // a rebind is a clean start
        Assert.That(store.IsEmailMarkedVerified("alex"), Is.False);
    }
}
