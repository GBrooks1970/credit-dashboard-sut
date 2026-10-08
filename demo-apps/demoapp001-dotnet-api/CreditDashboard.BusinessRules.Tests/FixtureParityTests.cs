using System.Text.Json;
using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>
/// The library recomputes what the seven personas store, and must agree with every stored value (CDS-20 plan, D4).
/// The fixtures are also checked by the JS fixture check, which was written independently of this library.
/// </summary>
public class FixtureParityTests
{
    private static IEnumerable<(string Persona, JsonElement Bureau)> Bureaux() =>
        Directory.GetFiles(RepoFiles.Path_("fixtures", "personas"), "*.json").Order().SelectMany(file =>
        {
            using var doc = JsonDocument.Parse(File.ReadAllText(file));
            var persona = Path.GetFileNameWithoutExtension(file);
            return doc.RootElement.GetProperty("bureaux").EnumerateArray().Select(b => (persona, b.Clone())).ToList();
        });

    private static IEnumerable<(string Persona, JsonElement Account)> Accounts() =>
        Bureaux().SelectMany(b => b.Bureau.GetProperty("accounts").EnumerateArray().Select(a => (b.Persona, a)));

    private static long? Limit(JsonElement account) =>
        account.TryGetProperty("limit", out var l) && l.ValueKind == JsonValueKind.Object ? l.GetProperty("amountMinor").GetInt64() : null;

    private static string Label(string persona, JsonElement account) => $"{persona}/{account.GetProperty("id").GetString()}";

    [Test, Category("BR-03"), Category("BR-06")]
    public void Stored_utilisation_and_raw_utilisation_match_the_rules()
    {
        var accounts = Accounts().ToList();
        Assert.That(accounts, Has.Count.EqualTo(28), "the seven personas hold 28 accounts");
        foreach (var (persona, account) in accounts)
        {
            var computed = Utilisation.Resolve(account.GetProperty("balance").GetProperty("amountMinor").GetInt64(), Limit(account));
            int? Stored(string name) => account.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetInt32() : null;
            Assert.That((computed.Display, computed.Raw), Is.EqualTo((Stored("utilisation"), Stored("utilisationRaw"))), Label(persona, account));
        }
    }

    [Test, Category("BR-09")]
    public void Stored_masks_match_the_source_masks()
    {
        var withSource = 0;
        foreach (var (persona, account) in Accounts())
        {
            if (!account.TryGetProperty("sourceMask", out var source) || source.ValueKind != JsonValueKind.String) continue;
            withSource++;
            Assert.That(Masking.Mask(source.GetString()), Is.EqualTo(account.GetProperty("maskedNumber").GetString()), Label(persona, account));
        }
        Assert.That(withSource, Is.GreaterThan(0), "at least one fixture account has a source mask");
    }

    [Test, Category("BR-05")]
    public void A_loan_without_a_limit_is_stored_as_not_included()
    {
        foreach (var (persona, account) in Accounts())
        {
            var type = account.GetProperty("type").GetString();
            if (type != "loan" || Limit(account) is not null) continue;
            Assert.That(Totals.IsIncludedInTotals(AccountType.Loan, null), Is.False);
            Assert.That(account.GetProperty("includedInTotals").GetBoolean(), Is.False, Label(persona, account));
        }
    }

    [Test, Category("BR-13")]
    public void A_closed_account_is_stored_with_balance_zero()
    {
        foreach (var (persona, account) in Accounts())
        {
            if (!account.GetProperty("closed").GetBoolean()) continue;
            Assert.That(account.GetProperty("balance").GetProperty("amountMinor").GetInt64(),
                Is.EqualTo(ClosedAccounts.ReportedBalanceMinor(account.GetProperty("balance").GetProperty("amountMinor").GetInt64())), Label(persona, account));
        }
    }

    [Test, Category("BR-11")]
    public void Stored_changes_are_newest_first()
    {
        foreach (var (persona, bureau) in Bureaux())
        {
            var changes = bureau.GetProperty("changes").EnumerateArray().Select(c => (Id: c.GetProperty("id").GetString()!, Date: DateOnly.Parse(c.GetProperty("date").GetString()!))).ToList();
            Assert.That(Changes.NewestFirst(changes, c => c.Date).Select(c => c.Id), Is.EqualTo(changes.Select(c => c.Id)), $"{persona}/{bureau.GetProperty("id").GetString()}");
        }
    }
}
