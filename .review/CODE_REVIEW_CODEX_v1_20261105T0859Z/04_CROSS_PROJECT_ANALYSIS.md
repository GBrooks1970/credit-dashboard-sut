# Cross-Cutting Analysis Within the Repository

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (Codex GPT-6)

## Tool-Agnostic Tests

- Gherkin is the readable common specification, with API and UI profiles in one Serenity/JS harness.
- Pure rules and API host tests use NUnit; report and proof helpers have native Node tests. Each layer uses a suitable runner.
- A different UI framework could reuse the contract and features, but selectors/tasks would need an adapter; no cross-framework equivalence is claimed.

## Code-Agnostic Tests

- The contract-validating client/harness crosses the C# service boundary without importing service implementation code. [test-harnesses/harness-serenity/src/abilities/CallAnApi.ts](../../test-harnesses/harness-serenity/src/abilities/CallAnApi.ts) (line 56).
- Pure-rule tests exercise the C# implementation directly, while the independent HTTP contract can expose response drift.
- C-01 illustrates an input absent from a successful corpus, not a reason to remove independent contract validation.

## Single Source of Truth

- OpenAPI owns operation shapes; generated types are drift-checked. The backlog owns status, and the board check reports 48/48 Done.
- Fixture schema checks passed 868 assertions over seven personas, two users and twelve override samples.
- Bug flags are explicitly implemented or pending in the registry; the current fixture check finds 30/30 implemented. Implementation count is not current proof count.

## API Contract Compliance

- The service validates requests at the edge; harness responses are validated independently before steps consume them. [demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs](../../demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs) (line 12); [test-harnesses/harness-serenity/src/abilities/CallAnApi.ts](../../test-harnesses/harness-serenity/src/abilities/CallAnApi.ts) (line 56).
- Operation/response tests and the contract linter passed. Mobile LF input still produces an invalid success response (C-01).
- Authentication, control-key, Problem content type and retry headers have negative tests in the passing harness unit suite.

## Screenplay Parity

- N/A - there is one Screenplay implementation, with API and UI profiles rather than competing language implementations.
- The profiles share fixtures, state-reset conventions and contract operations, while browser-specific abilities remain in the UI layer. [test-harnesses/harness-serenity/src/ui/hooks.ts](../../test-harnesses/harness-serenity/src/ui/hooks.ts) (line 37).
- Tasks arrange/act; assertions should remain observations. The existing design and independently validated responses provide a sound boundary.

## Batch File Design

- N/A - orchestration is Node/TypeScript and npm, not a Windows batch-script suite.
- `verify.mjs` runs a known ordered check set and stops on failed installation; UI/visual/flags are deliberately separate lanes. [tools/verify.mjs](../../tools/verify.mjs) (line 14).
- Script timeouts, owned service ports and diagnostics are good; process-tree cleanup remains the specific accepted gap (C-04).

## Documentation Alignment

- Current backlog/board closure agrees with source and the fresh board drift check. [DOCS/backlog.md](../../DOCS/backlog.md) (line 11).
- Older phase-gate figures are dated historical baselines, not conflicting present-day counts to silently rewrite.
- The README dependency statement is presented as current and is now inaccurate (C-02). The registry's older scenario/component figures also should not supersede current repository evidence.

## Logging Alignment

- Failed scenarios capture diagnostic context, and report guards reject unknown file types and token/key patterns in their tested cases.
- API and UI Serenity JSON are retained from the actual CI runs, then assembled into a single site; flags have a separate 90-day proof artifact. [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (line 215); [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (line 136).
- Commit stamps establish the stated source identity but are not independent proof that every lane ran on it; this limit is recorded in DR-068.

## Test Coverage Metrics

- Fresh .NET baseline: 239 pure-rule and 437 API tests, zero failed/skipped. These are separate from scratch negative probes.
- Fresh harness: 97 unit tests; fixture validation: 868 checks plus seven tests; UI public-build guard: 32 tests.
- Gherkin parse: 23 files, 77 scenarios/outlines, BR 15/15 and PR 10/11. This is tag coverage, not every rule combination or execution count.
- Historical UI component count is 216 and browser evidence includes 34 visual cases; neither was freshly validated by a complete UI/browser lane here.

## Lifecycle, Isolation and Synchronisation

The harness owns two services, refuses occupied ports, resets fixture/clock/persona/flag state before scenarios and rejects parallel Cucumber workers because service state is shared. Browser actors get fresh contexts, and shutdown has bounded timeout diagnostics. [test-harnesses/harness-serenity/scripts/run.mjs](../../test-harnesses/harness-serenity/scripts/run.mjs) (line 29); [test-harnesses/harness-serenity/src/ui/hooks.ts](../../test-harnesses/harness-serenity/src/ui/hooks.ts) (line 37); [test-harnesses/harness-serenity/src/support/parallel.ts](../../test-harnesses/harness-serenity/src/support/parallel.ts) (line 5). The shared clock model is appropriate for deterministic state transitions, provided runs remain serial. UI latest-request ownership prevents stale responses from winning; this review inspected the implementation but did not perform a new interactive browser rehearsal. [demo-apps/demoapp001-react-ui/src/useLatest.ts](../../demo-apps/demoapp001-react-ui/src/useLatest.ts) (line 7).

## Data Setup, API Tokens and Auth

Fixtures are synthetic; login is lazy, tokens are cached by user, and persona binds/clock changes invalidate the relevant tokens. [test-harnesses/harness-serenity/src/abilities/CallAnApi.ts](../../test-harnesses/harness-serenity/src/abilities/CallAnApi.ts) (line 26); [test-harnesses/harness-serenity/src/abilities/ControlTheTestEnvironment.ts](../../test-harnesses/harness-serenity/src/abilities/ControlTheTestEnvironment.ts) (line 61). Reset assertions check more than a 204 response: the state readback includes flags, clock, latency, personas and overrides. [test-harnesses/harness-serenity/src/abilities/ControlTheTestEnvironment.ts](../../test-harnesses/harness-serenity/src/abilities/ControlTheTestEnvironment.ts) (line 15). Test control requires the configured key, and public-build guards prevent test-only UI markers from entering a public build. The synthetic demo code/passwords are intentional test inputs, not live credentials. This is not a production identity-provider architecture.

## CI, Caches, Images and Reproduction

Actions are pinned by SHA, job permissions default to read, deployment credentials are separated, and Node/.NET caches are keyed by relevant locks. Visual/flag lanes pin Ubuntu 24.04 to avoid unreviewed baseline rendering changes; cache correctness does not make moving runner tools perfectly reproducible. The accepted container-image deferral means no Docker parity claim is available. No Docker images were pulled. A clean installation and full `verify`/UI/flags/visual pipeline were not run in the shared checkout, preserving concurrent work. C-03 describes exactly what publication currently waits for.

---

[<- Previous](03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](05_RECOMMENDATIONS.md)
