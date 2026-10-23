// version: 2 | created: 2026-10-20T09:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// What the published Serenity report must satisfy before anyone reads it (CDS-44, P6a): every execution of the two suites is in the Serenity
// JSON, none failed or was skipped, the scenarios are the scenarios of the feature files, by name and by rows per outline (a scenario or a file
// that silently dropped out would otherwise still end green; CDS-48 B-07), every file parses, and no file holds the run's control key, a token, or
// the key in base64 (CDS-48 B-06). A pure module, so the ways the check could be
// fooled are unit tests (checks.test.ts). The files are read, and the HTML generated, by scripts/check-report.mjs and scripts/report.mjs.

import type { Expected } from './manifest.js';

export interface Recorded {
    /** The file's name, for the message. */
    name: string;
    /** Its text. */
    text: string;
    /** True when the file is text but too large to be read: the scan reports it, since a file not read is a file not checked. */
    tooLarge?: boolean;
}

export interface ReportInput {
    api: Recorded[];
    ui: Recorded[];
    /** The scenarios each suite runs, derived from its feature files (manifest.ts). */
    expected: { api: Expected[]; ui: Expected[] };
    /** Strings that must not appear in any file: the run's control key. */
    forbidden: string[];
}

/** A signed token (three base64url parts) or an Authorization header with a bearer token: what a recording of a call might hold. */
const TOKEN_SHAPES: { label: string; pattern: RegExp }[] = [
    { label: 'a bearer token', pattern: /Bearer\s+[A-Za-z0-9._~+/-]{6,}/ },
    { label: 'a signed token', pattern: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/ },
    // What the service issues (Control/Authentication.cs: "tok_" and 32 hex characters).
    { label: 'a service token', pattern: /tok_[0-9a-f]{32}/ },
];

/**
 * The base64 of a secret as it can appear inside longer base64 text: the three alignments, standard and URL-safe, without the characters at
 * either end that depend on what comes before or after.
 */
function base64Forms(secret: string): string[] {
    const forms: string[] = [];
    for (let pad = 0; pad < 3; pad++) {
        const encoded = Buffer.from('x'.repeat(pad) + secret).toString('base64').replace(/=+$/, '');
        const middle = encoded.slice(Math.ceil((pad * 4) / 3), Math.max(0, encoded.length - 2));
        if (middle.length < 8) continue;
        forms.push(middle, middle.replace(/\+/g, '-').replace(/\//g, '_'));
    }
    return forms;
}

/** The result of each execution in one scenario's JSON: one for a scenario, one per row for an outline. Throws when the text is not JSON. */
export function executionsOf(text: string): string[] {
    const outcome = JSON.parse(text) as { result?: string; dataTable?: { rows?: { result?: string }[] } };
    const rows = outcome.dataTable?.rows;
    if (rows && rows.length > 0) return rows.map((row) => row.result ?? 'UNKNOWN');
    return [outcome.result ?? 'UNKNOWN'];
}

/** Serenity writes an apostrophe, an ampersand and a quote in a name as an HTML entity: the feature file has the character. */
const decode = (name: string) => name.replace(/&apos;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const nameOf = (text: string) => {
    try {
        return decode((JSON.parse(text) as { name?: string }).name ?? '(unnamed)');
    } catch {
        return '(unnamed)';
    }
};

export function reportProblems(input: ReportInput): string[] {
    const problems: string[] = [];
    for (const profile of ['api', 'ui'] as const) {
        // What the report holds, by scenario name: the executions of each file of that name.
        const recorded = new Map<string, number[]>();
        for (const file of input[profile]) {
            let results: string[];
            try {
                results = executionsOf(file.text);
            } catch {
                problems.push(`${profile}: ${file.name} is not valid JSON`);
                continue;
            }
            const name = nameOf(file.text);
            recorded.set(name, [...(recorded.get(name) ?? []), results.length]);
            for (const result of results) {
                if (result !== 'SUCCESS') problems.push(`${profile}: '${name}' (${file.name}) ended ${result}, not SUCCESS`);
            }
        }
        // What the features say, by the same names. Compared as lists of executions per scenario, so a name the features have twice must be there twice.
        const expected = new Map<string, number[]>();
        for (const scenario of input.expected[profile]) expected.set(scenario.name, [...(expected.get(scenario.name) ?? []), scenario.outline ? scenario.rows : 1]);
        for (const name of [...expected.keys()].sort()) {
            const want = expected.get(name)!;
            const have = recorded.get(name);
            if (!have) problems.push(`${profile}: '${name}' is in the features but not in the report`);
            else if (have.length !== want.length) problems.push(`${profile}: '${name}' is in the report ${have.length} times and in the features ${want.length}`);
            else if ([...have].sort().join() !== [...want].sort().join()) {
                problems.push(`${profile}: '${name}' has ${have.reduce((a, b) => a + b, 0)} executions in the report and the features give ${want.reduce((a, b) => a + b, 0)}`);
            }
        }
        for (const name of [...recorded.keys()].sort()) {
            if (!expected.has(name)) problems.push(`${profile}: '${name}' is in the report but not in the features`);
        }
    }
    problems.push(...secretProblems([...input.api, ...input.ui], input.forbidden));
    return problems;
}

/** The files that hold a forbidden string or the shape of a token. The message names the file and what it holds, never the value. */
export function secretProblems(files: Recorded[], forbidden: string[]): string[] {
    const problems: string[] = [];
    for (const file of files) {
        if (file.tooLarge) problems.push(`${file.name} is too large to be looked at for the control key or a token`);
        for (const secret of forbidden) {
            if (secret.length === 0) continue;
            if (file.text.includes(secret)) problems.push(`${file.name} holds the run's control key`);
            else if (base64Forms(secret).some((form) => file.text.includes(form))) problems.push(`${file.name} holds the run's control key, in base64`);
        }
        for (const shape of TOKEN_SHAPES) {
            if (shape.pattern.test(file.text)) problems.push(`${file.name} holds ${shape.label}`);
        }
    }
    return problems;
}
