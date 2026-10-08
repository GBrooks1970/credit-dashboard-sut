using System.Reflection;
using System.Text.RegularExpressions;
using NUnit.Framework;

namespace CreditDashboard.BusinessRules.Tests;

/// <summary>
/// Rule traceability (API specification section 3 and 11): every business rule in section 7 has at least one tagged
/// test, and every BR tag names a rule that exists.
/// </summary>
public class TraceabilityTests
{
    private static string[] RulesInSpecification()
    {
        var spec = File.ReadAllText(RepoFiles.Path_("DOCS", ".design", "api-specification.md"));
        var section = spec[spec.IndexOf("## 7. Business rules", StringComparison.Ordinal)..];
        section = section[..section.IndexOf("\n## 8.", StringComparison.Ordinal)];
        return Regex.Matches(section, @"^\| (BR-\d{2}) \|", RegexOptions.Multiline).Select(m => m.Groups[1].Value).Distinct().ToArray();
    }

    private static string[] TaggedRules() =>
        typeof(TraceabilityTests).Assembly.GetTypes()
            .SelectMany(t => t.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly)
                .Where(m => m.GetCustomAttributes<TestAttribute>().Any() || m.GetCustomAttributes<TestCaseAttribute>().Any())
                .SelectMany(m => m.GetCustomAttributes<CategoryAttribute>().Concat(t.GetCustomAttributes<CategoryAttribute>())))
            .Select(c => c.Name)
            .Where(name => name.StartsWith("BR-", StringComparison.Ordinal))
            .Distinct()
            .ToArray();

    [Test]
    public void The_specification_lists_fifteen_rules() => Assert.That(RulesInSpecification(), Has.Length.EqualTo(15));

    [Test]
    public void Every_business_rule_has_a_tagged_test() =>
        Assert.That(RulesInSpecification().Except(TaggedRules()), Is.Empty, "business rules with no test tagged [Category(\"BR-nn\")]");

    [Test]
    public void Every_tag_names_a_rule_that_exists() =>
        Assert.That(TaggedRules().Except(RulesInSpecification()), Is.Empty, "BR tags that name no rule in API specification section 7");
}
