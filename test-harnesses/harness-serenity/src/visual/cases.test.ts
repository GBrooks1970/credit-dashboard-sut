// version: 1 | created: 2026-10-19T09:45Z | project: credit-dashboard-sut | type: test | language: en-GB
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { allTargets } from '../exit/targets.js';
import { baselineProblems, visualCases } from './cases.js';

test('there are 32 cases with 32 different file names', () => {
    const cases = visualCases();
    assert.equal(cases.length, 32);
    assert.equal(new Set(cases.map((c) => c.file)).size, 32);
});

test('every page is a target of the exit checks, and none has a state to arrange', () => {
    for (const { page } of visualCases()) {
        const target = allTargets.find((t) => t.name === page);
        assert.ok(target, `no exit-check target is named '${page}'`);
        assert.equal(target.act, undefined, `'${page}' needs an action, so it is a state of a page`);
        assert.equal(target.failing, undefined, `'${page}' fails a call, so it is an error state`);
    }
});

test('the exact set of baselines has no problem', () => {
    assert.deepEqual(baselineProblems(visualCases().map((c) => c.file)), []);
});

test('a missing baseline is a problem, not a pass', () => {
    const files = visualCases().map((c) => c.file);
    assert.deepEqual(baselineProblems(files.slice(1)), [`missing baseline ${files[0]}`]);
});

test('an extra file is a problem, whatever it is', () => {
    const files = visualCases().map((c) => c.file);
    assert.deepEqual(baselineProblems([...files, 'profile-768-light.png', 'notes.txt']), ['unexpected file in the baseline folder: profile-768-light.png', 'unexpected file in the baseline folder: notes.txt']);
});

test('an empty folder is 32 problems', () => {
    assert.equal(baselineProblems([]).length, 32);
});
