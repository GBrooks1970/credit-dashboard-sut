using System.Text.RegularExpressions;

namespace CreditDashboard.Api.Edge;

/// <summary>
/// Turns any unhandled exception into the 500 Problem of API specification section 8, in every hosting environment
/// (CDS-38 A-01, A-02). The exception goes to the log; the caller gets a fixed detail and no stack trace. It runs first,
/// so the developer exception page that the Development environment adds never sees a fault.
/// </summary>
public sealed class FaultHandler(RequestDelegate next, ILogger<FaultHandler> log)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // The caller went away; there is nobody to answer.
        }
        catch (Exception fault)
        {
            log.LogError(fault, "Unhandled fault on {Method} {Path}", context.Request.Method, context.Request.Path);
            if (context.Response.HasStarted) throw;
            context.Response.Clear();
            await Problems.Internal(context, "The service could not complete the request.");
        }
    }
}

/// <summary>
/// <c>X-Correlation-Id</c> (API specification section 3): echoed on every response; generated if the request has none.
/// A supplied value is echoed only if it is a short token of letters, digits, dot, underscore and hyphen, so a caller
/// cannot put arbitrary text in a header the service writes; any other value is replaced by a generated one.
/// </summary>
public sealed partial class CorrelationIdMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Correlation-Id";

    [GeneratedRegex("^[A-Za-z0-9._-]{1,128}$")]
    private static partial Regex Acceptable();

    public Task InvokeAsync(HttpContext context)
    {
        var supplied = context.Request.Headers[HeaderName].ToString();
        var id = Acceptable().IsMatch(supplied) ? supplied : Guid.NewGuid().ToString("D");
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = id;
            return Task.CompletedTask;
        });
        return next(context);
    }
}
