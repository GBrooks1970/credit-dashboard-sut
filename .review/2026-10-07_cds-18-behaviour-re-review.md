---
version: 1
created: 2026-10-07T09:54Z
project: credit-dashboard-sut
type: review
item: CDS-18
reviewed_commit: 30c3b6e (branch claude/cds18-rereview; `main` at f16cea0 plus the CDS-18 plan)
reviewer: general-purpose subagent, fresh context, read-only (Claude Code Agent tool), run 2026-10-07 09:44Z to about 09:52Z
language: en-GB
---

# CDS-18: independent re-review of Phase 2 behaviour against contract v9

**What this is.** The record required by decision brief 7 D2 and DR-045, to the approved plan
(`DOCS/implementation-plans/2026-10-07_cds-18-behaviour-re-review.md`). Section 2 is the reviewer's report,
copied verbatim. Section 3 is the author's verification of each Blocker and Change finding, kept separate so the
reviewer's words are unchanged. Section 4 records the owner's sign-off.

## 1. The reviewer's prompt (verbatim)

The reviewer saw only this prompt and the repository; not this conversation, decision brief 7's claim that
contract v8 and v9 changed no behaviour, or brief 4's outcomes. The prompt file's SHA-256 begins `7a8640fd8677e1d0`.

````markdown
You are an independent reviewer for a specification-driven project. You did not write any of the material you are reviewing. Your job is to find out, by reading, whether the behaviour scenarios and the step glossary still agree with the current API contract and specifications. Report what you observe, with evidence. Do not assume anything is correct because it looks deliberate.

## Rules

- READ ONLY. Do not edit, create, move or delete any file in the repository. Do not run git commands. Do not fetch anything from the network. You may read files and run read-only shell commands such as `grep`, `sed -n`, `wc` or a short Python script that only reads.
- The one file you write is your report, at:
  `C:\Users\brook\AppData\Local\Temp\claude\D---CLAUDE-COWORK-PROJ001-claude-outputs-test-automation-portfolio\29251c43-9fd2-466b-9c23-1415b601eb91\scratchpad\cds18_review_report.md`
- Write in British English. No em dashes and no exclamation marks in prose.
- Every finding must quote both sides: the scenario or glossary text, and the contract or specification text it disagrees with, each with its file path and line number.
- "No findings" for a check is only acceptable with a count of what you examined.

## Repository

`D:\_CLAUDE_COWORK\PROJ001\claude-outputs\test-automation-portfolio\credit-dashboard-sut` (checked out at commit `30c3b6e` on branch `claude/cds18-rereview`, which adds only a plan file to `main` at `f16cea0`).

## Material under review

- `features-shared/` (all `.feature` files: `api/`, `ui/`, `security/`).
- `DOCS/step-glossary.md` (the agreed Gherkin steps).
- `DOCS/glossary.md` (the normative vocabulary).

## Sources of truth to check against

- `DOCS/.architecture/openapi.yaml` (the OpenAPI 3.1 contract).
- `DOCS/.design/api-specification.md` (conventions, business rules BR-01 to BR-15, personas, fixture format, test control in section 6.5, bug flags).
- `DOCS/.design/ui-specification.md` (page catalogue in section 5, page specifications, test hooks, component states).
- `DOCS/.design/ui-feature-profile.md` (My Profile: rules PR-01 to PR-11 and its pages).
- `DOCS/decision-register.md` (decisions DR-001 onwards; later entries can refine earlier rules).
- `fixtures/` (personas in `fixtures/personas/`, test users in `fixtures/users.json`, override samples in `fixtures/overrides/`, the schema in `fixtures/persona.schema.json`).

Ignore `DOCS/decision-briefs/`, `DOCS/backlog.md`, `DOCS/implementation-*`, `session-notes` and any review or handover material: they describe history, not the current truth.

## Checklist

Work through every scenario in every feature file.

- **C1, operations.** Every HTTP method, path, status code and header that a scenario or a step names (directly, or through a step-glossary definition) exists in the contract for that operation, with that meaning. Include test-control operations and security scenarios.
- **C2, fields and values.** Every response or request field, enum value, persona name, test user, account id, override sample and literal value that a scenario asserts or uses exists in the contract or the fixtures, with a matching type and meaning. Check amounts, dates and boundary values against the fixtures they come from.
- **C3, rules.** Each scenario tagged `@BR-nn` or `@PR-nn` exercises that rule as it is currently written in the specifications and the decision register, including its boundary values (for example inclusive or exclusive limits). Flag a scenario whose expectation would contradict the current rule text.
- **C4, UI.** Each `@ui` scenario's page, route and test hooks (for example `data-testid` values, component names, list hooks) exist in the UI specification or the My Profile specification, with the meaning the scenario assumes.
- **C5, steps and terms.** Every step line in every feature file matches an agreed entry in the step glossary (allowing for its parameters), and the step glossary's entries are consistent with the contract. Domain terms used in scenarios match the glossary's normative terms.
- **C6, coverage.** Every business rule BR-01 to BR-15 has at least one tagged scenario; every page in the UI specification's catalogue that names a feature file has that file; list any PR rule with no scenario and whether the specifications say why.

## Severity

- **Blocker:** a scenario or glossary entry contradicts the contract or a specification, so it would fail against a correct implementation, or pass against a wrong one.
- **Change:** stale, ambiguous or inconsistent wording; a step not in the glossary; a coverage gap.
- **Note:** an observation that needs no change.

## Report format

```
# CDS-18 behaviour re-review: report

## Summary
<two to five sentences: overall verdict and the counts of Blocker, Change and Note findings>

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| C1 | ... | none, or F-ids |
... C2 to C6

## Findings
### F-01 (Blocker|Change|Note, Cn): <short title>
- Where: <file:line>
- Scenario or glossary text: "<quote>"
- Contract or specification text: "<quote>" (<file:line>)
- Why it matters: <one or two sentences>
- Suggested fix: <one or two sentences>

## Method
<how you worked: what you read, any read-only scripts you ran and what they counted>
```

When you have written the report, reply with only its summary section and the counts.
````

## 2. The reviewer's report (verbatim)

### Report

## Summary
Every step line in the 21 feature files matches an agreed entry in the step glossary. Every business rule from BR-01 to BR-15 has a tagged scenario, and every PR rule except PR-05 has one. Most expectations agree with the contract and fixtures. Five scenarios still contradict a source of truth, though. The API total-debt figure for the `drilldown` persona is wrong. The per-type debt breakdown has no source in the contract. The overview "show all changes" toggle cannot list five changes from the one aggregate call. The preferred-name save cannot run because the persona already holds the value being saved. The loan detail scenario asserts "account details" that UI specification section 6.5 says a loan never shows. Counts: 5 Blocker, 12 Change, 8 Note.

## Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| C1 | 12 operations mapped from API steps in step-glossary section 4.1, 2 test-control operations from section 3 (persona binding, clock), the operations behind the 15 catalogue pages that UI steps drive, the status codes the outcomes imply (200, 202, 404, 422, 429), and all 5 `@security` scenarios | F-02, F-03, F-19 |
| C2 | 21 feature files, 65 scenarios (52 plain, 13 outlines, 46 example rows); every literal checked against the 7 personas, 2 test users and 8 override samples, with debt, totals, utilisation, trend and date boundaries recomputed by a read-only script | F-01, F-02, F-04, F-06, F-08, F-09, F-18, F-20 |
| C3 | 41 rule tags on scenarios (32 BR, 15 of 15 rules; 15 PR across 10 rules), each read against API spec v11 section 7, My Profile spec v4 section 5 and DR-011 to DR-036 | F-01, F-07, F-08, F-10, F-11, F-23 |
| C4 | 11 `@ui`-tagged feature files (10 in `ui/` plus `security/open-redirect`, 39 scenarios) against UI spec v8 sections 4 to 7 and My Profile spec v4 sections 2 to 4: 15 catalogue pages, routes, and the hooks the steps imply | F-03, F-04, F-05, F-21, F-22 |
| C5 | 232 step lines (185 distinct texts) matched against 155 backticked patterns in step glossary sections 3 to 5: 232 of 232 match, allowing for parameters and the glossary's "/ alternative" fragments. Glossary terms checked in all 65 scenarios | F-05, F-06, F-14, F-15, F-16, F-17 |
| C6 | BR-01 to BR-15 (15 of 15 tagged); PR-01 to PR-11 (10 of 11 tagged; PR-05 not); 15 catalogue pages naming 11 feature files (11 of 11 files exist) | F-11, F-12, F-13, F-24, F-25 |

## Findings

### F-01 (Blocker, C2/C3): API total debt for `drilldown` leaves out the mortgage, utility and credit-account balances
- Where: `features-shared/api/debt.feature:7` and `:16`; also `DOCS/step-glossary.md:34`
- Scenario or glossary text: "Given Alex holds the "drilldown" persona" (debt.feature:7) ... "Then the total debt is 12947.60" (debt.feature:16). The step glossary gives both figures as one outcome under two layers: "`Then the total debt is 12947.60` (API), `Then the total debt is 198279.60` (UI)" (step-glossary.md:34)
- Contract or specification text: "BR-07 | Total debt = sum of positive balances of open accounts with `includedInTotals` true, excluding current accounts." (`DOCS/.design/api-specification.md:201`). In `fixtures/personas/drilldown.json`, the included open accounts with a positive balance are 423.60 (`acc_ddcc01`, line 177), 12524.00 (`acc_ddln01`, line 379), 185000.00 (`acc_ddmg01`, line 558), 32.00 (`acc_ddtu01`, line 761) and 300.00 (`acc_ddlc01`, line 919). Their total is 198279.60, which `features-shared/ui/debt.feature:14` asserts for the same persona.
- Why it matters: `GET /debt/overview` takes no bureau and has no layer variant. A correct service returns 198279.60, so the API scenario fails. 12947.60 is the total for the `excellent` persona: 423.60 + 12524.00 (`excellent.json:150`, `:250`).
- Suggested fix: assert 198279.60 and add the mortgage, utility and credit-account Givens. Or arrange exactly the listed accounts with an override sample. Then correct the step-glossary example at line 34.

### F-02 (Blocker, C1/C2): The per-type debt breakdown has no source in the contract, and the credit-card figure does not match the type totals
- Where: `features-shared/ui/debt.feature:18-27`
- Scenario or glossary text: "Then the debt on <type> is <amount>" with the row "| credit cards | 423.60 |" (debt.feature:23)
- Contract or specification text: `DebtOverview` holds only "required: [total, trend]" (`DOCS/.architecture/openapi.yaml:1575`), and the catalogue feeds the debt page from "`GET /debt/overview`" only (`DOCS/.design/ui-specification.md:107`). The UI spec names the hook "a per-type breakdown `debt-type-{type}`" but gives it no data (`ui-specification.md:209`). The only per-type money in the contract is `AccountTotals.balance`, under "BR-04 | Type totals sum `balance` ... across open accounts of that type where `includedInTotals` is true" (`api-specification.md:198`). For `drilldown` credit cards that is 423.60 + (-44.00) = 379.60 (`drilldown.json:177`, `:278`), not 423.60.
- Why it matters: neither the contract nor any specification says what number `debt-type-{type}` shows or where it comes from. Built from the only per-type field the contract has, a correct UI shows 379.60 and the row fails.
- Suggested fix: add a per-type breakdown to `DebtOverview` and state its rule (BR-07 positive balances per type). Or drop the breakdown rows from the scenario until the contract carries it.

### F-03 (Blocker, C1/C4): "Show all changes" on the overview cannot list five changes from the single overview call
- Where: `features-shared/ui/report-overview.feature:32-37`
- Scenario or glossary text: "Then 3 changes are listed / When Sam shows all changes / Then 5 changes are listed". The step glossary maps the step to "`{actor} shows all changes` | Changes toggle | `ui/report-overview`" (`DOCS/step-glossary.md:131`)
- Contract or specification text: "One `GET /reports/{bureauId}/overview` call feeds every section except the history chart." (`DOCS/.design/ui-specification.md:128`). The section's hooks are "`changes-toggle`, `changes-see-all` | `recentChanges`, `changesTotal`" (`ui-specification.md:136`). The contract caps that list at three: "recentChanges: { type: array, maxItems: 3" (`openapi.yaml:1395`). DR-034 says "The report overview stays one aggregate call" (`DOCS/decision-register.md:49`).
- Why it matters: if the UI follows the specification, the overview section never holds more than three changes, so "5 changes are listed" fails. A UI that passes would have to call an operation the page catalogue (`ui-specification.md:98`) does not list for this page.
- Suggested fix: decide what the toggle does. Either the specification lets the toggle call `GET /reports/{id}/changes`, or the scenario follows `changes-see-all` to the report changes page and counts there.

### F-04 (Blocker, C2/C4): "Alex sets a preferred name" saves the value the persona already holds
- Where: `features-shared/ui/profile.feature:9` and `:19-24`
- Scenario or glossary text: "Given Alex holds the "excellent" persona" ... "When Alex sets their preferred name to "Al" / Then Alex is told the change is saved / And the app greets Alex as "Al""
- Contract or specification text: the fixture already holds the name: `"preferredName": "Al"` (`fixtures/personas/excellent.json:11`). The profile spec says the input has the "current value pre-filled when set" and Save is "Shown once the value changes" (`DOCS/.design/ui-feature-profile.md:62-63`).
- Why it matters: entering "Al" over "Al" is no change, so a correct page never shows Save and "told the change is saved" fails. The greeting assertion also passes whether or not anything was saved, so it cannot catch PR-02 or PR-03 defects.
- Suggested fix: set a value the persona does not hold, for example "Ally". Or start from a persona with no preferred name, such as Sam holding `drilldown` (`drilldown.json:11`).

### F-05 (Blocker, C4/C5): A loan scenario asserts "account details" that UI specification 6.5 never renders for loans
- Where: `features-shared/ui/account-drilldown.feature:20-23`
- Scenario or glossary text: "Then Alex sees the balance, payment history and account details / But Alex does not see interest rate or promotional period details"
- Contract or specification text: the normative glossary defines "**Account details** | The fields the customer supplies for an account: APR, interest rate, promotional period, minimum payment, payment method" (`DOCS/glossary.md:118`). The UI spec shows them only for "Details tiles | link (not button) | `detail-tile-{field}` | Credit cards, credit accounts" (`DOCS/.design/ui-specification.md:185`), and "Sections not shown for a type are not rendered at all" (`ui-specification.md:191`).
- Why it matters: read with its normative meaning, the Then line requires a section that a correct loan page must not render, and it contradicts the scenario's own But line. The scenario probably means the metadata list `detail-meta-*` (`ui-specification.md:188`), but the glossary gives that no name.
- Suggested fix: reword it as, for example, "the balance, payment history and account information (frequency, status, opened date)". Add that term to the glossary, or name the `detail-meta-*` elements directly.

### F-06 (Change, C2/C5): Nothing arranges the zero-limit credit card, and the BR-03 override sample quotes a retired phrasing
- Where: `features-shared/api/account-totals.feature:31-35`; `DOCS/step-glossary.md:81`; `fixtures/overrides/br03-one-credit-card.json:3`
- Scenario or glossary text: "Given Alex has a credit card with a balance of 0.00 and a limit of 0.00" (account-totals.feature:33). The glossary arranges this step by "Fixture (`drilldown`, -44.00 / 1000.00); Test control (overrides, `fixtures/overrides/br03-one-credit-card.json`) for the outline rows" (step-glossary.md:81)
- Contract or specification text: the scenario is not an outline row, and `drilldown` holds no 0.00 / 0.00 credit card (its cards are `acc_ddcc01` 423.60 / 5100.00 and `acc_ddcc02` -44.00 / 1000.00). The fixture arrangement "checks it is so and fails loudly if not" (step-glossary.md:64). The sample's `arranges` field quotes "'{actor} has one credit card with a balance of {money} and a limit of {money}'" (br03-one-credit-card.json:3), which is not the agreed step text.
- Why it matters: following the glossary, the Given fails before the rule is exercised. Section 3 also claims "None remain" for arrangement gaps (step-glossary.md:66).
- Suggested fix: arrange the zero-limit case by overrides, as for the outline rows, with a zero-limit variant of the sample. Correct the sample's `arranges` text to the agreed step.

### F-07 (Change, C3): The BR-09 rule text does not say non-alphanumeric source characters are dropped, but a scenario row depends on it
- Where: `features-shared/api/masking.feature:18`
- Scenario or glossary text: "| **10 | *0010 |"
- Contract or specification text: "BR-09 | Masked number format: `*` followed by the last four characters, uppercase alphanumeric (`^\*[A-Z0-9]{4}$`). Shorter source values are left-padded with `0`." (`DOCS/.design/api-specification.md:203`). The glossary says the same: "`*` and the last four characters, uppercase, left-padded with `0` when the source is shorter" (`DOCS/glossary.md:116`). The source `**10` already has four characters. Only the fixture tool strips non-alphanumerics: "source.replace(/[^A-Za-z0-9]/g, '')" (`fixtures/schema-check.mjs:35`).
- Why it matters: read literally, the rule's "last four characters" of `**10` are `**10`, so the specification does not define the scenario's expected value. Only tooling does.
- Suggested fix: add "after removing characters other than letters and digits" to BR-09 and to the glossary's *Masked number* entry.

### F-08 (Change, C2/C3): No rule says which months are "no data", but two BR-12 rows assert it
- Where: `features-shared/api/payment-history.feature:31-32`
- Scenario or glossary text: "| not reported in any month | no data |" and "| on time in the months reported | on time |"
- Contract or specification text: the only monthly source stored is "`missedMonths` (the BR-12 source)" (`DOCS/.design/api-specification.md:247`). `FixtureAccount` has no on-time or no-data months (`openapi.yaml:1484-1491`). BR-12 defines year statuses from month statuses but not how a month becomes `no-data` (`api-specification.md:206`).
- Why it matters: no specification says how to arrange these two rows (before `openedDate`? after `closedDate`? no account in that year?), and a service could choose differently and still meet the written rule. The single override sample (`br12-payments-2025.json`) covers only the missed-month row.
- Suggested fix: state the month-status derivation in API spec section 9.1, for example "months before `openedDate` or after `closedDate` are `no-data`; other months are `on-time` unless listed in `missedMonths`". Note in the glossary how the other rows are arranged.

### F-09 (Change, C2): API "is told" outcomes have no contract field to assert on
- Where: `features-shared/api/profile-contact.feature:33` and `:61`
- Scenario or glossary text: "Then Alex is told the email is already verified"; "Then Alex is told to request a new code"
- Contract or specification text: both are 422 `RuleViolation` responses whose `Problem` body has only free-text `title` and `detail` (`openapi.yaml:1611-1624`, `:1138-1151`). The contract describes the difference only in prose: "A wrong code is a 422 with the attempts remaining; the third wrong code voids the challenge (PR-11). An expired or voided code, or a code with nothing pending, is a 422 asking for a new code." (`openapi.yaml:222-224`)
- Why it matters: the only way to tell "wrong code, try again" from "request a new code" is to match free-text wording the contract does not fix. The scenario can therefore pass or fail on copy, not behaviour. The UI scenario "told the rate must be between 0% and 100%" (`ui/account-details-form.feature:22`) has the same weakness against the example detail "interestRate must be between 0 and 100 (BR-14)" (`openapi.yaml:1147`).
- Suggested fix: add a machine-readable `type` suffix or code per rule outcome to the error catalogue (API spec section 8), or define the step as asserting status 422 plus `attemptsRemaining: 0`.

### F-10 (Change, C3): The only @BR-02 scenario does not exercise missing months, so the planted defect it is meant to catch would pass
- Where: `features-shared/ui/report-overview.feature:8` and `:15-23`
- Scenario or glossary text: "Given Alex holds the "excellent" persona" ... "Then the chart shows <points> monthly points"
- Contract or specification text: "BR-02 | ... Missing months return `score: null`, never a carried-forward value." (`DOCS/.design/api-specification.md:196`). The bug flag "`history-carry-forward` | BR-02 fills gaps with the previous score | `@BR-02` scenario" (`api-specification.md:278`). The `excellent` history has no null month; `drilldown` has one (2026-01) and `thin-file` has nine.
- Why it matters: with the flag on, the point counts are unchanged, so the named catch never fails. The rule's second sentence has no scenario.
- Suggested fix: add an `@BR-02` scenario, API or UI, for a persona with a null month that asserts a gap rather than a value.

### F-11 (Change, C3/C6): BR-08 has no zero-day row, although the specification names it and a persona holds it
- Where: `features-shared/ui/report-overview.feature:39-46`
- Scenario or glossary text: rows "| 1 day | 1 day |" and "| 2 days | 2 days |"
- Contract or specification text: "BR-08 | `nextUpdateInDays` = whole days until the bureau's next refresh date ...; minimum 0." (`api-specification.md:202`). "States worth testing | `Updates in 0 days`, `1 day` (clock control)" (`DOCS/.design/ui-specification.md:133`). The `boundary` persona's purpose includes "a refresh due today" (`nextRefreshDate` 2026-10-03).
- Why it matters: the lower boundary and the "minimum 0" clamp are not exercised.
- Suggested fix: add a "0 days" row (and, if wanted, a clock past the refresh date that still reads 0).

### F-12 (Change, C6): Two of the three security scenario areas the API specification names have no scenario
- Where: `features-shared/security/` (2 files) and the `@security` tags in `api/masking.feature:21`, `ui/login.feature:19`, `ui/profile.feature:65`
- Scenario or glossary text: the only `@security` scenarios cover BR-15, BR-09, the in-memory session, PR-08 and the open-redirect guard
- Contract or specification text: "Security | `@security` scenarios: BR-15, auth expiry, test control off by default" (`DOCS/.design/api-specification.md:297`)
- Why it matters: no scenario covers token expiry (401 `/unauthenticated`) or test control returning 404 when it is off, although the specification lists both as `@security` scenarios.
- Suggested fix: add both scenarios, or record in the specification that they are left to other checks.

### F-13 (Change, C6): Two catalogue pages name a feature file that has no scenario for them
- Where: `DOCS/.design/ui-specification.md:103` and `:110`
- Scenario or glossary text: `features-shared/ui/account-drilldown.feature` has no closed-accounts scenario (its five scenarios cover the type list and account detail). `features-shared/ui/profile.feature` has no mobile sub-page scenario: line 53's "mobile tile shows "Not added"" is on the profile page.
- Contract or specification text: "| Closed accounts | `/credit-health/report/:bureauId/closed-accounts` | 2 | ... | `ui/account-drilldown.feature` |" (`ui-specification.md:103`); "| Mobile | `/my-account/profile/mobile` | 3 | `PUT /me/profile/mobile`, `POST /me/profile/mobile/verification` | `ui/profile.feature` |" (`ui-specification.md:110`)
- Why it matters: the files exist, so C6's literal test passes, but the traceability chain ("a rule or section with no scenario is a gap", `DOCS/glossary.md:182`) has two gaps.
- Suggested fix: add a closed-accounts UI scenario (for example `closed-group-creditcard` for `struggling`) and a mobile sub-page scenario, or point those catalogue rows at "none" with a reason.

### F-14 (Change, C5): Step glossary section 2 leaves ten placeholders without a parameter type
- Where: `DOCS/step-glossary.md:40-56` (section 2) against the patterns at lines 87-99, 141, 156-164
- Scenario or glossary text: patterns use `{string}`, `{provider}`, `{payment pattern}`, `{hard or soft}`, `{listed or not listed}`, `{refused or sent}`, `{verified or still unverified}`, `{outcome}`, `{tile}` and `{name}`
- Contract or specification text: section 2 says "Each becomes a Cucumber parameter type" (step-glossary.md:38) and defines only the 15 types listed there
- Why it matters: the harness cannot build these steps from the glossary alone, and enumerations such as `{payment pattern}` (four fixed phrases in `api/payment-history.feature:29-32`) and `{outcome}` (two different value sets, in `api/profile-contact.feature:42-44` and `ui/profile.feature:32-34`) are not agreed.
- Suggested fix: add each type to section 2 with its allowed values, splitting `{outcome}` into a mobile outcome and a preferred-name outcome.

### F-15 (Change, C5): Step glossary "Used in" columns, counts and one status are out of date
- Where: `DOCS/step-glossary.md:70, 71, 87, 93, 108, 136, 138, 146, 206`
- Scenario or glossary text: "| All 18 files |" (line 70); `today is` used in four files (line 71, but `api/profile-contact.feature:9` also uses it); `{actor}'s email is verified` used in "`ui/profile`" (line 87, also `api/profile-contact.feature:13`, `:31`); `{actor} has {count} report changes` used in "`ui/report-overview`" (line 93; not used there); `asks for one of {actor}'s accounts` used in "`api/account-totals`" (line 108; now `security/access-control.feature:13`); `opens the interest rate form ...` and `cancels the form` used in "`ui/account-details-form`" (lines 136, 138; now `security/open-redirect.feature:12-13`); "Email sub-page (proposed)" (line 146); "re-checked against 19 feature files, 65 scenarios" (line 206)
- Contract or specification text: `features-shared/` holds 21 feature files and 65 scenarios (counted). The email sub-page is in the catalogue, Release 3 (`DOCS/.design/ui-specification.md:109`; DR-022).
- Why it matters: the "Used in" column is how a reviewer traces a step to its files, and eight of its entries now point to the wrong place.
- Suggested fix: regenerate the "Used in" column and the provenance counts from the files, and drop "(proposed)".

### F-16 (Change, C5): The normative glossary stops at PR-08 and cites superseded document versions
- Where: `DOCS/glossary.md:179`, `:31`, `:37`
- Scenario or glossary text: "**Profile rule**, **PR-nn** | A numbered My Profile rule, PR-01 to PR-08" (line 179); "the API specification (v4), the UI specification (v3), the My Profile UI feature spec (v2), the contract ... (v4)" (line 31); "`DOCS/step-glossary.md` (to be written, backlog CDS-07)" (line 37)
- Contract or specification text: the rules run to "PR-11 | Each wrong code is refused; ..." (`DOCS/.design/ui-feature-profile.md:112`), and scenarios carry `@PR-09`, `@PR-10` and `@PR-11` (`api/profile-contact.feature:18, 29, 46, 57`). Current versions: API spec 11, UI spec 8, profile spec 4, contract 9; the step glossary exists at version 5.
- Why it matters: scenarios tagged with PR-09 to PR-11 fall outside the glossary's definition of a profile rule tag.
- Suggested fix: change the range to PR-01 to PR-11, and update section 1.1 and 1.2 to the current versions.

### F-17 (Change, C5): Feature headers cite superseded specification versions, and not all the same ones
- Where: for example `features-shared/ui/account-drilldown.feature:5`, `ui/account-details-form.feature:7`, `security/open-redirect.feature:6`, `api/profile-contact.feature:5`, `ui/profile.feature:6`
- Scenario or glossary text: "Covers UI specification v5, sections 6.4 and 6.5."; "Covers UI specification v6, section 6.6 (open-redirect guard)."; "Covers the My Profile UI feature spec v4, section 5, and API spec v7, section 6.6."
- Contract or specification text: "version: 8" (`DOCS/.design/ui-specification.md:2`); "version: 11" (`DOCS/.design/api-specification.md:2`)
- Why it matters: section numbers still resolve, but the same section is cited as v5 in one file and v6 in another. DR-040 now edits specifications in place, so version-pinned citations will keep going stale.
- Suggested fix: cite sections without a version ("UI specification, section 6.6"), or update all of them together.

### F-18 (Note, C2): The `drilldown` debt trend "down" clears the 1% threshold by only 0.04 points
- Where: `features-shared/ui/debt.feature:15`
- Scenario or glossary text: "And the debt trend is down"
- Contract or specification text: BR-07 "a change of at most 1% either way, unrounded, is `steady`" (`api-specification.md:201`). From `drilldown.json` balance histories: July 2026 total 200358.60, now 198279.60, a change of -1.04%.
- Why it matters: the expectation is correct, but a change to any one balance history, or to which month counts as "three months earlier", flips it to `steady`.
- Suggested fix: none needed. A comment naming the July 2026 base would help the next editor.

### F-19 (Note, C1): API spec section 6.3 still lists 403 for account operations, which BR-15 and the contract rule out
- Where: `DOCS/.design/api-specification.md:125`; relevant to `features-shared/security/access-control.feature:14`
- Scenario or glossary text: "Then the account is not found"
- Contract or specification text: "| GET | `/accounts/{accountId}` | Account detail | 200 `Account` | 401, 403, 404 |" (`api-specification.md:125`) against "Anything else returns 404 (not 403)" (`api-specification.md:209`). The contract lists only 200, 401 and 404 (`openapi.yaml:605-638`).
- Why it matters: the scenario agrees with the contract, which wins. The specification row is the stale side.
- Suggested fix: remove 403 from the section 6.3 rows.

### F-20 (Note, C2): BR-11 calls the full count `total`, but the overview field is `changesTotal`
- Where: `features-shared/api/report-changes.feature:29`
- Scenario or glossary text: "And the change count reads 5"
- Contract or specification text: "BR-11 | ... The overview embeds the 3 newest; `total` reports the full count." (`api-specification.md:205`) against "changesTotal: { type: integer, minimum: 0 }" (`openapi.yaml:1396`)
- Why it matters: the scenario wording is fine; a harness author could look for the wrong field.
- Suggested fix: write `changesTotal` in BR-11.

### F-21 (Note, C4): The report changes route does not show where the sentiment filter goes in the URL
- Where: `features-shared/ui/report-changes.feature:16-20`
- Scenario or glossary text: "When Alex opens the same address later / Then only positive changes are listed"
- Contract or specification text: "| Report changes | `/insights/updates?bureauId=&tags=` |" (`ui-specification.md:104`); "filters are reflected in the URL" (`ui-specification.md:209`)
- Why it matters: the behaviour is specified but the query parameter is not, so the route template and the filter chips `changes-filter-{sentiment}` do not quite meet.
- Suggested fix: add `&sentiment=` to the route template.

### F-22 (Note, C4): Two pages the scenarios read have no hooks or message text specified
- Where: `features-shared/ui/personal-details.feature:12-13`; `features-shared/ui/account-details-form.feature:22`
- Scenario or glossary text: "Then Alex sees 1 current address and 2 previous addresses / And Alex is shown as on the electoral roll"; "Then Alex is told the rate must be between 0% and 100%"
- Contract or specification text: personal details is described only as "Personal details is read-only in v1" (`ui-specification.md:209`), with no `data-testid`. The form error is "Client check mirrors BR-14; server 422 shown verbatim" (`ui-specification.md:200`), with no message text.
- Why it matters: role-based locators are allowed (`ui-specification.md:58`), so neither is a defect. The harness will have to choose locators and wording the specification does not fix.
- Suggested fix: add hooks for the address list and electoral roll, and the BR-14 error copy, in UI spec sections 6.6 and 6.7.

### F-23 (Note, C3): BR-14 and BR-15 are covered only in part
- Where: `features-shared/ui/account-details-form.feature:12-23`; `features-shared/security/access-control.feature:10-14`
- Scenario or glossary text: interest rates 29.9% and 120% only; a read of another customer's account only
- Contract or specification text: "BR-14 | ... `interestRate` and `apr` accept 0 to 100 with up to 2 decimal places; `promoPeriodMonths` 0 to 60; ..." (`api-specification.md:208`); "BR-15 | A user may read and change only accounts in their own persona." (`api-specification.md:209`)
- Why it matters: the inclusive limit (100 accepted, 100.01 refused), the decimal-place limit, the other fields and the "change" half of BR-15 (`PATCH /accounts/{id}/details` on another customer's account) have no scenario. The rule tags are therefore present but partial.
- Suggested fix: optional. Add boundary rows, or record that unit tests cover them.

### F-24 (Note, C6): The security feature split from the edit form is not in the page catalogue
- Where: `DOCS/.design/ui-specification.md:102`
- Scenario or glossary text: `features-shared/security/open-redirect.feature` ("Moved unchanged from ui/account-details-form.feature v2 at CDS-09", line 2)
- Contract or specification text: "| Detail edit form | `/data-capture/:field?accountId=&redirectUrl=` | 2 | `PATCH /accounts/{id}/details` | `ui/account-details-form.feature` |"
- Why it matters: walking from the page to its tests misses the open-redirect scenario.
- Suggested fix: list both files in that catalogue row.

### F-25 (Note, C6): PR-05 has no scenario, and the specifications say why
- Where: `features-shared/` (no `@PR-05` tag)
- Scenario or glossary text: none
- Contract or specification text: "Every BR rule (BR-01 to BR-15) and every PR rule except PR-05 (address sub-page, stretch) has a tagged scenario." (`DOCS/step-glossary.md:196`); "address, employment and finances are stretch (specified, not built)" (DR-022, `DOCS/decision-register.md:37`)
- Why it matters: this is a recorded, deliberate gap.
- Suggested fix: none.

## Method
- Read in full: all 21 files in `features-shared/` (api 9, ui 10, security 2), `DOCS/step-glossary.md` v5, `DOCS/glossary.md` v7, `DOCS/.architecture/openapi.yaml` v9 (`info.version` 0.6.2), `DOCS/.design/api-specification.md` v11, `DOCS/.design/ui-specification.md` v8, `DOCS/.design/ui-feature-profile.md` v4, `DOCS/decision-register.md` v11 (DR-001 to DR-045), `fixtures/users.json`, and the BR-09 masking and BR-12 window lines of `fixtures/schema-check.mjs`. Decision briefs, backlog, implementation material, session notes and reviews were not used.
- A read-only Python script summarised every persona (7) and override sample (8): accounts with balance, limit, utilisation, inclusion, status, dates, masks, missed months and balance history; changes; searches; personal details; profile blocks. From this I recomputed by hand total debt for `drilldown` (198279.60) and `excellent` (12947.60), the `drilldown` July-to-October trend (-1.04%), the credit-card type total for `drilldown` (379.60), utilisation rounding for each BR-03 row, the BR-13 anniversary dates, the PR-02 name length (31 characters), and the PR-06 number formats.
- A second read-only script counted 21 files, 65 scenarios (52 plain, 13 outlines), 46 example rows, 232 step lines and 185 distinct step texts, and listed every `@BR-nn` and `@PR-nn` tag with its line (41 tags: 15 of 15 BR rules, 10 of 11 PR rules).
- A third read-only script turned the 155 backticked patterns in step-glossary sections 3 to 5 into regular expressions (each `{param}` as a wildcard, with the glossary's "/ alternative" fragments expanded) and matched every step line: 232 of 232 matched. The match is permissive, so I also compared each step by hand with its glossary row and its contract operation.
- No file in the repository was changed, no git command was run and nothing was fetched from the network.

## 3. Author's verification (Blocker and Change findings)

Each finding re-checked against the files at the reviewed commit, before the owner's sign-off.

| Finding | Severity | Verification | Evidence |
|---|---|---|---|
| F-01 | Blocker | Reproduced | Recomputed from `fixtures/personas/drilldown.json`: included open non-current positive balances total 198279.60 (5 accounts); `excellent` totals 12947.60 |
| F-02 | Blocker | Reproduced | `DebtOverview` has only `total` and `trend` (`openapi.yaml:1573-1583`). The UI rows equal per-type positive balances; no contract field carries them |
| F-03 | Blocker | Reproduced | `recentChanges` has `maxItems: 3`; `drilldown` holds 5 changes; the page catalogue lists only the overview and history calls for this page |
| F-04 | Blocker | Reproduced | Background binds `excellent`, whose `profile.preferredName` is "Al"; Save is shown only once the value changes |
| F-05 | Blocker | Reproduced | Details tiles are for credit cards and credit accounts only; the glossary's *Account details* means those fields |
| F-06 | Change | Reproduced | Background binds `drilldown` (cards 423.60 / 5100.00 and -44.00 / 1000.00). `boundary`'s 0 / 0 account is a line of credit, not a credit card. The sample's `arranges` text differs from the agreed step |
| F-07 | Change | Reproduced | BR-09 text has no stripping clause; only `fixtures/schema-check.mjs:35` strips non-alphanumerics |
| F-08 | Change | Reproduced | API spec defines month statuses (line 93) and the year rule (BR-12) but not how a month becomes `no-data` |
| F-09 | Change | Reproduced, refined | `Problem` does have a required `type`, but every 422 shares `/problems/rule-violation`, so the two outcomes differ only in free text |
| F-10 | Change | Reproduced | The only `@BR-02` scenario binds `excellent`, which has 0 null months (`drilldown` has 1) |
| F-11 | Change | Reproduced | Outline rows are `1 day` and `2 days` only |
| F-12 | Change | Reproduced | `@security` scenarios: masking, access control, open redirect, login session, PR-08; none for token expiry or test control off |
| F-13 | Change | Reproduced | `ui/account-drilldown.feature` has no closed-accounts scenario; `ui/profile.feature` reaches the mobile tile on the profile page only |
| F-14 | Change | Reproduced | Section 2 defines 15 types; `{provider}`, `{outcome}` and the others are absent |
| F-15 | Change | Reproduced | "All 18 files" (21 exist); "19 feature files" in the provenance line; `today is` used in 5 files |
| F-16 | Change | Reproduced | Glossary line 179 says PR-01 to PR-08; line 31 cites API v4, UI v3, profile v2, contract v4; line 37 says the step glossary is still to be written |
| F-17 | Change | Reproduced | 12 feature headers cite versions (UI v5 or v6, API v7) |

All 17 reproduced. Notes F-18 to F-25 were not re-checked; they need no change by definition.

## 4. Owner's sign-off

Pending (interview).
