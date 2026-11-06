# Dependency, Security and Licence Pass

[<- Back to Index](../00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](../00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md)

**Reviewer:** AI assistant (Codex GPT-6)

## Fresh npm Audit Matrix

| Package root | Full audit package records | Production-only package records |
| --- | --- | --- |
| repository root | 10: 7 high, 3 moderate | 0 |
| `fixtures` | 1 moderate | 0 |
| `packages/api-client` | 0 | 0 |
| React UI | 1 high | 0 |
| Serenity harness | 2: 1 high, 1 moderate | 0 |

Captured on 2026-11-05. Counts are npm affected-package records, which propagate through dependency parents and repeat across package roots. They are not a count of independent exploits. See [captured JSON](AUDIT_RESULTS.json).

The fixture/harness fast-uri and UI undici findings fall outside the README's all-Prism description. [fixtures/package-lock.json](../../../fixtures/package-lock.json) (line 58); [demo-apps/demoapp001-react-ui/package-lock.json](../../../demo-apps/demoapp001-react-ui/package-lock.json) (line 1834); [README.md](../../../README.md) (line 65). The harness's locked follow-redirects is covered by the newly reported [cross-realm header advisory](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p). Its reported affected range is 1.16.0-1.16.1 and patch is 1.16.2; no application-specific credential leak was demonstrated. [test-harnesses/harness-serenity/package-lock.json](../../../test-harnesses/harness-serenity/package-lock.json) (line 1668). npm's fix suggestions are proposals, not proof that a downgrade/major change is compatible.

## .NET and Python

The restored .NET solution's transitive vulnerability listing returned no vulnerable packages. This is a point-in-time feed result, not proof of absence of unknown issues. The Python parser ran but its broader Schemathesis/tooling environment was not fully audited. No complete dependency freshness or abandonment claim is made; current concrete advisories justify the bounded maintenance recommendations.

## Secrets and Unsafe Inputs

All documented users, mobile codes and financial data are synthetic. Test-control gating is explicit and a missing required key prevents enabled service startup; UI public-build guards test removal of debug markers. [demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs](../../../demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs) (line 12); [demo-apps/demoapp001-react-ui/scripts/public-build-guard.test.mjs](../../../demo-apps/demoapp001-react-ui/scripts/public-build-guard.test.mjs) (line 1). The limited tracked-file secret-pattern scan is reported in the final validation note; no full-history/entropy scan or external secret validation was performed. Never confuse the intentional `demo-only` fixture key with evidence of a live credential leak.

User-facing redirect targets are resolved against an internal base and checked for same-origin single-slash paths. [demo-apps/demoapp001-react-ui/src/safeRedirect.ts](../../../demo-apps/demoapp001-react-ui/src/safeRedirect.ts) (line 24). JSON/contract validation constrains unsafe shapes; C-01 is a concrete semantic input gap. The harness stores tokens in scenario state, invalidates them on clock/persona changes and scans report content through tested guards. This review does not claim a penetration test or production-ready financial/security certification.

## Lockfile Freshness and Reproduction

Separate package locks make ownership explicit. Generated-client drift checks and .NET baseline tests passed. Existing installed JavaScript toolchains were reused, so a clean installation was not proven. Production-only audits used committed lockfiles directly. Refresh only the affected owned graph, preserving generated-client compatibility and the UI/harness versions that must move together.

## Licence

The root licence and repository package metadata declare MIT. [LICENSE](../../../LICENSE) (line 1); [package.json](../../../package.json) (line 6). The inspected UI and harness package metadata also declare MIT. No project-licence mismatch was found. This pass does not certify every transitive notice obligation or provide a legal opinion.

---

[<- Previous](VALIDATION_AND_SCOPE.md) | [Back to Index](../00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](../00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md)
