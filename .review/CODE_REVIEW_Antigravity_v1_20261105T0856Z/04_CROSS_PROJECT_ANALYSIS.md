# Cross-Project Analysis

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (Antigravity)
**Date:** 2026-11-05T08:56Z
**Scope:** Cross-cutting analysis within `credit-dashboard-sut` examining alignment across specifications, service layers, client SDKs, test harnesses, documentation, and operational scripts.

---

## 1. Tool-Agnostic Tests

- **Framework-Independent Gherkin Specifications**: The executable specifications in `features-shared/` are authored in clean, declarative Gherkin, free of any runner-specific or tool-specific syntax. Scenarios use standard Given/When/Then structures that can be parsed and executed by Cucumber.js, Reqnroll (C#), pytest-bdd (Python), or Behave without modifying scenario text.
- **Abstract Domain Step Expressions**: Step definitions documented in [DOCS/step-glossary.md](DOCS/step-glossary.md) (line 1) operate strictly at the domain intent level (e.g. `Given {actor} has noted their credit balances`, `When {actor} chooses to see their report changes`). They do not bind to Playwright locators, CSS selectors, or HTTP transport details within the Gherkin source.
- **Portability Across HTTP Clients**: API scenario step definitions map to generic HTTP interaction patterns rather than Serenity/JS-specific internals. The same scenario steps can be backed by Axios, Supertest, RestSharp, or standard `fetch` without modifying the underlying feature definitions.
- **Separation of Component Tests from E2E Drivers**: React component tests in Vitest verify component-level behaviours and states in jsdom, while Serenity/JS drives identical scenarios against full browser contexts, validating that test logic is decoupled from execution runners.

---

## 2. Code-Agnostic Tests

- **Language-Neutral Test Data via Personas and Overrides**: All test personas, account balances, and data fixtures are defined in pure JSON ([fixtures/personas/](fixtures/personas/) (line 1)). They contain no language-specific serialisation constructs, allowing consumption by C# (`CreditDashboard.Api`), TypeScript (`@credit-dashboard-sut/api-client`), and Python (`tools/check-gherkin.py`).
- **Standardised Problem Details (RFC 9457)**: API error handling across both the .NET service and the test harness adheres to the RFC 9457 Problem Details specification. Tests assert on standard `type`, `title`, `status`, and `detail` JSON members, eliminating language-specific exception serialisation dependencies.
- **Integer Minor-Unit Currency Representation**: Monetary amounts are transmitted across all interfaces as 64-bit integer minor units (e.g. `1368500` for `GBP 13,685.00`). This completely eliminates language-specific floating-point discrepancies between C# (`long`), JavaScript/TypeScript (`number`/`bigint`), and Python (`int`).
- **Standardized Date Formats**: Dates are consistently formatted as ISO 8601 strings (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`), ensuring uniform parsing across C# `DateOnly`/`DateTimeOffset` and JavaScript `Date` instances.

---

## 3. Single Source of Truth

- **OpenAPI 3.1 as the Central System Contract**: [DOCS/.architecture/openapi.yaml](DOCS/.architecture/openapi.yaml) (line 1) is the immutable contract governing the entire repository. Both the C# service DTOs and TypeScript client interfaces are generated directly from this document, with continuous integration asserting zero drift.
- **Shared Persona Fixtures**: Synthetic test users and credit bureau accounts are authored once in `fixtures/personas/` and validated against JSON Schemas derived from the OpenAPI specification ([fixtures/persona.schema.json](fixtures/persona.schema.json) (line 1)). The ASP.NET Core service loads these exact fixture files at runtime.
- **Centralised Defect Catalogue**: All 30 bug flags are registered in [fixtures/bug-flags.json](fixtures/bug-flags.json) (line 1), linking each flag to its architectural layer, intended effect, and designated automated catcher. This registry serves as the sole authoritative configuration for CI proof runs.
- **Backlog-Driven Project Board**: The project's Kanban board (`credit-dashboard-sut_implementation-kanban_v1.html`) is compiled directly from the markdown tables in [DOCS/backlog.md](DOCS/backlog.md) (line 27) using `portfolio-kanban-generator`, preventing visual board drift.

---

## 4. API Contract Compliance

- **Strict Schema Edge Validation**: In the ASP.NET Core service, the `ContractValidation` middleware ([ContractValidation.cs](demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Edge/ContractValidation.cs) (line 18)) evaluates all inbound requests against the OpenAPI schema using JsonSchema.Net. Malformed payloads or extra fields on closed schemas are rejected with standard 400 Bad Request responses.
- **Run-Time Response Validation in Test Harness**: The test harness's `CallAnApi` ability ([CallAnApi.ts](test-harnesses/harness-serenity/src/abilities/CallAnApi.ts) (line 80)) validates 100% of HTTP responses against OpenAPI schemas using Ajv 2020. The validator operates in strict mode, flagging undocumented headers, unexpected body members, or unlisted status codes.
- **Automated Property-Based API Fuzzing**: Schemathesis 4.29.4 fuzzes all 36 contract endpoints on every build ([schemathesis-run.mjs](tools/schemathesis-run.mjs) (line 1)). It validates conformance to HTTP method semantics, status code definitions, and content-type headers.
- **Closed Schema Enforcement**: Decision DR-065 and DR-068 established closed schema validation across response objects. Unit tests in [validate.test.ts](test-harnesses/harness-serenity/src/contract/validate.test.ts) (line 88) verify that only explicitly allowlisted extensible schemas permit additional properties.

---

## 5. Screenplay Parity

- **Disciplined Screenplay Architecture**: The Serenity/JS harness faithfully implements the Screenplay pattern. Tasks encapsulate procedural user journeys (e.g. `SignIn`, `UpdatePreferredName`), Questions inspect current system state (e.g. `CreditOverview.score()`, `LastResponse.status()`), and Abilities manage system access (`CallAnApi`, `ControlTheTestEnvironment`).
- **Decoupled API and UI Abilities**: The harness clearly distinguishes between actors driving the API (`CallAnApi`) and actors driving browser interactions (`BrowseTheWeb`). The `Stage Manager` actor holds the `ControlTheTestEnvironment` ability to manipulate clocks, reset databases, and configure bug flags without polluting end-user persona context.
- **Actor State Isolation**: Each Cucumber scenario initializes an isolated `ScenarioWorld` ([world.ts](test-harnesses/harness-serenity/src/support/world.ts) (line 1)), preventing authentication tokens, cached responses, and browser session state from leaking across scenario boundaries.
- **Consistent Assertion Vocabulary**: Assertions across both API and UI scenarios use Serenity/JS declarative matchers (`Ensure.that(...)`, `equals(...)`, `includes(...)`), delivering clear, readable failure diagnostics.

---

## 6. Batch Script and Tooling Design

- **Unified Single-Command Verification**: The repository provides a master verification script ([tools/verify.mjs](tools/verify.mjs) (line 1)) invoked via `npm ci && npm run verify`. It runs 14 distinct verification stages (linting, fixture validation, Gherkin parsing, mock smoke, client checks, service builds, Schemathesis fuzzing, Serenity API tests, and Kanban drift checks), reporting execution durations and status for each.
- **Deterministic Process Lifecycle Management**: Test execution scripts ([scripts/run.mjs](test-harnesses/harness-serenity/scripts/run.mjs) (line 19)) manage the lifecycle of dual ASP.NET Core service instances (one with test-control enabled and one disabled), ensuring clean startup, health check polling, and guaranteed shutdown via process hooks.
- **Cross-Platform Compatibility**: Build and verification scripts are implemented in Node.js ESM (`.mjs`/`.ts`) and Python, avoiding OS-dependent shell scripts and ensuring seamless execution across Windows, macOS, and Linux.
- **Isolated Artifact Directories**: Generated reports, visual screenshot diffs, and test logs are written to dedicated subdirectories (`reports/`, `_site/`, `dist-test/`) that are excluded from version control and isolated from release bundles.

---

## 7. Documentation Alignment

- **Absolute Alignment Between Code and Backlog**: The repository maintains 100% synchronization between [DOCS/backlog.md](DOCS/backlog.md) (version 85, closed) and the actual codebase. All 48 backlog tickets are marked Done with exact completion dates, matching the delivered implementations and decision register records.
- **Rigorous Architectural Decision Tracking**: The decision register ([DOCS/decision-register.md](DOCS/decision-register.md) (lines 14-83)) records 68 decisions (DR-001 through DR-068). Each decision cites its associated decision brief, rationale, and alternatives considered.
- **Bidirectional Traceability Chain**: Scenarios in `features-shared/` tag business rules (`@BR-01` through `@BR-15`), which map directly to domain calculations in `CreditDashboard.BusinessRules` and specification sections in [DOCS/.design/api-specification.md](DOCS/.design/api-specification.md) (line 1).
- **Comprehensive Step Glossary**: [DOCS/step-glossary.md](DOCS/step-glossary.md) documents every Gherkin step pattern used across all 23 feature files, ensuring that new scenarios reuse established phrasing without introducing duplicate or ambiguous steps.

---

## 8. Logging Alignment

- **Correlation ID Tracking Across Tiers**: The ASP.NET Core service incorporates `CorrelationIdMiddleware` ([CorrelationIdMiddleware.cs](demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Edge/CorrelationIdMiddleware.cs) (line 11)), stamping every response with `X-Correlation-Id` and attaching the ID to error Problem Details for end-to-end request tracing.
- **Structured File-Based Test Logging**: Service logs during test runs are routed to temporary files ([run.mjs](test-harnesses/harness-serenity/scripts/run.mjs) (line 77)), avoiding standard output pipe buffer deadlocks during heavy test execution while preserving logs for CI artifact archiving on failure.
- **Zero Information Leakage in Public Builds**: The build pipeline verifies that test logs, debug markers, and test-control endpoints do not leak into compiled production bundles ([public-build-guard.mjs](demo-apps/demoapp001-react-ui/scripts/public-build-guard.mjs) (line 10)).
- **Sanitized CI Artifact Publishing**: Automated site assembly checks verify that published Serenity reports and Kanban boards contain no embedded authentication tokens, test-control keys, or private environment variables ([site.ts](test-harnesses/harness-serenity/src/report/site.ts) (line 1)).

---

## 9. Test Coverage Metrics

- **Extensive Unit and Domain Test Coverage**:
  - `CreditDashboard.BusinessRules.Tests`: 239 NUnit tests executing in ~7 seconds, achieving 100% coverage across rules BR-01 to BR-15 and PR-01 to PR-11.
  - `CreditDashboard.Api.Tests`: 437 integration tests executing in ~4 minutes, covering edge validation, fault handling, clock manipulation, and test-control routing.
- **Robust Component and Harness Unit Test Suites**:
  - React UI Vitest suite: 216 component tests across 12 test files, executing in ~51 seconds.
  - Serenity harness unit tests: 97 unit tests validating contract compilation, parallel safety, bug flag verdict logic, report validation, and visual regression cases.
- **Comprehensive Behaviour-Driven Scenarios**:
  - 23 Gherkin feature files containing 77 scenarios and outlines.
  - 60 API scenario executions and 59 UI scenario executions passing against the live ASP.NET Core service.
- **Accessibility and Visual Regression Gates**:
  - 128 axe-core automated accessibility audits covering 64 page states in dual colour schemes with 0 violations.
  - 294 layout checks across 375px, 768px, and 1280px viewports.
  - 34 pixel-perfect visual regression screenshot baselines.
- **Defect Detection Proof Metrics**:
  - 30 of 30 planted bug flags empirically caught by automated checks, with each catcher failing for the exact documented diagnostic reason.

---

[<- Previous: Project Reviews](03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md) | [Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
