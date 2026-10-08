using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;
using CreditDashboard.BusinessRules;
using CreditDashboard.BusinessRules.Profile;

namespace CreditDashboard.Api.Routes;

/// <summary>Small helpers the handlers share.</summary>
internal static class Http
{
    public const string UserKey = "user";
    public const string TokenKey = "token";

    public static async Task<JsonObject> Body(HttpContext context) =>
        (await JsonNode.ParseAsync(context.Request.Body, cancellationToken: context.RequestAborted))!.AsObject();

    public static string Username(HttpContext context) => (string)context.Items[UserKey]!;

    public static string Instant(DateTimeOffset instant) =>
        instant.UtcDateTime.ToString("yyyy-MM-dd\\THH:mm:ss.FFFFFFF\\Z", CultureInfo.InvariantCulture);

    public static async Task Json(HttpContext context, JsonNode body)
    {
        context.Response.StatusCode = StatusCodes.Status200OK;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(body.ToJsonString(), context.RequestAborted);
    }
}

/// <summary>
/// The session and identity operations: <c>login</c>, <c>logout</c>, <c>getMe</c> and <c>listBureaux</c> (API specification
/// 6.1 and 6.2; cases in operations-cases.md section 2). Authentication has already happened at the edge for all but login.
/// </summary>
public static class Session
{
    public static RouteGroupBuilder MapSession(this RouteGroupBuilder api)
    {
        api.MapPost("/auth/login", Login);
        api.MapPost("/auth/logout", Logout);
        api.MapGet("/me", GetMe);
        api.MapGet("/bureaux", ListBureaux);
        return api;
    }

    private static async Task Login(HttpContext context, PersonaStore store, TokenStore tokens)
    {
        var body = await Http.Body(context);
        var username = body["username"]!.GetValue<string>();
        var password = body["password"]!.GetValue<string>();
        var user = store.FindUser(username);
        // The same answer for an unknown user and a wrong password, so users cannot be probed.
        if (user is null || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(password), Encoding.UTF8.GetBytes(user.Password)))
        {
            await Problems.Unauthenticated(context, "The username or password is not right.");
            return;
        }
        var (token, expiresAt) = tokens.Issue(user.Username);
        await Http.Json(context, new JsonObject { ["token"] = token, ["expiresAt"] = Http.Instant(expiresAt) });
    }

    private static Task Logout(HttpContext context, TokenStore tokens)
    {
        tokens.Revoke((string)context.Items[Http.TokenKey]!);
        context.Response.StatusCode = StatusCodes.Status204NoContent;
        return Task.CompletedTask;
    }

    private static async Task GetMe(HttpContext context, PersonaStore store)
    {
        var username = Http.Username(context);
        var user = store.FindUser(username)!;
        var document = store.Document(username);
        var stored = document["profile"]?["preferredName"]?.GetValue<string>();
        var preferred = store.Session(username).PreferredNameOr(stored);
        await Http.Json(context, new JsonObject
        {
            ["id"] = user.Id,
            ["displayName"] = user.LegalName,
            ["greetingName"] = PreferredName.GreetingName(preferred, user.LegalName),
            ["defaultBureauId"] = document["bureaux"]![0]!["id"]!.GetValue<string>(),
        });
    }

    private static async Task ListBureaux(HttpContext context, PersonaStore store, IControlledClock clock)
    {
        var today = DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);
        var bureaux = store.Document(Http.Username(context))["bureaux"]!.AsArray().Select(b => (JsonNode)BureauJson(b!.AsObject(), today)).ToArray();
        await Http.Json(context, new JsonArray(bureaux));
    }

    /// <summary>A bureau as <c>Bureau</c>: its ID and name, and the days to its next refresh on the controlled clock (BR-08).</summary>
    internal static JsonObject BureauJson(JsonObject bureau, DateOnly today) => new()
    {
        ["id"] = bureau["id"]!.GetValue<string>(),
        ["name"] = bureau["name"]!.GetValue<string>(),
        ["nextUpdateInDays"] = Refresh.DaysUntil(today, DateOnly.Parse(bureau["nextRefreshDate"]!.GetValue<string>(), CultureInfo.InvariantCulture)),
    };
}
