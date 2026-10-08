using CreditDashboard.Api.Edge;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// The routes the service maps and the contract's operations stay in step (DR-050). Every contract operation is either
/// served or in <see cref="Pending"/>; no route exists outside the contract. CDS-25 moves operations from Pending to
/// served; the list is empty at the Phase 3 gate.
/// </summary>
public class ContractCoverageTests
{
    /// <summary>Contract operations not served yet, by operationId (36 of 36 at CDS-19; 29 once CDS-21 serves test control).</summary>
    private static readonly string[] Pending =
    [
        "login", "logout", "getMe", "getProfile", "updatePreferredName", "changeEmail", "resendEmailVerification",
        "changeMobile", "verifyMobile", "listBureaux", "getReportOverview", "getScore", "getScoreHistory", "listChanges",
        "getImpact", "getReportPaymentHistory", "listSearches", "getPersonalDetails", "listAccounts", "getAccountTotals",
        "getAccount", "getBalanceHistory", "getAccountPaymentHistory", "updateAccountDetail", "getDebtOverview",
        "listNotifications", "markNotificationRead", "setSummaryFeedback", "sendAssistantMessage",
    ];

    [Test]
    public void Every_contract_operation_is_served_or_pending_and_no_route_is_outside_the_contract()
    {
        using var factory = new WebApplicationFactory<Program>();
        var contract = factory.Services.GetRequiredService<ContractModel>();
        var routes = factory.Services.GetRequiredService<EndpointDataSource>().Endpoints
            .OfType<RouteEndpoint>()
            .Where(e => e.RoutePattern.RawText is { } raw && !raw.Contains("{*", StringComparison.Ordinal)) // not the fallback
            .SelectMany(e => (e.Metadata.GetMetadata<Microsoft.AspNetCore.Routing.HttpMethodMetadata>()?.HttpMethods ?? ["*"])
                .Select(method => (Method: method, Path: e.RoutePattern.RawText!)))
            .ToList();

        var outside = routes
            .Where(r => !r.Path.StartsWith(contract.BasePath + "/", StringComparison.Ordinal)
                        || contract.Find(r.Method, r.Path[contract.BasePath.Length..]) is null)
            .Select(r => $"{r.Method} {r.Path}")
            .ToList();
        var served = routes
            .Select(r => contract.Find(r.Method, r.Path[Math.Min(contract.BasePath.Length, r.Path.Length)..])?.Operation.OperationId)
            .OfType<string>()
            .ToHashSet();
        var all = contract.Operations.Select(o => o.OperationId).ToHashSet();

        Assert.That(outside, Is.Empty, "routes outside the contract");
        Assert.That(all, Has.Count.EqualTo(36), "contract operations");
        Assert.That(served.Intersect(Pending), Is.Empty, "served operations still listed as pending: remove them from Pending");
        Assert.That(all.Except(served).Except(Pending), Is.Empty, "contract operations neither served nor pending");
        Assert.That(Pending.Except(all), Is.Empty, "pending operations not in the contract");
    }
}
