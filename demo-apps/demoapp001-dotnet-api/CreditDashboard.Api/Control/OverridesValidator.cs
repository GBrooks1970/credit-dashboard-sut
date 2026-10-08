using System.Globalization;
using System.Text.Json.Nodes;
using CreditDashboard.BusinessRules;

namespace CreditDashboard.Api.Control;

/// <summary>
/// Checks the rules a stored value must obey after overrides are applied (API specification 6.5). It is the C# port of
/// the rule checks in <c>fixtures/schema-check.mjs</c>, over the CDS-20 library. Returns one message per violation;
/// none means consistent. Two persona conventions do not apply to overrides: changes need not be newest first, and a
/// closed account may sit outside the six-year window.
/// </summary>
public static class OverridesValidator
{
    public static List<string> Validate(string personaName, JsonObject merged, FixtureSet fixtures)
    {
        var problems = new List<string>();
        var asAt = merged["asAt"]!.GetValue<string>();
        var asAtYear = int.Parse(asAt[..4], CultureInfo.InvariantCulture);
        var asAtMonth = asAt[..7];

        foreach (var bureau in merged["bureaux"]!.AsArray().Select(b => b!.AsObject()))
        {
            foreach (var list in new[] { "changes", "searches", "accounts" })
            {
                var ids = bureau[list]!.AsArray().Select(x => x!["id"]!.GetValue<string>()).ToList();
                if (ids.Distinct().Count() != ids.Count) problems.Add($"{bureau["id"]!.GetValue<string>()} {list} IDs are not unique (BR-15).");
            }

            foreach (var account in bureau["accounts"]!.AsArray().Select(a => a!.AsObject()))
                CheckAccount(personaName, account, asAtYear, asAtMonth, fixtures, problems);
        }
        return problems;
    }

    private static void CheckAccount(string personaName, JsonObject a, int asAtYear, string asAtMonth, FixtureSet fixtures, List<string> problems)
    {
        var id = a["id"]!.GetValue<string>();
        if (fixtures.AccountOwners.TryGetValue(id, out var owner) && owner != personaName)
            problems.Add($"{id} is also used in the {owner} persona (BR-15).");

        var balance = a["balance"]!["amountMinor"]!.GetValue<long>();
        long? limit = a["limit"] is JsonObject l ? l["amountMinor"]!.GetValue<long>() : null;
        var expected = Utilisation.Resolve(balance, limit);
        var shown = a["utilisation"]?.GetValue<int>();
        if (shown != expected.Display)
            problems.Add($"{id} utilisation {(shown?.ToString(CultureInfo.InvariantCulture) ?? "null")} does not match its balance and limit, expected {(expected.Display?.ToString(CultureInfo.InvariantCulture) ?? "null")} (BR-03, BR-06).");
        if (a["utilisationRaw"] is { } rawNode && rawNode.GetValue<int?>() != expected.Raw)
            problems.Add($"{id} utilisationRaw {rawNode.GetValue<int?>()} does not match its balance and limit, expected {(expected.Raw?.ToString(CultureInfo.InvariantCulture) ?? "null")} (BR-06).");

        if (a["type"]!.GetValue<string>() == "loan" && a["limit"] is null && a["includedInTotals"]!.GetValue<bool>() != Totals.IsIncludedInTotals(AccountType.Loan, null))
            problems.Add($"{id} is a loan without a limit but is included in totals (BR-05).");

        if (a["sourceMask"] is { } source && a["maskedNumber"]!.GetValue<string>() != Masking.Mask(source.GetValue<string>()))
            problems.Add($"{id} mask {a["maskedNumber"]!.GetValue<string>()} does not match its source mask (BR-09).");

        var openedMonth = a["openedDate"]!.GetValue<string>()[..7];
        foreach (var month in a["missedMonths"]!.AsArray().Select(m => m!.GetValue<string>()))
        {
            var year = int.Parse(month[..4], CultureInfo.InvariantCulture);
            if (year < asAtYear - 6 || string.CompareOrdinal(month, asAtMonth) > 0)
                problems.Add($"{id} missed month {month} is outside the seven-year window (BR-12).");
            if (string.CompareOrdinal(month, openedMonth) < 0)
                problems.Add($"{id} missed month {month} is before the account opened (BR-12).");
        }

        if (a["closed"]!.GetValue<bool>())
        {
            if (balance != ClosedAccounts.ReportedBalanceMinor(balance)) problems.Add($"{id} is closed but its balance is not 0 (BR-13).");
            if (a["status"]!.GetValue<string>() != "closed" || a["closedDate"] is null)
                problems.Add($"{id} is closed and needs status closed and a close date (BR-13).");
        }

        var months = a["balanceHistory"]!.AsArray().Select(h => h!["month"]!.GetValue<string>()).ToList();
        for (var i = 1; i < months.Count; i++)
            if (string.CompareOrdinal(months[i - 1], months[i]) >= 0) { problems.Add($"{id} balance history is not oldest first."); break; }
    }
}
