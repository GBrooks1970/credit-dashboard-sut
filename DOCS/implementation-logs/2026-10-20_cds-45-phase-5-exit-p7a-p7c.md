# CDS-45: P7, the Phase 5 exit (P7a to P7c) — 2026-10-20

## Session Summary

Phase 5 is closed: its exit gate was recorded as met on 20 October 2026 (DR-067) with its exceptions, after decision brief 14 (#125) put the evidence and four decisions to the owner. The `flags` job now keeps its table (#124), the README links the published report, a defect found by the plan's full run (CDS-47, #127) was fixed first, and an independent review of the Phase 5 additions (CDS-48) is commissioned.

---

## Objectives

1. ✅ P7a (#124): the `flags` job's table in the run summary and as the `bug-flag-proof` artifact; the README links the report and the board.
2. ✅ P7b (#125): the full run on `5b3a452`; decision brief 14.
3. ✅ The fix CDS-47 (#126 plan, #127), found by the full run.
4. ✅ P7c (this pull request): the owner's answers read back and recorded; DR-067; the README gate row; backlog; this log.
5. ⏸️ CDS-48, the independent review of the Phase 5 additions: a plan first.
6. ⏸️ Registry, landing card (with the link to the report) and capability matrix, then the closure: when the owner asks.

---

## Test Results

The full local run on `5b3a452` (2026-10-20):

| Check | Result | Duration |
|---|---|---|
| `npm run verify` | 14 of 14; 437 service tests, 239 rules tests | 208 s |
| `check:ui` | 208 component tests, the public-build guard clean | 43 s |
| `check:ui-scenarios` | 59 executions | 97 s |
| `check:ui-exit` | 124 axe scans, 288 layout checks, 0 problems | 218 s |
| `check:bug-flags` | 30 of 30 caught (the two Linux-only image catchers left out) | 1,182 s |
| `check:report` | first run failed (1 execution: CDS-47); after a whole `test:api` and `test:ui`: 60 and 59 executions, all `SUCCESS`, no key or token | 5 s |

CI on `5b3a452` (run 39489977664): `Verify` 1m34s, `Bug-flag proof` 16m09s, `UI` 5m22s, `Report` 41 s, `Site` 24 s, `Deploy` 32 s, all success. The flag proof's table (artifact `bug-flag-proof`, run 39487546650): 30 `caught`, none pending. The live site at `/report/` showed 77 scenarios and 119 test cases and a stamp naming `5b3a452`.

---

## Changes Implemented

`ci.yml` (the proof table in the run summary and the artifact); README (the report and board links, the deployer, DR-001 to DR-066, then DR-067 and the Phase 5 row); decision brief 14 and its record; DR-067; backlog v80 to v82; the CDS-47 fix (`src/report/switch.ts`, `run.mjs` v12). See the CDS-47 log for the fix.

---

## Technical Decisions

- **The gate is the owner's, so the evidence went to a brief first.** The agent gathered it; the owner decided after a read-back.
- **A defect in the evidence tooling found by the gate's own run is reported in the brief and fixed first**, not hidden under the table.
- **Review after the gate, as for Phase 4**, because the gate's conditions are executable and met; the review is the quality check, not the condition.

---

## Documentation Updates

Decision register v31 (DR-067); decision briefs index; decision brief 14 (decided); README; backlog v82; CHANGELOG; plan `2026-10-20_cds-45-phase-5-exit.md` (Outcome); plans index.

---

## Lessons Learned

- **Gather the gate's evidence from the commit it will cite.** A full run on the final commit found what the slice-by-slice runs had not.
- **The order of runs matters to a tool that shares a folder.** The flag proof and the report check ran in a bad order locally; CI's separate runners hid it.
- **A decision brief that lists its own exceptions is easier to answer.** The owner took the recommended options after a one-message read-back.
- **A FINAL handover is a decision, not a default.** The project is closed only after the review (D2), and the landing link waits for that status.

---

## Recommendations / Next Steps

1. CDS-48: plan the independent review of the Phase 5 additions, present it in full, get it approved, then run it as CDS-38 was.
2. Update the registry, the landing card (adding the link to the report) and the capability matrix when the owner asks.
3. After the review and its fixes, run `close-project`.

---
