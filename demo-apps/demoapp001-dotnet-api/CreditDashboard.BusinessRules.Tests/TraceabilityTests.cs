using System.Reflection;
using System.Text.RegularExpressions;
using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>
/// Rule traceability (API specification section 3 and 11): every business rule in section 7, and every profile rule the
/// API enforces, has at least one tagged test, and every BR or PR tag names a rule that exists.
/// </summary>
public class TraceabilityTests
{
    /// <summary>
    /// Profile rules with no unit-testable function, and why (profile-rules-cases.md): PR-01 and PR-08 are design facts
    /// held by the contract coverage test; PR-05 is a stretch sub-page (DR-022).
    /// </summary>
    private static readonly string[] ExemptProfileRules = ["PR-01", "PR-05", "PR-08"];

    private static string[] RulesInSpecification()
    {
        var spec = File.ReadAllText(RepoFiles.Path_("DOCS", ".design", "api-specification.md"));
        var section = spec[spec.IndexOf("## 7. Business rules", StringComparison.Ordinal)..];
        section = section[..section.IndexOf("\n## 8.", StringComparison.Ordinal)];
        return Regex.Matches(section, @"^\| (BR-\d{2}) \|", RegexOptions.Multiline).Select(m => m.Groups[1].Value).Distinct().ToArray();
    }

    private static string[] ProfileRulesInSpecification()
    {
        var spec = File.ReadAllText(RepoFiles.Path_("DOCS", ".design", "ui-feature-profile.md"));
        var section = spec[spec.IndexOf("## 5. Rules", StringComparison.Ordinal)..];
        section = section[..section.IndexOf("\n## 6.", StringComparison.Ordinal)];
        return Regex.Matches(section, @"^\| (PR-\d{2}) \|", RegexOptions.Multiline).Select(m => m.Groups[1].Value).Distinct().ToArray();
    }

    private static string[] Tags(string prefix) =>
        typeof(TraceabilityTests).Assembly.GetTypes()
            .SelectMany(t => t.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly)
                .Where(m => m.GetCustomAttributes<TestAttribute>().Any() || m.GetCustomAttributes<TestCaseAttribute>().Any())
                .SelectMany(m => m.GetCustomAttributes<CategoryAttribute>().Concat(t.GetCustomAttributes<CategoryAttribute>())))
            .Select(c => c.Name)
            .Where(name => name.StartsWith(prefix, StringComparison.Ordinal))
            .Distinct()
            .ToArray();

    [Test]
    public void The_specification_lists_fifteen_business_rules() => Assert.That(RulesInSpecification(), Has.Length.EqualTo(15));

    [Test]
    public void Every_business_rule_has_a_tagged_test() =>
        Assert.That(RulesInSpecification().Except(Tags("BR-")), Is.Empty, "business rules with no test tagged [Category(\"BR-nn\")]");

    [Test]
    public void Every_business_rule_tag_names_a_rule_that_exists() =>
        Assert.That(Tags("BR-").Except(RulesInSpecification()), Is.Empty, "BR tags that name no rule in API specification section 7");

    [Test]
    public void The_profile_specification_lists_eleven_rules() => Assert.That(ProfileRulesInSpecification(), Has.Length.EqualTo(11));

    [Test]
    public void Every_exempt_profile_rule_exists() =>
        Assert.That(ExemptProfileRules.Except(ProfileRulesInSpecification()), Is.Empty, "exempt PR IDs that name no rule");

    [Test]
    public void Every_profile_rule_the_api_enforces_has_a_tagged_test() =>
        Assert.That(ProfileRulesInSpecification().Except(ExemptProfileRules).Except(Tags("PR-")), Is.Empty,
            "profile rules with no test tagged [Category(\"PR-nn\")]");

    [Test]
    public void Every_profile_rule_tag_names_a_rule_that_exists() =>
        Assert.That(Tags("PR-").Except(ProfileRulesInSpecification()), Is.Empty, "PR tags that name no rule in the My Profile specification");

    [Test]
    public void An_exempt_profile_rule_is_not_also_tagged() =>
        Assert.That(Tags("PR-").Intersect(ExemptProfileRules), Is.Empty, "a tested rule should not be listed as exempt");
}
