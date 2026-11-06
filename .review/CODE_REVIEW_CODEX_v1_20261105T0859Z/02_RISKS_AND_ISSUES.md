# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md)

**Reviewer:** AI assistant (Codex GPT-6)

All four entries are MEDIUM in the context of a synthetic demonstration SUT. C-01/C-02 are current actionable findings; C-03/C-04 are explicitly accepted residual risks and must not be misrepresented as new closure blockers.

## C-01 - MEDIUM - Terminal line feed is accepted as part of a mobile number

- **Risk description:** the national and international regexes end with `$`, which can match before a terminal LF. Normalisation retains that LF and `LastThreeDigits` returns two digits plus LF.
- **Evidence:** [demo-apps/demoapp001-dotnet-api/CreditDashboard.BusinessRules/Profile/Mobile.cs](../../demo-apps/demoapp001-dotnet-api/CreditDashboard.BusinessRules/Profile/Mobile.cs) (line 30); [demo-apps/demoapp001-dotnet-api/CreditDashboard.BusinessRules/Profile/Mobile.cs](../../demo-apps/demoapp001-dotnet-api/CreditDashboard.BusinessRules/Profile/Mobile.cs) (line 48); [demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Routes/Profile.cs](../../demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Routes/Profile.cs) (line 140). `MobileChange` permits a bounded string for domain validation, while `MobileContact` requires a three-digit value. [DOCS/.architecture/openapi.yaml](../../DOCS/.architecture/openapi.yaml) (line 1432); [DOCS/.architecture/openapi.yaml](../../DOCS/.architecture/openapi.yaml) (line 1425).
- **Reproduction:** in the existing in-memory `ServiceHost`, `PUT /me/profile/mobile` with `{"number":"07700900456\n"}` returned 200 and `{"lastDigits":"56\n","status":"unverified",...}`. The `+447700900456\n` case behaved the same. A four-case scratch NUnit probe expected 422 for both and failed exactly those two cases; the valid number and CRLF-rejection controls passed.
- **Impact:** invalid input is accepted, and invalid contact data is stored and returned. A contract-validating consumer rejects the response even though the operation reports success. No real phone/SMS service or real personal data is involved.
- **Recommendation:** anchor both patterns to the entire input with `\A` and `\z`, preserving only the explicitly permitted ASCII-space removal. Add national/international LF, CRLF, tab and valid-space cases at both pure-rule and API levels, asserting invalid submissions do not change the profile. Require response-contract validation on the valid controls. Microsoft's [anchor documentation](https://learn.microsoft.com/en-us/dotnet/standard/base-types/anchors-in-regular-expressions) confirms the `$` versus `\z` semantics.
- **Classification:** newly confirmed functional/contract defect; the passing 437-test API baseline does not cover this input.

## C-02 - MEDIUM - Development audit acceptance no longer describes the current graph

- **Risk description:** the README states the full audit is 15 development findings all within Prism. Fresh audits now report findings in fixture, UI and harness package graphs as well.
- **Evidence:** [README.md](../../README.md) (line 65); [fixtures/package-lock.json](../../fixtures/package-lock.json) (line 58); [demo-apps/demoapp001-react-ui/package-lock.json](../../demo-apps/demoapp001-react-ui/package-lock.json) (line 1834); [test-harnesses/harness-serenity/package-lock.json](../../test-harnesses/harness-serenity/package-lock.json) (line 1668). Fresh full-audit package counts: root 10 (7 high/3 moderate), fixtures 1 moderate, API client 0, UI 1 high, harness 2 (1 high/1 moderate). All five `--omit=dev --package-lock-only` audits reported zero.
- **Impact:** the existing acceptance cannot be used as blanket approval for newly reported tooling exposure. Local installation, test runners and mock tooling remain part of the development trust boundary. This is not evidence that the deployed browser bundle or .NET service contains these npm development vulnerabilities.
- **Recommendation:** reconcile each newly affected dependency with its actual execution path, update compatible locks where fixes are available, and separately record any retained bounded risk. Update the README with dated package scope rather than a timeless total. Do not apply npm's suggested Prism downgrade blindly or use a forced major repair. Rerun the relevant package tests and audit each package root.
- **Classification:** current dependency maintenance/documentation finding. The full audit JSON is retained; package counts are not unique advisory counts and are not summed across roots.

## C-03 - MEDIUM - Publication does not represent every assurance lane (accepted)

- **Risk description:** `report` depends only on `specification` and `ui`; `site` depends on report; `deploy` depends on site. The flag-proof job and separate visual workflow do not gate that publication.
- **Evidence:** [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (line 215); [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (line 136); [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (line 321). DR-068 explicitly records this behaviour. [DOCS/decision-register.md](../../DOCS/decision-register.md) (line 83).
- **Impact:** a report can publish while flag proof or visual assurance is failing/pending. That is consistent with the accepted scope of the report, but readers must not treat it as a combined whole-project green signal.
- **Recommendation:** retain explicit public wording about the scope of the report. If a future requirement is 'publish only after every assurance lane', add a deliberate combined gate that handles cross-workflow SHA and completion correctly, with failure/cancellation tests. Do not silently alter the accepted deployment contract in a review task.
- **Classification:** previously accepted residual assurance risk; no remote run or actual bad publication was observed.

## C-04 - MEDIUM - Catcher timeout may leave descendants running (accepted)

- **Risk description:** the proof invokes catchers via `spawnSync` with a timeout and `SIGKILL` for the child, without explicit process-group/tree ownership for its browser and worker descendants.
- **Evidence:** [test-harnesses/harness-serenity/src/flags/prove-flags.ts](../../test-harnesses/harness-serenity/src/flags/prove-flags.ts) (line 61); outer cleanup is at [test-harnesses/harness-serenity/scripts/run.mjs](../../test-harnesses/harness-serenity/scripts/run.mjs) (line 104). The terminal backlog explicitly defers process-group killing of timed-out catchers. [DOCS/backlog.md](../../DOCS/backlog.md) (line 11).
- **Impact:** after a timeout, descendant processes can consume resources or contaminate a subsequent local run. This is a lifecycle risk under failure, not evidence that the baseline leaves processes behind.
- **Recommendation:** when selected as future work, introduce a portable child-tree abstraction with bounded graceful/forced shutdown. Test a controlled child that spawns a sleeping grandchild on Windows and Linux; assert no survivor and a clear timeout verdict. Preserve diagnostic logs and existing false-positive/zero-test controls.
- **Classification:** already known and deferred; not dynamically reproduced in this review because deliberately creating hung browser trees was outside the lightweight validation scope.

---

[<- Previous](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](03_PROJECT_REVIEWS/PROJECT_001_CREDIT_DASHBOARD_SUT.md)
