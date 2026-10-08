using System.Text.RegularExpressions;

namespace CreditDashboard.BusinessRules.Profile;

/// <summary>A pending code. <see cref="Verified"/> and <see cref="Voided"/> challenges are no longer pending.</summary>
public sealed record MobileChallenge(DateTimeOffset IssuedAt, int AttemptsRemaining, bool Voided, bool Verified)
{
    public DateTimeOffset ExpiresAt => IssuedAt + Mobile.CodeLifetime;
}

public enum CodeOutcome { Verified, Wrong, Invalid }

/// <summary>
/// The result of submitting a code. <see cref="AttemptsRemaining"/> is set only for <see cref="CodeOutcome.Wrong"/>
/// (spec section 8: <c>code-invalid</c> carries none); <see cref="Challenge"/> is the state to store.
/// </summary>
public sealed record CodeResult(CodeOutcome Outcome, int? AttemptsRemaining, MobileChallenge? Challenge);

/// <summary>PR-06, PR-07 (mobile), PR-10 and PR-11.</summary>
public static partial class Mobile
{
    /// <summary>The demo code is always this (DR-025).</summary>
    public const string Code = "123456";

    public const int Attempts = 3;

    /// <summary>A code is valid while less than this long has passed since issue (PR-10).</summary>
    public static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(10);

    [GeneratedRegex(@"^07[0-9]{9}$")]
    private static partial Regex National();

    [GeneratedRegex(@"^\+447[0-9]{9}$")]
    private static partial Regex International();

    /// <summary>
    /// PR-06: <c>07</c> plus 9 digits, or <c>+447</c> plus 9 digits, stored normalised to <c>+44</c>. Spaces are ignored;
    /// no other separator is. Null means refused (422 <c>mobile-number</c>).
    /// </summary>
    public static string? Normalise(string? submitted)
    {
        var compact = (submitted ?? string.Empty).Replace(" ", string.Empty, StringComparison.Ordinal);
        if (National().IsMatch(compact)) return "+44" + compact[1..];
        return International().IsMatch(compact) ? compact : null;
    }

    /// <summary>PR-07: only the last three digits of the number leave the service.</summary>
    public static string? LastThreeDigits(string? normalised) =>
        string.IsNullOrEmpty(normalised) ? null : normalised[^3..];

    /// <summary>PR-10: a new challenge, with all attempts left, replacing any pending one.</summary>
    public static MobileChallenge Issue(DateTimeOffset now) => new(now, Attempts, false, false);

    /// <summary>
    /// PR-10 and PR-11: the correct code, while less than 10 minutes have passed since issue, verifies the number. A wrong
    /// code is refused with the attempts left; the third wrong code voids the challenge. An expired, voided or verified
    /// challenge, or nothing pending, is invalid.
    /// </summary>
    public static CodeResult Check(MobileChallenge? challenge, string submittedCode, DateTimeOffset now)
    {
        if (challenge is null || challenge.Voided || challenge.Verified) return new(CodeOutcome.Invalid, null, challenge);
        if (now - challenge.IssuedAt >= CodeLifetime) return new(CodeOutcome.Invalid, null, challenge);
        if (submittedCode == Code) return new(CodeOutcome.Verified, null, challenge with { Verified = true });

        var remaining = challenge.AttemptsRemaining - 1;
        return remaining <= 0
            ? new(CodeOutcome.Invalid, null, challenge with { AttemptsRemaining = 0, Voided = true })
            : new(CodeOutcome.Wrong, remaining, challenge with { AttemptsRemaining = remaining });
    }
}

/// <summary>PR-07: the finances tile. The type has no amount, so no figure can leave through it.</summary>
public sealed record FinancesTile(bool Added);

public static class Finances
{
    /// <summary>PR-07: finances report only whether they are added; whatever is stored is never read.</summary>
    public static FinancesTile Tile<T>(T? stored) where T : class => new(stored is not null);
}
