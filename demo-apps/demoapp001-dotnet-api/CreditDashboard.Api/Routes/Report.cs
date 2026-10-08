using System.Globalization;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;
using CreditDashboard.BusinessRules;
using Rules = CreditDashboard.BusinessRules;

namespace CreditDashboard.Api.Routes;

/// <summary>
/// The report operations (API specification 6.2; cases in operations-cases.md section 3): score, history, changes, impact,
/// payment history, searches, personal details, summary feedback and the overview. Order of checks after authentication:
/// the bureau exists (404), the persona behaviour (500 for the error persona), then the response is composed.
/// </summary>
public static class Report
{
    public static RouteGroupBuilder MapReport(this RouteGroupBuilder api)
    {
        api.MapGet("/reports/{bureauId}/overview", Overview);
        api.MapGet("/reports/{bureauId}/score", Score);
        api.MapGet("/reports/{bureauId}/score/history", ScoreHistory);
        api.MapGet("/reports/{bureauId}/changes", Changes);
        api.MapGet("/reports/{bureauId}/impact", Impact);
        api.MapGet("/reports/{bureauId}/payment-history", PaymentHistory);
        api.MapGet("/reports/{bureauId}/searches", Searches);
        api.MapGet("/reports/{bureauId}/personal-details", PersonalDetails);
        api.MapPut("/reports/{bureauId}/summary/feedback", SummaryFeedback);
        return api;
    }

    private sealed record Context(string Username, JsonObject Document, JsonObject Bureau, DateOnly Today);

    private static async Task<Context?> Resolve(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        var username = Http.Username(context);
        var document = store.Document(username);
        var bureau = document["bureaux"]!.AsArray().Select(b => b!.AsObject()).FirstOrDefault(b => b["id"]!.GetValue<string>() == bureauId);
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
        return new Context(username, document, bureau, DateOnly.FromDateTime(clock.UtcNow.UtcDateTime));
    }

    private static DateOnly DateOf(JsonNode change) => DateOnly.Parse(change["date"]!.GetValue<string>(), CultureInfo.InvariantCulture);

    private static async Task Score(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Resolve(context, store, clock, bureauId) is { } r) await Http.Json(context, r.Bureau["score"]!.DeepClone());
    }

    private static async Task ScoreHistory(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Resolve(context, store, clock, bureauId) is not { } r) return;
        Scores.TryParseRange(context.Request.Query["range"], out var range);
        var known = r.Bureau["scoreHistory"]!.AsArray()
            .Where(p => p!["score"] is not null)
            .ToDictionary(p => YearMonth.Parse(p!["month"]!.GetValue<string>()), p => p!["score"]!.GetValue<int>());
        var points = Scores.History(range, ReportData.Current(r.Today), known);
        await Http.Json(context, new JsonArray(points.Select(p => (JsonNode)new JsonObject { ["month"] = p.Month.ToString(), ["score"] = p.Score }).ToArray()));
    }

    private static async Task Changes(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Resolve(context, store, clock, bureauId) is not { } r) return;
        var sentiment = context.Request.Query["sentiment"].ToString();
        var changes = Rules.Changes.NewestFirst(r.Bureau["changes"]!.AsArray().Select(c => c!).Where(c => sentiment.Length == 0 || c["sentiment"]!.GetValue<string>() == sentiment), DateOf);
        var (page, pageSize) = ReportData.Paging(context.Request);
        await Http.Json(context, ReportData.Page(changes, page, pageSize));
    }

    private static async Task Impact(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Resolve(context, store, clock, bureauId) is { } r) await Http.Json(context, r.Bureau["impact"]!.DeepClone());
    }

    private static async Task PaymentHistory(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Resolve(context, store, clock, bureauId) is not { } r) return;
        var window = Rules.PaymentHistory.Window(r.Today);
        var year = int.TryParse(context.Request.Query["year"], NumberStyles.None, CultureInfo.InvariantCulture, out var y) ? y : r.Today.Year;
        if (!window.Contains(year))
        {
            await Problems.Validation(context, [new FieldError("year", $"must be within the seven-year window, {window[0]} to {window[^1]}")]);
            return;
        }
        var current = ReportData.Current(r.Today);
        var accounts = ReportData.PaymentAccounts(r.Bureau);
        await Http.Json(context, new JsonObject
        {
            ["years"] = new JsonArray(window.Select(w => (JsonNode)new JsonObject
            {
                ["year"] = w,
                ["status"] = Status(Rules.PaymentHistory.YearStatus(accounts, w, current)),
            }).ToArray()),
            ["selectedYear"] = year,
            ["missed"] = ReportData.MissedIn(ReportData.Accounts(r.Bureau), year),
        });
    }

    /// <summary>The contract's payment status names: on-time, missed, no-data.</summary>
    internal static string Status(PaymentStatus status) => status switch
    {
        PaymentStatus.OnTime => "on-time",
        PaymentStatus.Missed => "missed",
        _ => "no-data",
    };

    private static async Task Searches(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Resolve(context, store, clock, bureauId) is not { } r) return;
        var kind = context.Request.Query["kind"].ToString();
        var searches = r.Bureau["searches"]!.AsArray().Select(s => s!).Where(s => s["kind"]!.GetValue<string>() == kind)
            .OrderByDescending(DateOf).ToList();
        var (page, pageSize) = ReportData.Paging(context.Request);
        await Http.Json(context, ReportData.Page(searches, page, pageSize));
    }

    private static async Task PersonalDetails(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Resolve(context, store, clock, bureauId) is not { } r) return;
        var details = (JsonObject)r.Bureau["personalDetails"]!.DeepClone();
        details["name"] = store.FindUser(r.Username)!.LegalName; // API specification 9.1: the report name is the legal name
        await Http.Json(context, details);
    }

    private static async Task SummaryFeedback(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Resolve(context, store, clock, bureauId) is not { } r) return;
        var value = (await Http.Body(context))["value"]!.GetValue<string>();
        Rules.SummaryFeedback.TryParse(value, out var parsed);
        var session = store.Session(r.Username);
        var stored = Rules.SummaryFeedback.TryParse(r.Bureau["summary"]!["feedback"]!.GetValue<string>(), out var was) ? was : FeedbackValue.None;
        session.SetFeedback(bureauId, Rules.SummaryFeedback.Set(session.FeedbackOr(bureauId, stored), parsed));
        await Http.Json(context, new JsonObject { ["value"] = value });
    }

    private static async Task Overview(HttpContext context, PersonaStore store, IControlledClock clock, string bureauId)
    {
        if (await Resolve(context, store, clock, bureauId) is not { } r) return;
        var stored = Rules.SummaryFeedback.TryParse(r.Bureau["summary"]!["feedback"]!.GetValue<string>(), out var was) ? was : FeedbackValue.None;
        var feedback = store.Session(r.Username).FeedbackOr(bureauId, stored);
        var changes = Rules.Changes.Overview(r.Bureau["changes"]!.AsArray().Select(c => c!), DateOf);
        await Http.Json(context, new JsonObject
        {
            ["bureau"] = Session.BureauJson(r.Bureau, r.Today),
            ["score"] = r.Bureau["score"]!.DeepClone(),
            ["summary"] = new JsonObject { ["text"] = r.Bureau["summary"]!["text"]!.GetValue<string>(), ["feedback"] = feedback.ToString().ToLowerInvariant() },
            ["recentChanges"] = new JsonArray(changes.Recent.Select(c => c.DeepClone()).ToArray()),
            ["changesTotal"] = changes.Total,
            ["impact"] = r.Bureau["impact"]!.DeepClone(),
            ["debt"] = ReportData.DebtOverview(r.Bureau, r.Today),
            ["accountTypes"] = ReportData.AccountTypeTotals(r.Bureau),
            ["payments"] = ReportData.PaymentCounts(r.Bureau, r.Today),
        });
    }
}
