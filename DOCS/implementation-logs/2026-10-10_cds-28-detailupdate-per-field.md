# CDS-28: contract v16, `DetailUpdate` typed per field — 2026-10-10

## Session Summary

The request body of `PATCH /accounts/{accountId}/details` is now typed per field by kind in the contract (v16, `info.version` 0.9.3), so the edge, the generated client and Schemathesis see the real shapes. Typing it let Schemathesis find a real service bug (a number that rounds to zero was accepted and stored as sent) and, once in-range examples were added, catch the details-edit 500 that went undetected in CDS-23. The work is a specification pull request (#54) and a code pull request; both were open and unmerged when this log was written.

---

## Objectives

1. ✅ `DetailUpdate` is a `oneOf` by field, typed by kind; ranges, the two payment methods and whole months stay BR-14 (422).
2. ✅ The C# contract types and the typed client are regenerated and their drift checks pass.
3. ✅ The details-edit 500 probe from CDS-23 is now caught by Schemathesis.
4. ✅ `npm run verify` 14 of 14 and ten consecutive Schemathesis runs.
5. ⏸️ Merge of #54 and the code pull request: awaits the owner's word and each pull request's own CI run.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Service | `CreditDashboard.Api.Tests` | 298/298 | 309/309, 44 s | ✅ PASS |
| Rules | `CreditDashboard.BusinessRules.Tests` | 234/234 | 234/234, 666 ms | ✅ PASS |
| Property-based | `node tools/schemathesis-run.mjs`, ten runs in a row | n/a | 10 of 10 passed | ✅ PASS |
| Harness | `@api` scenarios (inside `verify`) | 58/58 | 58/58, 13.2 s | ✅ PASS |
| Local | `npm run verify` | 14/14 | 14/14, steps sum to 201.7 s (this machine was busier than at CDS-22) | ✅ PASS |
| Audit | `npm audit --omit=dev` | 0 | 0 vulnerabilities | ✅ PASS |
| CI | the specification pull request's own run (#54) | n/a | not read when this log was written | ⏸️ see the pull request |

**Probes (each expected to fail, each reverted):**

| Probe | Result |
|---|---|
| `apr` over 50 raises a 500, contract typed by kind only | **Not caught**: Schemathesis rarely generates a number in 50 to 100 for an untyped range (exit 0) |
| The same, after in-range `examples` were added to the typed values | Caught: `Server error ... {"value": 75, "field": "apr"}` (exit 1) |
| The old untyped `DetailUpdate` put back in the embedded contract | 10 service tests failed (every wrong-kind 400 test) |

---

## Changes Implemented

### Specification (#54)

**Files changed:**
- `DOCS/.architecture/openapi.yaml` v16: `DetailUpdate` becomes a `oneOf` of `RateUpdate` (`apr`, `interestRate`), `PromoPeriodUpdate`, `MinPaymentUpdate` (an object, exactly one of `amount` or `percent`, no extra properties) and `PaymentMethodUpdate`. Values are typed by kind (a number or null; a string or null), not by range or enum, so out-of-range stays 422 and is not turned into a 400. Each has in-range `examples`.
- `DOCS/.design/api-specification.md` v23 section 6.3; `DOCS/.design/operations-cases.md` section 3 rows; `DOCS/implementation-plans/2026-10-10_cds-28-detailupdate-per-field.md` and its index row.
- Regenerated: `Contract/Contract.g.cs`, `Contract/contract.json`, `packages/api-client/src/generated/schema.d.ts`.

### Service and tests (code pull request)

**Files changed:**
- `demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Routes/Accounts.cs`: `Validate` no longer has an `error` out parameter, because the edge now refuses the wrong kind, an unknown field and a minimum payment with both or neither of amount and percent. A number a decimal cannot hold, or one that is not zero but rounds to zero, is 422 `out-of-range` (`Number`).
- `CreditDashboard.Api.Tests/AccountTests.cs`: 11 new cases (7 wrong-kind 400s; 4 out-of-range 422s including 1e300 and 1e-130).
- `schemathesis.toml`: the 400 allowance for schema-valid data on the details edit is removed.

```text
Before: Number accepted 4.56e-124 for promoPeriodMonths (decimal rounds it to 0), stored it as sent, and the 200 response broke the response schema ("integer").
After:  a number that is not zero but rounds to zero is 422 out-of-range.
```

---

## Technical Decisions

No structural decision, so no new register entry: it carries out brief 10 D3 (DR-058).

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Type by kind only (D1) | Keeps every documented status: `"cheque"` and 12.5 months stay 422 | Also enum, range and integer in the contract (they would become 400) |
| In-range `examples` on the typed values | A generator without a range finds the 50 to 100 band by luck; the examples run the in-range path every time | A `minimum` and `maximum` (turns out-of-range into 400) |
| A specification pull request, then the code | The contract change must regenerate the C# and client in the same pull request or CI fails | One combined pull request |
| Number that rounds to zero is 422 | Stored as sent it would break the whole-number or two-decimal rule | Store the rounded value (changes what the customer sent) |

---

## Documentation Updates

`DOCS/.design/api-specification.md` (v23), `DOCS/.design/operations-cases.md`, `DOCS/implementation-plans/` (the plan, its index and Outcome), `DOCS/backlog.md` (v47, CDS-28 Done), `CHANGELOG.md`, this log. The plan, the cases and the first pull request text said a missing `value` was a clear before v16; it was already a 400 (`value` was required). All three were corrected before merge.

---

## Lessons Learned

- **A probe that cannot fail proves nothing, again.** The first details-edit probe still passed after typing the body, because a generator cannot find a narrow valid band without being told. Typing by kind was necessary but not sufficient; in-range examples made the difference.
- **Typing the contract is a fuzzing aid as well as documentation.** The first run after typing found a real stored-value bug (1e-130 as months) within seconds.
- **Check a claim in a plan against the code before writing it.** "A missing value was a clear" was written from memory; an existing test said otherwise.
- **Stacked pull requests** need the base branch named (`gh pr create --base`), after which GitHub retargets when the base merges.
- **Do not edit a contract on the code branch.** A contract change belongs in the specification pull request with its regenerated files; the in-range examples were moved there.

---

## Recommendations / Next Steps

- [ ] Merge #53 (brief 10, DR-058), then #54, then the code pull request, each on its own CI run and the owner's word.
- [ ] CDS-24 (remaining review Notes), the other item brief 10 D3 puts before Phase 4.
- [ ] CDS-29: the Phase 4 plan with a spike.
- [ ] Update the registry label, the landing card and the capability matrix to "Phase 3 gate recorded" once #53 merges.

---

*Session logged: 2026-10-10. Author: Claude Code.*
