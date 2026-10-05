---
version: 1
created: 2026-10-04T23:19Z
project: credit-dashboard-sut
type: decision-brief
brief: 3
subject: Email and mobile verification rules (CDS-11)
blocks: CDS-11 (email and mobile contract operations)
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Record four decisions that turn the profile spec's verification behaviour into rules.
  LOCATION: DOCS/decision-briefs/ (Phase 0 pack)
  TEMPLATE: templates/decision-brief.template.md (portfolio root)
-->

# Decision brief 3: email and mobile verification rules

**Items decided:** D1 resend rate limit (PR-09); D2 one-time code length and expiry (PR-10); D3 wrong-code attempts (PR-11); D4 changing to the email already held (PR-04).
**Blocked:** CDS-11, the email and mobile operations in the contract.

**How this brief came about.** As with briefs 1 and 2, the options were put by interview on 4 October 2026 (one round, then a read-back), the owner answered in that session, and the brief was written **after** the decisions, from the options and arguments exactly as put.

## 1. Why this brief exists

Adding the email and mobile operations (DR-022, Release 3) needed values the profile spec names but does not give: a "rate-limited" resend, a code with "expiry via clock control", a "fixed code in test mode". Each value is a rule a scenario will assert, so the agent did not choose them.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (CDS-11)
- [ ] A decision already made implicitly in an artefact needs ratifying
- [ ] An earlier decision is being reversed or narrowed
- [ ] Two documents disagree

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | Email sub-page: "Resend verification" with a rate limit as test interest | Profile spec v3 section 4 |
| B2 | Mobile sub-page: mock one-time code, fixed in test mode, expiry via clock control | Profile spec v3 section 4 |
| B3 | PR-04: changing the email sets it to Unverified; PR-06: UK mobile format, stored as `+44` | Profile spec v3 section 5 |
| B4 | The error catalogue lists `429 /rate-limited`; the contract defines no 429 response | API spec v6 section 8; contract v5 |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | What rate limit on resend? | Unchanged. Follow-ups: when the window starts; resending a verified email | Yes | D1 |
| Q2 | Code length and expiry? | Unchanged. Follow-ups: the code outside test mode; a code with nothing pending | Yes | D2 |
| Q3 | How many wrong attempts? | Unchanged | Yes | D3 |
| Q4 | Changing to the same email? | Restated: is it a change at all, under PR-04? | Yes | D4 |

Nothing carried forward.

## 4. Decision items

### D1. Resend rate limit (PR-09)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | One per 60 seconds, on the controlled clock; 429 with `Retry-After` | Simple boundary: 59 s refused, 60 s allowed | **Recommended** |
| 2 | Three per hour | Closer to common practice; a sliding window is harder to state | Considered |
| 3 | No limit | Loses the 429 path | Considered |

**Recommendation: option 1.** **The argument against.** A fixed short window is unlike real services, which often cap per hour too.

### D2. One-time code (PR-10)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Six digits, expires 10 minutes after issue; fixed `123456` in test mode | Clock-driven expiry to test | **Recommended** |
| 2 | Six digits, 5 minutes | Slightly stricter | Considered |
| 3 | No expiry | Loses the expiry path | Considered |

**Recommendation: option 1.** **The argument against.** Ten minutes is generous for a text-message code.

### D3. Wrong-code attempts (PR-11)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | The third wrong code voids the challenge; a new code must be requested | A clear lock-out boundary | **Recommended** |
| 2 | Unlimited until expiry | Simpler; no lock-out | Considered |

**Recommendation: option 1.** **The argument against.** One more state to specify and test.

### D4. Changing to the email already held (PR-04)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Not a change: address and status kept; 200 with the current state | Idempotent PUT | **Recommended** |
| 2 | Refused with 422 | Clear feedback; a PUT that fails when repeated | Considered |

**Recommendation: option 1.** **The argument against.** The customer gets no signal that nothing happened.

## 5. Not in this brief

- Address, employment and finances operations: stretch (DR-022).
- Extending test-control overrides to profile data: the new scenarios arrange state through the operations, `POST /__test/verify-email` and the clock.

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | DR-024 to DR-027 | One entry per item | [x] |
| Contract | v6 | Five operations; a 429 response | [x] |
| My Profile UI feature spec | v4: sections 4, 5, 6 | PR-04 amended; PR-09 to PR-11 | [x] |
| API spec | v7: sections 6.5, 6.6 | Operations in the contract; test control row | [x] |
| UI spec | v5: sections 5, 6.9; companion links | Email and mobile sub-pages in the catalogue | [x] |
| `features-shared/api/profile-contact.feature` | New | Scenarios for PR-04, PR-06, PR-09, PR-10, PR-11 | [x] |
| `DOCS/step-glossary.md`, `DOCS/glossary.md` | New steps and terms | | [x] |
| `DOCS/backlog.md`, `README.md`, `_manifest.md` | CDS-11 | Record | [x] |
| `DOCS/decision-briefs/_index.md` | Brief 3 row | | [x] |

## 7. Decision record

### 7.1 Read-back

Read back on 4 October 2026 before recording, with eight conditions:

1. The 60 seconds run from the last verification link sent; an email change sends one, so a resend within 60 seconds of a change is refused.
2. A resend for an already verified email is a 422; nothing is sent.
3. `PUT /me/profile/mobile` stores the new number at once as unverified and issues a code; a correct code marks it verified. A number outside PR-06 is a 422.
4. The demo never sends a text message: the code is always `123456` in every build, and the page says so beside the code field.
5. A code submitted with nothing pending (never requested, voided or expired) is a 422 telling the customer to request a new code.
6. `POST /__test/verify-email` takes `{ "username": "alex" }`, marks that email verified, returns 204; 404 when test control is off or the user is unknown.
7. Recorded as DR-024 to DR-027; PR-09 to PR-11 added and PR-04 amended in the profile spec v4.
8. This branch: contract v6 with the five operations and a reusable 429 response; API spec v7; UI spec v5 (catalogue and link fix); `api/profile-contact.feature`; step glossary and backlog. Overrides are not extended to profile data.

Owner's reply, 4 October 2026: "All agreed as recommended."

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Resend limit (PR-09) | **Option 1.** One resend per 60 s; a resend is allowed when at least 60 s have passed since the last link | Conditions 1, 2 | Gary Brooks | 2026-10-04 |
| D2 | One-time code (PR-10) | **Option 1.** Six digits; valid while less than 10 minutes have passed since issue; always `123456` | Conditions 3, 4, 5 | Gary Brooks | 2026-10-04 |
| D3 | Attempts (PR-11) | **Option 1.** The third wrong code voids the challenge | Condition 5 | Gary Brooks | 2026-10-04 |
| D4 | Same email (PR-04) | **Option 1.** Not a change; 200 with the current state | | Gary Brooks | 2026-10-04 |

**Recorded, not argued away.** Every item went with its recommendation, so each argument against still stands. Condition 4 widens "fixed code in test mode" (profile spec section 4) to every build, because the demo has no way to send a code.

**Left unresolved.** Nothing.

### 7.3 Corrections after decision

None.
