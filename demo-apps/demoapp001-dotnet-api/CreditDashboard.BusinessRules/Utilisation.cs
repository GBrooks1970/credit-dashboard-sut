namespace CreditDashboard.BusinessRules;

/// <summary>The displayed utilisation (floored at 0, BR-06) and the raw value (BR-03); both null without a limit.</summary>
public readonly record struct UtilisationResult(int? Display, int? Raw);

/// <summary>BR-03 and BR-06.</summary>
public static class Utilisation
{
    /// <summary>
    /// BR-03: balance / limit x 100, rounded half up, in integers. "Half up" is half towards positive infinity
    /// (-4.5 gives -4), decided in the CDS-20 plan (D2). A limit of zero or none gives null. No upper bound (DR-013).
    /// </summary>
    public static int? Raw(long balanceMinor, long? limitMinor)
    {
        if (limitMinor is null or 0) return null;
        if (limitMinor < 0) throw new ArgumentOutOfRangeException(nameof(limitMinor), "A limit is never negative.");

        // floor((2 x balance x 100 + limit) / (2 x limit)): add a half, then floor.
        Int128 numerator = (Int128)balanceMinor * 200 + limitMinor.Value;
        Int128 denominator = (Int128)limitMinor.Value * 2;
        return (int)FloorDivide(numerator, denominator);
    }

    /// <summary>BR-06: the displayed value is the raw one floored at 0; the raw value is kept.</summary>
    public static UtilisationResult Resolve(long balanceMinor, long? limitMinor)
    {
        var raw = Raw(balanceMinor, limitMinor);
        return new UtilisationResult(raw is null ? null : Math.Max(0, raw.Value), raw);
    }

    private static Int128 FloorDivide(Int128 numerator, Int128 denominator)
    {
        var (quotient, remainder) = Int128.DivRem(numerator, denominator);
        return remainder != 0 && (remainder < 0) != (denominator < 0) ? quotient - 1 : quotient;
    }
}
