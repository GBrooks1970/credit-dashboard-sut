# Code Review: Credit Dashboard SUT (ScoreHarbour)

**Reviewer:** AI assistant (Antigravity)
**Date:** 2026-11-05T08:56Z
**Scope:** Full repository review of `credit-dashboard-sut` (OpenAPI contract, ASP.NET Core minimal API, React UI, Prism mock, Serenity/JS test harness, 30 planted bug flags, a11y axe-core scans, visual regression baselines, and CI workflows).

---

## Table of Contents

1. [Executive Summary](01_EXECUTIVE_SUMMARY.md)
2. [Risks and Issues](02_RISKS_AND_ISSUES.md)
3. [Project Reviews](03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md)
4. [Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md)
5. [Recommendations](05_RECOMMENDATIONS.md)
6. [Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md)
7. [Migration Plans](07_MIGRATION_PLANS.md)

---

## Structure Summary

- **[01_EXECUTIVE_SUMMARY.md](01_EXECUTIVE_SUMMARY.md)**: High-level architectural synthesis evaluating design quality, code craftsmanship, key achievements, and the outstanding pedagogical value of the repository.
- **[02_RISKS_AND_ISSUES.md](02_RISKS_AND_ISSUES.md)**: Prioritised risk catalogue (from High to Low) documenting 6 operational and architectural risks with concrete code evidence, impact analyses, and practical remediation strategies.
- **[03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md](03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md)**: Deep-dive single-project architectural assessment covering structural patterns, code maintainability, testing strategies, documentation quality, strengths, and weaknesses.
- **[04_CROSS_PROJECT_ANALYSIS.md](04_CROSS_PROJECT_ANALYSIS.md)**: Cross-cutting analysis across repository sub-layers covering tool-agnostic tests, code-agnostic tests, single source of truth, API contract compliance, Screenplay parity, batch script design, documentation alignment, logging standards, and quantitative test coverage metrics.
- **[05_RECOMMENDATIONS.md](05_RECOMMENDATIONS.md)**: Actionable, forward-looking guidance split into recommended refactorings, immediate operational next steps, and long-term evolutionary project ideas.
- **[06_ARCHITECTURE_ASSESSMENT.md](06_ARCHITECTURE_ASSESSMENT.md)**: Systematic evaluation against established software engineering principles: Test Pyramid, SOLID principles (SRP, OCP, LSP, ISP, DIP), KISS, YAGNI, REST/OpenAPI standards, ISTQB test design techniques, and pedagogical code comments.
- **[07_MIGRATION_PLANS.md](07_MIGRATION_PLANS.md)**: Structured transition roadmaps detailing consolidation of the feature specification store, local containerisation via Docker Compose, and CI/CD enhancements in GitHub Actions.

---

## Key Findings

1. **Exemplary Specification-Driven Delivery (SDD) Chain**: The repository achieves a rare standard of end-to-end contract traceability. A single OpenAPI 3.1 specification ([openapi.yaml](DOCS/.architecture/openapi.yaml) (line 1)) drives the Prism mock server, typed TypeScript client ([packages/api-client](packages/api-client/package.json) (line 1)), ASP.NET Core Minimal API ([Program.cs](demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs) (line 11)), and the Serenity/JS Screenplay test harness ([validate.ts](test-harnesses/harness-serenity/src/contract/validate.ts) (line 40)). Every API response received by the test harness is validated against JSON Schema definitions at runtime, preventing silent contract drift.
2. **Empirical Defect Detection Proof (30 Planted Bug Flags)**: Unlike standard portfolio projects that verify only the "happy path", this project implements and proves a catalogue of 30 switchable defects ([bug-flags.json](fixtures/bug-flags.json) (line 1)). Every flag is empirically validated by automated catchers ([phase-5-bug-flag-proof_2026-10-23.md](DOCS/evidence/phase-5-bug-flag-proof_2026-10-23.md) (line 14)), demonstrating that tests fail for the exact expected cause when defects are active and pass when inactive.
3. **Multi-Layered Accessibility and Layout Verification**: Accessibility is treated as an architectural gate rather than an afterthought. The exit suite runs `@axe-core/playwright` across 64 distinct pages and states in both light and dark themes with zero violations, accompanied by custom DOM semantic rules ([semantic-rules.ts](test-harnesses/harness-serenity/src/exit/semantic-rules.ts) (line 22)) and 34 visual regression screenshot baselines ([visual.spec.ts](test-harnesses/harness-serenity/src/visual/visual.spec.ts) (line 1)).
4. **Advisory CI Gating due to Unprotected `main` Branch**: GitHub branch protection is currently disabled on `main` (recorded in [backlog.md](DOCS/backlog.md) (line 11) and DR-068). Direct pushes to `main` bypass all pull-request validation checks, creating an operational vulnerability where broken builds or untested commits can be published directly to GitHub Pages.
5. **Process Group Detachment Risk on Harness Timeouts**: In the harness runner ([run.mjs](test-harnesses/harness-serenity/scripts/run.mjs) (lines 103-106, 153-165)), child processes spawned without a process group are killed via top-level process signalling (`runner.kill()`). On timeout or cancellation, orphaned child processes (e.g. Playwright browser processes or .NET child processes) can remain running in background sessions (catalogued in [backlog.md](DOCS/backlog.md) (line 11)).

---

## Navigation Guide

- To examine high-level quality attributes and architectural achievements, start with [01_EXECUTIVE_SUMMARY.md](01_EXECUTIVE_SUMMARY.md).
- For prioritised issues, vulnerabilities, and remediation plans, consult [02_RISKS_AND_ISSUES.md](02_RISKS_AND_ISSUES.md).
- For a comprehensive technical assessment of the system under test, review [03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md](03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md).
- For cross-cutting discipline analyses, examine [04_CROSS_PROJECT_ANALYSIS.md](04_CROSS_PROJECT_ANALYSIS.md).
- For engineering recommendations, see [05_RECOMMENDATIONS.md](05_RECOMMENDATIONS.md).
- For compliance against SOLID, Test Pyramid, KISS, YAGNI, and ISTQB principles, refer to [06_ARCHITECTURE_ASSESSMENT.md](06_ARCHITECTURE_ASSESSMENT.md).
- For future technical roadmaps (Docker Compose, GitHub Actions, and feature stores), read [07_MIGRATION_PLANS.md](07_MIGRATION_PLANS.md).

---

[Next: Executive Summary ->](01_EXECUTIVE_SUMMARY.md)
