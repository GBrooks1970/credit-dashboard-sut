# Recommendations

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (Antigravity)
**Date:** 2026-11-05T08:56Z
**Scope:** Actionable refactoring proposals, operational next steps, and strategic future project opportunities for `credit-dashboard-sut`.

---

## 1. Recommended Refactors

- **Implement Process-Tree Termination in the Harness Runner**: Refactor `runChild()` and `stop()` in [scripts/run.mjs](test-harnesses/harness-serenity/scripts/run.mjs) (lines 103-106, 153-165) to spawn child processes within a dedicated process group (`{ detached: true }` on POSIX) or wrap execution with a cross-platform process tree killer (e.g. `tree-kill` or native `taskkill /pid <PID> /T /F` on Windows). This will eliminate orphaned background `dotnet` and Chromium child processes when runner timeouts occur.
- **Isolate Bug-Flag Proof Execution with Ephemeral Ports**: Currently, `check:bug-flags` runs all 30 flags sequentially against a single service instance due to shared in-memory state, requiring 16-20 minutes in CI. Refactor the runner to spawn ephemeral worker instances on dynamic ports (e.g. 4610, 4620), allowing parallel test execution across CPU cores and slashing execution time to under 5 minutes.
- **Decouple Semantic Layout Rules from Strict DOM Sibling Adjacency**: Refactor custom in-browser semantic inspection rules in [src/exit/semantic-rules.ts](test-harnesses/harness-serenity/src/exit/semantic-rules.ts) (lines 33-36) to look up progress labels using standard accessibility relationships (`aria-labelledby`, `aria-describedby`) or semantic container traversal rather than relying on brittle `bar.previousElementSibling` adjacency.
- **Apply NPM Overrides to Eliminate Transitive Dev-Dependency Advisories**: Mitigate the 10 vulnerabilities flagged by `npm audit` in the root tree and sub-packages. Apply targeted npm `overrides` in `package.json` for transitive packages (`fast-uri`, `follow-redirects`, `undici`, `qs`) where non-breaking security patches are available, and plan the eventual replacement of legacy `@stoplight/prism-cli` 5.16.0.

---

## 2. Next Steps

- **Enable Branch Protection on `main`**: Configure GitHub repository settings to enforce branch protection on `main`. Require pull requests, restrict direct pushes, and enforce passing status checks for `Verify`, `UI`, `Bug-flag proof`, and `Visual` workflows to prevent untested commits from entering the trunk and triggering automated Pages deployments.
- **Provide a Dockerized Visual Baseline Runner for Local Workstations**: Author a lightweight Docker Compose service or container execution script (`npm run check:visual:docker`) that mirrors the Ubuntu 24.04 font and rendering environment. This will enable local developers on Windows and macOS workstations to execute authoritative visual regression checks without having to wait for remote CI.
- **Re-Enable Dependabot Security and Version Alerts**: In accordance with the project closure plan ([DOCS/backlog.md](DOCS/backlog.md) (line 11)), re-enable Dependabot security vulnerability notifications in repository settings to monitor future CVE discoveries against pinned dependencies across the .NET and Node.js ecosystems.
- **Document the Planted Bug-Flag Proof in Showcase Portfolios**: Promote the empirical bug flag proof table ([DOCS/evidence/phase-5-bug-flag-proof_2026-10-23.md](DOCS/evidence/phase-5-bug-flag-proof_2026-10-23.md)) on the public portfolio landing page as primary evidence of test suite defect-detection capability.

---

## 3. Future Project Ideas

- **Implement the Stretch Profile Pages (Address, Employment, Finances)**: In Phase 0 and Phase 4, the address, employment, and finances sub-pages were deferred as stretch scope (DR-022). Authoring OpenAPI schemas, synthetic fixture structures, and React components for these pages would provide a natural Phase 6 expansion covering multi-step form validation, financial income verification, and credit eligibility workflows.
- **Package ScoreHarbour as a Standalone Multi-Arch Docker Container**: Build a published container image (e.g. `ghcr.io/gbrooks1970/credit-dashboard-sut`) packaging the compiled ASP.NET Core API serving the pre-built React UI. This would enable external testers and interviewers to spin up the entire system under test with `docker run -p 4000:4000` for exploratory testing or workshop demonstrations.
- **Introduce Automated Chaos Engineering and Network Fault Injection**: Expand the test-control surface (`/__test/*`) to support dynamic fault injection (e.g. HTTP 503 Service Unavailable, dropped TCP sockets, malformed JSON streams, and jitter latency). Add corresponding Serenity/JS scenarios verifying frontend resilience, circuit breaker fallbacks, and user retry interactions under degraded network conditions.
- **Author a Comparative Test Framework Spike (Playwright-BDD / Cypress)**: Build an experimental parallel test harness implementing identical Gherkin feature scenarios in Cypress or playwright-bdd, producing an empirical benchmark comparing execution speed, reporter ergonomics, and framework maintainability against the Serenity/JS Screenplay implementation.

---

[<- Previous: Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
