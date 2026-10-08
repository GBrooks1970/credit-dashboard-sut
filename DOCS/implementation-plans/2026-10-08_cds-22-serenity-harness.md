---
version: 1
created: 2026-10-08T12:59Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-22
status: approved
approved: "2026-10-08, Gary Brooks, 'approve all as recommended' (decisions D1 to D5); merge authority: per pull request, on request"
delivered: not yet
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

[Appended after delivery.]
