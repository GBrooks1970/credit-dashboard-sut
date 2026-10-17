import { Ability } from '@serenity-js/core';

import { testUsers } from '../fixtures/load.js';
import { scenario } from '../support/world.js';
import { send } from './CallAnApi.js';

const sortKeys = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

/** The `/__test/*` operations (design section 3.2). Every change that can affect a token drops the cached tokens. */
export class ControlTheTestEnvironment extends Ability {
    static ofTheService(): ControlTheTestEnvironment {
        return new ControlTheTestEnvironment();
    }

    async reset(): Promise<void> {
        await this.expect(send('testReset', {}), 204, 'reset');
        scenario.state.tokens.clear();
    }

    async bind(username: string, persona: string, overrides?: unknown): Promise<void> {
        await this.expect(send('testBindPersona', { path: { username }, body: { persona, overrides } }), 204, `bind ${username}`);
        scenario.state.tokens.delete(username);
        scenario.state.personas.set(username, persona);
    }

    /** Switches exactly these bug flags on (an empty list switches all off). The proof runner sets them through HARNESS_BUGS (CDS-39). */
    async setBugs(flags: string[]): Promise<void> {
        await this.expect(send('testSetBugs', { body: { flags } }), 204, 'set the bug flags');
    }

    /**
     * Puts the bug flags to exactly what this run asks for (HARNESS_BUGS, none in an ordinary run) and checks the service agrees.
     * An empty list is set too: a run with the flags off is shown to have them off, and does not rely on the reset alone (B-06).
     */
    async arrangeFlags(): Promise<void> {
        const wanted = ControlTheTestEnvironment.flagsFromEnvironment();
        await this.setBugs(wanted);
        const state = await send('testGetState', {});
        const held = state.body as { flags?: string[]; now?: string | null; latency?: Record<string, unknown> | null; personas?: Record<string, string>; overridden?: Record<string, boolean> };
        const flags = [...(held.flags ?? [])].sort();
        if (JSON.stringify(flags) !== JSON.stringify([...wanted].sort())) {
            throw new Error(`Test control: the flags in force are [${flags.join(', ')}], this run asked for [${wanted.join(', ')}]`);
        }
        // The rest of the state after a reset (R2-B-07): a reset that leaves the clock frozen, a latency set or a user on another persona
        // would otherwise reach the scenario unseen.
        const defaults = Object.fromEntries(testUsers().map((u) => [u.username, u.defaultPersona]));
        const problems = [
            held.now === null || held.now === undefined ? '' : `the clock is frozen at ${held.now}`,
            held.latency && Object.keys(held.latency).length > 0 ? `a latency is set (${JSON.stringify(held.latency)})` : '',
            JSON.stringify(sortKeys(held.personas ?? {})) === JSON.stringify(sortKeys(defaults)) ? '' : `the personas are ${JSON.stringify(held.personas)}, the defaults are ${JSON.stringify(defaults)}`,
            Object.values(held.overridden ?? {}).some(Boolean) ? 'a user holds overrides' : '',
        ].filter(Boolean);
        if (problems.length > 0) throw new Error(`Test control: after the reset ${problems.join('; ')}`);
    }

    /** The flags a proof run asks for: HARNESS_BUGS is a comma separated list, absent in every ordinary run. */
    static flagsFromEnvironment(): string[] {
        return (process.env.HARNESS_BUGS ?? '').split(',').map((f) => f.trim()).filter(Boolean);
    }

    async setClock(now: string): Promise<void> {
        await this.expect(send('testSetClock', { body: { now } }), 204, 'set the clock');
        scenario.state.today = now.slice(0, 10);
        scenario.state.tokens.clear();
    }

    private async expect(call: Promise<{ status: number; body: unknown }>, status: number, what: string): Promise<void> {
        const response = await call;
        if (response.status !== status) {
            throw new Error(`Test control: ${what} answered ${response.status}, expected ${status}: ${JSON.stringify(response.body)}`);
        }
    }
}
