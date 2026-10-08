namespace CreditDashboard.Api.Routes;

/// <summary>
/// Maps the contract operations the service serves, inside the base-path group. CDS-21 maps the seven test-control
/// operations (always mapped; the gate answers 404 unless test control is on). The rest are added here as CDS-25
/// implements them, and removed from the pending list in the contract coverage test.
/// </summary>
public static class ApiOperations
{
    public static RouteGroupBuilder MapOperations(this RouteGroupBuilder api) => api.MapTestControl().MapSession().MapReport().MapAccounts().MapSupporting();
}
