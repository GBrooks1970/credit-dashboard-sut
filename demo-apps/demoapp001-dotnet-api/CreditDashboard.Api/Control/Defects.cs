using System.Text.Json.Nodes;
using CreditDashboard.BusinessRules;
using CreditDashboard.BusinessRules.Profile;

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

    /// <summary>
    /// PR-02. With <c>preferred-no-trim</c> a name that is allowed keeps the spaces the customer typed around it. The name is validated as
    /// before; what changes is what is kept (CDS-42).
    /// </summary>
    public static string? PreferredName(string? submitted, string? validated) => validated is not null && Flags.Has("preferred-no-trim") ? submitted : validated;

    /// <summary>
    /// PR-04. With <c>email-stays-verified</c> an email address that has changed keeps the status the old address had, instead of going
    /// back to unverified (CDS-42).
    /// </summary>
    public static EmailStatus EmailStatusAfterChange(EmailStatus before, EmailChangeResult result) =>
        result.Changed && Flags.Has("email-stays-verified") ? before : result.Status;

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

    /// <summary>
    /// DR-004. With <c>currency-float</c> every money amount in a response (an object with <c>amountMinor</c> and <c>currency</c>) leaves
    /// the service as a float of pounds (4236 pence as 42.36) instead of integer minor units. It is applied once, where a response is
    /// written, so no amount can be missed (CDS-38 A-09); the body is copied first, because some bodies share stored data.
    /// </summary>
    public static JsonNode MoneyForResponse(JsonNode body)
    {
        if (!Flags.Has("currency-float")) return body;
        var copy = body.DeepClone();
        Floatify(copy);
        return copy;
    }

    private static void Floatify(JsonNode? node)
    {
        switch (node)
        {
            case JsonObject obj:
                if (obj["amountMinor"] is JsonValue amount && obj.ContainsKey("currency") && amount.TryGetValue<long>(out var minor))
                    obj["amountMinor"] = JsonValue.Create(minor / 100.0);
                foreach (var (_, child) in obj.ToList()) Floatify(child);
                break;
            case JsonArray array:
                foreach (var child in array) Floatify(child);
                break;
        }
    }
}
