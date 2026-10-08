---
version: 1
created: 2026-10-08T12:59Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-23
status: approved
approved: "2026-10-08, Gary Brooks, 'approve all as recommended' (decisions D1 to D3); merge authority: given for the pull requests of this item ('push PR and merge')"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-23, Schemathesis pinned and clean

**History of this plan.** Presented in full to the owner at 12:59Z on 2026-10-08 (clock read at 12:59:40Z), after a read-only spike, together with the CDS-22 plan. Approved with all decisions as recommended, then written to this file.

**Goal.** Pin Schemathesis and run it clean against the service across the contract's operations (a Phase 3 exit gate condition, API specification section 11).

## Evidence gathered before planning

A read-only spike: `schemathesis==4.29.4` installed in a scratch virtual environment (Python 3.13.1, 31 packages) and run against the live service. Nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| Business operations only (29 of 36): Coverage 29 passed, Fuzzing 29 passed, Stateful 25 scenarios passed | The service is already largely clean; the work is configuration and two real findings |
| 13 "unsupported methods": the service answers 404 for a method the contract does not define on a known path; Schemathesis expects 405 | Decision D1 |
| `POST /auth/logout` in the run revokes the run's own token, so about 10 other operations then returned 401 | Exclude `logout` from the run (it is covered by the service tests); the runner supplies the token |
| The contract example for `verifyMobile` gets 422 `code-invalid` when no challenge is pending, by design; the `positive_data_acceptance` check allows only 2xx, 401, 403, 404, 409, 429 and 5xx | Configure that check to accept 422 |
| Random path IDs gave 404s ("missing test data") | A `[parameters]` block in a config file fixed it (confirmed) |
| On Windows the CLI crashes without `PYTHONUTF8=1`; Git Bash rewrites a path argument that starts with `/` | The runner sets the environment and spawns the CLI directly |
| The test-control operations were not exercised: they need the key and change the clock, personas and latency | Decision D3 |

## Steps

Specification first. Delivered as two pull requests, then a records pull request.

1. **Specification** (PR 1, with this plan): API specification v22: section 8 gains a 405 `/problems/method-not-allowed` row and says a known path with an undefined method is 405 with `Allow` (the 404 row keeps the unknown-path case); section 11's Schemathesis row says the run is a `verify` step with a fixed seed. DR-056.
2. **Service** (PR 2): the edge answers 405 with an `Allow` header when the path matches a contract path but the method does not (`ContractModel` exposes the methods of a path; `Problems.MethodNotAllowed`); the edge test "a method the contract does not define" becomes a 405 test.
3. **Run** (PR 2): `schemathesis.toml` (path parameters, the 422 acceptance); `tools/requirements.txt` pinning `schemathesis==4.29.4` and the existing `gherkin-official==29.0.0`; `tools/schemathesis-run.mjs`, which builds if needed, starts the service on its own port with test control on and a synthetic key, freezes the clock, binds a persona, signs in, runs the business pass (`logout` excluded), then runs the test-control pass last (`latency` excluded), resets, and always stops the service.
4. **Gate** (PR 2): a 12th `verify` step "Schemathesis"; CI installs the pinned requirements.
5. **Records** (PR 3): DR-056 outcome, README 'Checks', backlog, Kanban, plan Outcome, implementation log.

## Verification

- A clean run: no failures in any phase, locally and in the pull request's own CI run, with a fixed seed (`--generation-deterministic`).
- Probes that must fail, reverted afterwards: a required response key removed; a response status the contract does not document; an input that makes the service answer 500.
- `npm run verify` passes 12 of 12; the service tests (405) pass.

## Delivery

- PR 1 `claude/cds-23-22-plans-spec`: this plan, the CDS-22 plan, API specification v22, DR-056.
- PR 2 `claude/cds-23-schemathesis`: steps 2 to 4.
- PR 3 `claude/cds-23-records`: step 5.
- The owner gave merge authority for this item's pull requests; each merges when its own CI run reports success.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Method not allowed | (a) 405 with `Allow` for a known path and an undefined method. (b) Keep 404 and exclude the `unsupported_method` check | (a) | (a), 'approve all as recommended' (2026-10-08) |
| D2 Where it runs | (a) A `verify` step on every PR with deterministic generation. (b) A separate nightly workflow. (c) Both | (a) | (a), 'approve all as recommended' (2026-10-08) |
| D3 Test-control pass | (a) Included, last, with latency excluded. (b) Excluded | (a) | (a), 'approve all as recommended' (2026-10-08) |

## Outcome

[Appended after delivery.]
