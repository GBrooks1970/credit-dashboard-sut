import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { ALL_MARKERS, FLAG_MARKERS, MARKERS, scan, QUOTED_FLAG_MARKERS } from './public-build-guard.mjs';

// The guard on its own (CDS-38 C-13): it must find each marker, and must not pass a folder it cannot judge.
function build(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cds-guard-'));
    for (const [name, text] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
        fs.writeFileSync(path.join(dir, name), text);
    }
    return dir;
}

describe('the markers the guard looks for (CDS-38 R2-C-07, R2-C-06)', () => {
    it('are the five the UI specification names, whatever the list in the guard says', () => {
        // Written out here, from UI specification section 3, and not taken from the guard: a list that shrank would otherwise still pass.
        assert.deepEqual([...MARKERS], ['cds.testControlKey', '__test', 'x-test-control-key', 'debug-flag', 'Debug panel']);
    });

    it('add only names of UI bug flags in the registry, each with a hyphen so that no ordinary word is one', () => {
        const registry = JSON.parse(fs.readFileSync(new URL('../../../fixtures/bug-flags.json', import.meta.url), 'utf8')).flags;
        const ui = registry.filter((f) => f.layer === 'ui').map((f) => f.flag);
        for (const marker of FLAG_MARKERS) {
            assert.ok(ui.includes(marker), `${marker} is not a UI flag in fixtures/bug-flags.json`);
            assert.ok(marker.includes('-'), `${marker} could be an ordinary word`);
        }
    });
});

describe('every UI bug flag is covered by the guard (CDS-48 review finding A-04)', () => {
    it('is a marker, or, if it is an ordinary word, looked for as a quoted string', () => {
        const registry = JSON.parse(fs.readFileSync(new URL('../../../fixtures/bug-flags.json', import.meta.url), 'utf8')).flags;
        const covered = new Set([...FLAG_MARKERS, ...QUOTED_FLAG_MARKERS]);
        for (const flag of registry.filter((f) => f.layer === 'ui').map((f) => f.flag)) {
            assert.ok(covered.has(flag), `the UI flag ${flag} is looked for by nothing: add it to FLAG_MARKERS (a hyphenated name) or QUOTED_FLAG_MARKERS (a plain word)`);
        }
    });

    it('finds a plain-word flag name used as a string, in any quote', () => {
        for (const quote of ['"', "'", '`']) {
            const hits = scan(build({ 'index.html': '<div></div>', 'assets/app.js': `function pr(e){return!1}return e===1&&!pr(${quote}plural${quote})?t:n` }));
            assert.equal(hits.length, 1, quote);
            assert.match(hits[0], /plural/);
        }
    });

    it('does not take the word in a sentence for a flag', () => {
        assert.deepEqual(scan(build({ 'index.html': '<div></div>', 'assets/app.js': 'const text = "the plural of day is days"' })), []);
    });
});

describe('the public build guard', () => {
    it('passes a build with none of the markers', () => {
        assert.deepEqual(scan(build({ 'index.html': '<div id="root"></div>', 'assets/app.js': 'console.log("hello")' })), []);
    });

    for (const marker of ALL_MARKERS) {
        it(`finds ${marker} in a bundle`, () => {
            const hits = scan(build({ 'index.html': '<div></div>', 'assets/app.js': `fetch("/api/v1/${marker}/reset")` }));
            assert.deepEqual(hits, [`${path.join('assets', 'app.js')}: ${marker}`]);
        });
    }

    it('does not pass a folder that does not exist or holds nothing to look at', () => {
        assert.throws(() => scan(path.join(os.tmpdir(), 'cds-guard-missing-folder')), /does not exist/);
        assert.throws(() => scan(build({ 'logo.png': 'x' })), /holds no JavaScript or HTML/);
    });
});
