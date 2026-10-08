namespace CreditDashboard.BusinessRules;

/// <summary>The contract's account types, in its enum order (BR-07's breakdown follows this order).</summary>
public enum AccountType { CreditCard, Loan, Mortgage, CurrentAccount, TelecomsAndUtilities, LineOfCredit }

/// <summary>The account facts the totals rules read (minor units).</summary>
public sealed record AccountFacts(string Id, AccountType Type, bool IsOpen, bool IncludedInTotals, long BalanceMinor, long? LimitMinor);

/// <summary>The figures of a type's summary card, and the accounts left out of them.</summary>
public sealed record TypeTotals(long BalanceMinor, long LimitMinor, UtilisationResult Utilisation, IReadOnlyList<AccountFacts> Excluded);

/// <summary>BR-04 and BR-05.</summary>
public static class Totals
{
    /// <summary>BR-05: a loan without a limit is not included in totals. A limit of zero is a limit.</summary>
    public static bool IsIncludedInTotals(AccountType type, long? limitMinor) => !(type == AccountType.Loan && limitMinor is null);

    /// <summary>
    /// BR-04: sums balance and limit across open accounts of one type where <c>IncludedInTotals</c> is true; a balance
    /// in credit is summed as it is. The utilisation of the totals follows BR-03. BR-05: open accounts left out of the
    /// sums are listed separately in <see cref="TypeTotals.Excluded"/>.
    /// </summary>
    public static TypeTotals ForType(IEnumerable<AccountFacts> accounts)
    {
        var open = accounts.Where(a => a.IsOpen).ToList();
        var counted = open.Where(a => a.IncludedInTotals).ToList();
        var balance = counted.Sum(a => a.BalanceMinor);
        var limit = counted.Sum(a => a.LimitMinor ?? 0);
        return new TypeTotals(balance, limit, Utilisation.Resolve(balance, limit), open.Where(a => !a.IncludedInTotals).ToList());
    }
}

/// <summary>BR-13.</summary>
public static class ClosedAccounts
{
    /// <summary>
    /// BR-13 and DR-012: a closed account is listed while today is before its close date plus six calendar years, so it
    /// drops off on the sixth anniversary. A 29 February close drops off on 28 February.
    /// </summary>
    public static bool IsListed(DateOnly closeDate, DateOnly today) => today < closeDate.AddYears(6);

    /// <summary>BR-13: a closed account reports balance 0, whatever balance was stored.</summary>
    public static long ReportedBalanceMinor(long storedBalanceMinor) => 0;
}

/// <summary>BR-15.</summary>
public static class Ownership
{
    /// <summary>
    /// BR-15: a user may read and change only accounts in their own persona. An ID is opaque and compared exactly; any
    /// other result is a 404, never a 403, so IDs cannot be probed.
    /// </summary>
    public static bool Owns(IEnumerable<string> ownedAccountIds, string? accountId) =>
        !string.IsNullOrEmpty(accountId) && ownedAccountIds.Contains(accountId, StringComparer.Ordinal);
}
