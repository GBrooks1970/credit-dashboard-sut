---
version: 1
created: 2026-10-05T20:28Z
project: credit-dashboard-sut
type: decision-brief
brief: 5
subject: Owner review and Phase 0 baseline (CDS-01)
blocks: CDS-09 (own repository); README Phase 0 exit gate
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Record the owner's overall review: the still-Proposed decisions, the open questions left in the
            specifications, and acceptance of the Phase 0 baseline.
  LOCATION: DOCS/decision-briefs/ (Phase 0 pack)
  TEMPLATE: templates/decision-brief.template.md (portfolio root)
-->

# Decision brief 5: owner review and Phase 0 baseline

**Items decided:** D1 the seven Proposed decisions; D2 the overview call; D3 the general rate limit; D4 the greeting name; D5 the debug panel; D6 the Phase 0 baseline.
**Blocked:** CDS-09 (own repository) and the README Phase 0 exit gate ("owner accepts DRs; DR-005 decided; this folder frozen").

**How this brief came about.** One interview of two rounds between the owner and the agent on 5 October 2026, then a read-back before anything was recorded. The brief was written **after** the decisions, from the options and arguments exactly as put.

## 1. Why this brief exists

CDS-01 is the owner's overall review and the last blocker for CDS-09. Its substance: seven decisions still `Proposed` (DR-001, DR-004, DR-006 to DR-010), three open questions in API spec v7 section 12, one in UI spec v5 section 10, and acceptance of the specifications as the baseline to freeze.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (CDS-09)
- [x] Decisions already made implicitly need ratifying: every artefact since 3 October assumes DR-001, DR-004 and DR-006 to DR-010
- [ ] An earlier decision is being reversed or narrowed
- [ ] Two documents disagree

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | Seven decisions `Proposed` since 3 October 2026 | Decision register v5 |
| B2 | Overview: one aggregate call feeds every section but the history chart | Contract v6; UI spec v5 section 6.2 |
| B3 | The error catalogue lists a general limit of 100 requests per minute per token; the only 429 in the contract is PR-09's resend limit | API spec v7 section 8; contract v6 |
| B4 | `GET /me` returns `id`, `displayName` (the legal name), `defaultBureauId`; PR-03 puts the preferred name in greetings | Contract v6; profile spec v4 |
| B5 | The debug panel is visible only when test control is enabled; DR-008 keeps test control off by default | UI spec v5 section 6.8; DR-008 |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | Accept the seven Proposed decisions? | Unchanged | Yes | D1 |
| Q2 | One aggregate overview call or several? | Unchanged | Yes | D2 |
| Q3 | Does rate limiting belong in Phase 3 or later? | Restated: does v1 have a general rate limit at all? | Yes | D3 |
| Q4 | Should `GET /me` return the preferred name as `displayName`, or should the UI read `/me/profile`? | Restated: three options, adding a new field | Yes | D4 |
| Q5 | Does the debug panel ship in the public demo build? | Unchanged | Yes | D5 |
| Q6 | Accept the specifications as the baseline? | Unchanged | Yes | D6 |

Nothing carried forward.

## 4. Decision items

### D1. The seven Proposed decisions

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Accept all seven | Every later artefact already assumes them | **Recommended** |
| 2 | Accept all but some | Named ones put as separate questions | Considered |
| 3 | Go through each | Slower; nothing since has argued against them | Considered |

**Recommendation: option 1.** **The argument against.** Acceptance makes them harder to change; a reversal needs a superseding entry.

### D2. Overview call

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Keep one aggregate call | Simpler client; one loading state | **Recommended** |
| 2 | Compose from smaller calls | Partial-failure tests; contract and UI spec change | Considered |

**Recommendation: option 1.** **The argument against.** No scenario where one section fails while the rest load.

### D3. General rate limit

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Drop it; 429 stays for PR-09 only | No general limit in v1 | **Recommended** |
| 2 | Phase 3, off under test control unless switched on | A contract change and one more test-control setting | Considered |
| 3 | Phase 5 | A full suite on one token could trip it | Considered |

**Recommendation: option 1.** **The argument against.** A common real-world defect class, missing rate limiting, is not represented.

### D4. Greeting name

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Add `greetingName` to `GET /me` | One call for the header; `displayName` keeps its meaning; additive | **Recommended** |
| 2 | `displayName` becomes the preferred name | Changes an existing field's meaning | Considered |
| 3 | The UI reads `GET /me/profile` | Two calls per page header | Considered |

**Recommendation: option 1.** **The argument against.** `/me` now carries one profile-derived field.

### D5. Debug panel

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Local and test builds only | Test state stays private and per run | **Recommended** |
| 2 | Ship in the public demo | A showcase; test control reachable publicly, shared state between visitors | Considered |
| 3 | A separate showcase build | Two deployments; shared state remains | Considered |

**Recommendation: option 1.** **The argument against.** Visitors to a public demo cannot flip a bug flag to see a planted defect.

### D6. Phase 0 baseline

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Accept as the baseline | CDS-01 completes; CDS-09 unblocks | **Recommended** |
| 2 | Accept with amendments | Applied before the freeze | Considered |
| 3 | Not yet | CDS-09 stays blocked | Considered |

**Recommendation: option 1.** **The argument against.** Anything not read closely becomes baseline and changes only by a superseding version.

## 5. Not in this brief

- The freeze itself and the lift into a repository: CDS-09.
- Version pins: on the day Phase 1 starts (DR-009).

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | DR-001, DR-004, DR-006 to DR-010; new DR-034 to DR-038 | Accept; record | [x] |
| Contract | v7: `User`, `GET /me` example | `greetingName` (D4) | [x] |
| API spec | v8: sections 6.1, 8, 12 | D2, D3, D4 | [x] |
| UI spec | v6: sections 6.2 (header), 6.8, 10 | D4, D5 | [x] |
| `fixtures/schema-check.mjs` | Composed `User` | `greetingName` | [x] |
| `DOCS/glossary.md` | v7: Greeting | Names `greetingName` | [x] |
| `DOCS/backlog.md`, `README.md`, `_manifest.md`, `_index.md` | CDS-01 complete; CDS-09 ready | All | [x] |

## 7. Decision record

### 7.1 Read-back

Read back on 5 October 2026 before recording, with six conditions:

1. Adding `greetingName` changes the contract, so the baseline accepted under D6 is the set after this brief: contract v7 (`info.version` 0.6.0, additive), API spec v8, UI spec v6, README v13. The My Profile spec stays at v4.
2. `greetingName` is required and never null: the preferred name when set, otherwise the first word of the legal name. The fixture check's composed `User` carries it.
3. The glossary (normative) moves to v7 so its Greeting entry names `greetingName`; the step glossary is unchanged.
4. No new scenario: 'the app greets Alex as "Al"' in `ui/profile.feature` covers D4; D2 and D5 change no scenarios.
5. This branch records and applies everything above; the freeze happens in CDS-09.
6. The brief records one interview of two rounds, read back before recording.

Owner's reply, 5 October 2026: "All agreed as recommended."

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Proposed decisions | **Option 1.** DR-001, DR-004, DR-006 to DR-010 accepted | | Gary Brooks | 2026-10-05 |
| D2 | Overview | **Option 1.** One aggregate call (DR-034) | | Gary Brooks | 2026-10-05 |
| D3 | Rate limit | **Option 1.** No general limit; 429 for PR-09 only (DR-035) | | Gary Brooks | 2026-10-05 |
| D4 | Greeting | **Option 1.** `greetingName` on `GET /me` (DR-036) | Conditions 1 to 4 | Gary Brooks | 2026-10-05 |
| D5 | Debug panel | **Option 1.** Local and test builds only (DR-037) | | Gary Brooks | 2026-10-05 |
| D6 | Baseline | **Option 1.** Accepted (DR-038) | Condition 1 | Gary Brooks | 2026-10-05 |

**Recorded, not argued away.** Every item went with its recommendation, so each argument against still stands; D3 and D5 in particular leave two showcase opportunities (a rate-limiting defect, visitor-driven bug flags) for a later decision.

**Left unresolved.** Nothing.

### 7.3 Corrections after decision

None.
