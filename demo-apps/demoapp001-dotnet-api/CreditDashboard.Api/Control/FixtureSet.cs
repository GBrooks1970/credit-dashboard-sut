using System.Text.Json;
using System.Text.Json.Nodes;

namespace CreditDashboard.Api.Control;

/// <summary>A test user from <c>fixtures/users.json</c> (synthetic, DR-010).</summary>
public sealed record TestUser(
    string Username, string Password, string Id, string DisplayName, string LegalName, string DateOfBirth, string Email, string DefaultPersona);

/// <summary>
/// The persona fixtures and test users, read once from the <c>Fixtures/</c> folder the build copies from the repository's
/// <c>fixtures/</c> (CDS-21 plan D3). The documents are never mutated: callers clone what they change.
/// </summary>
public sealed class FixtureSet
{
    public IReadOnlyDictionary<string, JsonObject> Personas { get; }
    public IReadOnlyList<TestUser> Users { get; }

    /// <summary>Which persona file owns each account ID (BR-15: an ID is used once across all personas).</summary>
    public IReadOnlyDictionary<string, string> AccountOwners { get; }

    private FixtureSet(Dictionary<string, JsonObject> personas, List<TestUser> users)
    {
        Personas = personas;
        Users = users;
        AccountOwners = personas
            .SelectMany(p => p.Value["bureaux"]!.AsArray().SelectMany(b => b!["accounts"]!.AsArray().Select(a => (Id: a!["id"]!.GetValue<string>(), Persona: p.Key))))
            .ToDictionary(x => x.Id, x => x.Persona);
    }

    public static FixtureSet Load(string folder)
    {
        var personas = Directory.GetFiles(Path.Combine(folder, "personas"), "*.json").Order()
            .ToDictionary(f => Path.GetFileNameWithoutExtension(f)!, f => JsonNode.Parse(File.ReadAllText(f))!.AsObject());
        var users = JsonNode.Parse(File.ReadAllText(Path.Combine(folder, "users.json")))!["users"]!.AsArray()
            .Select(u => new TestUser(
                u!["username"]!.GetValue<string>(), u["password"]!.GetValue<string>(), u["id"]!.GetValue<string>(),
                u["displayName"]!.GetValue<string>(), u["legalName"]!.GetValue<string>(), u["dateOfBirth"]!.GetValue<string>(),
                u["email"]!.GetValue<string>(), u["defaultPersona"]!.GetValue<string>()))
            .ToList();
        return new FixtureSet(personas, users);
    }

    public static FixtureSet LoadDefault() => Load(Path.Combine(AppContext.BaseDirectory, "Fixtures"));
}
