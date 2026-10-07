# Walkthrough — Phase 1 close to Phase 3 start: generated client, version pins, phase gates, Kanban, independent re-review, service scaffold

## Executive Summary

This walkthrough covers one batch: 15 merged PRs in `credit-dashboard-sut` (#8 to #22, after brief 6 decided in #6) and their follow-ups in `portfolio-prompts`, `portfolio-landing` and the portfolio root, between 6 October 2026 17:10 and 7 October 2026 15:48 (local time, UTC+1). Earlier work in this session (the templates, the glossary, decision briefs 1 to 6, CDS-07 to CDS-14, onboarding) is recorded in handovers v5 to v10.

In this batch:

- **Phase 1 (contract) is closed.** It gained a generated TypeScript client, resolved version pins and a drift-checked Kanban board.
- **Phase 2 (behaviour) is closed.** Its gate was met only after three independent agent reviews, which found and drove fixes to 23 Blocker or Change findings; this included contract v10.
- **Phase 3 has started** with a contract-first ASP.NET Core service scaffold.

The repository is clean and in sync with `origin/main` at `02181d6`, and `npm run verify` passes 11 of 11.

---

## 1. Changes Implemented

### 1.1 Generated TypeScript client and one-command verification (CDS-15, #8, `81f16be`)

- [`packages/api-client/`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/packages/api-client/): a standalone package with its own lock (DR-043). It uses `openapi-typescript` 7.13.0 and `openapi-fetch` 0.17.0, with TypeScript pinned to 5.9.3 because the generator requires `^5.x`.
  - **Generated types:** `src/generated/schema.d.ts` is committed. `npm run check` fails on drift, then runs a strict `tsc` over `test/types-negative.ts`, whose `@ts-expect-error` cases prove that wrong calls fail to compile.
- [`tools/client-smoke.ts`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/tools/client-smoke.ts) and [`tools/lib/prism.mjs`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/tools/lib/prism.mjs): four typed calls run against Prism. The Prism start and stop code is now shared with the mock smoke and always runs Prism through `node`, never a shell.
- [`tools/verify.mjs`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/tools/verify.mjs): one command for every check, printing one result line each. It became CI's only step and the registry gate (portfolio-prompts #113).
- **Decision:** DR-042, against the recommendation. The Serenity/JS harness consumes the API independently of the client.

### 1.2 Version pins (CDS-16, #11, `b0fbb3f`; DR-044)

The versions are resolved now and the files are created at scaffold: .NET SDK 10.0.401 with `latestPatch`; React 19.3.0, Vite 8.3.3, `@vitejs/plugin-react` 6.1.2; UI TypeScript 5.9.3. The pins were checked live against npm and the .NET releases index, twice.

### 1.3 Phase gates (decision brief 7, #13, `75a764b`; DR-045)

- [`DOCS/decision-briefs/…brief-7…md`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/DOCS/decision-briefs/credit-dashboard-sut_decision-brief-7_v1_20261006T2320Z.md): four items. The owner went against the recommendation twice:
  - Phase 1 closes only with CDS-17;
  - Phase 2 is recorded only after an independent re-review.
- [`README.md`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/README.md) 'SDD workflow': the phase table is restored from the frozen Phase 0 pack, with a 'Gate status' column.

### 1.4 Kanban board; Phase 1 closed (CDS-17, #14, `a15f6a0`)

- [`DOCS/backlog.md`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/DOCS/backlog.md): one `auth-table` table per phase. The backlog authors only `Done` or `Parked`; the board works out Ready or Backlog from "Blocked by":

  ```diff
  - | CDS-18 | Independent re-review … | 2 | READY TO START | none (after CDS-17, brief 7 order) |
  + | `CDS-18` | Independent re-review … | Behaviour | — | HIGH | `CDS-17` | Open |
  ```
- **The board:** [`credit-dashboard-sut_implementation-kanban_v1.html`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/credit-dashboard-sut_implementation-kanban_v1.html), from `portfolio-kanban-generator` 1.2.0, an exact devDependency. The drift check is a `verify` step.

### 1.5 Independent re-review and the Phase 2 gate (CDS-18, #16 to #20; DR-046 to DR-049)

- **The review record:** [`.review/2026-10-07_cds-18-behaviour-re-review.md`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/.review/2026-10-07_cds-18-behaviour-re-review.md). It holds each reviewer prompt (with its SHA-256 prefix) and each report, verbatim, plus the author's verification and the owner's decisions and sign-off.

| Pass | Scope | Blocker / Change / Note | Fixed in |
|---|---|---|---|
| 1, blind (fresh agent) | All behaviour against contract v9 | 5 / 12 / 8 | #16 `dca26ce` |
| 2, confirmation (fresh agent) | All, at `dca26ce` | 1 / 10 / 11 | #17 `79d6498` |
| 3, scoped (fresh agent) | Diff `f16cea0..79d6498` | 0 / 3 / 6 | #18 `2746a82` |
| 3, re-check 1 | That fix | 0 / 1 / 3 | #18 |
| 3, re-check 2 | That fix | 0 / 0 / 1 | — |

- [`DOCS/.architecture/openapi.yaml`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/DOCS/.architecture/openapi.yaml), contract v10 (`info.version` 0.7.0), with three decisions:
  - **DR-046:** `DebtOverview.byType`.
  - **DR-047:** the changes toggle fetches every change.
  - **DR-048:** one Problem type per 422 outcome.

  ```diff
  -        '422': { $ref: '#/components/responses/RuleViolation' }   # every rule outcome alike
  +        '422': { $ref: '#/components/responses/CodeRefused' }     # code-wrong (attemptsRemaining) | code-invalid
  ```
- **Specifications:** API v14, UI v10, My Profile v6, glossary v10, step glossary v7. The step glossary's 'Used in' column was regenerated, and all 269 step lines match a pattern.
- **Features and fixtures:** [`features-shared/`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/features-shared/) went from 21 files and 65 scenarios to 23 and 72; four override samples were added (8 to 12). The first Blocker fixed:

  ```diff
  -    Then the total debt is 12947.60     # the excellent persona's total
  +    Then the total debt is 198279.60    # drilldown, recomputed from the fixture
  +    And the debt on credit cards is 423.60
  ```

### 1.6 Service scaffold; Phase 3 starts (CDS-19, #21, `1608eac`; DR-050)

- [`demo-apps/demoapp001-dotnet-api/`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/demo-apps/demoapp001-dotnet-api/): an ASP.NET Core minimal API on .NET 10 (`global.json` 10.0.401, `latestPatch`), on port 4000 under `/api/v1`. NuGet lock files are committed, and CI restores in locked mode.
- **`Contract/`:** NSwag 14.7.1 data types (1,991 lines) and the embedded contract, generated by [`tools/generate-service-contract.mjs`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/tools/generate-service-contract.mjs) and drift-checked.
- [`Edge/ContractValidation.cs`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Edge/ContractValidation.cs) validates every request's path, query and body against the contract, using JsonSchema.Net 9.4.0:
  - a shape failure gets 400 `/problems/validation` with `errors[]`;
  - anything outside the contract gets 404 `/problems/not-found`.

  JsonSchema.Net rejects OpenAPI's own keywords, so [`Edge/ContractModel.cs`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Edge/ContractModel.cs) registers `components.schemas` as `$defs` of one 2020-12 document and rewrites every `#/components/schemas/` reference to point there.
- **[`ContractCoverageTests.cs`](file:///D:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/credit-dashboard-sut/demo-apps/demoapp001-dotnet-api/CreditDashboard.Api.Tests/ContractCoverageTests.cs):** all 36 operations are pending, and the test fails on any route outside the contract. CDS-25 was added to serve the operations.
- **Rejected after a spike:** Corvus 5.7.5 `openapi-server`. It hard-codes 116 `about:blank` problem responses, and its server-side response validation would mask the Phase 5 bug flags.

### 1.7 Portfolio follow-ups (other repositories)

| Repository | PR | Change |
|---|---|---|
| `portfolio-prompts` | #113, #114, #115, #116 | Gate `npm ci && npm run verify`; plans convention portfolio-wide and `orchestration_target: true`; label "Phases 1 and 2 complete"; .NET 10 prerequisite, handover v11 |
| `portfolio-landing` | #60 | Card summary for Phases 1 and 2 |
| Portfolio root | #271, #290, #292 | Shared plan template and `loan-origination-parity` in the capability matrix; matrix SDD ledger; handover v11 |

---

## 2. Verification & Test Evidence

Re-run for this walkthrough on 2026-10-07 at 15:02Z, on `main` at `02181d6`:

| Command | Quality Gate / Suite | Status | Metrics (Passed/Total) | Duration |
|---|---|---|---|---|
| `npm run verify` | All checks (2 installs + 9) | ✅ PASS | 11/11 steps | 2 m 19 s (wall) |
| `npx --yes @redocly/cli@2.57.0 lint` | Contract lint | ✅ PASS | valid | 8.7 s |
| `npm run check` (fixtures) | Fixture schema and rules | ✅ PASS | 448/448 checks; 7 personas, 2 users, 12 samples | 2.8 s |
| `python tools/check-gherkin.py` | Gherkin parse, rule coverage | ✅ PASS | 23 files, 72 scenarios; BR 15/15; PR 10/11 (PR-05 stretch) | 0.6 s |
| `npm run check:mock` | Prism mock smoke | ✅ PASS | 36/36 operations; 401 without token | 8.5 s |
| `npm run check:client` | Client drift and strict types | ✅ PASS | current, 2,795 lines | 12.3 s |
| `npm run check:client-smoke` | Typed calls against Prism | ✅ PASS | 4/4 | 7.8 s |
| `npm run check:service-contract` | C# types and contract drift | ✅ PASS | current, 1,991 lines | 7.5 s |
| `dotnet test CreditDashboard.sln -c Release` | Service tests (NUnit 5.0.0) | ✅ PASS | 16/16 | 47.1 s (step); 1 s (tests) |
| `npm run check:kanban` | Kanban drift | ✅ PASS | in sync: 25 tickets (19 Done, 4 Ready, 2 Backlog) | 3.6 s |
| `npm audit --omit=dev` | Production dependency audit | ✅ PASS | 0 vulnerabilities | — |
| `npm audit` (incl. dev) | Development dependency audit | ⚠️ FINDINGS | 15 (9 high, 6 moderate), all transitive through `@stoplight/prism-cli` 5.16.0 | — |

**Reproduction output:**

```text
verify:
  pass  install fixtures (16.2 s)
  pass  install api-client (20.1 s)
  pass  contract lint (8.7 s)
  pass  fixture check (2.8 s)
  pass  Gherkin parse and rule coverage (0.6 s)
  pass  mock smoke (8.5 s)
  pass  client check (drift and types) (12.3 s)
  pass  client smoke (7.8 s)
  pass  service contract drift (7.5 s)
  pass  service build and tests (47.1 s)
  pass  Kanban board current (drift check) (3.6 s)
verify: all 11 steps passed

Passed!  - Failed:     0, Passed:    16, Skipped:     0, Total:    16, Duration: 1 s - CreditDashboard.Api.Tests.dll (net10.0)
7 personas, 2 users, 12 override samples, 448 checks, 0 failures
mock smoke: 36 operations in the contract, 36 passed; 401 without a token: pass
```

**Development audit, not previously recorded.** `npm audit --json` reports `{'moderate': 6, 'high': 9, 'total': 15}`. The packages include `@faker-js/faker` ≤ 10.4.0, `braces`, `lodash` and `uuid`, all inside Prism's dependency tree. npm's only offered fix is `@stoplight/prism-cli` 3.1.1, a semver-major downgrade, so it was not applied. Prism is a local development mock, not part of any deployed artefact. The `fixtures/` and `packages/api-client/` audits report 0.

**Probes that were expected to fail and did, by item:**

| Item | Probe | Result |
|---|---|---|
| CDS-15 | Contract changed without regenerating | Client drift failed; restored byte-identical |
| CDS-15 | A negative type case made valid | `tsc` TS2578 |
| CDS-17 | A ticket marked Done without regenerating the board | `verify` 1 of 9 failed |
| CDS-17 | A malformed backlog row | `check:kanban` exit 1 |
| CDS-19 | Contract summary changed without regenerating | "contract.json not current", exit 1 |
| CDS-19 | `getDebtOverview` removed from the pending list | Coverage test failed, naming it |

**Remote CI on `main`:** runs 37639888518 (`02181d6`), 37639542569 (`1608eac`) and 37629228935 (`b5f2892`) all succeeded. Every PR in the batch merged only after its own run reported success. Per-PR runs are in the implementation logs.

---

## 3. Operational State & Invariants

- **Branch:** `main` at `02181d6`; working tree clean (0 entries); `ahead=0, behind=0` against `origin/main`. No open PRs.
- **CI:** one job, "Verify (contract lint, fixtures, Gherkin, mock smoke, client, service, Kanban)", runs `npm ci && npm run verify` (about 45 to 60 s on GitHub-hosted Ubuntu).
- **Specification-driven traceability:**
  - Every change went specification first: contract, then the rule tables and glossaries, then fixtures, then scenarios, then code.
  - Every plan was presented in full and written to `DOCS/implementation-plans/` before work started (DR-041; four plans and two addenda in this batch), with an Outcome appended after delivery.
  - Every delivery has an implementation log.
- **Decisions:** DR-042 to DR-050 recorded; decision register v14.
- **Docker:** not used in this batch; the `E:\_DockerData` invariant is unaffected.
- **Security:** synthetic data only; the real credit-score site was never visited. The production audit is clean; the development audit findings are above.
- **Documentation:** en-GB throughout, no em dashes or exclamation marks in prose.
- **Timestamps:** several `created` stamps were written before the clock was read, then corrected to their commit time and recorded where found: 16:50Z, 09:05Z, 09:10Z, 18:02Z, 09:58Z, 10:05Z and 14:40Z.
- **Not in this repository:** the portfolio library check fails locally on another agent's saleor v3 handover, which has no `.html` companion. That project belongs to another agent, so it was left alone.

---

## 4. Recommended Next Actions

1. **Recommended: CDS-20, the business-rules library.** BR-01 to BR-15 as pure C# functions, with NUnit tests tagged by BR ID (DR-017). Its plan comes first.
2. **CDS-21, test-control endpoints:** reset, persona binding with overrides, clock, bug flags, gated by DR-008. It is independent of CDS-20 and could run alongside it.
3. **Record the development audit findings** as a backlog risk: Prism 5.16.0's transitive vulnerabilities. Owner's call: accept for a local-only mock, watch for a Prism release, or pin overrides.
4. **CDS-25, serving the operations,** after CDS-20 and CDS-21; then CDS-22 (harness) and CDS-23 (Schemathesis) towards the Phase 3 gate.
5. **Owner decisions still open:** publishing the Kanban board on Pages; approving or denying `@scarf/scarf`'s install script; when to take CDS-24 (the review Notes).
