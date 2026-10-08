using System.Globalization;
using System.Text.Json.Nodes;
using CreditDashboard.BusinessRules;

namespace CreditDashboard.Api.Routes;

/// <summary>
/// Turns a bureau's stored data into the derived values the report and account operations return, using the rule libraries
/// (CDS-20). Nothing here reads the clock: callers pass today. Cases: DOCS/.design/operations-cases.md.
/// </summary>
internal static class ReportData
{
    private static readonly (AccountType Type, string Name)[] TypeNames =
    [
        (AccountType.CreditCard, "creditcard"), (AccountType.Loan, "loan"), (AccountType.Mortgage, "mortgage"),
        (AccountType.CurrentAccount, "currentaccount"), (AccountType.TelecomsAndUtilities, "telecomsandutilities"),
        (AccountType.LineOfCredit, "lineofcredit"),
    ];

    public static AccountType TypeOf(string name) => TypeNames.First(t => t.Name == name).Type;

    public static string NameOf(AccountType type) => TypeNames.First(t => t.Type == type).Name;

    public static IEnumerable<JsonObject> Accounts(JsonObject bureau) => bureau["accounts"]!.AsArray().Select(a => a!.AsObject());

    public static JsonObject Money(long amountMinor) => new() { ["amountMinor"] = amountMinor, ["currency"] = "GBP" };

    public static long Balance(JsonObject account) => account["balance"]!["amountMinor"]!.GetValue<long>();

    public static long? Limit(JsonObject account) => account["limit"] is JsonObject l ? l["amountMinor"]!.GetValue<long>() : null;

    public static bool IsOpen(JsonObject account) => !account["closed"]!.GetValue<bool>();

    public static AccountFacts Facts(JsonObject a) => new(
        a["id"]!.GetValue<string>(), TypeOf(a["type"]!.GetValue<string>()), IsOpen(a),
        a["includedInTotals"]!.GetValue<bool>(), Balance(a), Limit(a));

    public static YearMonth Current(DateOnly today) => YearMonth.From(today);

    // BR-07

    public static JsonObject DebtOverview(JsonObject bureau, DateOnly today)
    {
        var earlierMonth = Current(today).AddMonths(-3).ToString();
        var accounts = Accounts(bureau).Select(a =>
        {
            var facts = Facts(a);
            var earlier = a["balanceHistory"]!.AsArray().Select(h => h!.AsObject())
                .FirstOrDefault(h => h["month"]!.GetValue<string>() == earlierMonth);
            return new DebtAccount(facts.Type, facts.IsOpen, facts.IncludedInTotals, facts.BalanceMinor,
                earlier is null ? null : earlier["balance"]!["amountMinor"]!.GetValue<long>());
        });
        var debt = Debt.Overview(accounts);
        return new JsonObject
        {
            ["total"] = Money(debt.TotalMinor),
            ["byType"] = new JsonArray(debt.ByType.Select(t => (JsonNode)new JsonObject { ["type"] = NameOf(t.Type), ["amount"] = Money(t.BalanceMinor) }).ToArray()),
            ["trend"] = debt.Trend.ToString().ToLowerInvariant(),
        };
    }

    // BR-04, BR-05

    public static JsonObject Totals(JsonObject bureau, AccountType type)
    {
        var ofType = Accounts(bureau).Where(a => TypeOf(a["type"]!.GetValue<string>()) == type).ToList();
        var totals = BusinessRules.Totals.ForType(ofType.Select(Facts));
        var counted = ofType.Where(a => IsOpen(a) && a["includedInTotals"]!.GetValue<bool>()).ToList();
        var hasLimit = counted.Any(a => Limit(a) is not null);
        var excluded = ofType.Where(a => IsOpen(a) && !a["includedInTotals"]!.GetValue<bool>())
            .Select(a => (JsonNode)new JsonObject
            {
                ["id"] = a["id"]!.GetValue<string>(),
                ["provider"] = a["provider"]!.GetValue<string>(),
                ["maskedNumber"] = a["maskedNumber"]!.GetValue<string>(),
                ["balance"] = Money(Balance(a)),
            }).ToArray();
        return new JsonObject
        {
            ["type"] = NameOf(type),
            ["balance"] = Money(totals.BalanceMinor),
            ["limit"] = hasLimit ? Money(totals.LimitMinor) : null,
            ["utilisation"] = totals.Utilisation.Display,
            ["includedCount"] = counted.Count,
            ["excluded"] = new JsonArray(excluded),
        };
    }

    /// <summary>One totals entry for each type that has an open account, in the contract's type order (a Reading in the cases).</summary>
    public static JsonArray AccountTypeTotals(JsonObject bureau) =>
        new(TypeNames.Where(t => Accounts(bureau).Any(a => IsOpen(a) && TypeOf(a["type"]!.GetValue<string>()) == t.Type))
            .Select(t => (JsonNode)Totals(bureau, t.Type)).ToArray());

    // BR-12

    public static List<PaymentAccount> PaymentAccounts(JsonObject bureau) =>
        Accounts(bureau).Select(PaymentAccountOf).ToList();

    public static PaymentAccount PaymentAccountOf(JsonObject a) => new(
        DateOnly.Parse(a["openedDate"]!.GetValue<string>(), CultureInfo.InvariantCulture),
        a["closedDate"] is { } closed ? DateOnly.Parse(closed.GetValue<string>(), CultureInfo.InvariantCulture) : null,
        a["missedMonths"]!.AsArray().Select(m => YearMonth.Parse(m!.GetValue<string>())).ToHashSet());

    /// <summary>The missed account-months of a year as the payment-history list needs them, ordered by month then account ID.</summary>
    public static JsonArray MissedIn(IEnumerable<JsonObject> accounts, int year) =>
        new(accounts
            .SelectMany(a => a["missedMonths"]!.AsArray().Select(m => m!.GetValue<string>())
                .Where(m => m.StartsWith($"{year:D4}-", StringComparison.Ordinal))
                .Select(m => (Month: m, Id: a["id"]!.GetValue<string>(), Provider: a["provider"]!.GetValue<string>())))
            .OrderBy(x => x.Month, StringComparer.Ordinal).ThenBy(x => x.Id, StringComparer.Ordinal)
            .Select(x => (JsonNode)new JsonObject { ["accountId"] = x.Id, ["provider"] = x.Provider, ["month"] = x.Month }).ToArray());

    /// <summary>
    /// Decision brief 9 D4: <c>onReport</c> counts the missed account-months in the BR-12 window (up to the current month);
    /// <c>newMissed</c> counts those in the three months ending at the current month.
    /// </summary>
    public static JsonObject PaymentCounts(JsonObject bureau, DateOnly today)
    {
        var current = Current(today);
        var firstYear = today.Year - 6;
        var recent = new HashSet<YearMonth> { current, current.AddMonths(-1), current.AddMonths(-2) };
        var onReport = 0;
        var newMissed = 0;
        foreach (var account in PaymentAccounts(bureau))
            foreach (var month in account.MissedMonths.Where(m => m.Year >= firstYear && m <= current))
            {
                onReport++;
                if (recent.Contains(month)) newMissed++;
            }
        return new JsonObject { ["newMissed"] = newMissed, ["onReport"] = onReport };
    }

    // Paging

    public static (int Page, int PageSize) Paging(HttpRequest request)
    {
        int Read(string name, int fallback) => int.TryParse(request.Query[name], NumberStyles.None, CultureInfo.InvariantCulture, out var v) ? v : fallback;
        return (Read("page", 1), Read("pageSize", 20));
    }

    public static JsonObject Page(IReadOnlyList<JsonNode> all, int page, int pageSize, params (string Name, JsonNode? Value)[] extra)
    {
        var body = new JsonObject
        {
            ["page"] = page,
            ["pageSize"] = pageSize,
            ["total"] = all.Count,
            ["items"] = new JsonArray(all.Skip((page - 1) * pageSize).Take(pageSize).Select(n => n.DeepClone()).ToArray()),
        };
        foreach (var (name, value) in extra) body[name] = value;
        return body;
    }
}
