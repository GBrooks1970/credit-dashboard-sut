// version: 5 | created: 2026-10-14T10:30Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The bug-flag proof (CDS-39, decision brief 13, DR-064). For every flag that fixtures/bug-flags.json marks implemented, run each
// of its committed catchers twice: with the flag OFF it must pass, and with the flag ON it must fail, and the failure must
// contain the text the registry records for it (`failsWith`). A flag is "caught" when at least one catcher fails for the stated
// reason with it on and none fails with it off. Anything else is named: not caught, caught for another reason, or a false alarm.
// Run by `node scripts/run.mjs flags [flag ...]` against the live service; writes reports/bug-flags.json and reports/bug-flags.md.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import http from 'node:http';

import { resetWithRetry } from './reset.js';
import { exitCheckRan, judgeOff, judgeOn, matchedLine, verdictOf, visualTitlePattern, vitestExecuted, type Outcome, type RunResult, type Verdict } from './verdict.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const harness = path.resolve(here, '..', '..');
const repo = path.resolve(harness, '..', '..');
const uiProject = path.join(repo, 'demo-apps', 'demoapp001-react-ui');
const wanted = process.argv.slice(2);

interface Catcher {
    kind: 'scenario' | 'component-test' | 'exit-check' | 'visual-check';
    failsWith: string;
    profile?: 'api' | 'ui';
    feature?: string;
    file?: string;
    /** An exit-check catcher: the name of the one target the exit run looks at (CDS_EXIT_ONLY). */
    target?: string;
    name: string;
    /** A visual-check catcher: the one case of the visual checks it runs (src/visual/cases.ts): the page, the width and the theme. */
    page?: string;
    width?: number;
    theme?: string;
}
interface Entry {
    flag: string;
    group: string;
    layer: string;
    status: 'implemented' | 'pending';
    catchers?: Catcher[];
}

// One catcher run may take this long (CDS_PROOF_TIMEOUT_MS); a hung run is reported as a timeout, not waited for (CDS-38 B-08).
const TIMEOUT_MS = Number(process.env.CDS_PROOF_TIMEOUT_MS || 240_000);

const registry = JSON.parse(fs.readFileSync(path.join(repo, 'fixtures', 'bug-flags.json'), 'utf8')) as { flags: Entry[] };
const known = new Set(registry.flags.map((f) => f.flag));
for (const name of wanted) if (!known.has(name)) throw new Error(`'${name}' is not a flag in fixtures/bug-flags.json`);

const stripAnsi = (text: string) => text.replace(/\u001b\[[0-9;]*m/g, '');
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Runs one catcher with exactly these flags on (none: all off). */
function run(catcher: Catcher, flags: string[]): RunResult {
    const env = { ...process.env, HARNESS_BUGS: flags.join(','), CDS_FLAGS: flags.join(',') };
    if (catcher.kind === 'scenario') {
        const cucumber = path.join(harness, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
        const feature = path.join(repo, 'features-shared', catcher.feature!);
        const result = spawnSync(process.execPath, ['--import', 'tsx', cucumber, '--profile', `select-${catcher.profile}`, feature, '--name', `^${escapeRegExp(catcher.name)}$`], { cwd: harness, env, encoding: 'utf8', timeout: TIMEOUT_MS, killSignal: 'SIGKILL' });
        const output = stripAnsi(`${result.stdout}\n${result.stderr}`);
        // A catcher whose name matches no scenario runs nothing and exits 0: that is not a pass.
        const ran = /Scenarios:\s+[1-9]/.test(output);
        return { passed: result.status === 0, ran, timedOut: (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT', output: ran ? output : `${output}\n(no scenario ran: check the catcher's name)` };
    }
    if (catcher.kind === 'exit-check') {
        // The exit run on one target with the flag set (CDS-41). It sets HARNESS_BUGS itself; the proof's services are already running.
        const result = spawnSync(process.execPath, ['--import', 'tsx', path.join(harness, 'src', 'exit', 'exit-checks.ts')], { cwd: harness, env: { ...env, CDS_EXIT_ONLY: catcher.target! }, encoding: 'utf8', timeout: TIMEOUT_MS, killSignal: 'SIGKILL', maxBuffer: 64 * 1024 * 1024 });
        const output = stripAnsi(`${result.stdout}
${result.stderr}`);
        // A target that matches nothing exits 1 with its own message; a run that scanned nothing is not a pass.
        const ran = exitCheckRan(output);
        return { passed: result.status === 0, ran, timedOut: (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT', output: ran ? output : `${output}
(no check ran: check the catcher's target)` };
    }
    if (catcher.kind === 'visual-check') {
        // One case of the visual checks with the flag set (CDS-43). Its title is the spec's: the describe, then the page.
        const title = visualTitlePattern(catcher.width!, catcher.theme!, catcher.page!);
        const cli = path.join(harness, 'node_modules', '@playwright', 'test', 'cli.js');
        const result = spawnSync(process.execPath, [cli, 'test', '-c', path.join('src', 'visual', 'playwright.config.ts'), '--update-snapshots=none', '-g', title], { cwd: harness, env, encoding: 'utf8', timeout: TIMEOUT_MS, killSignal: 'SIGKILL', maxBuffer: 64 * 1024 * 1024 });
        const output = stripAnsi(`${result.stdout}\n${result.stderr}`);
        const ran = /\b[1-9]\d* (passed|failed)/.test(output);
        return { passed: result.status === 0, ran, timedOut: (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT', output: ran ? output : `${output}\n(no case ran: check the catcher's page, width and theme)` };
    }
    const vitest = path.join(uiProject, 'node_modules', 'vitest', 'vitest.mjs');
    // Vitest reads -t as a pattern, so the name is escaped to match literally (B-26) and anchored to the end of a test's full name and to a space
    // or the start before it: a name that is part of another test's name is not that test (CDS-48 A-02). The timeout is longer than Vitest's 5 s,
    // so a loaded machine does not turn a flag-off run into a false alarm (A-14).
    const result = spawnSync(process.execPath, [vitest, 'run', path.join(repo, catcher.file!), '-t', `(?:^| )${escapeRegExp(catcher.name)}$`, '--testTimeout=30000'], { cwd: uiProject, env, encoding: 'utf8', timeout: TIMEOUT_MS, killSignal: 'SIGKILL' });
    const output = stripAnsi(`${result.stdout}\n${result.stderr}`);
    // Exactly one test must run. A name that matches nothing makes Vitest skip every test and exit 0; one that matches two is not a catcher.
    const executed = vitestExecuted(output);
    const ran = executed === 1;
    return { passed: result.status === 0, ran, timedOut: (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT', output: ran ? output : `${output}\n(${executed} tests ran, not exactly one: check the catcher's name)` };
}

/** One reset call on a connection of its own (`agent: false`): a pooled socket the service has closed is what crashed the proof on 2026-10-19 (CDS-46). */
function resetOnce(): Promise<number> {
    const url = new URL(`${process.env.HARNESS_BASE_URL ?? ''}/__test/reset`);
    return new Promise((resolve, reject) => {
        const request = http.request(url, { method: 'POST', agent: false, headers: { 'x-test-control-key': process.env.HARNESS_CONTROL_KEY ?? '', connection: 'close' } }, (response) => {
            response.resume();
            response.on('end', () => resolve(response.statusCode ?? 0));
            response.on('error', reject);
        });
        request.setTimeout(30_000, () => request.destroy(new Error('no answer within 30 s')));
        request.on('error', reject);
        request.end();
    });
}

/** The end of the main service's log, for the message when it does not answer (run.mjs passes the path). */
function logTail(): string {
    const file = process.env.HARNESS_SERVICE_LOG;
    if (!file || !fs.existsSync(file)) return '(no service log path was given)';
    return fs.readFileSync(file, 'utf8').split(/\r?\n/).slice(-40).join('\n');
}

let stoppedBecause: string | undefined;

const visualHere = process.env.CI === 'true' || process.env.VISUAL_LOCAL_TRY === '1';

/**
 * The proof's table, written after every flag (a proof that is stopped or cancelled leaves the flags judged so far, CDS-48 B-10) and at the
 * end: reports/bug-flags.json, and bug-flags.md with each catcher's failure line, so "caught for the stated reason" can be checked from the
 * record after the log has gone (B-01).
 */
function writeTable() {
    const reports = path.join(harness, 'reports');
    fs.mkdirSync(reports, { recursive: true });
    fs.writeFileSync(path.join(reports, 'bug-flags.json'), JSON.stringify({ flags: rows }, null, 2));
    const lines = ['# Bug flags: proof', '', '| Flag | Group | Layer | Verdict | Catchers (off, on) |', '|---|---|---|---|---|'];
    for (const r of rows) lines.push(`| \`${r.flag}\` | ${r.group} | ${r.layer} | ${r.verdict} | ${r.catchers.map((c) => `${c.kind}: ${c.off}, ${c.on}`).join('; ') || 'none yet'} |`);
    lines.push('', '## What each catcher failed with', '', 'The first line of the catcher\'s output with the flag on that holds the recorded failure text. A visual-check catcher is a page-changed catch: its text is the image\'s name.', '', '| Flag | Catcher | Recorded text | The line it failed with |', '|---|---|---|---|');
    for (const r of rows) for (const c of r.catchers) lines.push(`| \`${r.flag}\` | ${c.kind}: ${c.name.replace(/\|/g, '/')} | \`${c.failsWith.replace(/\|/g, '/')}\` | ${c.matched === null ? '(not in the output)' : `\`${c.matched.replace(/\|/g, '/').replace(/\`/g, "'")}\``} |`);
    fs.writeFileSync(path.join(reports, 'bug-flags.md'), `${lines.join('\n')}\n`);
}
const leftOut: string[] = [];
type CatcherResult = { name: string; kind: string; off: Outcome; on: Outcome; failsWith: string; matched: string | null };
const rows: { flag: string; group: string; layer: string; verdict: Verdict; catchers: CatcherResult[] }[] = [];
const describeOn = (on: Outcome) => ({ passed: 'PASSES', 'failed-as-stated': 'fails as stated', 'failed-for-another-reason': 'fails, but not as stated', 'did-not-run': 'DID NOT RUN', 'timed-out': 'TIMED OUT' })[on];
const describeOff = (off: Outcome) => (off === 'passed' ? 'passes' : off === 'failed-for-another-reason' ? 'FAILS (or prints the failure text)' : off === 'did-not-run' ? 'DID NOT RUN' : 'TIMED OUT');

for (const entry of registry.flags) {
    if (wanted.length > 0 && !wanted.includes(entry.flag)) continue;
    if (entry.status === 'pending') {
        rows.push({ flag: entry.flag, group: entry.group, layer: entry.layer, verdict: 'pending', catchers: [] });
        continue;
    }
    const results: CatcherResult[] = [];
    for (const catcher of entry.catchers ?? []) {
        // The visual baselines are Linux CI images: a visual-check catcher runs there, or here with VISUAL_LOCAL_TRY=1 against throw-away
        // images. Anywhere else it is left out and said so; the flag's other catchers still judge it.
        if (catcher.kind === 'visual-check' && !visualHere) {
            leftOut.push(`${entry.flag}: ${catcher.name}`);
            console.log(`  ${entry.flag.padEnd(24)} ${catcher.kind.padEnd(15)} not run here (Linux CI baselines)  ${catcher.name}`);
            continue;
        }
        const off = run(catcher, []);
        const on = run(catcher, [entry.flag]);
        const outcome = { name: catcher.name, kind: catcher.kind, off: judgeOff(off, catcher.failsWith), on: judgeOn(on, catcher.failsWith), failsWith: catcher.failsWith, matched: matchedLine(on.output, catcher.failsWith) };
        results.push(outcome);
        console.log(`  ${entry.flag.padEnd(24)} ${catcher.kind.padEnd(15)} off: ${describeOff(outcome.off)}  on: ${describeOn(outcome.on)}  ${catcher.name}`);
    }
    const verdict = verdictOf(results);
    rows.push({ flag: entry.flag, group: entry.group, layer: entry.layer, verdict, catchers: results });
    writeTable();
    const reset = await resetWithRetry(resetOnce, { flag: entry.flag, logTail });
    if (!reset.ok) {
        // Named, with the table so far written below: the proof stops here and is not a pass.
        stoppedBecause = reset.message;
        break;
    }
}

writeTable();

const proved = rows.filter((r) => r.verdict !== 'pending');
const bad = proved.filter((r) => r.verdict !== 'caught');
console.log(`\nbug flags: ${proved.filter((r) => r.verdict === 'caught').length} of ${proved.length} implemented flags caught for the stated reason; ${rows.length - proved.length} pending`);
if (leftOut.length > 0) console.log(`${leftOut.length} visual-check catcher(s) not run here, because their baselines are Linux CI images: ${leftOut.join('; ')}`);
for (const r of bad) console.error(`  - ${r.flag}: ${r.verdict}`);
if (stoppedBecause) console.error(`\nbug flags: the proof stopped early, ${rows.length} of ${registry.flags.length} flags judged: ${stoppedBecause}`);
process.exitCode = bad.length > 0 || stoppedBecause ? 1 : 0;
