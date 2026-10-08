# CDS-21: test-control endpoints — 2026-10-08

## Session Summary

The seven `/__test/*` operations are served (DR-008, DR-020, DR-053).

- **Specification first.** Contract v11 (a `BugFlag` enum of 30 flags) and API specification v17 were reviewed and merged with the plan (#29, squash `3dfdcaa`).
- **Delivered** in #31 (squash `643e131`): the gate, the in-memory store, the controlled clock, the seven handlers, the overrides rules in C#, the latency middleware, 52 new service tests, contract v12 and API specification v18.
- **Not yet built:** none of the business operations (CDS-25); the harness abilities that call these endpoints (CDS-22).

---

## Objectives

1. ✅ A gate that reveals nothing: off, no key and a wrong key give the same 404; no default key.
2. ✅ A store that holds bindings, overrides, flags, clock, latency and verified emails, cleared by one reset.
3. ✅ The 422 `overrides-inconsistent` outcome, one message per breached rule, from the CDS-20 library.
4. ✅ An unknown bug flag is a 400, so a Phase 5 typo cannot silently do nothing.
5. ✅ The contract coverage test: seven operations served, 29 pending.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Service | `CreditDashboard.Api.Tests` (NUnit 5.0.0) | 16/16 | 68/68, 3 s | ✅ PASS |
| Rules | `CreditDashboard.BusinessRules.Tests` | 234/234 | 234/234 | ✅ PASS |
| CI | GitHub Actions run 37748925204 (PR #31) | 11 steps | 11 steps, job 56 s | ✅ PASS |
| Local | `npm run verify` | 11/11 | not run end to end, see below | ⚠ environmental |

**Local checks, run separately.** Port 4010 was held by an `npm run mock` that was not mine, so `verify` could not run its two mock steps. The pieces were run on their own: Redocly lint valid; mock smoke 36 of 36 on `MOCK_PORT=4311`; fixture check 448 of 448; client types and service contract current; 234 rule tests and 68 service tests. CI ran all 11 steps.

**What the 52 new tests cover.** The gate (off, no key, wrong key, right key, the 404 body validated against the contract's `Problem` schema, other paths untouched, and a keyless start refusing); the initial state and reset clearing every part; binding (plain, unknown user, a persona outside the contract, all 12 override samples accepted, binding again clearing overrides, lists replaced only where named, unknown bureau, a schema failure); one 422 test per rule (BR-03, BR-06, BR-05, BR-09, BR-12 outside the window, BR-12 before opening, BR-13, BR-15 across personas, BR-15 within a list); bug flags (stored, replaced, outside the enum); the clock (frozen, not a date-time, real time until frozen); latency (a measured delay, range, five unusable inputs, clearing); verify-email.

**Probes (each expected to fail, and each did):**
1. **Gate middleware removed:** 3 tests failed (off, no key, wrong key). Restored.
2. **BR-09 check disabled in the overrides validator:** `BR_09_a_mask_that_does_not_match_its_source_is_a_422` failed. Restored.
3. **`testReset` left in the pending list:** the coverage test failed. Restored.

**Live run** (`dotnet run`, launch profile, port 4000): no key gave 404; the key gave `{"personas":{"alex":"excellent","sam":"struggling"},"overridden":{...false},"flags":[],"now":null,"latency":{}}`; freezing the clock to `2026-10-03T09:00:00Z` showed in the state; `{"flags":["nope"]}` gave 400 `/problems/validation` with `errors[0].field` `flags.0`. The process was stopped afterwards and port 4000 was free.

---

## Changes Implemented

### Service (`demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/`)

- `Control/`: `TestControlOptions` (environment variables, refuses to start without a key), `ControlledClock`, `FixtureSet`, `PersonaStore`, `OverridesValidator`, `TestControlGate` and `LatencyMiddleware`.
- `Routes/TestControl.cs`: the seven handlers, always mapped. `Program.cs`: gate, then latency, then the edge. `Edge/Problems.cs`: `RuleViolation`.
- `CreditDashboard.Api.csproj`: a reference to `CreditDashboard.BusinessRules`; the fixtures copied into `Fixtures/` in the build output. `Properties/launchSettings.json`: `TEST_CONTROL=true` and the synthetic key `demo-only`.

### Tests, contract and records

`CreditDashboard.Api.Tests/TestControlTests.cs`; the pending list in `ContractCoverageTests.cs`; contract v11 and v12 with regenerated client and service types; API specification v17 and v18; My Profile specification v7. DR-053.

---

## Technical Decisions

The structural decision is **DR-053**.

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Key from `TEST_CONTROL_KEY`, no default (owner) | No hidden secret in a public repository | A built-in default; any non-empty header |
| A `BugFlag` enum in the contract (owner) | One list; a typo cannot silently do nothing | Any string; a service-side list |
| Fixtures copied to the build output (owner) | One copy, plain JSON, container-ready | Embedded resources; reading the repository path |
| Overrides 422 in CDS-21, in C# over the library (owner) | The 422 is part of the operation's contract | Deferring it to CDS-25 |
| Options read lazily from final configuration | The host and the tests can supply the settings | Reading them while building the host |
| The operations are always mapped; the gate answers 404 | The coverage test stays stable; existence is hidden | Mapping only when enabled |
| Latency applies to every request except `/__test/*` | A test-control call must not be slowed by what it set | Delaying everything |

---

## Differences from the plan

- **The gate runs before the edge**, as the specification says. The plan's step 3 said "after edge validation", which would answer a shape error before hiding the operation's existence.
- **Contract v12 and API specification v18** were not in the plan's specification step: the clock and latency inputs and a stale `attemptsRemaining` description came up while building.

---

## Lessons Learned

- **A test helper that walks up to find a folder can find the build copy.** The first helper looked for `fixtures/personas`, found the copy in the test output (Windows paths are case-insensitive) and read the wrong files. Anchor on a file only the repository has.
- **Nullable annotations bite `ToDictionary`.** `Path.GetFileNameWithoutExtension` returns `string?`; the key needs `!`.
- **A start-up refusal test must not start the host in a helper.** The first version threw inside its own set-up.
- **A shell here treats unmatched apostrophes in heredocs as a parse error.** Files with apostrophes in comments were written with the file tool instead.
- **A second look at a stopped process.** At about 19:43Z on 7 October a Prism on port 4010 was stopped on the assumption it was an orphan of this session. It was not checked first and may have been the owner's.

---

## Recommendations / Next Steps

- [ ] CDS-25 (serve the 29 business operations) is Ready; CDS-23 (Schemathesis) and CDS-24 (review Notes) are Ready; CDS-22 follows CDS-25.
- [ ] Make `tools/client-smoke.ts` honour `MOCK_PORT` as `tools/mock-smoke.mjs` does.
- [ ] Persona behaviours (`latencyMs`, `failReportEndpoints`) and the email state that `verify-email` sets are read by CDS-25.

---

*Session logged: 2026-10-08. Author: Claude Code.*
