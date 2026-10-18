---
version: 1
created: 2026-10-16T16:20Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-38
status: approved
approved: "2026-10-16, Gary Brooks, 'all as recommended, approved, merge #92 once CI green, then launch reviewers' (D1 to D6 as recommended); merge authority: per pull request, on request"
delivered: 2026-10-18
language: en-GB
---

# Implementation plan: CDS-38 F11, the confirmation pass

**History of this plan.** The CDS-38 plan (step 7, decision D4) asks for "one fresh reviewer, scoped to the fixes and to anything they could have broken, as CDS-18 needed", and the fix plan (F11) adds the areas the first review covered thinly and the random-order run deferred as B-22. F1 to F10 are merged (#78 to #90, main `b866447`). This is the plan for F11, written for approval before any reviewer runs (DR-041); the owner approved it on 2026-10-16. The owner's choices are in the table at the end; the model was left open on purpose, to be asked before launch (fix plan D2).

**Goal.** Find out whether the fixes are real and whether they broke anything, with eyes that did not write them. The first review found 62 things to fix; the fixes changed 115 files (+4 718, -1 070 lines). CDS-18 is the precedent: every round of fixes produced new findings, and the author who wrote the fixes is the worst judge of them. A fresh reviewer reads the fixes and the code around them, and says where a fix is missing, partial, or has a new fault of its own.

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| The fixes since the reviewed commit `409249e`: service 31 files (+826), harness, fixtures, tools and features 30 files (+727), UI 32 files (+578), documents, CI and package files 18 files (+741); 6 400 lines of service code, 2 800 of UI source and 2 200 of harness were reviewed the first time | Too much for one reader: split by area again, as the first review did |
| Four fixes were wrong or incomplete the first time they ran and were corrected only because a check was red: the validator broke the flag proof's text (#80, merged red, repaired by #81), a probe for B-15 stayed green until a second fixture was changed, the first F10 run was red on CI fonts (header at 200% text), and a broken line in `run.mjs` from shell quoting | The author's own probes miss things; a reviewer who runs the fixes and tries to break them is worth having |
| The first review's own list of what it covered thinly (record section 4.3): the harness's validator, the Gherkin store, the generated contract, `check:schemathesis`, `check:service-contract`, `exit-checks.ts` and the full `@ui` run | The validator and `exit-checks.ts` have since been rewritten; the rest are still unread by anyone but the author |
| B-22 (the suite does not show the per-scenario reset is needed) was deferred to this pass by the owner | One random-order run of each Cucumber profile, run by the author, goes into the record |
| The first review was blind (D1). A confirmation pass has a different job: to check named fixes. CDS-18's confirmation pass was given the earlier findings | The reviewer is told which findings were fixed and where, but not what the author concluded about them |
| Reviewers' own constraints in the first round: no writing report files (the harness refused), one hit the usage limit and was resumed, ports and temp files needed care | Reuse the launch method and the recovery (resume by SendMessage) |

## Scope

**Reviewed.** The difference between the reviewed commit `409249e` and the commit this pass runs at (the head of `main` when the owner approves; nothing else merges while the reviewers run), read in the context of the whole current code. Plus the thinly covered areas: the harness validator and hooks as rewritten, the Gherkin store (`features-shared/`) against its step glossary, the generated contract and typed client against `openapi.yaml` v19, `check:schemathesis`, `check:service-contract`, `exit-checks.ts` v2 and the full `@ui` run, and the bug-flag proof (`verdict.ts`, `prove-flags.ts`, the registry check).

**What the reviewers are told.** The list of the 14 Blockers and 47 Changes that were fixed, one line each, with the slice and the pull request that fixed it (so they can check every one), and that 5 findings were deferred by the owner (C-23, A-24, C-26, A-22, B-22) and must not be reported again. They are not told the author's verification column, the sign-off, or the author's probes.

**Out of scope.** The Notes with no action; the Phase 5 slices not yet built; the frozen Phase 0 pack; the portfolio's other projects; the deferred findings.

## Steps

1. **Fix the commit.** Run at the head of `main` after this plan is approved and merged; record the SHA. Nothing else merges while the reviewers run.
2. **Three reviewers in parallel (D1),** each a fresh-context agent (D2 for the model), read-only in the repository and free to run the existing checks and their own mutation probes in a copy outside it, as in the first review. Prompts are recorded verbatim and hashed.
   - **Reviewer A: the service.** F3 (faults and the edge), F4 (rules and flags), F6 (service tests); plus `check:schemathesis` and `check:service-contract`, and the rules library. For each A finding, fixed / partly fixed / not fixed, with evidence; then anything the fixes broke or left untested.
   - **Reviewer B: the harness.** F2a (closed schemas), F2 (validator and hooks), F5 (fixtures and steps), F7 (flag proof); plus the Gherkin store against the step glossary, the generated contract and typed client, and the flag registry. For each B finding, the same verdicts; then new faults, especially checks that pass when they should fail.
   - **Reviewer C: the UI, the checks and CI.** F8 (redirects and late answers), F9 (display and semantics), F10 (exit checks, public-build guard, CI pins and hooks); plus the F1 documents against the code. For each C finding, the same verdicts; then new faults, including the exit checks' own blind spots and the cost of the longer `ui` job.
   Each report gives, per check, the number of items examined, and each finding has an ID (R2-A-nn, R2-B-nn and R2-C-nn, so that they cannot be confused with the first review's), a severity (Blocker, Change, Note), the file and line, both sides quoted, and a suggested fix. Fix verdicts are listed apart from new findings.
3. **Recovery.** If a reviewer stops (a usage limit), it is resumed with its transcript, as reviewer A was; reports are saved verbatim by the main session because the reviewers cannot write files.
4. **Random-order runs (B-22), by the author.** One run each of the `api` and `ui` profiles with the scenarios in random order (`--order random`), with the seed recorded; any scenario that fails in one order and not another is a leak between scenarios and is reported.
5. **Record.** `.review/2026-10-16_cds-38-confirmation-pass.md`, in the shape of the first: header (commit, models, prompt hashes), the prompts verbatim, the reports verbatim, the author's verification of every Blocker and Change (reproduced or not, with the probe), then the owner's sign-off (section 5).
6. **Sign-off.** The same as the first review (D6 there): Blockers and Changes one by one (accept and fix, defer, or reject with a reason), the Notes in one table, by interview with a recommendation for each.
7. **Fixes.** Accepted findings in small pull requests (F11a, F11b, and so on), specification first, each with a test that fails without it, `verify` and the `ui` job green, merged one by one on the owner's word and a checked, all-green result. A fix that is more than a correction gets a plan addendum first.
8. **Close.** If no Blocker is open and every Change is fixed or deferred by the owner, F11 is done and F12 (the records) follows. The pass is not repeated with a new reviewer (D5); a Blocker found is re-checked by the author with a mutation and reported to the owner.

## Verification

- Each report gives per-check counts; "no findings" is accepted only with a count.
- Every Blocker and Change a reviewer reports is reproduced by the author before the sign-off, and the record says so.
- Every fix verdict "not fixed" or "partly fixed" is checked by the author against the code.
- After the fixes: `npm run verify` 14 of 14, the `ui` job green, `check:bug-flags` 8 of 8 for the stated reason, the exit checks at 0 problems.
- Independence can be audited from the verbatim prompts, which state what the reviewer was and was not told.

## Delivery

- Branches: `claude/cds-38-confirmation-plan` (this plan), `claude/cds-38-confirmation-record` (the record), then one branch per fix, `claude/cds-38-f11-<topic>`. Merge in order, each only on the owner's word and a checked, all-green result.
- Estimate (mine, not measured), in sessions: prompts and launch 0.25, the reviews 0.5 (parallel, background), verification and the random-order runs 0.5, sign-off 0.25, fixes 0.5 to 1.5 depending on what is found: about 2 to 3.
- Cost: three agent runs, each a large reading task, at the model the owner chooses; a Sonnet 5.5 run is cheaper than the Opus 5.5 runs of the first review. No downloads, no new dependencies.

## Out of scope

Fixing anything the owner defers; reviewing code not yet written; reopening the Phase 3 and Phase 4 gates (DR-058, DR-063 stand).

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Shape | Three reviewers in parallel, one per area as before; one reviewer for everything; two (code; harness and documents) | Three in parallel: the fixes are 115 files and 2 100 lines of code, and the first review needed three |  Three in parallel (2026-10-16) |
| D2 Model | Sonnet 5.5 (a different model from the first review's Opus 5.5, cheaper); Fable 5.1; Opus 5.5 again | Sonnet 5.5: a different model is the point of a second look. Say if you want Fable 5.1 for A, B or C |  Sonnet 5.5 (2026-10-16) |
| D3 What the reviewers are told | Blind again (only the prompt); fix-aware: the list of fixed findings with the slice and pull request, but not the author's verification; fully told, including the author's verification | Fix-aware: a confirmation pass has to check named fixes |  Fix-aware (2026-10-16) |
| D4 Thin areas | Include them (the validator, the Gherkin store, the generated contract, the Schemathesis and contract-drift checks, `exit-checks.ts`, the full `@ui` run); leave them out | Include them: nobody but the author has read them |  Include them (2026-10-16) |
| D5 Rounds | One pass, then fixes, then the author re-checks; a second fresh reviewer if a Blocker is found; as many rounds as it takes | One pass; the author re-checks with a mutation, and a Blocker is reported to you before anything further |  One pass, the author re-checks by mutation (2026-10-16) |
| D6 Random-order run (B-22) | By the author in this pass; leave it to a reviewer; drop it | By the author in this pass, with the seed recorded |  By the author, seed recorded (2026-10-16) |

## Outcome

**Delivered 2026-10-17.** Three fix-aware Sonnet 5.5 reviewers (one for each area) read the fixes on `20ecebc`; the record is `.review/2026-10-16_cds-38-confirmation-pass.md` (#93): their prompts verbatim with SHA-256, their reports verbatim, the author's verification (all 12 Blockers and 27 Changes reproduced or accepted from the code; R2-A-05 only for the newline case) and the owner's sign-off by interview (12 Blockers and 27 Changes accepted; 16 Notes: 11 accepted, 3 deferred, 2 no action). The fixes are the plan `2026-10-16_cds-38-confirmation-fixes.md`.
