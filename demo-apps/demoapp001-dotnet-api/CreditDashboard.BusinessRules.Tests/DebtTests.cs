using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>BR-07.</summary>
public class DebtTests
{
    private static DebtAccount Card(long now, long? earlier, bool included = true, bool open = true, AccountType type = AccountType.CreditCard) =>
        new(type, open, included, now, earlier);

    [TestCase(10000L, 10100L, DebtTrend.Steady)]
    [TestCase(10000L, 9900L, DebtTrend.Steady)]
    [TestCase(10000L, 10101L, DebtTrend.Up)]
    [TestCase(10000L, 9899L, DebtTrend.Down)]
    [TestCase(1_000_000_000L, 1_010_000_000L, DebtTrend.Steady)]
    [TestCase(0L, 0L, DebtTrend.Steady)]
    [TestCase(0L, 5000L, DebtTrend.Up)]
    [TestCase(5000L, 0L, DebtTrend.Down)]
    [Category("BR-07")]
    public void The_trend_is_steady_within_one_percent_either_way_inclusive(long earlier, long now, DebtTrend expected) =>
        Assert.That(Debt.Overview([Card(now, earlier)]).Trend, Is.EqualTo(expected));

    [Test, Category("BR-07")]
    public void A_balance_in_credit_is_not_in_the_total() =>
        Assert.That(Debt.Overview([Card(-4400, -4400), Card(3000, 3000)]).TotalMinor, Is.EqualTo(3000));

    [Test, Category("BR-07")]
    public void A_current_account_is_not_in_the_total() =>
        Assert.That(Debt.Overview([Card(9000, 9000, type: AccountType.CurrentAccount), Card(3000, 3000)]).TotalMinor, Is.EqualTo(3000));

    [Test, Category("BR-07")]
    public void An_account_not_included_is_not_in_the_total() =>
        Assert.That(Debt.Overview([Card(9000, 9000, included: false), Card(3000, 3000)]).TotalMinor, Is.EqualTo(3000));

    [Test, Category("BR-07")]
    public void A_closed_account_is_not_in_the_total() =>
        Assert.That(Debt.Overview([Card(9000, 9000, open: false), Card(3000, 3000)]).TotalMinor, Is.EqualTo(3000));

    [Test, Category("BR-07")]
    public void The_breakdown_follows_enum_order()
    {
        var overview = Debt.Overview([Card(7000, 7000, type: AccountType.Mortgage), Card(3000, 3000)]);
        Assert.That(overview.ByType.Select(t => t.Type), Is.EqualTo(new[] { AccountType.CreditCard, AccountType.Mortgage }));
    }

    [Test, Category("BR-07")]
    public void The_breakdown_omits_a_type_that_sums_to_zero()
    {
        var overview = Debt.Overview([Card(-100, -100, type: AccountType.Loan), Card(3000, 3000)]);
        Assert.That(overview.ByType.Select(t => t.Type), Is.EqualTo(new[] { AccountType.CreditCard }));
    }

    [Test, Category("BR-07")]
    public void The_breakdown_adds_up_to_the_total()
    {
        var overview = Debt.Overview([Card(7000, 7000, type: AccountType.Mortgage), Card(3000, 3000), Card(-5, 0), Card(1200, 1100, type: AccountType.Loan)]);
        Assert.That(overview.ByType.Sum(t => t.BalanceMinor), Is.EqualTo(overview.TotalMinor));
    }

    [Test, Category("BR-07")]
    public void Reading_an_account_with_no_earlier_point_adds_nothing_to_the_earlier_total() =>
        // Earlier total is 10000 (one account); now is 10500 (+5%), so the trend is up.
        Assert.That(Debt.Overview([Card(10000, 10000), Card(500, null)]).Trend, Is.EqualTo(DebtTrend.Up));
}
