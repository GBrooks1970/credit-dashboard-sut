namespace CreditDashboard.BusinessRules;

public enum DebtTrend { Up, Down, Steady }

/// <summary>An account's facts for BR-07; <see cref="BalanceThreeMonthsAgoMinor"/> is null when it has no point that month.</summary>
public sealed record DebtAccount(AccountType Type, bool IsOpen, bool IncludedInTotals, long BalanceMinor, long? BalanceThreeMonthsAgoMinor);

public sealed record DebtOverviewResult(long TotalMinor, DebtTrend Trend, IReadOnlyList<(AccountType Type, long BalanceMinor)> ByType);

/// <summary>BR-07.</summary>
public static class Debt
{
    /// <summary>
    /// Total debt is the sum of positive balances of open accounts with <c>IncludedInTotals</c> true, excluding current
    /// accounts. The trend compares with the same sum three months earlier: a change of at most 1% either way,
    /// unrounded, is steady (DR-011); if the earlier total was zero it is steady when the total is still zero, else up.
    /// <c>ByType</c> is one entry per type above zero, in enum order (DR-046).
    /// </summary>
    public static DebtOverviewResult Overview(IEnumerable<DebtAccount> accounts)
    {
        var eligible = accounts.Where(a => a.IsOpen && a.IncludedInTotals && a.Type != AccountType.CurrentAccount).ToList();
        var now = eligible.Sum(a => Math.Max(0, a.BalanceMinor));
        var earlier = eligible.Sum(a => Math.Max(0, a.BalanceThreeMonthsAgoMinor ?? 0));
        var byType = eligible
            .GroupBy(a => a.Type)
            .Select(g => (Type: g.Key, BalanceMinor: g.Sum(a => Math.Max(0, a.BalanceMinor))))
            .Where(t => t.BalanceMinor > 0)
            .OrderBy(t => t.Type)
            .ToList();
        return new DebtOverviewResult(now, TrendOf(now, earlier), byType);
    }

    private static DebtTrend TrendOf(long now, long earlier)
    {
        if (earlier == 0) return now == 0 ? DebtTrend.Steady : DebtTrend.Up;
        // |now - earlier| / earlier <= 1%, compared exactly in integers.
        if (Int128.Abs((Int128)now - earlier) * 100 <= earlier) return DebtTrend.Steady;
        return now > earlier ? DebtTrend.Up : DebtTrend.Down;
    }
}
