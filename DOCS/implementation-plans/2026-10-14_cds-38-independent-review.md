---
version: 1
created: 2026-10-14T15:28Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-38
status: proposed
approved: not yet
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-38, independent review of the Phase 3 service, the harness and the Phase 4 UI

**History of this plan.** Requested by the owner on 2026-10-14 after P2 merged (#74 `67ded09`), as decision brief 12 D1 option 2 and brief 13 D6 option 1 require: the review runs after the API flags and before the UI flags. This file is the plan as written for approval. Six choices were put to the owner in the table at the end and answered by interview on 2026-10-15 (all as recommended); until the owner approves the plan, no reviewer runs.

**Goal.** Give the code the independent look that Phase 2 had and Phases 3 and 4 did not (DR-058 and DR-063 record the absence as an exception). A reviewer with fresh context, who did not write any of it and is not told what the author concluded, reads the service, the harness, the UI, the exit checks and the flag proof against the specifications, and says where the code, the checks that test it and the documents disagree. Findings are verified, signed off and fixed before the 23 UI flags (P3 to P4) are built into the UI.

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| The code under review is about 6 400 lines of service C#, 2 800 of UI source, 2 200 of harness, 540 of tooling and CI, with 3 700 lines of service tests and 1 500 of UI tests; 74 commits on `main` | Too much for one reader in one pass: split by area (D2) |
| CDS-18 (Phase 2) is the precedent: a general-purpose agent with fresh context, read-only, blind to the author's conclusions, its prompt recorded verbatim, a per-check count of what it examined, findings graded Blocker, Change or Note with both sides quoted, an author's verification column, the owner's sign-off by interview, fixes before the gate. It needed a confirmation pass and a scoped third pass because each round of fixes produced new findings | Reuse the method; plan for a confirmation pass (D4) |
| CDS-18 reviewed scenarios against the contract. This review is of **code**: it must also look for checks that pass when they should fail, which is what the exceptions in DR-058 and DR-063 are about (probes chosen by their author; a scenario that read tile text and not a hook) | The checklist is about false passes and false failures as much as about wrong behaviour, and the reviewer needs to be able to run things (D3) |
| The flag mechanism (P1) and the proof runner are the newest and least-reviewed code, and the runner is what the Phase 5 gate rests on | They are in scope, with their own checks |
| The `write-code-review` prompt in `portfolio-prompts` is for a whole-portfolio review with its own template; its output (many files) is far larger than this needs | Use the CDS-18 report format, in `.review/`, not the portfolio template |
| Findings from the review will touch code that P3 changes (the UI) | Fix Blockers and Changes before P3 (D5), in small pull requests |

## Scope

**Reviewed (the material).** `demo-apps/demoapp001-dotnet-api/` (the service, the BusinessRules library, both test projects); `demo-apps/demoapp001-react-ui/` (source and tests); `test-harnesses/harness-serenity/` (abilities, steps, hooks, the exit checks, the flag proof, `scripts/run.mjs`); `fixtures/` including `bug-flags.json` and `schema-check.mjs`; `tools/`; `.github/workflows/`; the root and package `package.json` files; `README.md`.

**The sources of truth the reviewer checks against.** `DOCS/.architecture/openapi.yaml`; `DOCS/.design/api-specification.md`, `business-rules-cases.md`, `operations-cases.md`, `profile-rules-cases.md`, `ui-specification.md`, `ui-feature-profile.md`, `harness-design.md`; `DOCS/glossary.md` and `step-glossary.md`; `features-shared/`; `DOCS/decision-register.md` (later entries refine earlier ones).

**Withheld (D1).** Decision briefs, the backlog, implementation plans and logs, session notes and earlier reviews: they describe history and the author's conclusions, not the current truth. The reviewer is not told which exceptions are already recorded.

**Out of scope.** The Phase 5 slices not yet built (the UI flags, visual regression, the report); the frozen Phase 0 pack; the portfolio's other projects.

## Steps

1. **Fix the commit.** The review runs at one commit of `main` (the plan's own merge), recorded in the report. Nothing else merges while the reviewers run.
2. **Three reviewers, in parallel (D2)**, each a general-purpose agent with fresh context, with its prompt recorded verbatim and its report written to the scratchpad and copied unchanged into the review record. Each gives, per check, the number of items it examined or "no findings" with a count. Each finding has an ID (A-nn, B-nn, C-nn), a severity, the file and line, both sides quoted, and a suggested fix.
   - **Reviewer A: the service.**
     - A1 rules: each of BR-01 to BR-15 and PR-01 to PR-11 as implemented against the specification and its cases, including boundaries.
     - A2 operations: each of the 36 operations against the contract (statuses, headers, validation, ownership, tokens, the test-control gate).
     - A3 robustness and security: token lifetime and revocation, the test-control gate (DR-008), static-file hosting and path handling, error leakage, concurrency of the shared store, reset.
     - A4 the seven API flags and the flag mechanism: each flag changes only what it says, off means off, the per-request flag set is sound.
     - A5 the service tests: do they assert something, or only that code ran.
   - **Reviewer B: the harness, the scenarios' steps and the proof.**
     - B1 steps against scenarios and the glossary: does each step assert what its Gherkin sentence says, and can it pass vacuously (a weaker assertion, a missing wait, a fixture value read instead of the page's).
     - B2 isolation: resets, cached tokens, the clock, state that leaks between scenarios.
     - B3 contract validation: is the validator strict where it claims to be.
     - B4 the flag proof and the registry: can a flag be "caught" for the wrong reason, are the recorded failure texts specific enough, does the "something ran" guard hold, the runner's process and port handling.
     - B5 the fixtures and their checker against the rules.
   - **Reviewer C: the UI, the exit checks, CI and the documents.**
     - C1 pages against the UI specification: the catalogue, hooks, the four states, formatting.
     - C2 behaviour: the session in memory, the open-redirect guard, redirect-back after sign-in, forms and their error paths, stale responses and races in effects.
     - C3 accessibility and semantics: the specification's section 4.5 against the code, and whether the exit checks scan what they say they scan.
     - C4 security and privacy: injection, storage use, personal data in addresses and titles (PR-08), and whether the **public build** contains any test code (the reviewer builds without `VITE_TEST_BUILD` and looks).
     - C5 CI, scripts, pins, permissions, the Pages workflow.
     - C6 documents against code: the README, the specifications, the counts and statuses they claim.
3. **Reviewers may run things (D3),** in a copy of the repository outside it, never in the repository: the existing checks, and mutation probes of their own, to find a check that passes when it should not.
4. **Record.** One file, `.review/2026-10-14_cds-38-independent-review.md`: the header (reviewer type, commit, the SHA-256 of each prompt), the three prompts verbatim, the three reports verbatim, then the author's verification of every Blocker and Change finding (reproduced or not reproduced, in a separate section so the reviewers' words are unchanged).
5. **Owner sign-off (D6).** Blockers and Changes one by one: accept and fix, defer, or reject with a reason. Notes in one table.
6. **Fixes before P3 (D5).** The accepted Blockers and Changes, in small pull requests (a specification pull request first where a specification is wrong), each with `verify` and the `ui` job green. A plan addendum is written first for any fix that is more than a correction.
7. **Confirmation pass (D4).** One fresh reviewer, scoped to the fixes and to anything they could have broken, as CDS-18 needed.
8. **Records.** An implementation log, the plan's Outcome, a decision register entry stating what the review found and what it changes in the exceptions listed in DR-058 and DR-063, backlog (CDS-38 Done; CDS-41 unblocked), CHANGELOG.

## Verification

- Each report gives per-check counts; "no findings" is accepted only with a count.
- The author reproduces every Blocker and Change finding before the sign-off, and says so.
- After the fixes: `npm run verify` 14 of 14, the `ui` job green, `npm run check:bug-flags` unchanged (8 of 8 implemented flags caught), and the confirmation pass reports no new Blocker.
- Independence can be audited from the verbatim prompts.

## Delivery

- Branches: `claude/cds-38-review-plan` (this plan), `claude/cds-38-review-record` (the review record), then one branch per fix, `claude/cds-38-fix-<topic>`, then `claude/cds-38-records`. Merge in order, only on the owner's word and each pull request's own CI run.
- Estimate (mine, not measured), in sessions: the three reviews 0.5 (they run in parallel, in the background), verification and sign-off 0.5, fixes 0.5 to 2 depending on what is found, confirmation pass 0.25, records 0.25: about 2 to 3.5.
- No downloads, no new dependencies.

## Out of scope

Fixing anything the reviewers find that the owner defers (it goes to the backlog); reviewing the Phase 5 code not yet written; re-opening the Phase 3 and Phase 4 gates (DR-058, DR-063 stand; the review is the quality check afterwards, not their condition).

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 What the reviewers are told | Blind: only the prompt and the repository, none of the author's conclusions or recorded exceptions; told: given the recorded exceptions and asked to test them | Blind (2026-10-15) |
| D2 Shape | Three reviewers in parallel, one per area (service; harness and proof; UI, CI and documents); one reviewer for everything; two (code; harness and documents) | Three in parallel (2026-10-15) |
| D3 What a reviewer may run | Read-only, nothing executed (as CDS-18); may run the existing checks and its own mutation probes in a copy outside the repository; may run anything, including in the repository | Run in a copy outside the repository (2026-10-15) |
| D4 Passes | One review; a review and one confirmation pass on the fixes; a review and as many passes as it takes | Review plus one confirmation pass (2026-10-15) |
| D5 What is fixed before P3 | Blockers only; Blockers and Changes; everything | Blockers and Changes (2026-10-15) |
| D6 Sign-off | Per finding for Blockers and Changes, Notes in one table; every finding one by one; the author decides, the owner reviews a summary | Per finding for Blockers and Changes (2026-10-15) |

## Outcome

[Appended after delivery.]
