import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes, isFalse, isTrue, matches, not } from '@serenity-js/assertions';
import { actorCalled, Wait } from '@serenity-js/core';
import { By, Click, Enter, isVisible, Page, PageElements, Text, Value } from '@serenity-js/web';

import { longDate, personaFile, testUser } from '../../fixtures/load.js';
import { scenario } from '../../support/world.js';
import { openAddress } from '../visit.js';
import { byTestId } from './login.steps.js';

const capitalise = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
/** Steps that name no user: the last user the scenario bound (Sam where a scenario binds Sam after the background's Alex). */
const lastActor = () => actorCalled(capitalise([...scenario.state.personas.keys()].at(-1)!));
const personaOf = (name: string) => scenario.state.personas.get(name.toLowerCase())!;
const profileOf = (name: string) => personaFile(personaOf(name)).profile;
const present = (id: string) => byTestId(id).isPresent();
const PROFILE = '/my-account/profile';

// ---- Arrange ---------------------------------------------------------------------------------------------------

Given('{actor} is viewing their profile', (name: string) => openAddress(actorCalled(name), PROFILE, 'profile-legal-name'));

// Fixture facts (glossary section 3): the step checks the persona holds the state, and fails loudly if it does not.
Given("{actor}'s preferred name is {string}", (name: string, preferred: string) => {
    const held = profileOf(name).preferredName;
    if (held !== preferred) throw new Error(`The '${personaOf(name)}' fixture holds the preferred name '${held}', not '${preferred}'`);
});

Given('{actor} has added their finances', (name: string) => {
    if (profileOf(name).finances?.added !== true) throw new Error(`The '${personaOf(name)}' fixture has not added finances`);
});

// ---- Act -------------------------------------------------------------------------------------------------------

When('{actor} opens the name information', (name: string) =>
    actorCalled(name).attemptsTo(Click.on(byTestId('profile-name-info')), Wait.until(byTestId('profile-name-info-panel'), isVisible())),
);

async function typePreferredName(name: string, value: string) {
    await actorCalled(name).attemptsTo(
        Enter.theValue(value).into(byTestId('profile-preferred-input')),
        Wait.until(byTestId('profile-preferred-save'), isVisible()),
        Click.on(byTestId('profile-preferred-save')),
        // Saved or refused, the status line says which: it is empty until the result is in.
        Wait.until(Text.of(byTestId('profile-preferred-status')), not(equals(''))),
    );
}

When('{actor} sets their preferred name to {string}', typePreferredName);
When('{actor} tries to set their preferred name to {string}', typePreferredName);
When('{actor} sets their preferred name to {string} with spaces either side', (name: string, value: string) => typePreferredName(name, `  ${value}  `));
When('{actor} clears their preferred name', (name: string) => typePreferredName(name, ''));

When('{actor} changes their email to {string}', (name: string, address: string) =>
    actorCalled(name).attemptsTo(
        Click.on(byTestId('profile-tile-email')),
        Wait.until(byTestId('email-input'), isVisible()),
        Enter.theValue(address).into(byTestId('email-input')),
        Click.on(byTestId('email-save')),
        Wait.until(byTestId('profile-legal-name'), isVisible()),
    ),
);

When('{actor} adds the mobile number {string}', (name: string, number: string) =>
    actorCalled(name).attemptsTo(
        Click.on(byTestId('profile-tile-mobile')),
        Wait.until(byTestId('mobile-input'), isVisible()),
        Enter.theValue(number).into(byTestId('mobile-input')),
        Click.on(byTestId('mobile-save')),
        Wait.until(byTestId('mobile-code-input'), isVisible()),
    ),
);

When('{actor} enters the code {code}', (name: string, code: string) =>
    actorCalled(name).attemptsTo(
        Enter.theValue(code).into(byTestId('mobile-code-input')),
        Click.on(byTestId('mobile-code-submit')),
        Wait.until(byTestId('profile-legal-name'), isVisible()),
    ),
);

// ---- Assert ----------------------------------------------------------------------------------------------------

// The expected values are the test user's, from fixtures/users.json, never read back from the page under test (B-05, B-17).
Then('{actor} sees their legal name and date of birth', (name: string) => {
    const user = testUser(name.toLowerCase());
    return actorCalled(name).attemptsTo(
        Ensure.that(Text.of(byTestId('profile-legal-name')), equals(user.legalName)),
        Ensure.that(Text.of(byTestId('profile-dob')), equals(longDate(user.dateOfBirth))),
    );
});

Then('neither can be edited', () =>
    lastActor().attemptsTo(
        // Nothing in the identity header takes input: no field, no editable text.
        Ensure.that(PageElements.located(By.css('[data-testid="profile-identity"] input, [data-testid="profile-identity"] textarea, [data-testid="profile-identity"] [contenteditable="true"]')).count(), equals(0)),
    ),
);

Then('{actor} is told that it matches the credit report', (name: string) =>
    actorCalled(name).attemptsTo(Ensure.that(Text.of(byTestId('profile-name-info-panel')), includes('matches the credit report'))),
);

Then('{actor} is told the change is saved', (name: string) =>
    actorCalled(name).attemptsTo(Wait.until(Text.of(byTestId('profile-preferred-status')), includes('Saved'))),
);

Then('the app greets {actor} as {string}', (name: string, greeting: string) =>
    actorCalled(name).attemptsTo(Wait.until(Text.of(byTestId('btn-account')), equals(greeting))),
);

Then('the app greets {actor} by their legal first name', async (name: string) => {
    const actor = actorCalled(name);
    await actor.attemptsTo(Wait.until(Text.of(byTestId('btn-account')), equals(testUser(name.toLowerCase()).legalName.split(' ')[0]!)));
});

// A new visit to the report's personal details page: the preferred name never reaches the report (PR-03).
Then("the credit report still shows {actor}'s legal name", async (name: string) => {
    const actor = actorCalled(name);
    await openAddress(actor, '/credit-health/report/bureau-a/personal-details', 'pd-name');
    await actor.attemptsTo(Ensure.that(Text.of(byTestId('pd-name')), equals(testUser(name.toLowerCase()).legalName)));
});

Then('the preferred name is {nameOutcome}', (outcome: string) => {
    const actor = lastActor();
    if (outcome === 'refused') return actor.attemptsTo(Ensure.that(present('profile-preferred-error'), isTrue()));
    const stored = outcome.slice('saved as '.length);
    return actor.attemptsTo(
        Ensure.that(present('profile-preferred-error'), isFalse()),
        Wait.until(Text.of(byTestId('profile-preferred-status')), includes('Saved')),
        Wait.until(Value.of(byTestId('profile-preferred-input')), equals(stored)),
    );
});

Then('the email shows as unverified', () => lastActor().attemptsTo(Wait.until(Text.of(byTestId('profile-email-badge')), equals('Unverified'))));

Then('the {tile} tile shows {string}', (tile: string, text: string) =>
    lastActor().attemptsTo(Wait.until(Text.of(byTestId(`profile-tile-${tile}`)), includes(text))),
);

Then('no amounts are shown on the profile', () =>
    lastActor().attemptsTo(Ensure.that(Text.of(PageElements.located(By.css('main')).first()), not(includes('£')))),
);

// PR-08: profile data never appears in the page title or the address. 'Profile data' is every personal value the fixtures hold for the
// user: the legal name and its first name, the preferred name, the date of birth (as shown and as ISO), the email address, the postcode
// and the last digits of the mobile number. The values come from the fixtures, not from the page (B-18).
function secretsOf(name: string): string[] {
    const user = testUser(name.toLowerCase());
    const profile = profileOf(name);
    const values = [
        user.legalName,
        user.legalName.split(' ')[0],
        profile.preferredName,
        longDate(user.dateOfBirth),
        user.dateOfBirth,
        user.email,
        profile.address?.postcode,
        profile.mobile?.lastDigits,
    ];
    return [...new Set(values.filter((v): v is string => typeof v === 'string' && v.length > 0))];
}

Then("the page title contains none of {actor}'s profile data", async (name: string) => {
    const secrets = secretsOf(name);
    await actorCalled(name).attemptsTo(...secrets.map((secret) => Ensure.that(Page.current().title(), not(includes(secret)))));
});

Then('the page address contains none of it either', async () => {
    const actor = lastActor();
    const spellings = secretsOf(actor.name).flatMap((secret) => [secret, encodeURIComponent(secret)]);
    const url = Page.current().url();
    // The path, the query and the fragment: all three travel in the address bar and in the history.
    await actor.attemptsTo(
        ...spellings.map((secret) => Ensure.that(url.pathname, not(includes(secret)))),
        ...spellings.map((secret) => Ensure.that(url.search, not(includes(secret)))),
        ...spellings.map((secret) => Ensure.that(url.hash, not(includes(secret)))),
    );
});
