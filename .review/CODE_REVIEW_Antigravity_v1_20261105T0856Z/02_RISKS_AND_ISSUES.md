# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md)

**Reviewer:** AI assistant (Antigravity)
**Date:** 2026-11-05T08:56Z
**Scope:** Vulnerabilities, architectural risks, and operational hazards in `credit-dashboard-sut`, ordered from highest to lowest priority.

---

### Risk 1: Unprotected `main` Branch and Advisory Status Checks

- **Risk Description/Explanation**:
  The GitHub repository settings do not enforce branch protection rules on `main`. Although pull requests trigger four comprehensive workflows (`CI`, `Visual`, etc.), developers or automated processes can push commits directly to `main` without required reviews or passing status checks.
- **Evidence Outline**:
  - Found recorded in canonical project status documentation:
    [DOCS/backlog.md](DOCS/backlog.md) (lines 11, 281):
    ```markdown
    and the owner's repository settings (protect main, Actions may open pull requests, Dependabot alerts), which are not code.
    ...
    main is unprotected, so every check is advisory;
    ```
  - Documented in decision register [DOCS/decision-register.md](DOCS/decision-register.md) (line 83, DR-068):
    ```markdown
    main is unprotected, so every check is advisory;
    ```
  - Workflow configuration [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 3-6, 317-324):
    ```yaml
    on:
      push:
        branches: [main]
      pull_request:
    ...
    deploy:
      name: Deploy (GitHub Pages, main only)
      needs: [site]
      if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
    ```
- **Impact Analysis**:
  Because pushes directly to `main` are permitted, any broken commit pushed inadvertently to `main` immediately triggers the deployment pipeline. While the `deploy` job depends on the `site` job passing on `main`, broken code can still enter repository history, corrupting the published Kanban board, breaking the live Serenity report, or introducing unreviewed defects into the public showcase.
- **Refactor Recommendation and Strategy**:
  Configure GitHub branch protection rules on `main` to require:
  1. Mandatory pull requests before merging (disallow direct pushes).
  2. Required status checks to pass before merging: `Verify (contract lint, fixtures, Gherkin, mock smoke, client, service, Schemathesis, Kanban)`, `UI (typecheck, component tests, build, @ui scenarios)`, `Bug-flag proof`, and `Visual`.
  3. Require branches to be up to date before merging.

---

### Risk 2: Process Group Detachment and Orphaned Child Processes on Test Runner Timeout

- **Risk Description/Explanation**:
  When test runner timeouts occur in `scripts/run.mjs`, the script invokes `runner.kill()` on the top-level spawned process (`node`). On Windows and Unix systems, killing the parent process of a detached process tree does not recursively terminate grandchild processes. Background child processes (such as spawned `dotnet` workers or Chromium browser instances launched by Playwright) can survive as orphaned zombie processes.
- **Evidence Outline**:
  - Located in [test-harnesses/harness-serenity/scripts/run.mjs](test-harnesses/harness-serenity/scripts/run.mjs) (lines 102-106, 153-165):
    ```javascript
    let runner; // the Cucumber, exit or flags process while it runs
    const stop = () => {
        if (runner && runner.exitCode === null) runner.kill();
        for (const i of instances) if (!i.exited) i.child.kill();
    };
    ...
    function runChild(command, env) {
        return new Promise((resolve) => {
            runner = spawn(process.execPath, command, { cwd: harness, stdio: 'inherit', env });
            let timedOut = false;
            const timer = setTimeout(() => {
                timedOut = true;
                runner.kill();
            }, limitMs);
            runner.on('exit', (status) => {
                clearTimeout(timer);
                resolve({ status, timedOut });
            });
        });
    }
    ```
  - Documented as an acknowledged residual limitation in [DOCS/backlog.md](DOCS/backlog.md) (line 11, line 281) and DR-068:
    ```markdown
    the process-group kill of timed-out flag-proof catchers (a hung catcher can leave its children running; found by CDS-48, not needed for the evidence)
    ```
- **Impact Analysis**:
  During local execution or on self-hosted CI runners, a timed-out run leaves orphaned `dotnet` or Chromium processes holding operating system file locks and listening on network sockets (e.g. ports 4600 and 4601). Subsequent test executions fail at startup with `harness: something already answers on port 4600`, requiring manual process termination.
- **Refactor Recommendation and Strategy**:
  1. Spawn child processes in their own process group by setting `{ detached: true }` (on POSIX) or utilizing a process-tree killing utility such as `tree-kill`.
  2. Implement a cross-platform termination helper: on Windows, execute `taskkill /pid <PID> /T /F`; on POSIX, send `-runner.pid` to kill the entire process group.
  3. Ensure that the `stop()` cleanup function iterates through all registered child PIDs and confirms process termination before returning.

---

### Risk 3: Platform Lock-in for Visual Regression Baselines (Linux Ubuntu 24.04-only)

- **Risk Description/Explanation**:
  Visual regression screenshot baselines are strictly locked to Linux Ubuntu 24.04 rendering. Local test runs on Windows or macOS machines are prevented from running visual regression comparisons unless an explicit throw-away override (`VISUAL_LOCAL_TRY=1`) is supplied.
- **Evidence Outline**:
  - Found in [test-harnesses/harness-serenity/scripts/run.mjs](test-harnesses/harness-serenity/scripts/run.mjs) (lines 38-41):
    ```javascript
    if (requested === 'visual' && process.env.CI !== 'true' && process.env.VISUAL_LOCAL_TRY !== '1') {
        console.error('harness: the visual checks compare with baselines made on Linux CI; nothing was compared here (VISUAL_LOCAL_TRY=1 looks for flaky pages against throw-away images and is never a result)');
        process.exit(1);
    }
    ```
  - Workflow pinning in [.github/workflows/visual.yml](.github/workflows/visual.yml) (lines 42-45):
    ```yaml
    jobs:
      visual:
        name: Visual (eight pages, two widths, light and dark, and the tab bar, against the baselines)
        runs-on: ubuntu-24.04
    ```
  - Documented in decision register [DOCS/decision-register.md](DOCS/decision-register.md) (line 82, DR-067; line 83, DR-068).
- **Impact Analysis**:
  Developers working on local Windows or macOS workstations cannot obtain immediate, authoritative visual regression feedback while refactoring UI components. They must push branches to GitHub and wait for the remote `Visual` workflow, increasing cycle time and development latency. Furthermore, when GitHub Actions deprecates `ubuntu-24.04`, baseline snapshots will render slightly differently, requiring full baseline re-generation.
- **Refactor Recommendation and Strategy**:
  1. Provide a Docker Compose or devcontainer definition pinning a lightweight Linux container with the exact Ubuntu 24.04 font packages and Playwright browser binaries.
  2. Allow developers to run `npm run check:visual:docker` locally, ensuring 100% pixel-parity with CI baselines.

---

### Risk 4: Transitive Development Dependency Vulnerabilities in Legacy CLI Tooling

- **Risk Description/Explanation**:
  The repository root and sub-packages contain unpatched vulnerabilities in development-only dependencies. The primary cluster stems from `@stoplight/prism-cli` 5.16.0 (10 vulnerabilities: 7 high, 3 moderate, including `@faker-js/faker` arbitrary code execution GHSA-qxc2-j82w-r537 and `lodash` code injection GHSA-r5fr-rjxr-66jc). Additionally, sub-packages carry vulnerabilities in `fast-uri` (moderate), `follow-redirects` (high, GHSA-mrwp-f3q8-3g9p), and `undici` (high, GHSA-4qv8-2p9j-2685).
- **Evidence Outline**:
  - Pinned in root [package.json](package.json) (line 33):
    ```json
    "@stoplight/prism-cli": "5.16.0",
    ```
  - Root dependency audit output:
    `npm audit` reports 10 vulnerabilities (3 moderate, 7 high).
  - Sub-package audit output:
    `test-harnesses/harness-serenity` audit reports 2 vulnerabilities (`fast-uri`, `follow-redirects`); `demo-apps/demoapp001-react-ui` reports 1 high vulnerability (`undici`).
  - Formal risk acceptance recorded in [DOCS/backlog.md](DOCS/backlog.md) (lines 337-359, CDS-26) and [DOCS/decision-register.md](DOCS/decision-register.md) (line 66, DR-051).
- **Impact Analysis**:
  While production dependencies are completely clean (`npm audit --omit=dev` reports 0 vulnerabilities) and Prism runs strictly bound to loopback `127.0.0.1`, running vulnerable CLI tools in local development environments exposes developer machines to potential exploitation if malicious mocks or untrusted payloads are loaded.
- **Refactor Recommendation and Strategy**:
  1. Evaluate upgrading or replacing Stoplight Prism with a modernized OpenAPI mock server or a lightweight in-house mock server built on Fastify or Node.js native `http`.
  2. Apply targeted npm `overrides` in `package.json` for transitive dependencies like `fast-uri`, `follow-redirects`, and `undici` where breaking changes do not affect build tooling.
  3. Re-enable Dependabot alerts for development dependencies to maintain ongoing security posture.

---

### Risk 5: Boundary Coverage Limitations in Custom DOM Semantic Rules

- **Risk Description/Explanation**:
  The exit audit injects hand-crafted semantic layout evaluation scripts into Playwright pages to catch accessibility and visual inconsistencies. These rules contain known boundary blind spots where subtle rendering bugs can evade detection.
- **Evidence Outline**:
  - Found in [test-harnesses/harness-serenity/src/exit/semantic-rules.ts](test-harnesses/harness-serenity/src/exit/semantic-rules.ts) (lines 32-35, 38-44):
    ```javascript
    // progress-value-matches-text: the bar's value is the figure written beside it.
    for (const bar of bars) {
        const written = bar.previousElementSibling ? /(-?\d+)%/.exec(bar.previousElementSibling.textContent || '') : null;
        if (!written) { say('progress-value-matches-text', bar, 'has no percentage written beside it'); continue; }
        const now = Number(bar.getAttribute('aria-valuenow'));
        if (now !== Number(written[1])) say('progress-value-matches-text', bar, 'has aria-valuenow ' + now + ' but the text beside it says ' + written[1] + '%');
    ```
  - Documented limitations in [DOCS/decision-register.md](DOCS/decision-register.md) (line 83, DR-068):
    ```markdown
    the semantic rules do not see a wrong value in words with no percentage sign, a wrong-width fill that is not the track's first child, a decimal percentage, a placeholder that only starts like a stand-in, a descriptive alt on an image not marked decorative, a chart value cell that repeats the month, or a 0 of 0 cell;
    ```
- **Impact Analysis**:
  If frontend components are refactored so that the percentage label is nested inside a sibling container, formatted without a literal `%` symbol, or represented as a decimal fraction, `progress-value-matches-text` will fail to extract the label, reporting a false negative or missing a genuine regression where visual text diverges from `aria-valuenow`.
- **Refactor Recommendation and Strategy**:
  1. Use standard accessible name and role calculation algorithms (e.g. `aria-labelledby` or `aria-describedby`) rather than relying on strict DOM sibling adjacency (`previousElementSibling`).
  2. Expand regular expressions to support decimal figures (`/(-?\d+(?:\.\d+)?)%/`) and whitespace variations.

---

### Risk 6: Serial Execution and Extended Duration of the Bug-Flag Proof Suite

- **Risk Description/Explanation**:
  The bug flag verification runner (`npm run check:bug-flags`) tests all 30 flags sequentially. Each flag test resets service state, applies the flag, executes specific catchers, and verifies results. This leads to a prolonged run time of 16-20 minutes in CI.
- **Evidence Outline**:
  - Located in [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 136-144):
    ```yaml
    flags:
      name: Bug-flag proof (each implemented flag on and off against its catchers)
      runs-on: ubuntu-24.04
      timeout-minutes: 40
    ```
  - Backlog duration notes in [DOCS/backlog.md](DOCS/backlog.md) (line 301):
    ```markdown
    The flags CI job takes 16m41s (limit 30).
    ```
  - Documented in decision register [DOCS/decision-register.md](DOCS/decision-register.md) (line 82, DR-067).
- **Impact Analysis**:
  Because bug flags mutate shared in-memory singleton state (`FlagsMiddleware`, `ControlledClock`, `PersonaStore`), tests cannot execute concurrently against a single service instance. The extended test duration bottlenecks developer iteration and consumes substantial GitHub Actions runner minutes.
- **Refactor Recommendation and Strategy**:
  1. Partition the 30 flags across isolated test workers, with each worker spinning up an ephemeral service instance on unique dynamic ports (e.g. ports 4610, 4620, 4630).
  2. Alternatively, partition flag proofs into parallel GitHub Actions matrix jobs grouped by layer (API flags vs UI display flags vs UI behaviour flags), reducing wall-clock execution time to under 6 minutes.

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md)
