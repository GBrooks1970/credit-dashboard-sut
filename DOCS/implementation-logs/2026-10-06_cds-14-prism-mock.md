# CDS-14: Prism mock serves every operation (Phase 1 exit gate) — 2026-10-06

## Session Summary

The goal was the Phase 1 exit gate: the contract lints clean, every example validates, and a mock serves every operation. A spike against Prism 5.16.0 shaped an approved plan; the delivery pinned Prism, added a smoke run that calls all 36 contract operations, and put it in CI. The gate is met on `main` at `ed63834` (PR #3), and the portfolio registry records it (NeoCognitus70/portfolio-prompts#110, `e09032f`).

---

## Objectives

1. ✅ Find out how Prism treats this OpenAPI 3.1 contract before planning (throwaway spike, not committed).
2. ✅ Present a full implementation plan and get approval before changing anything (owner approved, with merge on green CI).
3. ✅ Make every operation callable from contract values alone (contract v9 path-parameter examples).
4. ✅ Smoke run over every operation, locally and in CI (`npm run check:mock`, 36 of 36).
5. ✅ Prove the smoke run can fail, and that it never leaves Prism running (planted bad example; port check).
6. ✅ Record the gate in the portfolio registry (fourth gate; status label), with `orchestration_target` kept false.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Contract | Redocly CLI 2.57.0 lint (house ruleset) | valid | valid | ✅ PASS |
| Fixtures | `npm --prefix fixtures run check` | 404/404 | 404/404 | ✅ PASS |
| Gherkin | `python tools/check-gherkin.py` | 21 files, 65 scenarios, BR 15/15 | 21 files, 65 scenarios, BR 15/15 | ✅ PASS |
| Mock | `npm run check:mock` (operations) | none (no mock check) | 36/36 | ✅ PASS |
| Mock | Call without a token gets 401 | none | 1/1 | ✅ PASS |
| CI | GitHub Actions run 37441204003 (PR #3) | 3 checks | 4 checks, 22 s | ✅ PASS |

Probe (expected to fail, and did): with `greetingName: ''` planted in the `GET /me` example, the smoke run reported 35 of 36, failing exactly `GET /me (getMe)` with Prism's 500 "Request/Response not valid" under `--errors`; exit code 1. The contract was restored byte for byte and the run returned to 36 of 36. Port 4010 had no listener after the passing run or after the failing run.

---

## Changes Implemented

### Spike: how Prism 5.16.0 behaves with this contract (not committed)

Run in the session scratchpad with a local install of `@stoplight/prism-cli@5.16.0`. Findings that shaped the plan:

- Prism loads the contract without warnings, serves the examples (including nullable fields and `greetingName`), answers 401 without a token, and validates request bodies and patterns.
- **Prism does not serve the server base path:** every `/api/v1/...` call got 404 "no path matched"; unprefixed calls worked.
- Requests that fail validation get **422** (with the contract's rule-violation example) where the API specification says 400.
- `/accounts/anything` got 422 because the `AccountId` pattern rejects it; `acc_7f3k2q` got 200.
- **Started through `npx` with a shell, Prism outlived the script** and kept port 4010; it was found and stopped. Started with `node` from a local install, it stopped cleanly.

### Contract v9: every operation callable from the contract

**Files changed:**
- `DOCS/.architecture/openapi.yaml`: `info.version` 0.6.2; schema examples on `AccountId` (`acc_7f3k2q`), `notificationId` (`ntf_3q9w1`) and `username` (`alex`), each taken from an existing response example; the Prism server entry is `http://localhost:4010`, with a description saying why (DR-039).

### API specification v9: the mock and its limits

**Files changed:**
- `DOCS/.design/api-specification.md`: section 3 "Mock" row (Prism 5.16.0, pinned, port 4010, no prefix, `npm run mock`); section 11 "Mock parity" row (what `npm run check:mock` requires, and the two known limits: 422 for malformed requests where the specification says 400, and 401 for a missing test-control key where the contract says 404).

### Mock tooling and pins

**Files changed:**
- `package.json` (new): private root manifest; exact pins `@stoplight/prism-cli` 5.16.0, `ajv` 8.20.0, `ajv-formats` 3.0.1, `yaml` 2.9.1 (the last three match `fixtures/`); scripts `mock` and `check:mock`.
- `package-lock.json` (new).
- `tools/mock-smoke.mjs` (new): builds one request per operation from the contract (path and required query values from the parameter's example, schema example, first enum value or default, following `$ref`s; the request-body example; a bearer token or test-control key by the operation's security); expects the lowest documented 2xx; fails on Prism's `sl-violations` header; validates the body with Ajv against the response schema inside the whole contract document, so `#/components/...` references resolve; checks `GET /me` without a token gets 401; always stops Prism (in `finally`, and on `exit` and `SIGINT`).

The first local run passed 35 of 36: `getAccountTotals` has a required `type` query parameter whose schema is a `$ref` to the `AccountType` enum, and the value lookup did not follow it. One-line fix in the tool:

```js
// before
const s = param.schema || {};
// after: follow the reference, then take the example, first enum value or default
const s = deref(param.schema).node || {};
```

### CI

**Files changed:**
- `.github/workflows/ci.yml`: job renamed "Specification (contract lint, fixtures, Gherkin, mock smoke)"; npm cache keyed on both lock files; new step "Mock smoke (every operation)" (`npm ci`, `npm run check:mock`).

### Portfolio registry (separate repository)

- NeoCognitus70/portfolio-prompts#110 (`e09032f`): fourth gate `npm ci && npm run check:mock`; status label "Phase 1 exit gate met 2026-10-06"; notes updated; `orchestration_target` unchanged (false). No landing change: its lock carries only project id, slug and role.

---

## Technical Decisions

Structural decisions are in `DOCS/decision-register.md` (this project's ADR log): **DR-039** (the mock is addressed without `/api/v1`) and **DR-040** (specifications at stable paths are edited in place; git keeps history). Implementation decisions below are not structural.

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Start Prism with `process.execPath` and the resolved `dist/index.js` from the local install | A direct child process can always be stopped; the spike showed `npx` through a shell outliving its caller | `npx` with `shell: true`; the `prism` bin through a shell |
| Validate response bodies with Ajv in addition to Prism's `--errors` | An independent check of the same contract; it does not rely on the mock judging itself | Trusting Prism alone |
| One request per operation, built only from contract values | The run proves the contract is complete enough to drive a client; missing values are reported, not invented | Hand-written request fixtures in the tool |
| Expect the lowest documented 2xx | Every operation documents exactly one 2xx (checked) | Accepting any 2xx |
| Only one negative check (no token gets 401) | The mock's other error answers diverge from the specification by design (DR-039 record; section 11) | Asserting 400 and 404 paths the mock cannot honour |
| The mock step in the existing CI job | One job keeps the four specification checks together; the whole job takes 22 s | A separate job |

---

## Documentation Updates

- `DOCS/.design/api-specification.md`: v9, sections 3 and 11.
- `DOCS/decision-register.md`: v7, DR-039 and DR-040; its stale `supersedes` line corrected (it named v5).
- `DOCS/backlog.md`: v22, CDS-14 complete with evidence; Phase 1 exit gate met.
- `README.md`: four checks; how to run the mock and where it listens.
- `CHANGELOG.md`: 2026-10-06 entry.
- `DOCS/templates/implementation-log.template.md`: copied verbatim from the portfolio's shared template (this log's first use).
- `DOCS/implementation-logs/2026-10-06_cds-14-prism-mock.md`: this log.

---

## Lessons Learned

- **Spike the tool against the real contract before planning.** Two of the plan's decisions (the base path, the error-status limits) came only from running Prism; neither was visible in its documentation or the contract.
- **A mock's error behaviour is not the specification's.** Prism validates shape faithfully but chooses its own status codes for failures. Record the gap where the check is defined, and leave status semantics to tests against the real service.
- **Child processes need an owner.** A tool that starts a server must start it directly and stop it on every path; then check the port after a failing run, not only a passing one.
- **A smoke run over every operation also tests the contract's completeness.** It found three path parameters with no example, which no lint rule flagged.
- **Follow `$ref`s everywhere a schema can appear,** including parameter schemas; the one failure in the first run was the tool, not the contract.

---

## Recommendations / Next Steps

- [ ] CDS-15: generate the typed TypeScript client into `packages/api-client` from the contract; plan first, as for CDS-14. Owner approval; next in Phase 1.
- [ ] CDS-16: pin the .NET SDK (`global.json`), React and Vite as each project is created (DR-009). With the first project of each kind.
- [ ] Decide whether `orchestration_target` should now be true (the trigger set at onboarding is met). Owner decision.
- [ ] Update the landing card summary, which still says Phase 1 "has started". Low priority; landing repository.
- [ ] Watch the first CI run after 19 October 2026, when GitHub's `ubuntu-latest` moves to Ubuntu 26. Low priority.
- [ ] CDS-17: convert the backlog table to the `auth-table` dialect when a Kanban board is wanted. Owner's timing.

---

*Session logged: 2026-10-06. Author: Claude Code.*
