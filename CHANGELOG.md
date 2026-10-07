# Changelog

All notable changes to this project. Dates are UTC.

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
