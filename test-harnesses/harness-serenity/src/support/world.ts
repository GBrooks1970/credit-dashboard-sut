import type { Contract } from '../contract/validate.js';

export interface Response {
    status: number;
    body: any;
}

/** What one scenario knows. Cleared before each scenario (design section 5). */
export class ScenarioState {
    /** Cached token per actor; dropped on any clock change or persona bind (design section 7). */
    readonly tokens = new Map<string, string>();
    /** Actors whose (expired) token is kept on purpose. */
    readonly keepToken = new Set<string>();
    /** The persona each actor is bound to, and the date the clock was last frozen on (YYYY-MM-DD). */
    readonly personas = new Map<string, string>();
    today?: string;
    /** When each cached token expires, from the sign-in response. */
    readonly expiresAt = new Map<string, string>();
    /** The account the last account-describing Given stored (glossary section 3, 'That account'). */
    thatAccount?: string;
    /** Values one Given holds for the next (the earlier debt for the trend sample). */
    readonly pending: Record<string, unknown> = {};
    /** Every response body this scenario received, for "no response contains" (BR-09). */
    readonly bodies: string[] = [];
    last?: Response;
    baseUrl = process.env.HARNESS_BASE_URL ?? '';
}

export const scenario = { state: new ScenarioState() };
export const resetScenario = () => {
    scenario.state = new ScenarioState();
};

/** The instance started without test control (design section 8). */
export const offBaseUrl = () => process.env.HARNESS_OFF_BASE_URL ?? '';

export const controlKey =() => process.env.HARNESS_CONTROL_KEY ?? '';

let contract: Contract | undefined;
export const setContract = (c: Contract) => {
    contract = c;
};
export const theContract = () => {
    if (!contract) throw new Error('The contract is not loaded');
    return contract;
};
