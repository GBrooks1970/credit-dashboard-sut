# CDS-15: Generated TypeScript client and `npm run verify` — 2026-10-06

## Session Summary

The goal was a typed client generated from the contract, so that a contract change breaks a type check rather than a user. Decision brief 6 settled the shape first: the harness stays independent of the client (DR-042), and the client is a standalone package with its own lock (DR-043). The approved plan was written to file before implementation (DR-041). Delivered in #8 (squash `81f16be`): `packages/api-client`, a client smoke against the Prism mock, a shared Prism helper, and `npm run verify`, which CI now runs as its single step. The registry gate became `npm ci && npm run verify` (NeoCognitus70/portfolio-prompts#113, `9b1547f`).

---

## Objectives

1. ✅ Settle what the client is for and where it lives before planning (decision brief 6 with D0; DR-042, DR-043).
2. ✅ Write the approved plan to file before implementation (`DOCS/implementation-plans/2026-10-06_cds-15-api-client.md`, commit `bf3ab87`, squashed into #8).
3. ✅ Generate committed types with a drift check and a strict type check that includes cases that must fail.
4. ✅ Prove the client against the mock at run time (four typed calls).
5. ✅ One command for every check, run by CI (`npm run verify`, 8 of 8 steps).
6. ✅ Prove the new checks can fail (three probes) and that Prism never outlives a run.
7. ✅ Record the single gate in the portfolio registry.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Contract | Redocly CLI 2.57.0 lint | valid | valid | ✅ PASS |
| Fixtures | `npm run check` in `fixtures/` | 404/404 | 404/404 | ✅ PASS |
| Gherkin | `python tools/check-gherkin.py` | 21 files, 65 scenarios, BR 15/15, PR 10/11 | unchanged | ✅ PASS |
| Mock | `npm run check:mock` | 36/36, 401 pass | 36/36, 401 pass (now through `tools/lib/prism.mjs`) | ✅ PASS |
| Client | Drift check (`generate.mjs --check`) | none | current, 2,672 lines | ✅ PASS |
| Client | Strict `tsc` (package, negative cases, client smoke) | none | exit 0 | ✅ PASS |
| Client | `npm run check:client-smoke` | none | 4/4 | ✅ PASS |
| CI | GitHub Actions run 37497743081 (PR #8) | 4 steps | 1 step, `verify` 8/8, job 25 s | ✅ PASS |

Probes (each expected to fail, and each did):

1. Changing the `summary` of `getAccountTotals` in the contract without regenerating: `verify` reported 7 passes and one `FAIL  client check (drift and types)`, with "src/generated/schema.d.ts is not current", and exited 1. The contract was restored, byte-identical by SHA-256.
2. Deleting the `@ts-expect-error` above the missing-path-parameter case: `tsc` failed with `TS2741: Property 'path' is missing`. Restored, byte-identical by `cmp`.
3. Making a negative case valid (`'savings'` to `'loan'`): `tsc` failed with `TS2578: Unused '@ts-expect-error' directive`. Restored, byte-identical by `cmp`; `tsc` clean again.
4. After the passing and failing runs: no `node` process with `prism` in its command line, and no listener on port 4010.

---

## Changes Implemented

### Specifications (edited in place, DR-040)

**Files changed:**
- `DOCS/.design/api-specification.md`: v10; section 3 "Client" row (standalone package, pins, base URLs per environment); section 11 "Client" check row.
- `DOCS/.design/ui-specification.md`: v7; the Data row names the generated client and its pins.

### `packages/api-client` (new, DR-043)

**Files changed:**
- `package.json`, `package-lock.json`: `openapi-fetch` 0.17.0 (runtime); `openapi-typescript` 7.13.0 and `typescript` 5.9.3 (development). Scripts `generate` and `check`.
- `scripts/generate.mjs`: generates `src/generated/schema.d.ts` through the generator's programmatic interface with a "do not edit" header; `--check` compares with the committed file (line endings normalised) and exits 1 on drift.
- `src/index.ts`: `createCreditClient({ baseUrl, token })` with a bearer middleware when a token is given; `MOCK_BASE_URL` and `SERVICE_BASE_URL` (DR-039); re-exports `paths` and `components`.
- `test/types-negative.ts`: three cases that must not compile (wrong enum, wrong type, missing path parameter).
- `tsconfig.json`: strict, `noEmit`, erasable syntax only, `skipLibCheck` false; includes `tools/client-smoke.ts`, so the smoke is type-checked too.

### Smoke runs and the Prism helper

**Files changed:**
- `tools/lib/prism.mjs` (new), `tools/lib/prism.d.mts` (new): Prism start and stop, moved out of `tools/mock-smoke.mjs`; typed for TypeScript callers.
- `tools/mock-smoke.mjs`: v2, uses the helper; behaviour unchanged (36/36).
- `tools/client-smoke.ts` (new): login without a token; totals with `type: 'creditcard'`; an account by path parameter; a persona binding with overrides and the test-control header. Node 24.18.0 runs it directly.

The first run passed 3 of 4: the totals call asserted that the response echoed `type: 'creditcard'`, but Prism returns the contract's static example (`type: loan`) whatever the query. The assertion now checks what a mock can promise:

```ts
// before
totals.data?.type === 'creditcard'
// after: status 200 and the figures present; echoing the query is the service's job, not the mock's
typeof totals.data?.includedCount === 'number'
```

### One command and CI

**Files changed:**
- `tools/verify.mjs` (new): installs `fixtures/` and `packages/api-client/`, then runs the six checks in order whatever the previous result, prints one line each with its duration, and exits 1 if any failed (stopping after a failed install).
- `package.json`: scripts `verify`, `check:client`, `check:client-smoke`.
- `.github/workflows/ci.yml`: job renamed "Verify (…)"; npm cache keyed on three lock files; steps reduced to the Python prerequisite and `npm ci && npm run verify`. There is no branch protection or ruleset, so no required check depended on the old name (checked through the GitHub API).

### Portfolio registry (separate repository)

- NeoCognitus70/portfolio-prompts#113 (`9b1547f`): gates `["npm ci && npm run verify"]`; the Python prerequisite as a comment on the row; notes mention the client; README table regenerated; `check-library` PASS.

---

## Technical Decisions

Structural decisions are in `DOCS/decision-register.md`: **DR-042** (the harness is independent of the client) and **DR-043** (standalone package; the UI's link decided in Phase 4). Implementation decisions below are not structural.

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| TypeScript 5.9.3 | `openapi-typescript` 7.13.0 requires `^5.x` | TypeScript 7 (unsupported by the generator) |
| Commit the generated types and check for drift | Reviewers see type changes in the diff; CI catches a forgotten regeneration | Generating at build time |
| Negative type cases with `@ts-expect-error` | Proves the types refuse wrong calls, and fails if a contract change makes them accept one | Positive cases only |
| Type-check the client smoke through the package's `tsc` | Node strips types without checking them | Leaving the smoke unchecked |
| Reuse the root's Prism through a shared helper | One pinned Prism; one place that owns starting and stopping it (owner's choice) | A second Prism in the package |
| `verify` runs every check even after one fails | One run shows every failure; installs are the exception | Stopping at the first failure |

---

## Documentation Updates

- `DOCS/implementation-plans/2026-10-06_cds-15-api-client.md`: the approved plan (#8); its Outcome appended and status set to implemented (this change).
- `DOCS/implementation-plans/_index.md`: v2 with the row (#8); row updated (this change).
- `DOCS/.design/api-specification.md` v10, `DOCS/.design/ui-specification.md` v7.
- `README.md`: "Checks" leads with `npm ci && npm run verify` and the Python prerequisite; "What is here" gains the client, the plans folder and the tools; decision range corrected to DR-043.
- `CHANGELOG.md`: 2026-10-06 CDS-15 entry.
- `DOCS/backlog.md`: v25, CDS-15 complete (#8); v26 records the merge, registry and log (this change).
- `DOCS/implementation-logs/2026-10-06_cds-15-api-client.md`: this log.

---

## Lessons Learned

- **Ask what a thing is for before deciding where it goes.** The layout question (workspaces or standalone) dissolved once D0 settled that the harness does not consume the client.
- **A mock answers with examples, not with logic.** Assert only what a static example can satisfy; echoing inputs belongs to tests against the real service.
- **Test both directions of a negative type test.** Removing a directive exposes the hidden error (TS2741); making a case valid exposes an unused directive (TS2578). Both are needed to show the cases are live.
- **Node's type stripping does not type-check.** Anything run as `.ts` needs a `tsc` that includes it.
- **One command beats four gates.** CI, the README and the registry now name the same command, so they cannot drift apart.

---

## Recommendations / Next Steps

- [ ] CDS-16: pin the .NET SDK (`global.json`), React and Vite as each project is created (DR-009). With the first project of each kind.
- [ ] Decide whether `orchestration_target` should now be true. Owner decision (housekeeping item 10).
- [ ] Phase 4: decide how the UI consumes `packages/api-client` (a `file:` dependency or npm workspaces, DR-043).
- [ ] Watch for `openapi-typescript` support for TypeScript 7, then revisit the 5.9.3 pin. Low priority.
- [ ] Watch the first CI run after 19 October 2026 (`ubuntu-latest` moves to Ubuntu 26). Low priority.

---

*Session logged: 2026-10-06. Author: Claude Code.*
