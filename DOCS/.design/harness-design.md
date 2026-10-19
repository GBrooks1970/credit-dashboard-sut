---
version: 7
created: 2026-10-09T11:20Z
project: credit-dashboard-sut
type: design
item: CDS-22
language: en-GB
status: draft
---

# Harness design: the Serenity/JS API harness

**What this is.** How the harness in `test-harnesses/harness-serenity/` runs the `@api` scenarios against the service: layout, abilities, the order of arrange, act and assert, response validation, the service lifecycle, the clock-and-token rule, and where each step pattern of `DOCS/step-glossary.md` lands. It follows the approved plan (`DOCS/implementation-plans/2026-10-08_cds-22-serenity-harness.md`, decisions D1 to D5) and DR-006, DR-008 and DR-042. It is written before the code; the slices H1 to H4 build to it, and a difference found while building is fixed here first.

**Scope.** The 12 `@api` feature files: ten in `features-shared/api/` and two `@security @api` in `features-shared/security/`, 32 scenarios and outlines in all (59 executions). The `ui` profile (section 20) runs the eleven UI files and `security/open-redirect` (`@security @ui`): 44 scenarios and outlines, 59 executions. The step patterns of the glossary are the whole vocabulary of each profile.

---

## 1. Layout (D1)

A standalone package, as in `loan-origination-parity`, with its own `package.json` and lock. It imports nothing from the service, the generated C# types or `packages/api-client` (DR-042): the harness is an independent reader of the contract.

```
test-harnesses/harness-serenity/
  package.json  package-lock.json  tsconfig.json  cucumber.mjs
  src/
    abilities/     CallAnApi.ts  ControlTheTestEnvironment.ts
    contract/      validate.ts (reads DOCS/.architecture/openapi.yaml; Ajv by operation and status)
    fixtures/      load.ts (reads fixtures/personas, fixtures/overrides, fixtures/users.json)  arrange.ts
    support/       actors.ts  common-hooks.ts  parameter-types.ts  world.ts
    api/           hooks.ts (the api profile's Before and After)
    ui/            hooks.ts  visit.ts  steps/ (the ui profile)
    steps/         arrange.steps.ts  act.steps.ts  assert.steps.ts
    exit/          exit-checks.ts (axe scans and layout checks)
    flags/         prove-flags.ts (the bug-flag proof)
  scripts/run.mjs  (modes api, ui, exit and flags: builds and starts the service, and for the ui modes the UI build, runs the profile or check, stops what it started)
  reports/  (git-ignored)
```

Features are read from `features-shared/` through the profile's `paths` (the same files the UI harness will use later); no feature is copied.

## 2. Pins (D5)

Serenity/JS 3.48.1, Cucumber 13.3.0, tsx 4.23.15, Ajv with the 2020-12 build, and a YAML reader for the contract. TypeScript is chosen in H1 by what Serenity/JS supports, and the chosen versions and the checks that justified them are recorded in the H1 log. Nothing is added beyond these without a note here.

## 3. Abilities

Two abilities; there is no third. Every API call is made through the first, every `/__test/*` call through the second.

### 3.1 `CallAnApi` (D2)

A thin ability on Node's `fetch`. It holds the base URL (`http://127.0.0.1:<port>/api/v1`) and offers one method, `request(operationId, { path, query, body, headers, as })`, which:

1. looks the operation up in the contract by `operationId` (method, path template, security scheme);
2. builds the URL from the path template and the parameters, and sends the body as JSON;
3. adds `Authorization: Bearer <token>` when the operation needs a user and the actor holds a token (section 7);
4. returns `{ status, headers, body }` after validating it (section 4).

The glossary rows say which operation each act calls; `operationId`s are the contract's, so a renamed operation breaks the harness at the lookup, not silently.

### 3.2 `ControlTheTestEnvironment`

One method for each test-control operation the scenarios use: `reset()`, `bind(username, persona, overrides?)`, `setClock(instant)`, `setBugs(flags)`, and `arrangeFlags()`, which sets the flags a run asks for and reads `GET /__test/state` back. The email-verification and latency operations have no method because no scenario calls them. It carries the `X-Test-Control-Key` header and validates responses exactly as `CallAnApi` does. The key is a synthetic value the runner invents for the run (`harness-run-key`) and passes to the service and to the harness through the environment; it is never read from, or written to, a file.

## 4. Contract validation (DR-042)

Every response, from either ability, is validated before any step sees it. A response that does not match the contract fails the step with the operation, status and the first Ajv path, whatever the scenario meant to assert.

- **Source.** `DOCS/.architecture/openapi.yaml`, read at start-up; the `$ref`s are resolved against the document and each response schema is compiled once, keyed by `operationId` and status.
- **Dialect.** OpenAPI 3.1 is JSON Schema 2020-12, so the schemas are compiled as they are, with Ajv's 2020 build in strict mode, and the formats the contract uses registered. The Python validator's misreading of `\p{L}` (CDS-23) is not shared: Ajv is run with the `u` flag.
- **Statuses.** A status the operation does not document is a failure. Problem responses (`application/problem+json`) are validated against `Problem`.
- **What is not validated.** Request bodies the harness builds are not validated by the harness: the service's edge is what is under test, and the scenarios that send a bad request say so in their words.

## 5. Order of a scenario

1. **Before** (hook): `reset()` through test control; clear the world (actors, tokens, remembered account, last response); the clock follows real time again (`now: null`) until a step freezes it.
2. **Given** steps (arrange), in file order. Background steps run first. Each is one of: bind a persona, bind with overrides, set the clock, check the fixture, record an event (an email change, a mobile number), or start the second service (section 8).
3. **When** (act): one API call, made as the named actor. The response is stored on the world as `last`, with the status and the validated body.
4. **Then** (assert): reads `last` (and, for the few steps that compare with an earlier response, `previous`). A Then never makes a call. `And` steps keep the keyword of the step they follow.
5. **After** (hook): on failure, attach the arrangement (today, personas, the flags in force), the last response (status, headers, body; recorded before the validator judges it) and, in a UI scenario, the address and title of the page; always restore the default service state (`reset()`). The service log tail is not attached; the service's own log file is named in the run's last line.

Scenarios run one at a time against one service (Cucumber `parallel: 1`): test control is global state, so parallel scenarios would share a clock and personas.

## 6. Arrange: how each Given is made true

The strategy per pattern is the glossary's section 3 column *Arranged by*; this section fixes the mechanics the glossary leaves open.

| Mechanism | Rule |
|---|---|
| **Persona** (`{actor} holds the {persona} persona`) | `bind()` for the actor's username from `fixtures/users.json`. Binding again without overrides clears the actor's overrides, so a Given that needs overrides binds with them in one call and a later plain bind removes them. Binding drops that actor's cached token (section 7) |
| **Fixture check** (`has a credit card…`, `owes…`, `has {count} report changes`, `email is verified`, `source supplies…` with a fixture mask) | The harness reads the bound persona's file from `fixtures/personas/` directly, finds the matching data, and fails the step loudly (naming the persona and what was sought) if it is not there. It does not call the service to check: a Given that arranged nothing must not be satisfied by the service's own answer. The matching account becomes *that account* (below) |
| **Overrides** (the `fixtures/overrides/` rows in glossary section 3) | The sample file is the template: its `base` persona and its overrides are loaded, then the fields the step's values drive are patched (the amounts for the balance and limit, the closing date, the mask, the month statuses, the change dates, the debt history). The result is sent with `bind()`; a 400 or 422 from the service fails the step with the response. Which fields each pattern patches is fixed in H2 against the sample, with a probe that a patched value really reaches the response |
| **Clock** (`today is {date}`, `…at {time}`) | `setClock()` to that date at 09:00:00Z, or at `{time}` on the date already set. See section 7 for tokens |
| **Event** (`changed their email to … at {time}`, `added the mobile number …`) | Set the clock if a time is given, then make the real call as the actor (`PUT /me/profile/email`, `PUT /me/profile/mobile`); the response must be 200 or 202, or the step fails |
| **Expired token** (`{actor}'s token has expired`) | Sign in as the actor, read `expiresAt` from the response, set the clock to one second past it, keep the token. This is the one place a stale token is kept on purpose (section 7) |
| **Test control off** (`test control is switched off`) | The runner's second instance (section 8) |

**That account.** A Given that describes one account (`has a credit card with…`, `owes…`, `has a loan of…`, `has a credit card that closed on…`, `the source supplies…`) stores that account's ID as *that account* for its actor. Two Givens in one scenario that describe different accounts store the later one; the scenarios that need two refer to them by provider (`the {provider} card`) instead, which is resolved against the bound persona. More than one match in the fixture is a failure of the step (an ambiguous Given), as is none.

## 7. The clock-and-token rule

A token is valid until `expiresAt`, and `expiresAt` is `login time + 60 minutes` on the **controlled** clock (CDS-25). Moving the clock forward can therefore expire a token that was valid a moment ago, and moving it back makes an old token valid for longer. The rule:

1. An actor has no token until the first step that needs one (an act, or an event Given). Sign-in is lazy: `POST /auth/login` with the actor's username and the synthetic password from `fixtures/users.json`, at whatever the clock then says.
2. **Any clock change drops every actor's cached token**, as does a persona bind for that actor. The next call signs in again. Steps never hold a token across a clock change.
3. The one exception is `{actor}'s token has expired`: it keeps its (now expired) token, which stays in the scenario's token cache, so the act uses it and receives 401. The next clock change or bind clears the cache.
4. A step with `at {time}` moves the clock to a time on the date already set, so a scenario that sets a date, makes an event and then asks again within the hour never meets an expiry by accident. If a scenario moves the clock by more than the token lifetime between steps, the rule in (2) makes it work without the scenario saying so.

A probe in H1 (ignoring rule 2) must fail the expired-token scenario's neighbours for the stated reason, as the plan requires.

## 8. Service lifecycle (D3)

`scripts/run.mjs` owns the service; the Cucumber process does not start or stop it.

1. Refuse to start if anything already answers on the port (the lesson from CDS-23: a leftover process answers in place of the one under test). Ports: main instance `HARNESS_PORT` (default 4600), second instance `HARNESS_OFF_PORT` (default 4601); neither may equal the Schemathesis port (4500) or the mock (4010).
2. Build once (`dotnet build -c Release`), then start `CreditDashboard.Api.dll` with `TEST_CONTROL=true` and `TEST_CONTROL_KEY=<synthetic>`, logging to a file in the OS temp directory (never a pipe; CDS-23). Wait until `/bureaux` answers, as in `tools/schemathesis-run.mjs`.
3. Start the second instance **only when the selected scenarios need it** (the tag `@no-test-control` is added to that one scenario by this work; see section 10): `TEST_CONTROL` unset and no key. It is started once and shared.
4. Export `HARNESS_BASE_URL`, `HARNESS_OFF_BASE_URL` and `HARNESS_CONTROL_KEY` to Cucumber.
5. Always stop both, whatever the result; exit with Cucumber's exit code. The runner prints the log path on failure.

`test control is switched off` points the world's `CallAnApi` and `ControlTheTestEnvironment` at the second instance for the rest of the scenario; `the clock is set through test control` then calls `PUT /__test/clock` there (with the key, so the 404 shows the surface is absent and not merely guarded) and `test control is not found` asserts 404 and the Problem type `/problems/not-found`.

## 9. Parameter types

Defined once in `src/support/parameter-types.ts` from glossary section 2, each with the regular expression the glossary states and a transformer:

| Type | Transformer |
|---|---|
| `{money}` | Minor units, an integer (`-44.00` becomes `-4400`). Compared as integers; never as floats |
| `{percent}` | A number (`29.9%` becomes `29.9`); compared to the contract's number field as the contract defines it |
| `{date}`, `{month}`, `{time}`, `{year}`, `{count}`, `{days}`, `{code}` | As the glossary; dates to `YYYY-MM-DD`, times to a full instant on the controlled date |
| `{actor}` | `'alex'` or `'sam'` (the lower-case username) |
| `{persona}`, `{bureau}`, `{range}`, `{trend}`, `{yearStatus}` | The contract's enum value (`{bureau}`: `"Bureau A"` to `bureau-a`) |
| `{accountType}` | The contract's type value; singular and plural phrases map to the same value, the plural also used for the group names the closed-accounts steps read |
| `{provider}` | Resolved against the bound persona's fixture by display name; no match fails the step |
| `{payment pattern}`, `{hard or soft}`, `{listed or not listed}`, `{refused or sent}`, `{verified or still unverified}`, `{mobile outcome}`, `{name outcome}`, `{accepted or refused}`, `{tile}`, `{name}` | The glossary's alternatives, each mapped to a status and Problem `type` or a value in the assertions below. Those used only by `@ui` steps (`{hard or soft}`, `{name outcome}`, `{tile}`, `{name}`) are not defined in this work |

## 10. Where each pattern lands

Every pattern used by the 12 files has one definition, in the file named below. Cucumber's strict mode fails a step line with no definition and a line with two (ambiguous). There is no check for a definition that no line uses: `cucumber --dry-run` lists such definitions (two in the API profile, one of which the UI profile uses, and the UI profile's own), and they are left until someone removes them.

**Arrange** (`arrange.steps.ts`): all patterns of glossary section 3 that the 12 files use. `Used in` for the UI-only rows (`has signed in`, `is viewing…`, `has noted…`, `shows only positive changes`, `has added their finances`, `preferred name is`, `report has {count} changes`, `next bureau refresh is`) is not built.

**Act** (`act.steps.ts`): the glossary section 4.1 table, one definition per row, each calling the operation it names. Notes where the glossary table is silent:

| Pattern | Notes |
|---|---|
| `asks for the {accountType} totals`, `asks for the closed accounts for {bureau}`, `…payment history…`, `…report changes…`, `…report overview…`, `…score…`, `…score history…` | Report ID from `{bureau}`; the accounts, closed accounts and totals operations take the `type` or `status` query as the row says |
| `asks for that account` | The ID stored by the Given (section 6) |
| `asks for one of {actor}'s accounts` | A real account ID from the **other** actor's bound persona fixture, requested with the first actor's token (BR-15) |
| `sets the interest rate on the {provider} card to {percent}` | `PATCH /accounts/{id}/details` with the card found by provider; the value is the number as written |
| `changes their email to the address already held`, `asks for another verification link`, `adds the mobile number {string}`, `enters the code {code}`, `enters a wrong code {count} times` | One call per time; a wrong code is `000000`: the correct code is always `123456` (DR-025), so any other six digits is wrong |
| `the clock is set through test control` | The only act that calls test control; uses the ability of section 3.2 against whichever instance the world points to |

**Assert** (`assert.steps.ts`): the glossary section 5 rows the 12 files use, reading `last`. The API outcome forms:

| Form | Assertion |
|---|---|
| `the {thing} is {value}` and `…reads…` | The response field the glossary section 4 or the API specification names, compared as the parameter type's transformed value |
| `is told …` / `is refused …` | The status and the Problem `type`, never `title` or `detail` (DR-048). Mapping in glossary section 5, e.g. `already-verified` is 422 `/problems/rule-violation/already-verified`; `refused as not signed in` is 401 `/problems/unauthenticated`; `the account is not found` is 404 `/problems/not-found`; `test control is not found` is 404 `/problems/not-found` |
| `no response contains {string}` | Every response body recorded in this scenario (not only `last`), serialised, does not contain the string. The world keeps the bodies for this step only |
| `the changes are dated … in that order` | The dates of the returned changes, in order, equal the list given |
| `{count} monthly points are returned`, `the years … are covered`, `… is marked …` | Counted or read from the validated body; the order of an array is asserted only where the step says so |

## 11. Reports and diagnostics

Cucumber's `message` formatter writes `reports/api.ndjson` and `reports/ui.ndjson`, and the console shows Serenity's reporter; there is no HTML report yet (the Serenity report is P6, CDS-44). The failure's diagnostics (section 5, After) are specified here and are added to the After hooks in CDS-38 slice F2. No second stdout formatter (the lesson recorded in the reference project: one only). The run ends with one line: scenarios passed, failed, skipped, steps, duration, and the service log path.

## 12. Verification of the harness itself

These are the probes the plan requires, each expected to fail and then reverted; their results go in the slice logs.

| Probe | Expected failure |
|---|---|
| A service rule broken (for example BR-03 utilisation floor) | The scenario tagged for that rule goes red for the stated reason |
| A required key removed from a service response | Contract validation fails, naming the operation and path, before any assertion |
| Rule 2 of section 7 ignored (token kept across a clock change) | A scenario that moves the clock after a sign-in fails with 401 |
| A Given whose data is not in the persona | The fixture check fails loudly, naming the persona |
| A step line with no definition, and one with two | Cucumber's strict mode fails the run (an unused definition is not checked) |
| An overrides patch that does not reach the response | The scenario's assertion fails and the H2 probe catches it |

## 13. Changes to other documents

- **Glossary (v8, this PR):** section 3 gains the rule for *that account* (section 6 above) and the wrong-code step says what a wrong code is (section 10). Any further ambiguity found in H2 or H3 is fixed in the glossary first.
- **Feature files (H4):** the scenario *Test control is off by default* gains the tag `@no-test-control` (it is a tag change, not a wording change, so it is not a scenario change under glossary section 7).
- **Decision register:** DR-057 is recorded with the gate in H4.

## 14. What this design does not settle

- The exact fields each overrides pattern patches (section 6): H2, by reading each sample and probing.
- Whether Serenity/JS's `Cast` and `Actor` are used for the actors or a plain world object suffices; the choice is made in H1 against the first feature and recorded in the H1 log, with Serenity/JS kept as the actor model if it costs no more than a few lines (the portfolio shows the Screenplay pattern).
- Whether the number of executions after outline expansion differs from 31: counted in H1.

## 15. Settled in H1 (2026-10-10)

- **Actors:** Serenity/JS `Cast` and `actorCalled` are used (the Stage Manager holds `ControlTheTestEnvironment`; Alex and Sam hold `CallAnApi`); it cost a dozen lines in the profile's hooks (`src/api/hooks.ts`, `src/support/common-hooks.ts`), so the Screenplay model stays.
- **Pins:** Serenity/JS 3.48.2 (3.48.1 was the plan's figure; 3.48.2 is the current release, same line), Cucumber 13.3.0, tsx 4.23.15, TypeScript 6.0.3 (7.0.2 is published but was not tried), Ajv 8.20.0, yaml 2.9.1, console reporter 3.48.2. The exact versions are in `package-lock.json`.
- **Executions:** the `api` profile selects 58 scenarios after outlines expand (31 scenarios and outlines in 12 files).
- **Running one feature:** `node scripts/run.mjs api api/score`; Cucumber adds positional paths to a profile's paths, so a named run uses the `select` profile, which has none.
- **Not yet probed:** rule 2 of section 7 (a token kept across a clock change). The `score` scenarios sign in after the clock is set and the clock only moves back, so no scenario in H1 can show it; the expired-token scenario in H4 does.
- **Audit:** `npm audit` in the harness package reports one high finding, `braces` (stack exhaustion on deeply nested glob patterns), reached through `fast-glob` inside `@serenity-js/core`. It is a development-only dependency that globs paths the repository itself supplies, and the only fix offered is a downgrade to Serenity/JS 2.19.4, so it is recorded and not changed. Revisit when Serenity/JS updates its glob dependency.

## 16. Settled in H2 (2026-10-10)

- **Every Given and When of the 12 files is defined** (arrange and act steps); the Thens are H3. With the Thens still undefined, the `api` profile executes 386 steps passed and 65 undefined (Thens, plus the two test-control-off steps that wait for H4), none failed, none ambiguous.
- **Overrides:** the sample is loaded, its values patched (`src/fixtures/arrange.ts`: `setBalance` recomputes utilisation, raw utilisation and the last balance-history entry by BR-03 in integer arithmetic) and bound over the persona the actor already holds. The service accepted every patched sample (a 422 would have failed the step). That the patched value reaches the response is proved by the H3 assertions and their probe.
- **Fixture or overrides:** `has a credit card with a balance of … and a limit of …` and `has a credit card that closed on …` look in the fixture first and fall back to the sample; the other fixture Givens never fall back.
- **Probes that had to fail, and did:** a Given the persona does not hold (`owes 999.00 on a mortgage` on `drilldown`) fails with 'The drilldown fixture holds 0 accounts matching …'; a sample bound over the wrong persona fails with 'built on the drilldown persona, but Alex holds excellent'.
- **Glossary v9** records four harness readings: the camel-case `{paymentPattern}`, the optional time as two definitions, `the source supplies…` using the first bound user, and the totals step using Bureau A.

## 17. Settled in H3 (2026-10-10)

- **Every Then of the 12 files is defined** except the one for the test-control-off scenario, which waits for H4 with its two steps. The `api` profile: 58 scenarios, 57 passed, 1 pending (`Test control is off by default`); 448 steps and hooks passed, 3 steps undefined.
- **Readings fixed in the code** (and glossary v10): loan `the total remaining` reads the totals' balance (BR-05); `the credit card is listed` and `its balance is` read the credit card in the list the last When returned; `the 3 newest changes are included` compares the overview with the newest dates read independently from the persona fixture; `mobile number is still unverified` is a 422 `code-invalid` (an expired code, PR-10); `no response contains` searches every response body of the scenario.
- **One Then makes a call:** `the code 123456 is no longer accepted` submits the code once more and asserts 422 `code-invalid`, because 'no longer accepted' is a behaviour and not a reading of the last response. Design section 5 said Thens never call; this is the one exception.
- **Probes that had to fail, and did** (each service mutation reverted; counts from the Cucumber summary): BR-03 half-up rounding replaced by truncation, 1 failed and 9 broken scenarios (the service's own overrides check rejects the patched samples with a 422, and the in-credit assertion fails); BR-11 newest-first replaced by oldest-first, 3 of 3 Report changes scenarios failed; BR-14 range widened to 101, 1 scenario broken by contract validation (a 200 with `interestRate` 100.01 violates the contract's maximum), before the assertion ran; BR-09 masking returning the whole number, 2 broken, 3 passed.
- **Patched values reach the response:** the BR-03 probe shows it for the rows the service re-checks; the totals, debt, closed-accounts, payment-history and masking scenarios pass only when their patched or fixture-held value is the one served.

## 18. Settled in H4 (2026-10-10)

- **The second instance:** `scripts/run.mjs` starts a service with no `TEST_CONTROL` and no key on port 4601 beside the main one on 4600, and exports `HARNESS_OFF_BASE_URL`. `test control is switched off` points the scenario's calls at it; `the clock is set through test control` sends `PUT /__test/clock` with the key; `test control is not found` asserts 404 `/problems/not-found`. The runner refuses to start if either port answers.
- **The tag:** `Test control is off by default` carries `@no-test-control`. It is a tag change, not a wording change (glossary section 7).
- **Run result:** all 58 scenarios pass (31 scenarios and outlines in 12 files); the harness is `npm run check:harness` and a `verify` step (DR-057): `verify` has 14 steps, the install of the harness being the extra one.
- **Probes that had to fail, and did:** the clock-and-token rule ignored (a scratch scenario: sign in, move the clock a day, ask again; 401 instead of 200); test control not really off (`Expected 404, got 204`).
- **Not done:** a committed scenario that moves the clock forward after a sign-in. It would be a scenario change for the owner; the rule is covered by the scratch probe and, in the committed set, by the expired-token scenario.

## 19. Changed by CDS-24 (2026-10-12)

- One scenario is added ('Another customer's account cannot be changed', `@BR-15`) with one step, `{actor} sets the interest rate on one of {actor}'s accounts to {percent}`; the `api` profile now selects 59 scenarios (32 scenarios and outlines in 12 files). `{accountType}` accepts `current account(s)`.

## 20. The ui profile (CDS-31, 2026-10-13)

- **Layout:** `src/api/hooks.ts` (moved from `src/support/hooks.ts`) and `src/ui/hooks.ts` hold each profile's Before and After; `src/support/common-hooks.ts` loads the contract and sets the timeout for both; `src/support/actors.ts` holds the Stage Manager name. The `ui` profile imports `src/support`, `src/ui` and `src/steps/arrange.steps.ts` (persona and clock Givens); UI steps are in `src/ui/steps/`. `cucumber.mjs` has `api`, `ui`, `select-api` and `select-ui` (named features).
- **Abilities:** the stage manager keeps `ControlTheTestEnvironment`; each user has Serenity/JS `BrowseTheWebWithPlaywright` on a headless Chromium launched once per run. Elements are found by `data-testid` (`byTestId`), the hooks of UI specification 4.1.
- **Runner:** `node scripts/run.mjs ui` builds the UI (installing it first if needed), starts the service with `UI_DIRECTORY` set to `demo-apps/demoapp001-react-ui/dist`, and runs the profile against `HARNESS_UI_URL` (the service's own address). `HARNESS_BROWSER_PATH` points to a Chromium already on the machine; CI installs the one Playwright 1.64 wants (the local Chromium 1243 differs from the revision 1248 that 1.64 expects, and no browser was downloaded for this slice).
- **Pins:** Serenity/JS 3.49.0 (core, cucumber, assertions, console-reporter, web, playwright) with Playwright 1.64.0.
- **Selected scenarios:** the `ui` profile lists only the feature files a slice has implemented: U1 has `ui/login.feature` (3 scenarios).

## 21. The overview steps (CDS-32, 2026-10-13)

- `src/ui/steps/overview.steps.ts` defines the report overview's steps: `is viewing the report for` (a fresh sign-in; the token is in memory only, so every visit is a new sign-in), `returns to the report later` (the same), `chooses the {range} range`, `likes the report summary`, `shows all changes`, and the assertions on the score, the chart's rows, the feedback buttons' `aria-pressed`, the change cards and the next-update text. `the next bureau refresh is {days} away` sets the clock that many days before the bureau's `nextRefreshDate` from the persona fixture. A new parameter type `{days}` (`1 day`, `N days`).
- Steps that name no user use the first user the scenario bound (the Background user), or the last where the scenario ends on another user (the Sam scenario).
- The `ui` profile now selects `ui/login.feature` and `ui/report-overview.feature`: 8 scenarios, 12 executions after outlines expand.

## 22. The report page steps (CDS-33, 2026-10-13)

- `src/ui/steps/report-pages.steps.ts` defines the steps of payment history, report changes, searches, personal details and the debt overview. `src/ui/visit.ts` opens an address as a new visit: with no session the app sends the visitor to sign-in and back to the address, so the harness signs in and waits for a hook that shows the page loaded (`openAddress`); it also holds the harness's own pound formatting (`poundsNoPence`), independent of the UI's.
- **A readiness hook must be near the top of the page.** Serenity's visibility wait did not see an element below the fold: `pager-status` after 20 change cards timed out at 5 s while the same page worked in a raw Playwright run. Pages are ready on a hook near the top (`changes-filter-all`), and a step that needs a control lower down acts on it (a click scrolls it into view).
- **One definition serves a Given and a When.** Cucumber matches a step by its text, so `shows only positive changes` is defined once.
- The Given `{actor}'s report has {count} changes` is a shared arrange step (the 25-change overrides sample), and `{hard or soft}` is the type `hardOrSoft`.
- The `ui` profile now selects seven feature files: 22 scenarios, 30 executions (this slice: 14 scenarios, 18 executions).

## 23. The account steps (CDS-34, 2026-10-13)

- `src/ui/steps/account.steps.ts` defines the steps of the account lists, closed accounts, account detail, the detail form and the open-redirect scenario. The accounts the steps need are found in the bound persona's fixture (`theOne`), never on the page: the open Lender X credit card is the one with no interest rate recorded, the loan that counts in the totals is the one a loan page opens, and a provider's card is looked up by provider and type.
- **Presence, not visibility, for anything below the fold.** `PageElement.isPresent()` (there is no `isPresent` expectation in Serenity/JS 3.49) is the wait for the account cards on the overview, the excluded group, the payment history and the account information; `isVisible` stays for what is at the top of a page (`list-summary`, `detail-balance`, `dc-prompt`). This is the section 22 finding again, in a second place.
- **A Then that follows a Then.** `the closed {accountType} group lists {count} account(s)` remembers the group in the scenario's `pending` state so `its balance is {money}` reads the row in that group. `its balance is` is also an `@api` step; the two profiles import different step files, so they do not collide.
- **A refused value is not sent, so the check is made on the card's own page.** `no interest rate is recorded` leaves the form with Cancel and reads the interest rate tile (`Not recorded`), because the `ui` profile has no API ability.
- The `ui` profile now selects ten feature files: 31 scenarios, 39 executions (this slice: 9 scenarios, 9 executions).

## 24. The profile steps (CDS-35, 2026-10-13)

- `src/ui/steps/profile.steps.ts` defines the steps of My profile and its two sub-pages. The Givens that state a fact about the persona (`preferred name is "Al"`, `has added their finances`) read the fixture and fail loudly if it does not hold, as the arrange steps for the API do. `{actor}'s email is verified` is the shared arrange step.
- **A result that is empty until it arrives.** The preferred name's status line (`profile-preferred-status`) carries 'Saved' or the error text, so one wait (`Text.of(status)` not equal to the empty string) serves both `sets` and `tries to set`. The `Then` steps then say which it was.
- **Steps that name no user read the last user bound**, so a scenario that binds Sam after the background's Alex is read as Sam.
- **PR-08 is checked on the page, not by a guess.** The legal name is read from the profile page; the email comes from `users.json` and the mobile digits from the persona's fixture; the title and the address (path and query, plain and URL-encoded) must contain none of them.
- **A hook the scenarios never read.** The mobile badge hook (`profile-mobile-badge`) is asserted through the tile's text (`the mobile tile shows "Verified"`), so renaming the hook did not fail a scenario. A probe that made the badge always read Unverified did fail one. Hooks the scenarios do not read are checked by the component tests.
- The `ui` profile now selects eleven feature files: 41 scenarios, 51 executions (this slice: 10 scenarios, 12 executions).

## 25. The exit checks (CDS-36, 2026-10-13)

- `src/exit/exit-checks.ts`, run by `node scripts/run.mjs exit` (`npm run test:exit`; `npm run check:ui-exit` from the root), is not a Gherkin scenario: the 41 `@ui` scenarios are the behaviour, and these are the standing checks on every page. The runner builds the UI, starts the service serving it with test control, binds Alex to `drilldown`, and runs the script instead of Cucumber.
- **Axe-core on every page and every state that shows something new.** 37 scans at 1280 px with the bug flags off: the sign-in page (and with its error), the overview (and with the chat drawer open), every report page, the six account lists, closed accounts, seven account details (one per type, and a closed card), the five edit forms (and one with an error), the profile (with the name information open, and with a refused preferred name), the email and mobile pages (and the code step), and the "not built" page. Tags: WCAG 2.0, 2.1 and 2.2, levels A and AA. A page is scanned after its sections have settled (no `*-loading` hook left).
- **Layouts.** Four representative pages (overview, the credit card list, a credit card's detail, the profile) at 375, 768 and 1280 px: exactly the bottom tab bar below 768 px and exactly the top navigation from 768 px, no sideways scroll, the demo banner present, and axe-core again at each width, each with this machine's text and with wider text (`body { font-size: 19px }`): 24 checks.
- **A real finding from CI.** The first CI run failed one layout check: on Linux fonts the profile scrolled sideways by 5 px at 375 px (the long email address in the Email tile), which a Windows machine did not show. The fix is `overflow-wrap: anywhere` on `main`, `min-width: 0` on the tiles and `max-width: 100%` on inputs. Because a layout result should not depend on which fonts a machine has, every layout is now checked twice, with the machine's text and with wider text; with the fix removed, the wider-text pass fails on this machine too (4 px).
- **The browser-side code is source text.** The harness's TypeScript has no DOM types, so the two functions the browser runs (nothing is still loading; the layout facts) are strings.
- **Probes that had to fail, and did.** A progress bar that lost its accessible name was reported by axe-core (`aria-progressbar-name`, serious) on the four lists that have one and at all three widths; rendering both navigations failed the 375 px layout checks.
- **Dependency.** `@axe-core/playwright` 4.13.0 (axe-core 4.13.0), exact, released in August 2026. The harness's audit is unchanged by it (the existing `braces` chain, development only).

## 26. The flag proof (CDS-39, 2026-10-14)

- **A proof run switches a flag; the scenarios stay as written.** `HARNESS_BUGS` (comma separated) is read by the `Before` hook of both profiles, which resets test control and then switches those flags on through the new `ControlTheTestEnvironment.setBugs` (the design listed it; it did not exist until now). A reset clears the flags, which is why the hook sets them again for every scenario.
- **The browser gets the control key before the page loads.** The UI actors' browser context is created with a storage state holding `cds.testControlKey` for the UI's origin, so a test build can read `GET /__test/state` at start (decision brief 13 D1). Local storage, not session storage: a context can seed the first and not the second.
- **`node scripts/run.mjs flags [flag ...]`** builds the UI as a test build (`VITE_TEST_BUILD=true`; the `ui`, `exit` and `flags` runs all do), starts the service and runs `src/flags/prove-flags.ts`. For each flag the registry marks implemented, each catcher runs with the flag off (must pass) and on (must fail, and the output must contain the recorded `failsWith`). A scenario catcher is run by name through the `select-api` or `select-ui` profile; a component-test catcher is run by name through Vitest with `CDS_FLAGS` giving the fake service the flag. The verdicts are `caught`, `not-caught`, `caught-for-another-reason` and `false-alarm`; anything other than `caught` fails the run. The result is written to `reports/bug-flags.json` and `.md`.
- **A catcher that runs nothing is not a pass.** A scenario name that matches no scenario, and a test name that matches no test, both exit 0 (Cucumber and Vitest skip). The runner now requires that at least one scenario or test ran. A probe found it: a catcher naming a test that does not exist reported "caught".
- **Probes that had to fail, and did:** a catcher that cannot notice the flag (`not-caught`); the flag's effect removed from the service (`not-caught`); a catcher whose name matches nothing (`false-alarm`, after the guard above).
- **Timing.** Two flags with three catchers took 42 s (each catcher is run twice). The thirty flags will take several minutes; P7 decides whether the proof runs in the `ui` job or a job of its own.
- **A slip worth keeping.** The shell tool that runs these commands strips backslashes from text passed on its standard input, so a regular expression written through a heredoc arrived without them and broke the file. Edits that contain a backslash go through the file-editing tool.

## 27. The seven API flags (CDS-40, 2026-10-14)

- **Where each flag changes the service.** `excluded-in-total`: `ReportData.Facts` counts a loan the bureau leaves out of the totals (BR-05). `rounding-down`: `Defects.Utilisation` cuts the percentage off (BR-03). `history-carry-forward`: `Defects.ScoreHistory` fills a missing month with the previous score, and leaves the months before the first score missing (BR-02). `idor`: `Accounts.Find` also searches the other customers' accounts (BR-15). `problem-json-missing`: `Problems.Write` sends `text/plain` with the right status. `mask-format`: `Defects.MaskedNumber` returns the whole source number where one is known (BR-09). `currency-float`: `Defects.Amount` sends money as a float of pounds (DR-004). The BusinessRules library is untouched by all seven.
- **Each is caught by a scenario that already existed; no scenario changed.** `@BR-05` (loans without a limit), the `@BR-03` outline, `@BR-02` (a month with no score), the two access-control scenarios (two flags share the first), the `@BR-09` masking outline, and the `@BR-04` totals scenario (money is checked against the contract's integer type by the harness). Each fails with a different message, which `bug-flags.json` records: `+ 1368500`, `49 !== 50`, `642 !== null`, `200 !== 404`, `is not valid JSON`, a pattern mismatch at `/maskedNumber`, and `must be integer`.
- **`idor` and `problem-json-missing` share a catcher on purpose.** One scenario (another customer's account cannot be found) fails for two different reasons depending on the flag. The proof checks the reason, not only that it failed, so a flag cannot be credited with the other's failure.
- **The proof of all eight implemented flags takes 85 s locally** (about four runs of a catcher per flag). The thirty will need roughly 5 to 6 minutes; P7 decides where it runs.
- **Probes that had to fail, and did:** `idor` with its effect compiled out (`not-caught`); a catcher recording the wrong failure text (`caught-for-another-reason`). A first attempt at the first probe did not compile (unreachable code is an error here) and was redone with a mutation that compiles.
- **A flag the fuzzer switched on.** The first CI run of this slice failed in Schemathesis: its test-control pass fuzzed `PUT /__test/bugs`, set `problem-json-missing`, and every later 400 came back as plain text ('Undocumented Content-Type'). It had passed three times locally and in CI for P1: the flag was only dangerous once it existed, and the fuzzer's choice varies between runs. The bug-flag control is now excluded from the fuzzing pass (`tools/schemathesis-run.mjs` v2); `FlagTests` and the flag proof cover it.

## 28. The validator and the hooks (CDS-38 F2, 2026-10-15)

Review findings B-01, B-09 to B-13, B-21 and B-23, fixed in the harness. The service is unchanged.

- **The validator judges the whole response** (`Contract.validate(operationId, response)`, `ResponseToCheck`: status, content type, headers, parsed body, raw text). It refuses: a status the contract does not document; a content type the response does not document (a `text/plain` Problem is no longer a Problem; a charset parameter is ignored); a body that says it is JSON and is not; a documented response header that is missing or fails its schema (`Retry-After` must be an integer of at least 1; a header is required unless the contract says `required: false`); a Problem whose `status` differs from the HTTP status; a Problem that carries `stack`, `stackTrace`, `trace` or `exception`; and a body that does not match its schema. The schemas are closed since contract v19 (F2a), so an extra property fails here.
- **Ajv runs in strict mode** (`strict: true`, `allowUnionTypes`), with the OpenAPI document's own top-level keywords and `example` declared. Every documented response schema is compiled when the contract is loaded, so a schema strict mode refuses fails at the start of a run.
- **`send` returns `{ status, headers, body }`** (headers in lower case); a body is parsed only when its content type says JSON, and an unparseable one reaches the validator as such.
- **The validator has its own tests** (`src/contract/validate.test.ts`, Node's test runner through `tsx`, `npm run test:unit`; the `api` run type-checks the harness (`npm run typecheck`, since `tsx` strips types) and executes them before it starts the services, and `verify` runs that). Each check was shown to fail its test when switched off.
- **The After hook** (`src/support/diagnostics.ts`, both profiles) attaches the diagnostics to a failed scenario (the last response with its headers and body, personas, the date, the flags in force) and then resets the service, against the main instance even when the scenario had pointed the actors at the one without test control. A failed restore fails the scenario.
- **A parallel run is refused** (`src/support/parallel.ts`, called in the `BeforeAll` of both profiles): the scenarios share one service, its clock, its bindings and its flags.
- **The flag proof's recorded text for `problem-json-missing` changed** (CDS-38 F2 follow-up): with the stricter validator the plain-text error is refused for its content type (`has content type 'text/plain'`) before the old text (`is not valid JSON`) could appear. The first F2 pull request was merged with its `ui` job red for this reason; the proof reported the flag as caught for another reason, as it should, and the registry text was updated to match in the fix that followed.

## 29. Fixtures and steps that can fail (CDS-38 F5, 2026-10-16)

Review findings B-04, B-05, B-14 to B-19. Each change was shown to turn a scenario red by a mutation, then reverted.

- **Exact comparisons.** The debt-by-type step and the interest-rate step compare a value hook (`debt-type-{type}-amount`, `detail-tile-{field}-value`, UI specification v24) with `equals`; before, `includes` let `£320` pass for `£32` and `129.9%` for `29.9%` (B-04, B-19).
- **Expected values come from the fixtures, not from the page.** `fixtures/users.json` now supplies the legal name and date of birth for the profile steps and the personal-details step (B-05, B-17); the PR-08 check covers the personal values the profile page shows (legal name and first name, preferred name, date of birth and member-since date as shown and as ISO, email, first line of the address, postcode, employment status, last mobile digits) in the title, the path, the query and the fragment (B-18, R2-B-05). Words such as an email's status are left out, because a title may use them. The step sentences say "profile data" (step glossary).
- **`the credit card is listed` looks for the arranged card** (`thatAccount`), not for any credit card (B-16). Read, not mutated: the scenarios cannot put a second closed card in the list.
- **A closed account's stored balance may be non-zero** (API specification v32), so BR-13's "reports 0" can fail: `acc_ddcl01` (drilldown), `acc_stcl01` (struggling) and the `br13-closed-anniversary` sample each hold a balance and a limit. The override check no longer refuses a closed balance and the fixture check allows it. Mutations: the service reporting the stored balance turns the closed-accounts scenario red (B-15); the service counting closed accounts in the open-account totals turns two account-totals and debt scenarios red (B-14).

## 30. The flag proof that cannot be fooled (CDS-38 F7, 2026-10-16)

Review findings B-02, B-03, B-06, B-07, B-08 and B-26. How the proof judges a run is a pure module (`src/flags/verdict.ts`) with its own unit tests (`verdict.test.ts`, eight cases, one for each way the review fooled it; part of `npm run test:unit`).

- **A catch is for the stated reason only.** `failsWith` is specific to the flag: `currency-float` records `at '/balance/amountMinor': must be integer`, so a float put into `utilisation` is "caught for another reason" (B-02).
- **The text must not appear without the defect.** The run with the flag off must pass, must have run, and must not print `failsWith`; if it does the flag is a false alarm. The registry check also refuses a `failsWith` that the catcher's feature file holds, because every run prints it (B-03).
- **"Something ran" counts both ways.** An on run that ran nothing, or crashed before running, is `did-not-run`, never a catch, even if its output happens to hold the text (B-07).
- **The flags in force are asserted, not assumed.** Every scenario's `Before` sets the flags (an empty list too) and reads `GET /__test/state` to check the service holds exactly what the run asked for (B-06), and that the reset left the clock following real time, no latency, no overrides and each test user on the default persona (R2-B-07).
- **A hung run is a verdict.** Each catcher run has a time limit (240 s, `CDS_PROOF_TIMEOUT_MS`); a stop is `timed-out` and the flag is not credited. `run.mjs` runs the Cucumber, exit or flags child asynchronously, so a SIGINT or SIGTERM reaches its handler at once, which stops the child and both services (B-08, R2-B-08; the signal path is not exercised on Windows, where node's `kill` does not deliver a catchable signal). Each mode has a whole-run limit (api 10 minutes, ui and exit 15, flags 60; `HARNESS_TIMEOUT_MS` overrides), shown to stop a run and free the ports. A feature file that does not exist, or a run in which no scenario finished, fails (R2-B-09).
- **A component test is found by its declaration.** The registry check wants `it(`/`test(` with exactly that name (a comment or an expected string does not count), and the proof escapes the name for Vitest's `-t` pattern (B-26).

Mutations (each reverted): a float in `utilisation` instead of in the money, `caught-for-another-reason`; `failsWith` set to the scenario title, `false-alarm` and the registry check fails; a service that ignores the flags, the scenario fails with "the flags in force are []"; a one-and-a-half-second limit, `timed-out`; a test name that only an expectation holds, the registry check fails; a catcher name that matches nothing, `did-not-run`.

## 31. Exit checks, the public build and CI (CDS-38 F10, 2026-10-16)

Review findings C-09 to C-15 and C-29.

- **The exit checks cover what the specification says** (`src/exit/exit-checks.ts` v2): 60 targets and the two sign-in states, each scanned with axe in the light and in the dark theme (124 scans), and every target that is not a state of another page looked at in the three layouts with normal text and with the root text doubled (282 checks). Section errors are produced by failing one call (`page.route`), empty lists by the `thin-file` persona, the rest by acting on the page. One browser session signs in once per context and moves by in-app navigation through a blank page (the session is in memory only), which is why 400 checks take under three minutes. `CDS_EXIT_ONLY=text` runs the targets whose name holds the text. A page that scrolls sideways reports the elements that reach past the edge.
- **Defects the widened checks found, fixed in the same change:** `#dc-error` had a fixed red that failed contrast in the dark theme (now `--color-error`); `.cards` did not shrink to a phone with doubled text (`minmax(min(14rem, 100%), 1fr)`); two visually hidden chart tables widened the page, because `overflow` does not clip table cells (the hiding is now on a wrapper).
- **Mutations, each reverted:** a 375 px break (search rows 40 rem wide) is found at 375 px; a dark-theme muted colour of `#34414f` is found by axe; an element of `12rem` that overflows only with doubled text is found only in the doubled pass; removing `aria-pressed` from the year buttons turns three component tests red and leaves the axe pass green (so the stated catch was narrowed).
- **The public build is guarded** (`demo-apps/demoapp001-react-ui/scripts/public-build-guard.mjs`, run by `npm run check` and so by the `ui` CI job): any test-only marker in `dist/` fails. The guard has its own tests. Inverting the switch in `src/flags.tsx` makes all 179 component tests pass and the guard fail. The harness builds the test build into `dist-test/` (`npm run build:test`), so `dist/` is only ever the public build.
- **A failed hook is no longer silent.** `AfterAll` in the `ui` profile bounds the browser close (30 s) and fails with its reason; `run.mjs` reads the message report after a failing run and prints any run hook that did not pass. With a close time of 1 ms the run prints "3 successful", then "a run hook failed: The browser did not close within 30 s", then exit code 1: the case the review met. Service logs are named by port and process.
- **CI:** every action is pinned to a commit SHA with its version in a comment, and `@redocly/cli` 2.57.0 is in the root `package.json` and lockfile (the lint step runs the local binary, not `npx --yes`).

## 21. Exit-check catchers (CDS-41)

- **A third catcher kind.** `fixtures/bug-flags.json` catchers may be `kind: "exit-check"` with a `target` (a target name of `exit-checks.ts`) and `failsWith`. `schema-check` requires the target to exist in the source and the text to be a message the run builds, not a literal the source holds. `src/flags/prove-flags.ts` runs the exit script on that target with the flag in `HARNESS_BUGS`; `exitCheckRan` (`verdict.ts`, unit tested) says whether the run looked at anything, so a target that matches nothing is "did not run", not a pass.
- **The exit script sets the flags** (`HARNESS_BUGS`, an empty list too) after its reset, and clears them at the end. Its browser contexts carry `cds.testControlKey` in local storage, as the Cucumber hooks do.
- **Cost.** One exit-check catcher is two single-target runs, about 17 s each (measured in P3b), plus the proof's own start-up.

- **The semantic rules** (`src/exit/semantic-rules.ts`, P3b): seven DOM rules as source text evaluated in the page by `violationsOn`, after axe-core, so they run in all 124 axe scans and 288 layout checks without changing their counts. Six of them are the catchers of six UI flags; the seventh (`form-controls-follow-text-size`) has no flag and is shown by removing `font: inherit` from the form controls' rule. With a flag on, only that flag's rule reports (checked for `minor-units-label` and `placeholder-aria`).
- **Cost.** An exit-check catcher took about 17 s a run in P3b (browser start, the target's axe passes in both themes and its layouts), against the 8 s estimated in P3a; six flags took 3 min 24 s through the proof.

- **The proof has its own CI job** (`flags`, P3c). At 16 flags the `ui` job took 8 min 47 s; 19 flags with their four more catchers were measured at 4 min 8 s through the proof alone, which would put the `ui` job at about 13 minutes against its limit of 15. The decision D4 of the P3 plan said to move the proof out at 11 minutes, so the proof runs beside the `ui` job, with a 30 minute limit.

## 32. The visual checks (CDS-43, 2026-10-19)

- **What is compared.** `npm run check:visual` (`src/visual/`, run by `node scripts/run.mjs visual`) photographs eight pages (overview, payment history, report changes, hard searches, personal details, the credit card list, a credit card's detail, the profile) at 375 and 1280 px in the light and the dark theme, 32 images, each whole page in its settled state with the flags off, persona `drilldown` and the service's clock frozen at 2026-10-03T09:00Z (what a page shows depends on it), animations off. Each is compared with a baseline in `test-harnesses/harness-serenity/visual-baselines/` with a colour distance of 0.2 per pixel and no pixel allowed to differ beyond it (0.1% of the pixels was tried first and hid `util-mismatch`; decision D4 revised on 2026-10-19). A missing baseline fails, and so does a file in the folder that no case compares. Baselines are made and compared on Linux CI only: anywhere else the run refuses. They are refreshed by the manual workflow `visual-baselines.yml`, which pushes a branch for a reviewed pull request and never commits to `main`. The workflow `visual.yml` runs the check when the UI, the service or the harness changes, and uploads the actual, expected and diff images when it fails.
- **Built on the Playwright test runner, not on the Cucumber or the exit run.** `toHaveScreenshot` lives in `@playwright/test` (pinned 1.64.0, the release of `playwright`; decision D3 revised: the harness did not have it), which needs a test to run in, so `src/visual/visual.spec.ts` is a Playwright spec and `src/visual/playwright.config.ts` holds the tolerance and the paths. `scripts/run.mjs visual` starts the service and the test build of the UI as the other modes do and runs `playwright test` with `--update-snapshots=none`, so a missing baseline fails, or `=all` with `--update`.
- **One list of pages.** The target list, the sign-in and in-app navigation, the arrangement of a target and the browser context moved from `exit-checks.ts` to `src/exit/targets.ts`, unchanged, so the exit and visual checks cannot drift apart. The exit run reported 124 axe scans and 288 layout checks with 0 problems before and after.
- **The pure part.** `src/visual/cases.ts` lists the 32 cases and judges the baseline folder (missing, or a file nothing compares); `cases.test.ts` has six tests, two of them proved by mutation (dropping the extra-file rule fails one, inverting the missing-file rule fails four). The tolerance is Playwright's and is proved by the probes below, not by a unit test.
- **Linux only.** `run.mjs visual` exits 1 with a message unless `CI=true`. `VISUAL_LOCAL_TRY=1` runs against throw-away images in `reports/visual-local-baselines/`, for finding flaky pages on this machine; it is never a result.
- **Probes, on this Windows machine against its own throw-away images (not a Linux result), each reverted:** a clear accent colour change fails 16 of 32; a main padding 4 px wider fails 32 of 32; a colour change of one channel by 10 steps (`#0b5cad` to `#0b66ad`) does **not** fail, because it is inside the colour distance of 0.2, and that is the check's stated limit; `util-mismatch` fails 12 of 32 and `currency-format` fails 12 of 32; a deleted baseline fails (the image and the folder check); an extra file fails the folder check; three clean runs in a row passed. With a tolerance of 0.1% of the pixels `util-mismatch` passed, which is why it is none.
- **Not yet proved:** that Linux CI produces identical images twice running (P5b), and that the baselines made there are stable across runs.
