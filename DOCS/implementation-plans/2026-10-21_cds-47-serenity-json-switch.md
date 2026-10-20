---
version: 1
created: 2026-10-20T23:35Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-47
status: implemented
approved: "2026-10-20, Gary Brooks, 'Confirmed, approve CDS-47 plan, merge and continue' (decision brief 14 D4 option 1); merge only on the owner's word per pull request"
delivered: "2026-10-21: #127 (merged on the owner's word; the merge commit is in the P7c records)"
language: en-GB
---

# Implementation plan: CDS-47, only a whole run writes the Serenity JSON

**Why.** The Phase 5 gate's full local run (CDS-45 P7b) ended `check:report` red. `crewFor` empties `reports/serenity/<profile>` at the start of every Cucumber run, so the bug-flag proof's single-scenario runs, or a run of one named feature, replace the JSON of a whole-suite run with one scenario. CI is not affected: the `Verify` and `UI` jobs run the whole suites and upload their JSON before any other run on those runners. `check:report` refused the bad state, as designed. Decision brief 14 D4 chose to fix it before the gate (option 1).

## The change

1. A pure function `writesSerenityJson(env)` in a new file `src/report/switch.ts`: true only when `HARNESS_SERENITY_JSON` is exactly `on`.
2. `crewFor` (`src/support/serenity-crew.ts`) uses it. With the switch off, the crew is the console reporter only, and the folder is neither emptied nor written.
3. `scripts/run.mjs` v12 sets `HARNESS_SERENITY_JSON` to `on` in the child's environment only for an `api` or `ui` run with no feature argument, and to `off` for everything else (`exit`, `flags`, `visual`, named features).

## Work (test first)

1. `src/report/switch.test.ts`, written first and seen failing on the missing module: `on` writes; unset, `off`, `ON` and the empty string do not.
2. `switch.ts`, then the mutation: the function always true fails a test.
3. `crewFor` and `run.mjs`.
4. Probes on real runs, each reverted: a whole `api` run gives 33 files holding 60 executions; `run.mjs api closed-accounts` leaves the folder untouched; a one-flag proof leaves it untouched; `check:report` passes after all three; with the function forced to true, the named-feature probe fails.
5. Records: harness design section 38 (version 14), CHANGELOG, backlog (CDS-47 Done), the plan Outcome, an implementation log.

## Verification

`npm run verify` 14 of 14; the harness unit tests (52 plus the new ones); `check:report` after a whole `test:api` and `test:ui`; every CI job `pass`, read.

## Out of scope

The report job, the site job, anything in CI; the flag proof; any scenario.

## Risks

- A direct `cucumber` call that bypasses `run.mjs` no longer writes the JSON. That is intended: `npm run report` says to run `test:api` and `test:ui` first.
- **Estimate:** about 0.2 session (mine, not measured).

## Outcome

**Delivered 2026-10-21** in #127, merged after every CI job showed `pass`. The implementation log is `DOCS/implementation-logs/2026-10-21_cds-47-serenity-json-switch.md`. As planned: `src/report/switch.ts` (pure, two unit tests written first, one mutation caught), `crewFor` writing and emptying the folder only when `HARNESS_SERENITY_JSON` is `on`, `run.mjs` v12 setting it for a whole `api` or `ui` run only. Probed on real runs: a whole `api` run 33 files, a whole `ui` run 44; a named feature (4 scenarios) and a one-flag proof leave them untouched; `check:report` passes with 60 and 59; with the switch forced on, the same named run leaves 2 files holding 4 executions and `check:report` fails.

**Where it departed from the plan.** One probe was mistyped and was redone: `run.mjs api closed-accounts` stopped at once ("no such feature file", the path is `api/closed-accounts`), so it proved nothing; the real named-feature probe and the mutation were run with `api/closed-accounts`. The first mutation probe was therefore also invalid and was repeated. Nothing in the code differs from the plan.
