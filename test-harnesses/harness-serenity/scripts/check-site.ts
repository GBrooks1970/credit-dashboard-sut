// version: 2 | created: 2026-10-20T13:35Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Checks the assembled Pages folder before it is deployed (CDS-44, P6c): `node --import tsx scripts/check-site.ts <folder> <commit>`. The rules
// are src/report/site.ts. Exits 1 and lists the problems when there are any.
import fs from 'node:fs';
import path from 'node:path';

import { isBinary, MAX_TEXT_BYTES } from '../src/report/files.js';
import { siteProblems, type SiteFile } from '../src/report/site.js';

const [folder, sha] = process.argv.slice(2);
if (!folder || !sha) {
    console.error('usage: check-site.ts <folder> <commit>');
    process.exit(2);
}
const CONTROL_KEY = process.env.HARNESS_CONTROL_KEY || 'harness-run-key';

const files: SiteFile[] = [];
const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const relative = path.relative(folder, full).split(path.sep).join('/');
        if (entry.isDirectory()) walk(full);
        // Every file but a known image or font is read as text (CDS-48 B-06); one too large to read is a problem. An image or a font is listed with
        // no text: it is checked for being in the site, not for what it holds.
        else if (isBinary(entry.name)) files.push({ path: relative, text: '' });
        else if (fs.statSync(full).size >= MAX_TEXT_BYTES) files.push({ path: relative, text: '', tooLarge: true });
        else files.push({ path: relative, text: fs.readFileSync(full, 'utf8') });
    }
};
walk(folder);

const problems = siteProblems(files, { sha, forbidden: [CONTROL_KEY] });
if (problems.length > 0) {
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(`check-site: ${problems.length} problem(s)`);
    process.exit(1);
}
console.log(`check-site: ${files.length} files, the board, the report stamped ${sha.slice(0, 7)}, nothing else, no key or token`);
