# CDS-24: the remaining CDS-18 review Notes — 2026-10-12

## Session Summary

The Notes left open by the CDS-18 independent re-review were triaged (25 Notes across three passes), and the ten that were specification or documentation text were closed in one pull request, together with two scenario changes the owner approved: two UI scenarios were tagged and one new scenario covers the "change" half of BR-15. The project now has 73 scenarios; the harness runs 59. The public counts in the registry, landing card and capability matrix were brought into line after the merge.

---

## Objectives

1. ✅ Triage every Note against the current repository (14 already closed or deliberate; 10 specification Notes; 2 scenario changes; 1 deferred to Phase 5; the changes-toggle page size left to the CDS-29 plan).
2. ✅ Close the ten specification and documentation Notes.
3. ✅ Tag `@BR-04` and `@BR-11` on the two UI scenarios; add the BR-15 'change' scenario with its step.
4. ✅ `npm run verify` 14 of 14 locally and in the pull request's own CI run.
5. ✅ Public counts updated (registry, landing card, capability matrix).
6. ⏸️ The three bug-flag catches (Phase 5 plan) and the changes-toggle page size (CDS-29 plan): deferred by the owner's choice.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Local | `npm run verify` | 14/14 | 14/14, steps sum to 284.7 s on a busy machine (install of the harness 72.1 s, service build and tests 90.1 s) | ✅ PASS |
| Service | `CreditDashboard.Api.Tests` | 309/309 | 309/309, 1 m 1 s | ✅ PASS |
| Rules | `CreditDashboard.BusinessRules.Tests` | 234/234 | 234/234, 987 ms | ✅ PASS |
| Harness | `@api` and `@security @api` | 58/58 scenarios | 59/59 scenarios, 5.2 s (Cucumber) | ✅ PASS |
| Gherkin | `tools/check-gherkin.py` | 72 scenarios | 73 scenarios, BR tags 15 of 15, PR tags 10 of 11 (PR-05 is deliberate) | ✅ PASS |
| CI | pull request #61's own run 38233159852 | n/a | `Verify` success, 1 m 30 s | ✅ PASS |

**Probes (each expected to fail, each reverted):**

| Probe | Result |
|---|---|
| The details edit ignores ownership (a stub account returned in `UpdateDetail`) | The new scenario fails: `Expected 404, got 200: {"interestRate":10}` |
| The `@BR-11` tag removed from the UI scenario | **Not caught.** The Gherkin gate checks that each rule is tagged somewhere, and the API scenarios still carry `@BR-11`; the UI tag is traceability only and no gate checks it |

---

## Changes Implemented

### Specification and documentation (#61, `fdfc682`)

**Files changed:**
- `DOCS/step-glossary.md` v11: UI money steps compare at the precision shown; `today is {date}` freezes the clock at 09:00:00 UTC; `current account(s)` in `{accountType}`; Lender X in the `{provider}` examples and what `the {provider} card` means; the new act row for the BR-15 step.
- `DOCS/.design/ui-specification.md` v12: the tile hook in kebab case (`detail-tile-interest-rate`); the BR-14 error copy. `DOCS/.design/ui-feature-profile.md` v8: section 4.2, the email sub-page hooks.
- `DOCS/.architecture/openapi.yaml` v17 (`info.version` 0.9.4): the `RuleViolation` description reads "out of range or too precise (BR-14)" (description only; regenerated files unchanged except the embedded `contract.json` and the client's `schema.d.ts`). `DOCS/.design/api-specification.md` v24; DR-061 (the Problem type `out-of-range` covers both limits).

### Features and harness

**Files changed:**
- `features-shared/security/access-control.feature` v2: 'Another customer's account cannot be changed' (`@BR-15`). `features-shared/ui/account-drilldown.feature` and `report-overview.feature`: the `@BR-04` and `@BR-11` tags. `ui/debt.feature`: a comment naming July 2026 as the trend base. `ui/account-details-form.feature`: the stale return-link clause dropped from the description.
- `test-harnesses/harness-serenity/src/steps/act.steps.ts`: `{actor} sets the interest rate on one of {actor}'s accounts to {percent}`; `support/parameter-types.ts`: `current account(s)`. `DOCS/.design/harness-design.md` section 19 records the new counts.

### Public counts

`NeoCognitus70/portfolio-prompts#120` (`6cdbfb7`: 73 scenarios, 59 harness scenarios, label "the Phase 4 plan (CDS-29) is next"), `GBrooks1970/portfolio#69` (`962bfd9`: card summary, lock at `6cdbfb7`), `test-automation-portfolio#316` (`6d932d5`: matrix, md and html). Handover v15 is immutable and still cites 72 and 58.

---

## Technical Decisions

DR-061 records the one decision that changes a register entry's reading; the rest carry out the approved plan.

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| One pull request for the specification, the scenario and the harness step | A new scenario needs its step in the same pull request or `verify` fails | Splitting the contract description change out |
| The tags on two UI scenarios are a tag-only change | Restores rule traceability with no wording change (precedent: `@no-test-control`) | Recording the gap |
| The three bug-flag catches go to the Phase 5 plan | They only matter for the "every flag turns a scenario red" proof | Adding three UI scenarios before a UI exists |
| The changes-toggle page size goes to the CDS-29 plan | It is a UI behaviour | Fixing it in the spec now |

---

## Documentation Updates

Glossary v11, UI specification v12, My Profile v8, API specification v24, contract v17, decision register v24 (DR-061), harness design section 19, backlog v51 and (after the merge) v52, CHANGELOG, plan Outcome and index, this log. The triage corrected one claim: the address-list and electoral-roll hooks (pass 1 F-22) were already in UI specification 6.7; only the BR-14 error copy was missing.

---

## Lessons Learned

- **Triage against the current repository before planning.** Of 25 Notes, 14 were already closed by later work; planning from the review text alone would have redone them.
- **A gate that checks "tagged somewhere" cannot catch a missing tag in one place.** The traceability gate is rule-level; a per-scenario tag is a convention only. If the UI tags matter, the gate would need to list the scenarios per rule.
- **A new scenario ripples.** One scenario changed the count in the glossary, the harness design, the registry, the landing card and the matrix; list the ripple in the plan.
- **Windows temp paths.** `node -e` with `/tmp/...` resolved to `D:\tmp`; use a repository-relative path or the scratchpad for scratch files.

---

## Recommendations / Next Steps

- [ ] **CDS-29** (HIGH): the Phase 4 plan with a read-only spike; now unblocked. It decides the changes-toggle page size.
- [ ] The three bug-flag catches (pass 2 F-20) into the Phase 5 plan.
- [ ] Optional: a gate that lists, per rule, the scenarios that carry its tag.

---

*Session logged: 2026-10-12. Author: Claude Code.*
