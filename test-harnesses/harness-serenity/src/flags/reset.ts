// version: 1 | created: 2026-10-20T07:15Z | project: credit-dashboard-sut | type: tool | language: en-GB
// The flag proof resets the service after each flag (CDS-46). On 2026-10-19 the proof crashed twice on `main`, after `pii-in-title`, with an
// uncaught `fetch failed: other side closed` from that call: a connection the other side had closed. A reset that fails is now a named stop,
// not a crash, and one dropped connection is retried once. A status other than 204 is never retried: the service answered, and the answer is
// the finding. A pure module, so the ways it can go wrong are unit tests (reset.test.ts).

export type ResetResult = { ok: true } | { ok: false; message: string };

export interface ResetOptions {
    /** The flag whose catchers have just been run: the message names it. */
    flag: string;
    /** The end of the service's log, for the message (the proof prints it when the service did not answer). */
    logTail: () => string;
}

const describe = (error: unknown) => {
    const cause = error instanceof Error && error.cause instanceof Error ? `: ${error.cause.message}` : '';
    return `${error instanceof Error ? error.message : String(error)}${cause}`;
};

/** `send` makes one reset call on a new connection and returns the HTTP status; it throws when the connection fails. */
export async function resetWithRetry(send: () => Promise<number>, options: ResetOptions): Promise<ResetResult> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const status = await send();
            if (status === 204) return { ok: true };
            return { ok: false, message: `the service answered the reset after '${options.flag}' with ${status}, not 204` };
        } catch (error) {
            lastError = error;
        }
    }
    return {
        ok: false,
        message: `the service did not answer the reset after '${options.flag}' on two connections (${describe(lastError)}); the end of its log:\n${options.logTail()}`,
    };
}
