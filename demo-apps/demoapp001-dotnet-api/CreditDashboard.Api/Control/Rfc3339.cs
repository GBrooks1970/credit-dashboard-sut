using System.Globalization;
using System.Text.RegularExpressions;

namespace CreditDashboard.Api.Control;

/// <summary>
/// RFC 3339 <c>date-time</c>, the contract's <c>format: date-time</c> (CDS-38 A-06): a date, <c>T</c>, a time with seconds,
/// optional fractional seconds, and an offset (<c>Z</c> or <c>+hh:mm</c>). The letters may be either case, as the RFC allows.
/// A date-time with no offset, or with no seconds, is not RFC 3339 and is refused; so is a leap second, which the clock cannot hold.
/// </summary>
public static partial class Rfc3339
{
    // [0-9], not \d (which matches digits of other scripts), and \z, not $ (which also matches before a final newline): R2-A-05.
    [GeneratedRegex(@"^[0-9]{4}-[0-9]{2}-[0-9]{2}[Tt][0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?([Zz]|[+-][0-9]{2}:[0-9]{2})\z")]
    private static partial Regex Shape();

    public static bool TryParse(string? text, out DateTimeOffset value)
    {
        value = default;
        if (text is null || !Shape().IsMatch(text)) return false;
        return DateTimeOffset.TryParse(text.ToUpperInvariant(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out value);
    }
}
