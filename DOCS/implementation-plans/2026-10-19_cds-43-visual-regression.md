---
version: 1
created: 2026-10-19T08:58Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-43
status: implemented
approved: "2026-10-19, Gary Brooks, 'all as recommended, approved' (D1 to D7 as recommended); merge only on the owner's word per pull request"
delivered: "2026-10-19: P5a #113 `1999d2e`, P5b #114 `2642c3a` and #115 `3009bf0`, P5c this pull request"
language: en-GB
---

# Implementation plan: CDS-43, P5 visual regression

**Goal.** Add `npm run check:visual`. It takes screenshots of eight pages at 375 and 1280 px, each in the light and dark theme (32 images), and compares them with baselines committed to the repository. It fails when a page's look changes. Baselines are made and compared on Linux CI only (Phase 5 decision D2). A failing run uploads the diff images as a CI artefact. This is the "Visual regression" row of UI specification section 11, due in Phase 5.

It also closes CDS-38 item **C-23** (the `ui` job's time limit), deferred to this slice.

## Evidence gathered before planning

Read only; nothing was run against the repository and nothing in it was changed.

| Finding | Consequence |
|---|---|
| The exit checks (`src/exit/exit-checks.ts`) already hold a target list with ready hooks, persona, failing calls and `act` steps, the sign-in and in-app navigation flow, `uiContext()`, the light and dark theme via `colorScheme`, the 375 and 1280 px sizes and `CDS_EXIT_ONLY`. | The visual check reuses this machinery. The shared parts move to `src/exit/targets.ts`, so the list is not copied into a second file. |
| `flags` takes 16m41s of its 30-minute limit and grows about 30 s per flag. `ui` takes about 5 minutes of 15. | Visual regression gets its own CI job, `visual`. It does not share `flags` or `ui`. |
| `run.mjs` has modes `api`, `ui`, `exit` and `flags`. Each starts the service, builds a test build of the UI and has a time limit. | Add a `visual` mode with a 15-minute limit. |
| `util-mismatch` is caught by an exit check; `currency-format` by an `@ui` scenario. | They are the two flags the snapshot must also catch (the Phase 5 plan's proof). Their registry entries gain a second catcher of kind `visual-check`; the registry schema check and the proof runner's verdict must accept that kind. |
| Whether `styles.css` uses animation or transitions is not yet checked. | Step 3 checks it. Screenshots use animations disabled and reduced motion, and wait until no `-loading` hook is left. |
| Windows and Linux fonts differ (the profile once scrolled sideways on Linux only, harness design 4.4). | Baselines come from Linux CI only. A local run does not compare (D2). |

## The eight pages (D1)

Overview; payment history; report changes; hard searches; personal details; a credit card list; a credit card detail; profile. Each is the settled, no-error state with the flags off, persona `drilldown`. They cover each page type (summary, chart, list, detail, form) and the two flags above. The sign-in page, error states and pages not yet built stay with axe and the layout checks.

## Work (in order, test first where a test applies)

1. **Specify.** UI specification sections 9 and 11, and the harness design: what is compared, the tolerance, the eight pages, Linux only, how baselines are refreshed. The step glossary is unchanged.
2. **Share the targets.** Move the target type and list, `visit`, `arrange` and `uiContext` into `src/exit/targets.ts`. The exit run must still report 124 axe scans and 288 layout checks with 0 problems. A refactor; no new test.
3. **Write `src/exit/visual-checks.ts`.** For each of the 32 combinations: set the viewport and `colorScheme`, visit the page, wait until settled, take a full-page PNG with animations off, and compare, using Playwright's built-in screenshot matching (D3) and a small tolerance (D4: a per-pixel colour threshold plus at most 0.1% of pixels different).
4. **Guards, test first.** A pure function decides pass or fail. Unit tests: a missing baseline fails; an unexpected extra baseline file fails; a size mismatch fails; a difference within tolerance passes; a difference over it fails.
5. **`run.mjs` `visual` mode and scripts.** `test:visual` in the harness, `check:visual` at the root. Outside CI, without an explicit update flag, it prints that baselines are Linux CI only and nothing was compared, and exits non-zero, so it never reads as a pass (D2).
6. **Refresh workflow `visual-baselines.yml`.** Manual (`workflow_dispatch`), Linux. It writes the 32 PNGs to a new branch and opens a pull request, so a baseline change is always reviewed. It never commits to `main`.
7. **CI job `visual`.** A fourth job with a 15-minute limit. It runs on pull requests that change `demo-apps/demoapp001-react-ui/**`, the harness, the service or the workflow, and on push to `main` (D7). On failure it uploads the actual, expected and diff images as an artefact kept 14 days.
8. **First baselines.** Run the refresh workflow once. I review the 32 images and show them to you before they are accepted (D5).
9. **Proofs, each reverted afterwards.** A colour change in a stylesheet fails, with the diff image uploaded. A margin change fails. `util-mismatch` and `currency-format` each fail the snapshot as well as their own catcher. A deleted baseline fails. Two runs on the same commit both pass (no flakiness).
10. **Registry and proof runner.** Add the `visual-check` catcher kind for the two flags. `check:bug-flags` must still show 30 of 30 caught for the stated reason. The `flags` job is measured again.
11. **C-23.** Set the `ui` job's time limit from measured runs and record the figure.
12. **Records.** This plan's Outcome, the implementation log, backlog (CDS-43 Done, CDS-44 Ready), CHANGELOG, README, the plans index. Registry, landing and the capability matrix only when you ask.

## Delivery

Three pull requests, merged only on your word and after every CI job reads `pass`.

- **P5a** `claude/cds-43-visual-regression`, steps 1 to 7. The `visual` job is added disabled and turned on in P5b (D6).
- **P5b**, steps 8 to 10: the 32 baselines from the refresh workflow, the proofs, the registry change, the job enabled.
- **P5c**, steps 11 and 12: the records.

## Verification

`npm run verify` stays 14 of 14. The exit run stays at 124 scans and 288 layout checks. Harness unit tests grow by the guard tests. `check:bug-flags` stays 30 of 30. The visual check is green on Linux CI twice in a row and red on each planted change. Counts and durations are measured, not estimated.

## Out of scope

The 768 px layout; error and empty states; the debug page; the sign-in page; other browsers (Chromium only); a container image; the Serenity report (CDS-44); the exit (CDS-45); the deferred review items other than C-23.

## Risks

- **Flaky pixels** (font hinting, an animated chart, a date). Mitigated by the fixed persona, animations off, the settle wait and the double-run proof. If a page cannot be made stable, I stop and ask.
- **Baselines go stale silently if refresh is easy.** They always go through a reviewed pull request.
- **Repository size:** 32 PNGs, roughly 1 to 3 MB (my estimate, not measured); measured in P5b.
- **Estimate:** about 1 session (mine, not measured).

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 The eight pages | the list above; a different set | the list | as recommended, 2026-10-19 |
| D2 Where baselines are valid | Linux CI only, local runs refuse to compare; local comparison with a wide tolerance | Linux CI only | as recommended, 2026-10-19 |
| D3 The comparison tool | Playwright's built-in matching; a separate pinned library | built-in | as recommended, 2026-10-19 |
| D4 Tolerance | small colour threshold plus at most 0.1% of pixels; exact match | the threshold | as recommended, 2026-10-19 |
| D5 Who accepts the first baselines | the owner, after seeing the 32 images; me alone | the owner | as recommended, 2026-10-19 |
| D6 Order of the first pull request | job added disabled in P5a, enabled in P5b; P5a fails CI by design | disabled first | as recommended, 2026-10-19 |
| D7 When the `visual` job runs | every pull request; only when UI, harness, service or workflow files change | path-limited | as recommended, 2026-10-19 |

## Outcome

**Delivered 2026-10-19** in four pull requests, each merged after every CI job showed `pass`: P5a #113 (`1999d2e`, the check, the shared targets, the two workflows with the job disabled), P5b #114 (`2642c3a`, the 32 Linux baselines) and #115 (`3009bf0`, the job enabled, the runner pinned, the visual-check catcher kind), and P5c (the records). The implementation log is `DOCS/implementation-logs/2026-10-19_cds-43-visual-regression-p5a-p5c.md`. `check:bug-flags` still shows **30 of 30 caught for the stated reason**, and `util-mismatch` and `currency-format` are each now also caught by one image.

**Where it departed from the plan.**
1. **D3 was revised by the owner.** The plan said Playwright's built-in matcher needed nothing new. `toHaveScreenshot` is in `@playwright/test`, which the harness did not have. I stopped and asked; the owner chose to add it, pinned at 1.64.0 (the release of `playwright`). It also needs a test to run in, so the check is a Playwright spec, not a script beside the exit checks as the Phase 5 plan said.
2. **D4 was revised by the owner.** With up to 0.1% of the pixels allowed, `util-mismatch` was not caught (a bar 7 points too wide changes under 0.01% of a page), which broke the plan's own proof. Now no pixel may differ beyond a colour distance of 0.2: `util-mismatch` fails 12 of 32 images, and three clean runs on the Windows machine and two on Linux CI all passed. The limit that remains: a one-channel colour change of 10 steps (`#0b5cad` to `#0b66ad`) is inside the colour distance and passes.
3. **The service clock is frozen** at 2026-10-03T09:00Z for the check. The first local baselines showed dates and the history chart's months that depend on it; without the freeze every baseline would have gone out of date at the turn of a month. Not in the plan.
4. **A serial test mode hid failures** and was removed: after the first failing image the rest were skipped, so only one diff image was produced and the baseline-folder check did not run.
5. **The runner is pinned to `ubuntu-24.04`**, not `ubuntu-latest`: GitHub moved `latest` to Ubuntu 26 on the day the baselines were made. Not in the plan.
6. **The refresh workflow pushes a branch; it does not open the pull request.** The repository does not allow Actions to open pull requests, and I did not change that setting. A push by the workflow's token also starts no checks, so an empty commit from my own account started them on #114.
7. **The `visual` job is its own workflow (`visual.yml`)**, not a fourth job of `ci.yml`, because D7 asked for a path filter. It runs when the UI, the service, the harness or the workflow changes; it was skipped on the documentation-only pull requests.
8. **The plan's proof "a flag that changes the look is caught by the snapshot" is built in the proof runner**, as a new catcher kind, `visual-check`. Off Linux CI the proof leaves those catchers out and says so; the flags' other catchers still judge them. The `flags` job grew by under 2 minutes (16m55s to 16m59s on the pull requests, against 16m41s at P4).
9. **C-23 is closed with no change to the limit.** The flag proof has its own job since P3c, and the visual check its own workflow; the `ui` job ran 3m50s to 5m01s on these pull requests against its 15-minute limit, so 15 minutes stays.
10. **The first baselines were accepted by the owner** after I viewed six of the 32 and sent four (D5). At 375 px the whole-page image draws the fixed bottom tab bar part-way down the page; it is deterministic and was left.

**Counts at the close** (`3009bf0`): 437 service tests, 239 rules tests, 208 component tests, 20 guard tests, 29 harness unit tests (23 and the six of `cases.test.ts`), 60 `@api` and 59 `@ui` executions, 124 axe scans and 288 layout checks (0 problems), 32 visual images, `verify` 14 of 14. CI: `Verify` 2m04s to 2m14s, `UI` 3m50s to 5m01s, `flags` 16m55s to 16m59s, `Visual` 1m11s to 1m21s.
