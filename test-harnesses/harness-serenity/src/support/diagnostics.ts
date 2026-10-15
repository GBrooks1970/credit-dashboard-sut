import { Status, type ITestCaseHookParameter } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';

import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';
import { STAGE_MANAGER } from './actors.js';
import { resetScenario, scenario } from './world.js';

/** What a failed scenario attaches (harness design section 5, After): the last response, the arrangement and the flags in force. */
export function diagnostics(): string {
    const { state } = scenario;
    const last = state.last;
    const lines = [
        `today: ${state.today ?? '(the clock follows real time)'}`,
        `personas: ${JSON.stringify(Object.fromEntries(state.personas))}`,
        `flags from HARNESS_BUGS / CDS_FLAGS: ${ControlTheTestEnvironment.flagsFromEnvironment().join(', ') || '(none)'}`,
        `responses received: ${state.bodies.length}`,
    ];
    if (last) {
        lines.push(`last response: ${last.status}`, `last headers: ${JSON.stringify(last.headers)}`, `last body: ${JSON.stringify(last.body)?.slice(0, 2000)}`);
    }
    return lines.join('\n');
}

/**
 * The After hook of both profiles (B-13): attach the diagnostics when the scenario failed, then put the service back to
 * fixtures, real time and no flags, so the next scenario (and anything run after the suite) starts from a known state and
 * a failed restore is a failure, not a silent leak. The scenario's own state is dropped last.
 */
export async function afterScenario(world: { attach: (data: string, mediaType: string) => unknown }, testCase: ITestCaseHookParameter): Promise<void> {
    if (testCase.result?.status === Status.FAILED) await world.attach(diagnostics(), 'text/plain');
    try {
        // A scenario may have pointed the actors at the instance without test control; the restore goes to the main one.
        scenario.state.baseUrl = process.env.HARNESS_BASE_URL ?? '';
        await actorCalled(STAGE_MANAGER).abilityTo(ControlTheTestEnvironment).reset();
    } finally {
        resetScenario();
    }
}
