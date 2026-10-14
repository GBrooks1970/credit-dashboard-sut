using CreditDashboard.BusinessRules;

namespace CreditDashboard.Api.Control;

/// <summary>
/// Where a bug flag changes what a rule's result looks like to a caller (decision brief 13). The BusinessRules library stays
/// correct and its tests stay the same; a defect is a different call site, switched on by test control and nothing else.
/// </summary>
public static class Defects
{
    /// <summary>BR-03 and BR-06. With <c>rounding-down</c> the percentage is cut off instead of rounded half up (49.5% shows 49).</summary>
    public static UtilisationResult Utilisation(long balanceMinor, long? limitMinor)
    {
        if (!Flags.Has("rounding-down")) return BusinessRules.Utilisation.Resolve(balanceMinor, limitMinor);
        if (limitMinor is null or 0) return new UtilisationResult(null, null);
        var raw = (int)((Int128)balanceMinor * 100 / limitMinor.Value); // integer division truncates towards zero
        return new UtilisationResult(Math.Max(0, raw), raw);
    }
}
