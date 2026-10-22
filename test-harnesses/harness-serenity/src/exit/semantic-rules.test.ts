// version: 1 | created: 2026-10-22T16:30Z | project: credit-dashboard-sut | type: test | language: en-GB
// The semantic rules on hand-made pages (CDS-48, review findings A-05 and A-06): each page is one a reviewer used to show a rule missing a
// defect its flag models, or flagging something fine. They run in a real browser, so this file runs where one is installed (the `ui` CI
// job and a developer's machine: `npm run test:rules`), not in `verify`.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { chromium, type Browser, type Page } from 'playwright';

import { SEMANTIC_RULES } from './semantic-rules.js';

let browser: Browser;
let page: Page;

before(async () => {
    browser = await chromium.launch({ headless: true, executablePath: process.env.HARNESS_BROWSER_PATH || undefined });
    page = await browser.newPage();
});
after(async () => {
    await browser?.close();
});

async function problemsOn(html: string): Promise<string[]> {
    await page.setContent(html);
    return (await page.evaluate(SEMANTIC_RULES)) as string[];
}

/** A utilisation bar as the application draws it: the figure in a paragraph before it, a track, and a fill whose width is a percentage of it. */
const bar = (opts: { text?: string; now: number; width: number; name?: string }) =>
    `<main><p>${opts.text ?? `${opts.now}% used`}</p>` +
    `<div data-testid="account-util-bar-creditcard" role="progressbar" aria-label="${opts.name ?? 'Credit cards utilisation'}" aria-valuemin="0" aria-valuemax="${Math.max(100, opts.now)}" aria-valuenow="${opts.now}" style="display:block;width:200px;height:10px">` +
    `<div style="display:block;height:10px;width:${opts.width}%"></div></div></main>`;

const table = (cells: string[]) =>
    `<main><table data-testid="history-chart-table"><tbody>${cells.map((c) => `<tr><th scope="row">May 2026</th><td>${c}</td></tr>`).join('')}</tbody></table></main>`;

test('a bar whose value, text and drawn width agree has no problem', async () => {
    assert.deepEqual(await problemsOn(bar({ now: 6, width: 6 })), []);
});

test('a bar drawn wider than its value is a problem even when the value and the text agree (A-05)', async () => {
    const problems = await problemsOn(bar({ now: 6, width: 13 }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /progress-value-matches-text/);
    assert.match(problems[0], /drawn 13% wide/);
});

test('a fill stops at full: a value over 100 drawn full has no problem, drawn short has (A-05)', async () => {
    assert.deepEqual(await problemsOn(bar({ now: 120, width: 100 })), []);
    const problems = await problemsOn(bar({ now: 120, width: 70 }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /drawn 70% wide/);
});

test('a name with money and a percentage that is the bar\'s own value is a good name (A-06)', async () => {
    assert.deepEqual(await problemsOn(bar({ now: 6, width: 6, name: 'Credit cards utilisation: 6% of a £6,100 limit' })), []);
});

test('a name with no figure is a good name', async () => {
    assert.deepEqual(await problemsOn(bar({ now: 6, width: 6, name: 'Credit cards utilisation' })), []);
});

test('a name whose percentage is another number is still a problem: the minor-units flag', async () => {
    const problems = await problemsOn(bar({ now: 83, width: 83, name: '423600% of 510000' }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /progress-name-matches-value/);
});

test('a chart table with a number, a money amount or "No score" in every cell has no problem', async () => {
    assert.deepEqual(await problemsOn(table(['650', '£4,236.00', 'No score'])), []);
});

test('a chart table with an empty cell or a cell with no figure is a problem (A-05)', async () => {
    for (const cell of ['', 'n/a', '-', 'unknown']) {
        const problems = await problemsOn(table(['650', cell]));
        assert.equal(problems.length, 1, `cell '${cell}'`);
        assert.match(problems[0], /chart-table-has-values/);
    }
});
