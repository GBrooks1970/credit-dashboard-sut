// version: 3 | created: 2026-10-20T13:35Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Checks the assembled Pages folder before it is deployed (CDS-44, P6c): `node --import tsx scripts/check-site.ts <folder> <commit>`. The rules
// are src/report/site.ts. Exits 1 and lists the problems when there are any.
import fs from 'node:fs';
import path from 'node:path';

import { MAX_TEXT_BYTES, scanTextOf } from '../src/report/files.js';
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
        // Every file is read, whatever its name (CDS-48 B-06, C-06): an image or a font by its bytes, anything else as text; one too large to read is a
        // problem, and so is a name that says image or font on bytes that are not one.
        else if (fs.statSync(full).size >= MAX_TEXT_BYTES) files.push({ path: relative, text: '', tooLarge: true });
        else files.push({ path: relative, ...scanTextOf(relative, fs.readFileSync(full)) });
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
