# CDS-23: Schemathesis pinned and clean — 2026-10-08

## Session Summary

Schemathesis 4.29.4 now runs against the live service as the 12th `verify` step (DR-056).

- **Plan first.** A read-only spike (a scratch virtual environment, the service on a spare port) found the real differences before any code; the plan and API specification v22 were merged first (#44, squash `b0884bb`).
- **Delivered** in #45 (squash `3119f4a`): 405 with an `Allow` header for an undefined method, a runner that starts the service and makes two passes, the pinned requirements, the per-operation configuration and the CI wiring.
- **Not yet built:** the Serenity/JS harness (CDS-22), the last Phase 3 gate condition.

---

## Objectives

1. ✅ Schemathesis pinned (`tools/requirements.txt`, `schemathesis==4.29.4`) and run from one command (`npm run check:schemathesis`).
2. ✅ A clean, repeatable run over the contract's operations, with the exclusions recorded and justified.
3. ✅ Real differences between contract and service fixed in the service, not configured away: 405 and large page numbers.
4. ✅ The run is a `verify` step and passes in CI.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Service | `CreditDashboard.Api.Tests` | 290/290 | 298/298, 33 s | ✅ PASS |
| Rules | `CreditDashboard.BusinessRules.Tests` | 234/234 | 234/234 | ✅ PASS |
| Property-based | `npm run check:schemathesis` (locally) | none | business 1,206 generated, test control 727, all passed; 10 runs in a row passed | ✅ PASS |
| Local | `npm run verify` | 11/11 | 12/12, 1 m 43 s (Schemathesis step 29.8 s) | ✅ PASS |
| CI | GitHub Actions run 37807279334 (PR #45) | 11 steps | 12 steps, job 95 s (Schemathesis step 18.6 s) | ✅ PASS |

**What the spike found** (business operations, before any change): Coverage and Fuzzing clean, but 13 "unsupported methods" (404 where Schemathesis expects 405), a revoked token after `logout` ran, a 422 the `positive_data_acceptance` check does not allow, and path identifiers it could not invent.

**What the run found once configured.** About one run in five failed on real behaviour:
- a page number larger than int64 (`?page=59720084612818352996352`) was a 400 because the edge read integers as int64 (fixed; the schema has no maximum, so it is valid);
- the stateful phase reported an accepted request with extra properties, differently on different runs (the phase is left out);
- a preferred-name response such as `µ` was reported as a schema violation because the Python validator reads `\p{L}` as ASCII (check off for that operation; the service tests check it).

**Probes (each expected to fail):** a required response key renamed (2 failures); an undocumented status 202 (1); a 500 for a valid input (page of 10 or more; a server error); the 405 reverted to 404 (28 and 5 failures). One more probe, a 500 on the details edit for `apr` over 50, was not detected: the contract's `DetailUpdate.value` is untyped, so the generator seldom pairs the field with a matching value. Modelling the update per field is a follow-up.

---

## Changes Implemented

- `Edge/ContractModel.cs` (`AllowedMethods`; integers read at any size), `Edge/ContractValidation.cs` and `Edge/Problems.cs` (405 with `Allow`), `Routes/ReportData.cs` (a page number is read wide and clamped).
- `tools/schemathesis-run.mjs`, `schemathesis.toml`, `tools/requirements.txt`; `tools/verify.mjs` (12 steps); `.github/workflows/ci.yml` (installs the requirements); `package.json` (`check:schemathesis`); `.gitignore` (`.schemathesis/`, `.hypothesis/`); README 'Checks'.
- Tests: six 405 tests (edge and test control), two paging tests; API specification v22 and DR-056.

---

## Technical Decisions

The structural decision is **DR-056**.

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| 405 with `Allow` for an undefined method (owner) | The standard HTTP answer; no check exclusion | Keep 404 and exclude the check |
| A `verify` step on every commit with a fixed seed (owner) | The gate wants a clean run; the run is about 20 s in CI | A nightly workflow only |
| The test-control operations run last, the latency control excluded (owner) | The control pass changes the clock and personas; latency can delay a request by 10 s | Leave test control out |
| The runner signs in once; `logout` is excluded | Logout revokes the run's token | An authentication hook that signs in again |
| No stateful phase | Not reproducible across runs of the same seed | Keep it and accept flakes |
| Per-operation expectations in `schemathesis.toml`, not `--checks all` | A command-line list of checks overrides a per-operation `enabled = false` | Disabling checks on the command line for every operation |
| The service log goes to a file | A blocked pipe stalled the service (below) | A pipe to the runner |

---

## Lessons Learned

- **Do not pipe a child's output while blocking the event loop.** `spawnSync` for Schemathesis stopped Node draining the service's stdout, so the pipe filled and the service stalled: the fuzzing phase took 214 s instead of 5. Send the log to a file.
- **A leftover process on the run's port makes the run lie.** My own manual service, with a different key, answered the runner's requests for several runs. The runner now stops if anything already answers on its port, and I stopped my processes by port and by checking their command line properly (a relative path had defeated my own filter).
- **"Deterministic" is not reproducible.** Generation is seeded but the stateful phase and large-integer fuzzing still varied; repeat a gate ten times before trusting it.
- **A fuzzer finds what the contract lets through.** Large integers and untyped `value` fields are the contract's looseness showing; fix the service where it is wrong, tighten the contract where it is loose, and record the rest.
- **Windows:** `PYTHONUTF8=1` is needed, `python -m schemathesis` does not exist (the console script's entry point does), and Git Bash rewrites an argument that starts with `/`; the runner avoids all three.

---

## Recommendations / Next Steps

- [ ] CDS-22: the Serenity/JS harness (plan approved; specification PR first).
- [ ] Model `DetailUpdate` per field in the contract so the generator and the client see the real shapes (contract v16).
- [ ] Consider a larger, nightly Schemathesis run with the stateful phase once its results are stable.

---

*Session logged: 2026-10-08. Author: Claude Code.*
