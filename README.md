# Credit Dashboard SUT

A fictional UK credit-health dashboard, *ScoreHarbour* (placeholder name), built to be a **system under test** for
a test automation portfolio. One OpenAPI contract drives an API service, a React UI, a mock server and a Screenplay
test harness reading one Gherkin store.

**What it proves:** specification-driven delivery from contract to UI, contract-validated API testing,
accessibility-first UI testing, and a switchable catalogue of realistic defects that the suite must catch.

All data is synthetic. No real bureau, lender, brand or person's financial data appears in any file (DR-010).

## Status

Phase 1 (contract) has started. Phase 0 (specify) was accepted as the baseline on 5 October 2026 (DR-038) and
seeded this repository. No service, UI or harness code exists yet; see [`DOCS/backlog.md`](DOCS/backlog.md).

## What is here

| Path | What it is |
| --- | --- |
| [`DOCS/.architecture/openapi.yaml`](DOCS/.architecture/openapi.yaml) | OpenAPI 3.1 contract: the source of truth for the API |
| [`DOCS/.design/api-specification.md`](DOCS/.design/api-specification.md) | API specification: conventions, endpoints, business rules BR-01 to BR-15, personas, fixture format, bug flags |
| [`DOCS/.design/ui-specification.md`](DOCS/.design/ui-specification.md) | UI specification: page catalogue, test hooks, component states, UI bug flags |
| [`DOCS/.design/ui-feature-profile.md`](DOCS/.design/ui-feature-profile.md) | My Profile feature spec: rules PR-01 to PR-11 |
| [`DOCS/.design/page-survey.md`](DOCS/.design/page-survey.md) | Structure survey that informed the specifications (input, not a specification) |
| [`DOCS/decision-register.md`](DOCS/decision-register.md) | Decisions DR-001 to DR-044 |
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
[`DOCS/implementation-logs/`](DOCS/implementation-logs/). Each phase has an exit gate (API specification, 'Verification checks'; backlog). The planned layout adds
an ASP.NET Core minimal API (DR-017), a React + Vite UI (DR-003), a generated TypeScript client and a Serenity/JS
harness (DR-006).

## Licence

[MIT](LICENSE).
