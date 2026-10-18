// version: 3 | created: 2026-10-16T16:30Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The Phase 4 exit checks (CDS-36; widened in CDS-38 F10): an axe-core scan of every page of the UI and of every state that shows
// something new (an open dialog, a section error with its Retry, an empty list, a form error), in the light and in the dark theme,
// with the bug flags off (the flag proof switches one on through HARNESS_BUGS, CDS-41), which must return zero violations (UI specification 4.5 and 9); and the three layouts (375, 768 and
// 1280 px; specification 4.4) for every page, each with the text size of this machine and with the root text doubled.
// Run by `node scripts/run.mjs exit`, against the live service serving the built UI. Not a Gherkin scenario: the @ui scenarios
// are the behaviour, these are the standing checks on every page.
import { AxeBuilder } from '@axe-core/playwright';
import { chromium, type Browser, type Page } from 'playwright';

const ui = process.env.HARNESS_UI_URL ?? '';
const api = process.env.HARNESS_BASE_URL ?? '';
const key = process.env.HARNESS_CONTROL_KEY ?? '';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

interface Target {
    name: string;
    address: string;
    /** The hook that shows the page has loaded (a test id), or a CSS selector for a state that has no fixed hook. */
    ready: string;
    /** The persona the user holds for this target (default: drilldown). */
    persona?: string;
    /** API calls to fail with a 500 for this target, as URL patterns: shows a section's own error state with its Retry. */
    failing?: string[];
    /** Brings the page into a state worth scanning (an open dialog, a form error). */
    act?: (page: Page) => Promise<void>;
    /** Whether the page is looked at in every layout (default: every target that has no `act`, since a state of a page is not another page). */
    layouts?: boolean;
}

const R = '/credit-health/report/bureau-a';
const card = 'acc_ddcc01';
/** A page that shows nothing of its own (not built yet): where the browser waits between two targets. */
const NEUTRAL = '/my-account/profile/address';
const ERROR = '[data-testid$="-error"]';
const EMPTY = '[data-testid$="-empty"]';
const editAddress = (field: string) => `/data-capture/${field}?accountId=${card}&redirectUrl=${encodeURIComponent(`${R}/account/${card}`)}`;

const allTargets: Target[] = [
    { name: 'overview', address: R, ready: 'score-value' },
    { name: 'overview, chat open', address: R, ready: 'score-value', act: async (page) => { await page.getByTestId('btn-chat').click(); await page.getByTestId('chat-drawer').waitFor(); } },
    { name: 'overview, every change shown', address: R, ready: 'score-value', act: async (page) => { await page.getByTestId('changes-toggle').click(); await page.getByTestId('changes-toggle').waitFor(); } },
    { name: 'overview, history chart failed', address: R, ready: 'history-chart-error', failing: ['**/score/history*'] },
    { name: 'overview, full changes list failed', address: R, ready: 'score-value', failing: ['**/reports/*/changes*'], act: async (page) => { await page.getByTestId('changes-toggle').click(); await page.getByTestId('changes-toggle-error').waitFor(); } },
    { name: 'overview, failed', address: R, ready: 'report-overview-error', failing: ['**/reports/*/overview'] },
    { name: 'payment history', address: `${R}/payment-history`, ready: 'ph-result' },
    { name: 'payment history, a year with missed payments', address: `${R}/payment-history`, ready: 'ph-result', act: async (page) => { await page.getByTestId('ph-year-2025').click(); await page.locator('[data-testid^="ph-missed-"]').first().waitFor(); } },
    { name: 'payment history, failed', address: `${R}/payment-history`, ready: ERROR, failing: ['**/reports/*/payment-history*'] },
    { name: 'report changes', address: '/insights/updates?bureauId=bureau-a', ready: 'changes-filter-all' },
    { name: 'report changes, past the end', address: '/insights/updates?bureauId=bureau-a&page=9', ready: 'changes-past-end' },
    { name: 'report changes, failed', address: '/insights/updates?bureauId=bureau-a', ready: ERROR, failing: ['**/reports/*/changes*'] },
    { name: 'report changes, empty', address: '/insights/updates?bureauId=bureau-a', ready: EMPTY, persona: 'thin-file' },
    { name: 'hard searches', address: `${R}/searches/hard`, ready: 'searches-heading' },
    { name: 'soft searches', address: `${R}/searches/soft`, ready: 'searches-heading' },
    { name: 'searches, failed', address: `${R}/searches/hard`, ready: ERROR, failing: ['**/reports/*/searches*'] },
    { name: 'searches, empty', address: `${R}/searches/hard`, ready: EMPTY, persona: 'thin-file' },
    { name: 'personal details', address: `${R}/personal-details`, ready: 'pd-name' },
    { name: 'personal details, failed', address: `${R}/personal-details`, ready: ERROR, failing: ['**/personal-details*'] },
    { name: 'debt overview', address: '/credit-health/debt-overview', ready: 'debt-total' },
    { name: 'debt overview, failed', address: '/credit-health/debt-overview', ready: ERROR, failing: ['**/debt/overview*'] },
    ...['creditcard', 'loan', 'mortgage', 'currentaccount', 'telecomsandutilities', 'lineofcredit'].map((type): Target => ({ name: `account list: ${type}`, address: `${R}/accounts/${type}`, ready: 'list-summary' })),
    { name: 'account list, failed', address: `${R}/accounts/creditcard`, ready: ERROR, failing: ['**/reports/*/accounts*'] },
    { name: 'account list, empty', address: `${R}/accounts/creditcard`, ready: EMPTY, persona: 'thin-file' },
    { name: 'closed accounts', address: `${R}/closed-accounts`, ready: 'closed-title' },
    ...[
        ['credit card', 'acc_ddcc01'],
        ['loan', 'acc_ddln01'],
        ['mortgage', 'acc_ddmg01'],
        ['current account', 'acc_ddca01'],
        ['utilities and telecoms', 'acc_ddtu01'],
        ['credit account', 'acc_ddlc01'],
        ['closed card', 'acc_ddcl01'],
    ].map(([label, id]): Target => ({ name: `account detail: ${label}`, address: `${R}/account/${id}`, ready: 'detail-balance' })),
    { name: 'account detail, failed', address: `${R}/account/${card}`, ready: ERROR, failing: [`**/accounts/${card}`] },
    ...['interestRate', 'apr', 'promoPeriodMonths', 'minPayment', 'paymentMethod'].map((field): Target => ({ name: `edit form: ${field}`, address: editAddress(field), ready: 'dc-prompt' })),
    {
        name: 'edit form, with an error',
        address: editAddress('interestRate'),
        ready: 'dc-prompt',
        act: async (page) => {
            await page.getByTestId('dc-option-other').check();
            await page.getByTestId('dc-input').fill('120');
            await page.getByTestId('dc-save').click();
            await page.getByTestId('dc-error').waitFor();
        },
    },
    { name: 'profile', address: '/my-account/profile', ready: 'profile-legal-name' },
    { name: 'profile, failed', address: '/my-account/profile', ready: ERROR, failing: ['**/me/profile'] },
    { name: 'profile, name information open', address: '/my-account/profile', ready: 'profile-legal-name', act: async (page) => { await page.getByTestId('profile-name-info').click(); await page.getByTestId('profile-name-info-panel').waitFor(); } },
    { name: 'profile, preferred name refused', address: '/my-account/profile', ready: 'profile-legal-name', act: async (page) => { await page.getByTestId('profile-preferred-input').fill('R2D2'); await page.getByTestId('profile-preferred-save').click(); await page.getByTestId('profile-preferred-error').waitFor(); } },
    {
        name: 'profile, preferred name saved',
        address: '/my-account/profile',
        ready: 'profile-legal-name',
        act: async (page) => {
            await page.getByTestId('profile-preferred-input').fill('Sam');
            await page.getByTestId('profile-preferred-save').click();
            await page.locator('[data-testid="profile-preferred-status"]:has-text("Saved")').waitFor();
        },
    },
    { name: 'email', address: '/my-account/profile/email', ready: 'email-input' },
    { name: 'email, address refused', address: '/my-account/profile/email', ready: 'email-input', act: async (page) => { await page.getByTestId('email-input').fill('not an address'); await page.getByTestId('email-save').click(); await page.getByTestId('email-error').waitFor(); } },
    { name: 'email, link sent again', address: '/my-account/profile/email', ready: 'email-resend', persona: 'thin-file', act: async (page) => { await page.getByTestId('email-resend').click(); await page.getByTestId('email-resend-status').waitFor(); } },
    { name: 'mobile', address: '/my-account/profile/mobile', ready: 'mobile-input' },
    { name: 'mobile, number refused', address: '/my-account/profile/mobile', ready: 'mobile-input', act: async (page) => { await page.getByTestId('mobile-input').fill('12345'); await page.getByTestId('mobile-save').click(); await page.getByTestId('mobile-error').waitFor(); } },
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
    {
        name: 'mobile, wrong code',
        address: '/my-account/profile/mobile',
        ready: 'mobile-input',
        act: async (page) => {
            await page.getByTestId('mobile-input').fill('07700 900456');
            await page.getByTestId('mobile-save').click();
            await page.getByTestId('mobile-code-input').fill('000000');
            await page.getByTestId('mobile-code-submit').click();
            await page.getByTestId('mobile-code-error').waitFor();
        },
    },
    { name: 'the debug page', address: '/debug', ready: 'debug-key' },
    { name: 'a page not built yet: address', address: '/my-account/profile/address', ready: 'page-not-built' },
    { name: 'a page not built yet: employment', address: '/my-account/profile/employment', ready: 'page-not-built' },
    { name: 'a page not built yet: finances', address: '/my-account/profile/finances', ready: 'page-not-built' },
];

// CDS_EXIT_ONLY=text runs only the targets whose name holds the text, or the one target whose name it equals: for looking at one page
// while fixing it, and for the flag proof, which runs one target with a flag on (CDS-41). The standing run is whole. A filtered run
// leaves out the sign-in page and the expected-size assertion, which belong to the whole run.
const only = process.env.CDS_EXIT_ONLY;
const targets = only ? (allTargets.some((t) => t.name === only) ? allTargets.filter((t) => t.name === only) : allTargets.filter((t) => t.name.includes(only))) : allTargets;
// The bug flags the run switches on (HARNESS_BUGS, comma separated): none in the standing run.
const bugs = (process.env.HARNESS_BUGS ?? '').split(',').map((f) => f.trim()).filter(Boolean);
// A filter that matches nothing would end '0 problem(s)' with exit 0 (CDS-38 R2-C-15): it is an error.
if (targets.length === 0) {
    console.error(`exit checks: CDS_EXIT_ONLY='${only}' matches no target; the names are: ${allTargets.map((t) => t.name).join('; ')}`);
    process.exit(1);
}

async function control(path: string, method: string, body?: unknown) {
    const response = await fetch(`${api}${path}`, {
        method,
        headers: { 'x-test-control-key': key, ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status !== 204) throw new Error(`test control ${method} ${path} answered ${response.status}`);
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
        // The elements that reach past the right edge, widest reach first: what to fix when the page scrolls sideways.
        wide: [...document.querySelectorAll('body *')]
            .map((e) => ({ e, right: Math.round(e.getBoundingClientRect().right) }))
            .filter((x) => x.right > document.documentElement.clientWidth && !x.e.closest('.visually-hidden'))
            .sort((a, b) => b.right - a.right)
            .slice(0, 3)
            .map((x) => x.e.tagName.toLowerCase() + (x.e.getAttribute('data-testid') ? '[' + x.e.getAttribute('data-testid') + ']' : '') + (x.e.className ? '.' + String(x.e.className).split(' ')[0] : '') + ' to ' + x.right + 'px'),
    };
})()`;

/** A test id is a hook; anything else is a CSS selector. */
const readyLocator = (page: Page, ready: string) => (/^[a-z0-9-]+$/.test(ready) ? page.getByTestId(ready) : page.locator(ready).first());

let signedIn = new WeakSet<Page>();

/**
 * Brings the page to the target. The first visit in a page is a new visit: no session, so the app sends the visitor to sign-in
 * and back to the address (UI specification 6.1). The session lives in memory only, so later targets are reached by navigating
 * inside the app (history and popstate), which keeps it and is what a customer's click does.
 */
async function visit(page: Page, target: Target) {
    if (!signedIn.has(page)) {
        await page.goto(`${ui}${target.address}`);
        await page.getByTestId('login-submit').waitFor();
        await page.getByTestId('login-username').fill('alex');
        await page.getByTestId('login-password').fill('demo-only');
        await page.getByTestId('login-submit').click();
        signedIn.add(page);
    } else {
        // Source text, like the checks below: the harness's TypeScript has no DOM types. Via a page with nothing on it, so the
        // previous target's page is left (an open drawer, a half-filled form) and this one starts fresh, as a new visit would.
        const go = (address: string) => page.evaluate(`(() => { window.history.pushState({}, '', ${JSON.stringify(address)}); window.dispatchEvent(new PopStateEvent('popstate')); })()`);
        await go(NEUTRAL);
        await page.getByTestId('page-not-built').waitFor();
        await go(target.address);
    }
    await readyLocator(page, target.ready).waitFor();
    // Every data-bound section has settled: none is still loading.
    await page.waitForFunction(NOTHING_LOADING);
}

async function violationsOn(page: Page): Promise<string[]> {
    const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    return result.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`);
}

/** Puts the target in place (persona, failing calls), brings the page to it, applies its state, and removes what it set. */
async function arrange(page: Page, target: Target, work: () => Promise<void>) {
    await control('/__test/users/alex/persona', 'PUT', { persona: target.persona ?? 'drilldown' });
    for (const pattern of target.failing ?? []) {
        await page.route(pattern, (route) => route.fulfill({ status: 500, contentType: 'application/problem+json', body: JSON.stringify({ type: '/problems/internal', title: 'Server fault', status: 500 }) }));
    }
    try {
        await visit(page, target);
        if (target.act) await target.act(page);
        await work();
    } finally {
        for (const pattern of target.failing ?? []) await page.unroute(pattern);
    }
}

// Each layout is looked at with this machine's text and with the root text doubled (WCAG 1.4.4 asks for 200%): `rem` sizes follow the
// root element, not the body, so the headline figures and the spacing grow too. The result then does not depend on which fonts the
// machine has (a long email address scrolled the profile sideways at 375 px in CI, Linux fonts, but not on a Windows machine).
const TEXT = [
    { label: '', css: '' },
    { label: ', text doubled', css: 'html { font-size: 200% !important; }' },
] as const;

const LAYOUTS = [
    { width: 375, height: 812, nav: 'mobile' },
    { width: 768, height: 1024, nav: 'primary' },
    { width: 1280, height: 800, nav: 'primary' },
] as const;

const THEMES = ['light', 'dark'] as const;

const failures: string[] = [];
let scans = 0;
let layoutChecks = 0;
const fail = (where: string, problems: string[]) => failures.push(...problems.map((p) => `${where}: ${p}`));

/**
 * A browser context for the UI. A test build of the UI reads the bug flags once at start and needs the control key in browser storage
 * to do it (decision brief 13 D1), as the Cucumber hooks provide; without it no flag would ever reach the page (CDS-41).
 */
function uiContext(browser: Browser, options: Parameters<Browser['newContext']>[0]) {
    return browser.newContext({
        ...options,
        storageState: { cookies: [], origins: [{ origin: new URL(ui).origin, localStorage: [{ name: 'cds.testControlKey', value: key }] }] },
    });
}

async function axePass(browser: Browser, theme: (typeof THEMES)[number]) {
    const context = await uiContext(browser, { viewport: { width: 1280, height: 800 }, colorScheme: theme });
    const page = await context.newPage();
    signedIn = new WeakSet<Page>();
    const suffix = theme === 'dark' ? ', dark' : '';
    // The anonymous sign-in page first (the whole run only).
    if (!only) {
        await page.goto(`${ui}/login`);
        await page.getByTestId('login-submit').waitFor();
        const login = await violationsOn(page);
        scans++;
        fail(`sign-in${suffix}`, login);
        console.log(`  ${login.length === 0 ? 'pass' : 'FAIL'}  axe  sign-in${suffix}${login.length ? `: ${login.length} violation(s)` : ''}`);
        await page.getByTestId('login-username').fill('alex');
        await page.getByTestId('login-password').fill('wrong');
        await page.getByTestId('login-submit').click();
        await page.getByTestId('login-error').waitFor();
        const loginError = await violationsOn(page);
        scans++;
        fail(`sign-in, error shown${suffix}`, loginError);
        console.log(`  ${loginError.length === 0 ? 'pass' : 'FAIL'}  axe  sign-in, error shown${suffix}${loginError.length ? `: ${loginError.length} violation(s)` : ''}`);
    }

    for (const target of targets) {
        await arrange(page, target, async () => {
            const found = await violationsOn(page);
            scans++;
            fail(`${target.name}${suffix}`, found);
            console.log(`  ${found.length === 0 ? 'pass' : 'FAIL'}  axe  ${target.name}${suffix}${found.length ? `: ${found.length} violation(s)` : ''}`);
        });
    }
    await context.close();
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.HARNESS_BROWSER_PATH || undefined });
try {
    await control('/__test/reset', 'POST');
    // The flags this run asks for, set once; a page reads them when it starts (an empty list too, so a run with none relies on the reset alone no more).
    await control('/__test/bugs', 'PUT', { flags: bugs });

    // 1. axe-core on every page and every state, desktop width, flags off, in each theme (CDS-38 C-10).
    for (const theme of THEMES) await axePass(browser, theme);

    // 2. The three layouts: one navigation at a time, no sideways scroll, the demo banner shown, and axe at each width (normal text).
    for (const layout of LAYOUTS) {
        for (const text of TEXT) {
            const context = await uiContext(browser, { viewport: { width: layout.width, height: layout.height } });
            const page = await context.newPage();
            signedIn = new WeakSet<Page>();
            for (const target of targets.filter((t) => t.layouts ?? !t.act)) {
                await arrange(page, target, async () => {
                    if (text.css) await page.addStyleTag({ content: text.css });
                    const nav = (await page.evaluate(LAYOUT_FACTS)) as { primary: number; mobile: number; overflow: number; banner: boolean; wide: string[] };
                    const problems: string[] = [];
                    if (layout.nav === 'mobile' && !(nav.mobile === 3 && nav.primary === 0)) problems.push(`expected the bottom tab bar only, found ${nav.mobile} tab(s) and ${nav.primary} top link(s)`);
                    if (layout.nav === 'primary' && !(nav.primary === 3 && nav.mobile === 0)) problems.push(`expected the top navigation only, found ${nav.primary} link(s) and ${nav.mobile} tab(s)`);
                    if (nav.overflow > 0) problems.push(`the page scrolls sideways by ${nav.overflow}px (reaching: ${nav.wide.join(', ')})`);
                    if (!nav.banner) problems.push('the demo banner is missing');
                    // axe at each width with the text doubled as well as normal: a clipped or hidden control can show only at a larger size
                    // (CDS-38 R2-C-15).
                    problems.push(...(await violationsOn(page)));
                    layoutChecks++;
                    fail(`${layout.width}px${text.label}, ${target.name}`, problems);
                    console.log(`  ${problems.length === 0 ? 'pass' : 'FAIL'}  layout ${layout.width}px${text.label}  ${target.name}${problems.length ? `: ${problems.join('; ')}` : ''}`);
                });
            }
            await context.close();
        }
    }
    // 3. The sign-in page at the three widths, normal and doubled text: it is not a target (it needs no session), and it is the first page
    //    every customer sees (CDS-38 R2-C-15).
    for (const layout of only ? [] : LAYOUTS) {
        for (const text of TEXT) {
            const context = await uiContext(browser, { viewport: { width: layout.width, height: layout.height } });
            const page = await context.newPage();
            await page.goto(`${ui}/login`);
            await page.getByTestId('login-submit').waitFor();
            if (text.css) await page.addStyleTag({ content: text.css });
            const nav = (await page.evaluate(LAYOUT_FACTS)) as { overflow: number; banner: boolean; wide: string[] };
            const problems: string[] = [];
            if (nav.overflow > 0) problems.push(`the page scrolls sideways by ${nav.overflow}px (reaching: ${nav.wide.join(', ')})`);
            if (!nav.banner) problems.push('the demo banner is missing');
            problems.push(...(await violationsOn(page)));
            layoutChecks++;
            fail(`${layout.width}px${text.label}, sign-in`, problems);
            console.log(`  ${problems.length === 0 ? 'pass' : 'FAIL'}  layout ${layout.width}px${text.label}  sign-in${problems.length ? `: ${problems.join('; ')}` : ''}`);
            await context.close();
        }
    }
    await control('/__test/users/alex/persona', 'PUT', { persona: 'drilldown' });
} finally {
    await control('/__test/bugs', 'PUT', { flags: [] }).catch(() => undefined);
    await browser.close();
}

console.log(`\nexit checks: ${scans} axe scans and ${layoutChecks} layout checks; ${failures.length} problem(s)`);
// The whole run has a known size (CDS-38 R2-C-15): a target or a width that silently dropped out would otherwise still end at '0 problem(s)'.
// Adding a page or a state to the targets changes these numbers; change them with it, in the same pull request.
const EXPECTED = { scans: 124, layoutChecks: 288 };
if (!only && (scans !== EXPECTED.scans || layoutChecks !== EXPECTED.layoutChecks)) {
    failures.push(`expected ${EXPECTED.scans} axe scans and ${EXPECTED.layoutChecks} layout checks, ran ${scans} and ${layoutChecks}`);
}
if (failures.length > 0) {
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
}
