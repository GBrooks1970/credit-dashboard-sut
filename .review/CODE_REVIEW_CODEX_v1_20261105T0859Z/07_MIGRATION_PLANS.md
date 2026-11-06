# Migration Strategy and Plans

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](ANNEX/VALIDATION_AND_SCOPE.md)

**Reviewer:** AI assistant (Codex GPT-6)

## Single Source of Truth for Features

- Keep the existing shared feature corpus and generated-client pipeline.
- Add the mobile boundary case to the existing rule/operation case ownership before changing implementation.
- Implement strict end-of-input matching without broad whitespace normalisation.
- Assert both rejected HTTP status and unchanged stored profile; validate successful response shapes.
- Run pure rules and in-memory service tests, then the normal API lane in an authorised repair workflow.
- Effort is small and local; regression risk is accidentally rejecting valid spaced numbers or accepting new separators.

## Docker Compose for Local Development

N/A - the container image is explicitly deferred at project closure and the repository is not asking for a Compose migration. [DOCS/backlog.md](../../DOCS/backlog.md) (line 11). Existing native harness process ownership is the relevant lifecycle boundary. If a later phase selects containers, verify Docker storage at `E:\_DockerData`, preserve the synthetic data/control-key boundary, and establish its own native/container parity evidence.

## GitHub Actions/Workflow

- Preserve the existing specification/UI/report/site/deploy separation and SHA-pinned Actions. [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (line 17).
- Refresh C-02 dependency acceptance with package-scoped checks; do not replace CI with a broad forced audit repair.
- Keep the published report's stated scope accurate while C-03 remains accepted.
- If combined assurance is later required, design a gate that matches commit IDs across the flags and visual lanes and handles pending/failure/cancellation explicitly.
- Add controlled process-tree cleanup tests for C-04 before exercising cancellation in heavyweight browser runs.
- Review integration remains separate: this task writes only its own versioned folder and performs no commits, PRs or deployment.

---

[<- Previous](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](ANNEX/VALIDATION_AND_SCOPE.md)
