using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>BR-12 and API specification section 5.</summary>
public class PaymentHistoryTests
{
    private static readonly YearMonth Now = new(2026, 10);

    private static PaymentAccount Account(string opened, string? closed = null, params string[] missed) =>
        new(DateOnly.Parse(opened), closed is null ? null : DateOnly.Parse(closed), missed.Select(YearMonth.Parse).ToHashSet());

    private static PaymentStatus Month(PaymentAccount a, string month) => PaymentHistory.AccountMonth(a, YearMonth.Parse(month), Now);

    [Test, Category("BR-12")]
    public void An_account_open_since_2019_with_nothing_missed_is_on_time_every_month_and_year()
    {
        var a = Account("2019-04-15");
        Assert.That(Month(a, "2024-06"), Is.EqualTo(PaymentStatus.OnTime));
        Assert.That(PaymentHistory.YearStatus([a], 2025, Now), Is.EqualTo(PaymentStatus.OnTime));
    }

    [Test, Category("BR-12")]
    public void A_missed_month_makes_that_month_and_its_year_missed()
    {
        var a = Account("2019-04-15", null, "2026-03");
        Assert.That(Month(a, "2026-03"), Is.EqualTo(PaymentStatus.Missed));
        Assert.That(PaymentHistory.YearStatus([a], 2026, Now), Is.EqualTo(PaymentStatus.Missed));
    }

    [Test, Category("BR-12")]
    public void Months_before_the_account_opened_are_no_data() =>
        Assert.That(Month(Account("2026-05-31"), "2026-04"), Is.EqualTo(PaymentStatus.NoData));

    [Test, Category("BR-12")]
    public void The_opening_month_itself_is_on_time() =>
        Assert.That(Month(Account("2026-05-31"), "2026-05"), Is.EqualTo(PaymentStatus.OnTime));

    [Test, Category("BR-12")]
    public void Months_after_the_account_closed_are_no_data() =>
        Assert.That(Month(Account("2019-01-01", "2026-03-01"), "2026-04"), Is.EqualTo(PaymentStatus.NoData));

    [Test, Category("BR-12")]
    public void The_closing_month_itself_is_on_time() =>
        Assert.That(Month(Account("2019-01-01", "2026-03-01"), "2026-03"), Is.EqualTo(PaymentStatus.OnTime));

    [Test, Category("BR-12")]
    public void Months_after_the_current_month_are_no_data() =>
        Assert.That(Month(Account("2019-01-01"), "2026-11"), Is.EqualTo(PaymentStatus.NoData));

    [Test, Category("BR-12")]
    public void A_year_of_only_no_data_months_is_no_data() =>
        Assert.That(PaymentHistory.YearStatus([Account("2027-01-01")], 2025, Now), Is.EqualTo(PaymentStatus.NoData));

    [Test, Category("BR-12")]
    public void A_year_mixing_on_time_and_no_data_is_on_time() =>
        Assert.That(PaymentHistory.YearStatus([Account("2025-07-01")], 2025, Now), Is.EqualTo(PaymentStatus.OnTime));

    [Test, Category("BR-12")]
    public void A_report_month_missed_by_one_account_is_missed() =>
        Assert.That(PaymentHistory.ReportMonth([PaymentStatus.Missed, PaymentStatus.OnTime]), Is.EqualTo(PaymentStatus.Missed));

    [Test, Category("BR-12")]
    public void A_report_month_with_one_on_time_and_one_no_data_is_on_time() =>
        Assert.That(PaymentHistory.ReportMonth([PaymentStatus.OnTime, PaymentStatus.NoData]), Is.EqualTo(PaymentStatus.OnTime));

    [Test, Category("BR-12")]
    public void A_report_month_with_no_data_anywhere_is_no_data() =>
        Assert.That(PaymentHistory.ReportMonth([PaymentStatus.NoData, PaymentStatus.NoData]), Is.EqualTo(PaymentStatus.NoData));

    [Test, Category("BR-12")]
    public void The_window_is_the_current_year_and_the_six_before() =>
        Assert.That(PaymentHistory.Window(new DateOnly(2026, 10, 3)), Is.EqualTo(new[] { 2020, 2021, 2022, 2023, 2024, 2025, 2026 }));

    [Test, Category("BR-12")]
    public void The_window_moves_with_the_year() =>
        Assert.That(PaymentHistory.Window(new DateOnly(2027, 1, 1)), Is.EqualTo(new[] { 2021, 2022, 2023, 2024, 2025, 2026, 2027 }));

    [Test, Category("BR-12")]
    public void A_missed_month_outside_the_window_is_not_in_any_window_year()
    {
        var a = Account("2015-01-01", null, "2018-05");
        var statuses = PaymentHistory.Window(new DateOnly(2026, 10, 3)).Select(y => PaymentHistory.YearStatus([a], y, Now));
        Assert.That(statuses, Does.Not.Contain(PaymentStatus.Missed));
    }
}
