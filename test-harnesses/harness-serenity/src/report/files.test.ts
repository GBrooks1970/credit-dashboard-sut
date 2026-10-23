// version: 2 | created: 2026-10-23T09:00Z | project: credit-dashboard-sut | type: test | language: en-GB
// Which files the secret scans read and which files the report may hold (CDS-48 B-06).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { binaryKind, isBinary, reportFileProblem, scanTextOf } from './files.js';

test('only a known image or font is binary: every other file is read as text', () => {
    for (const name of ['a.png', 'b.JPG', 'c.jpeg', 'd.gif', 'e.ico', 'f.woff', 'g.woff2', 'h.ttf', 'i.eot']) assert.equal(isBinary(name), true, name);
    for (const name of ['notes.log', 'secrets.env', 'openapi.yaml', 'x.md', 'a.html', 'a.svg', 'a.json', 'config', 'no-extension']) assert.equal(isBinary(name), false, name);
});

test('the kinds of file the Serenity report holds are accepted under report/', () => {
    for (const name of ['report/index.html', 'report/serenity-resources', 'report/commit.txt', 'report/css/a.css', 'report/js/a.js', 'report/a.mjs', 'report/a.json', 'report/i/a.png', 'report/i/a.svg', 'report/f/a.woff2', 'report/a.map', 'report/a.scss', 'report/a.properties', 'report/a.xml']) {
        assert.equal(reportFileProblem(name), null, name);
    }
});

test('a log, an environment file, a specification, a note or a hidden folder under report/ is not the report (B-06)', () => {
    for (const name of ['report/notes.log', 'report/secrets.env', 'report/openapi.yaml', 'report/x.md', 'report/.git/config', 'report/.env', 'report/a/.hidden/x.html', 'report/noextension']) {
        const problem = reportFileProblem(name);
        assert.ok(problem, name);
        assert.match(problem, new RegExp(name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')));
    }
});

test('a file outside report/ is not judged here: the site check says what else may be in the folder', () => {
    assert.equal(reportFileProblem('index.html'), null);
    assert.equal(reportFileProblem('DOCS/backlog.md'), null);
});

const bytes = (...values: number[]) => Buffer.from(values);
const pad = (head: Buffer, length = 64) => Buffer.concat([head, Buffer.alloc(Math.max(0, length - head.length))]);

test('a file is binary by its first bytes, not by its name (CDS-48 C-06)', () => {
    const cases: [string, Buffer][] = [
        ['png', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)],
        ['jpeg', bytes(0xff, 0xd8, 0xff, 0xe0)],
        ['gif', Buffer.from('GIF89a')],
        ['ico', bytes(0x00, 0x00, 0x01, 0x00)],
        ['woff', Buffer.from('wOFF')],
        ['woff2', Buffer.from('wOF2')],
        ['truetype', bytes(0x00, 0x01, 0x00, 0x00)],
        ['opentype', Buffer.from('OTTO')],
    ];
    for (const [kind, head] of cases) assert.equal(binaryKind(pad(head)), kind, kind);
    const eot = pad(Buffer.alloc(0));
    eot[34] = 0x4c;
    eot[35] = 0x50;
    assert.equal(binaryKind(eot), 'eot');
    assert.equal(binaryKind(Buffer.from('harness-run-key and some text, long enough to be a file')), null);
    assert.equal(binaryKind(Buffer.alloc(0)), null);
});

test('only the whole PNG signature makes a PNG: the first four bytes and then text are not one (CDS-48 C-06)', () => {
    assert.equal(binaryKind(pad(bytes(0x89, 0x50, 0x4e, 0x47, 0x20, 0x20, 0x20, 0x20))), null);
});

test('the control key inside an image or a font is found, as bytes (CDS-48 C-06)', () => {
    const png = Buffer.concat([bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), Buffer.from('....harness-run-key....')]);
    const scan = scanTextOf('report/a.png', png);
    assert.equal(scan.problem, undefined);
    assert.equal(scan.text.includes('harness-run-key'), true);
});

test('a file named like an image or a font whose bytes are text is a problem, and is read as text (CDS-48 C-06)', () => {
    for (const name of ['report/a.png', 'report/a.ttf', 'report/a.woff2', 'report/a.jpg']) {
        const scan = scanTextOf(name, Buffer.from('harness-run-key'));
        assert.match(scan.problem ?? '', new RegExp(name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')));
        assert.match(scan.problem ?? '', /named like an image or a font/);
        assert.equal(scan.text.includes('harness-run-key'), true, name);
    }
});

test('a text file with a name of any kind is read as text; UTF-16 text is read as well (CDS-48 C-06)', () => {
    assert.equal(scanTextOf('report/notes.log', Buffer.from('harness-run-key')).text.includes('harness-run-key'), true);
    assert.equal(scanTextOf('report/notes.log', Buffer.from('harness-run-key')).problem, undefined);
    const utf16 = Buffer.from('\ufeffthe key is harness-run-key', 'utf16le');
    assert.equal(scanTextOf('report/notes.txt', utf16).text.includes('harness-run-key'), true);
});
