// credit-dashboard-sut service: ASP.NET Core minimal API, contract first (DR-017, DR-050). Listens on
// http://localhost:4000 under /api/v1 (the contract's first server). Every request is gated (test control), delayed
// (test-control latency) and validated at the edge, then reaches the operations the service serves; CDS-21 serves the
// seven test-control operations, and the rest are mapped in the api group as CDS-25 implements them. The contract
// coverage test keeps the mapped set and the contract in step.
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;
using CreditDashboard.Api.Routes;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton(ContractModel.LoadEmbedded());
// Resolved lazily from the final configuration, so the host (and the tests) can supply TEST_CONTROL and TEST_CONTROL_KEY.
builder.Services.AddSingleton(sp => TestControlOptions.From(sp.GetRequiredService<IConfiguration>()));
builder.Services.AddSingleton(FixtureSet.LoadDefault());
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ControlledClock>();
builder.Services.AddSingleton<IControlledClock>(sp => sp.GetRequiredService<ControlledClock>());
builder.Services.AddSingleton<PersonaStore>();
builder.Services.AddSingleton(sp => AuthOptions.From(sp.GetRequiredService<IConfiguration>()));
builder.Services.AddSingleton<TokenStore>();

var app = builder.Build();
_ = app.Services.GetRequiredService<TestControlOptions>(); // TEST_CONTROL=true without a key stops the service here
_ = app.Services.GetRequiredService<AuthOptions>(); // so does a TOKEN_LIFETIME_MINUTES outside 1 to 1440
// UI_DIRECTORY (optional): a folder holding the built UI. Paths outside the API base path are then served from it, with
// index.html for any other GET so client-side routes survive a refresh (decision brief 11 D2). Without it the service is
// the API alone and every other path is a 404 problem. The folder must hold index.html, or the service does not start.
var uiDirectory = app.Configuration["UI_DIRECTORY"];
if (!string.IsNullOrWhiteSpace(uiDirectory))
{
    var uiRoot = Path.GetFullPath(uiDirectory);
    if (!File.Exists(Path.Combine(uiRoot, "index.html"))) throw new InvalidOperationException($"UI_DIRECTORY '{uiRoot}' has no index.html.");
    var apiBase = app.Services.GetRequiredService<ContractModel>().BasePath;
    app.MapWhen(context => !context.Request.Path.StartsWithSegments(apiBase), ui =>
    {
        ui.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(uiRoot) });
        ui.Run(async context =>
        {
            if (!HttpMethods.IsGet(context.Request.Method)) { await Problems.NotFound(context, "No operation matches this request."); return; }
            context.Response.ContentType = "text/html; charset=utf-8";
            context.Response.Headers.CacheControl = "no-store";
            await context.Response.SendFileAsync(Path.Combine(uiRoot, "index.html"));
        });
    });
}

app.UseMiddleware<TestControlGate>();
app.UseMiddleware<FlagsMiddleware>();
app.UseMiddleware<LatencyMiddleware>();
app.UseMiddleware<ContractValidation>();

app.MapGroup(app.Services.GetRequiredService<ContractModel>().BasePath).MapOperations();

app.MapFallback(context => Problems.NotFound(context, "This operation is not served yet."));

app.Run();

/// <summary>Entry point, public so the tests can host the service (WebApplicationFactory).</summary>
public partial class Program;
