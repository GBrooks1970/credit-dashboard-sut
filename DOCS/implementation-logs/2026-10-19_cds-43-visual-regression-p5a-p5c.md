# CDS-43: P5, visual regression (P5a to P5c) — 2026-10-19

## Session Summary

Visual regression is built and running on Linux CI (#113, #114, #115): eight pages at 375 and 1280 px in the light and dark theme, 32 images compared with baselines made on Linux CI and accepted by the owner. It passed twice running there, failed on a planted colour change (16 of 32) and a planted margin change (32 of 32), and catches `util-mismatch` and `currency-format` as a second catcher each. `check:bug-flags` still shows **30 of 30**. The owner revised two plan decisions on the way (D3 and D4). CDS-38 C-23 is closed.

---

## Objectives

1. ✅ P5a (#113): the check, the shared targets, the refresh workflow, the `Visual` workflow with the job disabled.
2. ✅ P5b (#114, #115): the 32 baselines made on Linux CI and accepted; the job enabled; the visual-check catcher kind; the proofs on CI.
3. ✅ P5c (this pull request): records; C-23.
4. ⏸️ Stop for the owner's decision before P6 (CDS-44, the published Serenity report).
5. ⏸️ Registry, landing card and capability matrix, updated when the owner asks.

---

## Test Results

| Check | Before (`8f3c3fb`, end of P4) | After (`3009bf0`) | Status |
|---|---|---|---|
| `check:bug-flags` | 30 of 30 | 30 of 30 (two flags with a second, visual catcher) | ✅ PASS |
| Harness unit tests | 23 | 29 | ✅ PASS |
| `check:ui-exit` | 124 scans, 288 layout checks | 124 and 288, 0 problems (run after the refactor) | ✅ PASS |
| `check:visual` (Linux CI only) | none | 32 images and the baseline-folder check, 33 tests | ✅ PASS (twice running) |
| Service, rules, component tests | 437, 239, 208 | unchanged | ✅ PASS |
| `verify` | 14 of 14 | 14 of 14 | ✅ PASS |

CI durations, measured on each pull request (every one merged after every job showed `pass`): `Verify` 2m04s to 2m14s; `UI` 3m50s to 5m01s; `flags` 15m26s to 16m59s; `Visual` 1m11s to 1m21s (the job's own time, not counting the runner start).

Planted-change probes on Linux CI (`workflow_dispatch` on throw-away branches, deleted, never merged): accent colour `#0b5cad` to `#8a2be2`, 16 failed and 17 passed (31.7 s); `main` padding plus 4 px, 32 failed and 1 passed (44.6 s); each uploaded the `visual-diff` artefact (3.1 MB and 6.7 MB). Local probes on the Windows machine against throw-away images gave the same counts. A deleted baseline and an extra file each fail; a one-channel colour change of 10 steps passes.

---

## Changes Implemented

- **P5a (#113, `1999d2e`).** The exit checks' target list, sign-in, arrange and browser context moved unchanged to `src/exit/targets.ts`; `fixtures/schema-check.mjs` reads the targets from both files (it failed nine flags until changed, which is the guard working). `src/visual/` holds `cases.ts` (the 32 cases; a missing or an extra baseline is a problem), `cases.test.ts` (six tests, two proved by mutation), `visual.spec.ts` and `playwright.config.ts` (the tolerance). `scripts/run.mjs` v10 has a `visual` mode that refuses to run off CI (`VISUAL_LOCAL_TRY=1` for throw-away images). `@playwright/test` 1.64.0 added. Workflows `visual.yml` (job disabled) and `visual-baselines.yml` (manual; pushes a branch). UI specification v35, harness design v7.
- **P5b (#114 `2642c3a`, #115 `3009bf0`).** 32 PNGs (2.5 MB) from the refresh workflow (run 39238484690, image `ubuntu-24.04` 20261012.601). Job enabled; both visual workflows pinned to `ubuntu-24.04`. The `visual-check` catcher kind in the registry, `prove-flags.ts` and `schema-check.mjs`; `util-mismatch` (the credit card list, 1280 px, light) and `currency-format` (the overview, 1280 px, light). UI specification v36, harness design v8.
- **P5c.** This log, the plan's Outcome, backlog v73, the plans index, CHANGELOG, README.

---

## Technical Decisions

- **A tolerance that hides a flag the plan names is a stop (D4).** The probe with the flag on showed 0.1% of pixels hid `util-mismatch`; the owner chose no allowed pixel difference. I also tried it on the same machine three times before asking, so the option I recommended had evidence behind it.
- **A new dependency the plan did not expect is a stop (D3).**
- **The clock is frozen for the visual run**, because what a page shows depends on it.
- **The runner is pinned**, because a baseline is an image of one runner image's fonts.
- **Off Linux, the proof says the visual catchers were not run** and the flags' other catchers judge, so a developer's `check:bug-flags` is not broken by baselines it cannot compare with.

---

## Documentation Updates

UI specification v35, v36 (section 9, the visual-check catchers, section 8 rows); harness design v7, v8 (section 32); plan `2026-10-19_cds-43-visual-regression.md` (Outcome); plans index; backlog v73; CHANGELOG; README.

---

## Lessons Learned

- **A pixel-ratio tolerance is a bet about how big a defect is.** A defect the size of a progress bar is under 0.01% of a whole-page image; the first tolerance would have passed it. Prove the tolerance with the flags it is meant to catch, not only with a colour change.
- **Serial test mode hides failures.** After the first failing image the rest were skipped, so one diff image was produced and the folder check did not run. The proof of a check must look at how many things fail, not only that something does.
- **A new check that reads names from a file notices when the names move.** Moving the target list failed the registry guard for nine flags; the guard did its job.
- **A workflow token's pushes start no checks, and its pull requests are not allowed here.** Both are repository settings that are the owner's; the workaround (an empty commit from my own account, the pull request opened by me) is recorded, not hidden.
- **A baseline depends on the runner image.** `ubuntu-latest` moved the day the baselines were made.

---

## Recommendations / Next Steps

1. Stop for the owner's decision, then P6 (CDS-44, the published Serenity report on Pages beside the board; Java 21 in CI; DR-060 amended): plan first.
2. Update the registry, landing card and capability matrix when asked.
3. Refresh the baselines (manual workflow, reviewed pull request) whenever a page is meant to look different, and together with any move of the runner pin.

---
