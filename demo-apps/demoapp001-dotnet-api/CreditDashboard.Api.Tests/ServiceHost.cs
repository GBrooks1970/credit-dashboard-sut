using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Edge;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// A service instance for a test: test control on with a known key, a client, and helpers to sign in, set the clock and bind
/// personas through the same operations the harness will use. Every response can be checked against the contract.
/// </summary>
internal sealed class ServiceHost : IDisposable
{
    public const string ControlKey = "test-key";
    public const string Base = "/api/v1";

    private readonly WebApplicationFactory<Program> _factory;

    public ServiceHost(params (string Name, string Value)[] settings)
    {
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("TEST_CONTROL", "true");
            builder.UseSetting("TEST_CONTROL_KEY", ControlKey);
            foreach (var (name, value) in settings) builder.UseSetting(name, value);
        });
        Client = _factory.CreateClient();
    }

    public HttpClient Client { get; }

    public IServiceProvider Services => _factory.Services;

    public ContractModel Contract => Services.GetRequiredService<ContractModel>();

    public static StringContent Json(string json) => new(json, Encoding.UTF8, "application/json");

    public Task<HttpResponseMessage> Send(HttpMethod method, string path, string? json = null, string? token = null, string? control = null)
    {
        var request = new HttpRequestMessage(method, Base + path) { Content = json is null ? null : Json(json) };
        if (token is not null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (control is not null) request.Headers.Add("X-Test-Control-Key", control);
        return Client.SendAsync(request);
    }

    public Task<HttpResponseMessage> Control(HttpMethod method, string path, string? json = null) =>
        Send(method, "/__test" + path, json, control: ControlKey);

    public async Task<JsonObject> Login(string username = "alex", string password = "demo-only")
    {
        var response = await Send(HttpMethod.Post, "/auth/login", $$"""{"username":"{{username}}","password":"{{password}}"}""");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK), await response.Content.ReadAsStringAsync());
        return JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
    }

    public async Task<string> Token(string username = "alex") => (await Login(username))["token"]!.GetValue<string>();

    public async Task Freeze(string instant) =>
        Assert.That((await Control(HttpMethod.Put, "/clock", $$"""{"now":"{{instant}}"}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

    public async Task Bind(string username, string persona) =>
        Assert.That((await Control(HttpMethod.Put, $"/users/{username}/persona", $$"""{"persona":"{{persona}}"}""")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

    /// <summary>Reads a JSON body (object or array) and checks it against the contract's schema for this operation and status.</summary>
    public async Task<JsonNode?> Checked(string operationId, HttpResponseMessage response)
    {
        var text = await response.Content.ReadAsStringAsync();
        var status = (int)response.StatusCode;
        var schema = Contract.ResponseSchema(operationId, status);
        if (schema is null)
        {
            Assert.That(text, Is.Empty, $"{operationId} {status} has no JSON schema in the contract, so it should have no body");
            return null;
        }
        using var doc = JsonDocument.Parse(text);
        Assert.That(schema.Evaluate(doc.RootElement).IsValid, Is.True, $"{operationId} {status} body does not match the contract: {text}");
        return JsonNode.Parse(text);
    }

    public void Dispose()
    {
        Client.Dispose();
        _factory.Dispose();
    }
}
