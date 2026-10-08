using System.Globalization;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;

namespace CreditDashboard.Api.Routes;

/// <summary>
/// The supporting operations (API specification 6.4; cases in operations-cases.md section 5): the debt overview, the
/// notifications and the mock assistant.
/// </summary>
public static class Supporting
{
    public static RouteGroupBuilder MapSupporting(this RouteGroupBuilder api)
    {
        api.MapGet("/debt/overview", DebtOverview);
        api.MapGet("/notifications", ListNotifications);
        api.MapPatch("/notifications/{notificationId}", MarkNotificationRead);
        api.MapPost("/assistant/messages", SendAssistantMessage);
        return api;
    }

    /// <summary>BR-07 for the user's default bureau: the operation has no bureau parameter (a Reading in the cases).</summary>
    private static async Task DebtOverview(HttpContext context, PersonaStore store, IControlledClock clock)
    {
        var bureau = store.Document(Http.Username(context))["bureaux"]![0]!.AsObject();
        await Http.Json(context, ReportData.DebtOverview(bureau, DateOnly.FromDateTime(clock.UtcNow.UtcDateTime)));
    }

    private static JsonObject Notification(JsonNode stored, UserSession session) => new()
    {
        ["id"] = stored["id"]!.GetValue<string>(),
        ["title"] = stored["title"]!.GetValue<string>(),
        ["read"] = session.NotificationReadOr(stored["id"]!.GetValue<string>(), stored["read"]!.GetValue<bool>()),
        ["createdAt"] = stored["createdAt"]!.GetValue<string>(),
    };

    /// <summary>Unread first, then newest first; <c>unread</c> counts every unread notification, not only the page.</summary>
    private static async Task ListNotifications(HttpContext context, PersonaStore store)
    {
        var username = Http.Username(context);
        var session = store.Session(username);
        var all = store.Document(username)["notifications"]!.AsArray().Select(n => Notification(n!, session)).ToList();
        var ordered = all
            .OrderBy(n => n["read"]!.GetValue<bool>())
            .ThenByDescending(n => DateTimeOffset.Parse(n["createdAt"]!.GetValue<string>(), CultureInfo.InvariantCulture))
            .Select(n => (JsonNode)n).ToList();
        var (page, pageSize) = ReportData.Paging(context.Request);
        await Http.Json(context, ReportData.Page(ordered, page, pageSize, ("unread", all.Count(n => !n["read"]!.GetValue<bool>()))));
    }

    private static async Task MarkNotificationRead(HttpContext context, PersonaStore store, string notificationId)
    {
        var username = Http.Username(context);
        var stored = store.Document(username)["notifications"]!.AsArray().FirstOrDefault(n => n!["id"]!.GetValue<string>() == notificationId);
        if (stored is null)
        {
            await Problems.NotFound(context, $"No notification '{notificationId}'.");
            return;
        }
        var session = store.Session(username);
        session.SetNotificationRead(notificationId, (await Http.Body(context))["read"]!.GetValue<bool>());
        await Http.Json(context, Notification(stored, session));
    }

    /// <summary>Decision brief 9 D5: the first intent word the message contains, in this order; otherwise the fallback.</summary>
    internal static readonly (string Word, string Reply)[] Intents =
    [
        ("score", "Your credit score is on the overview page, shown against the national and local averages."),
        ("debt", "Your total debt, and how it is split by account type, is on the debt page."),
        ("payment", "Your payment history shows each year as on time, missed or no data."),
    ];

    internal const string Fallback = "I can help with your score, your debt and your payments.";

    internal const string Disclaimer = "This is a demonstration assistant. It does not give financial advice.";

    private static async Task SendAssistantMessage(HttpContext context)
    {
        var message = (await Http.Body(context))["message"]!.GetValue<string>();
        var reply = Intents.FirstOrDefault(i => message.Contains(i.Word, StringComparison.OrdinalIgnoreCase)).Reply ?? Fallback;
        await Http.Json(context, new JsonObject { ["reply"] = reply, ["disclaimer"] = Disclaimer });
    }
}
