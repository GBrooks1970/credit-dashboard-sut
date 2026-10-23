// How the bug-flag proof judges one catcher run and one flag (CDS-38 F7; findings B-02, B-03, B-07, B-08). It is a pure module, so the
// ways the proof was found to be fooled are unit tests (verdict.test.ts) and not only probes someone once ran.

/**
 * The pattern that selects one visual case by its title (`-g`): the describe, then the page, to the end of the title. A pattern that only starts
 * like a title would also select a case whose title goes on (`overview` and `overview: tab-bar`), and the proof would run both (CDS-48 C-13).
 */
export function visualTitlePattern(width: number, theme: string, page: string): string {
    const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return `${literal(`${width}px, ${theme} ${page}`)}$`;
}

export interface RunResult {
    /** The catcher's own exit status was 0. */
    passed: boolean;
    /** Something ran: at least one scenario or test was executed. A catcher whose name matches nothing exits 0 and runs nothing. */
    ran: boolean;
    /** The run was stopped by the proof's time limit. */
    timedOut: boolean;
    output: string;
}

/**
 * Whether an exit-check run looked at anything: its closing line names how many axe scans and layout checks it made. A target that
 * matches nothing prints no such line, and a run of 0 and 0 checked nothing (CDS-41).
 */
export function exitCheckRan(output: string): boolean {
    const counts = /exit checks: (\d+) axe scans and (\d+) layout checks/.exec(output);
    return counts !== null && Number(counts[1]) + Number(counts[2]) > 0;
}

export type Outcome = 'passed' | 'failed-as-stated' | 'failed-for-another-reason' | 'did-not-run' | 'timed-out';
export type Verdict = 'caught' | 'not-caught' | 'caught-for-another-reason' | 'false-alarm' | 'timed-out' | 'pending' | 'page-changed-only';

/**
 * With the flag off a catcher must pass, must have run, and its output must not hold the failure text: a text that appears
 * in a run with no defect proves nothing about the defect (a scenario title, a line of source), B-03.
 */
export function judgeOff(run: RunResult, failsWith: string): Outcome {
    if (run.timedOut) return 'timed-out';
    if (!run.ran) return 'did-not-run';
    if (!run.passed) return 'failed-for-another-reason';
    return run.output.includes(failsWith) ? 'failed-for-another-reason' : 'passed';
}

/** With the flag on a catcher must have run, failed, and failed with the recorded text (B-02, B-07). */
export function judgeOn(run: RunResult, failsWith: string): Outcome {
    if (run.timedOut) return 'timed-out';
    if (!run.ran) return 'did-not-run';
    if (run.passed) return 'passed';
    return run.output.includes(failsWith) ? 'failed-as-stated' : 'failed-for-another-reason';
}

/**
 * A flag's verdict from its catchers. A visual catcher fails for any change to the image (its recorded text is the image's name), so it
 * is a "page changed" catch and never a reason: a flag is caught for the stated reason only by a catcher that names the reason, and a flag
 * whose only catch is an image is `page-changed-only` (CDS-48, review findings A-02 and B-08).
 */
export function verdictOf(results: { off: Outcome; on: Outcome; kind?: string }[]): Verdict {
    if (results.some((r) => r.off !== 'passed')) return 'false-alarm';
    if (results.some((r) => r.kind !== 'visual-check' && r.on === 'failed-as-stated')) return 'caught';
    if (results.some((r) => r.kind === 'visual-check' && r.on === 'failed-as-stated')) return 'page-changed-only';
    if (results.some((r) => r.on === 'failed-for-another-reason')) return 'caught-for-another-reason';
    if (results.some((r) => r.on === 'timed-out')) return 'timed-out';
    return 'not-caught';
}

/**
 * How many tests a Vitest run executed: the passed and the failed, not the skipped (a run filtered by name skips the rest). The proof
 * requires exactly one, so a name that matches two tests, or none, is an error and not a catch (CDS-48 A-02).
 */
export function vitestExecuted(output: string): number {
    const line = /^\s*Tests\s+(.*)$/m.exec(output)?.[1] ?? '';
    return ['passed', 'failed'].reduce((sum, word) => sum + Number(new RegExp(`(\\d+) ${word}`).exec(line)?.[1] ?? 0), 0);
}

/** The first line of a run's output that holds the recorded failure text, trimmed and cut at 300 characters: what the proof table keeps (CDS-48 B-01). */
export function matchedLine(output: string, failsWith: string): string | null {
    const line = output.split(/\r?\n/).find((l) => l.includes(failsWith));
    return line === undefined ? null : line.trim().slice(0, 300);
}
