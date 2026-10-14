namespace CreditDashboard.Api.Control;

/// <summary>
/// The bug flags test control has switched on (DR-008, decision brief 13, DR-064). Flags are set only through test control and
/// read here, in one place: the set that was on when the request began is held for that request, so the helpers that build a
/// response (which take no request) can ask <see cref="Has"/> without it being passed to them. A flag changes a call site, never
/// a rule in the BusinessRules library.
/// </summary>
public static class Flags
{
    private static readonly AsyncLocal<IReadOnlySet<string>?> Active = new();

    /// <summary>The service-side flags that now change behaviour. The others in the contract are UI flags, or not built yet (bug-flags.json).</summary>
    public static readonly IReadOnlySet<string> Implemented = new HashSet<string>
    {
        "rounding-down", "excluded-in-total", "history-carry-forward", "idor", "problem-json-missing", "mask-format", "currency-float",
    };

    public static void Begin(IReadOnlySet<string> flags) => Active.Value = flags;

    public static bool Has(string name) => Active.Value?.Contains(name) ?? false;
}

/// <summary>Holds the flags that are on for the length of each request.</summary>
public sealed class FlagsMiddleware(RequestDelegate next)
{
    public Task Invoke(HttpContext context, PersonaStore store)
    {
        Flags.Begin(store.ActiveFlags());
        return next(context);
    }
}
