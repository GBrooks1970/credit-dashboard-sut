// version: 1 | created: 2026-10-20T13:35Z | project: credit-dashboard-sut | type: tool | language: en-GB
// What the published site must satisfy before it is deployed (CDS-44, P6c; DR-060 as amended by DR-066): the Kanban board at the top with its ticket
// payload (a board that renders no cards has shipped before elsewhere in this portfolio), the Serenity report under report/ with a stamp that names
// the commit it was built from, nothing else in the folder, and no control key or token in any file. A pure module, so the ways the check could be
// fooled are unit tests (site.test.ts); scripts/check-site.ts reads the folder.
import { secretProblems } from './checks.js';

export interface SiteFile {
    /** The path inside the site folder, with forward slashes. */
    path: string;
    text: string;
}

export interface SiteOptions {
    /** The commit the site is built from (the stamp must say so). */
    sha: string;
    /** Strings that must not appear in any file: the run's control key. */
    forbidden: string[];
}

export function siteProblems(files: SiteFile[], options: SiteOptions): string[] {
    const problems: string[] = [];
    const find = (path: string) => files.find((f) => f.path === path);

    const board = find('index.html');
    if (!board) problems.push('index.html (the board) is missing');
    else {
        if (!board.text.includes('id="payload-tickets"')) problems.push('the board has no ticket payload');
        // Tickets from both ends of the backlog, as pages.yml checked: an empty or a truncated payload fails here.
        for (const ticket of ['CDS-01', 'CDS-28']) {
            if (!board.text.includes(`"id":"${ticket}"`)) problems.push(`the board's payload does not hold ${ticket}`);
        }
    }

    const index = find('report/index.html');
    if (!index) problems.push('report/index.html is missing');
    else if (index.text.length < 2000) problems.push('report/index.html is too small to be a report');

    const stamp = find('report/commit.txt');
    if (!stamp) problems.push('report/commit.txt (the commit stamp) is missing');
    else if (!stamp.text.includes(`commit: ${options.sha}`)) problems.push(`report/commit.txt does not name the commit ${options.sha}`);

    // The site is the board and the report: a specification, a service file or a note that slipped into the folder is not published.
    for (const file of files) {
        if (file.path !== 'index.html' && !file.path.startsWith('report/')) problems.push(`${file.path} is in the site but is neither the board nor the report`);
    }

    problems.push(...secretProblems(files.map((f) => ({ name: f.path, text: f.text })), options.forbidden));
    return problems;
}
