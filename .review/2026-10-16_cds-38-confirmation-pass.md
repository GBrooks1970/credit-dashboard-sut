---
version: 1
created: 2026-10-16T22:01Z
project: credit-dashboard-sut
type: review
item: CDS-38 F11
reviewed_commit: 20ecebc (main, clean working tree; the merge of the confirmation-pass plan, #92); the earlier review was of 409249e
reviewer: three general-purpose subagents (Claude Code Agent tool), model Sonnet 5.5, fresh context, one per area; launched 2026-10-16T17:13Z
language: en-GB
---

# CDS-38 F11: the confirmation pass on the fixes F1 to F10

**What this is.** The record required by the fix plan (F11) and the confirmation-pass plan (`DOCS/implementation-plans/2026-10-16_cds-38-confirmation-pass.md`, decisions D1 to D6 as recommended: three reviewers in parallel, Sonnet 5.5, fix-aware, thin areas included, one pass, the random-order run by the author). Sections 2 and 3 are the reviewers' prompts and reports, **copied unchanged**. Section 4 is the author's verification, kept separate so that the reviewers' words are not altered. Section 5 records the owner's sign-off.

**How it was run.** Each reviewer was told only to read its prompt file. The prompt files were written before launch and are quoted in full in section 2; their SHA-256 values are in the table. The reviewers worked in copies of the repository outside it. Unlike the first review the reviewers were **fix-aware** (plan D3): each was given the list of earlier findings fixed in its area, with the slice and pull request, and was asked for a verdict on each (Fixed, Partly fixed, Not fixed, Fixed but broke something) with evidence, then for new findings, numbered `R2-A-nn`, `R2-B-nn` and `R2-C-nn`. They were not given the author's verification of the earlier findings, the sign-off, or anything under `.review/`, and were told to ignore the plans and logs. They could not write report files, so each returned its report as text and the main session saved it unchanged. All three ran to the end without a usage limit.

**Departures from the rules that the reviewers disclosed.** The three shared one scratch folder for the prompt files and some probe scripts (see 4.5). Reviewer A mapped a drive letter (`subst Q:`) to its copy because of the path length, and removed it. Reviewer B ran `check:mock` on one port above its three. Reviewer C recreated a junction that `tar` had replaced. None changed anything inside the repository.

## 1. The reviewers

| Area | Scope | Ports | Prompt SHA-256 | Report |
|---|---|---|---|---|
| A, the service | F3, F4, F6; `check:service-contract`, `check:schemathesis` | 4740 to 4742 | `5c00ca0b82328543658fb4201669906732e81aef20712004e3ea52b21c02ddb7` | 19 fixes: 12 Fixed, 7 Partly fixed; new: 8 Blocker, 5 Change, 4 Note |
| B, the harness | F2a, F2, F5, F7; the Gherkin store; the generated contract | 4750 to 4752 | `fb07d77a5f8fecaf94f538893f5660abc75f658fae734c00cbcaadedbbe0d757` | 20 fixes: 15 Fixed, 5 Partly fixed; new: 0 Blocker, 11 Change, 9 Note |
| C, the UI | F8, F9, F10, F1; the exit checks; CI | 4760 to 4762 | `d6100b0e38b37da704b76aa6b01ebb0d0c800941f7e45cf5c576f4fc22e79d6a` | 18 fixes: 14 Fixed, 4 Partly fixed; new: 4 Blocker, 11 Change, 3 Note |

Totals from the report headings: **57 earlier findings checked (41 Fixed, 16 Partly fixed, none Not fixed); new findings 12 Blocker, 27 Change, 16 Note.** Reviewer A's own Summary says 9, 5 and 3; its headings give 8, 5 and 4.

## 2. The reviewers' prompts (verbatim)

Each prompt is the shared text followed by the area section. The shared text is identical in all three; it is printed once here, and each area section after it. A reviewer's actual prompt file is the shared text with its area section appended (the SHA-256 above is of that file).

### 2.1 Shared text

````markdown
You are an independent reviewer of a software project. You did not write any of the material you are reviewing. An earlier review found faults in it; they have since been fixed by the project's author, in ten slices. Your job is a **confirmation pass**: to find out whether each fix is real and complete, whether any fix broke something or left a gap of its own, and, in the areas an earlier reviewer read only thinly, where the code, the checks that test it and the documents disagree with the specifications, above all where a check can pass when it should fail, or fail when it should pass.

## Rules

- DO NOT MODIFY THE REPOSITORY. Do not create, edit, move or delete any file inside it. Do not run git commands in it. Do not fetch anything from the network.
- You MAY copy the repository to a scratch folder outside it and run things there. Copy the folder with `cp -r` (or `robocopy`), leaving out `.git`. Everything you need is already installed in the copy (`node_modules`, build outputs); do not run `npm install` or `npm ci`, and if a check needs a download, skip it and say so. Run the project's own checks, and write your own mutation probes: change a line in the COPY to introduce a defect, run the check that ought to notice, and report whether it did.
- Use only your own network ports, set with the environment variables named in your area section, so that you do not collide with the two other reviewers who are running at the same time.
- You cannot write report files. Return your complete report as the text of your final message, in the format below, and nothing else.
- Write in British English. No em dashes and no exclamation marks in prose.
- Every finding must quote both sides: the code or check text, and the specification or contract text it disagrees with, each with its file path and line number.
- "No findings" for a check is only acceptable with a count of what you examined.
- For every probe you run, report what you changed, what you expected, and what happened. A probe that did not fail when it should have is a finding.
- Report what you could not do (a check that would not run, a file you did not read), so that a gap is visible rather than hidden.

## Repository

`D:\_CLAUDE_COWORK\PROJ001\claude-outputs\test-automation-portfolio\credit-dashboard-sut` (called REPO below), at commit `20ecebc` on `main`, with a clean working tree. Windows; both Git Bash and PowerShell are available. The earlier review was of commit `409249e`; everything since is a fix, in pull requests #78 to #90 (listed against each finding below). `git` is off limits to you, so read the files as they are.

How the project is run (from REPO, or from your copy of it):

- `npm run verify` runs 14 steps in about four minutes (three installs, eleven checks). It installs dependencies with `npm ci`, which needs the network: do not run it as a whole. Run its individual checks instead (`package.json` scripts: `check:service`, `check:harness`, `check:schemathesis`, `check:client`, `check:mock`, `check:service-contract`, `check:ui`, `check:ui-scenarios`, `check:ui-exit`, `check:bug-flags`, `check:kanban`; `fixtures/` has `npm run check`; the harness has `npm run test:unit`; `check:ui` now also runs the public-build guard).
- A Chromium is already installed. Set `HARNESS_BROWSER_PATH=C:/Users/brook/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe` for any harness run that opens a browser.
- The harness runner `test-harnesses/harness-serenity/scripts/run.mjs` starts the service itself on `HARNESS_PORT` (default 4600) and `HARNESS_OFF_PORT` (default 4601); its UI runs build a test build into `demo-apps/demoapp001-react-ui/dist-test`. Schemathesis uses `SERVICE_PORT` (default 4500). Always set your own. `check:ui-exit` takes about three minutes; `CDS_EXIT_ONLY=<text>` runs only the targets whose name holds the text.

## What the project is

A fictional UK credit-health dashboard built as a system under test, specification first: one OpenAPI contract, an ASP.NET Core minimal API on .NET 10 with a pure C# business-rules library, a React 19 UI, a Serenity/JS harness that runs one shared Gherkin store (`features-shared/`) against both the API and the UI, and a set of switchable defects ("bug flags") that test control can turn on so the checks can be shown to catch them. Read `README.md` first (it is known to be out of date in its counts and statuses: that is a recorded finding to be fixed in a later slice, so do not report it).

## Sources of truth to check against

- `DOCS/.architecture/openapi.yaml` (the contract, version 0.9.6).
- `DOCS/.design/api-specification.md` (conventions, business rules BR-01 to BR-15, personas, test control, bug flags), `business-rules-cases.md`, `operations-cases.md`, `profile-rules-cases.md`.
- `DOCS/.design/ui-specification.md`, `ui-feature-profile.md` (pages, hooks, states, accessibility, the PR rules).
- `DOCS/.design/harness-design.md`, `DOCS/step-glossary.md`, `DOCS/glossary.md`.
- `features-shared/` (the Gherkin scenarios) and `fixtures/` (personas, users, override samples, the bug-flag registry).
- `DOCS/decision-register.md` (later entries refine earlier ones).

The sections of the specifications headed "Changes in vNN" record what the fixes changed; read them as claims to be checked, not as proof. Ignore `DOCS/decision-briefs/`, `DOCS/backlog.md`, `DOCS/implementation-plans/`, `DOCS/implementation-logs/`, `DOCS/walkthroughs/`, `.review/`, `CHANGELOG.md`, `credit-dashboard-sut_implementation-kanban_v1.html` and any session or handover material: they describe history and the author's own account. Do not read them to decide whether something is right. In particular do not read anything under `.review/`: it holds the author's own verification of the earlier findings, which you must not see.

## Already known and not to be reported

Five findings were deferred by the owner and must not be reported again: the time limit of the `ui` CI job (C-23), pending UI and profile flags accepted without effect (A-24), service messages shown as the service wrote them (C-26), tokens never purged and large login bodies (A-22), and that the suite does not prove the per-scenario reset is needed (B-22; the author runs a random-order run). Four stale-document findings (the README counts and statuses, the specification headers, the harness scope paragraphs: C-16 to C-19) are fixed in a later slice; do not report them.

## What you are asked to do

1. **Verify each fix** in your area's list below. For each finding give a verdict: **Fixed** (the cause is gone and a check would notice if it came back), **Partly fixed** (say what is left), **Not fixed**, or **Fixed, but broke something** (say what). Back every verdict with evidence: the file and line, and, wherever you can, a probe in your copy that reintroduces the fault and shows whether the new check notices. A fix whose test passes with the fault put back is not fixed.
2. **Look for new faults**: things the fixes introduced, things they left untested, and faults in the thinly reviewed areas of your section. These are new findings.
3. Do not re-open a finding the list calls fixed unless you have evidence it is not.

## Severity

- **Blocker:** the code or a check contradicts a specification or the contract so that it would behave wrongly, or a check passes when it should fail (or fails when it should pass), or a security or privacy weakness.
- **Change:** stale, ambiguous or inconsistent wording; a weak check that could be stronger; a coverage gap; a robustness problem with no wrong behaviour today.
- **Note:** an observation that needs no change.

## Report format

```
# CDS-38 confirmation pass, area <A|B|C>: report

## Summary
<two to five sentences: overall verdict; how many fixes were Fixed, Partly fixed, Not fixed, Fixed but broke something; and the counts of new Blocker, Change and Note findings>

## Fix verdicts
| Finding | Verdict | Evidence (file:line, and the probe if any) |
|---|---|---|
| ...one row for every finding in your list... | ... | ... |

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| ...one row per check of your area... | ... | none, or the finding IDs |

## Probes
| Probe | What I changed (in the copy) | What I expected | What happened |
|---|---|---|---|

## New findings
### R2-<A|B|C>-01 (Blocker|Change|Note, <check id>): <short title>
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

When you have written the report, make it your final message. Begin that message with the report's Summary section so that it is the first thing read.
````

### 2.2 Area section, reviewer A, the service

````markdown
## Your area: A, the service

Your ports: `HARNESS_PORT=4740`, `HARNESS_OFF_PORT=4741`, `SERVICE_PORT=4742`. Your scratch folder: `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38c\copy_A`. You write no report file: return the report as your final message.

## Slices of fixes in your area

F3 (service faults and the edge, #82), F4 (service rules and flags, #83), F6 (service tests, #86); also F2a (#79) for the contract the service now answers to.

## Material under review

`demo-apps/demoapp001-dotnet-api/`: `CreditDashboard.Api/` (the service), `CreditDashboard.BusinessRules/` (the pure rules library), and both test projects `CreditDashboard.Api.Tests/` and `CreditDashboard.BusinessRules.Tests/`. Also `tools/generate-service-contract.mjs` and `tools/schemathesis-run.mjs`, `DOCS/.architecture/openapi.yaml` v19 and the generated `CreditDashboard.Api/Contract/`.

## The findings to verify (19 Blockers and Changes)

Each was reported by the earlier review, accepted by the project owner and fixed. Give a verdict for every one (see "What you are asked to do").

- A-01 (Blocker): The Development launch profile returns stack traces to unauthenticated callers. Fixed in F3 (#82).
- A-02 (Blocker): Unhandled faults give an empty 500, and unauthenticated input can trigger one. Fixed in F3 (#82).
- A-03 (Blocker): A double slash shows that test-control operations exist, even with test control off. Fixed in F3 (#82).
- A-04 (Blocker): The PR-09 resend limit can be beaten by parallel requests (and PR-11 has the same pattern). Fixed in F4 (#83).
- A-05 (Blocker): `X-Correlation-Id` is not implemented. Fixed in F3 (#82).
- A-06 (Blocker): The clock input accepts non-RFC 3339 text and refuses valid RFC 3339. Fixed in F3 (#82).
- A-07 (Change): For payment history, the year-window 400 comes after the bureau 404 and the persona 500. Fixed in F3 (#82).
- A-08 (Change): `problem-json-missing` also turns test-control errors into plain text. Fixed in F3 (#82).
- A-09 (Change): `currency-float` does not reach balance history or detail amounts. Fixed in F1 (#78); F4 (#83).
- A-10 (Change): `mask-format` does not reach `totals.excluded[].maskedNumber`. Fixed in F4 (#83).
- A-11 (Change): `excluded-in-total` also changes the BR-07 debt total and breakdown. Fixed in F1 (#78); F4 (#83).
- A-12 (Change): The AccountTests BR-15 cases cannot detect a dropped ownership check. Fixed in F6 (#86).
- A-13 (Change): The reset test neither asserts its setup nor checks session state. Fixed in F6 (#86).
- A-14 (Change): Four rules tests cannot fail, or assert the test data. Fixed in F6 (#86).
- A-15 (Change): The contract's payment-history example lists years newest first; the cases and the code use oldest first. Fixed in F1 (#78).
- A-16 (Change): Whether BR-14 limits `percent` to two decimals is ambiguous. Fixed in F1 (#78); F4 (#83).
- A-17 (Change): `onReport` and the year status disagree on missed months after the current month. Fixed in F1 (#78); F4 (#83).
- A-18 (Change): The controlled clock is read without a lock. Fixed in F3 (#82).
- A-19 (Change): Coverage gaps. Fixed in F3 (#82); F6 (#86).

Notes that were also fixed in the same slices (a verdict is welcome but not required; look at them if you have time):

- A-20 (Note): Edge cases in UI hosting. Fixed in F3 (#82).
- A-21 (Note): `_verifiedEmails` is written but never read. Fixed in F4 (#83).
- A-23 (Note): PR-02 counts letters per UTF-16 unit, while the contract's pattern uses `\p{L}`. Fixed in F4 (#83).
- A-25 (Note): The "422 changes nothing" test checks `apr` for every field. Fixed in F6 (#86).
- A-27 (Note): A test's name misdescribes it. Fixed in F6 (#86).
- A-28 (Note): Under `idor`, writes go only to the attacker's own session. Fixed in F1 (#78).
- A-29 (Note): Balance history does not follow the clock. Fixed in F1 (#78).

## Checklist

- **A1, rules.** Each of BR-01 to BR-15 and PR-01 to PR-11 as implemented against the specification and its cases file: the rule's text, its boundaries, and what the tests assert about each. The fixes changed BR-12 (a future month is never missed), BR-14 (a minimum payment percent allows two decimals) and PR-02 (characters are code points); check those three against their cases, and that no other rule moved.
- **A2, operations.** Each of the 36 operations in the contract (now with every response object closed) against its implementation: methods, paths, status codes, headers (`Retry-After`, `Allow`, and now `X-Correlation-Id` on every response), the order of the checks (the request's own values, including the year window, before the target and the persona), response shapes (does any response carry a property its closed schema does not list), ownership (BR-15), tokens, paging. Count the operations you traced.
- **A3, robustness and security.** The fault handler (any unhandled exception is a 500 Problem with no trace, in every environment) and the duplicate-property check; the test-control gate (repeated slashes, letter case, encoded forms, the bare `/__test` path) and whether anything in test control is reachable without it; the correlation id (what a caller can make the service write in a header); the clock (strict RFC 3339, read whole); the per-user lock on the email resend (deadlock, lock order, a lock held across an await); the hosting of the built UI (path handling, `no-store`, `HEAD`, the 404 under `/assets/`); anything that lets one user affect or read another's data outside BR-15.
- **A4, bug flags in the service.** The `Flags` mechanism and each of the seven API flags: does each change only what `DOCS/.design/api-specification.md` section 10 now says (`currency-float` on every money amount in a response, applied where the response is written; `excluded-in-total` reaching the debt total and breakdown; `mask-format` also in the excluded list), is it off by default and after a reset, does a response written by `Http.Json` copy before it changes anything. Then `fixtures/bug-flags.json` against the code.
- **A5, the service tests.** The new and changed tests (`FaultAndEdgeTests`, `RulesAndFlagsTests`, the changed `AccountTests`, `TestControlTests`, `ReportTests` and the rules tests): do they assert something that would fail if the behaviour were wrong. Run the service tests in your copy, and by mutation probes show that at least ten of them can fail.
- **A6, the thinly reviewed checks.** Run `check:service-contract` (does the generated C# contract match the contract; what would make it drift unnoticed) and `check:schemathesis` (what it fuzzes and what it excludes; does it still see a closed-schema violation; is the test-control exclusion sound) in your copy and say what they reported and how long they took.

## Probes you must run

At least eight mutation probes in your copy, spread over A1 to A4, including: put the fault back for at least four of the fixes in your list (so that you can say whether its new test notices); make the gate treat one spelling of a test-control path differently; make the resend lock not cover the write; add an unlisted property to one response; make a flag stay on after a reset. For each, report which test, if any, failed.
````

### 2.3 Area section, reviewer B, the harness, the steps, the flag proof and the shared store

````markdown
## Your area: B, the harness, the steps, the flag proof and the shared store

Your ports: `HARNESS_PORT=4750`, `HARNESS_OFF_PORT=4751`, `SERVICE_PORT=4752`. Your scratch folder: `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38c\copy_B`. You write no report file: return the report as your final message.

## Slices of fixes in your area

F2a (closed response schemas, #79), F2 (the validator and hooks, #80 and #81), F5 (fixtures and steps, #85), F7 (the flag proof, #87).

## Material under review

`test-harnesses/harness-serenity/` (abilities, `src/api/`, `src/ui/`, `src/steps/`, `src/support/`, `src/contract/`, `src/flags/`, `scripts/run.mjs`, `cucumber.mjs`, and its unit tests run by `npm run test:unit`); `features-shared/` (the Gherkin store) as the thing the steps implement; `fixtures/` (personas, users, override samples, `schema-check.mjs`, `bug-flags.json`); `DOCS/step-glossary.md` and `DOCS/.design/harness-design.md` (sections 28 to 31 describe the fixes); the generated contract and typed client (`packages/api-client`) against `openapi.yaml`.

## The findings to verify (20 Blockers and Changes)

Each was reported by the earlier review, accepted by the project owner and fixed. Give a verdict for every one (see "What you are asked to do").

- B-01 (Blocker): the validator never checks the content type, so a Problem sent as plain text passes. Fixed in F2 (#80, repaired by #81).
- B-02 (Blocker): `failsWith: "must be integer"` credits `currency-float` with any integer violation. Fixed in F7 (#87).
- B-03 (Blocker): a `failsWith` text that appears in every run is accepted, so any failure counts as a catch. Fixed in F7 (#87).
- B-04 (Blocker): the UI debt-by-type step uses `includes`, so a figure with an extra digit passes. Fixed in F5 (#85).
- B-05 (Blocker): "sees their legal name and date of birth" checks only the shape, not the values. Fixed in F5 (#85).
- B-06 (Change): the off run is not shown to have the flag off; it relies on the service's reset alone. Fixed in F7 (#87).
- B-07 (Change): the "something ran" check applies to a pass, but not to "failed as stated". Fixed in F7 (#87).
- B-08 (Change): no timeouts, and no SIGTERM handling. Fixed in F7 (#87).
- B-09 (Change): `Retry-After` is never checked. Fixed in F2 (#80, repaired by #81).
- B-10 (Change): every response schema is open, so extra properties pass, including a leaked full account number. Fixed in F2a (#79); F1 (#78); F2 (#80, repaired by #81).
- B-11 (Change): a Problem whose `status` disagrees with the HTTP status, or that carries a `stack`, passes. Fixed in F2 (#80, repaired by #81).
- B-12 (Change): the harness design claims Ajv strict mode and returned headers; the code has neither. Fixed in F2 (#80, repaired by #81).
- B-13 (Change): the After hook neither resets the service nor attaches diagnostics. Fixed in F2 (#80, repaired by #81).
- B-14 (Change): "Type totals sum the open accounts" cannot tell open accounts from closed ones. Fixed in F5 (#85).
- B-15 (Change): "A closed account reports nothing owing" cannot fail. Fixed in F5 (#85).
- B-16 (Change): "the credit card is listed" counts credit cards rather than checking that card. Fixed in F5 (#85).
- B-17 (Change): the legal-name steps compare the page with itself. Fixed in F5 (#85).
- B-18 (Change): the PR-08 check covers three values, not all profile data. Fixed in F5 (#85).
- B-19 (Change): the recorded interest rate is checked with `includes`. Fixed in F5 (#85).
- B-20 (Change): the design describes files and behaviour that do not exist. Fixed in F1 (#78).

Notes that were also fixed in the same slices (a verdict is welcome but not required; look at them if you have time):

- B-21 (Note): a missing body is rejected by a TypeError instead of a readable message. Fixed in F2 (#80, repaired by #81).
- B-23 (Note): parallel runs are not prevented. Fixed in F2 (#80, repaired by #81).
- B-26 (Note): the registry finds a component test by substring, while Vitest treats the name as a pattern. Fixed in F7 (#87).

## Checklist

- **B1, steps against scenarios.** For every step definition (count them, API and UI), does it assert what its Gherkin sentence says? Look for an assertion weaker than the sentence, a step that can pass vacuously, a value the step compares against that comes from the same source as the system's own answer. The fixes changed the debt, interest-rate, legal-name, date-of-birth, PR-08 and credit-card steps; check each, and trace at least ten scenarios (at least four `@ui` and four `@api`) from Gherkin to assertion and say what would make each pass wrongly.
- **B2, isolation.** What each scenario starts from (the reset, the persona, the clock, the cached tokens, the flags set and checked through `GET /__test/state`), what can leak, what the After hook now does (diagnostics on failure, a reset against the main instance), and the parallel-run refusal.
- **B3, contract validation.** The Ajv validator in `src/contract/validate.ts` as rewritten (strict mode, every response schema compiled at load, content type, documented headers such as `Retry-After`, a Problem's status and its forbidden fields, a body that is not JSON): is it as strict as it claims, and does each refusal really fail a run. Prove it with probes, and read its unit tests for any that cannot fail.
- **B4, the bug-flag proof and the registry.** `src/flags/verdict.ts` and `prove-flags.ts`, `fixtures/bug-flags.json`, `fixtures/schema-check.mjs` (now refusing a `failsWith` that the feature file holds and a component test that is not declared with `it(` or `test(`), the part of `scripts/run.mjs` that runs the proof, and `HARNESS_BUGS` and `CDS_FLAGS`. Can a flag still be credited for the wrong reason? Can a catcher that ran nothing, crashed or timed out be counted? Is the time limit and the SIGTERM handling sound? Process, port and environment handling.
- **B5, the fixtures.** The personas, users and override samples against the rules they claim to exercise, including the closed accounts that now hold a stored balance and a limit (BR-13, BR-04), and `schema-check.mjs`: does it check the rules independently of the service.
- **B6, the shared Gherkin store and the generated contract (thinly reviewed before).** Every feature file in `features-shared/` against `DOCS/step-glossary.md`: is every sentence defined exactly once, does every step in the glossary exist, does every `@BR-nn` and `@PR-nn` tag name a rule that exists, is any scenario unreachable by either profile. The generated typed client and C# contract against `openapi.yaml` v19 (run `check:client`, `check:service-contract`, `check:mock` and `check:kanban`, and say what each did and what would make it drift unnoticed).

## Probes you must run

At least eight mutation probes in your copy, spread over B1 to B4, including: put the fault back for at least four of the fixes in your list (a loose `failsWith`, a flag-off run that prints the failure text, a step compared with `includes` again, a validator check switched off) and say whether the harness noticed; make a catcher name match nothing; leave a flag on across a reset; make the service return a wrong value and see which scenario notices. Also run, in your copy, `check:harness` (the `@api` scenarios), `npm run test:unit` in the harness and `check:bug-flags` once, and say how long each took and what they reported.
````

### 2.4 Area section, reviewer C, the UI, the exit checks, CI and the documents

````markdown
## Your area: C, the UI, the exit checks, CI and the documents

Your ports: `HARNESS_PORT=4760`, `HARNESS_OFF_PORT=4761`, `SERVICE_PORT=4762`. Your scratch folder: `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\cds38c\copy_C`. You write no report file: return the report as your final message.

## Slices of fixes in your area

F8 (redirects and late answers, #88), F9 (display and semantics, #89), F10 (exit checks, the public-build guard, CI pins and hooks, #90), and F1 (specifications, #78).

## Material under review

`demo-apps/demoapp001-react-ui/` (source, its Vitest tests, `scripts/public-build-guard.mjs` and its tests); `test-harnesses/harness-serenity/src/exit/exit-checks.ts` v2 (the accessibility and layout checks); `.github/workflows/` (now with every action pinned to a commit SHA); the `package.json` files and lock files at the root and in each package (`@redocly/cli` is now a root dependency); `tools/`; the specifications as claims to be checked against the code (UI specification v27, My Profile specification v11).

## The findings to verify (18 Blockers and Changes)

Each was reported by the earlier review, accepted by the project owner and fixed. Give a verdict for every one (see "What you are asked to do").

- C-01 (Blocker): the open-redirect guard returns a protocol-relative address for input with dot segments. Fixed in F8 (#88).
- C-02 (Blocker): over-limit progress bars report 100, and a component test asserts it. Fixed in F9 (#89).
- C-03 (Blocker): a late response overwrites the current page's data. Fixed in F8 (#88).
- C-04 (Change): the open-redirect checks test one hostile address in the browser and none with dot segments. Fixed in F8 (#88).
- C-05 (Change): `UtilisationBar` is not built as specified (no over-limit badge hook, no colour bands). Fixed in F9 (#89).
- C-06 (Change): the `search-list` hook does not exist. Fixed in F9 (#89).
- C-07 (Change): the score gauge is a progress bar named 'Credit score'. Fixed in F1 (#78).
- C-08 (Change): the debug panel's route and gating differ between the code and the documents. Fixed in F1 (#78).
- C-09 (Change): the exit checks scan fewer states and layouts than the specification says. Fixed in F10 (#90).
- C-10 (Change): the dark theme is never checked for contrast. Fixed in F10 (#90).
- C-11 (Change): "wider text" leaves most text the same size. Fixed in F10 (#90).
- C-12 (Change): the catch stated for `ph-a11y` cannot see half of its effect. Fixed in F10 (#90).
- C-13 (Change): no check guards the public build against test code. Fixed in F10 (#90).
- C-14 (Change): the workflow actions and one tool are not pinned immutably. Fixed in F10 (#90).
- C-15 (Change): an `@ui` run can fail with every scenario green and no reason shown. Fixed in F10 (#90).
- C-20 (Change): the redirect back after sign-in uses its own, weaker guard. Fixed in F8 (#88).
- C-21 (Change): account rows have no logo or initials fallback. Fixed in F9 (#89).
- C-22 (Change): a report-changes page past the end leaves the customer stuck. Fixed in F8 (#88).

Notes that were also fixed in the same slices (a verdict is welcome but not required; look at them if you have time):

- C-25 (Note): the chat drawer is marked modal but the page behind it stays reachable. Fixed in F9 (#89).
- C-27 (Note): the profile header image is a truncated GIF. Fixed in F9 (#89).
- C-28 (Note): the account detail header is not a region. Fixed in F9 (#89).
- C-29 (Note): the harness builds into the public `dist` and writes logs to the system temp folder. Fixed in F10 (#90).
- C-30 (Note): one storage write on the debug page is not guarded. Fixed in F9 (#89).
- C-32 (Note): the history table alternative shows raw months. Fixed in F9 (#89).
- C-33 (Note): the mobile page shows attempts left before any wrong code. Fixed in F9 (#89).

## Checklist

- **C1, pages against the UI specification.** The page catalogue, each page's specification, the hooks (`data-testid`), the four section states, formatting, and the profile pages against `ui-feature-profile.md`. The fixes changed the utilisation bars (one `UtilisationBar`: real `aria-valuenow`, raised `aria-valuemax`, bands, the `{testId}-over-limit` badge), account rows (initials), the searches list hook, the detail header (a region), the chat drawer (the page behind is `inert`), the history table (worded months), the mobile attempts line, the changes page past the end, and two new value hooks. Count the pages and hooks you checked; flag a hook, state, copy or behaviour that differs.
- **C2, behaviour.** The session (token in memory only); the open-redirect guard in `src/safeRedirect.ts` as rewritten (try many hostile addresses, including encoded ones, `//host`, `/..//host`, backslashes, tabs and control characters, `javascript:` and `data:`; and the sign-in redirect-back that now uses it); the latest-request-wins hook `useLatest` and where it is and is not used (every place a response can arrive after the page changed, including under React Strict Mode); forms and their error paths; error and empty states; anything that can throw during render (the history table now words its months: what does it do with a month it cannot parse).
- **C3, accessibility and semantics, and the exit checks (thinly reviewed before).** UI specification section 4.5 against the code; and whether `exit-checks.ts` v2 scans what it says it scans: which pages and states are covered (the list of targets), light and dark, the three layouts with normal and doubled text, whether a violation really fails the run, whether the layout check measures what it claims, whether moving between targets by in-app navigation hides a state a fresh visit would show. Run `check:ui-exit` once in your copy (about three minutes) and say what it reported; use `CDS_EXIT_ONLY` for probes.
- **C4, security and privacy.** Injection; browser storage use; personal data in addresses and page titles (PR-08); error messages shown verbatim; and **whether the public build contains any test code.** The new guard scans `dist/` for five markers: is that the right list, can test code reach the public build without containing any of them, and does the guard fail when it should (probe it). Build the UI without `VITE_TEST_BUILD` and with it, and compare.
- **C5, CI, scripts, pins and supply chain.** `.github/workflows/*.yml` (the pinned action SHAs: are they the commits of the tags named in the comments, as far as you can tell offline; permissions; forks; secrets; the Pages deployment), the `package.json` scripts, version pins, lock files present and consistent (the root lock file with `@redocly/cli`), `npm audit` if it works offline, the longer `ui` job (what runs in it and how long), the bounded `AfterAll` and the run-hook message in `scripts/run.mjs`.
- **C6, the specifications as claims (partly new).** Read the "Changes in vNN" entries for UI specification v19 to v27, My Profile specification v8 to v11 and API specification v28 to v32 as claims, and check at least twenty distinct claims against the code or by running the command. Report each that is wrong. (The README is out of date by design, see above.)

## Probes you must run

At least eight mutation probes in your copy, spread over C1 to C4, including: put the fault back for at least four of the fixes in your list (the old redirect guard, a bar capped at 100, a response that overwrites a newer one, the drawer not making the page inert, a test-only string in the public build) and say whether the component tests, the `@ui` scenarios, the exit checks or the guard noticed; break a layout at 375 px with doubled text; remove an `aria-` name; make a page show a wrong figure. Run the relevant check each time: `check:ui`, `check:ui-scenarios`, `check:ui-exit`.
````

The launch message each reviewer received was: "Your complete instructions are in the file <path to prompt_X.md>. Read it in full and do exactly what it says. Nothing else is asked of you." The files were resolved to the scratch folder paths named in each area section.

## 3. The reviewers' reports (verbatim)

### 3.1 Report of reviewer A

The text below is exactly what the reviewer returned (the harness indented every line of it when handing it back; the indent is removed). Its headings are left as written so that its words are unchanged.

````markdown
# CDS-38 confirmation pass, area A: report

## Summary
Most of the F3, F4 and F6 fixes are real and their new tests do fail when the fault is put back, but the fixes are less complete than the "Fixed" status suggests. Of the 19 findings: 11 Fixed (A-03, A-05, A-08, A-09, A-10, A-11, A-12, A-13, A-15, A-16, A-18), 7 Partly fixed (A-01, A-02, A-04, A-06, A-07, A-17, A-19), 0 Not fixed, 1 Fixed but broke something (A-14 is fine; the break is the F5 closed-account change that the service code was not adapted to, reported as R2-A-08; A-14 itself is Fixed, so the "Fixed, but broke something" count is 0 and R2-A-08 is a new finding). Of the 7 Notes, A-20, A-21, A-23, A-25, A-28 and A-29 are Fixed and A-27 could not be identified. New findings: 9 Blocker, 5 Change, 3 Note. The Blockers: unhandled faults still reachable from any string field (lone surrogate escape gives 500), the PR-11 attempt limit still beaten by parallel requests, the clock accepting a trailing newline and non-ASCII digits, a signed `year` value silently answered with the current year, the payment-history `missed[]` list still listing future months, closed accounts reporting balance 0 with a non-zero utilisation, and three checks that stay green with the fix removed (FaultHandler registration, the account half of A-07, and PR-11 concurrency). Correction to the first sentence of this paragraph's count: the exact tallies are in the table below.

## Fix verdicts
| Finding | Verdict | Evidence (file:line, and the probe if any) |
|---|---|---|
| A-01 Dev profile returns traces | Partly fixed | Behaviour is fixed: a Development-environment instance answers an unhandled fault with a 500 Problem, fixed detail, no trace (live, `curl` of a lone-surrogate login against `ASPNETCORE_ENVIRONMENT=Development`). `Program.cs:27` registers `FaultHandler`. But probe P1 removed that registration and all 387 service tests still passed: `FaultAndEdgeTests.cs:44-62` builds its own pipeline with `app.UseMiddleware<FaultHandler>()` (line 53), so nothing proves the service uses the handler. See R2-A-09. |
| A-02 Empty 500 / unauthenticated input triggers one | Partly fixed | The 500 is now a Problem and the duplicate-property check works (P16: disabling it fails 2 tests). But unauthenticated input still triggers an unhandled fault: `{"username":"alex","password":"\ud800"}` gives 500 (stack: `Session.cs:53` `GetValue<string>()` throws "missing low surrogate"). Same for every string field (preferred name, email, mobile number, code, assistant message, feedback value, details field). See R2-A-01. |
| A-03 Double slash reveals test control | Fixed | `TestControlGate.cs:20-28`. P2a (no slash collapse) fails 4 tests; P2b (case-sensitive) fails 1. Live, 18 spellings (repeated slashes, `%5F%5Ftest`, mixed case, `/./`, `/x/../`, bare `/__test`, trailing slash, `//api/v1/__test/state`) all give the identical gate 404 with test control off and with it on but no key; `%2F`, `;x`, `__test.` reach no endpoint. |
| A-04 PR-09 / PR-11 parallel beating | Partly fixed | PR-09 fixed: `Profile.cs:112-118` holds `EmailLock` over read, decide and write. P3 (write moved outside the lock) fails `Requests_that_arrive_together...` 7 times out of 7 runs; live, 30 bursts of 40 parallel resends gave exactly one 202 each. PR-11 not fixed: `Profile.cs:164-168` reads `session.Mobile`, decides and writes with no lock. Live, 2 of 30 rounds of 40 parallel wrong codes returned 3 `code-wrong` answers (limit is 2 wrong then the voiding third). `ProfileOperationTests.cs:333-348` is sequential only. See R2-A-04. |
| A-05 X-Correlation-Id | Fixed | `Faults.cs:37-55`. P4 (header never written) fails 3 tests. Live: header present on 200, 204, 401, 404, 405, 500 and on every hosted-UI response; `bad value;` replaced by a GUID, `ok_1.2-X` echoed. |
| A-06 Clock input | Partly fixed | `Rfc3339.cs:13` shape check works for the table (P5, shape check removed, fails 7 tests). But `$` matches before a final newline and `\d` matches non-ASCII digits: live `{"now":"2026-10-03T09:00:00Z\n"}` and `{"now":"２０２６-10-03T09:00:00Z"}` both give 204 and freeze the clock. No test covers either. See R2-A-05. |
| A-07 Year window order | Partly fixed | Report operation fixed: `Report.cs:88-93`; P6 (check moved after bureau/persona) fails `An_out_of_window_year_is_a_400...`. Account operation (`Accounts.cs:138-143`) is unprotected: P6b (check moved after the owner lookup) leaves all 387 tests green because `FaultAndEdgeTests.cs:175` uses `acc_nope`, which fails the `^acc_[a-z0-9]{5,}$` pattern at the edge, so it is a 400 whatever the handler does. Also `year=%2B2018` is answered 200 (R2-A-06, R2-A-10). |
| A-08 problem-json-missing on test control | Fixed | `Problems.cs:58`. P7 (exemption removed) fails 1 test. |
| A-09 currency-float reach | Fixed | `Defects.cs:41-62`, applied in `Session.cs:30`. P8 (arrays not walked) fails 5 tests (totals, list, balance history, debt, overview). The body is cloned first (`Defects.cs:44`); the "flag off again" test passes. See Note R2-A-17 on whole-pound amounts. |
| A-10 mask-format excluded list | Fixed | `ReportData.cs:76`. P9 (raw `maskedNumber` in the excluded list) fails `Mask_format_returns_the_whole_source_number_in_the_excluded_list_too`. |
| A-11 excluded-in-total reach | Fixed | Documented in `api-specification.md:308`; `ReportData.cs:37` routes through `Defects.IncludedInTotals`. P22 (debt ignores the flag) fails the pinning test. |
| A-12 BR-15 cases cannot detect a dropped check | Fixed | `AccountTests.cs:25` binds sam to `excellent`. P12 (ownership always off) fails 4 tests, including `Another personas account is a 404 (BR-15)`. |
| A-13 Reset test | Fixed | `TestControlTests.cs:145-170` asserts each set-up call. P11 (sessions not cleared) fails 2 tests; P10 (flags not cleared) fails 2 tests. |
| A-14 Four rules tests that cannot fail | Fixed | Three of the four now fail on the fault: R8 (carry a score forward from outside the range) fails 3; R9 (window shifted back) fails 3; R11 (loan rule always true) fails `A_loan_without_a_limit_is_stored_as_not_included`. The fourth (`ReportTests.cs:35`, mask pattern) asserts the code's output but is redundant with the table: R10 (no uppercase) fails 5 tests through the table alone (Note R2-A-16). |
| A-15 Payment-history example order | Fixed | `openapi.yaml` example lists 2020 to 2026 (lines 462-474). |
| A-16 BR-14 percent decimals | Fixed | `AccountDetails.cs:22`. P13 fails 2 rules tests (`5.555`, `99.999`); live `percent` 0.005 gives 422, 5.50 gives 200. |
| A-17 onReport vs year status | Partly fixed | `PaymentHistory.cs:18` and `ReportData.cs:126` are fixed (P14 fails 1 rules test). But `ReportData.cs:106-112` `MissedIn` lists every missed month of the year including future ones. See R2-A-07. |
| A-18 Clock read without a lock | Fixed | `ControlledClock.cs:17-29`. P17 (nullable struct again) fails `The_clock_is_never_seen_half_written` 8 times out of 8 reruns. |
| A-19 Coverage gaps | Partly fixed | The new test classes exist and most catch their fault (about 30 probes below), but three new guards are vacuous or missing: R2-A-09, R2-A-10, R2-A-04. |
| A-20 UI hosting (Note) | Fixed | `Program.cs:39-59`. P18 (assets fall through to index.html) fails 1 test. Live (24 requests): `no-store` on `/`, `/login`, `/index.html`, `/Index.HTML`; HEAD answered; `/assets/missing.js`, `/assets`, `/assets/` give 404 Problem; `%2e%2e`, `..%2f`, `..%5c` did not serve a file outside the folder. |
| A-21 `_verifiedEmails` (Note) | Fixed | `PersonaStore.cs:93-97`; `RulesAndFlagsTests.cs` `The_email_status_has_one_source...` passes; field gone. |
| A-23 PR-02 code points (Note) | Fixed | `PreferredName.cs:23-25`. P15 (UTF-16 units) fails `Letters_outside_the_basic_multilingual_plane...`. Live results agree with the contract's `\p{L}` (Greek, CJK accepted; Mn, Nl, emoji, curly apostrophe refused). |
| A-25 "422 changes nothing" (Note) | Fixed | `AccountTests.cs:254-262` compares all details. P23 (store the value even on 422) fails 12 tests. |
| A-27 Test name misdescribes (Note) | Not verified | I could not tell from the code which test this was; not examined further. |
| A-28 idor writes (Note) | Fixed | Live with `idor` on: alex PATCHes sam's `acc_excc01`, 200; sam still sees apr 24.9; alex sees 99.5. |
| A-29 Balance history vs clock (Note) | Fixed | `Accounts.cs:130` returns the stored history; `api-specification.md:279` says so. |

(Tally for the Summary: 11 Fixed among A-01 to A-19, 7 Partly fixed, 0 Not fixed, 0 Fixed-but-broke-something; plus 6 Notes Fixed, 1 not verified. The Summary's second sentence above is therefore the only count that matters: 11 / 7 / 0 / 0.)

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| A1 rules | BR-01 to BR-15 (15 rules, 15 sections of `business-rules-cases.md` read against `BusinessRules/*.cs`); PR-02 to PR-11 (8 testable of the 11 listed; PR-01, PR-05, PR-08 exempt); 239 rules tests run (all pass); 14 rule mutation probes (P13, P14, P15, R1 to R11). BR-12, BR-14, PR-02 checked against their cases: all three match. No other rule moved. | R2-A-07, R2-A-08 (service call sites, not the library) |
| A2 operations | 36 of 36 operations traced to a handler (4 session, 9 report, 6 accounts, 4 supporting, 6 profile, 7 test control); 354 live 200 responses over 6 personas (excellent, struggling, thin-file, boundary, drilldown, error) validated with Ajv against the closed contract: 0 violations; order-of-check probes; `Allow`, `Retry-After`, `X-Correlation-Id` observed | R2-A-06, R2-A-10 |
| A3 robustness and security | Gate: 18 spellings x 2 configurations; fault handler: 9 string-field bodies + 12 numeric/odd bodies; duplicate-property: 6 variants; clock: 31 inputs; lock order read in 6 places (`EmailLock` then store lock, never reversed; no await inside); UI hosting: 24 requests; correlation id: 5 inputs; cross-user: 4 routes (idor on and off) | R2-A-01, 02, 03, 04, 05, 11, 15, 16 |
| A4 bug flags | 7 service flags read against section 10 and `Defects.cs`; registry `fixtures/bug-flags.json` (30 entries, 9 service-layer: 7 implemented, 2 pending) against `Flags.Implemented`: they agree; off by default and after reset (P10); `Http.Json` copy confirmed (`Defects.cs:44`) | R2-A-17 (Note) |
| A5 service tests | 387 service + 239 rules tests run; 8 changed or new service test classes read in full (FaultAndEdgeTests, RulesAndFlagsTests, AccountTests, TestControlTests, FlagTests, OperationResponseTests, ContractCoverageTests, EdgeValidationTests) and the profile tests in part; about 35 mutation probes, all but 4 caught | R2-A-09, R2-A-10, R2-A-04 |
| A6 contract and fuzzing | `check:service-contract`: passed in 8.1 s ("1940 lines of C#"). `check:schemathesis`: passed in 67 s (business pass 28 of 36 operations, 1294 cases, 52 skipped; test control pass 5 operations, 650 cases) | R2-A-13 |

## Probes
| Probe | What I changed (in the copy) | What I expected | What happened |
|---|---|---|---|
| P1 | Removed `app.UseMiddleware<FaultHandler>();` from `Program.cs` | A test fails | None failed (387 pass). Finding R2-A-09. |
| P2a | `TestControlGate.IsTestControlPath` without slash collapsing | Slash tests fail | 4 failed (`//__test/reset`, `///__test///reset`, `//__test`, double-slash with key on). |
| P2b | Gate path compare `OrdinalIgnoreCase` to `Ordinal` (one spelling differs) | Case test fails | 1 failed (`/API/V1/__TEST/RESET`). |
| P3 | Resend: `SetLinkSent` moved outside the `lock` | Parallel test fails | 1 failed; re-run 6 of 6 failed. |
| P4 | Correlation header assignment removed | Header tests fail | 3 failed. |
| P5 | `Rfc3339.TryParse` without the shape check | Clock table fails | 7 failed. |
| P6 | Report payment-history: year check moved after `Resolve` | A-07 test fails | 1 failed. |
| P6b | Account payment-history: year check moved after `Owned` | A-07 test fails | None failed (test uses `acc_nope`, a pattern 400). Finding R2-A-10. |
| P7 | Removed the test-control exemption in `Problems.Write` | A-08 test fails | 1 failed. |
| P8 | `Floatify` no longer walks arrays | currency-float tests fail | 5 failed. |
| P9 | Excluded list uses the stored `maskedNumber` | A-10 test fails | 1 failed. |
| P10 | Reset no longer clears `_flags` | Flag-reset tests fail | 2 failed. |
| P11 | Reset no longer clears `_sessions` | Reset tests fail | 2 failed. |
| P12 | `Find` always behaves as `idor` | BR-15 tests fail | 4 failed. |
| P13 / P13b | `MinPaymentPercent` without the two-decimal check | Rules test fails | Rules: 2 failed; service tests: 0 failed (rules tests carry it). (First P13b/P14b runs were invalid, stale build; re-run valid.) |
| P14 / P14b | `AccountMonth` checks missed before future | BR-12 test fails | Rules: 1 failed; service tests: 0 failed. |
| P15 | PR-02 counts UTF-16 units | A-23 test fails | 1 failed. |
| P16 | Duplicate-property check disabled | Dup test fails | 2 failed. |
| P17 | Clock back to nullable struct | A-18 test fails | 1 failed; 8 of 8 reruns failed. |
| P18 | Removed the `/assets` 404 branch | Hosting test fails | 1 failed. |
| P19 | Added `"leak": true` to `BureauJson` | Closed-schema tests fail | 12 failed. |
| P20 | Added `"leak": 1` to the preferred-name response | Service tests fail | 7 failed (ProfileOperationTests). |
| P21 | Added `"leak": 1` to the overview | Service tests fail | 10 failed. |
| P22 | Debt overview ignores `excluded-in-total` | A-11 test fails | 1 failed. |
| P23 | 422 path stores the value anyway | A-25 test fails | 12 failed. |
| R1 to R10 | BR-13 five years; BR-07 exclusive; BR-03 truncation; BR-15 case-insensitive; PR-09 `>`; PR-10 `>`; no-op control; BR-02 carry forward; BR-12 window shifted; BR-09 no uppercase | Each caught | R1 2, R2 3, R3 9, R4 1, R5 1, R6 2, R7 (control) 0 as expected, R8 3, R9 3, R10 5 failed. |
| R11 | `IsIncludedInTotals` always true | Fixture parity fails | 1 failed. |
| S1 (Schemathesis) | `"leak": true` in `BureauJson` | Run fails | Exit 1: "Additional properties are not allowed ('leak' was unexpected)". |
| S2 (Schemathesis) | `"leak": 1` in the preferred-name response | Run fails | Exit 0: not caught (the operation's schema check is disabled, `schemathesis.toml:54-56`). Service tests do catch it (P20). |
| Live race, PR-09 | 30 bursts x 40 parallel resends | Exactly one 202 | One 202 in all 30. |
| Live race, PR-11 | 30 rounds x 40 parallel wrong codes | At most 2 `code-wrong` | 3 `code-wrong` in 2 of 30 rounds. |

## New findings
### R2-A-01 (Blocker, A3): A string with a lone surrogate escape still triggers an unhandled fault in every body handler
- Where: `demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Routes/Session.cs:53` (and every `GetValue<string>()` in the handlers, for example `Profile.cs:72`, `Profile.cs:85`, `Profile.cs:139`, `Profile.cs:163`, `Supporting.cs:80`, `Report.cs:138`, `Accounts.cs:159`)
- Code or check text: `var password = body["password"]!.GetValue<string>();` Live: `POST /api/v1/auth/login` with `{"username":"alex","password":"\ud800"}` gives 500; log: "Cannot read incomplete UTF-16 JSON text as string with missing low surrogate", at `Session.Login ... line 53`. The same body in `preferredName`, `address`, `number`, `code`, `message`, `value` or `field` gives 500.
- Specification or contract text: "the request's own values: the shape of the path, query and body ... (400)" (`DOCS/.design/api-specification.md:243`); "500 | `/internal` | `error` persona, or an unhandled fault" (`api-specification.md:253`); A-02 was "unauthenticated input can trigger one".
- Why it matters: A-02's second half is only closed for the repeated-property case; any caller, signed in or not, can still make the service fault with a valid-looking JSON body. The response is now a clean Problem, so there is no leak, but it is still an unhandled fault from unauthenticated input.
- Suggested fix: Read the body once at the edge with strict string validation (for example walk the tokens with `Utf8JsonReader.GetString()` inside the existing `try`, and add `InvalidOperationException` to the caught list) and answer 400.

### R2-A-02 (Change, A3): Valid-by-schema numbers written with an exponent fault `PUT /__test/latency`
- Where: `CreditDashboard.Api/Routes/TestControl.cs:97`
- Code or check text: `int? Read(string name) => body[name]?.GetValue<int>();` Live: `{"fixedMs":1e3}` gives 500.
- Specification or contract text: "`PUT /__test/latency` takes `fixedMs`, or `minMs` with `maxMs` ... no delay exceeds 10,000 ms" (`api-specification.md:172`); JSON Schema `integer` accepts `1e3`.
- Why it matters: A keyed caller gets 500 for a value the contract allows; Schemathesis never sees it because `testSetLatency` is excluded (`tools/schemathesis-run.mjs:102`).
- Suggested fix: Read the numbers as decimal and check they are whole, or reject exponent forms at the edge with a 400.

### R2-A-03 (Change, A3): `format` keywords are not enforced at the edge, so test-control overrides can fault the service
- Where: `CreditDashboard.Api/Edge/ContractValidation.cs:151-153` (`schema.Evaluate` without format validation); `Control/OverridesValidator.cs:57`
- Code or check text: `var openedMonth = a["openedDate"]!.GetValue<string>()[..7];` Live: binding an override with `openedDate: "x"` gives 500 at bind; `openedDate: "2020-01-01x"` binds (204) and the next `GET /reports/bureau-a/payment-history` gives 500; `lastUpdated: "garbage"` and `closedDate: "soon"` bind (204) and are echoed.
- Specification or contract text: "`openedDate: { type: string, format: date }`" (`openapi.yaml:1721`); "Overrides ... Accounts use the contract's `FixtureAccount`" (`api-specification.md:188`); "A body that fails the schema is a `400`" (`api-specification.md:190`).
- Why it matters: A body that breaks the contract's own formats is accepted, and then a later ordinary read faults.
- Suggested fix: Turn on format assertion for `date`, `date-time` and `email` in the edge (`EvaluationOptions.RequireFormatValidation`), or validate the dates in `OverridesValidator`.

### R2-A-04 (Blocker, A3/A5): The PR-11 attempt limit still has the check-then-write race, and no test would see it
- Where: `CreditDashboard.Api/Routes/Profile.cs:164-168`; test gap `CreditDashboard.Api.Tests/ProfileOperationTests.cs:333-348`
- Code or check text: `var held = session.Mobile; var result = ...Mobile.Check(held?.Challenge, code, clock.UtcNow); ... session.Mobile = held with { Challenge = result.Challenge, ... };` (no lock). Live: 30 rounds of 40 parallel wrong codes; 2 rounds returned 3 `code-wrong`.
- Specification or contract text: "Each wrong code is refused; the third wrong code voids the code" (`DOCS/.design/ui-feature-profile.md:144`, PR-11); A-04 title: "(and PR-11 has the same pattern)".
- Why it matters: The fix for A-04 covered PR-09 only; parallel requests still get more than three tries at a code.
- Suggested fix: Do the read, `Mobile.Check` and write inside one lock (the same `EmailLock` pattern, or a separate `MobileLock`), and add a burst test like `RulesAndFlagsTests.cs:39`.

### R2-A-05 (Blocker, A3): The clock still accepts text that is not RFC 3339
- Where: `CreditDashboard.Api/Control/Rfc3339.cs:13` and `:19-20`
- Code or check text: `[GeneratedRegex(@"^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$")]`. Live: `"2026-10-03T09:00:00Z\n"` (trailing newline) and `"２０２６-10-03T09:00:00Z"` (full-width digits) both give 204.
- Specification or contract text: "`PUT /__test/clock` takes an RFC 3339 date-time with a time part ... a date alone or any other text is a 400" (`api-specification.md:172`); v30 note "takes an RFC 3339 date-time only" (`api-specification.md:15`).
- Why it matters: A-06 was "accepts non-RFC 3339 text"; two ways remain, and `FaultAndEdgeTests.cs:154-170` has no row for either.
- Suggested fix: Use `\z` instead of `$` and `[0-9]` (or `RegexOptions.ECMAScript`) instead of `\d`; add both inputs to the test table.

### R2-A-06 (Blocker, A2): A signed `year` or `page` is accepted at the edge and then silently replaced by a default
- Where: `CreditDashboard.Api/Edge/ContractModel.cs:205` against `Routes/Report.cs:88`, `Routes/Accounts.cs:138`, `Routes/ReportData.cs:140`
- Code or check text: edge `NumberStyles.AllowLeadingSign`; handlers `int.TryParse(..., NumberStyles.None, ...) ? y : today.Year` and `BigInteger.TryParse(..., NumberStyles.None, ...) ? ... : fallback`. Live (clock 2026): `?year=%2B2025` gives 200 with `selectedYear` 2026; `?year=%2B2018` (outside the window) gives 200 with `selectedYear` 2026, on both payment-history operations.
- Specification or contract text: "the year window of the payment-history operations (400)" (`api-specification.md:243`); `year` "minimum: 2000, maximum: 2100" (`openapi.yaml:1132`).
- Why it matters: The A-07 fix checks the window, but a parameter spelt with a sign skips it and returns the wrong year with 200. `?page=%2B2` likewise returns page 1.
- Suggested fix: Make the edge and the handlers parse the same way (reject a leading `+` at the edge, or accept it in the handlers), and have the handlers fail loudly, not default, when parsing fails.

### R2-A-07 (Blocker, A1/A2): `missed[]` still lists missed months after the current month
- Where: `CreditDashboard.Api/Routes/ReportData.cs:106-112` (`MissedIn`), used at `Report.cs:105` and `Accounts.cs:151`
- Code or check text: `.Where(m => m.StartsWith($"{year:D4}-", StringComparison.Ordinal))` (no comparison with the current month). Live: clock 2026-01-15, `struggling`: year 2026 status `on-time`, but `missed` holds 2026-06, 2026-08 and 2026-09; `payments.onReport` correctly excludes them.
- Specification or contract text: "a month after the current month on the controlled clock is `no-data`, whatever `missedMonths` holds, so a future month is never `missed`" (`api-specification.md:115`); "one `{ accountId, provider, month }` for each missed account-month in that year" (`operations-cases.md:120`).
- Why it matters: The A-17 fix moved the year status and `onReport`, but the list a UI shows next to them still names future months as missed, so the three disagree.
- Suggested fix: Filter `MissedIn` with the current month (pass `current`), and add a case for a clock before the persona's missed months.

### R2-A-08 (Blocker, A1): A closed account reports balance 0 but the utilisation of its stored balance
- Where: `CreditDashboard.Api/Routes/Accounts.cs:53-54` and `:121`
- Code or check text: `var balance = ReportData.IsOpen(a) ? ReportData.Balance(a) : ClosedAccounts.ReportedBalanceMinor(ReportData.Balance(a)); var utilisation = Defects.Utilisation(ReportData.Balance(a), ReportData.Limit(a));` Live (drilldown, `acc_ddcl01`): `"balance":{"amountMinor":0}`, `"limit":{"amountMinor":250000}`, `"utilisation":5`, `"utilisationRaw":5`, `"includedInTotals":true`.
- Specification or contract text: "Utilisation = balance / limit × 100" (`api-specification.md:227`, BR-03); "Closed accounts report balance 0" (`api-specification.md:237`, BR-13); v32: "the service reports 0 whatever is stored" (`api-specification.md:13`).
- Why it matters: F5 made the stored closed balance non-zero and gave the closed card a limit, which exposed a response where balance 0 over a limit of 2,500.00 shows 5%. The rule text is silent on closed-account utilisation, so either the spec or the code must say which balance it uses.
- Suggested fix: Compute utilisation from the reported balance for closed accounts (0, so 0 and 0), or state in BR-13 that utilisation follows the stored balance; add a service test for the closed list.

### R2-A-09 (Blocker, A5): No test notices the fault handler being unregistered
- Where: `CreditDashboard.Api.Tests/FaultAndEdgeTests.cs:44-62` (own pipeline, line 53) against `CreditDashboard.Api/Program.cs:27`
- Code or check text: `app.UseMiddleware<FaultHandler>(); app.Run(_ => throw new InvalidOperationException("secret-detail-from-the-fault"));` Probe P1: `Program.cs:27` removed, 387 of 387 pass.
- Specification or contract text: "An unhandled fault is the 500 Problem with a fixed detail and no trace, in every environment (A-01, A-02)" (`api-specification.md:15`).
- Why it matters: The test proves the class works, not that the service uses it; reverting the A-01 fix would be silent. (The existing dup-property test cannot catch it either: that case is a 400, not a fault.)
- Suggested fix: Add a test through `WebApplicationFactory<Program>` that triggers a real fault (for example R2-A-01's input once that is a fault, or a test-only endpoint) in Development and Production.

### R2-A-10 (Blocker, A5): The account half of the A-07 test cannot fail
- Where: `CreditDashboard.Api.Tests/FaultAndEdgeTests.cs:175`
- Code or check text: `host.Send(HttpMethod.Get, "/accounts/acc_nope/payment-history?year=2018", token: token)` expecting 400.
- Specification or contract text: "`AccountId: ... pattern: '^acc_[a-z0-9]{5,}$'`" (`openapi.yaml:1131`); "the request's own values ... (400); the target and its owner (404)" (`api-specification.md:243`).
- Why it matters: `acc_nope` has four characters after the underscore, so the edge answers 400 on the pattern before any handler runs. Probe P6b (year check moved after the owner lookup) passes all 387 tests. The same weakness does not touch the report half, which uses a well-formed bureau ID.
- Suggested fix: Use a well-formed unknown ID such as `acc_nope00` (that is what `AccountTests.cs` uses).

### R2-A-11 (Change, A3): The clock accepts instants the service cannot work with afterwards
- Where: `CreditDashboard.Api/Control/Rfc3339.cs:20`; `Control/Authentication.cs:39`
- Code or check text: `clock.UtcNow + options.TokenLifetime`. Live: `{"now":"9999-12-31T23:59:59Z"}` gives 204, then `POST /auth/login` gives 500. With `0001-01-01T00:00:00Z` the payment-history window is `-5 ... 1` and score history includes month `0000-02`.
- Specification or contract text: "`PUT /__test/clock` takes an RFC 3339 date-time" (`api-specification.md:172`); `schemathesis.toml` comment: "RFC 3339 allows instants ... that a .NET clock cannot hold, so the service answers 400".
- Why it matters: The 400 only covers instants .NET refuses to parse; the extremes are accepted and break later calls (and the login of the next scenario).
- Suggested fix: Refuse instants outside a usable range (for example years 1990 to 2100) with 400.

### R2-A-12 (Note, A2): Numbers in the PATCH details response are echoed as sent
- Where: `CreditDashboard.Api/Routes/Accounts.cs:170-171`
- Code or check text: Live: `{"field":"apr","value":-0}` returns `"apr":-0`; `promoPeriodMonths: 6e1` returns `6e1`; `amountMinor: 1e20` is accepted and returned as `1e20`.
- Specification or contract text: "`amountMinor: { type: integer }`" (`openapi.yaml:1300`); BR-14 "`amountMinor` ≥ 0".
- Why it matters: Valid JSON integers, but a client typed as int64 cannot read `1e20`; nothing bounds the amount.
- Suggested fix: Store the parsed decimal, not the literal, and bound `amountMinor` to int64.

### R2-A-13 (Change, A6): Schemathesis exemptions are wider than their reasons
- Where: `schemathesis.toml:54-56`; `tools/schemathesis-run.mjs:81` and `:102`
- Code or check text: `[operations.checks.response_schema_conformance] enabled = false` for the whole `PATCH /me/profile/preferred-name`; `--exclude-operation-id testSetLatency ... testSetBugs`.
- Specification or contract text: "Every response object is closed (`additionalProperties: false`): a property its schema does not list is a defect, so a leaked field fails the validator, Schemathesis and the harness" (`api-specification.md:16`).
- Why it matters: Probe S2: a leaked property in that one response passes Schemathesis (the service tests do catch it). The latency control, which has R2-A-02, is never fuzzed. Also, with stdout redirected on Windows the run crashed with "LookupError: unknown encoding: utf-8:surrogateescape" until `PYTHONIOENCODING=utf-8` was set (`PYTHONUTF8: '1'` at `schemathesis-run.mjs:81`); "4 operations mostly rejected generated data" is printed on every run.
- Suggested fix: Replace the blanket disable by a custom check for the `\p{L}` pattern only; fuzz `testSetLatency` with a fixed seed against a service that is reset afterwards; set `PYTHONIOENCODING` in the runner.

### R2-A-14 (Change, A5): `ContractCoverageTests` and `OperationResponseTests` validate one persona only
- Where: `CreditDashboard.Api.Tests/OperationResponseTests.cs:14-53`
- Code or check text: one sample per operation, all with `alex` bound to `excellent` (one `struggling` bind for resend).
- Specification or contract text: "Every response object is closed" (`api-specification.md:16`).
- Why it matters: My own sweep of 354 responses over six personas found no leak, so nothing is wrong today, but the service tests would not notice a leak that only shows for another persona (for example a pass-through block in a persona fixture).
- Suggested fix: Add a loop over the personas for the read operations.

### R2-A-15 (Note, A3): Path parameters are decoded twice at the edge
- Where: `CreditDashboard.Api/Edge/ContractModel.cs:36`
- Code or check text: `values[template[1..^1]] = Uri.UnescapeDataString(pathSegments[i]);` on a path Kestrel has already decoded. Live: `/accounts/acc_%2561bcde` is validated as `acc_abcde` (passes the pattern) while the handler looks up `acc_%61bcde` and answers 404.
- Specification or contract text: "a path parameter ... breaks its schema: 400" (`ContractValidation.cs:11`).
- Why it matters: Validation and the handler see different strings; only a 404 differs today.
- Suggested fix: Do not unescape again.

### R2-A-16 (Note, A5): The added mask-pattern assertion is redundant
- Where: `CreditDashboard.BusinessRules.Tests/ReportTests.cs:35`
- Code or check text: `Assert.That(Masking.Mask(source), Does.Match(@"^\*[A-Z0-9]{4}$"));`
- Specification or contract text: "`^\*[A-Z0-9]{4}$`" (`api-specification.md:233`, BR-09).
- Why it matters: Every expected value in the table already matches the pattern, so the second assertion cannot fail unless the first does (R10 failed through the table alone). Harmless.
- Suggested fix: Test the pattern over generated sources instead.

### R2-A-17 (Note, A4): Two small effects of the flags
- Where: `CreditDashboard.Api/Control/Defects.cs:55`; `Routes/ReportData.cs:69-71`
- Code or check text: `obj["amountMinor"] = JsonValue.Create(minor / 100.0)` writes a whole-pound amount as an integer (live: 18500000 pence becomes `185000`, no decimal point); with `excluded-in-total` `includedCount` and the excluded list still use the stored flag while the balance includes the loan.
- Specification or contract text: "Every money amount in a response is a float of pounds (42.36 for 4236 pence)" (`api-specification.md:314`); "excluded loans are added to the type totals" (`api-specification.md:308`).
- Why it matters: The schema type check catches `currency-float` only where an amount has pence; the harness catcher works because its sample is 49.50. The totals response is internally inconsistent under the other flag. Both are inside a deliberate defect.
- Suggested fix: Document both in section 10.

## Not done
- `npm run verify` as a whole and the other checks outside area A (`check:harness`, `check:ui*`, `check:client`, `check:mock`, `check:kanban`, `check:bug-flags`, the fixtures check): not run, they are other areas or need the network. The registry's `failsWith` texts were read, not executed.
- A-27 (the misnamed test) could not be identified from the finding's text; A-19's exact list of gaps is not given, so I judged it by the gaps I found.
- No Linux/CI run; Schemathesis ran only with `PYTHONIOENCODING=utf-8` set (first attempt, stdout redirected, crashed in Schemathesis's own header code).
- HTTP/2, large-body and TLS behaviour not tried. Lock behaviour of the profile operations was tested by bursts only, not by a model check.
- The copy was made with `tar` and failed on one symlink under `demo-apps/demoapp001-react-ui/node_modules` (irrelevant to area A). The copy contains a `.review/` folder; I did not open it.

## Method
Copied the repository (without `.git`) to the scratch `copy_A` and mapped it to a short drive letter (`subst Q:`) because the scratch path made the test host path longer than Windows allows. Read all of `CreditDashboard.Api/` (Program, Control, Edge, Routes), `CreditDashboard.BusinessRules/`, the tests named in the brief, `tools/generate-service-contract.mjs`, `tools/schemathesis-run.mjs`, `schemathesis.toml`, `api-specification.md` (v32), `business-rules-cases.md`, `profile-rules-cases.md`, the relevant parts of `operations-cases.md`, `ui-feature-profile.md` and `openapi.yaml`, and `fixtures/bug-flags.json`. Ran the 626 tests (239 + 387; 113 s the first time, 44 s later), `check:service-contract` (8 s) and `check:schemathesis` (67 s). Ran three live instances on my ports 4740 to 4742 (Production with test control, test control off with the UI folder, Development) and drove them with `curl` and small Node scripts: gate spellings, hosted UI, correlation id, clock inputs, fault inputs, parallel bursts for PR-09 and PR-11, per-persona response validation against the closed contract with Ajv (354 responses), clock extremes and overrides. Wrote about 40 mutation probes in the copy with a script that changes one line, builds, runs the filtered tests and restores the file (and touches it, because the first two reruns used a stale build and were discarded); confirmed afterwards that all source files in the copy equal the originals and the full suite passes again. All my processes were stopped and the `subst` mapping removed.
````

### 3.2 Report of reviewer B

The text below is exactly what the reviewer returned (the harness indented every line of it when handing it back; the indent is removed). Its headings are left as written so that its words are unchanged.

````markdown
# CDS-38 confirmation pass, area B: report

## Summary
Area B is in good shape. Of the 20 findings, 15 are Fixed and 5 are Partly fixed (B-02, B-08, B-10, B-18, B-20). None is Not fixed, and none Fixed-but-broke-something. B-21, B-23 and B-26 are also Fixed. Every fix was put back in a copy, or the code was mutated, and each notice-on-return check I tried fired except where listed below. The remaining weaknesses are guards that were not built:

- Reintroducing a loose `failsWith` goes unnoticed.
- Only one response schema has a closed-ness test.
- The closed-account fixtures can be sanitised without any check noticing.
- PR-08 still ignores three profile values.
- The SIGTERM handler cannot run while the runner is blocked in `spawnSync`.

New findings: 0 Blocker, 11 Change, 9 Note. One of them, R2-B-06, is an inconsistency in the service's own response that the F5 fixture change exposed.

## Fix verdicts
| Finding | Verdict | Evidence (file:line, and the probe if any) |
|---|---|---|
| B-01 content type never checked | Fixed | `src/contract/validate.ts:111-113` refuses an undocumented or missing content type. Probe P1: check switched off, 2 unit tests fail (`validate.test.ts:32-41`). The live flag `problem-json-missing` is "fails as stated" in the baseline proof (`bug-flags.json:81`). |
| B-02 `failsWith: "must be integer"` too loose | Partly fixed | The registry text is now `at '/balance/amountMinor': must be integer` (`fixtures/bug-flags.json:113`), and `verdict.test.ts:7-13` covers the logic. Probe F1: with `currency-float` made to float `utilisation`, the proof says `caught-for-another-reason`. But putting the loose text back leaves `schema-check` at 659 checks, 0 failures, and the proof says "fails as stated". Nothing guards the data, so a revert is invisible (R2-B-03). |
| B-03 `failsWith` text in every run | Fixed | Three layers. (a) `schema-check.mjs:206-207` refuses text the feature file holds (probes F2b, F2c fail with the stated message). (b) `verdict.ts:343-348` `judgeOff`: probe F2, `failsWith` = "Execution successful" gives `off: FAILS (or prints the failure text)` and `false-alarm`, exit 1. (c) the unit test `verdict.test.ts:20-24`. Residual: a step text that exists only after Examples expansion (probe F2d, "the total utilisation is 50%") is accepted by the static check; only layer (b) catches it. |
| B-04 UI debt-by-type `includes` | Fixed | `report-pages.steps.ts:397-399` uses `equals(poundsNoPence(...))`. Probe U1: UI shows an extra digit, 5 of 6 debt scenarios fail ("Expected £424, Received £4240"). Probe U1b: the step put back to `includes` with the same UI fault passes 6 of 6. The fix lives in the step alone. |
| B-05 legal name and date of birth | Fixed | `profile.steps.ts:258-264` compares against `users.json` (`legalName`, `longDate(dateOfBirth)`). Probe U2: UI shows 13 March 1985, scenario fails ("Expected 12 March 1985"). |
| B-06 flag-off run not shown to be off | Fixed | `ControlTheTestEnvironment.ts:34-41` sets `[]` and compares with `GET /__test/state`; called from `api/hooks.ts:29` and `ui/hooks.ts:51`. Probe M4: service whose reset and empty set leave a flag on gives the next flag's off run FAILS, `false-alarm`, exit 1. Only the flags are checked (R2-B-07). |
| B-07 "something ran" for failed-as-stated | Fixed | `verdict.ts:351-355` returns `did-not-run` before looking at text. Unit test `verdict.test.ts:26-30`. Probe F3 (name matches nothing): `DID NOT RUN`, `false-alarm`, and `schema-check` also fails ("scenario ... not found"). Hypothetical residual in R2-B-17. |
| B-08 timeouts and SIGTERM | Partly fixed | Timeouts are real: `prove-flags.ts:37,52,60`; probe F4 (`CDS_PROOF_TIMEOUT_MS=5000`) gives `TIMED OUT` on both runs, `false-alarm`, no orphaned Playwright Chromium left. SIGTERM: `run.mjs:94-97` registers a handler, but the Cucumber run is a `spawnSync` (`run.mjs:133`) that blocks the event loop, so a handler cannot run until the child ends. Not demonstrable here (Windows); design §30 concedes it is unexercised. The `exit` handler (`run.mjs:88`) covers the normal end. No limit for `api`/`ui`/`exit` runs (R2-B-08). |
| B-09 `Retry-After` never checked | Fixed | `validate.ts:118,143-158`. Probe P2: check off, the B-09 unit test fails ("Missing expected exception"). Real 429 passes in the 59-scenario run. |
| B-10 open response schemas | Partly fixed | 130 documented responses, 47 object schemas reachable; only `Problem`, `Problem.errors[]` and `testGetState_200.latency` are open (my script). End to end: probe L1 adds `fullNumber` to the closed-accounts list, the two scenarios that return rows break with "does not match the contract at '/0': must NOT have additional properties". Regression guard exists for `AccountSummary` only: probe P4b fails 1 test, probes P4a (`Account`) and P4c (`Money`) leave 20 of 20 passing (R2-B-02). |
| B-11 Problem status and `stack` | Fixed | `validate.ts:26,119-126`. Probes P3 and P3b: each check switched off fails its unit test. |
| B-12 Ajv strict and headers | Fixed | `validate.ts:72-73,78-80`. Probe P4d: keyword typo `additionalPropertes` in `Money` makes `validate.test.ts` fail to load (contract refused at load). Headers: probe P2. |
| B-13 After hook | Fixed | Attachment: probe d1 (`HARNESS_BUGS=idor`) writes the diagnostics attachment to `reports/api.ndjson`. Reset against the main instance: probe P13 removes `diagnostics.ts:33`, the "off" scenario breaks ("reset answered 404, expected 204"). Removing the reset altogether (P13b) leaves 2 of 2 green: the After reset is not observable in-suite (adjacent to deferred B-22). |
| B-14 totals cannot tell open from closed | Fixed | Probe M2: `Totals.ForType` counting closed accounts, "Type totals sum the open accounts" fails (`50260 !== 37960`). Probe M2b: debt counting closed, "Only money owed on included accounts counts as debt" fails. Depends on unguarded fixture data (R2-B-04). |
| B-15 closed account nothing owing | Fixed | Probe M1: service reporting the stored balance fails API ("7800 !== 0") and UI ("Expected £0.00"). Probe V1: with stored balances set to 0 in the fixture and the sample, the same wrong service passes 4 of 4 and `schema-check` passes (R2-B-04). |
| B-16 the credit card is listed | Fixed | `assert.steps.ts:79-95` looks for `thatAccount`. Probe M3: closed list returns `x_`+id, the two "listed" rows fail ("acc_stcl01 is not in the list"); "not listed" rows pass, as expected. |
| B-17 legal name compared with itself | Fixed | `profile.steps.ts:258-264,285-295` read `users.json`; probe U2. |
| B-18 PR-08 three values | Partly fixed | Title, path, query, hash for 8 value kinds (`profile.steps.ts:321-335`); probes U3 (postcode in title) and U3b (email in query) fail. Probe U3c: `address.line1`, `employment.status` and `memberSince` placed in both title and query, all 12 profile scenarios pass, exit 0 (R2-B-05). |
| B-19 interest rate `includes` | Fixed | `account.steps.ts:150-152` uses `equals` on `detail-tile-interest-rate-value`. Probe U4: UI shows "129.9%", scenario fails. |
| B-20 design describes missing things | Partly fixed | Residuals: `harness-design.md:52` (`request(... headers, as)`; real `CallOptions` has only path, query, body at `CallAnApi.ts:5-9`), `:63` (`verifyEmail`, `state()` do not exist), `:80` (After attaches "the request ... and the service log tail"; code attaches last response, personas, flags), `:106` (`keepToken` "so the act uses it"; it is never read), `:140,179` (coverage check, none exists). See R2-B-11. |
| B-21 (Note) missing body TypeError | Fixed | Unit test `validate.test.ts:69-75`; by reading, `validate.ts:133-139` reports the operation and status. |
| B-23 (Note) parallel runs | Fixed | `common-hooks.ts:12`, `parallel.ts:5`. Probe: `cucumber --parallel 2` fails both workers' BeforeAll with the stated message in the report, 0 test cases run, exit 1. Directly invoked, nothing prints on the console; `run.mjs:139-152` prints it. |
| B-26 (Note) component test by substring | Fixed | `schema-check.mjs:208-212`. Probe F5: name only in a comment is refused. Probe F5b: `it.skip(` with the exact name is accepted statically, caught at run time as `did-not-run` (R2-B-19). |

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| B1 steps vs scenarios | 174 step definitions (API 81, UI 117 incl. the 24 shared arrange steps; Given 59, When 48, Then 67 by keyword), 272 step lines in 23 files, 73 scenarios (15 outlines), 114 executions (59 API, 55 UI). Dry run `--strict` on both profiles: no undefined or ambiguous step. 21 definitions unused in their profile (2 in API, 19 in UI because the whole arrange file is shared). 16 traced end to end, with what would make each pass wrongly: **API** (1) "A closed account reports nothing owing": passes wrongly only if the fixture's stored balance is 0 (V1). (2) "Type totals sum the open accounts": 379.60 and 6100.00 both move if the closed Lender Y card is counted (M2). (3) "Another customer's account cannot be found/changed": would pass if both accounts 404 for another reason, but `idor` proof shows "200 !== 404". (4) "The full account number is never returned": searches response bodies only, so a leak in a header would pass. (5) "Changes that arrive out of order": expectation is from the feature text, robust to reverse or ascending sort. (6) "A verification link cannot be resent within a minute": checks 429 then 202. (7) "Each year has one status": four rows distinguish a constant answer. (8) "A third wrong code voids the code": the third response and a fourth call both 422 `code-invalid`. **UI** (9) "Total debt and its trend": pounds exact (`£198,280`) and trend `Down`. (10) "Debt is broken down by account type": exact (U1). (11) "Legal details cannot be changed here": values exact (U2); "neither can be edited" only looks for input, textarea, contenteditable in `profile-identity`, so an edit button opening a modal passes. (12) PR-08: title is static (no `document.title` anywhere in `src/` except the test), so the title half passes trivially today; the address half is real (U3b); coverage gap U3c. (13) "Alex records an interest rate of 29.9%": exact (U4); a UI that shows the typed value without saving would pass. (14) "A card in credit says so": `£44.00 in credit` exact. (15) "Closed accounts ... balance of zero": exact (M1 UI). (16) "The return link cannot leave the site": passes also if the app ignored `redirectUrl` altogether (R2-B-18). Same-source comparisons: only "the list total matches the overview total" (page against page, a relation test) and "every change listed is positive" (the UI's own `data-sentiment`, anchored by the count 2). | R2-B-05, R2-B-12, R2-B-18, R2-B-20 |
| B2 isolation | Before in both hooks (reset, flags set and read back), After in both (diagnostics on failure, reset of the main instance), tokens (cleared at `reset`, `bind`, `setClock`), `keepToken` (1 add, 0 reads), parallel guard (probe), 3 baseUrl paths (default, off instance, After restore). Probes M4, M5, P13, P13b. Reset in `PersonaStore.cs` clears bindings, flags, latency, sessions, clock. | R2-B-07, R2-B-14, R2-B-15 |
| B3 contract validation | 130 responses, 36 operations, all compiled at load; 7 refusals each probed (content type, non-JSON, header, Problem status, forbidden fields, closed schema, strict typo); 10 validate unit tests read, 1 cannot fail; 8 verdict tests and 2 parallel tests read, all can fail (verdict logic). Only one documented header exists in the contract (`Retry-After`, `openapi.yaml:1259`). | R2-B-01, R2-B-02, R2-B-13 |
| B4 flag proof and registry | 30 flags (8 implemented, 22 pending), 9 catchers, `verdict.ts` 3 functions, `schema-check.mjs` lines 183-218, `prove-flags.ts` 106 lines, `run.mjs` 160 lines. 12 probes on this check (F1 ×2, F2, F2b-d, F3, F4, F5, F5b, M4). Baseline `check:bug-flags`: 8 of 8 implemented flags caught for the stated reason, 22 pending. | R2-B-03, R2-B-08, R2-B-09, R2-B-17, R2-B-19 |
| B5 fixtures | 7 personas, 2 users, 12 override samples, 659 checks, 0 failures. Closed accounts: `acc_ddcl01` (12300/250000), `acc_stcl01` (7800/150000), `acc_ovcl01` (4500/100000). `schema-check` has independent helpers (`roundHalfUpPercent`, `maskOf`, `sixYearsAfter`, `addMonths`, lines 35-49), checks BR-02, 03, 05, 06, 08, 09, 11, 12, 13, 15. Drilldown debt total hand-summed from the fixture: 198279.60, agrees with the features. | R2-B-04, R2-B-06 |
| B6 shared store and generated contract | 23 feature files, 73 scenarios; 174 step definitions against the 177 glossary patterns I extracted: every definition has a glossary row and every glossary pattern has a definition (one fragment, "with spaces either side", is an option). Tags: BR-01 to BR-15 and PR-01 to PR-11 minus PR-05 (stretch) all exist in the specifications. Every feature file is reachable (api paths glob + 2 security; ui paths list all 10 ui files + open-redirect). `check:client` pass (types current, 2909 lines, 8 s). `check:service-contract` pass (1940 lines of C#, 4 s). `check:mock` pass (36 of 36 operations, 6 s). `check:kanban` pass (45 tickets, 2 s). | R2-B-10, R2-B-11, R2-B-16 |

## Probes
Timings: `npm run test:unit` in the harness 4.4 s wall (20 tests, 20 pass). `check:harness` 48 s (unit tests, dotnet build, 59 scenarios, all pass, Cucumber real time 8.3 s). `check:ui-scenarios` 183 s (UI test build, 55 scenarios, all pass, Cucumber 1 m 47 s). `check:bug-flags` once, 245 s: 8 of 8 caught for the stated reason, 22 pending, exit 0. `fixtures npm run check` 4 s.

| Probe | What I changed (in the copy) | What I expected | What happened |
|---|---|---|---|
| P1 | `validate.ts:111` content-type test replaced with `if (false)` | unit test fails | 2 fail (B-01 tests), pass 18 |
| P2 | `checkHeaders(...)` call commented out | B-09 test fails | fails, "Missing expected exception" |
| P3 | Problem status comparison `if (false)` | B-11 test fails | 1 fails |
| P3b | forbidden-fields `if (false)` | stack test fails | 1 fails |
| P3c | non-JSON body check `if (false)` | "not JSON" test fails | all 20 pass (R2-B-01) |
| P4a/b/c | `additionalProperties: false` removed from `Account`, `AccountSummary`, `Money` | closed-ness test fails | only `AccountSummary` fails 1 test; `Account` and `Money` 20 of 20 pass (R2-B-02) |
| P4d | `additionalPropertes` typo in `Money` | strict mode refuses at load | `validate.test.ts` fails to load |
| M1 | `ReportedBalanceMinor` returns stored balance | API and UI closed scenarios fail | API 1 of 4 fails ("7800 !== 0"); UI drilldown 1 of 6 fails |
| M2 / M2b | `Totals.ForType` counts closed; `Debt` counts closed | account-totals and debt scenarios fail | 1 of 8 and 1 of 10 fail |
| M3 | closed rows' ids prefixed `x_` | "credit card is listed" fails | 2 of 4 fail, 2 pass vacuously (not-listed rows) |
| M4 | reset keeps flags, empty `SetFlags` ignored; proof of 2 flags | next off run fails, `false-alarm` | `rounding-down: false-alarm`, off FAILS |
| M5 | reset no longer releases the clock; full API run | some scenario fails | 59 of 59 pass (R2-B-07) |
| F1 strict | `currency-float` floats `utilisation` instead of money | `caught-for-another-reason` | as expected, exit 1 |
| F1 loose | registry text back to "must be integer" | proof should refuse | "fails as stated", `schema-check` passes (R2-B-03) |
| F2 | `failsWith` = "Execution successful" | `false-alarm` | `false-alarm`, off FAILS |
| F2b/c/d | `failsWith` = scenario name, step text, expanded step text | `schema-check` refuses | b, c refused; d accepted (R2-B-19) |
| F3 | catcher name "...half upp" | `did-not-run`, registry refuses | both |
| F4 | `CDS_PROOF_TIMEOUT_MS=5000`, flag `plural` | `TIMED OUT` | as expected; no orphaned Chromium |
| F5/F5b | component test name only in a comment; `it.skip` with the name | registry refuses | comment refused; `it.skip` accepted (runtime backs it) |
| U1 / U1b | UI debt amount gets an extra digit; step back to `includes` | fixed step fails; reverted step passes | 5 of 6 fail; 6 of 6 pass |
| U2 | UI date of birth +1 day | profile scenario fails | 1 of 12 fails |
| U3 / U3b / U3c | postcode in title; email in query; address line, employment, member since in title and query | first two fail, third should | first two fail; U3c passes 12 of 12 (R2-B-05) |
| U4 | rate tile "1" + value | scenario fails | 1 of 2 fails |
| V1 | stored closed balances zeroed in `struggling.json` and the sample, plus M1 | closed scenarios fail, or the fixture check refuses | 4 of 4 pass, `schema-check` 0 failures (R2-B-04) |
| L1 | `fullNumber` added to closed list | validator refuses | refuses, 2 broken |
| P13 / P13b | After's `baseUrl` restore removed; After's reset removed | first fails, second may not | first breaks the scenario; second 2 of 2 pass |
| Parallel | `cucumber --parallel 2` | refused | BeforeAll fails in both workers, 0 cases run, exit 1 |
| Live | service on 4752, `struggling`, GET closed accounts | balance 0 | `balance 0, limit 150000, utilisation 5` (R2-B-06) |

## New findings
### R2-B-01 (Change, B3): the non-JSON body test cannot fail
- Where: `test-harnesses/harness-serenity/src/contract/validate.test.ts:77-79`.
- Code or check text: `assert.throws(() => contract.validate('getAccount', problemResponse(404, {}, { text: 'Not found', body: undefined })), /not JSON|does not match/);`
- Specification or contract text: "Each check was shown to fail its test when switched off." (`DOCS/.design/harness-design.md:306`)
- Why it matters: probe P3c switches `validate.ts:114` off and all 20 tests still pass, because the schema check refuses the missing body with "does not match". The check has no test of its own.
- Suggested fix: assert the message `not JSON` only, and use a content-typed body that would otherwise match its schema.

### R2-B-02 (Change, B3): closed-ness of response schemas is guarded for one schema
- Where: `validate.test.ts:56-59` is the only test of the closed rule; no check lists the open schemas.
- Code or check text: the test sends `fullNumber` to `listAccounts` (schema `AccountSummary`, `openapi.yaml:1573-1575`).
- Specification or contract text: "A response object is closed: a property its schema does not list is a defect (`additionalProperties: false`)." (`DOCS/.architecture/openapi.yaml:21`)
- Why it matters: probes P4a and P4c reopen `Account` and `Money` with 20 of 20 tests passing. The generation drift checks only force a regeneration. 44 of 47 object schemas have no regression guard.
- Suggested fix: add a unit test that walks every response schema and requires `additionalProperties: false` except an explicit allow list (`Problem`, `Problem.errors[]`, `testGetState_200.latency`).

### R2-B-03 (Change, B4): the B-02 fix is not self-guarding
- Where: `fixtures/schema-check.mjs:199` and `fixtures/bug-flags.json:113`.
- Code or check text: `check(typeof c.failsWith === 'string' && c.failsWith.length > 0 && c.failsWith !== 'TBD', ...)`
- Specification or contract text: "`failsWith` is specific to the flag: `currency-float` records `at '/balance/amountMinor': must be integer`, so a float put into `utilisation` is 'caught for another reason' (B-02)." (`harness-design.md:324`)
- Why it matters: probe F1 loose: with the registry text reverted to "must be integer" the registry check passes and the proof reports the flag caught as stated. No negative control exists.
- Suggested fix: require `failsWith` of a flag to be unique across the registry and to contain a location (a JSON pointer or a value), or keep a negative-control catcher that a different defect must trip.

### R2-B-04 (Change, B5): fixtures that make B-14 and B-15 fail are unguarded
- Where: `fixtures/schema-check.mjs:90-93` and the sample `fixtures/overrides/br13-closed-anniversary.json`.
- Code or check text: `if (a.closed) { check(a.status === 'closed' && a.closedDate, ...); if (personaOnly) check(asAtDate < sixYearsAfter(a.closedDate), ...)`
- Specification or contract text: "a closed account's stored balance is source data and may be non-zero ... so that counting a closed account in the open-account totals (BR-04) changes a figure (B-14)." (`DOCS/.design/api-specification.md:13`)
- Why it matters: probe V1 sets the stored closed balances to 0; schema-check still reports 659 checks, 0 failures, and a service reporting the stored balance passes all 4 closed-account scenarios.
- Suggested fix: require, in schema-check, that each closed account used by a BR-13 or BR-04 scenario has a non-zero stored balance and a non-zero limit.

### R2-B-05 (Change, B1): PR-08 still ignores three profile values
- Where: `src/ui/steps/profile.steps.ts:321-335` (`secretsOf`).
- Code or check text: `const values = [ user.legalName, user.legalName.split(' ')[0], profile.preferredName, longDate(user.dateOfBirth), user.dateOfBirth, user.email, profile.address?.postcode, profile.mobile?.lastDigits ];` with the comment "'Profile data' is every personal value the fixtures hold for the user".
- Specification or contract text: "Profile data never appears in URLs, page titles or client-side logs." (`DOCS/.design/ui-feature-profile.md:142`); "the PR-08 check covers every personal value the fixtures hold" (`harness-design.md:316`)
- Why it matters: probe U3c puts `address.line1`, `employment.status` and `memberSince` into the title and the query string and all 12 profile scenarios pass. By strict reading of the severity wording this is a check that passes when it should fail; I keep it at Change because B-18 was accepted at that level.
- Suggested fix: add the address line, employment status and member-since date to `secretsOf` and drop the "every" claim, or derive the list from the `Profile` schema.

### R2-B-06 (Change, B5): a closed account is returned with balance 0 and utilisation 5
- Where: `demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Routes/Accounts.cs:53-54`.
- Code or check text: `var balance = ReportData.IsOpen(a) ? ReportData.Balance(a) : ClosedAccounts.ReportedBalanceMinor(ReportData.Balance(a)); var utilisation = Defects.Utilisation(ReportData.Balance(a), ReportData.Limit(a));`
- Specification or contract text: "Utilisation = balance / limit × 100, rounded half up" (`api-specification.md:227`); "Closed accounts report balance 0" (`api-specification.md:237`)
- Why it matters: the F5 fixtures now give closed accounts a limit, so the live response for `acc_stcl01` is `balance 0, limit 150000, utilisation 5`, which BR-03 cannot produce from the reported balance. The UI hides it (`ClosedAccountsPage.tsx` `showUtilisation={false}`); no scenario looks.
- Suggested fix: derive utilisation from the reported balance for a closed account, or state in BR-13 that utilisation is not reported for one; add a step that checks it.

### R2-B-07 (Change, B2): the Before check covers flags only
- Where: `ControlTheTestEnvironment.ts:34-41`.
- Code or check text: `const held = [...((state.body as { flags?: string[] }).flags ?? [])].sort();` and the comparison of `held` with `wanted`.
- Specification or contract text: "Every scenario's `Before` sets the flags (an empty list too) and reads `GET /__test/state` to check the service holds exactly what the run asked for (B-06)." (`harness-design.md:327`) and "the clock follows real time again (`now: null`) until a step freezes it" (`harness-design.md:75`)
- Why it matters: the same response carries `now`, `personas`, `overridden`, `latency`. Probe M5 (reset leaves the clock frozen) passes 59 of 59. This is adjacent to the deferred B-22 and I do not reopen it; the point is that the read-back that B-06 added could assert the rest for free.
- Suggested fix: assert `now === null`, the default personas and empty `latency` in `arrangeFlags`.

### R2-B-08 (Change, B4): SIGTERM handler cannot run during the run; no limit on ordinary runs
- Where: `scripts/run.mjs:94-97` and `:133`.
- Code or check text: `process.on('SIGTERM', () => { stop(); process.exit(143); });` registered, then `spawnSync(process.execPath, command, { ... })` for the whole Cucumber, exit or flags run.
- Specification or contract text: "`run.mjs` handles SIGTERM like SIGINT and stops both services (B-08; the signal path is not exercised on Windows)." (`harness-design.md:328`)
- Why it matters: `spawnSync` blocks the event loop, so a signal handler runs only after the child ends, and a registered handler removes the default immediate termination. Not demonstrated (Windows; an MSYS `kill -INT` experiment had no effect on either side, so it proves nothing). Separately only the proof has a time limit (`prove-flags.ts:37`).
- Suggested fix: run the child asynchronously with `spawn` and forward signals, and give `api`/`ui`/`exit` a limit.

### R2-B-09 (Change, B4): a run that selects nothing exits 0
- Where: `run.mjs:126` and `:138`.
- Code or check text: `f.endsWith('.feature') ? f : `${f}.feature`` resolved under `features-shared/` with no existence check.
- Specification or contract text: "A catcher that runs nothing is not a pass." (`harness-design.md`, section 26)
- Why it matters: `node scripts/run.mjs api closed-accounts` (the folder `api/` omitted) printed `Scenarios: 0` and exited 0 after a full build.
- Suggested fix: fail when the resolved file does not exist, or when the run reports no scenario.

### R2-B-10 (Change, B6): the harness type check is not run by anything
- Where: `test-harnesses/harness-serenity/package.json` script `typecheck`; `.github/workflows/ci.yml`, `tools/verify.mjs`.
- Code or check text: `"typecheck": "tsc -p tsconfig.json --noEmit"`, with the harness run through `tsx`, which strips types.
- Specification or contract text: "Review findings ... fixed in the harness" with the pins "TypeScript 6.0.3" (`harness-design.md:197`)
- Why it matters: the harness code is never type checked in CI or `verify`. It passes today (6 s), so this is a robustness gap only.
- Suggested fix: add `npm run typecheck` to the `api` job or to `verify`.

### R2-B-11 (Change, B6/B-20): the design still claims a coverage check and methods that do not exist
- Where: `DOCS/.design/harness-design.md:140,179` and `:52,63,80,106`.
- Code or check text: "A coverage check in H3 matches each step line ... and fails on a line with none, a line with two (ambiguous), and a definition no line uses."
- Specification or contract text: the code has no such check; `cucumber --dry-run` (my run) lists 2 unused definitions in the API profile (`act.steps.ts:115` `enters the code {code}` is dead; `arrange.steps.ts:110` is used by the UI) and 19 in the UI profile.
- Why it matters: Cucumber's own `strict` run covers "none" and "two"; "unused" is not covered by anything. The other residuals are listed in the B-20 row.
- Suggested fix: delete the claim or add the dry-run with the `usage` formatter to `test:api` and `test:ui`.

### R2-B-12 (Note, B1): the parallel guard's unit test runs inside every Cucumber process
- Where: `cucumber.mjs:7,9` (`src/support/**/*.ts`) includes `src/support/parallel.test.ts`.
- Code or check text: the glob; every Cucumber run (and each parallel worker, three times in my probe) prints "ℹ tests 2 ... pass 2".
- Specification or contract text: "`npm run test:unit` ... `node --import tsx --test src/contract/validate.test.ts src/support/parallel.test.ts ...`" (`package.json` script).
- Why it matters: noise, and a failing unit test would turn up as a Cucumber exit code.
- Suggested fix: keep tests out of the import globs (move to `src/unit/`).

### R2-B-13 (Note, B3): `X-Correlation-Id` is never checked by the harness
- Where: `DOCS/.architecture/openapi.yaml` documents only `Retry-After` (line 1259).
- Code or check text: `checkHeaders` reads only documented headers (`validate.ts:143-158`).
- Specification or contract text: "`X-Correlation-Id` echoed on every response; generated if absent" (`api-specification.md:94`)
- Why it matters: the harness sees every header but checks none the contract does not list; this rule is left to the service tests.
- Suggested fix: document the header on responses in the contract, or assert it in the validator.

### R2-B-14 (Note, B2): diagnostics miss the response the validator refused, and the UI has none
- Where: `CallAnApi.ts:42` sets `last` only after `send` returns; `diagnostics.ts:11`.
- Code or check text: `scenario.state.last = response;` after `await send(...)`.
- Specification or contract text: "attach the request, the response and the service log tail" (`harness-design.md:80`)
- Why it matters: on a validator refusal, and in every UI scenario, the attachment holds no response, no page URL and no log tail.
- Suggested fix: record the response before validating, and add the page URL for UI scenarios.

### R2-B-15 (Note, B2): `keepToken` is dead state
- Where: `world.ts:15`, set at `arrange.steps.ts:181`, cleared at `ControlTheTestEnvironment.ts:15,21,53`, read nowhere.
- Code or check text: `readonly keepToken = new Set<string>();`
- Specification or contract text: "marks the actor `keepToken`, so the act uses it and receives 401" (`harness-design.md:106`)
- Why it matters: the expired token survives only because it stays in `tokens`; the set does nothing.
- Suggested fix: remove it or have `signIn()` read it.

### R2-B-16 (Note, B6): stale comment
- Where: `cucumber.mjs:29-31`: "The list grows with each slice: U1 has the login feature only ... The other UI files ... are not selected." All ten UI files and `open-redirect` are now selected (lines 35-46).
- Suggested fix: update the comment.

### R2-B-17 (Note, B4): `failsWith` is matched against whole output and depends on Node's assertion text
- Where: `verdict.ts:355` (`run.output.includes(failsWith)`); registry values `+ 1368500`, `49 !== 50`, `200 !== 404`.
- Why it matters: the strings are fragments of Node's AssertionError diff format (pinned by `.nvmrc`), and the output of a component test includes code frames; `schema-check` checks scenario catchers against the feature file but never checks a component test's file for its `failsWith`. No wrong credit exists today (`flags.test.tsx` lines 25-26 do not hold "Updates in 1 days").
- Suggested fix: match against the failure message only.

### R2-B-18 (Note, B1): the open-redirect scenario has no positive control
- Where: `features-shared/security/open-redirect.feature:13-24` and `account.steps.ts:167-173`.
- Why it matters: "back on the credit card's own page" is also the outcome of an app that ignores `redirectUrl` completely, so the scenario cannot tell a working guard from no redirect support.
- Suggested fix: add a same-site `redirectUrl` that must be honoured.

### R2-B-19 (Note, B4): static registry guards miss two cases that run time catches
- Where: `schema-check.mjs:207` (feature text), `:211` (declaration pattern allows any modifier).
- Why it matters: probe F2d (text only present after Examples expansion) and probe F5b (`it.skip(` with the exact name) pass the static check; the proof catches both at run time (`false-alarm`, `did-not-run`). `node scripts/run.mjs flags <pending flag>` exits 0 with "0 of 0".
- Suggested fix: refuse modifiers `skip`/`todo`; ignore.

### R2-B-20 (Note, B1): two negative steps are narrower than their sentence
- Where: `profile.steps.ts:142` ("no amounts are shown on the profile" looks only for `£`); `account.steps.ts:112-118` ("sees the balance, payment history and account information" checks the presence of three hooks, not content).
- Suggested fix: ignore, or check content.

## Not done
- `npm run verify` as a whole, `check:service` (dotnet test), `check:schemathesis`, `check:ui` (component tests and public-build guard) and `check:ui-exit`: outside my list or needing network or installs; not run. `tools/check-gherkin.py` needs Python with `gherkin-official`; not run (rule coverage was checked with my own tag listing instead).
- SIGTERM and SIGINT behaviour: no Linux available (the only WSL distro is a stopped docker-desktop one, and no network to pull an image). Reasoned from `spawnSync` semantics, not demonstrated.
- I ran `check:mock` with `MOCK_PORT=4753`, one port above the three I was given; nothing else was on it.
- The generated typed client and C# contract were checked only by their drift checks and by reading the check scripts; I did not diff the generated models against the contract by hand.
- I did not read the exit-check code (`src/exit/exit-checks.ts`, area C) or the service's C# tests.
- Another reviewer shared my scratch folder (`orig/`, `probe.sh`); one early restore copied a stray file into my copy, which I removed, and I confirmed with `diff -rq` that the copy matched the repository after every restore. My own files are under `B_priv/`.

## Method
I copied the repository (without `.git` and `.review`) to `copy_B`, read the Gherkin store, glossary, harness design sections 1-13 and 26-31, the validator, abilities, hooks, steps (API and UI), parameter types, runner, proof and registry, the fixtures and checks. I never touched git or the original, and I checked the copy against the repository with `diff -rq` before the first run and after the last. I ran the checks listed in Probes, with ports 4750, 4751 and 4752. The probes used a small helper that backed up a file, edited it in the copy and restored it. A Cucumber dry run (`--dry-run --strict`, `usage` and `summary` formatters) gave the step counts and unused definitions for both profiles. A short node script listed open schemas reachable from responses. A hand-started service on 4752 gave the live closed-account response. I did not read `.review/`, the briefs, the backlog, plans, logs, walkthroughs, the changelog or the kanban page.
````

### 3.3 Report of reviewer C

The text below is exactly what the reviewer returned (the harness indented every line of it when handing it back; the indent is removed). Its headings are left as written so that its words are unchanged.

````markdown
# CDS-38 confirmation pass, area C: report

## Summary
Most of the fixes hold. Of the 18 listed findings, 14 are Fixed, 4 are Partly fixed (C-03, C-11, C-12, C-20), none are Not fixed, and none are "Fixed, but broke something". Of the 7 Notes, 6 are Fixed, and the fix for C-25 broke something: with the page behind the chat drawer made `inert`, closing the drawer no longer returns focus to `btn-chat`. I confirmed that in Chromium. I added 4 new Blockers, 11 Changes and 3 Notes: R2-C-01, R2-C-02, R2-C-04 and R2-C-13 are Blockers (R2-C-13 is in the service, not the UI); R2-C-03, R2-C-05 to R2-C-12, R2-C-14 and R2-C-15 are Changes; R2-C-16 to R2-C-18 are Notes. I ran 17 probes; the component tests, the exit checks and the guard caught most reintroduced faults. Four did not fail when they should have: the weakened sign-in redirect-back, a flag-gated defect in the public build, a shrunk marker list in the guard's tests, and the cap at 100 as seen by the `@ui` scenarios.

## Fix verdicts
| Finding | Verdict | Evidence (file:line, and the probe if any) |
|---|---|---|
| C-01 open-redirect guard, dot segments | Fixed | `src/safeRedirect.ts:8-19` resolves with `new URL` and requires `^/(?![/\\])`. P1 (the old `startsWith('//')` and `includes('\\')` guard put back): 7 of the `safeRedirect` component tests fail, and 2 of 5 rows of `security/open-redirect.feature` fail. In Chromium, six hostile deep links (P16) all end on the default report or a page on this origin. |
| C-02 bars report 100 | Fixed | `UtilisationBar.tsx:14`. P2 (`aria-valuenow={Math.min(percent,100)}`, `aria-valuemax={100}`): 4 component tests fail. The `@ui` scenario at `account-drilldown.feature:38` reads the text "115%" only, so only the component tests guard the attribute. |
| C-03 late response overwrites | Partly fixed | `useLatest` is used by `useResource` (12 call sites) and by the overview, history chart and payment widget (`ReportOverviewPage.tsx:23`, `HistoryChart.tsx:39`, `PaymentHistoryWidget.tsx:24`). P3 (`current()` always true): 10 failures including the dedicated tests. Not guarded: summary feedback and chat (R2-C-02). |
| C-04 one hostile address tested | Fixed | `open-redirect.feature` now has 5 rows, including `/..//` and `/.//`. P1 shows the `@ui` rows notice. The scenario only cancels the form; saving uses the same `goBack`. |
| C-05 `UtilisationBar` not as specified | Fixed | `UtilisationBar.tsx:8-22` has the bands, `data-band` and `{testId}-over-limit`. Used at `ReportSections.tsx:65`, `AccountListPage.tsx:94` and `AccountDetailPage.tsx:79`. |
| C-06 `search-list` hook | Fixed | `SearchesPage.tsx:35`; test `ReportPages.test.tsx` "search-list holds the rows". |
| C-07 gauge | Fixed (the spec now matches the code) | `ScoreSection.tsx:18-25`; `ui-specification.md:15` and the §7 `ScoreGauge` row. |
| C-08 debug route and gating | Fixed | `App.tsx:48` (`/debug`, inside `RequireSession`, only if `TEST_BUILD`), matching `ui-specification.md:131` and §6.8. All 9 hooks listed in §6.8 exist in `DebugPage.tsx`. |
| C-09 exit scope | Fixed | Baseline run: "124 axe scans and 282 layout checks; 0 problem(s)", the figures in `ui-specification.md:15`. Layouts leave out states with an `act`. P15 widened to every state, with axe also in doubled text: 124 and 360, 0 problems, so nothing is hidden today. Residual gaps are in R2-C-15. |
| C-10 dark theme contrast | Fixed | P9 (dark `--color-muted: #4a5865`): the exit check fails 3 dark scans and no light scan. |
| C-11 wider text | Partly fixed | `html { font-size: 200% }` doubles `rem` and body text, but form controls stay at 13.33px (R2-C-04). |
| C-12 `ph-a11y` catch | Partly fixed | `ui-specification.md:287` is narrowed, but `fixtures/bug-flags.json:187` still says "payment history `@ui` scenarios", and the flag is not implemented in the UI (R2-C-08). |
| C-13 public build guard | Fixed | `scripts/public-build-guard.mjs`. P5a (marker string in `App.tsx`) fails the guard. P5c (a `VITE_TEST_BUILD=true` build into the guard folder) fails with all 5 markers. Gaps are in R2-C-06 and R2-C-07. |
| C-14 pins | Fixed (SHA-to-tag mapping not verified offline) | All 11 `uses:` lines (`ci.yml` 7, `pages.yml` 4) have a 40-hex SHA and a `# vN` comment. `@redocly/cli` 2.57.0 is in the root `package.json` and lock file. No check stops a floating tag returning. A fallback and a stale comment are in R2-C-09. |
| C-15 silent hook failure | Fixed (residual hang) | `run.mjs:139-153` prints "harness: a run hook failed: ...". P10 showed the message, but also a run that never ended (R2-C-10). |
| C-20 redirect back after sign-in | Partly fixed | `LoginPage.tsx:35-37` calls `safeRedirect`. P1b (raw `from.startsWith('/')` put back): all 179 component tests pass. No scenario or test covers it (R2-C-03). |
| C-21 initials | Fixed | `AccountRow.tsx:25-27`; test `AccountPages.test.tsx:433-435`. |
| C-22 page past the end | Fixed | `ReportChangesPage.tsx:40,70-76`; tests at `ReportPages.test.tsx:291-317`; exit target "report changes, past the end" passes. |
| C-25 (Note) drawer `inert` | Fixed, but broke something | See R2-C-01. |
| C-27 (Note) header GIF | Fixed | Base64 decodes to 42 bytes, starts `GIF89a`, ends `0x3B`. |
| C-28 (Note) detail header | Fixed | `AccountDetailPage.tsx:54` is `section aria-label="Account summary"`. |
| C-29 (Note) dist and logs | Fixed for `dist` | `run.mjs:43-44` builds `dist-test` via `build:test`. Logs still go to the system temp folder, now named by port and pid. |
| C-30 (Note) storage write | Fixed | `DebugPage.tsx:52-56` is in try/catch; the "typing the control key does not throw" test passes. |
| C-32 (Note) history months | Fixed | `HistoryChart.tsx:114` uses `formatMonth`; test "shows June 2026". Unparseable months are in R2-C-05. |
| C-33 (Note) attempts line | Fixed | Chromium: the line was absent in the code step and read "2 attempts left" after the first wrong code. |

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| C1 pages and hooks | 15 pages plus `NotBuiltPage` read in full. 208 hook tokens extracted from the two UI specs and matched to the source: 19 had no match, 15 of those built dynamically, and the other 4 are listed in R2-C-12 and R2-C-17. Four section states checked on every data-bound page. | R2-C-11, R2-C-12, R2-C-14, R2-C-17 |
| C2 behaviour | `safeRedirect`: 18 component vectors, 5 Gherkin rows and 6 browser deep links. Fetching sites: 15 guarded, 5 unguarded (`ReportChanges.loadAll`, `SummarySection.choose`, `ChatDrawer.send`, `ProfilePage` save, `DebugPage`), of which 2 shown to misbehave. 7 forms read. React Strict Mode: `main.tsx` uses it, the `@ui` run is clean, and the cleanup in `useLatest.ts:9-14` is ordered correctly. | R2-C-02, R2-C-03, R2-C-05, R2-C-14, R2-C-18 |
| C3 accessibility and exit checks | 4.5 baseline against 44 source files. Exit run: 124 axe scans and 282 layout checks, 0 problems. Variants: 124 and 360 with axe also in doubled text, 0 problems. Seven mutation probes. | R2-C-01, R2-C-04, R2-C-15, R2-C-16 |
| C4 security and privacy | 0 matches for `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `window.open`, `location.href`, `console.`, `document.title` in 44 source files. 2 `localStorage` sites, both test-only and in try/catch. PR-08: one static title, no personal data in routes. Public bundle 323,964 bytes against 327,393 for the test build. 4 guard probes. | R2-C-06, R2-C-07 |
| C5 CI and supply chain | 2 workflows, 11 `uses:` lines, 11 pinned. Permissions: `ci.yml` contents read only; `pages.yml` also `pages: write` and `id-token: write`. `persist-credentials: false` everywhere. 5 `package.json` and 5 lock files, 0 mismatches, no `^` or `~`. `RestoreLockedMode` in CI. `ui` job: `check:ui` 1m27s, `test:ui` 1m45s, `test:exit` 5m10s with build, `test:flags` 2m44s, on a shared machine. | R2-C-09, R2-C-10, R2-C-17 |
| C6 specification claims | 26 claims checked (list under Method). 5 wrong or overstated. | R2-C-01, R2-C-02, R2-C-04, R2-C-08, R2-C-12 |

## Probes
| Probe | What I changed (in the copy) | What I expected | What happened |
|---|---|---|---|
| P1 old redirect guard | `safeRedirect.ts` reduced to `startsWith('/')`, not `//`, no backslash | component tests and `@ui` rows fail | 7 component failures; `@ui` open-redirect 2 of 5 failed. Noticed. |
| P1b weak sign-in guard | `LoginPage.tsx:37` uses `from.startsWith('/') ? from : fallback` | a test fails | 179 of 179 pass. **Not noticed.** |
| P2 bar capped at 100 | `aria-valuenow={Math.min(percent,100)}`, `aria-valuemax={100}` | tests fail | 4 component failures. `@ui` not run (it reads the text only). |
| P3 late answer wins | `useLatest.ts:17` returns `() => true` | stale-answer tests fail | 10 failures, including both `useResource` tests, the history range, filter and year tests. Noticed. |
| P4 drawer not inert | removed `setAttribute('inert','')` | a test fails | 1 failure, the dedicated inert test. No `@ui` or exit check covers it. |
| P5a marker in public build | `console.log('x-test-control-key')` in `App.tsx`, then `vite build` | guard fails | Guard exit 1. Noticed. |
| P5b flag-gated defect | `useFlag('duplicate-nav') ? 'SEEDED-DEFECT-DUPLICATE-NAV' : name` in `ScoreSection` | guard fails | String is in `dist/assets`, guard passes. **Not noticed.** |
| P5c leak | `VITE_TEST_BUILD=true vite build` into the guard folder | guard fails | Fails, lists all 5 markers. Noticed. |
| P5d shrunk list | `MARKERS = ['cds.testControlKey']` | guard tests fail | 3 of 3 pass. **Not noticed.** |
| P6 layout break | `.account-card { min-width: 20rem }` | fails at 375 px doubled | 4 problems: 375 and 1280 px doubled, with the elements named; exit 1. Noticed. |
| P7 remove an `aria-` name | removed `aria-label={label}` from the bar | axe fails | `aria-progressbar-name` on 5 checks. Noticed. |
| P8 wrong figure | debt total `+ 100` | tests fail | 1 component failure and `@ui` debt "Expected ... £198,280". Noticed. |
| P9 dark contrast | dark `--color-muted: #4a5865` | dark fails, light passes | 3 dark failures, no light failure. Noticed. |
| P10 hook failure | `AfterAll` throws at once | message printed and run ends | Message printed, but the run hung until I killed the process. |
| P11 focus return (Chromium) | none, with and without the `inert` effect | focus back on `btn-chat` | With `inert`: focus is on BODY after Escape and after Close. Without: `btn-chat`. Blocker. |
| P12 doubled text (Chromium) | `html{font-size:200%}` on the email page | all text doubles | body 32px, button 32px, input 13.3333px. |
| P13 odd month (Chromium) | history reply `2026-13` | table shows something | `pageerror: Invalid time value`, `#root` empty. |
| P14 late feedback (Chromium) | hold the first feedback answer 1.2 s, click Helpful then Not helpful | Not helpful pressed | Helpful pressed; service holds `dislike`. |
| P15 wider exit run | layouts for every state, axe in doubled text | maybe new failures | 124 and 360, 0 problems. |
| P16 hostile deep links (Chromium) | six addresses incl. `//evil.example/x`, `/..//evil.example/x` | stay on this origin | All six did. |
| P17 mobile page (Chromium) | save a new number | current number updates | Old number still shown in the code step (R2-C-11). |

## New findings
### R2-C-01 (Blocker, C2/C3): closing the chat drawer no longer returns focus
- Where: `src/pages/overview/ChatDrawer.tsx:26-38`, `src/pages/overview/SummarySection.tsx:32-35`.
- Code or check text: "`sibling.setAttribute('inert', '');`" and, in `closeChat`, "`setChatOpen(false); chatButton.current?.focus();`"
- Specification or contract text: "the chat drawer is a dialog ... that traps focus, closes on Escape and returns focus to `btn-chat`" (`DOCS/.design/ui-specification.md:163`).
- Why it matters: `btn-chat` is still inside an `inert` sibling when `focus()` runs, because the effect cleanup that removes `inert` runs after the render. Chromium measured focus on BODY after Escape and after Close (P11). The component test at `ReportOverviewPage.test.tsx:272` passes because jsdom does not refuse focus on an inert element, and no `@ui` scenario covers the drawer.
- Suggested fix: remove `inert` first (or focus in an effect after the drawer has gone), and add a Playwright check of `document.activeElement`.

### R2-C-02 (Blocker, C2): C-03 is not fixed for summary feedback and chat
- Where: `SummarySection.tsx:19-30`, `ChatDrawer.tsx:42-58`.
- Code or check text: "`if (data) setFeedback(data.value);`" with no staleness check; "`setExchange({ asked, reply: data.reply, ... })`".
- Specification or contract text: "A response that arrives after a newer request ... is ignored in every fetching page and widget" (`ui-specification.md:17`).
- Why it matters: P14 shows Helpful pressed while the service holds `dislike`. A slow chat answer overwrites a newer one in the same way (read from the code, not run).
- Suggested fix: use `useLatest` in `choose` and `send`, and add a test like the ones in `ReportPages.test.tsx:246-289`.

### R2-C-03 (Change, C2): nothing tests the sign-in redirect back
- Where: `src/pages/LoginPage.tsx:35-37`; no test in `App.test.tsx` or any feature.
- Code or check text: "`navigate(safeRedirect(typeof from === 'string' ? from : null, ...))`"
- Specification or contract text: "the sign-in redirect-back uses the same guard (C-01, C-20)" (`ui-specification.md:17`).
- Why it matters: P1b shows 179 of 179 tests pass with the weak guard back. Only the exit run's first visit uses the redirect, and only with a harmless address.
- Suggested fix: add a component test with `state.from` set to `//evil.example` and `/..//evil.example`, and a `@ui` row.

### R2-C-04 (Blocker, C3): doubled text does not double form controls
- Where: `src/styles.css:167` (`input { max-width: 100%; }`); `font: inherit` is set only for `.login input` (about line 102), `.chat-drawer input` (157) and `button`.
- Code or check text: "`input { max-width: 100%; }`"
- Specification or contract text: "'Wider text' means `html { font-size: 200% }`, so `rem` sizes follow (WCAG 1.4.4)" (`ui-specification.md:15`); the §9 layouts row (`:303`).
- Why it matters: with the root at 200% the email input is 13.3333px against 32px body text (P12). The same applies to the details form, mobile, preferred name and debug inputs, so the 200% check says nothing about them and the real pages are not usable at 200%.
- Suggested fix: add `input, select, textarea { font: inherit; }` and re-run the exit check.

### R2-C-05 (Change, C2): a month the formatter cannot parse blanks the whole page
- Where: `src/format.ts:35-37`, used at `HistoryChart.tsx:114`, `BalanceChart.tsx:57`, `PaymentHistoryWidget.tsx:83`. There is no error boundary (`src/main.tsx`).
- Code or check text: "`format(new Date(`${month}-01T00:00:00Z`))`"
- Specification or contract text: "month: { type: string, pattern: '^\d{4}-\d{2}$' }" (`openapi.yaml:1514`, `:1700`) accepts `2026-13` and `2026-00`.
- Why it matters: P13 gave `Invalid time value` and an empty `#root`. `monthLabel` in `HistoryChart.tsx` falls back to the raw text, so the two disagree.
- Suggested fix: fall back to the raw month in `formatMonth`, add a test, and add a page-level error boundary.

### R2-C-06 (Change, C4): the guard cannot see flag-gated defect code
- Where: `scripts/public-build-guard.mjs:11`, `src/flags.tsx:59-61`.
- Code or check text: "`useFlag(name)` ... `useContext(FlagsContext).includes(name)`"; the 5 markers cover the mechanism only.
- Specification or contract text: "the public build contains none of this code" (`ui-specification.md:70`).
- Why it matters: when a UI flag such as `duplicate-nav` is built through `useFlag`, its defect branch ships in the public bundle and the guard passes (P5b). Only `plural` exists today, and it folds away.
- Suggested fix: add the BugFlag names that are not ordinary words as markers, or build UI flags through a constant `TEST_BUILD && ...` check.

### R2-C-07 (Change, C4): the guard's tests are written from the list they test
- Where: `scripts/public-build-guard.test.mjs:24`.
- Code or check text: "`for (const marker of MARKERS) {`"
- Specification or contract text: "fails if `dist/` holds any of `cds.testControlKey`, `__test`, `x-test-control-key`, `debug-flag` or `Debug panel`" (`ui-specification.md:15`).
- Why it matters: P5d shrank the list to one marker and the tests still passed (3 of 3).
- Suggested fix: assert the list equals the five in the specification.

### R2-C-08 (Change, C3/C6): UI flag catchers differ between the specification and the registry
- Where: `ui-specification.md:287` and `fixtures/bug-flags.json:187`.
- Code or check text: "Component test (`aria-pressed` on the year buttons; axe has no rule for it); axe-core (the icons' text)" against "payment history `@ui` scenarios".
- Specification or contract text: the registry is the source for catchers (API specification v26: "`fixtures/bug-flags.json` lists all 30 flags ...").
- Why it matters: the C-12 fix changed one side only. Other pairs also differ, for example `util-mismatch`.
- Suggested fix: make the registry's `plannedCatcher` say what §8 says, or the reverse, for every UI flag.

### R2-C-09 (Change, C5): `npx redocly lint` can fetch an unrelated package
- Where: `tools/verify.mjs:18`, `redocly.yaml:8`.
- Code or check text: "`cmd: 'npx redocly lint'`"; the comment "`npx --yes @redocly/cli@2.57.0 lint`".
- Specification or contract text: "the lint step runs the local binary, not `npx --yes`" (`harness-design.md`, §31, CI bullet).
- Why it matters: if the root dependencies are not installed, `npx` fetches a registry package called `redocly`, which is not `@redocly/cli`. I could not check the registry offline. The comment in `redocly.yaml` is also stale.
- Suggested fix: use `npx --no-install redocly lint` and update the comment.

### R2-C-10 (Change, C5): a failed `AfterAll` can still hang the run
- Where: `test-harnesses/harness-serenity/src/ui/hooks.ts:24-31`.
- Code or check text: "`throw new Error('The browser did not close within 30 s');`"
- Specification or contract text: "With a close time of 1 ms the run prints '3 successful', then 'a run hook failed ...', then exit code 1" (`harness-design.md`, §31).
- Why it matters: in P10 the browser stayed open, Node never exited, and the message appeared only when I killed it. The same happens when `browser.close()` never finishes.
- Suggested fix: kill the browser process or call `process.exit` before throwing.

### R2-C-11 (Change, C1): the mobile page keeps showing the old number in the code step
- Where: `src/pages/profile/MobilePage.tsx:79-83`.
- Code or check text: `{mobile && (<p data-testid="mobile-current">`, from the first `GET /me/profile`.
- Specification or contract text: "The number held, masked (`•••• ••• 123`), with its status" (`ui-feature-profile.md:109`).
- Why it matters: Chromium showed "•••• ••• 789 · Unverified" in the code step after saving 07700 900123.
- Suggested fix: re-read the profile after the PUT.

### R2-C-12 (Change, C6): the component catalogue and §3 differ from the build
- Where: `ui-specification.md:256,258,259,261`, `:64`.
- Code or check text: nothing in `src/` builds `BenchmarkBar`, `SegmentedControl`, `UtilisationDonut`, or a limit line in `BalanceChart.tsx`.
- Specification or contract text: "`SegmentedControl` ... radiogroup, arrow-key navigation"; "`BarChart` ... Limit line"; "`vite` 8.3.3" (`package.json:31` pins 8.3.4).
- Why it matters: the range and history buttons are `aria-pressed` buttons with no arrow-key handling. Others are stale pins.
- Suggested fix: update the catalogue and the pin to what is built.

### R2-C-13 (Blocker, cross-area, service): invalid UTF-8 in a request body is a 500
- Where: `CreditDashboard.Api/Edge/ContractValidation.cs:102`.
- Code or check text: "`catch (Exception fault) when (fault is JsonException or ArgumentException)`"
- Specification or contract text: "the request's own values: the shape of the path, query and body ... (400)" (`api-specification.md:243`); 500 is for the `error` persona or an unhandled fault only (`:253`).
- Why it matters: a PATCH with `O\x92Brien`, and a login body with `\xc3\x28` in the username, both returned 500 "Server fault". The log shows `InvalidOperationException: Cannot transcode invalid UTF-8 JSON text to UTF-16 string`, which the filter does not catch. This is an area A matter, found while probing the UI.
- Suggested fix: catch `InvalidOperationException` here and return the 400, with a test using non-UTF-8 bytes.

### R2-C-14 (Change, C2): the client accepts U+2019 as an apostrophe
- Where: `src/pages/profile/ProfilePage.tsx:17`.
- Code or check text: "`/^[\p{L} '’-]{1,30}$/u`"
- Specification or contract text: "letters, spaces, hyphens and apostrophes only" (PR-02, `ui-feature-profile.md:136`); the service accepts `'` only (`BusinessRules/Profile/PreferredName.cs:24`) and returned 422 for `O’Brien`.
- Why it matters: the client check is meant to mirror PR-02, but it lets through a name the service refuses.
- Suggested fix: remove `’` from the class, or settle in PR-02 that it is allowed and change the service.

### R2-C-15 (Change, C3): gaps in the exit run's own cover
- Where: `exit-checks.ts:136,194,283,292`.
- Code or check text: "`const targets = only ? allTargets.filter(...) : allTargets;`"; "`await page.waitForFunction(NOTHING_LOADING);`"; "`if (!text.css) problems.push(...(await violationsOn(page)));`"
- Specification or contract text: "axe-core on every page and every state ... Layouts: ... and axe-core at each width, with normal text and with the root text doubled" (`ui-specification.md:302-303`).
- Why it matters: a filter that matches nothing still ends "0 problem(s)" with exit 0. Loading skeletons are never scanned. The sign-in page is never laid out at three widths. Axe does not run in the doubled-text passes. P15 found no problem behind any of these today, so this is cover rather than a live defect.
- Suggested fix: fail when the filter matches nothing, assert the expected counts, and run axe in the doubled-text passes.

### R2-C-16 (Note, C3): the mobile tab bar covers the foot of long pages
- Where: `styles.css:67-76` (`.nav-mobile` is fixed); `main` has no bottom padding.
- Code or check text: "`.nav-mobile { position: fixed; inset: auto 0 0 0; ...}`"
- Specification or contract text: "Below 768px the primary nav becomes a bottom tab bar" (`ui-specification.md`, §4.4).
- Why it matters: at 375px the account detail page ends 17px behind the bar when scrolled to the bottom.
- Suggested fix: `main { padding-bottom: 5rem }` below 768px.

### R2-C-17 (Note, C5): SHA comments name only the major version
- Where: `.github/workflows/ci.yml:23,27,36,42` and `pages.yml:34,52,54,59`.
- Code or check text: "`actions/checkout@fbc6f399... # v5`"
- Specification or contract text: "every action is pinned to a commit SHA with its version in a comment" (`harness-design.md`, §31).
- Why it matters: `# v5` does not say which release the SHA is. I could not confirm any SHA offline; I recognise four from memory and could not place `checkout`, `setup-dotnet` or `setup-python`. Separately, §6.2 names header hooks `btn-notifications` and `notifications-unread` that are not built.
- Suggested fix: write the full tag, for example `# v5.0.0`.

### R2-C-18 (Note, C2/C3): code reading only
- Where: `ProfilePage.tsx:117-130` and `index.html`.
- Code or check text: `refreshUser()` inside the same `try` as the PATCH; one static `<title>` for every route.
- Specification or contract text: none; observations.
- Why it matters: a network error in `refreshUser` after a successful save would show "could not be saved". A route change does not move focus or announce the page.
- Suggested fix: move `refreshUser` out of the `try`, and consider a per-route title.

## Not done
- I did not run `npm audit` or check the action SHAs against their tags, because both need the network.
- I did not run `check:service`, `check:harness`, `check:schemathesis`, `check:client`, `check:mock`, `check:service-contract` or `check:kanban`; they are outside area C.
- I read the main body of `AccountPages.test.tsx` and `ReportPages.test.tsx` but not all of `Profile.test.tsx` (371 lines), `flags.test.tsx` or the step definitions.
- I did not read `README.md` (out of date by design) or the harness step code.
- I did not test with a screen reader.
- I did not time the 400-check claim ("under three minutes") on its own; the whole exit run took 5m10s including the build, on a machine shared with the other reviewers.
- The `SearchesPage` page number surviving a change of kind is from reading the code only, so I left it out of the findings.
- `tar` replaced the `node_modules/@credit-dashboard-sut/api-client` junction in my copy with an empty folder; I recreated the junction before running anything.

## Method
- **Copy:** I copied the repository to the scratch folder without `.git` and `.review`, and never read `.review`, the decision briefs, the backlog, the plans, the logs or the walkthroughs. The copy was restored after each probe and diffed clean against my saved originals. I ran no git commands in the repository itself.
- **Read in full:** the UI source, `styles.css`, the exit checks, `run.mjs`, the guard and its tests, both workflows, the five `package.json` files and their lock files, and the two UI specifications.
- **Spec claims checked (26):** UI v22 to v27, My Profile v9 and v11, and API v26 to v32. Among those for API v28 to v32 checked: contract 0.9.6; no `allOf`; `PageMeta` gone; 30 flags in the registry; correlation id echoed or replaced; `HEAD` and `no-store`; `/assets` 404 problem; clock formats; duplicate property gives 400; payment years oldest first.
- **Ran:** `check:ui` (179 tests, guard clean), `check:ui-scenarios` (55 scenarios, 0 failed), `check:ui-exit`, `check:bug-flags` (8 of 8) and the probes above, on `HARNESS_PORT=4760`, `HARNESS_OFF_PORT=4761`, `SERVICE_PORT=4762`. A separate service on 4762 served the test build for the Chromium scripts; I stopped it afterwards.
````

## 4. The author's verification

Written by the author (the main session) after the three reports were saved unchanged. For each new Blocker and Change, the table says whether it was reproduced and how. The reviewers' words in sections 2 and 3 are not altered. Notes were not verified. The working tree was clean (`git status`) after every mutation, and each mutation was reverted with `git checkout`; the repository was at `20ecebc` throughout.

**Result: 12 new Blockers and 27 new Changes. All 12 Blockers reproduced (R2-A-05 in part: the trailing newline reproduced, the full-width digits did not). All 27 Changes reproduced or confirmed by reading.** Of the 57 earlier findings the reviewers checked, 41 were Fixed and 16 Partly fixed; each Partly fixed one is explained by one of the new findings below. One reviewer statement needs correcting: reviewer A's Summary gives 9 Blocker, 5 Change and 3 Note findings, while its headings are 8, 5 and 4 (R2-A-01, 04 to 10 are Blockers; the count above is from the headings).

**Methods.** *Live:* the Release build of the service on port 4795 (Production, test control on), driven by `verify_live.py`; the test build of the UI on ports 4796 and 4797 in Chromium, driven by two Playwright scripts. *Mutation:* one change in the working tree, the narrowest check that should notice, then reverted. *Reading:* the cited lines read.

### 4.1 Blockers

| Finding | Reproduced? | How |
|---|---|---|
| R2-A-01 lone surrogate gives an unhandled 500 | yes | Live: `POST /auth/login` with `"password":"\ud800"` gave 500 (`application/problem+json`) |
| R2-A-04 PR-11 limit beaten in parallel | yes | Live: 30 rounds of 40 parallel wrong codes; the most `code-wrong` answers in one round was 9 (the limit allows 2) |
| R2-A-05 clock accepts non-RFC 3339 text | in part | Live: a trailing newline gave 204; full-width digits gave 400 (the parse after the pattern refuses them), so only the newline reproduced |
| R2-A-06 signed year or page silently replaced | yes | Live (clock 2026-10-03): `year=%2B2018` gave 200 with `selectedYear` 2026; `year=%2B2025` gave 200 with `selectedYear` 2026 |
| R2-A-07 `missed[]` lists future months | yes | Live (clock 2026-01-15, `struggling`): year 2026 status `on-time`, `missed` held 2026-06, 2026-08, 2026-09 |
| R2-A-08 closed account utilisation | yes | Live (`drilldown`): `acc_ddcl01` balance 0, limit 250000, utilisation 5, raw 5 |
| R2-A-09 fault handler registration untested | yes | Mutation: `app.UseMiddleware<FaultHandler>()` removed from `Program.cs`; 387 service tests and 239 rules tests all passed |
| R2-A-10 account half of the A-07 test cannot fail | yes | Reading: the test sends `acc_nope` (`FaultAndEdgeTests.cs:175`); the contract's `AccountId` pattern is `^acc_[a-z0-9]{5,}$` (`openapi.yaml:1131`), and `nope` is four characters, so the edge answers 400 whatever the handler does |
| R2-C-01 focus lost after the drawer closes | yes | Chromium: after Escape and after Close the active element was `BODY` |
| R2-C-02 late feedback overwrites a newer one | yes | Chromium: Like then Dislike with the first answer held 1.2 s: Like stayed pressed, Dislike not |
| R2-C-04 form controls not doubled | yes | Chromium, root at 200%: body 32 px, button 32 px, input 13.3333 px |
| R2-C-13 invalid UTF-8 gives a 500 | yes | Live: `POST /auth/login` with the bytes `\xc3\x28` in the username gave 500 |

### 4.2 Changes

| Finding | Reproduced? | How |
|---|---|---|
| R2-A-02 exponent number faults latency | yes | Live: `{"fixedMs":1e3}` gave 500 |
| R2-A-03 formats not enforced on overrides | yes | Live: an override with `openedDate: "x"` gave 500 at bind |
| R2-A-11 extreme clock instants | yes | Live: `9999-12-31T23:59:59Z` gave 204; the next login gave 500 |
| R2-A-13 Schemathesis exemptions | yes | Reading: `schemathesis.toml` disables `response_schema_conformance` for `PATCH /me/profile/preferred-name`; `tools/schemathesis-run.mjs` excludes `testSetLatency` |
| R2-A-14 one persona in the response tests | yes | Reading: `OperationResponseTests.cs` samples bind `alex` to `excellent` throughout |
| R2-B-01 non-JSON test cannot fail | yes | Mutation: the non-JSON check turned off; 20 of 20 harness unit tests passed |
| R2-B-02 closed-ness guarded for one schema | yes | Mutation: `Money` opened (`additionalProperties: true`); 20 of 20 unit tests passed |
| R2-B-03 loose `failsWith` returns unnoticed | yes | Mutation: the registry text back to "must be integer"; `schema-check` reported 659 checks, 0 failures |
| R2-B-04 closed fixtures can be zeroed | yes | Reading: `schema-check.mjs` lines 90 to 93 have no check that a closed account holds a balance or a limit |
| R2-B-05 PR-08 ignores three values | yes | Reading: `secretsOf` (`profile.steps.ts:145-160`) lists legal name, first name, preferred name, both date forms, email, postcode and mobile digits; no address line, employment status or member-since date |
| R2-B-07 Before checks flags only | yes | Reading: `arrangeFlags` compares only `flags` (`ControlTheTestEnvironment.ts:35-40`) |
| R2-B-08 SIGTERM and limits | yes | Reading: `run.mjs:94` registers the handler and `:133` runs the child with `spawnSync`, which blocks the event loop; only the flag proof has a time limit. The signal path was not run (Windows) |
| R2-B-09 a run that selects nothing exits 0 | yes | Run: `node scripts/run.mjs api closed-accounts` (folder omitted) printed `Scenarios: 0` and exit code 0 |
| R2-B-10 harness type check runs nowhere | yes | Reading: `typecheck` is a script in `package.json`; `ci.yml` and `tools/verify.mjs` do not call it (the three `typecheck` hits in `ci.yml` are the UI job's name and step) |
| R2-B-11 design claims what is not built | yes | Reading: `harness-design.md:63` describes `verifyEmail` and `state()` methods; `:140` describes a coverage check; neither exists |
| R2-C-03 sign-in redirect untested | yes | Mutation: `LoginPage` navigates to `from` when it starts with `/`; 179 of 179 component tests passed |
| R2-C-05 unparseable month blanks the page | yes | Run: `new Intl.DateTimeFormat(...).format(new Date('2026-13-01T00:00:00Z'))` throws `Invalid time value`; `formatMonth` has no fallback and the app has no error boundary |
| R2-C-06 guard cannot see flag-gated code | yes | Reading: the five markers name the mechanism only (`public-build-guard.mjs:11`); a branch under `useFlag('duplicate-nav')` would carry none of them |
| R2-C-07 guard tests use the list they test | yes | Mutation: `MARKERS` reduced to one entry; the 3 guard tests still passed |
| R2-C-08 catchers differ, spec and registry | yes | `bug-flags.json:187` says "payment history `@ui` scenarios"; `ui-specification.md:287` says "Component test ... axe-core" |
| R2-C-09 `npx redocly` | yes | Reading: `tools/verify.mjs:18` is `npx redocly lint` without `--no-install` |
| R2-C-10 failed `AfterAll` can hang | yes | Mutation: `AfterAll` throws before closing the browser; the run printed "a run hook failed: Error: probe" and then did not end; `timeout 120` killed it (exit code 143) |
| R2-C-11 mobile page keeps the old number | yes | Chromium: the code step still showed "•••• ••• 789 · Unverified" after saving 07700 900123 |
| R2-C-12 catalogue and pin | yes | Grep: none of `SegmentedControl`, `BenchmarkBar`, `UtilisationDonut` is built; `package.json` pins `vite` 8.3.4, the specification says 8.3.3 |
| R2-C-14 curly apostrophe accepted by the client | yes | Reading: `ProfilePage.tsx:17` is `/^[\p{L} '’-]{1,30}$/u`; the service accepts only `'` (reviewer A saw a 422 for `O’Brien`; not rerun) |
| R2-C-15 gaps in the exit run's cover | yes | Run: `CDS_EXIT_ONLY=zzz-no-such-target` printed "4 axe scans and 0 layout checks; 0 problem(s)" and exit code 0 |

### 4.3 The earlier findings reported as Partly fixed

Each is covered by a new finding, so none needs separate work: A-01 and A-19 by R2-A-09 and R2-A-10; A-02 by R2-A-01, R2-C-13 and R2-A-02; A-04 by R2-A-04; A-06 by R2-A-05 and R2-A-11; A-07 by R2-A-06 and R2-A-10; A-17 by R2-A-07; B-02 by R2-B-03; B-08 by R2-B-08; B-10 by R2-B-02; B-18 by R2-B-05; B-20 by R2-B-11; C-03 by R2-C-02; C-11 by R2-C-04; C-12 by R2-C-08; C-20 by R2-C-03. The Note C-25 (the `inert` page behind the drawer) is covered by R2-C-01.

### 4.4 The random-order runs (B-22), by the author

`api` profile in random order with seeds 11111 and 22222: 59 scenarios each, exit code 0. `ui` profile with seed 33333: 55 scenarios, exit code 0. The order was passed to Cucumber as `--order random:<seed>` through a one-line pass-through in `scripts/run.mjs` that was not kept (the file was restored); the harness output does not print the order, so the runs show no leak between scenarios but the order itself was not inspected. B-22 is closed by this, with that limit.

### 4.5 Independence

The three reviewers shared one scratch folder for their prompt files and some probe scripts (`orig/`, `probe.sh`). Reviewer B reported that an early restore copied a stray file into its copy, that it removed it, and that it compared its copy with the repository with `diff -rq` before the first run and after the last. Reviewer A copied the repository with `tar` and said so; reviewer C reported that `tar` replaced one junction in its copy and that it recreated it. Nothing in the findings depends on a copy that differed from the repository except where a probe is described. No reviewer read `.review/` or the plans and logs, by its own statement; reviewer A noted that its copy contained a `.review/` folder it did not open.

### 4.6 What was not verified

The 16 Notes (not asked for). Reviewer C's statement that the SHA comments cannot be checked offline stands; so does reviewer B's statement that the SIGTERM path cannot be shown on Windows. R2-C-14's service half (the 422 for U+2019) was read, not rerun.

## 5. The owner's sign-off

Recorded 2026-10-16 by interview (the same method as the first review's section 5), the author asking by group with a recommendation and the owner answering, then confirming a read-back with "Confirm". The sign-off was given on the reviewers' reports and the author's verification of section 4; nothing the author could not reproduce is in it (R2-A-05 is accepted for the newline case only, see below). Slices F11a to F11f are those of the plan `DOCS/implementation-plans/2026-10-16_cds-38-confirmation-fixes.md`. **Result: 12 Blockers and 27 Changes accepted; 16 Notes: 11 accepted, 3 deferred to the backlog, 2 no action.**

### 5.1 Blockers

| Finding | Decision | Slice |
|---|---|---|
| R2-A-01 lone surrogate gives an unhandled 500 | Accept: read bodies strictly at the edge, 400 for a bad string | F11a |
| R2-C-13 invalid UTF-8 gives a 500 | Accept (with R2-A-01: the same code) | F11a |
| R2-A-09 fault handler registration untested | Accept: a test through the real service triggers a real fault in Development and Production | F11a |
| R2-A-04 PR-11 limit beaten in parallel | Accept: one lock around read, decide and write, and a burst test | F11b |
| R2-A-05 clock accepts non-RFC 3339 text | Accept: `\z` and `[0-9]`, both inputs in the test table (only the newline reproduced; the full-width digits are kept as a test row) | F11a |
| R2-A-06 signed year or page replaced | Accept: the handlers parse as the edge does, so `+2018` gets the window 400 | F11a |
| R2-A-07 `missed[]` lists future months | Accept: filter by the current month for both payment-history operations | F11b |
| R2-A-08 closed account utilisation (with R2-B-06) | Accept: utilisation from the reported balance, which is 0; a service test and a step | F11b |
| R2-A-10 account half of the A-07 test cannot fail | Accept: a well-formed unknown ID | F11b |
| R2-C-01 focus lost after the drawer closes | Accept: remove `inert` before focusing; a `@ui` scenario for the focused element | F11e |
| R2-C-02 late feedback and chat answers | Accept: `useLatest` in feedback and chat, with tests | F11e |
| R2-C-04 form controls not doubled | Accept: `input, select, textarea { font: inherit }`, then the exit checks; any overflow it exposes is fixed in the slice or brought to the owner | F11e |

### 5.2 Changes

| Finding | Decision | Slice |
|---|---|---|
| R2-A-02 exponent number faults latency | Accept | F11a |
| R2-A-03 formats not enforced on overrides | Accept: format assertion for dates at the edge or in the overrides check | F11a |
| R2-A-11 extreme clock instants | Accept: refuse instants outside 1990 to 2100 with a 400 | F11a |
| R2-C-14 curly apostrophe accepted by the client | Accept: remove U+2019 from the client pattern | F11e |
| R2-A-13 Schemathesis exemptions | Accept: narrow the exemption to the pattern check, fuzz the latency control with a reset, set the encoding in the runner | F11c |
| R2-A-14 one persona in the response tests | Accept: loop the read operations over the personas | F11c |
| R2-B-01 non-JSON test cannot fail | Accept | F11d |
| R2-B-02 closed-ness guarded for one schema | Accept: a unit test that walks every response schema, with an explicit allow list | F11d |
| R2-B-03 loose `failsWith` returns unnoticed | Accept: `failsWith` unique across the registry and located | F11d |
| R2-B-04 closed fixtures can be zeroed | Accept: `schema-check` requires a non-zero stored balance and limit on the closed accounts the BR-13 and BR-04 scenarios use | F11d |
| R2-B-05 PR-08 ignores three values | Accept: address line, employment status and member-since date, and drop the "every" claim or derive the list from the schema | F11d |
| R2-B-07 Before checks flags only | Accept: also the clock, the default personas and the latency | F11d |
| R2-B-08 SIGTERM and limits | Accept: run the child asynchronously, forward signals, a limit for every mode | F11d |
| R2-B-09 a run that selects nothing exits 0 | Accept | F11d |
| R2-B-10 harness type check runs nowhere | Accept: run `typecheck` in the `api` job or `verify` (the count of steps in the documents is kept true) | F11d |
| R2-B-11 design claims what is not built | Accept: correct the design (and the coverage-check claim) | F11d |
| R2-C-05 unparseable month blanks the page | Accept: fall back to the raw month, an error boundary, a test | F11e |
| R2-C-11 mobile page keeps the old number | Accept: re-read the profile after the PUT | F11e |
| R2-C-03 sign-in redirect untested | Accept: a component test with `//evil.example` and `/..//evil.example`, and a `@ui` row | F11f |
| R2-C-06 guard cannot see flag-gated code | Accept: handled with the guard's marker list; the flag names that are not ordinary words become markers, and the rest is recorded for P3 | F11f |
| R2-C-07 guard tests use the list they test | Accept: assert the list equals the five in the specification | F11f |
| R2-C-08 catchers differ, spec and registry | Accept: make the registry's `plannedCatcher` and section 8 say the same for every UI flag | F11f |
| R2-C-09 `npx redocly` | Accept: `npx --no-install`, and the stale comment | F11f |
| R2-C-10 failed `AfterAll` can hang | Accept: kill the browser before throwing | F11f |
| R2-C-12 catalogue and pin | Accept: update the catalogue and the vite pin to what is built | F11f |
| R2-C-15 gaps in the exit run's cover | Accept: fail when the filter matches nothing, assert the expected counts, axe in the doubled-text passes, the sign-in page in the layouts | F11f |

### 5.3 Notes

| Finding | Decision | Slice |
|---|---|---|
| R2-A-12 numbers echoed as sent | Accept: store the parsed number, bound `amountMinor` | F11a |
| R2-A-15 path parameters decoded twice | Accept | F11a |
| R2-A-17 two flag effects | Accept: document in section 10 | F11b |
| R2-B-12 unit test in the Cucumber globs | Accept | F11d |
| R2-B-14 diagnostics miss the refused response | Accept: record the response before validating; add the page URL for UI scenarios | F11d |
| R2-B-15 dead `keepToken` | Accept | F11d |
| R2-B-16 stale comment | Accept | F11d |
| R2-B-18 no positive control for the redirect | Accept: a same-site row | F11d |
| R2-C-16 tab bar covers the foot of pages | Accept | F11e |
| R2-C-17 SHA comments name the major only | Accept: the full tag | F11f |
| R2-C-18 `refreshUser` inside the save | Accept: move it out; the per-route title is deferred | F11e |
| R2-B-13 `X-Correlation-Id` in the contract | **Defer** to the backlog | backlog |
| R2-B-17 match `failsWith` against the message | **Defer** to the backlog | backlog |
| R2-B-19 refuse `skip`/`todo` in the registry check | **Defer** to the backlog | backlog |
| R2-A-16 redundant assertion | No action | none |
| R2-B-20 two narrow negative steps | No action | none |
