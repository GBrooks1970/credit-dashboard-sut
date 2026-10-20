// version: 1 | created: 2026-10-20T09:30Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Makes the Serenity BDD HTML report from the Serenity JSON the two suites wrote (CDS-44, P6a): reports/serenity/api and reports/serenity/ui are
// gathered into reports/serenity/all, and the Serenity BDD CLI, a Java tool, writes the report to reports/serenity-report. Where Java is not
// installed (a developer's machine) this says so and does nothing, and check:report still checks the JSON; in CI Java 21 is installed and
// check:report requires the HTML. Run from test-harnesses/harness-serenity after `npm run test:api` and `npm run test:ui`.
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const harness = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(harness, 'reports', 'serenity', 'all');
const destination = path.join(harness, 'reports', 'serenity-report');

// The default CLI of @serenity-js/serenity-bdd writes a stale jquery-ui path into the report; 4.3.4 is the first stable CLI after the upstream fix.
// It is named here so the rendering cannot drift without a reviewed change (as in parabank-bank-automation).
const serenityCliArtifact = 'net.serenity-bdd:serenity-cli:jar:4.3.4';

function javaAvailable() {
    try {
        execSync('java -version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// The two profiles' JSON in one folder. A file name that both profiles wrote would overwrite one of them: that is an error, not a merge.
fs.rmSync(source, { recursive: true, force: true });
fs.mkdirSync(source, { recursive: true });
let copied = 0;
for (const profile of ['api', 'ui']) {
    const folder = path.join(harness, 'reports', 'serenity', profile);
    if (!fs.existsSync(folder)) {
        console.error(`report: ${path.relative(harness, folder)} does not exist: run npm run test:${profile} first`);
        process.exit(1);
    }
    for (const name of fs.readdirSync(folder).filter((f) => f.endsWith('.json'))) {
        const target = path.join(source, name);
        if (fs.existsSync(target)) {
            console.error(`report: both profiles wrote ${name}`);
            process.exit(1);
        }
        fs.copyFileSync(path.join(folder, name), target);
        copied++;
    }
}
console.log(`report: ${copied} Serenity JSON files gathered in reports/serenity/all`);

if (!javaAvailable()) {
    console.log('report: Java not found, so the HTML report is not made here (CI makes it; check:report still checks the JSON).');
    process.exit(0);
}

fs.rmSync(destination, { recursive: true, force: true });
// `update` downloads the CLI jar on demand and makes that explicit and cacheable; `run` writes the report.
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
execFileSync(npx, ['serenity-bdd', 'update', '--artifact', serenityCliArtifact], { cwd: harness, stdio: 'inherit', shell: process.platform === 'win32' });
execFileSync(npx, ['serenity-bdd', 'run', '--artifact', serenityCliArtifact, '--source', source, '--destination', destination], { cwd: harness, stdio: 'inherit', shell: process.platform === 'win32' });
console.log('report: the Serenity HTML report is in reports/serenity-report/index.html');
