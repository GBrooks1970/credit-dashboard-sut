// version: 2 | created: 2026-10-14T10:30Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The bug-flag proof (CDS-39, decision brief 13, DR-064). For every flag that fixtures/bug-flags.json marks implemented, run each
// of its committed catchers twice: with the flag OFF it must pass, and with the flag ON it must fail, and the failure must
// contain the text the registry records for it (`failsWith`). A flag is "caught" when at least one catcher fails for the stated
// reason with it on and none fails with it off. Anything else is named: not caught, caught for another reason, or a false alarm.
// Run by `node scripts/run.mjs flags [flag ...]` against the live service; writes reports/bug-flags.json and reports/bug-flags.md.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { judgeOff, judgeOn, verdictOf, type Outcome, type RunResult, type Verdict } from './verdict.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const harness = path.resolve(here, '..', '..');
const repo = path.resolve(harness, '..', '..');
const uiProject = path.join(repo, 'demo-apps', 'demoapp001-react-ui');
const wanted = process.argv.slice(2);

interface Catcher {
    kind: 'scenario' | 'component-test';
    failsWith: string;
    profile?: 'api' | 'ui';
    feature?: string;
    file?: string;
    name: string;
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
    const vitest = path.join(uiProject, 'node_modules', 'vitest', 'vitest.mjs');
    // Vitest reads -t as a pattern, so the name is escaped to match literally (B-26).
    const result = spawnSync(process.execPath, [vitest, 'run', path.join(repo, catcher.file!), '-t', escapeRegExp(catcher.name)], { cwd: uiProject, env, encoding: 'utf8', timeout: TIMEOUT_MS, killSignal: 'SIGKILL' });
    const output = stripAnsi(`${result.stdout}\n${result.stderr}`);
    // Likewise a test name that matches nothing: Vitest skips every test and exits 0.
    const ran = /Tests\s+.*\b[1-9]\d* (passed|failed)/.test(output);
    return { passed: result.status === 0, ran, timedOut: (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT', output: ran ? output : `${output}\n(no test ran: check the catcher's name)` };
}

async function resetService() {
    const base = process.env.HARNESS_BASE_URL ?? '';
    await fetch(`${base}/__test/reset`, { method: 'POST', headers: { 'x-test-control-key': process.env.HARNESS_CONTROL_KEY ?? '' } });
}

const rows: { flag: string; group: string; layer: string; verdict: Verdict; catchers: { name: string; kind: string; off: Outcome; on: Outcome }[] }[] = [];
const describeOn = (on: Outcome) => ({ passed: 'PASSES', 'failed-as-stated': 'fails as stated', 'failed-for-another-reason': 'fails, but not as stated', 'did-not-run': 'DID NOT RUN', 'timed-out': 'TIMED OUT' })[on];
const describeOff = (off: Outcome) => (off === 'passed' ? 'passes' : off === 'failed-for-another-reason' ? 'FAILS (or prints the failure text)' : off === 'did-not-run' ? 'DID NOT RUN' : 'TIMED OUT');

for (const entry of registry.flags) {
    if (wanted.length > 0 && !wanted.includes(entry.flag)) continue;
    if (entry.status === 'pending') {
        rows.push({ flag: entry.flag, group: entry.group, layer: entry.layer, verdict: 'pending', catchers: [] });
        continue;
    }
    const results: { name: string; kind: string; off: Outcome; on: Outcome }[] = [];
    for (const catcher of entry.catchers ?? []) {
        const off = run(catcher, []);
        const on = run(catcher, [entry.flag]);
        const outcome = { name: catcher.name, kind: catcher.kind, off: judgeOff(off, catcher.failsWith), on: judgeOn(on, catcher.failsWith) };
        results.push(outcome);
        console.log(`  ${entry.flag.padEnd(24)} ${catcher.kind.padEnd(15)} off: ${describeOff(outcome.off)}  on: ${describeOn(outcome.on)}  ${catcher.name}`);
    }
    const verdict = verdictOf(results);
    rows.push({ flag: entry.flag, group: entry.group, layer: entry.layer, verdict, catchers: results });
    await resetService();
}

const reports = path.join(harness, 'reports');
fs.mkdirSync(reports, { recursive: true });
fs.writeFileSync(path.join(reports, 'bug-flags.json'), JSON.stringify({ flags: rows }, null, 2));
const lines = ['# Bug flags: proof', '', '| Flag | Group | Layer | Verdict | Catchers (off, on) |', '|---|---|---|---|---|'];
for (const r of rows) lines.push(`| \`${r.flag}\` | ${r.group} | ${r.layer} | ${r.verdict} | ${r.catchers.map((c) => `${c.kind}: ${c.off}, ${c.on}`).join('; ') || 'none yet'} |`);
fs.writeFileSync(path.join(reports, 'bug-flags.md'), `${lines.join('\n')}\n`);

const proved = rows.filter((r) => r.verdict !== 'pending');
const bad = proved.filter((r) => r.verdict !== 'caught');
console.log(`\nbug flags: ${proved.filter((r) => r.verdict === 'caught').length} of ${proved.length} implemented flags caught for the stated reason; ${rows.length - proved.length} pending`);
for (const r of bad) console.error(`  - ${r.flag}: ${r.verdict}`);
process.exitCode = bad.length > 0 ? 1 : 0;
