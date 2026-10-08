using CreditDashboard.BusinessRules.Profile;
using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>PR-02 to PR-11. Cases: DOCS/.design/profile-rules-cases.md.</summary>
public class ProfileTests
{
    private static DateTimeOffset At(string time) => DateTimeOffset.Parse($"2026-10-03T{time}Z", System.Globalization.CultureInfo.InvariantCulture);

    // PR-02

    [TestCase("Sam", "Sam")]
    [TestCase("  Sam  ", "Sam")]
    [TestCase("S", "S")]
    [TestCase("Anne-Marie", "Anne-Marie")]
    [TestCase("O'Neil", "O'Neil")]
    [TestCase("Mary Jane", "Mary Jane")]
    [TestCase("Zoë", "Zoë")]
    [TestCase("-", "-")]
    [TestCase("abcdefghijklmnopqrstuvwxyzabcd", "abcdefghijklmnopqrstuvwxyzabcd")]
    [TestCase("   abcdefghijklmnopqrstuvwxyzabcd   ", "abcdefghijklmnopqrstuvwxyzabcd")]
    [Category("PR-02")]
    public void A_valid_preferred_name_is_saved_trimmed(string submitted, string stored) =>
        Assert.That(PreferredName.Validate(submitted), Is.EqualTo(new PreferredNameResult(PreferredNameOutcome.Saved, stored)));

    [TestCase("")]
    [TestCase("   ")]
    [TestCase(null)]
    [Category("PR-02")]
    public void An_empty_or_null_name_clears_it(string? submitted) =>
        Assert.That(PreferredName.Validate(submitted).Outcome, Is.EqualTo(PreferredNameOutcome.Cleared));

    [TestCase("abcdefghijklmnopqrstuvwxyzabcde")]
    [TestCase("Sam2")]
    [TestCase("Sam!")]
    [Category("PR-02")]
    public void A_name_that_breaks_the_rule_is_rejected(string submitted) =>
        Assert.That(PreferredName.Validate(submitted).Outcome, Is.EqualTo(PreferredNameOutcome.Rejected));

    // PR-03

    [TestCase("Sam", "Samuel Example", "Sam")]
    [TestCase(null, "Samuel Example", "Samuel")]
    [TestCase("", "Samuel Example", "Samuel")]
    [TestCase(null, "Alex Example", "Alex")]
    [Category("PR-03")]
    public void The_preferred_name_replaces_the_legal_first_name_in_the_greeting(string? preferred, string legal, string expected) =>
        Assert.That(PreferredName.GreetingName(preferred, legal), Is.EqualTo(expected));

    // PR-04

    [Test, Category("PR-04")]
    public void A_different_address_is_stored_unverified_and_a_link_is_sent() =>
        Assert.That(Email.Change("a@example.com", EmailStatus.Verified, "b@example.com"),
            Is.EqualTo(new EmailChangeResult(true, "b@example.com", EmailStatus.Unverified, true)));

    [Test, Category("PR-04")]
    public void The_same_address_changes_nothing_and_stays_verified() =>
        Assert.That(Email.Change("a@example.com", EmailStatus.Verified, "a@example.com"),
            Is.EqualTo(new EmailChangeResult(false, "a@example.com", EmailStatus.Verified, false)));

    [Test, Category("PR-04")]
    public void The_same_address_unverified_sends_no_new_link() =>
        Assert.That(Email.Change("a@example.com", EmailStatus.Unverified, "a@example.com"),
            Is.EqualTo(new EmailChangeResult(false, "a@example.com", EmailStatus.Unverified, false)));

    [Test, Category("PR-04")]
    public void Reading_the_comparison_ignores_case() =>
        Assert.That(Email.Change("a@example.com", EmailStatus.Verified, "A@Example.com").Changed, Is.False);

    [Test, Category("PR-04")]
    public void Reading_the_submitted_value_is_trimmed() =>
        Assert.That(Email.Change("a@example.com", EmailStatus.Verified, " a@example.com ").Changed, Is.False);

    [Test, Category("PR-04")]
    public void With_no_address_held_a_new_one_is_unverified_and_a_link_is_sent() =>
        Assert.That(Email.Change(null, EmailStatus.Unverified, "b@example.com"),
            Is.EqualTo(new EmailChangeResult(true, "b@example.com", EmailStatus.Unverified, true)));

    // PR-06

    [TestCase("07700900456", "+447700900456")]
    [TestCase("07700 900456", "+447700900456")]
    [TestCase("+447700900456", "+447700900456")]
    [TestCase("+44 7700 900456", "+447700900456")]
    [Category("PR-06")]
    public void A_uk_mobile_number_is_normalised_to_plus_44(string submitted, string stored) =>
        Assert.That(Mobile.Normalise(submitted), Is.EqualTo(stored));

    [TestCase("01632 960456")]
    [TestCase("0770090045")]
    [TestCase("077009004567")]
    [TestCase("07700 90045a")]
    [TestCase("07700-900456")]
    [TestCase("447700900456")]
    [TestCase("")]
    [TestCase("   ")]
    [TestCase(null)]
    [Category("PR-06")]
    public void A_number_that_is_not_a_uk_mobile_is_refused(string? submitted) => Assert.That(Mobile.Normalise(submitted), Is.Null);

    // PR-07

    [Test, Category("PR-07")]
    public void The_mobile_summary_carries_only_the_last_three_digits() =>
        Assert.That(Mobile.LastThreeDigits("+447700900456"), Is.EqualTo("456"));

    [Test, Category("PR-07")]
    public void No_mobile_number_gives_no_digits() => Assert.That(Mobile.LastThreeDigits(null), Is.Null);

    [Test, Category("PR-07")]
    public void Finances_that_are_added_report_only_that()
    {
        Assert.That(Finances.Tile(new object()), Is.EqualTo(new FinancesTile(true)));
        Assert.That(typeof(FinancesTile).GetProperties().Select(p => p.Name), Is.EqualTo(new[] { "Added" }), "the tile has no field a figure could ride in");
    }

    [Test, Category("PR-07")]
    public void Finances_not_added_report_false() => Assert.That(Finances.Tile<object>(null), Is.EqualTo(new FinancesTile(false)));

    // PR-09

    [TestCase("09:00:00", "09:00:00")]
    [TestCase("09:00:00", "09:00:59")]
    [TestCase("09:00:00", "08:59:00")]
    [Category("PR-09")]
    public void A_link_is_not_resent_within_a_minute(string lastSent, string now) =>
        Assert.That(Email.Resend(EmailStatus.Unverified, At(lastSent), At(now)).Outcome, Is.EqualTo(ResendOutcome.RateLimited));

    [TestCase("09:00:00", "09:00:00", 60)]
    [TestCase("09:00:00", "09:00:59", 1)]
    [TestCase("09:00:00", "08:59:00", 120)]
    [Category("PR-09")]
    public void The_refusal_says_how_many_seconds_to_wait(string lastSent, string now, int seconds) =>
        Assert.That(Email.Resend(EmailStatus.Unverified, At(lastSent), At(now)).RetryAfterSeconds, Is.EqualTo(seconds));

    [TestCase("09:00:00", "09:01:00")]
    [TestCase("09:00:00", "09:01:01")]
    [Category("PR-09")]
    public void A_link_is_resent_once_a_minute_has_passed(string lastSent, string now) =>
        Assert.That(Email.Resend(EmailStatus.Unverified, At(lastSent), At(now)), Is.EqualTo(new ResendResult(ResendOutcome.Sent, null)));

    [Test, Category("PR-09")]
    public void A_link_is_resent_after_a_long_time() =>
        Assert.That(Email.Resend(EmailStatus.Unverified, At("09:00:00"), At("09:00:00").AddDays(1)).Outcome, Is.EqualTo(ResendOutcome.Sent));

    [Test, Category("PR-09")]
    public void A_link_is_sent_when_none_has_been_sent_yet() =>
        Assert.That(Email.Resend(EmailStatus.Unverified, null, At("09:00:00")).Outcome, Is.EqualTo(ResendOutcome.Sent));

    [TestCase("09:00:00", "09:00:00")]
    [TestCase("09:00:00", "11:00:00")]
    [Category("PR-09")]
    public void A_verified_email_is_never_resent(string lastSent, string now) =>
        Assert.That(Email.Resend(EmailStatus.Verified, At(lastSent), At(now)).Outcome, Is.EqualTo(ResendOutcome.AlreadyVerified));

    // PR-10

    [TestCase("09:00:00")]
    [TestCase("09:09:59")]
    [Category("PR-10")]
    public void The_correct_code_verifies_within_ten_minutes(string now)
    {
        var result = Mobile.Check(Mobile.Issue(At("09:00:00")), Mobile.Code, At(now));
        Assert.That(result.Outcome, Is.EqualTo(CodeOutcome.Verified));
        Assert.That(result.Challenge!.Verified, Is.True);
    }

    [TestCase("09:10:00")]
    [TestCase("09:11:00")]
    [Category("PR-10")]
    public void The_correct_code_is_refused_from_ten_minutes_after_issue(string now) =>
        Assert.That(Mobile.Check(Mobile.Issue(At("09:00:00")), Mobile.Code, At(now)).Outcome, Is.EqualTo(CodeOutcome.Invalid));

    [Test, Category("PR-10")]
    public void A_new_challenge_has_three_attempts_and_expires_ten_minutes_after_issue()
    {
        var challenge = Mobile.Issue(At("09:00:00"));
        Assert.That(challenge.AttemptsRemaining, Is.EqualTo(3));
        Assert.That(challenge.ExpiresAt, Is.EqualTo(At("09:10:00")));
        Assert.That(Mobile.Code, Is.EqualTo("123456"));
    }

    [Test, Category("PR-10")]
    public void A_second_challenge_starts_afresh_with_three_attempts()
    {
        var worn = Mobile.Check(Mobile.Issue(At("09:00:00")), "000000", At("09:01:00")).Challenge;
        Assert.That(worn!.AttemptsRemaining, Is.EqualTo(2));
        Assert.That(Mobile.Issue(At("09:02:00")).AttemptsRemaining, Is.EqualTo(3));
    }

    // PR-11

    [TestCase(3, 2)]
    [TestCase(2, 1)]
    [Category("PR-11")]
    public void A_wrong_code_is_refused_with_the_attempts_left(int before, int after)
    {
        var challenge = new MobileChallenge(At("09:00:00"), before, false, false);
        var result = Mobile.Check(challenge, "000000", At("09:01:00"));
        Assert.That((result.Outcome, result.AttemptsRemaining), Is.EqualTo((CodeOutcome.Wrong, (int?)after)));
    }

    [Test, Category("PR-11")]
    public void The_third_wrong_code_voids_the_challenge_and_carries_no_attempts()
    {
        var result = Mobile.Check(new MobileChallenge(At("09:00:00"), 1, false, false), "000000", At("09:01:00"));
        Assert.That((result.Outcome, result.AttemptsRemaining, result.Challenge!.Voided), Is.EqualTo((CodeOutcome.Invalid, (int?)null, true)));
    }

    [Test, Category("PR-11")]
    public void The_correct_code_after_a_voided_challenge_is_refused() =>
        Assert.That(Mobile.Check(new MobileChallenge(At("09:00:00"), 0, true, false), Mobile.Code, At("09:01:00")).Outcome, Is.EqualTo(CodeOutcome.Invalid));

    [Test, Category("PR-11")]
    public void The_correct_code_after_two_wrong_codes_verifies() =>
        Assert.That(Mobile.Check(new MobileChallenge(At("09:00:00"), 1, false, false), Mobile.Code, At("09:01:00")).Outcome, Is.EqualTo(CodeOutcome.Verified));

    [Test, Category("PR-11")]
    public void A_wrong_code_after_expiry_is_invalid_not_wrong() =>
        Assert.That(Mobile.Check(Mobile.Issue(At("09:00:00")), "000000", At("09:10:00")).Outcome, Is.EqualTo(CodeOutcome.Invalid));

    [TestCase(Mobile.Code)]
    [TestCase("000000")]
    [Category("PR-11")]
    public void A_code_with_nothing_pending_is_invalid(string code) =>
        Assert.That(Mobile.Check(null, code, At("09:00:00")).Outcome, Is.EqualTo(CodeOutcome.Invalid));

    [Test, Category("PR-11")]
    public void Reading_a_verified_challenge_is_no_longer_pending() =>
        Assert.That(Mobile.Check(new MobileChallenge(At("09:00:00"), 3, false, true), Mobile.Code, At("09:01:00")).Outcome, Is.EqualTo(CodeOutcome.Invalid));
}
