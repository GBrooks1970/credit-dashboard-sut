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
    private DateTimeOffset? _frozen;

    public DateTimeOffset UtcNow => _frozen ?? real.GetUtcNow();

    public DateTimeOffset? Frozen => _frozen;

    public void Freeze(DateTimeOffset now) => _frozen = now.ToUniversalTime();

    public void Release() => _frozen = null;
}
