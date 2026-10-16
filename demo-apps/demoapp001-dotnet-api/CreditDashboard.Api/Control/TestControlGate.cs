using System.Security.Cryptography;
using System.Text;
using CreditDashboard.Api.Edge;

namespace CreditDashboard.Api.Control;

/// <summary>
/// The test-control gate (DR-008, API specification 6.5). It runs before the edge: when test control is off, or the
/// <c>X-Test-Control-Key</c> header is missing or wrong, every <c>/__test/*</c> request gets the same 404, so the
/// operations' existence is not revealed.
/// </summary>
public sealed class TestControlGate(RequestDelegate next, TestControlOptions options, ContractModel contract)
{
    public const string KeyHeader = "X-Test-Control-Key";

    /// <summary>
    /// True for the test-control paths however they are spelt: repeated slashes (<c>/api/v1//__test/reset</c>) and any case reach
    /// the same endpoint in the router, so they must reach the same gate (CDS-38 A-03).
    /// </summary>
    public static bool IsTestControlPath(string path, string basePath)
    {
        var normal = Collapse(path);
        var root = Collapse(basePath) + "/__test";
        return normal.StartsWith(root + "/", StringComparison.OrdinalIgnoreCase) || normal.Equals(root, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>True if the path, however spelt, has a <c>__test</c> segment: used to keep test-control errors out of the bug flags (A-08).</summary>
    public static bool HasTestControlSegment(string path) => (Collapse(path) + "/").Contains("/__test/", StringComparison.OrdinalIgnoreCase);

    private static string Collapse(string path)
    {
        var builder = new System.Text.StringBuilder(path.Length);
        foreach (var c in path)
            if (c != '/' || builder.Length == 0 || builder[^1] != '/') builder.Append(c);
        return builder.ToString();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (IsTestControlPath(context.Request.Path.Value ?? "/", contract.BasePath) && !KeyAccepted(context))
        {
            await Problems.NotFound(context, "Test control is not enabled.");
            return;
        }
        await next(context);
    }

    private bool KeyAccepted(HttpContext context)
    {
        if (!options.Enabled || options.Key is null) return false;
        var given = context.Request.Headers[KeyHeader].ToString();
        return given.Length > 0 && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(given), Encoding.UTF8.GetBytes(options.Key));
    }
}

/// <summary>Applies the latency test control sets to every request except <c>/__test/*</c> (API specification 6.5).</summary>
public sealed class LatencyMiddleware(RequestDelegate next, PersonaStore store, ContractModel contract)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (!TestControlGate.IsTestControlPath(context.Request.Path.Value ?? "/", contract.BasePath))
        {
            var delay = store.Latency.NextDelayMs();
            if (delay > 0) await Task.Delay(delay, context.RequestAborted);
        }
        await next(context);
    }
}
