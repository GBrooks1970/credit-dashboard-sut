# CDS-44: P6, the published Serenity report (P6a to P6d) — 2026-10-20

## Session Summary

The Serenity BDD report of the 60 `@api` and 59 `@ui` executions is published on GitHub Pages at `/report/`, beside the Kanban board at `/`, from the runs that gate each pull request (#119, #120, #121). The first deployment worked and was checked live: the board's payload, the report (77 scenarios, 119 test cases, all passing), a scenario page, the commit stamp (`3bdeefe`), and no key or token. DR-066 amends DR-060.

---

## Objectives

1. ✅ P6a (#119): the harness writes the Serenity JSON; `src/report/checks.ts`; `npm run report` and `check:report`.
2. ✅ P6b (#120): `Verify` and `UI` upload the JSON; the `report` job (Java 21, the CLI pinned at 4.3.4).
3. ✅ P6c (#121): the `site` and `deploy` jobs; `pages.yml` manual-only; DR-066.
4. ✅ P6d (this pull request): records.
5. ⏸️ Stop for the owner's decision before P7 (CDS-45, the Phase 5 exit).
6. ⏸️ README and landing link to the report: P7.

---

## Test Results

| Check | Before (`c92cc11`..`3009bf0`) | After (`3bdeefe`) | Status |
|---|---|---|---|
| Harness unit tests | 29 | 52 | ✅ PASS |
| `@api` / `@ui` executions | 60 / 59 | 60 / 59 (33 and 44 Serenity JSON files) | ✅ PASS |
| `check:report` | none | 60 and 59 executions, all `SUCCESS`, no key or token, the HTML looked at (425 text files) | ✅ PASS (on CI) |
| `check:site` | none | 3,875 files: the board, the report stamped with the commit, nothing else | ✅ PASS (on CI) |
| `check:bug-flags` | 30 of 30 | 30 of 30 | ✅ PASS |
| `verify` | 14 of 14 | 14 of 14 | ✅ PASS |

Planted faults, each reverted: on CI, the expected `@api` count raised by one fails the report job at "Check the report" ("api: the report holds 60 executions, the suite runs 61"; branch deleted, never merged). Locally on real JSON: a failed scenario, a missing file, a control key. Locally on a real Pages folder (the CI report, the board, a stamp): an extra file, a stamp for another commit, a control key, a bearer token, an empty board. Unit-test mutations: five for the report checks and five for the site check, each failing at least one test (one test was added after a site-check mutation first survived).

Live site, after the first deployment: `/` 200 with the payload (CDS-40 to CDS-46 listed), `/report/` 200 (77 scenarios, 119 test cases), a scenario page 200, `/report/commit.txt` naming `3bdeefe`, no key or token.

---

## Changes Implemented

- **P6a.** `src/support/serenity-crew.ts` (the crew of both profiles: `ArtifactArchiver`, `SerenityBDDReporter`, the console reporter; JSON in `reports/serenity/<profile>`, emptied each run); `@serenity-js/serenity-bdd` 3.49.0 (exact); `src/report/checks.ts` and `scripts/check-report.ts`; `scripts/report.mjs` (Java optional locally). Harness design v10.
- **P6b.** Uploads in `Verify` and `UI`; the `report` job; `download-artifact`, `upload-artifact` and `setup-java` at v6.0.0, pinned by SHA. Harness design v11.
- **P6c.** `src/report/site.ts`, `scripts/check-site.ts`; `site` and `deploy` in `ci.yml`; `pages.yml` manual-only; DR-066 (decision register v30). Harness design v12.

---

## Technical Decisions

- **One deployer.** Pages takes one deployment, so the board and the report are one folder, assembled and deployed by `ci.yml`; `pages.yml` stays for publishing the board alone.
- **The report is the gated runs.** The JSON of the runs that `Verify` and `UI` already make; a failing suite makes no report.
- **`deploy` does not wait for the flag proof**, so a flaky proof cannot hold the board back.
- **The published folder is checked as the pull request builds it**, so the first deployment was not the first assembly.
- **The control key and token shapes are looked for in every published text file**, naming the file and never the value. The public demo password is a step in the recording and is not a secret.

---

## Documentation Updates

Plan `2026-10-20_cds-44-serenity-report.md` (Outcome) and `2026-10-20_cds-46-flag-proof-reset.md` (Outcome); plans index; decision register v30 (DR-066, DR-060 marked amended); harness design v10 to v12 (sections 34 to 36); backlog v78; CHANGELOG; README.

---

## Lessons Learned

- **A dependency's types can come from two builds of one package.** The cast is one line with the reason beside it; do not widen it.
- **A job that names an environment is a job that can be held on every pull request.** Split assembly from deployment.
- **A test that passes with its own check removed proves nothing.** One site-check mutation survived, because an empty board also failed the ticket check; the test that isolates the payload element was added.
- **The red on the landing page was the owner's alert, not ours.** `main` CI had failed twice (CDS-46) while every pull request was green, and nobody was told. After a merge, read the run on `main`, not only the pull request's.
- **A stale shell string helper turns `\n` into a real newline.** Four edits in this stretch needed the file edit tool, not a shell string.

---

## Recommendations / Next Steps

1. Stop for the owner's decision, then P7 (CDS-45): the Phase 5 exit, the report linked from the README (and the landing card, if the owner wants it), the gate brief.
2. Watch the next runs of the flag proof on `main` for CDS-46.

---
