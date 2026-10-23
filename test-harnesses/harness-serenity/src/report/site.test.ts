// version: 2 | created: 2026-10-20T13:35Z | project: credit-dashboard-sut | type: test | language: en-GB
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { siteProblems, type SiteFile } from './site.js';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const board = '<html><script id="payload-tickets" type="application/json">[{"id":"CDS-01"},{"id":"CDS-28"}]</script></html>';
const report = `<html>${'x'.repeat(2500)}</html>`;
const commit = `commit: ${SHA}\nrun: 123\n`;

const good = (): SiteFile[] => [
    { path: 'index.html', text: board },
    { path: 'report/index.html', text: report },
    { path: 'report/commit.txt', text: commit },
    { path: 'report/a.json', text: '{"name":"a"}' },
];

test('the board, the report and a matching stamp have no problem', () => {
    assert.deepEqual(siteProblems(good(), { sha: SHA, forbidden: ['harness-run-key'] }), []);
});

test('a board without its ticket payload is a problem', () => {
    const files = good().map((f) => (f.path === 'index.html' ? { ...f, text: '<html>empty</html>' } : f));
    const problems = siteProblems(files, { sha: SHA, forbidden: [] });
    assert.equal(problems.length > 0, true);
    assert.match(problems.join('\n'), /board/);
});

test('tickets that are not in the payload element are not a payload', () => {
    const files = good().map((f) => (f.path === 'index.html' ? { ...f, text: '<p>"id":"CDS-01" "id":"CDS-28"</p>' } : f));
    assert.match(siteProblems(files, { sha: SHA, forbidden: [] }).join(' '), /no ticket payload/);
});

test('a board without the first and the last tickets is a problem', () => {
    const files = good().map((f) => (f.path === 'index.html' ? { ...f, text: '<script id="payload-tickets">[{"id":"CDS-01"}]</script>' } : f));
    assert.match(siteProblems(files, { sha: SHA, forbidden: [] }).join('\n'), /CDS-28/);
});

test('a missing or stub report is a problem', () => {
    const missing = good().filter((f) => f.path !== 'report/index.html');
    assert.match(siteProblems(missing, { sha: SHA, forbidden: [] }).join('\n'), /report\/index\.html/);
    const stub = good().map((f) => (f.path === 'report/index.html' ? { ...f, text: '<html></html>' } : f));
    assert.match(siteProblems(stub, { sha: SHA, forbidden: [] }).join('\n'), /too small/);
});

test('a stamp for another commit is a problem, and so is no stamp', () => {
    const other = good().map((f) => (f.path === 'report/commit.txt' ? { ...f, text: 'commit: ffffffffffffffffffffffffffffffffffffffff\n' } : f));
    assert.match(siteProblems(other, { sha: SHA, forbidden: [] }).join('\n'), /commit\.txt/);
    const none = good().filter((f) => f.path !== 'report/commit.txt');
    assert.match(siteProblems(none, { sha: SHA, forbidden: [] }).join('\n'), /commit\.txt/);
});

test('anything beside the board and the report is a problem', () => {
    const files = [...good(), { path: 'DOCS/backlog.md', text: '# x' }, { path: 'secrets.txt', text: 'x' }];
    const problems = siteProblems(files, { sha: SHA, forbidden: [] });
    assert.equal(problems.length, 2);
    assert.match(problems.join('\n'), /DOCS\/backlog\.md/);
});

test('the control key or a token in any file is a problem that names the file, not the value', () => {
    const files = [...good(), { path: 'report/leak.js', text: 'var k = "harness-run-key";' }, { path: 'report/h.html', text: 'Authorization: Bearer abcdef123' }];
    const problems = siteProblems(files, { sha: SHA, forbidden: ['harness-run-key'] });
    assert.equal(problems.length, 2);
    assert.doesNotMatch(problems.join('\n'), /abcdef123|"harness-run-key"/);
});

test('a file under report/ that is not a kind the report holds is a problem, wherever it hides (B-06)', () => {
    for (const path of ['report/notes.log', 'report/secrets.env', 'report/openapi.yaml', 'report/x.md', 'report/.git/config']) {
        const problems = siteProblems([...good(), { path, text: 'x' }], { sha: SHA, forbidden: [] });
        assert.equal(problems.length, 1, path);
        assert.match(problems[0], new RegExp(path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')));
    }
});

test('the key, a bearer token and a service token are found in any kind of file, not only the listed ones (B-06)', () => {
    const files = [
        ...good(),
        { path: 'report/notes.log', text: 'harness-run-key' },
        { path: 'report/x.md', text: 'Authorization: Bearer abcdefgh1234' },
        { path: 'report/t.html', text: 'tok_0123456789abcdef0123456789abcdef' },
    ];
    const problems = siteProblems(files, { sha: SHA, forbidden: ['harness-run-key'] });
    assert.equal(problems.filter((p) => /holds the run's control key|holds a bearer token|holds a service token/.test(p)).length, 3);
});

test('a file too large to be looked at is a problem (B-06)', () => {
    const problems = siteProblems([...good(), { path: 'report/big.js', text: '', tooLarge: true }], { sha: SHA, forbidden: [] });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /report\/big\.js/);
    assert.match(problems[0], /too large/);
});

test('a file named like an image whose bytes are not one is a problem of the site (CDS-48 C-06)', () => {
    const problems = siteProblems([...good(), { path: 'report/a.png', text: 'plain text', problem: 'report/a.png is named like an image or a font but is not one' }], { sha: SHA, forbidden: [] });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /named like an image/);
});

test('a stamp that only starts with the commit is a problem: the whole commit, on its own line (N-3)', () => {
    const files = (stamp: string) => good().map((f) => (f.path === 'report/commit.txt' ? { ...f, text: stamp } : f));
    assert.match(siteProblems(files(`commit: ${SHA}0\n`), { sha: SHA, forbidden: [] }).join('\n'), /commit\.txt/);
    assert.match(siteProblems(files(`commit: ${SHA.slice(0, 10)}\n`), { sha: SHA, forbidden: [] }).join('\n'), /commit\.txt/);
    assert.match(siteProblems(files(`note commit: ${SHA}\n`), { sha: SHA, forbidden: [] }).join('\n'), /commit\.txt/);
    assert.deepEqual(siteProblems(files(`run: 1\ncommit: ${SHA}\n`), { sha: SHA, forbidden: [] }), []);
});

test('a commit given as less than a full hash is a problem of its own (N-3)', () => {
    const problems = siteProblems(good().map((f) => (f.path === 'report/commit.txt' ? { ...f, text: 'commit: abc123\n' } : f)), { sha: 'abc123', forbidden: [] });
    assert.match(problems.join('\n'), /full 40-character commit/);
});
