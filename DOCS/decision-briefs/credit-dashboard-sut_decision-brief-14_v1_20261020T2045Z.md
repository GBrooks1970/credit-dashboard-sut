---
version: 1
created: 2026-10-20T20:45Z
project: credit-dashboard-sut
type: decision-brief
brief: 14
subject: "Recording the Phase 5 gate, what comes after it, the landing link to the report, and a defect found by the gate's own run"
blocks: Phase 5 gate record (a new DR, DR-067); README Phase 5 row; registry, landing card and capability matrix wording; the choice of next work
approver: the project owner (Gary Brooks)
status: awaiting-decision
supersedes: none
language: en-GB
---

# Decision brief 14: recording the Phase 5 gate, and what comes after it

**Items to decide:** D1 whether and how the Phase 5 exit gate is recorded; D2 what happens after the gate; D3 whether the landing card links to the published report; D4 a defect the gate's own full run found in the Serenity JSON, and when to fix it.
**Blocks:** the gate record (DR-067), the README's Phase 5 row (which says "In progress"), the public labels, and the choice of next work. Nothing in the repository is broken while this waits.
**Reply with:** "D1: option n, D2: option n, D3: option n, D4: option n", with any conditions. The answer is read back before anything is recorded.

## 1. Why this brief exists

On 20 October 2026 the last build slice of Phase 5 (P6, the published Serenity report) merged, and P7a made the proof of the flags durable and linked the report from the README. As for Phases 1 to 4 (DR-045, DR-049, DR-058, DR-063), a gate is not recorded by the agent: the evidence is gathered and the owner decides. The plan is `DOCS/implementation-plans/2026-10-20_cds-45-phase-5-exit.md` (decision D6: stop here).

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (the README, the registry, the landing card and the matrix cannot say Phase 5 is closed, and the next work is undecided)
- [ ] A decision already made implicitly in an artefact needs ratifying
- [ ] An earlier decision is being reversed or narrowed
- [ ] Two documents disagree

## 2. Background

All figures are copied from run output. The evidence commit is `5b3a452` (`main`, pull request #124).

| Ref | Fact | Evidence |
|---|---|---|
| B1 | **The gate's wording.** "Every flag turns at least one committed check (a scenario, exit check, component test or service test) red for the stated reason; report published" (README Phase 5 row, as reworded by brief 13 D5). The Phase 5 plan adds: the visual check green on Linux CI and failing on a planted change | README; `DOCS/implementation-plans/2026-10-14_cds-37-phase-5-defects-and-evidence.md` |
| B2 | **30 of 30 flags caught for the stated reason, in CI.** The `flags` job's table, kept as the `bug-flag-proof` artifact from P7a: 30 `caught`, none pending (9 flags in the service, 21 in the UI's test build; 8 caught by `@api` scenarios, 11 by `@ui` scenarios, 9 by exit-run checks, 4 by component tests, two flags by two kinds, and two flags also by one image each). The job took 16m09s on the push to `main`. Locally the same proof took 19m42s with the two Linux-only image catchers left out, and also showed 30 of 30 | CI run 39487546650 (artifact), run 39489977664 (`main`); local `check:bug-flags` exit 0 |
| B3 | **Visual regression.** 32 images (eight pages, 375 and 1280 px, light and dark) against baselines made on Linux CI (`ubuntu-24.04`) and accepted by the owner. It passed twice running on one commit; a planted accent colour failed 16 of 32 images and a planted wider margin 32 of 32, each uploading the diff images. **A limit stated plainly:** a one-channel colour change of 10 steps is inside the 0.2 colour distance and passes | Implementation log `2026-10-19_cds-43-visual-regression-p5a-p5c.md`; the `Visual` workflow |
| B4 | **The report is published and checked.** `https://gbrooks1970.github.io/credit-dashboard-sut/report/` serves 77 scenarios and 119 test cases, all passing; `/report/commit.txt` names `5b3a452` (checked live at 2026-10-20T20:44Z); the board is at `/`. Before every deployment CI checks every execution (60 `@api`, 59 `@ui`), the counts, the board's ticket payload, the commit stamp, that nothing else is in the folder and that no control key or token is in any file. The README links both | Run 39489977664 (`Report` 41 s, `Site` 24 s, `Deploy` 32 s); DR-066 |
| B5 | **The full local run on `5b3a452`.** `npm run verify` 14 of 14 (208 s: 437 service tests, 239 rules tests, Schemathesis 1,294 and 723 generated cases passing); `check:ui` 208 component tests and the public-build guard (43 s); `check:ui-scenarios` 59 executions (97 s); `check:ui-exit` 124 axe scans and 288 layout checks, 0 problems (218 s); `check:bug-flags` 30 of 30 (1,182 s). `check:report` passes on the JSON of a whole `@api` and `@ui` run (60 and 59 executions, all `SUCCESS`, no key or token) | `/tmp` run logs of this session, summarised in the P7b implementation log |
| B6 | **CI health on `main`.** The flag proof crashed on two pushes to `main` on 19 October (CDS-46) while every pull request was green, and the landing page showed the project red. After the fix, every push to `main` has passed: eight in a row (`3860187` to `5b3a452`), and a manual re-run of the earlier commit passed. The cause of the crash was **not proved** (a stale connection is likely); the runner now retries, stops with a named message and keeps the service log | CDS-46 log; `gh run list` |
| B7 | **Probes.** Each new check was shown able to fail: the reset (retry and flag name, by mutation), the report checks (five mutations, a planted count on CI), the site check (five mutations, one test added after a mutation survived), the visual check (colour, margin, two flags, a deleted baseline, an extra file). The probes were chosen by their author, as in Phase 4. A planted failing scenario was not run on CI: a failing suite fails `Verify` or `UI`, so no report is made; a failed result in the JSON is covered by unit tests and local probes | The P5 and P6 logs |
| B8 | **Independent review.** CDS-38 (two fresh-context rounds, DR-065) reviewed the Phase 3 service, the harness and the Phase 4 UI, and its fixes are merged. It did **not** cover the Phase 5 additions after P2: the UI flags (P3, P4), the visual check (P5), the report job and the site job (P6). Those were written and verified by the same agent, against a plan and a registry the owner approved | `.review/`; this brief |
| B9 | **A defect found by the gate's own run.** The full local run ended `check:report` red: the report's JSON had been replaced by one scenario. `crewFor` empties `reports/serenity/<profile>` at the start of **every** Cucumber run, so the flag proof (which runs single scenarios) and any named-feature run overwrite the JSON of the whole-suite run. CI is not affected (the JSON is uploaded by the `Verify` and `UI` jobs, which run the whole suites, before any other run on those runners), and the check did its job in refusing it. Re-running `test:api` and `test:ui` then `check:report` passed (60 and 59 executions). Proposed ticket CDS-47 | `/tmp` run log; `src/support/serenity-crew.ts` |
| B10 | **Not built.** The address, employment and finances profile pages (stretch, DR-022); a service container image; the nightly Schemathesis run with a stateful phase; the deferred review items A-22, R2-B-13, R2-B-17 and R2-B-19 | Backlog v79 |
| B11 | **Portfolio exposure.** The README Phase 5 row says "In progress"; the registry label, the landing card and the capability matrix say the exit awaits the owner | `README.md`; `registry.yml`; landing `presentation.json` |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | (not asked) | Record the gate on B2 to B7, or first add the independent review Phases 3 and 4 had (B8)? | Yes | D1 |
| Q2 | (not asked) | Phase 5 was the last planned phase. What does the project do next? | Yes | D2 |
| Q3 | (not asked) | The landing card says the report is published and does not link to it (D2 of the P7 plan deferred this to the gate) | Yes | D3 |
| Q4 | (not asked) | B9 is a defect in the evidence tooling. Fix it before the gate or record it as an exception? | Yes | D4 |

## 4. Decision items

### D1. How the Phase 5 gate is recorded

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Record now (a new DR, DR-067).** The gate is met on 20 October 2026 on B2 to B7; the exceptions (B3's limit, B6's unproved cause, B7's author-chosen probes, B8, B9 if D4 is option 2) are listed in the record | README, registry, landing and matrix say "Phase 5 complete"; the next work can be chosen | Considered |
| 2 | **Record now, and commission an independent review of the Phase 5 additions** (P3 to P6) as a follow-up ticket, with findings handled as CDS-38 was | As option 1, plus a fresh-context review pass (about 1 to 2 sessions, then fixes). The review is the quality check afterwards, not the condition of the gate, as for Phase 4 (DR-063) | Recommended |
| 3 | **Hold the gate until an independent review has passed** | Labels stay "in progress" for at least a session or two | Considered |
| 4 | **Do nothing** | Every public label stays stale | Considered |

**Recommendation: option 2.** Every condition in the gate's own words is met in CI (B2, B4), the checks were shown able to fail (B7), and `main` has been green eight pushes running (B6). Against that, the last review of this size found 62 Blockers and Changes in the first round and 12 Blockers in a fix-aware second round (DR-065): code the same agent wrote and verified is where such findings come from, and the Phase 5 additions are of similar size. You chose the same shape for Phase 4, so it keeps the record consistent. **The argument against.** The flags are test-only, the visual and report code only checks the project's own pages, and a review costs one to two sessions; option 1 would record the same gate and say plainly that B8 is an exception. **What would change it:** deciding in D2 to close the project, in which case a review before closing is worth its cost; or deciding the SUT's own checks are not worth a review.

### D2. What happens after the gate

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Close the project** with `close-project` once D1's review (if any) and its fixes are done: a FINAL handover, the README and registry say all phases are delivered, the stretch items and the deferred review items are listed as deferred | A finished, honest artefact, consistent with the other closed projects | Recommended |
| 2 | **Rest.** Keep the project active with no planned work; watch `main`; build when asked | Nothing lost; the state in which projects stall, and a label that never says "finished" | Considered |
| 3 | **Build the stretch** (the address, employment and finances profile pages, DR-022), plan first | A larger SUT surface for later test projects; about a phase of work | Considered |
| 4 | **Build the service container image**, plan first | Easier reuse by other portfolio projects; adds a deployment artefact to maintain | Considered |

**Recommendation: option 1.** All six planned phases have their exit evidence, the README promised nothing more, and the stretch pages were always marked stretch. A closed project stays readable and its published board and report stay up. **The argument against.** Later portfolio projects may want the unbuilt pages as targets, and closing makes starting them a new decision; option 3 or 4 can still be a new, planned project after closure. **What would change it:** a named consumer project that needs the pages or the image soon.

### D3. Whether the landing card links to the report

The card says the report is published and has no link; the README now links it (P7a).

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Link it after the gate**, in the same landing update that moves the card to "Phase 5 complete" | One landing change, with its link checks (the landing's public-evidence tests); the public page then shows the evidence | Recommended |
| 2 | **Link it now**, before the gate | A landing change now and another at the gate | Considered |
| 3 | **Do not link it**; the README holds the link | The landing card stays a summary | Considered |

**Recommendation: option 1.** A link is a public claim; making it with the gate record means the card and the record say the same thing the same day. **The argument against.** The report is live and checked now, so waiting only delays a visible proof by the length of this decision. **What would change it:** wanting the public evidence visible before the review in D1.

### D4. The Serenity JSON overwritten by other Cucumber runs (B9)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Fix it before the gate**: a ticket (CDS-47), a small plan, tests first. Only a whole `api` or `ui` run writes the JSON (`run.mjs` says so; the flag proof and named-feature runs do not); one new unit test and a probe | The evidence tooling is right when the gate is recorded; about 0.2 session | Recommended |
| 2 | **Record it as an exception** and fix it later | The gate record lists it; the fix waits | Considered |
| 3 | **Leave it** | A developer who runs the flag proof before `check:report` gets a refusal they must understand | Considered |

**Recommendation: option 1.** It is in the evidence chain of the gate (B4, B5), small, and the fix keeps `check:report` honest after any other run. **The argument against.** CI is not affected and the check already refuses the bad state, so it could wait without harm. **What would change it:** wanting the gate recorded today.

## 5. Not in this brief

- Enabling Dependabot alerts, the remote branch `claude/cds-28-code`, whether Actions may open pull requests here, and the matrix's property-based testing row: the owner's, unchanged.
- The shape of any review (D1 option 2) or of any stretch work (D2): a plan, written after the answers.

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | New entry | The Phase 5 gate (D1) with the exceptions listed; D2 to D4 outcomes (DR-067) | [ ] after the owner's answers |
| `README.md` | 'SDD workflow' Phase 5 row, 'Status' | "Met" or the chosen wording, with the date | [ ] |
| `DOCS/backlog.md` | CDS-45, CDS-37; new items | Close the phase; CDS-47 (D4); the review ticket (D1 option 2) | [ ] CDS-47 added as Open in this pull request |
| `portfolio-prompts/registry.yml` and README row | Status label | Wording follows D1 and D2 | [ ] follows the record |
| `portfolio-landing` card, capability matrix | Summary and link | Wording follows D1 to D3 | [ ] follows the record |
| `DOCS/decision-briefs/_index.md` | Brief 14 row | Status and where the decision landed | [x] row added as awaiting-decision |

## 7. Decision record

[Pending the owner's answers. The read-back is written here, then DR-067.]
