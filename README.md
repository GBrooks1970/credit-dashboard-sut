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
| [`DOCS/decision-register.md`](DOCS/decision-register.md) | Decisions DR-001 to DR-038 |
| [`DOCS/decision-briefs/`](DOCS/decision-briefs/_index.md) | The reasoning behind decisions: options, a recommendation and the argument against |
| [`DOCS/glossary.md`](DOCS/glossary.md), [`DOCS/step-glossary.md`](DOCS/step-glossary.md) | Normative vocabulary and agreed Gherkin steps |
| [`DOCS/backlog.md`](DOCS/backlog.md) | Backlog: the source of truth for status |
| [`features-shared/`](features-shared/) | Gherkin scenarios by layer: `api/`, `ui/`, `security/` |
| [`fixtures/`](fixtures/) | Seven personas, test users, override samples, the fixture schema and its check |
| [`tools/check-gherkin.py`](tools/check-gherkin.py) | Parses every feature file and checks every business rule has a scenario |

## Checks

The specification is kept green by four checks, which CI runs on every push:

```bash
npx --yes @redocly/cli@2.57.0 lint
```

```bash
cd fixtures && npm ci && npm run check
```

```bash
pip install gherkin-official==29.0.0 && python tools/check-gherkin.py
```

```bash
npm ci && npm run check:mock
```

The last starts the Prism mock (pinned in `package.json`) and calls every operation in the contract. To run the mock on its own, use `npm run mock`; it listens on `http://localhost:4010` without the `/api/v1` prefix (DR-039).

Node is pinned in `.nvmrc` (24.18.0).

## How it is built

Specification first: a change goes to the contract, a rule table or the fixture format before fixtures, scenarios
or code. Each phase has an exit gate (API specification, 'Verification checks'; backlog). The planned layout adds
an ASP.NET Core minimal API (DR-017), a React + Vite UI (DR-003), a generated TypeScript client and a Serenity/JS
harness (DR-006).

## Licence

[MIT](LICENSE).
