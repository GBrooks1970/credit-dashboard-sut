# Architecture Assessment

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (Antigravity)
**Date:** 2026-11-05T08:56Z
**Scope:** Rigorous evaluation of `credit-dashboard-sut` against classical software architecture, design principles, testing pyramids, and instructional quality.

---

## 1. Test Pyramid Balance

### Alignment
- **Robust Base of Fast, Isolated Unit Tests**: The foundation of the pyramid is anchored by 239 pure C# unit tests in `CreditDashboard.BusinessRules.Tests` (executing in ~7 seconds) and 216 React component tests in Vitest (executing in ~51 seconds). These tests isolate domain calculations and UI state machines without spinning up web servers or browsers.
- **Thorough Integration and Edge Validation Layer**: The middle tier comprises 437 integration tests in `CreditDashboard.Api.Tests` using ASP.NET Core `WebApplicationFactory`. These tests verify request edge validation, Problem Details formatting, session lifecycle, and test-control endpoints without external network hops.
- **Lean, Focused End-to-End Scenarios**: The peak of the pyramid consists of 77 Gherkin scenarios (60 API executions and 59 UI executions in Serenity/JS) and 34 visual regression tests. The E2E suite avoids redundant exploratory permutations, focusing strictly on business journey verification and accessibility compliance.

### Gaps
- The bug flag proof suite (`npm run check:bug-flags`) executes 30 flags using a hybrid mix of scenario, component, and exit-check catchers. Running all 30 flags sequentially via full browser and HTTP invocations inverts the pyramid's speed expectations, taking 16-20 minutes in CI.

---

## 2. SOLID Principles

### Alignment
- **Single Responsibility Principle (SRP)**:
  - `CreditDashboard.BusinessRules` is strictly dedicated to calculating financial and profile domain rules, containing zero HTTP or database logic.
  - In the Serenity/JS harness, `CallAnApi` is solely responsible for HTTP transport and contract validation, while `ControlTheTestEnvironment` manages state reset and clock manipulation.
  - In React UI, components like `UtilisationBar` and `SectionState` focus purely on rendering specific presentation states.
- **Open/Closed Principle (OCP)**:
  - Middleware in the ASP.NET Core pipeline (`CorrelationIdMiddleware`, `FaultHandler`, `TestControlGate`, `FlagsMiddleware`, `ContractValidation`) allows extending request processing pipelines without modifying core route handlers.
  - The Serenity/JS Screenplay pattern allows introducing new actor Tasks and Questions without modifying existing step definitions.
- **Liskov Substitution Principle (LSP)**:
  - The controlled clock mechanism implements `IControlledClock` ([ControlledClock.cs](demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Control/ControlledClock.cs) (line 12)), wrapping .NET `TimeProvider`. The service seamlessly substitutes `ControlledClock` during testing while behaving identically to standard system clocks.
- **Interface Segregation Principle (ISP)**:
  - TypeScript interfaces in `packages/api-client` are granularly typed per operation and DTO schema.
  - Harness abilities expose only the specific operations needed by their respective actors (`CallAnApi` for customer personas, `ControlTheTestEnvironment` for `Stage Manager`).
- **Dependency Inversion Principle (DIP)**:
  - Route handlers and domain services in ASP.NET Core depend on abstractions registered via dependency injection (`IConfiguration`, `TimeProvider`, `IControlledClock`, `ContractModel`).

### Gaps
- `CreditDashboard.Api/Program.cs` directly constructs and registers concrete singleton instances (e.g. `builder.Services.AddSingleton<PersonaStore>()`, `builder.Services.AddSingleton<TokenStore>()`) rather than binding them against explicit repository interfaces (`IPersonaStore`, `ITokenStore`), making unit-level mocking of these stores impossible without spinning up the entire minimal API host.

---

## 3. KISS (Keep It Simple, Stupid)

### Alignment
- **In-Memory State Store**: The service avoids external database infrastructure (SQL Server, PostgreSQL, Redis) by maintaining ephemeral in-memory state seeded from JSON fixtures. This eliminates migration complexity, container spin-up latency, and local setup hurdles.
- **Native Fetch in Harness**: Rather than introducing heavy wrapper abstractions over HTTP, `CallAnApi` uses standard Node.js `fetch` combined with Ajv schema validation ([CallAnApi.ts](test-harnesses/harness-serenity/src/abilities/CallAnApi.ts) (line 66)), keeping network interaction lightweight and transparent.
- **Straightforward Script-Based Orchestration**: Build and test tasks are orchestrated via clear npm scripts and Node.js ESM scripts ([tools/verify.mjs](tools/verify.mjs), [scripts/run.mjs](test-harnesses/harness-serenity/scripts/run.mjs)), avoiding complex task runner frameworks.

### Gaps
- In [test-harnesses/harness-serenity/src/exit/semantic-rules.ts](test-harnesses/harness-serenity/src/exit/semantic-rules.ts) (line 22), injecting a massive raw JavaScript string template into the browser runtime via `page.evaluate()` adds cognitive load and debugging friction compared to importing structured Playwright test assertions.

---

## 4. YAGNI (You Aren't Gonna Need It)

### Alignment
- **Pragmatic Scope Boundaries**: The project actively deferred non-essential features (e.g. address, employment, and financial profile sub-pages; general rate limiting; container publishing) as documented in DR-022, DR-035, and DR-067.
- **Synthetic Test Authentication**: The system implements simple bearer token authentication (`/auth/login`) with in-memory validation, completely bypassing unnecessary OAuth2/OIDC provider infrastructure while still thoroughly exercising authentication flows and token expiration.
- **Single Aggregate Overview Endpoint**: Decision DR-034 deliberately kept `GET /reports/{id}/overview` as a single aggregate call rather than decomposing it into multiple micro-service network requests, keeping client code simple and minimizing loading state complexity.

### Gaps
- The project carries both a Stoplight Prism mock server (`npm run mock`) and the live ASP.NET Core API service. While Prism was useful during Phase 1 contract exploration, all Phase 3, 4, and 5 tests run exclusively against the live service, leaving Prism primarily as legacy tooling.

---

## 5. REST + OpenAPI Standards

### Alignment
- **OpenAPI 3.1 Specification Rigour**: The API contract ([DOCS/.architecture/openapi.yaml](DOCS/.architecture/openapi.yaml) (line 1)) complies with OpenAPI 3.1 standards, utilizing JSON Schema 2020-12 draft features (e.g. nullable types via `type: ['string', 'null']`).
- **Standardized RFC 9457 Problem Details**: Errors return the standardized `application/problem+json` content type with consistent members: `type`, `title`, `status`, `detail`, `instance`, and domain-specific `errors[]`.
- **Idiomatic RESTful Resource Design**: URIs use clear noun-based resource hierarchies (`/me/profile/email`, `/reports/{bureauId}/accounts/{accountId}`), appropriate HTTP methods (`GET`, `PUT`, `PATCH`, `POST`), and standardized HTTP status codes (200, 204, 400, 401, 404, 405, 422, 429).
- **Explicit Content-Type and Caching Headers**: Responses explicitly set `Content-Type: application/json; charset=utf-8` or `application/problem+json`, with static HTML routes configuring `Cache-Control: no-store` to prevent stale client caching.

### Gaps
- The OpenAPI contract defines multiple servers (`http://localhost:4000/api/v1` and `http://localhost:4010`), but Prism 5.16.0 does not support base paths (`/api/v1`), forcing an awkward split where clients use different base URLs depending on whether they target the mock or the real service (DR-039).

---

## 6. ISTQB Test Design Techniques

### Alignment
- **Equivalence Partitioning & Boundary Value Analysis (BVA)**:
  - Credit score bands and debt trend calculations (BR-07) explicitly test boundaries (exact 1% steady boundaries, debt at zero vs positive values).
  - Account closure retention rules (BR-13) explicitly test the exact 6-year anniversary boundary, including 29 February leap year boundaries (DR-012).
  - Credit card utilisation (BR-03) tests 0%, 49.5% (rounding half-up), 100%, and over-limit states at 115%.
- **State Transition Testing**:
  - The personal profile mobile verification workflow tests explicit state transitions: Unverified -> Code Issued -> Code Accepted -> Verified, including invalid attempts remaining (PR-10, PR-11) and code voiding on third failure.
- **Negative and Security Testing**:
  - IDOR (Insecure Direct Object Reference) access control scenarios confirm that authenticated users cannot access accounts belonging to other personas.
  - Edge validation tests verify that path traversal attempts, open redirects (`//evil.example`), and invalid payloads are strictly rejected.

### Gaps
- Decision table testing could be expanded for complex multi-bureau aggregation edge cases where one bureau returns a valid score while another returns a simulated network timeout.

---

## 7. Pedagogical Code Comments and Instructional Value

### Alignment
- **Exceptional Instructional Documentation**: Files throughout the codebase include comprehensive header blocks stating version, creation timestamp, architectural decision citations, and clear explanations of *why* specific patterns were chosen.
- **Contextual Decision Citations in Code**: Code comments explicitly reference architectural decisions (e.g. `// (DR-017, DR-050)`, `// (CDS-38 R2-B-08)`), allowing engineers and review agents to trace implementation details back to formal design briefs.
- **Explanatory Failure Messages**: Custom test assertions and error messages provide descriptive diagnostic feedback (e.g. `expected the bottom tab bar only, found 3 tab(s) and 3 top link(s)`), transforming failed test runs into self-explanatory debugging exercises.

### Gaps
- Some complex regular expressions in `semantic-rules.ts` and `validate.ts` would benefit from inline diagrams or breakdown comments explaining specific regex lookaheads and unicode category groups (`\p{L}`).

---

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)
