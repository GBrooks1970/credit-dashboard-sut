/**
 * Refuses a parallel run (B-23). Every scenario shares one service, its clock, its persona bindings and its bug flags,
 * so two running at once would corrupt each other. Cucumber sets CUCUMBER_WORKER_ID in each worker of a parallel run.
 */
export function refuseParallelRun(env: Record<string, string | undefined> = process.env): void {
    if (env.CUCUMBER_WORKER_ID !== undefined) {
        throw new Error('A parallel run is not supported: the scenarios share one service, its clock, its bindings and its flags. Run without --parallel.');
    }
}
