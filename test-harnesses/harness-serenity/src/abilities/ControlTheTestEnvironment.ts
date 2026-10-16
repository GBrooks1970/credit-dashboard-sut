import { Ability } from '@serenity-js/core';

import { scenario } from '../support/world.js';
import { send } from './CallAnApi.js';

/** The `/__test/*` operations (design section 3.2). Every change that can affect a token drops the cached tokens. */
export class ControlTheTestEnvironment extends Ability {
    static ofTheService(): ControlTheTestEnvironment {
        return new ControlTheTestEnvironment();
    }

    async reset(): Promise<void> {
        await this.expect(send('testReset', {}), 204, 'reset');
        scenario.state.tokens.clear();
        scenario.state.keepToken.clear();
    }

    async bind(username: string, persona: string, overrides?: unknown): Promise<void> {
        await this.expect(send('testBindPersona', { path: { username }, body: { persona, overrides } }), 204, `bind ${username}`);
        scenario.state.tokens.delete(username);
        scenario.state.keepToken.delete(username);
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
        const held = [...((state.body as { flags?: string[] }).flags ?? [])].sort();
        if (JSON.stringify(held) !== JSON.stringify([...wanted].sort())) {
            throw new Error(`Test control: the flags in force are [${held.join(', ')}], this run asked for [${wanted.join(', ')}]`);
        }
    }

    /** The flags a proof run asks for: HARNESS_BUGS is a comma separated list, absent in every ordinary run. */
    static flagsFromEnvironment(): string[] {
        return (process.env.HARNESS_BUGS ?? '').split(',').map((f) => f.trim()).filter(Boolean);
    }

    async setClock(now: string): Promise<void> {
        await this.expect(send('testSetClock', { body: { now } }), 204, 'set the clock');
        scenario.state.today = now.slice(0, 10);
        scenario.state.tokens.clear();
        scenario.state.keepToken.clear();
    }

    private async expect(call: Promise<{ status: number; body: unknown }>, status: number, what: string): Promise<void> {
        const response = await call;
        if (response.status !== status) {
            throw new Error(`Test control: ${what} answered ${response.status}, expected ${status}: ${JSON.stringify(response.body)}`);
        }
    }
}
