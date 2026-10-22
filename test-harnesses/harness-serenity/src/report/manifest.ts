// version: 1 | created: 2026-10-23T09:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The scenarios a suite runs, read from its feature files (CDS-48 B-07). The report check used to compare a sum of executions with a number
// kept by hand, so a scenario that dropped out and an outline row that was added cancelled out; now each scenario is compared by name, and each
// outline by its rows. The manifest is derived, never written: the feature files are the only place the scenarios are.

export interface Expected {
    name: string;
    /** True for a scenario outline: it runs once for each row of its examples. */
    outline: boolean;
    /** The rows of an outline's examples (all its blocks, headers not counted); 0 for a scenario. */
    rows: number;
}

const SCENARIO = /^(?:Scenario Outline|Scenario Template|Scenario|Example):\s*(.*)$/;
const EXAMPLES = /^(?:Examples|Scenarios):/;

/** The scenarios of one feature file. A small reader for the subset the features use; a feature it cannot read would show as a name mismatch. */
export function scenariosOf(featureText: string): Expected[] {
    const lines = featureText.split(/\r?\n/).map((line) => line.trim());
    const scenarios: Expected[] = [];
    let current: Expected | null = null;
    let table: 'none' | 'header' | 'rows' = 'none';
    for (const line of lines) {
        const scenario = SCENARIO.exec(line);
        if (scenario) {
            current = { name: scenario[1].trim(), outline: /^Scenario (Outline|Template)/.test(line), rows: 0 };
            scenarios.push(current);
            table = 'none';
        } else if (EXAMPLES.test(line)) {
            table = 'header';
            if (current) current.outline = true;
        } else if (line.startsWith('|') && current && table !== 'none') {
            if (table === 'header') table = 'rows';
            else current.rows += 1;
        } else if (line !== '' && !line.startsWith('#') && !line.startsWith('@') && table !== 'none') {
            table = 'none';
        }
    }
    return scenarios;
}

/** The scenarios of several feature files, in order. */
export const manifestOf = (featureTexts: string[]): Expected[] => featureTexts.flatMap(scenariosOf);
