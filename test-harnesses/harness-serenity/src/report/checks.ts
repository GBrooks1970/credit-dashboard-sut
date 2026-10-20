// version: 1 | created: 2026-10-20T09:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// What the published Serenity report must satisfy before anyone reads it (CDS-44, P6a): every execution of the two suites is in the Serenity
// JSON, none failed or was skipped, the number is the number the suites run (a scenario or a file that silently dropped out would otherwise
// still end green), every file parses, and no file holds the run's control key or a token. A pure module, so the ways the check could be
// fooled are unit tests (checks.test.ts). The files are read, and the HTML generated, by scripts/check-report.mjs and scripts/report.mjs.

export interface Recorded {
    /** The file's name, for the message. */
    name: string;
    /** Its text. */
    text: string;
}

export interface ReportInput {
    api: Recorded[];
    ui: Recorded[];
    /** The executions each suite runs: change with the scenarios, in the same pull request (as the exit run's size). */
    expected: { api: number; ui: number };
    /** Strings that must not appear in any file: the run's control key. */
    forbidden: string[];
}

/** A signed token (three base64url parts) or an Authorization header with a bearer token: what a recording of a call might hold. */
const TOKEN_SHAPES: { label: string; pattern: RegExp }[] = [
    { label: 'a bearer token', pattern: /Bearer\s+[A-Za-z0-9._~+/-]{6,}/ },
    { label: 'a signed token', pattern: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/ },
];

/** The result of each execution in one scenario's JSON: one for a scenario, one per row for an outline. Throws when the text is not JSON. */
export function executionsOf(text: string): string[] {
    const outcome = JSON.parse(text) as { result?: string; dataTable?: { rows?: { result?: string }[] } };
    const rows = outcome.dataTable?.rows;
    if (rows && rows.length > 0) return rows.map((row) => row.result ?? 'UNKNOWN');
    return [outcome.result ?? 'UNKNOWN'];
}

const nameOf = (text: string) => {
    try {
        return (JSON.parse(text) as { name?: string }).name ?? '(unnamed)';
    } catch {
        return '(unnamed)';
    }
};

export function reportProblems(input: ReportInput): string[] {
    const problems: string[] = [];
    for (const profile of ['api', 'ui'] as const) {
        let executions = 0;
        for (const file of input[profile]) {
            let results: string[];
            try {
                results = executionsOf(file.text);
            } catch {
                problems.push(`${profile}: ${file.name} is not valid JSON`);
                continue;
            }
            executions += results.length;
            for (const result of results) {
                if (result !== 'SUCCESS') problems.push(`${profile}: '${nameOf(file.text)}' (${file.name}) ended ${result}, not SUCCESS`);
            }
        }
        if (executions !== input.expected[profile]) {
            problems.push(`${profile}: the report holds ${executions} executions, the suite runs ${input.expected[profile]}`);
        }
    }
    problems.push(...secretProblems([...input.api, ...input.ui], input.forbidden));
    return problems;
}

/** The files that hold a forbidden string or the shape of a token. The message names the file and what it holds, never the value. */
export function secretProblems(files: Recorded[], forbidden: string[]): string[] {
    const problems: string[] = [];
    for (const file of files) {
        for (const secret of forbidden) {
            if (secret.length > 0 && file.text.includes(secret)) problems.push(`${file.name} holds the run's control key`);
        }
        for (const shape of TOKEN_SHAPES) {
            if (shape.pattern.test(file.text)) problems.push(`${file.name} holds ${shape.label}`);
        }
    }
    return problems;
}
