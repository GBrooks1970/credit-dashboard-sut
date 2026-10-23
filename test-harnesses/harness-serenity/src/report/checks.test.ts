// version: 3 | created: 2026-10-20T09:00Z | project: credit-dashboard-sut | type: test | language: en-GB
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { executionsOf, reportProblems, secretProblems, type Recorded } from './checks.js';
import type { Expected } from './manifest.js';

const plain = (name: string, result = 'SUCCESS') => JSON.stringify({ id: name, name, result, testSteps: [] });
const outline = (name: string, results: string[]) => JSON.stringify({ id: name, name, dataTable: { headers: ['x'], rows: results.map((r) => ({ values: ['1'], result: r })) }, testSteps: [] });
const file = (name: string, text: string): Recorded => ({ name, text });
const scenario = (name: string): Expected => ({ name, outline: false, rows: 0 });
const outlineOf = (name: string, rows: number): Expected => ({ name, outline: true, rows });
const input = (api: Recorded[], ui: Recorded[], expected: { api: Expected[]; ui: Expected[] } = { api: [scenario('a'), outlineOf('o', 1)], ui: [scenario('u')] }) => ({ api, ui, expected, forbidden: ['harness-run-key'] });

test('a scenario is one execution, and an outline is one per row', () => {
    assert.deepEqual(executionsOf(plain('a')), ['SUCCESS']);
    assert.deepEqual(executionsOf(outline('o', ['SUCCESS', 'FAILURE', 'SUCCESS'])), ['SUCCESS', 'FAILURE', 'SUCCESS']);
});

test('a report with the scenarios of the features, all successful, has no problem', () => {
    assert.deepEqual(reportProblems(input([file('a.json', plain('a')), file('o.json', outline('o', ['SUCCESS']))], [file('u.json', plain('u'))])), []);
});

test('a failed execution is a problem that names the scenario and the result', () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('o.json', outline('Outline one', ['SUCCESS', 'FAILURE']))], [file('u.json', plain('u'))], { api: [scenario('a'), outlineOf('Outline one', 2)], ui: [scenario('u')] }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /api/);
    assert.match(problems[0], /Outline one/);
    assert.match(problems[0], /FAILURE/);
});

test('a skipped or pending execution is a problem, not a pass', () => {
    const problems = reportProblems(input([file('a.json', plain('a', 'PENDING')), file('o.json', outline('o', ['SUCCESS']))], [file('u.json', plain('u', 'SKIPPED'))]));
    assert.equal(problems.length, 2);
});

test("Serenity writes an apostrophe in a name as &apos;: the name still matches the feature's (found on the real JSON)", () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('o.json', outline('o', ['SUCCESS'])), file('c.json', plain('Another customer&apos;s account &amp; more &quot;x&quot;'))], [file('u.json', plain('u'))], { api: [scenario('a'), outlineOf('o', 1), scenario("Another customer's account & more \"x\"")], ui: [scenario('u')] }));
    assert.deepEqual(problems, []);
});

test('a scenario that dropped out is a problem that names it (B-07)', () => {
    const problems = reportProblems(input([file('a.json', plain('a'))], [file('u.json', plain('u'))]));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /api/);
    assert.match(problems[0], /'o'/);
    assert.match(problems[0], /in the features but not in the report/);
});

test('a scenario the features do not have is a problem that names it', () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('o.json', outline('o', ['SUCCESS'])), file('x.json', plain('Extra scenario'))], [file('u.json', plain('u'))]));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /'Extra scenario'/);
    assert.match(problems[0], /in the report but not in the features/);
});

test('a dropped scenario and an added outline row no longer cancel out: the counts matched, the names do not (B-07)', () => {
    // The features: a, and an outline o of one row. The report: no a, and o with two rows. Two executions each way.
    const problems = reportProblems(input([file('o.json', outline('o', ['SUCCESS', 'SUCCESS']))], [file('u.json', plain('u'))]));
    assert.equal(problems.length, 2);
    assert.match(problems.join('\n'), /'a' is in the features but not in the report/);
    assert.match(problems.join('\n'), /'o' has 2 executions in the report and the features give 1/);
});

test('a scenario recorded twice is a problem', () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('a2.json', plain('a')), file('o.json', outline('o', ['SUCCESS']))], [file('u.json', plain('u'))]));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /'a'/);
});

test('a file that is not JSON is a problem, and is not counted', () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('o.json', outline('o', ['SUCCESS'])), file('broken.json', '{not json')], [file('u.json', plain('u'))]));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /broken\.json/);
});

test('the control key in a file is a problem that names the file and not the value', () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('o.json', outline('o', ['SUCCESS'])), file('leak.json', JSON.stringify({ name: 'leak', result: 'SUCCESS', note: 'x-test-control-key: harness-run-key' }))], [file('u.json', plain('u'))], { api: [scenario('a'), outlineOf('o', 1), scenario('leak')], ui: [scenario('u')] }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /leak\.json/);
    assert.doesNotMatch(problems[0], /harness-run-key/);
});

const secrets = (text: string) => secretProblems([file('f.txt', text)], ['harness-run-key']);

test('a bearer token and a signed-token shape in a file are problems', () => {
    assert.equal(secrets('Authorization: Bearer abc123').length, 1);
    assert.equal(secrets('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGV4In0.c2ln').length, 1);
});

test('the service token shape, tok_ and 32 hex characters, in a step is a problem (B-06)', () => {
    const problems = secrets('{"token":"tok_0123456789abcdef0123456789abcdef"}');
    assert.equal(problems.length, 1);
    assert.match(problems[0], /a service token/);
    assert.doesNotMatch(problems[0], /0123456789abcdef/);
    assert.equal(secrets('tok_short').length, 0);
});

test('the control key in base64, at any alignment, in standard or URL-safe form, is a problem (B-06)', () => {
    const key = 'harness-run-key';
    for (const prefix of ['', 'a', 'ab']) {
        const encoded = Buffer.from(prefix + key).toString('base64');
        assert.equal(secrets(`value=${encoded}`).length, 1, `prefix '${prefix}'`);
        assert.equal(secrets(`value=${encoded.replace(/\+/g, '-').replace(/\//g, '_')}`).length, 1, `url-safe, prefix '${prefix}'`);
    }
});

test('a file too large to be looked at is a problem, not a pass (B-06)', () => {
    const problems = secretProblems([{ name: 'big.log', text: '', tooLarge: true }], ['harness-run-key']);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /big\.log/);
    assert.match(problems[0], /too large/);
});

test('the public demo password is not a secret', () => {
    assert.deepEqual(reportProblems(input([file('a.json', plain('a')), file('o.json', outline('o', ['SUCCESS'])), file('b.json', JSON.stringify({ name: 'b', result: 'SUCCESS', step: 'Alex enters "demo-only"' }))], [file('u.json', plain('u'))], { api: [scenario('a'), outlineOf('o', 1), scenario('b')], ui: [scenario('u')] })), []);
});

test('the control key written in other ways is a problem: JSON-escaped, entity-escaped, hex-encoded (CDS-48 C-06)', () => {
    assert.equal(secrets('{"k":"\\u0068arness-run-key"}').length, 1);
    assert.equal(secrets('<p>&#104;arness-run-key</p>').length, 1);
    assert.equal(secrets('<p>&#x68;arness-run-key</p>').length, 1);
    assert.equal(secrets('h=' + Buffer.from('harness-run-key').toString('hex')).length, 1);
    assert.equal(secrets('h=' + Buffer.from('harness-run-key').toString('hex').toUpperCase()).length, 1);
});

test('a problem the reader found with a file, such as a name that disagrees with its bytes, is reported with the scan (CDS-48 C-06)', () => {
    const problems = secretProblems([{ name: 'report/a.png', text: 'x', problem: 'report/a.png is named like an image or a font but is not one' }], ['harness-run-key']);
    assert.deepEqual(problems, ['report/a.png is named like an image or a font but is not one']);
});

test('a bearer token and a service token are found in any case (CDS-48 C-06)', () => {
    assert.equal(secrets('authorization: bearer abcdefgh1234').length, 1);
    assert.equal(secrets('BEARER abcdefgh1234').length, 1);
    assert.equal(secrets('TOK_0123456789ABCDEF0123456789abcdef').length, 1);
});
