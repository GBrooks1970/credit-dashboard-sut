namespace CreditDashboard.BusinessRules;

public enum DetailField { Apr, InterestRate, PromoPeriodMonths, MinPaymentAmountMinor, MinPaymentPercent }

public enum DetailOutcome { Valid, OutOfRange }

/// <summary>BR-14.</summary>
public static class AccountDetails
{
    /// <summary>
    /// BR-14: <c>apr</c> and <c>interestRate</c> accept 0 to 100 with up to 2 decimal places; <c>promoPeriodMonths</c> a
    /// whole 0 to 60; <c>minPayment</c> an <c>amountMinor</c> of at least 0 (whole) or a <c>percent</c> of 0 to 100.
    /// A violation is a 422 <c>out-of-range</c> (specification section 8).
    /// </summary>
    public static DetailOutcome Validate(DetailField field, decimal value)
    {
        var ok = field switch
        {
            DetailField.Apr or DetailField.InterestRate => value is >= 0 and <= 100 && decimal.Round(value, 2) == value,
            DetailField.PromoPeriodMonths => value is >= 0 and <= 60 && decimal.Truncate(value) == value,
            DetailField.MinPaymentAmountMinor => value >= 0 && decimal.Truncate(value) == value,
            DetailField.MinPaymentPercent => value is >= 0 and <= 100,
            _ => throw new ArgumentOutOfRangeException(nameof(field)),
        };
        return ok ? DetailOutcome.Valid : DetailOutcome.OutOfRange;
    }
}
