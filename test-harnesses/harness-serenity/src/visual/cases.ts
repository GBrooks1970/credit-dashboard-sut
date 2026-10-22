// version: 2 | created: 2026-10-19T09:45Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The visual checks' cases (CDS-43, plan decisions D1 and D2): which pages are photographed, at which widths and in which theme, and the
// one rule about the baseline folder. A pure module, so the ways the check could be fooled are unit tests (cases.test.ts).

/** The eight pages (names of exit-check targets, targets.ts): one of each kind of page, settled, no error, flags off, persona drilldown. */
export const PAGES = ['overview', 'payment history', 'report changes', 'hard searches', 'personal details', 'account list: creditcard', 'account detail: credit card', 'profile'] as const;
export const WIDTHS = [375, 1280] as const;
export const THEMES = ['light', 'dark'] as const;

export interface VisualCase {
    page: (typeof PAGES)[number];
    /** The exit-check target the case arranges (its name): the page itself, as served. */
    target: string;
    /** 'page': the whole page, with the fixed tab bar hidden so it is not repeated down a long page. 'tab-bar': the bar alone (CDS-48 B-04). */
    shot: 'page' | 'tab-bar';
    width: (typeof WIDTHS)[number];
    theme: (typeof THEMES)[number];
    /** The baseline's file name, which is also the name the screenshot is compared under. */
    file: string;
}

const slug = (name: string) => name.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function visualCases(): VisualCase[] {
    const pages: VisualCase[] = PAGES.flatMap((page) =>
        WIDTHS.flatMap((width) => THEMES.map((theme) => ({ page, target: page, shot: 'page' as const, width, theme, file: `${slug(page)}-${width}-${theme}.png` }))),
    );
    // The tab bar is fixed to the bottom of the screen at 375 px, so a whole-page photograph shows it once, wherever the capture puts it, and
    // nothing says it is right: it is photographed on its own, once in each theme, on the overview.
    const bars: VisualCase[] = THEMES.map((theme) => ({ page: 'overview', target: 'overview', shot: 'tab-bar' as const, width: 375, theme, file: `tab-bar-375-${theme}.png` }));
    return [...pages, ...bars];
}

/**
 * The baseline folder must hold exactly the images the cases compare: a missing one is a case that has nothing to be compared with, and an extra
 * one is a page that was dropped or renamed and is no longer looked at while it still looks like cover.
 */
export function baselineProblems(files: string[]): string[] {
    const expected = new Set(visualCases().map((c) => c.file));
    const present = new Set(files);
    return [
        ...[...expected].filter((f) => !present.has(f)).map((f) => `missing baseline ${f}`),
        ...[...present].filter((f) => !expected.has(f)).map((f) => `unexpected file in the baseline folder: ${f}`),
    ];
}
