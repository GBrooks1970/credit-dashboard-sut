// version: 3 | created: 2026-10-18T16:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The semantic rules of the exit run (CDS-41, P3b; UI specification section 9). axe-core checks what its rules know; these check what
// this application promises and axe has no rule for: a bar's value is the figure beside it, its name is not a placeholder or another
// figure, a chart's table alternative has its values, a button has no `href`, a decorative image has an empty `alt`, and a form control
// follows the text size. Each rule has a name, and every problem it reports starts with that name and quotes the element's test id,
// so the flag proof can tell which rule failed (`failsWith` in fixtures/bug-flags.json).
//
// The rules run in the browser. The harness's TypeScript has no DOM types, so they are source text, not functions; `semanticProblems`
// in exit-checks.ts evaluates them on a page and returns the problems.

/** Names of the rules, in the order they run. */
export const RULES = [
    'progress-value-matches-text',
    'progress-name-matches-value',
    'no-placeholder-names',
    'chart-table-has-values',
    'no-button-with-href',
    'decorative-image-empty-alt',
    'form-controls-follow-text-size',
] as const;

export const SEMANTIC_RULES = `(() => {
    const problems = [];
    const id = (el) => el.getAttribute('data-testid') || el.id || el.tagName.toLowerCase();
    const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const say = (rule, el, detail) => problems.push(rule + ": '" + id(el) + "' " + detail);

    // The score gauge is a progressbar with no percentage beside it; every other bar sits after a paragraph that writes its figure.
    const bars = [...document.querySelectorAll('[role="progressbar"]')].filter((el) => visible(el) && !/^score-/.test(id(el)));

    // progress-value-matches-text: the bar's value is the figure written beside it.
    for (const bar of bars) {
        const written = bar.previousElementSibling ? /(-?\\d+)%/.exec(bar.previousElementSibling.textContent || '') : null;
        if (!written) { say('progress-value-matches-text', bar, 'has no percentage written beside it'); continue; }
        const now = Number(bar.getAttribute('aria-valuenow'));
        if (now !== Number(written[1])) say('progress-value-matches-text', bar, 'has aria-valuenow ' + now + ' but the text beside it says ' + written[1] + '%');
        // The fill is drawn as wide as the value says (a fill stops at full above 100): a bar can announce the right figure and draw another (CDS-48 A-05).
        const fill = bar.firstElementChild;
        // The track is measured inside its border: a fill that fills the track is drawn full, whatever the border (CDS-48 C-05).
        const track = bar.clientWidth;
        if (fill && track > 0) {
            const drawn = Math.round((fill.getBoundingClientRect().width / track) * 100);
            if (Math.abs(drawn - Math.min(now, 100)) > 1) say('progress-value-matches-text', bar, 'is drawn ' + drawn + '% wide but its value is ' + now + (now > 100 ? ' (a fill stops at full)' : ''));
        }
    }

    // progress-name-matches-value: a name that holds a percentage holds the bar's own value among them, not only another number (a count of pence taken for a
    // percentage). Money and other figures in a fuller name are fine (CDS-48 A-06).
    for (const bar of bars) {
        const name = bar.getAttribute('aria-label') || '';
        const now = Number(bar.getAttribute('aria-valuenow'));
        const figures = (name.match(/(\\d+(?:\\.\\d+)?)%/g) || []).map((figure) => Number(figure.slice(0, -1)));
        // A fuller name may also state a limit ("best kept under 30%"): it is wrong only when none of its percentages is the bar's own value (CDS-48 C-05).
        if (figures.length > 0 && !figures.includes(now)) say('progress-name-matches-value', bar, "is named '" + name + "' but its value is " + now);
    }

    // no-placeholder-names: no accessible name is a stand-in left in the code.
    const placeholder = /^\\s*(accessible label|label|aria[- ]label|todo|tbd|placeholder|lorem ipsum|undefined|null)\\s*$/i;
    for (const el of document.querySelectorAll('[aria-label]')) {
        if (placeholder.test(el.getAttribute('aria-label') || '')) say('no-placeholder-names', el, "is named '" + el.getAttribute('aria-label') + "'");
    }

    // chart-table-has-values: a chart's table alternative gives a value for every row. The value is the last cell of the row (a month may be in a cell of its
    // own, CDS-48 C-05). A figure (a score, an amount) or the documented 'No score' is a value: an empty cell is one problem and 'n/a' or a dash is another,
    // so a flag that empties the cells can name the first (CDS-48 A-05, C-04).
    for (const table of document.querySelectorAll('table[data-testid$="-chart-table"]')) {
        const texts = [...table.querySelectorAll('tbody tr')].map((row) => {
            const cells = row.querySelectorAll('td, th');
            return cells.length === 0 ? '' : (cells[cells.length - 1].textContent || '').trim();
        });
        const empty = texts.filter((text) => text === '');
        const noFigure = texts.filter((text) => text !== '' && !(/\\d/.test(text) || text === 'No score'));
        if (empty.length > 0) say('chart-table-has-values', table, 'has ' + empty.length + ' of its rows with an empty value cell');
        if (noFigure.length > 0) say('chart-table-has-values', table, 'has ' + noFigure.length + ' of its rows whose value cell holds no figure');
    }

    // no-button-with-href: a link is a link and a button is a button.
    for (const el of document.querySelectorAll('button[href], [role="button"][href]')) say('no-button-with-href', el, 'is a button with an href');

    // decorative-image-empty-alt: an image the page marks decorative has an empty alt.
    for (const img of document.querySelectorAll('img[data-decorative]')) {
        const alt = img.getAttribute('alt');
        if (alt !== '') say('decorative-image-empty-alt', img, "is decorative but has alt '" + alt + "'");
    }

    // form-controls-follow-text-size: a control has the font size of the text around it (a browser's own control font ignores a root of 200%).
    for (const el of document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea')) {
        if (!visible(el) || !el.parentElement) continue;
        const own = parseFloat(getComputedStyle(el).fontSize);
        const around = parseFloat(getComputedStyle(el.parentElement).fontSize);
        if (Math.abs(own - around) > 0.5) say('form-controls-follow-text-size', el, 'has font size ' + own + 'px among text of ' + around + 'px');
    }
    return problems;
})()`;
