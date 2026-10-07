// version: 2 | created: 2026-10-07T09:10Z | project: credit-dashboard-sut | type: tool | language: en-GB
// One command for every check that keeps the repository green (CDS-15; README 'Checks'). Installs the two
// sub-packages, runs each check in turn whatever the previous result, prints one result line per check and exits
// non-zero if any failed. Needs Python with gherkin-official 29.0.0 for the Gherkin check (PYTHON overrides 'python').
// Run from the repository root:  npm ci && npm run verify
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = process.env.PYTHON || 'python';

const steps = [
  { name: 'install fixtures', cwd: 'fixtures', cmd: 'npm ci --no-audit --no-fund', setup: true },
  { name: 'install api-client', cwd: 'packages/api-client', cmd: 'npm ci --no-audit --no-fund', setup: true },
  { name: 'contract lint', cwd: '.', cmd: 'npx --yes @redocly/cli@2.57.0 lint' },
  { name: 'fixture check', cwd: 'fixtures', cmd: 'npm run check' },
  { name: 'Gherkin parse and rule coverage', cwd: '.', cmd: `${python} tools/check-gherkin.py` },
  { name: 'mock smoke', cwd: '.', cmd: 'node tools/mock-smoke.mjs' },
  { name: 'client check (drift and types)', cwd: 'packages/api-client', cmd: 'npm run check' },
  { name: 'client smoke', cwd: '.', cmd: 'node tools/client-smoke.ts' },
  { name: 'Kanban board current (drift check)', cwd: '.', cmd: 'npm run --silent check:kanban' },
];

const results = [];
for (const step of steps) {
  console.log(`\n=== ${step.name} (${step.cmd})`);
  const started = Date.now();
  const run = spawnSync(step.cmd, { cwd: path.join(root, step.cwd), stdio: 'inherit', shell: true });
  const ok = run.status === 0;
  results.push({ ...step, ok, seconds: ((Date.now() - started) / 1000).toFixed(1) });
  if (!ok && step.setup) break; // nothing after a failed install can be trusted
}

console.log('\nverify:');
for (const r of results) console.log(`  ${r.ok ? 'pass' : 'FAIL'}  ${r.name} (${r.seconds} s)`);
const skipped = steps.length - results.length;
if (skipped) console.log(`  skipped ${skipped} check(s) after a failed install`);
const failed = results.filter((r) => !r.ok).length + skipped;
console.log(failed ? `verify: ${failed} of ${steps.length} steps did not pass` : `verify: all ${steps.length} steps passed`);
process.exitCode = failed ? 1 : 0;
