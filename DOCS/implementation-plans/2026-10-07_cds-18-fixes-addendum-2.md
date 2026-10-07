---
version: 1
created: 2026-10-07T12:49Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-18 (fixes addendum 2)
status: approved
approved: 2026-10-07, Gary Brooks ("Fix all, then a scoped third pass"); each PR merged once its own checks pass (CDS-18 plan)
delivered: not yet
language: en-GB
---

# Implementation plan addendum 2: confirmation-pass fixes and a scoped third pass

**History of this plan.** After PR A (#16, `dca26ce`), the owner chose a confirmation re-run before signing off. A fresh agent, given the same prompt (only the commit and report path changed), reviewed `main` at `dca26ce`. It found 1 Blocker, 10 Change and 11 Note findings; the author reproduced the Blocker and the Changes (F-06 only in part). Three findings come from PR A's own fixes (F-06, F-09, F-10). The owner chose to fix the Blocker and all Changes, move the Notes to the backlog, and then run a third independent pass scoped to what PR A and this PR changed. Written to this file at 12:49Z, before any fix.

## Steps (PR A2, specification first)

| Finding | Fix |
|---|---|
| F-01 (Blocker) | The BR-08 outline adds `When Alex returns to the report later` after the clock Given, so the overview is read at the new clock |
| F-02 | `today is 3 October 2026` added to the `api/debt` Background. API specification section 6.5 states the clock after a reset: real time (`now: null`) until `PUT /__test/clock` freezes it, so date-dependent scenarios set it |
| F-03 | A new `@BR-04` API scenario on `drilldown`'s two open credit cards (the closed card is left out): total balance 379.60, total limit 6100.00, total utilisation 6% |
| F-04 | A new `api/account-details.feature` (`@api @BR-14`): the interest rate on the Lender X card, set through `PATCH /accounts/{id}/details`. 0% and 100% are accepted; 100.01% and 29.999% are refused with 422 `out-of-range` |
| F-05 | UI specification section 6.7 gains hooks: `pd-name`, `pd-address-current`, `pd-address-previous-{n}`, `pd-electoral-roll`, and `search-list` (empty state `search-list-empty`). The PR-03 "legal name" step reads `pd-name` |
| F-06 | My Profile specification v5: a `profile-mobile-badge` (Verified or Unverified) beside the masked number, as for email |
| F-07 | `api/credit-balances.feature` becomes "Accounts in credit"; its comment cites DR-018 instead of the open DR-005 |
| F-08 | "excluded from the loan totals" replaces "not included in the borrowing calculation" |
| F-09 | The step glossary maps "told to request a new code" and "the code … is no longer accepted" to 422 `code-invalid`, and "the account is not found" to 404 `/problems/not-found` |
| F-10 | The blank line before the step glossary's Security row is removed |
| F-11 | Glossary sources cite sections without versions; *Decision status* gains *Superseded*; the *Phase 0 pack* entry is updated |

The Notes (F-12 to F-22) become one backlog item, CDS-24, recorded with the gate in PR B. They are boundary rows, the contract 404s, the clock's time of day, PR-06 spaces, hook casing, money precision, a stale description, current accounts in `{accountType}`, two untagged scenarios, and three bug-flag catches due by Phase 5.

## Third pass

A fresh agent gets the same checklist, scoped to the files and lines changed by PR A (#16) and PR A2, with the full repository as context. The sign-off and DR-049 follow if it finds no Blocker or Change. Any new finding goes back to the owner.

## Verification

`npm run verify` passes 9 of 9. The step glossary matches every step line. The new scenarios' values are recomputed from the fixtures.

## Delivery

PR A2, then the third pass, then PR B (gate), then PR C (records), then the status PRs.
