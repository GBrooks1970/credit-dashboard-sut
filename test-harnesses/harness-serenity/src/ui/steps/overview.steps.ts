import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { actorCalled, Wait } from '@serenity-js/core';
import { Attribute, By, Click, Enter, isVisible, Key, Navigate, Page, PageElements, Press, Text } from '@serenity-js/web';

import { ControlTheTestEnvironment } from '../../abilities/ControlTheTestEnvironment.js';
import { personaFile, testUser } from '../../fixtures/load.js';
import { STAGE_MANAGER } from '../../support/actors.js';
import { scenario } from '../../support/world.js';
import { byTestId } from './login.steps.js';

const cards = (prefix: string) => PageElements.located(By.css(`[data-testid^="${prefix}"]`));
const wording = (days: number) => (days === 1 ? '1 day' : `${days} days`);

/** The steps that name no user: the first user the scenario bound, or the last where the scenario ends on another user. */
const capitalise = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
const firstActor = () => actorCalled(capitalise([...scenario.state.personas.keys()][0]!));
const lastActor = () => actorCalled(capitalise([...scenario.state.personas.keys()].at(-1)!));

/** A fresh visit: the token is in memory only, so a new visit is a new sign-in (UI specification 6.1). */
async function visitTheReport(name: string) {
    const user = testUser(name.toLowerCase());
    const actor = actorCalled(name);
    await actor.attemptsTo(
        Navigate.to('/login'),
        Wait.until(byTestId('login-submit'), isVisible()),
    );
    await actor.attemptsTo(
        Enter.theValue(user.username).into(byTestId('login-username')),
        Enter.theValue(user.password).into(byTestId('login-password')),
        Click.on(byTestId('login-submit')),
        Wait.until(byTestId('score-value'), isVisible()),
    );
}

// ---- Arrange ---------------------------------------------------------------------------------------------------

// Navigation (glossary section 3): only the default bureau is reachable by a link after sign-in, and every scenario uses it.
Given('{actor} is viewing the report for {bureau}', async (name: string, bureauId: string) => {
    const persona = scenario.state.personas.get(name.toLowerCase());
    const defaultBureau = personaFile(persona!).bureaux[0].id;
    if (bureauId !== defaultBureau) throw new Error(`Only the default bureau '${defaultBureau}' is reachable after sign-in; asked for '${bureauId}'`);
    await visitTheReport(name);
});

// Test control (clock): that many days before the bureau's nextRefreshDate (BR-08). The step names no user; it is the first one bound.
Given('the next bureau refresh is {days} away', async (days: number) => {
    const first = [...scenario.state.personas.entries()][0]!;
    const bureau = personaFile(first[1]).bureaux[0];
    const refresh = new Date(`${bureau.nextRefreshDate}T09:00:00Z`);
    refresh.setUTCDate(refresh.getUTCDate() - days);
    await actorCalled(STAGE_MANAGER).abilityTo(ControlTheTestEnvironment).setClock(refresh.toISOString().replace('.000Z', 'Z'));
});

// ---- Act -------------------------------------------------------------------------------------------------------

When('{actor} chooses the {range} range', (name: string, range: string) => actorCalled(name).attemptsTo(Click.on(byTestId(`range-${range}`))));

When('{actor} likes the report summary', (name: string) =>
    actorCalled(name).attemptsTo(
        Click.on(byTestId('btn-like')),
        Wait.until(Attribute.called('aria-pressed').of(byTestId('btn-like')), equals('true')),
    ),
);

When('{actor} returns to the report later', (name: string) => visitTheReport(name));

When('{actor} shows all changes', (name: string) => actorCalled(name).attemptsTo(Click.on(byTestId('changes-toggle'))));

When('{actor} opens the chat drawer', (name: string) =>
    actorCalled(name).attemptsTo(Click.on(byTestId('btn-chat')), Wait.until(byTestId('chat-drawer'), isVisible())),
);

// The drawer closes by Escape or by its Close button (UI specification section 7); either returns focus to the button that opened it.
When('{actor} closes the chat drawer with {closer}', (name: string, closer: string) =>
    actorCalled(name).attemptsTo(closer === 'Escape' ? Press.the(Key.Escape) : Click.on(byTestId('chat-close'))),
);

// Focus is read from the page itself: a browser refuses focus on an inert element, which a component test cannot show (CDS-38 R2-C-01).
Then('the focus is on the chat button', async () => {
    const actor = lastActor();
    const page = await actor.answer(Page.current());
    let focused = '(nothing)';
    for (let i = 0; i < 20 && focused !== 'btn-chat'; i++) {
        focused = await page.executeScript<string, []>("return document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName ?? '(nothing)'");
        if (focused !== 'btn-chat') await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (focused !== 'btn-chat') throw new Error(`The focus is on '${focused}', not on the chat button`);
});

// ---- Assert ----------------------------------------------------------------------------------------------------

Then('{actor} sees a score of {count} out of {count}', (name: string, score: number, max: number) =>
    actorCalled(name).attemptsTo(
        Ensure.that(Text.of(byTestId('score-value')), equals(String(score))),
        Ensure.that(Text.of(byTestId('score-max')), equals(String(max))),
    ),
);

Then('the national average reads {count}', (average: number) => {
    return firstActor().attemptsTo(Ensure.that(Text.of(byTestId('bench-national')), equals(String(average))));
});

Then('the chart shows {count} monthly points', (points: number) => {
    // One row per month in the chart's table alternative, a gap included (BR-02).
    return firstActor().attemptsTo(Wait.until(cards('history-chart-row-').count(), equals(points)));
});

Then('the summary is still marked as liked', () => {
    return firstActor().attemptsTo(Ensure.that(Attribute.called('aria-pressed').of(byTestId('btn-like')), equals('true')));
});

Then('it is not marked as disliked', () => {
    return firstActor().attemptsTo(Ensure.that(Attribute.called('aria-pressed').of(byTestId('btn-dislike')), equals('false')));
});

Then('{count} changes are listed', (count: number) => {
    // The change cards of the report page; Sam, in the scenario that shows all changes, is the last user bound.
    return lastActor().attemptsTo(Wait.until(cards('change-card-').count(), equals(count)));
});

Then('{actor} is told the report updates in {days}', (name: string, days: number) =>
    actorCalled(name).attemptsTo(Ensure.that(Text.of(byTestId('next-update')), equals(`Updates in ${wording(days)}`))),
);
