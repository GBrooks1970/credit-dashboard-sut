using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using CreditDashboard.Api.Control;
using CreditDashboard.Api.Edge;
using CreditDashboard.BusinessRules.Profile;

namespace CreditDashboard.Api.Routes;

/// <summary>
/// The profile operations (API specification 6.6; cases in operations-cases.md section 6), on the CDS-27 functions. The stored
/// profile is the persona's <c>profile</c> block plus the signed-in user (legal name, date of birth, email address); what the
/// user changes lives in their session, so a rebind or a reset restores the stored profile.
/// </summary>
public static partial class ProfileOperations
{
    public static RouteGroupBuilder MapProfile(this RouteGroupBuilder api)
    {
        api.MapGet("/me/profile", GetProfile);
        api.MapPatch("/me/profile/preferred-name", UpdatePreferredName);
        api.MapPut("/me/profile/email", ChangeEmail);
        api.MapPost("/me/profile/email/verification", ResendEmailVerification);
        api.MapPut("/me/profile/mobile", ChangeMobile);
        api.MapPost("/me/profile/mobile/verification", VerifyMobile);
        return api;
    }

    private static string Name(EmailStatus status) => status == EmailStatus.Verified ? "verified" : "unverified";

    private static string Name(bool verified) => verified ? "verified" : "unverified";

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailShape();

    /// <summary>The email this session as the library types it: the user's address and the persona's status, or the user's edits.</summary>
    private static (string Address, EmailStatus Status, DateTimeOffset? LinkSentAt) CurrentEmail(PersonaStore store, string username, JsonObject profile)
    {
        var stored = profile["emailStatus"]!.GetValue<string>() == "verified" ? EmailStatus.Verified : EmailStatus.Unverified;
        return store.Session(username).Email(store.FindUser(username)!.Email, stored);
    }

    private static JsonNode? Mobile(PersonaStore store, string username, JsonObject profile)
    {
        if (store.Session(username).Mobile is { } edited)
            return new JsonObject { ["lastDigits"] = edited.LastDigits, ["status"] = Name(edited.Verified) };
        return profile["mobile"]?.DeepClone();
    }

    private static async Task GetProfile(HttpContext context, PersonaStore store)
    {
        var username = Http.Username(context);
        var user = store.FindUser(username)!;
        var profile = store.Document(username)["profile"]!.AsObject();
        var session = store.Session(username);
        var email = CurrentEmail(store, username, profile);
        var finances = profile["finances"]!.AsObject();
        await Http.Json(context, new JsonObject
        {
            ["legalName"] = user.LegalName,
            ["dateOfBirth"] = user.DateOfBirth,
            ["memberSince"] = profile["memberSince"]!.GetValue<string>(),
            ["preferredName"] = session.PreferredNameOr(profile["preferredName"]?.GetValue<string>()),
            ["email"] = new JsonObject { ["address"] = email.Address, ["status"] = Name(email.Status) },
            ["mobile"] = Mobile(store, username, profile),
            ["address"] = profile["address"]?.DeepClone(),
            ["employment"] = profile["employment"]?.DeepClone(),
            ["finances"] = new JsonObject { ["added"] = Finances.Tile(finances["added"]!.GetValue<bool>() ? finances : null).Added },
        });
    }

    private static async Task UpdatePreferredName(HttpContext context, PersonaStore store)
    {
        var submitted = (await Http.Body(context))["preferredName"]?.GetValue<string>();
        var result = PreferredName.Validate(submitted);
        if (result.Outcome == PreferredNameOutcome.Rejected)
        {
            await Problems.RuleViolation(context, "preferred-name", "Preferred name refused", "A preferred name is 1 to 30 letters, spaces, hyphens or apostrophes (PR-02).");
            return;
        }
        store.Session(Http.Username(context)).SetPreferredName(result.Value);
        await Http.Json(context, new JsonObject { ["preferredName"] = result.Value });
    }

    private static async Task ChangeEmail(HttpContext context, PersonaStore store, IControlledClock clock)
    {
        var submitted = (await Http.Body(context))["address"]!.GetValue<string>().Trim();
        if (!EmailShape().IsMatch(submitted))
        {
            await Problems.Validation(context, [new FieldError("address", "must be an email address")]);
            return;
        }
        var username = Http.Username(context);
        var current = CurrentEmail(store, username, store.Document(username)["profile"]!.AsObject());
        var result = Email.Change(current.Address, current.Status, submitted);
        // A link is sent only when the address changed (PR-04): that instant starts the 60 seconds before the next resend (PR-09).
        if (result.Changed) store.Session(username).SetEmail(result.Address, result.Status, result.LinkSent ? clock.UtcNow : null);
        await Http.Json(context, new JsonObject { ["address"] = result.Address, ["status"] = Name(result.Status) });
    }

    private static async Task ResendEmailVerification(HttpContext context, PersonaStore store, IControlledClock clock)
    {
        var username = Http.Username(context);
        var current = CurrentEmail(store, username, store.Document(username)["profile"]!.AsObject());
        var now = clock.UtcNow;
        var result = Email.Resend(current.Status, current.LinkSentAt, now);
        switch (result.Outcome)
        {
            case ResendOutcome.AlreadyVerified:
                await Problems.RuleViolation(context, "already-verified", "Email already verified", "This email address is already verified (PR-09).");
                return;
            case ResendOutcome.RateLimited:
                await Problems.RateLimited(context, result.RetryAfterSeconds!.Value);
                return;
        }
        store.Session(username).SetLinkSent(now);
        context.Response.StatusCode = StatusCodes.Status202Accepted;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(new JsonObject
        {
            ["sentAt"] = Http.Instant(now),
            ["nextResendAt"] = Http.Instant(now + CreditDashboard.BusinessRules.Profile.Email.ResendInterval),
        }.ToJsonString(), context.RequestAborted);
    }

    private static async Task ChangeMobile(HttpContext context, PersonaStore store, IControlledClock clock)
    {
        var normalised = Mobile_Normalise((await Http.Body(context))["number"]!.GetValue<string>());
        if (normalised is null)
        {
            await Problems.RuleViolation(context, "mobile-number", "Not a UK mobile number", "Enter a UK mobile number starting 07 or +447 (PR-06).");
            return;
        }
        var challenge = CreditDashboard.BusinessRules.Profile.Mobile.Issue(clock.UtcNow);
        var lastDigits = CreditDashboard.BusinessRules.Profile.Mobile.LastThreeDigits(normalised)!;
        store.Session(Http.Username(context)).Mobile = new MobileState(lastDigits, false, challenge);
        await Http.Json(context, new JsonObject
        {
            ["lastDigits"] = lastDigits,
            ["status"] = "unverified",
            ["expiresAt"] = Http.Instant(challenge.ExpiresAt),
            ["attemptsRemaining"] = challenge.AttemptsRemaining,
        });
    }

    private static string? Mobile_Normalise(string submitted) => CreditDashboard.BusinessRules.Profile.Mobile.Normalise(submitted);

    private static async Task VerifyMobile(HttpContext context, PersonaStore store, IControlledClock clock)
    {
        var username = Http.Username(context);
        var session = store.Session(username);
        var code = (await Http.Body(context))["code"]!.GetValue<string>();
        var held = session.Mobile;
        var result = CreditDashboard.BusinessRules.Profile.Mobile.Check(held?.Challenge, code, clock.UtcNow);

        if (held is not null && result.Challenge is not null)
            session.Mobile = held with { Challenge = result.Challenge, Verified = held.Verified || result.Outcome == CodeOutcome.Verified };

        switch (result.Outcome)
        {
            case CodeOutcome.Verified:
                await Http.Json(context, new JsonObject { ["lastDigits"] = held!.LastDigits, ["status"] = "verified" });
                return;
            case CodeOutcome.Wrong:
                await Problems.CodeWrong(context, result.AttemptsRemaining!.Value);
                return;
            default:
                await Problems.RuleViolation(context, "code-invalid", "Request a new code",
                    "This code can no longer be used. Add the number again to get a new code.");
                return;
        }
    }
}
