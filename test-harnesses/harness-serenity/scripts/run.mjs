// version: 9 | created: 2026-10-13T11:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Builds the service, starts it with test control on and a synthetic key, starts a second instance without test control
// (for the scenario that needs the surface absent), runs the Cucumber profile against them, and always stops both
// (design section 8, CDS-22). Run from test-harnesses/harness-serenity:  node scripts/run.mjs api|ui [feature ...]
// `exit` runs the Phase 4 exit checks (src/exit/exit-checks.ts: axe-core on every page, the three layouts) instead of Cucumber.
// `flags [flag ...]` runs the bug-flag proof (src/flags/prove-flags.ts): each implemented flag on and off against its catchers.
// The UI the ui, exit and flags runs build is a TEST BUILD (VITE_TEST_BUILD=true: it reads the flags and has the debug panel).
// The ui and exit runs also build the UI (demo-apps/demoapp001-react-ui) and have the service serve it (UI_DIRECTORY, brief 11 D2).
// The Cucumber, exit and flags child runs asynchronously: a SIGINT or SIGTERM is forwarded to it, and each mode has a whole-run limit
// (api 10 min, ui and exit 15 min, flags 60 min; HARNESS_TIMEOUT_MS overrides) so a hung run ends with a message, not a cancelled job (CDS-38 R2-B-08).
// A run that names a feature file that does not exist, or in which no scenario finished, fails (R2-B-09). The api run type-checks the harness first (R2-B-10).
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
const profile = features.length > 0 ? `select-${requested}` : requested;
const needsUi = requested === 'ui' || requested === 'exit' || requested === 'flags';
const uiProject = path.resolve(harness, '..', '..', 'demo-apps', 'demoapp001-react-ui');

const answers = (p) => fetch(`${baseOf(p)}/bureaux`).then(() => true, () => false);
for (const p of [port, offPort]) {
    if (await answers(p)) {
        console.error(`harness: something already answers on port ${p}; stop it or set HARNESS_PORT / HARNESS_OFF_PORT`);
        process.exit(1);
    }
}

if (needsUi) {
    // The UI is built once per run; its dependencies are installed when missing (CI installs them in its own step).
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    if (!fs.existsSync(path.join(uiProject, 'node_modules'))) spawnSync(npm, ['ci', '--no-audit', '--no-fund'], { cwd: uiProject, stdio: 'inherit', shell: process.platform === 'win32' });
    // The test build goes to dist-test/, never to dist/ (the public build's folder, which the guard checks): CDS-38 C-29.
    const uiBuild = spawnSync(npm, ['run', 'build:test'], { cwd: uiProject, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, VITE_TEST_BUILD: 'true' } });
    if (uiBuild.status !== 0) {
        console.error('harness: the UI did not build');
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
function start(label, listenPort, testControl, uiDirectory) {
    const logPath = path.join(os.tmpdir(), `harness-service-${listenPort}-${process.pid}.log`);
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
    delete env.UI_DIRECTORY;
    if (uiDirectory) env.UI_DIRECTORY = uiDirectory;
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
let runner; // the Cucumber, exit or flags process while it runs
const stop = () => {
    if (runner && runner.exitCode === null) runner.kill();
    for (const i of instances) if (!i.exited) i.child.kill();
};
process.on('exit', stop);
// A cancelled CI job sends SIGTERM: stop the run and both services then too, or the next run finds the ports taken (CDS-38 B-08).
// The run is a child that this process waits for without blocking, so the handler runs at once.
process.on('SIGINT', () => {
    stop();
    process.exit(130);
});
process.on('SIGTERM', () => {
    stop();
    process.exit(143);
});

async function ready(instance) {
    for (let i = 0; i < 120; i++) {
        if (instance.exited) throw new Error(`the ${instance.label} service exited early; log: ${instance.logPath}`);
        if (await answers(instance.listenPort)) return;
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`the ${instance.label} service did not answer within 60 s; log: ${instance.logPath}`);
}

// The harness's own type check and unit tests (the contract validator, the parallel guard) run before anything is started
// (CDS-38 F2, R2-B-10: the harness runs through tsx, which strips types, so nothing else would read them).
if (requested === 'api' && features.length === 0) {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    for (const [script, what] of [['typecheck', 'the harness type check'], ['test:unit', 'the harness unit tests']]) {
        const step = spawnSync(npm, ['run', script, '--silent'], { cwd: harness, stdio: 'inherit', shell: process.platform === 'win32' });
        if (step.status !== 0) {
            console.error(`harness: ${what} failed`);
            process.exit(1);
        }
    }
}

// A feature that does not exist selects nothing, and Cucumber exits 0 for a run with no scenario (R2-B-09).
const featurePaths = features.map((f) => path.resolve(harness, '..', '..', 'features-shared', f.endsWith('.feature') ? f : `${f}.feature`));
if (requested !== 'flags') {
    const missing = featurePaths.filter((f) => !fs.existsSync(f));
    if (missing.length > 0) {
        console.error(`harness: no such feature file: ${missing.map((m) => path.relative(path.resolve(harness, '..', '..'), m)).join(', ')} (the path is under features-shared/, for example api/closed-accounts)`);
        process.exit(1);
    }
}

const limitMs = Number(process.env.HARNESS_TIMEOUT_MS || { api: 10, ui: 15, exit: 15, flags: 60 }[requested] * 60_000 || 15 * 60_000);
/** Runs the child without blocking this process, so a signal reaches the handler above and the limit can end it. */
function runChild(command, env) {
    return new Promise((resolve) => {
        runner = spawn(process.execPath, command, { cwd: harness, stdio: 'inherit', env });
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            runner.kill();
        }, limitMs);
        runner.on('exit', (status) => {
            clearTimeout(timer);
            resolve({ status, timedOut });
        });
    });
}

let code = 1;
try {
    const main = start('main', port, true, needsUi ? path.join(uiProject, 'dist-test') : undefined);
    const off = start('no-test-control', offPort, false);
    await ready(main);
    await ready(off);

    fs.mkdirSync(path.join(harness, 'reports'), { recursive: true });
    const cucumber = path.join(harness, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
    const paths = featurePaths;
    const command =
        requested === 'exit'
            ? ['--import', 'tsx', path.join(harness, 'src', 'exit', 'exit-checks.ts')]
            : requested === 'flags'
              ? ['--import', 'tsx', path.join(harness, 'src', 'flags', 'prove-flags.ts'), ...features]
              : ['--import', 'tsx', cucumber, '--profile', profile, ...paths];
    const run = await runChild(command, { ...process.env, HARNESS_BASE_URL: baseOf(port), HARNESS_UI_URL: `http://127.0.0.1:${port}`, HARNESS_OFF_BASE_URL: baseOf(offPort), HARNESS_CONTROL_KEY: controlKey });
    code = run.status ?? 1;
    if (run.timedOut) console.error(`harness: the ${requested} run did not finish within ${limitMs >= 60_000 ? `${Math.round(limitMs / 60_000)} minutes` : `${Math.round(limitMs / 1000)} seconds`} and was stopped (HARNESS_TIMEOUT_MS changes the limit)`);
    if (code === 0 && (requested === 'api' || requested === 'ui')) {
        const report = path.join(harness, 'reports', `${requested}.ndjson`);
        const finished = fs.existsSync(report) ? fs.readFileSync(report, 'utf8').split(/\r?\n/).filter((l) => l.includes('"testCaseFinished"')).length : 0;
        if (finished === 0) {
            console.error('harness: no scenario finished, so nothing was tested; a run that selects nothing is not a pass');
            code = 1;
        }
    }
    if (code !== 0 && (requested === 'api' || requested === 'ui')) {
        // Every scenario can pass and the run still fail, because of a hook (CDS-38 C-15): say which, from the message report.
        const report = path.join(harness, 'reports', `${requested}.ndjson`);
        if (fs.existsSync(report)) {
            for (const line of fs.readFileSync(report, 'utf8').split(/\r?\n/)) {
                if (!line.includes('testRunHookFinished')) continue;
                try {
                    const finished = JSON.parse(line).testRunHookFinished?.result;
                    if (finished && finished.status !== 'PASSED') console.error(`harness: a run hook ${String(finished.status).toLowerCase()}: ${finished.message ?? '(no message)'}`);
                } catch {
                    // not a JSON line
                }
            }
        }
    }
    console.log(`\nharness: ${requested === 'exit' ? 'exit checks' : requested === 'flags' ? 'flag proof' : 'Cucumber'} exit code ${code}; service logs ${main.logPath}, ${off.logPath}`);
} catch (error) {
    console.error(`harness: ${error.message}`);
} finally {
    stop();
}
process.exitCode = code;
