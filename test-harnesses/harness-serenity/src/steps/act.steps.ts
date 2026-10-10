import { When } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';

import { CallAnApi } from '../abilities/CallAnApi.js';
import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';
import { accountsOf, testUser } from '../fixtures/load.js';
import { STAGE_MANAGER } from '../support/hooks.js';
import { scenario } from '../support/world.js';

const api = (actor: string) => actorCalled(actor).abilityTo(CallAnApi);

/** The totals step names no bureau; the fixtures keep every counted account in Bureau A (glossary section 4.1). */
const DEFAULT_BUREAU = 'bureau-a';

const thatAccount = () => {
    const id = scenario.state.thatAccount;
    if (!id) throw new Error("No account was described: a Given that describes one must come before 'that account'");
    return id;
};

/** `at {time}`: a time on the date already set (design section 7, rule 4). */
const atTime = async (time: string | undefined) => {
    if (!time) return;
    if (!scenario.state.today) throw new Error("A time of day needs a date: 'today is …' must come first");
    await actorCalled(STAGE_MANAGER).abilityTo(ControlTheTestEnvironment).setClock(`${scenario.state.today}T${time}Z`);
};

// ---- Report ----------------------------------------------------------------------------------------------------

When('{actor} asks for the score from {bureau}', async (actor: string, bureauId: string) => {
    await api(actor).request('getScore', { path: { bureauId } });
});

When('{actor} asks for the score history from {bureau} over {range}', async (actor: string, bureauId: string, range: string) => {
    await api(actor).request('getScoreHistory', { path: { bureauId }, query: { range } });
});

When('{actor} asks for the report overview for {bureau}', async (actor: string, bureauId: string) => {
    await api(actor).request('getReportOverview', { path: { bureauId } });
});

When('{actor} asks for the report changes for {bureau}', async (actor: string, bureauId: string) => {
    await api(actor).request('listChanges', { path: { bureauId } });
});

When('{actor} asks for the payment history for {bureau}', async (actor: string, bureauId: string) => {
    await api(actor).request('getReportPaymentHistory', { path: { bureauId } });
});

When('{actor} asks for the closed accounts for {bureau}', async (actor: string, bureauId: string) => {
    await api(actor).request('listAccounts', { path: { bureauId }, query: { status: 'closed' } });
});

When('{actor} asks for the {accountType} totals', async (actor: string, type: string) => {
    await api(actor).request('getAccountTotals', { path: { bureauId: DEFAULT_BUREAU }, query: { type } });
});

When('{actor} asks for the debt overview', async (actor: string) => {
    await api(actor).request('getDebtOverview');
});

// ---- Accounts ----------------------------------------------------------------------------------------------------

When('{actor} asks for that account', async (actor: string) => {
    await api(actor).request('getAccount', { path: { accountId: thatAccount() } });
});

// BR-15: a real account in the other user's report, asked for with this user's token.
When("{actor} asks for one of {actor}'s accounts", async (actor: string, owner: string) => {
    const persona = scenario.state.personas.get(owner.toLowerCase());
    if (!persona) throw new Error(`${owner} holds no persona, so has no accounts to ask for`);
    const [account] = accountsOf(persona);
    await api(actor).request('getAccount', { path: { accountId: account.id } });
});

When('{actor} sets the interest rate on the {provider} card to {percent}', async (actor: string, provider: string, rate: number) => {
    const persona = scenario.state.personas.get(actor.toLowerCase())!;
    const cards = accountsOf(persona).filter((a) => a.type === 'creditcard' && !a.closed && a.provider === provider);
    if (cards.length !== 1) throw new Error(`The '${persona}' fixture holds ${cards.length} open credit cards from ${provider}, expected one`);
    await api(actor).request('updateAccountDetail', { path: { accountId: cards[0].id }, body: { field: 'interestRate', value: rate } });
});

// ---- Profile ----------------------------------------------------------------------------------------------------

When('{actor} changes their email to the address already held', async (actor: string) => {
    await api(actor).request('changeEmail', { body: { address: testUser(actor.toLowerCase()).email } });
});

const askForAnotherLink = async (actor: string, time?: string) => {
    await atTime(time);
    await api(actor).request('resendEmailVerification');
};
// Cucumber expressions cannot hold a parameter type in an optional, so the optional time is a second definition.
When('{actor} asks for another verification link', (actor: string) => askForAnotherLink(actor));
When('{actor} asks for another verification link at {time}', askForAnotherLink);

When('{actor} adds the mobile number {string}', async (actor: string, number: string) => {
    await api(actor).request('changeMobile', { body: { number } });
});

const enterCode = async (actor: string, code: string, time?: string) => {
    await atTime(time);
    await api(actor).request('verifyMobile', { body: { code } });
};
When('{actor} enters the code {code}', (actor: string, code: string) => enterCode(actor, code));
When('{actor} enters the code {code} at {time}', enterCode);

// The correct code is always 123456 (DR-025), so any other six digits is wrong.
When('{actor} enters a wrong code {count} times', async (actor: string, times: number) => {
    for (let i = 0; i < times; i++) await api(actor).request('verifyMobile', { body: { code: '000000' } });
});
