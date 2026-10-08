// version: 1 | created: 2026-10-08T15:30Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Runs Schemathesis against the live service (CDS-23, DR-056). The tool starts the built service on its own port with
// test control on and a synthetic key, freezes its clock, binds a persona and signs in, then makes two passes:
// The stateful phase is left out: it chooses its next call from the last response, so two runs of the same seed can differ,
// and a gate must not flake (CDS-23: one run in four reported a request with extra properties as an 'accepted invalid request').
//   1. every operation but `logout` (it revokes the run's own token) and the test-control tag;
//   2. the test-control operations, last, except the latency control (it can delay a request by 10 s).
// It always stops the service. Needs `pip install -r tools/requirements.txt` (PYTHON overrides 'python') and the .NET 10 SDK.
// Run from the repository root:  npm run check:schemathesis   (SERVICE_PORT overrides the port, default 4500)
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = process.env.PYTHON || 'python';
const port = Number(process.env.SERVICE_PORT || 4500);
const base = `http://127.0.0.1:${port}/api/v1`;
const controlKey = 'schemathesis-run-key'; // synthetic: the service exists only for the length of this run
const contract = path.join(root, 'DOCS', '.architecture', 'openapi.yaml');
const config = path.join(root, 'schemathesis.toml');
const solution = path.join(root, 'demo-apps', 'demoapp001-dotnet-api');
const dll = path.join(solution, 'CreditDashboard.Api', 'bin', 'Release', 'net10.0', 'CreditDashboard.Api.dll');

// Something already answering on the port would be tested instead of the service started below.
const occupied = await fetch(base + '/bureaux').then(() => true, () => false);
if (occupied) {
  console.error(`schemathesis: something already answers on port ${port}; stop it or set SERVICE_PORT`);
  process.exit(1);
}

const build = spawnSync('dotnet', ['build', path.join(solution, 'CreditDashboard.Api'), '-c', 'Release', '--nologo', '-v', 'q'], { stdio: 'inherit' });
if (build.status !== 0 || !fs.existsSync(dll)) {
  console.error('schemathesis: the service did not build');
  process.exit(1);
}

// The service logs to a file, not a pipe: spawnSync below blocks this process, so nothing would drain a pipe, and the
// service would stall once the pipe filled (found in CDS-23: the fuzzing phase took 214 s instead of 5).
const logPath = path.join(os.tmpdir(), `schemathesis-service-${port}.log`);
const logFd = fs.openSync(logPath, 'w');
const service = spawn('dotnet', [dll], {
  env: {
    ...process.env, ASPNETCORE_URLS: `http://127.0.0.1:${port}`, TEST_CONTROL: 'true', TEST_CONTROL_KEY: controlKey,
    Logging__LogLevel__Default: 'Warning', 'Logging__LogLevel__Microsoft.AspNetCore': 'Warning',
  },
  stdio: ['ignore', logFd, logFd],
});
const serviceLog = () => { try { return fs.readFileSync(logPath, 'utf8'); } catch { return ''; } };
let serviceExited = false;
service.on('exit', () => { serviceExited = true; });
const stop = () => { if (!serviceExited) service.kill(); };
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(130); });

async function api(method, route, body, headers = {}) {
  const response = await fetch(base + route, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, json: response.status === 200 ? await response.json() : null };
}

async function waitForService() {
  for (let i = 0; i < 120; i++) {
    if (serviceExited) throw new Error(`the service exited early:\n${serviceLog().slice(-2000)}`);
    try { await fetch(base + '/bureaux'); return; } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  throw new Error(`the service did not answer within 60 s:\n${serviceLog().slice(-2000)}`);
}

function schemathesis(label, extra) {
  console.log(`\n=== Schemathesis ${label}`);
  // The package has no __main__; this is the console script's own entry point, so it needs no PATH.
  const args = ['-c', 'from schemathesis.cli import schemathesis; schemathesis()', '--config-file', config, 'run', contract, '--url', base,
    '--phases', 'examples,coverage,fuzzing', '--max-examples', '25', '--generation-deterministic', '--workers', '1', '--max-failures', '50', ...extra];
  const run = spawnSync(python, args, { stdio: 'inherit', env: { ...process.env, PYTHONUTF8: '1' } });
  return run.status === 0;
}

let ok = false;
try {
  await waitForService();
  const control = { 'X-Test-Control-Key': controlKey };
  await api('PUT', '/__test/clock', { now: '2026-10-03T09:00:00Z' }, control);
  await api('PUT', '/__test/users/alex/persona', { persona: 'drilldown' }, control);
  const login = await api('POST', '/auth/login', { username: 'alex', password: 'demo-only' });
  if (login.status !== 200) throw new Error(`sign-in failed: ${login.status}`);

  const business = schemathesis('business operations', [
    '-H', `Authorization: Bearer ${login.json.token}`,
    '--exclude-tag', 'test-control', '--exclude-operation-id', 'logout',
  ]);
  const controlPass = schemathesis('test-control operations', [
    '-H', `X-Test-Control-Key: ${controlKey}`,
    // The key is an apiKey scheme, which Schemathesis would otherwise generate at random instead of using ours.
    '--generation-with-security-parameters', 'false',
    '--include-tag', 'test-control', '--exclude-operation-id', 'testSetLatency',
  ]);
  ok = business && controlPass;
  console.log(`\nschemathesis: business ${business ? 'pass' : 'FAIL'}, test control ${controlPass ? 'pass' : 'FAIL'}`);
} catch (error) {
  console.error(`schemathesis: ${error.message}`);
} finally {
  stop();
}
process.exitCode = ok ? 0 : 1;
