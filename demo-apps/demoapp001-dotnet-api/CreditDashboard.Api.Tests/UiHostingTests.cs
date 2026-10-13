using System.Net;
using System.Text.Json.Nodes;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// UI_DIRECTORY (decision brief 11 D2, CDS-31): the service serves a built UI from the same origin as the API. Paths outside
/// the API base path come from the folder, with index.html for any other GET so client-side routes survive a refresh.
/// </summary>
[TestFixture]
public class UiHostingTests
{
    private string _ui = null!;

    [SetUp]
    public void SetUp()
    {
        _ui = Path.Combine(Path.GetTempPath(), "cds-ui-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(Path.Combine(_ui, "assets"));
        File.WriteAllText(Path.Combine(_ui, "index.html"), "<!doctype html><title>cds</title><div id=\"root\"></div>");
        File.WriteAllText(Path.Combine(_ui, "assets", "app.js"), "console.log('cds');");
    }

    [TearDown]
    public void TearDown()
    {
        if (Directory.Exists(_ui)) Directory.Delete(_ui, recursive: true);
    }

    private static async Task<(HttpStatusCode Status, string Type, string Body)> Get(ServiceHost host, string path, HttpMethod? method = null)
    {
        var response = await host.Client.SendAsync(new HttpRequestMessage(method ?? HttpMethod.Get, path));
        return (response.StatusCode, response.Content.Headers.ContentType?.MediaType ?? "", await response.Content.ReadAsStringAsync());
    }

    [Test]
    public async Task Without_a_UI_folder_the_root_is_a_404_problem()
    {
        using var host = new ServiceHost();
        var (status, type, body) = await Get(host, "/");
        Assert.That(status, Is.EqualTo(HttpStatusCode.NotFound));
        Assert.That(type, Is.EqualTo("application/problem+json"));
        Assert.That(JsonNode.Parse(body)!["type"]!.GetValue<string>(), Is.EqualTo("/problems/not-found"));
    }

    [Test]
    public async Task The_root_serves_index_html_with_no_store()
    {
        using var host = new ServiceHost(("UI_DIRECTORY", _ui));
        var response = await host.Client.GetAsync("/");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("text/html"));
        Assert.That(response.Headers.CacheControl?.NoStore, Is.True);
        Assert.That(await response.Content.ReadAsStringAsync(), Does.Contain("id=\"root\""));
    }

    [Test]
    public async Task A_built_asset_is_served_as_it_is()
    {
        using var host = new ServiceHost(("UI_DIRECTORY", _ui));
        var (status, type, body) = await Get(host, "/assets/app.js");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(type, Does.Contain("javascript"));
        Assert.That(body, Is.EqualTo("console.log('cds');"));
    }

    [TestCase("/login")]
    [TestCase("/credit-health/report/bureau-a")]
    [TestCase("/my-account/profile/email")]
    public async Task A_client_route_gets_index_html_so_a_refresh_works(string route)
    {
        using var host = new ServiceHost(("UI_DIRECTORY", _ui));
        var (status, type, body) = await Get(host, route);
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(type, Is.EqualTo("text/html"));
        Assert.That(body, Does.Contain("id=\"root\""));
    }

    [Test]
    public async Task Only_a_GET_gets_the_UI()
    {
        using var host = new ServiceHost(("UI_DIRECTORY", _ui));
        var (status, type, _) = await Get(host, "/login", HttpMethod.Post);
        Assert.That(status, Is.EqualTo(HttpStatusCode.NotFound));
        Assert.That(type, Is.EqualTo("application/problem+json"));
    }

    [Test]
    public async Task The_API_is_unchanged_beside_the_UI()
    {
        using var host = new ServiceHost(("UI_DIRECTORY", _ui));
        var (status, type, _) = await Get(host, "/api/v1/no-such-operation");
        Assert.That(status, Is.EqualTo(HttpStatusCode.NotFound));
        Assert.That(type, Is.EqualTo("application/problem+json"), "an unknown API path is a problem, not the UI");

        var login = await host.Login();
        Assert.That(login["token"]!.GetValue<string>(), Is.Not.Empty);
    }

    [Test]
    public void A_UI_folder_without_index_html_stops_the_service_starting()
    {
        File.Delete(Path.Combine(_ui, "index.html"));
        Assert.That(() => { using var host = new ServiceHost(("UI_DIRECTORY", _ui)); },
            Throws.InvalidOperationException.With.Message.Contains("index.html"));
    }
}
