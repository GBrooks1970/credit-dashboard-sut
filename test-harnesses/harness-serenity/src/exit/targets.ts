// version: 1 | created: 2026-10-19T09:30Z | project: credit-dashboard-sut | type: tool | language: en-GB
// What the exit checks (exit-checks.ts) and the visual checks (src/visual/) share (CDS-43): the pages and states of the UI as targets, the
// browser context that carries the control key, and the way a target is reached (sign in once, then move by in-app navigation) and arranged
// (persona, failing calls, the state to show). Moved out of exit-checks.ts unchanged, so a page added to the list is looked at by both.
import type { Browser, Page } from 'playwright';

export const ui = process.env.HARNESS_UI_URL ?? '';
export const api = process.env.HARNESS_BASE_URL ?? '';
export const key = process.env.HARNESS_CONTROL_KEY ?? '';

export interface Target {
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
export const NEUTRAL = '/my-account/profile/address';
const ERROR = '[data-testid$="-error"]';
const EMPTY = '[data-testid$="-empty"]';
const editAddress = (field: string) => `/data-capture/${field}?accountId=${card}&redirectUrl=${encodeURIComponent(`${R}/account/${card}`)}`;

export const allTargets: Target[] = [
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


export async function control(path: string, method: string, body?: unknown) {
    const response = await fetch(`${api}${path}`, {
        method,
        headers: { 'x-test-control-key': key, ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status !== 204) throw new Error(`test control ${method} ${path} answered ${response.status}`);
}

// These run in the browser. The harness's TypeScript has no DOM types, so they are source text, not functions.
export const NOTHING_LOADING = "!document.querySelector('[data-testid$=\"-loading\"]')";

/** A test id is a hook; anything else is a CSS selector. */
export const readyLocator = (page: Page, ready: string) => (/^[a-z0-9-]+$/.test(ready) ? page.getByTestId(ready) : page.locator(ready).first());

let signedIn = new WeakSet<Page>();

/**
 * Brings the page to the target. The first visit in a page is a new visit: no session, so the app sends the visitor to sign-in
 * and back to the address (UI specification 6.1). The session lives in memory only, so later targets are reached by navigating
 * inside the app (history and popstate), which keeps it and is what a customer's click does.
 */
export async function visit(page: Page, target: Target) {
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

/** Puts the target in place (persona, failing calls), brings the page to it, applies its state, and removes what it set. */
export async function arrange(page: Page, target: Target, work: () => Promise<void>) {
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

/**
 * A browser context for the UI. A test build of the UI reads the bug flags once at start and needs the control key in browser storage
 * to do it (decision brief 13 D1), as the Cucumber hooks provide; without it no flag would ever reach the page (CDS-41).
 */
export function uiContext(browser: Browser, options: Parameters<Browser['newContext']>[0]) {
    return browser.newContext({
        ...options,
        storageState: { cookies: [], origins: [{ origin: new URL(ui).origin, localStorage: [{ name: 'cds.testControlKey', value: key }] }] },
    });
}

/** A new browser page has no session: the next visit signs in. Called when a page is opened. */
export function newSession() {
    signedIn = new WeakSet<Page>();
}
