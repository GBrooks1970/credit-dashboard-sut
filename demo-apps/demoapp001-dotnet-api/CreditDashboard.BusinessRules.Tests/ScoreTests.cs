using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>BR-01 and BR-02. Cases: DOCS/.design/business-rules-cases.md.</summary>
public class ScoreTests
{
    [TestCase(0, true)]
    [TestCase(1000, true)]
    [TestCase(-1, false)]
    [TestCase(1001, false)]
    [TestCase(612, true)]
    [Category("BR-01")]
    public void A_score_is_an_integer_from_0_to_1000(int score, bool valid) => Assert.That(Scores.IsValid(score), Is.EqualTo(valid));

    private static IReadOnlyDictionary<YearMonth, int> AllKnown(string from, string to)
    {
        var known = new Dictionary<YearMonth, int>();
        for (var m = YearMonth.Parse(from); m <= YearMonth.Parse(to); m = m.AddMonths(1)) known[m] = 500 + m.Month;
        return known;
    }

    private static string[] Months(IEnumerable<ScorePoint> points) => points.Select(p => p.Month.ToString()).ToArray();

    [Test, Category("BR-02")]
    public void Three_months_end_at_the_current_month_oldest_first() =>
        Assert.That(Months(Scores.History(ScoreRange.ThreeMonths, new(2026, 10), AllKnown("2025-01", "2026-12"))),
            Is.EqualTo(new[] { "2026-08", "2026-09", "2026-10" }));

    [Test, Category("BR-02")]
    public void Six_months_run_from_May_to_October() =>
        Assert.That(Months(Scores.History(ScoreRange.SixMonths, new(2026, 10), AllKnown("2025-01", "2026-12"))),
            Is.EqualTo(new[] { "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10" }));

    [Test, Category("BR-02")]
    public void Twelve_months_start_the_November_before()
    {
        var points = Scores.History(ScoreRange.OneYear, new(2026, 10), AllKnown("2025-01", "2026-12"));
        Assert.That(points, Has.Count.EqualTo(12));
        Assert.That(points[0].Month.ToString(), Is.EqualTo("2025-11"));
        Assert.That(points[^1].Month.ToString(), Is.EqualTo("2026-10"));
    }

    [Test, Category("BR-02")]
    public void The_history_crosses_a_year_boundary() =>
        Assert.That(Months(Scores.History(ScoreRange.ThreeMonths, new(2026, 1), AllKnown("2025-01", "2026-12"))),
            Is.EqualTo(new[] { "2025-11", "2025-12", "2026-01" }));

    [Test, Category("BR-02")]
    public void A_gap_in_the_middle_is_null_and_its_neighbours_keep_their_own_scores()
    {
        var known = new Dictionary<YearMonth, int>(AllKnown("2026-05", "2026-07"));
        known.Remove(new YearMonth(2026, 7));
        var points = Scores.History(ScoreRange.SixMonths, new(2026, 8), known);
        var july = points.Single(p => p.Month == new YearMonth(2026, 7));
        Assert.That(july.Score, Is.Null);
        Assert.That(points.Single(p => p.Month == new YearMonth(2026, 6)).Score, Is.EqualTo(506));
        Assert.That(points.Single(p => p.Month == new YearMonth(2026, 8)).Score, Is.Null, "no score for August either");
    }

    [Test, Category("BR-02")]
    public void A_gap_at_the_oldest_end_is_null_and_nothing_is_carried_forward()
    {
        var known = AllKnown("2026-09", "2026-10");
        Assert.That(Scores.History(ScoreRange.ThreeMonths, new(2026, 10), known)[0].Score, Is.Null);
    }

    [Test, Category("BR-02")]
    public void A_gap_at_the_current_month_is_null()
    {
        var known = AllKnown("2026-08", "2026-09");
        Assert.That(Scores.History(ScoreRange.ThreeMonths, new(2026, 10), known)[^1].Score, Is.Null);
    }

    [Test, Category("BR-02")]
    public void Every_month_unknown_gives_three_null_points() =>
        Assert.That(Scores.History(ScoreRange.ThreeMonths, new(2026, 10), new Dictionary<YearMonth, int>()).Select(p => p.Score),
            Is.EqualTo(new int?[] { null, null, null }));

    [TestCase("3m", true)]
    [TestCase("6m", true)]
    [TestCase("1y", true)]
    [TestCase("2m", false)]
    [TestCase("", false)]
    [TestCase(null, false)]
    [Category("BR-02")]
    public void Only_the_three_contract_ranges_are_accepted(string? text, bool accepted) =>
        Assert.That(Scores.TryParseRange(text, out _), Is.EqualTo(accepted));
}
