# CDS-48: independent review of the Phase 5 additions

| | |
|---|---|
| Date | 2026-10-22 |
| Commit reviewed | `1f87a063b31756c3b8dc9f78649e0881b01950d0` (`main` at the merge of the CDS-48 plan, #129) |
| Plan | `DOCS/implementation-plans/2026-10-21_cds-48-phase-5-review.md` (decisions D1 to D7 as recommended, 2026-10-22) |
| Reviewers | Two fresh-context general-purpose agents, in parallel, each on the Opus model (decision D7 option 2), blind to the author's conclusions (D1); each worked in its own copy of the commit made with `git archive`, without history and without the decision briefs, backlog, plans, logs, walkthroughs, earlier reviews and CHANGELOG |
| What they could run (D3) | The existing checks, the public build and mutation probes in the copy; read-only requests to the project's public pages and to CI run logs and artifacts. No pushes, no workflow runs |
| Practical notes sent after launch | Each reviewer was told the ports to use (A 4700 and 4701, B 4800 and 4801), because both ran the harness on one machine. Nothing else was said to them |
| Run time | Reviewer A 24 minutes, reviewer B 33 minutes |

## 1. The prompts and their SHA-256

Each reviewer was given a short instruction to read its prompt file and follow it. The files are reproduced in sections 2 and 3 exactly as they were given, with the copy path and the commit filled in.

```
bef9e565260b2bcc6bf98ab4a1a241a8879d68ced2ba11c41d3bd6687f12dc5a  prompt_a.md  (9355 characters)
1a326f200948d732c16350f512f250707b45d84495e003a59073df795d8c766f  prompt_b.md  (9026 characters)
```

## 2. Prompt for reviewer A (verbatim)

``````markdown
You are an independent code reviewer with fresh context. You did not write any of this code, and you have not been told what its author concluded about it. Your job is to find where the code, the checks that test it, and the documents disagree, and where a check would pass when it should fail. You do not fix anything.

## The project

`credit-dashboard-sut` is a system under test built for a test automation portfolio: a fictional UK credit-health dashboard (an ASP.NET Core service and a React UI) with a Serenity/JS + Playwright + Cucumber test harness. It carries 30 deliberately seeded defects ("bug flags"), switched on and off through test control. The project's stated aim is that every flag turns at least one committed automated check red **for its stated reason**, and that the evidence for this is produced by CI, published, and trustworthy. Your review is of the evidence-producing machinery and the code added for it, not of the business behaviour of the service.

## Where the code is

A copy of the repository at commit `1f87a063b31756c3b8dc9f78649e0881b01950d0` is at `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\review_090505\copy_a`. It has no git history, and the project's decision briefs, backlog, plans, logs and earlier reviews have been removed from it on purpose. Work only in that copy.

## What you may and may not do

- You may read anything in the copy, and run anything in the copy: install dependencies from the project's own lock files (`npm ci` in `packages/api-client`, `demo-apps/demoapp001-react-ui`, `test-harnesses/harness-serenity` and the repository root's `fixtures`; `dotnet` restore and test for the service), run the existing checks (`README.md` lists them), build the UI, and write mutation probes of your own (change a copy of a file, run a check, say what it did). Playwright's Chromium may be installed with the harness's own `npx playwright install chromium`.
- You may make read-only requests to the project's own public pages (`https://gbrooks1970.github.io/credit-dashboard-sut/` and under it), and read CI run logs and artifacts of the GitHub repository `GBrooks1970/credit-dashboard-sut` with read-only `gh` commands (`gh run list`, `gh run view`, `gh run download`, `gh api` with GET only).
- You must **not** write to anything outside `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\review_090505\copy_a` and your own scratch folder, push, open or edit pull requests, trigger or cancel workflow runs, or change any setting. You must not read other folders of the machine to learn about the project's history or the author's opinions.
- Some things cannot be run where you are (the Serenity BDD report needs Java; the visual baselines are Linux CI images, so the visual check refuses to run on a Windows machine except in its local-try mode). For those, read the code and the CI logs, and say what you could and could not verify.

## Sources of truth

- `DOCS/.architecture/openapi.yaml` (the contract).
- `DOCS/.design/`: `ui-specification.md` (sections 8 and 9 above all), `harness-design.md` (sections 25 to 38), `ui-feature-profile.md`, `api-specification.md`.
- `DOCS/step-glossary.md`, `features-shared/` (the Gherkin scenarios).
- `DOCS/decision-register.md`: the entries DR-064 to DR-067 state what the work claims to be; check the code against them.
- `README.md`.

## Severity

- **Blocker**: a claim the project makes is false; a check that passes when it should fail, or fails for the wrong reason, in a way that makes the evidence wrong; something sensitive could be published or exposed; a defect in what is deployed.
- **Change**: a divergence between code, a check and a document that should be fixed; a weakness that is real but does not make the evidence wrong today.
- **Note**: an observation, a risk, or something worth knowing that needs no change.

## Report format

Your final message is your report, in Markdown, and nothing else. Write in en-GB. Do not use em dashes or exclamation marks.

1. A header line: the commit, the date you reviewed, and what you ran.
2. A table of your checks (the IDs below): for each, what you examined, **how many items** you examined, and **how many findings**. A check with no findings is accepted only with its count of items examined.
3. The findings. Each has: an ID (`A-nn`), a severity, the file and line, **both sides quoted** (what the code, check or document says, and what it contradicts or fails to do), why it matters, and a suggested fix. Do not report the same issue twice; group repeats under one ID with their locations.
4. A list of what you ran, with the result of each (command and outcome, briefly), and every mutation probe you made and what happened.
5. A closing paragraph: what you could not examine, and why.

Be specific and be sceptical. A finding you could not reproduce or cannot quote both sides of is a Note at most. Do not pad the report with praise or summaries of how the code works.

## Your area: the flags, their proof, and the UI and service changes (finding IDs `A-nn`)

### Material

- `fixtures/bug-flags.json` (the registry of the 30 flags and what is meant to catch each), `fixtures/schema-check.mjs`.
- The UI: `demo-apps/demoapp001-react-ui/src/flags.tsx` and every place that reads a flag (`flagOn(`), `src/pages/**`, `src/components/**`, `src/format.ts`, `src/safeRedirect.ts`, `src/problem.ts`, `src/layout/Layout.tsx`, `src/flags.test.tsx`, `scripts/public-build-guard.mjs` and its test.
- The service: `demo-apps/demoapp001-dotnet-api/CreditDashboard.Api/Control/Flags.cs`, `Control/Defects.cs` and the routes that call them; the service tests that cover flags.
- The harness: `test-harnesses/harness-serenity/src/flags/` (the proof runner `prove-flags.ts`, the pure judging in `verdict.ts`, the reset in `reset.ts` and their tests), `src/exit/` (`exit-checks.ts`, `semantic-rules.ts`, `targets.ts`), `scripts/run.mjs`.
- The scenarios and component tests the registry names as catchers.

### Checks

- **A1 The registry and what "caught for the stated reason" means.** For each of the 30 entries: is the named catcher (a scenario, an exit check, a component test) one that fails because of that flag's defect and not for some other reason; is the recorded `failsWith` text specific enough that another defect could not produce it, and not printed by a run with the flag off; could the catcher be satisfied by something else changing; is each entry's `status` honest; do the second catchers (visual checks) add anything. State the count of entries you examined and how you judged each.
- **A2 The flag implementations.** For each flag implemented in the UI (21) and in the service (9): the defect branch is inside a test-build-only guard, "flag off" leaves behaviour exactly as specified, the flag does only what its registry entry says, and the way the UI learns the flags (test control, a key in browser storage) cannot be reached by an ordinary visitor.
- **A3 The public build.** Build the UI without the test-build variable. Inspect the built bundle for any flag name, defect branch, test-control call, debug panel, control-key handling or other test code. Then read `scripts/public-build-guard.mjs` and its test: does it look for the right things, is its list of strings complete for the flag branches that exist now, and can a flag branch survive into the public bundle without the guard noticing. Report what the bundle contains.
- **A4 The exit checks and the semantic rules.** The seven rules in `src/exit/semantic-rules.ts` and the axe-core passes: for each rule, a page or state that has the defect and the rule misses (false negative), and a page that is fine and the rule flags (false positive). Use probes: change a copy of the UI so it has the defect, run the exit run for that target (`CDS_EXIT_ONLY`), and say what happens. Also: do the exit checks scan the pages and states they say they scan (the target list against the pages of the UI specification), and is the expected size assertion sound.
- **A5 The behaviours built for flags.** The summary expander (a summary over 280 characters is cut at a word with a "Read more" control) and the unsaved-name warning on the profile page (leaving by an in-app link with an unsaved preferred name asks first): correctness against the UI and My Profile specifications, keyboard and screen-reader behaviour, edge cases (empty, exactly 280, a long single word, focus, repeated clicks), and whether their component tests assert the behaviour or only that code ran.
- **A6 The proof runner and its verdicts.** `prove-flags.ts`, `verdict.ts` and `reset.ts`: can a flag be reported as caught when it is not, or as not caught when it is; does the "something ran" guard hold for every catcher kind; the timeouts and process handling; the reset after each flag (a retry on a dropped connection, a named stop with the end of the service log); the visual-check catcher kind; and `scripts/run.mjs` (ports, signals, limits, the switch that decides which runs write the Serenity JSON). Probe the runner with a deliberately wrong registry entry in your copy and say what it reports.

Use the prefix `A` for your findings.
``````

## 3. Prompt for reviewer B (verbatim)

``````markdown
You are an independent code reviewer with fresh context. You did not write any of this code, and you have not been told what its author concluded about it. Your job is to find where the code, the checks that test it, and the documents disagree, and where a check would pass when it should fail. You do not fix anything.

## The project

`credit-dashboard-sut` is a system under test built for a test automation portfolio: a fictional UK credit-health dashboard (an ASP.NET Core service and a React UI) with a Serenity/JS + Playwright + Cucumber test harness. It carries 30 deliberately seeded defects ("bug flags"), switched on and off through test control. The project's stated aim is that every flag turns at least one committed automated check red **for its stated reason**, and that the evidence for this is produced by CI, published, and trustworthy. Your review is of the evidence-producing machinery and the code added for it, not of the business behaviour of the service.

## Where the code is

A copy of the repository at commit `1f87a063b31756c3b8dc9f78649e0881b01950d0` is at `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\review_090505\copy_b`. It has no git history, and the project's decision briefs, backlog, plans, logs and earlier reviews have been removed from it on purpose. Work only in that copy.

## What you may and may not do

- You may read anything in the copy, and run anything in the copy: install dependencies from the project's own lock files (`npm ci` in `packages/api-client`, `demo-apps/demoapp001-react-ui`, `test-harnesses/harness-serenity` and the repository root's `fixtures`; `dotnet` restore and test for the service), run the existing checks (`README.md` lists them), build the UI, and write mutation probes of your own (change a copy of a file, run a check, say what it did). Playwright's Chromium may be installed with the harness's own `npx playwright install chromium`.
- You may make read-only requests to the project's own public pages (`https://gbrooks1970.github.io/credit-dashboard-sut/` and under it), and read CI run logs and artifacts of the GitHub repository `GBrooks1970/credit-dashboard-sut` with read-only `gh` commands (`gh run list`, `gh run view`, `gh run download`, `gh api` with GET only).
- You must **not** write to anything outside `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\614cc4d6-8c11-49de-b232-4e3e3ccc1b6e\scratchpad\review_090505\copy_b` and your own scratch folder, push, open or edit pull requests, trigger or cancel workflow runs, or change any setting. You must not read other folders of the machine to learn about the project's history or the author's opinions.
- Some things cannot be run where you are (the Serenity BDD report needs Java; the visual baselines are Linux CI images, so the visual check refuses to run on a Windows machine except in its local-try mode). For those, read the code and the CI logs, and say what you could and could not verify.

## Sources of truth

- `DOCS/.architecture/openapi.yaml` (the contract).
- `DOCS/.design/`: `ui-specification.md` (sections 8 and 9 above all), `harness-design.md` (sections 25 to 38), `ui-feature-profile.md`, `api-specification.md`.
- `DOCS/step-glossary.md`, `features-shared/` (the Gherkin scenarios).
- `DOCS/decision-register.md`: the entries DR-064 to DR-067 state what the work claims to be; check the code against them.
- `README.md`.

## Severity

- **Blocker**: a claim the project makes is false; a check that passes when it should fail, or fails for the wrong reason, in a way that makes the evidence wrong; something sensitive could be published or exposed; a defect in what is deployed.
- **Change**: a divergence between code, a check and a document that should be fixed; a weakness that is real but does not make the evidence wrong today.
- **Note**: an observation, a risk, or something worth knowing that needs no change.

## Report format

Your final message is your report, in Markdown, and nothing else. Write in en-GB. Do not use em dashes or exclamation marks.

1. A header line: the commit, the date you reviewed, and what you ran.
2. A table of your checks (the IDs below): for each, what you examined, **how many items** you examined, and **how many findings**. A check with no findings is accepted only with its count of items examined.
3. The findings. Each has: an ID (`B-nn`), a severity, the file and line, **both sides quoted** (what the code, check or document says, and what it contradicts or fails to do), why it matters, and a suggested fix. Do not report the same issue twice; group repeats under one ID with their locations.
4. A list of what you ran, with the result of each (command and outcome, briefly), and every mutation probe you made and what happened.
5. A closing paragraph: what you could not examine, and why.

Be specific and be sceptical. A finding you could not reproduce or cannot quote both sides of is a Note at most. Do not pad the report with praise or summaries of how the code works.

## Your area: the visual check, the report and site, CI, and the documents (finding IDs `B-nn`)

### Material

- The visual check: `test-harnesses/harness-serenity/src/visual/` (`cases.ts`, `visual.spec.ts`, `playwright.config.ts` and the tests), `src/exit/targets.ts` (shared with the exit checks), the 32 baseline images in `test-harnesses/harness-serenity/visual-baselines/`, and `scripts/run.mjs` where it handles `visual`.
- The report: `src/report/` (`checks.ts`, `site.ts`, `switch.ts` and their tests), `src/support/serenity-crew.ts`, `scripts/report.mjs`, `scripts/check-report.ts`, `scripts/check-site.ts`, and the hooks in `src/api/hooks.ts` and `src/ui/hooks.ts`.
- CI: `.github/workflows/ci.yml`, `visual.yml`, `visual-baselines.yml`, `pages.yml`.
- The documents: `README.md`, `DOCS/.design/harness-design.md` sections 25 to 38, `DOCS/.design/ui-specification.md` sections 8 and 9, and `DOCS/decision-register.md` DR-064 to DR-067.

### Checks

- **B1 The visual check.** The 32 cases (eight pages, 375 and 1280 px, light and dark): do the baseline images show what the case names claim (open them and look; are the pages in the state described, in the right theme, at the right width); the tolerance (a colour distance of 0.2 and no pixel allowed beyond it) and what it cannot see (find a change a user would notice that it does not catch, and one that it flags although nothing a user would notice changed); the frozen service clock; the baseline-folder guard (a missing baseline, an extra file); the Linux-only refusal and the local-try mode; whether the pages share state between cases in a way that makes a result depend on order; and whether the shared target list could make the visual check and the exit checks drift apart.
- **B2 The report and its checks.** `checks.ts` and `check-report.ts`: can a failed, skipped, pending, errored or missing execution pass; are Scenario Outline rows counted correctly; can the expected counts (60 and 59) be fooled; what in a published file could be sensitive beyond the control key and the token shapes the check looks for (usernames, passwords, personal-looking data, internal paths, machine names, tokens in other shapes); the Serenity crew and the switch that makes only a whole `api` or `ui` run write the JSON (can any other path empty or overwrite it); `report.mjs` (Java handling, pinned CLI, copying the two profiles together). Probe with real Serenity JSON you produce by running the suites in your copy.
- **B3 The site and its deployment.** `site.ts` and `check-site.ts` (what the published folder may contain; can the stamp be wrong; can something other than the board and the report be published), and the `site` and `deploy` jobs and the three other workflows: permissions at each level, how the token is used, what a pull request from a fork, a crafted branch name or a crafted file name could do (script injection through `${{ }}` expressions, artifact poisoning, dependency on untrusted input), action pins (by SHA, their ages), artifact retention, the `if:` and `needs:` conditions, concurrency, the environment, and what happens when a job fails or is skipped. Fetch the live site and check it against what the jobs claim.
- **B4 `ci.yml` as a whole.** The job graph and what a red job blocks; `if: always()` steps and what they can hide or leak; the time limits against measured durations (read recent run logs); whether anything a pull request can change could weaken a check without a visible failure.
- **B5 The documents against the code.** The README's counts and claims (run the checks and compare), the sections of the harness design against the code they describe, UI specification sections 8 and 9 against `fixtures/bug-flags.json`, and DR-064 to DR-067 against what was built. A statement that is false, stale, or unverifiable is a finding.

Use the prefix `B` for your findings.
``````

## 4. Report of reviewer A (verbatim, as delivered)

The report below is the reviewer's final message, unchanged except that the 2-space indent the harness adds to a hand-back has been removed.

# Review A: the flags, their proof, and the UI and service changes

**Commit** `1f87a063b31756c3b8dc9f78649e0881b01950d0` (copy without history). **Reviewed** 2026-10-22. **Ran:** UI `npm ci` and `npm run check` (public build), the guard and its tests, harness `npm ci`, unit tests and type check, the `@ui` open-redirect feature with the flag on, two exit runs with a modified UI, one proof run with a deliberately wrong registry, a browser probe against a test-build service, and read-only `gh` on CI runs 39731927297 (PR head `4e5bd32`) and 39487546650 (the run DR-067 cites). Ports 4700, 4701 and 4702 were used.

## Checks

| Check | What I examined | Items | Findings |
|---|---|---|---|
| A1 Registry and "stated reason" | Every entry in `fixtures/bug-flags.json`. For each catcher: what it asserts, whether `failsWith` is specific, whether a passing run could print it, and what any second catcher adds. CI table checked against the registry. | 30 entries, 34 catchers (4 second catchers) | 2 (A-01, A-02) |
| A2 Flag implementations | Every `flagOn(` site (21 UI flags). `Defects.cs`, `Flags.cs`, `Problems.cs:58`, `Accounts.cs:82` (9 service flags). How flags are read: `flags.tsx`, `FlagsMiddleware`, `PersonaStore.SetFlags`, `TestControl.SetBugs`. | 30 implementations, 4 read-path files | 1 (A-10) |
| A3 Public build | Built without `VITE_TEST_BUILD`: `dist/index.html`, one JS file (326 kB), one CSS file. Grepped the bundle. Read the guard (25 markers) and its test (29 cases). | 1 bundle, 25 markers against 21 UI flags | 1 (A-04) |
| A4 Exit checks and semantic rules | The 7 rules, the axe passes, 60 targets against the 15 catalogue pages, and the `EXPECTED` counts (consistent: 60 targets, 47 without `act`). Ran 2 exit probes. | 7 rules, 60 targets, 2 probes | 3 (A-05, A-06, A-13) |
| A5 Summary expander and unsaved-name warning | `SummarySection.tsx`, `format.ts shortened`, `ProfilePage.tsx:159-173`, the 5 related component tests in `flags.test.tsx`, the `shortened` unit cases, persona fixtures | 2 behaviours, 5 component tests, 7 personas | 3 (A-07, A-11, A-12) |
| A6 Proof runner | `prove-flags.ts`, `verdict.ts`, `reset.ts` and their tests, `scripts/run.mjs`, the `flags` job in `ci.yml`, the CI artifact. Ran 1 registry probe (3 entries wrong). | 6 files, 1 job, 1 probe | 4 (A-03, A-08, A-09, A-14) |

## Findings

### A-01 Blocker: the `open-redirect` flag never sends the browser off the site, and its catcher fails on a generic timeout
- **Code:** `demo-apps/demoapp001-react-ui/src/safeRedirect.ts:12`: `if (TEST_BUILD && flagOn('open-redirect')) return target || fallback;`. The result is passed to React Router's `navigate()` in `DetailFormPage.tsx:92`: `const goBack = () => navigate(safeRedirect(redirectUrl, fallback), { replace: true });`.
- **What it contradicts:**
  - Registry `fixtures/bug-flags.json` (open-redirect): effect "redirectUrl guard removed", `failsWith` (line 388) "Timeout of 5s has expired while waiting for <<detail-header>>.isPresent() to equal true".
  - The feature is titled "Return links stay on this site".
  - The UI specification places this flag in its security group.
- **What the probe showed:**
  - Test build, flag on, return addresses `https://evil.example/steal`, `//evil.example/steal` and `javascript:alert(1)`.
  - Each time, Cancel left the browser on `/data-capture/interestRate?...`. The page threw `pageerror External navigation is not allowed` (React Router refuses the address), and no request left the origin.
  - The `@ui` run with the flag on fails all 5 rows with the timeout above.
- **Why it matters:**
  - The defect as built is "Cancel does nothing". It is not an open redirect.
  - The recorded failure text is a plain timeout. A broken Cancel button, a broken detail page or a slow service would all print it.
  - So "caught for the stated reason" is not true for this flag, and the 30 of 30 claim (README, DR-067) counts it.
- **Fix:**
  - Make the defect branch leave the site the way an open redirect does, for example `window.location.assign(target)` for an absolute or protocol-relative target.
  - Make the catcher assert where the browser ended up, for example "the page's origin is not this site's", with that message as `failsWith`.

### A-02 Change: the proof accepts any `failsWith` substring, however generic
- **Code:** `verdict.ts:42`: `return run.output.includes(failsWith) ? 'failed-as-stated' : 'failed-for-another-reason';`. Nothing checks that the text is specific.
- **Probe (wrong registry in my copy):**
  - `range-stale` with `failsWith: "Expected"`.
  - `lost-edit` with name `"asks"` and `failsWith: "AssertionError"`.
  - `button-href` with its target changed to `payment history`.
  - Result: "range-stale scenario off: passes on: fails as stated" and "lost-edit component-test off: passes on: fails as stated"; `button-href` came out not caught (correctly).
  - The name `asks` matched and ran two tests, because Vitest's `-t` is unanchored (`prove-flags.ts:139`). The scenario name is anchored (`^...$`).
- **Same weakness in committed entries:**
  - The visual catchers' `failsWith` is just the image file name (`bug-flags.json:151` `account-list-creditcard-1280-light-actual.png`, `:175` `overview-1280-light-actual.png`). Playwright prints it for any pixel difference, whatever the cause.
  - `open-redirect` (A-01) is a timeout text.
  - `double-render` is "Received number: 6".
- **What it contradicts:** the README's "30 of 30 caught for the stated reason". DR-067: "Every condition in the gate's words is executable in CI and was shown able to fail".
- **Why it matters:** "for the stated reason" rests on the author choosing a specific text. The runner would accept a generic one, as it does for open-redirect.
- **Fix:**
  - Reject `failsWith` values that are too generic: a minimum length, a deny-list (`Expected`, `AssertionError`, `Timeout of`), and for scenarios, a required test id or value in the text.
  - Anchor `-t` (`^...$`) and require exactly one test to have run.
  - For visual catchers, also require the diff image or the diff count.

### A-03 Change: the proof's evidence keeps no catcher output, and the artifact the gate cites expires first
- **Code:**
  - `prove-flags.ts:209-212` writes only `{flag, verdict, catchers:[{name, kind, off, on}]}`. The artifact downloaded from run 39731927297 has no output and no `failsWith`.
  - `ci.yml:170`: "kept where a gate can cite it ... and as an artifact after the log has expired". `ci.yml:186`: `retention-days: 14`.
- **What it contradicts:**
  - The repository's log retention is 90 days (`gh api .../artifact-and-log-retention` returned `{"days":90}`), so the artifact expires 76 days before the log, the opposite of the comment.
  - DR-067 cites "the `flags` job's table, kept as the `bug-flag-proof` artifact ... CI run 39487546650". That artifact's `expires_at` is 2026-11-03T20:11:40Z.
  - The job log holds no catcher output either, so "as stated" cannot be checked after the run.
- **Fix:**
  - Write each catcher's off and on output, or the matched line and its context, into the artifact.
  - Set retention to 90 days, or commit the table with the gate record.
  - Correct the comment.

### A-04 Change: a flag call survives into the public bundle, and the guard cannot see it
- **Code:** `src/format.ts:63`: `return \`${count} ${count === 1 && !flagOn('plural') ? one : many}\`;` has no `TEST_BUILD &&` around it.
- **What the built `dist/assets/index-*.js` contains:**
  - `function pr(e){return!1}` and `` ${e===1&&!pr(`plural`)?t:n} `` (the plural defect branch, inert).
  - An inert `FlagsProvider` shell: `useEffect(()=>{},[])`.
  - No `__test`, no `cds.testControlKey`, no debug route, no other flag name.
- **What it contradicts:**
  - UI specification 6.8: "When the remaining UI flags are built (P3), each defect branch is written inside a constant `TEST_BUILD && ...` check, which the bundler removes from the public build". The bundle disproves this for `plural`.
  - The guard's own comment (`public-build-guard.mjs:15-17`) says `plural` and `double-render` "cannot be a marker", yet `double-render` is in `FLAG_MARKERS` (line 19).
  - Specification 6.8 lists 11 flag markers. The code has 20.
- **Gaps in the guard and its test:**
  - The guard test (`public-build-guard.test.mjs:80-87`) only checks that each marker is a UI flag with a hyphen. It does not check that every flag whose name has a hyphen is a marker, so a new flag left off the list would pass.
  - `useFlag` (`flags.tsx:59`), which the guard comment cites, has no caller.
- **Fix:**
  - Write `TEST_BUILD && flagOn('plural')` (and make `flagOn` itself compile away), so `pr(` and `plural` disappear.
  - Make the guard test assert that every UI flag whose name has a hyphen is a marker.
  - Update specification 6.8 and the guard comment.

### A-05 Change: two semantic rules miss the defect their flag claims to model (probes)
- **What the code checks:**
  - `semantic-rules.ts:35-36` compares `aria-valuenow` with the text. It never compares the drawn width.
  - `semantic-rules.ts:57` flags only empty cells.
- **What the registry says:** util-mismatch effect "Bar width differs from percentage text". chart-no-values effect "Chart points announced without values".
- **Probe 1:**
  - Copy of `UtilisationBar.tsx` changed so `util-mismatch` alters only the fill width.
  - Copy of `HistoryChart.tsx:118` changed so `chart-no-values` writes `n/a` instead of `''`.
  - Exit run, `CDS_EXIT_ONLY=overview`, `HARNESS_BUGS=util-mismatch,chart-no-values`: "exit checks: 2 axe scans and 6 layout checks; 0 problem(s)", exit 0.
  - The live page had `{"text":"6% used","now":"6","width":"13%","rows":["May 2026n/a",...]}`.
- **Why it matters:** the catches work only because the built flags also change `aria-valuenow` and blank the cells. The stated defects themselves are not detected.
- **Fix:**
  - Make `progress-value-matches-text` also compare the fill's computed width with `aria-valuenow`, clamped at 100.
  - Make `chart-table-has-values` require a number or the documented "No score".

### A-06 Change: `progress-name-matches-value` flags a good accessible name (probe)
- **Code:** `semantic-rules.ts:43-44`: every number in the name must equal the value.
- **Probe 2:**
  - Copy of `ReportSections.tsx:66` changed to the label `` `${...} utilisation: ${utilisation}% of a ${formatMoney(limit)} limit` ``.
  - Exit run, `overview`, no flags: exit 1, with "progress-name-matches-value: 'account-util-bar-creditcard' is named 'Credit cards utilisation: 6% of a £6,100 limit' but its value is 6" on every bar.
- **Why it matters:** a fuller, WCAG-sound name breaks the build. This also shows why the rule can catch `minor-units-label`: it catches any number.
- **Fix:** compare only the figures followed by `%` in the name.

### A-07 Change: the summary expander and the unsaved-name warning never run in a real browser
- **What the specification says:**
  - Specification 6.2 states "A summary over 280 characters is cut ... `summary-toggle` ... shows the whole text and folds it again".
  - Specifications 4.5 and 9 require axe "on every page and every state that shows something new".
- **What the fixtures and checks do:**
  - The longest persona summary is 77 characters (`fixtures/personas/*.json`; drilldown 70). `summary-toggle` therefore never appears in the exit scans, the layouts, the visual checks or any `@ui` scenario.
  - `window.confirm` on the profile page is exercised only through a jsdom mock.
- **Why it matters:** both behaviours, and their accessibility, are verified only in jsdom.
- **Fix:**
  - Add a persona override, or a target with a long summary, and scan it folded and open.
  - Add one `@ui` scenario, or an exit target, for the unsaved-name question.

### A-08 Change: the proof's visual catchers run on an unpinned runner
- **The two sides:**
  - `ci.yml:132`: `flags: runs-on: ubuntu-latest`.
  - `visual.yml:37`: `runs-on: ubuntu-24.04`, and DR-067 says "its baselines depend on the runner image (pinned to `ubuntu-24.04`)".
- **Effect:**
  - The flags job runs the `util-mismatch` and `currency-format` visual catchers against those baselines. The job log shows "Image: ubuntu-24.04" today.
  - When `ubuntu-latest` moves, those catchers' flag-off runs will fail, and `verdictOf` reports `false-alarm`. The proof then goes red with no defect.
- **Fix:** pin the flags job to `ubuntu-24.04`.

### A-09 Change: time limits and process handling around the proof
- **Limits:**
  - `run.mjs:50`: "flags 60 min ... so a hung run ends with a message, not a cancelled job". But `ci.yml:133` has `timeout-minutes: 30`, so the job is cancelled first. The run took 17 minutes in run 39731927297.
  - The per-catcher limit is 240 s (`prove-flags.ts:97`), run twice for 34 catchers. The worst case is far beyond either limit.
- **Process handling:**
  - `spawnSync(..., killSignal: 'SIGKILL')` kills only the direct child. A timed-out Cucumber run leaves its Chromium behind.
  - While `prove-flags` is blocked in `spawnSync`, the `SIGTERM` that `run.mjs` forwards ends `prove-flags` but not the catcher it started.
- **Fix:**
  - Set the job limit above the run limit, or the flags run limit below 30 minutes.
  - Run catchers with `spawn` in a process group and kill the group.

### A-10 Note: registry effects that do not describe what is built
- `double-render` (`bug-flags.json:243`): "List rendered twice during route change". The code doubles the list permanently (`ReportChanges.tsx:57`, `ReportChangesPage.tsx:80`).
- `toggle-label` (`:327`): "'See less' never flips back". The labels are "Show fewer" and "Show all N".
- `util-mismatch`: "Bar width differs" (see A-05). The code changes both value and width.
- No flag-off path differs from the specification. All 21 UI branches are behind `TEST_BUILD`. The 9 service flags can only be set through `/__test/bugs`, which is absent without `TEST_CONTROL`.

### A-11 Note: summary expander edge cases
- **Long single word:** `shortened` (`format.ts:35-36`) falls back to `slice(0, limit)` when there is no space. A summary that is one long word is then cut mid-word, which looks the same as the `truncate-summary` defect.
- **Surrogate pairs:** lengths are UTF-16 code units, so a cut can split a surrogate pair.
- **Tests and markup:**
  - The toggle has `aria-expanded` but no `aria-controls`, and no test asserts `aria-expanded`.
  - The component test asserts a word boundary at or before 280. "Last whole word" is covered only by the `shortened` unit test (limit 12). Exactly 280 is covered only by the unit test.
- **Behaviour that is correct:** keyboard (a native button), repeated clicks and empty or short text.

### A-12 Note: unsaved-name warning edge cases
- `ProfilePage.tsx:161-173` catches only `a[href]` clicks.
- The browser's Back button leaves without asking. The specification says "a link clicked", so this is outside what it requires, but it is a gap.
- `btn-account` (a link to the same page) asks.
- Ctrl-click to open a new tab asks, and refusing it blocks the tab.
- `changed = draft !== stored` counts a trailing space as a change, although the save trims it.
- The component tests assert behaviour (the question asked, the page kept, the value kept, no question when nothing has changed), not merely that code ran.

### A-13 Note: other blind spots in the rules
- `decorative-image-empty-alt` trusts the page's own `data-decorative` mark. A defect that drops the mark passes.
- `no-placeholder-names` reads `aria-label` only, not `aria-labelledby` or `alt`.
- `form-controls-follow-text-size` has no flag or probe that shows it can fail.
- The `EXPECTED` size assertion checks counts, not identities: swapping one target for another keeps 124 and 288.

### A-14 Note: component catchers can time out under load
- Locally, `npm run check` timed out 3 of 208 tests at Vitest's 5 s default, the first test in each of 3 files, while another harness was running on the machine.
- A component-test catcher's flag-off run that times out is judged `failed-for-another-reason`, giving `false-alarm`, with no retry.
- **Fix:** pass `--testTimeout` in `prove-flags.ts`.

## What I ran

| Command or probe | Result |
|---|---|
| `npm ci` in `packages/api-client`, `demo-apps/demoapp001-react-ui`, `fixtures`, `test-harnesses/harness-serenity`; `npx playwright install chromium` | All succeeded |
| `npm run check` in the UI, `VITE_TEST_BUILD` unset | Type check passed. Vitest: 205 passed, 3 timed out at 5 s (load) |
| `vite build`, `node --test scripts/public-build-guard.test.mjs`, `node scripts/public-build-guard.mjs` | Built. Guard tests 29 of 29 passed. Guard: "holds none of 25 test-only markers" |
| Grep of `dist/assets/*.js` | `plural` 1 hit (`pr(\`plural\`)`). `flagOn`, `__test`, `testControlKey`, `debug`, `Accessible label`, `Profile header image`, service flag names: 0 hits |
| Harness `npm run test:unit`, `npm run typecheck` | 54 of 54 passed; type check clean |
| `dotnet test CreditDashboard.sln -c Release` | Aborted: testhost could not start ("The filename or extension is too long", Windows path length). Not verified locally; CI run 39731927297 `Verify` passed |
| `HARNESS_BUGS=open-redirect node scripts/run.mjs ui security/open-redirect` | Exit 1. 5 rows failed on the `detail-header` timeout; the positive control passed |
| Probe `probe.mjs redirect` (service on 4702, test build), flag on and off | On: stayed on the form, `pageerror External navigation is not allowed`, no outbound request. Off: fallback to `/account/acc_ddcc01` |
| Exit probe 1: width-only `util-mismatch` plus `n/a` cells, `CDS_EXIT_ONLY=overview` | Exit 0, 0 problems. The live page showed width 13% against text 6%, and `n/a` cells |
| Exit probe 2: label with a money figure, no flags | Exit 1, `progress-name-matches-value` on 5 bars |
| Registry probe: `node scripts/run.mjs flags range-stale button-href lost-edit` with wrong entries | `range-stale` and `lost-edit` "fails as stated"; `button-href` not caught; "2 of 3 caught", exit 1 |
| `gh run list/view/download`, `gh api` (GET) | Flags job log on `4e5bd32`: 30 of 30, image ubuntu-24.04. Artifact holds verdicts only. DR-067's artifact expires 2026-11-03. Log retention 90 days |

Every modified file was restored afterwards (checked with `diff`), and the probe service on 4702 was stopped.

## What I could not examine

- **Service tests:** they would not start here because of the Windows path-length limit, so I relied on CI and on reading `FlagTests.cs` coverage (all 9 service flags are named there).
- **Visual checks and the visual catchers:** these need Linux CI baselines and were not run. I judged them from code and the CI log.
- **Serenity report:** this needs Java and was not built.
- **Full flag proof:** I ran it for 3 flags only, not all 30.
- **CI for the reviewed commit:** the run for `1f87a063` was still in progress, so I used the PR run on `4e5bd32`. With no git history in the copy, I could not confirm that those two commits have the same content.
- **Production UI:** I did not inspect any deployed UI, because Pages publishes only the board and the report.

## 5. Report of reviewer B (verbatim, as delivered)

The report below is the reviewer's final message, unchanged except that the 2-space indent the harness adds to a hand-back has been removed. Its section numbers (2 to 5) are its own.

# Review B: the visual check, the report and site, CI, and the documents

**Commit** `1f87a063b31756c3b8dc9f78649e0881b01950d0`, the copy at `...\scratchpad\review_090505\copy_b`. **Reviewed** 2026-10-22, on Windows 11 with Node 24.18.0, .NET SDK 10.0.402 and no Java. HARNESS_PORT=4800 and HARNESS_OFF_PORT=4801 were used throughout. **What I ran:** the harness typecheck and unit tests; whole `api` and `ui` runs; a named-feature run; a whole `api` run with two flags on; `report` and `check:report`; `check:site` on an assembled folder; the visual check in refusal mode, in local-try mode, and in local-try `--update` mode; a local flag proof of the two visual-caught flags; Vitest for the UI; the fixture check; read-only `gh` calls and HTTP GETs against the live site. Ten mutation probes are listed in section 4.

## 2. Checks

| Check | What I examined | Items | Findings |
|---|---|---|---|
| B1 Visual check | `cases.ts`, `visual.spec.ts`, `playwright.config.ts`, `cases.test.ts`, `targets.ts`, `run.mjs` (visual paths), `prove-flags.ts` (visual catcher), the `schema-check.mjs` visual rules. Dimensions of all 32 baselines; 10 baselines opened and viewed. Three tolerance probes, two single-case-order runs, the refusal, local try, the guard, and the frozen clock (grepped the UI for `Date.now`/`new Date()`: none). | 32 baselines, 6 source files, 8 behaviours | 5 (B-02, B-04, B-05, B-08, B-09) |
| B2 Report and its checks | `checks.ts`, `switch.ts`, `serenity-crew.ts`, `check-report.ts`, `report.mjs`, `api/hooks.ts`, `ui/hooks.ts`, `diagnostics.ts`. The real JSON from my runs (33 + 44 files, 60 + 59 executions) and from a failing run; 6 mutation probes; 2 switch probes. The live report artefact (3,873 files) grepped for sensitive strings. | 8 files, 77 JSON files, 8 probes | 2 (B-06, B-07) |
| B3 Site and deployment | `site.ts`, `check-site.ts`, the `site`/`deploy` jobs, `visual.yml`, `visual-baselines.yml`, `pages.yml`. 10 action pins checked against their tags and dates (all match, all at least 2 months old). The `github-pages` environment policy (`main` only); workflow token default (`read`); branch protection (none). The live board (byte-identical to the repo file after CRLF normalisation), the stamp, `/report/`, and 8 paths that must not exist (all 404). 6 site probes. | 4 workflows, 2 files, 10 pins, 11 live URLs | 3 (B-03, B-06 shared, B-11) |
| B4 `ci.yml` as a whole | The job graph (6 jobs). 4 `always()`/`failure()` steps. Time limits against two main runs (39521511774, 39752641138). Artifact and log retention (repository: 90 days). Concurrency. | 6 jobs, 4 conditional steps, 2 runs | 2 (B-01, B-10) |
| B5 Documents against code | README claims (counts re-run: 54 unit tests, 60/59 executions, 33/44 files, 208 component tests, 124/288 from the CI log). Harness design sections 25 to 38 (15 sections). UI specification section 8 (16 rows) and section 9. Profile section 7 (7 rows) against `bug-flags.json` (30 flags). DR-064 to DR-067. | ~45 statements | 1 grouped (B-12) |

## 3. Findings

### B-01 Blocker: the proof table is not kept "after the log has expired"; the gate's cited evidence expires on 3 November 2026
- **Code (`.github/workflows/ci.yml` 170 and 186):** "The table the proof wrote, kept where a gate can cite it (CDS-45, P7a): in this run's summary, and as an artifact after the log has expired." The same step sets `retention-days: 14`.
- **Docs:** `harness-design.md` line 399 (section 37) says the `flags` job "kept that only in its log, which expires", and that the artifact fixes this. DR-067 cites the `bug-flag-proof` artifact of run 39487546650 as the gate's evidence.
- **Contradiction:** the repository's log retention is 90 days (`GET .../actions/permissions/artifact-and-log-retention` returns `{"days":90}`). The artifact expires first: run 39487546650's `bug-flag-proof` has `expires_at 2026-11-03T20:11:40Z`. I downloaded it today and it holds 30 flags, all `caught`.
- **Why it matters:** the durability claim is the reverse of the truth. In 12 days the gate's only machine-readable evidence is gone, while the log it was meant to outlive remains.
- **Fix:** keep the table somewhere durable. Options: commit the table with the gate record, attach it to a release, or publish it on the site. Raise the retention to 90 days in the meantime. Then correct the comment and section 37.

### B-02 Change: the 0.2 colour distance hides far more than the stated "one-channel colour change of 10 steps"
- **Code (`src/visual/playwright.config.ts` 27):** `threshold: 0.2, maxDiffPixelRatio: 0`.
- **Docs:** DR-067 and section 32 (line 362) give the check's only colour limit as "a one-channel colour change of 10 steps (`#0b5cad` to `#0b66ad`)".
- **Probe:** I set the light `--color-band-high` from `#b3261e` to `#b36b00` (`demo-apps/demoapp001-react-ui/src/styles.css` 18). That is the high-utilisation red bar drawn in the amber of the mid band, on the overview's Loans (83%) and Mortgages (84%) bars. I confirmed the built CSS held `band-high:#b36b00`. Result: **33 passed**, so all 32 images are unchanged in the check's eyes. A positive control with the same bars in `#1a7f4b` (green) failed 2 of 32, so the setup does detect a change.
- **Why it matters:** a user would read a red-to-amber change as "danger" becoming "warning". The recorded exception understates what the check cannot see. Hue shifts with a small luminance change pass.
- **Fix:** lower `threshold` (for example 0.05 to 0.1) and re-run the stability and probe set. Or record the limit in terms of hue and luminance, with this probe as the example.

### B-03 Change: the Visual workflow does not run when the data the pages show changes
- **Code (`.github/workflows/visual.yml` 14-24):** paths are only `demo-apps/demoapp001-react-ui/**`, `demo-apps/demoapp001-dotnet-api/**`, `test-harnesses/harness-serenity/**` and `visual.yml`.
- **What it misses:** the service serves the repository's `fixtures/personas/*.json` and `fixtures/users.json` (`CreditDashboard.Api.csproj` 23-24, `Content Include="..\..\..\fixtures\personas\*.json"`). The UI depends on `file:../../packages/api-client` (UI `package.json` 17).
- **Docs:** README 69 and UI specification section 9 (line 334) say the check runs "when the UI, the service or the harness changes".
- **Why it matters:** a change to the drilldown persona, or to the client, changes every photographed page. Neither the pull request nor the push to `main` runs the check. The next unrelated harness change then fails, and the failure is blamed on the wrong change.
- **Fix:** add `fixtures/**` and `packages/api-client/**` to both `paths` lists, or drop the filter.

### B-04 Change: at 375 px the fixed tab bar is painted mid-image, so a band of each tall page is never compared
- **Code (`src/visual/visual.spec.ts` 50):** `toHaveScreenshot(c.file, { fullPage: true })`. `styles.css` 87 says: "The fixed tab bar sits over the foot of a long page below 768px".
- **Evidence:** in `overview-375-light.png` (375x3791) and `profile-375-light.png` (375x1184), the tab bar is drawn at about y 763 to 811, the viewport position. It covers the summary feedback buttons on the overview, and the Email and Mobile tiles on the profile. The real foot of the page shows no bar.
- **Why it matters:** about 50 px of every 375 px image taller than the viewport (overview, account detail, profile, list) is hidden behind an unchanging bar. What lies under it, and the bar's real place at the foot, are not compared.
- **Fix:** hide or unfix the bar for the full-page shot (Playwright `stylePath` or `mask`), and photograph the bar in a viewport-only shot. Then refresh the baselines.

### B-05 Change: the profile baselines freeze a visible text defect as the expected state
- **Baselines:** in `profile-1280-dark.png`, `profile-375-light.png` and the other profile images, every tile runs its label into its value. The tiles read "Emailalex.example@example.com", "Mobile•••• •••789", "Address7 Example Street", "EmploymentSelf employed" and "FinancesAdded". At 375 px they break mid-word ("EmploymentS / elf employed", "FinancesAdde / d").
- **Source:** `ProfilePage.tsx` 240-269 has `<strong>Email</strong>` directly followed by the value. `styles.css` 158 makes the tile `display: block` but gives no separation between the inline children.
- **Case claim (`cases.ts` 5):** the pages are "settled, no error, flags off".
- **Why it matters:** the visual check now enforces this rendering. A fix would fail 8 images and would need a baseline refresh to land.
- **Fix:** separate the label from the value (block, or a visible separator), check what accessible name the tiles end up with, and refresh the 8 profile baselines in the same pull request.

### B-06 Change: the site and report scans do not cover "any file", and anything under `report/` passes as "the report"
- **Code:**
  - `scripts/check-site.ts` 15 and 24 read only `html|json|js|css|txt|csv|xml|svg|map`. Any other file is listed with text `''`.
  - `src/report/site.ts` 45 accepts any path that `startsWith('report/')`.
  - `scripts/check-report.ts` 97 uses a similar list that leaves out `svg`.
  - `src/report/checks.ts` 24-27 knows only `Bearer …` and `eyJ…` tokens. The service issues `"tok_" + 32 hex` (`Control/Authentication.cs` 38).
- **Docs:** `site.ts` 2 says "nothing else in the folder, and no control key or token in any file". DR-066 says the same.
- **Probes:** a folder with `report/notes.log` holding `harness-run-key` passed. So did `report/secrets.env` holding the key, `report/openapi.yaml`, `report/x.md` holding `Bearer abcdefgh`, and `report/.git/config`. Each run printed "nothing else, no key or token". A Serenity JSON step holding `{"token":"tok_0123456789abcdef0123456789abcdef"}` passed `check:report`, and so did the key in base64.
- **Why it matters:** the guard's wording is stronger than the guard. The only real secret today is the synthetic key, but the check is what the publishing rests on.
- **Fix:**
  - Read every file that is not a known binary type as text.
  - Allow-list the report's own file types under `report/`.
  - Add `tok_[0-9a-f]{32}` to `TOKEN_SHAPES`.
  - Reword the claim to match whatever is kept.

### B-07 Change: the execution counts are a sum, so a dropped scenario plus one added outline row still passes
- **Code:** `src/report/checks.ts` 62 compares `executions !== input.expected[profile]`. `scripts/check-report.ts` 12 sets `EXPECTED = { api: 60, ui: 59 }`.
- **Docs:** section 34 says the count stops "a scenario that dropped out would otherwise end green".
- **Probe:** with real JSON, I removed one plain scenario file and duplicated one row of an outline. `check:report` printed "60 @api and 59 @ui executions, all successful".
- **Why it matters:** a pull request that adds an example row and, in the same change, loses a scenario (a moved tag or path) keeps both numbers and passes.
- **Fix:** compare the set of scenario names, and the row count per outline, against a committed manifest. Or derive the expected set from the feature files of each profile.

### B-08 Change: a visual-check catcher's "stated reason" is any change to the image, so it credits whichever flag changes that page
- **Registry and checks:** `fixtures/bug-flags.json` sets `failsWith` to the image name (for example `"overview-1280-light-actual.png"`). `schema-check.mjs` 236 requires only `endsWith('-actual.png')`. Playwright prints that name for any mismatch.
- **Docs:** README and DR-067 say "30 of 30 caught for the stated reason". Section 30 says "A catch is for the stated reason only … so a flag cannot be credited with the other's failure".
- **Probe:** I gave `duplicate-nav` the overview-1280-light visual catcher and ran `VISUAL_LOCAL_TRY=1 node scripts/run.mjs flags duplicate-nav`. Output: "visual-check off: passes on: fails as stated", then "1 of 1 implemented flags caught for the stated reason".
- **Why it matters:** today both visual-caught flags also have a catcher tied to their reason (exit check, scenario), so the verdicts stand. But the visual credit is not reason-specific, unlike `idor` and `problem-json-missing`.
- **Fix:** do not count a visual catcher alone towards "caught for the stated reason". Or document it as a "page changed" catch.

### B-09 Change: the flag proof compares visual catchers on `ubuntu-latest`, against baselines pinned to `ubuntu-24.04`
- **Workflows:** `ci.yml` 132 (`flags` job) uses `runs-on: ubuntu-latest`. With `CI=true`, `prove-flags.ts` 119 runs the visual catchers. `visual.yml` 7-8 says: "`ubuntu-latest` moves to a new image (Ubuntu 26 from 2026-10-19). Move the pin only together with a refresh of the baselines."
- **Evidence:** today's `flags` log (run 39752641138) still shows `Image: ubuntu-24.04`, so the setup works for now.
- **Why it matters:** when `ubuntu-latest` moves, the off-runs of `util-mismatch` and `currency-format` will fail on font rendering. They become `false-alarm`, and the proof goes red for a reason unrelated to the flags.
- **Fix:** pin the `flags` job to `ubuntu-24.04` with the same comment, or move the visual catchers into `visual.yml`.

### B-10 Change: the run limits cannot fire before the job limits, and a timed-out proof keeps nothing
- **Code:** `scripts/run.mjs` 149 sets `{ api: 10, ui: 15, exit: 15, visual: 15, flags: 60 }` minutes. Its header (lines 12-13) says this is "so a hung run ends with a message, not a cancelled job".
- **Job limits:** `flags` 30, `ui` 15 (which also runs installs, `ui` and `exit`), `visual` 15, `specification` 10 (with `api` inside `verify`).
- **Proof writing:** `prove-flags.ts` 158 writes the table only at the end.
- **Workflow:** `ci.yml` 191 uploads service logs only `if: failure()`. A job-level timeout is a cancellation, so that step does not run.
- **Docs:** section 37 says "Both steps run when the proof fails or stops early … so a red run shows the flags judged so far".
- **Measured:** `flags` took 1,038 s (21 Oct) and about 1,015 s (22 Oct), 57% of 30 minutes. `ui` took 271 s and 350 s. `Verify` took 131 s and 118 s.
- **Why it matters:** in CI every hang ends as a cancelled job. A hung proof leaves "The proof wrote no table" and no service log, which is the CDS-46 situation the change was meant to cure.
- **Fix:** set each run limit a margin below its job's `timeout-minutes` (for example flags 25). Write the table after each flag. Use `if: failure() || cancelled()` for the log upload.

### B-11 Change: the baselines workflow exposes a write token to every step, including dependency installs and branch code, on an unprotected `main`
- **Code (`.github/workflows/visual-baselines.yml` 97-98 and 112):** `permissions: contents: write` for the whole workflow, and `persist-credentials: true` at checkout. `npm ci` (three packages) and the harness then run with the token in `.git/config`.
- **Repository state:** `main` has no branch protection or rulesets (`GET .../branches/main/protection` returns 404, `GET .../rulesets` returns `[]`).
- **Docs:** the header says "It never commits to main".
- **Why it matters:** that holds only for the workflow's own script. Any install script or harness code on the dispatched branch can push to `main` with the token.
- **Fix:** check out with `persist-credentials: false`. Upload the images as an artifact, and push from a second job that has `contents: write`, checks out with credentials, and runs no project code. Consider protecting `main`.

### B-12 Change: documents that are false or stale against the code
1. `README.md` 30 says "Decisions DR-001 to DR-066". DR-067 exists, and README 17 and 97 cite it.
2. `README.md` 35 says "The same two jobs prove every flag: the `flags` job's table …". The report comes from `Verify` and `UI`. The proof is a third job that the site does not depend on (section 36: "`deploy` does not wait for the flag proof").
3. `harness-design.md` 337 (section 31) says "… with the root text doubled (282 checks)". The code (`exit-checks.ts` 173, `EXPECTED = { scans: 124, layoutChecks: 288 }`) and CI ("124 axe scans and 288 layout checks") say 288.
4. `harness-design.md` 344 is "## 21. Exit-check catchers (CDS-41)", which repeats section number 21 (line 239) between sections 31 and 32.
5. `harness-design.md` 272 (section 25) still says "the 41 `@ui` scenarios", "37 scans" and "24 checks", with no note that section 31 supersedes them. The suite is 44 files and 59 executions.
6. `ci.yml` 201 says "Nothing is published by this job (P6c adds `publish`)". There is no `publish` job; the jobs are `site` and `deploy`.
7. `harness-design.md` 361 (section 32) and `ui-specification.md` section 9 say `VISUAL_LOCAL_TRY=1` "runs against throw-away images". It does not make them: `run.mjs` passes `--update-snapshots=none`. My first local-try run failed 33 of 33 with "A snapshot doesn't exist". It works only after `VISUAL_LOCAL_TRY=1 node scripts/run.mjs visual --update`, which no document mentions.
- **Fix:** correct each item. Add the `--update` first step to the README and section 32.

### Notes
- **N-1:** `deploy` does not wait for the flag proof or the Visual workflow (documented in section 36). This was observed today: run 39752641138 deployed at 09:11:57, and the proof finished at 09:21:51. A `main` commit that breaks the proof still publishes the report.
- **N-2:** `main` is unprotected, so every check is advisory. A pull request can change `EXPECTED`, `visual.yml` paths or catcher text alongside the code. The only defence is the diff.
- **N-3:** the stamp check is tautological. The `site` job writes `commit.txt` from `github.sha` and checks it against the same value. The check is also a substring test (`site.ts` 41): `commit: abc1234567` passed for `abc123`. It cannot be wrong today, because the artifact comes from the same run.
- **N-4:** `serenity-json-api` and `serenity-json-ui` are uploaded `if: always()`, and a failed scenario's diagnostics hold the last response headers and body. These are never scanned on the failure path. Only synthetic values are at stake.
- **N-5:** the published report holds `demo-only` 86 times. That is the documented demo password, and also the control key of the `npm run service` launch profile (README 67), both public. `report/build-info.html` shows the runner kernel ("Linux version 7.0.0-1017-azure"). Neither is sensitive.
- **N-6:** `report.mjs` pins the Serenity CLI by version (`4.3.4`, confirmed live) but not by checksum.
- **N-7:** `ci-${{ github.ref }}` with `cancel-in-progress: false` on `main` still lets GitHub cancel a pending run when a newer one queues. An intermediate `main` commit can go without CI.
- **N-8:** the switch decides by mode, not by flags. A whole run with `HARNESS_BUGS=rounding-down,mask-format` rewrote the folder with failing JSON. `check:report` caught it (7 problems).
- **N-9:** the "Linux-only" refusal tests `CI==='true'`, not the operating system.
- **N-10:** visual order and state. Single-case runs (the flag proof's `-g`) passed against images made by the full sequence, for 2 cases. A worker restart after a failure re-runs the file-level `beforeAll` (reset, flags, clock). I found no order dependence.
- **N-11:** the shared target list. Renaming a target fails `cases.test.ts` (run in `verify`). Changing a shared target's `ready` or `address` changes both checks together, by design. I found no drift path.

## 4. What I ran

| Command | Outcome |
|---|---|
| `npm ci` (client, UI, harness, fixtures); `npx playwright install chromium` | all exit 0 |
| `npm run typecheck`; `npm run test:unit` | 0; 54 tests, 54 pass (checks 10, site 8, switch 2, cases 6) |
| `node scripts/run.mjs api` | exit 0, 47 s, 60 executions, 33 JSON files |
| `node scripts/run.mjs ui` | exit 0, 123 s, 59 executions, 44 JSON files |
| `npm run report`; `npm run check:report` | 77 files gathered; Java absent, HTML skipped; "60 @api and 59 @ui executions, all successful" |
| `run.mjs api api/closed-accounts` | exit 0; folder listing hash unchanged |
| `HARNESS_SERENITY_JSON=on` direct Cucumber (service unreachable) | folder emptied to 2 files (by design); then restored by a whole run |
| `HARNESS_BUGS=rounding-down,mask-format run.mjs api` | exit 1; failing outline has top-level `FAILURE` and row results; `check:report` 7 problems |
| `run.mjs visual` (no CI) | refused, exit 1 |
| `VISUAL_LOCAL_TRY=1 run.mjs visual` (no images) | 33 failed ("snapshot doesn't exist") |
| `VISUAL_LOCAL_TRY=1 run.mjs visual --update`, then twice without | 33 passed each (20.6 s, 14.2 s, 13.9 s) |
| `VISUAL_LOCAL_TRY=1 run.mjs flags util-mismatch currency-format` | exit 0, 135 s; both visual catchers off pass, on fail as stated |
| `npx vitest run` (UI) | 208 passed |
| `npm run check` (fixtures) | 30 flags, 834 checks, 0 failures |
| `gh run list/view`, job logs, `gh run download` (gate run's `bug-flag-proof`, today's `serenity-report`), `gh api` GETs (protection, rulesets, environment, retention, pins) | as cited above |
| `curl` GETs on the live site | board 200 (identical to the repo), stamp names `1f87a06` and run 39752641138, `/report/` 200 (Serenity 4.3.4), 8 other paths 404 |

**Mutation probes** (each reverted, and the revert checked with `cmp` or `diff`):
1. Outline top-level `result: FAILURE` with SUCCESS rows: `check:report` passed. A real failing outline also sets row results, so there is no finding.
2. A `tok_…` token in a step: passed (B-06).
3. The control key in base64: passed (B-06).
4. A step `FAILURE` under a scenario `SUCCESS`: passed, consistent with section 34.
5. One scenario file removed and one outline row added: passed (B-07).
6. Site: key in `report/notes.log`, key in `report/secrets.env`, `report/openapi.yaml`, `Bearer` in `report/x.md`, `report/.git/config`: all passed (B-06). Stamp `commit: abc1234567` against `abc123`: passed (N-3).
7. `--color-band-high` set to amber `#b36b00`: 33 passed (B-02).
8. `--color-band-high` set to green: 2 failed (positive control).
9. `body { padding-top: 1px }`: 32 of 32 failed. This is the case of a change nobody would notice that the check still flags.
10. A visual catcher on `duplicate-nav` in the registry: "caught for the stated reason" (B-08).

The final clean visual run after all reverts: 33 passed.

## 5. What I could not examine
- **Serenity HTML locally:** I could not generate it, because Java is not installed. I examined the HTML only as CI's `serenity-report` artifact for run 39752641138 and as the live pages.
- **The Linux visual comparison:** I could not run it. Results against the committed baselines rest on the CI logs (visual runs up to 39519199674, all `success`, and run 39240828272 attempts 1 and 2). My tolerance and order probes ran on Windows against throw-away images, so their counts may differ on Linux.
- **The `deploy` job's behaviour:** I could observe it only through its CI logs and the live site, not exercise it.
- **`npm run verify`:** I did not run it as a whole. Its Kanban step needs `DOCS/backlog.md`, which was removed from the copy. I did not install Python requirements, so the Gherkin and Schemathesis steps were not run either.
- **Signal handling in `run.mjs`:** I did not test it, because Windows does not deliver the signals.

## 6. The author's verification (2026-10-22)

Written by the author after both reports arrived, in a separate section so the reviewers' words above are unchanged. "Reproduced" means I ran it myself on `main` at `1f87a06` (or on a copy of one file's logic) and saw the reviewer's result; "confirmed by reading" means I read the cited lines and the claim holds; neither is a judgement of severity, which is the owner's to confirm at sign-off. I have not re-run every probe; the ones I did not are named.

### 6.1 Duplicates between the two reports

| Reviewers' IDs | The same issue | Graded |
|---|---|---|
| A-03, B-01 | the `bug-flag-proof` artifact expires (14 days) before the log it was meant to outlive (90 days), and holds no catcher output | A: Change, B: Blocker |
| A-08, B-09 | the `flags` job runs on `ubuntu-latest` while it runs visual catchers against `ubuntu-24.04` baselines | both Change |
| A-09, B-10 | the run limits in `run.mjs` (60 minutes) cannot fire before the job limits (30 minutes); a timed-out proof keeps nothing | both Change |
| A-02, B-08 | the proof accepts any recorded `failsWith`; a visual catcher's "reason" is any change to the image | both Change |

### 6.2 Blockers and Changes

| ID | Verified | How | Author's recommendation |
|---|---|---|---|
| A-01 Blocker | **Reproduced** | Read `safeRedirect.ts:12` and `DetailFormPage.tsx:92`. Ran `HARNESS_BUGS=open-redirect node scripts/run.mjs ui security/open-redirect`: exit 1, the rows fail with exactly the registry's `failsWith` ("Timeout of 5s has expired while waiting for <<detail-header>>.isPresent() to equal true"); with the flag off 6 scenarios pass. React Router 8.4.0 contains "External navigation is not allowed", so `navigate()` refuses an external address: the defect as built is "Cancel does nothing". I did not re-run the reviewer's browser probe | Accept. The flag must really leave the site and the catcher must assert where the browser ended up |
| B-01 Blocker, A-03 Change | **Confirmed** | `ci.yml` says the artifact outlives the log and sets `retention-days: 14`; `gh api .../artifact-and-log-retention` returns 90 days; the artifact of run 39487546650 has `expires_at` 2026-11-03T20:11:40Z; `prove-flags.ts:158-161` writes verdicts only | Accept. Keep the table durably (commit it with the gate record and raise retention to 90 days), keep each catcher's matched output in it, correct the comment and harness design section 37 |
| A-02, B-08 Change | **Reproduced** | `verdict.ts:42` is `run.output.includes(failsWith)`; `prove-flags.ts:88` passes the Vitest name unanchored; I gave `duplicate-nav` a visual catcher on the overview image and `VISUAL_LOCAL_TRY=1 run.mjs flags duplicate-nav` printed "off: passes on: fails as stated" and "1 of 1 ... caught for the stated reason" (registry restored afterwards) | Accept. Reject generic `failsWith` text, anchor and count the Vitest test, and stop a visual catcher counting alone towards "caught for the stated reason" |
| A-04 Change | **Reproduced** | Built the UI without `VITE_TEST_BUILD`; the bundle contains `${e===1&&!pr(`plural`)?t:n}`; `format.ts:63` has no `TEST_BUILD &&` | Accept. Guard the call, make the guard test assert that every hyphenated UI flag is a marker, correct UI specification 6.8 and the guard comment |
| A-05 Change | **Reproduced** | Ran the semantic-rule source on hand-made pages: a bar 13% wide with `aria-valuenow` 6 and text "6%" gives 0 problems; a chart table with `n/a` cells gives 0 problems (empty cells give 1) | Accept. Compare the drawn width; require a number in the chart cells |
| A-06 Change | **Reproduced** | The name "Credit cards utilisation: 6% of a £6,100 limit" on a bar of value 6 fails `progress-name-matches-value` | Accept. Compare only the figures followed by `%` |
| A-07 Change | **Confirmed** | The longest persona summary text is 77 characters (limit 280), so the expander never shows in a browser run | Accept in part: a persona override and an exit target (axe, folded and open). A new `@ui` scenario for the unsaved-name question is a Gherkin change and needs your acceptance |
| A-08, B-09 Change | **Confirmed** | `ci.yml:132` `runs-on: ubuntu-latest` on the `flags` job; `visual.yml` pins `ubuntu-24.04` | Accept (one line) |
| A-09, B-10 Change | **Confirmed by reading** | `run.mjs` limits (`flags: 60`) against `timeout-minutes: 30`; the table is written at the end of `prove-flags.ts`; the log upload is `if: failure()`. I did not test the process-group claim | Accept: set the limits below the job limits, write the table after each flag, upload on `failure() \|\| cancelled()`. The process-group kill is smaller and may go to the backlog |
| B-02 Change | **Reproduced** | Local-try images; `--color-band-high` `#b3261e` to `#b36b00`: 33 passed; to green `#1a7f4b`: 2 failed (control) | Accept. Lower the colour threshold and prove it on Linux twice running, and state the limit as hue and luminance |
| B-03 Change | **Confirmed** | `visual.yml` paths omit `fixtures/**` and `packages/api-client/**`; the service copies `fixtures/personas/*.json` (csproj lines 23 and 24) and the UI depends on `packages/api-client` | Accept (add both paths) |
| B-04 Change | **Confirmed** | `fullPage: true` with a fixed tab bar; the 375 px baselines draw it part-way down the page (I saw this on 2026-10-19 and left it) | Accept. Hide the bar for the full-page shot, photograph it separately, refresh the baselines (you accept the new images) |
| B-05 Change | **Confirmed** | `ProfilePage.tsx` puts `<strong>Email</strong>` straight before the value; the 375 px profile baselines show "Email" run into the address and words broken mid-word. A product defect that the baselines now freeze | Accept. Separate label and value, check the accessible name, refresh the profile baselines in the same pull request |
| B-06 Change | **Reproduced** | On a real assembled folder `check:site` passed with the key in `report/notes.log`, `Bearer abcdefgh1234` in `report/x.md` and a `tok_` token in `report/t.html` (the shape is in `Authentication.cs`, not in `TOKEN_SHAPES`) | Accept. Read every non-binary file, allow-list the report's file types, add `tok_[0-9a-f]{32}`, reword the claim |
| B-07 Change | **Reproduced** | On real JSON: removed one plain scenario file and duplicated one outline row; `check:report` printed "60 @api and 59 @ui executions, all successful" | Accept. Check scenario names and rows per outline against a manifest derived from the feature files |
| B-11 Change | **Confirmed** | `visual-baselines.yml` has `contents: write` and `persist-credentials: true`; `main` has no protection (`gh api` 404) and no rulesets | Accept the workflow change (two jobs; the one that runs project code has no write token). Protecting `main` is a repository setting and is yours |
| B-12 Change | **Confirmed (items 1 to 6; 7 by reading)** | README says DR-001 to DR-066; section 31 says 282 checks; two sections numbered 21; section 25 still says 41 scenarios, 37 scans, 24 checks; `ci.yml:201` says "P6c adds `publish`" | Accept. Correct all seven and add the `--update` first step for the local-try mode |

### 6.3 Notes

A-10 to A-14 and B N-1 to N-11 are recorded as the reviewers wrote them. I did not re-run them; none needs a change to the gate's evidence. Three are worth a line each. **N-1** (`deploy` does not wait for the proof) is the documented DR-066 choice. **N-3** (the stamp check compares a value with itself, and `abc1234567` passes for `abc123`) makes the check weaker than its wording; a full-length match fixes the second half in one line. **N-2** (an unprotected `main` makes every check advisory) is the repository setting named under B-11.

### 6.4 Counts as reported

| | Blockers | Changes | Notes |
|---|---|---|---|
| Reviewer A | 1 | 8 | 5 |
| Reviewer B | 1 | 11 | 11 |
| After the duplicates in 6.1 (the author's reading) | 2 | 15 issues | 16 |

## 7. Owner sign-off

[Pending. Blockers and Changes are put to the owner one by one, and the Notes in one table (plan decision D6). The answers are recorded here with their date.]
