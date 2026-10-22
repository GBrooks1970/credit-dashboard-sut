---
version: 1
created: 2026-10-22T06:10Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-48
status: approved
approved: "2026-10-22, Gary Brooks, 'D1 to D7 as recommended, approved, push the plan PR'; merge authority: per pull request, on request"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-48, independent review of the Phase 5 additions

**History of this plan.** Commissioned by the owner on 2026-10-20 as decision brief 14 D1 option 2 (DR-067): the Phase 5 gate was recorded as met, and the independent review of the Phase 5 additions is the quality check afterwards, not the condition. The project is closed with `close-project` after the review and its fixes (brief 14 D2 option 1). Seven choices were put to the owner in the table at the end and answered on 2026-10-22 (all as recommended). No reviewer runs until this plan is merged.

**Goal.** Give the Phase 5 additions the independent look that DR-067 lists as an exception. A reviewer with fresh context, who did not write any of it and is not told what the author concluded, reads the UI flags and their proof, the semantic rules, the visual check, the report and site jobs, the flag-proof reset (CDS-46) and the Serenity switch (CDS-47), and says where the code, the checks that test it and the documents disagree. Findings are verified, signed off by the owner, fixed, and confirmed.

## Evidence gathered before planning

Read only; nothing was run against the repository and nothing in it was changed.

| Finding | Consequence for the plan |
|---|---|
| Since the CDS-38 close (`88e44a8`) there are 28 commits on `main`, 125 files changed, 4,573 lines added. By area, lines added: UI source 280, service 55 (two `Defects` call sites and their tests), harness source and scripts about 1,200, fixtures and the flag registry 250, workflows 390, scenarios 8. The rest is documents | About 2,300 lines of code, against about 15,000 for CDS-38. **Two reviewers, not three** (D2) |
| CDS-38 is the precedent: fresh-context agents, blind to the author's conclusions, prompts hashed and kept verbatim, reports unchanged, the author's verification kept apart, the owner's sign-off by interview, fixes, then a confirmation pass because the first round's fixes were large | Reuse the method (D1, D4, D6) |
| The author of the Phase 5 code is the same model family as the reviewers CDS-38 used. The two CDS-38 rounds still found 62 and then 12 Blockers and Changes, so independence by fresh context works, but shared blind spots are possible | A stronger model for both reviewers (D7) |
| The newest code is what the gate rests on: the flag registry and proof (is a flag "caught for the stated reason" or by luck), the public-build guard (does any flag branch survive into the public bundle), the report checks (can a failed or missing scenario pass), the site check and the deploy job (what is published, with what permissions) | Each gets its own named checks |
| Java is not installed on the author's machine; the HTML half of the report and the deployed site are proved on CI only | Reviewers may read CI logs and fetch the project's own public URLs, read-only (D3) |

## Scope

**Reviewed (the material).** In `demo-apps/demoapp001-react-ui/`: `src/flags.tsx` and every `flagOn` call site, the summary expander, the unsaved-name warning, `scripts/public-build-guard.mjs`, `src/flags.test.tsx`. In `demo-apps/demoapp001-dotnet-api/`: the flag call sites (`Defects`, `Flags`) and their tests. In `test-harnesses/harness-serenity/`: `src/exit/` (the semantic rules, `targets.ts`), `src/flags/` (the proof, `verdict.ts`, `reset.ts`), `src/visual/`, `src/report/`, `src/support/serenity-crew.ts`, `scripts/` (`run.mjs`, `report.mjs`, `check-report.ts`, `check-site.ts`). Also `fixtures/bug-flags.json` and `schema-check.mjs`; `.github/workflows/` (`ci.yml`, `visual.yml`, `visual-baselines.yml`, `pages.yml`); `README.md`.

**The sources of truth the reviewer checks against.** `DOCS/.architecture/openapi.yaml`; the specifications in `DOCS/.design/` (UI specification sections 8 and 9, My Profile spec, harness design sections 26 to 38); `DOCS/step-glossary.md`; `features-shared/`; `DOCS/decision-register.md` (DR-064 to DR-067 state what the work claims).

**Withheld (D1).** Decision briefs, the backlog, implementation plans and logs, session notes and the earlier review records (`.review/`): they describe history and the author's conclusions, not the current truth. The reviewers are not told which exceptions are already recorded.

**Out of scope.** The service rules and operations, the harness abilities and steps, and the Phase 4 UI pages as they stood at CDS-38, which two rounds already reviewed; the frozen Phase 0 pack; the landing page and the registry; the closure itself.

## Steps

1. **Fix the commit.** The review runs at one commit of `main` (this plan's merge), recorded in the report. Nothing else merges while the reviewers run.
2. **Two reviewers, in parallel (D2), on a stronger model (D7 option 2),** each with fresh context, its prompt recorded verbatim and hashed, its report written to the scratchpad and copied unchanged into the review record. Each gives, per check, the number of items examined or "no findings" with a count. Each finding has an ID (A-nn, B-nn), a severity (Blocker, Change, Note), the file and line, both sides quoted, and a suggested fix.
   - **Reviewer A: the flags, their proof, and the UI and service changes.**
     - A1 each of the 30 registry entries: is the catcher one that fails for the stated reason (`failsWith` specific, not printed with the flag off), can another defect satisfy it, is `status` honest.
     - A2 the 21 UI flags and the 2 added service flags: each branch is inside `TEST_BUILD && flagOn(...)`, "off" means off, each does only what the registry says.
     - A3 the public build: the reviewer builds the UI without `VITE_TEST_BUILD`, inspects the bundle for any flag branch, name or test hook, and checks that the guard's strings are complete.
     - A4 the seven semantic rules and the axe passes: false negatives (a defect they should find) and false positives (a page they flag wrongly).
     - A5 the two behaviours built for flags (the summary expander, the unsaved-name warning): correctness, keyboard and screen-reader behaviour, and their component tests (do they assert the behaviour or only that code ran).
     - A6 the flag proof and verdicts: `verdict.ts`, `prove-flags.ts`, the reset retry (CDS-46), the visual-check catcher kind: can a flag be reported caught when it is not.
   - **Reviewer B: the visual check, the report and site, CI and the documents.**
     - B1 the visual check: the 32 cases, the tolerance and what it cannot see, the frozen clock, the folder guard, the Linux-only refusal, the shared targets, and the baselines (do the images show what the cases claim).
     - B2 the report: `checks.ts`, `check-report.ts`, `report.mjs`, the Serenity crew and the switch (CDS-47): can a failed, skipped or missing execution pass, can the counts be fooled, what else could leak into the published files beyond the control key and token shapes.
     - B3 the site and deployment: `site.ts`, `check-site.ts`, the `site` and `deploy` jobs, `pages.yml`, `visual.yml` and `visual-baselines.yml`: permissions, token use, what a pull request from a fork or a crafted branch name could do, action pins and their ages, artifact retention, the `if:` conditions.
     - B4 `ci.yml` as a whole: the `needs` graph, what a red job blocks, `if: always()` hazards, the cost of each job.
     - B5 documents against code: README counts and claims, harness design sections 26 to 38, UI specification sections 8 and 9 against the registry, DR-064 to DR-067 against what was built.
3. **Reviewers may run things (D3),** in a copy of the repository outside it, never in the repository: the existing checks, the public build, and mutation probes of their own; and read-only fetches of the project's public URLs and of CI run logs. No pushes, no workflow runs.
4. **Record.** One file, `.review/2026-10-22_cds-48-phase-5-review.md`: the header (reviewer types and models, commit, the SHA-256 of each prompt), the prompts verbatim, the reports verbatim, then the author's verification of every Blocker and Change (reproduced or not, in a separate section so the reviewers' words are unchanged).
5. **Owner sign-off (D6).** Blockers and Changes one by one: accept and fix, defer, or reject with a reason. Notes in one table.
6. **Fixes (D5).** The accepted Blockers and Changes, in small pull requests (a specification pull request first where a specification is wrong), each with `verify` and every CI job green. A plan addendum is written first for any fix that is more than a correction.
7. **Confirmation pass (D4).** One fresh reviewer, scoped to the fixes and to anything they could have broken.
8. **Records.** An implementation log, the plan's Outcome, a decision register entry (DR-068) stating what the review found and what it changes in DR-067's exceptions, backlog (CDS-48 Done), CHANGELOG. The closure is planned separately.

## Verification

- Each report gives per-check counts; "no findings" is accepted only with a count.
- The author reproduces every Blocker and Change finding before the sign-off, and says so.
- After the fixes: `npm run verify` 14 of 14, every CI job green, `check:bug-flags` still 30 of 30, the visual check green on Linux, the report and site checks green, and the confirmation pass reports no new Blocker.
- Independence can be audited from the verbatim prompts.

## Delivery

- Branches: `claude/cds-48-review-plan` (this plan), `claude/cds-48-review-record`, one per fix (`claude/cds-48-fix-<topic>`), `claude/cds-48-records`. Merge in order, only on the owner's word and each pull request's own CI run.
- Estimate (mine, not measured), in sessions: the two reviews 0.4 (parallel, in the background), verification and sign-off 0.4, fixes 0.5 to 1.5 depending on what is found, confirmation pass 0.25, records 0.25: about 2 to 3.
- No downloads and no new dependencies.

## Risks

- **Shared blind spots.** The author and the reviewers may be the same model family; a stronger model (D7 option 2) improves the odds and does not remove the risk.
- **Findings in the Linux-only parts** (the baselines, the deployed site) cannot be re-run on the author's machine; they are reproduced from CI logs and the live site, and the record says so.
- **Fixes to the visual check change the baselines**, which need a refresh by the manual workflow and the owner's acceptance of the new images.
- **Churn.** CDS-38's fixes produced new findings in round two; the confirmation pass exists for that, and a third pass is a separate decision.

## Out of scope

Fixing anything the reviewers find that the owner defers (it goes to the backlog); re-opening the Phase 5 gate (DR-067 stands; the review is the quality check afterwards, not its condition); the closure with `close-project`.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 What the reviewers are told | blind: only the prompt and the repository; told: given the recorded exceptions and asked to test them | blind | as recommended, 2026-10-22 |
| D2 Shape | two reviewers in parallel (A: flags, proof, UI and service changes; B: visual, report, site, CI, documents); three; one | two in parallel | as recommended, 2026-10-22 |
| D3 What a reviewer may run | in a copy outside the repository (checks, the public build, mutation probes) plus read-only fetches of public URLs and CI logs; read-only, nothing executed; anything | in a copy, with read-only fetches | as recommended, 2026-10-22 |
| D4 Passes | one review and one confirmation pass; one review only; as many as it takes | review plus one confirmation pass | as recommended, 2026-10-22 |
| D5 What is fixed | Blockers and Changes; Blockers only; everything | Blockers and Changes | as recommended, 2026-10-22 |
| D6 Sign-off | per finding for Blockers and Changes, Notes in one table; every finding one by one; the author decides | per finding for Blockers and Changes | as recommended, 2026-10-22 |
| D7 Who reviews | same family as CDS-38; a stronger model for both reviewers; one reviewer from a different family (Codex) and one of the strongest Claude model | a stronger model for both | as recommended, 2026-10-22 |

## Outcome

[Appended after delivery.]
