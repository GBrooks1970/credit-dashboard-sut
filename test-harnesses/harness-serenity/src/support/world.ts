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
    last?: Response;
    baseUrl = process.env.HARNESS_BASE_URL ?? '';
}

export const scenario = { state: new ScenarioState() };
export const resetScenario = () => {
    scenario.state = new ScenarioState();
};

export const controlKey = () => process.env.HARNESS_CONTROL_KEY ?? '';

let contract: Contract | undefined;
export const setContract = (c: Contract) => {
    contract = c;
};
export const theContract = () => {
    if (!contract) throw new Error('The contract is not loaded');
    return contract;
};
