---
version: 8
created: 2026-10-09T11:35Z
project: credit-dashboard-sut
type: step-glossary
language: en-GB
status: normative
---

# Step glossary: credit-dashboard-sut

**What this is.** The agreed Gherkin phrases for `features-shared/`, one pattern per meaning, with the parameter types the harness will define and how each Given is arranged. The words inside the phrases are defined in `DOCS/glossary.md`; this document defines the sentences.

**Status.** Normative from 5 October 2026 (DR-033), after the three-amigos review recorded in decision brief 4. A new step is added here before it is used in a feature file. Version 8 adds the harness rules for *that account* and a wrong code (CDS-22; `DOCS/.design/harness-design.md`); version 7 applies the CDS-18 confirmation pass (section 6.6); version 6 applied the CDS-18 independent re-review; version 5 applied the three-amigos review (section 6); earlier versions added the email and mobile steps (v4), recorded the overrides (v3) and the in-credit step (v2).

---

## 1. Conventions

These describe the files as they stand; section 6 flags where they are not yet followed.

| Topic | Convention | Example |
|---|---|---|
| Actors | Test users by first name: **Alex**, **Sam** (`fixtures/users.json`). Descriptions say *a customer* | `Given Sam holds the "struggling" persona` |
| Persona and bureau names | Quoted, as data | `"drilldown"`, `"Bureau A"` |
| API act verb | `asks for` | `When Alex asks for the loan totals` |
| UI act verbs | `views`, `opens`, `is viewing`, `chooses`, and named interactions (`signs in`, `likes`, `cancels`) | `When Alex opens the loan list` |
| UI outcome verbs | `sees` for content; `is told` for a message; `shows` for an element's state | `Then Alex is told there are no hard searches` |
| API outcome form | `the {thing} is {value}` | `Then the balance is -44.00` |
| Money | Bare number, two decimal places, no currency sign or thousands separator; negative with a leading `-` | `12524.00`, `-44.00` |
| Percentages | Number followed by `%` in steps; bare number in an `utilisation` column | `29.9%`, `115%` |
| Dates | Long form, always (DR-031) | `3 October 2026` |
| Counts | Digits, with the noun in the right number | `1 soft search is listed`, `3 hard searches are listed` |
| Layers | The same outcome may read the same in API and UI files; the layer comes from the file's tag (`@api`, `@ui`) and the harness profile | `Then the total debt is 198279.60` in both `api/debt` and `ui/debt` |
| API messages | In `@api` files, `is told …` and `is refused …` outcomes assert the status and the Problem `type`, never `title` or `detail` (DR-048). UI files assert the message shown | `is told the email is already verified` = 422 `/problems/rule-violation/already-verified` |

## 2. Parameter types

Each becomes a Cucumber parameter type in `test-harnesses/harness-serenity/src/support/` at Phase 3.

| Type | Matches | Notes |
|---|---|---|
| `{actor}` | `Alex`, `Sam` | A test user, not a persona |
| `{persona}` | `"excellent"`, `"struggling"`, `"thin-file"`, `"boundary"`, `"drilldown"`, `"error"`, `"slow"` | The contract's `Persona` enum |
| `{bureau}` | `"Bureau A"`, `"Bureau B"` | Display name, resolved to a bureau ID |
| `{money}` | `-?\d+\.\d{2}` | Converted to minor units (DR-004) |
| `{percent}` | `-?\d+(\.\d+)?%` | Utilisation and rates |
| `{date}` | `\d{1,2} (January…December) \d{4}` | Long form |
| `{year}` | `\d{4}` | Payment history |
| `{count}` | `\d+` | Lists and totals |
| `{days}` | `1 day`, `{count} days` | Next update |
| `{time}` | `\d{2}:\d{2}:\d{2}` | Time of day on the controlled clock, with today's date |
| `{code}` | `\d{6}` | One-time code (PR-10) |
| `{range}` | `3 months`, `6 months`, `1 year` | BR-02 |
| `{trend}` | `up`, `down`, `steady` | BR-07 |
| `{yearStatus}` | `on time`, `missed`, `no data` | BR-12 |
| `{accountType}` | Singular `credit card`, `loan`, `mortgage`, `utilities and telecoms account`, `credit account`; plural display names `credit cards`, `loans`, `mortgages`, `utilities and telecoms`, `credit accounts` | Glossary section 4.2 |
| `{month}` | `(January…December) \d{4}` | A calendar month, long form (BR-02) |
| `{string}` | Double-quoted text | Cucumber's built-in type |
| `{provider}` | A provider's display name from the bound persona, unquoted: `Harbour Bank`, `Northgate Finance`, `Lender Y` | Resolved against the fixture, not a fixed list |
| `{payment pattern}` | `all on time`, `on time, apart from one missed month`, `not reported in any month`, `on time in the months reported` | BR-12; each arranged by a sample (section 3) |
| `{hard or soft}` | `hard`, `soft` | Search kind |
| `{listed or not listed}` | `listed`, `not listed` | BR-13 |
| `{refused or sent}` | `refused`, `sent` | PR-09: refused is 429 `/problems/rate-limited`; sent is 202 |
| `{verified or still unverified}` | `verified`, `still unverified` | PR-10 |
| `{mobile outcome}` | `held as unverified`, `refused` | PR-06: refused is 422 `/problems/rule-violation/mobile-number` |
| `{name outcome}` | `refused`, `saved as {name}` | PR-02: refused is 422 `/problems/rule-violation/preferred-name` |
| `{name}` | A preferred name, unquoted: letters, spaces, hyphens, apostrophes | PR-02 |
| `{tile}` | `email`, `mobile`, `address`, `employment`, `finances` | Profile details list |
| `{accepted or refused}` | `accepted`, `refused` | BR-14: accepted is 200 with the value stored; refused is 422 `/problems/rule-violation/out-of-range` |

## 3. Arrange (Given)

**Arranged by** says how the harness makes the step true:

- **Test control:** a `/__test/*` call (persona binding, clock).
- **Navigation:** the UI is driven to a page or state.
- **Fixture:** the bound persona already holds this data; the step checks it is so and fails loudly if not.
- **Overrides:** test control binds the persona with `overrides` (API spec v6 section 6.5). Each row names the sample in `fixtures/overrides/` that the fixture check validates.
- **Environment:** the harness runs the step against a service instance started for it (for example without `TEST_CONTROL`).
- **That account:** a Given that describes one account stores that account as *that account* for its actor, which `asks for that account` then requests; the harness resolves it against the bound persona (or the overrides applied), and an ambiguous or missing match fails the step. Two accounts in one scenario are referred to by provider (`the {provider} card`).
- **GAP:** nothing can make it true. None remain since version 3; section 6.1 records how they were closed.

| Pattern | Means | Arranged by | Used in |
|---|---|---|---|
| `{actor} holds the {persona} persona` | Bind the test user to the persona | Test control (`PUT /__test/users/{username}/persona`) | All files |
| `today is {date}` | Freeze server time | Test control (`PUT /__test/clock`) | `api/closed-accounts`, `api/debt`, `api/payment-history`, `api/profile-contact`, `api/score`, `ui/account-drilldown`, `ui/debt`, `ui/payment-history` |
| `the next bureau refresh is {days} away` | Set the clock that many days before the bureau's `nextRefreshDate` | Test control (clock) | `ui/report-overview` |
| `{actor} has signed in` | A valid session exists | Navigation | `ui/login` |
| `{actor} is viewing the report for {bureau}` | On the report overview | Navigation | `ui/report-overview` |
| `{actor} is viewing the payment history for {bureau}` | On the payment history page | Navigation | `ui/payment-history` |
| `{actor} is viewing the report changes for {bureau}` | On the report changes page | Navigation | `ui/report-changes` |
| `{actor} is viewing their profile` | On My profile | Navigation | `ui/profile` |
| `{actor} is viewing a credit card with no interest rate recorded` | On the detail page of such a card | Navigation + fixture (`drilldown` cards hold no rate) | `ui/account-details-form` |
| `{actor} has noted the credit card total on the report overview` | Note the overview figure for a later comparison | Navigation | `ui/account-drilldown` |
| `{actor} shows only positive changes` | Filter applied | Navigation | `ui/report-changes` |
| `{actor} has a credit card with a balance of {money} and a limit of {money}` | Such a card exists | Fixture (`drilldown`: 423.60 / 5100.00 and -44.00 / 1000.00, open; its closed Lender Y card is not one of these); Test control (overrides, `fixtures/overrides/br03-one-credit-card.json`) for the outline rows; Test control (overrides, `fixtures/overrides/br03-zero-limit-card.json`) for 0.00 / 0.00 | `api/account-totals`, `api/credit-balances` |
| `{actor} has a credit card that is {money} in credit` | Such a card exists | Fixture (`drilldown`) | `api/debt` |
| `{actor} has a loan of {money} against {money} borrowed` | Such a loan exists | Fixture (`drilldown`) | `api/account-totals` |
| `{actor} owes {money} on a {accountType}` | Such an account exists, open and counted in totals (for loans, the row below) | Fixture (`drilldown`) | `api/debt` |
| `{actor} owes {money} on a loan with a limit` / `with no limit` | Such a loan exists | Fixture (`drilldown`) | `api/account-totals`, `api/debt` |
| `{actor} has a credit card that closed on {date}` | Such a closed card exists | Fixture for 31 May 2022 (`struggling`); Test control (overrides, `fixtures/overrides/br13-closed-anniversary.json`) for the outline dates | `api/closed-accounts` |
| `{actor}'s email is verified` | Email status verified | Fixture (`excellent`) | `api/profile-contact`, `ui/profile` |
| `{actor}'s preferred name is {string}` | Preferred name set | Fixture (`excellent`, "Al") | `ui/profile` |
| `{actor} has added their finances` | Finances added | Fixture (`excellent`) | `ui/profile` |
| `the source supplies the account number {string}` | The source mask is this | Fixture for `4821`, `**10`, `ab3f`; Test control (overrides, `fixtures/overrides/br09-source-mask.json`) for `12345678` | `api/masking` |
| `{actor}'s total debt three months ago was {money}` / `now is {money}` | Debt history gives this trend | Test control (overrides, `fixtures/overrides/br07-debt-trend.json`) | `api/debt` |
| `{actor}'s payments in {year} were {payment pattern}` | That year's months are as described (month statuses: API spec section 5) | Test control (overrides): `br12-all-on-time-2025.json`, `br12-payments-2025.json` (one missed month), `br12-no-data-2025.json`, `br12-part-year-2025.json`, in `fixtures/overrides/`, one per row | `api/payment-history` |
| `{actor} has {count} report changes` | The bureau holds that many changes | Fixture (`drilldown` 5) | `api/report-changes`, `ui/report-changes` |
| `{actor}'s report has {count} changes` | The bureau holds that many changes, arranged | Test control (overrides, `fixtures/overrides/changes-twenty-five.json`) | `ui/report-changes` |
| `{actor}'s report changes arrive dated {date}, {date} and {date}` | The changes, in that source order | Test control (overrides, `fixtures/overrides/br11-unsorted-changes.json`) | `api/report-changes` |
| `{actor} has report changes dated {date} and {date}` | The bureau holds changes on those dates | Fixture (`excellent`) | `api/report-changes` |
| `{actor}'s only accounts are a credit card owing {money} and a current account overdrawn by {money}` | Exactly those two accounts | Test control (overrides, `fixtures/overrides/br07-current-account.json`) | `api/debt` |
| `{actor} changed their email to {string} at {time}` | An email change at that time, which sends a link | Test control (clock) + `PUT /me/profile/email` | `api/profile-contact` |
| `{actor} added the mobile number {string}` (optionally `at {time}`) | A number held as unverified with a code pending | Test control (clock) + `PUT /me/profile/mobile` | `api/profile-contact` |
| `{actor}'s token has expired` | The session token is past its `expiresAt` | `POST /auth/login`, then Test control (clock) moved past `expiresAt` (API spec section 3) | `security/session-and-test-control` |
| `test control is switched off` | The service runs without `TEST_CONTROL` | Environment (a service instance started without it; DR-008) | `security/session-and-test-control` |

## 4. Act (When)

### 4.1 API

| Pattern | Calls | Used in |
|---|---|---|
| `{actor} asks for the {accountType} totals` | `GET /reports/{id}/accounts/totals?type=` | `api/account-totals` |
| `{actor} asks for one of {actor}'s accounts` | `GET /accounts/{id}` with another user's ID | `security/access-control` |
| `{actor} asks for that account` | `GET /accounts/{id}` | `api/credit-balances`, `api/masking` |
| `{actor} asks for the debt overview` | `GET /debt/overview` | `api/debt` |
| `{actor} sets the interest rate on the {provider} card to {percent}` | `PATCH /accounts/{id}/details` with `{ "field": "interestRate", "value": … }` | `api/account-details` |
| `{actor} asks for the closed accounts for {bureau}` | `GET /reports/{id}/accounts?status=closed` | `api/closed-accounts` |
| `{actor} asks for the payment history for {bureau}` | `GET /reports/{id}/payment-history` | `api/payment-history` |
| `{actor} asks for the report changes for {bureau}` | `GET /reports/{id}/changes` | `api/report-changes` |
| `{actor} asks for the report overview for {bureau}` | `GET /reports/{id}/overview` | `api/report-changes` |
| `{actor} asks for the score history from {bureau} over {range}` | `GET /reports/{id}/score/history?range=` | `api/score` |
| `the clock is set through test control` | `PUT /__test/clock`, with no persona bound | `security/session-and-test-control` |
| `{actor} asks for the score from {bureau}` | `GET /reports/{id}/score` | `api/score`, `security/session-and-test-control` |
| `{actor} changes their email to the address already held` | `PUT /me/profile/email` | `api/profile-contact` |
| `{actor} asks for another verification link` (optionally `at {time}`) | `POST /me/profile/email/verification` | `api/profile-contact` |
| `{actor} adds the mobile number {string}` | `PUT /me/profile/mobile` | `api/profile-contact` |
| `{actor} enters the code {code}` (optionally `at {time}`) / `enters a wrong code {count} times` | `POST /me/profile/mobile/verification`; the correct code is always `123456` (DR-025), a wrong code is `000000` | `api/profile-contact` |

### 4.2 UI

| Pattern | Page or element | Used in |
|---|---|---|
| `{actor} signs in` / `signs in with the wrong password` | Login | `ui/login` |
| `{actor} reloads the page` | Any | `ui/login` |
| `{actor} returns to the report later` | Report overview, new visit | `ui/report-overview` |
| `{actor} opens the same address later` | Same URL, new visit | `ui/report-changes` |
| `{actor} chooses the {range} range` | History chart | `ui/report-overview` |
| `{actor} likes the report summary` | Summary feedback | `ui/report-overview` |
| `{actor} shows all changes` | Changes toggle | `ui/report-overview` |
| `{actor} shows only positive changes` | Sentiment filter | `ui/report-changes` |
| `{actor} moves to the next page` | Pager | `ui/report-changes` |
| `{actor} opens the {accountType} list` | Account-type list | `ui/account-drilldown` |
| `{actor} opens a loan account` | Account detail | `ui/account-drilldown` |
| `{actor} opens the interest rate form with a return address on another site` | Edit form with a foreign `redirectUrl` | `security/open-redirect` |
| `{actor} records an interest rate of {percent}` / `tries to record an interest rate of {percent}` | Edit form | `ui/account-details-form` |
| `{actor} cancels the form` | Edit form | `security/open-redirect` |
| `{actor} chooses {year}` | Payment history year buttons | `ui/payment-history` |
| `{actor} views the debt overview` | Debt overview | `ui/debt` |
| `{actor} views the {hard or soft} searches for {bureau}` | Searches | `ui/searches` |
| `{actor} views the personal details for {bureau}` | Personal details | `ui/personal-details` |
| `{actor} opens the closed accounts for {bureau}` | Closed accounts | `ui/account-drilldown` |
| `{actor} adds the mobile number {string}`; `{actor} enters the code {code}` | Mobile sub-page (the same phrases as the API acts) | `ui/profile` |
| `{actor} opens the name information` | Name information button | `ui/profile` |
| `{actor} sets their preferred name to {string}` (optionally `with spaces either side`) / `tries to set their preferred name to {string}` | Preferred name | `ui/profile` |
| `{actor} clears their preferred name` | Preferred name | `ui/profile` |
| `{actor} changes their email to {string}` | Email sub-page | `ui/profile` |

## 5. Assert (Then)

| Area | Patterns | Used in |
|---|---|---|
| Score | `the score is {count} out of 1000`; `the national and local averages are each between 0 and 1000`; `{actor} sees a score of {count} out of 1000`; `the national average reads {count}`; `the chart shows {count} monthly points`; `{count} monthly points are returned`; `the score for {month} is missing` | `api/score`, `ui/report-overview` |
| Report summary | `the summary is still marked as liked`; `it is not marked as disliked` | `ui/report-overview` |
| Next update | `{actor} is told the report updates in {days}` | `ui/report-overview` |
| Report changes | `{count} changes are listed`; `every change listed is positive`; `only positive changes are listed`; `the changes are dated {date}, {date} and {date}, in that order` / `the changes are dated {date} and {date}, in that order`; `there is no next page`; `the {count} newest changes are included`; `the change count reads {count}` | `api/report-changes`, `ui/report-changes`, `ui/report-overview` |
| Totals and utilisation | `the total balance is {money}`; `the total limit is {money}`; `the total utilisation is {percent}`; `no utilisation is reported`; `the total remaining is {money}`; `the loan of {money} is listed as excluded`; `the list total matches the overview total`; `{actor} sees which loans are excluded from the loan totals`; `the utilisation is {percent}`; `the unfloored utilisation is {percent}`; `the {provider} card shows a utilisation of {percent}`; `the {provider} card shows a balance of {money} in credit`; `the {provider} card is marked as over its limit` | `api/account-totals`, `api/credit-balances`, `ui/account-drilldown` |
| Balances and accounts | `the balance is {money}`; `its balance is {money}`; `the credit card is listed` / `is {listed or not listed}`; `the account is not found` (API: 404 `/problems/not-found`); `the closed {accountType} group lists {count} account` (or `accounts`); `{actor} sees the balance, payment history and account information`; `{actor} does not see interest rate or promotional period details` | `api/closed-accounts`, `api/credit-balances`, `security/access-control`, `ui/account-drilldown` |
| Masking | `the account number is shown as {string}`; `no response contains {string}` | `api/masking` |
| Debt | `the total debt is {money}`; `the debt trend is {trend}`; `the debt on {accountType} is {money}` | `api/debt`, `ui/debt` |
| Payment history | `the years {year} to {year} are covered`; `{year} is marked {yearStatus}`; `seven years are offered, from {year} to {year}`; `{year} is chosen`; `{actor} sees {count} missed payments, all on the {provider} loan`; `{actor} is told there were no missed payments in {year}` | `api/payment-history`, `ui/payment-history` |
| Account details form | `the credit card shows an interest rate of {percent}`; `{actor} is told the rate must be between 0% and 100%`; `no interest rate is recorded`; `{actor} is back on the credit card's own page` | `security/open-redirect`, `ui/account-details-form` |
| Account details (API) | `the interest rate is {accepted or refused}` | `api/account-details` |
| Searches and personal details | `{count} hard searches are listed` / `1 soft search is listed`; `no hard search is listed`; `{actor} is told there are no hard searches` (`search-list-empty`); `{actor} sees {count} current address and {count} previous addresses`; `{actor} is shown as on the electoral roll`; `none of the personal details can be edited` | `ui/personal-details`, `ui/searches` |
| Sign-in | `{actor} sees the report for {bureau}`; `{actor} is told the sign-in details were not recognised`; `{actor} is still on the sign-in page`; `{actor} is asked to sign in again` | `ui/login` |
| Profile | `the page title contains none of {actor}'s legal name, email address or mobile digits`; `the page address contains none of them either`; `the email is still verified`; `the resend is {refused or sent}`; `{actor} is told the email is already verified`; `the number is {mobile outcome}`; `the mobile number is {verified or still unverified}`; `{actor} is told to request a new code` and `the code {code} is no longer accepted` (API: 422 `/problems/rule-violation/code-invalid`); `{actor} sees their legal name and date of birth`; `neither can be edited`; `{actor} is told that it matches the credit report`; `{actor} is told the change is saved`; `the app greets {actor} as {string}` / `by their legal first name`; `the credit report still shows {actor}'s legal name` (reads `pd-name` on the report's personal details page); `the preferred name is {name outcome}`; `the email shows as unverified`; `the {tile} tile shows {string}`; `no amounts are shown on the profile` | `api/profile-contact`, `ui/profile` |
| Security | `{actor} is refused as not signed in` (401 `/problems/unauthenticated`); `test control is not found` (404) | `security/session-and-test-control` |

## 6. Three-amigos review (held 5 October 2026)

Recorded in decision brief 4 (`DOCS/decision-briefs/`), DR-028 to DR-033. The review was held by interview between the owner and the agent, not as a three-person meeting; the agent gave the developer and tester views.

### 6.1 Arrangement gap

Closed by DR-020 (decision brief 2 D1) and CDS-13: data no persona holds is arranged by test-control overrides, one checked sample per pattern in `fixtures/overrides/`.

### 6.2 Givens that contradicted the bound persona

Resolved (DR-028, DR-029). Four scenarios were rewritten to match their persona's data; three new scenarios, arranged by overrides, keep the cases the rewrites would have lost; the mobile scenario binds Sam to `thin-file`.

| Was | Now |
|---|---|
| `Alex has report changes dated 2026-07-15, 2026-09-28 and 2026-08-31` (`excellent`) | `Alex has report changes dated 14 September 2026 and 28 September 2026`; plus 'Changes that arrive out of order are listed newest first' (overrides) |
| `Alex has 5 report changes` (`excellent`, two files) | Sam holds `drilldown`, which holds 5 changes |
| `Alex has 25 report changes` (`drilldown`) | 'A short list fits on one page' (5 changes); plus 'Long lists are shown 20 at a time' (overrides) |
| `Alex is overdrawn by 250.00 on a current account` (`drilldown`) | Step removed; plus 'An overdraft on a current account does not count as debt' (overrides) |
| `Alex has not added a mobile number` (`excellent`) | Sam holds `thin-file` |

### 6.3 Phrasing

All five proposals accepted and applied (DR-030): one phrasing per arrangement (`has a credit card with …`, `owes …`, `asks for that account`); `chooses` for picking an option; `opens the name information`; `has noted the credit card total on the report overview`; `shows only positive changes` stays both a Given and a When, by intent.

### 6.4 Formats

Dates are long form everywhere (DR-031); `{isoDate}` is retired. Money is a bare number with two decimal places.

### 6.5 Rule coverage

Every BR rule (BR-01 to BR-15) and every PR rule except PR-05 (address sub-page, stretch) has a tagged scenario. PR-08's scenario covers the page title and address; client-side logs are left to component tests (DR-032).

### 6.6 Independent re-review (CDS-18, 7 October 2026)

A separate agent with fresh context re-checked every scenario and this glossary against contract v9 (`.review/2026-10-07_cds-18-behaviour-re-review.md`). Its findings were fixed in version 6 with contract v10: the debt total and breakdown (F-01, F-02, DR-046), the changes toggle (F-03, DR-047), the preferred-name save (F-04), *account information* (F-05), the zero-limit and BR-12 arrangements (F-06, F-08), API messages by Problem type (F-09, DR-048), the BR-02 gap scenario (F-10), the 0-day row (F-11), the expiry and test-control-off scenarios (F-12), the closed-accounts and mobile-page scenarios (F-13), the parameter types (F-14) and the 'Used in' columns (F-15). A confirmation pass by a second fresh agent found 1 Blocker and 10 Changes, fixed in version 7: the BR-08 outline reloads the overview after the clock moves; the API debt Background sets the clock; a summing `@BR-04` scenario; an API `@BR-14` outline; hooks for searches and personal details; the mobile badge; *excluded from the loan totals*; and status mappings for every API outcome.

## 7. Keeping it true

- A new step is added here, using glossary terms, before it is used in a feature file.
- A step whose meaning changes is a scenario change and goes through the same review.
- A Given is not agreed until section 3 says how it is arranged.

## 8. Provenance

Version 7 (7 October 2026): checked against 23 feature files, 72 scenarios and 269 step lines, every line matching a pattern here; new rows' 'Used in' set from the files. Version 6 (7 October 2026): 'Used in' regenerated from the files, against 22 feature files, 70 scenarios and 258 step lines, every line matching a pattern here. Version 5 (5 October 2026) was checked against 19 feature files, 65 scenarios, after the three-amigos review; every Given in section 3 is arranged by fixture, navigation, test control, overrides or environment.

Extracted on 4 October 2026 with `gherkin-official` from the 18 feature files in `features-shared/` (54 scenarios, 160 distinct step texts, And and But resolved to their keyword). Section 3's *Arranged by* column was checked against `fixtures/personas/*.json` (contract v4, fixture check 241 of 241) and API spec v4 section 6.5.
