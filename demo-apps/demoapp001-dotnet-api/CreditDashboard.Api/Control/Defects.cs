using System.Text.Json.Nodes;
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

    /// <summary>BR-05. With <c>excluded-in-total</c> a loan the bureau marks as left out of the totals is counted in them.</summary>
    public static bool IncludedInTotals(bool stored) => stored || Flags.Has("excluded-in-total");

    /// <summary>BR-02. With <c>history-carry-forward</c> a month with no score takes the previous month's score instead of staying missing.</summary>
    public static IReadOnlyList<ScorePoint> ScoreHistory(IReadOnlyList<ScorePoint> points)
    {
        if (!Flags.Has("history-carry-forward")) return points;
        int? last = null;
        return points.Select(p => new ScorePoint(p.Month, last = p.Score ?? last)).ToList();
    }

    /// <summary>BR-09. With <c>mask-format</c> an account whose source number is known returns it whole instead of its mask.</summary>
    public static string MaskedNumber(JsonObject account) =>
        Flags.Has("mask-format") && account["sourceMask"] is { } source ? source.GetValue<string>() : account["maskedNumber"]!.GetValue<string>();

    /// <summary>DR-004. With <c>currency-float</c> money leaves the service as a float of pounds (4236 pence as 42.36) instead of integer minor units.</summary>
    public static JsonNode Amount(long amountMinor) =>
        Flags.Has("currency-float") ? JsonValue.Create(amountMinor / 100.0) : JsonValue.Create(amountMinor);
}
