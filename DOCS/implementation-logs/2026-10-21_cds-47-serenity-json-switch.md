# CDS-47: only a whole run writes the Serenity JSON — 2026-10-21

## Session Summary

The Phase 5 gate's full local run ended `check:report` red: the flag proof's single-scenario runs had emptied `reports/serenity/<profile>` and left one scenario in it. CI was never affected. The harness now writes the Serenity JSON only for a whole `api` or `ui` run (#127); a named feature or the flag proof writes and empties nothing.

---

## Objectives

1. ✅ Test first: `src/report/switch.test.ts` failed on the missing module.
2. ✅ `src/report/switch.ts`, `crewFor`, `run.mjs` v12.
3. ✅ Probes on real runs, each reverted.
4. ✅ Records.

---

## Test Results

| Check | Before | After | Status |
|---|---|---|---|
| Harness unit tests | 52 | 54 | ✅ PASS |
| Switch mutation (always true) | n/a | one test fails | ✅ caught |
| A whole `api` run | 33 files | 33 files | ✅ PASS |
| A named feature (`api/closed-accounts`, 4 scenarios) | emptied the folder (2 files holding 4 executions with the switch forced on) | folder untouched (33 files) | ✅ PASS |
| A one-flag proof | emptied both folders | both untouched (33 and 44 files) | ✅ PASS |
| `check:report` after all of them | failed (1 execution) | 60 and 59 executions, all `SUCCESS` | ✅ PASS |
| `verify` | 14 of 14 | 14 of 14 | ✅ PASS |

---

## Changes Implemented

`src/report/switch.ts` and `switch.test.ts` (new); `src/support/serenity-crew.ts` v2 (the console reporter alone when the switch is off, no folder touched); `scripts/run.mjs` v12 (`HARNESS_SERENITY_JSON` is `on` for an `api` or `ui` run with no feature argument, `off` otherwise); harness design v14 section 38.

---

## Technical Decisions

- **The switch is set by the runner, not guessed by the crew.** `run.mjs` knows whether a run is whole; a direct `cucumber` call that bypasses it writes nothing, and `npm run report` says to run `test:api` and `test:ui` first.
- **Off means untouched, not emptied.** A report that mixes two runs is wrong, and so is a report replaced by one scenario.

---

## Documentation Updates

Plan `2026-10-21_cds-47-serenity-json-switch.md` (Outcome); plans index; backlog v81 (CDS-47 Done); CHANGELOG; harness design v14.

---

## Lessons Learned

- **A check that refuses is the check working.** `check:report` caught the clobbered JSON on the first full run; the fix was to the tooling that wrote it.
- **A probe with a mistyped argument proves nothing.** `run.mjs api closed-accounts` stopped at "no such feature file" and looked like a pass; check that the run it names actually ran (a scenario count) before reading its result.
- **A run that finds a defect in its own evidence tooling belongs in the gate brief**, not under the table.

---

## Recommendations / Next Steps

1. P7c: the gate record (DR-067), then the review plan for the Phase 5 additions (decision brief 14 D1 option 2).

---
