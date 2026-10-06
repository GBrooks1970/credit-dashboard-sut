---
version: 1
created: 2026-10-05T23:47Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-14
status: implemented
approved: 2026-10-06, Gary Brooks; merge authorised once CI is green
delivered: "#3, squash ed63834 (2026-10-06); registry follow-up NeoCognitus70/portfolio-prompts#110, e09032f"
language: en-GB
---

# Implementation plan: CDS-14, Prism mock serves every operation

**How this file came about.** The plan was presented in the working session at 2026-10-05T23:47Z and approved by the owner before any implementation. It was written to this file on 2026-10-06 at 09:43Z, after delivery, when the owner asked for every plan to be recorded (DR-041). The plan below is the plan as presented; only its formatting changed. The Outcome section is new.

**Goal.** Meet the Phase 1 exit gate: lint clean (done), every example valid (done), the mock serves every operation (this item).

## Evidence gathered before planning

Spike evidence from throwaway runs in the session scratchpad, with Prism 5.16.0 (the current release, published 17 July 2026). Nothing in the repository changed, and no Prism process was left running.

| Finding | Consequence for the plan |
|---|---|
| Prism loads the OpenAPI 3.1 contract with no warnings, serves the examples (including nullable fields and `greetingName`), returns 401 without a token, and validates request bodies and patterns | Prism suits this contract as it is |
| **Prism ignores the `/api/v1` base path**: every prefixed call got 404; unprefixed calls work | The contract's mock server URL `localhost:4010/api/v1` is wrong for the mock (decision 1) |
| Invalid requests get **422** (with our rule-violation example), although the error catalogue says malformed requests are **400** | A known mock limitation: the mock checks shape, not status semantics. Recorded in the specification; Phase 3 tests the real service |
| A path ID failing its pattern (`/accounts/anything`) gets 422; `acc_7f3k2q` gets 200 | The smoke run needs valid IDs, but `accountId`, `notificationId` and `username` have no contract examples |
| Started through `npx` with a shell, Prism kept running after the script exited | The smoke tool starts Prism with `node` from a local install and always stops it |

Contract survey: 36 operations; 28 need a bearer token, 7 are test control needing a key, 1 is public (login); 14 take a request body; no operation documents more than one 2xx.

## Steps

1. **Contract v9** (`info.version` 0.6.2, additive): examples on the `AccountId` (`acc_7f3k2q`), `NotificationId` (`ntf_3q9w1`) and `Username` (`alex`) parameters, taken from existing examples; the Prism server entry corrected per decision 1.
2. **API specification v9:** section 3 records the mock (Prism 5.16.0, pinned under DR-009); section 11's "Mock parity" row states the command, what the smoke run proves, and the two known gaps (422 instead of 400 for malformed requests; 401 instead of the contract's 404 when the test-control key is missing).
3. **Tooling:** a root `package.json` (private) with exact pins (`@stoplight/prism-cli` 5.16.0; `ajv` 8.20.0, `ajv-formats` 3.0.1 and `yaml` 2.9.1, the same as `fixtures/`), scripts `mock` (Prism on port 4010) and `check:mock`. `tools/mock-smoke.mjs` starts Prism with `--errors` (a response that breaks the contract fails), calls all 36 operations with path, query and body values from the contract plus a token or test-control key as needed, expects each operation's documented 2xx and no contract violation, validates each response body independently with Ajv, checks one negative (no token gets 401), prints a per-operation summary, and always stops Prism, also on failure.
4. **CI:** a fourth step, "Mock smoke", in the existing job: `npm ci && npm run check:mock`.
5. **Docs:** README "Checks" gains the fourth command; CHANGELOG; backlog v22 (CDS-14 complete, with the evidence).

## Verification

Smoke run 36 of 36 locally. Probe 1: plant an example that breaks its schema; the smoke run must fail, then the file is restored byte for byte. Probe 2: port 4010 is free after a passing and a failing run. The three existing checks stay green, and CI is green on the PR.

## Delivery

Branch `claude/cds14-prism-mock`, commit, push, PR. Follow-up, by decision 3: a `portfolio-prompts` registry PR.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| 1. The mock's address, since Prism serves no `/api/v1` prefix | Mock at `localhost:4010`, no prefix; a proxy that strips the prefix; drop `/api/v1` everywhere | Mock at `localhost:4010`, no prefix | As recommended (2026-10-06), recorded as DR-039 |
| 2. How superseded specification versions are kept, now paths are stable | Edit in place, git keeps history; copies in `DOCS/.design/superseded/` | Edit in place | As recommended (2026-10-06), recorded as DR-040 |
| 3. Registry follow-up once the Phase 1 exit gate is met | Add the gate, keep orchestration off; add the gate and turn orchestration on; no change | Add the gate, keep orchestration off | As recommended (2026-10-06) |
| 4. Approval | Approve and implement; approve and merge when CI is green; change the plan | (owner's call) | Approve, and merge when CI is green (2026-10-06) |

## Outcome

Delivered as planned in #3 (squash `ed63834`, CI run 37441204003 green, 22 s for the job): 36 of 36 operations, 401 without a token; the planted-defect probe failed exactly `GET /me`; port 4010 free after passing and failing runs. Registry follow-up in NeoCognitus70/portfolio-prompts#110 (`e09032f`).

Differences from the plan:

- **Tool fix during implementation.** The first run passed 35 of 36: the smoke tool did not follow the `$ref` from the `type` query parameter of `getAccountTotals` to the `AccountType` enum. Fixed in the tool; the contract was right.
- **Housekeeping.** The decision register's stale `supersedes` line (it named v5) was corrected in the same change.

Full record: [`DOCS/implementation-logs/2026-10-06_cds-14-prism-mock.md`](../implementation-logs/2026-10-06_cds-14-prism-mock.md).
