namespace CreditDashboard.Api.Routes;

/// <summary>
/// Maps the contract operations the service serves, inside the base-path group. CDS-19 maps none: each operation is
/// added here as CDS-25 implements it, and removed from the pending list in the contract coverage test.
/// </summary>
public static class ApiOperations
{
    public static RouteGroupBuilder MapOperations(this RouteGroupBuilder api) => api;
}
