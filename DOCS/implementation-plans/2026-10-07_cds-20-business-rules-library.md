---
version: 1
created: 2026-10-07T19:19Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-20
status: approved
approved: "2026-10-07, Gary Brooks, 'all as recommended' (decisions D1 to D4 as recommended); merge authority: not yet given"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-20, business-rules library with NUnit tests tagged by BR ID

**History of this plan.** Presented in full to the owner at 19:19Z on 2026-10-07 (clock read at 19:19:23Z), after read-only evidence gathering. Approved with all four decisions as recommended, then written to this file. The body is as presented; the three Readings in the case tables were added when the cases were written (step 1) and are open to correction at review.

**Goal.** Build the BR-01 to BR-15 rules (API specification section 7) as a pure C# library with NUnit tests tagged by rule ID (DR-017). CDS-25 wires the library to the endpoints; the Phase 3 gate needs both. No operation is served here.

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| The solution has `CreditDashboard.Api` and `CreditDashboard.Api.Tests` only. DR-017 and specification section 3 say "a C# library inside the service, NUnit tests tagged by BR ID" | Add a library project and a test project to the same solution |
| The 28 fixture accounts store source data (utilisation, `sourceMask`, `missedMonths`, `balanceHistory`), and the JS fixture check already cross-checks the BR-03, 05, 06, 09, 11, 12 and 13 outputs | The library is tested against the fixtures as well as hand-written cases |
| `Contract.g.cs` is a generated 1,990-line set of data types | The library defines its own small types and takes no contract or ASP.NET dependency; CDS-25 does the mapping |
| Fixture `boundary` holds 1250/10000 giving 13, which confirms half up for positives. `drilldown` holds -4400/100000 giving a raw -4, which does not tell positive-infinity from away-from-zero rounding | A gap in BR-03 and BR-06 for exact negative halves: decision D2 |
| BR-08, BR-12 and BR-13 depend on the controlled clock, and the specification does not say which time zone defines "today". CDS-24 lists "clock time of day" as a Note | The library takes `DateOnly today`; the service supplies the UTC date of the controlled clock |
| The Phase 5 bug flags (`rounding-down`, `history-carry-forward`, `excluded-in-total`, `mask-format`, `idor`) break these rules on purpose | The library implements only the correct rules; flags are the service layer's, in Phase 5 |
| The `drilldown` fixture holds a malformed source mask `**10` giving `*0010`, and `ab3f` giving `*AB3F` | Both are BR-09 cases |

## Steps

Specification first. Delivered in two pull requests (see Delivery).

1. **Case tables.** `DOCS/.design/business-rules-cases.md`: per rule, inputs, output and every boundary row, from section 7, DR-011 to DR-014, DR-046 and the `@BR-*` scenarios. Each row becomes one test. Three **Readings** (a zero limit on a loan, a missing earlier balance, a non-ASCII letter in a mask) are marked for review. D2 is settled here.
2. **Specification v16.** `DOCS/.design/api-specification.md`: BR-03 states how half up rounds a negative value; section 3 'Business rules' row names the library and tests; section 11 gains 'Rule unit tests' and 'Rule traceability'.
3. **Library** `demo-apps/demoapp001-dotnet-api/CreditDashboard.BusinessRules/`: net10.0, `Nullable`, `TreatWarningsAsErrors`, no package references, no reference to `CreditDashboard.Api`. Pure static functions, integer arithmetic only, results as outcome types. Grouped by concern:
   - score and history (BR-01, BR-02);
   - utilisation (BR-03, BR-06);
   - totals and exclusions (BR-04, BR-05);
   - debt, trend and breakdown (BR-07);
   - refresh days (BR-08);
   - masking (BR-09);
   - feedback (BR-10);
   - change order and overview slice (BR-11);
   - payment-history months and years (BR-12);
   - closed-account listing (BR-13);
   - detail validation (BR-14);
   - ownership (BR-15).
4. **Test project** `CreditDashboard.BusinessRules.Tests/`: NUnit 5.0.0, NUnit3TestAdapter 6.3.0, Microsoft.NET.Test.Sdk 18.10.1 (the exact pins of `Api.Tests`), NuGet lock files committed. Each test carries `[Category("BR-nn")]`, so `dotnet test --filter Category=BR-03` works and the IDs match the Gherkin tags.
5. **Traceability gate.** One test reads the rule IDs from the section 7 table of the specification (found by walking up to the repository root) and reflects over the test assembly. It fails if a BR has no tagged test, or a `BR-` tag names a rule that does not exist.
6. **Fixture parity test.** Loads the seven personas and recomputes, for every account, utilisation and raw utilisation, the masked number from the source mask, the loan rule, the closed-account balance, and each bureau's change order; fails on any difference from the stored value. The override samples are not re-implemented (the JS check applies them).
7. **Wire in.** Both projects join `CreditDashboard.sln`, so the existing 'service build and tests' step in `verify` runs them with no change to `tools/verify.mjs`. `Api` takes no reference to the library yet (CDS-25).
8. **Records.** DR-052 (library structure, tag convention, `DateOnly` today, D1 to D4); README 'What is here' row; backlog v40 (CDS-20 Done; CDS-27 added, see D3) and the regenerated Kanban board; this plan's Outcome; an implementation log; the plans index.

## Verification

- `npm run verify` passes 11 of 11, locally and in each PR's own CI run. Test counts and durations are reported as measured.
- Every BR has at least one tagged test, shown by the traceability gate.
- **Probes that must fail, each run in a scratch copy and recorded in the log:**
  1. remove one `Category` tag: the traceability gate fails, naming the rule;
  2. change BR-03 to truncate (what the `rounding-down` flag will do): the BR-03 tests and the parity test fail;
  3. change one stored fixture utilisation: the parity test fails, naming the account.
- Specification and cases agree: every case-table row has a test, checked by counting rows against tests and stating the two numbers.

## Delivery

Branch from `main`; never to `main` directly.

- **PR 1** (`claude/cds-20-business-rules-spec`): this plan, the case tables, specification v16 and the plans index row. It is the review point for the specification and the three Readings, before any code.
- **PR 2** (`claude/cds-20-business-rules`): the library, tests, wiring and records (steps 3 to 8), started once PR 1 is accepted.
- **Merging:** only on the owner's authority, and only after each PR's own CI run reports success.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Structure | (a) A separate library project and a separate test project; (b) a folder inside `Api`, tested from `Api.Tests` | (a) | (a), 'all as recommended' (2026-10-07) |
| D2 Negative exact halves (for example -4.5%) | (a) Round towards positive infinity, `floor(x + 0.5)`; (b) away from zero | (a) | (a), 'all as recommended' (2026-10-07) |
| D3 PR rules (PR-02, 04, 06, 09 to 11) | (a) Out of CDS-20; a new item CDS-27 covers them; (b) in | (a) | (a), 'all as recommended' (2026-10-07) |
| D4 Fixture parity test | (a) Include; (b) hand-written cases only | (a) | (a), 'all as recommended' (2026-10-07) |
| Merge authority | Merge each PR when its own CI is green; the owner merges | (owner's call) | Not given; asked at hand-off |

## Outcome

[Appended after delivery.]
