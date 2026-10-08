namespace CreditDashboard.BusinessRules.Profile;

public enum EmailStatus { Unverified, Verified }

/// <summary>The email after a submission. <see cref="LinkSent"/> is true only when the address changed.</summary>
public sealed record EmailChangeResult(bool Changed, string Address, EmailStatus Status, bool LinkSent);

public enum ResendOutcome { Sent, AlreadyVerified, RateLimited }

/// <summary><see cref="RetryAfterSeconds"/> is set only when <see cref="Outcome"/> is <see cref="ResendOutcome.RateLimited"/>.</summary>
public readonly record struct ResendResult(ResendOutcome Outcome, int? RetryAfterSeconds);

/// <summary>PR-04 and PR-09.</summary>
public static class Email
{
    /// <summary>The wait between verification links, on the controlled clock (PR-09).</summary>
    public static readonly TimeSpan ResendInterval = TimeSpan.FromSeconds(60);

    /// <summary>
    /// PR-04 and DR-027: a different address is stored as unverified and a link is sent; the address already held is
    /// not a change, so address and status are kept. The submitted value is trimmed and compared without regard to case.
    /// </summary>
    public static EmailChangeResult Change(string? storedAddress, EmailStatus storedStatus, string submitted)
    {
        var address = submitted.Trim();
        return storedAddress is not null && string.Equals(storedAddress, address, StringComparison.OrdinalIgnoreCase)
            ? new EmailChangeResult(false, storedAddress, storedStatus, false)
            : new EmailChangeResult(true, address, EmailStatus.Unverified, true);
    }

    /// <summary>
    /// PR-09 and DR-024: a verified email is not resent; otherwise a link may be resent once 60 seconds have passed
    /// since the last was sent. Sooner is refused (429) with the seconds to wait, measured from the last send even if
    /// the controlled clock was moved back.
    /// </summary>
    public static ResendResult Resend(EmailStatus status, DateTimeOffset? lastSent, DateTimeOffset now)
    {
        if (status == EmailStatus.Verified) return new(ResendOutcome.AlreadyVerified, null);
        if (lastSent is null) return new(ResendOutcome.Sent, null);
        var elapsed = now - lastSent.Value;
        if (elapsed >= ResendInterval) return new(ResendOutcome.Sent, null);
        return new(ResendOutcome.RateLimited, (int)Math.Ceiling((ResendInterval - elapsed).TotalSeconds));
    }
}
