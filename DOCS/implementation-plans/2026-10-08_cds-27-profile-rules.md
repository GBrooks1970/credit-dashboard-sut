---
version: 1
created: 2026-10-08T00:24Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-27
status: approved
approved: "2026-10-08, Gary Brooks, 'all as recommended' (decisions D1 to D3); merge authority: per PR, on request, after its own CI run reports success"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-27, profile rules library

**History of this plan.** Presented in full to the owner at 00:24Z on 2026-10-08 (clock read at 00:24:23Z), together with the CDS-21 plan, and approved with all decisions as recommended. The records go in one joint records PR with CDS-21.

**Goal.** The profile rules the API enforces, as pure functions with NUnit tests tagged by PR ID, in the CDS-20 pattern, so CDS-25's profile operations only wire them. It also absorbs review Note F-15 (PR-06 and spaces) from CDS-24.

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| API specification 6.6 says the API enforces PR-01, 02, 04, 06, 07 and 09 to 11, supplies PR-03's greeting, and keeps PR-08 by design | In scope: PR-02, 03, 04, 06, 07, 09, 10, 11. PR-01 and PR-08 are design facts held by the contract coverage test. PR-05 is stretch (DR-022) |
| Review Note F-15: PR-06 does not say whether spaces are accepted, though the scenario `07700 900456` is accepted. CDS-24 holds it | Absorbed here (D1) |
| The contract's `code-invalid` example carries `attemptsRemaining: 0`; specification section 8 says only `code-wrong` carries it | Settled in contract v11 and specification v17: it carries none |
| PR-09 (60 seconds) and PR-10 (less than 10 minutes) run on the controlled clock | The functions take a `DateTimeOffset now`; the library has no clock |
| The code is always `123456` (DR-025); the third wrong code voids the challenge (DR-026) | Wrong 1 gives 2 attempts remaining, wrong 2 gives 1, wrong 3 gives `code-invalid` |

## Steps

Specification first. Delivered in two pull requests.

1. **Case tables** `DOCS/.design/profile-rules-cases.md`: per rule, inputs, outputs and every boundary row, with Readings marked.
2. **Specification:** API specification v17 (PR-06 and `code-invalid` text, test-control and profile rows in section 11) and My Profile specification v7 (PR-06 says spaces are ignored). Both are in PR 1 with the CDS-21 specification.
3. **Library**, in a `Profile/` folder of `CreditDashboard.BusinessRules`: preferred-name validation (trim, then PR-02); the greeting (PR-03); email change and no-op (PR-04); resend (PR-09, with a retry-after in seconds); mobile normalisation (PR-06); the challenge (PR-10, PR-11); tile summaries (PR-07). Pure, no state held; outcome types.
4. **Tests** in `CreditDashboard.BusinessRules.Tests`, each tagged `[Category("PR-nn")]`. The traceability test is extended: every PR ID the API enforces has a tagged test, and PR-01, PR-05 and PR-08 are declared exempt with their reasons.
5. **Records** in the joint records PR with CDS-21: DR-054, backlog (CDS-27 Done; CDS-24 loses the F-15 piece), README, CHANGELOG, Kanban, plan Outcome, implementation log.

## Verification

- `npm run verify` passes 11 of 11 in CI and locally with the mock port free; test counts and durations are reported as measured.
- **Probes that must fail:** a removed PR tag (the gate names it); the resend boundary moved from 60 to 61 seconds, and the expiry from 10 minutes to 11 (their boundary tests fail); a hyphen accepted in a number (the PR-06 test fails).
- Case rows against tests: both numbers stated.

## Delivery

- **PR 1** is shared with CDS-21 (see its plan): the case tables, specification v17 and My Profile specification v7.
- **PR 2** (`claude/cds-27-profile-rules`): steps 3 and 4.
- Merge only on the owner's authority and each PR's own CI run reporting success.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Separators in a mobile number | (a) Ignore spaces only. (b) Ignore spaces and hyphens. (c) None | (a) | (a), 'all as recommended' (2026-10-08) |
| D2 Where it lives | (a) The existing library and test project. (b) A second library project | (a) | (a), 'all as recommended' (2026-10-08) |
| D3 PR-03 greeting and PR-07 summaries in scope | (a) Yes. (b) Leave to CDS-25 | (a) | (a), 'all as recommended' (2026-10-08) |

## Outcome

[Appended after delivery.]
