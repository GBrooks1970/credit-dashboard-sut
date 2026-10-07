# Credit Dashboard SUT

A fictional UK credit-health dashboard, *ScoreHarbour* (placeholder name), built to be a **system under test** for
a test automation portfolio. One OpenAPI contract drives an API service, a React UI, a mock server and a Screenplay
test harness reading one Gherkin store.

**What it proves:** specification-driven delivery from contract to UI, contract-validated API testing,
accessibility-first UI testing, and a switchable catalogue of realistic defects that the suite must catch.

All data is synthetic. No real bureau, lender, brand or person's financial data appears in any file (DR-010).

## Status

The Phase 1 (contract) exit gate is met (6 October 2026, DR-045). The phase closes when CDS-17 is done. Phase 2's
gate evidence is complete, and the gate is recorded after an independent re-review (CDS-18). Phase 3 (API) follows
both. Phase 0 (specify) was accepted as the baseline on 5 October 2026 (DR-038) and seeded this repository. No
service, UI or harness code exists yet. The contract, mock and generated client do. See 'SDD workflow' below and
[`DOCS/backlog.md`](DOCS/backlog.md).

## What is here

| Path | What it is |
| --- | --- |
| [`DOCS/.architecture/openapi.yaml`](DOCS/.architecture/openapi.yaml) | OpenAPI 3.1 contract: the source of truth for the API |
| [`DOCS/.design/api-specification.md`](DOCS/.design/api-specification.md) | API specification: conventions, endpoints, business rules BR-01 to BR-15, personas, fixture format, bug flags |
| [`DOCS/.design/ui-specification.md`](DOCS/.design/ui-specification.md) | UI specification: page catalogue, test hooks, component states, UI bug flags |
| [`DOCS/.design/ui-feature-profile.md`](DOCS/.design/ui-feature-profile.md) | My Profile feature spec: rules PR-01 to PR-11 |
| [`DOCS/.design/page-survey.md`](DOCS/.design/page-survey.md) | Structure survey that informed the specifications (input, not a specification) |
| [`DOCS/decision-register.md`](DOCS/decision-register.md) | Decisions DR-001 to DR-045 |
| [`DOCS/decision-briefs/`](DOCS/decision-briefs/_index.md) | The reasoning behind decisions: options, a recommendation and the argument against |
| [`DOCS/glossary.md`](DOCS/glossary.md), [`DOCS/step-glossary.md`](DOCS/step-glossary.md) | Normative vocabulary and agreed Gherkin steps |
| [`DOCS/backlog.md`](DOCS/backlog.md) | Backlog: the source of truth for status |
| [`features-shared/`](features-shared/) | Gherkin scenarios by layer: `api/`, `ui/`, `security/` |
| [`fixtures/`](fixtures/) | Seven personas, test users, override samples, the fixture schema and its check |
| [`DOCS/implementation-plans/`](DOCS/implementation-plans/_index.md) | Implementation plans, written and approved before the work starts (DR-041) |
| [`packages/api-client/`](packages/api-client/) | Typed TypeScript client generated from the contract (`openapi-typescript`, `openapi-fetch`); a standalone package with its own lock (DR-043) |
| [`tools/check-gherkin.py`](tools/check-gherkin.py) | Parses every feature file and checks every business rule has a scenario |
| [`tools/mock-smoke.mjs`](tools/mock-smoke.mjs), [`tools/client-smoke.ts`](tools/client-smoke.ts) | Run the Prism mock and call it: every operation directly, then typed calls through the client |
| [`tools/verify.mjs`](tools/verify.mjs) | Runs every check in turn and prints one result line each (`npm run verify`) |

## Checks

One command runs every check, as CI does on every push:

```bash
npm ci && npm run verify
```

It installs `fixtures/` and `packages/api-client/`, then runs six checks and prints one result line each: contract lint (Redocly CLI 2.57.0), the fixture check, the Gherkin parse and rule coverage, the mock smoke (Prism, pinned in `package.json`, answering all 36 operations), the client check (generated types current with the contract; strict `tsc`, including cases that must fail to compile) and the client smoke (typed calls through the client against the mock). The Gherkin check needs Python with `gherkin-official` installed first:

```bash
pip install gherkin-official==29.0.0
```

Each check can also be run on its own: `npm run check:mock`, `npm run check:client`, `npm run check:client-smoke`, `cd fixtures && npm run check`, `python tools/check-gherkin.py`. After changing the contract, regenerate the client types with `npm --prefix packages/api-client run generate` and commit them.

To run the mock on its own, use `npm run mock`; it listens on `http://localhost:4010` without the `/api/v1` prefix (DR-039).

Node is pinned in `.nvmrc` (24.18.0).

## How it is built

Specification first: a change goes to the contract, a rule table or the fixture format before fixtures, scenarios
or code. Each piece of work starts from a written implementation plan, approved before it is built and kept in
[`DOCS/implementation-plans/`](DOCS/implementation-plans/_index.md) (DR-041); each delivery is recorded in
[`DOCS/implementation-logs/`](DOCS/implementation-logs/). Each phase has an exit gate ('SDD workflow' below). The planned layout adds
an ASP.NET Core minimal API (DR-017), a React + Vite UI (DR-003), a generated TypeScript client and a Serenity/JS
harness (DR-006).

## SDD workflow

Each phase has its work and an exit gate. A phase does not start until the previous gate is green, and a gate is
recorded only on observed evidence, as a decision-register entry (DR-045). The table is carried over from the
Phase 0 pack; 'Gate status' is the current state.

| Phase | Work | Exit gate | Gate status |
| --- | --- | --- | --- |
| **0. Specify** | Survey, API specification, UI specification, contract draft, seed scenarios, decision register | Owner accepts the DRs; DR-005 decided; the pack frozen | **Met** 5 October 2026 (DR-038); pack frozen at CDS-09 |
| **1. Contract** | Own repository (DR-001); versions resolved (DR-009, DR-044); lint ruleset; an example for every response; Prism mock; generated TypeScript client | Lint clean; every example validates against its schema; mock serves every operation | **Gate met** 6 October 2026 (DR-045): all three run in CI through `npm run verify`. The phase closes with CDS-17 |
| **2. Behaviour** | `features-shared/` covering every BR and every page in Releases 1 and 2 (DR-015); step glossary; persona fixtures validated against the schemas | Three-amigos review recorded; every BR tagged by at least one scenario; fixtures pass schema validation | **Evidence complete** (brief 4, DR-033; BR 15 of 15; fixtures 404 of 404). Recorded as met (DR-046) after the independent re-review, CDS-18 |
| **3. API** | The service against the contract (DR-017); test-control endpoints; harness abilities `CallAnApi` and `ControlTheTestEnvironment` | All `@api` and `@security` scenarios green; every response validated against the contract; Schemathesis run clean | Next, after CDS-17 and CDS-18 |
| **4. UI** | Pages against the Prism mock first, then the live API; component tests for every state in UI specification section 4.3 | All `@ui` scenarios green against the mock and live; axe-core zero violations with flags off | Not started |
| **5. Defects and evidence** | Bug flags implemented; each flag proved caught; visual regression; CI publishes the Serenity report | Every flag turns at least one scenario red for the stated reason; report published | Not started |

## Licence

[MIT](LICENSE).
