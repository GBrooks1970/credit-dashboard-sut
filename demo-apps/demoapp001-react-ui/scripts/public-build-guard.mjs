// version: 2 | created: 2026-10-16T16:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The public build must hold none of the test-only code (decision brief 13 D1, DR-064; UI specification 3 and 6.8). Vite removes it
// when VITE_TEST_BUILD is not 'true'; this check looks at what was actually built, so a switch that is inverted, a variable that
// leaks into the environment or an import that escapes the guard fails `npm run check` and the `ui` CI job (CDS-38 C-13).
// Usage: node scripts/public-build-guard.mjs [folder]   (default: dist, after `vite build` with no VITE_TEST_BUILD)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Strings that exist only because of the test build: the control-key storage name, the control paths and header, the debug panel. */
export const MARKERS = ['cds.testControlKey', '__test', 'x-test-control-key', 'debug-flag', 'Debug panel'];

/**
 * The UI bug flags that no ordinary word of the product could spell, so a defect branch built through `useFlag(name)` that reached the public
 * bundle would carry one of these strings and be found (CDS-38 R2-C-06). A flag named like a word the page may use (`plural`, `double-render`)
 * cannot be a marker without false alarms: those are recorded in the UI specification for P3, where the UI flags are built through a
 * constant `TEST_BUILD && ...` check that the bundler removes.
 */
export const FLAG_MARKERS = ['duplicate-nav', 'util-mismatch', 'currency-format', 'minor-units-label', 'placeholder-aria', 'chart-no-values', 'range-stale', 'toggle-label', 'like-both', 'truncate-summary', 'negative-balance', 'button-href', 'double-render', 'ph-a11y', 'nested-button', 'decorative-alt', 'open-redirect', 'preferred-on-report', 'pii-in-title'];

/** Everything the guard looks for. */
export const ALL_MARKERS = [...MARKERS, ...FLAG_MARKERS];

/** Every marker found in the JavaScript and HTML of a build, as `file: marker`. Throws if the folder holds nothing to look at. */
export function scan(folder) {
    const files = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.(js|mjs|html)$/.test(entry.name)) files.push(full);
        }
    };
    if (!fs.existsSync(folder)) throw new Error(`${folder} does not exist: build the UI first`);
    walk(folder);
    if (files.length === 0) throw new Error(`${folder} holds no JavaScript or HTML to check`);
    const hits = [];
    for (const file of files) {
        const text = fs.readFileSync(file, 'utf8');
        for (const marker of ALL_MARKERS) if (text.includes(marker)) hits.push(`${path.relative(folder, file)}: ${marker}`);
    }
    return hits;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const folder = path.resolve(process.argv[2] ?? 'dist');
    const hits = scan(folder);
    if (hits.length > 0) {
        console.error(`The public build in ${folder} holds test-only code:`);
        for (const hit of hits) console.error(`  - ${hit}`);
        console.error('Build without VITE_TEST_BUILD=true (and check the switch in src/flags.tsx).');
        process.exit(1);
    }
    console.log(`public build guard: ${folder} holds none of ${ALL_MARKERS.length} test-only markers`);
}
