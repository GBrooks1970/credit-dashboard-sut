using System.Globalization;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;

namespace CreditDashboard.Api.Routes;

/// <summary>
/// The seven test-control operations (API specification 6.5, DR-008, DR-020). They are always mapped; the gate
/// answers 404 unless test control is on and the key is right. The edge has already checked each body's shape, so the
/// handlers check the target (404) and then the rules (422).
/// </summary>
public static class TestControl
{
    public static RouteGroupBuilder MapTestControl(this RouteGroupBuilder api)
    {
        api.MapPost("/__test/reset", Reset);
        api.MapPut("/__test/users/{username}/persona", BindPersona);
        api.MapPut("/__test/bugs", SetBugs);
        api.MapPut("/__test/clock", SetClock);
        api.MapPut("/__test/latency", SetLatency);
        api.MapGet("/__test/state", GetState);
        api.MapPost("/__test/verify-email", VerifyEmail);
        return api;
    }

    private static Task NoContent(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status204NoContent;
        return Task.CompletedTask;
    }

    private static async Task<JsonObject> Body(HttpContext context) =>
        (await JsonNode.ParseAsync(context.Request.Body, cancellationToken: context.RequestAborted))!.AsObject();

    private static Task Reset(HttpContext context, PersonaStore store)
    {
        store.Reset();
        return NoContent(context);
    }

    private static async Task BindPersona(HttpContext context, PersonaStore store, string username)
    {
        if (store.FindUser(username) is null)
        {
            await Problems.NotFound(context, $"No test user '{username}'.");
            return;
        }

        var body = await Body(context);
        var persona = body["persona"]!.GetValue<string>();
        var overrides = body["overrides"]?.AsObject();
        if (overrides is not null)
        {
            var merged = (JsonObject)store.Fixtures.Personas[persona].DeepClone();
            PersonaStore.Merge(merged, overrides, out var unknownBureau);
            if (unknownBureau is not null)
            {
                await Problems.NotFound(context, $"The {persona} persona has no bureau '{unknownBureau}'.");
                return;
            }
            var violations = OverridesValidator.Validate(persona, merged, store.Fixtures);
            if (violations.Count > 0)
            {
                await Problems.RuleViolation(context, "overrides-inconsistent", "Overrides break a business rule", string.Join(" ", violations));
                return;
            }
        }

        store.Bind(username, persona, overrides);
        await NoContent(context);
    }

    private static async Task SetBugs(HttpContext context, PersonaStore store)
    {
        var body = await Body(context);
        store.SetFlags(body["flags"]!.AsArray().Select(f => f!.GetValue<string>()));
        await NoContent(context);
    }

    private static async Task SetClock(HttpContext context, PersonaStore store)
    {
        var body = await Body(context);
        var text = body["now"]!.GetValue<string>();
        if (!DateTimeOffset.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var now) || !text.Contains('T'))
        {
            await Problems.Validation(context, [new FieldError("now", "must be an RFC 3339 date-time")]);
            return;
        }
        store.SetClock(now);
        await NoContent(context);
    }

    private static async Task SetLatency(HttpContext context, PersonaStore store)
    {
        var body = await Body(context);
        int? Read(string name) => body[name]?.GetValue<int>();
        var (fixedMs, minMs, maxMs) = (Read("fixedMs"), Read("minMs"), Read("maxMs"));

        var errors = new List<FieldError>();
        if (fixedMs is not null && (minMs is not null || maxMs is not null))
            errors.Add(new("fixedMs", "give either fixedMs or minMs and maxMs, not both"));
        else if ((minMs is null) != (maxMs is null))
            errors.Add(new(minMs is null ? "minMs" : "maxMs", "minMs and maxMs go together"));
        else if (minMs > maxMs)
            errors.Add(new("minMs", "must not be more than maxMs"));
        if (errors.Count > 0)
        {
            await Problems.Validation(context, errors);
            return;
        }

        store.SetLatency(new LatencySetting(fixedMs, minMs, maxMs));
        await NoContent(context);
    }

    private static async Task GetState(HttpContext context, PersonaStore store)
    {
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(store.Snapshot().ToJsonString(), context.RequestAborted);
    }

    private static async Task VerifyEmail(HttpContext context, PersonaStore store)
    {
        var body = await Body(context);
        var username = body["username"]!.GetValue<string>();
        if (store.FindUser(username) is null)
        {
            await Problems.NotFound(context, $"No test user '{username}'.");
            return;
        }
        store.MarkEmailVerified(username);
        await NoContent(context);
    }
}
