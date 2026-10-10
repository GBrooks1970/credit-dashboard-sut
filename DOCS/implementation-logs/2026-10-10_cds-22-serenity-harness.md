# CDS-22: The Serenity/JS harness — 2026-10-10

## Session Summary

The Serenity/JS harness runs the 12 `@api` feature files against the live service and is a `verify` step (DR-057).

- **Specification first.** A read-only spike and an approved plan (2026-10-08); then the design note and glossary v8 (#47, `920441e`) before any code.
- **Three slices of code.** H1 foundation (#48, `2b919b9`), H2 arrange and act (#49, `beda9c4`), H3 assert (#50, `c772b8d`), each merged on its own CI run.
- **H4** (this record's pull request): the second service instance, the three test-control-off steps, the harness as a `verify` step, DR-057, the records.
- **Not built:** the UI steps (Phase 4); a committed scenario that moves the clock forward after a sign-in.

---

## Objectives

1. ✅ All `@api` and `@security @api` scenarios green against the live service: 58 scenarios (31 scenarios and outlines in 12 files).
2. ✅ Every response validated against the contract at run time (DR-006, DR-042).
3. ✅ The harness a `verify` step and run by CI.
4. ✅ Each probe that had to fail did (below).

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Harness | `node scripts/run.mjs api` | none | 58/58 scenarios, 5 s (Cucumber) | ✅ PASS |
| Service | `CreditDashboard.Api.Tests` | 298/298 | 298/298, 30 s | ✅ PASS |
| Rules | `CreditDashboard.BusinessRules.Tests` | 234/234 | 234/234 | ✅ PASS |
| Local | `npm run verify` | 12/12 | 14/14, 137.7 s (install of the harness 24.9 s, harness step 13.5 s) | ✅ PASS |
| CI | each pull request's own run | n/a | #47 105 s, #48 84 s, #49 99 s, #50 94 s, all success | ✅ PASS |

Harness progression (Cucumber, 58 scenarios): H1 4 passed, the rest without steps; H2 386 steps passed, 65 undefined (the Thens); H3 57 passed, 1 undefined; H4 58 passed.

**Probes (each expected to fail, each reverted):**

| Probe | Result |
|---|---|
| A required key added to the contract's `Score` schema | Contract validation failure naming `getScore` |
| BR-02 carried forward in `Scores.cs` | "month is missing" assertion failed |
| A Given the persona does not hold | "holds 0 accounts matching" |
| An override sample bound over the wrong persona | "built on the 'drilldown' persona, but Alex holds 'excellent'" |
| BR-03 truncation | 1 failed, 9 broken |
| BR-11 oldest first | 3 of 3 failed |
| BR-14 range 101 | 1 broken, by contract validation of the 200 body |
| BR-09 mask returning the whole number | 2 broken |
| The clock-and-token rule ignored (scratch scenario: sign in, move the clock a day, ask again) | 401 instead of 200 |
| Test control not actually switched off | `Expected 404, got 204` |

---

## Changes Implemented

- `test-harnesses/harness-serenity/` (own `package.json` and lock): `src/abilities/CallAnApi.ts`, `ControlTheTestEnvironment.ts`; `src/contract/validate.ts` (Ajv by operation and status); `src/fixtures/{load,arrange}.ts`; `src/support/{parameter-types,hooks,world}.ts`; `src/steps/{arrange,act,assert}.steps.ts`; `cucumber.mjs`; `scripts/run.mjs`.
- `tools/verify.mjs` v5 (14 steps), `package.json` (`check:harness`), `features-shared/security/session-and-test-control.feature` (the tag `@no-test-control`), README 'Checks', CHANGELOG, backlog v44, decision register v20 (DR-057), plans index, Kanban board, `DOCS/.design/harness-design.md` (sections 15 to 18), `DOCS/step-glossary.md` v8 to v10.

---

## Technical Decisions

The structural decision is **DR-057**.

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| A standalone package (D1) | Own lock, no import from the service or the generated types | A root-level `harness/` |
| A custom thin `CallAnApi` with Ajv (D2) | The harness reads the contract on its own | `@serenity-js/rest` plus a validator |
| The runner starts and stops the service, and a second instance without test control (D3) | A leftover process on a port would otherwise answer in place of the service under test | Expect a running service |
| A `verify` step (D4) | Every commit runs the harness | A separate CI job |
| Serenity/JS 3.48.2, Cucumber 13.3.0, tsx 4.23.15, TypeScript 6.0.3 (D5) | Current releases of the lines the reference project used | The reference project's exact pins |
| Overrides are templates patched with the step's values | One checked sample per arrangement, any outline row | One sample file per row |
| Fixture Givens read the persona file, not the service | A Given that arranged nothing must not be satisfied by the service's own answer | Calling the service to check |

---

## Lessons Learned

- **Cucumber's rules shape the glossary.** A parameter type cannot sit inside an optional (so `at {time}` is two definitions), parameter-type names cannot hold a space, a step function must declare every parameter, and positional paths are added to a profile's paths instead of replacing them.
- **"Broken" is not "failed" in the Cucumber summary.** A step that throws is broken; an assertion that does is failed. The first probe summaries missed the broken ones; count both.
- **A probe can pass for the wrong reason.** The first clock-and-token probe did not change the file (a regex did not match) and "passed"; check that the mutation is in place before reading the result.
- **The service checks what the harness patches.** Binding overrides runs the business rules, so a wrong patch (utilisation out of step with the balance) is a 422 at once, which makes the BR-03 patching safe.
- **Scratch features keep the committed set honest.** The clock-and-token rule needs a scenario that moves the clock after a sign-in; adding one to `features-shared/` is a scenario change, so the probe used a scratch feature.
- **`npm audit` counts packages, not advisories.** One advisory in a chain showed as 7 high packages.

---

## Recommendations / Next Steps

- [ ] Record the Phase 3 gate (a decision register entry), now that the three exit conditions are met: the owner's decision.
- [ ] Handover v14, the registry notes, the landing card and the capability matrix are one step behind.
- [ ] Model `DetailUpdate` per field in the contract (v16); consider a committed scenario that moves the clock after a sign-in (a scenario change for the owner).
- [ ] CDS-24 (remaining review Notes); three merged local branches await deletion authority.

---

*Session logged: 2026-10-10. Author: Claude Code.*
