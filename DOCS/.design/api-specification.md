---
version: 13
created: 2026-10-07T12:50Z
supersedes: v12 (2026-10-07T10:25Z); earlier versions are in git history (DR-040)
project: credit-dashboard-sut
type: api-spec
language: en-GB
---

# Credit Dashboard SUT: API Specification

**Status:** Phase 0 draft, for review
**Changes in v13:** section 6.5 states the clock after a reset (CDS-18 confirmation pass).
**Changes in v12:** CDS-18 review fixes (contract v10, `info.version` 0.7.0). BR-07 adds the debt breakdown by type (DR-046); BR-09 states that characters other than letters and digits are dropped; BR-11 names `changesTotal`; section 5 defines how a month's payment status is derived (BR-12); section 6.3 drops 403, which BR-15 rules out; section 8 lists one Problem type per rule outcome (DR-048); section 3 says token expiry is judged on the controlled clock.
**Changes in v11:** the runtime version is resolved (CDS-16, DR-044): section 3 'Runtime' row.
**Changes in v10:** the generated TypeScript client (CDS-15): section 3 'Client' row and section 11 'Client' check; the harness does not use it (DR-042, DR-043).
**Changes in v9:** the Prism mock is pinned, smoke-tested over every operation and reachable without the `/api/v1` prefix (CDS-14, DR-039; contract v9, `info.version` 0.6.2); sections 3 and 11.
**Changes in v8:** decision brief 5 (owner review, CDS-01): `GET /me` gains `greetingName` (DR-036; contract v7, `info.version` 0.6.0); no general rate limit, 429 is PR-09's resend limit only (DR-035); the overview stays one aggregate call (DR-034). Accepted as the Phase 0 baseline (DR-038).
**Changes in v7:** the email and mobile operations and `POST /__test/verify-email` are in the contract (v6, `info.version` 0.5.0; CDS-11), with rules PR-09 to PR-11 and amended PR-04 (decision brief 3). A reusable `429` response now exists for the error catalogue's rate limit.
**Changes in v6:** test-control overrides are in the contract (v5, `info.version` 0.4.0; CDS-13): section 6.5 states their rules and section 9.1 which fixture checks apply to them; `FixtureAccount` moves into the contract.
**Changes in v5:** decision brief 2 applied: the service is a .NET minimal API (DR-017); test-control overrides decided, contract to follow (DR-020, CDS-13); Release 3 profile scope is email and mobile, the other sub-pages are stretch (DR-022); DR-005 settled (DR-018).
**Changes in v4:** decision brief 1 applied: BR-03 utilisation has no upper bound (DR-013), BR-07 steady is inclusive (DR-011), BR-12 mixed years are on time (DR-014), BR-13 ends on the anniversary (DR-012); *Release* replaces the page catalogue's *Phase* (DR-015); wording conformed to `DOCS/glossary.md` v2. Contract v4 (`info.version` 0.3.0).
**Changes in v3:** persona fixture format and test users (section 9.1, backlog CDS-08); two rule-boundary questions found while writing scenarios (section 12, backlog CDS-06).
**Changes in v2:** contract linted clean (section 11); test-control 404 and 400 responses (section 6.5); new section 6.6 for the My Profile endpoints (backlog CDS-11); profile open questions (section 12).
**Contract:** [`DOCS/.architecture/openapi.yaml`](../.architecture/openapi.yaml) (OpenAPI 3.1). Where this document and the contract disagree, the contract wins and this document is corrected.
**Companion:** [UI specification](ui-specification.md) · [UI feature spec: My Profile](ui-feature-profile.md) · [Page survey](page-survey.md)

---

## 1. Purpose and scope

The API serves every piece of data the dashboard shows. It is a fictional credit-report service with seeded, synthetic personas; no real bureau, lender or person is modelled.

It has two audiences. The UI consumes it through a client generated from the contract. The test harness consumes it directly, for API-level scenarios and for arranging state through the test-control endpoints.

Out of scope: real credit scoring, real open-banking consent, persistent storage, multi-tenancy, payments of any kind.

## 2. Specification-driven principles

1. **Contract first.** No endpoint is implemented until it exists in `openapi.yaml`, passes lint, and has at least one example per response.
2. **One contract, three consumers.** The same file drives the mock server (UI development), the response validator (contract tests) and the generated client (UI build).
3. **Rules carry IDs.** Every business rule below has a `BR-` ID. Gherkin scenarios and unit tests cite those IDs in tags, so coverage is traceable both ways.
4. **Behaviour before code.** API scenarios in `features-shared/api/` are reviewed and agreed before Phase 3 begins.
5. **Test control is part of the contract.** State set-up endpoints are documented, versioned and off by default, never hidden in test code.

## 3. Architecture

| Concern | Decision | Status |
| --- | --- | --- |
| Runtime | .NET 10 (LTS), C#: SDK 10.0.401, pinned in the service's `global.json` with `rollForward: latestPatch` when the service is scaffolded, taking the latest 10.0.4xx patch on that day (DR-044). Building it needs the .NET 10 SDK installed | Accepted (DR-017, DR-044) |
| Framework | ASP.NET Core minimal API. Contract first: C# request and response types generated from `openapi.yaml`; requests validated against the contract at the edge; no code-first contract generation | Accepted (DR-017) |
| Business rules | A C# library inside the service, unit-tested with NUnit, each test tagged with its BR ID | Accepted (DR-017) |
| Data | In-memory store, loaded from `fixtures/personas/*.json` at start and on reset | Proposed |
| Auth | Bearer token issued by `POST /auth/login`; each test user is bound to one persona. A token's `expiresAt` is judged on the controlled clock, so moving the clock past it expires the token (the `@security` expiry scenario) | Proposed (DR-007) |
| Container | Single Docker image; `docker compose up` brings up API and UI | Proposed |
| Mock | Prism 5.16.0 (`@stoplight/prism-cli`, pinned in the root `package.json`, DR-009) serving `openapi.yaml` examples on port 4010, without the `/api/v1` prefix (DR-039): `npm run mock` | Accepted |
| Client | Generated TypeScript client, `packages/api-client`, a standalone package with its own lock (DR-043): types generated from `openapi.yaml` by `openapi-typescript` 7.13.0, requests made by `openapi-fetch` 0.17.0, TypeScript 5.9.3. Each consumer chooses the base URL: the mock at `http://localhost:4010`, the service at `http://localhost:4000/api/v1` (DR-039). Its consumer is the UI; the harness consumes the API independently (DR-042) | Accepted |

The service is stateless apart from the in-memory store, the active bug flags and the controlled clock. A reset returns all three to their defaults.

## 4. Conventions

| Topic | Convention |
| --- | --- |
| Base path | `/api/v1` |
| Format | JSON, UTF-8; `Content-Type: application/json` |
| Money | Integer minor units plus currency: `{ "amountMinor": 423600, "currency": "GBP" }` (DR-004). The UI formats; the API never sends formatted strings. |
| Percentages | Integers 0 to 100 unless stated. Utilisation has no upper bound; rounding rule BR-03 |
| Dates | ISO 8601 (`2026-08-12`, `2026-10-03T17:15:00Z`) |
| IDs | Opaque strings (`acc_7f3k2q`), never sequential, never the account number |
| Masked numbers | Server-side masking only; full account numbers never leave the service |
| Errors | RFC 9457 `application/problem+json` with `type`, `title`, `status`, `detail`, `instance`, `errors[]` |
| Lists | `?page=1&pageSize=20`; response carries `items`, `page`, `pageSize`, `total` |
| Correlation | `X-Correlation-Id` echoed on every response; generated if absent |
| Versioning | Breaking change means a new base path; additive changes only within `v1` |

## 5. Resource model

```
User 1 ── 1 Profile       (account record: legal name, preferred name, contact, optional details)
User 1 ── 1 Persona 1 ── * Bureau report
                              ├── Score (current, benchmarks, history[])
                              ├── Change[]        (report changes)
                              ├── Impact          (counts per category)
                              ├── Account[]       (open and closed, by type)
                              │     ├── Details        (user-supplied fields)
                              │     ├── BalanceHistory (6 months)
                              │     └── PaymentHistory (per year, 12 statuses)
                              ├── Search[]        (hard / soft)
                              └── PersonalDetails
```

Account types: `creditcard`, `loan`, `mortgage`, `currentaccount`, `telecomsandutilities`, `lineofcredit`.
Account status: `normal`, `arrears`, `default`, `settled`, `closed`.
Payment status per month: `on-time`, `missed`, `no-data`. For one account, a month is `missed` if it is in the account's `missedMonths`; `no-data` if it is before the month of `openedDate`, after the month of `closedDate`, or after the current month on the controlled clock; otherwise `on-time`. Across a report, a month is `missed` if any account missed it, `on-time` if any account was on time and none missed, and otherwise `no-data`. Year statuses follow BR-12.

## 6. Endpoints

### 6.1 Session

| Method | Path | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | Exchange test credentials for a token | 200 `{ token, expiresAt }` | 400, 401 |
| POST | `/auth/logout` | Revoke the token | 204 | 401 |
| GET | `/me` | Current user, greeting name (PR-03) and default bureau | 200 `User` | 401 |

### 6.2 Report

| Method | Path | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/bureaux` | Bureaux available to the user | 200 `Bureau[]` | 401 |
| GET | `/reports/{bureauId}/overview` | Aggregate for the overview page in one call | 200 `ReportOverview` | 401, 404 |
| GET | `/reports/{bureauId}/score` | Current score and benchmarks | 200 `Score` | 401, 404 |
| GET | `/reports/{bureauId}/score/history?range=3m\|6m\|1y` | Monthly points | 200 `ScorePoint[]` | 400, 401, 404 |
| GET | `/reports/{bureauId}/changes?tags=&sentiment=&page=` | Report changes, newest first | 200 `Page<Change>` | 400, 401, 404 |
| GET | `/reports/{bureauId}/impact` | Topic counts per category | 200 `Impact` | 401, 404 |
| GET | `/reports/{bureauId}/payment-history?year=` | Missed payments across all accounts | 200 `PaymentHistory` | 400, 401, 404 |
| GET | `/reports/{bureauId}/searches?kind=hard\|soft` | Search records | 200 `Page<Search>` | 400, 401, 404 |
| GET | `/reports/{bureauId}/personal-details` | Name, addresses, electoral roll (synthetic) | 200 `PersonalDetails` | 401, 404 |

### 6.3 Accounts

| Method | Path | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/reports/{bureauId}/accounts?type=&status=open\|closed` | Account rows for a type list or the closed page | 200 `AccountSummary[]` | 400, 401, 404 |
| GET | `/reports/{bureauId}/accounts/totals?type=` | Summary card figures for one type (BR-04) | 200 `AccountTotals` | 400, 401, 404 |
| GET | `/accounts/{accountId}` | Account detail | 200 `Account` | 401, 404 |
| GET | `/accounts/{accountId}/balance-history` | Last 6 months, oldest first | 200 `BalancePoint[]` | 401, 404 |
| GET | `/accounts/{accountId}/payment-history?year=` | That account's statuses | 200 `PaymentHistory` | 400, 401, 404 |
| PATCH | `/accounts/{accountId}/details` | Set one user-supplied field | 200 `AccountDetails` | 400, 401, 404, 422 |

`PATCH` body: `{ "field": "interestRate", "value": 29.9 }`. Allowed fields: `apr`, `interestRate`, `promoPeriodMonths`, `minPayment`, `paymentMethod`.

### 6.4 Supporting

| Method | Path | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/debt/overview` | Total debt, trend and the breakdown by type (BR-07) | 200 `DebtOverview` | 401 |
| GET | `/notifications` | Notifications, unread first | 200 `Page<Notification>` | 401 |
| PATCH | `/notifications/{id}` | Mark read | 200 `Notification` | 401, 404 |
| PUT | `/reports/{bureauId}/summary/feedback` | Like / dislike / clear (BR-10) | 200 `{ value }` | 400, 401 |
| POST | `/assistant/messages` | Mock assistant; canned reply keyed by intent | 200 `{ reply, disclaimer }` | 400, 401 |

### 6.5 Test control (off by default)

Enabled only when `TEST_CONTROL=true`. Absent from production builds; returns 404 otherwise. Requires header `X-Test-Control-Key`.

Every operation documents a `404` (`TestControlDisabled` in the contract): test control is off, or the target does not exist. Operations that take a body also document `400`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/__test/reset` | Reload fixtures, clear bug flags, reset clock and latency |
| PUT | `/__test/users/{username}/persona` | Bind a test user to a persona; optional `overrides` (below) |
| PUT | `/__test/bugs` | `{ "flags": ["util-mismatch", "minor-units-label"] }` |
| PUT | `/__test/clock` | `{ "now": "2026-10-03T09:00:00Z" }` freezes server time. After a reset the clock follows real time (`now: null` in `GET /__test/state`) until this call freezes it, so every scenario whose outcome depends on the date sets it (`today is …`) |
| PUT | `/__test/latency` | `{ "fixedMs": 3000 }` or `{ "minMs": 0, "maxMs": 5000 }` |
| GET | `/__test/state` | Current persona bindings, flags, clock, latency |
| POST | `/__test/verify-email` | Mark a test user's email verified without the link (PR-04) |

**Overrides (DR-020; contract schema `PersonaOverrides`).** A scenario arranges data no persona holds by binding with `overrides`: for each named bureau, the lists it supplies (`accounts`, `changes`, `searches`) replace that bureau's lists for this user; lists not named are kept. Accounts use the contract's `FixtureAccount`, the fixture format of section 9.1. `POST /__test/reset`, or binding again without `overrides`, clears them; `GET /__test/state` reports which users have overrides in force.

- A body that fails the schema is a `400`; an unknown bureau ID is a `404`.
- Overrides that break a rule a stored value must obey are a `422`: utilisation against balance and limit (BR-03, BR-06), a loan without a limit counted in totals (BR-05), a mask against its source (BR-09), a closed account with a balance (BR-13), missed months outside the seven-year window (BR-12), or an account ID used elsewhere (BR-15).
- Two persona conventions do **not** apply, because scenarios arrange exactly these states: changes need not be stored newest first (the service sorts them, BR-11), and a closed account may sit outside the six-year window (the service does not list it, BR-13).
- Derived values (section 9.1) are recomputed from the overridden source data, never supplied.

### 6.6 Profile (Release 3)

The customer's own account record, behind the My Profile page. Rules PR-01 to PR-08 live in the [My Profile UI feature spec](ui-feature-profile.md), section 5; the API enforces PR-01, PR-02 and PR-07, and keeps PR-08 by putting no profile value in any path or query.

| Method | Path | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/me/profile` | Identity header, preferred name and tile summaries | 200 `Profile` | 401 |
| PATCH | `/me/profile/preferred-name` | Set or clear the preferred name (PR-02) | 200 `PreferredName` | 400, 401, 422 |

`PATCH` body: `{ "preferredName": "  Sam  " }`. The service trims first, then applies PR-02; the response carries the stored value (`"Sam"`). An empty string or `null` clears the name and returns `null`. A body that is not a string or null, or is over 100 characters, is a `400`; a trimmed value that breaks PR-02 is a `422`.

`Profile` summaries follow PR-07 and the masking convention in section 4: finances report only `added: true|false`, and the mobile number reports only its last three digits.

**Sub-page operations.** The profile spec's section 6 lists eight operations behind the five sub-pages. The Release 3 operations for email and mobile are in the contract (v6, CDS-11); the API enforces PR-04, PR-06 and PR-09 to PR-11 for them, timing PR-09 and PR-10 on the controlled clock. Address, employment and finances are stretch (DR-022): specified, not in the contract.

| Method | Path | Purpose | Status |
| --- | --- | --- | --- |
| PUT | `/me/profile/email` | Change email (PR-04) | In the contract (v6) |
| POST | `/me/profile/email/verification` | Resend verification (PR-09) | In the contract (v6) |
| PUT | `/me/profile/mobile` | Add or change number; returns a challenge (PR-06, PR-10) | In the contract (v6) |
| POST | `/me/profile/mobile/verification` | Submit the one-time code (PR-10, PR-11) | In the contract (v6) |
| GET, POST | `/me/profile/addresses` | List, add (PR-05) | Stretch (DR-022) |
| PUT | `/me/profile/employment` | Status and optional fields | Stretch (DR-022) |
| PUT | `/me/profile/finances` | Income and housing cost (PR-07) | Stretch (DR-022) |
| POST | `/__test/verify-email` | Test control: mark email verified | In the contract (v6) |

## 7. Business rules

| ID | Rule |
| --- | --- |
| BR-01 | Score is an integer 0 to 1000. Benchmarks (national, local) use the same scale. |
| BR-02 | History range `3m`, `6m`, `1y` returns 3, 6 and 12 monthly points, oldest first, ending at the current month. Missing months return `score: null`, never a carried-forward value. |
| BR-03 | Utilisation = balance / limit × 100, rounded half up to an integer. Limit of zero or null gives `utilisation: null`. No upper bound: above 100 means the balance is over the limit (DR-013). |
| BR-04 | Type totals sum `balance` and `limit` across open accounts of that type where `includedInTotals` is true. Utilisation of the total follows BR-03. |
| BR-05 | Loans without a limit set `includedInTotals: false` and appear in a separate `excluded` array in the totals response. |
| BR-06 | A negative balance (an account in credit) is returned as a negative integer. Utilisation is floored at 0 for display purposes; raw value available as `utilisationRaw`. The UI shows the amount as 'in credit' (DR-018). |
| BR-07 | Total debt = sum of positive balances of open accounts with `includedInTotals` true, excluding current accounts. Trend compares to three months earlier: a change of at most 1% either way, unrounded, is `steady` (inclusive). If the earlier total was zero, the trend is `steady` when the total is still zero, otherwise `up` (DR-011). `byType` splits the total: for each account type, the sum of the same positive balances, one entry per type above zero, in enum order (DR-046). |
| BR-08 | `nextUpdateInDays` = whole days until the bureau's next refresh date, using the controlled clock; minimum 0. |
| BR-09 | Masked number format: `*` followed by the last four characters, uppercase alphanumeric (`^\*[A-Z0-9]{4}$`), after removing characters other than letters and digits from the source. Shorter results are left-padded with `0`. |
| BR-10 | Summary feedback is one of `like`, `dislike`, `none`. Setting one replaces the other. |
| BR-11 | Changes default to newest first. The overview embeds the 3 newest in `recentChanges`; `changesTotal` reports the full count. |
| BR-12 | Payment history covers the current year and the six before it. A year with any `missed` month reports `missed`; a year with only `no-data` reports `no-data`; every other year, including one mixing `on-time` and `no-data` months, reports `on-time` (DR-014). |
| BR-13 | Closed accounts report balance 0 and are listed while today is before the close date plus six calendar years, so they drop off on the sixth anniversary. A 29 February close drops off on 28 February (DR-012). |
| BR-14 | User-supplied details: `interestRate` and `apr` accept 0 to 100 with up to 2 decimal places; `promoPeriodMonths` 0 to 60; `minPayment` needs `amountMinor` ≥ 0 or `percent` 0 to 100. |
| BR-15 | A user may read and change only accounts in their own persona. Anything else returns 404 (not 403), so account IDs cannot be probed. |

## 8. Error catalogue

| Status | `type` suffix | When |
| --- | --- | --- |
| 400 | `/validation` | Bad query or body shape; `errors[]` lists each field |
| 401 | `/unauthenticated` | Missing, expired or revoked token |
| 404 | `/not-found` | Unknown resource, or one owned by another user (BR-15) |
| 422 | `/rule-violation/{outcome}` | Shape valid, but breaks a rule. One type per outcome (DR-048): `out-of-range` (BR-14), `preferred-name` (PR-02), `already-verified` (PR-09), `mobile-number` (PR-06), `code-wrong` with `attemptsRemaining` (PR-11), `code-invalid` (the third wrong code, an expired or voided code, or nothing pending; PR-10, PR-11), `overrides-inconsistent` (test control, DR-020). Clients and tests branch on `type`, never on `title` or `detail` |
| 429 | `/rate-limited` | A verification link resent within 60 seconds (PR-09). There is no general rate limit (DR-035) |
| 500 | `/internal` | `error` persona, or an unhandled fault; no stack trace in the body |
| 503 | `/unavailable` | Bureau marked offline in fixtures |

## 9. Personas

| Persona | Exercises |
| --- | --- |
| `excellent` | Happy path; all on time; low utilisation |
| `struggling` | Missed payments, arrears status, utilisation above 90%, one card over its limit (115%) |
| `thin-file` | No accounts, no searches; every empty state |
| `boundary` | Score 0 and 1000; utilisation exactly 0% and 100%; limit of zero |
| `drilldown` | Every account type, an excluded loan, a missing logo, a negative balance, a malformed source mask |
| `error` | Every report endpoint returns 500 |
| `slow` | Fixed 3,000 ms latency |

Fixture data is synthetic. Lender names are invented (`Lender X`, `Harbour Bank`), and no fixture value is copied from a real report.

### 9.1 Fixture format

Personas live in `fixtures/personas/{persona}.json`, one file for each value of the contract's `Persona` enum. Test users live in `fixtures/users.json`. The two are separate because any test user can be bound to any persona (`PUT /__test/users/{username}/persona`): Sam can hold `excellent` without becoming Alex.

| Comes from the test user | Comes from the persona |
| --- | --- |
| `User.id`, `User.displayName`, legal name, date of birth, email address | Bureaux and their reports, accounts, notifications, the rest of the profile, behaviour |

`User.defaultBureauId` is the bound persona's first bureau. The report's personal-details `name` is the user's legal name.

**Source data, not responses.** A fixture stores what the service starts from. Values the API derives are never stored: type totals (BR-04, BR-05), the overview aggregate, total debt and its trend (BR-07), year statuses (BR-12) and `nextUpdateInDays` (BR-08). Stored per account: the contract `Account`, plus `missedMonths` (the BR-12 source), `balanceHistory` (six `BalancePoint`s, oldest first; also the BR-07 trend source) and an optional `sourceMask` (the BR-09 input). Each bureau stores `nextRefreshDate` (the BR-08 input).

**Clock.** `asAt` is the persona's reference time; every date in the file is written relative to it. All seven personas use `2026-10-03T09:00:00Z`. Moving the clock with `PUT /__test/clock` changes derived values, not stored data.

**Behaviour.** `latencyMs` (the `slow` persona: 3000) and `failReportEndpoints` (the `error` persona: true; every report endpoint returns 500, as the persona table says).

**Schema and check.** `fixtures/persona.schema.json` (JSON Schema 2020-12) defines the format and references the contract's component schemas directly, so a contract change that breaks a fixture fails the check. `fixtures/schema-check.mjs` validates every file and then cross-checks the rules a schema cannot express. It also validates the override samples in `fixtures/overrides/` (one per arrangement the step glossary marks as a gap) against the contract's `PersonaOverrides`, applies each to its base persona, and runs the same checks on the result, except the two conventions section 6.5 exempts:

| Check | Rule |
| --- | --- |
| One file per `Persona` value; file name equals `persona` | Section 9 |
| Account IDs unique across all personas; IDs unique within each list | BR-15, section 4 |
| Score history has 12 consecutive months, oldest first, ending in the `asAt` month | BR-02 |
| Stored `utilisation` and `utilisationRaw` match balance and limit | BR-03, BR-06 |
| Loans without a limit are not included in totals | BR-05 |
| `maskedNumber` equals the mask of `sourceMask`, where present | BR-09 |
| Changes are newest first (personas only) | BR-11 |
| `missedMonths` fall inside the seven-year window and after the opened date | BR-12 |
| Closed accounts have balance 0, a close date and status `closed`; personas only: inside the six-year window | BR-13 |
| `nextRefreshDate` is not before `asAt` | BR-08 |
| Every user composed with every persona gives a valid `User`, `Profile` and `PersonalDetails` | Section 9.1 |
| Emails use `example.com`; mobile digits sit inside `07700 900000` to `07700 900999` | DR-010 |

## 10. API-layer bug flags

These are off by default. When on, they make the API break its own contract on purpose, so a contract test or API scenario should catch each one.

| Flag | Effect | Expected catch |
| --- | --- | --- |
| `excluded-in-total` | BR-05 ignored; excluded loans added to totals | `@BR-05` scenario |
| `rounding-down` | BR-03 truncates instead of rounding half up | `@BR-03` outline |
| `history-carry-forward` | BR-02 fills gaps with the previous score | `@BR-02` scenario |
| `idor` | BR-15 off; other users' accounts readable | Security scenario |
| `problem-json-missing` | Errors returned as plain text | Response validator |
| `mask-format` | BR-09 off; raw source mask returned | Schema pattern check |
| `currency-float` | Money sent as a float of pounds | Schema type check |

UI-only flags (labels, ARIA, rendering) are listed in the UI spec.

## 11. Verification checks

| Check | Tool (proposed) | Runs at |
| --- | --- | --- |
| Contract lint | Redocly CLI (2.57.0 on 2026-10-04), house ruleset `redocly.yaml`: `recommended` plus the overrides recorded in that file. Clean on 2026-10-04 | Every commit (Phase 1 onwards) |
| Example validity | Each example validated against its own schema; enforced by the ruleset's `no-invalid-media-type-examples` and `no-invalid-schema-examples` at error level | Every commit |
| Mock parity | Phase 1: `npm run check:mock` starts Prism with `--errors`, calls every operation with values from the contract, and requires its documented 2xx, no contract violation and a response body that validates; a call without a token must get 401. Phase 4: the UI smoke run against the mock. Known limits of the mock, checked against the real service in Phase 3 instead: a malformed request gets 422 where this specification says 400, and a missing test-control key gets 401 where the contract says 404 | Phase 1 (every commit) and Phase 4 |
| Client | `npm --prefix packages/api-client run check`: the committed generated types match a fresh generation, and a strict type check passes, including negative tests that must fail to compile; then a client smoke run of typed calls against the mock | Phase 1 (every commit) |
| Response validation | Every API scenario response checked against the contract | Phase 3 onwards |
| Property-based | Schemathesis against the running service | Nightly |
| Business rules | `@api` Gherkin scenarios tagged with `BR-` IDs | Phase 3 onwards |
| Security | `@security` scenarios: BR-15, auth expiry, test control off by default | Phase 3 onwards |

## 12. Open questions

None open.

**Resolved in v8** (decision brief 5, 5 October 2026): the overview stays one aggregate call (DR-034); no general rate limit (DR-035); `GET /me` returns `greetingName` (DR-036).

**Resolved in v4** (decision brief 1, 4 October 2026): the BR-13 boundary (DR-012), BR-03 above the limit (DR-013), the BR-07 boundary (DR-011) and BR-12 mixed years (DR-014).

**Resolved in v5** (decision brief 2, 4 October 2026): DR-005, credit display (DR-018); the scope of the proposed profile operations (DR-022).
