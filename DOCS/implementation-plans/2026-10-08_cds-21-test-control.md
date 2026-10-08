---
version: 1
created: 2026-10-08T00:24Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-21
status: approved
approved: "2026-10-08, Gary Brooks, 'all as recommended' (decisions D1 to D4); merge authority: per PR, on request, after its own CI run reports success"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-21, test-control endpoints

**History of this plan.** Presented in full to the owner at 00:24Z on 2026-10-08 (clock read at 00:24:23Z), after read-only evidence gathering, together with the CDS-27 plan. Approved with all decisions as recommended, then written to this file. The records (decision-register entries, backlog, Kanban, README, CHANGELOG) for this item and CDS-27 go in one joint records PR after both are delivered, because both change the same lines.

**Goal.** Serve the seven `/__test/*` operations (reset, bind persona with overrides, bugs, clock, latency, state, verify-email) from an in-memory store loaded from the fixtures, gated by `TEST_CONTROL` and `X-Test-Control-Key` (DR-008, DR-020). One input to CDS-25; the harness (CDS-22) arranges every scenario through it.

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| The seven operations, their statuses (204, 400, 404, 422) and `PersonaOverrides` are in the contract; edge validation checks shape; the CDS-19 decision left security headers to the service | The gate is the service's job: 404 when disabled, or when the key is absent or wrong |
| The key's name and value are specified nowhere (only the header name) | D1 |
| `bugs` takes any string. API specification section 10 has 7 API flags, UI specification section 8 has 16 UI flags and the My Profile specification 7 more, all set through this endpoint | A typo would silently do nothing, and Phase 5 proves "each flag is caught". D2 |
| The overrides 422 covers BR-03/06, 05, 09, 13, 12 (window) and 15 (uniqueness); only the JS fixture check enforces these today | Port those checks to C# with the CDS-20 library (D4) |
| Fixtures are plain JSON in `fixtures/personas/` and `users.json` (users `alex`, `sam`) | The service needs them at run time (D3) |
| After a reset the clock follows real time until frozen; BR-08, 12 and 13 take a `DateOnly` | An `IControlledClock` supplies `now`; callers derive the UTC date |
| Latency is global; the persona behaviours (`latencyMs`, `failReportEndpoints`) belong to report endpoints | Global latency middleware here; persona behaviours in CDS-25 |

## Steps

Specification first. Delivered in two pull requests.

1. **Contract v11** (`info.version` 0.8.0) and **API specification v17** (section 6.5): a `BugFlag` enum of 30 flags used by `PUT /__test/bugs` and `GET /__test/state` (D2); the key, the order of checks, the state model, what reset clears. The generated client types and the service's contract types are regenerated. The stray `attemptsRemaining` is removed from the `code-invalid` example.
2. **Store** `PersonaStore` in `CreditDashboard.Api/Control/`: immutable loaded personas and users; per-user binding and overrides; flags; clock; latency; verified-email set; one lock; no statics. Fixtures are copied into the build output (D3).
3. **Gate middleware** after edge validation. A service started with `TEST_CONTROL=true` and no `TEST_CONTROL_KEY` refuses to start (D1); the development launch profile sets the synthetic value `demo-only`.
4. **The seven handlers** in `Routes/TestControl.cs`. Overrides are validated by a C# port of the fixture check's rules over the CDS-20 library (D4), one 422 outcome per rule.
5. **Latency middleware** for every request except `/__test/*`.
6. **Tests** (`CreditDashboard.Api.Tests`): the gate (off, no key, wrong key, right key; the 404 body validates against the contract's `Problem`); each operation; one test per overrides rule; reset clears every part of the state; an unknown bug flag is a 400; state reflects each change; derived values are recomputed after overrides. The coverage test's pending list drops by seven (36 to 29).
7. **Records** in the joint records PR with CDS-27: DR-053, backlog, README, CHANGELOG, Kanban, plan Outcome, implementation log.

## Verification

- `npm run verify` passes 11 of 11 locally (with the mock port free) and in each PR's own CI run; test counts and durations are reported as measured.
- **Probes that must fail, each in a scratch copy or reverted:** the gate removed (test-control answers without a key); one overrides rule disabled (its 422 test fails); one of the seven left in the pending list (the coverage test fails, naming it); a bug flag outside the enum (400).

## Delivery

- **PR 1** (`claude/cds-21-27-plans-spec`): both plans, the case tables for CDS-27, contract v11 and its regenerated artefacts, API specification v17, My Profile specification v7. Specification only; no service code.
- **PR 2** (`claude/cds-21-test-control`): steps 2 to 6.
- Merge only on the owner's authority and each PR's own CI run reporting success.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 The control key | (a) env `TEST_CONTROL_KEY`; refuse to start with `TEST_CONTROL=true` and no key; dev launch profile uses `demo-only`. (b) A built-in default key. (c) Any non-empty header | (a) | (a), 'all as recommended' (2026-10-08) |
| D2 Unknown bug-flag names | (a) Accept any string. (b) Reject with 400 from a service-side list. (c) A contract enum `BugFlag` (contract v11) | (c) | (c), 'all as recommended' (2026-10-08) |
| D3 Getting the fixtures into the service | (a) Copy `fixtures/` into the build output. (b) Embed as resources. (c) Read from the repository path | (a) | (a), 'all as recommended' (2026-10-08) |
| D4 Overrides consistency checks | (a) In CDS-21, in C#, using the library. (b) Defer the 422 to CDS-25 | (a) | (a), 'all as recommended' (2026-10-08) |

## Outcome

[Appended after delivery.]
