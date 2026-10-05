---
version: 1
created: 2026-10-04T18:09Z
project: credit-dashboard-sut
type: decision-brief
brief: 1
subject: Glossary terms awaiting a decision (glossary v1 section 3)
blocks: CDS-07 points 4 to 7; glossary conformance pass; step glossary
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Record the six decisions that settled glossary v1 section 3, with the options and
            arguments as they were put.
  LOCATION: DOCS/decision-briefs/ (Phase 0 pack)
  TEMPLATE: templates/decision-brief.template.md (portfolio root)
-->

# Decision brief 1: glossary terms awaiting a decision

**Items decided:** D1 steady (BR-07); D2 listed (BR-13); D3 utilisation above 100 (BR-03); D4 on time (BR-12); D5 phase; D6 report-change hooks.
**Blocked:** CDS-07 points 4 to 7, the glossary's conformance pass, and the step glossary, which needs settled terms.

**How this brief came about, stated so the record is not misread.** The options below were put to the owner in a structured interview on 4 October 2026, between 17:06Z and 18:09Z, and the owner answered in that session. This brief was written **after** the decisions, from the options and arguments exactly as put, to carry the record the template requires. The template expects a brief to be written before the decision; here the interview did that job, and the read-back in section 7.1 was done before anything was recorded.

## 1. Why this brief exists

Compiling the project glossary (`DOCS/glossary.md` v1, #254, squash `458ecdf`) left six terms with no settled meaning. Four were rule boundaries the scenarios had been written to avoid (backlog CDS-07 points 4 to 7). Two were word collisions found while counting: *phase* naming two different sequences, and *signal* and *updates* still naming report changes in test hooks. Each one changes what a rule, scenario or hook requires, so the agent did not settle them.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (CDS-07 step glossary; Phase 2 exit gate)
- [x] A decision already made implicitly in an artefact needs ratifying (D4: a BR-12 scenario row already asserts the mixed-year reading)
- [ ] An earlier decision is being reversed or narrowed
- [x] Two documents disagree: README SDD phases versus UI spec v2 section 5 phase column (D5); UI spec v2 prose versus its own hooks (D6)

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | BR-07: trend "within ±1% is steady", inclusive or exclusive not stated | API spec v3 section 7 |
| B2 | BR-13: closed accounts "remain listed for 6 years from the close date", end not stated | API spec v3 sections 7, 12 |
| B3 | `Percent` is integer 0 to 100; `AccountSummary.utilisation` and `AccountTotals.utilisation` use it; `AccountDetails.minPayment.percent` is a separate 0 to 100 number | `openapi.yaml` v3, `components.schemas` |
| B4 | BR-12 defines `missed` and `no-data` years only; `features-shared/api/payment-history.feature` asserts "on time in the months reported" gives `on time` | API spec v3 section 7; feature file |
| B5 | Catalogue "Phase 1" pages (login, overview) are built in SDD Phase 4 | README SDD workflow; UI spec v2 section 5 |
| B6 | Overview already uses `change-card-{id}`; lists use `signal-{id}` and `list-updates`; component `SignalCard` | UI spec v2 sections 6.2, 6.4, 7 |
| B7 | No `struggling` scenario reads totals or debt figures; it is used for closed accounts, payment history and searches | `grep` of `features-shared/` |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | "Is a change of exactly 1% 'steady'?" (CDS-07 point 4) | Unchanged: premise, cardinality and variable checked. Follow-up found: what if debt three months earlier was zero? | Yes | D1 |
| Q2 | "Is an account closed exactly six years ago still listed?" (CDS-07 point 5) | Unchanged. Follow-up found: an account closed on 29 February | Yes | D2 |
| Q3 | "Utilisation over 100 does not fit `Percent`" (CDS-07 point 6) | Restated: the question is the **meaning** of utilisation above the limit, not only the schema; the schema follows the meaning | Yes | D3 |
| Q4 | "A year with on-time and no-data months is read as 'on time'" (CDS-07 point 7) | Restated as ratification: the reading already exists in a scenario | Yes | D4 |
| Q5 | Two sequences called *phase* (glossary v1 section 3) | Unchanged | Yes | D5 |
| Q6 | Hook names for report changes (glossary v1 section 3) | Restated: two questions (hooks, route), answered together | Yes | D6 |

Nothing carried forward.

## 4. Decision items

### D1. Steady (BR-07)

**What is being decided.** Whether a change of exactly 1% in total debt, against three months earlier, is `steady`.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Inclusive: steady when the change is at most 1% either way | Matches the plain reading of "within" | **Recommended** |
| 2 | Exclusive: steady only below 1% | Exactly 1% shows up or down; BR-07 wording changes | Considered |
| 3 | Change the threshold (another band or an absolute amount) | Reopens the rule itself | Considered |

**Recommendation: option 1.** "Within" is read inclusively by most readers, and no scenario contradicts it.
**The argument against.** A 1% rise on a large mortgage balance is real money, and the customer is told "steady".

### D2. Listed (BR-13)

**What is being decided.** Whether an account closed exactly six years before today is still listed.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Drops off on the anniversary: listed while today is before the close date plus six years | "For 6 years" read as a duration that has run on the anniversary | **Recommended** |
| 2 | Listed through the anniversary day | Shown for six years and one day | Considered |

**Recommendation: option 1.** It reads "for six years" as elapsed time and matches the existing fixture check.
**The argument against.** A customer checking on the anniversary itself may expect to still see the account.

### D3. Utilisation above 100 (BR-03)

**What is being decided.** What utilisation means when a balance exceeds its limit.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Allow above 100: uncapped, schema widened, over-limit UI state, a persona account over its limit | More realistic, more to test | **Recommended** |
| 2 | Cap at 100 and add an `overLimit` boolean | Schema stays tight; the number shown is false | Considered |
| 3 | Cap at 100 silently | No change; over-limit is indistinguishable from at-limit | Considered |

**Recommendation: option 1.** The over-limit state is the most important one to see, and option 3 hides it.
**The argument against.** A contract change, a new UI state and fixture work, all before Phase 1.

### D4. On time (BR-12)

**What is being decided.** The status of a year with on-time and no-data months and no missed month.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | On time | What the rule implies and a scenario already asserts | **Recommended** |
| 2 | A fourth status, *partial* | Enum, legend and scenarios change | Considered |

**Recommendation: option 1.**
**The argument against.** A year with eleven no-data months and one on-time month shows as "on time".

### D5. Phase

**What is being decided.** How SDD phases and the page catalogue's phases are told apart.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Bare *phase* is an SDD phase; the catalogue column becomes **Release** (R1 to R3) | UI spec v3, API spec v4, profile spec v2 | **Recommended** |
| 2 | Catalogue column becomes **Scope tier** | As option 1 with a different word | Considered |
| 3 | Keep both and always qualify | No renaming; the collision stays one qualifier away | Considered |

**Recommendation: option 1.**
**The argument against.** One more term to learn, and *release* can suggest a deployment.

### D6. Report-change hooks

**What is being decided.** Whether test hooks and the component carry the word *report change* rather than *signal* and *updates*.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Rename hooks, keep route: `signal-{id}` to `change-card-{id}`, `SignalCard` to `ChangeCard`, `list-updates` to `list-changes`; `/insights/updates` kept | Free now, as no code exists | **Recommended** |
| 2 | Rename hooks and route (`/insights/changes`) | Fully consistent; drifts from the surveyed source structure | Considered |
| 3 | Prose only | Harness code carries two words for one thing | Considered |

**Recommendation: option 1.** The route mirrors the source app's URL shape, which the page survey records.
**The argument against.** The route still says *updates*, which also names the bureau refresh.

## 5. Not in this brief

- DR-005 (credit-balance display) and the undefined `negative-balance` flag: CDS-02, a separate owner decision.
- CDS-01, CDS-03 and CDS-12: owner review and framework choices.

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | DR-011 to DR-016 | One entry per item, citing this brief | [x] |
| `DOCS/.architecture/openapi.yaml` | `components.schemas`; BR descriptions | D3: new `Utilisation` schema; D1, D2: wording | [x] |
| API spec | v4: sections 2, 4, 5, 6.5, 6.6, 7, 9, 11, 12 | D1 to D5 and glossary conformance | [x] |
| UI spec | v3: sections 3, 4.2, 5, 6 (headings and 6.4), 7, 9 | D3, D5, D6 and glossary conformance | [x] |
| My Profile UI feature spec | v2: phase line, section 6 | D5; CDS-11 note | [x] |
| `fixtures/personas/struggling.json`, `fixtures/schema-check.mjs` | `acc_stcc02`; BR-13 date check | D3; D2 leap day | [x] |
| `features-shared/api/` | `debt`, `closed-accounts`, `account-totals`, `payment-history` | D1, D2, D3 boundary rows; D4 comment | [x] |
| `DOCS/glossary.md` | v2: section 3 emptied; section 6.1 pass | All | [x] |
| `DOCS/backlog.md`, `README.md`, `_manifest.md` | CDS-07 points 4 to 7 | Record | [x] |
| `DOCS/decision-briefs/_index.md` | Brief 1 row | Status and landing | [x] |

## 7. Decision record

### 7.1 Read-back

Read back to the owner on 4 October 2026 before recording. It surfaced four conditions the answers had not stated, each put with a default:

1. D1, debt three months earlier was zero: `steady` if debt is still zero, otherwise `up`.
2. D2, an account closed on 29 February: it drops off on 28 February six years later.
3. D3, contract shape: a new `Utilisation` schema (integer, minimum 0, no maximum) for utilisation fields; `Percent` unchanged, because `minPayment.percent` must stay 0 to 100.
4. D3, persona: one `struggling` credit card at 1,150.00 against a 1,000.00 limit (115%).

Owner's reply, 4 October 2026: "All agreed as recommended."

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Steady (BR-07) | **Option 1.** Steady when the unrounded change is at most 1% either way | Earlier debt zero: `steady` if now zero, else `up` | Gary Brooks | 2026-10-04 |
| D2 | Listed (BR-13) | **Option 1.** Listed while today is before the close date plus six calendar years | 29 February close: drops off on 28 February | Gary Brooks | 2026-10-04 |
| D3 | Utilisation above 100 (BR-03) | **Option 1.** Uncapped; over-limit UI state; persona account over its limit | New `Utilisation` schema; `Percent` unchanged; `struggling` card 1,150.00 / 1,000.00 | Gary Brooks | 2026-10-04 |
| D4 | On time (BR-12) | **Option 1.** On time | BR-12 wording states it | Gary Brooks | 2026-10-04 |
| D5 | Phase | **Option 1.** Bare *phase* is an SDD phase; catalogue column is **Release**, R1 to R3 | | Gary Brooks | 2026-10-04 |
| D6 | Report-change hooks | **Option 1.** Hooks and component renamed; route kept | | Gary Brooks | 2026-10-04 |

**Recorded, not argued away.** Every item went with its recommendation, so each argument against still stands: D1 calls a 1% rise on a large balance steady; D4 can show a mostly-unreported year as on time; D6 leaves *updates* in one route.

**Left unresolved.** Nothing from this brief.

### 7.3 Corrections after decision

**D3 condition 3 rested on a wrong premise.** The read-back said `Percent` must stay because `AccountDetails.minPayment.percent` uses it. It does not: that field is an inline `number` with its own 0 to 100 bounds. Once the two utilisation fields moved to `Utilisation`, `Percent` had no users, and the contract lint (`no-unused-components`) warned. Found on 2026-10-04 while applying the decision, before commit. Applied: `Percent` removed from contract v4; every 0 to 100 bound that existed still exists. The decision itself (uncapped utilisation, new `Utilisation` schema) is unchanged. DR-013 records the removal.
