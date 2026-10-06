// version: 1 | created: 2026-10-06T16:41Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Starts and stops the pinned Prism mock (CDS-14, CDS-15). Prism is started directly with Node from the root
// install, never through npx or a shell, so it can always be stopped (CDS-14 spike).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

export function startPrism({ contractPath, port }) {
  const require = createRequire(import.meta.url);
  const cli = require.resolve('@stoplight/prism-cli/dist/index.js');
  const child = spawn(process.execPath, [cli, 'mock', contractPath, '-p', String(port), '-h', '127.0.0.1', '--errors'],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Prism did not start within 60 s:\n${log.slice(-2000)}`)), 60000);
    const onData = (d) => {
      log += d;
      if (/listening/i.test(log)) { clearTimeout(timer); resolve(); }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Prism exited early (code ${code}):\n${log.slice(-2000)}`)); });
  });
  const stop = () => { if (child.exitCode === null) child.kill(); };
  process.on('exit', stop);
  process.on('SIGINT', () => { stop(); process.exit(130); });
  return { ready, stop };
}
