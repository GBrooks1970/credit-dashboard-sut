namespace CreditDashboard.Api.Control;

/// <summary>
/// The controlled clock (API specification 6.5): real time until test control freezes it, and again after a reset.
/// Callers derive the UTC date from <see cref="UtcNow"/> and pass it to the rules, which have no clock of their own.
/// </summary>
public interface IControlledClock
{
    DateTimeOffset UtcNow { get; }

    /// <summary>The frozen instant, or null while the clock follows real time.</summary>
    DateTimeOffset? Frozen { get; }
}

public sealed class ControlledClock(TimeProvider real) : IControlledClock
{
    // A reference, not a nullable struct: a nullable DateTimeOffset is read in two parts (its flag and its value), so a
    // reader racing a write could see a frozen flag with the old value. A reference is read and replaced whole (CDS-38 A-18).
    private sealed record Instant(DateTimeOffset Value);

    private volatile Instant? _frozen;

    public DateTimeOffset UtcNow => _frozen?.Value ?? real.GetUtcNow();

    public DateTimeOffset? Frozen => _frozen?.Value;

    public void Freeze(DateTimeOffset now) => _frozen = new Instant(now.ToUniversalTime());

    public void Release() => _frozen = null;
}
