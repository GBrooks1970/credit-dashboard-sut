using System.Globalization;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;
using CreditDashboard.BusinessRules;
using Rules = CreditDashboard.BusinessRules;

namespace CreditDashboard.Api.Routes;

/// <summary>
/// The account operations (API specification 6.3; cases in operations-cases.md section 4): the list, the totals, one account,
/// its balance history and payment history, and the details edit. An account is the signed-in user's only if it is in their
/// bound persona (BR-15): anything else, and a closed account past its six-year window (BR-13), is a 404.
/// </summary>
public static class Accounts
{
    public static RouteGroupBuilder MapAccounts(this RouteGroupBuilder api)
    {
        api.MapGet("/reports/{bureauId}/accounts", ListAccounts);
        api.MapGet("/reports/{bureauId}/accounts/totals", AccountTotals);
        api.MapGet("/accounts/{accountId}", GetAccount);
        api.MapGet("/accounts/{accountId}/balance-history", BalanceHistory);
        api.MapGet("/accounts/{accountId}/payment-history", AccountPaymentHistory);
        api.MapPatch("/accounts/{accountId}/details", UpdateDetail);
        return api;
    }

    private static DateOnly Today(IControlledClock clock) => DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);

    private static async Task<(JsonObject Bureau, DateOnly Today)?> Bureau(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        var username = Http.Username(context);
        var bureau = store.Document(username)["bureaux"]!.AsArray().Select(b => b!.AsObject()).FirstOrDefault(b => b["id"]!.GetValue<string>() == bureauId);
        if (bureau is null)
        {
            await Problems.NotFound(context, $"No bureau '{bureauId}'.");
            return null;
        }
        if (store.FailsReports(username))
        {
            await Problems.Internal(context, "The report could not be loaded.");
            return null;
        }
        return (bureau, Today(clock));
    }

    /// <summary>An account is listed while open, or while closed and inside the BR-13 window.</summary>
    private static bool Listed(JsonObject account, DateOnly today) =>
        ReportData.IsOpen(account) || ClosedAccounts.IsListed(DateOnly.Parse(account["closedDate"]!.GetValue<string>(), CultureInfo.InvariantCulture), today);

    private static JsonObject Summary(JsonObject a)
    {
        var balance = ReportData.IsOpen(a) ? ReportData.Balance(a) : ClosedAccounts.ReportedBalanceMinor(ReportData.Balance(a));
        var utilisation = Defects.Utilisation(ReportData.Balance(a), ReportData.Limit(a));
        var summary = new JsonObject
        {
            ["id"] = a["id"]!.GetValue<string>(),
            ["type"] = a["type"]!.GetValue<string>(),
            ["provider"] = a["provider"]!.GetValue<string>(),
            ["logoUrl"] = a["logoUrl"]?.GetValue<string>(),
            ["maskedNumber"] = a["maskedNumber"]!.GetValue<string>(),
            ["balance"] = ReportData.Money(balance),
        };
        if (ReportData.Limit(a) is { } limit) summary["limit"] = ReportData.Money(limit);
        summary["utilisation"] = utilisation.Display;
        summary["includedInTotals"] = a["includedInTotals"]!.GetValue<bool>();
        summary["status"] = a["status"]!.GetValue<string>();
        return summary;
    }

    /// <summary>The account owned by the signed-in user and listed under BR-13, or null (BR-15: the same answer for any other ID).</summary>
    private static JsonObject? Find(PersonaStore store, string username, string accountId, DateOnly today)
    {
        var accounts = store.Document(username)["bureaux"]!.AsArray().SelectMany(b => b!["accounts"]!.AsArray().Select(a => a!.AsObject())).ToList();
        if (!Ownership.Owns(accounts.Select(a => a["id"]!.GetValue<string>()), accountId)) return null;
        var account = accounts.First(a => a["id"]!.GetValue<string>() == accountId);
        return Listed(account, today) ? account : null;
    }

    private static async Task<(JsonObject Account, DateOnly Today)?> Owned(HttpContext context, PersonaStore store, IControlledClock clock, string accountId)
    {
        var today = Today(clock);
        if (Find(store, Http.Username(context), accountId, today) is { } account) return (account, today);
        await Problems.NotFound(context, $"No account '{accountId}'.");
        return null;
    }

    private static async Task ListAccounts(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Bureau(context, store, clock, bureauId) is not { } r) return;
        var type = context.Request.Query["type"].ToString();
        var closed = context.Request.Query["status"].ToString() == "closed";
        var items = ReportData.Accounts(r.Bureau)
            .Where(a => type.Length == 0 || a["type"]!.GetValue<string>() == type)
            .Where(a => closed ? !ReportData.IsOpen(a) && Listed(a, r.Today) : ReportData.IsOpen(a))
            .Select(a => (JsonNode)Summary(a)).ToArray();
        await Http.Json(context, new JsonArray(items));
    }

    private static async Task AccountTotals(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Bureau(context, store, clock, bureauId) is not { } r) return;
        await Http.Json(context, ReportData.Totals(r.Bureau, ReportData.TypeOf(context.Request.Query["type"].ToString())));
    }

    private static async Task GetAccount(HttpContext context, PersonaStore store, IControlledClock clock, string accountId)
    {
        if (await Owned(context, store, clock, accountId) is not { } r) return;
        var account = Summary(r.Account);
        account["openedDate"] = r.Account["openedDate"]!.GetValue<string>();
        account["closedDate"] = r.Account["closedDate"]?.GetValue<string>();
        account["updateFrequency"] = r.Account["updateFrequency"]!.GetValue<string>();
        account["lastUpdated"] = r.Account["lastUpdated"]!.GetValue<string>();
        account["utilisationRaw"] = Defects.Utilisation(ReportData.Balance(r.Account), ReportData.Limit(r.Account)).Raw;
        account["details"] = store.Session(Http.Username(context)).DetailsOf(accountId, r.Account["details"]!.AsObject());
        account["closed"] = !ReportData.IsOpen(r.Account);
        await Http.Json(context, account);
    }

    private static async Task BalanceHistory(HttpContext context, PersonaStore store, IControlledClock clock, string accountId)
    {
        if (await Owned(context, store, clock, accountId) is not { } r) return;
        await Http.Json(context, r.Account["balanceHistory"]!.DeepClone());
    }

    private static async Task AccountPaymentHistory(HttpContext context, PersonaStore store, IControlledClock clock, string accountId)
    {
        if (await Owned(context, store, clock, accountId) is not { } r) return;
        var window = Rules.PaymentHistory.Window(r.Today);
        var year = int.TryParse(context.Request.Query["year"], NumberStyles.None, CultureInfo.InvariantCulture, out var y) ? y : r.Today.Year;
        if (!window.Contains(year))
        {
            await Problems.Validation(context, [new FieldError("year", $"must be within the seven-year window, {window[0]} to {window[^1]}")]);
            return;
        }
        var current = ReportData.Current(r.Today);
        var account = new[] { ReportData.PaymentAccountOf(r.Account) };
        await Http.Json(context, new JsonObject
        {
            ["years"] = new JsonArray(window.Select(w => (JsonNode)new JsonObject { ["year"] = w, ["status"] = Report.Status(Rules.PaymentHistory.YearStatus(account, w, current)) }).ToArray()),
            ["selectedYear"] = year,
            ["missed"] = ReportData.MissedIn([r.Account], year),
        });
    }

    private static async Task UpdateDetail(HttpContext context, PersonaStore store, IControlledClock clock, string accountId)
    {
        if (await Owned(context, store, clock, accountId) is not { } r) return;
        var body = await Http.Body(context);
        var field = body["field"]!.GetValue<string>();
        var value = body["value"];

        var outcome = Validate(field, value);
        if (outcome == DetailOutcome.OutOfRange)
        {
            await Problems.RuleViolation(context, "out-of-range", "Value out of range", $"{field} is outside its allowed range (BR-14).");
            return;
        }

        var session = store.Session(Http.Username(context));
        session.SetDetail(accountId, field, value);
        await Http.Json(context, session.DetailsOf(accountId, r.Account["details"]!.AsObject()));
    }

    /// <summary>
    /// BR-14 on the edited value. The edge has already typed the body per field (contract v16): the wrong kind, a missing value,
    /// an unknown field and a minimum payment with both or neither of amount and percent are 400 before this runs. The outcome
    /// says whether the value is in range (a 422 when not). A null clears the field. A number that a decimal cannot hold is out of
    /// range. Reading: the payment method must be one of the contract's two values.
    /// </summary>
    private static DetailOutcome Validate(string field, JsonNode? value)
    {
        if (value is null) return DetailOutcome.Valid;

        switch (field)
        {
            case "apr" or "interestRate" or "promoPeriodMonths":
                return Number(value, out var number)
                    ? AccountDetails.Validate(field == "apr" ? DetailField.Apr : field == "interestRate" ? DetailField.InterestRate : DetailField.PromoPeriodMonths, number)
                    : DetailOutcome.OutOfRange;

            case "paymentMethod":
                return value.GetValue<string>() is "direct-debit" or "manual" ? DetailOutcome.Valid : DetailOutcome.OutOfRange;

            case "minPayment":
                var payment = value.AsObject();
                if (payment["percent"] is { } percent)
                {
                    return Number(percent, out var percentValue) ? AccountDetails.Validate(DetailField.MinPaymentPercent, percentValue) : DetailOutcome.OutOfRange;
                }
                return Number(payment["amount"]!["amountMinor"], out var minor) ? AccountDetails.Validate(DetailField.MinPaymentAmountMinor, minor) : DetailOutcome.OutOfRange;

            default:
                throw new InvalidOperationException($"'{field}' is not an editable field: the edge should have refused it.");
        }
    }

    /// <summary>
    /// A JSON number as a decimal. A number the decimal cannot hold is refused, and so is one that is not zero but rounds to zero
    /// (1e-130): stored as sent, it would pass the range check and then break the whole-number or two-decimal rule (found by
    /// Schemathesis in CDS-28).
    /// </summary>
    private static bool Number(JsonNode? node, out decimal value)
    {
        value = 0;
        if (node is not JsonValue json || !json.TryGetValue(out value)) return false;
        return value != 0 || !json.TryGetValue<double>(out var asDouble) || asDouble == 0;
    }
}
