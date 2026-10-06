---
version: 26
created: 2026-10-06T16:50Z
project: credit-dashboard-sut
type: backlog
language: en-GB
---

# Credit Dashboard SUT: Backlog

**Version:** 26 (CDS-15 merged and recorded; registry gate is `npm run verify`)
**Last Updated:** 2026-10-06
**Based on:** the Phase 0 pack in this folder and the first session handover (`session-notes/credit-dashboard-sut_session-notes_v1_*`)

This backlog is the source of truth for status. It moved here from the portfolio's Phase 0 pack when this repository was seeded (CDS-09, 5 October 2026); paths below that name Phase 0 files refer to that pack.

**Status vocabulary.** `READY TO START`, `IN PROGRESS`, `BLOCKED`, `COMPLETE`.

## Summary

| ID | Item | Phase | Status | Blocked by |
| --- | --- | --- | --- | --- |
| CDS-01 | Owner review of API spec, UI spec, profile spec, README and decision register | 0 | COMPLETE (2026-10-05) | none |
| CDS-02 | Decide DR-005 (credit-balance display) | 0 | COMPLETE (2026-10-04) | none |
| CDS-03 | Accept or amend DR-002 (API framework) and DR-003 (UI framework) | 0 | COMPLETE (2026-10-04) | none |
| CDS-04 | Lint `openapi.yaml` with Redocly or Spectral and fix findings | 0 or 1 | COMPLETE (2026-10-04) | none |
| CDS-05 | Add an example for every response in `openapi.yaml` (API spec principle 1) | 1 | COMPLETE (2026-10-04) | none |
| CDS-06 | Scenarios for uncovered business rules: BR-01, BR-06, BR-07, BR-09, BR-11, BR-12, BR-13 | 2 | COMPLETE (2026-10-04) | none |
| CDS-07 | Step glossary and three-amigos review of all feature files | 2 | COMPLETE (2026-10-05) | none |
| CDS-08 | Persona fixtures (7) written and validated against the contract schemas | 2 | COMPLETE (2026-10-04) | none |
| CDS-09 | Freeze Phase 0 and lift into `credit-dashboard-sut/` at the portfolio root as its own repo, per the README 'Phase 1 target layout' | 1 | COMPLETE (2026-10-05) | none |
| CDS-10 | Onboard to the portfolio: `portfolio-prompts/registry.yml` row, portfolio README row, worklist | 1 | COMPLETE (2026-10-05) | none |
| CDS-11 | Fold the My Profile API needs into `openapi.yaml` and the API spec; add the profile route to the UI spec page catalogue | 0 or 1 | COMPLETE (2026-10-04) | none (address, employment, finances are stretch, DR-022) |
| CDS-12 | Decide whether to survey the source profile sub-pages (structure only) or keep the proposed designs | 0 | COMPLETE (2026-10-04) | none |
| CDS-13 | Arrange data no persona holds: test-control overrides (DR-020) | 2 | COMPLETE (2026-10-04) | none |
| CDS-14 | Prism mock serves every operation from the contract examples (Phase 1 exit gate) | 1 | COMPLETE (2026-10-06) | none |
| CDS-15 | Generate the typed TypeScript client into `packages/api-client` from the contract | 1 | COMPLETE (2026-10-06) | none |
| CDS-16 | Pin the remaining versions as each project is created: .NET SDK (`global.json`), React, Vite (DR-009) | 1 | READY TO START | none |
| CDS-17 | Convert this backlog's summary table to the portfolio `auth-table` dialect so the shared Kanban generator can build a board | 1 | READY TO START | none (owner chooses when a board is wanted) |

## Items

### CDS-01: Owner review

**COMPLETE (2026-10-05, decision brief 5).** DR-001, DR-004 and DR-006 to DR-010 accepted; no decision remains Proposed. Open questions closed: one aggregate overview call (DR-034), no general rate limit (DR-035), `greetingName` on `GET /me` (DR-036, contract v7), debug panel local and test builds only (DR-037). The Phase 0 baseline is accepted (DR-038): contract v7, API spec v8, UI spec v6, My Profile spec v4, README v13. CDS-09 is unblocked.

Review `credit-dashboard-sut_api-spec_v4_20261004T1809Z.md`, `credit-dashboard-sut_ui-spec_v3_20261004T1809Z.md`, `credit-dashboard-sut_ui-feature-spec-profile_v2_20261004T1809Z.md`, `README.md` (v7), `DOCS/decision-register.md` and `DOCS/glossary.md` (latest versions as of 2026-10-04; the item originally named API spec v2, UI spec v2, profile spec v1 and README v4). Every decision is `Proposed`; acceptance moves each to `Accepted` with the date.

### CDS-02: DR-005

**COMPLETE (2026-10-04, decision brief 2 D2, D3; merged in #258, squash `c238dd2`).** An account in credit displays as `£44 in credit` (DR-018, superseding DR-005); the `negative-balance` flag is a UI bug flag (DR-019, UI spec v4 section 8). The UI scenario 'A card in credit says so' (`@BR-06`) is in `ui/account-drilldown.feature`.

How a negative (credit) balance displays: `-£44`, '£44 in credit', or £0. Affects BR-06, the `negative-balance` flag and the `drilldown` persona.

**Update (2026-10-04).** The API side of BR-06 is now covered (`features-shared/api/credit-balances.feature`) and the `drilldown` persona holds a card at -44.00. When DR-005 is decided, add one UI scenario for the chosen display.

### CDS-03: DR-002 and DR-003

**COMPLETE (2026-10-04, decision brief 2 D5, D6).** API: ASP.NET Core minimal API in C# on the current .NET LTS, pinned at Phase 1 (DR-017, superseding DR-002; chosen against the Fastify recommendation, whose argument is kept in the brief). UI: React + Vite + TypeScript (DR-003 accepted). README v9 target layout: `demoapp001-dotnet-api` with `CreditDashboard.Rules` and NUnit tests; `packages/domain-rules` removed.

Proposed: Node.js + TypeScript (Fastify or Express) for the API; React + Vite for the UI. Alternatives recorded in the decision register.

### CDS-04: Contract lint

**COMPLETE (2026-10-04; merged in #249, squash `511a874`; branch commit `f0ac8a3`).** Redocly CLI 2.57.0, `recommended` ruleset, on contract v1: 30 errors and 11 warnings (29 missing operation summaries, 5 missing tag descriptions, 3 test-control operations with no 4xx, 2 localhost servers, no licence, and one real defect: an unquoted comma in the `/__test/reset` 204 description split it into a stray key). All fixed in contract v2. House ruleset `redocly.yaml` at the pack root: `recommended`, with `no-server-example.com` and `info-license` off (reasons in the file; re-enable `info-license` at CDS-09) and example validation raised to error. Result: clean. Run from the pack root: `npx --yes @redocly/cli@2.57.0 lint`. Contract v1 kept at `DOCS/.architecture/superseded/openapi_v1_20261003T1715Z.yaml`.

**Original item.**

Status of the contract on 2026-10-03: parses as YAML (PyYAML), 29 paths, 35 schemas, every internal `$ref` resolves. **Not yet linted** with an OpenAPI linter. Run `npx @redocly/cli lint DOCS/.architecture/openapi.yaml` and fix findings.

### CDS-05: Response examples

**COMPLETE (2026-10-04; merged in #249, squash `511a874`; branch commit `c3a5ca8`).** All 87 response bodies (of 93 responses) and all 10 request bodies carry an example, written as one consistent synthetic `excellent` persona whose figures obey BR-03, BR-04, BR-05, BR-07 and BR-12. An Ajv 2020 check validated all 97 against their schemas, and the Redocly example rules (now errors) agree. A mutation probe with three planted bad values was rejected by both. Next consumer: CDS-08 persona fixtures.

**Original item.**

Only 10 `example` entries exist. API spec section 2 requires at least one example per response before implementation, so the Prism mock returns realistic data.

### CDS-06: Rule coverage

**COMPLETE (2026-10-04; merged in #251, squash `64011e5`).** 13 new feature files, 30 new scenarios. API: `score` (BR-01), `credit-balances` (BR-06, API only), `debt` (BR-07), `masking` (BR-09), `report-changes` (BR-11), `payment-history` (BR-12), `closed-accounts` (BR-13). UI, one per uncovered page, each naming its UI spec v2 section: `login`, `payment-history`, `report-changes`, `searches`, `personal-details`, `debt`. Figures come from the CDS-08 fixtures. `gherkin-official` parses all 17 files (53 scenarios), and every rule BR-01 to BR-15 now has a tagged scenario. Findings for review are under CDS-07.

**Original item.**

Rules tagged in `features-shared/` on 2026-10-03: BR-02, BR-03, BR-04, BR-05, BR-08, BR-10, BR-14, BR-15. Untagged: BR-01, BR-06, BR-07, BR-09, BR-11, BR-12, BR-13. UI spec pages without a feature file yet: login, payment history, report changes, searches, personal details, debt.

### CDS-11: My Profile contract

**COMPLETE (2026-10-04, Release 3 scope; merged in #261, squash `52f6663`).** Decision brief 3 set the verification rules (DR-024 to DR-027): PR-04 amended, PR-09 resend limit, PR-10 one-time code, PR-11 lock-out. Contract v6 (`info.version` 0.5.0; 36 paths, 50 schemas) adds `PUT /me/profile/email`, `POST /me/profile/email/verification`, `PUT /me/profile/mobile`, `POST /me/profile/mobile/verification`, `POST /__test/verify-email` and a reusable `429` response. Profile spec v4, API spec v7, UI spec v5 (catalogue rows; the stale API spec v5 link fixed). New `api/profile-contact.feature` covers PR-04, PR-06, PR-09, PR-10 and PR-11. Address, employment and finances stay stretch (DR-022), not in the contract. Rule coverage after this change: every PR rule has a tagged scenario except PR-05 (address, stretch) and PR-08 (no profile data in URLs, titles or logs). PR-08's gap predates CDS-11; its bug flag `pii-in-title` names a privacy scenario that does not exist yet. Raise at the CDS-07 review.

**IN PROGRESS (2026-10-04; page-level part merged in #249, squash `511a874`; branch commit `cf91db2`).** Done: `GET /me/profile` and `PATCH /me/profile/preferred-name` with their schemas in the contract; API spec v2 section 6.6; UI spec v2 page catalogue and section 6.9. **Update (2026-10-04, decision brief 2).** Scope settled: Release 3 adds the email and mobile operations and `POST /__test/verify-email` (DR-022); address, employment and finances are stretch. Next: those five operations into the contract, specification first. Remaining: the eight sub-page operations, listed as proposed in API spec v2 section 6.6, which wait on CDS-01 (sub-page scope) and CDS-12. Profile spec v2 (2026-10-04) has already corrected its section 6 sentence about the contract.

**Original note.**

**Update (2026-10-04).** `credit-dashboard-sut_ui-feature-spec-profile_v1_20261004T1129Z.md` and `features-shared/ui/profile.feature` added. The spec's section 6 lists ten proposed endpoints under `/me/profile`. Per the SDD principles they go into `openapi.yaml` and the API spec before any profile UI work. The UI spec v1 page catalogue does not yet list the profile route; add it in the next UI spec revision.

### CDS-12: Profile sub-pages

**COMPLETE (2026-10-04, decision brief 2 D4).** No survey; the proposed designs stand (DR-021). Release 3 builds email and mobile; address, employment and finances are stretch (DR-022). Explicit save confirmed (DR-023).

The source sub-pages (email, mobile, address, employment, finances) were not opened on 2026-10-04 because they hold the owner's real contact, address and financial details. Spec section 4 proposes designs instead. Owner decides whether a structure-only survey is wanted.

### CDS-07: Step glossary and three-amigos review

**COMPLETE (2026-10-05, decision brief 4; merged in #263, squash `e0cbc9e`).** The three-amigos review was held by interview between the owner and the agent (two parties, stated in the brief). Outcomes DR-028 to DR-033: contradicted Givens rewritten to match their personas, with three new scenarios arranged by overrides (sort order, 20-per-page boundary, current-account exclusion); Sam on `thin-file` for the missing mobile; five phrasing proposals; long-form dates; a PR-08 title-and-address scenario; the glossary (v6) and step glossary (v5) are normative. Every BR rule and every PR rule except PR-05 (stretch) now has a tagged scenario. **Phase 2 evidence is ready** (review recorded, every BR tagged, fixtures passing); phases run in order, so Phase 2 closes formally after Phase 1 (CDS-09).

**Update (2026-10-04, mechanical part; merged in #257, squash `01652c7`).** Points 1, 2, 3 and 8 done. Point 1: `api/account-totals.feature` writes money as bare numbers. Point 2: every UI feature file names its UI spec v3 section (`profile.feature` names the profile spec v2). Point 3: the three edit-form scenarios moved, unchanged, into `ui/account-details-form.feature`, matching the UI spec catalogue. Point 8: `ui/account-drilldown.feature` gains 'A card over its limit shows its real utilisation' (`@BR-03`, Sam on `struggling`). `DOCS/step-glossary.md` v1 drafted from all 18 files (54 scenarios, 160 distinct steps). It found five Givens that contradict their bound persona (step glossary section 6.2) and five Given patterns no mechanism can arrange (section 6.1, now CDS-13). What remains: the three-amigos review, which settles sections 6.2 to 6.4 of the step glossary and makes the glossary normative.

**Update (2026-10-04, decision brief 1; merged in #255, squash `867aac2`).** Points 4 to 7 are settled by the owner: BR-07 exactly 1% is steady (DR-011); BR-13 drops off on the sixth anniversary (DR-012); BR-03 utilisation has no upper bound, with an over-limit UI state and a 115% card on `struggling` (DR-013); BR-12 mixed years are on time (DR-014). Two glossary decisions were taken with them: *Release* replaces the page catalogue's *Phase* (DR-015), and report-change hooks say *change* (DR-016). Applied in contract v4, API spec v4, UI spec v3, profile spec v2, the fixtures, four API feature files and glossary v2. Points 1 to 3 (money format, section naming, edit-form catalogue) and the three-amigos review remain.

**New point 8 (2026-10-04).** No UI scenario covers the over-limit display (DR-013, UI spec v3 section 7). No UI feature file uses `struggling` account figures, so one is needed. Add it with the step glossary.

**Update (2026-10-04, glossary; merged in #254, squash `458ecdf`).** `DOCS/glossary.md` v1 drafted from `templates/glossary.template.md`: one meaning per term, mapped to contract names, with collisions counted across the current documents. It is a draft until the owner reviews it with the feature files. Its section 3 holds points 4 to 7 below plus two new decisions: the clash between SDD phases and the page catalogue's *Phase* column, and the `signal-*` / `list-updates` hook names. Its section 6.1 lists the planned conformance changes (API spec v4, UI spec v3), not yet made, and one finding: the `negative-balance` flag named under CDS-02 is in no bug-flag table. The step glossary should use these terms.

**Update (2026-10-04).** Unblocked by CDS-06. Points raised while writing CDS-06, for the review:

1. **Money format.** The new files write money as bare numbers (`423.60`), per the portfolio Gherkin style guide. The 2026-10-03 files (`account-totals`, `account-drilldown`) use `£`. Pick one and align the glossary.
2. **Section naming.** The new UI files name their UI spec section; `report-overview` and `account-drilldown` do not. README 'Traceability chain' asks for either a rule tag or a section.
3. **Catalogue mismatch.** UI spec v2 section 5 names `ui/account-details-form.feature`, but the edit-form scenarios live in `account-drilldown.feature`. Either split the file or correct the catalogue (a UI spec change).
4. **BR-07 boundary.** Is a change of exactly 1% 'steady'? The trend scenarios avoid it.
5. **BR-13 boundary.** Is an account closed exactly six years ago still listed? API spec v3 section 12; the scenarios avoid it.
6. **BR-03 above the limit.** Utilisation over 100 does not fit `Percent` (0 to 100). API spec v3 section 12; no persona exceeds its limit.
7. **BR-12 mixed years.** A year with on-time and no-data months is read as 'on time'. The rule implies it but does not say so.

### CDS-13: Arranging data no persona holds

**COMPLETE (2026-10-04; merged in #259, squash `c8b71c8`).** Contract v5 (`info.version` 0.4.0): `PUT /__test/users/{username}/persona` takes optional `overrides` (`PersonaOverrides`), with a `422` for rule breaks and an example; `GET /__test/state` reports `overridden`; `FixtureAccount` moves into the contract and the fixture schema (v2) references it. API spec v6 section 6.5 states the rules, including the two persona conventions that do not apply to overrides (BR-11 order, BR-13 window). Five samples in `fixtures/overrides/`, one per former gap pattern; the fixture check (v3) applies each to its base persona and re-runs the rules: 7 personas, 2 users, 5 samples, 309 checks, 0 failures. Probes: wrong utilisation (BR-03), another persona's account ID (BR-15), unknown bureau, and an empty bureau entry each fail the check; a bad contract example fails the lint.

**Decided (2026-10-04, decision brief 2 D1).** Test-control overrides on `PUT /__test/users/{username}/persona` (DR-020; shape in API spec v5 section 6.5). Next: the contract change, specification first, then the fixture schema gains an overrides definition and the fixture check validates a sample.

Found 2026-10-04 while building the step glossary. Five Given patterns, mostly Scenario Outline rows for BR-03, BR-07, BR-09, BR-12 and BR-13, state account data no persona holds, and test control cannot create or change account data (API spec v4 section 6.5). Options in step glossary section 6.1: a test-control data endpoint (contract change), rule outlines pushed down to `packages/domain-rules` unit tests, or more personas. An owner decision; candidate for decision brief 2. Blocks Phase 3 (`@api` scenarios green), not Phase 1.

### CDS-08: Persona fixtures

**COMPLETE (2026-10-04; merged in #251, squash `64011e5`).** Format specified first in API spec v3 section 9.1: personas hold source data, test users (`fixtures/users.json`) hold identity, so any user can hold any persona. Contract v3 changes the example username to `alex` for the same reason. All seven personas are in `fixtures/personas/`, each with a `profile` block, 28 accounts in total. `fixtures/persona.schema.json` references the contract schemas directly. Run from `fixtures/`: `npm ci && npm run check`. Result: 7 personas, 2 users, 241 checks, 0 failures. A mutation probe with seven planted defects (utilisation, mask, history gap, closed balance, duplicate ID, preferred name, unknown field) was caught 7 of 7, each with the right rule ID.

### CDS-09 and CDS-10

**CDS-09 COMPLETE (2026-10-05; seed commit `ed6e9f9`; portfolio root freeze merged as test-automation-portfolio #266, squash `0a34a8e`).** CI on the seed passed on attempt 2 of run 37371747846; attempt 1 was cancelled by GitHub because no hosted runner picked the job up ('not acquired by Runner of type hosted'), so none of its steps ran. This repository was seeded from the accepted Phase 0 pack: current files only, renamed to their Phase 1 paths, cross-links rewritten (three links that pointed at older versions now resolve to the current files), security scenarios moved to `features-shared/security/`, contract v8 with `info.license` (MIT) and the `info-license` rule re-enabled, Node pinned (`.nvmrc` 24.18.0), CI running the three checks. Deviation from the Phase 0 README: the lint config stays `redocly.yaml`, because Redocly CLI 2.57.0 does not read `.redocly.yaml`. **CDS-10** (portfolio onboarding) is next.

### CDS-10: Portfolio onboarding

**COMPLETE (2026-10-05).** Onboarded with the portfolio `onboard-project` workflow, the owner's contract approved: registry row in NeoCognitus70/portfolio-prompts#109 (`1c191a3`): `active`, `showcase`, `sdd`, `orchestration_target: false` until the Phase 1 exit gate, the three CI checks as gates, and deviations for the upper-case `DOCS/` layout (backlog, decision register, implementation logs). Landing card in GBrooks1970/portfolio#54 (`51c5e08`) with two verified evidence links: the CI workflow and the API specification. No scaffold PR was needed here. Worklists are not part of onboarding; `derive-worklist` creates one when wanted.

### CDS-17: Kanban dialect

Added at onboarding (owner's choice). The summary table above (ID, Item, Phase, Status, Blocked by) matches neither Kanban dialect (`auth-table` needs seven columns with backticked IDs; `risk-block` needs scored risk headings), so the shared generator would build an empty board. Convert when a board is wanted, and set the registry's `backlog_dialect` to match.

### CDS-14: Prism mock

**COMPLETE (2026-10-06; merged in #3, squash `ed63834`; implementation log in #4, `64c8c8f`; plan written to file in #5, `7a08fdf`).** Planned and approved before implementation. A spike showed Prism 5.16.0 serves the contract without its `/api/v1` base path (DR-039), answers malformed requests with 422 where the specification says 400, and must be started with `node` rather than through `npx` and a shell, or it outlives its caller. Delivered: contract v9 (path-parameter examples; Prism server entry), API specification v9 (sections 3, 11), root `package.json` with exact pins, `tools/mock-smoke.mjs`, a CI step. Evidence: 36 of 36 operations pass, and a call without a token gets 401; a planted bad example (`greetingName: ''`) fails the run on exactly `GET /me`; port 4010 is free after both passing and failing runs. **The Phase 1 exit gate is met**: lint clean, every example valid, the mock serves every operation. CDS-15 and CDS-16 remain Phase 1 work outside the gate.

### CDS-15: Generated TypeScript client

**COMPLETE (2026-10-06; merged in #8, squash `81f16be`, CI run 37497743081; registry NeoCognitus70/portfolio-prompts#113, `9b1547f`; plan Outcome and implementation log in #9).** Implemented to the approved plan (`DOCS/implementation-plans/2026-10-06_cds-15-api-client.md`). Delivered: the standalone package `packages/api-client` (DR-043) with committed generated types (2,672 lines), a drift check and strict `tsc` with three negative type cases; `tools/client-smoke.ts` (four typed calls against Prism, all pass); `tools/lib/prism.mjs` shared with the mock smoke; `npm run verify` running eight steps (two installs, six checks), now the single CI step; API specification v10, UI specification v7. Probes: a contract description changed without regenerating fails exactly the client check (verify exits 1) and the restore is byte-identical; removing one `@ts-expect-error` fails `tsc` with TS2741, and making a negative case valid fails it with TS2578; no Prism process and port 4010 free after passing and failing runs. The registry gate is now `npm ci && npm run verify`.

**Unblocked (2026-10-06).** Decision brief 6 decided: the harness is independent of the client (DR-042), and the client is a standalone package with its own lock and scripts (DR-043); a root `npm run verify` runs all five checks and becomes the registry gate. Next: the revised plan for approval, written to file (DR-041).

**Was BLOCKED (2026-10-06) by decision brief 6.** The plan was presented with spike evidence (`openapi-typescript` 7.13.0 generates all 36 operations; strict `tsc` with TypeScript 5.9.3 catches a wrong enum and a wrong type; an `openapi-fetch` 0.17.0 client called the Prism mock under Node 24.18.0). Three decisions are agreed: TypeScript 5.9.3 (the generator requires `^5.x`; revisit when it supports 7), generated types committed with a CI drift check, and a root `npm run verify` that becomes the registry gate. The package layout (npm workspaces or standalone) is deferred to decision brief 6 (#6). The plan is written to `DOCS/implementation-plans/` once fully agreed (DR-041).

### Process: implementation plans (DR-041)

**Recorded 2026-10-06 (#5, `7a08fdf`).** Every plan is written to `DOCS/implementation-plans/` before implementation, indexed and kept; the CDS-14 plan was recorded after delivery.

### CDS-14 to CDS-16: Phase 1

The README's Phase 1 work that remains after the seed: a Prism mock that serves every operation (the Phase 1 exit gate: lint clean, every example valid, mock serves every operation), the generated client, and the version pins DR-009 defers to each project's creation.

As in the summary table. See README 'SDD workflow' for each phase's exit gate.
