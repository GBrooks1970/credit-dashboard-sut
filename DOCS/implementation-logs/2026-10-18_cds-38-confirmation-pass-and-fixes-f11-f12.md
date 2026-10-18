# CDS-38: the confirmation pass, its fixes F11a to F11f, and the records F12 — 2026-10-16 to 2026-10-18

## Session Summary

The fixes F1 to F10 of CDS-38 were reviewed by a second, fix-aware round: three fresh-context Sonnet 5.5 reviewers (one for each area) read the fixes on `20ecebc`, reported 12 Blockers, 27 Changes and 16 Notes, the author verified them, and the owner signed them off by interview. Six slices fixed them (#94 to #100, F11d in two pull requests), each test-first and mutation-proven where a mutation was possible, and a seventh slice (F12) brought the records up to date with figures counted at the close. CDS-38 is closed; CDS-41 (P3) is unblocked.

---

## Objectives

1. ✅ The confirmation pass: plan #92, record and sign-off #93 (`.review/2026-10-16_cds-38-confirmation-pass.md`).
2. ✅ F11a (#94): faults, parsing and the clock (R2-A-01, 02, 03, 05, 06, 09, 11, R2-C-13; Notes R2-A-12, 15).
3. ✅ F11b (#95): rules and races (R2-A-04, 07, 08 with R2-B-06, R2-A-10; Note R2-A-17).
4. ✅ F11c (#96): service tests and fuzzing (R2-A-13, 14).
5. ✅ F11d (#97 guards, #98 runner): R2-B-01 to 05, 07 to 11; Notes R2-B-12, 14, 15, 16, 18.
6. ✅ F11e (#99): UI behaviour (R2-C-01, 02, 04, 05, 11, 14; Notes R2-C-16, 18).
7. ✅ F11f (#100): UI checks, CI and documents (R2-C-03, 06 to 10, 12, 15; Note R2-C-17).
8. ✅ F12: README, specification headers and scope statements (C-16 to C-19), DR-065, backlog v68, CHANGELOG, the plans' Outcomes, Kanban.
9. ⏸️ Deferred by the owner: C-23 (to CDS-43, P5), A-24 and C-26 (to CDS-42, P4), A-22 and R2-B-13, R2-B-17, R2-B-19 (backlog); no action: R2-A-16, R2-B-20.
10. ⏸️ The portfolio-root handover and registry, updated when the owner asks.

---

## Test Results

| Stack | Suite | Before (end of F10) | After (close, `88e44a8`) | Status |
|---|---|---|---|---|
| Service | NUnit, `CreditDashboard.Api.Tests` | 387 | 435 | ✅ PASS |
| Rules | NUnit, `CreditDashboard.BusinessRules.Tests` | 239 | 239 | ✅ PASS |
| Harness | Node test runner: validator, parallel guard, flag-proof verdicts | 20 | 21 | ✅ PASS |
| UI | Vitest component tests | 179 | 198 | ✅ PASS |
| UI | public-build guard tests (node) | 7 | 20 | ✅ PASS |
| Harness | `@api` (Cucumber executions) | 59 | 59 | ✅ PASS |
| Harness | `@ui` (Cucumber executions) | 55 | 59 | ✅ PASS |
| Harness | exit checks | 124 axe scans, 282 layout checks | 124 axe scans, 288 layout checks | ✅ PASS |
| Harness | `check:bug-flags` | 8 of 8 | 8 of 8 | ✅ PASS |
| Repo | `verify` | 14 of 14 | 14 of 14 | ✅ PASS |

The `ui` CI job took 4m35s to 6m33s across these pull requests (15 minute limit). Every pull request was merged only after both jobs showed `pass`.

---

## Changes Implemented

### F11a (#94, `64d5899`): bodies, numbers and dates judged at the edge
A body is read as strict UTF-8 and a lone surrogate escape is a 400; the clock takes ASCII digits, `\z` and years 1990 to 2100; latency refuses an exponent; override dates are checked; a signed `year` or `page` is read as the number it is; a stored detail is the parsed number and `amountMinor` fits 64 bits; a path parameter is decoded once; the fault handler is proven through the real service in both environments. 29 of the 38 new tests fail on the old source; removing the handler registration fails the other two.

### F11b (#95, `5f07176`): rules and races
The mobile-code read, check and write sit under one lock (40 parallel wrong codes, ten times, exactly two `code-wrong`); `missed[]` drops months after the current one on both operations; a closed account's utilisation follows the reported balance 0, with an API step; the account year-window test uses an identifier that reaches the handler (`acc_nope00`). API specification v34.

### F11c (#96, `763cd55`): Schemathesis cover and personas
A custom check validates the preferred-name response with only the `\p{L}` pattern removed (a leaked property now fails the run); the latency control is fuzzed and the service reset after; `PYTHONIOENCODING` set; the read operations are validated for five personas and every account each lists. API specification v35.

### F11d (#97 `d655b42`, #98 `d6bb31d`): guards that could not fail, and the runner
Exact "not JSON" assertion; a unit test pins the five open response schemas; `failsWith` unique and located; closed fixtures need a stored balance and limit; PR-08 covers three more values; the `Before` hook also checks the clock, latency, overrides and default personas; the design is corrected; a same-site return-link scenario. The runner runs the child asynchronously with signal forwarding and a limit for every mode, fails on a missing feature file or a run in which no scenario finished, and type-checks the harness inside the `api` mode.

### F11e (#99, `deed077`): UI behaviour
Focus returns to the chat button after the drawer lifts `inert` (a `@ui` scenario reproduces the reviewer's "focus on BODY" on the old code); late feedback and chat answers are ignored; form controls inherit the font (which exposed an overflow on the debug page at 375 px with doubled text, fixed); an unreadable month is shown as sent and an error boundary guards the routes; the mobile page re-reads the profile after the PUT; the curly apostrophe is out of the client pattern; room for the tab bar; the greeting refresh is outside the save. UI specification v28.

### F11f (#100, `88e44a8`): guards, registry, exit cover and pins
The public-build guard also looks for 11 UI flag names and its test pins the five specified markers; section 8 of the UI specification equals the registry and `schema-check` keeps it so; `redocly` runs with `--no-install`; a stuck browser ends the run; the component catalogue and vite pin match the build; sign-in return tests (component and `@ui`); the exit run fails on an empty filter, asserts its counts, runs axe at doubled text and lays out the sign-in page (which found a 58 px overflow at 375 px, fixed); full action tags. UI specification v29.

### F12 (this pull request): records
README figures and phase table (C-16, C-17), specification status lines (C-18), harness design scope (C-19), DR-065, backlog v68 and the Kanban board, CHANGELOG, the four plans' Outcomes and the plans index.

---

## Technical Decisions

- **Order and shape of the fixes:** a..f as signed off; F11d split into two pull requests (guards, then the runner) because it carried 15 findings.
- **Typecheck inside the `api` mode** (not a 15th `verify` step), so the documents' step count stays 14.
- **Latency numbers refuse an exponent** with a 400 (a keyed tool does not need it).
- **Closed-account utilisation follows the reported balance** (0), not the stored one.
- **A custom Schemathesis check** replaces a blanket exemption for one operation; the pattern itself stays with the service tests.
- **UI flag catchers:** the registry is the source; section 8 of the UI specification follows it and a check enforces that.

---

## Documentation Updates

API specification v33 to v35; UI specification v28, v29; step glossary v14 to v16; harness design v2, v3; decision register v29 (DR-065); backlog v68; plans index v16; README; CHANGELOG; `schemathesis.toml`, `tools/schemathesis_hooks.py`; the review record `.review/2026-10-16_cds-38-confirmation-pass.md`.

---

## Lessons Learned

- **A second round on the fixes is worth it.** The fixes of round one introduced or left 12 Blockers, among them guards that stayed green with the fix removed. Fixes need a review of their own.
- **New checks find real defects at once.** The sign-in layout check and the doubled form controls each exposed an overflow that no earlier check could see.
- **Some proofs cannot be had everywhere.** The runner's signal handlers cannot be exercised on Windows, a form control's font size is read by no check, and a mutation of the redirect guard broke the scenarios before the new control; each pull request says so rather than claiming a proof.
- **A shell that mangles quotes costs time.** Scripts with quotes, backslashes or heredocs went through the file-writing tool and were run from files.
- **Reverting a file to undo a mutation also reverts uncommitted work in it.** Commit before mutating.

---

## Recommendations / Next Steps

1. P3 (CDS-41), the eleven UI display and semantics flags, now unblocked; each defect branch inside a constant `TEST_BUILD && ...` check.
2. Give the form controls a check that reads their computed font size (the exit run is the place), so R2-C-04 is proven.
3. If the owner wants the project's state in the portfolio, update the root handover and the registry.

---
