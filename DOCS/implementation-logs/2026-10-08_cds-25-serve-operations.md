# CDS-25: serve the business operations — 2026-10-08

## Session Summary

All 36 contract operations are served from the fixture store (DR-017, DR-050, DR-053, DR-055).

- **Specification first.** A read-only spike found five gaps in the specification (token lifetime, the `payments` block, the assistant, the `tags` parameter and an offline 503) and the order of authentication against validation. They were put as decision brief 9 and decided (D2 took the reframe, a setting; the rest as recommended) before any code (#33, #35).
- **Delivered** in five slices (#36, #37, #38, #40, #41): 29 business operations, with the token store, authentication before shape, per-user session state, the `error` and `slow` persona behaviours, and a check of every served response against the contract.
- **Not yet built:** the Serenity/JS harness that calls the service (CDS-22) and the Schemathesis run (CDS-23); both are Ready.

---

## Objectives

1. ✅ The unspecified behaviour decided and written down before code (brief 9, DR-055, `operations-cases.md`, API specification v19, contract v13).
2. ✅ Every one of the 29 business operations served; the contract coverage test's pending list is empty.
3. ✅ Authentication before shape (401 before 400), a token lifetime setting, expiry on the controlled clock.
4. ✅ Every served response checked against the contract, and a test that fails if a served operation has no sample.
5. ✅ `npm run verify` 11 of 11 in every pull request's own CI run.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Service | `CreditDashboard.Api.Tests` (NUnit 5.0.0) | 68/68 | 290/290 | ✅ PASS |
| Rules | `CreditDashboard.BusinessRules.Tests` | 234/234 | 234/234 | ✅ PASS |
| CI | Each slice's own run | 11 steps | 11 steps, 61 to 73 s | ✅ PASS |

Service tests per slice: S1 103 (35 new), S2 161 (58), S3 211 (50), S4 241 (30), S5 290 (49). CI runs: S1 37763518862, S2 37766490748 (first run 37766149510 failed), S3 37771222801, S4 37773175339, S5 37774916792.

**Probes (each expected to fail, and each did):** authentication switched off; expiry `<` to `<=`; a rebind keeping the session; a response field renamed or dropped (several); the newMissed window widened; the error persona disabled; a year window ignored; a 500 before the 404; ownership bypassed; closed accounts always listed; BR-14 never refusing; edits and read flags not remembered; the unread count taken from the page; assistant intents reversed; unread-first replaced by newest-first (after a test was added, see below); an email change keeping its old status; the resend not recording its send; wrong codes not counted; the full number leaving the service; `verify-email` not applied. Not re-run: the S2 sort-order probe, which the CDS-20 rule tests cover.

**Live runs on port 4000** after each slice answered as specified; each process was identified by its port and path and stopped afterwards.

---

## Changes Implemented

- `CreditDashboard.Api/Control/Authentication.cs`: `AuthOptions`, `TokenStore`, `UserSession` (preferred name, feedback, account detail edits, notification flags, email, link and mobile challenge) and `MobileState`.
- `Routes/Session.cs`, `Report.cs`, `ReportData.cs`, `Accounts.cs`, `Supporting.cs`, `Profile.cs` (the class `ProfileOperations`): the 29 handlers and the shared derivations (debt, totals, payment counts, paging).
- `Edge/ContractModel.cs` (per-operation authentication, `ResponseSchema`), `Edge/ContractValidation.cs` (authentication, then shape, then the slow persona delay), `Edge/Problems.cs` (`Unauthenticated`, `Internal`, `CodeWrong`, `RateLimited`).
- Tests: `ServiceHost` helper, `SessionTests`, `ReportTests`, `AccountTests`, `SupportingTests`, `ProfileOperationTests`, `OperationResponseTests` (a sample per served operation, checked against the contract); the edge and test-control tests sign in first.
- Specification: `operations-cases.md`; API specification v19 to v21; contract v13 to v15; UI specification v11. DR-055.

---

## Technical Decisions

The structural decision is **DR-055** (decision brief 9).

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| A specification PR, then five slices (owner) | The slices share files, so they merge in order, and the unspecified behaviour is reviewed as text first | One large PR |
| A token lifetime setting, default 60 minutes (owner) | Tests can shorten it | A fixed value |
| Authentication before shape (owner) | An unauthenticated caller learns nothing about the request | Shape first |
| The `payments` definition, the assistant table, `tags` removed, the 503 dropped, a rebind clearing session state (owner) | See brief 9 | See brief 9 |
| Edits held per user in memory, never written to the loaded fixtures | A reset or a rebind restores the stored data | Mutating the persona documents |
| Every served response checked against the contract in the service's own tests | It found three contract gaps in two slices | Leaving it to the harness |

---

## Lessons Learned

- **Check every response against the contract from the first slice.** It found account and notification operations that could answer 400 without the contract saying so. The contract was fixed (v14, v15), not the test.
- **Re-run the whole gate after a late edit.** The `MOCK_PORT` change broke the client package's type check in CI because only part of the gate was re-run locally.
- **A probe that cannot fail proves nothing.** The unread-first probe passed until a fixture case existed where it mattered; check that the data can tell the two behaviours apart.
- **Constant conditions fail a warnings-as-errors build.** Two probe edits did not compile; mutate with a runtime condition.
- **An unowned background process can hide a local failure for hours.** A Prism started by an unknown `npm run mock` held port 4010 for about ten hours; `MOCK_PORT` worked around it, and it has since stopped.

---

## Recommendations / Next Steps

- [ ] CDS-23: pin Schemathesis and run it clean against the service (Ready; the pending list is empty).
- [ ] CDS-22: the Serenity/JS abilities `CallAnApi` and `ControlTheTestEnvironment`, and the `@api` and `@security` steps (Ready). The harness must sign in after moving the clock, because a token expires when the clock passes it.
- [ ] Handover v13, the registry notes (they cite v11 and the scaffold) and the capability matrix.
- [ ] CDS-24 (remaining review Notes), enabling Dependabot alerts, publishing the Kanban board, `@scarf/scarf`'s install script.

---

*Session logged: 2026-10-08. Author: Claude Code.*
