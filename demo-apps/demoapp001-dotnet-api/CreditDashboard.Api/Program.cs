// credit-dashboard-sut service: ASP.NET Core minimal API, contract first (DR-017, DR-050). Listens on
// http://localhost:4000 under /api/v1 (the contract's first server). Every request is gated (test control), delayed
// (test-control latency) and validated at the edge, then reaches the operations the service serves; CDS-21 serves the
// seven test-control operations, and the rest are mapped in the api group as CDS-25 implements them. The contract
// coverage test keeps the mapped set and the contract in step.
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;
using CreditDashboard.Api.Routes;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton(ContractModel.LoadEmbedded());
// Resolved lazily from the final configuration, so the host (and the tests) can supply TEST_CONTROL and TEST_CONTROL_KEY.
builder.Services.AddSingleton(sp => TestControlOptions.From(sp.GetRequiredService<IConfiguration>()));
builder.Services.AddSingleton(FixtureSet.LoadDefault());
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ControlledClock>();
builder.Services.AddSingleton<IControlledClock>(sp => sp.GetRequiredService<ControlledClock>());
builder.Services.AddSingleton<PersonaStore>();

var app = builder.Build();
_ = app.Services.GetRequiredService<TestControlOptions>(); // TEST_CONTROL=true without a key stops the service here
app.UseMiddleware<TestControlGate>();
app.UseMiddleware<LatencyMiddleware>();
app.UseMiddleware<ContractValidation>();

app.MapGroup(app.Services.GetRequiredService<ContractModel>().BasePath).MapOperations();

app.MapFallback(context => Problems.NotFound(context, "This operation is not served yet."));

app.Run();

/// <summary>Entry point, public so the tests can host the service (WebApplicationFactory).</summary>
public partial class Program;
