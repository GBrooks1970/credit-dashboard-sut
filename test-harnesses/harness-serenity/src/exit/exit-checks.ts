// version: 1 | created: 2026-10-13T22:40Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The Phase 4 exit checks (CDS-36, plan "Verification"): an axe-core scan of every page of the UI with the bug flags off, which
// must return zero violations (UI specification 4.5 and 9), and the three layouts (375, 768 and 1280 px; specification 4.4).
// Run by `node scripts/run.mjs exit`, against the live service serving the built UI. Not a Gherkin scenario: the 41 `@ui`
// scenarios are the behaviour, these are the standing checks on every page.
import { AxeBuilder } from '@axe-core/playwright';
import { chromium, type Page } from 'playwright';

const ui = process.env.HARNESS_UI_URL ?? '';
const api = process.env.HARNESS_BASE_URL ?? '';
const key = process.env.HARNESS_CONTROL_KEY ?? '';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

interface Target {
    name: string;
    address: string;
    /** The hook that shows the page has loaded. */
    ready: string;
    /** Brings the page into a state worth scanning (an open dialog, an error). */
    act?: (page: Page) => Promise<void>;
    /** Pages to look at in every layout; the rest are scanned at desktop width only. */
    layouts?: boolean;
}

const R = '/credit-health/report/bureau-a';
const card = 'acc_ddcc01';

const targets: Target[] = [
    { name: 'overview', address: R, ready: 'score-value', layouts: true },
    {
        name: 'overview, chat open',
        address: R,
        ready: 'score-value',
        act: async (page) => {
            await page.getByTestId('btn-chat').click();
            await page.getByTestId('chat-drawer').waitFor();
        },
    },
    { name: 'payment history', address: `${R}/payment-history`, ready: 'ph-result' },
    { name: 'report changes', address: '/insights/updates?bureauId=bureau-a', ready: 'changes-filter-all' },
    { name: 'hard searches', address: `${R}/searches/hard`, ready: 'searches-heading' },
    { name: 'soft searches', address: `${R}/searches/soft`, ready: 'searches-heading' },
    { name: 'personal details', address: `${R}/personal-details`, ready: 'pd-name' },
    { name: 'debt overview', address: '/credit-health/debt-overview', ready: 'debt-total' },
    ...['creditcard', 'loan', 'mortgage', 'currentaccount', 'telecomsandutilities', 'lineofcredit'].map((type) => ({
        name: `account list: ${type}`,
        address: `${R}/accounts/${type}`,
        ready: 'list-summary',
        layouts: type === 'creditcard',
    })),
    { name: 'closed accounts', address: `${R}/closed-accounts`, ready: 'closed-title' },
    ...[
        ['credit card', 'acc_ddcc01'],
        ['loan', 'acc_ddln01'],
        ['mortgage', 'acc_ddmg01'],
        ['current account', 'acc_ddca01'],
        ['utilities and telecoms', 'acc_ddtu01'],
        ['credit account', 'acc_ddlc01'],
        ['closed card', 'acc_ddcl01'],
    ].map(([label, id]) => ({ name: `account detail: ${label}`, address: `${R}/account/${id}`, ready: 'detail-balance', layouts: label === 'credit card' })),
    ...['interestRate', 'apr', 'promoPeriodMonths', 'minPayment', 'paymentMethod'].map((field) => ({
        name: `edit form: ${field}`,
        address: `/data-capture/${field}?accountId=${card}&redirectUrl=${encodeURIComponent(`${R}/account/${card}`)}`,
        ready: 'dc-prompt',
    })),
    {
        name: 'edit form, with an error',
        address: `/data-capture/interestRate?accountId=${card}&redirectUrl=${encodeURIComponent(`${R}/account/${card}`)}`,
        ready: 'dc-prompt',
        act: async (page) => {
            await page.getByTestId('dc-option-other').check();
            await page.getByTestId('dc-input').fill('120');
            await page.getByTestId('dc-save').click();
            await page.getByTestId('dc-error').waitFor();
        },
    },
    { name: 'profile', address: '/my-account/profile', ready: 'profile-legal-name', layouts: true },
    {
        name: 'profile, name information open',
        address: '/my-account/profile',
        ready: 'profile-legal-name',
        act: async (page) => {
            await page.getByTestId('profile-name-info').click();
            await page.getByTestId('profile-name-info-panel').waitFor();
        },
    },
    {
        name: 'profile, preferred name refused',
        address: '/my-account/profile',
        ready: 'profile-legal-name',
        act: async (page) => {
            await page.getByTestId('profile-preferred-input').fill('R2D2');
            await page.getByTestId('profile-preferred-save').click();
            await page.getByTestId('profile-preferred-error').waitFor();
        },
    },
    { name: 'email', address: '/my-account/profile/email', ready: 'email-input' },
    { name: 'mobile', address: '/my-account/profile/mobile', ready: 'mobile-input' },
    {
        name: 'mobile, code step',
        address: '/my-account/profile/mobile',
        ready: 'mobile-input',
        act: async (page) => {
            await page.getByTestId('mobile-input').fill('07700 900456');
            await page.getByTestId('mobile-save').click();
            await page.getByTestId('mobile-code-input').waitFor();
        },
    },
    { name: 'a page not built yet', address: '/my-account/profile/address', ready: 'page-not-built' },
];

async function control(path: string, method: string, body?: unknown) {
    const response = await fetch(`${api}${path}`, {
        method,
        headers: { 'x-test-control-key': key, ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status !== 204) throw new Error(`test control ${method} ${path} answered ${response.status}`);
}

/** A new visit: no session, so the app sends the visitor to sign-in and back to the address (UI specification 6.1). */
async function visit(page: Page, address: string, ready: string) {
    await page.goto(`${ui}${address}`);
    await page.getByTestId('login-submit').waitFor();
    await page.getByTestId('login-username').fill('alex');
    await page.getByTestId('login-password').fill('demo-only');
    await page.getByTestId('login-submit').click();
    await page.getByTestId(ready).waitFor();
    // Every data-bound section has settled: none is still loading.
    await page.waitForFunction(NOTHING_LOADING);
}

async function violationsOn(page: Page): Promise<string[]> {
    const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    return result.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`);
}

// These run in the browser. The harness's TypeScript has no DOM types, so they are source text, not functions.
const NOTHING_LOADING = "!document.querySelector('[data-testid$=\"-loading\"]')";
const LAYOUT_FACTS = `(() => {
    const shown = (selector) => [...document.querySelectorAll(selector)].filter((e) => e.offsetParent !== null).length;
    return {
        primary: shown('[data-testid^="nav-primary-"]'),
        mobile: shown('[data-testid^="nav-mobile-"]'),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        banner: !!document.querySelector('[data-testid="demo-banner"]'),
    };
})()`;

const LAYOUTS = [
    { width: 375, height: 812, nav: 'mobile' },
    { width: 768, height: 1024, nav: 'primary' },
    { width: 1280, height: 800, nav: 'primary' },
] as const;

const failures: string[] = [];
let scans = 0;
let layoutChecks = 0;

const browser = await chromium.launch({ headless: true, executablePath: process.env.HARNESS_BROWSER_PATH || undefined });
try {
    await control('/__test/reset', 'POST');
    await control('/__test/users/alex/persona', 'PUT', { persona: 'drilldown' });

    // 1. axe-core on every page (and on the states that show something new), desktop width, flags off.
    {
        const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await context.newPage();
        // The anonymous sign-in page first.
        await page.goto(`${ui}/login`);
        await page.getByTestId('login-submit').waitFor();
        const login = await violationsOn(page);
        scans++;
        failures.push(...login.map((v) => `sign-in: ${v}`));
        console.log(`  ${login.length === 0 ? 'pass' : 'FAIL'}  axe  sign-in${login.length ? `: ${login.length} violation(s)` : ''}`);
        await page.goto(`${ui}/login`);
        await page.getByTestId('login-username').fill('alex');
        await page.getByTestId('login-password').fill('wrong');
        await page.getByTestId('login-submit').click();
        await page.getByTestId('login-error').waitFor();
        const loginError = await violationsOn(page);
        scans++;
        failures.push(...loginError.map((v) => `sign-in, error shown: ${v}`));
        console.log(`  ${loginError.length === 0 ? 'pass' : 'FAIL'}  axe  sign-in, error shown${loginError.length ? `: ${loginError.length} violation(s)` : ''}`);

        for (const target of targets) {
            await visit(page, target.address, target.ready);
            if (target.act) await target.act(page);
            const found = await violationsOn(page);
            scans++;
            failures.push(...found.map((v) => `${target.name}: ${v}`));
            console.log(`  ${found.length === 0 ? 'pass' : 'FAIL'}  axe  ${target.name}${found.length ? `: ${found.length} violation(s)` : ''}`);
        }
        await context.close();
    }

    // 2. The three layouts: one navigation at a time, no sideways scroll, the demo banner shown, and axe at each width.
    for (const layout of LAYOUTS) {
        const context = await browser.newContext({ viewport: { width: layout.width, height: layout.height } });
        const page = await context.newPage();
        for (const target of targets.filter((t) => t.layouts)) {
            await visit(page, target.address, target.ready);
            const nav = (await page.evaluate(LAYOUT_FACTS)) as { primary: number; mobile: number; overflow: number; banner: boolean };
            const problems: string[] = [];
            if (layout.nav === 'mobile' && !(nav.mobile === 3 && nav.primary === 0)) problems.push(`expected the bottom tab bar only, found ${nav.mobile} tab(s) and ${nav.primary} top link(s)`);
            if (layout.nav === 'primary' && !(nav.primary === 3 && nav.mobile === 0)) problems.push(`expected the top navigation only, found ${nav.primary} link(s) and ${nav.mobile} tab(s)`);
            if (nav.overflow > 0) problems.push(`the page scrolls sideways by ${nav.overflow}px`);
            if (!nav.banner) problems.push('the demo banner is missing');
            problems.push(...(await violationsOn(page)));
            layoutChecks++;
            failures.push(...problems.map((p) => `${layout.width}px, ${target.name}: ${p}`));
            console.log(`  ${problems.length === 0 ? 'pass' : 'FAIL'}  layout ${layout.width}px  ${target.name}${problems.length ? `: ${problems.join('; ')}` : ''}`);
        }
        await context.close();
    }
} finally {
    await browser.close();
}

console.log(`\nexit checks: ${scans} axe scans and ${layoutChecks} layout checks; ${failures.length} problem(s)`);
if (failures.length > 0) {
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
}
