# Phase 4: the React UI, slices U1 to U6 (CDS-29, CDS-31 to CDS-36) — 2026-10-13

## Session Summary

Phase 4 was planned (CDS-29, #63) and built in six slices in this stretch: the foundation and login (U1), the report overview (U2), the report pages (U3), the accounts (U4), the profile (U5) and the exit checks (U6). All 41 `@ui` scenarios, specified and reviewed since Phase 0 but never run, now run against the live service (51 executions), with 135 component tests and an axe-core scan of every page. The Phase 4 gate is not recorded: it is the owner's (decision brief 12). One log covers the six slices because they were built and verified in one continuous run of pull requests; each slice's own detail is in its section below.

---

## Objectives

1. ✅ U1 (CDS-31): the app shell and login, the service serves the built UI, the harness `ui` profile, a separate `ui` CI job — 3 of 3 login scenarios.
2. ✅ U2 (CDS-32): the report overview — 8 scenarios cumulative.
3. ✅ U3 (CDS-33): the report pages — 22 cumulative.
4. ✅ U4 (CDS-34): the accounts, the edit form, the open-redirect guard — 31 cumulative.
5. ✅ U5 (CDS-35): the profile and its email and mobile sub-pages — 41 cumulative.
6. ✅ U6 (CDS-36): axe-core on every page, the three layouts, the full live run.
7. ⏸️ The Phase 4 gate record: put to the owner as decision brief 12.
8. ⏸️ Two items of UI specification 6.4 left unbuilt, because each needs a contract change: `list-changes` (no account-type filter on changes) and the utilities and telecoms sub-group headings (no field tells a utility from a telecoms account).
9. ⏸️ The address, employment and finances profile sub-pages (stretch, DR-022).

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Local | `npm run verify` (each slice) | 14/14 | 14/14; U4 steps sum 218.3 s, U5 269.0 s, U6 235.5 s | ✅ PASS |
| UI | Vitest component tests | 0 | 135 (U1 16, U2 37, U3 55, U4 102, U5 135) | ✅ PASS |
| Harness | `@ui` scenarios, live service | 0 | 41 scenarios, 51 executions (U1 3, U2 8, U3 22, U4 31, U5 41 scenarios) | ✅ PASS |
| Harness | `@api` + `@security @api` | 59/59 | 59/59 (unchanged; in every `verify`) | ✅ PASS |
| UI | `npm run check:ui-exit` | n/a | 37 axe scans, 24 layout checks, 0 problems | ✅ PASS |
| Service | UI hosting tests | 0 | 9 (U1) | ✅ PASS |
| CI | each slice's own run | n/a | #64 38379711704, #65 38382528342, #66 38409514129, #67 38448281441, #68 38475665352, #69 38479216316 (the first #69 run, 38477792933, failed — see Lessons) | ✅ PASS |

**Probes (each expected to fail, each reverted):**

| Slice | Probe | Result |
|---|---|---|
| U3 | the widget drops a year; the searches page always asks for hard; the changes filter is not sent; an input in personal details | each failed the right scenario |
| U4 | the open-redirect guard removed; the list total read from the limit; a detail tile hook renamed | security scenario failed; 1 drilldown scenario failed; both form scenarios broke |
| U5 | the legal name in the page title; the greeting not refreshed; the mobile badge always Unverified | PR-08 scenario failed; 2 scenarios failed; 1 scenario failed |
| U5 | the mobile badge **hook** renamed | **Not caught.** The scenarios read the tile's text; a component test covers the hook |
| U6 | a progress bar without an accessible name; both navigations rendered | axe-core `aria-progressbar-name` on four lists and at three widths; the four 375 px layout checks failed |
| U6 | the sideways-scroll fix removed (after CI found it) | the wider-text 375 px pass failed (4 px) |

Two probe attempts in U4 and U6 did not compile or broke the wrong thing; they were redone with a mutation that compiled, and only the redone runs are counted.

---

## Changes Implemented

### U1 (CDS-31, #64 `5ba9fa1`): the foundation

**Files changed:**
- `demo-apps/demoapp001-react-ui/` — a new package with its own lock: React 19.3.0, Vite 8.3.4, TypeScript 5.9.3, React Router 8.4.0, Vitest 5.0.4; the app shell, login, `SectionState`, formatting, the session (token in memory only).
- `demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs` — `UI_DIRECTORY` serves the built UI from `/` and returns `index.html` for any other GET outside `/api/v1`; 9 tests in `UiHostingTests.cs`; API specification v25.
- `test-harnesses/harness-serenity/` — Serenity/JS 3.49.0 with Playwright 1.64.0; the `ui` profile; `scripts/run.mjs` builds the UI and starts the service; the login steps.
- `.github/workflows/ci.yml` — a separate `ui` job.

### U2 (CDS-32, #65 `fafb137`): the report overview

**Files changed:**
- `src/pages/ReportOverviewPage.tsx` and `src/pages/overview/*` — score, summary and feedback, the chat drawer, the history chart (hand-built SVG with a table alternative), the changes list and toggle (follows the pages of `GET /changes`, DR-047), impact, debt, accounts, payments and tiles.
- `src/ui/steps/overview.steps.ts` — the overview steps.

### U3 (CDS-33, #66 `741958f`): the report pages

**Files changed:**
- `src/pages/{PaymentHistory,ReportChanges,Searches,PersonalDetails,DebtOverview}Page.tsx`, `src/components/{PaymentHistoryWidget,ChangeCard,Pager}.tsx`, `src/useResource.ts` — the five pages; kind and page in the address; sign-in returns the visitor to the address they asked for.
- `src/ui/visit.ts` — `openAddress`; `src/ui/steps/report-pages.steps.ts`.

### U4 (CDS-34, #67 `e6519c4`): the accounts

**Files changed:**
- `src/pages/{AccountList,ClosedAccounts,AccountDetail,DetailForm}Page.tsx`, `src/components/{AccountRow,BalanceChart}.tsx`, `src/safeRedirect.ts` — the type list with its summary and excluded loans, closed accounts, detail, the five-field edit form with the BR-14 client check, and the open-redirect guard.
- `src/ui/steps/account.steps.ts`.

### U5 (CDS-35, #68 `b29a066`): the profile

**Files changed:**
- `src/pages/profile/{Profile,Email,Mobile}Page.tsx`, `src/problem.ts`; `src/session.tsx` gains `refreshUser`; `src/layout/Layout.tsx` — the account button is a link to the profile.
- `src/ui/steps/profile.steps.ts`; `{nameOutcome}` and `{tile}` parameter types.

### U6 (CDS-36, #69 `6cbda4f`): the exit checks

**Files changed:**
- `test-harnesses/harness-serenity/src/exit/exit-checks.ts`, `scripts/run.mjs` (an `exit` mode), `package.json` (`test:exit`, `@axe-core/playwright` 4.13.0); root `package.json` (`check:ui-exit`); a step in the `ui` CI job.
- `demo-apps/demoapp001-react-ui/src/styles.css` — `overflow-wrap: anywhere` on `main`, `min-width: 0` on the tiles, `max-width: 100%` on inputs.

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| The exit checks are a script, not Gherkin scenarios | The plan holds the `@ui` count at 41; axe-core and layouts are standing checks on every page, not behaviour | A feature file of accessibility scenarios (would change the reviewed 41) |
| Presence (`PageElement.isPresent()`), not visibility, for anything below the fold | Serenity's visibility wait did not see an element below the fold (design section 22); Serenity 3.49 has no `isPresent` expectation | Scrolling first (slower, hides the cause) |
| `list-changes` and the utilities and telecoms sub-groups not built | Each needs a contract change (no filter, no distinguishing field); the owner decides | Inventing a heuristic (provider name) — rejected as a guess presented as a feature |
| Each layout checked with normal and wider text | A layout result should not depend on which fonts a machine has | A Linux-only CI check (the defect would stay invisible locally) |
| One log for six slices | One continuous run of pull requests, each already recorded in the backlog, the harness design (sections 20 to 25) and the CHANGELOG | Six logs (more files, the same facts) |

---

## Documentation Updates

- `DOCS/backlog.md` — v53 to v59 across the slices; CDS-31 to CDS-36 each recorded.
- `DOCS/.design/ui-specification.md` — v13 to v19; `DOCS/.design/ui-feature-profile.md` v9; `DOCS/step-glossary.md` v12 and v13; `DOCS/.design/harness-design.md` sections 20 to 25; `CHANGELOG.md`; the Kanban board.
- `DOCS/decision-briefs/` — brief 11 (answered, DR-062) and brief 12 (this stretch's gate, awaiting the owner).

---

## Lessons Learned

- **A green local run on one machine is not a layout result.** The first CI run of U6 failed: on Linux fonts the profile scrolled sideways by 5 px at 375 px (a long email address). Windows did not show it. The check now runs every layout with wider text too, and the wider-text pass fails locally with the fix removed.
- **Probe the checks, not just the code.** The axe-core scans passed first time, so a planted unnamed progress bar was needed to show they could fail. The same for the layout checks.
- **A scenario can pass while a hook is unread.** Renaming the mobile badge hook failed nothing, because the scenarios read the tile's text. The component tests are where such hooks are covered.
- **Serenity's visibility wait and the fold.** Waiting for an element below the fold timed out where raw Playwright did not. Ready on a hook near the top; use presence for the rest.
- **A shell script in one tool call is fragile.** Unescaped backticks in a template literal broke a records script twice and let a pull request open without its records. Records now go through script files written with the file tool.
- **Cucumber details:** a parameter type cannot sit inside an optional; a type's name cannot hold a space; Given and When of the same text are one definition.

---

## Recommendations / Next Steps

- [ ] Record the Phase 4 gate (decision brief 12, D1 to D3) — owner, HIGH.
- [ ] Handover v16 and the public counts (registry, landing card, capability matrix: 41 `@ui` scenarios now run) after the gate wording is decided — HIGH.
- [ ] A contract change for the two unbuilt items of UI specification 6.4, if wanted — owner, LOW.
- [ ] Phase 5 plan (bug flags, visual regression, the published Serenity report, and the three bug-flag catches from the CDS-18 notes) — after the gate.
- [ ] Remote `claude/*` merged branches (25 now) remain on GitHub; deletion needs the owner's word — LOW.
- [ ] The address, employment and finances profile sub-pages (stretch, DR-022) — LOW.

---

*Session logged: 2026-10-13. Author: Claude Code.*
