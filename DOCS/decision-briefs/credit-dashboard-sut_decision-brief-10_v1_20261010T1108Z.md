---
version: 1
created: 2026-10-10T11:08Z
project: credit-dashboard-sut
type: decision-brief
brief: 10
subject: "Recording the Phase 3 gate, and what closure means now"
blocks: Phase 3 gate record (DR-058); README status; registry label; the choice of next work
approver: the project owner (Gary Brooks)
status: awaiting-decision
supersedes: none
language: en-GB
---

# Decision brief 10: recording the Phase 3 gate, and what closure means now

**Items to decide:** D1 whether and how the Phase 3 exit gate is recorded; D2 what "closure" covers (the phase, or the project); D3 where the small residual items go.
**Blocks:** the gate record (DR-058), the README and registry status wording, and the choice of what is built next. Nothing in the repository is broken while this waits.
**Reply with:** "D1: option n, D2: option n, D3: option n", with any conditions. The answer is read back before anything is recorded.

## 1. Why this brief exists

On 10 October 2026 the last of the three Phase 3 exit conditions was met: CDS-22, the Serenity/JS harness, is delivered and is a `verify` step. As for Phases 1 and 2 (brief 7, DR-045, DR-049), a gate is not recorded by the agent: the evidence is gathered, and the owner decides. You also asked for a brief on "closure". There are two things that word could mean, so D2 asks which.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (the README and the registry say "in progress" until the gate is recorded; Phase 4 cannot be planned against an open Phase 3)
- [ ] A decision already made implicitly in an artefact needs ratifying
- [ ] An earlier decision is being reversed or narrowed
- [ ] Two documents disagree

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | **The gate's wording.** Phase 3 delivers "the service against the contract (DR-017); test-control endpoints; harness abilities `CallAnApi` and `ControlTheTestEnvironment`". Exit: "All `@api` and `@security` scenarios green; every response validated against the contract; Schemathesis run clean" | README 'SDD workflow' |
| B2 | **Condition 1, scenarios green.** 58 scenarios (31 scenarios and outlines in 12 `@api` feature files) pass against the live service, locally (5 s) and in CI (6.4 s); `verify` is 14 of 14 | PR #52, CI run 38046442165; walkthrough `2026-10-10_cds-23-to-cds-22-h3.md` |
| B3 | **Condition 2, responses validated.** The harness validates every response, from both abilities, against the contract with Ajv; the service tests check every served response too. An undocumented status is a failure | `harness-design.md` section 4; probes: a required key added to the contract failed validation |
| B4 | **Condition 3, Schemathesis clean.** 4.29.4, examples, coverage and fuzzing, a fixed seed; ten consecutive runs passed; the stateful phase is left out because it did not reproduce | DR-056; implementation log `2026-10-08_cds-23-schemathesis.md` |
| B5 | **Probes.** Fifteen mutations or breakages across CDS-23 and CDS-22 each turned the right check red, with two honest exceptions: a 500 on the details edit is not caught by Schemathesis (the contract's `DetailUpdate.value` is untyped), and the clock-and-token rule is shown by a scratch scenario, not a committed one | Plan Outcomes for CDS-22 and CDS-23 |
| B6 | **Phase 2 had an independent re-review before its gate (three passes).** Phase 3 has had none: the service, the rules library and the harness were written and verified by the same agent, against a contract and scenarios that were independently reviewed | DR-049; no `.review/` file for Phase 3 |
| B7 | **Residual items, none a gate condition.** CDS-24 (remaining Phase 2 review Notes), contract v16 (model `DetailUpdate` per field), Dependabot alerts off, `@scarf/scarf`'s install script, three merged local branches, an optional nightly Schemathesis run with the stateful phase | Backlog v44; handover v13 |
| B8 | **What is not built.** The React UI (Phase 4) and the defects and evidence phase (Phase 5). The 41 scenarios in the 11 `@ui` feature files (of 72 in 23) are specified and reviewed but have never been executed; the shared Gherkin store is exercised by the API harness only | `features-shared/`; README 'SDD workflow' |
| B9 | **Portfolio exposure.** The registry label, the landing card and the capability matrix say "Phase 3 in progress" or "not yet executed" and wait on this decision for their wording | `registry.yml`; landing `presentation.json`; matrix |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | "Decision brief on Phase 3 gate" | Record the gate now on the evidence of B2 to B4, or first add the independent review that Phase 2 had (B6)? | Yes | D1 |
| Q2 | "...and closure" | Premise checked: the project is not finished (B8), so "closure" is either the closing of Phase 3 (which D1 settles) or the closing of the whole project at the API (`close-project`, a FINAL handover). Those differ by two phases of work | Yes | D2 |
| Q3 | (not asked) | The residual items (B7) will otherwise be re-raised at every handover | Yes | D3 |

## 4. Decision items

### D1. How the Phase 3 gate is recorded

**What is being decided.** Whether the gate is recorded on the evidence in hand, and with what condition.

**Why it matters.** A gate that is recorded too early is a claim the repository cannot back; one that waits on a ritual nobody needs costs a session and leaves the public labels stale. Phase 2 set a precedent (an independent re-review) that Phase 3 has not followed.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Record now (DR-058).** The gate is met on 10 October 2026 on B2 to B4; the three exceptions in B5 and the residuals in B7 are listed in the record, not hidden | README, registry and landing say "Phase 3 complete"; Phase 4 may be planned. Phase 3 never has an independent review | Recommended |
| 2 | **Record now, and commission an independent review of the service and harness as a follow-up (a new ticket), with findings handled as CDS-24 was.** The gate is met; the review is the quality check afterwards, not the condition | As option 1, plus a fresh-context review pass (about 0.5 session to run, then fixes). The record says the review is pending, which is honest | Considered |
| 3 | **Hold the gate until an independent review has passed**, as in Phase 2 | The labels stay "in progress" for at least a session; the gate then carries the same weight as Phase 2's | Considered |
| 4 | **Do nothing.** Leave Phase 3 "in progress" | Every public label stays stale; the backlog has no phase to close | Considered |
| 5 | **Reframe.** Do not record a gate for Phase 3; record one for the whole API deliverable (Phases 0 to 3) when the project is closed at the API (D2 option 2) | One record instead of four; but the Phase 3 evidence waits, and if D2 chooses to continue, the record is never made | Considered |

**Recommendation: option 1.** The evidence: all three conditions in the gate's own words are met and each was proved to be able to fail (B2 to B5), in CI as well as locally. The judgement: the Phase 2 re-review caught 5 Blockers because the scenarios were prose that nobody had run; the Phase 3 conditions are executable, and the probes did what a reviewer would do (break a rule and watch the right check go red). The independent review (option 2) is worth doing, but as quality assurance after the record, and it is cheaper to schedule once Phase 4's scope is clear.

**The argument against.** The same agent wrote the service, the rules and the harness, so a shared misreading of the contract would pass every check (B6). The 15 probes were chosen by the author. Phase 2 learned exactly this, at the cost of three passes. A showcase of disciplined engineering should not skip the step its own earlier phase proved necessary. Option 3 is the safe answer.

**What would change the recommendation.** A reason to doubt the harness and the service share an assumption (for example, a scenario that passes because both sides read a rule the same wrong way), or the owner wanting Phase 3 to carry the same evidence standard as Phase 2.

### D2. What closure covers

**What is being decided.** Whether work continues into Phase 4 (the React UI) and Phase 5, or the project stops at the API and is closed with the `close-project` procedure (a FINAL handover, a last reconciliation of the backlog and of every public claim).

**Why it matters.** The two paths differ by the largest pieces of work in the project, and by how the portfolio describes it. Stopping at the API is a legitimate, finished artefact; stopping halfway through the UI would not be.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Continue to Phase 4**, planning it next (a plan, spike and slices, as for CDS-25 and CDS-22) | The 41 `@ui` scenarios get run (B8); the shared-store claim becomes true for both layers. The biggest remaining cost: a React and Vite UI built against the mock first, then the live API, with component tests and axe-core | Recommended |
| 2 | **Close the project at the API.** Record the gate, then run `close-project`: FINAL handover, README and registry say "API delivered; UI and defects phases not built", the `@ui` scenarios stay as reviewed specification | A finished, honest, smaller artefact; the portfolio's other projects already cover browser UI testing (magento, orangehrm, parabank, juice-shop). The 41 scenarios remain unexecuted for ever | Considered |
| 3 | **Pause.** Record the gate, keep the project active, decide Phase 4 later | No work lost; labels honest ("API delivered, UI next"); but it is the state in which projects stall | Considered |
| 4 | **Do nothing.** Neither record nor decide | See D1 option 4 | Considered |
| 5 | **Reframe.** Treat Phase 4 as a new, smaller project (a thin UI over the same contract, with fewer pages) instead of the full catalogue of pages | The cost drops; the 41 scenarios would need cutting down through a scenario change and a re-review | Considered |

**Recommendation: option 1.** The evidence: the repository's stated purpose is one Gherkin store driving both layers (README), and 41 of the 72 scenarios (B8) cannot be claimed until they are run. The specification, fixtures, mock and typed client for the UI already exist, which is most of Phase 4's design cost. The judgement: closing now would leave the project's central idea half-demonstrated, and the work that remains is planned, not speculative. The sensible cost control is a plan with a spike first, and the freedom to stop at a later gate.

**The argument against.** Phase 4 is likely the largest phase (a React app, component tests for every state, Playwright, axe-core, then live-API runs), and the portfolio already has several UI-testing projects, so the marginal portfolio value is lower than at the start. A clean stop at a finished API is better than an unfinished UI, and the owner's time is finite. Option 2 or 3 respects that.

**What would change the recommendation.** A limit on time or effort that makes Phase 4 unlikely to finish; or a decision that the portfolio's UI coverage is already sufficient. Then option 2.

### D3. Where the residual items go

**What is being decided.** How the items in B7 are handled, so they stop reappearing.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Schedule by weight.** Contract v16 (a plan first) and CDS-24 are done before Phase 4 starts, because both change the contract or the scenarios the UI will build on; the rest (Dependabot, `@scarf/scarf`, the three branches, the nightly run) stay owner or low-priority items, listed once in the backlog | Phase 4 starts on a firmer contract; about 1 session of small work first | Recommended |
| 2 | **Fold everything into Phase 4's plan** and do it as it becomes relevant | Fewer separate pull requests, but the contract may change under the UI | Considered |
| 3 | **Do nothing.** Leave them listed in the handovers | The list never shrinks | Considered |
| 4 | **Reframe.** Drop CDS-24's lower-value Notes after a triage, keeping only those that affect behaviour | Less work; needs the triage to be honest about what a Note was | Considered |

**Recommendation: option 1.** Contract v16 and CDS-24 touch what Phase 4 consumes (the generated client's types, the scenarios and the glossary), so they are cheapest before the UI exists. **The argument against.** Both could wait until a UI defect shows they matter, and each pull request is a session's attention. **What would change it:** choosing D2 option 2 or 3, which makes v16 and CDS-24 stand-alone items with no deadline.

## 5. Not in this brief

- Enabling Dependabot alerts and the `@scarf/scarf` install script: the owner's, unchanged from briefs 8 and handover v12.
- The shape of Phase 4 (pages, order, the stack beyond what UI specification v4 already fixes). That is a plan, written after D2.
- Deleting the three merged local branches (needs the owner's word, separately).

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | New entry DR-058 | The Phase 3 gate (D1) with the exceptions in B5 listed; D2 and D3 outcomes | [ ] |
| `README.md` | 'SDD workflow' Phase 3 row and status line | "Met" or the chosen wording, with the date | [ ] |
| `DOCS/backlog.md` | Phase 3 section; new items | Close the phase; D3 schedule; Phase 4 plan item if D2 is option 1 | [ ] |
| `portfolio-prompts/registry.yml` and README row | Status label and notes | Wording follows D1 and D2 | [ ] |
| `portfolio-landing` card, capability matrix | Summary | Wording follows D1 and D2 | [ ] |
| `DOCS/decision-briefs/_index.md` | Brief 10 row | Status and where the decision landed | [x] row added as awaiting-decision |

## 7. Decision record

*Awaiting the owner's reply.*

### 7.1 Read-back

*To be written when the owner replies.*

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Recording the Phase 3 gate | *awaiting* | | Gary Brooks | |
| D2 | What closure covers | *awaiting* | | Gary Brooks | |
| D3 | Residual items | *awaiting* | | Gary Brooks | |

### 7.3 Corrections after decision

None.
