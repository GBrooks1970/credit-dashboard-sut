// version: 1 | created: 2026-10-20T13:35Z | project: credit-dashboard-sut | type: test | language: en-GB
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
