import { After, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { actorCalled, Cast, configure, engage } from '@serenity-js/core';

import { CallAnApi } from '../abilities/CallAnApi.js';
import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';
import { Contract } from '../contract/validate.js';
import { resetScenario, setContract } from './world.js';

setDefaultTimeout(30_000);

export const STAGE_MANAGER = 'Stage Manager';

BeforeAll(() => {
    // The contract is read once, from DOCS/.architecture/openapi.yaml (DR-042).
    setContract(new Contract());
    configure({ crew: [ConsoleReporter.fromJSON({ theme: 'auto' })] });
});

Before(async () => {
    resetScenario();
    engage(
        Cast.where((actor) =>
            actor.name === STAGE_MANAGER
                ? actor.whoCan(ControlTheTestEnvironment.ofTheService())
                : actor.whoCan(CallAnApi.asUser(actor.name.toLowerCase())),
        ),
    );
    // Design section 5: every scenario starts from reloaded fixtures and a clock that follows real time.
    await actorCalled(STAGE_MANAGER).abilityTo(ControlTheTestEnvironment).reset();
});

After(async () => {
    resetScenario();
});
