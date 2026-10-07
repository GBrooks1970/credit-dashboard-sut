---
version: 2
created: 2026-10-07T13:12Z
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

## 4. Owner's decisions on the first pass

By interview, 2026-10-07: F-02 add `DebtOverview.byType` (DR-046); F-03 the toggle fetches every change (DR-047);
F-09 one Problem type per rule outcome (DR-048); fix all Blockers and Changes and Notes F-19, F-20, F-21, F-24
before the gate. Fixed in #16 (`dca26ce`), to `DOCS/implementation-plans/2026-10-07_cds-18-fixes-addendum.md`.

## 5. Second pass: confirmation (fresh agent, same prompt)

At the owner's choice, a second fresh agent reviewed `main` at `dca26ce` with the prompt of section 1, changed only in
the commit and the report path (prompt file SHA-256 begins `84e1e1ef48fa63bc`). Its report, verbatim:

### CDS-18 behaviour re-review: report

#### Summary
The behaviour layer is in good order against contract v10 (`info.version` 0.7.0), API specification v12, UI specification v9, My Profile specification v4 and decision register v12. Every one of the 258 step lines in the 22 feature files matches exactly one agreed step-glossary pattern, every literal value checked against the personas and override samples is correct, and all 15 business rules and 10 of the 11 profile rules carry a tagged scenario (PR-05 is stretch, with the reason recorded). One scenario would fail against a correct implementation as its Given is arranged today (the BR-08 outline sets the clock after the overview has already loaded), and the remaining findings are gaps in boundary coverage, missing test hooks, unmapped API outcome types and stale wording. Counts: **1 Blocker, 10 Change, 11 Note**.

#### Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| C1 | 22 feature files; the 15 API act rows of step-glossary section 4.1 (14 distinct operations), the 3 test-control operations the Givens use (persona binding, clock, reset), `POST /auth/login` in the expiry Given, and the operations behind every UI page the scenarios open (UI catalogue, 14 rows); each checked for method, path, query parameter, status and header in `openapi.yaml`, including every status or Problem type the step glossary maps (202, 401, 404, three 422 types, 429 with `Retry-After`) | F-09, F-13 |
| C2 | Every literal in the 70 scenarios (57 scenarios, 13 outlines, 47 example rows): persona names, test users, account providers, money amounts, dates, counts, masks, mobile numbers, emails and preferred names, checked against the 7 persona files, `fixtures/users.json` and the 12 override samples using read-only dumps; all values matched (for example drilldown total debt 198279.60 and per-type 423.60, 12524.00, 185000.00, 32.00, 300.00; the struggling Lender Y loan's three 2024 misses) | F-14, F-17 |
| C3 | 51 rule tags (BR-01 to BR-15: 35; PR rules: 16), each scenario checked against the rule text and DR-011 to DR-048, including every boundary row (BR-03 49.50/49.49/0/100/115, BR-07 ±1% and zero base, BR-13 anniversary ±1 day, PR-09 59 s/60 s, PR-10 9:59/10:00, PR-02 31 characters) | F-01, F-02, F-03, F-04, F-12, F-15 |
| C4 | Every scenario in the 11 UI-layer files (10 `ui/` plus `security/open-redirect`), checked against the routes in UI specification section 5, the hooks in sections 6.1 to 6.7 and 7, and My Profile sections 3.1 to 3.3 and 4 | F-05, F-06, F-16 |
| C5 | 258 step lines matched against 154 regular expressions transcribed from step-glossary sections 3 to 5 (0 unmatched, 0 ambiguous); every 'Used in' cell compared with the files that actually use the pattern (all agree); 14 domain terms in scenario text checked against glossary section 4 and the retired list in section 6; step-glossary parameter types checked against contract enums | F-07, F-08, F-09, F-10, F-11, F-18, F-21 |
| C6 | BR-01 to BR-15 (15 of 15 tagged); PR-01 to PR-11 (10 of 11 tagged); page catalogue 15 rows, 14 naming a feature file, 11 distinct files, all present; UI and profile bug flags whose 'Expected catch' names a scenario | F-19, F-20, F-22 |

#### Findings

##### F-01 (Blocker, C3): The BR-08 outline sets the clock after the overview has already loaded
- Where: `features-shared/ui/report-overview.feature:9` and `:39-43`
- Scenario or glossary text: Background "And Alex is viewing the report for "Bureau A"" (line 9), then the outline "Given the next bureau refresh is <days> away" / "Then Alex is told the report updates in <wording>" (lines 41-42). The step glossary arranges that Given by the clock alone: "`the next bureau refresh is {days} away` | Set the clock that many days before the bureau's `nextRefreshDate` | Test control (clock)" (`DOCS/step-glossary.md:86`).
- Contract or specification text: "One `GET /reports/{bureauId}/overview` call feeds every section except the history chart" (`DOCS/.design/ui-specification.md:129`); the comparison section shows `next-update` from `bureau` (`ui-specification.md:134`); "`nextUpdateInDays` = whole days until the bureau's next refresh date, using the controlled clock" (`DOCS/.design/api-specification.md:203`).
- Why it matters: the Background has already rendered the page from an overview fetched at the earlier clock, and moving the clock does not refetch it. Arranged as the glossary says, a correct UI keeps showing the old value (for `excellent`, `nextRefreshDate` 2026-10-04) and the 0-day and 2-day rows fail; a stale-cache defect would be indistinguishable.
- Suggested fix: move the clock Given before navigation (drop the navigation from this feature's Background and add it to each scenario after the clock step), or state in the step glossary that this Given also reloads the report overview.

##### F-02 (Change, C3): The API debt-trend outline does not set the clock, and the clock's reset default is unspecified
- Where: `features-shared/api/debt.feature:6-7` and `:32-37`
- Scenario or glossary text: Background "Given Alex holds the "drilldown" persona" only; the outline "Given Alex's total debt three months ago was <earlier> / And Alex's total debt now is <now> / ... Then the debt trend is <trend>". The UI counterpart sets it: "And today is 3 October 2026" (`features-shared/ui/debt.feature:9`). The step glossary's 'Used in' for `today is {date}` omits `api/debt` (`DOCS/step-glossary.md:85`).
- Contract or specification text: "Trend compares to three months earlier" (`api-specification.md:202`); `balanceHistory` is "also the BR-07 trend source" (`api-specification.md:248`); reset "Reload fixtures, clear bug flags, reset clock and latency" (`api-specification.md:151`) with no stated default; `GET /__test/state` example "now: null" (`DOCS/.architecture/openapi.yaml:1068`). The override sample holds monthly points ending at 2026-10 (`fixtures/overrides/br07-debt-trend.json`, balance history 2026-05 to 2026-10).
- Why it matters: which balance-history month counts as "three months earlier" depends on the current month on the controlled clock. If the default after reset is real time, the outline gives different results once the run date leaves October 2026.
- Suggested fix: add "And today is 3 October 2026" to the API debt Background (and the 'Used in' cell), and state the clock's default after reset in API specification section 6.5.

##### F-03 (Change, C3): The only `@BR-04` scenario has one account, so it never exercises summing
- Where: `features-shared/api/account-totals.feature:10-21`
- Scenario or glossary text: "@BR-03 @BR-04 / Scenario Outline: Utilisation rounds half up / Given Alex has a credit card with a balance of <balance> and a limit of <limit>", arranged by "`fixtures/overrides/br03-one-credit-card.json`" (`DOCS/step-glossary.md:95`), which replaces the bureau's accounts with a single card (`acc_ovcc01`).
- Contract or specification text: "BR-04 | Type totals sum `balance` and `limit` across open accounts of that type where `includedInTotals` is true. Utilisation of the total follows BR-03." (`api-specification.md:199`)
- Why it matters: with one open card, a total that takes the first account, or that also counts closed accounts, gives the same figures, so a BR-04 defect passes. The scenario that does compare a multi-account total, 'The type list agrees with the overview card' (`features-shared/ui/account-drilldown.feature:10`), is untagged and compares two outputs of the same calculation.
- Suggested fix: add a `@BR-04` scenario on the `drilldown` credit cards (423.60 and -44.00 against 5100.00 and 1000.00, plus the closed card) asserting the summed balance, limit and utilisation, or tag the outline `@BR-03` only.

##### F-04 (Change, C3 and C6): BR-14 is exercised only through the UI, with no boundary row, and the API's own 422 is never reached
- Where: `features-shared/ui/account-details-form.feature:12-23`
- Scenario or glossary text: "When Alex records an interest rate of 29.9%" and "When Alex tries to record an interest rate of 120%" / "Then Alex is told the rate must be between 0% and 100%".
- Contract or specification text: "BR-14 | User-supplied details: `interestRate` and `apr` accept 0 to 100 with up to 2 decimal places; `promoPeriodMonths` 0 to 60; `minPayment` ..." (`api-specification.md:209`); "Field error ... Client check mirrors BR-14; server 422 shown verbatim" (`ui-specification.md:201`); the 422 is "`/problems/rule-violation/out-of-range`" (`openapi.yaml:1159`).
- Why it matters: 120% is stopped by the client check, so no scenario sends an out-of-range value to `PATCH /accounts/{accountId}/details`; an API that accepted 120 would pass. No row tests the inclusive limits (100 accepted, 100.01 or three decimal places refused).
- Suggested fix: add an `@api @BR-14` outline on `PATCH /accounts/{id}/details` with rows 100 (accepted), 100.01 and 29.999 (422 `out-of-range`), which also gives the out-of-range Problem type a scenario.

##### F-05 (Change, C4): Personal details and searches assertions have no specified hooks
- Where: `features-shared/ui/personal-details.feature:12-13`, `:17`; `features-shared/ui/searches.feature:16`, `:21`; `features-shared/ui/profile.feature:24`
- Scenario or glossary text: "Then Alex sees 1 current address and 2 previous addresses", "And Alex is shown as on the electoral roll", "Then none of the personal details can be edited", "And no hard search is listed", "Then Alex is told there are no hard searches", "But the credit report still shows Alex's legal name".
- Contract or specification text: "Searches lists `search-row-{id}`. Personal details is read-only in v1." (`ui-specification.md:210`); "`data-testid` values in this document are the contract between UI and harness" (`ui-specification.md:39`); empty states use "`{component-testid}-{state}`" (`ui-specification.md:75`), but neither page names a component test ID; PR-03 "it never appears on report pages" (`DOCS/.design/ui-feature-profile.md:104`).
- Why it matters: the personal details page has no hook for the name, an address, the current or previous flag or the electoral roll, and the searches page has no list hook to build the empty-state hook from. The PR-03 step does not say which report page or element shows the legal name. Each step definition will invent its own locator, which the specification says it must not.
- Suggested fix: add to UI specification section 6.7 hooks such as `pd-name`, `pd-address-{n}` with a current marker, `pd-electoral-roll` and `search-list` (giving `search-list-empty`), and name the report element the PR-03 step reads.

##### F-06 (Change, C4): The mobile tile is asserted to show "Verified", but the mobile tile has no status hook or text
- Where: `features-shared/ui/profile.feature:64`
- Scenario or glossary text: "Then the mobile tile shows "Verified""
- Contract or specification text: "Email | `profile-tile-email` | Address plus badge `profile-email-badge` | Verified / Unverified" and "Mobile | `profile-tile-mobile` | Masked number (`•••• ••• 123`) | 'Not added' / Unverified / Verified" (`ui-feature-profile.md:76-77`)
- Why it matters: for email the status has its own badge; for mobile the summary is specified as the masked number only, so whether "Verified" appears on the tile, and where, is not specified. A correct tile showing only `•••• ••• 456` would fail.
- Suggested fix: specify a `profile-mobile-badge` (Verified or Unverified) beside the masked number in section 3.3, as for email.

##### F-07 (Change, C5): `api/credit-balances.feature` uses a retired term and cites a superseded decision as open
- Where: `features-shared/api/credit-balances.feature:3`, `:6-7`
- Scenario or glossary text: "Feature: Credit balances"; "# How a credit balance is displayed is DR-005, still open (backlog CDS-02)." and "# These scenarios cover only what the API returns, which DR-005 does not change."
- Contract or specification text: "**Credit balance** | **In credit** | v1 | Ambiguous with a credit card's balance" (`DOCS/glossary.md:244`); "DR-005 | ... | Superseded by DR-018 (2026-10-04)" (`DOCS/decision-register.md:20`); DR-018 accepted (`decision-register.md:33`).
- Why it matters: the feature name is a retired synonym, and the comment tells a reader the display rule is undecided when DR-018 settled it and the UI scenario at `ui/account-drilldown.feature:25-30` depends on it.
- Suggested fix: rename the feature "Accounts in credit" and replace the comment with a reference to DR-018 and the UI scenario.

##### F-08 (Change, C5): "borrowing calculation" is not a glossary term
- Where: `features-shared/ui/account-drilldown.feature:18`
- Scenario or glossary text: "Then Alex sees which loans are not included in the borrowing calculation"
- Contract or specification text: "**Included in totals**, **excluded** | Whether an account counts towards its type's totals and total debt. A loan with no limit is excluded and listed separately" (`glossary.md:110`)
- Why it matters: a second phrase for the glossary's *excluded* concept, in a scenario tagged `@BR-05`; the glossary rule is one meaning, one term (`glossary.md:21`).
- Suggested fix: "Then Alex sees which loans are excluded from the loan totals", updating step-glossary section 5 in the same change.

##### F-09 (Change, C5 and C1): Three API outcome steps have no status or Problem type in the step glossary
- Where: `features-shared/api/profile-contact.feature:61-62`; `features-shared/security/access-control.feature:14`
- Scenario or glossary text: "Then Alex is told to request a new code", "And the code 123456 is no longer accepted", "Then the account is not found"; step glossary section 5 lists them with no mapping (`DOCS/step-glossary.md:177`, `:184`), while its convention says "In `@api` files, `is told …` and `is refused …` outcomes assert the status and the Problem `type`" (`step-glossary.md:35`) and it gives mappings for the other outcomes (`step-glossary.md:64-67`, `:186`).
- Contract or specification text: "The third wrong code voids the challenge; it, an expired or voided code, and a code with nothing pending are a 422 `/problems/rule-violation/code-invalid`" (`openapi.yaml:227-228`); 404 "`/not-found` | Unknown resource, or one owned by another user (BR-15)" (`api-specification.md:218`).
- Why it matters: without the mapping, step definitions may branch on wording, which DR-048 forbids, or accept any 422, so `code-wrong` on the third attempt (a PR-11 defect) would pass.
- Suggested fix: annotate the three rows: "told to request a new code" and "no longer accepted" = 422 `/problems/rule-violation/code-invalid`; "not found" = 404 `/problems/not-found`.

##### F-10 (Change, C5): The step glossary's Security row sits outside the Assert table
- Where: `DOCS/step-glossary.md:185-186`
- Scenario or glossary text: line 185 is blank, then "| Security | `{actor} is refused as not signed in` (401 `/problems/unauthenticated`); `test control is not found` (404) | `security/session-and-test-control` |".
- Contract or specification text: the table it belongs to starts at `step-glossary.md:170` ("| Area | Patterns | Used in |").
- Why it matters: in Markdown the blank line ends the table, so the row renders as a stray line of pipes and is easy to miss as an agreed step.
- Suggested fix: remove the blank line at 185.

##### F-11 (Change, C5): The normative glossary cites superseded document versions and a stale decision status
- Where: `DOCS/glossary.md:108`, `:146`, `:164`, `:198`, `:201`, `:204`
- Scenario or glossary text: "UI spec v3 section 7" (108), "Profile spec v3 section 4" (146), "API spec v6 section 6.5; contract v5" (164), "UI spec v3 section 5" (198), "This folder, `project-specs/credit-dashboard-sut/`, until Phase 1 lifts it into its own repository" (201), "A decision-register entry is `Proposed`, `Open` (no proposal yet, DR-005) or `Accepted`" (204).
- Contract or specification text: current versions are UI specification 9 (`ui-specification.md:2`), My Profile 4 (`ui-feature-profile.md:2`), API specification 12 (`api-specification.md:2`), contract 10 (`openapi.yaml:1`); the register says "no entry remains Proposed" and DR-005 is "Superseded by DR-018" (`decision-register.md:12`, `:20`).
- Why it matters: version 8 states it applied "current references" (`glossary.md:23`), yet six source cells point at versions that no longer exist at stable paths (DR-040), and the *Decision status* term omits the *Superseded* status the register uses.
- Suggested fix: cite sections without version numbers (DR-040 keeps paths stable), add *Superseded* to *Decision status*, and update the *Phase 0 pack* entry.

##### F-12 (Note, C3): PR-02's inclusive 30-character limit has no accepted row
- Where: `features-shared/ui/profile.feature:31-34`
- Scenario or glossary text: "| Alexandra-Catherine Montgomeryx | refused |" (31 characters, by script).
- Contract or specification text: "Preferred name: optional; trimmed; 1 to 30 characters when present" (`ui-feature-profile.md:103`).
- Why it matters: only the outside of the boundary is tested; a limit of 29 would pass. The `boundary` persona already holds a 30-character name, "Alexandra-Catherine Montgomery", as data.
- Suggested fix: add the row "Alexandra-Catherine Montgomery | saved as Alexandra-Catherine Montgomery".

##### F-13 (Note, C1): Contract and API specification differ on 404 for two operations scenarios call
- Where: `features-shared/api/account-totals.feature:13`; `features-shared/ui/searches.feature:9`
- Scenario or glossary text: "When Alex asks for the credit card totals" (`GET /reports/{id}/accounts/totals?type=`, `step-glossary.md:123`); searches page calls `GET /reports/{id}/searches`.
- Contract or specification text: the specification lists "400, 401, 404" for both (`api-specification.md:117`, `:125`); the contract documents only 400 and 401 (`openapi.yaml:604-605`, `:508-509`).
- Why it matters: no scenario asserts a 404 here, so nothing fails, but response validation of an unknown bureau would reject a 404 the specification allows. The contract wins.
- Suggested fix: add the `NotFound` response to both operations in the contract.

##### F-14 (Note, C2 and C3): `today is {date}` does not say what time of day; the UI debt trend sits just outside the steady band
- Where: `DOCS/step-glossary.md:85`; `features-shared/ui/debt.feature:9`, `:15`
- Scenario or glossary text: "`today is {date}` | Freeze server time | Test control (`PUT /__test/clock`)"; "And the debt trend is down".
- Contract or specification text: the clock body takes a date-time (`openapi.yaml:1020-1024`); BR-07 steady is "at most 1% either way, unrounded" (`api-specification.md:202`).
- Why it matters: by script, drilldown's debt in the 2026-07 balance-history month is 200358.60 against 198279.60 now, a change of -1.04%, so "down" is correct only if "three months earlier" means the 2026-07 point; the time of day matters for BR-13 and PR-09 only in edge cases. Both rest on conventions the glossary does not write down.
- Suggested fix: state in the glossary row the time the step sets (for example 09:00:00Z, the `asAt` time) and, in API specification section 5, that "three months earlier" is the balance-history point three calendar months before the current month.

##### F-15 (Note, C3): PR-06 does not say whether spaces are accepted
- Where: `features-shared/api/profile-contact.feature:42`
- Scenario or glossary text: "| 07700 900456  | held as unverified |"
- Contract or specification text: "Mobile numbers are UK format (`07` plus 9 digits, or `+447` plus 9 digits)" (`ui-feature-profile.md:107`); the contract example uses "'07700 900456'" (`openapi.yaml:207`).
- Why it matters: the expectation relies on spaces being ignored, which only the example implies.
- Suggested fix: add "spaces are ignored" to PR-06.

##### F-16 (Note, C4): `detail-tile-{field}` would break the lowercase hook pattern
- Where: `features-shared/ui/account-details-form.feature:16`
- Scenario or glossary text: "Then the credit card shows an interest rate of 29.9%"
- Contract or specification text: "`detail-tile-{field}`" (`ui-specification.md:186`); "Pattern: `{area}-{element}[-{qualifier}]`, kebab-case, lowercase" (`ui-specification.md:57`); the field names are camel case, `interestRate` (`openapi.yaml:1553`).
- Why it matters: the hook is either `detail-tile-interestRate` (breaking the pattern) or `detail-tile-interest-rate` (an unstated mapping).
- Suggested fix: state the qualifier form in section 6.5.

##### F-17 (Note, C2): UI money steps use two decimal places where summary figures show none
- Where: `features-shared/ui/account-drilldown.feature:29`; `features-shared/ui/debt.feature:14`, `:22-27`
- Scenario or glossary text: "Then the Harbour Bank card shows a balance of 44.00 in credit"; "Then the total debt is 198279.60".
- Contract or specification text: "no pence on summary figures (`£53,024`), pence on detail figures"; "`£44 in credit` on summary figures, `£44.00 in credit` on detail figures" (`ui-specification.md:65-66`); step convention "Money | Bare number, two decimal places" (`step-glossary.md:30`).
- Why it matters: consistent by design, but a step must compare values rather than text, and 198279.60 shown as £198,280 can only be checked to the pound.
- Suggested fix: note in step-glossary section 1 that UI money steps compare at the precision the figure is displayed.

##### F-18 (Note, C5): The details-form description still claims the return-link behaviour
- Where: `features-shared/ui/account-details-form.feature:6`
- Scenario or glossary text: "... within sensible limits, and the form only ever returns them to this site."
- Contract or specification text: the file's own header says "The return-link scenario moved to features-shared/security/open-redirect.feature" (`account-details-form.feature:2-3`).
- Why it matters: the description promises behaviour no scenario in the file covers.
- Suggested fix: drop the clause or point to `security/open-redirect.feature`.

##### F-19 (Note, C6): PR-05 has no scenario, and the reason is recorded
- Where: all feature files (no `@PR-05` tag; tag count by `grep`).
- Scenario or glossary text: "every PR rule except PR-05 (address sub-page, stretch) has a tagged scenario" (`step-glossary.md:218`).
- Contract or specification text: "**address**, **employment** and **finances** are stretch: specified here, not built until promoted (DR-022)" (`ui-feature-profile.md:86`); DR-022 (`decision-register.md:37`).
- Why it matters: none; the gap is deliberate and traceable.
- Suggested fix: none.

##### F-20 (Note, C6): Three bug flags name an expected catch that no scenario provides
- Where: `DOCS/.design/ui-specification.md:254`, `:261`; `DOCS/.design/ui-feature-profile.md:143`
- Scenario or glossary text: no scenario collapses the overview's changes toggle, checks the summary text for truncation, or navigates away from an unsaved preferred name.
- Contract or specification text: "`toggle-label` | 'See less' never flips back | State scenario"; "`truncate-summary` | ... | Content assertion"; "`lost-edit` | ... | Interaction scenario".
- Why it matters: the Phase 5 bug-flag proof ("Each flag on: at least one scenario fails", `ui-specification.md:276`) cannot be met for these three as the files stand.
- Suggested fix: add the three scenarios before Phase 5, or record them as component-test catches.

##### F-21 (Note, C5): `{accountType}` has no display name for current accounts
- Where: `DOCS/step-glossary.md:57`
- Scenario or glossary text: "Singular `credit card`, `loan`, `mortgage`, `utilities and telecoms account`, `credit account`; plural ... `credit accounts`".
- Contract or specification text: six types including "`currentaccount` Current accounts" (`glossary.md:101`); "Current accounts | Total overdraft limit" list row (`ui-specification.md:175`).
- Why it matters: no scenario uses it today (the overdraft Given is a literal phrase), but the parameter type cannot express the sixth enum value.
- Suggested fix: add `current account` and `current accounts`.

##### F-22 (Note, C6): Two scenarios exercise rules without their tags
- Where: `features-shared/ui/account-drilldown.feature:10`; `features-shared/ui/report-overview.feature:32`
- Scenario or glossary text: "Scenario: The type list agrees with the overview card"; "Scenario: Only the three newest changes are shown at first".
- Contract or specification text: BR-04 "Shown on the overview account card and the type list's summary card, which must agree" (`glossary.md:111`); BR-11 "The overview embeds the 3 newest in `recentChanges`" (`api-specification.md:206`).
- Why it matters: traceability from the rule to its UI evidence is lost ("A rule or section with no scenario is a gap", `glossary.md:183`).
- Suggested fix: tag them `@BR-04` and `@BR-11`.

#### Method
I read in full every file under `features-shared/` (22 files), `DOCS/step-glossary.md` (v6), `DOCS/glossary.md` (v8), `DOCS/.architecture/openapi.yaml` (v10, 1731 lines), `DOCS/.design/api-specification.md` (v12), `DOCS/.design/ui-specification.md` (v9), `DOCS/.design/ui-feature-profile.md` (v4) and `DOCS/decision-register.md` (v12), plus `fixtures/users.json`. I did not read decision briefs, the backlog, implementation material, session notes or any earlier review.

Read-only scripts, run from the scratchpad:
- `dump.py` printed each persona's profile, bureaux, score history, changes, searches, personal details and every account (balance, limit, utilisation, raw utilisation, inclusion, status, dates, masks, details, missed months, balance history) for `drilldown`, `struggling`, `excellent`, `boundary` and `thin-file`.
- `dumpov.py` printed the base persona, the `arranges` note and the accounts or changes of all 12 samples in `fixtures/overrides/`.
- `r2_steps.py` transcribed every pattern in step-glossary sections 3 to 5 into 154 regular expressions, using the section 2 parameter types, and matched every step line. Result: 22 files, 57 scenarios, 13 outlines, 47 example rows, 258 step lines, 0 unmatched, 0 matching more than one pattern. It also listed the files each pattern is used in; every 'Used in' cell agrees.
- Short `python -c` checks: preferred-name lengths (31 and 30 characters), and the drilldown debt trend (200358.60 in 2026-07 against 198279.60 now, -1.04%).
- `grep` counts of `@BR-` and `@PR-` tags (BR-01 to BR-15 all present; PR-05 absent), of clock steps, and of stale version references and retired terms in the glossary and feature files.

Values were then checked by hand against those outputs: drilldown debt total and per-type amounts, masks (`4821`, `**10`, `ab3f`, `12345678`), BR-03 rounding rows, BR-13 anniversary rows against DR-012, BR-12 override months against API specification section 5, PR-09 and PR-10 timings against DR-024 and DR-025, report-change dates and counts, searches, addresses and the struggling payment history.

**Author's verification.** F-01 (Blocker) and F-02 to F-05, F-07 to F-11 reproduced; F-06 reproduced in part (the
mobile tile's states included Verified, but no hook carried it). F-06, F-09 and F-10 arose from the first round of
fixes. **Owner's decision:** fix the Blocker and all Changes, Notes to backlog item CDS-24, then a scoped third pass.
Fixed in #17 (`79d6498`), to `DOCS/implementation-plans/2026-10-07_cds-18-fixes-addendum-2.md`.

## 6. Third pass: scoped to the diff of #16 and #17 (fresh agent)

A third fresh agent reviewed only what changed between `f16cea0` and `79d6498`, given as a diff, with the whole
repository as context (its prompt is the section 1 prompt plus a 'Scope' section naming the diff; prompt file SHA-256 begins `dbe5fad033920610`). Its
report, verbatim:

### CDS-18 behaviour re-review: report

#### Summary
The behaviour scenarios and the step glossary agree with contract v10, API specification v13, UI specification v10, My Profile specification v5 and DR-046 to DR-048 within the scope of the diff `f16cea0..79d6498`. I found no Blocker: every changed or added scenario would pass against a correct implementation, every literal value checked out against the fixtures, and every step line (269 lines across 23 files and 72 scenarios) matches an agreed pattern. Three Changes remain: the new PR-10 UI scenario drives a mobile sub-page that has no specified test hooks and an unclear flow; the normative glossary has no term for the new debt breakdown; and the glossary's *Account details* entry states an editability limit that the contract does not carry. Counts: 0 Blocker, 3 Change, 6 Note.

#### Per-check results
| Check | Items examined (with what was counted) | Findings |
|---|---|---|
| C1 | 17 operations named by changed or dependent scenarios and step-glossary rows (PATCH `/accounts/{id}/details`, GET `/accounts/{id}`, GET `/reports/{id}/accounts/totals`, GET `/reports/{id}/accounts?status=closed`, GET `/debt/overview`, GET `/reports/{id}/score`, GET `/reports/{id}/score/history`, GET `/reports/{id}/changes`, GET `/reports/{id}/overview`, GET `/reports/{id}/personal-details`, POST `/auth/login`, PUT `/__test/clock`, PUT `/__test/users/{username}/persona` with overrides, PUT `/me/profile/email`, POST `/me/profile/email/verification`, PUT `/me/profile/mobile`, POST `/me/profile/mobile/verification`); 10 status and Problem-type mappings in the step glossary (202; 401 unauthenticated; 404 not-found twice; 422 out-of-range, preferred-name, already-verified, mobile-number, code-invalid; 429 rate-limited), each checked against the response `$ref` and its example `type` | F-07 (Note) |
| C2 | About 50 literal values in changed or dependent scenarios (debt Givens and totals, 5 UI breakdown rows, BR-04 balances, limits and utilisation, 4 BR-14 rates, BR-02 point count and month, BR-13 group count and balance, BR-08 0-day row, preferred name `Ally`, Sam's mobile number and code); 4 personas (`drilldown`, `struggling`, `thin-file`, `excellent`) and 2 test users; 5 added or changed override samples, plus `node fixtures/schema-check.mjs` (448 checks, 0 failures) | F-03 (Change), F-05 (Note) |
| C3 | 27 tagged scenarios that the diff adds or changes, or that depend on changed rule text: BR-02 (1), BR-04 (1), BR-05 (1), BR-07 (5), BR-08 (1), BR-09 (2), BR-11 (3), BR-12 (3), BR-13 (1), BR-14 (1 outline, 4 rows), PR-02/PR-03 (1), PR-04, PR-06, PR-09 (2), PR-10 (2), PR-11; boundaries checked: BR-07 1% inclusive, BR-08 minimum 0, BR-14 inclusive 0 and 100 and 2 decimal places, BR-02 12 points ending at the current month, BR-12 month derivation in API spec section 5 | F-03 (Change), F-04 (Note) |
| C4 | 18 `@ui` scenarios that the diff adds or changes, or whose page text changed (account-drilldown 3, profile 3, report-overview 2, debt 2, searches 3, personal-details 2, report-changes 2, open-redirect 1); 17 hooks and routes (`debt-type-{type}`, `closed-group-{type}`, `search-list`, `search-list-empty`, `pd-name`, `pd-address-current`, `pd-address-previous-{n}`, `pd-electoral-roll`, `profile-tile-mobile`, `profile-mobile-badge`, `changes-toggle`, `next-update`, `detail-meta-*`, `detail-tile-{field}`, `list-excluded`, the closed-accounts route, the report-changes route with `sentiment`) | F-01 (Change), F-07 (Note) |
| C5 | 269 step lines in 23 files and 72 scenarios, matched by a read-only script against every section 3 to 5 pattern and section 2 parameter type: 269 of 269 match; 'Used in' columns of the 19 changed or added rows re-derived by `grep`, all correct; section 8 provenance counts (23, 72, 269) reproduced exactly; 13 changed entries in `DOCS/glossary.md` and 24 added or changed rows in the step glossary checked against the contract | F-02 (Change), F-06 (Note), F-08 (Note), F-09 (Note) |
| C6 | BR-01 to BR-15: 15 of 15 tagged (BR-08, BR-10 and BR-15 once each, the rest more); page catalogue: 15 pages, 14 naming a feature file, 11 distinct files named, all 11 exist; PR-01 to PR-11: 10 of 11 tagged, PR-05 untagged, explained as stretch by DR-022 and step glossary section 6.5 | none |

#### Findings

##### F-01 (Change, C4): the new PR-10 UI scenario drives a mobile sub-page with no specified hooks and an unclear flow
- Where: `features-shared/ui/profile.feature:58-64`; `DOCS/step-glossary.md:164`
- Scenario or glossary text: "When Sam adds the mobile number "07700 900456" / And Sam enters the code 123456 / Then the mobile tile shows "Verified"" (`profile.feature:62-64`); step glossary row "`{actor} adds the mobile number {string}`; `{actor} enters the code {code}` | Mobile sub-page (the same phrases as the API acts)" (`step-glossary.md:164`)
- Contract or specification text: "Mobile | `/my-account/profile/mobile` | Add or change number, mock one-time code (always `123456`, stated beside the code field ...)" (`DOCS/.design/ui-feature-profile.md:92`) and "Each sub-page has Save and Cancel, returns to the profile on save, and shows the change on the tile." (`DOCS/.design/ui-feature-profile.md:97`); the UI specification says the profile spec gives an "element inventory with `data-testid` values" (`DOCS/.design/ui-specification.md:219`), but the inventory covers only the overview (sections 3.1 to 3.3), not the sub-pages.
- Why it matters: the scenario needs a number input, a save, a code field and a submit on the mobile sub-page, none of which has a `data-testid`. And if saving the number "returns to the profile", it is not stated where the code is entered or when the tile is read, so two implementers could build different flows and both claim conformance.
- Suggested fix: add a short element inventory for the email and mobile sub-pages to the My Profile spec section 4 (for example the number input, the code field, save and status hooks), and state that the mobile page stays open for code entry and returns to the profile after a correct code.

##### F-02 (Change, C5): the normative glossary has no term for the debt breakdown that DR-046 introduced
- Where: `DOCS/glossary.md:112`; used at `features-shared/api/debt.feature:21`, `features-shared/ui/debt.feature:18-20`, `DOCS/step-glossary.md:181`
- Scenario or glossary text: "**Total debt**, or **debt** | The sum of positive balances on included open accounts, excluding current accounts | Not an account's *balance* | BR-07; `DebtOverview`" (`glossary.md:112`); scenario "And the debt on credit cards is 423.60" (`api/debt.feature:21`); step "`the debt on {accountType} is {money}`" (`step-glossary.md:181`)
- Contract or specification text: "`byType` splits the total: for each account type, the sum of the same positive balances, one entry per type above zero, in enum order (DR-046)." (`DOCS/.design/api-specification.md:203`); `DebtOverview.byType` "The total split by account type (BR-07, DR-046)" (`DOCS/.architecture/openapi.yaml:1663-1669`)
- Why it matters: the glossary's section 4 maps each domain term to its field and claims (version 8) to have applied the CDS-18 review, but the new concept *debt on an account type* has neither a definition nor a field mapping. A reader cannot tell from the glossary that it excludes negative balances and excluded loans, or that a type with nothing owed has no entry rather than 0.00.
- Suggested fix: add a row such as "**Debt by type** | The part of total debt owed on one account type; a type owing nothing is not listed | BR-07; DR-046; `DebtOverview.byType`".

##### F-03 (Change, C2 and C3): the *Account details* entry states an editability limit the contract and BR-14 do not carry
- Where: `DOCS/glossary.md:118`
- Scenario or glossary text: "**Account details** | The fields the customer supplies for an account: APR, interest rate, promotional period, minimum payment, payment method. Shown, and editable, for credit cards and credit accounts only"
- Contract or specification text: "`PATCH` body: `{ "field": "interestRate", "value": 29.9 }`. Allowed fields: `apr`, `interestRate`, `promoPeriodMonths`, `minPayment`, `paymentMethod`." (`DOCS/.design/api-specification.md:132`), with no restriction by account type; BR-14 limits only values (`api-specification.md:210`); the restriction exists only as a UI display rule: "Details tiles | link (not button) | `detail-tile-{field}` | Credit cards, credit accounts" (`DOCS/.design/ui-specification.md:187`).
- Why it matters: a glossary is normative for meaning, and "editable ... only" reads as a rule. It leaves open whether `PATCH /accounts/{id}/details` on a loan must be refused, and with what status; the contract's 422 types (DR-048) have no outcome for it. A future API scenario could be written either way and both would claim support.
- Suggested fix: either reword to "shown, and offered for editing in the UI, for credit cards and credit accounts only" or, if the API must refuse other types, add that to BR-14, the contract (a 422 outcome) and DR-048's list.

##### F-04 (Note, C3): a precision breach is reported as `out-of-range`
- Where: `features-shared/api/account-details.feature:20`; `DOCS/step-glossary.md:70`
- Scenario or glossary text: "| 29.999% | refused  |" and "`{accepted or refused}` | ... refused is 422 `/problems/rule-violation/out-of-range`"
- Contract or specification text: "RuleViolation: description: An account detail is out of range (BR-14)" (`DOCS/.architecture/openapi.yaml:1153-1154`); BR-14 "accept 0 to 100 with up to 2 decimal places" (`DOCS/.design/api-specification.md:210`); DR-048 lists `out-of-range` as the only BR-14 outcome (`DOCS/decision-register.md:63`).
- Why it matters: the scenario is consistent with DR-048, so it would pass against a correct implementation. The type name and response description cover the range and not the decimal-places limit, so an implementer reading the contract alone could treat 29.999 as a 400 or round it.
- Suggested fix: widen the `RuleViolation` description to "out of range or too precise (BR-14)", or note in DR-048 that `out-of-range` covers both limits.

##### F-05 (Note, C2): "the Lender X card" relies on the word "card" to pick one of two Lender X accounts
- Where: `features-shared/api/account-details.feature:13`; `DOCS/step-glossary.md:60` and `:128`
- Scenario or glossary text: "When Alex sets the interest rate on the Lender X card to <rate>"; `{provider}` "A provider's display name from the bound persona, unquoted: `Harbour Bank`, `Northgate Finance`, `Lender Y` | Resolved against the fixture, not a fixed list"
- Contract or specification text: `fixtures/personas/drilldown.json` holds two Lender X accounts, `acc_ddcc01` (`creditcard`, `sourceMask` 4821) and `acc_ddlc01` (`lineofcredit`, `sourceMask` ab3f), both of which carry account details per UI spec 6.5 (`ui-specification.md:187`).
- Why it matters: the target is unambiguous only if the harness resolves "{provider} card" to type `creditcard`. The glossary says *credit account* is never a card (`glossary.md:101`), so the reading is right, but the step row does not say how the account is resolved and the `{provider}` examples omit Lender X.
- Suggested fix: add "Lender X" to the `{provider}` examples and state in the 4.1 row that "the {provider} card" means that provider's open credit card in the bound persona.

##### F-06 (Note, C5): singular `{accountType}` forms are not defined in the glossary section the step glossary cites
- Where: `DOCS/step-glossary.md:57`; used at `features-shared/api/debt.feature:15-17`
- Scenario or glossary text: "Singular `credit card`, `loan`, `mortgage`, `utilities and telecoms account`, `credit account`; plural display names ... | Glossary section 4.2"; "And Alex owes 32.00 on a utilities and telecoms account"
- Contract or specification text: "**Account type** | One of six kinds. Contract value, then display name: ... `telecomsandutilities` Utilities and telecoms; `lineofcredit` Credit accounts" (`DOCS/glossary.md:101`)
- Why it matters: the singular forms read naturally and map one-to-one, so nothing fails, but *utilities and telecoms account* is a coined phrase the normative glossary does not list.
- Suggested fix: add the singular forms to the *Account type* row.

##### F-07 (Note, C1 and C4): the changes toggle lists "every change" from a paginated operation
- Where: `features-shared/ui/report-overview.feature:32-37`
- Scenario or glossary text: "When Sam shows all changes / Then 5 changes are listed"
- Contract or specification text: "the toggle calls `GET /reports/{bureauId}/changes` and lists every change in place" (`DOCS/.design/ui-specification.md:138`; DR-047, `DOCS/decision-register.md:62`); the operation is paged, "PageSize: ... maximum: 100, default: 20" (`DOCS/.architecture/openapi.yaml:1114`, referenced at `:400-401`).
- Why it matters: with `drilldown`'s 5 changes the scenario is correct. With more than 20 changes a single default call would not return "every change"; the specification does not say whether the toggle pages or sets `pageSize`.
- Suggested fix: state in UI spec 6.2 the page size the toggle requests, or that it follows the pager.

##### F-08 (Note, C5): the glossary's PR range is ahead of API specification section 6.6
- Where: `DOCS/glossary.md:180`
- Scenario or glossary text: "**Profile rule**, **PR-nn** | A numbered My Profile rule, PR-01 to PR-11"
- Contract or specification text: "Rules PR-01 to PR-08 live in the [My Profile UI feature spec](ui-feature-profile.md), section 5; the API enforces PR-01, PR-02 and PR-07" (`DOCS/.design/api-specification.md:169`), against PR-09 to PR-11 at `DOCS/.design/ui-feature-profile.md:111-113`.
- Why it matters: the glossary is right (it governs meaning, and UI spec 6.9 was moved to PR-11 in this diff), but the API specification sentence was not conformed, and the next paragraph of the same section says the API enforces PR-04, PR-06 and PR-09 to PR-11 too.
- Suggested fix: change API spec 6.6 to "Rules PR-01 to PR-11 ..." with the enforced list completed.

##### F-09 (Note, C5): a scenario title says "mobile page" where the glossary term is *sub-page*
- Where: `features-shared/ui/profile.feature:59`
- Scenario or glossary text: "Scenario: A mobile number added on the mobile page is verified with its code"
- Contract or specification text: "**Sub-page** | One of the five profile pages (email, mobile, address, employment, finances)" (`DOCS/glossary.md:146`)
- Why it matters: no ambiguity results, but scenario titles are within the glossary's scope (`glossary.md` section 1.1).
- Suggested fix: "... added on the mobile sub-page ...".

#### Method
I read the scope diff (1,713 lines) in full, then the current text of all 23 feature files, `DOCS/step-glossary.md`, and the changed parts of `DOCS/glossary.md`, and checked them against the contract (`openapi.yaml`: paths, the new 422 responses, `Problem`, `DebtOverview`, `AccountTotals`, `DetailUpdate`, `AccountDetails`, `PersonalDetails`, test-control responses), API specification sections 3, 5, 6.3 to 6.6, 7 and 8, UI specification sections 5, 6.2 to 6.7 and 6.9, My Profile specification sections 3.3 to 5, and DR-046 to DR-048. I did not run git and changed no repository file.

Read-only scripts:
- A Python summary of `fixtures/personas/{drilldown,struggling,thin-file,excellent,boundary}.json` (accounts with balance, limit, inclusion, closed state, open date, missed months; score history; searches; personal details; changes; profile block) and `fixtures/users.json`. From it I confirmed, for example, 423.60 + 12524.00 + 185000.00 + 32.00 + 300.00 = 198279.60 with the 1161.00 no-limit loan and the -44.00 card left out; BR-04 credit-card totals 379.60 / 6100.00 = 6.22%, so 6%; `drilldown` score history Nov 2025 to Oct 2026 with January 2026 null; `struggling`'s one closed card (31 May 2022); `drilldown`'s 1 current and 2 previous addresses and electoral roll true.
- A Python sum of `drilldown`'s monthly total debt from `balanceHistory`: 200358.60 in July 2026 against 198279.60 in October 2026, a fall of 1.04%, so `down` as `ui/debt.feature:15` expects.
- `node fixtures/schema-check.mjs` after confirming by `grep` that it makes no file-system writes: 7 personas, 2 users, 12 override samples, 448 checks, 0 failures (it applies the v12 BR-09 mask that drops non-alphanumerics). I also read the three new BR-12 samples: opened 2019-01-01 with no missed months (all on time), opened 2026-01-15 (2025 entirely no-data) and opened 2025-07-01 (no-data then on-time, so on time), which match API spec section 5 and BR-12.
- A Python step matcher in the scratchpad (`stepcheck.py`) that turns every backticked pattern in step-glossary sections 3 to 5 into a regular expression from the section 2 parameter types, expands Scenario Outline rows, and matches every step line: 72 scenarios, 269 step lines, 269 matched (the first run's 5 misses were a fault in my `{provider}` expression, which required two letters after "Lender"; corrected by hand). `grep -l` then re-derived the 'Used in' column for 19 changed rows; all agreed.
- `grep -ohE "@(BR|PR)-[0-9]+"` over the feature files for the coverage counts in C6.

**Author's verification.** F-01 to F-03 reproduced. **Owner's decision:** fix them and the one-line Notes F-08 and F-09,
have the same reviewer re-check the fixes, then sign off. The same agent then re-checked twice; its record, verbatim:

### CDS-18 behaviour re-review: fix check (79d6498 to 76fae4b)

#### Summary
All five targeted findings (F-01, F-02, F-03, F-08, F-09) are resolved. The new mobile sub-page section 4.1 agrees with the contract, PR-06, PR-10, PR-11, DR-025, DR-048 and `ui/profile.feature` on every outcome it names. It adds one new Change: the number field is "pre-filled, masked", which leaves undefined what Save submits when the customer has not retyped the number. It also adds three new Notes. Counts: 0 new Blocker, 1 new Change (F-10), 3 new Notes (F-11 to F-13).

#### 1. Status of the earlier findings

##### F-01 (Change, C4), the mobile sub-page hooks and flow: resolved
- Before: `ui/profile.feature:62-64` drove a sub-page with no hooks, and "Each sub-page ... returns to the profile on save" (`ui-feature-profile.md:97` at `79d6498`) conflicted with entering a code afterwards.
- Now: "The mobile sub-page is the exception: saving a number keeps the page open for the code (section 4.1)." (`DOCS/.design/ui-feature-profile.md:98`). Section 4.1 gives hooks for every action the scenario takes: `mobile-input` and `mobile-save` ("on 200 the code step appears on the same page"), `mobile-code-input`, and `mobile-code-submit` ("on 200 returns to the profile, whose tile badge `profile-mobile-badge` shows Verified").
- Against the scenario: "When Sam adds the mobile number "07700 900456" / And Sam enters the code 123456 / Then the mobile tile shows "Verified"" (`features-shared/ui/profile.feature:62-64`). Each step now maps to a named element, and the final Then is read on the profile, where section 4.1 says the page returns. The step glossary row "Mobile sub-page (the same phrases as the API acts)" (`DOCS/step-glossary.md:164`) still holds.

##### F-02 (Change, C5), no glossary term for the debt breakdown: resolved
- Now: "**Debt breakdown** | Total debt split by account type: for each type, the sum of the same positive balances, one entry per type above zero (*Decided, DR-046*) | Not *type totals*, which sum all balances of open included accounts (BR-04) | BR-07; DR-046; `DebtOverview.byType`" (`DOCS/glossary.md:113`).
- Against the sources: BR-07 "`byType` splits the total: for each account type, the sum of the same positive balances, one entry per type above zero, in enum order (DR-046)" (`DOCS/.design/api-specification.md:204`) and BR-04 "Type totals sum `balance` and `limit` across open accounts of that type where `includedInTotals` is true" (`api-specification.md:201`). The definition and the *Not this* contrast are both accurate. The entry does not mention enum order, but that is an ordering detail of the field, not of the term.

##### F-03 (Change, C2 and C3), *Account details* implying an API restriction: resolved
- Now: "Customer-supplied, within the limits BR-14 sets. The UI offers them as details tiles on credit cards and credit accounts (UI spec section 6.5); the contract does not restrict them by type" (`DOCS/glossary.md:119`).
- Against the sources: "Details tiles | link (not button) | `detail-tile-{field}` | Credit cards, credit accounts" (`DOCS/.design/ui-specification.md:187`) and "Allowed fields: `apr`, `interestRate`, `promoPeriodMonths`, `minPayment`, `paymentMethod`." with no type limit (`api-specification.md:133`). The entry now states the UI fact as a UI fact and makes no API rule.

##### F-08 (Note, C5), API specification 6.6 citing PR-01 to PR-08: resolved
- Now: "Rules PR-01 to PR-11 live in the [My Profile UI feature spec](ui-feature-profile.md), section 5; the API enforces PR-01, PR-02, PR-04, PR-06, PR-07 and PR-09 to PR-11" (`DOCS/.design/api-specification.md:170`). This matches the glossary's "PR-01 to PR-11" (`DOCS/glossary.md:181`) and the later paragraph in the same section, "the API enforces PR-04, PR-06 and PR-09 to PR-11 for them" (`api-specification.md:181`). See F-11 for one rule the list leaves out.

##### F-09 (Note, C5), "mobile page" in a scenario title: resolved
- Now: "Scenario: A mobile number added on the mobile sub-page is verified with its code" (`features-shared/ui/profile.feature:59`), matching "**Sub-page** | One of the five profile pages" (`DOCS/glossary.md:147`).

#### 2. New findings introduced by the diff

I checked every row of section 4.1 against the contract operations `PUT /me/profile/mobile` and `POST /me/profile/mobile/verification` (`DOCS/.architecture/openapi.yaml:193-244`), the responses `MobileNumberRefused` and `CodeRefused`, the schema `MobileChallenge` (`openapi.yaml:1374-1381`), PR-06, PR-10 and PR-11 (`ui-feature-profile.md:122-127` at `76fae4b`), DR-025, DR-048, and `ui/profile.feature`. These agree:
- 200 opens the code step: the contract's success response is `'200'` "Number held as unverified; a code is pending".
- `mobile-error` comes from the 422 `mobile-number` type, as in `MobileNumberRefused`.
- The code hint says the code is always 123456, as DR-025 and PR-10 require.
- `mobile-code-error` branches on the `code-wrong` and `code-invalid` types, never on wording, as DR-048 requires. The attempts left come from `attemptsRemaining`.
- After `code-invalid` the page asks for the number to be added again, which matches PR-11 ("a new one must be requested by adding the number again") and the contract detail "Add the number again to get a new code."
- Cancel leaves a saved number Unverified, which matches PR-10.

No row contradicts the contract or a rule.

##### F-10 (Change, C4): the number field is "pre-filled, masked", but section 4.1 does not say what Save submits if the customer leaves it
- Where: `DOCS/.design/ui-feature-profile.md:104` (section 4.1, Number row)
- Specification text: "Number | textbox, labelled | `mobile-input` | UK format (PR-06); the current number pre-filled, masked, when held"
- Contract and rule text: the profile carries only the last digits, "Tile summaries never carry finance figures (PR-07) or a full mobile number." (`openapi.yaml:95`) with `mobile: lastDigits: '123'` (`openapi.yaml:110`). PR-06: "Mobile numbers are UK format (`07` plus 9 digits, or `+447` plus 9 digits)" (`ui-feature-profile.md:122`).
- Why it matters: the UI can only pre-fill a masked value such as `•••• ••• 123`, and that value is not a PR-06 number. If Save submits it unchanged, the result is a 422 `mobile-number` the customer did not cause. The profile overview's Save is "Shown once the value changes" (`ui-feature-profile.md:65`), but the mobile Save row gives no such condition. Implementers could differ: an empty input with the mask as a placeholder, Save disabled until edited, or a submitted mask. No current scenario fails: `excellent` holds a mobile number, but no scenario opens its mobile sub-page.
- Suggested fix: say "the current number shown masked beside the field (or as its placeholder); the field starts empty", or give `mobile-save` the overview's rule, "shown once the value changes".

##### F-11 (Note, C3): API specification 6.6's list of enforced rules omits PR-03, which the contract assigns to `greetingName`
- Where: `DOCS/.design/api-specification.md:170`
- Specification text: "the API enforces PR-01, PR-02, PR-04, PR-06, PR-07 and PR-09 to PR-11"
- Contract text: "greetingName: ... The name the app greets the customer by (PR-03): the preferred name when set, otherwise the first word of the legal name (DR-036)." (`openapi.yaml:1417-1422`)
- Why it matters: the greeting half of PR-03 is computed by the API, and the scenario 'Alex sets a preferred name' (`ui/profile.feature:20-24`, tagged `@PR-03`) depends on it. The keep-off-report half is the UI's job. The scenario is unaffected.
- Suggested fix: add "PR-03 (the greeting, through `greetingName`)" to the list.

##### F-12 (Note, C4): the email sub-page still has no hooks, while 6.9 promises an inventory with `data-testid` values
- Where: `features-shared/ui/profile.feature:47-51` (`@PR-04` 'A changed email needs verifying again'). This scenario is unchanged and outside the original diff; I raise it because section 4.1 now gives the mobile sub-page hooks and its sibling has none.
- Scenario text: "When Alex changes their email to "alex.new@example.com" / Then the email shows as unverified"
- Specification text: "Email | `/my-account/profile/email` | Current address, change form, 'Resend verification'" (`ui-feature-profile.md:92`), with no element inventory; and UI spec 6.9 says the profile spec gives an "element inventory with `data-testid` values" (`ui-specification.md:219`).
- Why it matters: the harness will have to invent the hooks for the email form and the resend button. That is the same gap F-01 closed for mobile.
- Suggested fix: add a section 4.2 for the email sub-page in the same shape as 4.1.

##### F-13 (Note): the API specification's front matter drops the git-history pointer
- Where: `DOCS/.design/api-specification.md:4`
- Text: "supersedes: v13 (2026-10-07T12:50Z)", where v13 read "...; earlier versions are in git history (DR-040)". The UI and My Profile specifications at `76fae4b` keep the clause (for example `ui-feature-profile.md:4`).
- Why it matters: this is only a consistency point, since DR-040 still applies.
- Suggested fix: restore the clause.

#### Method
I read the fix diff (135 lines) in full, then the current text at `76fae4b` of `DOCS/.design/ui-feature-profile.md` sections 3.2 to 5, `DOCS/.design/api-specification.md` section 6.6 and its front matter, and the `/me/profile`, `/me/profile/mobile`, `/me/profile/mobile/verification` and `MobileChallenge` parts of `openapi.yaml`, plus the `User.greetingName` schema. I re-read `ui/profile.feature` and the step-glossary rows that drive the mobile sub-page. I ran no git commands and changed no repository file.

#### Re-check 2 (76fae4b to 193bdf4)

I read the fix diff (37 lines) in full and checked it against `openapi.yaml` (`GET /me` and the `User` schema at lines 74-86; `MobileContact` at lines 1362-1367), PR-03, PR-06, DR-036 and DR-040. F-12 is deferred to the backlog by the owner and is not re-checked here. I ran no git commands and changed no repository file.

##### F-10 (Change, C4), the masked pre-fill in the number field: resolved
- Now: "| Current number | text | `mobile-current` | The number held, masked (`•••• ••• 123`), with its status; absent when none is held |" and "| Number | textbox, labelled | `mobile-input` | Always starts empty, never pre-filled with the mask; UK format (PR-06) |" (`DOCS/.design/ui-feature-profile.md`, section 4.1, the first two rows).
- Against the sources: the masked display comes from data the contract supplies, `MobileContact` "required: [lastDigits, status]" (`openapi.yaml:1362-1367`). It is now a read-only element, so a mask can no longer be submitted. An input that starts empty means Save sends only what the customer types, which PR-06 then validates ("Mobile numbers are UK format", `ui-feature-profile.md:123`). The PR-10 scenario (`ui/profile.feature:58-64`, Sam on `thin-file` with no mobile) is unaffected: `mobile-current` is absent and the input is empty.

##### F-11 (Note, C3), PR-03 missing from API specification 6.6: resolved
- Now: "the API enforces PR-01, PR-02, PR-04, PR-06, PR-07 and PR-09 to PR-11, supplies PR-03's greeting as `greetingName` on `GET /me` (DR-036)" (`DOCS/.design/api-specification.md:170`).
- Against the contract: `GET /me` returns `User` with `greetingName: Al` in its example (`openapi.yaml:85`), described as "The name the app greets the customer by (PR-03) ... (DR-036)" (`openapi.yaml:1417-1422`). The wording "supplies PR-03's greeting" is accurate. It correctly does not claim the API enforces PR-03's other half (never on report pages), which belongs to the UI.

##### F-13 (Note), the git-history pointer in the front matter: resolved
- Now: "supersedes: v13 (2026-10-07T12:50Z); earlier versions are in git history (DR-040)" (`DOCS/.design/api-specification.md:4`), matching `ui-feature-profile.md:4`.

##### New findings in this diff
No new Blocker and no new Change. One new Note:

###### F-14 (Note): the two edited specifications keep their version numbers
- Where: `DOCS/.design/api-specification.md:2` ("version: 14") and `DOCS/.design/ui-feature-profile.md:2` ("version: 6"). Both files changed in this diff, but neither front matter version nor 'Changes in' line changed.
- Rule text: "Specifications at stable paths are edited in place: the frontmatter version and a 'Changes in vN' line record the change" (`DOCS/decision-register.md:55`, DR-040).
- Why it matters: v14 and v6 have not yet merged, so amending them on the same branch is defensible. Their 'Changes in' lines still describe the content accurately: "section 6.6 cites PR-01 to PR-11 and the rules the API enforces" (`api-specification.md:13`) and "section 4.1 specifies the mobile sub-page: its hooks, ..." (`ui-feature-profile.md:14`). Only the `created` timestamps (13:05Z) now predate the content.
- Suggested fix: none needed if unmerged versions may be amended in place. Otherwise, refresh the `created` timestamps when the branch merges.

## 7. Owner's sign-off

**Signed off by Gary Brooks, 2026-10-07**, by interview: "Sign off; merge when green". The Phase 2 exit gate is met
(DR-049): the three-amigos review is recorded (brief 4, DR-033) and was re-reviewed independently until no Blocker or
Change finding remained; every BR is tagged (15 of 15); the fixtures pass. Remaining Notes are backlog item CDS-24.
