# Project Review: credit-dashboard-sut

[<- Back to Index](../00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (Antigravity)
**Date:** 2026-11-05T08:56Z
**Scope:** In-depth architectural review of the `credit-dashboard-sut` system under test and its accompanying automated test harnesses.

---

## 1. Architecture and Design Patterns

- **Multi-Tier Contract-First Architecture**: The system cleanly decouples its contract specification ([DOCS/.architecture/openapi.yaml](DOCS/.architecture/openapi.yaml) (line 1)) from concrete runtime implementations. A single contract drives four distinct technical implementations: the Stoplight Prism mock server ([tools/lib/prism.mjs](tools/lib/prism.mjs) (line 1)), the ASP.NET Core Minimal API service ([demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs](demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs) (line 11)), the client SDK ([packages/api-client/src/index.ts](packages/api-client/src/index.ts) (line 1)), and the Serenity/JS Screenplay test harness ([test-harnesses/harness-serenity](test-harnesses/harness-serenity/package.json) (line 1)).
- **Pure Domain Isolation**: Domain logic for financial calculations (BR-01 through BR-15) and personal profile validation (PR-01 through PR-11) is quarantined in a zero-dependency C# library ([CreditDashboard.BusinessRules](demo-apps/demoapp001-dotnet-api/CreditDashboard.BusinessRules/BusinessRules.cs) (line 1)). The domain layer has no dependency on ASP.NET Core, serialization libraries, or database drivers. Financial amounts are modelled strictly as 64-bit integer minor units (avoiding floating-point inaccuracies), and time evaluation is mediated through an explicit, caller-supplied `DateOnly` parameter.
- **Screenplay Pattern with Granular Separation of Concerns**: The test harness implemented in Serenity/JS adheres strictly to the Screenplay pattern. Actors (`Alex`, `Sam`, `Stage Manager`) represent domain personas endowed with dedicated Abilities (`CallAnApi`, `ControlTheTestEnvironment`, `BrowseTheWeb`), invoking encapsulated Tasks and asserting against declarative Questions.
- **Controlled Test Environment & State Orchestration**: The ASP.NET Core service exposes an isolated test-control surface ([TestControlGate.cs](demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Control/TestControlGate.cs) (line 13)) providing endpoints to reset state, bind user personas with custom overrides, manipulate the controlled clock, and dynamically toggle bug flags. This surface is strictly gated by environment variables and authentication headers, preventing test hook exposure in production environments.
- **Production Asset Tree-Shaking Guard**: The React frontend guarantees complete separation between test instrumentation and production code. An automated build verification scanner ([public-build-guard.mjs](demo-apps/demoapp001-react-ui/scripts/public-build-guard.mjs) (line 32)) inspects compiled bundles in `dist/`, proving that test-control markers, debug panels, and bug flag references are tree-shaken from release builds.

---

## 2. Code Quality and Maintainability

- **Contract Drift Prevention via Automated Guards**: Both the C# service DTOs ([generate-service-contract.mjs](tools/generate-service-contract.mjs) (line 1)) and the TypeScript client bindings ([generate.mjs](packages/api-client/scripts/generate.mjs) (line 1)) are generated from `openapi.yaml`. Dedicated drift check scripts run in CI, asserting that committed code matches the current OpenAPI specification with zero manual tampering.
- **Run-Time Schema Validation on HTTP Responses**: The Serenity/JS test harness executes Ajv 2020 schema validation against every HTTP response received during test runs ([validate.ts](test-harnesses/harness-serenity/src/contract/validate.ts) (line 40)). Schema validation operates in strict mode with closed schemas (`additionalProperties: false`), instantly detecting undocumented fields, leaked properties, or incorrect HTTP response formats.
- **Rigorous Type Safety and Negative Compilation Testing**: TypeScript client packages include negative tests using `@ts-expect-error` to prove that invalid types, out-of-spec request bodies, and unauthorized enums fail compilation. Verification scripts confirm that any regression allowing invalid types to compile breaks the build.
- **Immutable and Deterministic Domain Functions**: Calculations in `CreditDashboard.BusinessRules` are structured as pure static functions. Rules for rounding (positive half-up rounding), credit balance formatting, and debt trend computation are free of side effects and completely covered by NUnit tests tagged by rule ID.
- **Resilient Process and Error Management**: The ASP.NET Core service implements edge validation middleware ([ContractValidation.cs](demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Edge/ContractValidation.cs) (line 18)) and standardized Problem Details (RFC 9457) error formatting ([Problems.cs](demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Edge/Problems.cs) (line 10)), ensuring that client requests receive predictable, contract-compliant diagnostics.

---

## 3. Test Coverage and Approach

- **Comprehensive Test Pyramid**: The test suite covers all levels of the Test Pyramid: 676 .NET tests (239 business rule tests and 437 API integration tests), 216 React component tests in Vitest, 97 test harness unit tests, 77 Gherkin scenarios (60 API executions and 59 UI executions), 128 axe-core scans, 294 layout checks, and 34 visual regression tests.
- **Catalogue of 30 Planted Bug Flags**: The repository implements a switchable catalogue of 30 realistic defects ([bug-flags.json](fixtures/bug-flags.json) (line 1)) spanning service calculations, security access controls, UI presentation logic, and accessibility semantics.
- **Empirically Proven Defect Detection**: Every bug flag is backed by an automated proof harness ([prove-flags.ts](test-harnesses/harness-serenity/src/flags/prove-flags.ts) (line 1)). The harness proves that with the flag off, tests pass; with the flag on, the designated catcher fails with the exact diagnostic line expected, as recorded in [DOCS/evidence/phase-5-bug-flag-proof_2026-10-23.md](DOCS/evidence/phase-5-bug-flag-proof_2026-10-23.md) (line 14).
- **Automated Property-Based API Fuzzing**: Schemathesis 4.29.4 is embedded directly into the primary verification gate ([schemathesis-run.mjs](tools/schemathesis-run.mjs) (line 1)). It fuzzes all 36 contract endpoints with a deterministic random seed, verifying idempotency, error formats, and boundary handling.
- **Multi-Modal Accessibility and Layout Testing**: UI tests integrate automated `@axe-core/playwright` scans on 64 page states across both light and dark themes with zero violations, paired with custom in-browser semantic inspection rules ([semantic-rules.ts](test-harnesses/harness-serenity/src/exit/semantic-rules.ts) (line 22)) verifying ARIA labels, progress bar rendering, and text scaling.
- **Visual Regression Testing**: 34 baseline screenshots cover 8 responsive pages across 375px and 1280px viewports in dual colour schemes, with visual diff assertions executing on Linux CI against committed baselines ([visual.spec.ts](test-harnesses/harness-serenity/src/visual/visual.spec.ts) (line 1)).

---

## 4. Documentation Quality

- **Canonical Backlog and Traceability**: [DOCS/backlog.md](DOCS/backlog.md) serves as the canonical source of truth for project status (version 85, project closed). Every ticket (CDS-01 through CDS-48) documents its delivery history, associated decision briefs, and verification links.
- **Living Decision Register with Formal ADRs**: The project maintains an extensive decision register ([DOCS/decision-register.md](DOCS/decision-register.md) (lines 14-83)) tracking 68 architectural decisions (DR-001 through DR-068). Decisions are backed by written decision briefs containing explicit options, rationale, and arguments against the chosen path.
- **Normative Glossaries and Step Catalogues**: The repository provides both a business domain glossary ([DOCS/glossary.md](DOCS/glossary.md) (line 1)) and an unambiguous step glossary ([DOCS/step-glossary.md](DOCS/step-glossary.md) (line 1)) cataloguing all Gherkin step expressions, parameter types, and underlying domain mappings.
- **Verifiable Implementation Logs and Walkthroughs**: Each engineering slice is paired with an immutable implementation log in `DOCS/implementation-logs/` and durable walkthroughs in `DOCS/walkthroughs/`, capturing empirical command outputs, git SHAs, and test metrics.

---

## 5. Strengths and Weaknesses

### Strengths
- Uncompromising contract-first discipline that binds specification to code and test execution.
- Innovative bug-flag verification harness proving that tests catch real, subtle defects.
- Exemplary separation of domain rules from infrastructure and presentation concerns.
- Dual-theme accessibility auditing with axe-core and custom semantic validation.
- Extensive, documented review history using multiple independent reviewer models.

### Weaknesses
- Branch protection on `main` is disabled, leaving CI gating advisory against direct pushes.
- Visual regression checks cannot be executed locally on Windows or macOS workstations due to Linux-only baseline locking.
- Process group detachment on harness runner timeout poses risk of orphaned background child processes.
- The full bug flag proof suite runs sequentially, requiring 16-20 minutes in CI.
- Transitive development dependencies inherited from legacy CLI tooling (`@stoplight/prism-cli`) introduce known security audit advisories.

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
