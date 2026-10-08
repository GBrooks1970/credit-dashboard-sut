namespace CreditDashboard.Api.Control;

/// <summary>
/// Test control is off unless <c>TEST_CONTROL=true</c>, and then needs <c>TEST_CONTROL_KEY</c> (DR-008, CDS-21 plan D1).
/// There is no default key: a service started with test control on and no key refuses to start.
/// </summary>
public sealed record TestControlOptions(bool Enabled, string? Key)
{
    public static TestControlOptions From(IConfiguration configuration)
    {
        var enabled = string.Equals(configuration["TEST_CONTROL"], "true", StringComparison.OrdinalIgnoreCase);
        var key = configuration["TEST_CONTROL_KEY"];
        if (enabled && string.IsNullOrEmpty(key))
            throw new InvalidOperationException("TEST_CONTROL=true needs TEST_CONTROL_KEY; there is no default key.");
        return new TestControlOptions(enabled, enabled ? key : null);
    }
}
