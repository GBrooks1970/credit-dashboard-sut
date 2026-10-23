import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { exitCheckRan, judgeOff, judgeOn, matchedLine, verdictOf, visualTitlePattern, vitestExecuted, type RunResult } from './verdict.js';

// The ways the review (CDS-38) fooled the flag proof, each as a case it must now refuse (B-02, B-03, B-07, B-08).

const run = (over: Partial<RunResult>): RunResult => ({ passed: true, ran: true, timedOut: false, output: '', ...over });
const STATED = "at '/balance/amountMinor': must be integer";

describe('the flag proof, one run', () => {
    it('credits a catch only for the stated failure (B-02: a float in utilisation is a different integer violation)', () => {
        const other = run({ passed: false, output: "does not match the contract at '/utilisation': must be integer" });
        assert.equal(judgeOn(other, STATED), 'failed-for-another-reason');
        const stated = run({ passed: false, output: `does not match the contract ${STATED}` });
        assert.equal(judgeOn(stated, STATED), 'failed-as-stated');
    });

    it('does not trust a failure text that the run without the flag also prints (B-03: a scenario title)', () => {
        const title = 'Another customers account cannot be found';
        const off = run({ passed: true, output: `Scenario: ${title}\n  ok` });
        assert.equal(judgeOff(off, title), 'failed-for-another-reason');
        assert.equal(verdictOf([{ off: judgeOff(off, title), on: 'failed-as-stated' }]), 'false-alarm');
    });

    it('does not count a failure that never ran anything (B-07: a code frame holding the text)', () => {
        const crash = run({ passed: false, ran: false, output: 'TypeError at flags.test.tsx:32  Updates in 1 days' });
        assert.equal(judgeOn(crash, 'Updates in 1 days'), 'did-not-run');
        assert.equal(verdictOf([{ off: 'passed', on: 'did-not-run' }]), 'not-caught');
    });

    it('does not count a run with the flag off that ran nothing as a pass', () => {
        assert.equal(judgeOff(run({ ran: false }), 'x'), 'did-not-run');
        assert.equal(verdictOf([{ off: 'did-not-run', on: 'failed-as-stated' }]), 'false-alarm');
    });

    it('names a timeout as its own outcome and verdict (B-08)', () => {
        const hung = run({ passed: false, timedOut: true });
        assert.equal(judgeOn(hung, 'x'), 'timed-out');
        assert.equal(judgeOff(hung, 'x'), 'timed-out');
        assert.equal(verdictOf([{ off: 'passed', on: 'timed-out' }]), 'timed-out');
    });

    it('is not caught when the catcher passes with the flag on', () => {
        assert.equal(judgeOn(run({ passed: true }), 'x'), 'passed');
        assert.equal(verdictOf([{ off: 'passed', on: 'passed' }]), 'not-caught');
    });

    it('is caught for another reason when the only failure is not the stated one', () => {
        assert.equal(verdictOf([{ off: 'passed', on: 'failed-for-another-reason' }]), 'caught-for-another-reason');
    });

    it('is caught when one catcher fails as stated and none misbehaves with the flag off', () => {
        assert.equal(verdictOf([{ off: 'passed', on: 'failed-for-another-reason' }, { off: 'passed', on: 'failed-as-stated' }]), 'caught');
    });
});

describe('whether an exit-check run looked at anything (CDS-41)', () => {
    it('did, when its closing line counts at least one scan or layout check', () => {
        assert.equal(exitCheckRan('x' + String.fromCharCode(10) + 'exit checks: 2 axe scans and 6 layout checks; 0 problem(s)'), true);
        assert.equal(exitCheckRan('exit checks: 0 axe scans and 1 layout checks; 0 problem(s)'), true);
    });

    it('did not, when it checked nothing or printed no closing line', () => {
        assert.equal(exitCheckRan('exit checks: 0 axe scans and 0 layout checks; 0 problem(s)'), false);
        assert.equal(exitCheckRan("exit checks: CDS_EXIT_ONLY='zzz' matches no target"), false);
        assert.equal(exitCheckRan(''), false);
    });
});

describe('a visual catcher is a page-changed catch, not a reason (CDS-48, review findings A-02 and B-08)', () => {
    it('does not make a flag caught for the stated reason on its own', () => {
        assert.equal(verdictOf([{ off: 'passed', on: 'failed-as-stated', kind: 'visual-check' }]), 'page-changed-only');
    });

    it('is only a second catcher beside one that names the reason', () => {
        assert.equal(
            verdictOf([
                { off: 'passed', on: 'failed-as-stated', kind: 'exit-check' },
                { off: 'passed', on: 'failed-as-stated', kind: 'visual-check' },
            ]),
            'caught',
        );
    });

    it('still raises a false alarm when the visual catcher fails with the flag off', () => {
        assert.equal(
            verdictOf([
                { off: 'passed', on: 'failed-as-stated', kind: 'scenario' },
                { off: 'failed-for-another-reason', on: 'failed-as-stated', kind: 'visual-check' },
            ]),
            'false-alarm',
        );
    });

    it('is not caught when the only catcher is a visual one that does not fail', () => {
        assert.equal(verdictOf([{ off: 'passed', on: 'passed', kind: 'visual-check' }]), 'not-caught');
    });
});

describe('the number of tests a Vitest run executed (CDS-48 A-02: one test, not every test whose name contains the text)', () => {
    it('counts passed and failed tests and leaves the skipped ones out', () => {
        assert.equal(vitestExecuted(' Test Files  1 passed (1)\n      Tests  1 passed | 6 skipped (7)'), 1);
        assert.equal(vitestExecuted('      Tests  1 failed | 1 passed | 5 skipped (7)'), 2);
        assert.equal(vitestExecuted('      Tests  2 failed (2)'), 2);
    });

    it('is zero when no Tests line is there', () => {
        assert.equal(vitestExecuted('Error: no test files found'), 0);
    });
});

describe('the line that shows what a catcher failed with (CDS-48 B-01: kept in the proof table)', () => {
    it('is the first line that holds the recorded text, trimmed', () => {
        const output = ['  start', '   AssertionError: the browser left the site: it is at x   ', 'later the browser left the site: it is at y'].join('\n');
        assert.equal(matchedLine(output, 'the browser left the site'), 'AssertionError: the browser left the site: it is at x');
    });

    it('is cut at 300 characters', () => {
        assert.equal(matchedLine('x'.repeat(500), 'xxx')?.length, 300);
    });

    it('is null when the text is not there', () => {
        assert.equal(matchedLine('nothing here', 'absent'), null);
    });
});

describe('the title of a visual case, as a pattern for `-g` (CDS-48 C-13)', () => {
    it('selects its own case', () => {
        assert.equal(new RegExp(visualTitlePattern(375, 'light', 'overview')).test('375px, light overview'), true);
    });

    it('does not select another case that only starts with the same words', () => {
        assert.equal(new RegExp(visualTitlePattern(375, 'light', 'overview')).test('375px, light overview: tab-bar'), false);
        assert.equal(new RegExp(visualTitlePattern(375, 'light', 'account list: creditcard')).test('375px, light account list: creditcard 2'), false);
    });

    it('takes the page name literally, whatever characters it holds', () => {
        assert.equal(new RegExp(visualTitlePattern(1280, 'dark', 'account list: creditcard')).test('1280px, dark account list: creditcard'), true);
        assert.equal(new RegExp(visualTitlePattern(1280, 'dark', 'a.c')).test('1280px, dark abc'), false);
    });
});
