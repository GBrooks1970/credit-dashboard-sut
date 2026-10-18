import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes } from '@serenity-js/assertions';
import { actorCalled, Wait, type Actor } from '@serenity-js/core';
import { By, Click, Enter, isVisible, Navigate, Page, PageElement, Text } from '@serenity-js/web';

import { personaFile, testUser } from '../../fixtures/load.js';
import { scenario } from '../../support/world.js';

/** Hooks are the contract between the UI and the harness (UI specification 4.1). */
export const byTestId = (id: string) => PageElement.located(By.css(`[data-testid="${id}"]`)).describedAs(id);

const signIn = (actor: Actor, username: string, password: string) =>
    actor.attemptsTo(
        Navigate.to('/login'),
        Enter.theValue(username).into(byTestId('login-username')),
        Enter.theValue(password).into(byTestId('login-password')),
        Click.on(byTestId('login-submit')),
    );

When('{actor} signs in', (name: string) => {
    const user = testUser(name.toLowerCase());
    return signIn(actorCalled(name), user.username, user.password);
});

When('{actor} asks for {string} while signed out and then signs in', (name: string, address: string) => {
    const user = testUser(name.toLowerCase());
    return actorCalled(name).attemptsTo(
        Navigate.to(address),
        Wait.until(byTestId('login-submit'), isVisible()),
        Enter.theValue(user.username).into(byTestId('login-username')),
        Enter.theValue(user.password).into(byTestId('login-password')),
        Click.on(byTestId('login-submit')),
    );
});

When('{actor} signs in with the wrong password', (name: string) => {
    const user = testUser(name.toLowerCase());
    return signIn(actorCalled(name), user.username, 'not-the-password');
});

Given('{actor} has signed in', async (name: string) => {
    const user = testUser(name.toLowerCase());
    const actor = actorCalled(name);
    await signIn(actor, user.username, user.password);
    await actor.attemptsTo(Wait.until(byTestId('bureau-name'), isVisible()));
});

When('{actor} reloads the page', (name: string) => actorCalled(name).attemptsTo(Navigate.reloadPage()));

/** The bureau's display name comes from the bound persona's fixture, not from the page under test. */
function bureauName(actorName: string, bureauId: string): string {
    const persona = scenario.state.personas.get(actorName.toLowerCase());
    const bureau = personaFile(persona!).bureaux.find((b: { id: string }) => b.id === bureauId);
    if (!bureau) throw new Error(`The '${persona}' fixture has no bureau '${bureauId}'`);
    return bureau.name;
}

Then('{actor} sees the report for {bureau}', (name: string, bureauId: string) =>
    actorCalled(name).attemptsTo(
        Wait.until(byTestId('bureau-name'), isVisible()),
        Ensure.that(Text.of(byTestId('bureau-name')), equals(bureauName(name, bureauId))),
    ),
);

Then('{actor} is told the sign-in details were not recognised', (name: string) =>
    actorCalled(name).attemptsTo(
        Wait.until(byTestId('login-error'), isVisible()),
        Ensure.that(Text.of(byTestId('login-error')), includes('were not recognised')),
    ),
);

Then('{actor} is still on the sign-in page', (name: string) =>
    actorCalled(name).attemptsTo(
        Ensure.that(Page.current().url().pathname, equals('/login')),
        Ensure.that(byTestId('login-submit'), isVisible()),
    ),
);

Then('{actor} is asked to sign in again', (name: string) =>
    actorCalled(name).attemptsTo(
        Wait.until(byTestId('login-submit'), isVisible()),
        Ensure.that(Page.current().url().pathname, equals('/login')),
    ),
);
