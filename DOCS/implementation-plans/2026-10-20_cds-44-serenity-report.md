---
version: 1
created: 2026-10-20T07:15Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-44
status: approved
approved: "2026-10-20, Gary Brooks, 'all approved as recommended' (D1 to D8 as recommended); merge only on the owner's word per pull request"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-44, P6 the published Serenity report

**Goal.** Publish a Serenity BDD report of the 60 `@api` and 59 `@ui` executions on GitHub Pages at `/report/`, with the Kanban board still at `/`. It is built by CI from the runs that gate each pull request, checked before it is published, published from `main` only, and stamped with the commit it came from. DR-060 ("the board only") is amended by a new decision record, as DR-064 D3 said it would be.

## Evidence gathered before planning

Read only; nothing was run against the repository and nothing in it was changed.

| Finding | Consequence |
|---|---|
| `parabank-bank-automation` already does this: `@serenity-js/serenity-bdd`, Java 21 in CI, the CLI pinned at `net.serenity-bdd:serenity-cli:jar:4.3.4` (the default CLI writes a stale jquery-ui path), a Java-optional local script, a checker for the JSON and HTML, a prepared and checked Pages folder, then `deploy-pages` from `main`. | The model to follow. |
| Both profiles configure only `ConsoleReporter` (`src/api/hooks.ts`, `src/ui/hooks.ts`). Cucumber allows one stdout formatter, which must be Serenity's (`cucumber.mjs`). | Add `ArtifactArchiver` and `SerenityBDDReporter` to the crew. No change to formatters or scenarios. |
| The `Verify` job runs the `@api` suite (through `verify.mjs`) and the `UI` job runs the `@ui` suite, in separate jobs. | A report job downloads the JSON from both and does not run the tests again. |
| `pages.yml` deploys the board alone, on pushes that change the board file. Pages takes one deployment: a second workflow would replace the board with the report, or the reverse. | One workflow must assemble both (D2). |
| `@serenity-js/serenity-bdd` 3.49.0 matches the other pinned Serenity packages; the npm registry shows it published 2026-10-10, nine days before planning. | Same version as the packages already in use. It is under the two-week rule; the owner accepted it (D6). |
| Java is not installed on the author's machine. | Local runs prove the JSON and the checks only. The HTML half is proved on CI, and each pull request says so. |
| The synthetic control key `harness-run-key` and bearer tokens exist in the run. | The checker looks for them in the published folder and fails if it finds one. |
| The `flags` job crashed twice on `main` on 2026-10-19 (CDS-46, pull request #117). | `publish` needs only `Verify`, `UI` and `report`, not `flags`, so a flaky proof cannot hold the board back. |

## Work, in slices

**P6a, the harness side (no CI change).**
1. Specify: harness design section (what is recorded, where, the checks).
2. Add `@serenity-js/serenity-bdd` 3.49.0, exact.
3. The crew in `src/api/hooks.ts` and `src/ui/hooks.ts` gains `ArtifactArchiver` (to `reports/serenity/api` or `/ui`) and `SerenityBDDReporter` (`specDirectory` the shared features). The Console reporter stays.
4. A pure module `src/report/checks.ts` and unit tests, written first: the expected counts (60 and 59, to be confirmed by measuring a real run), no scenario failed, none missing, no secret in a file, the source commit stamp present. Mutation-proved, as `cases.ts` was.
5. `scripts/report.mjs` (Java optional locally, as parabank does) and `scripts/check-report.mjs`; `npm run report` and `npm run check:report` at the root.
6. Proof, locally: run both suites, and the JSON check passes. Then plant a failing scenario, a missing file and a planted secret, and each fails the check; revert each.

**P6b, CI builds and checks the report (still no publication).**
1. `Verify` and `UI` upload their JSON as artifacts (always, including on failure).
2. A new job `report` in `ci.yml` (needs `Verify` and `UI`): Java 21 (Temurin, pinned action), download both artifacts, generate the HTML with the pinned CLI, run `check:report` with Java mandatory in CI, upload the report as an artifact on every run (14 days).
3. Proof on CI: green on the pull request, and a planted failure: the report must say the scenario failed, or the check must refuse. Measure the job's time and the report's size.

**P6c, publish.**
1. A `publish` job in `ci.yml`, `main` only, `needs` the `report` job. It assembles `_site`: the board at `/index.html`, the report at `/report/`, and `/report/commit.txt` with the commit SHA and the run. It repeats `pages.yml`'s board payload check, adds the report checks, then `configure-pages`, `upload-pages-artifact` and `deploy-pages` (the same pinned actions). On pull requests the assembled folder is built and checked and only the deploy step is skipped.
2. `pages.yml` becomes manual-only (D7), so two workflows never deploy.
3. New decision record DR-066 amending DR-060: the site also carries the Serenity report of the committed scenarios and nothing else; DR-060's rule about the board payload stands.
4. Proof: the first merge to `main` deploys. I check the live URLs for the board (payload present), the report (index, a scenario page, the commit stamp matches `main`), and for the secret strings. Rollback is a revert pull request.

**P6d, records.** Plan Outcome, implementation log, backlog (CDS-44 Done, CDS-45 Ready), CHANGELOG, README note; registry, landing and matrix only when the owner asks. Linking the report from the README is P7, as the Phase 5 plan says.

## Verification

`npm run verify` stays 14 of 14; the 60 and 59 executions, 124 scans, 288 layout checks, 32 images and 30 of 30 flags are unchanged. New: the report unit tests; the report job green on the pull request and red on a planted failure; the published site checked live after the first deployment. Counts and durations are measured.

## Out of scope

Linking the report from the README or the landing card (P7); a failure screenshot or video in the report; trend history across runs; the visual-check images in the report; any change to the board's content; a nightly run.

## Risks

- **The first deployment can only be tested on `main`.** The `github-pages` environment may not allow other branches, so P6c cannot be rehearsed. The assembled folder is checked on every pull request, only the deploy step is skipped, and a revert pull request undoes it.
- **A red `main` stops the board updating.** `publish` needs `report`, which needs `Verify` and `UI`. The board catches up on the next green run; a manual `pages.yml` run can publish the board alone.
- **The CLI is downloaded from Maven Central at run time**, so a failure there fails the job. Parabank has lived with this. The pinned version keeps it stable; a cache of the jar can be added if it proves slow.
- **Report size.** Not known; measured in P6b. Pages allows 1 GB.
- **Estimate:** about 1 session (mine, not measured; the Phase 5 plan said 1).

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Report scope | one report with the `@api` and `@ui` executions together; two reports | one report | as recommended, 2026-10-20 |
| D2 Where the site is assembled and deployed | a `publish` job in `ci.yml`, `pages.yml` made manual-only; `pages.yml` as the only deployer, run on completion of CI; the report in a separate Pages project | a `publish` job in `ci.yml` | as recommended, 2026-10-20 |
| D3 When the report is built | every pull request and `main`, published from `main` only; `main` only | every pull request and `main` | as recommended, 2026-10-20 |
| D4 What the published folder may contain | the HTML, the JSON it needs, a commit stamp, and a check that no control key or token appears; HTML only | with the check | as recommended, 2026-10-20 |
| D5 The CLI | pinned `serenity-cli` 4.3.4 as parabank; the package default | pinned | as recommended, 2026-10-20 |
| D6 The nine-day-old 3.49.0 package | accept it (the other Serenity packages are the same release); wait until 2026-10-24 | accept | as recommended, 2026-10-20 |
| D7 `pages.yml` | keep it as manual-only; delete it | keep, manual-only | as recommended, 2026-10-20 |
| D8 After P6 | stop for the owner's decision before P7; go straight on | stop | as recommended, 2026-10-20 |

## Outcome

[Appended after delivery.]
