import { Ability } from '@serenity-js/core';

import { testUser } from '../fixtures/load.js';
import { controlKey, scenario, theContract, type Response } from '../support/world.js';

export interface CallOptions {
    path?: Record<string, string>;
    query?: Record<string, string>;
    body?: unknown;
}

/**
 * The only way an actor reaches the API (DR-042): a thin ability on fetch that builds the request from the contract's
 * operation and validates every response against the contract before a step sees it.
 */
export class CallAnApi extends Ability {
    static asUser(username: string): CallAnApi {
        return new CallAnApi(username);
    }

    constructor(private readonly username: string) {
        super();
    }

    /** Signs in lazily, at whatever the clock then says (design section 7). */
    async signIn(): Promise<string> {
        const { state } = scenario;
        const held = state.tokens.get(this.username);
        if (held) return held;
        const user = testUser(this.username);
        const response = await send('login', { body: { username: user.username, password: user.password } });
        if (response.status !== 200) throw new Error(`Sign-in as ${this.username} failed with ${response.status}`);
        state.tokens.set(this.username, response.body.token);
        return response.body.token;
    }

    async request(operationId: string, options: CallOptions = {}): Promise<Response> {
        const op = theContract().operation(operationId);
        const token = op.needsUser ? await this.signIn() : undefined;
        const response = await send(operationId, options, token);
        scenario.state.last = response;
        return response;
    }
}

/** One call and its contract check; used by the ability and by the test-control ability. */
export async function send(operationId: string, options: CallOptions, token?: string): Promise<Response> {
    const contract = theContract();
    const op = contract.operation(operationId);
    let path = op.path;
    for (const [name, value] of Object.entries(options.path ?? {})) path = path.replace(`{${name}}`, encodeURIComponent(value));
    const query = options.query ? `?${new URLSearchParams(options.query)}` : '';
    const headers: Record<string, string> = {};
    if (options.body !== undefined) headers['content-type'] = 'application/json';
    if (token) headers.authorization = `Bearer ${token}`;
    if (op.needsControlKey) headers['x-test-control-key'] = controlKey();
    const http = await fetch(`${scenario.state.baseUrl}${path}${query}`, {
        method: op.method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await http.text();
    const body = text ? JSON.parse(text) : undefined;
    contract.validate(operationId, http.status, body, text.length > 0);
    return { status: http.status, body };
}
