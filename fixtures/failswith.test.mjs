// version: 2 | created: 2026-10-22T16:00Z | project: credit-dashboard-sut | type: test | language: en-GB
// The registry's recorded failure text must tell a flag's defect from a broken page (CDS-48, review finding A-02).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { whyTooGeneric } from './failswith.mjs';

test('a text that names a value, a place or a message of the defect is specific', () => {
  for (const text of ['49 !== 50', 'Received string: 19827960', "has content type 'text/plain'", 'found 3 tab(s) and 3 top link(s)', "the browser left the site: it is at '"]) {
    assert.equal(whyTooGeneric(text, 'scenario'), null, text);
  }
});

test('a bare word of any assertion failure is too generic', () => {
  for (const text of ['Expected', 'AssertionError', 'assertionerror', 'Error', 'failed', 'Timeout', '  ', '']) {
    assert.notEqual(whyTooGeneric(text, 'scenario'), null, JSON.stringify(text));
  }
});

test('a timeout waiting for an element to be present is too generic: a broken page prints it too', () => {
  const text = 'Timeout of 5s has expired while waiting for <<detail-header>>.isPresent() to equal true';
  assert.match(whyTooGeneric(text, 'scenario') ?? '', /presence timeout/);
});

test('the presence timeout is refused wherever it is in the text, with or without its end (CDS-48 C-03)', () => {
  for (const text of [
    'AssertionError: Timeout of 5s has expired while waiting for <<detail-header>>.isPresent() to equal true',
    'Timeout of 5s has expired while waiting for <<detail-header>>.isPresent()',
    'LogicError: Timeout of 30s has expired while waiting for <<x>>',
    'waiting for <<detail-header>>.isPresent() to equal true',
  ]) {
    assert.match(whyTooGeneric(text, 'scenario') ?? '', /presence timeout/, text);
  }
});

test('a text made only of the words of any failure and a number is too generic (CDS-48 C-03)', () => {
  for (const text of ['Timeout of 5s', 'Expected 1', 'Error: 5', 'AssertionError: Expected', 'AssertionError: Expected 3 but received 4', 'LogicError: failed']) {
    assert.notEqual(whyTooGeneric(text, 'scenario'), null, text);
  }
});

test('a text with a value of its own, or any other word, stays specific', () => {
  for (const text of ['49 !== 50', 'Expected 1 row to say Mortgage', 'Received string: 19827960', 'has aria-valuenow 13 but the text beside it says 6%']) {
    assert.equal(whyTooGeneric(text, 'scenario'), null, text);
  }
});

test('an image name alone is too generic for every kind of catcher but a visual check, which is a page-changed catch', () => {
  assert.notEqual(whyTooGeneric('overview-1280-light-actual.png', 'scenario'), null);
  assert.notEqual(whyTooGeneric('overview-1280-light-actual.png', 'exit-check'), null);
  assert.equal(whyTooGeneric('overview-1280-light-actual.png', 'visual-check'), null);
});
