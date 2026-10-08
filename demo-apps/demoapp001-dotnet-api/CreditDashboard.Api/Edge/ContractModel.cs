using System.Text.Json;
using System.Text.Json.Nodes;
using Json.Schema;

namespace CreditDashboard.Api.Edge;

/// <summary>A parameter of one contract operation, with the schema its value must satisfy.</summary>
public sealed record ContractParameter(string Name, string In, bool Required, string ValueType, JsonSchema Schema);

/// <summary>How an operation is authenticated: a bearer token (the contract default), nothing (login), or the test-control key.</summary>
public enum Authentication { Bearer, None, TestControlKey }

/// <summary>One operation of the contract: method, path template, parameters and the request body schema.</summary>
public sealed record ContractOperation(
    string OperationId,
    string Method,
    string PathTemplate,
    IReadOnlyList<ContractParameter> Parameters,
    JsonSchema? BodySchema,
    bool BodyRequired,
    Authentication Authentication)
{
    public string[] Segments { get; } = PathTemplate.Trim('/').Split('/');

    /// <summary>Path parameters by name if <paramref name="path"/> fits this template; otherwise null.</summary>
    public Dictionary<string, string>? Match(string[] pathSegments)
    {
        if (pathSegments.Length != Segments.Length) return null;
        var values = new Dictionary<string, string>();
        for (var i = 0; i < Segments.Length; i++)
        {
            var template = Segments[i];
            if (template.StartsWith('{') && template.EndsWith('}'))
            {
                if (pathSegments[i].Length == 0) return null;
                values[template[1..^1]] = Uri.UnescapeDataString(pathSegments[i]);
            }
            else if (!string.Equals(template, pathSegments[i], StringComparison.Ordinal))
            {
                return null;
            }
        }
        return values;
    }

    /// <summary>Literal segments count: the more literal template wins when two templates fit.</summary>
    public int LiteralSegments => Segments.Count(s => !s.StartsWith('{'));
}

/// <summary>
/// The contract (DOCS/.architecture/openapi.yaml, embedded as Contract/contract.json) as the edge needs it (DR-050).
/// JSON Schema evaluation uses JsonSchema.Net: OpenAPI's own keywords are not JSON Schema, so the component schemas are
/// registered as <c>$defs</c> of one 2020-12 document and every <c>#/components/schemas/</c> reference is rewritten to it.
/// </summary>
public sealed class ContractModel
{
    private static readonly string[] Methods = ["get", "put", "post", "patch", "delete"];
    private const string BaseUri = "https://credit-dashboard-sut.local/contract.json";
    private const string Draft202012 = "https://json-schema.org/draft/2020-12/schema";
    private readonly JsonNode _contract;
    private readonly SchemaRegistry _registry = new();
    private readonly BuildOptions _build;

    public string BasePath { get; }
    public IReadOnlyList<ContractOperation> Operations { get; }

    private ContractModel(JsonNode contract)
    {
        _contract = contract;
        _build = new BuildOptions { SchemaRegistry = _registry };
        var defs = Rewrite(contract["components"]!["schemas"]!.ToJsonString());
        JsonSchema.FromText($"{{\"$schema\":\"{Draft202012}\",\"$defs\":{defs}}}", _build, new Uri(BaseUri));
        BasePath = new Uri(contract["servers"]![0]!["url"]!.GetValue<string>()).AbsolutePath.TrimEnd('/');
        Operations = ReadOperations().ToList();
    }

    public static ContractModel LoadEmbedded()
    {
        using var stream = typeof(ContractModel).Assembly.GetManifestResourceStream("contract.json")
            ?? throw new InvalidOperationException("Embedded contract.json is missing; run tools/generate-service-contract.mjs");
        return new ContractModel(JsonNode.Parse(stream)!);
    }

    /// <summary>The operation that fits the method and path (relative to the base path), the most literal template first.</summary>
    public (ContractOperation Operation, Dictionary<string, string> PathValues)? Find(string method, string relativePath)
    {
        var segments = relativePath.Trim('/').Split('/');
        return Operations
            .Where(o => string.Equals(o.Method, method, StringComparison.OrdinalIgnoreCase))
            .Select(o => (Operation: o, Values: o.Match(segments)))
            .Where(m => m.Values is not null)
            .OrderByDescending(m => m.Operation.LiteralSegments)
            .Select(m => ((ContractOperation, Dictionary<string, string>)?)(m.Operation, m.Values!))
            .FirstOrDefault();
    }

    private IEnumerable<ContractOperation> ReadOperations()
    {
        foreach (var (template, item) in _contract["paths"]!.AsObject())
        {
            var shared = item!["parameters"]?.AsArray().Select(p => Resolve(p!)).ToList() ?? [];
            foreach (var method in Methods)
            {
                var op = item[method];
                if (op is null) continue;
                var parameters = shared.Concat(op["parameters"]?.AsArray().Select(p => Resolve(p!)) ?? [])
                    .Select(p => new ContractParameter(
                        p["name"]!.GetValue<string>(),
                        p["in"]!.GetValue<string>(),
                        p["required"]?.GetValue<bool>() ?? false,
                        ValueTypeOf(p["schema"]),
                        Schema(p["schema"])))
                    .ToList();
                var json = op["requestBody"]?["content"]?["application/json"];
                yield return new ContractOperation(
                    op["operationId"]!.GetValue<string>(),
                    method.ToUpperInvariant(),
                    template,
                    parameters,
                    json?["schema"] is { } body ? Schema(body) : null,
                    op["requestBody"]?["required"]?.GetValue<bool>() ?? false,
                    AuthenticationOf(op["security"]));
            }
        }
    }

    /// <summary>No <c>security</c> on an operation means the contract default (a bearer token); an empty list means none.</summary>
    private static Authentication AuthenticationOf(JsonNode? security) => security switch
    {
        null => Authentication.Bearer,
        JsonArray { Count: 0 } => Authentication.None,
        JsonArray list when list.Any(s => s is JsonObject o && o.ContainsKey("testControlKey")) => Authentication.TestControlKey,
        _ => Authentication.Bearer,
    };

    /// <summary>
    /// The JSON body schema the contract gives an operation's response with this status, or null when it has none (a 204,
    /// or a response without a JSON body). Responses may be references to <c>#/components/responses</c>.
    /// </summary>
    public JsonSchema? ResponseSchema(string operationId, int status)
    {
        foreach (var (_, item) in _contract["paths"]!.AsObject())
        foreach (var method in Methods)
        {
            var op = item![method];
            if (op?["operationId"]?.GetValue<string>() != operationId) continue;
            var response = op["responses"]?[status.ToString(System.Globalization.CultureInfo.InvariantCulture)];
            if (response is null) return null;
            var schema = Resolve(response)["content"]?.AsObject()
                .Where(c => c.Key is "application/json" or "application/problem+json")
                .Select(c => c.Value?["schema"]).FirstOrDefault(s => s is not null);
            return schema is null ? null : Schema(schema);
        }
        return null;
    }

    private JsonNode Resolve(JsonNode node)
    {
        var reference = node["$ref"]?.GetValue<string>();
        if (reference is null) return node;
        return reference.TrimStart('#', '/').Split('/').Aggregate(_contract, (n, key) => n[key]!)!;
    }

    /// <summary>An inline schema (a parameter's or a body's), declared as 2020-12 like the $defs document.</summary>
    private JsonSchema Schema(JsonNode? node)
    {
        if (node is null) return JsonSchema.True;
        var copy = JsonNode.Parse(Rewrite(node.ToJsonString()))!.AsObject();
        copy["$schema"] ??= Draft202012;
        return JsonSchema.FromText(copy.ToJsonString(), _build);
    }

    /// <summary>The JSON type a parameter's string value is read as: integer, number, boolean or string.</summary>
    private string ValueTypeOf(JsonNode? schema)
    {
        if (schema is null) return "string";
        var resolved = Resolve(schema);
        var type = resolved["type"];
        if (type is JsonArray types)
            return types.Select(t => t!.GetValue<string>()).FirstOrDefault(t => t != "null") ?? "string";
        return type?.GetValue<string>() ?? "string";
    }

    /// <summary>A component schema of the contract by name, for checks such as a response body against its schema.</summary>
    public JsonSchema ComponentSchema(string name) =>
        JsonSchema.FromText($"{{\"$schema\":\"{Draft202012}\",\"$ref\":\"{BaseUri}#/$defs/{name}\"}}", _build);

    private static string Rewrite(string json) => json.Replace("#/components/schemas/", BaseUri + "#/$defs/");

    /// <summary>Reads a parameter's raw string as the JSON value its schema expects; null when it cannot be read.</summary>
    public static JsonElement? AsJson(string raw, string valueType)
    {
        string? json = valueType switch
        {
            "integer" => long.TryParse(raw, out var i) ? i.ToString() : null,
            "number" => double.TryParse(raw, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var d) ? raw : null,
            "boolean" => raw is "true" or "false" ? raw : null,
            _ => JsonSerializer.Serialize(raw),
        };
        return json is null ? null : JsonDocument.Parse(json).RootElement.Clone();
    }
}
