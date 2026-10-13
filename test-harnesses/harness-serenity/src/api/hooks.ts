import { After, Before, BeforeAll } from '@cucumber/cucumber';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { actorCalled, Cast, configure, engage } from '@serenity-js/core';

import { CallAnApi } from '../abilities/CallAnApi.js';
import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';
import { STAGE_MANAGER } from '../support/actors.js';
import { resetScenario } from '../support/world.js';

BeforeAll(() => {
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
