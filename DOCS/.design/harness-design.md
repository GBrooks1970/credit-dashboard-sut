---
version: 1
created: 2026-10-09T11:20Z
project: credit-dashboard-sut
type: design
item: CDS-22
language: en-GB
status: draft
---

# Harness design: the Serenity/JS API harness

**What this is.** How the harness in `test-harnesses/harness-serenity/` runs the `@api` scenarios against the service: layout, abilities, the order of arrange, act and assert, response validation, the service lifecycle, the clock-and-token rule, and where each step pattern of `DOCS/step-glossary.md` lands. It follows the approved plan (`DOCS/implementation-plans/2026-10-08_cds-22-serenity-harness.md`, decisions D1 to D5) and DR-006, DR-008 and DR-042. It is written before the code; the slices H1 to H4 build to it, and a difference found while building is fixed here first.

**Scope.** The 12 `@api` feature files: ten in `features-shared/api/` (28 scenarios and outlines) and two `@security @api` in `features-shared/security/` (3). `security/open-redirect` is `@security @ui` and waits for Phase 4. The 92 distinct step patterns (130 step lines) in those files are the whole vocabulary; the UI patterns of glossary section 4.2 are not built.

---

## 1. Layout (D1)

A standalone package, as in `loan-origination-parity`, with its own `package.json` and lock. It imports nothing from the service, the generated C# types or `packages/api-client` (DR-042): the harness is an independent reader of the contract.

```
test-harnesses/harness-serenity/
  package.json  package-lock.json  tsconfig.json  cucumber.mjs
  src/
    abilities/     CallAnApi.ts  ControlTheTestEnvironment.ts
    contract/      load.ts (reads DOCS/.architecture/openapi.yaml)  validate.ts (Ajv by operation and status)
    fixtures/      load.ts (reads fixtures/personas, fixtures/overrides, fixtures/users.json)
    support/       parameter-types.ts  world.ts  hooks.ts  clock.ts  service.ts
    steps/         arrange.steps.ts  act.steps.ts  assert.steps.ts
  scripts/run.mjs  (builds and starts the service, runs Cucumber, stops the service)
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

One method per test-control operation: `reset()`, `bind(username, persona, overrides?)`, `setClock(instant)`, `setBugs(flags)`, `verifyEmail(username)`, `state()`. It carries the `X-Test-Control-Key` header and validates responses exactly as `CallAnApi` does. The key is a synthetic value the runner invents for the run (`harness-run-key`) and passes to the service and to the harness through the environment; it is never read from, or written to, a file.

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
5. **After** (hook): on failure, attach the request, the response and the service log tail to the report; always restore the default service state (`reset()`).

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
3. The one exception is `{actor}'s token has expired`: it keeps its (now expired) token and marks the actor `keepToken`, so the act uses it and receives 401. `keepToken` is cleared by the next clock change or bind.
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

Every pattern used by the 12 files has one definition, in the file named below. A coverage check in H3 matches each step line of the 12 files against the definitions and fails on a line with none, a line with two (ambiguous), and a definition no line uses.

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

Cucumber's `message` and `html` formatters write to `reports/`; the console shows the progress formatter, and the failure's attachments (section 5, After) are in the HTML report. No second stdout formatter (the lesson recorded in the reference project: one only). The run ends with one line: scenarios passed, failed, skipped, steps, duration, and the service log path.

## 12. Verification of the harness itself

These are the probes the plan requires, each expected to fail and then reverted; their results go in the slice logs.

| Probe | Expected failure |
|---|---|
| A service rule broken (for example BR-03 utilisation floor) | The scenario tagged for that rule goes red for the stated reason |
| A required key removed from a service response | Contract validation fails, naming the operation and path, before any assertion |
| Rule 2 of section 7 ignored (token kept across a clock change) | A scenario that moves the clock after a sign-in fails with 401 |
| A Given whose data is not in the persona | The fixture check fails loudly, naming the persona |
| A step line with no definition, and one with two | The coverage check fails |
| An overrides patch that does not reach the response | The scenario's assertion fails and the H2 probe catches it |

## 13. Changes to other documents

- **Glossary (v8, this PR):** section 3 gains the rule for *that account* (section 6 above) and the wrong-code step says what a wrong code is (section 10). Any further ambiguity found in H2 or H3 is fixed in the glossary first.
- **Feature files (H4):** the scenario *Test control is off by default* gains the tag `@no-test-control` (it is a tag change, not a wording change, so it is not a scenario change under glossary section 7).
- **Decision register:** DR-057 is recorded with the gate in H4.

## 14. What this design does not settle

- The exact fields each overrides pattern patches (section 6): H2, by reading each sample and probing.
- Whether Serenity/JS's `Cast` and `Actor` are used for the actors or a plain world object suffices; the choice is made in H1 against the first feature and recorded in the H1 log, with Serenity/JS kept as the actor model if it costs no more than a few lines (the portfolio shows the Screenplay pattern).
- Whether the number of executions after outline expansion differs from 31: counted in H1.
