using System.Net;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// Every served operation answers its success status with a body that validates against the contract (CDS-25 verification).
/// Each slice adds its operations to <see cref="Samples"/>; a second test fails if a served operation has no sample, so a
/// slice cannot be merged with an operation that was never checked.
/// </summary>
public class OperationResponseTests
{
    /// <summary>One request per served operation: its ID, method, path (under the base path), body and success status.</summary>
    internal static readonly (string OperationId, HttpMethod Method, string Path, string? Body, HttpStatusCode Status)[] Samples =
    [
        ("login", HttpMethod.Post, "/auth/login", """{"username":"alex","password":"demo-only"}""", HttpStatusCode.OK),
        ("getMe", HttpMethod.Get, "/me", null, HttpStatusCode.OK),
        ("listBureaux", HttpMethod.Get, "/bureaux", null, HttpStatusCode.OK),
        ("testGetState", HttpMethod.Get, "/__test/state", null, HttpStatusCode.OK),
        ("testReset", HttpMethod.Post, "/__test/reset", null, HttpStatusCode.NoContent),
        ("testBindPersona", HttpMethod.Put, "/__test/users/alex/persona", """{"persona":"excellent"}""", HttpStatusCode.NoContent),
        ("testSetBugs", HttpMethod.Put, "/__test/bugs", """{"flags":["idor"]}""", HttpStatusCode.NoContent),
        ("testSetClock", HttpMethod.Put, "/__test/clock", """{"now":"2026-10-03T09:00:00Z"}""", HttpStatusCode.NoContent),
        ("testSetLatency", HttpMethod.Put, "/__test/latency", """{"fixedMs":0}""", HttpStatusCode.NoContent),
        ("testVerifyEmail", HttpMethod.Post, "/__test/verify-email", """{"username":"alex"}""", HttpStatusCode.NoContent),
        // logout revokes the token, so it runs last
        ("logout", HttpMethod.Post, "/auth/logout", null, HttpStatusCode.NoContent),
    ];

    [Test]
    public async Task Every_sample_answers_its_success_status_and_validates_against_the_contract()
    {
        using var service = new ServiceHost();
        var token = await service.Token();
        foreach (var (operationId, method, path, body, status) in Samples)
        {
            var response = await service.Send(method, path, body, token, ServiceHost.ControlKey);
            Assert.That(response.StatusCode, Is.EqualTo(status), $"{operationId}: {await response.Content.ReadAsStringAsync()}");
            await service.Checked(operationId, response);
        }
    }

    [Test]
    public void Every_served_operation_has_a_sample()
    {
        using var service = new ServiceHost();
        var served = service.Contract.Operations.Select(o => o.OperationId).Except(ContractCoverageTests.Pending).Order();
        Assert.That(Samples.Select(s => s.OperationId).Order(), Is.EqualTo(served), "served operations and samples differ");
    }

    [Test]
    public async Task Every_problem_answer_validates_against_the_contract_Problem_schema()
    {
        using var service = new ServiceHost();
        foreach (var (operationId, path, token, status) in new (string, string, string?, HttpStatusCode)[]
        {
            ("getMe", "/me", null, HttpStatusCode.Unauthorized),
            ("listBureaux", "/bureaux", "tok_unknown", HttpStatusCode.Unauthorized),
        })
        {
            var response = await service.Send(HttpMethod.Get, path, token: token);
            Assert.That(response.StatusCode, Is.EqualTo(status));
            Assert.That((await service.Checked(operationId, response))!["type"]!.GetValue<string>(), Is.EqualTo("/problems/unauthenticated"));
        }
    }
}
