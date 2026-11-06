# Architecture Assessment

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (Codex GPT-6)

## Test Pyramid

The large pure-rule and in-memory service base is complemented by component, API BDD and browser checks. Assertion/proof/report helpers have their own negative controls. This is a better distribution than relying only on UI scenarios; nonetheless, the LF counterexample shows that a high test count is not input-domain completeness. No new line/branch percentage was measured.

## SOLID Principles

- **SRP:** rules, HTTP edge validation, persona storage, UI rendering and evidence tools have distinct owners. [demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs](../../demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs) (line 12).
- **OCP:** contract-driven operations and typed client generation reduce repeated manual API shape maintenance.
- **LSP:** response consumers rely on schema substitutability; C-01 breaks that observable contract even though HTTP returns success.
- **ISP:** the API and test-control abilities expose focused capabilities; public callers do not need to know how fixture reset works. [test-harnesses/harness-serenity/src/abilities/CallAnApi.ts](../../test-harnesses/harness-serenity/src/abilities/CallAnApi.ts) (line 56); [test-harnesses/harness-serenity/src/abilities/ControlTheTestEnvironment.ts](../../test-harnesses/harness-serenity/src/abilities/ControlTheTestEnvironment.ts) (line 15).
- **DIP:** the controlled clock abstraction and independently read contract support deterministic tests without importing UI or service internals into the harness.

## KISS

In-memory synthetic persistence and an explicit finite bug registry are appropriate to a SUT. Avoid adding production financial integrations, queues or databases to solve an input-boundary defect. `run.mjs` is inevitably an orchestration hub; future cancellation work should isolate process ownership rather than add more ad hoc kill branches.

## YAGNI

Deferring stretch profile pages and a container image keeps the accepted exit scope bounded. [DOCS/backlog.md](../../DOCS/backlog.md) (line 11). Preserve that decision unless a real new objective justifies reopening it. A production authentication platform would change the teaching purpose and is not recommended by this review.

## REST + OpenAPI

Operation IDs, Problem responses, closed response schemas, generated types and independent validation are strong. C-01 is specifically a semantic-normalisation failure reaching an invalid response, not an argument to move every business rule into a regex schema. Both request acceptance and response conformance need boundary examples. [DOCS/.architecture/openapi.yaml](../../DOCS/.architecture/openapi.yaml) (line 1432); [DOCS/.architecture/openapi.yaml](../../DOCS/.architecture/openapi.yaml) (line 1425).

## ISTQB Strategies

Personas and fixtures support equivalence partitioning; credit bands, percentages and monetary units support boundary value analysis; clock expiry, attempts and verification support state-transition testing. Flags supply controlled negative variants and proof of catchers. Tag counts do not establish combinatorial rule coverage. Add LF/CRLF/tab and valid-space partitions to the mobile case table; preserve rule IDs in both pure and HTTP-level tests.

## Pedagogical Comments

The repository explains why tests are serial, why tokens are dropped on time changes, and why visual catches are insufficient evidence of a specific defect reason. Those are substantive teaching decisions. Maintain the same precision when describing residual publication/process limits and when updating the now-stale dependency acceptance.

---

[<- Previous](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](07_MIGRATION_PLANS.md)
