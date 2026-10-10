---
version: 1
created: 2026-10-10T11:24Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-28
status: approved
approved: "2026-10-10, Gary Brooks, 'approve all as recommended' and 'Do the specification PR first, then the code PR'; merge authority: per pull request, on request"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-28, contract v16, `DetailUpdate` per field

**History of this plan.** Presented in full to the owner on 2026-10-10, as the third of the owner's five requests that day, then approved with all decisions as recommended. The same reply decided decision brief 10 (DR-058), which schedules this item before Phase 4.

**Goal.** Type the request body of `PATCH /accounts/{accountId}/details` per field, so the edge, the generated client and Schemathesis see the real shapes. It serves brief 10 D3 and closes the one Schemathesis probe that went undetected in CDS-23 (a 500 on the details edit for `apr` over 50).

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| `DetailUpdate.value` is `{}` (any JSON). The route reads `field` and `value` itself and answers 400 for the wrong kind of JSON, 422 `out-of-range` for a value outside BR-14, and treats a missing `value` as a clear | The contract cannot tell a generator which values go with which field, so Schemathesis seldom pairs `apr` with a number large enough to reach a rule |
| `operations-cases.md` section 3 fixes the readings: `"cheque"` for `paymentMethod` is 422, a non-whole `promoPeriodMonths` is 422 (BR-14 library), a clear is `null` | The new types must be by **kind**, not by range or enum, or those 422s would become 400s. Ranges stay business rules |
| The response schema `AccountDetails` already types each field (`apr`, `interestRate` numbers; `promoPeriodMonths` integer; `minPayment` object; `paymentMethod` enum) | The request keeps the same kinds but a looser value: number for `promoPeriodMonths`, string for `paymentMethod` |
| `minPayment` carries exactly one of `amount` (Money) or `percent`; the route returns 400 for both or neither | Expressible in the contract as a `oneOf` over `required`, so the edge takes over that 400 |
| The C# types are generated from the contract (`tools/generate-service-contract.mjs`), the typed client likewise (`packages/api-client`); both have drift checks in `verify` | The contract change must come with regenerated files in the same pull request, or CI fails |
| The harness `account-details` outline sends `{ field: interestRate, value: <number> }` | It stays valid; the harness must stay green |

## Steps

Specification first. Two pull requests.

**Pull request 1, the specification (and what must regenerate with it):**

1. `DOCS/.design/operations-cases.md`: rows for the new 400s (a wrong kind per field; a missing `value`; an unknown field) and for the reading that a missing `value` is no longer a clear (it is 400; a clear is `value: null`).
2. `DOCS/.design/api-specification.md` v23: section 6.3 states the per-field body.
3. `DOCS/.architecture/openapi.yaml` v16 (`info.version` 0.9.3): `DetailUpdate` becomes a `oneOf` of five objects, each with `field` as a one-value enum and `value`:
   - `apr`, `interestRate`, `promoPeriodMonths`: `type: [number, 'null']` (no range: BR-14 owns it, and a non-whole month is 422);
   - `minPayment`: `type: [object, 'null']`, `additionalProperties: false`, `amount` (Money) or `percent` (a number), exactly one (`oneOf` over `required`);
   - `paymentMethod`: `type: [string, 'null']` (the two allowed values stay a 422 rule).
4. Regenerate the C# contract types and embedded contract (`npm run generate:service-contract`) and the typed client (`npm --prefix packages/api-client run generate`); fix only what the regeneration forces.
5. `DOCS/implementation-plans/_index.md` row; backlog entry link.

**Pull request 2, the code:**

6. Service: the edge now rejects the wrong kind, a missing `value` and an unknown field before the route; the route's own kind checks stay only where the contract cannot say them (a `minPayment` amount that is not valid money), and the missing-value-as-clear path is removed.
7. Tests: one per field and per wrong kind; the 422 readings re-asserted; a missing `value` is 400.
8. `schemathesis.toml`: the details-edit operation may answer 422 for schema-valid data (a number outside BR-14); the 400 allowance for schema-valid data is removed. Re-run, ten times in a row.
9. Records: DR entry if a decision is made, backlog, CHANGELOG, plan Outcome, implementation log.

## Verification

- `npm run verify` passes 14 of 14 locally and in each pull request's own CI run, with counts and durations reported as measured.
- Redocly lint clean; `check:client` and `check:service-contract` current after regeneration.
- Probes that must fail, reverted afterwards: the details-edit 500 that went undetected in CDS-23 (an `apr` over 50 raising a 500) must now be caught by Schemathesis; the route accepting a wrong kind of value (bypassing the edge) must turn a service test red; the harness `account-details` outline must stay green.

## Delivery

- Branches: `claude/cds-28-spec`, then `claude/cds-28-code`.
- Merge only on the owner's authority and each pull request's own CI run reporting success; pull request 2 merges after 1.
- Estimate (mine, not measured): about 0.75 session.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Typing | (a) By kind only; ranges, the two-value method and whole-number months stay BR-14 (422). (b) Also enum, range and integer in the contract, so those become 400 | (a) | (a), taken as covered by 'approve all as recommended' (2026-10-10); this choice was in the presented design ("ranges stay business rules") but not listed as a decision, so it is flagged for confirmation in the pull request |
| D2 Delivery | (a) Specification pull request, then code pull request. (b) One pull request | (a) | (a), 'Do the specification PR first, then the code PR' (2026-10-10) |
| D3 A missing `value` | (a) 400, a clear is `value: null`. (b) Keep it as a clear | (a) | (a), taken as covered by 'approve all as recommended' (2026-10-10); this behaviour change was not in the presented plan and is flagged for confirmation in the pull request |

## Outcome

[Appended after delivery.]
