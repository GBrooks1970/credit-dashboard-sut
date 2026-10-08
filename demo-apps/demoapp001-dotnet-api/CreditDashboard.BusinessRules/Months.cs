namespace CreditDashboard.BusinessRules;

/// <summary>A calendar month, compared and stepped without day arithmetic.</summary>
public readonly record struct YearMonth(int Year, int Month) : IComparable<YearMonth>
{
    public static YearMonth From(DateOnly date) => new(date.Year, date.Month);

    /// <summary>Parses <c>2026-05</c>.</summary>
    public static YearMonth Parse(string text)
    {
        var parts = text.Split('-');
        return new YearMonth(int.Parse(parts[0], System.Globalization.CultureInfo.InvariantCulture),
            int.Parse(parts[1], System.Globalization.CultureInfo.InvariantCulture));
    }

    public YearMonth AddMonths(int months)
    {
        var index = Year * 12 + (Month - 1) + months;
        var year = Math.DivRem(index, 12, out var rem);
        return new YearMonth(year, rem + 1);
    }

    public int CompareTo(YearMonth other) => Year != other.Year ? Year.CompareTo(other.Year) : Month.CompareTo(other.Month);

    public static bool operator <(YearMonth a, YearMonth b) => a.CompareTo(b) < 0;
    public static bool operator >(YearMonth a, YearMonth b) => a.CompareTo(b) > 0;
    public static bool operator <=(YearMonth a, YearMonth b) => a.CompareTo(b) <= 0;
    public static bool operator >=(YearMonth a, YearMonth b) => a.CompareTo(b) >= 0;

    public override string ToString() => $"{Year:D4}-{Month:D2}";
}
