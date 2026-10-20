// version: 1 | created: 2026-10-20T09:00Z | project: credit-dashboard-sut | type: test | language: en-GB
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { executionsOf, reportProblems, type Recorded } from './checks.js';

const plain = (name: string, result = 'SUCCESS') => JSON.stringify({ id: name, name, result, testSteps: [] });
const outline = (name: string, results: string[]) => JSON.stringify({ id: name, name, dataTable: { headers: ['x'], rows: results.map((r) => ({ values: ['1'], result: r })) }, testSteps: [] });
const file = (name: string, text: string): Recorded => ({ name, text });
const input = (api: Recorded[], ui: Recorded[], expected = { api: 2, ui: 1 }) => ({ api, ui, expected, forbidden: ['harness-run-key'] });

test('a scenario is one execution, and an outline is one per row', () => {
    assert.deepEqual(executionsOf(plain('a')), ['SUCCESS']);
    assert.deepEqual(executionsOf(outline('o', ['SUCCESS', 'FAILURE', 'SUCCESS'])), ['SUCCESS', 'FAILURE', 'SUCCESS']);
});

test('a report with the expected executions, all successful, has no problem', () => {
    assert.deepEqual(reportProblems(input([file('a.json', plain('a')), file('o.json', outline('o', ['SUCCESS']))], [file('u.json', plain('u'))])), []);
});

test('a failed execution is a problem that names the scenario and the result', () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('o.json', outline('Outline one', ['SUCCESS', 'FAILURE']))], [file('u.json', plain('u'))], { api: 3, ui: 1 }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /api/);
    assert.match(problems[0], /Outline one/);
    assert.match(problems[0], /FAILURE/);
});

test('a skipped or pending execution is a problem, not a pass', () => {
    const problems = reportProblems(input([file('a.json', plain('a', 'PENDING')), file('b.json', plain('b'))], [file('u.json', plain('u', 'SKIPPED'))]));
    assert.equal(problems.length, 2);
});

test('too few executions is a problem that gives both numbers', () => {
    const problems = reportProblems(input([file('a.json', plain('a'))], [file('u.json', plain('u'))]));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /api/);
    assert.match(problems[0], /1/);
    assert.match(problems[0], /2/);
});

test('too many executions is a problem as well', () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('b.json', plain('b')), file('c.json', plain('c'))], [file('u.json', plain('u'))]));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /3/);
});

test('a file that is not JSON is a problem, and is not counted', () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('b.json', plain('b')), file('broken.json', '{not json')], [file('u.json', plain('u'))]));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /broken\.json/);
});

test('the control key in a file is a problem that names the file and not the value', () => {
    const problems = reportProblems(input([file('a.json', plain('a')), file('leak.json', JSON.stringify({ name: 'leak', result: 'SUCCESS', note: 'x-test-control-key: harness-run-key' }))], [file('u.json', plain('u'))]));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /leak\.json/);
    assert.doesNotMatch(problems[0], /harness-run-key/);
});

test('a bearer token and a signed-token shape in a file are problems', () => {
    const bearer = reportProblems(input([file('a.json', plain('a')), file('b.json', JSON.stringify({ name: 'b', result: 'SUCCESS', h: 'Authorization: Bearer abc123' }))], [file('u.json', plain('u'))]));
    assert.equal(bearer.length, 1);
    const jwt = reportProblems(input([file('a.json', plain('a')), file('b.json', JSON.stringify({ name: 'b', result: 'SUCCESS', t: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGV4In0.c2ln' }))], [file('u.json', plain('u'))]));
    assert.equal(jwt.length, 1);
});

test('the public demo password is not a secret', () => {
    assert.deepEqual(reportProblems(input([file('a.json', plain('a')), file('b.json', JSON.stringify({ name: 'b', result: 'SUCCESS', step: 'Alex enters "demo-only"' }))], [file('u.json', plain('u'))])), []);
});
