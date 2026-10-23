// version: 1 | created: 2026-10-23T09:00Z | project: credit-dashboard-sut | type: test | language: en-GB
// Which files the secret scans read and which files the report may hold (CDS-48 B-06).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isBinary, reportFileProblem } from './files.js';

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
