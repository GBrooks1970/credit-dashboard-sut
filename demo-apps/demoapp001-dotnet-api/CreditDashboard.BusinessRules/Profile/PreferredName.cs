namespace CreditDashboard.BusinessRules.Profile;

public enum PreferredNameOutcome { Cleared, Saved, Rejected }

/// <summary><see cref="Value"/> is the stored name when <see cref="Outcome"/> is <see cref="PreferredNameOutcome.Saved"/>.</summary>
public readonly record struct PreferredNameResult(PreferredNameOutcome Outcome, string? Value);

/// <summary>PR-02 and PR-03.</summary>
public static class PreferredName
{
    private const int MaxLength = 30;

    /// <summary>
    /// PR-02: trimmed first; empty or null clears it; otherwise 1 to 30 characters, each a letter, space, hyphen or
    /// apostrophe. A violation is a 422 <c>preferred-name</c>.
    /// </summary>
    public static PreferredNameResult Validate(string? submitted)
    {
        var trimmed = submitted?.Trim() ?? string.Empty;
        if (trimmed.Length == 0) return new(PreferredNameOutcome.Cleared, null);
        if (trimmed.Length > MaxLength || !trimmed.All(c => char.IsLetter(c) || c is ' ' or '-' or '\''))
            return new(PreferredNameOutcome.Rejected, null);
        return new(PreferredNameOutcome.Saved, trimmed);
    }

    /// <summary>
    /// PR-03: the preferred name replaces the legal first name in greetings (<c>greetingName</c>, DR-036). The legal
    /// first name is the text before the first space.
    /// </summary>
    public static string GreetingName(string? preferredName, string legalName) =>
        !string.IsNullOrEmpty(preferredName) ? preferredName : legalName.Trim().Split(' ', 2)[0];
}
