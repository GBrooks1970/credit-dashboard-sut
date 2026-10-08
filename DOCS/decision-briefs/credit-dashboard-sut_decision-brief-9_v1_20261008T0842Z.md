---
version: 1
created: 2026-10-08T08:42Z
project: credit-dashboard-sut
type: decision-brief
brief: 9
subject: Serving the 29 business operations (CDS-25): structure, token lifetime, check order, and five gaps in the specification
blocks: CDS-25 and so CDS-22 and CDS-23; the Phase 3 gate
approver: the project owner (Gary Brooks)
status: awaiting-decision
supersedes: none
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Put to the owner the eight open decisions of the CDS-25 plan, with the case for and against each option.
  LOCATION: DOCS/decision-briefs/
  TEMPLATE: templates/decision-brief.template.md (portfolio root)
-->

# Decision brief 9: serving the 29 business operations (CDS-25)

**Items to decide:**

- D1: how CDS-25 is structured and delivered;
- D2: how long a token lasts;
- D3: whether authentication is checked before request shape;
- D4: what `payments.newMissed` and `payments.onReport` mean;
- D5: what the mock assistant says;
- D6: what the `tags` query parameter on the changes list does;
- D7: whether an offline bureau (503) exists;
- D8: whether rebinding a persona clears a user's edits.

**Blocks:** CDS-25 (serve the 29 business operations). CDS-22 (the harness) and CDS-23 (Schemathesis) wait on it, and so does the Phase 3 gate. The plan (`DOCS/implementation-plans/2026-10-08_cds-25-serve-operations.md`) is approved; no work starts until these are decided.

**Reply with:** "D1: option n" to "D8: option n", or "all as recommended", with any conditions. Answers are read back before anything is recorded.

**Decide D1 first.** The rest are independent of each other, except that D6 and D7 decide whether the contract changes.

## 1. Why this brief exists

A read-only spike for the CDS-25 plan found that the specification is silent or inconsistent in five places that a service has to answer one way or another: the token lifetime, the `payments` block, the assistant, the `tags` parameter and the 503. A sixth, whether authentication comes before shape validation, was left open at CDS-19. Deciding any of them silently while writing code would be drift. Two more are structural: how the work is cut, and what a rebind does to a user's edits.

The blast radius is the 29 operations, `API specification` sections 3, 6 and 8, and possibly the contract (D6, D7) with the generated client and service types.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time
- [ ] A decision already made implicitly in an artefact needs ratifying
- [ ] An earlier decision is being reversed or narrowed
- [x] Two documents disagree (D7: API specification section 8 lists a 503 that the contract does not have; D6: the contract has a `tags` parameter that its own `Change` schema cannot serve)

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | **Most responses are projections.** The fixtures store contract-shaped `Score`, score history, `Summary`, `Change`, `Impact`, `Search`, `PersonalDetails`, `Notification` and accounts; the fixture check validates them against the contract schemas (448 checks). Only some responses are derived: overview, totals, debt, payment history, `nextUpdateInDays`, `Profile`, `User` | `fixtures/persona.schema.json`; `fixtures/schema-check.mjs` |
| B2 | **No token lifetime is specified.** The contract's login example shows `expiresAt: 2026-10-03T18:15:00Z` with no issue time; the specification says only that a token's `expiresAt` is judged on the controlled clock, so moving the clock past it expires the token. The `@security` scenario "An expired token is refused" works with any lifetime | `openapi.yaml` (`/auth/login`, `LoginResponse`); API specification section 3 'Auth' (Proposed); `features-shared/security/session-and-test-control.feature` |
| B3 | **Some scenarios move the clock by days.** `today is {date}` and `the next bureau refresh is {days} away`; the BR-08 UI outline reloads the overview after the clock moves. A token issued before such a move expires if the move passes `expiresAt`, so the harness signs in after moving the clock whatever the lifetime | `DOCS/step-glossary.md`; `ui/report-overview.feature` |
| B4 | **The edge checks shape first.** `ContractValidation` matches the operation, then validates path, query and body, then passes the request on. The CDS-19 log left "whether 401 precedes 400 for protected operations" open. The Prism mock answers 401 to a call without a token | `Edge/ContractValidation.cs`; `DOCS/implementation-logs/2026-10-07_cds-19-service-scaffold.md`; API specification section 11 'Mock parity' |
| B5 | **`payments` is undefined.** The overview's `payments` block (`newMissed`, `onReport`) appears only in the page survey as zeros; the UI specification names hooks `payments-new-missed` and `payments-on-report` ("zero and non-zero"); no feature file pins a value | `DOCS/.design/page-survey.md`; UI specification section 5; a search of `features-shared/` |
| B6 | **The assistant is undefined.** API specification 6.4 says "canned reply keyed by intent". No intents are defined, and no feature file, UI text or glossary entry mentions the assistant | API specification 6.4; a search of `features-shared/`, the UI specification and the step glossary |
| B7 | **`tags` has no target.** `listChanges` takes a `tags` query string and a `sentiment` filter. `Change` has `id`, `title`, `sentiment`, `impact` and `date`, and no tag. The UI route cites `tags=` | `openapi.yaml` (`listChanges`, `Change`); UI specification section 5 |
| B8 | **The 503 exists in one document.** API specification section 8 lists 503 `/unavailable` ("Bureau marked offline in fixtures"). The contract has no 503 response and no fixture has an offline field | API specification section 8; `openapi.yaml`; `fixtures/personas/*.json` |
| B9 | **More state than overrides.** The service is "stateless apart from the in-memory store, the active bug flags and the controlled clock", and reset clears those. Operations that change state: the account details PATCH, the notification PATCH, the summary feedback PUT, and the profile operations (preferred name, email, mobile challenge) | API specification section 3; `openapi.yaml` |
| B10 | **The cut.** 29 operations: foundation 4 (login, logout, getMe, listBureaux), report 9, accounts 6, supporting 4, profile 6 | `openapi.yaml`; the CDS-25 plan |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | "Write the slicing proposal" (owner, 2026-10-08) | One question: one PR or several, and in what order. Premise checked: the slices touch overlapping files (B10) | Yes | D1 |
| Q2 | (implicit) How long does a login last? | A number is needed; the specification gives none (B2) | Yes | D2 |
| Q3 | CDS-19 log: "decide whether 401 precedes 400 at the edge" | Two checks, one order (B4) | Yes | D3 |
| Q4 | (implicit) What do `newMissed` and `onReport` count? | Premise checked: nothing defines them (B5) | Yes | D4 |
| Q5 | (implicit) What does the assistant say? | Premise checked: nothing uses it (B6) | Yes | D5 |
| Q6 | (implicit) What does `tags` filter? | Premise checked: `Change` has no tag (B7). The parameter is the variable | Yes | D6 |
| Q7 | (implicit) Is a bureau ever offline? | Two documents disagree (B8) | Yes | D7 |
| Q8 | (implicit) Does a rebind keep a user's edits? | Reset is specified; rebind is not (B9) | Yes | D8 |

**Carried forward:** none. Every question is decidable now.

## 4. Decision items

### D1. How CDS-25 is structured and delivered

**What is being decided.** Whether the 29 operations arrive as one pull request or several, and whether the specification comes first.

**Why it matters.** It sets how many reviews and merges the owner makes, and whether the unspecified behaviour is reviewed before any code.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **A specification PR, then five slices, then records.** Slices: foundation (4 operations), report (9), accounts (6), supporting (4), profile (6). Each slice removes its operations from the coverage test's pending list | Small reviewable PRs; the unspecified behaviour is reviewed as text first. Seven merges, in order, because the slices share files | **Recommended** |
| 2 | **One large PR** with everything | One review and one merge, but a diff of 29 operations and their tests, and nothing is merged until all of it is right | Considered |
| 3 | **Do nothing special.** Start with the foundation slice and put each slice's specification text in its own PR | Fewer PRs than option 1, but the gaps in B5 to B8 would be decided inside code reviews | Considered |
| 4 | **Reframe.** Cut by layer, not by area: one PR for token, session state and response checking, then one PR for all 28 remaining operations | Two big steps; the second is nearly option 2 | Considered |

**Recommendation: option 1.** The evidence: the slices overlap in `PersonaStore`, the route mapping and the coverage test (B10), so they cannot be reviewed independently, only in order. The judgement: a specification PR first is the project's pattern (CDS-19, CDS-20, CDS-21), and it kept the code PRs free of unanswered questions.

**The argument against.** Seven merges is seven interruptions for one owner, and the first PR contains no running code. Option 2 shows the finished service in one review. **Option 2 is the stronger answer if you would rather make one decision on a working service than seven on increments.**

**What would change the recommendation.** The owner wanting fewer merges; then option 4, with the specification still first.

### D2. How long a token lasts

**What is being decided.** The lifetime of a token issued by `POST /auth/login`, judged on the controlled clock.

**Why it matters.** It fixes `expiresAt` in every login response and decides when a long-running session fails. The `@security` expiry scenario passes with any value; scenarios that move the clock by days (B3) behave the same with any value below days.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **1 hour** | The conventional short-lived access token. A frozen clock never expires it; on real time a session over an hour needs a new sign-in | **Recommended** |
| 2 | **8 hours** | A working day. A scenario that moves the clock by a day still expires it | Considered |
| 3 | **24 hours** | Rarely expires on real time; a scenario that moves the clock forward by more than a day still does | Considered |
| 4 | **Do nothing.** Leave it to the implementation | The number is chosen in code and found in a test | Considered |
| 5 | **Reframe.** Make the lifetime a setting (`TOKEN_LIFETIME_MINUTES`, default 60) | Tests can shorten it; one more knob and one more thing to document | Considered |

**Recommendation: option 1.** The evidence: the value does not change any specified scenario (B2, B3). The judgement: a short lifetime is the usual choice, and a failure to sign in again after a long gap is realistic behaviour for a demonstration.

**The argument against.** A longer lifetime is kinder to real-time use: a person exploring the demo for more than an hour would be signed out with no warning, and the UI would need a re-sign-in flow that no page specifies. Option 3 avoids that at no cost to the tests. **Option 3 is the stronger answer if the demo is expected to be used by people, not only by the harness.**

**What would change the recommendation.** The UI specifying a session-expiry flow; then the lifetime follows it.

### D3. Whether authentication is checked before request shape

**What is being decided.** For a protected operation, the order of the checks: token first, or shape first.

**Why it matters.** A request with no token and a bad query gets 401 under one order and 400 under the other. Tests and clients branch on that status.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Authentication after the route is matched, before shape.** No token, or an expired or revoked one, is a 401 whatever else is wrong | An unauthenticated caller learns nothing about the request shape. Matches the Prism mock | **Recommended** |
| 2 | **Do nothing.** Shape first, as the edge does today | A caller with no token still gets a 400 describing what is wrong with the request; two statuses to cover per operation | Considered |
| 3 | **Reframe.** Authenticate before routing, so any request without a token is 401 | A mistyped path with no token would look like an authentication failure; the contract says an unknown route is 404 | Rejected: listed because it is the shape "authentication first" drifts into |

**Recommendation: option 1.** The evidence: the mock already behaves so (B4). The judgement: authentication before validation is the usual order, and it keeps the number of statuses a test must reason about down.

**The argument against.** Shape-first is what exists, it is tested, and it needs no change. A harness that sends a malformed request without a token to prove the edge works gets a clear 400 today. **Option 2 is the stronger answer if you want the smallest change and you value diagnosable errors over discretion in a demonstration service.**

**What would change the recommendation.** A security scenario that expects 400 for a malformed unauthenticated request; none exists.

### D4. What `payments.newMissed` and `payments.onReport` mean

**What is being decided.** The definition of the two counts in the report overview.

**Why it matters.** The overview page shows them (`payments-new-missed`, `payments-on-report`), and "zero and non-zero" scenarios will need a persona that gives each.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **`onReport`: missed account-months in the BR-12 window (the current year and six before). `newMissed`: those in the last three months to the clock month** | Derived from data the library already reads (BR-12, BR-02's shortest range). The `struggling` persona gives non-zero values; `excellent` gives zero | **Recommended** |
| 2 | **`newMissed`: the current month only** | Narrower; most personas give zero, so "non-zero" needs an override | Considered |
| 3 | **Do nothing.** Both fixed at 0, as in the survey | Honest about an unspecified feature, but "non-zero" can never be shown | Considered |
| 4 | **Reframe.** Remove `payments` from the overview (contract v13) | Contradicts the UI specification's hooks and card | Set aside: revive if the card is cut from the UI |

**Recommendation: option 1.** The evidence: nothing pins a value (B5), so any definition is free, and this one uses rules that exist. The judgement: "new" is naturally recent, and three months matches the shortest history range.

**The argument against.** I am inventing a definition for a number no one has asked for, and writing it into the specification makes it a rule. Option 3 changes nothing and costs only the ability to show a non-zero card, which no scenario currently needs. **Option 3 is the stronger answer if you want the specification to contain only what a scenario needs.**

**What would change the recommendation.** The UI specification or a scenario giving the counts a meaning; then that meaning wins.

### D5. What the mock assistant says

**What is being decided.** The behaviour of `POST /assistant/messages`.

**Why it matters.** The operation must be served for the Phase 3 gate (the pending list reaches zero), and its reply shape is fixed (`reply`, `disclaimer`).

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **A small keyword table:** three intents (score, debt, payments) and a fallback, each with a fixed reply, and one fixed disclaimer, all in the case tables | Matches "keyed by intent"; deterministic and testable | **Recommended** |
| 2 | **One fixed reply** for every message | The least surface; ignores "keyed by intent" | Considered |
| 3 | **Do nothing.** The implementation picks | The behaviour is invented in code | Considered |
| 4 | **Reframe.** Remove the operation until a page needs it (contract v13) | Contradicts the 36-operation contract and the coverage test | Set aside: revive if the assistant is cut from the UI |

**Recommendation: option 1.** The evidence: the specification asks for intents (B6), and nothing contradicts it. The judgement: a three-row table is small, and it is better written in a case table than found in code.

**The argument against.** Nothing exercises the assistant, so the table is surface for no scenario. Option 2 satisfies the contract and the gate in one line, and can be extended when a page appears. **Option 2 is the stronger answer if you value the smallest specification over fidelity to a one-line phrase.**

**What would change the recommendation.** A UI page or scenario that needs the assistant to say something specific.

### D6. What `tags` does on the changes list

**What is being decided.** The treatment of the `tags` query parameter on `GET /reports/{bureauId}/changes`.

**Why it matters.** A parameter that does nothing is a contract defect: a test that sends it proves nothing, and a client may rely on it.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Remove it from the contract (v13)** and from the UI route text | The contract describes only what works. Client and service types are regenerated | **Recommended** |
| 2 | **Do nothing.** Keep it; the service accepts and ignores it | Zero change, and a silent no-op | Considered |
| 3 | **Define it as a filter on `impact`** (comma-separated `low`, `medium`, `high`) | A working filter, but a meaning invented for a name that suggests something else | Considered |
| 4 | **Reframe.** Give `Change` a `tags` field and filter on it | The honest version of the feature; changes fixtures, the contract and the page survey | Set aside: revive if the UI needs topic filters |

**Recommendation: option 1.** The evidence: the contract's own `Change` schema cannot serve the parameter (B7). The judgement: contract first means the contract does not carry what cannot work.

**The argument against.** The UI route already carries `tags=`, so removing the parameter edits a UI specification page for a field that was probably copied from the source site. Option 2 leaves the route as it is and costs one line in the service. **Option 2 is the stronger answer if you want to keep the UI route unchanged and accept a documented no-op.**

**What would change the recommendation.** The UI specifying topic filters; then option 4.

### D7. Whether an offline bureau (503) exists

**What is being decided.** Whether API specification section 8's 503 is real.

**Why it matters.** Two documents disagree (B8). If it is real, the contract and a fixture field need it and a test must produce it.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Drop the 503 from section 8** | One document corrected; the failure modes are the existing 404 and 500 | **Recommended** |
| 2 | **Do nothing.** Leave the disagreement | A specification row no test or fixture can produce | Considered |
| 3 | **Add it:** a fixture field, a 503 response in the contract (v13), a scenario | A third failure mode to test, which the `error` persona's 500 already approximates | Considered |
| 4 | **Reframe.** Map an offline bureau to the `error` persona's 500 | No new status; a different meaning for 500 | Rejected: listed because it hides the case instead of deciding it |

**Recommendation: option 1.** The evidence: nothing in the contract or fixtures supports a 503 (B8). The judgement: an unproduced status is clutter.

**The argument against.** A showcase for test automation benefits from failure modes, and an unavailable upstream is a classic. Option 3 gives the harness something real to assert and costs one fixture field and one contract response. **Option 3 is the stronger answer if you want the portfolio to show more resilience scenarios.**

**What would change the recommendation.** A planned resilience scenario; then option 3.

### D8. Whether rebinding a persona clears a user's edits

**What is being decided.** What happens to a user's session state (account detail edits, read notifications, feedback, profile edits) when test control binds them to a persona.

**Why it matters.** Scenarios start with `holds the {persona} persona`. If edits survive a rebind, one scenario's edits can leak into the next.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **A rebind clears that user's session state; a reset clears everyone's** | Each scenario starts clean after its binding step | **Recommended** |
| 2 | **Do nothing.** Only a reset clears it | Edits survive a rebind; scenarios must reset first | Considered |
| 3 | **Reframe.** Key the state by user and persona, so edits return when the user switches back | Surprising state across rebinds | Rejected: listed because it is the shape the idea drifts into |

**Recommendation: option 1.** The evidence: reset is specified (B9); rebind is not. The judgement: a new persona is a new starting point.

**The argument against.** Scenarios that change the persona partway through (to test a second persona's data) would lose edits made earlier, and a test author must reset anyway for the other state (flags, clock). Option 2 is simpler to state: reset clears all, nothing else does. **Option 2 is the stronger answer if you prefer one rule to remember over a safer default.**

**What would change the recommendation.** A scenario that rebinds mid-way and expects its edits to remain.

## 5. Not in this brief

- Persona behaviours (`error` gives 500, `slow` its delay): already specified, applied in the report slice.
- The harness side of token expiry (signing in after moving the clock): CDS-22.
- Bug-flag effects: Phase 5.
- Whether the Kanban board should be published: a separate owner decision.

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | New entry | The outcome, citing this brief (DR-055) | [ ] |
| `DOCS/implementation-plans/2026-10-08_cds-25-serve-operations.md` | Decisions table | Owner's answers | [ ] |
| `DOCS/.design/api-specification.md` | Sections 3, 6.4, 8 | v19: token lifetime (D2), check order (D3), `payments` (D4), assistant (D5), the 503 (D7), rebind (D8) | [ ] |
| `DOCS/.design/operations-cases.md` | New | Response composition per operation; the assistant table (D5) | [ ] |
| `DOCS/.architecture/openapi.yaml` | `listChanges` | Remove `tags` (D6 option 1), with the client and service types regenerated | [ ] |
| `DOCS/.design/ui-specification.md` | Section 5 route | Drop `tags=` (D6 option 1) | [ ] |
| `DOCS/decision-briefs/_index.md` | Brief 9 row | Status and where the decision landed | [x] row added as awaiting-decision |

## 7. Decision record

Not yet decided. Completed after the owner's reply and a read-back.
