---
version: 10
created: 2026-10-04T16:50Z
updated: 2026-10-07T13:05Z
project: credit-dashboard-sut
type: glossary
language: en-GB
status: normative
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Give every term the pack's specifications, contract, scenarios and fixtures use
            exactly one meaning, and record the words that had more than one.
  LOCATION: DOCS/glossary.md (Phase 0 pack; moves to DOCS/glossary.md in the project repository at Phase 1)
  TEMPLATE: templates/glossary.template.md (portfolio root)
-->

# Glossary: credit-dashboard-sut

**The rule.** Every term below has **one meaning** in this project's specifications, contract, feature files, fixtures and, from Phase 3, its code. A word with more than one meaning in use is either given one, or split into qualified terms that each have one. Where this glossary and another project document disagree about what a word means, this glossary is right and the other document is conformed to it.

**Status.** Normative from 5 October 2026 (DR-033), after the three-amigos review recorded in decision brief 4. Where this glossary and another project document disagree about what a word means, this glossary is right. Version 1 was compiled on 4 October 2026; versions 2 to 5 recorded decision briefs 1 to 3; version 6 makes it normative; version 7 adds `greetingName` (DR-036); version 8 applies the CDS-18 review: *Account information*, the masking wording, the PR range and current references; version 9 removes the remaining versioned citations and adds *Superseded* (CDS-18 confirmation pass); version 10 adds *Debt breakdown* and corrects *Account details* (CDS-18 third pass).

---

## 1. Scope

### 1.1 What this covers

The words used by the API specification, the UI specification, the My Profile UI feature spec, the contract `DOCS/.architecture/openapi.yaml`, the decision register, the backlog, the README, every feature file under `features-shared/`, and the fixtures under `fixtures/`. From Phase 1 it also covers step definitions, Screenplay class names and code identifiers that name a domain concept.

### 1.2 What it does not cover

| Vocabulary | Where it is defined instead | Why not here |
|---|---|---|
| Agreed Gherkin step phrases | `DOCS/step-glossary.md` | Steps are sentences built from these terms; this glossary defines the words, the step glossary the sentences |
| The source app's own labels, as surveyed | The page survey, `credit-dashboard-sut_design-spec_v2_20261003T1705Z.md` | A survey quotes its subject; conforming its vocabulary would falsify the record |
| Contract field and enum names (`includedInTotals`, `lineofcredit`) | `DOCS/.architecture/openapi.yaml` | The contract is the source of truth for the API (API spec, header). Section 4 maps each domain term to its field where one exists |

### 1.3 Terms owned elsewhere

**Cited so a reader can find them, not redefined.** If the owner changes, the owner wins.

| Term | Owner | Short gloss, for orientation only |
|---|---|---|
| **Backlog status values** (`READY TO START`, `IN PROGRESS`, `BLOCKED`, `COMPLETE`) | `DOCS/backlog.md`, status vocabulary; `templates/backlog.template.md` | The stages a backlog item moves through |
| **Handover**, **worklist** | `portfolio-prompts/project-layout.md` | A versioned session-notes briefing; the loop's control record at the portfolio root (from Phase 1, CDS-10) |
| **Decision brief** | `templates/decision-brief.template.md` | The document a decision is put to the owner in: options, one recommendation, the argument against |
| **Actor**, **Ability**, **Task**, **Interaction**, **Question** | Serenity/JS Screenplay pattern (DR-006; version pinned at Phase 1, DR-009) | The harness's types. *Question* capitalised is the Screenplay type; lower-case is an open question |
| **Feature**, **Scenario**, **Scenario Outline**, **Background**, **step** | Gherkin reference (Cucumber) | Gherkin's keywords. See *feature* in section 5 |
| **OpenAPI**, **operation**, **schema**, **example** | OpenAPI Specification 3.1 | The contract's format |
| **Problem details** (`type`, `title`, `status`, `detail`, `instance`) | RFC 9457 | The error body format; this project's `type` suffixes are in API spec section 8 |
| **WCAG 2.2 AA**, **accessible name**, **role** | W3C WCAG 2.2; WAI-ARIA | The accessibility baseline (UI spec section 4.5) |
| **Prism**, **Redocly CLI**, **Schemathesis**, **axe-core** | Each tool's documentation | Mock server; contract linter; property-based API tester; accessibility scanner |

---

## 2. How to read an entry

Each group in section 4 is a table: **Term**, **Meaning**, **Not this** (the neighbouring term or retired word most likely to be confused with it) and **Source** (the specification section, rule or contract schema that fixes the meaning). A meaning still awaiting a decision is not in section 4; it is in section 3. A meaning marked *Decided, brief 1 Dn* rests on that item of `DOCS/decision-briefs/credit-dashboard-sut_decision-brief-1_v1_20261004T1809Z.md`.

Contract names are given in `code`. Domain terms are written in plain English in specifications and scenarios, and in the contract's spelling only when the text is about the API itself.

---

## 3. Terms awaiting a decision

Definitions an agent cannot settle on its own, because each changes what a rule, a scenario or a hook requires. Each is carried by a decision brief and moves into section 4 when decided.

**None at this version.** The six terms listed in version 1 (steady, listed, utilisation above 100, on time, phase, the report-change hooks) were decided on 4 October 2026 in decision brief 1 and are now in section 4.

---

## 4. Terms

### 4.1 The credit report

| Term | Meaning | Not this | Source |
|---|---|---|---|
| **Bureau** (plural **bureaux**) | A fictional credit reference agency whose report the customer sees. Named *Bureau A*, *Bureau B* in fixtures and scenarios | Not a lender. No real bureau is modelled (DR-010) | API spec section 5; `Bureau` |
| **Credit report**, or **report** | Everything one bureau holds about the customer: score, changes, impact counts, accounts, searches and personal details. Bare *report* means this | Not a *Serenity report*, which is test evidence | API spec section 5 |
| **Credit score**, or **score** | An integer from 0 to 1000 given by one bureau | Not a percentage | BR-01; `Score` |
| **Benchmark** | The national or local average score, on the same 0 to 1000 scale. Scenarios say *national average* and *local average* | Not the customer's own score | BR-01; `Score` |
| **Score history** | Monthly scores for a range of 3, 6 or 12 months, oldest first, ending at the current month. A month with no score is a gap, never a carried-forward value | Not *payment history* or *balance history* | BR-02; `ScorePoint` |
| **Range** | One of `3m`, `6m`, `1y`, selecting how much score history to show. Scenarios say *3 months*, *6 months*, *1 year* | Not a date range on payment history | BR-02 |
| **Next update** | The number of whole days until the bureau next refreshes the report, from the controlled clock; never below 0. Shown as "Updates in 1 day" | Not a *report change*. See *update* in section 5 | BR-08; `nextUpdateInDays`, `nextRefreshDate` |
| **Report summary** | The short generated text describing the report, with like and dislike feedback | Not the *type totals* card, not a *tile summary*, not `AccountSummary` | UI spec 6.2; `Summary` |
| **Summary feedback** | The customer's verdict on the report summary: `like`, `dislike` or `none`. Setting one replaces the other | | BR-10; `Feedback` |
| **Report change** | One dated event on the report, with a sentiment (`positive`, `neutral`, `negative`) and an impact (`low`, `medium`, `high`). Listed newest first; the overview carries the 3 newest. Shown by the `ChangeCard` component, hook `change-card-{id}`, on every page (*Decided, brief 1 D6*) | Not a *notification*. *Signal*: retired (section 6) | BR-11; `Change`; DR-016 |
| **Impact counts** | How many report topics fall under *action needed*, *monitor* and *doing well* | Not a report change's *impact* rating | UI spec 6.2; `Impact` |
| **Search** | A record that an organisation looked at the report, classed by the bureau as a **hard search** or a **soft search** (`kind`). The two are listed apart. What makes a search hard is not yet specified | | API spec 6.2; `Search` |
| **Personal details** | What the bureau holds about the customer: name, current and previous addresses, electoral roll. Read-only in this app | Not the *account profile*, which the customer edits. The source app's account page is also titled "Personal details" (section 5) | UI spec 6.7; `PersonalDetails` |
| **Electoral roll** | Whether the customer is registered to vote at their current address, as the bureau records it | | `PersonalDetails.electoralRoll` |

### 4.2 Accounts, balances and debt

| Term | Meaning | Not this | Source |
|---|---|---|---|
| **Account** | A credit agreement on the report, of one *account type*. Bare *account* means this | Not the customer's *user account* for signing in. See section 5 | API spec section 5; `Account` |
| **Account type** | One of six kinds. Contract value, then display name: `creditcard` Credit cards; `loan` Loans; `mortgage` Mortgages; `currentaccount` Current accounts; `telecomsandutilities` Utilities and telecoms; `lineofcredit` Credit accounts | *Credit account* is the display name of `lineofcredit` only, never a generic term | `AccountType`; UI spec 6.4 |
| **Account status** | `normal`, `arrears`, `default`, `settled` or `closed` | Not a *payment status* or a *year status* | `AccountStatus` |
| **Open account**, **closed account** | An account whose status is not `closed`; one that is. A closed account reports a balance of 0 and is **listed** while today is before its close date plus six calendar years, so it drops off on the sixth anniversary; a 29 February close drops off on 28 February (*Decided, brief 1 D2*) | | BR-13; DR-012 |
| **Balance** | The amount owed on an account, as money. On a loan or mortgage the UI calls it *remaining* | Not *debt*, which is a total across accounts | `AccountSummary.balance` |
| **In credit** | An account whose balance is negative: the lender owes the customer. The API returns the negative amount; the UI shows the amount without a sign followed by 'in credit' (`£44 in credit`), for any negative figure (*Decided, brief 2 D2*) | *Credit balance*: avoid, because it reads as "the balance on a credit card" | BR-06; DR-018 |
| **Limit** | The ceiling an account's balance is measured against. On a credit card or credit account, the credit limit; on a loan, the amount originally borrowed (UI: *borrowed*); on a current account, the overdraft limit. May be absent | | `AccountSummary.limit`; UI spec 6.4 |
| **Utilisation** | Balance divided by limit, × 100, rounded half up to a whole number; absent when the limit is zero or absent. Floored at 0 for an account in credit. No upper bound (*Decided, brief 1 D3*) | Not capped at 100 | BR-03, BR-06; `Utilisation`; DR-013 |
| **Over limit** | Of an account: utilisation above 100, because the balance exceeds the limit. The UI shows the real figure and an 'Over limit' badge | Not *in arrears*, which is an account status | BR-03; UI spec section 7; DR-013 |
| **Unfloored utilisation** | The utilisation before the floor at 0, so negative for an account in credit | | BR-06; `utilisationRaw` |
| **Included in totals**, **excluded** | Whether an account counts towards its type's totals and total debt. A loan with no limit is excluded and listed separately | | BR-04, BR-05; `includedInTotals`, `AccountTotals.excluded` |
| **Type totals** | The summed balance and limit, and their utilisation, across the included open accounts of one type. Shown on the overview account card and the type list's summary card, which must agree | Not the *report summary* | BR-04; `AccountTotals` |
| **Total debt**, or **debt** | The sum of positive balances on included open accounts, excluding current accounts | Not an account's *balance* | BR-07; `DebtOverview` |
| **Debt breakdown** | Total debt split by account type: for each type, the sum of the same positive balances, one entry per type above zero (*Decided, DR-046*) | Not *type totals*, which sum all balances of open included accounts (BR-04) | BR-07; DR-046; `DebtOverview.byType` |
| **Debt trend** | Total debt now compared with three months earlier: `up`, `down` or `steady` | Not *score history* | BR-07; `DebtOverview.trend` |
| **Steady** | Of the debt trend: the unrounded change against three months earlier is at most 1% either way, so exactly 1% is steady. From an earlier total of zero, steady if still zero, otherwise up (*Decided, brief 1 D1*) | | BR-07; DR-011 |
| **Balance history** | Six monthly balances for one account, oldest first. Also the source of the debt trend | | `BalancePoint` |
| **Masked number** | How an account number leaves the service: `*` and the last four letters or digits of the source (other characters dropped), uppercase, left-padded with `0` when fewer remain. The full number never leaves the service | Not the *source mask* | BR-09; `MaskedNumber` |
| **Source mask** | The account number, or partial number, as the fixture's source data supplies it; the input to masking | Not the *source app*. See section 5 | API spec 9.1; `sourceMask` |
| **Account details** | The fields the customer supplies for an account: APR, interest rate, promotional period, minimum payment, payment method. Customer-supplied, within the limits BR-14 sets. The UI offers them as details tiles on credit cards and credit accounts (UI spec section 6.5); the contract does not restrict them by type | Not *personal details*. Not the profile's *details list*. Not *account information* | BR-14; `AccountDetails` |
| **Account information** | What the account page shows about any account: update frequency, status and opened date | Not *account details* (customer-supplied) | UI spec 6.5, `detail-meta-*` |
| **APR**, **interest rate** | Two separate account details, each 0 to 100 with up to 2 decimal places | Not interchangeable | BR-14 |
| **Promotional period** | Months, 0 to 60, of a promotional rate | | BR-14; `promoPeriodMonths` |

### 4.3 Payment history

| Term | Meaning | Not this | Source |
|---|---|---|---|
| **Payment status** | The status of one month on one account: `on-time`, `missed` or `no-data`. Scenarios write *on time*, *missed*, *no data* | Not an *account status* | `PaymentStatus` |
| **Missed payment** | A month with payment status `missed` | Not an account in `arrears` | BR-12 |
| **Payment history** | Payment statuses for the current year and the six before it, across all accounts or for one | Not *score history* | BR-12; `PaymentHistory` |
| **Year status** | One status per year: `missed` if any month is missed; `no data` if every month is no-data; otherwise `on time`, including a year mixing on-time and no-data months (*Decided, brief 1 D4*) | No fourth status | BR-12; DR-014 |

### 4.4 The customer and the account profile

| Term | Meaning | Not this | Source |
|---|---|---|---|
| **Customer** | The person using the app, in feature descriptions and specifications. In scenarios, a named *test user* acts as the customer | Not *user* bare. See section 5 | Feature files |
| **User account** | The customer's sign-in identity in the app | Not an *account* on the report | Profile spec section 1 |
| **Account profile**, page title **My profile** | What the app holds about the customer, partly editable: legal name, date of birth, preferred name, contact and optional details | Not *personal details*, which the bureau holds | Profile spec section 1; `Profile` |
| **Legal name** | The customer's name as on the credit report; read-only in the app | Not the *preferred name* or `User.displayName` | PR-01 |
| **Preferred name** | An optional name, 1 to 30 characters after trimming, used in greetings in the app only and never on report pages | Not the legal name | PR-02, PR-03 |
| **Greeting** | Where the app addresses the customer by name, such as the header menu. Uses `greetingName` from `GET /me`: the preferred name when set, otherwise the first word of the legal name | Not `displayName`, which is the legal name | PR-03; DR-036 |
| **Verification link** | The mock link sent when an email is added or changed; following it verifies the email. It may be resent once 60 seconds have passed since the last one (PR-09) | Not a one-time code | PR-04, PR-09 |
| **One-time code** | The six-digit code that verifies a mobile number, valid for less than 10 minutes; always `123456` in this demo; the third wrong entry voids it (PR-10, PR-11) | Not a verification link; not a password | PR-10, PR-11 |
| **Verification status** | `verified` or `unverified`, for the email address or mobile number. Changing the email sets it to unverified | Not an account or payment status | PR-04; `VerificationStatus` |
| **Tile** | A link showing a label and, on the profile, a one-line **tile summary** | Not a button (bug flag `button-href`) | UI spec section 7; profile spec 3.3 |
| **Sub-page** | One of the five profile pages (email, mobile, address, employment, finances). Release 3 builds email and mobile; the others are stretch (DR-022) | | Profile spec section 4; DR-022 |
| **Finances** | The customer's annual income and monthly housing cost, in minor units; never shown on the profile overview | | PR-07 |

### 4.5 The system under test

| Term | Meaning | Not this | Source |
|---|---|---|---|
| **ScoreHarbour** | The placeholder product name of the fictional dashboard | Not a real brand | README |
| **Contract** | `DOCS/.architecture/openapi.yaml`. Where a specification and the contract disagree, the contract wins | Not the *harness contract* of other portfolio projects | API spec header |
| **Minor units** | Money as an integer number of pence with a currency (`amountMinor`, `currency`). Only the UI formats money | Not pounds as a decimal (bug flag `currency-float`) | DR-004; `Money` |
| **Persona** | A named set of fixture source data: report, accounts and the non-identity part of the profile. Seven exist: `excellent`, `struggling`, `thin-file`, `boundary`, `drilldown`, `error`, `slow` | Not a *test user*. Any test user can hold any persona | API spec 9, 9.1; `Persona` |
| **Test user** | A fixture identity that can sign in: username, legal name, date of birth, email. Two exist, Alex and Sam | Not a persona | API spec 9.1; `fixtures/users.json` |
| **Hold** (a persona) | A test user is bound to a persona: "Alex holds the excellent persona" | | `PUT /__test/users/{username}/persona` |
| **Fixture** | A file under `fixtures/` the service loads at start and on reset | | API spec 9.1 |
| **Source data**, **derived value** | What a fixture stores; what the service calculates from it (totals, debt, trend, year statuses, next update) and never stores | Not the *source app* | API spec 9.1 |
| **As-at time** | A persona's reference time, `asAt`; every fixture date is relative to it. All seven use 2026-10-03T09:00:00Z | Not the *controlled clock*, which can move | API spec 9.1 |
| **Controlled clock** | Server time as set by test control. Moving it changes derived values, not stored data | | BR-08; `PUT /__test/clock` |
| **Test control** | The `/__test/*` operations that arrange state: reset, persona binding, bug flags, clock, latency. Enabled only when `TEST_CONTROL=true` and the request carries `X-Test-Control-Key` | Not part of the product; never in a production build | API spec 6.5; DR-008 |
| **Overrides** | Test-control data supplied when binding a persona, replacing named lists for one bureau, so a scenario can arrange data no persona holds (*Decided, brief 2 D1*). Contract schema `PersonaOverrides`; accounts use `FixtureAccount` | Not a fixture; never stored | API spec section 6.5; contract `PersonaOverrides`; DR-020 |
| **Bug flag** | A switch, off by default, that plants one known defect so a scenario can be shown to catch it. API-layer flags are in API spec section 10, UI-layer in UI spec section 8, profile flags in the profile spec section 7 | *Feature flag*: retired (section 6) | DR-008 |
| **Debug panel** | The `/__debug` page that drives test control from the browser | Tooling, not a product page | UI spec 6.8 |
| **Demo banner** | The banner on every page saying all data is fictional; cannot be dismissed | | UI spec 4.4 |
| **Mock**, **Prism mock** | Prism serving the contract's examples, used to build the UI before the API exists | Not a *bug flag* | API spec section 3; UI spec section 2 |
| **Generated client** | The typed API client generated from the contract, through which the UI makes every call | | UI spec section 2 |
| **Test hook** | A `data-testid` value, pattern `{area}-{element}[-{qualifier}]`. Part of the UI spec; renaming one is a spec change | Not a Cucumber hook | UI spec 4.1 |
| **Component state** | One of *loading*, *empty*, *error*, *populated*, which every data-bound component implements | Not an account status | UI spec 4.3 |
| **Page catalogue** | The UI spec's table of pages, routes, endpoints and feature files | | UI spec section 5 |
| **Source app** | The real credit-score site whose page structure was surveyed. Structure only; never visited for data, never re-surveyed without the owner's say-so | Not *source data* or the *source mask* | Page survey; profile spec header |

### 4.6 Testing and evidence

| Term | Meaning | Not this | Source |
|---|---|---|---|
| **Business rule**, **BR-nn** | A numbered API rule, BR-01 to BR-15 | Not a *profile rule* | API spec section 7 |
| **Profile rule**, **PR-nn** | A numbered My Profile rule, PR-01 to PR-11 | Not a pull request | Profile spec section 5 |
| **Rule tag** | A scenario tag naming the rule it covers, `@BR-nn` or `@PR-nn` | Not a *layer tag* | README, traceability chain |
| **Layer tag** | `@api`, `@ui`, `@security`, `@a11y`, saying which layer a scenario exercises. `@profile` groups the profile scenarios | | README; feature files |
| **Traceability chain** | Rule or UI spec section, to contract operation or test hook, to tagged scenario, to Screenplay task. A rule or section with no scenario is a gap | | README |
| **Fixture check** | `npm run check` in `fixtures/`: schema validation of every fixture, then cross-checks of the rules a schema cannot express | | API spec 9.1 |
| **Mutation probe** | Planting one deliberate defect per rule to prove a check catches it, and catches it for the right rule | Not mutation testing of production code | Handover v4, section 5 |
| **Contract lint** | Redocly CLI with the house ruleset `redocly.yaml`, run from the pack root | | API spec section 11 |
| **Response validation** | Checking every API response against the contract during scenarios | Not *contract lint* | API spec section 11 |
| **Bug-flag proof** | Turning each bug flag on and showing at least one scenario fails for the stated reason | | UI spec section 9; README Phase 5 |
| **Three-amigos review** | The owner, a developer view and a tester view reviewing the feature files together, recorded as Phase 2 evidence | | README Phase 2; CDS-07 |
| **Serenity report** | The test report the harness publishes | Not a *credit report* | README Phase 5 |

### 4.7 Process and documents

| Term | Meaning | Not this | Source |
|---|---|---|---|
| **SDD phase**, or **phase** | One of Phase 0 (specify) to Phase 5 (defects and evidence), each with an exit gate. Bare *phase* means this (*Decided, brief 1 D5*) | Not a *release* | README, SDD workflow; DR-015 |
| **Stretch** | Of a page or operation: specified, and deliberately not built until promoted. The address, employment and finances profile sub-pages are stretch (*Decided, brief 2 D7*) | Not out of scope | DR-022 |
| **Release** | A group of pages that ship together, R1 to R3, as listed in the UI spec page catalogue. Release 1 (login, report overview) is built during SDD Phase 4 (*Decided, brief 1 D5*) | Not an SDD phase, and not a deployment | UI spec section 5; DR-015 |
| **Exit gate** | The condition that must hold before the next SDD phase starts | Not a *verification check* | README, SDD workflow |
| **Verification check** | A tool run that keeps a specification honest (lint, example validity, response validation). The specifications head these *Verification checks* | Not an *exit gate*. See *gate* in section 5 | API spec section 11; UI spec section 9 |
| **Phase 0 pack** | The frozen specification folder `project-specs/credit-dashboard-sut/` in the portfolio repository, from which this repository was seeded at CDS-09 (5 October 2026) | Not this repository | DR-001; DR-038 |
| **Specification first** | A change is made to the contract, a rule table or the fixture format before fixtures, scenarios or code | | README, change control |
| **Owner** | The person who accepts decisions and reviews the pack; the *approver* in a decision brief | | Decision register |
| **Decision status** | A decision-register entry is `Proposed`, `Open` (no proposal yet), `Accepted`, or `Superseded` by a later entry (for example DR-005 by DR-018); an accepted entry changes only by a new entry that supersedes it | Not a backlog status | Decision register |
| **Superseded** | Of a versioned file: replaced by a later version, kept, and not edited | | README contents; handover working norms |
| **Decision brief** | A dated document putting decisions to the owner with options, one recommendation and the argument against; indexed in `DOCS/decision-briefs/_index.md`. Its outcome is recorded as DR entries | Not a DR entry | `templates/decision-brief.template.md` |
| **Page survey** | The design spec files: a record of the source app's page structure. Input to the specifications, not a specification | Filenames keep *design-spec*; prose says *page survey* | README contents |

---

## 5. Words with more than one meaning in use

Counted on 4 October 2026, case-insensitively, across the current documents listed in section 8 (superseded versions and the page survey excluded). Counts are occurrences of the string, so they include compounds.

| Word | Senses found (occurrences) | Rule |
|---|---|---|
| **account** | A credit account on the report; the customer's user account ("My account" menu, `btn-account`, "account profile", 3); `lineofcredit`'s display name *Credit accounts* (4) | Bare *account* is a report account. Otherwise *user account* or *account profile*. *Credit account* only for `lineofcredit` |
| **details** (73) | Account details (BR-14); personal details (16); the profile's details list; "sign-in details" | Always qualified: *account details*, *personal details*, *sign-in details* |
| **personal details** (16) | The bureau-held report page; the source app's account page titled "Personal details" (profile spec header) | *Personal details* is the bureau page only. The editable page is the *account profile* |
| **summary** (78) | Report summary text (BR-10); type totals card ("summary card", `list-summary`); profile tile summary; `AccountSummary` (an account row) | *Report summary*, *type totals*, *tile summary*. `AccountSummary` is a contract name and stays |
| **overview** (61) | Report overview; debt overview; profile overview (PR-07) | Always qualified on first use in a section |
| **update** (7 as *updates*) | Next update (bureau refresh, BR-08); report changes (`/insights/updates`, `list-updates`) | *Next update* is the refresh only. Report changes are *report changes*; their hooks say *change* (DR-016). The route `/insights/updates` keeps its name, mirroring the surveyed source structure |
| **history** (78) | Score history; balance history; payment history; address history (PR-05) | Always qualified |
| **status** (94) | Account, payment, year, verification and employment status; backlog and decision statuses | Always qualified |
| **report** (155) | Credit report; Serenity report; *report changes* | Bare *report* is the credit report |
| **impact** (29) | Impact counts (`Impact`); a report change's impact rating | *Impact counts*; *change impact* |
| **limit** (54) | Credit limit; amount borrowed on a loan; overdraft limit | One field, meaning by account type; see *Limit* |
| **credit balance** (6) | A negative balance (BR-06, DR-005); readable as "the balance on a credit card" | Say *in credit* |
| **source** (46) | Source app; fixture source data; source mask | Always qualified |
| **flag** (52) | Bug flag; "Feature flags" (UI spec section 3, meaning bug flags, 1); `negative-balance` flag (backlog CDS-02, defined nowhere) | *Bug flag* only. `negative-balance` is now a UI bug flag (DR-019) |
| **gate** (22) | SDD exit gate; verification gates (tool checks); "gated" test control | *Exit gate*; *verification check*; test control is *enabled* |
| **phase** (57 as *Phase n*) | SDD phases 0 to 5; page catalogue phases 1 to 3 | Bare *phase* is an SDD phase; the catalogue says *Release* (DR-015) |
| **user** | Test user (12 as *test user*); `User` schema; the customer in prose | *Test user* for fixtures; *customer* in prose; `User` for the schema |
| **spec** (143) | API, UI and UI feature specifications; the page survey, filed as *design spec* | *Page survey* for the design spec files |
| **feature** | A Gherkin feature file; a product feature ("UI feature spec") | *Feature file* for Gherkin; product features are named by page |

## 6. Retired synonyms

| Retired | Use instead | Since | Why |
|---|---|---|---|
| **Signal** | **Report change**; hooks `change-card-{id}`, `ChangeCard`, `list-changes` | v1 in prose, v2 in hooks | Two words for `Change` (DR-016) |
| **Phase** (page catalogue) | **Release**, R1 to R3 | v2, 2026-10-04 | Collided with SDD phases (DR-015) |
| **Verification gate** | **Verification check** | v2 | *Gate* belongs to SDD phases |
| **Credit balance** | **In credit** | v1 | Ambiguous with a credit card's balance |
| **Feature flag** | **Bug flag** | v1 | The UI spec uses it once to mean bug flags |
| **Design spec** (in prose) | **Page survey** | v1 | It records the source app; it is not a specification |
| **Gated** (test control) | **Enabled** | v1 | *Gate* belongs to SDD phases |

### 6.1 Conformance pass

**Run 4 October 2026** (version 2), with decision brief 1 and on the same branch. Rule applied: no change alters a rule's meaning except where a brief 1 decision changed it, and those carry a DR reference.

| Document | Changes |
|---|---|
| Contract v4 (`info.version` 0.3.0) | New `Utilisation` schema for the two utilisation fields; `Percent` removed as unused (brief 1 section 7.3); steady rule on `DebtOverview.trend`; personal details "(Release 3)" |
| API spec v4 | BR-03, BR-06 wording, BR-07, BR-12, BR-13; section 5 "signals" dropped; 6.5 heading "off by default"; 6.6 "Release 3"; section 9 `struggling`; section 11 "Verification checks"; two section 12 questions resolved |
| UI spec v3 | Catalogue column *Release*; section 6 headings; `change-card-{id}`, `list-changes`, `ChangeCard`; "Bug flags" row; over-limit display in 4.2 and section 7; "Verification checks" |
| My Profile spec v2 | *Release 3*; section 6 records the page-level endpoints now in the contract (CDS-11) |
| Fixtures | `struggling` card `acc_stcc02` at 1,150.00 against 1,000.00 (115%); `schema-check.mjs` v2 applies the 29 February rule |
| API feature files | Boundary rows for BR-03 (115), BR-07 (exactly 1%, zero base) and BR-13 (the anniversary); BR-12 mixed-year row annotated; comments that avoided the boundaries replaced |

**Where the pass departed from the plan:**

- *Gated* was planned to become *enabled*; in API spec v4 it became *off by default*, which reads better beside "Enabled only when `TEST_CONTROL=true`". Both are consistent with section 6.
- The UI feature files still say "Covers UI specification v2, section 6.n". Section numbers did not change in v3, so the references stay true; they are updated with the CDS-07 section-naming work.
- `Percent` was planned to stay and was removed (brief 1 section 7.3).

**Closed in version 3:** the `negative-balance` flag named under CDS-02 is now defined in UI spec v4 section 8 (DR-019).

---

## 7. Keeping it true

- **A new term** is added here before it is used in a specification, feature file or code, not after.
- **A changed meaning** increments `version`, and every document using the term is conformed in the same change.
- **A term that needs a decision** goes to section 3 and to the owner; it is not defined by whoever writes first.
- **A borrowed term** is cited in section 1.3, never redefined.
- **The step glossary** uses these terms; a step phrase that needs a word not defined here adds it here first.
- **What a glossary does not do**: it fixes word ambiguity. An undecided rule boundary is a decision, not a vocabulary problem, which is why version 1 routed four of them to the owner rather than choosing.

## 8. Provenance

Compiled 4 October 2026 from a full read of: API spec v3 (`credit-dashboard-sut_api-spec_v3_20261004T1257Z.md`), UI spec v2 (`credit-dashboard-sut_ui-spec_v2_20261004T1207Z.md`), My Profile UI feature spec v1, the decision register v1, the backlog v6, the README v5, the contract v3 schema and enum definitions, `fixtures/users.json`, and all 17 feature files (comments excluded). Occurrence counts in section 5 are case-insensitive `grep -o` counts over the README, the three current specifications, the decision register, the backlog, `openapi.yaml`, `fixtures/persona.schema.json`, `fixtures/schema-check.mjs` and the 17 feature files.

**Version 2** (4 October 2026) changed only what decision brief 1 decided and what the conformance pass touched; the section 5 counts are those of version 1 and were not re-taken.

**Not read for version 1:** the page survey (excluded by section 1.2), the superseded specification and contract versions, the seven persona JSON files (only their format, via API spec 9.1), and the handovers beyond v4 section 5.
