using System.Net;
using System.Text.Json.Nodes;
using CreditDashboard.Api.Control;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// Slice S5 of CDS-25: the six profile operations on the CDS-27 functions. Cases: DOCS/.design/operations-cases.md section 6 and
/// profile-rules-cases.md. The clock is frozen at 2026-10-03T09:00:00Z; the user holds the excellent persona (email and mobile
/// verified, preferred name Al) unless a test binds the struggling one (both unverified, no preferred name). Every response is
/// checked against the contract.
/// </summary>
public class ProfileOperationTests
{
    private ServiceHost _service = null!;
    private const string T0 = "2026-10-03T09:00:00Z";

    [SetUp]
    public async Task Start()
    {
        _service = new ServiceHost();
        await _service.Freeze(T0);
    }

    [TearDown]
    public void Stop() => _service.Dispose();

    private async Task<(HttpStatusCode Status, JsonNode? Body, HttpResponseMessage Response)> Call(string operationId, string path, HttpMethod? method = null, string? json = null, string user = "alex")
    {
        var response = await _service.Send(method ?? HttpMethod.Get, path, json, await _service.Token(user));
        return (response.StatusCode, await _service.Checked(operationId, response), response);
    }

    private Task<(HttpStatusCode Status, JsonNode? Body, HttpResponseMessage Response)> Profile(string user = "alex") => Call("getProfile", "/me/profile", user: user);

    private Task<(HttpStatusCode Status, JsonNode? Body, HttpResponseMessage Response)> Name(string json) =>
        Call("updatePreferredName", "/me/profile/preferred-name", new HttpMethod("PATCH"), json);

    private Task<(HttpStatusCode Status, JsonNode? Body, HttpResponseMessage Response)> Email(string address) =>
        Call("changeEmail", "/me/profile/email", HttpMethod.Put, new JsonObject { ["address"] = address }.ToJsonString());

    private Task<(HttpStatusCode Status, JsonNode? Body, HttpResponseMessage Response)> Resend() =>
        Call("resendEmailVerification", "/me/profile/email/verification", HttpMethod.Post);

    private Task<(HttpStatusCode Status, JsonNode? Body, HttpResponseMessage Response)> AddMobile(string number) =>
        Call("changeMobile", "/me/profile/mobile", HttpMethod.Put, new JsonObject { ["number"] = number }.ToJsonString());

    private Task<(HttpStatusCode Status, JsonNode? Body, HttpResponseMessage Response)> Code(string code) =>
        Call("verifyMobile", "/me/profile/mobile/verification", HttpMethod.Post, new JsonObject { ["code"] = code }.ToJsonString());

    // getProfile

    [Test]
    public async Task The_excellent_profile_composes_the_user_and_the_stored_profile()
    {
        var (status, body, _) = await Profile();
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((body!["legalName"]!.GetValue<string>(), body["dateOfBirth"]!.GetValue<string>(), body["memberSince"]!.GetValue<string>()),
            Is.EqualTo(("Alex Example", "1985-03-12", "2021-06-01")));
        Assert.That((body["preferredName"]!.GetValue<string>(), body["email"]!["address"]!.GetValue<string>(), body["email"]!["status"]!.GetValue<string>()),
            Is.EqualTo(("Al", "alex.example@example.com", "verified")));
        Assert.That((body["mobile"]!["lastDigits"]!.GetValue<string>(), body["mobile"]!["status"]!.GetValue<string>()), Is.EqualTo(("123", "verified")));
        Assert.That(body["address"]!["line1"]!.GetValue<string>(), Is.EqualTo("1 Example Street"));
        Assert.That(body["employment"]!["status"]!.GetValue<string>(), Is.EqualTo("employed-full-time"));
        Assert.That(body["finances"]!["added"]!.GetValue<bool>(), Is.True);
    }

    [Test]
    public async Task The_profile_never_carries_a_full_mobile_number_or_a_finance_figure()
    {
        var text = (await Profile()).Body!.ToJsonString();
        Assert.That(text, Does.Not.Contain("+44").And.Not.Contain("07700"));
        Assert.That(((JsonObject)(await Profile()).Body!["finances"]!).Select(p => p.Key), Is.EqualTo(new[] { "added" }), "PR-07: nothing but whether finances are added");
    }

    [Test]
    public async Task The_thin_file_profile_has_empty_blocks()
    {
        await _service.Bind("alex", "thin-file");
        var (_, body, _) = await Profile();
        Assert.That((body!["mobile"], body["address"], body["employment"]), Is.EqualTo(((JsonNode?)null, (JsonNode?)null, (JsonNode?)null)));
        Assert.That(body["finances"]!["added"]!.GetValue<bool>(), Is.False);
    }

    [Test]
    public async Task The_struggling_profile_has_an_unverified_email_and_mobile()
    {
        await _service.Bind("alex", "struggling");
        var (_, body, _) = await Profile();
        Assert.That((body!["email"]!["status"]!.GetValue<string>(), body["mobile"]!["status"]!.GetValue<string>(), body["preferredName"]), Is.EqualTo(("unverified", "unverified", (JsonNode?)null)));
    }

    [Test]
    public async Task Test_control_makes_an_email_verified_and_a_later_change_makes_it_unverified_again()
    {
        await _service.Bind("alex", "struggling");
        await _service.Control(HttpMethod.Post, "/verify-email", """{"username":"alex"}""");
        Assert.That((await Profile()).Body!["email"]!["status"]!.GetValue<string>(), Is.EqualTo("verified"));
        await Email("other@example.com");
        Assert.That((await Profile()).Body!["email"]!["status"]!.GetValue<string>(), Is.EqualTo("unverified"), "the newest change wins");
    }

    [Test]
    public async Task One_users_profile_edits_are_not_anothers()
    {
        await _service.Bind("sam", "excellent");
        await Name("""{"preferredName":"Zed"}""");
        Assert.That((await Profile("sam")).Body!["preferredName"]!.GetValue<string>(), Is.EqualTo("Al"));
    }

    // updatePreferredName

    private async Task<string> Greeting() =>
        (await _service.Checked("getMe", await _service.Send(HttpMethod.Get, "/me", token: await _service.Token())))!["greetingName"]!.GetValue<string>();

    [Test]
    public async Task A_name_is_trimmed_stored_and_used_in_the_greeting()
    {
        var (status, body, _) = await Name("""{"preferredName":"  Sam  "}""");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["preferredName"]!.GetValue<string>(), Is.EqualTo("Sam"));
        Assert.That((await Profile()).Body!["preferredName"]!.GetValue<string>(), Is.EqualTo("Sam"));
        Assert.That(await Greeting(), Is.EqualTo("Sam"));
    }

    [TestCase("""{"preferredName":""}""")]
    [TestCase("""{"preferredName":"   "}""")]
    [TestCase("""{"preferredName":null}""")]
    public async Task An_empty_or_null_name_clears_it_and_the_greeting_falls_back_to_the_legal_first_name(string json)
    {
        var (status, body, _) = await Name(json);
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["preferredName"], Is.Null);
        Assert.That(await Greeting(), Is.EqualTo("Alex"));
    }

    [TestCase("""{"preferredName":"Sam2"}""")]
    [TestCase("""{"preferredName":"Sam!"}""")]
    [TestCase("""{"preferredName":"abcdefghijklmnopqrstuvwxyzabcde"}""")]
    public async Task A_name_that_breaks_PR_02_is_a_422_and_changes_nothing(string json)
    {
        var (status, body, _) = await Name(json);
        Assert.That(status, Is.EqualTo(HttpStatusCode.UnprocessableEntity));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/rule-violation/preferred-name"));
        Assert.That((await Profile()).Body!["preferredName"]!.GetValue<string>(), Is.EqualTo("Al"));
    }

    [TestCase("""{}""")]
    [TestCase("""{"preferredName":5}""")]
    public async Task A_body_that_is_not_a_string_or_null_is_a_400(string json) =>
        Assert.That((await Name(json)).Status, Is.EqualTo(HttpStatusCode.BadRequest));

    [Test]
    public async Task A_name_over_one_hundred_characters_is_a_400() =>
        Assert.That((await Name($$"""{"preferredName":"{{new string('a', 101)}}"}""")).Status, Is.EqualTo(HttpStatusCode.BadRequest));

    [Test]
    public async Task A_rebind_restores_the_stored_preferred_name()
    {
        await Name("""{"preferredName":"Sam"}""");
        await _service.Bind("alex", "excellent");
        Assert.That((await Profile()).Body!["preferredName"]!.GetValue<string>(), Is.EqualTo("Al"));
    }

    // changeEmail

    [Test]
    public async Task A_different_address_is_stored_unverified()
    {
        var (status, body, _) = await Email("b@example.com");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((body!["address"]!.GetValue<string>(), body["status"]!.GetValue<string>()), Is.EqualTo(("b@example.com", "unverified")));
        Assert.That((await Profile()).Body!["email"]!["address"]!.GetValue<string>(), Is.EqualTo("b@example.com"));
    }

    [TestCase("alex.example@example.com")]
    [TestCase("ALEX.EXAMPLE@Example.com")]
    [TestCase("  alex.example@example.com  ")]
    public async Task The_address_already_held_is_kept_with_its_status(string submitted)
    {
        var (status, body, _) = await Email(submitted);
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((body!["address"]!.GetValue<string>(), body["status"]!.GetValue<string>()), Is.EqualTo(("alex.example@example.com", "verified")));
    }

    [Test]
    public async Task Submitting_the_same_unverified_address_sends_no_new_link()
    {
        await _service.Bind("alex", "struggling");
        await Email("sam.sample@example.com"); // the struggling persona's user is alex here, so this is a different address
        await _service.Bind("alex", "struggling");
        await Email("alex.example@example.com"); // the held address: unchanged, no link
        var (status, _, _) = await Resend();
        Assert.That(status, Is.EqualTo(HttpStatusCode.Accepted), "no link was sent by the unchanged submission, so a resend is allowed at once");
    }

    [TestCase("not-an-email")]
    [TestCase("a@b")]
    [TestCase("")]
    public async Task An_address_that_is_not_an_email_is_a_400(string address)
    {
        var (status, body, _) = await Email(address);
        Assert.That(status, Is.EqualTo(HttpStatusCode.BadRequest));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/validation"));
    }

    // resendEmailVerification

    [Test]
    public async Task A_resend_to_an_unverified_email_with_no_link_sent_is_accepted()
    {
        await _service.Bind("alex", "struggling");
        var (status, body, _) = await Resend();
        Assert.That(status, Is.EqualTo(HttpStatusCode.Accepted));
        Assert.That(DateTimeOffset.Parse(body!["sentAt"]!.GetValue<string>()), Is.EqualTo(DateTimeOffset.Parse(T0)));
        Assert.That(DateTimeOffset.Parse(body["nextResendAt"]!.GetValue<string>()), Is.EqualTo(DateTimeOffset.Parse(T0).AddSeconds(60)));
    }

    [Test]
    public async Task A_resend_within_a_minute_is_a_429_with_the_seconds_to_wait()
    {
        await _service.Bind("alex", "struggling");
        await Resend();

        var (status, body, response) = await Resend();
        Assert.That(status, Is.EqualTo(HttpStatusCode.TooManyRequests));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/rate-limited"));
        Assert.That(response.Headers.RetryAfter!.Delta, Is.EqualTo(TimeSpan.FromSeconds(60)));

        await _service.Freeze("2026-10-03T09:00:30Z");
        Assert.That((await Resend()).Response.Headers.RetryAfter!.Delta, Is.EqualTo(TimeSpan.FromSeconds(30)));
    }

    [Test]
    public async Task A_resend_after_exactly_a_minute_is_accepted()
    {
        await _service.Bind("alex", "struggling");
        await Resend();
        await _service.Freeze("2026-10-03T09:00:59Z");
        Assert.That((await Resend()).Status, Is.EqualTo(HttpStatusCode.TooManyRequests), "59 seconds");
        await _service.Freeze("2026-10-03T09:01:00Z");
        Assert.That((await Resend()).Status, Is.EqualTo(HttpStatusCode.Accepted), "60 seconds");
    }

    [Test]
    public async Task A_resend_to_a_verified_email_is_a_422()
    {
        var (status, body, _) = await Resend();
        Assert.That(status, Is.EqualTo(HttpStatusCode.UnprocessableEntity));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/rule-violation/already-verified"));
    }

    [Test]
    public async Task A_resend_straight_after_an_email_change_is_a_429()
    {
        await Email("b@example.com");
        Assert.That((await Resend()).Status, Is.EqualTo(HttpStatusCode.TooManyRequests), "the change sent the link");
    }

    // changeMobile

    [Test]
    public async Task A_uk_number_is_held_unverified_and_a_code_is_pending()
    {
        await _service.Bind("alex", "struggling");
        var (status, body, _) = await AddMobile("07700 900456");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((body!["lastDigits"]!.GetValue<string>(), body["status"]!.GetValue<string>(), body["attemptsRemaining"]!.GetValue<int>()), Is.EqualTo(("456", "unverified", 3)));
        Assert.That(DateTimeOffset.Parse(body["expiresAt"]!.GetValue<string>()), Is.EqualTo(DateTimeOffset.Parse(T0).AddMinutes(10)));
        Assert.That((await Profile()).Body!["mobile"]!["lastDigits"]!.GetValue<string>(), Is.EqualTo("456"));
    }

    [TestCase("07700900456")]
    [TestCase("+447700900456")]
    [TestCase("+44 7700 900456")]
    public async Task Each_uk_form_is_accepted(string number) =>
        Assert.That((await AddMobile(number)).Status, Is.EqualTo(HttpStatusCode.OK));

    [TestCase("01632 960456")]
    [TestCase("07700-900456")]
    [TestCase("447700900456")]
    public async Task A_number_that_is_not_a_uk_mobile_is_a_422_and_changes_nothing(string number)
    {
        var (status, body, _) = await AddMobile(number);
        Assert.That(status, Is.EqualTo(HttpStatusCode.UnprocessableEntity));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/rule-violation/mobile-number"));
        Assert.That((await Profile()).Body!["mobile"]!["lastDigits"]!.GetValue<string>(), Is.EqualTo("123"));
    }

    [Test]
    public async Task An_empty_number_is_a_400() => Assert.That((await AddMobile("")).Status, Is.EqualTo(HttpStatusCode.BadRequest));

    [Test]
    public async Task Adding_a_number_again_starts_a_fresh_challenge_with_three_attempts()
    {
        await AddMobile("07700 900456");
        await Code("000000");
        var (_, body, _) = await AddMobile("07700 900789");
        Assert.That((body!["lastDigits"]!.GetValue<string>(), body["attemptsRemaining"]!.GetValue<int>()), Is.EqualTo(("789", 3)));
    }

    // verifyMobile

    [Test]
    public async Task The_right_code_verifies_the_number()
    {
        await AddMobile("07700 900456");
        var (status, body, _) = await Code("123456");
        Assert.That(status, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((body!["lastDigits"]!.GetValue<string>(), body["status"]!.GetValue<string>()), Is.EqualTo(("456", "verified")));
        Assert.That((await Profile()).Body!["mobile"]!["status"]!.GetValue<string>(), Is.EqualTo("verified"));
    }

    [Test]
    public async Task The_code_is_accepted_up_to_ten_minutes_after_issue_and_not_at_ten()
    {
        await AddMobile("07700 900456");
        await _service.Freeze("2026-10-03T09:09:59Z");
        Assert.That((await Code("123456")).Status, Is.EqualTo(HttpStatusCode.OK), "9 minutes 59 seconds");

        await AddMobile("07700 900456");
        await _service.Freeze("2026-10-03T09:19:59Z");
        await AddMobile("07700 900456");
        await _service.Freeze("2026-10-03T09:29:59Z");
        var (status, body, _) = await Code("123456");
        Assert.That(status, Is.EqualTo(HttpStatusCode.UnprocessableEntity), "10 minutes after the last issue");
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/rule-violation/code-invalid"));
    }

    [Test]
    public async Task Wrong_codes_count_down_and_the_third_voids_the_challenge()
    {
        await AddMobile("07700 900456");

        var (s1, first, _) = await Code("000000");
        Assert.That((s1, first!["type"]!.GetValue<string>(), first["attemptsRemaining"]!.GetValue<int>()), Is.EqualTo((HttpStatusCode.UnprocessableEntity, "/problems/rule-violation/code-wrong", 2)));
        var (_, second, _) = await Code("000000");
        Assert.That(second!["attemptsRemaining"]!.GetValue<int>(), Is.EqualTo(1));

        var (s3, third, _) = await Code("000000");
        Assert.That((s3, third!["type"]!.GetValue<string>()), Is.EqualTo((HttpStatusCode.UnprocessableEntity, "/problems/rule-violation/code-invalid")));
        Assert.That(third.AsObject().ContainsKey("attemptsRemaining"), Is.False, "code-invalid carries no attempts");

        var (afterVoid, afterBody, _) = await Code("123456");
        Assert.That((afterVoid, afterBody!["type"]!.GetValue<string>()), Is.EqualTo((HttpStatusCode.UnprocessableEntity, "/problems/rule-violation/code-invalid")), "the right code after a voided challenge");
    }

    [Test]
    public async Task The_right_code_after_two_wrong_ones_still_verifies()
    {
        await AddMobile("07700 900456");
        await Code("000000");
        await Code("000000");
        Assert.That((await Code("123456")).Status, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task A_code_with_nothing_pending_is_refused_as_invalid()
    {
        var (status, body, _) = await Code("123456");
        Assert.That(status, Is.EqualTo(HttpStatusCode.UnprocessableEntity));
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/rule-violation/code-invalid"));
    }

    [Test]
    public async Task A_stored_unverified_number_has_no_challenge_so_its_code_is_invalid()
    {
        await _service.Bind("alex", "struggling");
        Assert.That((await Code("123456")).Status, Is.EqualTo(HttpStatusCode.UnprocessableEntity));
    }

    [Test]
    public async Task A_verified_challenge_cannot_be_used_again()
    {
        await AddMobile("07700 900456");
        await Code("123456");
        Assert.That((await Code("123456")).Status, Is.EqualTo(HttpStatusCode.UnprocessableEntity));
    }

    [TestCase("12")]
    [TestCase("abcdef")]
    public async Task A_code_that_is_not_six_digits_is_a_400(string code) =>
        Assert.That((await Code(code)).Status, Is.EqualTo(HttpStatusCode.BadRequest));

    [Test]
    public async Task A_rebind_or_a_reset_clears_a_pending_challenge_and_the_added_number()
    {
        await AddMobile("07700 900456");
        await _service.Bind("alex", "excellent");
        Assert.That((await Profile()).Body!["mobile"]!["lastDigits"]!.GetValue<string>(), Is.EqualTo("123"));
        Assert.That((await Code("123456")).Status, Is.EqualTo(HttpStatusCode.UnprocessableEntity), "no challenge pending any more");
    }

    // The error persona

    [Test]
    public async Task The_error_persona_can_still_use_the_profile_operations()
    {
        await _service.Bind("alex", "error");
        Assert.That((await Profile()).Status, Is.EqualTo(HttpStatusCode.OK), "only report operations fail for the error persona");
        Assert.That((await Name("""{"preferredName":"Zed"}""")).Status, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public void The_session_state_holds_the_edits_by_user()
    {
        var store = _service.Services.GetRequiredService<PersonaStore>();
        store.Session("alex").SetPreferredName("Zed");
        Assert.That(store.Session("sam").PreferredNameOr("stored"), Is.EqualTo("stored"));
    }
}
