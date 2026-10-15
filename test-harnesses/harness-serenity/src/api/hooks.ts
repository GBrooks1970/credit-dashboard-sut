import { After, Before, BeforeAll } from '@cucumber/cucumber';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { actorCalled, Cast, configure, engage } from '@serenity-js/core';

import { CallAnApi } from '../abilities/CallAnApi.js';
import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';
import { STAGE_MANAGER } from '../support/actors.js';
import { afterScenario } from '../support/diagnostics.js';
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
    const control = actorCalled(STAGE_MANAGER).abilityTo(ControlTheTestEnvironment);
    await control.reset();
    // A reset clears the flags, so a proof run (HARNESS_BUGS) switches its flag on again for each scenario.
    const flags = ControlTheTestEnvironment.flagsFromEnvironment();
    if (flags.length > 0) await control.setBugs(flags);
});

After(async function (testCase) {
    await afterScenario(this, testCase);
});
