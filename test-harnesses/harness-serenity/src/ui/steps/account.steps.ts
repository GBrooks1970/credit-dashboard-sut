import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes, isFalse, isTrue } from '@serenity-js/assertions';
import { actorCalled, LogicError, Wait } from '@serenity-js/core';
import { By, Click, Enter, isVisible, Page, PageElements, Text } from '@serenity-js/web';

import { theOne, accountsOf } from '../../fixtures/load.js';
import { scenario } from '../../support/world.js';
import { uiUrl } from '../hooks.js';
import { openAddress, poundsAndPence } from '../visit.js';
import { byTestId } from './login.steps.js';

const capitalise = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
/** Steps that name no user: the first user the scenario bound, or the last where the scenario ends on another user. */
const firstActor = () => actorCalled(capitalise([...scenario.state.personas.keys()][0]!));
const lastActor = () => actorCalled(capitalise([...scenario.state.personas.keys()].at(-1)!));
const personaOf = (name: string) => scenario.state.personas.get(name.toLowerCase())!;
const lastPersona = () => [...scenario.state.personas.values()].at(-1)!;
const all = (css: string) => PageElements.located(By.css(css));
const BUREAU = 'bureau-a';
/** Whether the hook is in the page at all, wherever it is: Serenity's visibility wait does not see an element below the fold (design section 22). */
const present = (id: string) => byTestId(id).isPresent();

/** The open credit card that holds no interest rate (the `drilldown` persona's Lender X card; glossary section 3). */
function cardWithNoRate(name: string) {
    const card = theOne(personaOf(name), 'the open Lender X credit card', (a) => a.type === 'creditcard' && a.provider === 'Lender X' && !a.closed);
    if (card.details.interestRate !== null) throw new Error(`The '${personaOf(name)}' fixture's Lender X card holds an interest rate, so it is not a card with none recorded`);
    return card;
}

/** The open credit card of a provider, in the persona the last bound user holds. */
function cardOf(provider: string) {
    return theOne(lastPersona(), `the open ${provider} credit card`, (a) => a.type === 'creditcard' && a.provider === provider && !a.closed);
}

// ---- Arrange ---------------------------------------------------------------------------------------------------

Given('{actor} has noted the credit card total on the report overview', async (name: string) => {
    const actor = actorCalled(name);
    await openAddress(actor, `/credit-health/report/${BUREAU}`, 'score-value');
    // The account cards sit below the fold on the overview, so wait for presence (design section 22).
    await actor.attemptsTo(Wait.until(present('account-balance-creditcard'), isTrue()));
    scenario.state.pending.overviewCreditCardTotal = await actor.answer(Text.of(byTestId('account-balance-creditcard')));
});

Given('{actor} is viewing a credit card with no interest rate recorded', (name: string) =>
    openAddress(actorCalled(name), `/credit-health/report/${BUREAU}/account/${cardWithNoRate(name).id}`, 'detail-balance'),
);

// ---- Act -------------------------------------------------------------------------------------------------------

When('{actor} opens the {accountType} list', (name: string, type: string) =>
    openAddress(actorCalled(name), `/credit-health/report/${BUREAU}/accounts/${type}`, 'list-summary'),
);

When('{actor} opens a loan account', (name: string) => {
    const loan = theOne(personaOf(name), 'the loan that counts in the totals', (a) => a.type === 'loan' && a.includedInTotals && !a.closed);
    return openAddress(actorCalled(name), `/credit-health/report/${BUREAU}/account/${loan.id}`, 'detail-balance');
});

When('{actor} opens the closed accounts for {bureau}', async (name: string, bureauId: string) => {
    await openAddress(actorCalled(name), `/credit-health/report/${bureauId}/closed-accounts`, 'closed-title');
    await actorCalled(name).attemptsTo(Wait.until(present('closed-list-populated'), isTrue()));
});

/** From the card's own page, through its interest rate tile, into the form, and the value chosen as another value. */
async function enterRate(name: string, percent: number) {
    await actorCalled(name).attemptsTo(
        Click.on(byTestId('detail-tile-interest-rate')),
        Wait.until(byTestId('dc-option-other'), isVisible()),
        Click.on(byTestId('dc-option-other')),
        Wait.until(byTestId('dc-input'), isVisible()),
        Enter.theValue(String(percent)).into(byTestId('dc-input')),
        Click.on(byTestId('dc-save')),
    );
}

When('{actor} records an interest rate of {percent}', async (name: string, percent: number) => {
    await enterRate(name, percent);
    await actorCalled(name).attemptsTo(Wait.until(byTestId('detail-balance'), isVisible()));
});

When('{actor} tries to record an interest rate of {percent}', async (name: string, percent: number) => {
    await enterRate(name, percent);
    await actorCalled(name).attemptsTo(Wait.until(byTestId('dc-error'), isVisible()));
});

When('{actor} opens the interest rate form with the return address {string}', (name: string, address: string) => {
    const card = cardWithNoRate(name);
    return openAddress(actorCalled(name), `/data-capture/interestRate?accountId=${card.id}&redirectUrl=${encodeURIComponent(address)}`, 'dc-prompt');
});

When('{actor} cancels the form', (name: string) => actorCalled(name).attemptsTo(Click.on(byTestId('dc-cancel'))));

// ---- Assert ----------------------------------------------------------------------------------------------------

Then('the list total matches the overview total', () => {
    const noted = scenario.state.pending.overviewCreditCardTotal as string | undefined;
    if (!noted) throw new Error("'has noted the credit card total on the report overview' must come first");
    return firstActor().attemptsTo(Ensure.that(Text.of(byTestId('list-total-balance')), equals(noted)));
});

Then('{actor} sees which loans are excluded from the loan totals', (name: string) => {
    // The excluded loans are the ones the persona's fixture marks as not counting in the totals (BR-05).
    const excluded = accountsOf(personaOf(name)).filter((a) => a.type === 'loan' && !a.includedInTotals && !a.closed);
    if (excluded.length === 0) throw new Error(`The '${personaOf(name)}' fixture holds no loan excluded from the totals`);
    return actorCalled(name).attemptsTo(
        Wait.until(present('list-excluded'), isTrue()),
        ...excluded.flatMap((loan) => [Ensure.that(Text.of(byTestId('list-excluded')), includes(loan.provider)), Ensure.that(Text.of(byTestId('list-excluded')), includes(loan.maskedNumber))]),
    );
});

// Present, not visible: Serenity's visibility wait does not see an element below the fold (harness design section 22).
Then('{actor} sees the balance, payment history and account information', (name: string) =>
    actorCalled(name).attemptsTo(
        Ensure.that(present('detail-balance'), isTrue()),
        Wait.until(present('detail-payment-history'), isTrue()),
        Ensure.that(present('detail-meta-status'), isTrue()),
    ),
);

Then('{actor} does not see interest rate or promotional period details', (name: string) =>
    actorCalled(name).attemptsTo(
        Ensure.that(present('detail-tile-interest-rate'), isFalse()),
        Ensure.that(present('detail-tile-promo-period-months'), isFalse()),
    ),
);

Then('the {provider} card shows a balance of {money} in credit', (provider: string, money: number) =>
    lastActor().attemptsTo(Ensure.that(Text.of(byTestId(`row-balance-${cardOf(provider).id}`)), equals(poundsAndPence(-money)))),
);

Then('the {provider} card shows a utilisation of {percent}', (provider: string, percent: number) =>
    lastActor().attemptsTo(Ensure.that(Text.of(byTestId(`row-util-${cardOf(provider).id}`)), equals(`${percent}%`))),
);

Then('the {provider} card is marked as over its limit', (provider: string) =>
    lastActor().attemptsTo(Ensure.that(present(`row-over-${cardOf(provider).id}`), isTrue())),
);

Then('the closed {accountType} group lists {count} account(s)', (type: string, count: number) => {
    scenario.state.pending.closedType = type;
    return lastActor().attemptsTo(Wait.until(all(`[data-testid="closed-group-${type}"] [data-testid^="account-row-"]`).count(), equals(count)));
});

Then('its balance is {money}', (money: number) => {
    const type = scenario.state.pending.closedType as string | undefined;
    if (!type) throw new Error("'its balance is' follows a step that names a closed group");
    return lastActor().attemptsTo(Ensure.that(Text.of(all(`[data-testid="closed-group-${type}"] [data-testid^="row-balance-"]`).first()), equals(poundsAndPence(money))));
});

Then('the credit card shows an interest rate of {percent}', (percent: number) =>
    firstActor().attemptsTo(Wait.until(Text.of(byTestId('detail-tile-interest-rate-value')), equals(`${percent}%`))),
);

Then('{actor} is told the rate must be between 0% and 100%', (name: string) =>
    actorCalled(name).attemptsTo(Wait.until(Text.of(byTestId('dc-error')), includes('between 0% and 100%'))),
);

// The refused value was never sent, so the card still shows none: leave the form and read the tile on the card's own page.
Then('no interest rate is recorded', () =>
    firstActor().attemptsTo(
        Click.on(byTestId('dc-cancel')),
        Wait.until(present('detail-tile-interest-rate'), isTrue()),
        Ensure.that(Text.of(byTestId('detail-tile-interest-rate')), includes('Not recorded')),
    ),
);

Then('{actor} is on the page {string}', (name: string, path: string) =>
    actorCalled(name).attemptsTo(Wait.until(Page.current().url().pathname, equals(path))),
);

Then("{actor} is back on the credit card's own page", async (name: string) => {
    const path = `/credit-health/report/${BUREAU}/account/${cardWithNoRate(name).id}`;
    const actor = actorCalled(name);
    try {
        await actor.attemptsTo(Wait.until(present('detail-header'), isTrue()));
    } catch (error) {
        // An address that leaves the site ends the wait on a page that is not ours. Say that, and not only that the header never came: a
        // broken Cancel button or a slow service would print the same timeout (CDS-48, review finding A-01).
        const url = await actor.answer(Page.current().url());
        if (url.origin !== new URL(uiUrl()).origin) throw new LogicError(`the browser left the site: it is at '${url.href}'`);
        throw error;
    }
    await actor.attemptsTo(Ensure.that(Page.current().url().pathname, equals(path)));
});
