// version: 1 | created: 2026-10-23T09:00Z | project: credit-dashboard-sut | type: test | language: en-GB
// The manifest of scenarios derived from the feature files (CDS-48 B-07).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { scenariosOf } from './manifest.js';

test('a scenario is one execution, and its name is the text after the keyword', () => {
    assert.deepEqual(scenariosOf('Feature: f\n\n  @api\n  Scenario: A card in credit\n    Given x\n'), [{ name: 'A card in credit', outline: false, rows: 0 }]);
});

test('an outline has a row for each line of its examples after the header', () => {
    const text = ['Feature: f', '  Scenario Outline: A code is valid for <n> minutes', '    Given x <n>', '    Examples:', '      | n |', '      | 1 |', '      | 2 |', '      | 3 |', ''].join('\n');
    assert.deepEqual(scenariosOf(text), [{ name: 'A code is valid for <n> minutes', outline: true, rows: 3 }]);
});

test('several examples blocks add up, comments and tags between them do not end the count, and the next scenario does', () => {
    const text = [
        'Feature: f',
        '  Scenario Outline: O',
        '    Given x <n>',
        '    Examples: first',
        '      | n |',
        '      | 1 |',
        '      # a comment',
        '      | 2 |',
        '',
        '    @tag',
        '    Examples: second',
        '      | n |',
        '      | 3 |',
        '  Scenario: After',
        '    Given y',
    ].join('\n');
    assert.deepEqual(scenariosOf(text), [{ name: 'O', outline: true, rows: 3 }, { name: 'After', outline: false, rows: 0 }]);
});

test('a background and steps are not scenarios; a scenario template and an example are', () => {
    const text = 'Feature: f\n  Background:\n    Given z\n  Example: One\n    Given x\n  Scenario Template: Two <a>\n    Given x\n    Examples:\n      | a |\n      | 1 |\n';
    assert.deepEqual(scenariosOf(text).map((s) => s.name), ['One', 'Two <a>']);
});
