---
version: 1
created: 2026-10-07T09:37Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-18
status: implemented
approved: 2026-10-07, Gary Brooks; merges of the credit-dashboard-sut PRs and the three status PRs (registry, landing, capability matrix) authorised once each one's own checks pass
delivered: "#16 dca26ce, #17 79d6498, #18 2746a82 (2026-10-07); status PRs to follow"
language: en-GB
---

# Implementation plan: CDS-18, independent re-review of Phase 2 behaviour against contract v9, and the Phase 2 gate

**History of this plan.** The owner was interviewed on three decisions on 2026-10-07. The plan was presented at 09:37Z (clock read at 09:37:09Z), approved, and written to this file at 09:43Z, before any review ran (DR-041).

**Goal.** Record the Phase 2 gate (DR-046) on what an independent reviewer observed, not on the author's inference (decision brief 7 D2, DR-045).

## Evidence gathered before planning

| Finding | Consequence for the plan |
|---|---|
| Inputs on `main` at `f16cea0`: 21 feature files (647 lines), step glossary v5, glossary v7, contract v9 (1,624 lines), API specification v11, UI specification v8, My Profile specification v4, 7 personas, 2 users, 8 override samples | The reviewer's scope, listed in its prompt |
| Brief 7 B7 records the author's reading that contract v8 and v9 changed no behaviour | Withheld from the reviewer (owner: blind) |
| The registry's default reviews path is `.review/` | The report's home |

## Steps

1. **Reviewer.** A general-purpose agent, with fresh context, blind to brief 7 B7 and brief 4's outcomes, read-only (no edits, no git, no network). Its prompt is recorded verbatim. The checklist:
   - **C1, operations:** every method, path, status and header a scenario names exists in contract v9.
   - **C2, fields and values:** fields, enum values and example or persona values match the contract and the fixtures.
   - **C3, rules:** each `@BR-` and `@PR-` scenario exercises its rule as written now, including boundaries.
   - **C4, UI:** pages, routes and test hooks exist in UI specification v8 or My Profile specification v4.
   - **C5, steps:** every step matches an agreed step-glossary entry; terms match the glossary.
   - **C6, coverage:** BRs, catalogue pages, and untagged PR rules with the reason.

   For each check, the output gives the number of items examined and either "no findings" or the findings. Each finding has an ID, a severity (Blocker, Change or Note), the file and line, both sides quoted, and a suggested fix.
2. **Record.** The report goes verbatim to `.review/2026-10-07_cds-18-behaviour-re-review.md`, with a header (reviewer type, commit, prompt). The author adds a separate Verification column (reproduced or not reproduced) for each Blocker and Change finding.
3. **Owner sign-off by interview.** For each finding: accept and fix, defer, or reject with a reason.
4. **Fixes before the gate.** Specification first, in their own PR with `verify` green. A plan addendum is written first if a fix is more than wording.
5. **Gate.**
   - DR-046: the Phase 2 gate is met, citing the review, the fixes and the sign-off.
   - README: 'SDD workflow' shows Phase 2 Met, and 'Status' says Phase 3 is next.
   - Backlog: CDS-18 Done, which makes CDS-19 Ready on the regenerated board.
   - CHANGELOG.
6. **Records PR:** this plan's Outcome and an implementation log.
7. **Status PRs (brief 7):** the registry `status_label` and notes (portfolio-prompts); the landing card summary (portfolio-landing, with its count tests); the capability-matrix ledger (portfolio root).

## Verification

The report gives per-check counts. The author reproduces every Blocker and Change finding before the interview. `npm run verify` passes 9 of 9, and the board shows CDS-18 Done and CDS-19 Ready. Independence can be audited from the verbatim prompt.

## Delivery

- **credit-dashboard-sut:** PR 1 carries the review, the gate record and any small fixes; PR 2 is the records PR. A substantive fix goes in its own PR before the gate record.
- **Step 7:** one PR in each repository.
- **Merges:** each PR is merged once its own checks pass. The portfolio root has no CI, so its PR is checked locally.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| Anchoring | Blind to the author's conclusion; told the claim and asked to test it | Blind | Blind (2026-10-07) |
| Report location | `.review/`; `DOCS/reviews/`; annex to brief 7 | `.review/` | `.review/` (2026-10-07) |
| Defects found | Fix before DR-046; record the gate, fix after | Fix before | Fix before DR-046 (2026-10-07) |
| Approval | Approve, merge when green; approve, owner merges the other repositories; change | (owner's call) | Approve, merge when CI is green (2026-10-07) |

## Outcome

Delivered. The Phase 2 exit gate is met (DR-049, #18 `2746a82`). Steps 1 to 6 were done as planned. Step 7, the status PRs, follows this records PR.

Differences from the plan:

- **More passes than planned.** The plan had one review. The owner added a confirmation pass after #16, and then a pass scoped to the fixes, with two re-checks, after #17. Each round of the author's fixes produced new findings, so the extra passes were needed.
- **Two addenda instead of one.** Both were written to file before their fixes.
- **The gate is DR-049.** The fixes needed DR-046 to DR-048 first. Brief 7 §7.3 records the correction.

Full record: [`DOCS/implementation-logs/2026-10-07_cds-18-behaviour-re-review.md`](../implementation-logs/2026-10-07_cds-18-behaviour-re-review.md) and [`.review/2026-10-07_cds-18-behaviour-re-review.md`](../../.review/2026-10-07_cds-18-behaviour-re-review.md).
