// version: 2 | created: 2026-10-20T13:35Z | project: credit-dashboard-sut | type: tool | language: en-GB
// What the published site must satisfy before it is deployed (CDS-44, P6c; DR-060 as amended by DR-066): the Kanban board at the top with its ticket
// payload (a board that renders no cards has shipped before elsewhere in this portfolio), the Serenity report under report/ with a stamp that names
// the commit it was built from, nothing else in the folder, and no control key or token in any file the scan can read (every file but a known image
// or font; one too large to read is a problem). Under report/ only the kinds of file a Serenity report is made of are accepted (CDS-48 B-06). A pure
// module, so the ways the check could be fooled are unit tests (site.test.ts); scripts/check-site.ts reads the folder.
import { secretProblems } from './checks.js';
import { reportFileProblem } from './files.js';

export interface SiteFile {
    /** The path inside the site folder, with forward slashes. */
    path: string;
    text: string;
    /** True when the file is text but too large to be read. */
    tooLarge?: boolean;
    /** A problem the reader found with the file itself (its name and its bytes disagree). */
    problem?: string;
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

    // The stamp names the whole commit on a line of its own: a prefix of the commit, or the commit inside other text, is not the commit (CDS-48 N-3).
    if (!/^[0-9a-f]{40}$/.test(options.sha)) problems.push(`the commit given (${options.sha}) is not a full 40-character commit hash`);
    const stamp = find('report/commit.txt');
    if (!stamp) problems.push('report/commit.txt (the commit stamp) is missing');
    else if (!stamp.text.split(/\r?\n/).includes(`commit: ${options.sha}`)) problems.push(`report/commit.txt does not name the commit ${options.sha}`);

    // The site is the board and the report: a specification, a service file or a note that slipped into the folder is not published.
    for (const file of files) {
        if (file.path !== 'index.html' && !file.path.startsWith('report/')) problems.push(`${file.path} is in the site but is neither the board nor the report`);
        else {
            const kind = reportFileProblem(file.path);
            if (kind) problems.push(kind);
        }
    }

    problems.push(...secretProblems(files.map((f) => ({ name: f.path, text: f.text, tooLarge: f.tooLarge, problem: f.problem })), options.forbidden));
    return problems;
}
