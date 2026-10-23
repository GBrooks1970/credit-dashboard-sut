// version: 3 | created: 2026-10-19T09:45Z | project: credit-dashboard-sut | type: test | language: en-GB
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { allTargets } from '../exit/targets.js';
import { baselineProblems, visualCases } from './cases.js';

test('there are 34 cases with 34 different file names: 32 pages and 2 shots of the tab bar', () => {
    const cases = visualCases();
    assert.equal(cases.length, 34);
    assert.equal(new Set(cases.map((c) => c.file)).size, 34);
    assert.equal(cases.filter((c) => c.shot === 'page').length, 32);
    assert.equal(cases.filter((c) => c.shot === 'tab-bar').length, 2);
});

test('the tab bar is photographed at 375 px, once in each theme (CDS-48 B-04)', () => {
    const bars = visualCases().filter((c) => c.shot === 'tab-bar');
    assert.deepEqual(bars.map((c) => [c.width, c.theme, c.file]), [[375, 'light', 'tab-bar-375-light.png'], [375, 'dark', 'tab-bar-375-dark.png']]);
});

test('the bar is hidden in exactly the 16 whole-page shots at 375 px: at 1280 px it is left, so a bar that should not be there shows (CDS-48 C-01)', () => {
    const hidden = visualCases().filter((c) => c.hideBar);
    assert.equal(hidden.length, 16);
    for (const c of hidden) {
        assert.equal(c.shot, 'page', c.file);
        assert.equal(c.width, 375, c.file);
    }
    assert.equal(visualCases().filter((c) => c.shot === 'page' && c.width === 375).every((c) => c.hideBar), true);
    assert.equal(visualCases().filter((c) => c.width === 1280).some((c) => c.hideBar), false);
    assert.equal(visualCases().filter((c) => c.shot === 'tab-bar').some((c) => c.hideBar), false);
});

test("the bar's shot is the screen, not a crop of the bar: its place is in the image (CDS-48 C-01)", () => {
    for (const c of visualCases().filter((x) => x.shot === 'tab-bar')) assert.equal(c.fullPage, false, c.file);
    for (const c of visualCases().filter((x) => x.shot === 'page')) assert.equal(c.fullPage, true, c.file);
});

test('every page is a target of the exit checks, and none has a state to arrange', () => {
    for (const { target: name } of visualCases()) {
        const target = allTargets.find((t) => t.name === name);
        assert.ok(target, `no exit-check target is named '${name}'`);
        assert.equal(target.act, undefined, `'${name}' needs an action, so it is a state of a page`);
        assert.equal(target.failing, undefined, `'${name}' fails a call, so it is an error state`);
        assert.equal(target.patch, undefined, `'${name}' changes a response, so it is not the page as served`);
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

test('an empty folder is 34 problems', () => {
    assert.equal(baselineProblems([]).length, 34);
});
