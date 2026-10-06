# Changelog

All notable changes to this project. Dates are UTC.

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
