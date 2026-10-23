// version: 4 | created: 2026-10-19T09:45Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The visual checks' Playwright configuration (CDS-43). Baselines are made and compared on Linux CI only (Phase 5 decision D2): scripts/run.mjs
// refuses to run `visual` anywhere else, except with VISUAL_LOCAL_TRY=1, which compares against throw-away images made on this machine to
// look for flaky pages and is never a result. Tolerance (D4, revised 2026-10-19; CDS-48 B-02, 2026-10-22): a colour distance of 0.1 per pixel
// (Playwright's default is 0.2, which let a shift of 0.15 through) and no pixel allowed to differ beyond it. What 0.1 still lets through: a change of one channel by 10 steps and a brightness change
// of up to about 26 levels in every channel; +32 fails (CDS-48 C-07). Up to 0.1% of the pixels, the first figure, hid `util-mismatch` (a bar 7 points too wide changes under 0.01% of a page);
// with none allowed it fails 12 of the 34 images. The service and the UI are started by run.mjs; the browser contexts are made in the spec.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@playwright/test';

const harness = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const local = process.env.VISUAL_LOCAL_TRY === '1';

export default defineConfig({
    testDir: path.join(harness, 'src', 'visual'),
    testMatch: 'visual.spec.ts',
    snapshotDir: path.join(harness, local ? 'reports/visual-local-baselines' : 'visual-baselines'),
    snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
    outputDir: path.join(harness, 'reports', 'visual-results'),
    // One worker, in order: the service holds one persona for the user and the pages share one session per context.
    workers: 1,
    fullyParallel: false,
    retries: 0,
    timeout: 60_000,
    reporter: [['list']],
    expect: { toHaveScreenshot: { threshold: 0.1, maxDiffPixelRatio: 0, animations: 'disabled', caret: 'hide' } },
});
