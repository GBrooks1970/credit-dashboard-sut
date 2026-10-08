using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>BR-03 and BR-06.</summary>
public class UtilisationTests
{
    [TestCase(42360L, 510000L, 8)]
    [TestCase(1250L, 10000L, 13)]
    [TestCase(1L, 200L, 1)]
    [TestCase(4949L, 10000L, 49)]
    [TestCase(0L, 10000L, 0)]
    [TestCase(10000L, 10000L, 100)]
    [TestCase(10001L, 10000L, 100)]
    [TestCase(11500L, 10000L, 115)]
    [TestCase(-4400L, 100000L, -4)]
    [TestCase(-450L, 10000L, -4)]
    [TestCase(-550L, 10000L, -5)]
    [TestCase(-4501L, 100000L, -5)]
    [TestCase(-50L, 10000L, 0)]
    [TestCase(9_000_000_000L, 10_000_000_000L, 90)]
    [Category("BR-03")]
    public void Utilisation_is_balance_over_limit_rounded_half_up(long balance, long limit, int expected) =>
        Assert.That(Utilisation.Raw(balance, limit), Is.EqualTo(expected));

    [TestCase(0L, 0L)]
    [TestCase(500L, 0L)]
    [TestCase(500L, null)]
    [Category("BR-03")]
    public void A_limit_of_zero_or_none_gives_no_utilisation(long balance, long? limit) =>
        Assert.That(Utilisation.Raw(balance, limit), Is.Null);

    [Test, Category("BR-03")]
    public void A_negative_limit_is_a_caller_fault() =>
        Assert.Throws<ArgumentOutOfRangeException>(() => Utilisation.Raw(100, -1));

    [TestCase(-4400L, 100000L, 0, -4)]
    [TestCase(0L, 10000L, 0, 0)]
    [TestCase(800L, 10000L, 8, 8)]
    [TestCase(11500L, 10000L, 115, 115)]
    [Category("BR-06")]
    public void The_displayed_value_is_floored_at_zero_and_the_raw_value_is_kept(long balance, long limit, int display, int raw) =>
        Assert.That(Utilisation.Resolve(balance, limit), Is.EqualTo(new UtilisationResult(display, raw)));

    [Test, Category("BR-06")]
    public void No_utilisation_stays_null_in_both_forms() =>
        Assert.That(Utilisation.Resolve(500, null), Is.EqualTo(new UtilisationResult(null, null)));
}
