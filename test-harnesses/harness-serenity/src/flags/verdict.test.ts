import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { judgeOff, judgeOn, verdictOf, type RunResult } from './verdict.js';

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
