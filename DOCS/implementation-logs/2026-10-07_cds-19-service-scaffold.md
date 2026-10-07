# CDS-19: Phase 3 service scaffold (contract types, edge validation, coverage gate) — 2026-10-07

## Session Summary

Phase 3 started with a contract-first scaffold of the ASP.NET Core minimal API (DR-017).

- **Spike first.** It compared three ways to get C# from an OpenAPI 3.1 contract, and the owner chose NSwag types plus the service's own edge validation (DR-050).
- **Delivered** in #21 (squash `1608eac`): the solution under `demo-apps/demoapp001-dotnet-api/`; generated, drift-checked contract types and an embedded contract; a middleware that validates every request against the contract and answers in API specification section 8's shapes; a coverage test that keeps routes and contract in step.
- **Not yet built:** no operation is served; CDS-25 was added for them.

---

## Objectives

1. ✅ Spike the generators against contract v10 before planning (scratchpad only).
2. ✅ Full plan presented, approved, written to file before code (`753f0fb`).
3. ✅ A service that refuses anything outside the contract, with the contract's own error shapes.
4. ✅ Generated artefacts drift-checked; routes and contract held in step by a test.
5. ✅ One command still checks everything (`npm run verify`, 11 steps), locally and in CI.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Service | `CreditDashboard.Api.Tests` (NUnit 5.0.0) | none | 16/16 | ✅ PASS |
| Service | Contract drift (`check:service-contract`) | none | current (1,991 lines of C#) | ✅ PASS |
| All | `npm run verify` (local) | 9/9 | 11/11 | ✅ PASS |
| CI | GitHub Actions run 37639330056 (PR #21) | 9 steps | 11 steps, job 45 s | ✅ PASS |

**Live run.**
- `dotnet run` on port 4000 answered `GET /api/v1/reports/bureau-a/score/history?range=bad` with 400 `/problems/validation`, and `errors[0].field` was `range`.
- `GET /api/v1/debt/overview` got 404 "This operation is not served yet."
- Port 4000 was free after the process was stopped.

**Probes (each expected to fail, and each did):**
1. **A contract summary changed without regenerating:** "contract.json not current", exit 1. The C# types did not change, which is correct for a description. Restored, identical by SHA-256.
2. **`getDebtOverview` removed from the pending list:** the coverage test failed with "contract operations neither served nor pending: getDebtOverview". Restored, identical by `cmp`.
3. **`GET /api/v1/nowhere`:** 404 `/problems/not-found`, a test.

---

## Changes Implemented

### Spike (scratchpad `cs-spike/`, not committed)

- **NSwag 14.7.1 (`openapi2csclient`, DTOs, System.Text.Json):** 1,990 lines in 3.6 s; compiled on net10.0 with 0 warnings.
- **Corvus 5.7.5 `openapi-server`:** 618 files (about 279,000 lines). It built in 36 s, but has 116 hard-coded `about:blank` problems and turns invalid responses into 500s.
- **JsonSchema.Net 9.4.0:** rejects OpenAPI's top-level keywords, so the component schemas are wrapped as `$defs`; nine cases then behaved as expected.
- **Test stack:** NUnit 5.0.0 with NUnit3TestAdapter 6.3.0 ran on net10.0.
- **Not used:** no Java on the machine, so openapi-generator was not tried.

### The service

**Files changed:**
- `demo-apps/demoapp001-dotnet-api/`:
  - `global.json` (10.0.401, `latestPatch`);
  - `CreditDashboard.sln` (classic format);
  - `.config/dotnet-tools.json` (NSwag 14.7.1; the .NET 10 CLI created the manifest at the folder root, and it was moved to `.config/` as planned);
  - `Directory.Build.props` (lock files, locked mode in CI).
- `CreditDashboard.Api/`:
  - `Contract/Contract.g.cs` and `Contract/contract.json` (generated, embedded);
  - `Edge/ContractModel.cs`, `Edge/ContractValidation.cs`, `Edge/Problems.cs`;
  - `Routes/ApiOperations.cs` (the place CDS-25 maps operations);
  - `Program.cs`;
  - `Properties/launchSettings.json` (port 4000).
- `CreditDashboard.Api.Tests/`: `EdgeValidationTests.cs` (15 cases) and `ContractCoverageTests.cs`.
- `tools/generate-service-contract.mjs` (`--check`), `tools/verify.mjs` v3, root scripts, `.github/workflows/ci.yml`.

Three faults found during implementation, all by the tests:

```text
1. "Unknown keywords (example) are disallowed": inline parameter schemas did not declare a dialect.
   Fix: each inline schema is given "$schema": 2020-12, like the $defs document.
2. "instance" serialised as an object: PathString + PathString is a PathString.
   Fix: (PathBase + Path).Value.
3. "errors": null on 404s: DefaultIgnoreCondition does not apply to dictionary entries,
   and the contract's errors is an array. Fix: errors added only when present; every
   problem body in the tests is now validated against the contract's Problem schema.
```

---

## Technical Decisions

The structural decision is **DR-050**.

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| NSwag DTOs plus own JsonSchema.Net middleware (owner) | Contract types without ceding the error shape; JSON Schema 2020-12 fidelity for 3.1 | Corvus server (wrong problems; masks bug flags); DataAnnotations only |
| Pending list; unmapped means 404 (owner) | No undocumented status is ever served | 501 stubs |
| CDS-25 added for the operations (owner) | No Phase 3 item served them | Fold into CDS-20 and CDS-21 |
| Inside `npm run verify` (owner) | One gate; .NET 10 becomes a stated prerequisite | A separate CI job |
| The most literal path template wins | Prefers fixed segments over parameters when two templates fit | First match |
| Headers and cookies not validated at the edge | Security schemes belong to the service (CDS-21, CDS-25) | Validate them here |

---

## Documentation Updates

- DR-050 (decision register v14).
- API specification v15: section 3 Framework row; section 8 404 row; section 11 'Service contract drift', 'Edge validation' and 'Contract coverage'.
- README: status, 'What is here', 'Checks' and the SDD table's Phase 3 row.
- Backlog v36: CDS-19 Done; CDS-25 added; CDS-22 also blocked by CDS-25. The board shows 25 tickets.
- CHANGELOG.

---

## Lessons Learned

- **Spike generators against the real contract.** On paper Corvus looked ideal. Generated output showed it would break the error catalogue and hide the planted defects.
- **JSON Schema libraries are strict about dialects.** Declare `$schema` on every schema you build, not only the root document.
- **Validate the service's errors with the contract it publishes.** Two of the three faults were in the problem bodies, and a schema check in every test caught the third class for good.
- **A pipe's exit code is the last command's (again).** Probe 1's printed `exit=0` came from `tail`; the tool's own exit code was 1.

---

## Recommendations / Next Steps

- [ ] Registry PR: gate prerequisite .NET 10; notes cite handover v11 and the scaffold. Next.
- [ ] CDS-20 (business-rules library, NUnit tagged by BR) and CDS-21 (test control) are Ready; CDS-25 follows both.
- [ ] CDS-23 (Schemathesis) is Ready but only meaningful once operations are served.
- [ ] When operations arrive, decide whether 401 precedes 400 at the edge for protected operations (today the edge validates shape first).

---

*Session logged: 2026-10-07. Author: Claude Code.*
