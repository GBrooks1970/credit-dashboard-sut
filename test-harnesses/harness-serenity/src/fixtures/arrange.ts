import { scenario } from '../support/world.js';
import { overrideSample } from './load.js';
import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';

type Json = any;

/** BR-03: utilisation is balance over limit as a whole percentage, half up (towards +infinity). Integer arithmetic only. */
export function rawUtilisation(balanceMinor: number, limitMinor: number): number | null {
    if (limitMinor <= 0) return null;
    return Math.floor((200 * balanceMinor + limitMinor) / (2 * limitMinor));
}

const money = (amountMinor: number) => ({ amountMinor, currency: 'GBP' });

/** Sets an account's balance and limit and everything the rules derive from them (the service checks they agree: 422 otherwise). */
export function setBalance(account: Json, balanceMinor: number, limitMinor?: number): void {
    const limit = limitMinor ?? account.limit?.amountMinor;
    account.balance = money(balanceMinor);
    if (limit !== undefined && limit !== null) account.limit = money(limit);
    const raw = limit ? rawUtilisation(balanceMinor, limit) : null;
    account.utilisationRaw = raw;
    account.utilisation = raw === null ? null : Math.max(0, raw);
    const last = account.balanceHistory?.at(-1);
    if (last) {
        last.balance = money(balanceMinor);
        if (limit) last.limit = money(limit);
    }
}

/**
 * Loads a checked override sample, lets the step patch the values it drives, and binds it for the actor over the persona
 * the actor already holds. A sample for another persona is a loud failure: the arrangement would silently change meaning.
 */
export async function bindWithOverrides(
    control: ControlTheTestEnvironment,
    actor: string,
    file: string,
    patch: (overrides: Json) => void = () => {},
): Promise<Json> {
    const sample = overrideSample(file);
    const username = actor.toLowerCase();
    const persona = scenario.state.personas.get(username);
    if (!persona || persona !== sample.base) {
        throw new Error(`${file} is built on the '${sample.base}' persona, but ${actor} holds '${persona ?? 'none'}'`);
    }
    const overrides = structuredClone(sample.overrides);
    patch(overrides);
    await control.bind(username, persona, overrides);
    return overrides;
}
