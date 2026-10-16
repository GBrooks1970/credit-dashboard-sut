# CDS-38: the independent review, its sign-off and fixes F1 to F4 — 2026-10-16

## Session Summary

The independent review of the Phase 3 service, the harness and the Phase 4 UI (CDS-38) was run by three fresh-context Opus 5.5 reviewers, saved unchanged, verified by the author and signed off by the owner finding by finding. The fixes were planned (12 slices, one addendum) and the first five were delivered: F1 (specifications, contract v18), F2a (closed response schemas, contract v19), F2 (the harness validator and hooks), F3 (service faults and the edge) and F4 (service rules and flags). One pull request, #80, was merged with a red CI job and repaired by #81. F5 to F12 remain; no UI finding has been fixed yet.

---

## Objectives

1. ✅ Run the review: three reviewers, prompts recorded verbatim and hashed, reports saved unchanged (#75, #76). 14 Blocker, 48 Change, 26 Note.
2. ✅ The author's verification of all 62 Blocker and Change findings (record section 4): 59 reproduced, 2 in part (B-20, C-23), 1 not reproduced (C-15); two corrections to the reviewers' wording (A-10, B-20).
3. ✅ The owner's sign-off (record section 5): 14 Blockers and 47 Changes accepted, C-23 deferred; Notes 17 accepted, 4 deferred, 5 no action (#77).
4. ✅ The fix plan (`DOCS/implementation-plans/2026-10-15_cds-38-fixes.md`), approved with decisions D1 to D5, and Addendum 1 (closed schemas) approved.
5. ✅ F1 specifications and contract v18 (#78). ✅ F2a closed response schemas, contract v19 (#79). ✅ F2 harness validator and hooks (#80, repaired by #81). ✅ F3 service faults and the edge (#82). ✅ F4 service rules and flags (#83).
6. ⏸️ F5 fixtures and steps; F6 service tests; F7 flag proof; F8 UI redirects and stale responses; F9 UI display and semantics; F10 build, exit checks and CI.
7. ⏸️ F11 the confirmation pass; F12 records (README and specification headers, DR entry, backlog, CHANGELOG).
8. ⏸️ Deferred by the owner: C-23 (to P5), A-24 and C-26 (to P4), A-22 (backlog), B-22 (to F11).

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Service | NUnit, `CreditDashboard.Api.Tests` | 339 | 384 (F3 +33, F4 +12) | ✅ PASS |
| Rules | NUnit, `CreditDashboard.BusinessRules.Tests` | 234 | 239 (F4 +5) | ✅ PASS |
| Harness | Node test runner, validator and parallel guard (new, F2) | 0 | 12 | ✅ PASS |
| Harness | `@api` scenarios, live service | 59 | 59 (exit 0 in every `verify`) | ✅ PASS |
| Harness | `@ui` scenarios, live service | 51 executions | 51 executions (exit 0, run locally before F2, F3 and F4 were opened) | ✅ PASS |
| UI | Vitest component tests | 142 | 142 (unchanged) | ✅ PASS |
| Local | `npm run verify` | 14/14 | 14/14 after each of F1, F2a, F2, F3, F4 | ✅ PASS |
| Local | `npm run check:bug-flags` | 8 of 8 implemented flags caught | 8 of 8 caught for the stated reason (F2 first made it 7 of 8; fixed by #81) | ✅ PASS |
| Local | `npm run check:ui-exit` | 37 axe scans, 24 layout checks, 0 problems | same (run for F3) | ✅ PASS |

Mutation proofs (each change reverted after): F2 validator, every check switched off in turn turns its unit test red; F3, with the eight source files reverted to `main`, 21 of the 33 new tests go red; F4, with the nine source files reverted, 8 of the new tests go red (the A-11 pin passes on both by design, because the code did not change). CI: #76 to #79, #81 to #83 green on both jobs; #80's `ui` job was red when it was merged (see Lessons).

---

## Changes Implemented

### The review and its record (#75, #76, #77)

**Files changed:**
- `DOCS/implementation-plans/2026-10-14_cds-38-independent-review.md` — the review plan, approved with decisions D1 to D6.
- `.review/2026-10-14_cds-38-independent-review.md` — header, three prompts (SHA-256 recorded), three reports verbatim, the author's verification (62 rows), the owner's sign-off (three tables).
- `DOCS/implementation-plans/2026-10-15_cds-38-fixes.md` — the fix plan F1 to F12 and Addendum 1.

### F1: specifications and contract v18 (#78, `df40efd`)

**Files changed:**
- `DOCS/.architecture/openapi.yaml` (`info.version` 0.9.5) — the payment-history example lists years oldest first (A-15); `percent` description (A-16). Generated C# contract and typed client regenerated.
- `DOCS/.design/api-specification.md` v28, `business-rules-cases.md`, `ui-specification.md` v23, `glossary.md` v11, `harness-design.md` — BR-12 future month, BR-14 percent, flag texts (A-09, A-11, A-28), balance history relative to `asAt` (A-29), `/debug` and the progressbar gauge (C-07, C-08), the harness layout as built (B-20) and the false HTML-formatter claim.

### F2a: closed response schemas, contract v19 (#79, `a3c8a3b`)

**Files changed:**
- `DOCS/.architecture/openapi.yaml` (0.9.6) — six `allOf` schemas flattened (`MobileChallenge`, `ChangePage`, `SearchPage`, `NotificationPage`, `Account`, `FixtureAccount`), `PageMeta` removed, `additionalProperties: false` on 40 schema objects and four inline responses; `Problem` and the two open request schemas stay open. No service change was needed.

F1 first tried the closure with `unevaluatedProperties: false` and six `verify` steps failed (a closed `$ref`'d base rejects what its `allOf` siblings add); it was reverted, and the change became F2a by Addendum 1.

### F2: the harness validator and hooks (#80, `fae0bc9`; repair #81, `74381f1`)

**Files changed:**
- `test-harnesses/harness-serenity/src/contract/validate.ts` — `validate(operationId, ResponseToCheck)`: content type, documented headers (`Retry-After`), Problem status agreement and forbidden fields (`stack`, `stackTrace`, `trace`, `exception`), non-JSON bodies; Ajv strict mode, every response schema compiled at load.
- `src/abilities/CallAnApi.ts`, `src/support/world.ts` — `send` returns `{ status, headers, body }`.
- `src/support/diagnostics.ts`, `src/api/hooks.ts`, `src/ui/hooks.ts` — the After hook attaches diagnostics on failure and resets the service against the main instance.
- `src/support/parallel.ts`, `src/support/common-hooks.ts` — parallel runs refused.
- `src/contract/validate.test.ts`, `src/support/parallel.test.ts`, `scripts/run.mjs` v6, `package.json` — 12 unit tests, run by the `api` run before it starts the services.
- `fixtures/bug-flags.json` (#81) — the recorded failure text for `problem-json-missing` is now `has content type 'text/plain'`.

### F3: service faults and the edge (#82, `068df18`)

**Files changed:**
- `CreditDashboard.Api/Edge/Faults.cs` (new) — `FaultHandler` (any unhandled exception is a 500 Problem with a fixed detail, in every environment) and `CorrelationIdMiddleware` (`X-Correlation-Id` echoed if 1 to 128 of `[A-Za-z0-9._-]`, else a GUID).
- `Program.cs`, `Control/TestControlGate.cs`, `Edge/Problems.cs` — the gate normalises repeated slashes and case; test-control errors never go plain text; `index.html` no-store on every path, `HEAD` answered, missing `/assets/` files are a 404 Problem.
- `Control/Rfc3339.cs` (new), `Routes/TestControl.cs` — the clock takes RFC 3339 only.
- `Control/ControlledClock.cs` — one immutable reference, so a read cannot be half-written.
- `Edge/ContractValidation.cs` — a body that names a property twice is a 400.
- `Routes/Report.cs`, `Routes/Accounts.cs` — the year window is checked before the target.
- `CreditDashboard.Api.Tests/FaultAndEdgeTests.cs` (new, 33 tests); API specification v30.

### F4: service rules and flags (#83, `88a8e5b`)

**Files changed:**
- `CreditDashboard.BusinessRules/PaymentHistory.cs`, `AccountDetails.cs`, `Profile/PreferredName.cs` — a future month is never missed (A-17); `percent` two decimals (A-16); PR-02 counts code points (A-23).
- `Routes/Profile.cs`, `Control/Authentication.cs`, `Control/PersonaStore.cs` — the resend check and record under a per-user lock (A-04); the email status in the session only (A-21).
- `Control/Defects.cs`, `Routes/Session.cs`, `Routes/ReportData.cs` — `currency-float` applied once where a response is written (A-09); the excluded list uses `Defects.MaskedNumber` (A-10).
- `CreditDashboard.Api.Tests/RulesAndFlagsTests.cs` (new, 12 test cases incl. the A-11 pin) and five rules tests; API specification v31.

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Fix plan as 12 slices under CDS-38, no new tickets (D1) | Keeps the Kanban at 45 tickets; the backlog entry lists the slices | One ticket per slice |
| Confirmation reviewer to be a different model (Sonnet 5.5), asked again before launch (D2) | A second look from another model | Opus 5.5 again |
| Validator first, then service, as ordered in the plan (D3) | Later fixes are judged by the stricter check | Service first |
| A closed-schema change that breaks more than a correction is split out with an addendum (D4) | It happened (F1): Addendum 1, F2a | Absorb it into F2 |
| One contract bump per slice that changes it (v18, v19) rather than one in F1 (D5, amended by Addendum 1) | F2a is a separate pull request with its own contract change | A single bump |
| A-09: `currency-float` applies to every money amount, applied in one place | The text said "money"; one site cannot miss an amount | Narrow the text to some sites |
| A-11: `excluded-in-total` also reaches the debt total; text widened, code unchanged, behaviour pinned | BR-07 uses the type totals, so it is a consequence of BR-05 | Narrow the code |
| Closed schemas use flattened objects with `additionalProperties: false` | `unevaluatedProperties` on `allOf` over closed bases fails | Keep `allOf` and open bases |
| Harness unit tests run inside the `api` run, not as a 15th `verify` step | Keeps "14 steps" true across the documents | A separate step (offered to the owner) |

None is structural enough for a new ADR or DR now; the DR entry on what CDS-38 found and changed in the DR-058 and DR-063 exceptions is planned for F12.

---

## Documentation Updates

- `.review/2026-10-14_cds-38-independent-review.md` — sections 1 to 5.
- `DOCS/implementation-plans/2026-10-14_cds-38-independent-review.md`, `2026-10-15_cds-38-fixes.md`, `_index.md` — plans, approval, Addendum 1, decisions.
- `DOCS/.design/api-specification.md` v28 to v31; `business-rules-cases.md`; `profile-rules-cases.md`; `ui-specification.md` v23; `glossary.md` v11; `harness-design.md` (layout, sections 28; the problem-json-missing text note).
- `DOCS/.architecture/openapi.yaml` v18 and v19.
- Not yet updated (F12): `DOCS/backlog.md` (CDS-38 Done, CDS-41 unblocked), `CHANGELOG.md`, `README.md` (counts: 384 service tests, 239 rules tests, 12 harness unit tests, DR number), the decision register.

---

## Lessons Learned

- **Check the result of a CI wait before merging.** #80 was merged right after `gh pr checks --watch` with the `ui` job red; `main` was red until #81. The merge command must test every check's conclusion. A memory note records it.
- **Run the proof and the `@ui` run locally before opening a pull request that touches the validator, the hooks or the contract.** The flag proof is part of the `ui` job and `verify` does not run it.
- **A stricter check moves other checks.** The F2 validator changed the text the flag proof records for `problem-json-missing`. That is the proof working (caught for another reason), and the registry text had to follow.
- **JSON Schema 2020-12 `unevaluatedProperties` does not see through a closed `$ref`.** Closing an `allOf` family means flattening, not annotating.
- **A test for a defect must reach the defect.** The first B-21 test failed earlier in the validator and so did not exercise the TypeError path; the mutation showed it.
- **The tooling quirks recur:** the shell strips backslashes (use a script file written with the Write tool), line endings differ between the working copy and Git (read, convert, write back), and the permission classifier refuses a loop that expands a branch list by itself (name the branches).

---

## Recommendations / Next Steps

- [ ] F5 fixtures and steps (B-04, B-05, B-14 to B-19) — next, High.
- [ ] F6 service tests (A-12 to A-14, A-19, A-25, A-27); F7 flag proof (B-02, B-03, B-06 to B-08, B-26) — High.
- [ ] F8 UI redirects and stale responses; F9 UI display; F10 build, exit checks and CI — High, before P3 (CDS-41).
- [ ] F11 confirmation pass (Sonnet 5.5, to be confirmed with the owner before launch); F12 records — Medium.
- [ ] After F12: backlog update (CDS-38 Done, CDS-41 unblocked), DR entry, CHANGELOG, README counts, handover v17.
- [ ] Owner decision pending: whether `claude/cds-28-code` (the one remaining unmatched remote branch) is deleted.

---

*Session logged: 2026-10-16. Author: Claude Code.*
