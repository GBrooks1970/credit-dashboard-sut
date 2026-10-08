---
version: 1
created: 2026-10-08T08:32Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-25
status: approved
approved: "2026-10-08, Gary Brooks, the plan and its slicing; decisions D1 to D8 answered in decision brief 9 on 2026-10-08 (D2 option 5, all others as recommended); merge authority: per PR, on request, after its own CI run reports success"
delivered: not yet
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

[Appended after delivery.]
