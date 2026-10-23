# CDS-48: the independent review of the Phase 5 additions, its fixes and its confirmation pass — 2026-10-22 to 2026-10-23

## Session Summary

The Phase 5 gate was met on 2026-10-20 (DR-067) and a review of the work added after the first independent review (CDS-38) was commissioned: two fresh-context Opus reviewers read `1f87a06`, found 2 Blockers, 15 Changes and 16 Notes (all reproduced or confirmed by the author), and the owner accepted all 17 for fixing. The fixes went in five slices (#133 to #138), a confirmation pass by one more fresh reviewer found a regression of my own and eight further Changes, and a second round of three slices (#140 to #142) fixed those. The resulting state: DR-068 records the review, every fix is merged with every CI job read as `pass`, the gate's proof table is committed, and the limits that remain are written down. The project is closed next with `close-project`.

---

## Objectives

1. ✅ The review plan, two blind reviewers, the author's verification kept apart, the owner's sign-off by interview (#129 to #131).
2. ✅ The fixes plan and five slices (#132 to #138), each test-first and mutation-proved, plus the CI limits (#136).
3. ✅ A confirmation pass (D4), the author's verification of it, the owner's sign-off, and the round 2 plan (#139).
4. ✅ Round 2: slices A, B, C (#140 to #142), the two new tab-bar baselines accepted by the owner.
5. ✅ The records: DR-068, the three plans' Outcomes, this log, the backlog (v84, CDS-48 Done), CHANGELOG, the README's decision range.
6. ⏸️ Deferred by decision: the process-group kill of timed-out catchers; the semantic-rule misses (listed); protecting `main`; Dependabot alerts (the owner's settings).

---

## Test Results

| Check | At the gate (`5b3a452`, DR-067) | After CDS-48 (`main`) | Status |
|---|---|---|---|
| `npm run verify` | 14 of 14 | 14 of 14 (run on `main` after #142) | ✅ PASS |
| Component tests (UI) | 208 | 216 | ✅ PASS |
| Axe scans / layout checks (exit run) | 124 / 288 | 128 / 294, 0 problems | ✅ PASS |
| Visual images | 32 | 34 | ✅ PASS |
| Harness unit tests (`npm run test:unit`) | not recorded | 97 | ✅ PASS |
| Semantic-rule tests in a real browser (`npm run test:rules`) | none | 12 | ✅ PASS |
| Registry checks (`fixtures`, `npm run check`) | 868 checks | 868 checks, 0 failures; 7 unit tests of the failure-text rule | ✅ PASS |
| Flag proof | 30 of 30 caught for the stated reason | 30 of 30 on CI on every merge (the table of `393f7b9` is committed) | ✅ PASS |
| `@api` / `@ui` executions | 60 / 59 | 60 / 59, now compared by scenario name and outline rows | ✅ PASS |

---

## Changes Implemented

### Slice 1 (#133): the proof made harder to fool

**Files changed:** `fixtures/failswith.mjs` (a recorded failure text that is a bare word, a presence timeout or an image name is refused), `fixtures/schema-check.mjs`, `src/flags/verdict.ts` (`page-changed-only`), `src/flags/prove-flags.ts`, `scripts/run.mjs`, `safeRedirect.ts` (`followAddress`), `DetailFormPage.tsx`, `LoginPage.tsx`, `account.steps.ts`.

The open-redirect flag now really leaves the site and its catcher says so; a visual catch alone is no longer credited as a reason; the artifact is kept 90 days.

### Slice 2 (#134): the public build, the semantic rules, the exit run

**Files changed:** `format.ts` (`plural` inside `TEST_BUILD &&`), `scripts/public-build-guard.mjs` (every UI flag covered, plain-word names as quoted strings), `semantic-rules.ts` v2 (drawn width, percentages only, a figure in every chart cell), `targets.ts` (a long summary, folded and open), `semantic-rules.test.ts` (new, in a real browser), `exit-checks.ts` (128 scans, 294 checks).

### Slice 3 (#135): the visual check

34 images (the fixed tab bar hidden in whole-page shots and photographed alone), colour distance 0.1, `visual.yml` also watching `fixtures/**` and `packages/api-client/**`, the profile tile labels spaced (B-05). **The tab bar's crop lost its place: see round 2.**

### Slice 4 (#137): the report, the site, the baselines workflow

`src/report/files.ts`, `manifest.ts` (new), `checks.ts`, `site.ts`, both check scripts: every file read, the report's kinds allow-listed, `tok_` and base64, scenario names and outline rows compared with a manifest read from the feature files, the whole-commit stamp; `visual-baselines.yml` as two jobs (a read-only token where project code runs).

### Slice 5 (#138): documents and the durable proof

Seven documents corrected (B-12); the proof table of the CI run on `main` at `393f7b9` committed under `DOCS/evidence/` and DR-067 pointed to it.

### CI limits (#136)

`ui` 25, `flags` 40, `visual` 25, `visual-baselines` 30 minutes. A retry of the browser install (cut off at four minutes, tried once more) was built and removed: the apt mirror was too slow for both attempts, and a patient install passes in 10 to 14 minutes.

### Round 2 slice A (#140): the visual check again (C-01, C-07, C-13)

`cases.ts` v3 (`hideBar` only for the 16 whole-page shots at 375 px; the bar's two cases are the screen at the top of the overview with the bar at its foot), `visual.spec.ts`, `hide-tab-bar.css`, `verdict.ts` (`visualTitlePattern`, the proof's `-g` anchored), the 0.1 limit stated. Proved in local-try mode: the bar moved to the top fails 2 images, the bar shown at 1280 px fails 16 (both had passed 35 of 35).

### Round 2 slice B (#141): the proof and the rules (C-02, C-03, C-04, C-05, C-11)

`failswith.mjs` v2 (the presence timeout anywhere; a text of generic words and a number), `account.steps.ts` (every row of the open-redirect outline fails with `the redirect was followed to '<address>': ...`; a script's dialog is noted), `bug-flags.json` (the reasons for `util-mismatch` and `chart-no-values`), `semantic-rules.ts` v3 (the bar's border, a name with a limit, a chart row's last cell, two messages for an empty cell and a cell with no figure).

### Round 2 slice C (#142): the report and the site again (C-06, C-08, C-09, C-13)

`files.ts` v2 (`binaryKind` by magic bytes, `scanTextOf`), `checks.ts` v3 (escaped, hex, case), the scripts, the PNG signature in the baselines workflow, README 216, the time-limit comments.

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Two reviewers, then one confirmation pass, no third (D4, 2026-10-22; and the owner's answer on 2026-10-23) | The method of CDS-38; a third pass is a separate decision | As many passes as it takes |
| Fix Blockers and Changes; record Notes (D5) | The Notes need no change; two were cheap and were done | Everything |
| The retry of the browser install removed, limits raised | A slow mirror failed both attempts; patient installs pass | A cache of the browser (it saves 8 seconds of 10 minutes) |
| The semantic-rule misses recorded, not fixed (round 2 D3) | The real pages pass; a full rule set is another project | Fix all |
| Structural decisions: DR-068 | | |

---

## Documentation Updates

DR-068; the Outcomes of the three plans; `DOCS/implementation-plans/_index.md` v33; the backlog v84 and the Kanban board (48 of 48 Done); the README (DR-001 to DR-068, 34 images, 216 component tests); UI specification v42 and harness design v22 (sections 39 to 46); CHANGELOG; `DOCS/evidence/phase-5-bug-flag-proof_2026-10-23.{md,json}`; the review records under `.review/`.

---

## Lessons Learned

- **My own fix needed the same review as the code it fixed.** Hiding the tab bar and photographing it cropped removed the bar's place from every image: the check that was added passed while the thing it was added to catch moved. A check is shown only when it fails on the defect; both of the reviewer's probes are now in the proof of the change.
- **A probe that passes at both settings proves nothing.** The first colour probes shifted by 0.04 and 0.09 and passed at 0.2 and 0.1; the real one (0.15) was computed first.
- **Run a new check on real data before merging it.** The report manifest met `&apos;` in real names; the site allow-list met an empty file with no extension; a failure-text rule refused a real registry entry (`642 !== null`). None was found by the unit tests.
- **A retry needs the cause removed, not only the process killed.** `timeout` stopped `npx`; a root `apt-get` kept the lock.
- **Registry text and step text are tied only by the proof.** `npm run check` cannot see them disagree; the flag proof does, and the log shows it.
- **GitHub's merge state can be stale** after a base change; a clean local test merge and an empty commit refreshed it.

---

## Recommendations / Next Steps

1. Close the project with `close-project` (DR-067 D2): the FINAL handover; the stretch profile pages, the container image and the deferred items A-22, R2-B-13, R2-B-17, R2-B-19 listed as deferred.
2. After that, on the owner's word: the registry, landing card and capability matrix updates, and the owner's settings (protect `main`; Actions may open PRs; Dependabot alerts).
3. Delete the spent remote branches (`claude/cds-28-code`, the `claude/cds-48-*` and `claude/visual-baselines-*` branches): a delete is denied by the permission classifier here, so it is the owner's to run or to allow.
