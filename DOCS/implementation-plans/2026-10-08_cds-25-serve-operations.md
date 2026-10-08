---
version: 1
created: 2026-10-08T08:32Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-25
status: implemented
approved: "2026-10-08, Gary Brooks, the plan and its slicing; decisions D1 to D8 answered in decision brief 9 on 2026-10-08 (D2 option 5, all others as recommended); merge authority: per PR, on request, after its own CI run reports success"
delivered: "#33 (plan, brief 9), #34, #35 (specification), #36, #37, #38, #40, #41 (the five slices), squash 4128ff0 last; records PR to follow"
language: en-GB
---

# Implementation plan: CDS-25, serve the 29 business operations

**History of this plan.** Presented in full to the owner at 08:32Z on 2026-10-08 (clock read at 08:32:40Z), after a read-only spike. The owner approved the plan and its slicing and asked for the eight open decisions to be put as a decision brief (brief 9). This file records the plan as presented; the decisions table below is completed from brief 9 when it is decided, and no work started before then.

**Goal.** Serve every remaining contract operation from the fixture store, so the contract coverage test's pending list reaches zero (a Phase 3 gate condition; CDS-22 and CDS-23 depend on it). The service reads each user's bound persona document (`PersonaStore.Document`), derives responses with the CDS-20 and CDS-27 libraries, and checks every response against the contract in its own tests.

## Evidence gathered before planning

A read-only spike: contract and specification reading, fixture inspection and a throwaway script (removed). Nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| Fixtures already store contract-shaped `Score`, history, `Summary`, `Change`, `Impact`, `Search`, `PersonalDetails`, `Notification` and accounts (the fixture check validates them against the contract schemas) | Most responses are projections. Only the derived ones need rules: overview, totals, debt, payment history, history range, `nextUpdateInDays`, `Profile`, `User` |
| The mutable state is wider than overrides: account details edits, notification read flags, summary feedback, profile edits (preferred name, email, mobile challenge) | A per-user session-state object in the store, cleared by reset (brief 9 D8 settles rebind) |
| Token lifetime is unspecified: the contract example shows only an `expiresAt` | Brief 9 D2 |
| `payments.newMissed` and `payments.onReport` appear only in the page survey as zeros; no scenario pins them | Brief 9 D4 |
| The assistant is "canned reply keyed by intent", but no intents are defined and no scenario, UI text or glossary entry uses it | Brief 9 D5 |
| `listChanges` takes a `tags` query parameter but `Change` has no tag field | Brief 9 D6 |
| API specification section 8 lists a 503 for an offline bureau; the contract has no 503 and no fixture has an offline field | Brief 9 D7 |
| The edge validates shape before anything else; the CDS-19 log left "does 401 precede 400" open | Brief 9 D3 |
| `ContractModel` builds request schemas only; response schemas are not exposed (read, not run) | Add `ResponseSchema(operation, status)`, following the body-schema builder |
| The persona behaviours (`error` makes every report endpoint 500; `slow` is 3000 ms) are applied nowhere yet | Applied in the report slice |

## Steps

Specification first. Delivered as a specification PR and five slices, each its own pull request.

1. **Specification PR.** `DOCS/.design/operations-cases.md`: for each operation, how the response is composed (which fixture fields are projected, which are derived), paging and filter rules, status codes, and the assistant table if brief 9 D5 keeps it. API specification v19 for the decisions of brief 9. Contract v13 if D6 or D7 change it, with the client and service types regenerated.
2. **S1 Foundation** (login, logout, getMe, listBureaux): the token store on the controlled clock; authentication in the edge in the order brief 9 D3 sets; the per-user session state in `PersonaStore`; `ContractModel.ResponseSchema`; and a test helper that checks a response against the contract.
3. **S2 Report** (getReportOverview, getScore, getScoreHistory, listChanges, getImpact, getReportPaymentHistory, listSearches, getPersonalDetails, setSummaryFeedback): the persona behaviours (`error` gives 500, `slow` gives its delay), paging, filters, and the payments block as brief 9 D4 decides.
4. **S3 Accounts** (listAccounts, getAccountTotals, getAccount, getBalanceHistory, getAccountPaymentHistory, updateAccountDetail): BR-14 and BR-15 wiring, the closed-account window, the details edit held in session state.
5. **S4 Supporting** (getDebtOverview, listNotifications, markNotificationRead, sendAssistantMessage).
6. **S5 Profile** (getProfile, updatePreferredName, changeEmail, resendEmailVerification, changeMobile, verifyMobile): the CDS-27 functions, the per-user challenge and last-sent state, the effect of `verify-email`.
7. **Records** in one PR after S5: DR-055, backlog, Kanban, README, CHANGELOG, this plan's Outcome, an implementation log.

Each slice removes its operations from the coverage test's pending list; after S5 the list is empty.

## Verification

- `npm run verify` passes 11 of 11 in each PR's own CI run, and locally when the mock port is free.
- A test that sends a request for every served operation and success status and checks the response against the contract's response schema.
- At least one probe that must fail per slice, for example a response field removed, a rule bypassed, or an operation left in the pending list.
- After S5 the pending list is empty, and a live run on port 4000 answers a sample of operations as specified.

## Delivery

- Branches: `claude/cds-25-spec`, then `claude/cds-25-s1-foundation`, `-s2-report`, `-s3-accounts`, `-s4-supporting`, `-s5-profile`, then `claude/cds-25-records`.
- Merge only on the owner's authority and each PR's own CI run reporting success. The slices touch overlapping files (`PersonaStore`, `ApiOperations`, the coverage test), so they are merged in order.
- Estimates (mine, not measured): specification 0.3 session, S1 0.75, S2 0.75, S3 0.5, S4 0.4, S5 0.5, records 0.2: about 3.4 sessions.

## Decisions put to the owner

Put as decision brief 9 (`DOCS/decision-briefs/credit-dashboard-sut_decision-brief-9_v1_20261008T0842Z.md`).

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Structure | (a) Specification PR, then S1 to S5 as separate PRs, records last. (b) One large PR | (a) | Option 1, 2026-10-08 |
| D2 Token lifetime | (a) 1 hour. (b) 8 hours. (c) 24 hours | (a) | Option 5 (a setting, default 60 minutes), 2026-10-08 |
| D3 401 versus 400 | (a) Authentication first. (b) Shape first, as today | (a) | Option 1, 2026-10-08 |
| D4 The `payments` block | (a) `onReport` over the BR-12 window; `newMissed` over the last three months. (b) `newMissed` the current month only. (c) Both fixed at 0 | (a) | Option 1, 2026-10-08 |
| D5 The assistant | (a) A small keyword table plus a fallback. (b) One fixed reply | (a) | Option 1, 2026-10-08 |
| D6 `tags` on `listChanges` | (a) Remove from the contract. (b) Keep, accept and ignore. (c) Define it as a filter on `impact` | (a) | Option 1, 2026-10-08 |
| D7 The 503 | (a) Drop it from specification section 8. (b) Add a fixture field and a contract 503 | (a) | Option 1, 2026-10-08 |
| D8 A rebind or reset | (a) Rebinding clears that user's session state; reset clears all. (b) Only reset clears it | (a) | Option 1, 2026-10-08 |

## Outcome

Delivered as planned: a specification PR and five slices, in order, each its own pull request merged on the owner's authority after its own CI run passed.

| PR | Content | Squash | PR CI run |
|---|---|---|---|
| #33, #34 | Plan, decision brief 9; frontmatter fix | `ad6882c`, `50162e8` | 37751881142, 37757581120 |
| #35 | Decisions, DR-055, operation cases, API specification v19, contract v13, UI specification v11 | `d84fc3c` | 37760916414 |
| #36 | S1 foundation: login, logout, getMe, listBureaux (4) | `273cfb5` | 37763518862 |
| #37 | S2 report (9); `client-smoke` honours `MOCK_PORT` | `9ad62c7` | 37766490748 (first run 37766149510 failed) |
| #38 | S3 accounts (6); contract v14, specification v20 | `6f44b40` | 37771222801 |
| #40 | S4 supporting (4); contract v15, specification v21 | `0403739` | 37773175339 |
| #41 | S5 profile (6); the pending list empty | `4128ff0` | 37774916792 |

Service tests grew 68, 103, 161, 211, 241, 290 (35, 58, 50, 30 and 49 new per slice). Every slice ran probes that had to fail, and each failed as intended after the corrections below.

Differences from the plan:

- **Contract v14 and v15 and specification v20 and v21** were not in the plan. The response check (every served response against the contract) found operations that could answer 400 without the contract saying so: the account-by-ID operations (S3) and the two notification operations (S4). The specification already said 400 for one of them.
- **A first CI failure in S2.** The `MOCK_PORT` change to `tools/client-smoke.ts` used `process`, which the client package type-checks without Node typings; the client check failed in CI. It was fixed in the same PR (reading the environment through `globalThis`). The local full `verify` had not been re-run after that edit.
- **A probe that passed in S4.** Replacing unread-first with newest-first did not turn a test red, because no fixture had an older unread notification under a newer read one. A test for that case was added and the probe redone.
- **Edge tests removed in S5.** The two tests for an operation "not served yet" lost their last operation when the pending list emptied.
- **Readings** in the cases (accountTypes, default bureau for the debt overview, a closed account past its window as a 404, minimum-payment shape, the payment-method values, null clearing a field, the slow persona's delay added to test control's, expiry at or after `expiresAt`) were treated as standing when the specification PR was merged.

Full record: [`DOCS/implementation-logs/2026-10-08_cds-25-serve-operations.md`](../implementation-logs/2026-10-08_cds-25-serve-operations.md).
