using System.Diagnostics;
using System.Net;
using CreditDashboard.Api.Control;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace CreditDashboard.Api.Tests;

/// <summary>
/// Slice S1 of CDS-25: login, logout, getMe, listBureaux, token expiry and the order of checks (decision brief 9 D2, D3, D8).
/// Cases: DOCS/.design/operations-cases.md section 2.
/// </summary>
public class SessionTests
{
    private ServiceHost _service = null!;

    [SetUp]
    public void Start() => _service = new ServiceHost();

    [TearDown]
    public void Stop() => _service.Dispose();

    // login

    [Test]
    public async Task A_valid_login_gives_a_token_that_expires_after_the_lifetime()
    {
        await _service.Freeze("2026-10-03T09:00:00Z");
        var response = await _service.Send(HttpMethod.Post, "/auth/login", """{"username":"alex","password":"demo-only"}""");
        var body = await _service.Checked("login", response);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["token"]!.GetValue<string>(), Does.StartWith("tok_"));
        Assert.That(DateTimeOffset.Parse(body["expiresAt"]!.GetValue<string>()), Is.EqualTo(DateTimeOffset.Parse("2026-10-03T10:00:00Z")));
    }

    [TestCase("alex", "wrong")]
    [TestCase("nobody", "demo-only")]
    public async Task A_wrong_password_and_an_unknown_user_get_the_same_401(string username, string password)
    {
        var response = await _service.Send(HttpMethod.Post, "/auth/login", $$"""{"username":"{{username}}","password":"{{password}}"}""");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        var body = await _service.Checked("login", response);
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/unauthenticated"));
        Assert.That(body["detail"]!.GetValue<string>(), Is.EqualTo("The username or password is not right."));
    }

    [Test]
    public async Task A_login_without_a_password_is_a_400()
    {
        var response = await _service.Send(HttpMethod.Post, "/auth/login", """{"username":"alex"}""");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        await _service.Checked("login", response);
    }

    [Test]
    public async Task Login_needs_no_token_even_when_an_invalid_one_is_sent()
    {
        var response = await _service.Send(HttpMethod.Post, "/auth/login", """{"username":"alex","password":"demo-only"}""", token: "tok_nonsense");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    // logout and expiry

    [Test]
    public async Task Logout_revokes_the_token_and_leaves_other_tokens_alone()
    {
        var first = await _service.Token();
        var second = await _service.Token();

        var logout = await _service.Send(HttpMethod.Post, "/auth/logout", token: first);
        Assert.That(logout.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        await _service.Checked("logout", logout);

        Assert.That((await _service.Send(HttpMethod.Get, "/me", token: first)).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        Assert.That((await _service.Send(HttpMethod.Get, "/me", token: second)).StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((await _service.Send(HttpMethod.Post, "/auth/logout", token: first)).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized), "the second logout");
    }

    [Test]
    public async Task A_token_is_accepted_up_to_its_expiry_and_refused_at_it()
    {
        await _service.Freeze("2026-10-03T09:00:00Z");
        var token = await _service.Token();

        await _service.Freeze("2026-10-03T09:59:59Z");
        Assert.That((await _service.Send(HttpMethod.Get, "/me", token: token)).StatusCode, Is.EqualTo(HttpStatusCode.OK), "one second before");

        await _service.Freeze("2026-10-03T10:00:00Z");
        var response = await _service.Send(HttpMethod.Get, "/me", token: token);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized), "at exactly expiresAt");
        var body = await _service.Checked("getMe", response);
        Assert.That(body!["type"]!.GetValue<string>(), Is.EqualTo("/problems/unauthenticated"));
    }

    [Test]
    public async Task Moving_the_clock_by_days_expires_the_token()
    {
        await _service.Freeze("2026-10-03T09:00:00Z");
        var token = await _service.Token();
        await _service.Freeze("2026-10-10T09:00:00Z");
        Assert.That((await _service.Send(HttpMethod.Get, "/me", token: token)).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task A_reset_does_not_revoke_tokens()
    {
        var token = await _service.Token();
        Assert.That((await _service.Control(HttpMethod.Post, "/reset")).StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That((await _service.Send(HttpMethod.Get, "/me", token: token)).StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task The_lifetime_is_a_setting()
    {
        using var short_ = new ServiceHost(("TOKEN_LIFETIME_MINUTES", "5"));
        await short_.Freeze("2026-10-03T09:00:00Z");
        var login = await short_.Login();
        Assert.That(DateTimeOffset.Parse(login["expiresAt"]!.GetValue<string>()), Is.EqualTo(DateTimeOffset.Parse("2026-10-03T09:05:00Z")));
    }

    [TestCase("0")]
    [TestCase("1441")]
    [TestCase("-5")]
    [TestCase("1.5")]
    [TestCase("an hour")]
    public void A_lifetime_outside_one_to_1440_whole_minutes_stops_the_service_starting(string value)
    {
        var failure = Assert.Throws<InvalidOperationException>(() => { using var bad = new ServiceHost(("TOKEN_LIFETIME_MINUTES", value)); });
        Assert.That(failure!.Message, Does.Contain("TOKEN_LIFETIME_MINUTES"));
    }

    [TestCase("1")]
    [TestCase("1440")]
    public void The_ends_of_the_range_are_accepted(string value) =>
        Assert.DoesNotThrow(() => { using var ok = new ServiceHost(("TOKEN_LIFETIME_MINUTES", value)); });

    // getMe

    [Test]
    public async Task getMe_gives_the_user_and_the_greeting_from_the_stored_preferred_name()
    {
        var response = await _service.Send(HttpMethod.Get, "/me", token: await _service.Token());
        var body = await _service.Checked("getMe", response);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!["id"]!.GetValue<string>(), Is.EqualTo("usr_01"));
        Assert.That(body["displayName"]!.GetValue<string>(), Is.EqualTo("Alex Example"));
        Assert.That(body["greetingName"]!.GetValue<string>(), Is.EqualTo("Al"), "the excellent persona stores the preferred name Al");
        Assert.That(body["defaultBureauId"]!.GetValue<string>(), Is.EqualTo("bureau-a"));
    }

    [Test]
    public async Task getMe_greets_by_the_first_word_of_the_legal_name_when_no_preferred_name_is_set()
    {
        await _service.Bind("alex", "drilldown");
        var body = await _service.Checked("getMe", await _service.Send(HttpMethod.Get, "/me", token: await _service.Token()));
        Assert.That(body!["greetingName"]!.GetValue<string>(), Is.EqualTo("Alex"));
    }

    [Test]
    public async Task An_edited_preferred_name_is_the_greeting_until_a_rebind_or_a_reset_clears_it()
    {
        var token = await _service.Token();
        var session = _service.Services.GetRequiredService<PersonaStore>().Session("alex");

        session.SetPreferredName("Lex");
        Assert.That((await Greeting(token)), Is.EqualTo("Lex"));

        session.SetPreferredName(null); // cleared
        Assert.That((await Greeting(token)), Is.EqualTo("Alex"), "a cleared name falls back to the legal first name");

        session.SetPreferredName("Lex");
        await _service.Bind("alex", "excellent");
        Assert.That((await Greeting(token)), Is.EqualTo("Al"), "a rebind clears the session (D8)");

        _service.Services.GetRequiredService<PersonaStore>().Session("alex").SetPreferredName("Lex");
        await _service.Control(HttpMethod.Post, "/reset");
        Assert.That((await Greeting(token)), Is.EqualTo("Al"), "a reset clears it too");
    }

    private async Task<string> Greeting(string token) =>
        (await _service.Checked("getMe", await _service.Send(HttpMethod.Get, "/me", token: token)))!["greetingName"]!.GetValue<string>();

    [Test]
    public async Task A_rebind_of_one_user_leaves_anothers_session_alone()
    {
        var store = _service.Services.GetRequiredService<PersonaStore>();
        store.Session("sam").SetPreferredName("Sammy");
        await _service.Bind("alex", "drilldown");
        Assert.That(store.Session("sam").PreferredNameOr("stored"), Is.EqualTo("Sammy"));
    }

    // listBureaux

    [Test]
    public async Task listBureaux_gives_each_bureau_with_the_days_to_its_refresh()
    {
        await _service.Freeze("2026-10-03T09:00:00Z");
        var response = await _service.Send(HttpMethod.Get, "/bureaux", token: await _service.Token());
        var body = await _service.Checked("listBureaux", response);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(body!.AsArray(), Has.Count.EqualTo(1));
        Assert.That(body[0]!["id"]!.GetValue<string>(), Is.EqualTo("bureau-a"));
        Assert.That(body[0]!["name"]!.GetValue<string>(), Is.EqualTo("Bureau A"));
        Assert.That(body[0]!["nextUpdateInDays"]!.GetValue<int>(), Is.EqualTo(1), "the next refresh is 2026-10-04");
    }

    [Test]
    public async Task The_days_to_a_refresh_fall_to_zero_and_stay_there()
    {
        // A token expires when the clock moves past it, so sign in again after each move.
        await _service.Freeze("2026-10-04T00:00:00Z");
        Assert.That(await Days(await _service.Token()), Is.EqualTo(0), "on the refresh date");
        await _service.Freeze("2026-11-01T00:00:00Z");
        Assert.That(await Days(await _service.Token()), Is.EqualTo(0), "after it");
    }

    private async Task<int> Days(string token) =>
        (await _service.Checked("listBureaux", await _service.Send(HttpMethod.Get, "/bureaux", token: token)))![0]!["nextUpdateInDays"]!.GetValue<int>();

    // The order of checks (D3)

    [TestCase("/reports/bureau-a/score/history", TestName = "No token and a bad query is 401, not 400")]
    [TestCase("/accounts/not-an-id", TestName = "No token and a bad path value is 401, not 400")]
    [TestCase("/bureaux", TestName = "No token on a well-formed request is 401")]
    public async Task Without_a_token_a_protected_operation_is_401_before_anything_else(string path)
    {
        var response = await _service.Send(HttpMethod.Get, path);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        await _service.Checked("getMe", response);
    }

    [Test]
    public async Task An_unknown_token_is_401_and_an_expired_one_with_a_bad_query_is_still_401()
    {
        Assert.That((await _service.Send(HttpMethod.Get, "/bureaux", token: "tok_unknown")).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));

        await _service.Freeze("2026-10-03T09:00:00Z");
        var token = await _service.Token();
        await _service.Freeze("2026-10-03T11:00:00Z");
        Assert.That((await _service.Send(HttpMethod.Get, "/reports/bureau-a/score/history", token: token)).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task With_a_good_token_a_bad_query_is_the_400()
    {
        var response = await _service.Send(HttpMethod.Get, "/reports/bureau-a/score/history", token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task An_unknown_route_with_no_token_is_still_404()
    {
        var response = await _service.Send(HttpMethod.Get, "/nowhere");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    public async Task A_malformed_authorization_header_is_401()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, ServiceHost.Base + "/bureaux");
        request.Headers.TryAddWithoutValidation("Authorization", "Basic abc");
        Assert.That((await _service.Client.SendAsync(request)).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    // Persona behaviours

    [Test]
    public async Task The_slow_persona_delays_every_authenticated_operation()
    {
        await _service.Bind("alex", "slow");
        var token = await _service.Token();
        var watch = Stopwatch.StartNew();
        var response = await _service.Send(HttpMethod.Get, "/me", token: token);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(watch.ElapsedMilliseconds, Is.GreaterThanOrEqualTo(2900), "the slow persona adds 3,000 ms");
    }

    [Test]
    public async Task The_error_persona_can_still_sign_in_and_be_identified()
    {
        await _service.Bind("alex", "error");
        var response = await _service.Send(HttpMethod.Get, "/me", token: await _service.Token());
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK), "only report operations fail for the error persona");
    }
}
