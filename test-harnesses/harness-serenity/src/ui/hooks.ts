import { After, AfterAll, Before, BeforeAll } from '@cucumber/cucumber';
import { actorCalled, Cast, configure, engage } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { Page } from '@serenity-js/web';
import { chromium, type Browser } from 'playwright';

import { ControlTheTestEnvironment } from '../abilities/ControlTheTestEnvironment.js';
import { STAGE_MANAGER } from '../support/actors.js';
import { afterScenario } from '../support/diagnostics.js';
import { crewFor } from '../support/serenity-crew.js';
import { controlKey, resetScenario, scenario } from '../support/world.js';

let browser: Browser;

/** The page the actors browse: the service serves the built UI beside the API (decision brief 11 D2). */
export const uiUrl = () => process.env.HARNESS_UI_URL ?? '';

BeforeAll(async () => {
    configure({ crew: crewFor('ui') });
    // HARNESS_BROWSER_PATH lets a machine use a Chromium it already has; CI installs the one Playwright wants.
    browser = await chromium.launch({ headless: true, executablePath: process.env.HARNESS_BROWSER_PATH || undefined });
});

// A browser that will not close must fail with its reason on the console, not leave an exit code with every scenario green (CDS-38 C-15).
AfterAll({ timeout: 60_000 }, async () => {
    if (!browser) return;
    const closed = await Promise.race([browser.close().then(() => true), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 30_000))]);
    if (!closed) {
        console.error('harness: the browser did not close within 30 s');
        // A browser that will not close keeps Node alive after the hook has failed, and the failure would show only when someone killed the run.
        // The timer does not hold the process open itself; it fires while the stuck browser does, after the report has been written (R2-C-10).
        setTimeout(() => process.exit(1), 5_000).unref();
        throw new Error('The browser did not close within 30 s');
    }
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
    // A reset clears the flags, so a proof run (HARNESS_BUGS) switches its flag on again for each scenario; a run with none sets
    // none, and either way the service is asked what is in force (CDS-38 B-06).
    await control.arrangeFlags();
});

After(async function (testCase) {
    await afterScenario(this, testCase, async () => {
        const names = [...scenario.state.personas.keys()];
        if (names.length === 0) return 'page: (no actor opened a page)';
        const actor = actorCalled(names.at(-1)!.replace(/^./, (c) => c.toUpperCase()));
        return `page: ${(await actor.answer(Page.current().url())).href}
page title: ${await actor.answer(Page.current().title())}`;
    });
});
