# CDS-46: the flag proof's reset call crashed on a dropped connection — 2026-10-20

## Session Summary

The landing page showed `credit-dashboard-sut` red because the latest `CI` run on `main` had failed. The `flags` job crashed on the pushes of `2642c3a` and `c69c8a7`, each time after `pii-in-title` (28 of 30), with an uncaught `fetch failed: SocketError: other side closed` from the proof runner's reset call. A re-run on the same commit passed. The runner now makes each reset on a connection of its own, retries once, and stops with a named message and the service log's tail instead of crashing; the job keeps the service logs when it fails (#117).

---

## Objectives

1. ✅ Investigate: which runs, which step, whether it repeats.
2. ✅ Fix (#117): `src/flags/reset.ts`, `prove-flags.ts` v4, `run.mjs` v11, the log upload.
3. ✅ Records (this log, the plan's Outcome, backlog).
4. ⏸️ Whether the flakiness is gone: only more runs on `main` can say.

---

## Test Results

| Check | Before | After | Status |
|---|---|---|---|
| Harness unit tests | 29 | 34 (five new, then 52 with P6) | ✅ PASS |
| Retry removed (mutation) | n/a | three tests fail | ✅ caught |
| Flag name removed from the message (mutation) | n/a | one test fails | ✅ caught |
| A run against a port where nothing listens | uncaught crash | named stop, exit 1 | ✅ PASS |
| `verify` | 14 of 14 | 14 of 14 | ✅ PASS |

CI on #117: Verify 2m02s, UI 5m12s, flags 17m00s, Visual 1m14s. The re-run of `CI` on `c69c8a7` by hand (run 39375128700): all three jobs passed. The first push to main after the fix (`3bdeefe`, run 39438399295) passed all jobs, the proof in 17m06s; it is one run.

---

## Changes Implemented

`src/flags/reset.ts` (pure: a 204 is success, one connection error is retried, a second one or a status other than 204 is a result with a message, never a throw); `src/flags/reset.test.ts`; `prove-flags.ts` v4 (a new connection per reset through `node:http` with `agent: false`; a failed reset writes the table so far, prints the message and the end of the log, exits 1); `run.mjs` v11 (`HARNESS_SERVICE_LOG`); `ci.yml` (the `flags` job uploads `/tmp/harness-service-*.log` when it fails); harness design v9 section 33.

---

## Technical Decisions

- **A retry is a workaround for an unproven cause, so it is paired with evidence.** The message names the flag and carries the log tail, and the logs are kept, so a service that died is not hidden by the retry.
- **A status other than 204 is not retried.** The service answered; the answer is the finding.

---

## Documentation Updates

Plan `2026-10-20_cds-46-flag-proof-reset.md` (Outcome); backlog v78; CHANGELOG; harness design v9.

---

## Lessons Learned

- **Read the run on `main` after every merge.** Two pushes failed while every pull request passed, and the first sign was a red badge on the landing page.
- **A job that keeps no log cannot be investigated.** The log upload should have been there from the first job.
- **An uncaught error in a runner is a crash with no table.** A named stop keeps what was judged so far.
- **The same commit passing on a re-run is the shape of a flaky connection, not of a defect**, but it proves nothing about the cause.

---

## Recommendations / Next Steps

1. Look at the next runs of the proof on `main`; if it fails again, read the uploaded service log first.
2. If the cause is the service dying, that is a service defect, not a runner one.

---
