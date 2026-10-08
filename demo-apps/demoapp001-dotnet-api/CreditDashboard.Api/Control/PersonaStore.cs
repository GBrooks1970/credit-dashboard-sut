using System.Text.Json.Nodes;

namespace CreditDashboard.Api.Control;

/// <summary>The latency test control sets: nothing, a fixed delay, or a random one in a range (milliseconds).</summary>
public sealed record LatencySetting(int? FixedMs, int? MinMs, int? MaxMs)
{
    public static readonly LatencySetting None = new(null, null, null);

    public int NextDelayMs() =>
        FixedMs ?? (MinMs is { } min && MaxMs is { } max ? Random.Shared.Next(min, max + 1) : 0);

    public JsonObject ToJson()
    {
        var json = new JsonObject();
        if (FixedMs is { } fixedMs) json["fixedMs"] = fixedMs;
        if (MinMs is { } min) json["minMs"] = min;
        if (MaxMs is { } max) json["maxMs"] = max;
        return json;
    }
}

/// <summary>
/// The in-memory store (API specification 6.5, CDS-21): each test user's bound persona and overrides, the active bug
/// flags, the controlled clock, the latency and the users whose email test control marked verified. One lock guards
/// the lot; the loaded fixtures are never changed, so reads of them need none.
/// </summary>
public sealed class PersonaStore
{
    private readonly object _lock = new();
    private readonly ControlledClock _clock;
    private Dictionary<string, (string Persona, JsonObject? Overrides)> _bindings = [];
    private List<string> _flags = [];
    private LatencySetting _latency = LatencySetting.None;
    private HashSet<string> _verifiedEmails = [];
    private Dictionary<string, UserSession> _sessions = [];

    public PersonaStore(FixtureSet fixtures, ControlledClock clock)
    {
        Fixtures = fixtures;
        _clock = clock;
        Reset();
    }

    public FixtureSet Fixtures { get; }

    public LatencySetting Latency { get { lock (_lock) return _latency; } }

    public TestUser? FindUser(string username) => Fixtures.Users.FirstOrDefault(u => u.Username == username);

    /// <summary>POST /__test/reset: rebind every user to their default persona, and clear the flags, the clock, the latency and the verified emails.</summary>
    public void Reset()
    {
        lock (_lock)
        {
            _bindings = Fixtures.Users.ToDictionary(u => u.Username, u => (u.DefaultPersona, (JsonObject?)null));
            _flags = [];
            _latency = LatencySetting.None;
            _verifiedEmails = [];
            _sessions = [];
            _clock.Release();
        }
    }

    public void Bind(string username, string persona, JsonObject? overrides)
    {
        lock (_lock)
        {
            _bindings[username] = (persona, overrides is null ? null : (JsonObject)overrides.DeepClone());
            _sessions.Remove(username); // a new persona is a clean start (decision brief 9 D8)
        }
    }

    public void SetFlags(IEnumerable<string> flags)
    {
        lock (_lock) _flags = flags.Distinct().ToList();
    }

    public void SetClock(DateTimeOffset now)
    {
        lock (_lock) _clock.Freeze(now);
    }

    public void SetLatency(LatencySetting latency)
    {
        lock (_lock) _latency = latency;
    }

    public void MarkEmailVerified(string username)
    {
        lock (_lock) _verifiedEmails.Add(username);
    }

    /// <summary>This user session state (created on first use).</summary>
    public UserSession Session(string username)
    {
        lock (_lock)
        {
            if (!_sessions.TryGetValue(username, out var session)) _sessions[username] = session = new UserSession();
            return session;
        }
    }

    /// <summary>The delay the bound persona adds to every authenticated operation (persona slow), in milliseconds.</summary>
    public int PersonaLatencyMs(string username)
    {
        string persona;
        lock (_lock) persona = _bindings[username].Persona;
        return Fixtures.Personas[persona]["behaviour"]?["latencyMs"]?.GetValue<int>() ?? 0;
    }

    public bool IsEmailMarkedVerified(string username)
    {
        lock (_lock) return _verifiedEmails.Contains(username);
    }

    /// <summary>The bound persona document for this user with their overrides applied (a clone; CDS-25 reads this).</summary>
    public JsonObject Document(string username)
    {
        (string Persona, JsonObject? Overrides) binding;
        lock (_lock) binding = _bindings[username];
        var document = (JsonObject)Fixtures.Personas[binding.Persona].DeepClone();
        if (binding.Overrides is not null) Merge(document, binding.Overrides, out _);
        return document;
    }

    /// <summary>
    /// Applies overrides to a persona document (DR-020): each list named for a bureau replaces that bureau list.
    /// <paramref name="unknownBureau"/> is the first bureau ID the persona does not have, if any.
    /// </summary>
    public static void Merge(JsonObject persona, JsonObject overrides, out string? unknownBureau)
    {
        unknownBureau = null;
        var bureaux = persona["bureaux"]!.AsArray();
        foreach (var over in overrides["bureaux"]!.AsArray().Select(o => o!.AsObject()))
        {
            var id = over["id"]!.GetValue<string>();
            var bureau = bureaux.Select(b => b!.AsObject()).FirstOrDefault(b => b["id"]!.GetValue<string>() == id);
            if (bureau is null) { unknownBureau ??= id; continue; }
            foreach (var list in new[] { "accounts", "changes", "searches" })
                if (over[list] is { } replacement) bureau[list] = replacement.DeepClone();
        }
    }

    /// <summary>GET /__test/state.</summary>
    public JsonObject Snapshot()
    {
        lock (_lock)
        {
            var personas = new JsonObject();
            var overridden = new JsonObject();
            foreach (var (username, binding) in _bindings)
            {
                personas[username] = binding.Persona;
                overridden[username] = binding.Overrides is not null;
            }
            return new JsonObject
            {
                ["personas"] = personas,
                ["overridden"] = overridden,
                ["flags"] = new JsonArray(_flags.Select(f => (JsonNode)JsonValue.Create(f)!).ToArray()),
                ["now"] = _clock.Frozen is { } now ? now.ToString("yyyy-MM-dd\\THH:mm:ss.FFFFFFF\\Z") : null,
                ["latency"] = _latency.ToJson(),
            };
        }
    }
}
