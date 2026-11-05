# Migration Plans

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md)

**Reviewer:** AI assistant (Antigravity)
**Date:** 2026-11-05T08:56Z
**Scope:** Architectural migration plans for consolidating feature specifications, introducing containerized development infrastructure, and upgrading GitHub Actions CI/CD workflows.

---

## 1. Single Source of Truth for Features (Consolidation Strategy)

- **Centralize Feature Files into a Root-Level Specifications Module**: Currently, executable Gherkin specifications reside in `features-shared/`, while unit test fixtures live in `fixtures/`, and Markdown design specifications reside in `DOCS/.design/`. Migrate these assets into a unified, version-controlled specification repository or sub-module (`specifications/`), serving as the single canonical source of truth for the SUT, client SDKs, and all testing harnesses.
- **Enforce Automated Schema-to-Feature Cross-Validation**: Extend `tools/check-gherkin.py` into a formal specification validation gate. Verify that every Given/When/Then data table in Gherkin feature files validates strictly against the JSON Schemas defined in `fixtures/persona.schema.json` and `openapi.yaml`, rejecting any untyped data permutations before code changes are permitted.
- **Implement Synchronized Feature Tagging and Traceability**: Standardize tagging conventions across the entire suite (`@rule:BR-xx`, `@rule:PR-xx`, `@security:IDOR`, `@surface:api`, `@surface:ui`). Generate an automated traceability matrix linking Gherkin tags to C# `[Category("BR-xx")]` unit tests, Vitest component test suites, and OpenAPI endpoint operations, outputting a machine-readable coverage ledger.
- **Extract Step Glossary Expressions into Shared Reusable Regex Matchers**: Convert the normative definitions in [DOCS/step-glossary.md](DOCS/step-glossary.md) into a standalone TypeScript/JavaScript library (`@credit-dashboard-sut/gherkin-steps`). Both Serenity/JS Cucumber harnesses and any future testing frameworks (such as playwright-bdd or Cypress) can directly import these step patterns, preventing regex drift.
- **Establish Formal Deprecation and Versioning Lifecycles for Scenarios**: Implement an automated deprecation workflow for scenario definitions. When business rules evolve, mark older scenarios with `@deprecated` tags, schedule their migration milestones in [DOCS/backlog.md](DOCS/backlog.md), and require dual-run verification before retiring legacy scenarios.

---

## 2. Docker Compose for Local Development (Containerization Approach)

- **Author a Multi-Stage Dockerfile for the Unified Application**: Create a root-level `Dockerfile` leveraging multi-stage builds. Stage 1 compiles the React UI (`demo-apps/demoapp001-react-ui`) into static production assets (`dist/`); Stage 2 builds the ASP.NET Core API service (`demo-apps/demoapp001-dotnet-api`) on the official .NET 10 SDK image; Stage 3 produces a minimal, hardened ASP.NET Core runtime image that hosts the API and serves the React UI from `UI_DIRECTORY`.
- **Construct a Production-Parity Docker Compose Stack**: Define `docker-compose.yml` orchestrating three distinct service profiles:
  1. `app`: The unified ASP.NET Core service and React UI running on port 4000.
  2. `mock`: The Stoplight Prism mock server running on port 4010.
  3. `harness`: An isolated test execution container running Node.js 24 and Playwright.
- **Provide a Containerized Linux Baseline Environment for Visual Testing**: Introduce a dedicated container definition (`docker-compose.visual.yml`) pinned to `ubuntu:24.04` with pre-installed Linux font packages and Playwright browser binaries. This allows developers on Windows and macOS workstations to execute `npm run check:visual:docker` locally, achieving 100% pixel-parity with CI screenshot baselines.
- **Support Dynamic Test-Control Configuration via Environment Overrides**: Configure `docker-compose.test.yml` to inject `TEST_CONTROL=true` and a secure `TEST_CONTROL_KEY` into the application container, exposing ports 4600 and 4601 for automated test harness execution without requiring local .NET SDK installations.
- **Configure Volume Mounts for Rapid Development Iterations**: In the development Compose profile, mount local workspace directories into containers with hot-reload enabled (`dotnet watch` for C# and Vite HMR for React), enabling full-stack local development with zero host-tooling dependencies.
- **Integrate Local Compose Verification into CI Workflows**: Add a lightweight sanity check step in `.github/workflows/ci.yml` that builds and spins up the Docker Compose stack, executes a basic curl health check against `http://localhost:4000/api/v1/bureaux`, and tears it down, verifying image buildability.

---

## 3. GitHub Actions CI/CD Workflow Modernisation

- **Enforce GitHub Branch Protection on the `main` Branch**: Transition repository gating from advisory checks to mandatory policy. Enable branch protection on `main`, requiring pull requests, disallowing direct pushes, and requiring status checks to pass for all core jobs (`Verify`, `UI`, `Bug-flag proof`, and `Visual`).
- **Parallelise the Bug-Flag Proof Matrix**: Modernise the `flags` job in `.github/workflows/ci.yml` by partitioning the 30 bug flags into a parallel matrix job grouped by architectural layer (e.g. `api-flags`, `ui-display-flags`, `ui-behaviour-flags`). This parallelisation will reduce wall-clock execution time from ~16-20 minutes to under 6 minutes.
- **Automate Test Result Aggregation and PR Commenting**: Integrate GitHub Actions annotations and step summary reporting for Serenity/JS test runs, axe-core scans, and visual diffs. If visual tests fail, automatically upload screenshot diff images and embed comparison previews directly in pull request comments.
- **Decouple GitHub Pages Deployment from Trunk Monolith**: Currently, `ci.yml` includes the `deploy` job inline on pushes to `main`. Split deployment into a dedicated workflow triggered via GitHub environment approvals, ensuring that site assembly (`site` job) is validated on all pull requests while artifact publication is isolated to approved release tags.
- **Establish Automated Dependency Auditing and Renovate/Dependabot Alerts**: Re-enable automated Dependabot security scanning and pull request generation. Incorporate `npm audit --omit=dev` as a blocking gate and configure automated Renovate rules for patch-level dependency updates.
- **Pin and Cache Playwright Browser Binaries Across Jobs**: Cache Playwright browser binaries (`~/.cache/ms-playwright`) across the `ui`, `flags`, and `visual` CI jobs keyed by `@playwright/test` version and runner OS, eliminating repetitive 10-14 minute apt/browser download delays on slow mirrors.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md)
