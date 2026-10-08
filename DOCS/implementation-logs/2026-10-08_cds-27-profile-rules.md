# CDS-27: profile rules library — 2026-10-08

## Session Summary

The profile rules the API enforces are pure functions with tagged tests (DR-054).

- **Specification first.** The case tables, API specification v17 and My Profile specification v7 were merged with the plan (#29, squash `3dfdcaa`); the owner merged them without amending the six Readings.
- **Delivered** in #30 (squash `4f04d7a`): `Profile/` in `CreditDashboard.BusinessRules`, 75 new tests (234 in all) and an extended traceability gate.
- **Not yet built:** nothing serves these rules; CDS-25 wires them to the profile operations.

---

## Objectives

1. ✅ Case tables before code (66 rows for PR-02 to PR-11).
2. ✅ Pure functions: no state, the instant supplied by the caller.
3. ✅ Every PR rule the API enforces has a tagged test, enforced by a test; PR-01, 05 and 08 are exempt with reasons.
4. ✅ The CDS-24 Note F-15 (PR-06 and spaces) closed.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Rules | `CreditDashboard.BusinessRules.Tests` | 159/159 | 234/234, 292 ms | ✅ PASS |
| Service | `CreditDashboard.Api.Tests` | 16/16 | 16/16 | ✅ PASS |
| CI | GitHub Actions run 37709106361 (PR #30) | 11 steps | 11 steps, job 40 s | ✅ PASS |

**Composition.** 75 new tests: 70 profile tests and 5 more traceability tests than before (8 in all). Tests per rule against case rows: PR-02 16/16, PR-03 4/4, PR-04 6/6, PR-06 13/13, PR-07 4/4, PR-09 12/8, PR-10 6/6, PR-11 9/9.

**Probes (each expected to fail):**
1. **The PR-09 tags removed:** the first attempt did not fail, because the edit removed only tags on their own line and missed `[Test, Category("PR-09")]`. Redone with both forms removed: `Every_profile_rule_the_api_enforces_has_a_tagged_test` failed with `But was: < "PR-09" >`. Restored.
2. **Resend interval 60 to 61 seconds:** the boundary test and two retry-after tests failed (the output was cut at six lines, so the full count was not read). Restored.
3. **Code lifetime 10 to 11 minutes:** the expiry boundary, the expired-wrong-code test and the expiry-time test failed (the output was cut at six lines, so the full count was not read). Restored.
4. **Hyphens accepted in a mobile number:** `A_number_that_is_not_a_uk_mobile_is_refused("07700-900456")` failed. Restored.

---

## Changes Implemented

`CreditDashboard.BusinessRules/Profile/`: `PreferredName.cs` (PR-02, PR-03), `Email.cs` (PR-04, PR-09), `Mobile.cs` (PR-06, PR-07, PR-10, PR-11, and the finances tile). `CreditDashboard.BusinessRules.Tests/ProfileTests.cs`, and `TraceabilityTests.cs` extended to read the rules in the My Profile specification. DR-054.

---

## Technical Decisions

The structural decision is **DR-054**.

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Spaces ignored in a mobile number, hyphens not (owner) | What the review Note and the existing scenario need | Hyphens too; no separators |
| The existing library and test project (owner) | One gate, one place for rules | A second project |
| PR-03 and PR-07 included (owner) | The API supplies them | Leaving them to CDS-25 |
| The functions hold no state | The service stores the challenge and the last-sent instant; the rules decide | A stateful rule object |
| `FinancesTile` has one field | No figure can ride in the type (PR-07) | A tile carrying amounts |
| The third wrong code is `Invalid` with no attempts | Specification section 8; contract v11 | The stray example with `attemptsRemaining: 0` |

---

## Lessons Learned

- **A probe that cannot fail proves nothing.** The first tag-removal probe passed because it removed a subset of the tags; check that the thing being probed is gone before reading the result.
- **Decide the stale text while writing the cases.** The `code-invalid` example contradicted section 8 in two places (the example and a schema description); the cases forced both to be found.

---

## Recommendations / Next Steps

- [ ] CDS-25 reads these functions for the profile operations; the challenge and the last-sent instant are state the service must keep per user.
- [ ] Revisit the six Readings (case-insensitive email, first word as the legal first name, and the others) if the UI work meets a case they do not fit.

---

*Session logged: 2026-10-08. Author: Claude Code.*
