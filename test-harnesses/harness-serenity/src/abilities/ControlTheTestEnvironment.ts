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
    }

    async setClock(now: string): Promise<void> {
        await this.expect(send('testSetClock', { body: { now } }), 204, 'set the clock');
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
