// version: 3 | created: 2026-10-19T09:45Z | project: credit-dashboard-sut | type: test | language: en-GB
// The visual checks (CDS-43): each of the eight pages, at 375 and 1280 px, in the light and in the dark theme, photographed whole and compared
// with its baseline. Run by `node scripts/run.mjs visual` against the live service serving the built UI, flags off. Not a Gherkin scenario:
// the @ui scenarios are the behaviour, this is how the pages look.
import fs from 'node:fs';

import { expect, test, type BrowserContext, type Page } from '@playwright/test';

import { allTargets, arrange, control, uiContext } from '../exit/targets.js';
import { baselineProblems, THEMES, visualCases, WIDTHS } from './cases.js';

const HEIGHTS = { 375: 812, 1280: 800 } as const;

test.describe.configure({ mode: 'serial' });

// The service's clock is frozen, because what a page shows depends on it ("Updates in 0 days", the months of the history chart, which changes
// count as recent): with the real clock every baseline would go out of date at the turn of a month.
const TODAY = '2026-10-03T09:00:00Z';
// The bug flags the run switches on (HARNESS_BUGS, comma separated): none in the standing run; the flag proof switches one on (CDS-43 P5b).
const flags = (process.env.HARNESS_BUGS ?? '').split(',').map((f) => f.trim()).filter(Boolean);

test.beforeAll(async () => {
    await control('/__test/reset', 'POST');
    await control('/__test/bugs', 'PUT', { flags });
    await control('/__test/clock', 'PUT', { now: TODAY });
});

test.afterAll(async () => {
    await control('/__test/reset', 'POST');
});

for (const width of WIDTHS) {
    for (const theme of THEMES) {
        test.describe(`${width}px, ${theme}`, () => {
            let context: BrowserContext;
            let page: Page;
            test.beforeAll(async ({ browser }) => {
                context = await uiContext(browser, { viewport: { width, height: HEIGHTS[width] }, colorScheme: theme, reducedMotion: 'reduce' });
                page = await context.newPage();
            });
            test.afterAll(async () => {
                await context.close();
            });

            for (const c of visualCases().filter((x) => x.width === width && x.theme === theme)) {
                test(c.page, async () => {
                    const target = allTargets.find((t) => t.name === c.page);
                    if (!target) throw new Error(`no exit-check target is named '${c.page}'`);
                    await arrange(page, target, async () => {
                        // Fonts in place, then one look: the page is already settled (no section still loading) when arrange returns.
                        await page.evaluate('document.fonts.ready');
                        await expect(page).toHaveScreenshot(c.file, { fullPage: true });
                    });
                });
            }
        });
    }
}

// Last, so that after a refresh it looks at the images just written: the folder holds exactly the images the cases compare.
test('the baseline folder holds exactly the images that are compared', async ({}, testInfo) => {
    const dir = testInfo.project.snapshotDir;
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    expect(baselineProblems(files), `baseline folder ${dir}`).toEqual([]);
});
