import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { MARKERS, scan } from './public-build-guard.mjs';

// The guard on its own (CDS-38 C-13): it must find each marker, and must not pass a folder it cannot judge.
function build(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cds-guard-'));
    for (const [name, text] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
        fs.writeFileSync(path.join(dir, name), text);
    }
    return dir;
}

describe('the public build guard', () => {
    it('passes a build with none of the markers', () => {
        assert.deepEqual(scan(build({ 'index.html': '<div id="root"></div>', 'assets/app.js': 'console.log("hello")' })), []);
    });

    for (const marker of MARKERS) {
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
