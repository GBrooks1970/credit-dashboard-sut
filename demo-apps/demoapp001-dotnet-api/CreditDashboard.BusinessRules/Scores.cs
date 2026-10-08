namespace CreditDashboard.BusinessRules;

/// <summary>The range a score history covers (BR-02).</summary>
public enum ScoreRange { ThreeMonths = 3, SixMonths = 6, OneYear = 12 }

/// <summary>One monthly point; <see cref="Score"/> is null when the month has no score.</summary>
public readonly record struct ScorePoint(YearMonth Month, int? Score);

/// <summary>BR-01 and BR-02.</summary>
public static class Scores
{
    /// <summary>BR-01: a score or benchmark is an integer 0 to 1000.</summary>
    public static bool IsValid(int score) => score is >= 0 and <= 1000;

    /// <summary>The contract's range values: <c>3m</c>, <c>6m</c>, <c>1y</c>.</summary>
    public static bool TryParseRange(string? text, out ScoreRange range)
    {
        (var ok, range) = text switch
        {
            "3m" => (true, ScoreRange.ThreeMonths),
            "6m" => (true, ScoreRange.SixMonths),
            "1y" => (true, ScoreRange.OneYear),
            _ => (false, default(ScoreRange)),
        };
        return ok;
    }

    /// <summary>
    /// BR-02: 3, 6 or 12 monthly points, oldest first, ending at the current month. A month with no known score is
    /// null, never the previous score carried forward.
    /// </summary>
    public static IReadOnlyList<ScorePoint> History(ScoreRange range, YearMonth current, IReadOnlyDictionary<YearMonth, int> known)
    {
        var count = (int)range;
        return Enumerable.Range(0, count)
            .Select(i => current.AddMonths(i - (count - 1)))
            .Select(month => new ScorePoint(month, known.TryGetValue(month, out var score) ? score : null))
            .ToList();
    }
}
