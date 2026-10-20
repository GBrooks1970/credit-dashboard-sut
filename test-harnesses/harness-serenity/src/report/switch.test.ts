// version: 1 | created: 2026-10-20T23:40Z | project: credit-dashboard-sut | type: test | language: en-GB
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { writesSerenityJson } from './switch.js';

test('a whole run, marked on by run.mjs, writes the Serenity JSON', () => {
    assert.equal(writesSerenityJson({ HARNESS_SERENITY_JSON: 'on' }), true);
});

test('a run that was not marked does not write it: no variable, off, any other text, the empty string', () => {
    for (const value of [undefined, 'off', 'ON', 'On', 'true', '1', '', ' on']) {
        assert.equal(writesSerenityJson({ HARNESS_SERENITY_JSON: value }), false, `'${value}'`);
    }
    assert.equal(writesSerenityJson({}), false);
});
