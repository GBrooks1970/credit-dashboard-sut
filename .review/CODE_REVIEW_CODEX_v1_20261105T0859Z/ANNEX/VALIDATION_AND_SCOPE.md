# Validation and Scope

[<- Back to Index](../00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](DEPENDENCY_SECURITY_LICENCE.md)

**Reviewer:** AI assistant (Codex GPT-6)

**Reviewed SHA:** `563977edcffbe881d7ee1683eb2179c9cd3f3c32`. **Date:** 2026-11-05. Node 24.18.0, npm 11.16.0, .NET SDK 10.0.403. The isolated source used the repository's own test host and restored .NET dependencies. A concurrent review-only merge advanced the shared checkout to `5c0db29d7692860d3784e0a556ddd62ac1b34bfb`; the eight added files were solely the other review.

## Review method and limits

One dedicated sub-agent was assigned to this project. It inspected the repository and captured isolated validation evidence before a usage limit stopped it. The coordinating Codex reviewer completed the review, checked the saved command output, and independently verified the significant probes. This is one combined Codex review, not two independent approvals.

The scope covers the maintained application, specifications, test architecture, runners, CI, dependency manifests and locks, backlog, decisions and operational documentation. Repository mapping used `rg --files`; generated outputs, dependencies, old review bodies and archived reports were excluded from manual code assessment. The review is comprehensive by subsystem, not a claim of exhaustive path coverage or a formal security audit. No implementation or backlog was changed. Recommendations remain candidates for a separately authorised implementation task.

Tests and probes ran in uniquely named scratch snapshots. Existing installed toolchains were reused; this is not proof of a clean-machine installation. Negative probes are deliberately failing tests and are recorded separately from the unchanged baseline. Current GitHub checks, branch protection and live Pages content were not queried. Historical CI and publication claims remain dated repository evidence.

## Fresh Baseline Commands

| Command | Observed result | Wrapper seconds where captured |
| --- | --- | --- |
| `node node_modules/@redocly/cli/bin/cli.js lint` | exit 0; contract valid | 14.621 |
| `npm --prefix fixtures run check` | exit 0; 868 checks, 0 failures; 7 tests pass | 17.481 |
| `python tools/check-gherkin.py` | exit 0; 23 files, 77 scenarios; BR 15/15, PR 10/11 | 1.623 |
| `npm --prefix packages/api-client run check` | exit 0; generated types current, 2909 lines; TypeScript check passes | 28.803 |
| `npm --prefix test-harnesses/harness-serenity run typecheck` | exit 0 | 79.722 |
| `npm --prefix test-harnesses/harness-serenity run test:unit` | exit 0; 97 tests pass, 0 failed/skipped | 24.215 |
| `npm --prefix demo-apps/demoapp001-react-ui run typecheck` | exit 0 | 32.065 |
| `node --test demo-apps/demoapp001-react-ui/scripts/public-build-guard.test.mjs` | exit 0; 32 tests pass | 2.076 |
| `npm run --silent check:kanban` | exit 0; 48 tickets, 48 Done | 3.114 |
| `dotnet test demo-apps/demoapp001-dotnet-api/CreditDashboard.sln -c Release --nologo` | 239 rules + 437 API tests pass, 0 failed/skipped; runner durations 1 s and 2 m 53 s | total not captured |
| full npm audits, five package roots | findings in root/fixtures/UI/harness; API client clean | not captured |
| `npm audit --package-lock-only --omit=dev --json`, five package roots | all exit 0, zero reported findings | 3.101-4.447 per root |
| `dotnet package list --project demo-apps/demoapp001-dotnet-api/CreditDashboard.sln --vulnerable --include-transitive --format json --no-restore` | exit 0, no vulnerable packages reported | not captured |

The saved .NET baseline log contains successful runner summaries. It is not reused as a claim that a fresh complete CI workflow ran. Full npm audit counts are package records, not unique vulnerabilities.

## Independent Mobile Probe

A scratch-only NUnit fixture used the existing `ServiceHost`, froze time to `2026-10-03T09:00:00Z`, signed in as the synthetic test user, and sent each value through `PUT /me/profile/mobile`.

| Input | Expected HTTP | Actual HTTP | Result |
| --- | --- | --- | --- |
| `07700900456` | 200 | 200 | pass |
| `07700900456\n` | 422 | 200 | fail |
| `+447700900456\n` | 422 | 200 | fail |
| `07700900456\r\n` | 422 | 422 | pass |

Command: `dotnet test demo-apps/demoapp001-dotnet-api/CreditDashboard.Api.Tests/CreditDashboard.Api.Tests.csproj -c Release --no-restore --nologo --filter FullyQualifiedName~ReviewMobileBoundaryTests`.

Output: `Failed: 2, Passed: 2, Skipped: 0, Total: 4, Duration: 2 s`. Both LF responses included `"lastDigits":"56\n"`. This intentional failure is the evidence for C-01, not a failure of the unchanged baseline. The probe was never added to the shared repository.

## Skipped or Unsuccessful Checks

- Full aggregate `npm ci && npm run verify` was not executed: it reinstalls package dependencies, runs live service/Schemathesis/API suites and is unsuitable for the shared concurrent checkout.
- A scratch UI-component attempt (`npm --prefix demo-apps/demoapp001-react-ui test -- --maxWorkers=2`) failed before tests because `vitest` was not on that snapshot's npm script path. This is an isolation/setup limitation, not a failed application test or a claim that Vitest is absent from the real checkout.
- No complete UI component/browser suite, axe/layout run, semantic-rule browser run, visual baseline comparison, 30-flag proof, mock smoke, current coverage percentage, fresh clean npm installation, Docker run or benchmark is claimed.
- Python Gherkin tooling ran, but a complete Python dependency audit of the Schemathesis environment was not completed. No clean audit claim is made for that environment.
- No remote CI, Pages availability or current branch-protection state was queried. DR-068's settings/CI statements remain dated repository evidence.

## Scope Discipline

The two current findings do not overwrite historical gate evidence, and accepted/deferred limits are explicitly labelled. No implementation, backlog, generated board, branch, shared review index or other review was changed by this task.


## Final Source/Secret Check

A limited scan of tracked text files, excluding historical review bodies, generated dependencies, binary files and files above 2 MB, found no matches for private-key headers or the checked GitHub, AWS access-key and OpenAI project-key forms. Only file names/counts could be emitted; no potential secret values were printed. This is a pattern scan, not a full-history or entropy-based secret audit. Source SHA and concurrent-change boundaries are recorded in the index.

---

[<- Previous](../07_MIGRATION_PLANS.md) | [Back to Index](../00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](DEPENDENCY_SECURITY_LICENCE.md)
