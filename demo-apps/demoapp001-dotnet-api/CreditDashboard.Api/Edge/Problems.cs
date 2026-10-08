using System.Text.Json;
using System.Text.Json.Serialization;

namespace CreditDashboard.Api.Edge;

/// <summary>One field error in a 400 Problem (API specification section 8).</summary>
public sealed record FieldError(
    [property: JsonPropertyName("field")] string Field,
    [property: JsonPropertyName("message")] string Message);

/// <summary>
/// Writes RFC 9457 problems in the shape the contract's <c>Problem</c> schema and API specification section 8 define:
/// <c>type</c> is a <c>/problems/...</c> reference, never <c>about:blank</c>.
/// </summary>
public static class Problems
{
    public static Task Validation(HttpContext context, IReadOnlyList<FieldError> errors) =>
        Write(context, 400, "/problems/validation", "Request failed validation", "One or more fields are invalid.", errors);

    public static Task NotFound(HttpContext context, string detail) =>
        Write(context, 404, "/problems/not-found", "Not found", detail, null);

    /// <summary>The error persona, or an unhandled fault: 500, with no stack trace (API specification section 8).</summary>
    public static Task Internal(HttpContext context, string detail) =>
        Write(context, 500, "/problems/internal", "Server fault", detail, null);

    /// <summary>A missing, unknown, expired or revoked token: 401 (API specification section 8).</summary>
    public static Task Unauthenticated(HttpContext context, string detail) =>
        Write(context, 401, "/problems/unauthenticated", "Missing or invalid token", detail, null);

    /// <summary>A shape-valid request that breaks a rule: 422 under /problems/rule-violation/ (DR-048).</summary>
    public static Task RuleViolation(HttpContext context, string outcome, string title, string detail) =>
        Write(context, 422, "/problems/rule-violation/" + outcome, title, detail, null);

    private static async Task Write(HttpContext context, int status, string type, string title, string detail, IReadOnlyList<FieldError>? errors)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";
        var body = new Dictionary<string, object?>
        {
            ["type"] = type,
            ["title"] = title,
            ["status"] = status,
            ["detail"] = detail,
            ["instance"] = (context.Request.PathBase + context.Request.Path).Value,
        };
        if (errors is not null) body["errors"] = errors; // absent rather than null: the contract's errors is an array
        await context.Response.WriteAsync(JsonSerializer.Serialize(body), context.RequestAborted);
    }
}
