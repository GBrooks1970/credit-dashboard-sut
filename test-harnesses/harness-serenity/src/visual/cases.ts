// version: 1 | created: 2026-10-19T09:45Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The visual checks' cases (CDS-43, plan decisions D1 and D2): which pages are photographed, at which widths and in which theme, and the
// one rule about the baseline folder. A pure module, so the ways the check could be fooled are unit tests (cases.test.ts).

/** The eight pages (names of exit-check targets, targets.ts): one of each kind of page, settled, no error, flags off, persona drilldown. */
export const PAGES = ['overview', 'payment history', 'report changes', 'hard searches', 'personal details', 'account list: creditcard', 'account detail: credit card', 'profile'] as const;
export const WIDTHS = [375, 1280] as const;
export const THEMES = ['light', 'dark'] as const;

export interface VisualCase {
    page: (typeof PAGES)[number];
    width: (typeof WIDTHS)[number];
    theme: (typeof THEMES)[number];
    /** The baseline's file name, which is also the name the screenshot is compared under. */
    file: string;
}

const slug = (name: string) => name.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function visualCases(): VisualCase[] {
    return PAGES.flatMap((page) => WIDTHS.flatMap((width) => THEMES.map((theme) => ({ page, width, theme, file: `${slug(page)}-${width}-${theme}.png` }))));
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
