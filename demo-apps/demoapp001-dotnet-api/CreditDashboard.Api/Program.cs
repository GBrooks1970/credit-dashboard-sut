// credit-dashboard-sut service: ASP.NET Core minimal API, contract first (DR-017, DR-050). Listens on
// http://localhost:4000 under /api/v1 (the contract's first server). CDS-19 serves no operation yet: every request is
// validated at the edge, then reaches the fallback. Operations are mapped in the api group as CDS-25 implements them,
// and the contract coverage test keeps the mapped set and the contract in step.
using CreditDashboard.Api.Edge;
using CreditDashboard.Api.Routes;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton(ContractModel.LoadEmbedded());

var app = builder.Build();
app.UseMiddleware<ContractValidation>();

app.MapGroup(app.Services.GetRequiredService<ContractModel>().BasePath).MapOperations();

app.MapFallback(context => Problems.NotFound(context, "This operation is not served yet."));

app.Run();

/// <summary>Entry point, public so the tests can host the service (WebApplicationFactory).</summary>
public partial class Program;
