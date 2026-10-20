// version: 1 | created: 2026-10-20T07:15Z | project: credit-dashboard-sut | type: test | language: en-GB
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resetWithRetry } from './reset.js';

const dropped = () => Object.assign(new TypeError('fetch failed'), { cause: new Error('other side closed') });
const options = { flag: 'pii-in-title', logTail: () => 'last line of the log' };

/** A send that answers each call from the list: a number is a status, an Error is thrown. */
function sequence(...answers: (number | Error)[]) {
    let calls = 0;
    const send = async () => {
        const answer = answers[Math.min(calls++, answers.length - 1)];
        if (answer instanceof Error) throw answer;
        return answer;
    };
    return { send, calls: () => calls };
}

test('a 204 on the first try is success, with one call', async () => {
    const s = sequence(204);
    assert.deepEqual(await resetWithRetry(s.send, options), { ok: true });
    assert.equal(s.calls(), 1);
});

test('one dropped connection is retried, and a 204 after it is success', async () => {
    const s = sequence(dropped(), 204);
    assert.deepEqual(await resetWithRetry(s.send, options), { ok: true });
    assert.equal(s.calls(), 2);
});

test('two dropped connections fail with the flag, the error and the log tail, and never throw', async () => {
    const s = sequence(dropped(), dropped());
    const result = await resetWithRetry(s.send, options);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.message, /pii-in-title/);
    assert.match(result.message, /other side closed/);
    assert.match(result.message, /last line of the log/);
    assert.equal(s.calls(), 2);
});

test('a status that is not 204 fails at once and is not retried', async () => {
    const s = sequence(500, 204);
    const result = await resetWithRetry(s.send, options);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.message, /500/);
    assert.match(result.message, /pii-in-title/);
    assert.equal(s.calls(), 1);
});

test('a 204 is never mistaken for a failure after a drop and a 500 is not hidden by the retry', async () => {
    const s = sequence(dropped(), 500);
    const result = await resetWithRetry(s.send, options);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.message, /500/);
});
