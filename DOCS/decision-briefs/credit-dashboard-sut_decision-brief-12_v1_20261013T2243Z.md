---
version: 1
created: 2026-10-13T22:43Z
project: credit-dashboard-sut
type: decision-brief
brief: 12
subject: "Recording the Phase 4 gate, and what comes after the UI"
blocks: Phase 4 gate record (a new DR); README status; registry, landing card and capability matrix wording; the choice of next work
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

# Decision brief 12: recording the Phase 4 gate, and what comes after the UI

**Items to decide:** D1 whether and how the Phase 4 exit gate is recorded; D2 what is built next; D3 the two UI items that need a contract change.
**Blocks:** the gate record, the README (which still says "No UI exists yet"), the public labels, and the choice of next work. Nothing in the repository is broken while this waits.
**Reply with:** "D1: option n, D2: option n, D3: option n", with any conditions. The answer is read back before anything is recorded.

## 1. Why this brief exists

On 13 October 2026 the last slice of Phase 4 (CDS-36, #69) merged. As for Phases 1 to 3 (DR-045, DR-049, DR-058), a gate is not recorded by the agent: the evidence is gathered and the owner decides.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (the README and the public labels describe a project with no UI)
- [ ] A decision already made implicitly in an artefact needs ratifying
- [ ] An earlier decision is being reversed or narrowed
- [ ] Two documents disagree

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | **The gate's wording.** The plan's exit: "41 of 41 `@ui` scenarios green against the live service; axe-core zero violations on every page; the 59 `@api` scenarios still green" | `DOCS/implementation-plans/2026-10-12_cds-29-phase-4-ui.md` 'Verification' |
| B2 | **Scenarios.** 41 `@ui` scenarios (51 executions, outlines expanded) pass against the live service, built UI served by the service; the 59 `@api` scenarios still pass in every `verify` | Local `check:ui-scenarios` after U6; `verify` 14 of 14 (235.5 s); CI run 38479216316 (`Verify` 1 m 49 s, `UI` 2 m 13 s) |
| B3 | **Accessibility.** axe-core 4.13.0 (WCAG 2.0 to 2.2, A and AA), bug flags off, on 37 pages and states: 0 violations. The three layouts (375, 768, 1280 px), each with normal and wider text: 24 checks, 0 problems | `npm run check:ui-exit`; the same step in the `ui` CI job |
| B4 | **Component tests.** 135 Vitest tests over the four section states of each page; UI package audit: 0 vulnerabilities | `npm run check:ui` |
| B5 | **Probes.** Every slice's checks were shown able to fail (U3 four, U4 three, U5 three, U6 three). Two honest exceptions: renaming the mobile badge hook failed nothing (the scenarios read the tile text; a component test covers the hook), and a tag-removal probe in CDS-24 was not caught | Implementation log `2026-10-13_cds-29-phase-4-ui-u1-to-u6.md` |
| B6 | **A real defect found by CI.** The first U6 run failed: the profile scrolled sideways by 5 px at 375 px on Linux fonts, not on the Windows machine. Fixed; every layout is now checked with wider text too | Run 38477792933; harness design section 25 |
| B7 | **No independent review.** As for Phase 3 (DR-058), the UI, the steps and the checks were written and verified by the same agent against a specification and scenarios that were independently reviewed (three passes, DR-049) | No `.review/` file for Phases 3 or 4 |
| B8 | **Not built.** `list-changes` and the utilities and telecoms sub-group headings of UI specification 6.4 (each needs a contract change); the address, employment and finances profile pages (stretch, DR-022); Phase 5 (bug flags, visual regression, the published Serenity report, the three bug-flag catches from the CDS-18 notes) | UI specification 6.4 and 6.9; backlog v59 |
| B9 | **Portfolio exposure.** README, registry label, landing card and capability matrix say "No UI exists yet" or count 59 scenarios; they wait on this decision for their wording | README line 17; `registry.yml`; landing `presentation.json` |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | (not asked) | Record the gate on B2 to B4, or first add the independent review Phase 2 had (B7)? | Yes | D1 |
| Q2 | (not asked) | The project now has everything its README promised except the defects and evidence phase. Build Phase 5, or close? | Yes | D2 |
| Q3 | (not asked) | The two unbuilt items of 6.4 will otherwise be re-raised at every handover | Yes | D3 |

## 4. Decision items

### D1. How the Phase 4 gate is recorded

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Record now (a new DR).** The gate is met on 13 October 2026 on B2 to B4; the exceptions in B5 and B7 and the items in B8 are listed in the record | README, registry, landing and matrix say "Phase 4 complete: 41 `@ui` scenarios run"; Phase 5 may be planned | Recommended |
| 2 | **Record now, and commission an independent review of the UI and harness** as a follow-up ticket | As option 1, plus a fresh-context review pass (about 0.5 session, then fixes) | Considered |
| 3 | **Hold the gate until an independent review has passed** | Labels stay stale for at least a session | Considered |
| 4 | **Do nothing** | Every public label stays stale | Considered |

**Recommendation: option 1.** The evidence: every condition in the gate's own words is met, in CI as well as locally, and each check was shown able to fail (B2 to B5). CI found a defect the author's machine did not (B6), which is the independent check the pipeline itself provides. **The argument against.** The same agent wrote the UI and the steps that test it, so a shared misreading of the specification would pass (B7); the probes were chosen by the author. Phase 2 learned this at the cost of three passes. Option 2 or 3 is the safe answer. **What would change it:** a reason to doubt UI and steps share an assumption, or wanting Phase 4 held to Phase 2's standard.

### D2. What is built next

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Plan Phase 5** (a plan first, as for Phase 4): bug flags with the scenarios that catch each, visual regression, the published Serenity report, and the three bug-flag catches from the CDS-18 notes | The repository's stated purpose (defects a test suite must catch) is demonstrated; the biggest remaining piece | Recommended |
| 2 | **Close the project at Phase 4** with `close-project`: a FINAL handover, README and registry say "API and UI delivered; defects and evidence phase not built" | A finished, honest artefact; the bug-flag proofs and report never exist | Considered |
| 3 | **Pause.** Record the gate, keep the project active, decide later | No work lost; the state in which projects stall | Considered |
| 4 | **Reframe.** Build only a small Phase 5: the published Serenity report and a handful of bug-flag proofs | Cheaper; the "each flag proved" claim would be narrower | Considered |

**Recommendation: option 1.** The bug flags are the reason the SUT exists: a system under test that is built to be broken on command. The UI specification, the flag list and the test-control surface are all in place, so the remaining cost is mostly the proof, not the design. A plan with a stop point at each flag group keeps the cost under control. **The argument against.** The portfolio's other projects already show defect-catching suites; Phase 5 is long and the owner's time is finite. Option 2 or 4 respects that. **What would change it:** a limit on time or effort.

### D3. The two unbuilt items of UI specification 6.4

`list-changes` (needs an account-type filter on changes, or a link from a change to an account) and the utilities and telecoms sub-group headings (need a field that tells a utility from a telecoms account).

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Drop both from the specification** (amend 6.4: the list shows the summary, rows and excluded group only) | No contract change; the specification matches what was built and reviewed; no scenario is affected | Recommended |
| 2 | **Add both through a contract change** (a plan, a specification pull request and a code pull request, as for contract v16) | The specification is fully built; costs about a session; changes the generated client | Considered |
| 3 | **Leave them listed** as unbuilt | The list never shrinks | Considered |

**Recommendation: option 1.** No scenario needs either, and a contract change for two decorations is a poor trade. **The argument against.** The specification was reviewed with them in it, and dropping them quietly narrows the SUT's surface for later tests. **What would change it:** choosing Phase 5 and wanting a bug flag on the grouping (`ph-a11y`-style flags live on pages that do exist).

## 5. Not in this brief

- Enabling Dependabot alerts, the remaining `claude/*` remote branches (25 now), and the nightly Schemathesis run with a stateful phase: the owner's, unchanged.
- The shape of Phase 5. That is a plan, written after D2.

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | New entry | The Phase 4 gate (D1) with the exceptions listed; D2 and D3 outcomes | [x] DR-063 |
| `README.md` | Line 17, 'SDD workflow' Phase 4 row, 'Status' | "Met" or the chosen wording, with the date; the 41 `@ui` scenarios and the exit checks | [x] |
| `DOCS/backlog.md` | Phase 4 section; new items | Close the phase; the Phase 5 plan item if D2 is option 1; the review ticket if D1 is option 2 | [x] v62: CDS-37, CDS-38 |
| `DOCS/.design/ui-specification.md` | 6.4 | Drop the two items if D3 is option 1 | [x] v20 |
| `portfolio-prompts/registry.yml` and README row | Status label and notes | Wording follows D1 and D2 | [ ] follows this PR |
| `portfolio-landing` card, capability matrix | Summary and counts | Wording follows D1 and D2 | [ ] follows this PR |
| `DOCS/decision-briefs/_index.md` | Brief 12 row | Status and where the decision landed | [x] row added as awaiting-decision |

## 7. Decision record

The owner replied on 2026-10-14, in chat: "D1: option 1, D2: option 1, D3: option 1" (the recommended options), and later the same day changed D1 to option 2 (see 7.3). The read-back below is as corrected and confirmed.

### 7.1 Read-back

1. **D1 option 2** (changed from option 1 on reflection, see 7.3). The Phase 4 exit gate is recorded as met on 13 October 2026 (DR-063) on the evidence of B2 to B4, and an independent review of the UI and the harness is commissioned as a follow-up ticket (CDS-38), with findings handled as CDS-24 was. The review is the quality check afterwards, not the condition of the gate. The exceptions (the gate said 'mock and live' and was met on the live service only; the unread mobile badge hook; probes chosen by their author; B7, no independent review yet) are listed in the record.
2. **D2 option 1.** The project continues to Phase 5 (defects and evidence), planned first, as for Phase 4. Nothing is closed with `close-project`.
3. **D3 option 1.** `list-changes` and the utilities and telecoms sub-group headings are dropped from UI specification 6.4 (v20). No contract change is made for them.

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Recording the Phase 4 gate | **Option 2.** Record now (DR-063) and commission an independent review of the UI and harness (CDS-38) | Exceptions B5 to B7 listed in the record; the review is not a condition of the gate | Gary Brooks | 2026-10-14 |
| D2 | What is built next | **Option 1.** Plan Phase 5 | A plan first, with a stop point at each flag group | Gary Brooks | 2026-10-14 |
| D3 | The two unbuilt items | **Option 1.** Drop both from the specification | None | Gary Brooks | 2026-10-14 |

### 7.3 Corrections after decision

**2026-10-14, the owner:** "on reflection change D1 option 1 to D1 option 2, all others confirmed". D1 is therefore option 2 (record now, and commission an independent review as a follow-up ticket, CDS-38); D2 and D3 option 1 are confirmed as read back. The first read-back said no review was commissioned; that is replaced by item 1 of 7.1.
