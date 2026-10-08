using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>BR-08, BR-09, BR-10, BR-11 and BR-14.</summary>
public class ReportTests
{
    [TestCase("2026-10-03", "2026-10-03", 0)]
    [TestCase("2026-10-03", "2026-10-04", 1)]
    [TestCase("2026-10-05", "2026-10-03", 0)]
    [TestCase("2026-10-03", "2026-11-02", 30)]
    [TestCase("2028-02-28", "2028-03-01", 2)]
    [TestCase("2026-12-31", "2027-01-01", 1)]
    [Category("BR-08")]
    public void Days_until_the_next_refresh_are_whole_and_never_negative(string today, string refresh, int days) =>
        Assert.That(Refresh.DaysUntil(DateOnly.Parse(today), DateOnly.Parse(refresh)), Is.EqualTo(days));

    [TestCase("4821", "*4821")]
    [TestCase("1234-5678-9012-4821", "*4821")]
    [TestCase("ab3f", "*AB3F")]
    [TestCase("aB12", "*AB12")]
    [TestCase("12", "*0012")]
    [TestCase("", "*0000")]
    [TestCase("----", "*0000")]
    [TestCase("**10", "*0010")]
    [TestCase("12 34", "*1234")]
    [TestCase("a", "*000A")]
    [TestCase("abcde", "*BCDE")]
    [TestCase("é1234", "*1234")]
    [Category("BR-09")]
    public void A_mask_is_a_star_and_the_last_four_letters_or_digits(string source, string expected)
    {
        Assert.That(Masking.Mask(source), Is.EqualTo(expected));
        Assert.That(expected, Does.Match(@"^\*[A-Z0-9]{4}$"));
    }

    [TestCase(FeedbackValue.None, "like", FeedbackValue.Like)]
    [TestCase(FeedbackValue.Like, "dislike", FeedbackValue.Dislike)]
    [TestCase(FeedbackValue.Dislike, "like", FeedbackValue.Like)]
    [TestCase(FeedbackValue.Like, "none", FeedbackValue.None)]
    [TestCase(FeedbackValue.Like, "like", FeedbackValue.Like)]
    [Category("BR-10")]
    public void Setting_one_value_replaces_the_other(FeedbackValue stored, string requested, FeedbackValue expected)
    {
        Assert.That(SummaryFeedback.TryParse(requested, out var parsed), Is.True);
        Assert.That(SummaryFeedback.Set(stored, parsed), Is.EqualTo(expected));
    }

    [Test, Category("BR-10")]
    public void A_value_outside_the_three_is_rejected() => Assert.That(SummaryFeedback.TryParse("love", out _), Is.False);

    private sealed record Change(string Id, string Date);

    private static Change[] Dated(params string[] dates) => dates.Select((d, i) => new Change($"chg_{i}", d)).ToArray();

    private static DateOnly DateOf(Change c) => DateOnly.Parse(c.Date);

    [Test, Category("BR-11")]
    public void Changes_already_newest_first_stay_in_order() =>
        Assert.That(Changes.NewestFirst(Dated("2026-09-28", "2026-09-10", "2026-08-01"), DateOf).Select(c => c.Id), Is.EqualTo(new[] { "chg_0", "chg_1", "chg_2" }));

    [Test, Category("BR-11")]
    public void Unsorted_changes_are_sorted_newest_first() =>
        Assert.That(Changes.NewestFirst(Dated("2026-08-01", "2026-09-28", "2026-09-10"), DateOf).Select(c => c.Id), Is.EqualTo(new[] { "chg_1", "chg_2", "chg_0" }));

    [Test, Category("BR-11")]
    public void The_overview_of_many_embeds_the_three_newest_and_the_full_count()
    {
        var many = Enumerable.Range(1, 25).Select(i => new Change($"chg_{i}", new DateOnly(2026, 1, 1).AddDays(i).ToString("yyyy-MM-dd"))).ToArray();
        var (recent, total) = Changes.Overview(many, DateOf);
        Assert.That(recent.Select(c => c.Id), Is.EqualTo(new[] { "chg_25", "chg_24", "chg_23" }));
        Assert.That(total, Is.EqualTo(25));
    }

    [Test, Category("BR-11")]
    public void The_overview_of_two_embeds_both()
    {
        var (recent, total) = Changes.Overview(Dated("2026-09-01", "2026-09-02"), DateOf);
        Assert.That((recent.Count, total), Is.EqualTo((2, 2)));
    }

    [Test, Category("BR-11")]
    public void The_overview_of_none_is_empty()
    {
        var (recent, total) = Changes.Overview(Array.Empty<Change>(), DateOf);
        Assert.That((recent.Count, total), Is.EqualTo((0, 0)));
    }

    [Test, Category("BR-11")]
    public void Changes_on_one_date_keep_their_original_order() =>
        Assert.That(Changes.NewestFirst(Dated("2026-09-01", "2026-09-01"), DateOf).Select(c => c.Id), Is.EqualTo(new[] { "chg_0", "chg_1" }));

    [TestCase(DetailField.Apr, 0, true)]
    [TestCase(DetailField.Apr, 100, true)]
    [TestCase(DetailField.InterestRate, 29.99, true)]
    [TestCase(DetailField.InterestRate, 29.9, true)]
    [TestCase(DetailField.Apr, 100.01, false)]
    [TestCase(DetailField.Apr, -0.01, false)]
    [TestCase(DetailField.Apr, 29.999, false)]
    [TestCase(DetailField.PromoPeriodMonths, 0, true)]
    [TestCase(DetailField.PromoPeriodMonths, 60, true)]
    [TestCase(DetailField.PromoPeriodMonths, 61, false)]
    [TestCase(DetailField.PromoPeriodMonths, -1, false)]
    [TestCase(DetailField.PromoPeriodMonths, 1.5, false)]
    [TestCase(DetailField.MinPaymentAmountMinor, 0, true)]
    [TestCase(DetailField.MinPaymentAmountMinor, -1, false)]
    [TestCase(DetailField.MinPaymentPercent, 0, true)]
    [TestCase(DetailField.MinPaymentPercent, 100, true)]
    [TestCase(DetailField.MinPaymentPercent, 100.01, false)]
    [TestCase(DetailField.MinPaymentPercent, 101, false)]
    [TestCase(DetailField.MinPaymentPercent, -1, false)]
    [Category("BR-14")]
    public void A_user_supplied_detail_must_be_in_range(DetailField field, double value, bool valid) =>
        Assert.That(AccountDetails.Validate(field, (decimal)value), Is.EqualTo(valid ? DetailOutcome.Valid : DetailOutcome.OutOfRange));
}
