// version: 5 | created: 2026-10-16T16:30Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The Phase 4 exit checks (CDS-36; widened in CDS-38 F10): an axe-core scan of every page of the UI and of every state that shows
// something new (an open dialog, a section error with its Retry, an empty list, a form error), in the light and in the dark theme,
// with the bug flags off (the flag proof switches one on through HARNESS_BUGS, CDS-41), which must return zero violations (UI specification 4.5 and 9); and the three layouts (375, 768 and
// 1280 px; specification 4.4) for every page, each with the text size of this machine and with the root text doubled.
// Run by `node scripts/run.mjs exit`, against the live service serving the built UI. Not a Gherkin scenario: the @ui scenarios
// are the behaviour, these are the standing checks on every page.
import { AxeBuilder } from '@axe-core/playwright';
import { chromium, type Browser, type Page } from 'playwright';

import { SEMANTIC_RULES } from './semantic-rules.js';
import { allTargets, arrange, control, newSession, ui, uiContext } from './targets.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

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

// This runs in the browser. The harness's TypeScript has no DOM types, so it is source text, not a function.
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

/** What axe-core finds, then what the semantic rules find (semantic-rules.ts, CDS-41): both are problems of the page. */
async function violationsOn(page: Page): Promise<string[]> {
    const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const axe = result.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`);
    return [...axe, ...((await page.evaluate(SEMANTIC_RULES)) as string[])];
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

async function axePass(browser: Browser, theme: (typeof THEMES)[number]) {
    const context = await uiContext(browser, { viewport: { width: 1280, height: 800 }, colorScheme: theme });
    const page = await context.newPage();
    newSession();
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
            newSession();
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
