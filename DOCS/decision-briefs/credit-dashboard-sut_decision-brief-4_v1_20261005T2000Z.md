---
version: 1
created: 2026-10-05T20:00Z
project: credit-dashboard-sut
type: decision-brief
brief: 4
subject: Three-amigos review of the feature files and step glossary (CDS-07)
blocks: CDS-07; README Phase 2 exit gate ("three-amigos review recorded")
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Record the three-amigos review of features-shared/ and the step glossary: agenda, options, outcomes.
  LOCATION: DOCS/decision-briefs/ (Phase 0 pack)
  TEMPLATE: templates/decision-brief.template.md (portfolio root)
-->

# Decision brief 4: three-amigos review

**Items decided:** D1 the four contradicted Givens; D2 scenarios that keep what the rewrites would lose; D3 the mobile Given; D4 phrasing; D5 date format; D6 a PR-08 scenario; D7 glossaries normative; D8 how the review is recorded.
**Blocked:** CDS-07 and the README Phase 2 exit gate.

**Who took part, stated plainly.** The review was held by interview between the owner (business and acceptance view) and the agent (developer and tester views), between 23:31Z on 4 October 2026 (the last clock reading before it) and 20:00Z on 5 October 2026, when the owner's final agreement had been received: two rounds of questions, then a read-back before anything was recorded. It was not a three-person meeting. The brief was written **after** the decisions, from the options and arguments exactly as put.

## 1. Why this brief exists

The README's Phase 2 exit gate asks for a recorded three-amigos review. The agenda was the step glossary v4 section 6: five Givens contradicted by their bound persona (6.2), five phrasing proposals (6.3), the date format (6.4), and the PR-08 scenario gap found during CDS-11 (backlog v15).

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (Phase 2 gate)
- [ ] A decision already made implicitly in an artefact needs ratifying
- [ ] An earlier decision is being reversed or narrowed
- [x] Two documents disagree: five Givens state data their persona fixture does not hold

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | `excellent` holds 2 report changes (28 and 14 September 2026); `drilldown` holds 5; `drilldown`'s current account balance is 0.00 | `fixtures/personas/*.json` |
| B2 | Overrides can replace accounts, changes and searches; not profile data | Contract v6 `PersonaOverrides` |
| B3 | `thin-file` and `error` hold no mobile number | Persona fixtures |
| B4 | PR-08 had no tagged scenario; bug flag `pii-in-title` names one | Profile spec v4 section 7; backlog v15 |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | How should the four contradicted Givens be fixed? | Unchanged | Yes | D1 |
| Q2 | What do the rewrites lose? | Found during Q1: sort order (BR-11), the 20-per-page boundary, current-account exclusion (BR-07) | Yes | D2 |
| Q3 | The mobile Given? | Restated: overrides cannot reach profile data, so a binding or contract change is needed | Yes | D3 |
| Q4 | Phrasing proposals 1 to 5 | Unchanged | Yes | D4 |
| Q5 | Date format | Unchanged | Yes | D5 |
| Q6 | PR-08 scenario | Unchanged | Yes | D6 |
| Q7 | Normative glossaries? | Unchanged | Yes | D7 |
| Q8 | How to record the review? | Unchanged | Yes | D8 |

Nothing carried forward.

## 4. Decision items

### D1. The four contradicted Givens

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Arrange by overrides | Scenarios unchanged; personas stable | **Recommended** |
| 2 | Change the personas | Other scenarios' figures shift | Considered |
| 3 | Rewrite the scenarios | Loses some cases they tested | Considered |

**Recommendation: option 1.** **The argument against.** These scenarios would no longer run on plain persona data, so a reader must know overrides are in play.
**The owner chose option 3, with new scenarios where needed** (D2).

### D2. Keeping what the rewrites lose

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Three dedicated scenarios arranged by overrides | Sort, paging and debt exclusion keep a scenario | **Recommended** |
| 2 | API paging with a small `pageSize` | The UI's 20-per-page boundary and two rules go uncovered | Considered |
| 3 | Accept the loss | Three behaviours lose their only scenario | Considered |

**Recommendation: option 1.** **The argument against.** Three more override samples; a reader must know overrides exist.

### D3. The mobile Given

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Sam on `thin-file` | No contract or fixture change | **Recommended** |
| 2 | Extend overrides to profile data | A contract change for one scenario | Considered |
| 3 | Change `excellent` | Other profile scenarios need re-arranging | Considered |

**Recommendation: option 1.** **The argument against.** One profile scenario uses a different actor and persona from its background.

### D4. Phrasing

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Accept all five proposals | One phrasing per meaning | **Recommended** |
| 2 | All but `chooses` for `selects` | Two verbs for one action | Considered |
| 3 | Keep current phrasing | Duplicate step definitions in Phase 3 | Considered |

**Recommendation: option 1.** **The argument against.** 'Chooses the 3 months range' reads slightly less naturally than 'selects'.

### D5. Date format

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Long form everywhere | One `{date}` type; business language | **Recommended** |
| 2 | ISO for data dates, long form for today | Two types and a rule to remember | Considered |

**Recommendation: option 1.** **The argument against.** Steps with three dates become long.

### D6. PR-08 scenario

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Page title and address scenario | Catches `pii-in-title`; logs left to component tests | **Recommended** |
| 2 | Title, address and console log | Fuller; brittle console assertions | Considered |
| 3 | Defer | The flag stays unprovable | Considered |

**Recommendation: option 1.** **The argument against.** The log part of PR-08 has no scenario.

### D7. Glossaries normative

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Both normative | Agreed vocabulary; Phase 2 gate evidence | **Recommended** |
| 2 | Keep both draft | Gate stays open | Considered |

**Recommendation: option 1.** **The argument against.** Every later wording change needs a version bump and a conformance pass.

### D8. Recording the review

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Decision brief 4 with DR entries | Same form as briefs 1 to 3 | **Recommended** |
| 2 | A review record in `DOCS/evidence/` | New document type; outcomes not in the register | Considered |

**Recommendation: option 1.** **The argument against.** The 'three amigos' were two parties; the brief must say so (it does, above).

## 5. Not in this brief

- CDS-01, the owner's overall review of the specifications.
- Client-side log checks for PR-08 (component tests, Phase 4).

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | DR-028 to DR-033 | One entry per outcome | [x] |
| `features-shared/api/report-changes.feature` | Two rewrites, one new override scenario; long-form dates | D1, D2, D5 | [x] |
| `features-shared/api/debt.feature` | Overdraft step removed; new override scenario | D1, D2 | [x] |
| `features-shared/ui/report-overview.feature`, `ui/report-changes.feature` | Rewrites; new override scenario; `chooses` | D1, D2, D4 | [x] |
| `features-shared/ui/profile.feature` | Sam on `thin-file`; `opens the name information`; PR-08 scenario | D3, D4, D6 | [x] |
| `api/account-totals`, `api/credit-balances`, `ui/account-drilldown` | Phrasing | D4 | [x] |
| Other UI feature files | Section references to UI spec v5 | Conformance | [x] |
| `fixtures/overrides/` | Three new samples | D2 | [x] |
| `DOCS/step-glossary.md` v5, `DOCS/glossary.md` v6 | Normative; review outcomes | D4, D5, D7 | [x] |
| `DOCS/backlog.md`, `README.md`, `_manifest.md`, `_index.md` | CDS-07 complete | All | [x] |

## 7. Decision record

### 7.1 Read-back

Read back before recording, the reply received before 20:00Z on 5 October 2026, with each rewrite spelled out, and four conditions:

1. The brief states that the review was held by interview between two parties.
2. CDS-07 becomes COMPLETE. Phase 2's evidence is ready (review recorded, every BR tagged, fixtures passing), but phases run in order and Phase 1 (CDS-09) has not started, so the backlog says the evidence is ready, not that Phase 2 is closed.
3. Changed feature files are edited in place with a version bump.
4. Step glossary, glossary, backlog, README and manifest are updated and the three checks kept green.

Owner's reply: "All agreed as recommended."

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Contradicted Givens | **Option 3.** Rewrite to match the persona; new scenarios where needed | Rewrites as read back | Gary Brooks | 2026-10-05 |
| D2 | What the rewrites lose | **Option 1.** Three scenarios arranged by overrides | | Gary Brooks | 2026-10-05 |
| D3 | Mobile Given | **Option 1.** Sam on `thin-file` | | Gary Brooks | 2026-10-05 |
| D4 | Phrasing | **Option 1.** All five proposals | | Gary Brooks | 2026-10-05 |
| D5 | Dates | **Option 1.** Long form everywhere | | Gary Brooks | 2026-10-05 |
| D6 | PR-08 | **Option 1.** Title and address scenario | | Gary Brooks | 2026-10-05 |
| D7 | Glossaries | **Option 1.** Both normative | | Gary Brooks | 2026-10-05 |
| D8 | Record | **Option 1.** Decision brief 4 | Condition 1 | Gary Brooks | 2026-10-05 |

**Recorded, not argued away.** D1 went against the recommendation: the scenarios were rewritten to match their personas rather than arranged by overrides. The owner's added condition, new scenarios where needed, is what D2 delivers, so the three behaviours the rewrites would have lost keep a scenario. The argument for option 1 (fewer scenarios, one mechanism) stands; the result is more scenarios, each clearer about where its data comes from. Every other item went with its recommendation, so each argument against still stands.

**Left unresolved.** Nothing.

### 7.3 Corrections after decision

- **Timing.** The decisions are dated 5 October 2026, the day the owner's agreement was received; the changes were applied and this brief written at 20:00Z that day, read from the clock. The agent's read-back message carried an estimated header (`2026-10-04T23:40Z`) that was never read from the clock and should not be relied on.
