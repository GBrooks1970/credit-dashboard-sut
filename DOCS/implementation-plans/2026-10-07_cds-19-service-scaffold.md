---
version: 1
created: 2026-10-07T14:15Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-19
status: implemented
approved: 2026-10-07, Gary Brooks; merges of the CDS-19 PR, its records PR and the registry PR authorised once each one's own CI run reports success
delivered: "#21, squash 1608eac (2026-10-07); registry follow-up to come"
language: en-GB
---

# Implementation plan: CDS-19, Phase 3 service scaffold (contract types, edge validation, coverage gate)

**History of this plan.** The owner was interviewed on four decisions on 2026-10-07. The plan was presented at 14:15Z (clock read at 14:15:40Z), approved, and written to this file at 14:30Z, before any implementation (DR-041).

**Goal.** Phase 3 starts with a running ASP.NET Core minimal API that is contract first from its first commit:

- its types are generated from `openapi.yaml`;
- every request is checked against the contract at the edge, and failures are answered in API specification section 8's shape;
- a test keeps the served routes and the contract in step.

No business behaviour is implemented here; it arrives in CDS-20, CDS-21 and CDS-25.

## Evidence gathered before planning

A spike in the session scratchpad (`cs-spike/`). Nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| .NET SDK 10.0.401 is installed and is still the latest 10.0 patch (releases index, 2026-09-08) | `global.json` 10.0.401, `latestPatch` (DR-044) |
| NSwag 14.7.1 (`openapi2csclient`, DTOs only, System.Text.Json) generates 1,990 lines from contract v10 in 3.6 s. They compile on net10.0 with 0 warnings. The 3.1 nullable unions map cleanly | NSwag supplies the types |
| Corvus 5.7.5 `openapi-server` generates 618 files (about 279,000 lines). They build, but contain 116 hard-coded `about:blank` problem responses and turn invalid responses into 500s | Rejected: breaks section 8 and would mask Phase 5 bug flags |
| JsonSchema.Net 9.4.0 validates against the contract once `components.schemas` is wrapped as `$defs`. Nine cases were as expected | Edge validation is a middleware we own |
| BR-14 ranges are not in the `PATCH` body schema | BR violations stay 422s from the service; the edge rejects only shape, with 400 |
| NUnit 5.0.0, NUnit3TestAdapter 6.3.0 and Microsoft.NET.Test.Sdk 18.10.1 run on net10.0 with categories | The test stack (DR-017) |
| No Java on the machine | openapi-generator not considered |

## Steps

1. **Decisions and specifications.**
   - **DR-050:** NSwag 14.7.1 types and JsonSchema.Net 9.4.0 edge validation (Corvus rejected). Only implemented operations are mapped, and a pending list in the coverage test shrinks to zero by the Phase 3 gate.
   - **API specification v15:** section 3 Framework row; section 11 'Service contract drift' and 'Contract coverage' rows; section 8 says an operation not yet served answers 404 `/problems/not-found`.
2. **Layout:** `demo-apps/demoapp001-dotnet-api/`.
   - **Top level:**
     - `global.json`;
     - `CreditDashboard.sln` (classic format);
     - `.config/dotnet-tools.json`, with NSwag 14.7.1.
   - **`CreditDashboard.Api/`:**
     - `Contract/Contract.g.cs` and `Contract/contract.json` (generated, committed, the JSON embedded).
     - `Edge/ContractValidation.cs`: matches each request to its operation, then validates path, query and body. On failure it answers 400 `/problems/validation` with `errors[]`; outside the contract it answers 404 `/problems/not-found`.
     - `Edge/Problems.cs`.
     - `Program.cs`: port 4000, a `/api/v1` group, no operations mapped.
   - **`CreditDashboard.Api.Tests/`** (NUnit 5.0.0, `Microsoft.AspNetCore.Mvc.Testing` 10.0.12; exact pins):
     - edge validation cases;
     - the 404 shape;
     - contract coverage: served routes equal the contract operations minus the pending list (36 today), and no route sits outside the contract.
3. **Generation.** `tools/generate-service-contract.mjs` writes `contract.json` from the YAML (root `yaml` 2.9.1), then runs NSwag through the tool manifest. `--check` fails on drift.
4. **Checks.**
   - `tools/verify.mjs` gains 'service contract drift' and 'service build and tests' (`dotnet tool restore`, then `dotnet test` in Release), making 11 steps.
   - CI adds `actions/setup-dotnet` from `global.json`, with a NuGet cache.
   - README 'Checks' names the .NET 10 SDK as a prerequisite.
5. **Backlog v36.** CDS-19 Done. **CDS-25** "Serve the contract operations from the fixture store", blocked by CDS-19, CDS-20 and CDS-21. CDS-22 is also blocked by CDS-25. Board regenerated.
6. **Records.** CHANGELOG; this plan's Outcome and an implementation log (records PR); a registry PR noting the .NET 10 prerequisite.

## Verification

`npm run verify` passes 11 of 11, locally and in CI. Probe 1: a contract schema changed without regenerating fails the drift step and `verify`; restore byte for byte. Probe 2: one operation removed from the pending list fails the coverage test, naming it; restore. Probe 3: `GET /api/v1/nowhere` gets 404 `/problems/not-found` (a test).

## Delivery

Branch `claude/cds19-service-scaffold`, one PR, merged on its own green CI; then the records PR; then the registry PR.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| Contract types and validation | NSwag types plus own edge validation; Corvus openapi-server; NSwag plus DataAnnotations only | NSwag plus own validation | NSwag plus own validation (2026-10-07) |
| Operations not yet implemented | Pending list, unmapped means 404; map all 36 returning 501 | Pending list | Pending list (2026-10-07) |
| Backlog gap | Add CDS-25 now; fold into CDS-20 and CDS-21; decide at CDS-20 | Add CDS-25 | Add CDS-25 (2026-10-07) |
| Checks | Inside `npm run verify`; a separate CI job | Inside `verify` | Inside `verify` (2026-10-07) |
| Approval | Approve, merge when green; approve, owner merges; change | (owner's call) | Approve, merge when CI is green (2026-10-07) |

## Outcome

Delivered as planned in #21 (squash `1608eac`; CI run 37639330056 green: `verify` 11 of 11, job 45 s, 16 of 16 service tests). The live run answered as specified, and the three probes failed as intended.

Differences from the plan:

- **Tool manifest.** The .NET 10 CLI created it at the service folder's root; it was moved to `.config/` as planned.
- **NuGet lock files and `Directory.Build.props`.** Not in the plan's steps. They make restores reproducible and enable the CI NuGet cache, which needs lock files, with locked mode in CI.
- **More edge tests than planned.** 16 tests, and every problem body is checked against the contract's `Problem` schema. That check was added after a fault (a null `errors`) that the plan did not foresee.
- **Three faults fixed during implementation:** the inline-schema dialect, `instance` serialisation, and the null `errors` (see the log).
- **Root scripts.** `generate:service-contract`, `check:service-contract`, `check:service` and `service` were added.

Full record: [`DOCS/implementation-logs/2026-10-07_cds-19-service-scaffold.md`](../implementation-logs/2026-10-07_cds-19-service-scaffold.md).
