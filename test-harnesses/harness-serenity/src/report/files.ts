// version: 2 | created: 2026-10-23T09:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Which files the secret scans read, and which kinds of file the published report may hold (CDS-48 B-06, C-06). The scans used to read a list of
// extensions and pass any other file unread; now every file is read, whatever its name: as text, or, when its first bytes say it is an image or a
// font, as bytes (the control key is searched for in them too), and a text file too large to read is a problem, not a pass. A file named like an image
// or a font whose bytes are not one is a problem of its own. The site's report folder is an allow-list: the kinds of file the Serenity report is made of.

/** The names of images and fonts: a file with such a name must be one (its first bytes say so). */
const BINARY = /\.(png|jpe?g|gif|ico|webp|woff2?|ttf|eot)$/i;
/** What a Serenity report holds (listed from a real one: html, css, js, json, images, fonts, source maps, a stamp, a few resources). */
const REPORT_KINDS = /\.(html|css|js|mjs|json|png|svg|jpe?g|gif|ico|woff2?|ttf|eot|txt|xml|map|scss|properties)$/i;

/** The one file of the report with no extension: an empty marker the Serenity CLI writes (found in a real report). */
const MARKER = 'report/serenity-resources';

/** The largest text file the scans will read; a bigger one is reported, because a file that is not read is a file that is not checked. */
export const MAX_TEXT_BYTES = 20_000_000;

/** Whether a file's name says it is an image or a font. */
export const isBinary = (path: string): boolean => BINARY.test(path);

/** What the first bytes of a file say it is, or null for anything else (text, or a kind of file this does not know). */
export function binaryKind(head: Buffer): string | null {
    const starts = (...values: number[]) => values.every((value, i) => head[i] === value);
    const ascii = (text: string) => head.length >= text.length && head.subarray(0, text.length).toString('latin1') === text;
    if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'png';
    if (starts(0xff, 0xd8, 0xff)) return 'jpeg';
    if (ascii('GIF8')) return 'gif';
    if (starts(0x00, 0x00, 0x01, 0x00)) return 'ico';
    if (ascii('wOFF')) return 'woff';
    if (ascii('wOF2')) return 'woff2';
    if (starts(0x00, 0x01, 0x00, 0x00) || ascii('true')) return 'truetype';
    if (ascii('OTTO')) return 'opentype';
    if (head.length > 35 && head[34] === 0x4c && head[35] === 0x50) return 'eot';
    return null;
}

/**
 * The text a file is searched in for the control key and tokens, and a problem when its name and its bytes disagree. An image or a font is read as
 * bytes (latin1, so an ASCII key in it is found, and UTF-16, so a wide one is); every other file as UTF-8, and as UTF-16 too when it holds NUL bytes.
 */
export function scanTextOf(path: string, content: Buffer): { text: string; problem?: string } {
    const kind = binaryKind(content.subarray(0, 64));
    if (kind) return { text: `${content.toString('latin1')}\n${content.toString('utf16le')}` };
    const text = content.includes(0) ? `${content.toString('utf8')}\n${content.toString('utf16le')}` : content.toString('utf8');
    return isBinary(path) && content.length > 0 ? { text, problem: `${path} is named like an image or a font but is not one` } : { text };
}

/** Null when the file may be in the report folder (or is not under it); otherwise what is wrong with it. */
export function reportFileProblem(path: string): string | null {
    if (!path.startsWith('report/')) return null;
    if (path.split('/').some((segment) => segment.startsWith('.'))) return `${path} is in the report folder but is hidden`;
    if (path === MARKER) return null;
    if (!REPORT_KINDS.test(path)) return `${path} is in the report folder but is not a kind of file the report holds`;
    return null;
}
