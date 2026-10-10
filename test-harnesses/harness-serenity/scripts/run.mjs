// version: 1 | created: 2026-10-10T00:50Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Builds the service, starts it with test control on and a synthetic key, runs the Cucumber profile against it, and always
// stops it (design section 8, CDS-22). Run from test-harnesses/harness-serenity:  node scripts/run.mjs api [feature ...]
// HARNESS_PORT overrides the port (default 4600). Anything already answering on the port stops the run.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const harness = path.resolve(here, '..');
const solution = path.resolve(harness, '..', '..', 'demo-apps', 'demoapp001-dotnet-api');
const dll = path.join(solution, 'CreditDashboard.Api', 'bin', 'Release', 'net10.0', 'CreditDashboard.Api.dll');
const port = Number(process.env.HARNESS_PORT || 4600);
const base = `http://127.0.0.1:${port}/api/v1`;
const controlKey = 'harness-run-key'; // synthetic: the service exists only for the length of this run

const [requested = 'api', ...features] = process.argv.slice(2);
const profile = features.length > 0 ? 'select' : requested;

const occupied = await fetch(`${base}/bureaux`).then(() => true, () => false);
if (occupied) {
    console.error(`harness: something already answers on port ${port}; stop it or set HARNESS_PORT`);
    process.exit(1);
}

const build = spawnSync('dotnet', ['build', path.join(solution, 'CreditDashboard.Api'), '-c', 'Release', '--nologo', '-v', 'q'], { stdio: 'inherit' });
if (build.status !== 0 || !fs.existsSync(dll)) {
    console.error('harness: the service did not build');
    process.exit(1);
}

// The log goes to a file, not a pipe: nothing drains a pipe while Cucumber runs (lesson from CDS-23).
const logPath = path.join(os.tmpdir(), `harness-service-${port}.log`);
const logFd = fs.openSync(logPath, 'w');
const service = spawn('dotnet', [dll], {
    env: {
        ...process.env,
        ASPNETCORE_URLS: `http://127.0.0.1:${port}`,
        TEST_CONTROL: 'true',
        TEST_CONTROL_KEY: controlKey,
        Logging__LogLevel__Default: 'Warning',
        'Logging__LogLevel__Microsoft.AspNetCore': 'Warning',
    },
    stdio: ['ignore', logFd, logFd],
});
let exited = false;
service.on('exit', () => {
    exited = true;
});
const stop = () => {
    if (!exited) service.kill();
};
process.on('exit', stop);
process.on('SIGINT', () => {
    stop();
    process.exit(130);
});

let code = 1;
try {
    let ready = false;
    for (let i = 0; i < 120 && !ready; i++) {
        if (exited) throw new Error(`the service exited early; log: ${logPath}`);
        ready = await fetch(`${base}/bureaux`).then(() => true, () => false);
        if (!ready) await new Promise((r) => setTimeout(r, 500));
    }
    if (!ready) throw new Error(`the service did not answer within 60 s; log: ${logPath}`);

    fs.mkdirSync(path.join(harness, 'reports'), { recursive: true });
    const cucumber = path.join(harness, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
    const paths = features.map((f) => path.resolve(harness, '..', '..', 'features-shared', f.endsWith('.feature') ? f : `${f}.feature`));
    const run = spawnSync(process.execPath, ['--import', 'tsx', cucumber, '--profile', profile, ...paths], {
        cwd: harness,
        stdio: 'inherit',
        env: { ...process.env, HARNESS_BASE_URL: base, HARNESS_CONTROL_KEY: controlKey },
    });
    code = run.status ?? 1;
    console.log(`\nharness: Cucumber exit code ${code}; service log ${logPath}`);
} catch (error) {
    console.error(`harness: ${error.message}`);
} finally {
    stop();
}
process.exitCode = code;
