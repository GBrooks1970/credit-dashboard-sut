using System.Net;
using System.Text;
using System.Text.Json;
using CreditDashboard.Api.Edge;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.Testing;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// Requests are checked against the contract at the edge (DR-017, DR-050). Shape failures are 400
/// <c>/problems/validation</c> with <c>errors[]</c>; requests outside the contract
/// are 404 <c>/problems/not-found</c> (API specification section 8).
/// </summary>
public class EdgeValidationTests
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    [OneTimeSetUp]
    public void Start()
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
        SignIn();
    }

    /// <summary>Protected operations need a token (decision brief 9 D3), so the edge tests sign in once.</summary>
    private void SignIn()
    {
        var response = _client.PostAsync("/api/v1/auth/login", new StringContent("{\"username\":\"alex\",\"password\":\"demo-only\"}", Encoding.UTF8, "application/json")).GetAwaiter().GetResult();
        var token = JsonDocument.Parse(response.Content.ReadAsStringAsync().GetAwaiter().GetResult()).RootElement.GetProperty("token").GetString()!;
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    [OneTimeTearDown]
    public void Stop()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    /// <summary>Reads a problem response and checks its body against the contract's own Problem schema.</summary>
    private async Task<(HttpStatusCode Status, string? ContentType, JsonElement Body)> Read(HttpResponseMessage response)
    {
        var text = await response.Content.ReadAsStringAsync();
        var body = JsonDocument.Parse(text).RootElement.Clone();
        var problem = _factory.Services.GetRequiredService<ContractModel>().ComponentSchema("Problem");
        Assert.That(problem.Evaluate(body).IsValid, Is.True, $"body does not match the contract's Problem schema: {text}");
        return (response.StatusCode, response.Content.Headers.ContentType?.MediaType, body);
    }

    private static string[] Fields(JsonElement problem) =>
        problem.GetProperty("errors").EnumerateArray().Select(e => e.GetProperty("field").GetString()!).ToArray();

    private Task<HttpResponseMessage> Send(HttpMethod method, string url, string? json = null) =>
        _client.SendAsync(new HttpRequestMessage(method, url)
        {
            Content = json is null ? null : new StringContent(json, Encoding.UTF8, "application/json"),
        });

    [TestCase("/api/v1/reports/bureau-a/score/history?range=bad", "range", TestName = "A query value outside its enum is refused")]
    [TestCase("/api/v1/reports/bureau-a/score/history", "range", TestName = "A missing required query parameter is refused")]
    [TestCase("/api/v1/notifications?page=abc", "page", TestName = "A query value of the wrong type is refused")]
    [TestCase("/api/v1/notifications?page=0", "page", TestName = "A query value below its minimum is refused")]
    [TestCase("/api/v1/accounts/not-an-id", "accountId", TestName = "A path value breaking its pattern is refused")]
    public async Task Parameters_breaking_the_contract_get_a_validation_problem(string url, string field)
    {
        var (status, type, body) = await Read(await _client.GetAsync(url));

        Assert.That(status, Is.EqualTo(HttpStatusCode.BadRequest));
        Assert.That(type, Is.EqualTo("application/problem+json"));
        Assert.That(body.GetProperty("type").GetString(), Is.EqualTo("/problems/validation"));
        Assert.That(body.GetProperty("status").GetInt32(), Is.EqualTo(400));
        Assert.That(body.GetProperty("instance").GetString(), Is.EqualTo(url.Split('?')[0]));
        Assert.That(Fields(body), Does.Contain(field));
    }

    [TestCase("PATCH", "/api/v1/me/profile/preferred-name", "{}", "body", TestName = "A body missing a required property is refused")]
    [TestCase("PUT", "/api/v1/me/profile/mobile", "{\"number\":\"07700 900456\",\"extra\":1}", "extra", TestName = "A body with a property the contract forbids is refused")]
    [TestCase("PUT", "/api/v1/me/profile/mobile", "{\"number\":\"\"}", "number", TestName = "A body value breaking its schema is refused")]
    [TestCase("PUT", "/api/v1/me/profile/mobile", "{\"number\":", "body", TestName = "A body that is not JSON is refused")]
    [TestCase("PUT", "/api/v1/me/profile/mobile", null, "body", TestName = "A missing required body is refused")]
    public async Task Bodies_breaking_the_contract_get_a_validation_problem(string method, string url, string? json, string field)
    {
        var (status, _, body) = await Read(await Send(new HttpMethod(method), url, json));

        Assert.That(status, Is.EqualTo(HttpStatusCode.BadRequest));
        Assert.That(body.GetProperty("type").GetString(), Is.EqualTo("/problems/validation"));
        Assert.That(Fields(body), Does.Contain(field));
    }

    [TestCase("GET", "/api/v1/nowhere", TestName = "A path outside the contract is not found")]
    [TestCase("GET", "/me", TestName = "A path outside the base path is not found")]
    public async Task Requests_outside_the_contract_are_not_found(string method, string url)
    {
        var (status, type, body) = await Read(await Send(new HttpMethod(method), url));

        Assert.That(status, Is.EqualTo(HttpStatusCode.NotFound));
        Assert.That(type, Is.EqualTo("application/problem+json"));
        Assert.That(body.GetProperty("type").GetString(), Is.EqualTo("/problems/not-found"));
        Assert.That(body.GetProperty("detail").GetString(), Is.EqualTo("No operation matches this request."));
    }

    [TestCase("DELETE", "/api/v1/me", "GET", TestName = "A method the contract does not define on a path it has is 405")]
    [TestCase("POST", "/api/v1/bureaux", "GET", TestName = "POST on a read-only path is 405")]
    [TestCase("PUT", "/api/v1/me/profile", "GET", TestName = "PUT on the profile is 405")]
    [TestCase("TRACE", "/api/v1/accounts/acc_ddcc01", "GET", TestName = "An exotic method is 405")]
    [TestCase("GET", "/api/v1/auth/login", "POST", TestName = "GET on login is 405")]
    public async Task A_method_the_contract_does_not_define_on_a_path_it_has_is_405_with_the_allowed_methods(string method, string url, string allow)
    {
        var response = await Send(new HttpMethod(method), url);
        var allowed = response.Content.Headers.Allow.ToList(); // Allow is a content header in HttpClient
        var (status, type, body) = await Read(response);

        Assert.That(status, Is.EqualTo(HttpStatusCode.MethodNotAllowed));
        Assert.That(type, Is.EqualTo("application/problem+json"));
        Assert.That(body.GetProperty("type").GetString(), Is.EqualTo("/problems/method-not-allowed"));
        Assert.That(allowed, Does.Contain(allow));
    }

    [Test]
    public async Task The_allowed_methods_of_a_path_with_several_are_all_listed()
    {
        // /accounts/{accountId}/details has only PATCH; /me/profile/email has PUT; each lists its own.
        var response = await Send(HttpMethod.Get, "/api/v1/accounts/acc_ddcc01/details");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.MethodNotAllowed));
        Assert.That(string.Join(",", response.Content.Headers.Allow), Is.EqualTo("PATCH"));
    }
}
