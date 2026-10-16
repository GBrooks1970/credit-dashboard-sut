import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes, isGreaterThan, not } from '@serenity-js/assertions';
import { actorCalled, Wait } from '@serenity-js/core';
import { Attribute, By, Click, isEnabled, isVisible, Page, PageElements, Text } from '@serenity-js/web';

import { accountsOf } from '../../fixtures/load.js';
import { scenario } from '../../support/world.js';
import { openAddress, poundsNoPence } from '../visit.js';
import { byTestId } from './login.steps.js';

const capitalise = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
/** Steps that name no user: the first user the scenario bound (Alex in every file here). */
const firstActor = () => actorCalled(capitalise([...scenario.state.personas.keys()][0]!));
const all = (css: string) => PageElements.located(By.css(css));
const personaOf = (name: string) => scenario.state.personas.get(name.toLowerCase())!;
const TREND = { up: 'Up', down: 'Down', steady: 'Steady' } as const;

// ---- Payment history (UI specification 6.3) ---------------------------------------------------------------------

Given('{actor} is viewing the payment history for {bureau}', (name: string, bureauId: string) =>
    openAddress(actorCalled(name), `/credit-health/report/${bureauId}/payment-history`, 'ph-result'),
);

When('{actor} chooses {year}', (name: string, year: number) =>
    actorCalled(name).attemptsTo(Click.on(byTestId(`ph-year-${year}`)), Wait.until(Attribute.called('aria-pressed').of(byTestId(`ph-year-${year}`)), equals('true'))),
);

Then('seven years are offered, from {year} to {year}', (first: number, last: number) =>
    firstActor().attemptsTo(
        Wait.until(byTestId('ph-result'), isVisible()),
        Ensure.that(
            Text.ofAll(all('button[data-testid^="ph-year-"]')),
            equals(Array.from({ length: last - first + 1 }, (_, i) => String(first + i))),
        ),
    ),
);

Then('{year} is chosen', (year: number) =>
    firstActor().attemptsTo(Ensure.that(Attribute.called('aria-pressed').of(byTestId(`ph-year-${year}`)), equals('true'))),
);

Then('{actor} sees {count} missed payments, all on the {provider} loan', (name: string, count: number, provider: string) => {
    // The loan is found in the bound persona's fixture, not on the page: every listed row must be on that account.
    const loans = accountsOf(personaOf(name)).filter((a) => a.type === 'loan' && a.provider === provider);
    if (loans.length !== 1) throw new Error(`The '${personaOf(name)}' fixture holds ${loans.length} ${provider} loans, expected one`);
    return actorCalled(name).attemptsTo(
        Wait.until(all('[data-testid^="ph-missed-"]').count(), equals(count)),
        Ensure.that(all(`[data-testid^="ph-missed-${loans[0].id}-"]`).count(), equals(count)),
    );
});

Then('{actor} is told there were no missed payments in {year}', (name: string, year: number) =>
    actorCalled(name).attemptsTo(Wait.until(Text.of(byTestId('ph-result')), includes(`no missed payments in ${year}`))),
);

// ---- Report changes (UI specification 6.7) ----------------------------------------------------------------------

Given('{actor} is viewing the report changes for {bureau}', (name: string, bureauId: string) =>
    openAddress(actorCalled(name), `/insights/updates?bureauId=${bureauId}`, 'changes-filter-all'),
);

// A Given and a When by intent (glossary section 3): the same action either way.
const showOnlyPositive = (name: string) =>
    actorCalled(name).attemptsTo(Click.on(byTestId('changes-filter-positive')), Wait.until(Attribute.called('aria-pressed').of(byTestId('changes-filter-positive')), equals('true')));
Given('{actor} shows only positive changes', showOnlyPositive); // Cucumber matches a step by its text, so one definition serves the Given and the When

When('{actor} opens the same address later', async (name: string) => {
    const actor = actorCalled(name);
    const url = await actor.answer(Page.current().url());
    await openAddress(actor, url.pathname + url.search, 'changes-filter-all');
});

When('{actor} moves to the next page', (name: string) => actorCalled(name).attemptsTo(Click.on(byTestId('pager-next'))));

const everyCardIsPositive = () =>
    firstActor().attemptsTo(
        Wait.until(all('[data-testid^="change-card-"]').count(), isGreaterThan(0)),
        Ensure.that(all('[data-testid^="change-card-"]:not([data-sentiment="positive"])').count(), equals(0)),
    );
Then('every change listed is positive', everyCardIsPositive);
Then('only positive changes are listed', everyCardIsPositive);

Then('there is no next page', () => firstActor().attemptsTo(Wait.until(byTestId('pager-status'), isVisible()), Ensure.that(byTestId('pager-next'), not(isEnabled()))));

// ---- Searches (UI specification 6.7) ----------------------------------------------------------------------------

When('{actor} views the {hardOrSoft} searches for {bureau}', (name: string, kind: string, bureauId: string) =>
    openAddress(actorCalled(name), `/credit-health/report/${bureauId}/searches/${kind}`, 'searches-heading'),
);

Then('{count} hard searches are listed', (count: number) => firstActor().attemptsTo(Wait.until(all('[data-testid^="search-row-"]').count(), equals(count))));
Then('{count} soft search is listed', (count: number) => firstActor().attemptsTo(Wait.until(all('[data-testid^="search-row-"]').count(), equals(count))));
Then('no hard search is listed', () => firstActor().attemptsTo(Ensure.that(all('[data-testid^="search-row-"][data-kind="hard"]').count(), equals(0))));

Then('{actor} is told there are no hard searches', (name: string) =>
    actorCalled(name).attemptsTo(Wait.until(byTestId('search-list-empty'), isVisible()), Ensure.that(Text.of(byTestId('search-list-empty')), includes('no hard searches'))),
);

// ---- Personal details (UI specification 6.7) --------------------------------------------------------------------

When('{actor} views the personal details for {bureau}', (name: string, bureauId: string) =>
    openAddress(actorCalled(name), `/credit-health/report/${bureauId}/personal-details`, 'pd-name'),
);

Then('{actor} sees {count} current address and {count} previous addresses', (name: string, current: number, previous: number) =>
    actorCalled(name).attemptsTo(
        Ensure.that(all('[data-testid="pd-address-current"]').count(), equals(current)),
        Ensure.that(all('[data-testid^="pd-address-previous-"]').count(), equals(previous)),
    ),
);

Then('{actor} is shown as on the electoral roll', (name: string) =>
    actorCalled(name).attemptsTo(Ensure.that(Text.of(byTestId('pd-electoral-roll')), equals('On the electoral roll'))),
);

Then('none of the personal details can be edited', () => {
    // Nothing in the page body takes input or acts: no field, no control, no editable region.
    const controls = 'main input, main textarea, main select, main button, main [contenteditable="true"]';
    return firstActor().attemptsTo(Wait.until(byTestId('pd-name'), isVisible()), Ensure.that(all(controls).count(), equals(0)));
});

// ---- Debt overview (UI specification 6.7, BR-07) ----------------------------------------------------------------

When('{actor} views the debt overview', (name: string) => openAddress(actorCalled(name), '/credit-health/debt-overview', 'debt-total'));

Then('the total debt is {money}', (amountMinor: number) =>
    firstActor().attemptsTo(Ensure.that(Text.of(byTestId('debt-total')), equals(poundsNoPence(amountMinor)))),
);

Then('the debt trend is {trend}', (trend: keyof typeof TREND) => firstActor().attemptsTo(Ensure.that(Text.of(byTestId('debt-trend')), equals(TREND[trend]))));

Then('the debt on {accountType} is {money}', (type: string, amountMinor: number) =>
    firstActor().attemptsTo(Ensure.that(Text.of(byTestId(`debt-type-${type}-amount`)), equals(poundsNoPence(amountMinor)))),
);

