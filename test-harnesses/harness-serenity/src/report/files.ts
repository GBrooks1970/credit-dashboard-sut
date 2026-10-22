// version: 1 | created: 2026-10-23T09:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Which files the secret scans read, and which kinds of file the published report may hold (CDS-48 B-06). The scans used to read a list of
// extensions and pass any other file unread; now every file is read as text except a known image or font, and a text file too large to read
// is a problem, not a pass. The site's report folder is an allow-list: the kinds of file the Serenity report is made of.

/** Images and fonts: their bytes are not text, and the control key or a token is not in them as one. */
const BINARY = /\.(png|jpe?g|gif|ico|webp|woff2?|ttf|eot)$/i;
/** What a Serenity report holds (listed from a real one: html, css, js, json, images, fonts, source maps, a stamp, a few resources). */
const REPORT_KINDS = /\.(html|css|js|mjs|json|png|svg|jpe?g|gif|ico|woff2?|ttf|eot|txt|xml|map|scss|properties)$/i;

/** The one file of the report with no extension: an empty marker the Serenity CLI writes (found in a real report). */
const MARKER = 'report/serenity-resources';

/** The largest text file the scans will read; a bigger one is reported, because a file that is not read is a file that is not checked. */
export const MAX_TEXT_BYTES = 20_000_000;

export const isBinary = (path: string): boolean => BINARY.test(path);

/** Null when the file may be in the report folder (or is not under it); otherwise what is wrong with it. */
export function reportFileProblem(path: string): string | null {
    if (!path.startsWith('report/')) return null;
    if (path.split('/').some((segment) => segment.startsWith('.'))) return `${path} is in the report folder but is hidden`;
    if (path === MARKER) return null;
    if (!REPORT_KINDS.test(path)) return `${path} is in the report folder but is not a kind of file the report holds`;
    return null;
}
