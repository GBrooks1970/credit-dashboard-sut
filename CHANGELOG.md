# Changelog

All notable changes to this project. Dates are UTC.

## 2026-10-22: the CI time limits and the browser install (CDS-48, CDS-49)

- The `flags` job's limit is 40 minutes (was 30): the proof takes about 16, and a 14-minute browser install cancelled #134's run at 30. The `ui` job's limit is 25 minutes (was 15). The work takes about 5; the browser install alone took over 10 on a slow runner and the limit cancelled two runs (#132 and #134). Owner approved on 2026-10-22.
- The browser install (`npx playwright install --with-deps chromium`, in `ci.yml` twice, `visual.yml` and `visual-baselines.yml`) is cut off at 4 minutes and tried once more. The slow part was the apt mirror (about 10 minutes of the 10m35s; the browser download itself 8 seconds; the same install 23 seconds on the rerun), so caching the browser would not have helped. Proved on the loop's logic with a stalled fake install (killed, retried, succeeded); the real slow mirror cannot be provoked, so the first slow run will show it.

## 2026-10-22: the proof made harder to fool (CDS-48 slice 1)

- Review findings A-01 (Blocker), A-02, B-08, B-01 (the proof part), A-08, B-09, A-09, B-10, A-14: the `open-redirect` flag really leaves the site and its catcher asserts it; generic recorded failure text is refused; a visual catcher is a page-changed catch, not a reason; one Vitest test, anchored; the proof table keeps each catcher's failure line, is written after every flag and kept 90 days; the `flags` job is pinned to `ubuntu-24.04`; run limits are below the job limits. 63 harness unit tests, 7 component tests, 4 fixture tests. UI specification v37, harness design v15.

## 2026-10-21: the Phase 5 gate is recorded (CDS-45, P7c; DR-067)

- Decision brief 14 answered (D1 option 2, D2 option 1, D3 option 1, D4 option 1). DR-067 records the Phase 5 exit gate as met on 20 October 2026 with its exceptions; the README Phase 5 row says so; CDS-45 and CDS-37 are Done; CDS-48 (the independent review of the Phase 5 additions) is opened. Decision register v31, backlog v82.

## 2026-10-21: only a whole run writes the Serenity JSON (CDS-47)

- `src/report/switch.ts` (pure, two unit tests, one mutation) and `HARNESS_SERENITY_JSON`: `run.mjs` v12 marks a whole `api` or `ui` run `on` and everything else `off`; `crewFor` writes and empties the folder only when it is on. Found by the Phase 5 gate's full run (decision brief 14 B9, D4). 54 harness unit tests. Harness design v14.

## 2026-10-20: the exit evidence made durable (CDS-45, Phase 5 P7a)

- The `flags` job writes the proof table to its run summary and uploads it as the `bug-flag-proof` artifact (14 days), also when the proof stops early. The README links the published report and the board and says the deployer is the `deploy` job of `ci.yml`; its decisions count is DR-001 to DR-066.

## 2026-10-20: the Serenity report published, P6 closed (CDS-44; CDS-46 closed)

- P6a to P6d done (pull requests #119 to #121 and the records): the report at `/report/` beside the board, the first deployment checked live (77 scenarios, 119 test cases, commit stamp `3bdeefe`). CDS-46 (the flag proof's reset call) closed. 52 harness unit tests. Backlog v78.

## 2026-10-20: the site is assembled, checked and deployed (CDS-44, Phase 5 P6c; DR-066)

- `ci.yml` gains `site` (board plus report, stamped with the commit, checked on every run) and `deploy` (`main` only, the single Pages deployer). `pages.yml` is manual-only. `src/report/site.ts` and `scripts/check-site.ts` (eight unit tests, five mutations; 52 harness unit tests). DR-066 amends DR-060. The first deployment, on the merge to `main`, is the proof. Harness design v12, decision register v30.

## 2026-10-20: the report job in CI (CDS-44, Phase 5 P6b)

- `Verify` and `UI` upload their Serenity JSON; a new `report` job (Java 21, the CLI pinned at 4.3.4) makes the Serenity BDD report from it, checks it (every execution, the counts, no key or token, the HTML present) and uploads it as an artifact. Nothing is published yet. Harness design v11.

## 2026-10-20: the Serenity report, harness side (CDS-44, Phase 5 P6a)

- Both profiles write Serenity BDD JSON (`reports/serenity/api`, `/ui`; `@serenity-js/serenity-bdd` 3.49.0 added). `src/report/checks.ts` (pure, ten unit tests, five mutations): every execution present and `SUCCESS`, the counts (60 and 59), every file parses, no control key or token. `npm run report` (Java optional) and `npm run check:report`. 44 harness unit tests. The HTML half is first proved on CI in P6b. Harness design v10.

## 2026-10-20: the flag proof survives a dropped connection (CDS-46)

- `prove-flags.ts` v4: each reset of the service is made on a new connection, retried once on a connection error, and a reset that still fails stops the proof with a message that names the flag and prints the end of the service log (the table so far is written, the exit code is 1), instead of an uncaught `fetch failed`. A status other than 204 is not retried. `src/flags/reset.ts` is pure, with five unit tests (retry and the flag name proved by mutation); 34 harness unit tests. The `flags` CI job uploads `/tmp/harness-service-*.log` when it fails. Cause: the proof crashed twice on `main` on 2026-10-19; likely a stale pooled connection, not proved. Backlog v74.

## 2026-10-19: visual regression closed (CDS-43, Phase 5 P5)

- P5a to P5c done (pull requests #113 to #115 and the records): 32 images against Linux CI baselines, the `Visual` workflow, the visual-check catcher kind. `check:bug-flags` 30 of 30; 29 harness unit tests. CDS-38 C-23 closed. Backlog v73.

## 2026-10-19: the visual checks on Linux CI (CDS-43, Phase 5 P5b)

- The 32 baselines, made on Linux CI (pull request #114, accepted by the owner). The `Visual` workflow is enabled, with the runner pinned to `ubuntu-24.04` because `ubuntu-latest` moved to Ubuntu 26 on this date and the baselines depend on the image's fonts. On CI it passed twice running; a changed accent colour failed 16 of 32 images and a wider margin 32 of 32, each uploading the diff images.
- A second catcher kind in the bug-flag registry, the visual check: `util-mismatch` and `currency-format` are each also caught by one image (UI specification v36, harness design v8).

## 2026-10-19: the visual checks, built (CDS-43, Phase 5 P5a)

- `npm run check:visual`: eight pages at 375 and 1280 px, light and dark, 32 images compared with Linux CI baselines (no pixel difference beyond a colour distance of 0.2). `@playwright/test` 1.64.0 added (the harness had only `playwright`). The exit checks' target list moved to `src/exit/targets.ts`, unchanged (124 scans, 288 layout checks). Workflows `visual.yml` (disabled until the baselines exist) and `visual-baselines.yml` (manual refresh to a branch). The baselines and the job follow in P5b.
- UI specification v35, harness design v7, backlog v71.

## 2026-10-18: the eleven remaining behaviour flags, 30 of 30 caught (CDS-42, Phase 5 P4)

- Service: `preferred-no-trim`, `email-stays-verified` (`Defects` call sites). UI, test build only: `range-stale`, `like-both`, `open-redirect`, `negative-balance`, `preferred-on-report`, `pii-in-title` (caught by `@ui` scenarios), `toggle-label`, `truncate-summary`, `lost-edit` (caught by component tests; the summary expander and the unsaved-name warning are new, specified behaviour). A new `@api` scenario catches `preferred-no-trim`. `problemText` shows the specific `errors[0]` message (CDS-38 C-26).
- `check:bug-flags`: **30 of 30 implemented flags caught for the stated reason** (pull requests #108 to #110). 437 service tests, 208 component tests, 60 `@api` and 59 `@ui` executions. API specification v36, UI specification v34, backlog v70.

## 2026-10-18: the eleven UI display and semantics flags (CDS-41, Phase 5 P3)

- `duplicate-nav`, `nested-button`, `util-mismatch`, `minor-units-label`, `placeholder-aria`, `chart-no-values`, `button-href`, `decorative-alt`, `currency-format`, `double-render` and `ph-a11y` are built in the UI's test build only; each is caught for its stated reason (pull requests #103 to #105). The proof runner gained an `exit-check` catcher kind; the exit run gained seven semantic rules in the same scans (124 axe scans and 288 layout checks, unchanged); the flag proof has its own CI job.
- `check:bug-flags`: 19 of 19 implemented flags caught, 11 pending. 23 harness unit tests. UI specification v32, harness design v6, backlog v69.

## 2026-10-18: the independent review and its fixes (CDS-38)

- Two fresh-context review rounds of the Phase 4 UI, the service and the harness, and the fixes to both (F1 to F11f, pull requests #77 to #100): every response object in the contract is closed (contract v19); the harness validator judges the whole response; faults, bodies, numbers, dates and the clock are judged at the edge; the mobile-code limit is race-free; the flag proof, the exit checks, the public-build guard and the runner cannot be fooled the ways the reviewers fooled them; the UI keeps focus, ignores late answers and doubles its form controls with the text.
- 435 service tests, 239 rules tests, 198 component tests, 20 guard tests, 21 harness unit tests, 59 `@api` and 59 `@ui` executions, 124 axe scans and 288 layout checks. API specification v35, UI specification v29, contract v19. DR-065.

## 2026-10-14: the seven API flags (CDS-40, Phase 5 P2)

- `excluded-in-total`, `history-carry-forward`, `idor`, `problem-json-missing`, `mask-format` and `currency-float` are implemented in the service (with `rounding-down` from P1 that is all seven API flags); each is caught for its stated reason by an existing scenario. `check:bug-flags`: 8 of 8 implemented flags caught.
- 339 service tests (7 new). API specification v27, backlog v66.

## 2026-10-14: the flag mechanism and the proof runner (CDS-39, Phase 5 P1)

- Service: `Flags` (the flags on for a request) and `Defects` (a flag changes a call site, never a rule); `rounding-down` implemented. UI: a test build reads the flags once at start, the `/debug` panel, `plural` implemented.
- `fixtures/bug-flags.json` lists all 30 flags; the fixture check keeps it in step with the contract. `npm run check:bug-flags` proves each implemented flag against its catchers, on and off; a step in the `ui` CI job. Harness: `setBugs`, `HARNESS_BUGS`, the control key seeded in browser storage.
- 332 service tests (14 new), 142 Vitest tests (7 new). UI specification v22, API specification v26, backlog v65.

## 2026-10-13: the exit checks (CDS-36, Phase 4 U6)

- `npm run check:ui-exit`: axe-core on 37 pages and states with the bug flags off (0 violations), and 24 layout checks at 375, 768 and 1280 px, each with normal and wider text (one navigation at a time, no sideways scroll, the demo banner). The first CI run found the profile scrolling sideways by 5px at 375px with Linux fonts (a long email address); fixed with `overflow-wrap`. A step in the `ui` CI job.
- Harness: `@axe-core/playwright` 4.13.0; `scripts/run.mjs exit`. UI specification v19. Backlog v59.

## 2026-10-13: the profile (CDS-35, Phase 4 U5)

- My profile, the email sub-page and the mobile sub-page with its code step; the header account button links to the profile and follows the preferred name.
- Harness: the profile steps, `{nameOutcome}` and `{tile}` types; the `ui` profile has 41 scenarios (51 executions). My Profile feature spec v9, UI specification v18, glossary v13.
- 135 Vitest tests (33 new). Backlog v58.

## 2026-10-13: the accounts (CDS-34, Phase 4 U4)

- The account-type list (summary, bar, rows, excluded loans), closed accounts, account detail, the detail edit form (five fields, BR-14 client check, the service's message shown as it comes) and the open-redirect guard (`safeRedirect`).
- Harness: the account steps; `poundsAndPence`; the `ui` profile has 31 scenarios (39 executions). UI specification v17.
- 102 Vitest tests (47 new). Backlog v57.

## 2026-10-13: the report pages (CDS-33, Phase 4 U3)

- Payment history with the shared `PaymentHistoryWidget`, report changes (kind and page in the address, 20 a page, a pager), searches (hard and soft apart), personal details (read-only) and the debt overview; sign-in brings a visitor back to the address they asked for; header links to Debt and Updates.
- Harness: the report page steps and `openAddress`; a `{hardOrSoft}` type; the 25-change Given; the `ui` profile has 22 scenarios (30 executions). UI specification v16, glossary v12.
- 55 Vitest tests. Backlog v56.

## 2026-10-13: the report overview (CDS-32, Phase 4 U2)

- The overview page to UI specification 6.2: score hero and comparison, summary with like and dislike (stored by the service) and a chat drawer (dialog, focus trap, Escape), the score history chart (hand-built SVG, a table alternative, gaps for months with no score), the report changes with the toggle (100 a page, following pages), impact, debt, accounts, payments and the tiles. A 'not built yet' page for links to later slices.
- Harness: the overview steps and a `{days}` parameter type; the `ui` profile has 8 scenarios (12 executions). UI specification v15.
- 37 Vitest tests. Backlog v55.

## 2026-10-13: the UI foundation (CDS-31, Phase 4 U1)

- `demo-apps/demoapp001-react-ui/`: React 19.3.0, Vite 8.3.4, TypeScript 5.9.3, React Router 8.4.0, Vitest 5.0.4; app shell (demo banner, header, themes), login (token in memory only), a report page showing the bureau name, `SectionState`, formatting helpers.
- Service: `UI_DIRECTORY` serves the built UI from the same origin with a client-route fallback (API specification v25; 9 tests).
- Harness: a `ui` profile (Serenity/JS 3.49.0, Playwright 1.64.0), the login steps; the runner builds the UI and has the service serve it. A separate `ui` CI job.
- 3 of 41 `@ui` scenarios green. Backlog v54.

## 2026-10-12: the Phase 4 plan (CDS-29)

- Plan `DOCS/implementation-plans/2026-10-12_cds-29-phase-4-ui.md` (proposed) and decision brief 11 (DR-062): the `@ui` scenarios run against the live service, which serves the built UI from the same origin; a new `demoapp001-react-ui` package; a separate `ui` CI job; the harness gains a `ui` profile; spec pins with patch bumps. UI specification v13.
- Backlog v53: CDS-29 Done; Phase 4 slices CDS-31 to CDS-36 added.

## 2026-10-12: the remaining review Notes (CDS-24)

- Step glossary v11, UI specification v12 (kebab-case tile hooks; the BR-14 error copy), My Profile v8 (email sub-page hooks), contract v17 (`RuleViolation` description), API specification v24, DR-061.
- Features: `@BR-04` and `@BR-11` tags on two UI scenarios; the BR-15 'Another customer's account cannot be changed' scenario (73 scenarios; the harness runs 59) and its step.
- Backlog v51: CDS-24 Done in review.

## 2026-10-11: the Kanban board on GitHub Pages (CDS-30)

- `.github/workflows/pages.yml` publishes the committed board (and only the board) on a push to `main` that changes it, after checking the ticket payload is present. Pages was enabled with the source set to GitHub Actions. DR-060.
- Backlog v50: CDS-30 Done. The live page, <https://gbrooks1970.github.io/credit-dashboard-sut/>, returns 200 and carries all 30 tickets.

## 2026-10-11: scarf opt-out and confirmations

- CI sets `SCARF_ANALYTICS=false`; the README says how to do the same locally (DR-059).
- Owner confirmations recorded: decision brief 10 stands as read back; CDS-28 stays typed by kind only.

## 2026-10-10: contract v16, DetailUpdate per field (CDS-28)

- `PATCH /accounts/{accountId}/details` is typed per field by kind in the contract (`info.version` 0.9.3): numbers or null for the rates and months, an object with exactly one of `amount` or `percent` for the minimum payment, a string or null for the method. Ranges stay BR-14 (422). API specification v23.
- Service: the wrong kind and an unknown field are refused at the edge; a number a decimal cannot hold, or that rounds to zero, is 422 `out-of-range` (it was 400 or accepted). 309 service tests. Schemathesis now catches a 500 on an in-range details edit.
- Backlog v47: CDS-28 Done.

## 2026-10-10: the Serenity/JS harness (CDS-22)

- `test-harnesses/harness-serenity/` (own lock; Serenity/JS 3.48.2, Cucumber 13.3.0, tsx 4.23.15, TypeScript 6.0.3, Ajv 8.20.0): `CallAnApi` validates every response against the contract by operation and status; `ControlTheTestEnvironment` wraps `/__test/*`; the runner builds, starts and stops the service on port 4600 and a second instance without test control on 4601. Design note `DOCS/.design/harness-design.md`; step glossary v8 to v10. DR-057.
- 58 scenarios (31 scenarios and outlines in 12 files) pass; `verify` has 14 steps (the install and the harness run added).
- Backlog v44: CDS-22 Done; the three Phase 3 exit conditions are met.

## 2026-10-10: Schemathesis pinned and clean (CDS-23)

- Schemathesis 4.29.4 (`tools/requirements.txt`) runs against the live service as the 12th `verify` step: `tools/schemathesis-run.mjs` starts the built service with test control on, runs examples, coverage and fuzzing over every operation but `logout`, then the test-control operations (not the latency control); `schemathesis.toml` holds the path parameters and the per-operation expectations. DR-056.
- Service: 405 with `Allow` for a path the contract has with a method it does not (API specification v22); a page number beyond int64 is a valid, empty page. 298 service tests.
- Backlog v43: CDS-23 Done; CDS-22 is the one Phase 3 gate condition left.

## 2026-10-08: all 36 operations served (CDS-25)

- Decision brief 9 (D2 option 5, the rest as recommended) and DR-055; `DOCS/.design/operations-cases.md`; API specification v19 to v21; contract v13 to v15 (`tags` removed; 404 and 500 documented where the specification said so; 400 on the account-by-ID and notification operations); UI specification v11.
- Five slices (#36, #37, #38, #40, #41): the session and identity operations, the nine report operations, the six account operations, the debt overview, notifications and assistant, and the six profile operations. A token store on the controlled clock (`TOKEN_LIFETIME_MINUTES`); authentication before request shape; per-user session state cleared by a rebind or a reset; the `error` and `slow` persona behaviours.
- 290 service tests (68 before) and 234 rule tests; every response of every served operation is checked against the contract; the pending list is empty. `tools/client-smoke.ts` honours `MOCK_PORT`.
- Backlog v42: CDS-25 Done; CDS-22 and CDS-23 Ready.

## 2026-10-08: test control and the profile rules (CDS-21, CDS-27)

- **CDS-21** (#29, #31): the seven `/__test/*` operations, gated by `TEST_CONTROL` and `TEST_CONTROL_KEY` (no default key), with the in-memory store, the controlled clock, global latency and the overrides rules (BR-03/06, 05, 09, 12, 13, 15) in C#. Contract v11 (`BugFlag` enum, 30 flags) and v12; API specification v17 and v18. 68 service tests; the pending list is 29. DR-053.
- **CDS-27** (#29, #30): PR-02, 03, 04, 06, 07, 09, 10 and 11 as pure functions in `CreditDashboard.BusinessRules/Profile/`; 75 new tests (234 in all); spaces are ignored in a mobile number (My Profile specification v7). DR-054.
- Backlog v41, decision register v17.

## 2026-10-08: business-rules library (CDS-20)

- `CreditDashboard.BusinessRules` and `CreditDashboard.BusinessRules.Tests` (#26, #27, #28): BR-01 to BR-15 as pure functions over integer minor units; 159 NUnit tests tagged by BR ID, a traceability gate over API specification section 7 and a parity test over the seven personas. "Half up" rounds towards positive infinity (API specification v16). DR-052; CDS-27 added.

## 2026-10-07: Prism audit findings accepted (CDS-26)

- Decision brief 8 (#25): the 15 development-only findings in the Prism 5.16.0 tree are accepted as a recorded, bounded risk (DR-051); `npm audit --omit=dev` is the gate-relevant audit.

## 2026-10-07: service scaffold (CDS-19, Phase 3 starts)

- `demo-apps/demoapp001-dotnet-api/`: ASP.NET Core minimal API on .NET 10 (`global.json` 10.0.401, latest patch), contract first (DR-050). NSwag 14.7.1 generates the C# types and the contract is embedded (`npm run generate:service-contract`; drift-checked); a middleware validates every request against the contract with JsonSchema.Net 9.4.0 (400 `/problems/validation` with `errors[]`, 404 outside the contract). No operation is served yet; a contract coverage test lists all 36 as pending.
- `CreditDashboard.Api.Tests` (NUnit 5.0.0): 16 tests; every problem body is checked against the contract's `Problem` schema. NuGet lock files; CI restores in locked mode.
- `npm run verify` has 11 steps; CI sets up .NET from `global.json`. API specification v15, decision register v14 (DR-050), backlog v36 (CDS-25 added).

## 2026-10-07: Phase 2 exit gate met (CDS-18, DR-049)

- A scoped third independent pass and two re-checks ended with no Blocker or Change; its three Changes are fixed (My Profile specification v6 mobile sub-page, glossary v10 *Debt breakdown* and *Account details*, API specification v14 section 6.6).
- DR-049 records the Phase 2 gate, signed off by the owner; the review record holds all three passes verbatim. README shows Phase 2 Met; backlog v33: CDS-18 Done, CDS-24 for the remaining Notes, CDS-19 ready.

## 2026-10-07: CDS-18 confirmation-pass fixes

- A second fresh reviewer, given the same prompt, checked the fixed state: 1 Blocker, 10 Change and 11 Note findings, the Blocker and Changes reproduced. All fixed here; the Notes become backlog item CDS-24 with the gate.
- The BR-08 outline reloads the overview after moving the clock; the API debt Background sets the clock, and API specification v13 states the clock after a reset; a summing `@BR-04` scenario; `api/account-details.feature` (`@BR-14` limits on `PATCH /accounts/{id}/details`); searches and personal-details hooks (UI specification v10); a mobile status badge (My Profile specification v5); "Accounts in credit"; *excluded from the loan totals*; status mappings for every API outcome (step glossary v7); glossary v9. 23 files, 72 scenarios.

## 2026-10-07: CDS-18 review fixes (contract v10)

- An independent re-review of the behaviour against contract v9 found 5 Blocker, 12 Change and 8 Note findings (`.review/2026-10-07_cds-18-behaviour-re-review.md`); all Blockers and Changes and four Notes are fixed here, specification first.
- Contract v10 (`info.version` 0.7.0): `DebtOverview.byType` (DR-046); one Problem type per rule outcome under `/problems/rule-violation/` (DR-048). API specification v12, UI specification v9 (the changes toggle fetches every change, DR-047), glossary v8, step glossary v6, decision register v12.
- Scenarios: the debt total and breakdown, the preferred-name save, *account information*, a BR-02 gap scenario, a 0-day row, expired-token and test-control-off scenarios, closed-accounts and mobile-page UI scenarios; 22 files, 70 scenarios. Four new override samples (a zero-limit card; three BR-12 2025 rows). Client types regenerated.

## 2026-10-07: Kanban board; Phase 1 closed (CDS-17)

- The backlog summary is one `auth-table` table per phase: Type, Tier and explicit 'Blocked by'; `Done <date>` or `Open`, with Ready and Backlog derived on the board. CDS-04 is placed in Phase 1 and CDS-11 in Phase 0. Backlog v31.
- `portfolio-kanban-generator` 1.2.0 is pinned as an exact devDependency. `npm run kanban` writes `credit-dashboard-sut_implementation-kanban_v1.html`; `npm run check:kanban` is the drift check, the ninth step of `npm run verify`.
- Phase 1 is closed (decision brief 7, DR-045).

## 2026-10-07: phase gates recorded (decision brief 7)

- Decision brief 7 decided. DR-045: the Phase 1 exit gate is met, and the phase closes with CDS-17. Phase 2 is recorded after an independent re-review (CDS-18). Phase 3 follows both.
- README: the 'SDD workflow' table returns from the Phase 0 pack with a 'Gate status' column, and 'Status' is corrected.
- Backlog v30: CDS-18 (re-review), and CDS-19 to CDS-23 (Phase 3 outline, blocked). Decision register v11.

## 2026-10-06: remaining versions resolved (CDS-16)

- DR-044: .NET SDK 10.0.401 (`global.json`, `rollForward: latestPatch`) for the service; React 19.3.0, Vite 8.3.3, `@vitejs/plugin-react` 6.1.2 and TypeScript 5.9.3 for the UI, exact pins. The files are created when each project is scaffolded, taking the latest patch on that day. The entry also lists every version already pinned.
- API specification v11 (Runtime row) and UI specification v8 (Framework row).
- Decision register v10.

## 2026-10-06: generated TypeScript client (CDS-15)

- New standalone package `packages/api-client` (DR-043): types generated from the contract by `openapi-typescript` 7.13.0 and committed, a thin `openapi-fetch` 0.17.0 client with optional bearer token, TypeScript pinned to 5.9.3 (the generator requires `^5.x`).
- `npm run check` in the package fails when the committed types differ from a fresh generation, then type-checks strictly, including negative cases that must fail to compile.
- `tools/client-smoke.ts`: four typed calls through the client against the Prism mock (no token, query, path parameter, request body with a test-control header).
- `tools/lib/prism.mjs`: one Prism start and stop helper shared by both smoke runs.
- `npm run verify` (`tools/verify.mjs`) runs every check with one result line each; CI now runs it as one step.
- API specification v10 (sections 3 and 11) and UI specification v7 (Data row) name the client.

## 2026-10-06: implementation plans are recorded (DR-041)

- New `DOCS/implementation-plans/` with an index and a template (`DOCS/templates/implementation-plan.template.md`).
- The CDS-14 plan written to file after delivery, as presented and approved, with its outcome appended.

## 2026-10-06: Prism mock serves every operation (CDS-14)

- Prism 5.16.0 pinned in a root `package.json`; `npm run mock` serves the contract on port 4010.
- `npm run check:mock` (`tools/mock-smoke.mjs`) calls all 36 operations and requires the documented 2xx, no contract violation and a valid body; a call without a token must get 401. Added to CI.
- Contract v9 (`info.version` 0.6.2): path-parameter examples; the Prism server entry has no `/api/v1` prefix (DR-039).
- API specification v9: sections 3 and 11 describe the mock, its smoke run and its two known limits.
- DR-039 (mock address) and DR-040 (specifications edited in place; git keeps history).

## 2026-10-05: repository seeded (Phase 1 starts)

- Seeded from the accepted Phase 0 pack (DR-001, DR-038): contract, API, UI and My Profile specifications, page
  survey, decision register (DR-001 to DR-038), decision briefs 1 to 5, glossary, step glossary, backlog, persona
  fixtures, override samples and 21 feature files.
- Specifications renamed to their Phase 1 paths under `DOCS/.design/`; cross-links rewritten, which also corrects
  three links that pointed at older versions in the Phase 0 pack.
- Contract v8 (`info.version` 0.6.1): `info.license` added (MIT); the `info-license` lint rule re-enabled as an error.
- Lint config kept as `redocly.yaml`: Redocly CLI 2.57.0 does not read `.redocly.yaml`.
- Security scenarios moved to `features-shared/security/` (BR-15 access control; open-redirect guard).
- Node pinned to 24.18.0 (`.nvmrc`, DR-009). CI runs the three specification checks on every push.
