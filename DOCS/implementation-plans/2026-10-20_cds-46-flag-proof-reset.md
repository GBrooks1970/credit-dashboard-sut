---
version: 1
created: 2026-10-20T07:10Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-46
status: approved
approved: "2026-10-20, Gary Brooks, 'Action the reset fix' after the proposal below; merge only on the owner's word"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-46, the flag proof's reset call crashed on a dropped connection

**Why.** The landing page showed `credit-dashboard-sut` red because the latest `CI` run on `main` had failed. `Verify` and `UI` passed; the bug-flag proof (`flags` job) crashed, on two of the three pushes to `main` since P5 began (`2642c3a`, `c69c8a7`), each time right after the flag `pii-in-title` (28 of 30), with an uncaught `TypeError: fetch failed: SocketError: other side closed` from `resetService` in `prove-flags.ts`. A re-run of `CI` on `c69c8a7` by hand passed all three jobs (run 39375128700, proof 17m00s), so the failure is intermittent. The pull-request runs of the same code passed. Every flag before the crash showed "fails as stated", so no flag or catcher is at fault.

**What the evidence supports, and what it does not.** The crash came from the proof runner's own reset call to the service, on a connection that had carried three earlier resets (the socket's byte counts) and was then closed by the other side. A stale pooled connection is the likely cause. It is not proved: the job keeps no service log, so a service that died cannot be told apart from a dropped connection.

## Work (test first)

1. **A pure module `src/flags/reset.ts`** with `resetWithRetry(send, { flag, logTail })`: calls `send()` (which returns the HTTP status); a status of 204 is success; any other status fails at once with its number, not retried; a connection error is retried once; a second connection error fails with a message that names the flag, the error and the tail of the service log. It never throws an uncaught error: it returns a result the runner turns into a named stop.
2. **Unit tests first** (`src/flags/reset.test.ts`), seen to fail before the module exists: success on the first try; one dropped connection then success; two dropped connections give a message that names the flag and holds the log tail; a 500 is not retried; a 204 on the retry after a drop counts as success. Mutation-proved afterwards (remove the retry, and the one-drop test fails; remove the flag name, and the message test fails).
3. **`prove-flags.ts`** uses it: each reset is made on a new connection (`node:http` with `agent: false`, so no pooled socket is reused), and on failure the runner prints the message and the service log tail and exits 1 with the table written so far. `scripts/run.mjs` passes the main service's log path in `HARNESS_SERVICE_LOG`.
4. **CI.** The `flags` job uploads the service logs (`/tmp/harness-service-*.log`) as an artifact when it fails, kept 14 days, so the next failure shows what the service did.
5. **Records.** Harness design section 34, CHANGELOG, backlog (CDS-46 Done) and the Kanban board, the plan's Outcome, an implementation log.

## What this does not fix

If the real cause is the service dying, the retry hides one crash and the second reset fails with the log tail. That is why step 3 prints the tail and step 4 keeps the logs. Whether the flakiness is gone shows only over the next runs on `main`; I will say so and not claim it fixed.

## Verification

Unit tests (23 plus the six of `cases.test.ts` plus the new ones); a local flag proof of two flags still shows them caught; the `flags` job green on the pull request. A forced failure (the service stopped between two flags, locally) must stop the runner with the named message and exit 1, not crash.

## Out of scope

Any change to a flag, a catcher or the service; the P6 plan (CDS-44), which waits for the owner's decision.

## Outcome

[Appended after delivery.]
