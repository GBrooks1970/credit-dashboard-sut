namespace CreditDashboard.BusinessRules;

/// <summary>BR-08.</summary>
public static class Refresh
{
    /// <summary>BR-08: whole days until the bureau's next refresh date, minimum 0.</summary>
    public static int DaysUntil(DateOnly today, DateOnly nextRefreshDate) => Math.Max(0, nextRefreshDate.DayNumber - today.DayNumber);
}

/// <summary>BR-09.</summary>
public static class Masking
{
    /// <summary>
    /// BR-09: <c>*</c> followed by the last four characters of the source once every character other than ASCII letters
    /// and digits is removed, uppercased, left-padded with <c>0</c> to four (the pattern <c>^\*[A-Z0-9]{4}$</c>).
    /// </summary>
    public static string Mask(string? source)
    {
        var kept = new string((source ?? string.Empty)
            .Where(c => c is (>= 'A' and <= 'Z') or (>= 'a' and <= 'z') or (>= '0' and <= '9'))
            .ToArray()).ToUpperInvariant();
        var lastFour = kept.Length > 4 ? kept[^4..] : kept;
        return "*" + lastFour.PadLeft(4, '0');
    }
}

public enum FeedbackValue { Like, Dislike, None }

/// <summary>BR-10.</summary>
public static class SummaryFeedback
{
    /// <summary>BR-10: the contract's values are <c>like</c>, <c>dislike</c> and <c>none</c>.</summary>
    public static bool TryParse(string? text, out FeedbackValue value)
    {
        (var ok, value) = text switch
        {
            "like" => (true, FeedbackValue.Like),
            "dislike" => (true, FeedbackValue.Dislike),
            "none" => (true, FeedbackValue.None),
            _ => (false, default(FeedbackValue)),
        };
        return ok;
    }

    /// <summary>BR-10: setting one value replaces whatever was stored, including the opposite one.</summary>
    public static FeedbackValue Set(FeedbackValue stored, FeedbackValue requested) => requested;
}

/// <summary>BR-11.</summary>
public static class Changes
{
    /// <summary>BR-11: newest first. Changes on one date keep their original order (a stable sort).</summary>
    public static IReadOnlyList<T> NewestFirst<T>(IEnumerable<T> changes, Func<T, DateOnly> dateOf) =>
        changes.OrderByDescending(dateOf).ToList();

    /// <summary>BR-11: the overview embeds the 3 newest as <c>recentChanges</c>; <c>changesTotal</c> is the full count.</summary>
    public static (IReadOnlyList<T> Recent, int Total) Overview<T>(IEnumerable<T> changes, Func<T, DateOnly> dateOf)
    {
        var all = NewestFirst(changes, dateOf);
        return (all.Take(3).ToList(), all.Count);
    }
}
