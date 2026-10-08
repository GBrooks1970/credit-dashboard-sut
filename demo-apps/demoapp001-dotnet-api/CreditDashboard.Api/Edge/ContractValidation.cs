using System.Text.Json;
using CreditDashboard.Api.Control;
using Json.Schema;

namespace CreditDashboard.Api.Edge;

/// <summary>
/// Validates every request against the contract before any handler runs (DR-017, DR-050).
/// <list type="bullet">
/// <item>No contract operation fits the method and path: 404 <c>/problems/not-found</c>.</item>
/// <item>A path or query parameter, or the JSON body, breaks its schema: 400 <c>/problems/validation</c> with
/// <c>errors[]</c> (API specification section 8).</item>
/// <item>Otherwise the request goes on. An operation the service does not serve yet then reaches the fallback: 404.</item>
/// </list>
/// Shape only: business rules are the service's own 422s (for example BR-14 ranges, which the PATCH body schema does
/// not carry).
/// </summary>
public sealed class ContractValidation(RequestDelegate next, ContractModel contract, TokenStore tokens, PersonaStore store)
{
    private static readonly EvaluationOptions Evaluation = new() { OutputFormat = OutputFormat.List };

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "/";
        if (!path.StartsWith(contract.BasePath + "/", StringComparison.Ordinal))
        {
            await Problems.NotFound(context, "No operation matches this request.");
            return;
        }

        var relative = path[contract.BasePath.Length..];
        var match = contract.Find(context.Request.Method, relative);
        if (match is null)
        {
            // A path the contract has with a method it does not is a 405 (DR-056); any other path is a 404.
            if (contract.AllowedMethods(relative) is { Count: > 0 } allowed) await Problems.MethodNotAllowed(context, allowed);
            else await Problems.NotFound(context, "No operation matches this request.");
            return;
        }

        var (operation, pathValues) = match.Value;

        // Authentication comes before the shape of the request (decision brief 9 D3, DR-055).
        if (operation.Authentication == Authentication.Bearer)
        {
            var token = TokenStore.FromHeader(context.Request.Headers.Authorization.ToString());
            var username = token is null ? null : tokens.Validate(token);
            if (username is null)
            {
                await Problems.Unauthenticated(context, token is null ? "A bearer token is required." : "The token is not valid, or has expired.");
                return;
            }
            context.Items["user"] = username;
            context.Items["token"] = token;
        }
        var errors = new List<FieldError>();
        foreach (var parameter in operation.Parameters)
        {
            string? raw = parameter.In switch
            {
                "path" => pathValues.GetValueOrDefault(parameter.Name),
                "query" => context.Request.Query.TryGetValue(parameter.Name, out var q) ? q.ToString() : null,
                _ => null, // headers and cookies are not validated at the edge (security schemes are the service's)
            };
            if (raw is null)
            {
                if (parameter.Required && parameter.In is "path" or "query") errors.Add(new(parameter.Name, "is required"));
                continue;
            }
            var value = ContractModel.AsJson(raw, parameter.ValueType);
            if (value is null)
            {
                errors.Add(new(parameter.Name, $"must be {(parameter.ValueType == "integer" ? "an" : "a")} {parameter.ValueType}"));
                continue;
            }
            errors.AddRange(Evaluate(parameter.Schema, value.Value, parameter.Name));
        }

        if (operation.BodySchema is not null)
        {
            context.Request.EnableBuffering();
            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var text = await reader.ReadToEndAsync(context.RequestAborted);
            context.Request.Body.Position = 0;
            if (string.IsNullOrWhiteSpace(text))
            {
                if (operation.BodyRequired) errors.Add(new("body", "is required"));
            }
            else
            {
                try
                {
                    using var doc = JsonDocument.Parse(text);
                    errors.AddRange(Evaluate(operation.BodySchema, doc.RootElement, null));
                }
                catch (JsonException)
                {
                    errors.Add(new("body", "is not valid JSON"));
                }
            }
        }

        if (errors.Count > 0)
        {
            await Problems.Validation(context, errors);
            return;
        }

        context.Items[nameof(ContractOperation)] = operation;

        // The slow persona delays every authenticated operation (persona behaviour latencyMs).
        if (context.Items["user"] is string signedIn && store.PersonaLatencyMs(signedIn) is > 0 and var persona)
            await Task.Delay(persona, context.RequestAborted);

        await next(context);
    }

    private static IEnumerable<FieldError> Evaluate(JsonSchema schema, JsonElement value, string? field)
    {
        var result = schema.Evaluate(value, Evaluation);
        if (result.IsValid) yield break;
        var leaves = (result.Details ?? []).Where(d => d.Errors is { Count: > 0 }).ToList();
        // Report the deepest failures only: a parent's "some properties did not match" repeats its children.
        var deepest = leaves.Where(d => !leaves.Any(o => o != d && o.InstanceLocation.ToString().StartsWith(d.InstanceLocation + "/", StringComparison.Ordinal))).ToList();
        foreach (var detail in deepest.Count > 0 ? deepest : leaves)
        {
            var location = detail.InstanceLocation.ToString().TrimStart('/').Replace('/', '.');
            var name = field ?? (location.Length > 0 ? location : "body");
            foreach (var message in detail.Errors!.Values)
                yield return new FieldError(name, message);
        }
        if (leaves.Count == 0) yield return new FieldError(field ?? "body", "does not match the contract");
    }
}
