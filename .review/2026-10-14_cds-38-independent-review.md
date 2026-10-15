---
version: 1
created: 2026-10-15T12:18Z
project: credit-dashboard-sut
type: review
item: CDS-38
reviewed_commit: 409249e (main, clean working tree; the merge of the review plan, #75)
reviewer: three general-purpose subagents (Claude Code Agent tool), model Opus 5.5 (claude-opus-5-5), fresh context, one per area; launched 2026-10-15T10:18Z
language: en-GB
---

# CDS-38: independent review of the Phase 3 service, the harness and the Phase 4 UI

**What this is.** The record required by decision brief 12 D1 option 2 and DR-063, to the approved plan (`DOCS/implementation-plans/2026-10-14_cds-38-independent-review.md`; D1 blind, D2 three in parallel, D3 may run things in a copy outside the repository, D4 review plus one confirmation pass, D5 Blockers and Changes fixed before P3, D6 per-finding sign-off). Sections 2 and 3 are the reviewers' prompts and reports, **copied unchanged**. Section 4 is the author's verification of each Blocker and Change finding, kept separate so that the reviewers' words are not altered. Section 5 records the owner's sign-off.

**How it was run.** Each reviewer was told only to read its prompt file. The prompt files were written before launch and are quoted in full in section 2; their SHA-256 values are in the table. The reviewers worked in copies of the repository outside it. Each was asked to write its report to a file; the harness refused that for the subagents ("Subagents should return findings as text, not write report files"), so each returned the report as text and the main session saved it unchanged. Reviewer A was stopped once by a usage limit (HTTP 429) and was resumed with its transcript intact; it then returned its complete report.

**Departures from the rules that the reviewers disclosed.** A, B and C each ran one read-only `git log` (and C also `git status`) in the real repository before reading the rule against it; none changed anything. A's and C's first runs wrote temporary files to the system temp folder (C deleted its own); A mapped a drive letter to its copy to get round a path-length limit and removed it.

## 1. The reviewers

| Area | Scope | Ports | Prompt SHA-256 | Report |
|---|---|---|---|---|
| A, the service | the service, the BusinessRules library, test control, the seven API flags, the service tests | 4710 to 4712 | `685ba5bf0f64bfad7a225c0fbea52234babc56ac12f89d70c4c1f62098d7562a` | 6 Blocker, 13 Change, 10 Note |
| B, the harness | the harness, scenario steps, isolation, the contract validator, the flag proof and registry, the fixtures | 4720 to 4722 | `58290d6a88bceb40196227c125600c1c0e220860c9134046d64c4a360050c5e6` | 5 Blocker, 15 Change, 6 Note |
| C, the UI | the UI, exit checks, CI and tooling, security and privacy, documents against code | 4730 to 4732 | `c6b6f0671a51800009a244601a0f8882dc379d54d7c6a348cdea6f2afc9c2b0a` | 3 Blocker, 20 Change, 10 Note |

Totals as reported by the reviewers: **14 Blocker, 48 Change, 26 Note**.

## 2. The reviewers' prompts (verbatim)

Each prompt is the shared text followed by the area section. The shared text is identical in all three; it is printed once here, and each area section after it. A reviewer's actual prompt file is the shared text with its area section appended (the SHA-256 above is of that file).

### 2.1 Shared text

````markdown
You are an independent reviewer of a software project. You did not write any of the material you are reviewing, and you have not been told what its author concluded. Your job is to find out, by reading and by running checks, where the code, the checks that test it and the documents disagree with the specifications, and above all where a check can pass when it should fail, or fail when it should pass.

## Rules

- DO NOT MODIFY THE REPOSITORY. Do not create, edit, move or delete any file inside it. Do not run git commands in it. Do not fetch anything from the network.
- You MAY copy the repository to a scratch folder outside it and run things there. Copy the folder with `cp -r` (or `robocopy`), leaving out `.git`. Everything you need is already installed in the copy (`node_modules`, build outputs); do not run `npm install` or `npm ci`, and if a check needs a download, skip it and say so. Run the project's own checks, and write your own mutation probes: change a line in the COPY to introduce a defect, run the check that ought to notice, and report whether it did.
- Use only your own network ports, set with the environment variables named in your area section, so that you do not collide with the two other reviewers who are running at the same time.
- The only file you write outside your scratch folder is your report, at the path given in your area section.
- Write in British English. No em dashes and no exclamation marks in prose.
- Every finding must quote both sides: the code or check text, and the specification or contract text it disagrees with, each with its file path and line number.
- "No findings" for a check is only acceptable with a count of what you examined.
- For every probe you run, report what you changed, what you expected, and what happened. A probe that did not fail when it should have is a finding.
- Report what you could not do (a check that would not run, a file you did not read), so that a gap is visible rather than hidden.

## Repository

`D:\_CLAUDE_COWORK\PROJ001\claude-outputs\test-automation-portfolio\credit-dashboard-sut` (called REPO below), at commit `409249e` on `main`, with a clean working tree. Windows; both Git Bash and PowerShell are available.

How the project is run (from REPO, or from your copy of it):

- `npm run verify` runs 14 steps in about four minutes (three installs, eleven checks). It needs Python with `tools/requirements.txt` and the .NET 10 SDK, both present. It installs dependencies with `npm ci`, which needs the network: do not run it as a whole. Run its individual checks instead (`package.json` scripts: `check:service`, `check:harness`, `check:schemathesis`, `check:client`, `check:mock`, `check:service-contract`, `check:ui`, `check:ui-scenarios`, `check:ui-exit`, `check:bug-flags`, `check:kanban`; `fixtures/` has `npm run check`).
- A Chromium is already installed. Set `HARNESS_BROWSER_PATH=C:/Users/brook/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe` for any harness run that opens a browser.
- The harness runner `test-harnesses/harness-serenity/scripts/run.mjs` starts the service itself on `HARNESS_PORT` (default 4600) and `HARNESS_OFF_PORT` (default 4601). Schemathesis uses `SERVICE_PORT` (default 4500). Always set your own.

## What the project is

A fictional UK credit-health dashboard built as a system under test, specification first: one OpenAPI contract, an ASP.NET Core minimal API on .NET 10 with a pure C# business-rules library, a React 19 UI, a Serenity/JS harness that runs one shared Gherkin store (`features-shared/`) against both the API and the UI, and a set of switchable defects ("bug flags") that test control can turn on so the checks can be shown to catch them. Read `README.md` first.

## Sources of truth to check against

- `DOCS/.architecture/openapi.yaml` (the contract).
- `DOCS/.design/api-specification.md` (conventions, business rules BR-01 to BR-15, personas, test control, bug flags), `business-rules-cases.md`, `operations-cases.md`, `profile-rules-cases.md`.
- `DOCS/.design/ui-specification.md`, `ui-feature-profile.md` (pages, hooks, states, accessibility, the PR rules).
- `DOCS/.design/harness-design.md`, `DOCS/step-glossary.md`, `DOCS/glossary.md`.
- `features-shared/` (the Gherkin scenarios) and `fixtures/` (personas, users, override samples, the bug-flag registry).
- `DOCS/decision-register.md` (later entries refine earlier ones).

Ignore `DOCS/decision-briefs/`, `DOCS/backlog.md`, `DOCS/implementation-plans/`, `DOCS/implementation-logs/`, `DOCS/walkthroughs/`, `.review/`, `CHANGELOG.md`, `credit-dashboard-sut_implementation-kanban_v1.html` and any session or handover material: they describe history and the author's own account, not the current truth. Do not read them to decide whether something is right.

## Severity

- **Blocker:** the code or a check contradicts a specification or the contract so that it would behave wrongly, or a check passes when it should fail (or fails when it should pass), or a security or privacy weakness.
- **Change:** stale, ambiguous or inconsistent wording; a weak check that could be stronger; a coverage gap; a robustness problem with no wrong behaviour today.
- **Note:** an observation that needs no change.

## Report format

```
# CDS-38 independent review, area <A|B|C>: report

## Summary
<two to five sentences: overall verdict and the counts of Blocker, Change and Note findings>

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| ...one row per check of your area, then one for each probe set... | ... | none, or the finding IDs |

## Probes
| Probe | What I changed (in the copy) | What I expected | What happened |
|---|---|---|---|

## Findings
### <A|B|C>-01 (Blocker|Change|Note, <check id>): <short title>
- Where: <file:line>
- Code or check text: "<quote>"
- Specification or contract text: "<quote>" (<file:line>)
- Why it matters: <one or two sentences>
- Suggested fix: <one or two sentences>

## Not done
<what you could not run or did not read, and why>

## Method
<how you worked: what you read, what you ran, what the copy was>
```

When you have written the report, reply with only its Summary section and the counts of findings by severity.
````

### 2.2 Area section, reviewer A, the service

````markdown
## Your area: A, the service

Your ports: `HARNESS_PORT=4710`, `HARNESS_OFF_PORT=4711`, `SERVICE_PORT=4712`. Your scratch folder: `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38\copy_A`. Your report: `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38\report_A.md`.

## Material under review

`demo-apps/demoapp001-dotnet-api/`: `CreditDashboard.Api/` (the service), `CreditDashboard.BusinessRules/` (the pure rules library), and both test projects `CreditDashboard.Api.Tests/` and `CreditDashboard.BusinessRules.Tests/`. Also `tools/generate-service-contract.mjs` and `tools/schemathesis-run.mjs` where they touch the service.

## Checklist

- **A1, rules.** Each of BR-01 to BR-15 and PR-01 to PR-11 as implemented (in the BusinessRules library and where the API uses it) against the specification and its cases file: the rule's text, its boundaries (inclusive or exclusive limits, zero, negative, rounding, month and year edges, the six-year window, the 60-second and 10-minute windows, the third wrong code), and what the tests assert about each. Flag a rule whose implementation or whose tests disagree with its text, and a boundary no test reaches.
- **A2, operations.** Each of the 36 operations in the contract against its implementation: the methods, paths, status codes, headers (`Retry-After`, `Allow`), request validation at the edge, response shapes, ownership (BR-15), authentication and token handling, paging, the ordering the contract states. Count the operations you traced. Flag a status or shape that differs from the contract, and an operation whose behaviour no test pins.
- **A3, robustness and security.** Token lifetime, expiry and revocation; the test-control gate (disabled, no key, wrong key) and whether anything in the test-control surface is reachable without the gate; the hosting of the built UI from `UI_DIRECTORY` (path handling and traversal, which files can be served, caching headers, behaviour for non-GET methods); error responses (leakage of internals, stack traces); the shared store and its locking (concurrent requests, a reset in the middle of a request); the clock; request-size and malformed-input handling; anything that lets one user affect or read another's data outside BR-15.
- **A4, bug flags in the service.** The `Flags` mechanism (how the set of flags on is held for a request, and whether that is sound under concurrency and across `await`), each of the seven API flags (`excluded-in-total`, `rounding-down`, `history-carry-forward`, `idor`, `problem-json-missing`, `mask-format`, `currency-float`): does it change only what its name and `DOCS/.design/api-specification.md` section 10 say, is it off by default and after a reset, does turning one on ever change a response on a path it should not touch. Then `fixtures/bug-flags.json` against the code: every flag it marks as implemented in the service, and no more.
- **A5, the service tests.** Do the tests assert something that would fail if the behaviour were wrong, or only that code ran. Look for tautologies, assertions on the wrong variable, tests that cannot fail, over-broad matchers, and tests that depend on order or on shared state. Run the service tests in your copy, and by mutation probes show that at least ten of them can fail: change one line of the service or rules in the copy, and see which test notices.

## Probes you must run

At least eight mutation probes in your copy, spread over A1 to A4 (for example: change a rounding rule; move a boundary by one; drop an ownership check; weaken the test-control gate; return a different status; make a flag stay on after a reset). For each, report which test, if any, failed.
````

### 2.3 Area section, reviewer B, the harness, the scenarios' steps and the bug-flag proof

````markdown
## Your area: B, the harness, the scenarios' steps and the bug-flag proof

Your ports: `HARNESS_PORT=4720`, `HARNESS_OFF_PORT=4721`, `SERVICE_PORT=4722`. Your scratch folder: `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38\copy_B`. Your report: `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38\report_B.md`.

## Material under review

`test-harnesses/harness-serenity/` (abilities, `src/api/`, `src/ui/`, `src/steps/`, `src/support/`, `src/contract/`, `src/exit/`, `src/flags/`, `scripts/run.mjs`, `cucumber.mjs`); `features-shared/` as the thing the steps implement; `fixtures/` (personas, users, override samples, `schema-check.mjs`, `bug-flags.json`); `DOCS/step-glossary.md` and `DOCS/.design/harness-design.md` as the harness's own specification.

## Checklist

- **B1, steps against scenarios.** For every step definition (count them, API and UI), does it assert what its Gherkin sentence says? Look for: an assertion weaker than the sentence (`includes` where the sentence says equals; a presence check where it says a value); a step that can pass vacuously (a locator that matches nothing and a count of zero that is accepted; a wait that is not awaited; an assertion inside a promise nobody returns); a value the step compares against that comes from the fixture instead of the system under test, or from the same source as the system's own answer, so the two cannot disagree; a Then that does not depend on the preceding When; a step that is defined once for a Given and a When and does something different from what the sentence says in one of them. For ten scenarios of your choice (at least four `@ui` and four `@api`), trace the whole scenario from Gherkin to assertion and say what would make it pass wrongly.
- **B2, isolation.** What each scenario starts from (the reset, the persona, the clock, the cached tokens, the flags), what can leak between scenarios (module-level state, the `scenario` object, a browser context, storage, the service's store), what happens if two scenarios ran in parallel, and what happens after a failed scenario.
- **B3, contract validation.** The Ajv-based validator in `src/contract/`: is it as strict as it claims (additional properties, formats, nullable and `oneOf` handling, `examples`, unknown status codes, content types, response headers), and does an undocumented status or content type really fail. Prove it with probes (feed it a response with an extra property, a wrong type, an undocumented status).
- **B4, the bug-flag proof and the registry.** `src/flags/prove-flags.ts`, `fixtures/bug-flags.json`, the part of `scripts/run.mjs` that runs the proof, and the `HARNESS_BUGS` and `CDS_FLAGS` mechanisms. Can a flag be reported "caught" for the wrong reason (a `failsWith` text that is too loose, that appears in the output whatever happens, or that a different failure also contains)? Can a catcher that ran nothing, crashed, or timed out be counted as a catch? Is the "something ran" guard sound? Does the off run really have the flag off (what resets it, in which order)? Can two flags interfere? Process, port and environment handling: leftover processes, an unset variable, a path with a space, a quoting or injection risk in how it builds commands. Does `schema-check.mjs` really tie the registry to the contract and to the scenarios and tests the catchers name?
- **B5, the fixtures.** The personas, users and override samples against the rules they claim to exercise (BR-03 boundaries, BR-05 exclusions, BR-12 payment months, BR-13 closed accounts, BR-15 ownership), and `schema-check.mjs`: does it check the rules independently of the service, or restate the service's own logic.

## Probes you must run

At least eight mutation probes in your copy, spread over B1 to B4, for example: weaken one step's assertion and see whether the scenario still passes; make the service return a wrong value and see which scenario notices; change a `failsWith` in the registry to something loose and see whether the proof still says "caught"; make a catcher name match nothing; break the validator's strictness; leave a flag on across a reset. For each, report whether the harness noticed.

Also run, in your copy, `check:harness` (the `@api` scenarios) and `check:bug-flags` once, and say how long each took and what they reported.
````

### 2.4 Area section, reviewer C, the UI, the exit checks, CI and the documents

````markdown
## Your area: C, the UI, the exit checks, CI and the documents

Your ports: `HARNESS_PORT=4730`, `HARNESS_OFF_PORT=4731`, `SERVICE_PORT=4732`. Your scratch folder: `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38\copy_C`. Your report: `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38\report_C.md`.

## Material under review

`demo-apps/demoapp001-react-ui/` (source and its Vitest tests); `test-harnesses/harness-serenity/src/exit/exit-checks.ts` (the accessibility and layout checks); `.github/workflows/`; the `package.json` files and lock files at the root and in each package; `tools/`; `README.md` and the specifications as claims to be checked against the code.

## Checklist

- **C1, pages against the UI specification.** The page catalogue (section 5), each page's specification (section 6), the hooks (`data-testid`, section 4.1), the four section states (4.3), formatting (4.2: whole pounds in summaries, pence in details, 'in credit', over-limit labels), and the profile pages against `ui-feature-profile.md`. Count the pages and hooks you checked. Flag a hook, state, copy or behaviour that differs, a hook the specification names that does not exist, and a hook the code has that the specification does not mention.
- **C2, behaviour.** The session (the token held in memory only: where else could it leak); the redirect-back after sign-in and the open-redirect guard (`src/safeRedirect.ts`: try many hostile addresses, including encoded ones, `//host`, backslashes, whitespace and control characters, `javascript:` and `data:`); forms and their error paths (the details form, the preferred name, email, mobile and code steps); stale responses and races in `useEffect` and `useResource` (a response arriving after the page changed; the same effect running twice under React Strict Mode); error and empty states; anything that can throw during render.
- **C3, accessibility and semantics.** UI specification section 4.5 against the code (names, roles, `aria-` attributes, focus handling, the visually hidden table alternatives, colour contrast claims, keyboard use), and whether the exit checks scan what they say they scan: which pages and states are covered and which are not, whether a violation would really fail the run, whether the layout checks measure what they claim. Run `check:ui-exit` once in your copy and say what it reported.
- **C4, security and privacy.** Injection (any `dangerouslySetInnerHTML`, building HTML or URLs from data, `target=_blank` without `rel`); browser storage use; personal data in addresses and page titles (rule PR-08); error messages shown verbatim from the service; and **whether the public build contains any test code.** The UI has a "test build" (`VITE_TEST_BUILD=true`) that reads bug flags and has a debug page. In your copy, build the UI WITHOUT that variable (`npm run build` in the UI package, with the variable unset), then search the built files (`dist/`) for the flag names, the debug page, the control-key storage name and the test-control path, and say what you found. Then build it WITH the variable and compare.
- **C5, CI, scripts, pins and supply chain.** `.github/workflows/*.yml` (permissions, which actions and at what pins, what runs on pull requests from forks, secrets, the Pages deployment and what it publishes), the `package.json` scripts, version pins (exact or ranged), lock files present and consistent, `npm audit` results (run it in your copy if it works offline; say if it does not), any script that builds shell commands from data.
- **C6, documents against code.** The README, the specifications and the glossaries as claims: counts (scenarios, tests, flags, pages), statuses, file paths, commands, ports, versions. Count and check at least thirty distinct claims against the code or against running the command, and report each that is wrong or stale.

## Probes you must run

At least eight mutation probes in your copy, spread over C1 to C4, for example: rename a hook the scenarios use; make a page show a wrong figure; remove an `aria-` name; weaken the open-redirect guard; leave a flag effect in the public build; break a layout at 375 px. For each, report whether the component tests, the `@ui` scenarios or the exit checks noticed (run the relevant one: `check:ui`, `check:ui-scenarios`, `check:ui-exit`).
````

The launch message each reviewer received was: "Your complete instructions are in the file <path to prompt_X.md>. Read it in full and do exactly what it says. Nothing else is asked of you." The files were resolved to the scratch folder paths named in each area section.

## 3. The reviewers' reports (verbatim)

### 3.1 Report of reviewer A

The text below is exactly what the reviewer returned. Its headings are left as written so that its words are unchanged; read its own "CDS-38 independent review, area A" line as the start of the report.

````markdown
# CDS-38 independent review, area A: report

## Summary
The service largely matches its contract, and its tests are strong. All 573 service tests pass in the copy (234 rules tests, 339 API tests). 27 of my 28 mutation probes turned at least one test red, and the one that didn't (M11) was caught only by a single flag test, not by the tests written for that rule. The weaknesses are at the edges. An unhandled fault returns an empty 500, or in the Development launch profile a full stack trace, and an unauthenticated caller can trigger one. A double slash in the path shows that test-control operations exist even with test control off. The resend rate limit can be beaten by parallel requests. `X-Correlation-Id` is not implemented. The clock input does not follow RFC 3339. Several bug flags reach further, or less far, than section 10 says. **Counts: 6 Blocker, 13 Change, 10 Note.**

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| A1 rules | 15 BR rules and 11 PR rules against api-specification s7, business-rules-cases.md (all rows), profile-rules-cases.md (all rows) and ui-feature-profile s5. 10 library mutation probes | A-04, A-14, A-16, A-17, A-23, A-26 |
| A2 operations | All 36 contract operations traced, from the route through the handler to the response shape and statuses. Order of checks probed live. Unknown-bureau 404 tests counted: 9 of the 11 bureau operations are tested | A-05, A-07, A-15, A-19, A-29 |
| A3 robustness and security | Token lifetime, expiry and revocation (3 tests and 1 probe). Gate tested 8 path variants × with and without key, plus test control off. UI hosting: 11 paths × 5 methods. Malformed input: 10 cases. Concurrency: 2 bursts × 10 trials. Clock: 10 inputs. Development and Production environments | A-01, A-02, A-03, A-04, A-06, A-18, A-20, A-21, A-22 |
| A4 bug flags | `Flags`/`FlagsMiddleware` and the AsyncLocal flow read for soundness (sound). All 7 API flags probed live for scope. Every flag off after a reset (probe). bug-flags.json: 30 entries, the 7 service flags marked implemented match `Flags.Implemented` exactly; 2 service flags pending | A-08, A-09, A-10, A-11, A-24, A-28 |
| A5 service tests | Read all 9 API test files and 9 rules test files. Ran them: 573 passed, 0 failed. 28 mutation probes | A-12, A-13, A-14, A-19, A-25, A-27 |
| Fixture check (`fixtures` `npm run check`) | 655 checks, 0 failures; 30 flags in the contract, 8 implemented (7 service plus `plural`) | none |
| Probe set: mutations M01–M28 | 28 probes | M11 caught only by the flag test (A-12) |
| Probe set: live probes | Gate, clock, overrides, duplicate keys, Development environment, races, flags, UI hosting | A-01 to A-06, A-08 to A-11, A-20 |

## Probes
All mutation probes were applied to copy_A and restored afterwards. `diff -rq` against REPO shows the source tree identical.

| Probe | What I changed (in the copy) | What I expected | What happened |
|---|---|---|---|
| M01 | Utilisation.cs: floor division replaced by truncating `numerator / denominator` (BR-03) | Negative-half cases fail | 7 failed (4 rules, 3 API), e.g. `Utilisation_is_balance_over_limit_rounded_half_up(-4400,100000,-4)` |
| M02 | Accounts.cs `today < closeDate.AddYears(6)` changed to `<=` (BR-13) | Anniversary cases fail | 4 failed, including both leap-day cases and the API anniversary test |
| M03 | Debt.cs `*100 <= earlier` changed to `<` (BR-07 inclusive 1%) | Exact ±1% cases fail | 4 failed |
| M04 | Email.cs `elapsed >= ResendInterval` changed to `>` (PR-09) | Exact 60 s cases fail | 2 failed |
| M05 | Mobile.cs `>= CodeLifetime` changed to `>` (PR-10) | Exact 10 min cases fail | 3 failed |
| M06 | Mobile.cs `remaining <= 0` changed to `< 0` (PR-11, third wrong code) | Third-wrong-code tests fail | 2 failed |
| M07 | PaymentHistory.cs window `Year - 6` changed to `Year - 7` (BR-12) | Window tests fail | 5 failed |
| M08 | AccountDetails.cs `Round(value, 2)` changed to `Round(value, 3)` (BR-14) | 29.999 cases fail | 2 failed |
| M09 | Reports.cs: upper-casing dropped (BR-09) | Letter masks fail | 7 failed |
| M10 | Reports.cs: `Math.Max(0, …)` dropped (BR-08) | Past-date cases fail | 4 failed |
| M11 | Routes/Accounts.cs: `if (!Flags.Has("idor")) return null;` removed (BR-15 off) | All BR-15 404 tests fail | **Only 1 failed**: `Idor_lets_one_customer_read_another_customers_account`. The 5 AccountTests BR-15 cases stayed green (A-12) |
| M12 | Report.cs searches: `OrderByDescending` changed to `OrderBy` | Order test fails | 1 failed: `Searches_are_newest_first` |
| M13 | Problems.cs: not-found status 404 changed to 403 | Many fail | 32 failed |
| M14 | ReportData.Page: skip uses `pageSize - 1` | Paging tests fail | 2 failed |
| M15 | Problems.cs: `Retry-After` header line removed | 429 test fails | 1 failed |
| M16 | Session.cs: `tokens.Revoke` removed (logout) | Logout test fails | 1 failed |
| M17 | Authentication.cs `UtcNow < ExpiresAt` changed to `<=` | Expiry boundary fails | 1 failed |
| M18 | TestControlGate: key check changed to `return given.Length >= 0;` (any key, or none) | Gate tests fail | 3 failed |
| M19 | TestControlOptions: enabled whenever a key is set | Disabled-gate test fails | 1 failed |
| M20 | PersonaStore.Reset: `_sessions = [];` removed | Reset test fails | 1 failed (SessionTests). The TestControlTests reset test did not notice (A-13) |
| M21 | Reset: `_clock.Release();` removed | Reset test fails | 1 failed |
| M22 | Reset: `_flags = [];` removed (a flag stays on after a reset) | Flag reset tests fail | 2 failed |
| M23 | Defects: mask-format always on | Mask tests fail | 22 failed |
| M24 | Defects: excluded-in-total inverted (on by default) | Totals and debt tests fail | 5 failed |
| M25 | `Flags.Implemented` without currency-float | Registry test fails | 1 failed |
| M26 | Accounts.UpdateDetail: paymentMethod stored before validation | The "changes nothing" check should notice | 1 failed. It was caught by the response-schema check on the later GET (enum), not by the test's own assertion on `apr` (A-25) |
| M27 | ReportData.Money: `Defects.Amount` bypassed (currency-float can never take effect) | Flag test fails | 1 failed |
| M28 | TestControl.BindPersona: violations never refused (`> 99`) | 422 tests fail | 9 failed |
| L1 | Live: `GET /api/v1//__test/reset`, no key, TEST_CONTROL off (port 4711) | 404 like every other `/__test/*` call | 405 with `Allow: POST` (A-03) |
| L2 | Live, Development: login body `{"username":"alex","username":"sam","password":"demo-only"}` | 400 or a problem document | 500 with a full .NET stack trace and source paths in the body (A-01). In Production: 500, empty body, no content type (A-02) |
| L3 | Live: override with `openedDate:"x"`; limit -100; balance 1e20 | 400 or 422 | 500, empty body (A-02) |
| L4 | Live: 12 parallel resends × 10 trials | One 202 per burst | Trial 0: two 202s (A-04) |
| L5 | Live: 12 parallel wrong codes × 10 trials | No more than 2 `code-wrong` | Never more than 2: not reproduced |
| L6 | Live: clock inputs `2026-10-03T09:00:00`, `2026-10-03T09:00`, `2026-10-03t09:00:00z` | 400, 400, 204 | 204, 204, 400 (A-06) |
| L7 | Live flags: excluded-in-total and debt; currency-float and balance history; mask-format and totals; problem-json-missing and test control | Each changes only what section 10 says | Debt total 19827960 → 19944060. Balance history stays integer. Test-control 400 becomes text/plain (A-08 to A-11) |
| L8 | Live UI hosting: traversal (4 forms), `.env`, unknown extension | Not served | Safe: each answered with index.html |

## Findings

### A-01 (Blocker, A3): The Development launch profile returns stack traces to unauthenticated callers
- Where: `demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Program.cs:48-57` (no exception handler); `Properties/launchSettings.json:10`; `package.json:23`
- Code or check text: launchSettings `"ASPNETCORE_ENVIRONMENT": "Development"`, and `npm run service` is `"dotnet run --project demo-apps/demoapp001-dotnet-api/CreditDashboard.Api"`. The live response body began: "System.ArgumentException: An item with the same key has already been added. Key: username … at CreditDashboard.Api.Routes.Session.Login(…) in Q:\demo-apps\…"
- Specification or contract text: "500 | `/internal` | `error` persona, or an unhandled fault; no stack trace in the body" (`DOCS/.design/api-specification.md:248`)
- Why it matters: anyone who can reach the service started by `npm run service` can read internal types and source paths without signing in.
- Suggested fix: add an exception handler (`UseExceptionHandler`) ahead of every other middleware that writes `Problems.Internal`, whatever the environment.

### A-02 (Blocker, A3): Unhandled faults give an empty 500, and unauthenticated input can trigger one
- Where: `Routes/Session.cs:51-53`, and the same `body["…"]` pattern in every handler; `Control/OverridesValidator.cs:43-57`; `BusinessRules/Utilisation.cs:16`; `Edge/ContractValidation.cs:91-95`
- Code or check text: `var username = body["username"]!.GetValue<string>();`. `JsonObject` throws on duplicate keys, while the edge's `JsonDocument.Parse` accepts them. `if (limitMinor < 0) throw new ArgumentOutOfRangeException(...)`. `a["openedDate"]!.GetValue<string>()[..7]`. Formats such as `date` are not asserted at the edge (`EvaluationOptions` sets only `OutputFormat`).
- Specification or contract text: "500 | `/internal` | … or an unhandled fault" (api-specification.md:248); "A body that fails the schema is a `400`" (api-specification.md:185). `login` documents only 200, 400 and 401 (openapi.yaml:57-64).
- Why it matters: login, the preferred-name edit, the detail edit and `PUT /__test/bugs` answered 500 with no body and no content type, so a contract validator sees an undocumented status. Overrides with impossible dates (`2026-02-30`, month `2026-13`) are accepted with 204 and can break later reads.
- Suggested fix: refuse duplicate keys at the edge (parse with `JsonNode` there, or check for them), assert `format`, and map unhandled faults to `/problems/internal`.

### A-03 (Blocker, A3): A double slash shows that test-control operations exist, even with test control off
- Where: `Control/TestControlGate.cs:16-17` against `Edge/ContractModel.cs:87,103`
- Code or check text: the gate tests `path.StartsWith(basePath + "/__test/", StringComparison.Ordinal)`, while the edge matches on `relativePath.Trim('/').Split('/')`. Live, with no key and TEST_CONTROL off: `GET /api/v1//__test/reset` gives "405 … Allow: POST", while `GET /api/v1//__test/nothing` gives 404 "No operation matches this request." With the key, `POST /api/v1//__test/reset` gives 404 "This operation is not served yet."
- Specification or contract text: "When test control is off, or the header is missing or wrong, every `/__test/*` operation answers the same 404 `TestControlDisabled`, so its existence is not revealed." (api-specification.md:165)
- Why it matters: the gate's one stated property does not hold. The edge and the router also disagree on empty path segments for every operation (`/api/v1//me` passes authentication, then answers "not served yet").
- Suggested fix: normalise or refuse empty segments once, before the gate, and make the gate and the edge share one matcher.

### A-04 (Blocker, A1/A3): The PR-09 resend limit can be beaten by parallel requests (and PR-11 has the same pattern)
- Where: `Routes/Profile.cs:99-114`; `Routes/Profile.cs:146-155`
- Code or check text: `var current = CurrentEmail(...); … Email.Resend(current.Status, current.LinkSentAt, now) … store.Session(username).SetLinkSent(now);` reads, checks and writes with no lock across the three steps. `var held = session.Mobile; … session.Mobile = held with {...}` does the same for the code.
- Specification or contract text: "A verification link may be resent once at least 60 seconds have passed since the last link was sent … sooner is refused (429, `Retry-After`)." (`DOCS/.design/ui-feature-profile.md:142`)
- Why it matters: probe L4 got two 202s in one burst, so two links were sent within 0 seconds. The wrong-code counter (PR-11) has the same window, though 10 bursts did not exploit it.
- Suggested fix: perform the read, the rule and the write under the `UserSession` lock, for example with a `TryResend(now)` method on the session.

### A-05 (Blocker, A2): `X-Correlation-Id` is not implemented
- Where: no code. A grep for "Correlation" over the service and its tests finds nothing. Live: `GET /me` with `X-Correlation-Id: abc-123` returned no such header.
- Specification or contract text: "Correlation | `X-Correlation-Id` echoed on every response; generated if absent" (api-specification.md:89)
- Why it matters: a stated convention is missing and no test pins it. The contract does not mention it either.
- Suggested fix: add a middleware that echoes or generates the header (and add it to the contract), or remove the row from section 4.

### A-06 (Blocker, A3): The clock input accepts non-RFC 3339 text and refuses valid RFC 3339
- Where: `Routes/TestControl.cs:85`
- Code or check text: `if (!DateTimeOffset.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var now) || !text.Contains('T'))`. Live: `2026-10-03T09:00:00` and `2026-10-03T09:00` (no offset) gave 204; `2026-10-03t09:00:00z` gave 400.
- Specification or contract text: "`PUT /__test/clock` takes an RFC 3339 date-time with a time part … a date alone or any other text is a 400." (api-specification.md:167)
- Why it matters: an offset-less time is silently read as UTC, and a valid lower-case form is refused. The tests try only `tomorrow` and `2026-10-03` (`TestControlTests.cs:358-362`).
- Suggested fix: parse with an RFC 3339 pattern (offset required; `t` and `z` case-insensitive), and add test cases for both directions.

### A-07 (Change, A2): For payment history, the year-window 400 comes after the bureau 404 and the persona 500
- Where: `Routes/Report.cs:85-91`; `Routes/Accounts.cs:135-142`
- Code or check text: `Resolve(...)` (404, then 500) runs before `if (!window.Contains(year)) … Problems.Validation`. Live: `bureau-zzz` with `year=2018` gave 404; the `error` persona with `year=2018` gave 500.
- Specification or contract text: "The checks run in this order (DR-055): … the shape of the path, query and body (400); the target and its owner (404); the persona behaviours (500) …" (api-specification.md:238)
- Why it matters: the window check is a 400 `/validation`, but it depends on the clock, so whether it counts as shape is not said.
- Suggested fix: say in section 8 that the window is checked after the target, or move the check ahead of `Resolve`.

### A-08 (Change, A4): `problem-json-missing` also turns test-control errors into plain text
- Where: `Edge/Problems.cs:57-63`; `Program.cs:49` (`FlagsMiddleware` runs before the test-control handlers)
- Code or check text: with the flag on, `PUT /__test/bugs {"flags":["nope"]}` gave "400 text/plain … Request failed validation: …". The gate's own 404 stays JSON.
- Specification or contract text: "`problem-json-missing` | Errors returned as plain text | Response validator" (api-specification.md:307). TestControlDisabled and Validation are documented as `application/problem+json` (openapi.yaml:1133-1146, 1278-1288).
- Why it matters: while the flag is on, the test-control surface breaks its own contract, which can mislead a harness arranging a scenario.
- Suggested fix: exempt `/__test/*` from service flags, or record in section 10 that test control is affected.

### A-09 (Change, A4): `currency-float` does not reach balance history or detail amounts
- Where: `Routes/Accounts.cs:130` (`r.Account["balanceHistory"]!.DeepClone()`); `Control/Defects.cs:37-38`
- Code or check text: live with the flag on, the account balance came back as `423.6`, but `balance-history[0].balance` came back as `{'amountMinor': 61360}`.
- Specification or contract text: "`currency-float` | Money sent as a float of pounds | Schema type check" (api-specification.md:309)
- Why it matters: a balance-history scenario would stay green with the flag on, so the flag's reach is partial and nowhere recorded.
- Suggested fix: route every Money the service emits through `ReportData.Money`, or narrow the wording in section 10.

### A-10 (Change, A4): `mask-format` does not reach `totals.excluded[].maskedNumber`
- Where: `Routes/ReportData.cs:76`
- Code or check text: `["maskedNumber"] = a["maskedNumber"]!.GetValue<string>(),` bypasses `Defects.MaskedNumber`.
- Specification or contract text: "`mask-format` | BR-09 off; raw source mask returned" (api-specification.md:308)
- Why it matters: the same account shows different masks on two operations while the flag is on.
- Suggested fix: use `Defects.MaskedNumber(a)` there.

### A-11 (Change, A4): `excluded-in-total` also changes the BR-07 debt total and breakdown
- Where: `Routes/ReportData.cs:35-37,46-52`
- Code or check text: `Facts` uses `Defects.IncludedInTotals(...)`, and `DebtOverview` reads `facts.IncludedInTotals`. Live: the drilldown debt total went from 19827960 to 19944060 with the flag on.
- Specification or contract text: "`excluded-in-total` | BR-05 ignored; excluded loans added to totals | `@BR-05` scenario" (api-specification.md:303); "A flag changes a call site (`Defects`)" (api-specification.md:313)
- Why it matters: `/debt/overview` and the overview's `debt` block change under a flag that names only BR-05, so a BR-07 scenario can go red for a reason the registry does not record.
- Suggested fix: apply the flag only in `Totals`, or list BR-07 in section 10 and in `bug-flags.json`.

### A-12 (Change, A5): The AccountTests BR-15 cases cannot detect a dropped ownership check
- Where: `CreditDashboard.Api.Tests/AccountTests.cs:162,216-217,292`
- Code or check text: `[TestCase("acc_exln02", TestName = "Another personas account is a 404 (BR-15)")]`. `acc_exln02` belongs to `excellent` (fixtures/personas/excellent.json:350), and no test user is bound to that persona in these tests.
- Specification or contract text: "BR-15 | A user may read and change only accounts in their own persona. Anything else returns 404" (api-specification.md:234)
- Why it matters: probe M11 removed the ownership refusal and all five of these cases stayed green. Only `FlagTests.Idor_…` noticed.
- Suggested fix: bind a second user to the owning persona in those tests, as `FlagTests` does.

### A-13 (Change, A5): The reset test neither asserts its setup nor checks session state
- Where: `CreditDashboard.Api.Tests/TestControlTests.cs:145-161`
- Code or check text: the five `await Send(...)` set-up calls (147-151) are not asserted, and session edits are not checked.
- Specification or contract text: "`POST /__test/reset` reloads the fixtures and clears all of it" (api-specification.md:169); the Test control check covers "reset clearing every part of the state" (api-specification.md:327)
- Why it matters: if a set-up call failed, the test would still pass vacuously. Probe M20 (sessions not cleared) went unnoticed here and was caught only by SessionTests.
- Suggested fix: assert 204 on each set-up call, and include a session edit in the state the reset must clear.

### A-14 (Change, A5): Four rules tests cannot fail, or assert the test data
- Where: `CreditDashboard.BusinessRules.Tests/ReportTests.cs:34`; `FixtureParityTests.cs:61`; `PaymentHistoryTests.cs:80-84`; `ScoreTests.cs:62-64`
- Code or check text: `Assert.That(expected, Does.Match(@"^\*[A-Z0-9]{4}$"));` checks the expected value, not the code. `Assert.That(Totals.IsIncludedInTotals(AccountType.Loan, null), Is.False);` is the same assertion on every loop pass. A 2018 missed month "not in any window year" is true by construction, because `YearStatus` only reads that year's months. The oldest-end gap test has no earlier score, so carrying forward could not show.
- Specification or contract text: "Every case in business-rules-cases.md, tagged by BR ID" (api-specification.md:326); "Gap at the oldest end | first point `null` (nothing carried forward)" (business-rules-cases.md:49)
- Why it matters: these tests add to the counts without adding detection.
- Suggested fix: assert on `Masking.Mask(source)`; drop the constant assertion; give the window test a 2020 missed month alongside the 2018 one; give the gap test a score in an earlier month.

### A-15 (Change, A2): The contract's payment-history example lists years newest first; the cases and the code use oldest first
- Where: `DOCS/.architecture/openapi.yaml:459-473` and `735-749` (2026 first, 2020 last); `Routes/Report.cs:97`
- Code or check text: `window.Select(...)`, from `Window(today)` which runs oldest first.
- Specification or contract text: "seven entries, the current year and the six before, oldest first" (`DOCS/.design/operations-cases.md:119`)
- Why it matters: the documents disagree, and the contract is meant to win.
- Suggested fix: reorder the contract examples, or state the order in the schema description.

### A-16 (Change, A1): Whether BR-14 limits `percent` to two decimals is ambiguous
- Where: `BusinessRules/AccountDetails.cs:22`
- Code or check text: `DetailField.MinPaymentPercent => value is >= 0 and <= 100,` (no decimal limit, so 5.555 is accepted)
- Specification or contract text: "The ranges stay rules (BR-14, 422 `out-of-range`): 0 to 100 with up to two decimals, whole months 0 to 60" (api-specification.md:149) against "`minPayment` needs `amountMinor` ≥ 0 or `percent` 0 to 100" (api-specification.md:233)
- Why it matters: two readings of the rule are possible, and no test row decides between them.
- Suggested fix: decide, then add a `percent` 5.555 row to business-rules-cases.md.

### A-17 (Change, A1): `onReport` and the year status disagree on missed months after the current month
- Where: `Routes/ReportData.cs:126` against `BusinessRules/PaymentHistory.cs:17`
- Code or check text: `account.MissedMonths.Where(m => m.Year >= firstYear && m <= current)`. `AccountMonth` returns `Missed` before checking `month > current`.
- Specification or contract text: "`payments.onReport` is the number of (account, month) pairs with status `missed` in the BR-12 window" (api-specification.md:124); "a month is `missed` if it is in the account's `missedMonths`" (api-specification.md:110)
- Why it matters: once the clock is moved back, the year shows `missed` while `onReport` leaves that month out.
- Suggested fix: count from `AccountMonth` statuses, or say that future months are no-data.

### A-18 (Change, A3): The controlled clock is read without a lock
- Where: `Control/ControlledClock.cs:17-25`
- Code or check text: `private DateTimeOffset? _frozen; public DateTimeOffset UtcNow => _frozen ?? real.GetUtcNow();`. `PersonaStore.SetClock` locks its own `_lock`, but readers take no lock.
- Specification or contract text: "The store holds, for the life of the process: … the controlled clock" (api-specification.md:169)
- Why it matters: a nullable struct of more than 8 bytes can be torn by a concurrent freeze. No wrong behaviour has been observed.
- Suggested fix: store the frozen instant as UTC ticks in a `long` with `Volatile`/`Interlocked`, or lock the reads.

### A-19 (Change, A2/A5): Coverage gaps
- Where: `CreditDashboard.Api.Tests/ReportTests.cs:61-72` (unknown bureau tested for 6 suffixes, plus searches and score separately); no test of gate path variants, duplicate keys, clock formats, the UI fallback for HEAD, or `X-Correlation-Id`
- Code or check text: `[TestCase("/score", "getScore")] … [TestCase("/payment-history", …)]`. `score/history` and `summary/feedback` have no unknown-bureau case.
- Specification or contract text: "Every operation below documents 404 for an unknown bureau" (api-specification.md:124); "Unknown bureau | | 404" (operations-cases.md:142)
- Why it matters: those behaviours are unpinned. A-03, A-05 and A-06 survived because of these gaps.
- Suggested fix: add the two 404 cases, plus tests for A-02, A-03 and A-06.

### A-20 (Note, A3): Edge cases in UI hosting
- Where: `Program.cs:35-45`
- Code or check text: `/index.html` is served by `UseStaticFiles` with no `Cache-Control`. `HEAD /login` gives 404 while `GET /login` gives 200. `/assets/missing.js` gives 200 text/html (index.html). Traversal (`/../`, `%2f`, `%5c`, `%2e%2e`) and `/.env` are safe.
- Specification or contract text: "returns `index.html` (no-store) for any other `GET`" (api-specification.md:69)
- Why it matters: the direct `index.html` path can be cached, and a broken asset reference looks like success.
- Suggested fix: optionally set no-store on `index.html`, and answer 404 for missing paths under `/assets/`.

### A-21 (Note, A3): `_verifiedEmails` is written but never read
- Where: `Control/PersonaStore.cs:95-99,127-130`
- Code or check text: only `IsEmailMarkedVerified` (used by the tests) reads it. The profile reads the session, which a rebind clears.
- Specification or contract text: "the set of users whose email has been marked verified" (api-specification.md:169)
- Why it matters: after verify-email followed by a rebind, the state and the profile can disagree.
- Suggested fix: derive the email status from one source.

### A-22 (Note, A3): Tokens are never purged, and login accepts large bodies
- Where: `Control/Authentication.cs:34-41`; `Edge/ContractValidation.cs:81-84`
- Code or check text: the `_tokens` dictionary only grows. The body is buffered under Kestrel's default 30 MB limit, without authentication on `login`.
- Specification or contract text: no limit is specified.
- Why it matters: memory growth over a long run. This is a demo service on loopback, so the risk is low.
- Suggested fix: drop expired tokens when validating, and lower `MaxRequestBodySize`.

### A-23 (Note, A1): PR-02 counts letters per UTF-16 unit, while the contract's pattern uses `\p{L}`
- Where: `BusinessRules/Profile/PreferredName.cs:21`
- Code or check text: `trimmed.All(c => char.IsLetter(c) || …)` refuses letters outside the Basic Multilingual Plane (surrogate pairs), and `Length` counts UTF-16 units.
- Specification or contract text: `pattern: "^[\\p{L}'-]([\\p{L}' -]*[\\p{L}'-])?$"` (openapi.yaml:1356)
- Why it matters: rare names would get a 422 that the contract's schema would accept.
- Suggested fix: iterate over runes (`EnumerateRunes`, `Rune.IsLetter`).

### A-24 (Note, A4): Pending service flags are accepted and do nothing
- Where: `Routes/TestControl.cs:74-79`; `fixtures/bug-flags.json` (`preferred-no-trim`, `email-stays-verified`: service, pending)
- Code or check text: `store.SetFlags(...)` stores any enum value.
- Specification or contract text: "A name outside this list is a 400, so a typo cannot silently do nothing." (openapi.yaml:1311-1312)
- Why it matters: a scenario that switches a pending flag on gets no signal that nothing changed.
- Suggested fix: optionally refuse pending flags with 422, or report them in `/__test/state`.

### A-25 (Note, A5): The "422 changes nothing" test checks `apr` for every field
- Where: `CreditDashboard.Api.Tests/AccountTests.cs:253`
- Code or check text: `Assert.That((await Details())!["apr"]!.GetValue<double>(), Is.EqualTo(24.9), "the stored details are unchanged");`
- Specification or contract text: "422 `/problems/rule-violation/out-of-range` (BR-14)" (operations-cases.md:167)
- Why it matters: probe M26 was caught only because the later GET failed the contract's enum check. The test's own assertion would have missed it.
- Suggested fix: assert on the field that was edited.

### A-26 (Note, A1): BR-01 is not enforced at runtime
- Where: `BusinessRules/Scores.cs:13` (`IsValid`); no caller in the API
- Code or check text: the score is returned as stored (`Routes/Report.cs:55`).
- Specification or contract text: "BR-01 | Score is an integer 0 to 1000." (api-specification.md:220)
- Why it matters: only the fixture check holds the rule, and overrides cannot change the score, so nothing goes wrong today.
- Suggested fix: none needed.

### A-27 (Note, A5): A test's name misdescribes it
- Where: `CreditDashboard.Api.Tests/EdgeValidationTests.cs:379-386`
- Code or check text: `The_allowed_methods_of_a_path_with_several_are_all_listed` tests a path with one method (PATCH).
- Specification or contract text: "the `Allow` header lists the methods it defines" (api-specification.md:245)
- Why it matters: no contract path has two methods, so the name promises more than the test checks.
- Suggested fix: rename the test.

### A-28 (Note, A4): Under `idor`, writes go only to the attacker's own session
- Where: `Routes/Accounts.cs:72-85,167-169`
- Code or check text: live, alex's PATCH on sam's account returned 200; alex then saw apr 1, while sam still saw 24.9.
- Specification or contract text: "`idor` | BR-15 off; other users' accounts readable" (api-specification.md:306)
- Why it matters: this is consistent with "readable", but BR-15 also covers "change".
- Suggested fix: none needed, or say in section 10 that writes are isolated.

### A-29 (Note, A2): Balance history does not follow the clock
- Where: `Routes/Accounts.cs:130`
- Code or check text: returns the stored `balanceHistory` whatever the controlled clock says.
- Specification or contract text: "`/accounts/{accountId}/balance-history` | Last 6 months, oldest first" (api-specification.md:145)
- Why it matters: after the clock moves, "last 6 months" is not true. Fixtures are written relative to `asAt`.
- Suggested fix: say in the specification that the history is relative to `asAt`.

## Not done
- `check:schemathesis` and `check:service-contract` were not run. Both build or write into `os.tmpdir()`, and the mutation runner was rebuilding the copy at the time. The usage-limit interruption then left no time to run them. Schemathesis 4 is installed (user site-packages) and NSwag is in the NuGet cache, so both could run offline later. `schemathesis.toml` was read.
- `check:harness`, `check:ui*`, `check:bug-flags`, `check:client`, `check:mock` and `check:kanban` were not run: they belong to other areas.
- The PR-11 race (L5) was not reproduced in 10 bursts. It is reported from reading the code only.
- Not read: `Contract/Contract.g.cs` (2,126 lines, generated; covered by the drift check, which was not run), `features-shared/`, and the step and harness glossaries.
- Deviations from the rules, disclosed:
  - At the start I ran one read-only `git log --oneline -1` in REPO, before reading the rule against git commands.
  - The first `dotnet test` runs used the system %TEMP% (vstest files and UiHostingTests' own temporary folder, which it deletes).
  - To get round MAX_PATH for the rules testhost, I mapped `subst Q:` onto copy_A and removed the mapping at the end.
- A dotnet process on another port (PID 34956, relative dll path) belonged to another reviewer and was left alone.

## Method
I copied REPO with `robocopy /XD .git` into `copy_A` and ran everything there, through a `Q:` drive substitution because of path length. Baseline: `dotnet test CreditDashboard.sln -c Release` gave 234 and 339 passed.

I read in full:
- the service: `Program.cs`, `Control/`, `Edge/` and `Routes/`
- the BusinessRules library
- all 18 test files
- `openapi.yaml`, `api-specification.md` v27, `business-rules-cases.md`, `profile-rules-cases.md`, `operations-cases.md`
- the PR rules in `ui-feature-profile.md` section 5
- the relevant entries of `decision-register.md`
- `bug-flags.json`, `tools/schemathesis-run.mjs`, `tools/generate-service-contract.mjs`, `schemathesis.toml` and `launchSettings.json`

Live probes ran against the built copy on my ports: 4712 (Production, test control on), 4711 (Development, test control off) and 4710 (with `UI_DIRECTORY` set to a scratch folder). They were driven by curl and by Python scripts in `scratchpad/cds38/A_probes/` (`overrides_probe.py`, `race_probe.py`, `flag_probe.py`).

The 28 mutation probes were applied one at a time by `A_probes/mutate.py`. Each changed one place, ran the solution (library probes) or the Api tests (service probes), recorded the failed test names in `A_probes/mutations.json`, and restored the file byte for byte. At the end, `diff -rq` against REPO showed the copy's source identical, and all three service instances and the drive mapping were removed. I also ran the fixtures check (`npm run check` in `fixtures/`).
````

### 3.2 Report of reviewer B

The text below is exactly what the reviewer returned. Its headings are left as written so that its words are unchanged; read its own "CDS-38 independent review, area B" line as the start of the report.

````markdown
Note on delivery: I could not save the report to `scratchpad/cds38/report_B.md`. The harness refused the write with "Subagents should return findings as text, not write report files". The full report is below, so whoever has write access can save it to that path. All probe logs are in `scratchpad/cds38/`: `B_harness_baseline.log`, `B_flags_baseline.log`, `B_validator_probe.log`, `B_probe_svc1.log`, `B_probe_svc2.log`, `B_probe6.log`, `B_probe7a.log`, `B_probe7b.log`, `B_probe89.log`, `B_probe10.log`, `B_probe11.log` and `B_probe1213.log`, plus the dump folders `B_dump6`, `B_dump7` and `B_dump9`.

# CDS-38 independent review, area B: report

## Summary
The harness runs cleanly. `check:harness` passed 59 of 59 scenarios in 86 s. `check:bug-flags` reported all 8 implemented flags caught and 22 pending, in 192 s. Most API steps assert exactly what their sentences say. But 13 mutation probes show real holes:
- The response validator never looks at the content type or the headers, so a Problem sent as `text/plain` passes every scenario.
- The flag proof credits a flag when its `failsWith` text appears for a different defect. This was shown twice.
- Two UI steps pass with wrong values on the page: a debt figure with a stray digit, and a wrong date of birth.
- The off run of the flag proof is not shown to have the flag off.

Findings: 5 Blocker, 15 Change, 6 Note.

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| B1, steps against scenarios | 174 step definitions read: API 81 (arrange 24, act 20, assert 37) and UI 93 (account 22, login 8, overview 13, profile 24, report pages 26). 12 `@api` and 11 `@ui` feature files (59 and 51 executions). 10 scenarios traced end to end (table below). | B-04, B-05, B-14, B-15, B-16, B-17, B-18, B-19 |
| B2, isolation | `src/api/hooks.ts`, `src/ui/hooks.ts`, `support/world.ts`, `common-hooks.ts`, `cucumber.mjs`, both abilities, and the service's `PersonaStore.Reset`. 1 probe (P10). | B-13, B-22, B-23 |
| B3, contract validation | `contract/validate.ts` (95 lines) and `CallAnApi.send`. 18 synthetic responses fed to the validator (P1), 2 service probes (P4, P5), 1 harness probe (P7). | B-01, B-09, B-10, B-11, B-12, B-21 |
| B4, flag proof and registry | `prove-flags.ts` (109 lines), `bug-flags.json` (30 flags, 8 implemented, 9 catchers), `run.mjs` (130 lines), the `HARNESS_BUGS` and `CDS_FLAGS` paths, and the registry part of `schema-check.mjs`. 5 probes (P6, P7, P8, P9, P11). | B-02, B-03, B-06, B-07, B-08, B-26 |
| B5, fixtures | 7 personas (35 accounts tabulated), `users.json` (2 users), 12 override samples (listed, not each re-derived), and `schema-check.mjs` (218 lines; 655 checks, 0 failures on the clean copy). | B-15, B-24, B-25 |
| Harness design and glossary as specification | `harness-design.md` (293 lines) and `step-glossary.md` (241 lines), both read in full. | B-12, B-13, B-20 |
| Probe set (13 probes) | P1 to P13 | 8 of 13 not noticed at all: P2, P3, P4, P5, P6, P9, P12, P13 (P7a also not noticed). P1 partly not noticed. P11 noticed only by coincidence. |

**B1 traces (ten scenarios, from the Gherkin to the assertion, and what would make each pass wrongly)**

| Scenario | Trace | What would make it pass wrongly |
|---|---|---|
| `@api` Utilisation rounds half up (49.50 / 100.00) | No drilldown card matches, so `br03-one-credit-card.json` is patched by `setBalance` (the harness's BR-03 formula) and bound. Totals are requested for Bureau A, then `assert.equal(body().utilisation, 50)`. | Only if a drilldown card ever matched a row: the step would then only remember that card, and the Then would read the total of all open cards. |
| `@api` Type totals sum the open accounts | Both cards are held by the fixture. Totals 37960 / 610000 / 6 are asserted by equality. | A service that counts closed accounts passes, because the only closed card holds 0 and no limit (P2, B-14). |
| `@api` Loans without a limit stay out of the totals | Fixture checks; the balance must equal 1252400; the `excluded` balances must include 116100. | Sound. `includes` matches the sentence "is listed as excluded". |
| `@api` A closed account reports nothing owing | Fixture card (struggling, closed 2022-05-31, stored balance 0). Closed list; exactly one credit card; balance 0. | The stored balance is already 0, so a service that never zeroes it passes (P3, B-15). Any closed credit card satisfies "is listed" (B-16). |
| `@api` A month with no score is reported as missing | Sam bound to drilldown, clock frozen. History over 1y: 12 points, and January 2026 has `score === null`. | Sound. |
| `@security @api` Another customer's account cannot be found | Sam's first `excellent` account is requested with Alex's token. Expect 404 and type `/problems/not-found`. | A Problem with the wrong content type passes (P5, B-01). |
| `@ui` Debt is broken down by account type | Visit the page; the text of `debt-type-…` must include the harness's own pound text. | A figure with an extra digit (`£320` instead of £32) passes (P12, B-04). |
| `@ui` Legal details cannot be changed here | Profile visit. The legal name must match `/\S+ \S+/` and the date of birth a date shape; no inputs in the identity block. | Any two words and any well-formed date pass (P13, B-05). |
| `@ui` Alex sets a preferred name | Type, save, status "Saved"; greeting equals "Ally". The legal name is read from the profile page and compared with `pd-name`. | Both values come from the page under test, so a page showing the same wrong name in both places passes (B-17). |
| `@ui` Next update wording (1 day) | Clock set one day before `nextRefreshDate`, new visit, then `next-update` must equal "Updates in 1 day". | Sound (equality). The flag proof shows `plural` is caught. |

## Probes
| Probe | What I changed (in the copy) | What I expected | What happened |
|---|---|---|---|
| P1 | No change. I fed 18 synthetic responses to `Contract.validate` (script: `scratchpad/cds38/B_probes/validator-probe.mts`). | Extra properties, wrong types, wrong formats, undocumented statuses and a body on a 204 are all rejected. | **Rejected:** a string or float `amountMinor`; bad `date` and `date-time` values; `limit: {}`; a missing required `closed`; status 418; status 500 on `getAccount`; a body on a 204; a Problem without `type`. **Accepted:** an Account with an extra `fullNumber: "12345678"` and `sourceMask`; an extra `balance.pounds`; a 404 Problem with a `stack` member; a 404 Problem whose body says `status: 500`. A 200 with no body was rejected only by a TypeError ("Cannot read properties of undefined (reading 'slice')"). |
| P2 | `ReportData.Totals`: every account of the type treated as open (`f with { IsOpen = true }`). | `@BR-04` "Type totals sum the open accounts of that type" fails. | Not noticed: 59 of 59 passed (run together with P3 and P4). |
| P3 | `Accounts.Summary`: a closed account reports its stored balance (no `ReportedBalanceMinor`). | `@BR-13` "A closed account reports nothing owing" fails. | Not noticed: 59 of 59 passed. |
| P4 | `Problems.RateLimited`: `Retry-After` header removed. | The PR-09 "refused" row fails. | Not noticed: 59 of 59 passed. |
| P5 | `Problems.Write`: every Problem sent as `text/plain; charset=utf-8` with the same JSON body. Confirmed with curl: a 401 came back with that content type. | Every scenario that receives a Problem fails. | Not noticed: 59 of 59 passed. |
| P6 | `Defects.Amount` made a no-op (money always an integer). With `currency-float` on, totals `utilisation` is sent as 6.2. | `currency-float` is not caught. | Reported **caught for the stated reason**: the on run failed with "at '/utilisation': must be integer,null", which contains the `failsWith` text "must be integer". |
| P7a | `validate.ts`: schema check skipped. | Some self-check of the harness fails. | Not noticed: 59 of 59 passed. The harness has no test of its own validator. |
| P7b | Same change; then `check:bug-flags -- mask-format currency-float`. | Both flags reported as not caught as stated. | Noticed: both `caught-for-another-reason`, exit 1, 51 s. |
| P8 | Registry: the `rounding-down` catcher name changed to "Utilisation rounds half upX". | `schema-check` fails, and the proof does not say "caught". | Noticed: schema-check reported "1 failures … not found"; the proof reported `false-alarm` with "(no scenario ran …)". |
| P9 | With `idor` on, the service throws (a 500) instead of finding the account. `idor`'s `failsWith` set to "Another customer's account cannot be found", the scenario's own title. | `idor` is not caught. | Reported **caught**. The title is printed in every run, and the on run failed with "status 500 is not documented". `schema-check` raised nothing about it. |
| P10 | `api/hooks.ts`: `await control.reset()` removed. | Some scenario fails from leaked state. | Not noticed: 59 of 59 passed. |
| P11 | `PersonaStore.Reset`: `_flags = []` removed, so a reset keeps the flags. | Off runs fail with the previous flag still on, and the proof reports it. | Noticed only once: `problem-json-missing` reported `false-alarm` (it shares a catcher with `idor`). Seven off runs (rounding-down, history-carry-forward, idor, mask-format, currency-float, and both plural catchers) passed with the previous flag still on and were counted clean. |
| P12 | UI `DebtOverviewPage.tsx`: a "0" appended after each by-type figure. | All 5 rows of "Debt is broken down by account type" fail. | Not noticed: `ui/debt` passed 6 of 6. |
| P13 | UI `ProfilePage.tsx`: date of birth shown as 11 March 1985 (users.json has 1985-03-12). | "Legal details cannot be changed here" fails. | Not noticed: `ui/profile` passed 12 of 12 (18 of 18 together with P12). Confirmed the change was in the built bundle. |

## Findings

### B-01 (Blocker, B3): the validator never checks the content type, so a Problem sent as plain text passes
- Where: `test-harnesses/harness-serenity/src/abilities/CallAnApi.ts:63-67` and `src/contract/validate.ts:48`, `:65`
- Code or check text: "const text = await http.text(); … const body = text ? JSON.parse(text) : undefined; contract.validate(operationId, http.status, body, text.length > 0);" and "Object.values<Json>(resolved.content)[0]". The media type key is discarded, and no headers reach `validate`.
- Specification or contract text: "Problem responses (`application/problem+json`) are validated against `Problem`." (`DOCS/.design/harness-design.md:67`); and "`problem-json-missing` | Errors returned as plain text | Response validator" (`DOCS/.design/api-specification.md:307`).
- Why it matters: P5 sent every Problem as `text/plain` and all 59 scenarios passed. `problem-json-missing` is caught today only because its body is also not JSON (`JSON.parse` throws), not because the validator saw the wrong media type.
- Suggested fix: pass `content-type` to `validate`, require it to match the documented media type for that status, and fail when there is no documented media type.

### B-02 (Blocker, B4): `failsWith: "must be integer"` credits `currency-float` with any integer violation
- Where: `fixtures/bug-flags.json:113` and `src/flags/prove-flags.ts:85`
- Code or check text: "\"failsWith\": \"must be integer\"" and "on.output.includes(catcher.failsWith) ? 'failed-as-stated' : …"
- Specification or contract text: "The proof checks the reason, not only that it failed, so a flag cannot be credited with the other's failure." (`harness-design.md:290`; see also `:280`)
- Why it matters: P6 removed the money defect and put a float into `utilisation` instead; the proof still said "caught for the stated reason".
- Suggested fix: record the failing path in `failsWith` ("at '/balance/amountMinor': must be integer"), and have `schema-check` reject a `failsWith` that is not specific to the flag.

### B-03 (Blocker, B4): a `failsWith` text that appears in every run is accepted, so any failure counts as a catch
- Where: `src/flags/prove-flags.ts:79-86` and `fixtures/schema-check.mjs:200`
- Code or check text: The off output is never searched for `failsWith`. The registry check only requires "c.failsWith.length > 0 && c.failsWith !== 'TBD'".
- Specification or contract text: "with the flag ON it must fail, and the failure must contain the text the registry records for it" (`prove-flags.ts:3-4`)
- Why it matters: in P9, `failsWith` was set to the scenario's title, which is printed in every run, and the `idor` defect was replaced by a 500. The proof reported `idor` caught, and `schema-check` raised nothing. The existing "is not valid JSON" (`bug-flags.json:81`) is also loose: it matches a non-JSON body from any call in the scenario.
- Suggested fix: require that `failsWith` is absent from the off output and present in the on output, and have `schema-check` refuse a `failsWith` that occurs in the feature file.

### B-04 (Blocker, B1): the UI debt-by-type step uses `includes`, so a figure with an extra digit passes
- Where: `src/ui/steps/report-pages.steps.ts:132-134`
- Code or check text: "Ensure.that(Text.of(byTestId(`debt-type-${type}`)), includes(poundsNoPence(amountMinor)))"
- Specification or contract text: "Then the debt on <type> is <amount>" with the row "| utilities and telecoms | 32.00 |" (`features-shared/ui/debt.feature:22`, `:28`); and "A UI step compares at the precision the figure is shown" (`DOCS/step-glossary.md:31`).
- Why it matters: in P12 the page showed "£320" for £32 and "£3000" for £300, and all five rows passed.
- Suggested fix: give the amount its own hook, or compare the whole row text with equality.

### B-05 (Blocker, B1): "sees their legal name and date of birth" checks only the shape, not the values
- Where: `src/ui/steps/profile.steps.ts:84-89`
- Code or check text: "matches(/\S+ \S+/)" for the legal name and "matches(/^\d{1,2} [A-Z][a-z]+ \d{4}$/)" for the date of birth.
- Specification or contract text: "Then Alex sees their legal name and date of birth" (`features-shared/ui/profile.feature:14`); the legal name and date of birth come from the test user (`api-specification.md:268-270`), and `users.json` has "legalName": "Alex Example", "dateOfBirth": "1985-03-12".
- Why it matters: P13 showed a date of birth one day out and the scenario passed.
- Suggested fix: compare against the values in `users.json`.

### B-06 (Change, B4): the off run is not shown to have the flag off; it relies on the service's reset alone
- Where: `prove-flags.ts:46`, `:79` and `api/hooks.ts:25-28`
- Code or check text: "if (flags.length > 0) await control.setBugs(flags);". Nothing is set or checked when the list is empty.
- Specification or contract text: "each catcher runs with the flag off (must pass)" (`harness-design.md:280`)
- Why it matters: in P11, seven off runs passed with the previous flag still on and were counted clean.
- Suggested fix: in the off run, call `setBugs([])` and assert through `GET /__test/state` that the flags are exactly the ones requested.

### B-07 (Change, B4): the "something ran" check applies to a pass, but not to "failed as stated"
- Where: `prove-flags.ts:53-54`, `:60-61`, `:85`
- Code or check text: "passed: result.status === 0 && ran". The `ran` check is not used for `failed-as-stated`.
- Specification or contract text: "A catcher that runs nothing is not a pass." (`harness-design.md:281`)
- Why it matters: an on run that crashed or ran nothing still counts as a catch if its output happens to contain `failsWith`. For example, the source line "Updates in 1 days" at `flags.test.tsx:32` could appear in a code frame. I found this by reading the code; I did not build a probe for it.
- Suggested fix: require `ran` for both outcomes.

### B-08 (Change, B4): no timeouts, and no SIGTERM handling
- Where: `prove-flags.ts:50`, `:57` and `run.mjs:87-91`, `:118`
- Code or check text: `spawnSync(...)` is called without a `timeout`, and only `exit` and `SIGINT` are handled.
- Specification or contract text: "Always stop both, whatever the result" (`harness-design.md:115`)
- Why it matters: a hung catcher hangs the run. A cancelled CI job sends SIGTERM, which leaves both `dotnet` services running, and the next run then refuses the port.
- Suggested fix: add timeouts and report a timeout as its own outcome; handle SIGTERM the same way as SIGINT.

### B-09 (Change, B3): `Retry-After` is never checked
- Where: `assert.steps.ts:149-152` and `validate.ts:65-88`
- Code or check text: "else problem(429, '/problems/rate-limited');"
- Specification or contract text: "sooner is refused (429, `Retry-After`)" (`ui-feature-profile.md:142`); the contract's `RateLimited` response documents a `Retry-After` header (`openapi.yaml:1254-1257`).
- Why it matters: P4 removed the header and nothing failed.
- Suggested fix: validate documented response headers, or assert this one in the step.

### B-10 (Change, B3): every response schema is open, so extra properties pass, including a leaked full account number
- Where: `validate.ts:53`. All 12 `additionalProperties: false` in `openapi.yaml` are on request or test-control bodies, none on responses.
- Code or check text: "new Ajv2020({ strict: false, allErrors: true })"
- Specification or contract text: "Account numbers leave the service only as a short mask" (`features-shared/api/masking.feature:4`); and DR-042 (`decision-register.md:57`).
- Why it matters: P1 case B (an Account with `fullNumber: "12345678"`) was accepted.
- Suggested fix: validate responses with unknown properties forbidden, or close the response schemas in the contract.

### B-11 (Change, B3): a Problem whose `status` disagrees with the HTTP status, or that carries a `stack`, passes
- Where: `assert.steps.ts:25-30`
- Code or check text: Only the HTTP status and `body.type` are asserted.
- Specification or contract text: "500 … no stack trace in the body" (`api-specification.md:248`)
- Why it matters: P1 cases K and M were accepted.
- Suggested fix: assert `body.status === response.status`, and forbid unknown members in a Problem.

### B-12 (Change, B3): the harness design claims Ajv strict mode and returned headers; the code has neither
- Where: `validate.ts:53` and `CallAnApi.ts:67`
- Code or check text: "strict: false" and "return { status: http.status, body };"
- Specification or contract text: "with Ajv's 2020 build in strict mode" (`harness-design.md:66`) and "returns `{ status, headers, body }`" (`:53`)
- Why it matters: the design overstates how strict the validator is (see B-01, B-09, B-10).
- Suggested fix: correct the design, or implement what it says.

### B-13 (Change, B2): the After hook neither resets the service nor attaches diagnostics
- Where: `api/hooks.ts:31-33` and `ui/hooks.ts:47-49`
- Code or check text: "After(async () => { resetScenario(); });"
- Specification or contract text: "on failure, attach the request, the response and the service log tail …; always restore the default service state (`reset()`)" (`harness-design.md:76`)
- Why it matters: isolation rests on the next Before alone, and a failed scenario leaves no diagnostics in the report.
- Suggested fix: implement the After as designed, or change the design.

### B-14 (Change, B1): "Type totals sum the open accounts" cannot tell open accounts from closed ones
- Where: `features-shared/api/account-totals.feature:23-31`. The drilldown fixture's `acc_ddcl01` is closed, with balance 0, limit null and `includedInTotals` true.
- Code or check text: "# drilldown also holds a closed credit card (Lender Y), which open-account totals leave out."
- Specification or contract text: "BR-04 | Type totals sum `balance` and `limit` across open accounts" (`api-specification.md:223`)
- Why it matters: P2 counted closed accounts and nothing failed, because the closed card adds nothing.
- Suggested fix: give the closed card a limit in the fixture. BR-13 forbids only a balance.

### B-15 (Change, B1 and B5): "A closed account reports nothing owing" cannot fail
- Where: `api/closed-accounts.feature:14-15` and `schema-check.mjs:91`
- Code or check text: "And its balance is 0.00", and "check(bal === 0, aw, 'BR-13: closed account balance is not 0')".
- Specification or contract text: "BR-13 | Closed accounts report balance 0" (`api-specification.md:232`); overrides with a closed balance are refused with a 422 (`:186`).
- Why it matters: every arranged closed account already holds 0, so P3 (no zeroing in the service) passed.
- Suggested fix: allow a fixture closed account with a non-zero balance and check the service reports 0, or document that the stored value is the rule.

### B-16 (Change, B1): "the credit card is listed" counts credit cards rather than checking that card
- Where: `assert.steps.ts:78-79`
- Code or check text: "assert.equal(listedCreditCards().length, shown ? 1 : 0)"
- Specification or contract text: the Given "stores that account's ID as *that account*" (`harness-design.md:94`)
- Why it matters: a different closed credit card in the list would pass.
- Suggested fix: compare the listed card's id with `thatAccount`.

### B-17 (Change, B1): the legal-name steps compare the page with itself
- Where: `profile.steps.ts:110-113` and `:117-121`
- Code or check text: "const legal = await actor.answer(Text.of(byTestId('profile-legal-name')));" followed by "equals(legal)".
- Specification or contract text: "But the credit report still shows Alex's legal name" (`ui/profile.feature:24`); "The report's personal-details `name` is the user's legal name." (`api-specification.md:272`)
- Why it matters: the expected value comes from the system under test, so the same wrong name in both places passes.
- Suggested fix: use `testUser(name).legalName`.

### B-18 (Change, B1): the PR-08 check covers three values, not all profile data
- Where: `profile.steps.ts:146-151`
- Code or check text: "return [legal, testUser(name.toLowerCase()).email, ...(digits ? [digits] : [])];"
- Specification or contract text: "PR-08 | Profile data never appears in URLs, page titles or client-side logs." (`ui-feature-profile.md:141`)
- Why it matters: the preferred name, the first name alone, the date of birth and the postcode are not checked, and neither is the URL hash.
- Suggested fix: extend the list of values and check the hash too.

### B-19 (Change, B1): the recorded interest rate is checked with `includes`
- Where: `account.steps.ts:151-153`
- Code or check text: "includes(`${percent}%`)"
- Specification or contract text: "Then the credit card shows an interest rate of 29.9%" (`ui/account-details-form.feature:16`)
- Why it matters: "129.9%" would pass. Not probed.
- Suggested fix: use equality.

### B-20 (Change, harness design): the design describes files and behaviour that do not exist
- Where: `harness-design.md:28-31`, `:113`, `:163`
- Code or check text: `load.ts`, `clock.ts` and `service.ts` do not exist; `run.mjs:104-105` always starts both service instances; `cucumber.mjs` uses only the Serenity and `message` formats.
- Specification or contract text: "Start the second instance only when the selected scenarios need it" (`:113`); "Cucumber's `message` and `html` formatters" (`:163`); "a difference found while building is fixed here first" (`:13`).
- Why it matters: the design is the harness's own specification, and it is out of date.
- Suggested fix: update sections 1, 8 and 11.

### B-21 (Note, B3): a missing body is rejected by a TypeError instead of a readable message
- Where: `validate.ts:85`
- Code or check text: "JSON.stringify(body).slice(0, 300)"
- Specification or contract text: the failure should name "the operation, status and the first Ajv path" (`harness-design.md:63`)
- Why it matters: P1 case O failed with a TypeError that names neither the operation nor the status. The step still fails.
- Suggested fix: use `String(JSON.stringify(body))`.

### B-22 (Note, B2): the suite does not show that the per-scenario reset is needed
- Where: `api/hooks.ts:25`
- Code or check text: "await control.reset();"
- Specification or contract text: "every scenario starts from reloaded fixtures and a clock that follows real time" (`hooks.ts:23`)
- Why it matters: P10 removed the reset and all 59 still passed, so a leak between scenarios would go undetected.
- Suggested fix: optionally run once in random order (`--order random`).

### B-23 (Note, B2): parallel runs are not prevented
- Where: `cucumber.mjs:1-5`
- Code or check text: no `parallel` setting.
- Specification or contract text: "Cucumber `parallel: 1`" (`harness-design.md:78`)
- Why it matters: a parallel run would share the clock, bindings and flags. The default is serial, so nothing is wrong today.
- Suggested fix: refuse parallel runs.

### B-24 (Note, B5): masking scenarios on persona-held rows test the fixture, not the service
- Where: service `Routes/Accounts.cs:61` and `Control/Defects.cs:33-34`
- Code or check text: the stored `maskedNumber` is returned as is.
- Specification or contract text: the stored data includes "an optional `sourceMask` (the BR-09 input)" (`api-specification.md:274`)
- Why it matters: rows 4821, **10 and ab3f pass as long as the fixture is right; only the override row exercises the service's BR-09 logic. This is consistent with the specification, and `schema-check` recomputes the mask independently.
- Suggested fix: none.

### B-25 (Note, B5): the BR-03 formula is identical in the fixture check and the harness
- Where: `schema-check.mjs:35` and `arrange.ts:10`
- Code or check text: "Math.floor((200 * balance + limit) / (2 * limit))"
- Specification or contract text: BR-03 "half up (towards positive infinity, so -4.5 gives -4)" (`api-specification.md:222`)
- Why it matters: both copies are independent of the service and correct by a hand check, so this is an observation only.
- Suggested fix: none.

### B-26 (Note, B4): the registry finds a component test by substring, while Vitest treats the name as a pattern
- Where: `schema-check.mjs:208` and `prove-flags.ts:57`
- Code or check text: "readFileSync(file).includes(c.name)" and "'-t', catcher.name"
- Specification or contract text: "The files and names must exist." (`schema-check.mjs:183`)
- Why it matters: a name found only in a comment would pass the check, and regex characters in a name would match differently under `-t`. The one name in use today has none.
- Suggested fix: match the `it(` declaration exactly, and escape the name for `-t`.

## Not done
- `npm run verify` was not run, because it needs the network. The other areas' checks were not run either: `check:service`, `check:schemathesis`, `check:client`, `check:mock`, `check:service-contract`, `check:ui`, `check:ui-exit` and `check:kanban`.
- `check:ui-scenarios` was not run in full. Only `ui/debt` and `ui/profile` ran (during P12 and P13), plus the plural UI scenario inside the flag proof.
- The 12 override samples were listed, but not each one re-derived by hand.
- `src/exit/exit-checks.ts` was not reviewed.
- `glossary.md`, the three cases files and `ui-specification.md` were only searched, not read in full.
- B-07 comes from reading the code; I did not build a probe for it.
- One process slip: I ran `git log --oneline -1` once in the real repository. It is read-only and changed nothing, but the rules asked for no git commands there.

## Method
- I made a robocopy of the repository without `.git` (29,250 files) into `scratchpad/cds38/copy_B`, worked only there, and used ports 4720, 4721 and 4722.
- I read all of the harness source, the runner, the 23 feature files in the two profiles, the registry, `schema-check.mjs`, the users file, the persona accounts (tabulated), and the harness design and step glossary in full.
- Baselines:
  - `check:harness`: 59 of 59 passed in 86 s (Cucumber itself took 8.9 s).
  - `check:bug-flags`: 8 of 8 caught, 22 pending, exit 0, in 192 s.
  - `schema-check`: 655 checks, 0 failures.
- For each probe, I edited the copy, ran the narrowest check that should notice, and restored the file from a saved original.
- P5 and P13 were confirmed to be in the build: P5 with a curl of a 401 response, P13 by checking the built UI bundle.
- For P6 and P9 I added a temporary dump of each catcher's output to `prove-flags.ts`, and removed it afterwards.
- At the end, a search for "PROBE P" across the service, UI, harness and registry in the copy found nothing left over.

**Counts by severity: 5 Blocker, 15 Change, 6 Note.**
````

### 3.3 Report of reviewer C

The text below is exactly what the reviewer returned. Its headings are left as written so that its words are unchanged; read its own "CDS-38 independent review, area C" line as the start of the report.

````markdown
I could not write the report to `scratchpad\cds38\report_C.md`: the Write tool refused it ("Subagents should return findings as text, not write report files"). I did not work around the refusal. The full report is below so you can save it to that path; the Summary and counts come first, as the prompt asked.

## Summary
The UI is close to its specification and its checks are mostly honest. 9 of my 14 probes were caught by at least one committed check, and the public build is free of test-control code. Three things behave wrongly or are checked wrongly:
- **Open-redirect guard:** it returns `//evil.example/...` for addresses with dot segments. The site is saved only by React Router 8 refusing the navigation, and that leaves Cancel doing nothing.
- **Progress bars:** they cap `aria-valuenow` at 100, which contradicts UI specification section 7, and a component test asserts the cap.
- **Late responses:** an answer for an earlier filter, year or route overwrites the current one. I showed this with a component-level probe.

Five probes went uncaught, and they point at the gaps: the exit checks do not scan dark mode, error or empty states, or pages outside four layout targets; the `@security` scenario tests only one hostile address; and no check guards the public build.

**Counts: 3 Blocker, 20 Change, 10 Note.**

---

# CDS-38 independent review, area C: report

## Summary
(as above)

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| C1 pages against the UI specification | 15 catalogue rows (14 built pages plus the debug panel) and the "not built" page; 205 hook-like tokens in `ui-specification.md` and `ui-feature-profile.md` against 183 distinct hook expressions in `src/` (about 150 of the tokens are hooks; the rest are flag names and attributes); the four section states via `SectionState`; formatting rules in 4.2 (7 rows) | C-02, C-05, C-06, C-07, C-08, C-21, C-27, C-28, C-31, C-32 |
| C2 behaviour | session storage and leaks (`session.tsx`, `flags.tsx`, `DebugPage.tsx`); `safeRedirect` with 28 hostile addresses in Node and 5 in a real browser; the login redirect-back guard; 5 forms (details, preferred name, email, mobile number, mobile code) and their error paths; every `useEffect` and `useResource` user (12 components) for races and Strict Mode | C-01, C-03, C-04, C-20, C-22, C-33 |
| C3 accessibility and exit checks | 4.5 against the code (progress bars, hidden tables, dialogs, focus, `aria-pressed`, `aria-describedby`); all 35 exit-check targets plus 2 sign-in scans, the 3 layouts and 2 text sizes; `check:ui-exit` run 3 times (baseline and two probe runs) | C-02, C-09, C-10, C-11, C-12, C-25 |
| C4 security and privacy | `dangerouslySetInnerHTML`, `innerHTML`, `target=`, `eval`, console logging, storage (0 unsafe uses; 2 storage uses, both the test-control key); service error texts shown verbatim (4 tried live); page titles and addresses (PR-08); public build and test build compared for 15 strings | C-01, C-13, C-24, C-26, C-30 |
| C5 CI, scripts, pins, supply chain | 2 workflows (11 action references), 5 `package.json` files (43 dependency pins, all exact) against their 5 lock files (all consistent with `npm ls`), `tools/verify.mjs`, `scripts/run.mjs` | C-14, C-15, C-23, C-29 |
| C6 documents against code | 41 claims checked (table after the findings); 12 wrong or stale | C-08, C-16, C-17, C-18, C-19 |
| `check:ui` (baseline) | typecheck, Vitest (8 files, 142 tests, all passed), public build | C-16 (count) |
| `check:ui-scenarios` (baseline) | 41 scenarios, 51 executions, run twice: first run 51 of 51 successful but Cucumber exit 1; second run all passed, exit 0 | C-15 |
| `check:ui-exit` (baseline) | "37 axe scans and 24 layout checks; 0 problem(s)", exit 0 | C-09 to C-12 |
| Probe set (14 probes) | P1 to P14 below: 9 caught, 5 not caught | C-04, C-09, C-10, C-12, C-13 |

## Probes
| Probe | What I changed (in the copy) | What I expected | What happened |
|---|---|---|---|
| P1 (C1) | `AccountListPage.tsx`: hook `list-total-balance` renamed `list-total-bal` | Component tests and the drilldown scenario fail | Caught: Vitest 3 failed of 47; `ui/account-drilldown` failed, waiting for `[data-testid="list-total-balance"]` |
| P2 (C1) | `format.ts`: summary figures truncated to whole pounds (37960 pence reads £379, not £380) | Format tests and figure scenarios fail | Caught: Vitest 3 failed of 142; scenarios failed ("Expected the text of debt-total to equal "£198,280""). The BR-04 list-against-overview scenario alone would not catch it, because both sides change together |
| P3 (C2) | `safeRedirect.ts` reduced to `target.startsWith('/') ? target : fallback` | Component tests and `security/open-redirect` fail | Partly caught: Vitest 3 failed (`//evil.example`, `/\evil.example`, tab); the `@security` scenario PASSED (exit 0). See C-04 |
| P3b (C2) | `safeRedirect.ts` reduced to `target \|\| fallback` (the `open-redirect` flag's effect) | `security/open-redirect` fails | Caught, but by the router: the browser stays on the form ("External navigation is not allowed") and the scenario times out waiting for `detail-header` |
| P4 (C3) | `AccountDetailPage.tsx`: `aria-label="Balance against limit"` removed from `detail-balance-bar` | Exit checks fail; component tests may not | Exit checks caught it (`aria-progressbar-name (serious)` on 5 account details and in all 6 layout passes of the card); Vitest did not (47 of 47 passed) |
| P5 (C3) | `styles.css`: `.benchmarks { min-width: 30rem; }` | The 375 px layout check fails | Caught: "layout 375px overview: the page scrolls sideways by 138px" (both text sizes) |
| P6 (C3) | `styles.css`: `[data-testid^="search-row-"] { display: block; min-width: 40rem; }` | A 375 px break on the searches page is reported | NOT caught: the searches pages are scanned at 1280 px only. See C-09 |
| P7 (C3) | `styles.css`: dark theme `--color-muted: #34414f` (muted text unreadable on the dark surface) | axe-core reports `color-contrast` | NOT caught: the exit checks never render the dark theme. See C-10 |
| P8 (C4) | `ProfilePage.tsx`: `document.title` set to the legal name (the `pii-in-title` effect) | Profile test and PR-08 scenario fail | Caught: Vitest PR-08 test failed; scenario failed ("Expected <<current page>>.title() to not include "Alex Example"") |
| P9 (C4) | `flags.tsx`: `TEST_BUILD = import.meta.env.VITE_TEST_BUILD !== 'false'` (test code on by default) | `check:ui` notices test control in the public build | NOT caught: 142 of 142 passed and the build succeeded; the public `dist` then held `cds.testControlKey` (1), `__test` (5), `/debug` (1), `debug-flag` (1), `pii-in-title` (1). See C-13 |
| P10 (C2, C4) | `session.tsx`: the token also written to `sessionStorage` | The storage test fails; the `@security` reload scenario may not | Vitest caught it ("keeps the token in memory only" failed); `ui/login` passed all 3 scenarios, because the scenario only checks that a reload signs the customer out |
| P11 (C1) | `AccountRow.tsx`: the `row-over-{id}` element removed | Component test and drilldown scenario fail | Caught: Vitest 1 failed; scenario failed (`<<row-over-acc_stcc02>>.isPresent()`) |
| P12 (C3) | `PaymentHistoryWidget.tsx`: `aria-pressed` removed from the year buttons (half of `ph-a11y`) | Component tests fail; the spec names axe-core as the catch | Vitest caught it (2 failed); exit checks did NOT ("pass axe payment history", 0 problems). See C-12 |
| P13 (C2) | New component test only, no source change: two filter clicks with the first answer delayed 400 ms | The later filter's list is shown | The earlier answer replaced it: `changes-filter-negative` was pressed while the positive change `change-card-chg_1` was shown. See C-03 |
| P14 (C2) | No source change: the real UI in Chromium, Cancel on the details form with 5 return addresses | Hostile addresses fall back to the account page | `https://evil.example/steal` fell back correctly. For `/..//evil.example/steal`, `/%2e%2e//evil.example/steal` and `/./\evil.example/steal`, Cancel did nothing and the page threw "External navigation is not allowed". See C-01 |

## Findings

### C-01 (Blocker, C2/C4): the open-redirect guard returns a protocol-relative address for input with dot segments
- Where: `demo-apps/demoapp001-react-ui/src/safeRedirect.ts:7` and `:11`
- Code or check text: "if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback;" and then "return resolved.origin === BASE ? resolved.pathname + resolved.search + resolved.hash : fallback;"
- Specification or contract text: "`redirectUrl` must be a same-origin path starting with `/`. Anything else falls back to the account detail page (open-redirect guard)." (`DOCS/.design/ui-specification.md:227`) and "follows a return address only if it is a path that starts with a single `/` (not `//`, not `/\`) and stays on this site once resolved" (`ui-specification.md:229`)
- Why it matters: the `//` test is applied to the input, not to the resolved path. In my Node run, 12 of the 28 hostile inputs, including `/..//evil.com`, `/.//evil.com`, `/%2e%2e//evil.com`, `/./\evil.com` and `/a/../\evil.com`, resolve to the pathname `//evil.com`, which is returned. In Chromium (P14), the only thing that stops the customer leaving the site is React Router 8 throwing "External navigation is not allowed". Cancel and Save then do nothing, so there is no fallback, against the text above.
- Suggested fix: check the resolved path, not only the input. Fall back unless it starts with a single `/` followed by a character that is neither `/` nor `\`. Add these addresses to the component test table.

### C-02 (Blocker, C1/C3): over-limit progress bars report 100, and a component test asserts it
- Where: `src/pages/overview/ReportSections.tsx:71-72`, `src/pages/AccountDetailPage.tsx:83-84`, `src/pages/AccountListPage.tsx:98-99`; test `src/pages/ReportOverviewPage.test.tsx:114`
- Code or check text: "aria-valuemax={100}" and "aria-valuenow={Math.min(utilisation, 100)}". The test, for a utilisation of 115: "expect(screen.getByTestId('account-util-bar-creditcard')).toHaveAttribute('aria-valuenow', '100');"
- Specification or contract text: "Above 100: bar full, `aria-valuenow` the real value, `aria-valuemax` raised to match, text `115%` and badge `{testid}-over-limit` reading 'Over limit' (DR-013)" (`ui-specification.md:255`); `UtilisationDonut` "over limit as `UtilisationBar`" (`:256`); "The UI shows the real figure" (`DOCS/glossary.md:108`)
- Why it matters: assistive technology announces 100 for an account at 115%. The component test passes for the wrong behaviour and would fail for the specified one. The `util-mismatch` flag's catch, "Assertion comparing `aria-valuenow` with text" (`ui-specification.md:271`), cannot be written while the bar already disagrees with its text above 100 with no flag on.
- Suggested fix: set `aria-valuenow` to the real value and `aria-valuemax` to `Math.max(100, value)`, keep the fill at 100%, and change the test to expect 115.

### C-03 (Blocker, C2): a late response overwrites the current page's data
- Where: `src/useResource.ts:12-25`; the same pattern in `src/components/PaymentHistoryWidget.tsx:24-46`, `src/pages/ReportOverviewPage.tsx:23-36` and `src/pages/overview/HistoryChart.tsx:38-51`
- Code or check text: "const result = await load(); ... setData(result); setState(isEmpty(result) ? 'empty' : 'populated');" with no check that the request is still the current one, and an effect with no clean-up: "useEffect(() => { void reload(); }, [reload]);"
- Specification or contract text: "Report changes adds filter chips `changes-filter-{sentiment}` ... filters are reflected in the URL" (`ui-specification.md:233`); the year buttons: "one selected at a time" (`:167`)
- Why it matters: in probe P13, Positive and then Negative were pressed with the Positive answer delayed by 400 ms. The page ended with Negative pressed and in the address, but showing the positive change. The same happens for a quick change of year, of history range, or between account types or bureaux while a request is slow (the `slow` persona exists for this). Under React Strict Mode every first request is also sent twice.
- Suggested fix: use a request counter or an `AbortController` in the effect clean-up and ignore any answer that is not the latest. Keep P13 as a component test.

### C-04 (Change, C2/C4): the open-redirect checks test one hostile address in the browser and none with dot segments
- Where: `test-harnesses/harness-serenity/src/ui/steps/account.steps.ts:88`; `src/pages/AccountPages.test.tsx:243-252`
- Code or check text: "const foreign = encodeURIComponent('https://evil.example/steal');". The component table has 10 cases: absolute http and https, `//`, `/\`, tab, `javascript:`, a bare host, empty, null and undefined.
- Specification or contract text: "`open-redirect` | `redirectUrl` guard removed | Security scenario" (`ui-specification.md:283`); the guard text at `:229`
- Why it matters: P3 reduced the guard to a leading-slash test and the `@security` scenario still passed. None of the component cases has a dot segment, so C-01 passes every committed check.
- Suggested fix: make the scenario an outline over several addresses (`https:`, `//`, `/\`, `/..//`), and add the C-01 inputs to the component table.

### C-05 (Change, C1): `UtilisationBar` is not built as specified (no over-limit badge hook, no colour bands)
- Where: `src/pages/overview/ReportSections.tsx:63-64`; `src/styles.css:125`
- Code or check text: "{formatPercent(utilisation)} used{utilisation > 100 ? ' · Over limit' : ''}"; ".gauge-fill, .bar-fill { height: 100%; background: var(--color-accent); }"
- Specification or contract text: "Colour bands: below 30%, 30 to 75%, above 75%. ... badge `{testid}-over-limit` reading 'Over limit'" (`ui-specification.md:255`)
- Why it matters: `account-util-bar-{type}-over-limit`, `list-donut-over-limit` and `detail-balance-bar-over-limit` do not exist, so a test has to match free text. There are no colour bands anywhere.
- Suggested fix: build one `UtilisationBar` component with the badge hook and the bands, or amend section 7 to match what was built.

### C-06 (Change, C1): the `search-list` hook does not exist
- Where: `src/pages/SearchesPage.tsx:32-35`
- Code or check text: "<SectionState testId="search-list" ...> ... <ul>". This produces only the `search-list-{state}` hooks; the list itself has none.
- Specification or contract text: "Searches lists `search-row-{id}` inside `search-list` (empty state `search-list-empty`)" (`ui-specification.md:233`)
- Why it matters: a test written from the spec finds nothing.
- Suggested fix: put `data-testid="search-list"` on the `<ul>`, or name `search-list-populated` in the specification.

### C-07 (Change, C1/C3): the score gauge is a progress bar named 'Credit score'
- Where: `src/pages/overview/ScoreSection.tsx:18-24`
- Code or check text: "data-testid="score-gauge" role="progressbar" aria-label="Credit score""
- Specification or contract text: "`ScoreGauge` | ... | SVG arc; `role="img"` with name 'Score 720 out of 1000'" (`ui-specification.md:250`)
- Why it matters: a role-based locator written from the component catalogue fails.
- Suggested fix: amend section 7 to the progress bar, or build the arc.

### C-08 (Change, C1/C6): the debug panel's route and gating differ between the code and the documents
- Where: `src/App.tsx:48`; `DOCS/.design/ui-specification.md:126` and `:237`; `DOCS/glossary.md:167`
- Code or check text: "{TEST_BUILD && <Route path="/debug" element={<DebugPage />} />}", inside `RequireSession`. There are also five hooks no spec names: `debug-key`, `debug-username`, `debug-bind`, `debug-set-clock`, `debug-status` (`DebugPage.tsx:47-105`).
- Specification or contract text: "| Debug panel | `/__debug` |" (`ui-specification.md:126`); "The `/__debug` page" (`glossary.md:167`); the v22 header: "the debug panel of 6.8 is the page `/debug`" (`ui-specification.md:15`); "Visible only when test control is enabled" (`:237`)
- Why it matters: in a test build, `/__debug` shows "This page is not built yet". The panel also appears in a test build when test control is off.
- Suggested fix: change the catalogue and the glossary to `/debug`, state the actual gating (a test build plus a session), and list the five hooks in 6.8.

### C-09 (Change, C3): the exit checks scan fewer states and layouts than the specification says
- Where: `test-harnesses/harness-serenity/src/exit/exit-checks.ts:28-110`; the `layouts` property is set only at `:29`, `:49`, `:60` and `:77`
- Code or check text: 35 targets. The only extra states are the open chat drawer, a client-side form error, the open name information, a refused preferred name and the mobile code step. Layouts are checked on four pages only.
- Specification or contract text: "`npm run check:ui-exit` scans every page and every state that shows something new (an open dialog, an error) ... and checks the three layouts" (`ui-specification.md:18`); "Layouts | 375, 768 and 1280 px: one navigation at a time ..., no sideways scroll" (`:298`)
- Why it matters: these are never scanned:
  - any section error state with its Retry button;
  - any empty state;
  - the expanded changes list and `changes-toggle-error`;
  - a chosen year with missed payments;
  - `email-error`, `email-resend-status`, `mobile-error` and `mobile-code-error`;
  - `profile-preferred-status` showing 'Saved';
  - the debug page;
  - the employment and finances "not built" pages.

  P6 broke the searches page at 375 px and nothing failed.
- Suggested fix: add error and empty targets (the `error` persona and an empty override) plus the open toggle and the form errors. Either run the layout pass on every target, or say in section 9 that it covers four representative pages.

### C-10 (Change, C3): the dark theme is never checked for contrast
- Where: `src/styles.css:2` and `:20-34`; `exit-checks.ts:167`, `:174` and `:207` (no browser context sets `colorScheme`)
- Code or check text: "Colours keep WCAG 2.2 AA contrast." and "@media (prefers-color-scheme: dark) { :root { ... } }"
- Specification or contract text: "WCAG 2.2 AA. With all bug flags off, an axe-core scan of every page returns zero violations." (`ui-specification.md:106`); "light and dark themes" (`:63`)
- Why it matters: P7 made muted text unreadable in dark mode, and the exit checks reported 0 problems.
- Suggested fix: run the axe pass a second time with `colorScheme: 'dark'`.

### C-11 (Change, C3): "wider text" leaves most text the same size
- Where: `exit-checks.ts:152-155`; `src/styles.css:15`, `:118`, `:122`
- Code or check text: "css: 'body { font-size: 19px; }'", while the stylesheet sizes in `rem` (".figure { font-size: 1.75rem", ".score-value { font-size: 3rem", "--space: 1rem")
- Specification or contract text: "checks the three layouts with normal and wider text" (`ui-specification.md:18` and `:298`)
- Why it matters: `rem` follows the root element, not `body`, so headline figures and spacing do not grow. The test is a 19% increase in body text, far short of the 200% that WCAG 1.4.4 asks for.
- Suggested fix: use `html { font-size: 200% }` or page zoom for the wider pass, and state the factor in section 9.

### C-12 (Change, C3): the catch stated for `ph-a11y` cannot see half of its effect
- Where: `src/components/PaymentHistoryWidget.tsx:58`; `exit-checks.ts:39`
- Code or check text: "aria-pressed={entry.year === history.selectedYear}"
- Specification or contract text: "`ph-a11y` | Year buttons lose `aria-pressed`; icons lose text | axe-core" (`ui-specification.md:282`)
- Why it matters: P12 removed `aria-pressed` and the axe pass stayed green, because axe has no rule for a missing `aria-pressed`. Only the component tests failed.
- Suggested fix: list the component test as a catcher for `ph-a11y` in `fixtures/bug-flags.json`.

### C-13 (Change, C4): no check guards the public build against test code
- Where: `demo-apps/demoapp001-react-ui/vite.config.ts:10`; `src/flags.tsx:12`
- Code or check text: "env: { VITE_API_BASE_URL: 'http://localhost/api/v1', VITE_TEST_BUILD: 'true' }" and "export const TEST_BUILD: boolean = import.meta.env.VITE_TEST_BUILD === 'true';"
- Specification or contract text: "the public build contains none of this code (brief 13 D1, DR-064)" (`ui-specification.md:65`); "never in the public demo build (DR-037)" (`:237`)
- Why it matters: the claim holds today (C-24), but P9 inverted the switch and `check:ui` still passed 142 of 142, with the test-control code in the public bundle.
- Suggested fix: after `vite build` in `check:ui`, scan `dist/assets/*.js` for `__test`, `cds.testControlKey` and `debug-flag`, and fail on any hit.

### C-14 (Change, C5): the workflow actions and one tool are not pinned immutably
- Where: `.github/workflows/ci.yml:23,27,36,42,64,68,77`; `.github/workflows/pages.yml:144,162,164,168`; `tools/verify.mjs:18`
- Code or check text: "actions/checkout@v5", "actions/setup-node@v5", "actions/setup-dotnet@v6", "actions/setup-python@v6", "actions/configure-pages@v5", "actions/upload-pages-artifact@v4", "actions/deploy-pages@v4"; "npx --yes @redocly/cli@2.57.0 lint"
- Specification or contract text: "Redocly CLI 2.57.0" and "Prism, pinned in `package.json`" (`README.md:56`). Every `package.json` pins exact versions (43 of 43).
- Why it matters: a moved tag would run new code with `pages: write` and `id-token: write`. Redocly's dependency tree is resolved fresh on every run, with no lock file.
- Suggested fix: pin the actions to commit SHAs, and add `@redocly/cli` to the root `devDependencies`.

### C-15 (Change, C5/C2): an `@ui` run can fail with every scenario green and no reason shown
- Where: `test-harnesses/harness-serenity/src/ui/hooks.ts:22-24`; `src/support/common-hooks.ts:6`
- Code or check text: "AfterAll(async () => { await browser?.close(); });" under "setDefaultTimeout(30_000);"
- Specification or contract text: "`npm run check:ui-scenarios` (the `@ui` scenarios in a real browser against the service ...)" (`README.md:68`)
- Why it matters: my first baseline printed "51 of 51 successful" and "Execution successful", then "harness: Cucumber exit code 1". Only `reports/ui.ndjson` showed the cause: the `AfterAll` hook "function timed out, ensure the promise resolves within 30000 milliseconds". The rerun passed (exit 0, 2 min 34 s).
- Suggested fix: give the hook a bounded close, and print hook failures in the console.

### C-16 (Change, C6): counts and versions in the README are stale
- Where: `README.md:17`, `:30`, `:56`
- Code or check text: "58 `@api` scenarios", "135 component tests", "Decisions DR-001 to DR-050", "Serenity/JS 3.48.2"
- Specification or contract text:
  - Vitest reports "Tests 142 passed (142)".
  - The `api` profile compiles 59 executions; `harness-design.md:225` says "the `api` profile now selects 59 scenarios".
  - The decision register reaches DR-064 (`decision-register.md:79`).
  - The harness pins "@serenity-js/core": "3.49.0".
- Why it matters: the README is the public account of the evidence, and four figures in it are wrong.
- Suggested fix: update the four figures.

### C-17 (Change, C6): the README says Phase 5 has not started and lists an incomplete set of checks
- Where: `README.md:96`, `:62`, `:68`
- Code or check text: "Planned (CDS-37, DR-064); not started"; the list of checks that can run on their own omits `check:ui-exit` and `check:bug-flags`; "CI runs both in a separate `ui` job."
- Specification or contract text: "All seven are implemented" (`api-specification.md:313`); `fixtures/bug-flags.json` marks 8 flags implemented; `ci.yml:96-109` runs four UI steps
- Why it matters: the phase table misstates the project's state, and two checks are undocumented.
- Suggested fix: mark Phase 5 as in progress, list the two checks, and say the `ui` job runs four steps.

### C-18 (Change, C6): the specification headers and one version are stale
- Where: `ui-specification.md:12`, `:59`; `ui-feature-profile.md:12`; `api-specification.md:12`
- Code or check text: "**Status:** Phase 0 draft, for review" (in all three files); "`vite` 8.3.3"
- Specification or contract text: Phase 0 was accepted on 5 October 2026 (`README.md:91`, DR-038); the UI's `package.json` pins "vite": "8.3.4"
- Why it matters: a reader cannot tell whether the documents that checks are judged against are normative.
- Suggested fix: update the status lines and the version.

### C-19 (Change, C6): scope statements in the harness design and the Cucumber profile are stale
- Where: `DOCS/.design/harness-design.md:15`; `test-harnesses/harness-serenity/cucumber.mjs:28-31`
- Code or check text: "(28 scenarios and outlines) ... `security/open-redirect` ... waits for Phase 4."; "U1 has the login feature only ... not yet implemented, so they are not selected."
- Specification or contract text: there are 32 scenarios and outlines (`harness-design.md:225`), and the `ui` profile selects all 11 UI files (`cucumber.mjs:36-47`)
- Why it matters: the opening scope statement of the harness design is two phases old.
- Suggested fix: update both comments.

### C-20 (Change, C2): the redirect back after sign-in uses its own, weaker guard
- Where: `src/pages/LoginPage.tsx:35-36`
- Code or check text: "const back = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : null;"
- Specification or contract text: the guard rule at `ui-specification.md:229`
- Why it matters: I found no way to exploit it, because `from` comes from the browser-normalised `location.pathname`. But two guards with different rules will drift.
- Suggested fix: reuse `safeRedirect`, once C-01 is fixed.

### C-21 (Change, C1): account rows have no logo or initials fallback
- Where: `src/components/AccountRow.tsx:15-17`
- Code or check text: the row has the provider and the masked number only
- Specification or contract text: "Logo or text fallback, provider, balance, mask, utilisation" (`ui-specification.md:181`); "Logo fallback to initials" (`:257`)
- Why it matters: a specified element is missing, and unlike `list-changes` (dropped in v20) its removal is not recorded.
- Suggested fix: build the fallback, or record the drop in the specification.

### C-22 (Change, C2): a report-changes page past the end leaves the customer stuck
- Where: `src/pages/ReportChangesPage.tsx:66-76`
- Code or check text: the `Pager` is only rendered inside the populated branch, so the empty state ("No changes match.") has no pager
- Specification or contract text: "Specific message, never a blank area" (`ui-specification.md:94`); "filters are reflected in the URL" (`:233`)
- Why it matters: `?page=9` reads "No changes match." with no pager, and the message is untrue, because changes do match on earlier pages.
- Suggested fix: clamp the page number, or show the pager whenever `total > 0`.

### C-23 (Change, C5): the time limit on the `ui` CI job is tight for its four runs
- Where: `.github/workflows/ci.yml:62` and `:96-109`
- Code or check text: "timeout-minutes: 15" for the installs, the browser install, `check`, `test:ui`, `test:exit` and `test:flags`; each of the last three rebuilds the UI and the service
- Specification or contract text: "The thirty will need roughly 5 to 6 minutes" (`harness-design.md:291`)
- Why it matters: locally, `check:ui` took 1 min 25 s and the `@ui` run between 2 min 34 s and 6 min 11 s, before the exit checks and the flag proof. As more flags are implemented, the job will time out rather than report a real failure.
- Suggested fix: move the flag proof to its own job, or raise the limit.

### C-24 (Note, C4): the public build is free of test control
- Built in the copy with the variable unset (`index-DJpQd4Qs.js`). Occurrences: `cds.testControlKey` 0, `__test` 0, `x-test-control-key` 0, `/debug` 0, "Debug panel" 0, `debug-flag` 0. Of the 30 flag names, only `plural` appears, once, as the argument of a dead function ("function ur(e){return!1}" called as "ur(`plural`)").
- The test build (`index-uEW171dc.js`, 3.5 kB larger) has 1, 5, 2, 1 and 1 occurrences of the first five strings, each flag name once and `plural` twice.
- This agrees with `ui-specification.md:65`.

### C-25 (Note, C3): the chat drawer is marked modal but the page behind it stays reachable
- `ChatDrawer.tsx:65` has "role="dialog" aria-modal="true"", rendered inside the summary section, with a focus trap on Tab only. The page behind is not made inert, so a screen reader's virtual cursor can still reach it. This matches the words of `ui-specification.md:158`.

### C-26 (Note, C4): service messages are shown as the service wrote them
- `EmailPage.tsx:33` and `problem.ts:5` ("return body?.detail ?? body?.title ?? fallback;").
- Live, a bad email address shows "One or more fields are invalid.", and the specific `errors[]` message ("must be an email address") is ignored. Other messages carry rule identifiers such as "(PR-02)" and "(PR-06)".
- React escapes all of this, so it is a wording issue, not injection (`ui-feature-profile.md:123`).

### C-27 (Note, C1): the profile header image is a truncated GIF
- `ProfilePage.tsx:75`: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" decodes to a GIF header with no image data. It is harmless with `alt=""` (`ui-feature-profile.md:55`).

### C-28 (Note, C1/C3): the account detail header is not a region
- `AccountDetailPage.tsx:53` uses a `<header>` inside `<main>`, which has no landmark role. The spec says "Header | region | `detail-header`" (`ui-specification.md:202`).

### C-29 (Note, C5): the harness builds into the public `dist` and writes logs to the system temp folder
- `run.mjs:43` builds the test build into `dist`. The repository's own `dist` held the test-build bundle `index-uEW171dc.js` when I copied it.
- `run.mjs:59` writes logs to "path.join(os.tmpdir(), `harness-service-${listenPort}.log`)", with names that depend only on the port.
- Suggested fix: build the test build into `dist-test/`.

### C-30 (Note, C4): one storage write on the debug page is not guarded
- `DebugPage.tsx:52` calls `localStorage.setItem` without the try/catch that the read uses (`flags.tsx:36-40`). With storage blocked it throws. This only affects test builds.

### C-31 (Note, C1): there is no notifications button yet
- `Layout.tsx:48-63` has no `btn-notifications` or `notifications-unread`, which `ui-specification.md:160` names. This is consistent with the staging note in v14 (`:23`).

### C-32 (Note, C1): the history table alternative shows raw months
- `HistoryChart.tsx:108`, "<th scope="row">{point.month}</th>", reads "2026-03". The balance chart's table uses `formatMonth` (`BalanceChart.tsx:55`); compare `ui-specification.md:84`.

### C-33 (Note, C2): the mobile page shows attempts left before any wrong code
- `MobilePage.tsx:36` and `:146` show "3 attempts left" as soon as the code step opens. The spec ties `mobile-attempts` to the 422 `code-wrong` response (`ui-feature-profile.md:115`).

## Claims checked (C6): 41 claims, 12 wrong or stale
**Correct (28):**
- 36 operations
- 41 `@ui` scenarios and 51 executions
- 37 axe scans with zero violations
- seven personas
- React 19.3.0, Vite 8.3.4, TypeScript 5.9.3, React Router 8.4.0 and Vitest 5.0.4 in the README (5 claims)
- 14 verify steps (3 installs, 11 checks)
- Redocly 2.57.0
- Schemathesis 4.29.4
- Cucumber 13.3.0
- 12 `@api` feature files
- ports 4600 and 4601
- `global.json` 10.0.401 with latest-patch roll-forward
- `npm run service` on `localhost:4000/api/v1`
- the `demo-only` key
- the mock on 4010
- `.nvmrc` 24.18.0
- `SCARF_ANALYTICS` set in CI
- the Pages workflow's path filter
- `check:ui` contents
- the debug panel lists every flag
- `plural` is the first UI flag implemented
- seven API flags implemented
- `check:bug-flags` exists
- the exit-check counts in `harness-design.md:269-270`

**Wrong or stale (12):**
- README: 58 `@api` scenarios; 135 component tests; DR-050; Serenity 3.48.2; "CI runs both"; the list of runnable checks; Phase 5 "not started"
- the "Phase 0 draft" status lines
- Vite 8.3.3 in the UI spec
- the `/__debug` route
- the harness-design scope paragraph
- the `cucumber.mjs` comment

**Not checked (1):** the `npm audit` figures in `README.md:64` (needs the network).

## Not done
- `npm audit --offline` printed "found 0 vulnerabilities", but offline it has no advisory data, so the README's audit figures are unverified.
- I did not run the checks that belong to areas A and B (`check:bug-flags`, `check:harness`, `check:schemathesis`, `check:service`, `check:client`, `check:mock`, the fixture check).
- I ran probes against the relevant feature files only, not against the full `@ui` suite.
- P4 to P7 were run together in one exit-check run. The page names in the output tell them apart.
- I showed P13 in a component test, not against the live service with the `slow` persona.
- I did not read `step-glossary.md`, `page-survey.md`, the three rule-case files, or `features-shared/` beyond the scenario counts, `login.feature` and `open-redirect.feature`.
- Two departures from the rules:
  - At the start I ran `git log --oneline -1` and `git status --short` in the repository. Both are read-only and changed nothing.
  - The first exit-check run wrote two service logs to `C:\Users\brook\AppData\Local\Temp`. I deleted them and redirected `TEMP` and `TMP` to the scratch folder for every later run.
- In my copy, `npm ls` reports the UI's api-client dependency as "invalid". That comes from copying a linked package, not from the project.
- The report file itself could not be written (see the note at the top).

## Method
- **Copy:** robocopy of the repository at `409249e` without `.git` into `scratchpad\cds38\copy_C` (29,250 files). After each probe I restored the file from the untouched original, and confirmed with `diff -rq` at the end that `src/` was clean.
- **Read:** the README, the UI spec (v22), the profile spec (v10), the relevant parts of the API spec, the harness design, the glossary and DR-064; every UI source file; `exit-checks.ts`, `run.mjs`, `cucumber.mjs`, `ui/hooks.ts` and `prove-flags.ts`; both workflows, `verify.mjs` and the five `package.json` files.
- **Ran** (ports 4730, 4731 and 4732, with the local Chromium):
  - `check:ui` once (142 of 142);
  - `check:ui-exit` three times;
  - `check:ui-scenarios` twice in full and six times by feature;
  - Vitest by file for each probe;
  - public and test builds of the UI, with string counts;
  - `safeRedirect` against 28 addresses in Node;
  - a Playwright script on a service I started on port 4732, with every off-site request answered locally (the service was stopped afterwards).
- **Counts:** hook coverage came from extracting hook names from the specs and the source; scenario counts came from compiling the feature files with `gherkin-official`.

**Files:**
- The probe scripts are in `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38\cscripts\`.
- The run logs are in the same `cds38` folder: `c_exit_baseline.log`, `c_exit_probe1.log`, `c_exit_probe2.log`, `c_ui_baseline.log`, `c_ui_baseline2.log`.
````

## 4. The author's verification

Written by the author (the main session) after the three reports were saved unchanged. For each Blocker and Change finding, the table says whether it was reproduced and how. The reviewers' words in sections 2 and 3 are not altered. Notes were not verified. The working tree was clean (`git status`) after every mutation, and each mutation was reverted with `git checkout`.

**Result: 62 findings (14 Blocker, 48 Change). 59 reproduced, 2 reproduced in part (B-20, C-23), 1 not reproduced (C-15).** No reviewer finding was wrong in a way that changes its severity. Two corrections to the reviewers' wording are given in the table (A-10 and B-20).

**Methods.** *Live:* two instances of the Release build of the service (Production with test control on; Development with it off), driven by `verify_live.py`. *Mutation:* one change in the working tree, the narrowest check that should notice, then reverted. *Reading:* the cited lines read, and where a demonstration was cheap it was run. *Fixture:* the persona files read.

### 4.1 Blockers

| Finding | Reproduced? | How |
|---|---|---|
| A-01 | yes | Live, Development: a login body with a duplicate `username` key returned 500 with a body beginning "System.ArgumentException: An item with the same key has already been added. Key: username" and the service's namespace in the trace |
| A-02 | yes | Live, Production: the same body returned 500 with an empty body and no content type |
| A-03 | yes | Live, test control off: `GET /api/v1//__test/reset` returned 405 with `Allow: POST`; `GET /api/v1/__test/reset` returned 404 |
| A-04 | yes | Live: 10 bursts of 12 parallel resends; the most 202s in one burst was 2 (the rule allows one) |
| A-05 | yes | Live: `GET /me` with `X-Correlation-Id: abc-123` returned no such header; a search of the service for "Correlation" finds nothing |
| A-06 | yes | Live: `2026-10-03T09:00:00` and `2026-10-03T09:00` gave 204; `2026-10-03t09:00:00z` gave 400 |
| B-01 | yes | Reading: `CallAnApi.ts:63-67` parses the body as JSON and passes the status and body to `validate`; `validate.ts:48` takes the first media type of the documented response and discards the key. No header reaches `validate`. The reviewer's probe P5 (every Problem as `text/plain`, 59 of 59 passed) was not re-run |
| B-02 | yes | Mutation: `Defects.Amount` made a no-op and a float put into `utilisation` while `currency-float` is on; `check:bug-flags currency-float` reported "caught for the stated reason" (`failsWith` "must be integer" matched the message for `/utilisation`) |
| B-03 | yes | Mutation: `rounding-down` made to throw (a 500) and its `failsWith` set to the scenario's title; the proof reported "caught for the stated reason". An earlier attempt did not compile (unreachable code is an error here) and was redone |
| B-04 | yes | Reading: `report-pages.steps.ts:132-134` uses `includes(poundsNoPence(...))`; demonstration: `'£320'.includes('£32')` and `'£3000'.includes('£300')` are both true. The reviewer's browser probe P12 was not re-run |
| B-05 | yes | Reading: `profile.steps.ts:86-87` checks `/\S+ \S+/` and a date shape; `fixtures/users.json` holds "Alex Example" and "1985-03-12", and neither is compared. P13 not re-run |
| C-01 | yes | Run: `safeRedirect` on `/..//evil.com`, `/.//evil.com`, `/%2e%2e//evil.com`, `/./\evil.com` and `/a/../\evil.com` returned `//evil.com` each time (protocol-relative). The router refusing the navigation (P14) was not re-run in a browser |
| C-02 | yes | Reading: `aria-valuenow={Math.min(utilisation, 100)}` and `aria-valuemax={100}` in `ReportSections.tsx:71-72`, `AccountDetailPage.tsx:83-84` and `AccountListPage.tsx:98-99`; `ReportOverviewPage.test.tsx:114` expects `'100'` for 115; UI specification section 7 says `aria-valuenow` is the real value and `aria-valuemax` is raised |
| C-03 | yes | Test: with the first (positive) answer delayed by 400 ms and the negative filter chosen after it, the page showed the positive answer ("expected document not to contain element, found POSITIVE ANSWER"). The test was a scratch file and was deleted |

### 4.2 Changes

| Finding | Reproduced? | How |
|---|---|---|
| A-07 | yes | Reading: `Report.cs:85-91` resolves the bureau (404, then 500) before the year-window 400 |
| A-08 | yes | Live: with `problem-json-missing` on, `PUT /__test/bugs` with an unknown flag returned 400 `text/plain` |
| A-09 | yes | Live: with `currency-float` on, the account balance was `423.6` and every balance-history amount stayed an integer |
| A-10 | yes, in code | Reading: `ReportData.cs:76` takes `totals.excluded[].maskedNumber` from the stored mask, not `Defects.MaskedNumber`. **Correction:** in the drilldown persona no excluded account has a `sourceMask`, so no behaviour differs with today's data; the bypass is real, its effect would need an excluded account with a source number |
| A-11 | yes | Live: `/debt/overview` total 19827960 became 19944060 with `excluded-in-total` on |
| A-12 | yes | Mutation: the ownership refusal removed from `Accounts.Find`; all 61 `AccountTests` still passed |
| A-13 | yes | Reading: `TestControlTests.cs:147-151` sends five set-up calls and asserts none of them |
| A-14 | yes | Reading: `ReportTests.cs:34` asserts the expected value against the pattern, not the code; `FixtureParityTests.cs:61` asserts a constant inside a loop. The other two (`PaymentHistoryTests.cs:80-84`, `ScoreTests.cs:62-64`) were read, not mutated |
| A-15 | yes | Reading: `openapi.yaml:459-462` lists 2026 first; `operations-cases.md:119` says "oldest first" |
| A-16 | yes | Reading: `AccountDetails.cs:22` has no decimal limit for `percent`; the two specification sentences differ |
| A-17 | yes | Reading: `ReportData.cs:126` filters `m <= current`; `PaymentHistory.cs:17` returns `Missed` before it tests `month > current` |
| A-18 | yes | Reading: `ControlledClock.cs` stores a nullable struct, read without a lock. A torn read is not observable and was not attempted |
| A-19 | yes | Reading: the unknown-bureau test lists six suffixes and none is `score/history` or `summary/feedback`; there is no test for `X-Correlation-Id` |
| B-06 | yes | Reading: `api/hooks.ts` calls `setBugs` only when the list is non-empty; the reviewer's P11 was not re-run |
| B-07 | yes, by reading | `prove-flags.ts:85`: an on run is "failed as stated" when its output contains `failsWith`, whether or not `ran` is true. No probe was built (nor by the reviewer) |
| B-08 | yes | Reading: `grep` finds no `timeout` in the proof or the runner and only `SIGINT` (and `exit`) handled |
| B-09 | yes | Reading: no `Retry-After` in the assert steps or the validator |
| B-10 | yes | Reading: `new Ajv2020({ strict: false, allErrors: true })` and response schemas that allow extra properties |
| B-11 | yes | Reading: `assert.steps.ts:25-30` asserts only the HTTP status and `body.type` |
| B-12 | yes | Reading: the design says "strict mode" and "returns `{ status, headers, body }`"; the code has `strict: false` and returns `{ status, body }` |
| B-13 | yes | Reading: the `After` hooks only call `resetScenario()`; the design says to attach diagnostics and restore the service state |
| B-14 | yes | Fixture: the drilldown closed card has balance 0, no limit and `includedInTotals` true, so counting it changes no total. The reviewer's mutation P2 was not re-run |
| B-15 | yes | Fixture: every closed card has a stored balance of 0, so a service that never zeroes it cannot be told apart. P3 not re-run |
| B-16 | yes | Reading: `assert.steps.ts:78-79` counts credit cards in the list |
| B-17 | yes | Reading: `profile.steps.ts:108-121` reads the expected name from the page under test |
| B-18 | yes | Reading: `secretsOf` returns the legal name, the email and the last digits only |
| B-19 | yes | Reading: `account.steps.ts:151-153` uses `includes` |
| B-20 | in part | Reading: `src/contract/load.ts`, `src/support/hooks.ts`, `clock.ts` and `service.ts` named in the design do not exist, and `run.mjs` always starts both instances. **Correction:** `src/fixtures/load.ts` does exist (the reviewer listed `load.ts` among the missing files; only `contract/load.ts` is missing). The claim about Cucumber's `html` formatter was not checked |
| C-04 | yes | Reading: the scenario uses one address (`https://evil.example/steal`); the component table has no dot segment |
| C-05 | yes | Reading: no `-over-limit` hook exists in the source; no colour bands in `styles.css` |
| C-06 | yes | Reading: `SearchesPage.tsx` passes `testId="search-list"` to `SectionState` (which makes `search-list-{state}`); no element has `data-testid="search-list"` |
| C-07 | yes | Reading: `ScoreSection.tsx:19-21` is `role="progressbar"` with `aria-label="Credit score"`; the specification says an `img` named "Score 720 out of 1000" |
| C-08 | yes | Reading: the specification and glossary say `/__debug`; `App.tsx:48` routes `/debug` |
| C-09 | yes | Mutation: `search-row-*` given a 40 rem minimum width (a 375 px break); `check:ui-exit` reported 0 problems (the layouts are checked on four pages) |
| C-10 | yes | Mutation: the dark theme's muted colour made `#34414f`; `check:ui-exit` reported 0 problems |
| C-11 | yes | Reading: the wider-text pass sets `body { font-size: 19px }`; the stylesheet sizes in `rem` |
| C-12 | yes | Mutation: `aria-pressed` removed from the year buttons; `check:ui-exit` reported 0 problems (that run held the three mutations of C-09, C-10 and C-12 together: "37 axe scans and 24 layout checks; 0 problem(s)") |
| C-13 | yes | Mutation: `TEST_BUILD` made true unless the variable is `false`; with the variable unset, `check` passed 142 of 142 tests and built, and `dist` held `cds.testControlKey` (1), `__test` (5), `/debug` (1) and `debug-flag` (1) |
| C-14 | yes | Reading: every workflow action is a major-version tag; `verify.mjs` runs `npx --yes @redocly/cli@2.57.0` |
| C-15 | **no** | The `AfterAll` hook has the default 30 s timeout and no handling. The intermittent exit 1 with every scenario green was not seen in my runs of the `@ui` scenarios (several, all exit 0). It is consistent with the code, not reproduced |
| C-16 | yes | Reading: `README.md` says 58 `@api` scenarios, 135 component tests, "DR-001 to DR-050" and Serenity/JS 3.48.2; current figures are 59, 142, DR-064 and 3.49.0 |
| C-17 | yes | Reading: the Phase 5 row reads "Planned (CDS-37, DR-064); not started" while eight flags are implemented |
| C-18 | yes | Reading: the three specifications say "Phase 0 draft, for review"; `ui-specification.md:59` says `vite` 8.3.3 and the package pins 8.3.4 |
| C-19 | yes | Reading: the harness design's scope paragraph says 28 scenarios and waits on Phase 4; `cucumber.mjs` says U1 "has the login feature only" |
| C-20 | yes | Reading: `LoginPage.tsx:35` has its own guard (`startsWith('/') && !startsWith('//')`) |
| C-21 | yes | Reading: `AccountRow.tsx` has no logo or initials |
| C-22 | yes | Reading: `ReportChangesPage.tsx` renders the pager only in the populated branch; a page past the end is the empty state |
| C-23 | in part | Reading: `ci.yml` has `timeout-minutes: 15` for the `ui` job. The job took about 3 minutes on the last runs, so the limit is not close today; the finding is a forecast |

### 4.3 What the reviewers did not cover, as they stated

Reviewer A did not run `check:schemathesis` or `check:service-contract`; B did not review `exit-checks.ts` or run `check:ui-scenarios` in full; C did not read the step glossary or most of `features-shared/` and could not check the `npm audit` figures offline. Across the three, the coverage of the harness's own validator, the Gherkin store and the generated contract is thin. These are candidates for the confirmation pass (plan D4).

## 5. The owner's sign-off

Recorded 2026-10-15 by interview (plan decision D6), the author asking each finding in turn with a recommendation and the owner answering. Blockers and Changes were asked one by one (62 questions, in groups of four on screen); the Notes were put in one table with a recommendation per Note, and the owner replied "confirmed, write sign-off and plan the fixes" on 2026-10-15. **Result: all 14 Blockers and 47 of the 48 Changes accepted** (C-23 deferred); **17 Notes accepted, 4 deferred, 5 no action.** (The author's table put to the owner said "17 accept, 3 defer and 6 no action"; the table's own rows were 17, 4 and 5, and the owner confirmed the rows. The rows are what is recorded.) The fixes are planned in `DOCS/implementation-plans/2026-10-15_cds-38-fixes.md`; slice names F1 to F12 are from that plan.

Where the owner chose between fixing the code and changing the document, the choice is in the Decision column. Where the author's question was loosely worded, it is corrected here: **A-11** is that `excluded-in-total` also changes the BR-07 debt total and breakdown (the fix aligns the flag's reach with the contract's flag text).

### 5.1 Blockers

| Finding | Decision | Slice |
|---|---|---|
| A-01 stack trace in the Development profile | Accept and fix | F3 |
| A-02 unhandled fault gives an empty 500 | Accept and fix (one fault handler with A-01) | F3 |
| A-03 `//__test/...` reveals test control | Accept and fix | F3 |
| A-04 parallel resends beat the limit | Accept and fix | F4 |
| A-05 `X-Correlation-Id` not implemented | Accept and fix as the specification says | F3 |
| A-06 clock input not RFC 3339 | Accept and fix | F3 |
| B-01 validator ignores content type | Accept and fix | F2 |
| B-02 flag proof credits `currency-float` for any integer violation | Accept and fix (with B-03) | F7 |
| B-03 flag proof credits any failure whose text is in every run | Accept and fix | F7 |
| B-04 debt-by-type step uses `includes` | Accept and fix | F5 |
| B-05 date of birth checked by shape | Accept and fix | F5 |
| C-01 `safeRedirect` returns `//evil.com` for dot segments | Accept and fix | F8 |
| C-02 over-limit bars cap `aria-valuenow` at 100 | Accept and fix: follow the specification | F9 |
| C-03 a late response overwrites current data | Accept and fix | F8 |

### 5.2 Changes

| Finding | Decision | Slice |
|---|---|---|
| A-07 report checks bureau before year window | Accept and fix | F3 |
| A-08 `PUT /__test/bugs` error is `text/plain` under `problem-json-missing` | Accept and fix | F3 |
| A-09 `currency-float` reaches only some money sites | Accept and fix; code follows the contract's flag text, or the text is narrowed, decided in F1 and recorded | F1, F4 |
| A-10 excluded list bypasses `mask-format` | Accept and fix | F4 |
| A-11 `excluded-in-total` also changes the BR-07 total | Accept and fix: align the flag with its contract text | F1, F4 |
| A-12 dropped ownership check survives the tests | Accept and fix | F6 |
| A-13 reset test asserts none of its set-up | Accept and fix | F6 |
| A-14 four rules tests cannot fail | Accept and fix | F6 |
| A-15 contract example lists years newest first | Fix the example (oldest first stays) | F1 |
| A-16 BR-14 two-decimal limit ambiguous | Specify two decimals at most and enforce | F1, F4 |
| A-17 `onReport` and year status disagree after the current month | A future month is never Missed, in both | F1, F4 |
| A-18 controlled clock read without a lock | Accept and fix | F3 |
| A-19 coverage gaps | Accept and fix | F3 (correlation id), F6 (suffixes) |
| B-06 off run not shown to have the flag off | Accept and fix | F7 |
| B-07 "something ran" not required for "failed as stated" | Accept and fix | F7 |
| B-08 no timeouts, no SIGTERM handling | Accept and fix | F7 |
| B-09 `Retry-After` never checked | Accept and fix | F2 |
| B-10 every response schema is open | Accept and fix | F2a (Addendum 1 to the fix plan; first tried in F1), then F2 |
| B-11 a Problem with a wrong `status` or a `stack` passes | Accept and fix | F2 |
| B-12 design claims strict mode and returned headers | Make the code match, then correct the wording to what is built | F2 |
| B-13 `After` hooks do not attach diagnostics or restore state | Accept and fix | F2 |
| B-14 type totals cannot tell open from closed | Accept and fix | F5 |
| B-15 "closed account reports nothing owing" cannot fail | Accept and fix | F5 |
| B-16 "the credit card is listed" counts cards | Accept and fix | F5 |
| B-17 legal-name steps compare the page with itself | Accept and fix | F5 |
| B-18 PR-08 check covers three values | Accept and fix | F5 |
| B-19 interest rate checked with `includes` | Accept and fix | F5 |
| B-20 design describes files that do not exist (in part) | Correct the design to what is built | F1 |
| C-04 redirect checks: one address, no dot segments | Accept and fix | F8 |
| C-05 `UtilisationBar` missing over-limit hook and bands | Build to the specification | F9 |
| C-06 `search-list` hook missing | Add the hook | F9 |
| C-07 score gauge is a progressbar | Change the specification (the progressbar stays) | F1 |
| C-08 `/__debug` against `/debug` | Change the documents to `/debug` | F1 |
| C-09 exit checks scan fewer states and layouts | Accept and fix | F10 |
| C-10 dark theme never checked for contrast | Accept and fix | F10 |
| C-11 "wider text" leaves most text the same size | Accept and fix | F10 |
| C-12 `ph-a11y` catch cannot see `aria-pressed` | Accept and fix | F10 |
| C-13 nothing guards the public build | Accept and fix | F10 |
| C-14 actions and one tool not pinned immutably | Accept and fix | F10 |
| C-15 `@ui` run exits 1 with every scenario green (not reproduced) | Accept: harden and log; no claim that it is fixed | F10 |
| C-16 README counts and versions stale | Accept and fix | F12 |
| C-17 README Phase 5 status stale | Accept and fix | F12 |
| C-18 specification headers and one version stale | Accept and fix | F12 |
| C-19 scope statements stale | Accept and fix | F12 |
| C-20 weaker redirect guard in `LoginPage` | Accept and fix: use the shared guard | F8 |
| C-21 account rows without logo or initials | Build to the specification (initials fallback) | F9 |
| C-22 report-changes page past the end is a dead end | Accept and fix | F8 |
| C-23 `ui` job time limit tight (in part) | **Defer** to P5, when the visual-regression run is added | P5 (CDS-43) |

### 5.3 Notes

| Finding | Decision | Slice |
|---|---|---|
| A-20 `index.html` cacheable; missing assets return 200 | Accept: no-store, 404 under `/assets/` | F3 |
| A-21 `_verifiedEmails` never read | Accept: one source for email status | F4 |
| A-22 tokens never purged; large login bodies | **Defer** (loopback demo, low risk) | backlog |
| A-23 PR-02 counts UTF-16 units | Accept: iterate runes | F4 |
| A-24 pending flags accepted and do nothing | **Defer** to P4 (CDS-42), where those flags are built | P4 |
| A-25 "422 changes nothing" checks `apr` for every field | Accept | F6 |
| A-26 BR-01 not enforced at runtime | No action | none |
| A-27 a test's name misdescribes it | Accept: rename | F6 |
| A-28 under `idor`, writes go only to the attacker's session | Accept: one sentence in the specification | F1 |
| A-29 balance history does not follow the clock | Accept: say it is relative to `asAt` | F1 |
| B-21 missing body gives a TypeError | Accept | F2 |
| B-22 suite does not prove the reset is needed | **Defer** to the confirmation pass (a random-order run) | F11 |
| B-23 parallel runs not prevented | Accept: refuse them | F2 |
| B-24 masking on persona rows tests the fixture | No action | none |
| B-25 BR-03 formula duplicated | No action | none |
| B-26 registry finds a component test by substring | Accept | F7 |
| C-24 public build free of test control | No action (C-13 adds the guard) | none |
| C-25 chat drawer modal but page behind reachable | Accept: make the page inert | F9 |
| C-26 service messages shown as written | **Defer** to P4 (CDS-42) | P4 |
| C-27 profile header image is a truncated GIF | Accept | F9 |
| C-28 account detail header is not a region | Accept: give it a landmark | F9 |
| C-29 harness builds into the public `dist` | Accept: build to `dist-test/` | F10 |
| C-30 unguarded `localStorage.setItem` on the debug page | Accept | F9 |
| C-31 no notifications button yet | No action (staged) | none |
| C-32 history table shows raw months | Accept: use `formatMonth` | F9 |
| C-33 attempts left shown before any wrong code | Accept: show after the first 422 | F9 |

Counts: Blockers 14 accepted. Changes 47 accepted, 1 deferred (C-23). Notes 17 accepted, 4 deferred (A-22 to the backlog, A-24 and C-26 to P4, B-22 to F11), 5 no action (A-26, B-24, B-25, C-24, C-31); 26 in all.
