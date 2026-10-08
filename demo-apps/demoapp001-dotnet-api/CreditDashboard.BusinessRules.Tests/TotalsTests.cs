using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>BR-04, BR-05, BR-13 and BR-15.</summary>
public class TotalsTests
{
    private static AccountFacts Card(long balance, long? limit, bool included = true, bool open = true, string id = "acc_x") =>
        new(id, AccountType.CreditCard, open, included, balance, limit);

    [Test, Category("BR-04")]
    public void Two_included_cards_are_summed()
    {
        var totals = Totals.ForType([Card(10000, 50000), Card(20000, 50000)]);
        Assert.That((totals.BalanceMinor, totals.LimitMinor, totals.Utilisation.Raw), Is.EqualTo((30000L, 100000L, (int?)30)));
    }

    [Test, Category("BR-04")]
    public void An_account_not_included_is_ignored_in_the_sums()
    {
        var totals = Totals.ForType([Card(10000, 50000), Card(99999, 50000, included: false)]);
        Assert.That((totals.BalanceMinor, totals.LimitMinor), Is.EqualTo((10000L, 50000L)));
    }

    [Test, Category("BR-04")]
    public void A_closed_account_is_ignored()
    {
        var totals = Totals.ForType([Card(10000, 50000), Card(0, 50000, open: false)]);
        Assert.That((totals.BalanceMinor, totals.LimitMinor), Is.EqualTo((10000L, 50000L)));
    }

    [Test, Category("BR-04")]
    public void A_balance_in_credit_is_summed_as_it_is()
    {
        var totals = Totals.ForType([Card(10000, 50000), Card(-2000, 50000)]);
        Assert.That((totals.BalanceMinor, totals.LimitMinor, totals.Utilisation.Raw), Is.EqualTo((8000L, 100000L, (int?)8)));
    }

    [Test, Category("BR-04")]
    public void Limits_that_sum_to_zero_give_no_utilisation()
    {
        var totals = Totals.ForType([Card(500, 0), Card(300, 0)]);
        Assert.That((totals.BalanceMinor, totals.LimitMinor, totals.Utilisation.Raw), Is.EqualTo((800L, 0L, (int?)null)));
    }

    [Test, Category("BR-04")]
    public void No_account_counting_gives_zeros_and_no_utilisation()
    {
        var totals = Totals.ForType([]);
        Assert.That((totals.BalanceMinor, totals.LimitMinor, totals.Utilisation.Raw), Is.EqualTo((0L, 0L, (int?)null)));
    }

    [Test, Category("BR-04")]
    public void The_total_utilisation_rounds_half_up()
    {
        var totals = Totals.ForType([Card(1, 200)]);
        Assert.That(totals.Utilisation.Raw, Is.EqualTo(1));
    }

    [Test, Category("BR-05")]
    public void A_loan_without_a_limit_is_not_included() => Assert.That(Totals.IsIncludedInTotals(AccountType.Loan, null), Is.False);

    [Test, Category("BR-05")]
    public void A_loan_with_a_limit_is_included() => Assert.That(Totals.IsIncludedInTotals(AccountType.Loan, 500000), Is.True);

    [Test, Category("BR-05")]
    public void Another_type_without_a_limit_is_included() =>
        Assert.That(Totals.IsIncludedInTotals(AccountType.TelecomsAndUtilities, null), Is.True);

    [Test, Category("BR-05")]
    public void Reading_a_loan_with_a_limit_of_zero_is_included() => Assert.That(Totals.IsIncludedInTotals(AccountType.Loan, 0), Is.True);

    [Test, Category("BR-05")]
    public void An_excluded_loan_appears_only_in_the_excluded_list()
    {
        var loan = new AccountFacts("acc_ddln02", AccountType.Loan, true, false, 116100, null);
        var totals = Totals.ForType([loan]);
        Assert.That(totals.BalanceMinor, Is.Zero);
        Assert.That(totals.Excluded, Is.EqualTo(new[] { loan }));
    }

    [TestCase("2024-05-10", "2026-10-03", true)]
    [TestCase("2020-10-03", "2026-10-02", true)]
    [TestCase("2020-10-03", "2026-10-03", false)]
    [TestCase("2020-10-03", "2026-10-04", false)]
    [TestCase("2020-02-29", "2026-02-27", true)]
    [TestCase("2020-02-29", "2026-02-28", false)]
    [TestCase("2016-02-29", "2022-02-28", false)]
    [Category("BR-13")]
    public void A_closed_account_is_listed_until_its_sixth_anniversary(string closed, string today, bool listed) =>
        Assert.That(ClosedAccounts.IsListed(DateOnly.Parse(closed), DateOnly.Parse(today)), Is.EqualTo(listed));

    [TestCase(0L)]
    [TestCase(4400L)]
    [TestCase(-4400L)]
    [Category("BR-13")]
    public void A_closed_account_reports_balance_zero(long stored) => Assert.That(ClosedAccounts.ReportedBalanceMinor(stored), Is.Zero);

    private static readonly string[] Owned = ["acc_ddcc01", "acc_ddcc02"];

    [Test, Category("BR-15")]
    public void An_own_account_is_found() => Assert.That(Ownership.Owns(Owned, "acc_ddcc01"), Is.True);

    [Test, Category("BR-15")]
    public void Another_personas_account_is_not_found() => Assert.That(Ownership.Owns(Owned, "acc_exln02"), Is.False);

    [Test, Category("BR-15")]
    public void An_unknown_id_is_not_found() => Assert.That(Ownership.Owns(Owned, "acc_nope00"), Is.False);

    [Test, Category("BR-15")]
    public void Ids_are_compared_exactly_so_case_matters() => Assert.That(Ownership.Owns(Owned, "ACC_DDCC01"), Is.False);

    [TestCase("")]
    [TestCase(null)]
    [Category("BR-15")]
    public void An_empty_id_is_not_found(string? id) => Assert.That(Ownership.Owns(Owned, id), Is.False);

    [Test, Category("BR-15")]
    public void A_persona_with_no_accounts_finds_nothing() => Assert.That(Ownership.Owns([], "acc_ddcc01"), Is.False);
}
