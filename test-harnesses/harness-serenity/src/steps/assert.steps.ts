import assert from 'node:assert/strict';

import { Then } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';

import { CallAnApi } from '../abilities/CallAnApi.js';
import { personaFile } from '../fixtures/load.js';
import { scenario } from '../support/world.js';

/** Every Then reads the last response and never makes a call (design section 5); the one exception is marked below. */
const lastResponse = () => {
    const response = scenario.state.last;
    assert.ok(response, 'No response: a When step must come before this Then');
    return response;
};

/** The 200 body of the last response. */
function body() {
    const response = lastResponse();
    assert.equal(response.status, 200, `Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
    return response.body;
}

/** A refusal is asserted by status and Problem type, never title or detail (DR-048). */
function problem(status: number, type: string) {
    const response = lastResponse();
    assert.equal(response.status, status, `Expected ${status}, got ${response.status}: ${JSON.stringify(response.body)}`);
    assert.equal(response.body.type, type);
    return response.body;
}

const minor = (money: { amountMinor: number }) => money.amountMinor;

// ---- Score ----------------------------------------------------------------------------------------------------

Then('the score is {count} out of {count}', (score: number, max: number) => {
    assert.equal(body().current, score);
    assert.equal(body().max, max);
});

Then('the national and local averages are each between {count} and {count}', (low: number, high: number) => {
    for (const average of [body().nationalAverage, body().localAverage]) {
        assert.ok(average >= low && average <= high, `Average ${average} is outside ${low} to ${high}`);
    }
});

Then('{count} monthly points are returned', (count: number) => {
    assert.equal(body().length, count);
});

Then('the score for {month} is missing', (month: string) => {
    const point = body().find((p: { month: string }) => p.month === month);
    assert.ok(point, `The history has no entry for ${month}`);
    assert.equal(point.score, null);
});

// ---- Totals and utilisation ----------------------------------------------------------------------------------------

Then('the total balance is {money}', (amount: number) => assert.equal(minor(body().balance), amount));
Then('the total limit is {money}', (amount: number) => assert.equal(minor(body().limit), amount));
// Loan totals report what remains as the total balance (BR-05).
Then('the total remaining is {money}', (amount: number) => assert.equal(minor(body().balance), amount));
Then('the total utilisation is {percent}', (percent: number) => assert.equal(body().utilisation, percent));
Then('no utilisation is reported', () => assert.ok(body().utilisation === null || body().utilisation === undefined, `Utilisation reported: ${body().utilisation}`));
Then('the loan of {money} is listed as excluded', (amount: number) => {
    const excluded = body().excluded.map((e: { balance: { amountMinor: number } }) => e.balance.amountMinor);
    assert.ok(excluded.includes(amount), `Excluded balances are ${JSON.stringify(excluded)}, none is ${amount}`);
});

// ---- Accounts ----------------------------------------------------------------------------------------------------

Then('the balance is {money}', (amount: number) => assert.equal(minor(body().balance), amount));
Then('the utilisation is {percent}', (percent: number) => assert.equal(body().utilisation, percent));
Then('the unfloored utilisation is {percent}', (percent: number) => assert.equal(body().utilisationRaw, percent));
Then('the account number is shown as {string}', (masked: string) => assert.equal(body().maskedNumber, masked));

// 'The credit card' and 'its balance' read the credit card in the list the last When returned.
const listedCreditCards = () => body().filter((a: { type: string }) => a.type === 'creditcard');
Then('the credit card is {listedOrNot}', (shown: boolean) => assert.equal(listedCreditCards().length, shown ? 1 : 0));
Then('its balance is {money}', (amount: number) => {
    const cards = listedCreditCards();
    assert.equal(cards.length, 1, `Expected one credit card in the list, found ${cards.length}`);
    assert.equal(minor(cards[0].balance), amount);
});

Then('the account is not found', () => {
    problem(404, '/problems/not-found');
});

// BR-09: every body this scenario received, not only the last.
Then('no response contains {string}', (text: string) => {
    assert.ok(scenario.state.bodies.length > 0, 'No response was recorded');
    const hit = scenario.state.bodies.find((b) => b.includes(text));
    assert.equal(hit, undefined, `A response contains '${text}': ${hit?.slice(0, 200)}`);
});

// ---- Debt --------------------------------------------------------------------------------------------------------

Then('the total debt is {money}', (amount: number) => assert.equal(minor(body().total), amount));
Then('the debt trend is {trend}', (trend: string) => assert.equal(body().trend, trend));
Then('the debt on {accountType} is {money}', (type: string, amount: number) => {
    const entry = body().byType.find((e: { type: string }) => e.type === type);
    assert.ok(entry, `The debt overview has no entry for ${type}: ${JSON.stringify(body().byType)}`);
    assert.equal(minor(entry.amount), amount);
});

// ---- Payment history -----------------------------------------------------------------------------------------------

Then('the years {year} to {year} are covered', (first: number, last: number) => {
    const years: number[] = body().years.map((y: { year: number }) => y.year);
    assert.deepEqual([...years].sort((a, b) => a - b), Array.from({ length: last - first + 1 }, (_, i) => first + i));
});

Then('{year} is marked {yearStatus}', (year: number, status: string) => {
    const entry = body().years.find((y: { year: number }) => y.year === year);
    assert.ok(entry, `The payment history has no ${year}`);
    assert.equal(entry.status, status);
});

// ---- Report changes -------------------------------------------------------------------------------------------------

const changeDates = () => body().items.map((c: { date: string }) => c.date);
Then('the changes are dated {date} and {date}, in that order', (a: string, b: string) => assert.deepEqual(changeDates(), [a, b]));
Then('the changes are dated {date}, {date} and {date}, in that order', (a: string, b: string, c: string) => assert.deepEqual(changeDates(), [a, b, c]));

// The overview carries the newest changes (BR-11): read independently from the persona the actor holds.
Then('the {count} newest changes are included', (count: number) => {
    const persona = [...scenario.state.personas.values()].at(-1)!;
    const newest = personaFile(persona).bureaux[0].changes.map((c: { date: string }) => c.date).sort().reverse().slice(0, count);
    const included = body().recentChanges.map((c: { date: string }) => c.date);
    assert.deepEqual(included, newest);
});
Then('the change count reads {count}', (count: number) => assert.equal(body().changesTotal, count));

// ---- Account details -----------------------------------------------------------------------------------------------

Then('the interest rate is {acceptedOrRefused}', (outcome: string) => {
    if (outcome === 'accepted') {
        assert.equal(body().interestRate, scenario.state.pending.rate);
    } else {
        problem(422, '/problems/rule-violation/out-of-range');
    }
});

// ---- Profile ----------------------------------------------------------------------------------------------------

Then('the email is still verified', () => assert.equal(body().status, 'verified'));

Then('the resend is {refusedOrSent}', (outcome: string) => {
    if (outcome === 'sent') assert.equal(lastResponse().status, 202);
    else problem(429, '/problems/rate-limited');
});

Then('{actor} is told the email is already verified', (_actor: string) => {
    problem(422, '/problems/rule-violation/already-verified');
});

Then('the number is {mobileOutcome}', (outcome: string) => {
    if (outcome === 'refused') problem(422, '/problems/rule-violation/mobile-number');
    else assert.equal(body().status, 'unverified');
});

Then('the mobile number is {verifiedOrStillUnverified}', (state: string) => {
    // An expired code is refused as code-invalid (PR-10), which leaves the number unverified.
    if (state === 'verified') assert.equal(body().status, 'verified');
    else problem(422, '/problems/rule-violation/code-invalid');
});

Then('{actor} is told to request a new code', (_actor: string) => {
    const found = problem(422, '/problems/rule-violation/code-invalid');
    assert.equal(found.attemptsRemaining, undefined, 'code-invalid carries no attemptsRemaining');
});

// The one Then that makes a call (design section 5): 'no longer accepted' is a behaviour, so it submits the code once more.
Then('the code {code} is no longer accepted', async (code: string) => {
    const actor = [...scenario.state.personas.keys()][0]!;
    await actorCalled(actor.charAt(0).toUpperCase() + actor.slice(1)).abilityTo(CallAnApi).request('verifyMobile', { body: { code } });
    problem(422, '/problems/rule-violation/code-invalid');
});

// ---- Security ----------------------------------------------------------------------------------------------------

Then('{actor} is refused as not signed in', (_actor: string) => {
    problem(401, '/problems/unauthenticated');
});

Then('test control is not found', () => {
    problem(404, '/problems/not-found');
});
