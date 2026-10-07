# CDS-18: Independent re-review of Phase 2 behaviour; Phase 2 exit gate met — 2026-10-07

## Session Summary

Decision brief 7 (D2) required the Phase 2 gate to rest on an independent look rather than the author's reading. Three fresh agents reviewed the behaviour layer in turn:

1. a blind full pass;
2. a confirmation full pass;
3. a pass scoped to the fixes, with two re-checks.

Between the passes, the fixes changed the contract (v10: DR-046 to DR-048) and most of the specifications. They went in through #16, #17 and #18, and the owner decided by interview at each turn. The record ends with no Blocker or Change finding. The owner signed off, and DR-049 records the Phase 2 exit gate as met (#18, squash `2746a82`). The author's starting claim in brief 7 B7, that contract v8 and v9 "changed no behaviour", was true of the contract. It missed that five scenarios were already wrong.

---

## Objectives

1. ✅ Plan approved and written to file before the review (`30c3b6e`); two addenda written before each round of fixes (`1549cca`, `cbc2d33`).
2. ✅ An independent reviewer, blind to the author's conclusion, with its prompt recorded verbatim.
3. ✅ Every Blocker and Change finding reproduced by the author before the owner decided.
4. ✅ Fixes made specification first, each PR merged on its own green CI.
5. ✅ Further independent passes until no Blocker or Change remained.
6. ✅ The owner's sign-off; DR-049; README and backlog updated.

---

## Test Results

| Stack | Suite | Before (`f16cea0`) | After (`2746a82`) | Status |
|---|---|---|---|---|
| Gherkin | `tools/check-gherkin.py` | 21 files, 65 scenarios, BR 15/15, PR 10/11 | 23 files, 72 scenarios, BR 15/15, PR 10/11 | ✅ PASS |
| Steps | Step lines matching a step-glossary pattern | 232/232 (reviewer's count) | 269/269 | ✅ PASS |
| Fixtures | `npm run check` | 8 samples, 404 checks | 12 samples, 448 checks | ✅ PASS |
| Contract | Redocly lint; mock smoke | v9: valid; 36/36 | v10 (`info.version` 0.7.0): valid; 36/36 | ✅ PASS |
| Client | Drift and types | 2,672 lines | 2,795 lines (regenerated) | ✅ PASS |
| CI | `verify` | 9/9 | 9/9 on #16 (run 37607379139), #17 (37624143274), #18 (37626838023) | ✅ PASS |

**Review passes:**

| Pass | Reviewer | Scope | Blocker / Change / Note | Fixed in |
|---|---|---|---|---|
| 1 | Fresh agent, blind | Everything, contract v9 (`30c3b6e`) | 5 / 12 / 8 | #16 |
| 2 | Fresh agent, same prompt | Everything (`dca26ce`) | 1 / 10 / 11 | #17 |
| 3 | Fresh agent | The diff `f16cea0..79d6498` | 0 / 3 / 6 | #18 (`76fae4b`) |
| 3, re-check 1 | Same agent as pass 3 | That fix | 0 / 1 / 3 | #18 (`193bdf4`) |
| 3, re-check 2 | Same agent | That fix | 0 / 0 / 1 | Stamps in #18 |

---

## Changes Implemented

### PR A (#16, `dca26ce`): first-pass fixes

**Files changed:**
- **Contract v10:** `DebtOverview.byType` (DR-046), and one Problem type per 422 outcome (DR-048).
- **API specification v12:** BR-07, BR-09, BR-11, the month-status derivation, 403 removed, the error catalogue, and token expiry on the clock.
- **UI specification v9:** the changes toggle fetches every change (DR-047), plus the route and the catalogue rows.
- **Glossary and step glossary:** glossary v8 and step glossary v6 (parameter types, regenerated 'Used in', new steps).
- **Scenarios and fixtures:** the debt total and breakdown, the preferred-name save, *account information*, a BR-02 gap, a 0-day row, the expiry and test-control-off scenarios, and the closed-accounts and mobile scenarios. Four new override samples. The client regenerated.

### PR A2 (#17, `79d6498`): confirmation-pass fixes

**Files changed:**
- **The Blocker:** the BR-08 outline now reloads the overview after the clock moves.
- **Clock:** the API debt clock is set, and API specification v13 states the clock after a reset.
- **New scenarios:** a summing `@BR-04` scenario, and `api/account-details.feature` (BR-14 limits on `PATCH`).
- **Specifications:** UI specification v10 (searches and personal-details hooks) and My Profile specification v5 (the mobile badge).
- **Wording:** "Accounts in credit" and *excluded from the loan totals*. Step glossary v7 maps every API outcome; glossary v9 cites sections without versions.

### PR B (#18, `2746a82`): third-pass fixes and the gate

**Files changed:**
- **Third-pass fixes:** My Profile specification v6 (the mobile sub-page, with a field that is never pre-filled), glossary v10 (*Debt breakdown*), and API specification v14 (section 6.6).
- **The gate:** DR-049, plus the brief 7 §7.3 correction (DR-049, not DR-046).
- **Records:** the review record with all passes verbatim; README showing Phase 2 Met; backlog v33 (CDS-18 Done, CDS-24 added).

---

## Technical Decisions

Structural decisions: **DR-046** (debt breakdown), **DR-047** (the changes toggle), **DR-048** (Problem types per outcome) and **DR-049** (the Phase 2 gate).

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Reviewer blind to the author's conclusion (owner) | Avoids anchoring; the point of D2 | Give the claim as a hypothesis |
| Reproduce every Blocker and Change before deciding | The owner decides on verified findings only | Act on the reviewer's word |
| Prompt recorded verbatim, with SHA-256 prefixes | Independence can be audited | Summarise the prompt |
| A confirmation pass, then a pass scoped to the fixes (owner) | The author's fixes needed independent checking: they introduced F-06, F-09 and F-10 in pass 2, and F-10 in re-check 1 | Sign off on the author's fixes |
| Notes to CDS-24 rather than fixed before the gate (owner) | They change no scenario outcome | Fix every Note now |
| `the clock follows real time after a reset` stated in the specification | Date-dependent scenarios must set it | A frozen default clock |

---

## Documentation Updates

- `DOCS/implementation-plans/2026-10-07_cds-18-*.md`: the plan and both addenda, with their Outcomes appended in this change.
- `.review/2026-10-07_cds-18-behaviour-re-review.md`: the full review record.
- `DOCS/implementation-logs/2026-10-07_cds-18-behaviour-re-review.md`: this log.

---

## Lessons Learned

- **The author's reading is not evidence.** Brief 7 B7 was right about the diff and wrong about the result. The first blind pass found five scenarios that would fail against a correct build.
- **Fixes need the same independence as the original.** Each round of the author's fixes produced new findings: three in pass 2 and one in re-check 1. A scoped pass with re-checks closed the loop cheaply.
- **Each pass goes deeper, so decide in advance what "clean" means.** The counts went 17, then 11, then 3, then 1, then 0 Blocker and Change findings. Notes kept appearing, which is why the bar was set at Blocker and Change.
- **A permissive matcher gives a false 'Used in'.** Regenerating the step glossary's 'Used in' column with wildcard patterns credited steps to the wrong files. Spot-checking the output caught it.
- **Read the clock before writing a stamp, still.** The read-back at "09:58Z" was not read from the clock (recorded in addendum 1), and the review record's first header said 10:05Z when the clock read 09:54Z (corrected before commit).

---

## Recommendations / Next Steps

- [ ] Status PRs: the registry label, the landing card and the capability-matrix ledger (brief 7), now that Phases 1 and 2 are closed. Next.
- [ ] CDS-19: the first Phase 3 plan (service scaffold, `global.json`, generated C# types). Ready.
- [ ] CDS-24: the remaining review Notes, including the email sub-page hooks and the bug-flag catches due by Phase 5. Ready, low priority.
- [ ] Whether to publish the Kanban board on GitHub Pages (deferred at CDS-17). Owner.

---

*Session logged: 2026-10-07. Author: Claude Code.*
