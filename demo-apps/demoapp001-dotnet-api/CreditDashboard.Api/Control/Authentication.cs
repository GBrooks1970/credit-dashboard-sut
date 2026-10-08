using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json.Nodes;
using CreditDashboard.BusinessRules.Profile;

namespace CreditDashboard.Api.Control;

/// <summary>
/// Token settings (API specification section 3, DR-055): <c>TOKEN_LIFETIME_MINUTES</c>, default 60, whole minutes from 1 to
/// 1,440. Any other value stops the service starting.
/// </summary>
public sealed record AuthOptions(TimeSpan TokenLifetime)
{
    public const int DefaultMinutes = 60;

    public static AuthOptions From(IConfiguration configuration)
    {
        var text = configuration["TOKEN_LIFETIME_MINUTES"];
        if (string.IsNullOrWhiteSpace(text)) return new AuthOptions(TimeSpan.FromMinutes(DefaultMinutes));
        if (!int.TryParse(text, NumberStyles.None, CultureInfo.InvariantCulture, out var minutes) || minutes is < 1 or > 1440)
            throw new InvalidOperationException("TOKEN_LIFETIME_MINUTES must be a whole number of minutes from 1 to 1440.");
        return new AuthOptions(TimeSpan.FromMinutes(minutes));
    }
}

/// <summary>
/// The bearer tokens <c>login</c> has issued. A token is valid until its <c>expiresAt</c> on the controlled clock (so a
/// frozen clock never expires it, and moving the clock to or past it does) or until <c>logout</c> revokes it. A reset does
/// not touch tokens.
/// </summary>
public sealed class TokenStore(IControlledClock clock, AuthOptions options)
{
    private readonly object _lock = new();
    private readonly Dictionary<string, (string Username, DateTimeOffset ExpiresAt)> _tokens = [];

    public (string Token, DateTimeOffset ExpiresAt) Issue(string username)
    {
        var token = "tok_" + Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        var expiresAt = clock.UtcNow + options.TokenLifetime;
        lock (_lock) _tokens[token] = (username, expiresAt);
        return (token, expiresAt);
    }

    /// <summary>The user the token belongs to, or null when it is unknown, revoked, or at or after its expiry.</summary>
    public string? Validate(string token)
    {
        lock (_lock)
            return _tokens.TryGetValue(token, out var entry) && clock.UtcNow < entry.ExpiresAt ? entry.Username : null;
    }

    public void Revoke(string token)
    {
        lock (_lock) _tokens.Remove(token);
    }

    /// <summary>The token in an <c>Authorization: Bearer</c> header, or null.</summary>
    public static string? FromHeader(string? authorization)
    {
        const string scheme = "Bearer ";
        return authorization is not null && authorization.StartsWith(scheme, StringComparison.OrdinalIgnoreCase)
            && authorization[scheme.Length..].Trim() is { Length: > 0 } token ? token : null;
    }
}

/// <summary>
/// What one user has changed in this session (decision brief 9 D8): cleared when test control binds a persona to the
/// user, and for everyone by a reset. Later slices add the other edits; S1 holds the preferred name, which the greeting reads.
/// </summary>
public sealed class UserSession
{
    private readonly object _lock = new();
    private bool _preferredNameEdited;
    private string? _preferredName;
    private readonly Dictionary<string, CreditDashboard.BusinessRules.FeedbackValue> _feedback = [];
    private readonly Dictionary<string, Dictionary<string, JsonNode?>> _details = [];
    private readonly Dictionary<string, bool> _notificationRead = [];
    private string? _emailAddress;
    private EmailStatus? _emailStatus;
    private DateTimeOffset? _linkSentAt;
    private MobileState? _mobile;

    public void SetPreferredName(string? name)
    {
        lock (_lock) { _preferredNameEdited = true; _preferredName = name; }
    }

    /// <summary>Records an edit to one account detail (BR-14); a null value clears the field.</summary>
    public void SetDetail(string accountId, string field, JsonNode? value)
    {
        lock (_lock)
        {
            if (!_details.TryGetValue(accountId, out var edits)) _details[accountId] = edits = [];
            edits[field] = value?.DeepClone();
        }
    }

    /// <summary>The account details with this session edits applied over the stored ones (a new object).</summary>
    public JsonObject DetailsOf(string accountId, JsonObject stored)
    {
        var details = (JsonObject)stored.DeepClone();
        lock (_lock)
            if (_details.TryGetValue(accountId, out var edits))
                foreach (var (field, value) in edits) details[field] = value?.DeepClone();
        return details;
    }

    public void SetNotificationRead(string notificationId, bool read)
    {
        lock (_lock) _notificationRead[notificationId] = read;
    }

    /// <summary>Whether a notification is read: this session change when there is one, otherwise the stored flag.</summary>
    public bool NotificationReadOr(string notificationId, bool stored)
    {
        lock (_lock) return _notificationRead.TryGetValue(notificationId, out var read) ? read : stored;
    }

    /// <summary>The email this session: an edit when there is one, otherwise the stored address and status; and when a link was last sent.</summary>
    public (string Address, EmailStatus Status, DateTimeOffset? LinkSentAt) Email(string storedAddress, EmailStatus storedStatus)
    {
        lock (_lock) return (_emailAddress ?? storedAddress, _emailStatus ?? storedStatus, _linkSentAt);
    }

    public void SetEmail(string address, EmailStatus status, DateTimeOffset? linkSentAt)
    {
        lock (_lock) { _emailAddress = address; _emailStatus = status; _linkSentAt = linkSentAt; }
    }

    /// <summary>Test control marks the email verified without the link (PR-04).</summary>
    public void MarkEmailVerified()
    {
        lock (_lock) _emailStatus = EmailStatus.Verified;
    }

    public void SetLinkSent(DateTimeOffset at)
    {
        lock (_lock) _linkSentAt = at;
    }

    /// <summary>The mobile this session when the user has added one; null until then (the stored contact is read instead).</summary>
    public MobileState? Mobile
    {
        get { lock (_lock) return _mobile; }
        set { lock (_lock) _mobile = value; }
    }

    public void SetFeedback(string bureauId, CreditDashboard.BusinessRules.FeedbackValue value)
    {
        lock (_lock) _feedback[bureauId] = value;
    }

    /// <summary>The user feedback on a bureau summary (BR-10) when they have set one this session; otherwise the stored one.</summary>
    public CreditDashboard.BusinessRules.FeedbackValue FeedbackOr(string bureauId, CreditDashboard.BusinessRules.FeedbackValue stored)
    {
        lock (_lock) return _feedback.TryGetValue(bureauId, out var value) ? value : stored;
    }

    /// <summary>The edited preferred name when there is one (null clears it); otherwise the stored one.</summary>
    public string? PreferredNameOr(string? stored)
    {
        lock (_lock) return _preferredNameEdited ? _preferredName : stored;
    }
}

/// <summary>A mobile number the user added this session: its last three digits, whether it is verified, and the pending code (PR-06, PR-10, PR-11).</summary>
public sealed record MobileState(string LastDigits, bool Verified, MobileChallenge? Challenge);
