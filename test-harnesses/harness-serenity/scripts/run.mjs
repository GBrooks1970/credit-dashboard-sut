// version: 2 | created: 2026-10-10T11:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Builds the service, starts it with test control on and a synthetic key, starts a second instance without test control
// (for the scenario that needs the surface absent), runs the Cucumber profile against them, and always stops both
// (design section 8, CDS-22). Run from test-harnesses/harness-serenity:  node scripts/run.mjs api [feature ...]
// HARNESS_PORT (default 4600) and HARNESS_OFF_PORT (default 4601) override the ports. Anything already answering on
// either port stops the run, because it would be tested in place of the service started here.
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
const offPort = Number(process.env.HARNESS_OFF_PORT || 4601);
const baseOf = (p) => `http://127.0.0.1:${p}/api/v1`;
const controlKey = 'harness-run-key'; // synthetic: the service exists only for the length of this run

const [requested = 'api', ...features] = process.argv.slice(2);
const profile = features.length > 0 ? 'select' : requested;

const answers = (p) => fetch(`${baseOf(p)}/bureaux`).then(() => true, () => false);
for (const p of [port, offPort]) {
    if (await answers(p)) {
        console.error(`harness: something already answers on port ${p}; stop it or set HARNESS_PORT / HARNESS_OFF_PORT`);
        process.exit(1);
    }
}

const build = spawnSync('dotnet', ['build', path.join(solution, 'CreditDashboard.Api'), '-c', 'Release', '--nologo', '-v', 'q'], { stdio: 'inherit' });
if (build.status !== 0 || !fs.existsSync(dll)) {
    console.error('harness: the service did not build');
    process.exit(1);
}

// The logs go to files, not pipes: nothing drains a pipe while Cucumber runs (lesson from CDS-23).
const instances = [];
function start(label, listenPort, testControl) {
    const logPath = path.join(os.tmpdir(), `harness-service-${listenPort}.log`);
    const logFd = fs.openSync(logPath, 'w');
    const env = {
        ...process.env,
        ASPNETCORE_URLS: `http://127.0.0.1:${listenPort}`,
        Logging__LogLevel__Default: 'Warning',
        'Logging__LogLevel__Microsoft.AspNetCore': 'Warning',
    };
    // The second instance has no test control and no key at all: the surface must be absent, not merely guarded (DR-008).
    delete env.TEST_CONTROL;
    delete env.TEST_CONTROL_KEY;
    if (testControl) {
        env.TEST_CONTROL = 'true';
        env.TEST_CONTROL_KEY = controlKey;
    }
    const child = spawn('dotnet', [dll], { env, stdio: ['ignore', logFd, logFd] });
    const instance = { label, listenPort, logPath, child, exited: false };
    child.on('exit', () => {
        instance.exited = true;
    });
    instances.push(instance);
    return instance;
}
const stop = () => {
    for (const i of instances) if (!i.exited) i.child.kill();
};
process.on('exit', stop);
process.on('SIGINT', () => {
    stop();
    process.exit(130);
});

async function ready(instance) {
    for (let i = 0; i < 120; i++) {
        if (instance.exited) throw new Error(`the ${instance.label} service exited early; log: ${instance.logPath}`);
        if (await answers(instance.listenPort)) return;
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`the ${instance.label} service did not answer within 60 s; log: ${instance.logPath}`);
}

let code = 1;
try {
    const main = start('main', port, true);
    const off = start('no-test-control', offPort, false);
    await ready(main);
    await ready(off);

    fs.mkdirSync(path.join(harness, 'reports'), { recursive: true });
    const cucumber = path.join(harness, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
    const paths = features.map((f) => path.resolve(harness, '..', '..', 'features-shared', f.endsWith('.feature') ? f : `${f}.feature`));
    const run = spawnSync(process.execPath, ['--import', 'tsx', cucumber, '--profile', profile, ...paths], {
        cwd: harness,
        stdio: 'inherit',
        env: { ...process.env, HARNESS_BASE_URL: baseOf(port), HARNESS_OFF_BASE_URL: baseOf(offPort), HARNESS_CONTROL_KEY: controlKey },
    });
    code = run.status ?? 1;
    console.log(`\nharness: Cucumber exit code ${code}; service logs ${main.logPath}, ${off.logPath}`);
} catch (error) {
    console.error(`harness: ${error.message}`);
} finally {
    stop();
}
process.exitCode = code;
