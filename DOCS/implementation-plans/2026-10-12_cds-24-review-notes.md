---
version: 1
created: 2026-10-11T15:09Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-24
status: implemented
approved: "2026-10-12, Gary Brooks, 'approve plan as recommended, one PR' (scope answers of 2026-10-11: tag the two UI scenarios, add the BR-15 change scenario, defer the bug-flag catches to Phase 5, decide the changes-toggle page size in the CDS-29 plan); merge authority: per pull request, on request"
delivered: "#61 (specification, scenarios, harness step, contract v17, records), squash fdfc682"
language: en-GB
---

# Implementation plan: CDS-24, the remaining CDS-18 review Notes

**History of this plan.** Presented in full to the owner on 2026-10-11 (after a triage of the 25 Notes across the three passes of `.review/2026-10-07_cds-18-behaviour-re-review.md`), with the owner's four scope answers recorded below, and approved on 2026-10-12 as recommended, in one pull request.

**Goal.** Close the Notes the re-review left open so the glossary, the specifications and the feature files are firmer before the Phase 4 UI plan (brief 10 D3). It unblocks CDS-29.

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| 14 of the 25 Notes are closed or deliberate: fixed in #16 (pass 1 F-19, F-20, F-21, F-24), closed by later work (pass 2 F-12 the 30-character row, F-13 the contract 404s in v14 and v15, F-15 spaces in CDS-27; pass 1 F-23's BR-14 boundary rows now in `api/account-details.feature`; pass 3 F-06 singular types), resolved in the review (pass 3 F-08, F-09, F-11, F-13), or deliberate (PR-05; pass 3 F-14) | No work |
| Pass 1 F-22's personal-details hooks (`pd-address-current`, `pd-address-previous-{n}`, `pd-electoral-roll`) are already in UI specification 6.7; only the BR-14 form error copy is missing from 6.6 | Add the copy only |
| Ten Notes are specification or documentation text; two are scenario changes (tags on two UI scenarios; the BR-15 change half); one (bug-flag catches) belongs to Phase 5; one (the changes-toggle page size) is a UI behaviour | Scope below |
| The harness runs every `@api` scenario; a new scenario needs its step defined in the same pull request or `verify` fails | One pull request |

## Steps

Specification first, in one pull request.

1. **Step glossary v11:** section 1 gains a note that UI money steps compare at the precision the figure is shown; the `today is {date}` row says the harness freezes the clock at 09:00:00 UTC on the date; `{accountType}` gains `current account` and `current accounts`; `{provider}` gains `Lender X` as an example and the 4.1 row says `the {provider} card` is that provider's open credit card in the bound persona; a new 4.1 row for `{actor} sets the interest rate on one of {actor}'s accounts to {percent}`; counts refreshed.
2. **Feature files** (version comments bumped): `ui/account-drilldown.feature` tags the type-list scenario `@BR-04`; `ui/report-overview.feature` tags the three-newest scenario `@BR-11`; `ui/debt.feature` gains a comment naming July 2026 as the trend base; `ui/account-details-form.feature` drops the return-link clause from its description; `security/access-control.feature` gains 'Another customer's account cannot be changed' (`@BR-15`, Sam holds `excellent`, Alex sets the rate on one of Sam's accounts, the account is not found).
3. **Harness:** the step definition in `act.steps.ts` (the other user's first fixture account, `updateAccountDetail`); the design note's counts (59 scenarios).
4. **UI specification v12:** the `detail-tile-{field}` form (the field name in kebab case, for example `detail-tile-interest-rate`); the BR-14 error copy for `dc-error`. **UI feature spec My Profile v8:** a section 4.2 for the email sub-page in the shape of 4.1.
5. **Contract v17** (`info.version` 0.9.4): the `RuleViolation` description reads 'out of range or too precise (BR-14)'; description only. Regenerate the C# contract files and the typed client. DR-048 gains a note that `out-of-range` covers both limits (a register entry, DR-061).
6. **Records:** backlog CDS-24 closed with the triage; CHANGELOG; plans index; the README and CHANGELOG scenario counts. The implementation log is written with the skill after the merge. The public '72 scenarios' wording (registry, landing card, capability matrix) is updated in separate pull requests after the merge.

## Verification

- `npm run verify` passes 14 of 14 locally and in the pull request's own CI run, with counts and durations as measured: the Gherkin check at 73 scenarios, contract lint and drift, the harness at 59 scenarios.
- Probes that must fail, reverted afterwards: the new scenario goes red when the service lets one user edit another's account (the owner check skipped); the Gherkin gate fails when a `@BR-04` or `@BR-11` tag is removed.
- 309 service tests and 234 rule tests unchanged.

## Delivery

- Branch `claude/cds-24-notes`; one pull request, then a records pull request and the log.
- Merge only on the owner's authority and the pull request's own CI run reporting success.
- Estimate (mine, not measured): about 0.5 session.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Tag the two untagged UI scenarios | Tag them, or record the gap | Tag them | Tag them (2026-10-11) |
| D2 The BR-15 change half | New scenario, or service tests only | New scenario | New scenario (2026-10-11) |
| D3 The three bug-flag catches | Defer to the Phase 5 plan, or add scenarios now | Defer | Defer to Phase 5 (2026-10-11) |
| D4 The changes-toggle page size | Decide in the CDS-29 plan, or now | In CDS-29 | In CDS-29 (2026-10-11) |
| D5 Delivery | One pull request, or the contract description change split out | One | One pull request (2026-10-12) |

## Not in this item

The three bug-flag scenarios (Phase 5 plan); the changes-toggle page size (CDS-29 plan); PR-05 (a deliberate gap).

## Outcome

Delivered as planned in one pull request.

- **#61** (`fdfc682`, PR CI run 38233159852: `Verify` success, 1 m 30 s). Local: `npm run verify` 14 of 14 (steps sum to 284.7 s on a busy machine), 309 service tests, 234 rule tests, harness 59 of 59, Gherkin check 73 scenarios and 15 of 15 BR tags.
- **Public counts** after the merge: `portfolio-prompts#120` (`6cdbfb7`), `portfolio#69` (`962bfd9`), `test-automation-portfolio#316` (`6d932d5`).

Probes: the BR-15 scenario fails when the details edit ignores ownership (`Expected 404, got 200`). Removing the `@BR-11` tag from the UI scenario was **not** caught: the Gherkin gate checks that each rule is tagged somewhere, and the API scenarios still carry it.

Differences from the plan:

- **The tag probe in the plan could not fail** for the reason above; it is reported as it ran.
- **Pass 1 F-22 was smaller than planned:** the personal-details hooks were already in UI specification 6.7; only the BR-14 error copy was added.
- **No change** to the service or its tests (309 unchanged).

Full record: [`DOCS/implementation-logs/2026-10-12_cds-24-review-notes.md`](../implementation-logs/2026-10-12_cds-24-review-notes.md).
