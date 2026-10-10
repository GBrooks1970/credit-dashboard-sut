import assert from 'node:assert/strict';

import { Then } from '@cucumber/cucumber';

import { scenario } from '../support/world.js';

/** Every Then reads the last response and never makes a call (design section 5). */
function last() {
    const response = scenario.state.last;
    assert.ok(response, 'No response: a When step must come before this Then');
    assert.equal(response.status, 200, `Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
    return response.body;
}

Then('the score is {count} out of {count}', (score: number, max: number) => {
    const body = last();
    assert.equal(body.current, score);
    assert.equal(body.max, max);
});

Then('the national and local averages are each between {count} and {count}', (low: number, high: number) => {
    const body = last();
    for (const average of [body.nationalAverage, body.localAverage]) {
        assert.ok(average >= low && average <= high, `Average ${average} is outside ${low} to ${high}`);
    }
});

Then('{count} monthly points are returned', (count: number) => {
    assert.equal(last().length, count);
});

Then('the score for {month} is missing', (month: string) => {
    const point = last().find((p: { month: string }) => p.month === month);
    assert.ok(point, `The history has no entry for ${month}`);
    assert.equal(point.score, null);
});
