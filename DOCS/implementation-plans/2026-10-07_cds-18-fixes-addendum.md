---
version: 1
created: 2026-10-07T09:58Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-18 (fixes addendum)
status: implemented
approved: 2026-10-07, Gary Brooks; each PR merged once its own checks pass
delivered: "#16, squash dca26ce (2026-10-07)"
language: en-GB
---

# Implementation plan addendum: CDS-18 fixes before the Phase 2 gate

**History of this plan.** This is the addendum the CDS-18 plan (`2026-10-07_cds-18-behaviour-re-review.md`, step 4) requires when a fix is more than wording. The independent review (`.review/2026-10-07_cds-18-behaviour-re-review.md`) found 5 Blocker, 12 Change and 8 Note findings, and the author reproduced all 17 Blocker and Change findings. The owner decided F-02, F-03, F-09 and the scope by interview. The addendum was read back at about 09:58Z (not read from the clock; the clock read 09:54:40Z before the interview and 10:13:40Z after it), approved, and written to this file at 10:14Z, before any fix.

**Goal.** Every Blocker and Change finding, and Notes F-19, F-20, F-21 and F-24, fixed specification first, so that the Phase 2 gate rests on a clean review.

## Decisions (owner, 2026-10-07)

| Finding | Decision | Record |
|---|---|---|
| F-02 | `DebtOverview` gains a required `byType` array of `{type, amount}`: BR-07's positive balances per account type | DR-046 |
| F-03 | The first render stays one aggregate call (DR-034 holds). The toggle calls `GET /reports/{bureauId}/changes` and lists every change in place | DR-047 |
| F-09 | Each rule outcome has its own Problem `type` under `/problems/rule-violation/` | DR-048 |
| Scope | All Changes (F-06 to F-17), plus Notes F-19, F-20, F-21 and F-24, now. Notes F-18, F-22, F-23 and F-25 are recorded only | This plan |
| Gate number | The Phase 2 gate becomes DR-049, not DR-046 as brief 7's read-back said. Brief 7 section 7.3 records the correction | DR-049 (PR B) |

## Steps

### PR A: fixes, specification first

1. **Contract v10** (`info.version` 0.7.0).
   - **`DebtOverview.byType`** (F-02).
   - **422 responses split by outcome (F-09):**
     - `out-of-range` (BR-14);
     - `preferred-name` (PR-02);
     - `already-verified` (PR-09);
     - `mobile-number` (PR-06);
     - `code-wrong`, with `attemptsRemaining` as a Problem extension (PR-11);
     - `code-invalid` (expired, voided, the third wrong code, or nothing pending);
     - `overrides-inconsistent` (test control).
   - Examples and descriptions updated to match.
2. **API specification v12.**
   - BR-07 (the breakdown).
   - BR-09 ("after removing characters other than letters and digits", F-07).
   - BR-11 (`changesTotal`, F-20).
   - The month derivation for BR-12 (F-08). Per account, a month is `missed` if it is in `missedMonths`. It is `no-data` if it falls before the month of `openedDate`, after the month of `closedDate`, or after the current month on the clock. Otherwise it is `on-time`. Across a report, a month is `missed` if any account missed it, `on-time` if any account is on time and none missed, and `no-data` otherwise.
   - Section 6.3 drops 403 (F-19).
   - Section 8 lists the 422 types.
3. **UI specification v9.**
   - 6.2: the toggle's call, and its catalogue row names `GET /reports/{id}/changes`.
   - The report-changes route gains `&sentiment=` (F-21).
   - The edit-form catalogue row lists `security/open-redirect.feature` too (F-24).
   - 6.7: the debt breakdown reads `byType`.
4. **Glossary v8.** BR-09 wording; PR-01 to PR-11; current references (F-16); the new term *Account information*, the `detail-meta-*` list (F-05).
5. **Fixtures.**
   - A zero-limit credit-card override sample (F-06), and the BR-03 sample's `arranges` text corrected.
   - Three BR-12 samples for 2025: all on time, no data, part year (F-08).
6. **Scenarios.**
   - **Blockers:**
     - F-01: 198279.60, with the mortgage, utility and credit-account Givens.
     - F-02: rows from `byType`.
     - F-04: "Ally".
     - F-05: "account information".
   - **Changes:**
     - F-09: "is told" outcomes defined by Problem type.
     - F-10: a new `@BR-02` scenario on `drilldown`'s null month.
     - F-11: a `0 days` row.
     - F-12: two `@security` scenarios: an expired token gets 401, and test control off gets 404.
     - F-13: a closed-accounts UI scenario and a mobile sub-page UI scenario.
     - F-17: headers cite sections without a version.
7. **Step glossary v6.** Parameter types for the ten that are missing (F-14); "Used in" and the counts regenerated from the files (F-15); the new steps; the debt example corrected (F-01); arrangements for F-06 and F-08.
8. **Regenerated:** client types (`byType`). The fixture check must cover the new samples. `npm run verify` 9 of 9; `tools/check-gherkin.py` BR 15 of 15.

### PR B: the gate

DR-049 records the Phase 2 gate as met. The review record gains the owner's sign-off. Brief 7 section 7.3 records the DR-049 correction. README 'SDD workflow' shows Phase 2 Met. The backlog marks CDS-18 Done, which makes CDS-19 Ready; the board is regenerated.

### PR C and status PRs

PR C appends the Outcome of both plans and adds an implementation log. Then come the registry label, the landing card and the capability-matrix ledger.

## Outcome

Delivered in #16 (`dca26ce`; CI run 37607379139, `verify` 9/9). The confirmation pass that followed found 1 Blocker and 10 Changes, three of them caused by these fixes (see addendum 2). Full record: [`DOCS/implementation-logs/2026-10-07_cds-18-behaviour-re-review.md`](../implementation-logs/2026-10-07_cds-18-behaviour-re-review.md) and [`.review/2026-10-07_cds-18-behaviour-re-review.md`](../../.review/2026-10-07_cds-18-behaviour-re-review.md).

## Verification

`npm run verify` passes 9 of 9 after PR A, and again after PR B. Each Blocker's scenario now agrees with a value recomputed from the fixtures or the contract. Mock smoke still passes with contract v10, and the client drift check passes after regeneration.

## Delivery

PR A, then PR B, then PR C, then the three status PRs. Each is merged once its own checks pass.
