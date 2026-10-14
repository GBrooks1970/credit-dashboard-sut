import { After, AfterAll, Before, BeforeAll } from '@cucumber/cucumber';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { actorCalled, Cast, configure, engage } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { chromium, type Browser } from 'playwright';

import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';
import { STAGE_MANAGER } from '../support/actors.js';
import { controlKey, resetScenario } from '../support/world.js';

let browser: Browser;

/** The page the actors browse: the service serves the built UI beside the API (decision brief 11 D2). */
export const uiUrl = () => process.env.HARNESS_UI_URL ?? '';

BeforeAll(async () => {
    configure({ crew: [ConsoleReporter.fromJSON({ theme: 'auto' })] });
    // HARNESS_BROWSER_PATH lets a machine use a Chromium it already has; CI installs the one Playwright wants.
    browser = await chromium.launch({ headless: true, executablePath: process.env.HARNESS_BROWSER_PATH || undefined });
});

AfterAll(async () => {
    await browser?.close();
});

Before(async () => {
    resetScenario();
    engage(
        Cast.where((actor) =>
            actor.name === STAGE_MANAGER
                ? actor.whoCan(ControlTheTestEnvironment.ofTheService())
                : actor.whoCan(BrowseTheWebWithPlaywright.using(browser, {
                      baseURL: uiUrl(),
                      // A test build of the UI reads the control key from browser storage before it starts (decision brief 13 D1).
                      storageState: { cookies: [], origins: [{ origin: new URL(uiUrl()).origin, localStorage: [{ name: 'cds.testControlKey', value: controlKey() }] }] },
                  })),
        ),
    );
    // Every scenario starts from reloaded fixtures and a clock that follows real time.
    const control = actorCalled(STAGE_MANAGER).abilityTo(ControlTheTestEnvironment);
    await control.reset();
    // A reset clears the flags, so a proof run (HARNESS_BUGS) switches its flag on again for each scenario.
    const flags = ControlTheTestEnvironment.flagsFromEnvironment();
    if (flags.length > 0) await control.setBugs(flags);
});

After(async () => {
    resetScenario();
});
