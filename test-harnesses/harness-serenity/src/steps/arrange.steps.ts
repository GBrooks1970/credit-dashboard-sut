import { Given } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';

import { CallAnApi } from '../abilities/CallAnApi.js';
import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';
import { bindWithOverrides, setBalance } from '../fixtures/arrange.js';
import { maybeOne, personaFile, theOne } from '../fixtures/load.js';
import { STAGE_MANAGER } from '../support/hooks.js';
import { offBaseUrl, scenario } from '../support/world.js';

const control = () => actorCalled(STAGE_MANAGER).abilityTo(ControlTheTestEnvironment);
const personaOf = (actor: string) => {
    const persona = scenario.state.personas.get(actor.toLowerCase());
    if (!persona) throw new Error(`${actor} holds no persona yet: a 'holds the persona' step must come first`);
    return persona;
};
const remember = (account: { id: string }) => {
    scenario.state.thatAccount = account.id;
};
const capitalise = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

// ---- Test control -------------------------------------------------------------------------------------------------

Given('{actor} holds the {persona} persona', (actor: string, persona: string) => control().bind(actor.toLowerCase(), persona));

// The clock is frozen at 09:00:00 UTC on the date; any clock change drops every cached token (design section 7).
Given('today is {date}', (date: string) => control().setClock(`${date}T09:00:00Z`));

/** A time on the date already set (design section 7, rule 4). */
const setClockTo = (time: string) => {
    if (!scenario.state.today) throw new Error("A time of day needs a date: 'today is …' must come first");
    return control().setClock(`${scenario.state.today}T${time}Z`);
};

// ---- Fixture checks (glossary section 3): the persona already holds the data, or the step fails -------------------

Given('{actor} has a credit card with a balance of {money} and a limit of {money}', async (actor: string, balance: number, limit: number) => {
    const held = maybeOne(
        personaOf(actor),
        `credit card ${balance}/${limit}`,
        (a) => a.type === 'creditcard' && !a.closed && a.balance.amountMinor === balance && (a.limit?.amountMinor ?? null) === limit,
    );
    if (held) return remember(held);
    // Not held by the persona: arranged by overrides, a one-card sample patched with the step's values.
    const file = limit === 0 ? 'br03-zero-limit-card.json' : 'br03-one-credit-card.json';
    const overrides = await bindWithOverrides(control(), actor, file, (o) => setBalance(o.bureaux[0].accounts[0], balance, limit));
    remember(overrides.bureaux[0].accounts[0]);
});

Given('{actor} has a credit card that is {money} in credit', (actor: string, credit: number) =>
    remember(theOne(personaOf(actor), `credit card ${credit} in credit`, (a) => a.type === 'creditcard' && !a.closed && a.balance.amountMinor === -credit)),
);

Given('{actor} has a loan of {money} against {money} borrowed', (actor: string, owed: number, borrowed: number) =>
    remember(theOne(personaOf(actor), `loan ${owed} of ${borrowed}`, (a) => a.type === 'loan' && !a.closed && a.balance.amountMinor === owed && a.limit?.amountMinor === borrowed)),
);

Given('{actor} owes {money} on a {accountType}', (actor: string, owed: number, type: string) =>
    remember(theOne(personaOf(actor), `${type} owing ${owed}`, (a) => a.type === type && !a.closed && a.includedInTotals && a.balance.amountMinor === owed)),
);

Given('{actor} owes {money} on a loan with a limit', (actor: string, owed: number) =>
    remember(theOne(personaOf(actor), `loan with a limit owing ${owed}`, (a) => a.type === 'loan' && !a.closed && a.limit != null && a.balance.amountMinor === owed)),
);

Given('{actor} owes {money} on a loan with no limit', (actor: string, owed: number) =>
    remember(theOne(personaOf(actor), `loan with no limit owing ${owed}`, (a) => a.type === 'loan' && !a.closed && a.limit == null && a.balance.amountMinor === owed)),
);

Given('{actor} has a credit card that closed on {date}', async (actor: string, date: string) => {
    const held = maybeOne(personaOf(actor), `credit card closed ${date}`, (a) => a.type === 'creditcard' && a.closed && a.closedDate === date);
    if (held) return remember(held);
    const overrides = await bindWithOverrides(control(), actor, 'br13-closed-anniversary.json', (o) => {
        o.bureaux[0].accounts[0].closedDate = date;
    });
    remember(overrides.bureaux[0].accounts[0]);
});

Given("{actor}'s email is verified", (actor: string) => {
    const status = personaFile(personaOf(actor)).profile.emailStatus;
    if (status !== 'verified') throw new Error(`The '${personaOf(actor)}' fixture holds an email that is '${status}', not verified`);
});

// The step names no actor: it is the first user the scenario bound (Alex in every file that uses it).
Given('the source supplies the account number {string}', async (source: string) => {
    const actor = [...scenario.state.personas.keys()][0]!;
    const held = maybeOne(personaOf(actor), `source mask ${source}`, (a) => a.sourceMask === source);
    if (held) return remember(held);
    const overrides = await bindWithOverrides(control(), capitalise(actor), 'br09-source-mask.json', (o) => {
        const account = o.bureaux[0].accounts[0];
        if (account.sourceMask !== source) throw new Error(`The br09 sample supplies '${account.sourceMask}', not '${source}'`);
    });
    remember(overrides.bureaux[0].accounts[0]);
});

Given('{actor} has {count} report changes', (actor: string, count: number) => {
    const held = personaFile(personaOf(actor)).bureaux[0].changes.length;
    if (held !== count) throw new Error(`The '${personaOf(actor)}' fixture holds ${held} report changes, not ${count}`);
});

Given('{actor} has report changes dated {date} and {date}', (actor: string, first: string, second: string) => {
    const dates: string[] = personaFile(personaOf(actor)).bureaux[0].changes.map((c: { date: string }) => c.date);
    for (const date of [first, second]) {
        if (!dates.includes(date)) throw new Error(`The '${personaOf(actor)}' fixture holds changes dated ${dates.join(', ')}, none on ${date}`);
    }
});

// ---- Overrides (glossary section 3): the sample is the template, the step's values are patched in -------------------

Given("{actor}'s report changes arrive dated {date}, {date} and {date}", async (actor: string, first: string, second: string, third: string) => {
    await bindWithOverrides(control(), actor, 'br11-unsorted-changes.json', (o) => {
        const changes = o.bureaux[0].changes;
        [first, second, third].forEach((date, i) => (changes[i].date = date));
    });
});

Given("{actor}'s only accounts are a credit card owing {money} and a current account overdrawn by {money}", async (actor: string, owing: number, overdrawn: number) => {
    await bindWithOverrides(control(), actor, 'br07-current-account.json', (o) => {
        const [card, current] = o.bureaux[0].accounts;
        setBalance(card, owing);
        setBalance(current, overdrawn);
    });
});

// The trend sample is patched once both figures are known: the earlier figure waits for the second step.
Given("{actor}'s total debt three months ago was {money}", (_actor: string, earlier: number) => {
    scenario.state.pending.debtEarlier = earlier;
});

Given("{actor}'s total debt now is {money}", async (actor: string, now: number) => {
    const earlier = scenario.state.pending.debtEarlier as number | undefined;
    if (earlier === undefined) throw new Error("'total debt three months ago' must come before 'total debt now'");
    await bindWithOverrides(control(), actor, 'br07-debt-trend.json', (o) => {
        const card = o.bureaux[0].accounts[0];
        setBalance(card, now);
        // The history has one entry per month to October 2026; three months before the controlled date is July.
        const july = card.balanceHistory.find((h: { month: string }) => h.month === '2026-07');
        july.balance = { amountMinor: earlier, currency: 'GBP' };
    });
});

Given("{actor}'s payments in {year} were {paymentPattern}", async (actor: string, year: number, sample: string) => {
    if (year !== 2025) throw new Error(`The BR-12 samples arrange 2025 only, not ${year}`);
    await bindWithOverrides(control(), actor, sample);
});

// ---- Events: real calls as the actor, on the controlled clock ---------------------------------------------------

Given('{actor} changed their email to {string} at {time}', async (actor: string, address: string, time: string) => {
    await setClockTo(time);
    const response = await actorCalled(actor).abilityTo(CallAnApi).request('changeEmail', { body: { address } });
    if (response.status >= 300) throw new Error(`Changing the email answered ${response.status}: ${JSON.stringify(response.body)}`);
});

const addedMobile = async (actor: string, number: string, time?: string) => {
    if (time) await setClockTo(time);
    const response = await actorCalled(actor).abilityTo(CallAnApi).request('changeMobile', { body: { number } });
    if (response.status >= 300) throw new Error(`Adding the mobile number answered ${response.status}: ${JSON.stringify(response.body)}`);
};
// Cucumber expressions cannot hold a parameter type in an optional, so the optional time is a second definition.
Given('{actor} added the mobile number {string}', (actor: string, number: string) => addedMobile(actor, number));
Given('{actor} added the mobile number {string} at {time}', addedMobile);

// The one place a stale token is kept on purpose (design section 7, rule 3).
Given("{actor}'s token has expired", async (actor: string) => {
    const { state } = scenario;
    const name = actor.toLowerCase();
    const token = await actorCalled(actor).abilityTo(CallAnApi).signIn();
    const expiresAt = new Date(state.expiresAt.get(name)!).getTime() + 1000;
    await control().setClock(new Date(expiresAt).toISOString().replace('.000Z', 'Z'));
    state.tokens.set(name, token);
    state.keepToken.add(name);
});

// Environment (glossary section 3): the runner started a second instance with no test control and no key (design section 8).
// From here the scenario's calls go to that instance, so the surface is shown absent and not merely guarded.
Given('test control is switched off', () => {
    const url = offBaseUrl();
    if (!url) throw new Error('HARNESS_OFF_BASE_URL is not set: the runner starts the instance without test control');
    scenario.state.baseUrl = url;
});
