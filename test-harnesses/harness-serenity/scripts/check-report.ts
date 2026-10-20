// version: 1 | created: 2026-10-20T09:30Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Checks the Serenity report before it is published (CDS-44, P6a): the JSON of both suites with src/report/checks.ts (every execution present
// and successful, the counts, no control key or token), and the HTML: where Java is available, or in CI, reports/serenity-report/index.html
// must exist and be more than a stub, and no file of the report may hold the control key or a token. Run from test-harnesses/harness-serenity
// after `npm run report`.
import fs from 'node:fs';
import path from 'node:path';

import { reportProblems, secretProblems, type Recorded } from '../src/report/checks.js';

/** The executions each suite runs (60 `@api`, 59 `@ui`). Change them with the scenarios, in the same pull request. */
const EXPECTED = { api: 60, ui: 59 };
/** The synthetic key scripts/run.mjs gives the service of a run. HARNESS_CONTROL_KEY overrides it where a run used another. */
const CONTROL_KEY = process.env.HARNESS_CONTROL_KEY || 'harness-run-key';

const harness = path.resolve(import.meta.dirname, '..');
const read = (profile: string): Recorded[] => {
    const folder = path.join(harness, 'reports', 'serenity', profile);
    if (!fs.existsSync(folder)) return [];
    return fs.readdirSync(folder).filter((f) => f.endsWith('.json')).map((name) => ({ name: `${profile}/${name}`, text: fs.readFileSync(path.join(folder, name), 'utf8') }));
};

const problems = reportProblems({ api: read('api'), ui: read('ui'), expected: EXPECTED, forbidden: [CONTROL_KEY] });

const htmlRequired = process.env.CI === 'true' || (await javaAvailable());
const report = path.join(harness, 'reports', 'serenity-report');
if (htmlRequired) {
    const index = path.join(report, 'index.html');
    if (!fs.existsSync(index)) problems.push('reports/serenity-report/index.html is missing: run npm run report (it needs Java)');
    else if (fs.statSync(index).size < 2000) problems.push('reports/serenity-report/index.html is too small to be a report');
    // The text files of the report.
    const html: Recorded[] = [];
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.(html|json|js|css|txt|csv|xml)$/i.test(entry.name) && fs.statSync(full).size < 20_000_000) html.push({ name: path.relative(harness, full), text: fs.readFileSync(full, 'utf8') });
        }
    };
    if (fs.existsSync(report)) walk(report);
    // Every file of the report gets the same look for the key and for token shapes as the JSON.
    problems.push(...secretProblems(html, [CONTROL_KEY]));
    console.log(`check-report: the HTML report was looked at (${html.length} files)`);
} else {
    console.log('check-report: Java not found and not in CI, so the HTML report is not required here; the JSON was checked');
}

async function javaAvailable() {
    const { execSync } = await import('node:child_process');
    try {
        execSync('java -version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

if (problems.length > 0) {
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(`check-report: ${problems.length} problem(s)`);
    process.exit(1);
}
console.log(`check-report: ${EXPECTED.api} @api and ${EXPECTED.ui} @ui executions, all successful, no key or token`);
