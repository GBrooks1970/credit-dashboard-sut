namespace CreditDashboard.BusinessRules;

public enum PaymentStatus { OnTime, Missed, NoData }

/// <summary>What BR-12 reads from an account.</summary>
public sealed record PaymentAccount(DateOnly OpenedDate, DateOnly? ClosedDate, IReadOnlySet<YearMonth> MissedMonths);

/// <summary>BR-12 and the payment-status definition in API specification section 5.</summary>
public static class PaymentHistory
{
    /// <summary>
    /// One account's month: missed if in its missed months; no-data if before the month of the opened date, after the
    /// month of the closed date, or after the current month on the controlled clock; otherwise on-time.
    /// </summary>
    public static PaymentStatus AccountMonth(PaymentAccount account, YearMonth month, YearMonth current)
    {
        if (account.MissedMonths.Contains(month)) return PaymentStatus.Missed;
        if (month < YearMonth.From(account.OpenedDate)) return PaymentStatus.NoData;
        if (account.ClosedDate is { } closed && month > YearMonth.From(closed)) return PaymentStatus.NoData;
        if (month > current) return PaymentStatus.NoData;
        return PaymentStatus.OnTime;
    }

    /// <summary>Across a report: missed if any account missed the month, on-time if any was on time and none missed, else no-data.</summary>
    public static PaymentStatus ReportMonth(IEnumerable<PaymentStatus> accountMonths)
    {
        var statuses = accountMonths.ToList();
        if (statuses.Contains(PaymentStatus.Missed)) return PaymentStatus.Missed;
        return statuses.Contains(PaymentStatus.OnTime) ? PaymentStatus.OnTime : PaymentStatus.NoData;
    }

    /// <summary>
    /// BR-12 and DR-014: a year with any missed month is missed; a year with only no-data months is no-data; every other
    /// year, including one mixing on-time and no-data months, is on-time.
    /// </summary>
    public static PaymentStatus Year(IEnumerable<PaymentStatus> months)
    {
        var statuses = months.ToList();
        if (statuses.Contains(PaymentStatus.Missed)) return PaymentStatus.Missed;
        return statuses.All(s => s == PaymentStatus.NoData) ? PaymentStatus.NoData : PaymentStatus.OnTime;
    }

    /// <summary>BR-12: the window is the current year and the six before it, oldest first.</summary>
    public static IReadOnlyList<int> Window(DateOnly today) => Enumerable.Range(today.Year - 6, 7).ToList();

    /// <summary>The status of a year across the accounts of a report (one account gives that account's year).</summary>
    public static PaymentStatus YearStatus(IReadOnlyCollection<PaymentAccount> accounts, int year, YearMonth current) =>
        Year(Enumerable.Range(1, 12).Select(m => ReportMonth(accounts.Select(a => AccountMonth(a, new YearMonth(year, m), current)))));
}
