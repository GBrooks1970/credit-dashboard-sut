namespace CreditDashboard.BusinessRules.Tests;

/// <summary>Finds the repository's own files by walking up from the test binaries, so the tests read the single source.</summary>
internal static class RepoFiles
{
    private static readonly Lazy<string> Root = new(() =>
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
        {
            if (Directory.Exists(Path.Combine(dir.FullName, "fixtures", "personas"))
                && File.Exists(Path.Combine(dir.FullName, "DOCS", ".design", "api-specification.md")))
                return dir.FullName;
        }
        throw new DirectoryNotFoundException("The repository root (fixtures/personas and DOCS/.design) was not found above " + AppContext.BaseDirectory);
    });

    public static string Path_(params string[] parts) => Path.Combine([Root.Value, .. parts]);
}
