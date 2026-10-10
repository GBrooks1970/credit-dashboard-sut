---
version: 1
created: 2026-10-08T12:59Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-22
status: implemented
approved: "2026-10-08, Gary Brooks, 'approve all as recommended' (decisions D1 to D5); merge authority: per pull request, on request"
delivered: "#47 (design note, glossary v8), squash 920441e; #48 (H1), 2b919b9; #49 (H2), beda9c4; #50 (H3), c772b8d; H4 and the records in one pull request"
language: en-GB
---

# Implementation plan: CDS-22, the Serenity/JS harness

**History of this plan.** Presented in full to the owner at 12:59Z on 2026-10-08 (clock read at 12:59:40Z), after a read-only spike, together with the CDS-23 plan. Approved with all decisions as recommended, then written to this file. CDS-23 is delivered first.

**Goal.** Run the `@api` and `@security @api` scenarios green against the service, with every response validated against the contract at run time (DR-006, DR-042). This is the second Phase 3 exit gate condition.

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| 12 feature files are `@api`: ten under `features-shared/api/` (28 scenarios and outlines) and two `@security @api` (3). `open-redirect` is `@security @ui` and waits for Phase 4 | Scope is 31 scenarios and outlines; the number of executions after outlines expand is counted in the first slice |
| The files use 92 distinct step patterns (130 step lines); `DOCS/step-glossary.md` says how each is arranged (test control, fixture, overrides, environment) | Step definitions follow the glossary; any ambiguous pattern is fixed in the glossary first |
| `loan-origination-parity/test-harnesses/harness-serenity` is a standalone package with its own lock, arrange/act/assert step files and a `cucumber.mjs` with profiles; its pins were Serenity/JS 3.48.0, Cucumber 13.2.1, tsx 4.23.15, TypeScript 6.0.3. npm now has Serenity/JS 3.48.1 and Cucumber 13.3.0 | Follow that layout (D1); versions verified in the first slice (D5) |
| DR-042: the harness has its own `CallAnApi` ability, requests built from the contract and fixtures, every response validated against the contract; it imports neither the generated types nor `openapi-fetch` | D2 |
| A token expires when the controlled clock passes it (CDS-25); "Test control is switched off" needs a second service instance without `TEST_CONTROL` | The harness signs in after moving the clock, and manages a second instance (D3) |

## Steps

Specification first. Delivered as a specification pull request and four slices, each its own pull request.

1. **Specification PR.** A harness design note (`DOCS/.design/harness-design.md`): layout, abilities, the order of arrange, act and assert, how the contract validates responses, the service lifecycle, the clock-and-token rule, and where each glossary pattern lands; the glossary corrected where a pattern is ambiguous.
2. **H1 foundation.** `test-harnesses/harness-serenity/` (own `package.json` and lock); pins; `CallAnApi` (a thin ability on `fetch` that validates each response against the contract's schemas with Ajv, built from the contract by operation and status); `ControlTheTestEnvironment` (the `/__test/*` operations); the actor, persona, token and clock plumbing; a runner that builds, starts and stops the service; `cucumber.mjs` profiles; the first feature green (`score`); the executions count.
3. **H2 arrange and act steps.** Every Given and When pattern.
4. **H3 assert steps.** Every Then pattern; all `api/*` features green.
5. **H4 security, gate, records.** The two `@security @api` features, including the second service instance without test control; a 13th `verify` step; DR-057, README 'Checks', backlog, Kanban, the plan Outcome, an implementation log.

## Verification

- All 31 scenarios and outlines pass, locally and in each pull request's own CI run, with counts and durations reported as measured.
- Probes that must fail, reverted afterwards: a service rule broken so its scenario goes red for the stated reason; a response key removed so contract validation fails; the sign-in-after-clock rule ignored.
- `npm run verify` passes, including the new step.

## Delivery

- Branches: `claude/cds-22-spec`, then `claude/cds-22-h1-foundation`, `-h2-arrange-act`, `-h3-assert`, `-h4-security`, then `claude/cds-22-records`.
- Merge only on the owner's authority and each pull request's own CI run reporting success. The slices touch the same harness files, so they merge in order.
- Estimates (mine, not measured): specification 0.3 session, H1 0.75, H2 0.75, H3 0.75, H4 0.5: about 3 sessions.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Layout | (a) `test-harnesses/harness-serenity/`, a standalone package with its own lock. (b) A root-level `harness/` | (a) | (a), 'approve all as recommended' (2026-10-08) |
| D2 The `CallAnApi` ability | (a) A thin custom ability on `fetch`, validating each response. (b) Serenity's `@serenity-js/rest` `CallAnApi` plus a validator | (a) | (a), 'approve all as recommended' (2026-10-08) |
| D3 Service lifecycle | (a) The runner starts and stops the service itself, and a second instance for the "off" scenario. (b) Expect a running service | (a) | (a), 'approve all as recommended' (2026-10-08) |
| D4 CI placement | (a) A step in `verify`. (b) A separate job | (a) | (a), 'approve all as recommended' (2026-10-08) |
| D5 Versions | (a) Serenity/JS 3.48.1, Cucumber 13.3.0, tsx 4.23.15, TypeScript chosen in H1 by what Serenity supports. (b) The reference project's exact pins | (a) | (a), 'approve all as recommended' (2026-10-08) |

## Outcome

Delivered as planned, in a specification pull request and four slices.

- **#47** (`920441e`, CI run 37921798367, 105 s): `DOCS/.design/harness-design.md` and glossary v8.
- **#48** (`2b919b9`, run 38009903581, 84 s): H1, the package, abilities, contract validation, runner; the `score` feature green.
- **#49** (`beda9c4`, run 38043754517, 99 s): H2, every Given and When; glossary v9.
- **#50** (`c772b8d`, run 38044905781, 94 s): H3, every Then but three; glossary v10; 57 of 58 scenarios passed.
- **H4 (this records pull request):** the second service instance, the three test-control-off steps, the `@no-test-control` tag, the harness as the 13th check, DR-057 and the records.
- **Local, on `main` with H4:** the full `verify` passed 14 of 14 (137.7 s; the install of the harness 24.9 s, the harness step 13.5 s); 58 scenarios passed; 298 service tests and 234 rule tests; `npm audit --omit=dev` 0 vulnerabilities.

Probes that had to fail, and did (each reverted): a required key added to the contract's `Score` schema; BR-02 carried forward (H1). A Given the persona does not hold; an override sample over the wrong persona (H2). BR-03 truncation (1 failed, 9 broken), BR-11 oldest first (3 of 3), BR-14 range 101 (1 broken, by contract validation), BR-09 mask leak (2 broken) (H3). The clock-and-token rule ignored (a scratch scenario that signs in, moves the clock a day and asks again: 401 instead of 200); test control not actually off (`Expected 404, got 204`) (H4).

Differences from the plan:

- **`verify` has 14 steps, not 13:** the plan counted the harness as one step; its install is a second.
- **Serenity/JS 3.48.2, not 3.48.1** (the current release, same line). TypeScript 6.0.3 (7.0.2 was not tried).
- **One Then makes a call** (`the code 123456 is no longer accepted`), an exception to the plan's order of arrange, act and assert, recorded in the design note and glossary v10.
- **An optional `at {time}` is two definitions** and spaced parameter-type names are camel case, both because Cucumber requires it (glossary v9, v10).
- **The expired-token scenario passed from H3.** The clock-and-token rule is shown by a scratch scenario because no committed scenario moves the clock forward after a sign-in; adding one would be a scenario change for the owner.
- **`npm audit` in the harness package** reports 7 high packages from one advisory (`braces` via `fast-glob` inside `@serenity-js/core`); development-only, fix offered is a downgrade, recorded and left.

Full record: [`DOCS/implementation-logs/2026-10-10_cds-22-serenity-harness.md`](../implementation-logs/2026-10-10_cds-22-serenity-harness.md).
