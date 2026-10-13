---
version: 19
created: 2026-10-13T22:18Z
supersedes: v10 (2026-10-07T12:50Z); earlier versions are in git history (DR-040)
project: credit-dashboard-sut
type: ui-spec
language: en-GB
---

# Credit Dashboard SUT: UI Specification

**Status:** Phase 0 draft, for review
**Data source:** the API contract only ([`DOCS/.architecture/openapi.yaml`](../.architecture/openapi.yaml)), through a generated typed client
**Companion:** [API specification](api-specification.md) · [UI feature spec: My Profile](ui-feature-profile.md) · [Page survey](page-survey.md)
**Changes in v19:** CDS-36 (U6): section 9 names the accessibility and layout checks: `npm run check:ui-exit` scans every page and every state that shows something new (an open dialog, an error) with axe-core (WCAG 2.0 to 2.2, levels A and AA), and checks the three layouts with normal and wider text.
**Changes in v18:** CDS-35 (U5): the header account button `btn-account` is a link to `/my-account/profile` and follows the preferred name (the session reads the customer again after a save, PR-03). The profile pages are specified in the My Profile feature spec (v9).
**Changes in v17:** CDS-34 (U4): what the account pages built settles. Section 6.4: the summary figures have hooks (`list-total-balance`, `list-total-limit`, `list-utilisation`) and show whole pounds like the overview card, so the two compare as text (BR-04); a row's parts are `row-balance-{id}`, `row-util-{id}` and `row-over-{id}`; `list-changes` and the utilities and telecoms sub-groups are not built (section 6.4 says why). Section 6.5: the tiles are links that carry the page to return to. Section 6.6: the five fields, their presets, the client check, and the fallback of the open-redirect guard.
**Changes in v16:** CDS-33 (U3): what the five report pages built settles. Section 6.3: the year status is a text alternative beside each year button (`ph-year-status-{yyyy}`); the intro reads 'six years of history, plus the current year'. Section 6.7: report changes show 20 a page with the kind and the page in the address (`?bureauId=&sentiment=&page=`); a visitor without a session who opens an address signs in and is brought back to it; `change-card-{id}` carries `data-sentiment`; a search row carries `data-kind`; the debt overview shows summary figures without pence; the header navigation has Report, Debt and Updates.
**Changes in v15:** CDS-32 (U2): section 6.2 states what the overview built settles: the changes toggle follows the pages of `GET /changes` 100 at a time until it has every change (DR-047; the CDS-18 Note on the toggle's page size); the history chart defaults to 6 months and shows one row per month, a gap included, in its table alternative; `impact-link` and `link-impact` go to the sections on the page; `tile-corrections` leads to the personal details page; the pages later slices build show a 'not built yet' page to a signed-in customer.
**Changes in v14:** CDS-31 (U1): section 6.1 gives the sign-in error copy; the header of 6.2 is built in stages (U1 has the logo, the report link and the account button; the notifications button follows with the pages that need it).
**Changes in v13:** Phase 4 choices (decision brief 11, DR-062): principle 2 is service first (the Prism mock has no personas); section 3 gains the hosting row; section 9 runs the `@ui` scenarios against the live service.
**Changes in v12:** CDS-24 (CDS-18 review Notes): the detail tile hook is `detail-tile-{field}` with the field in kebab case (section 6.5); section 6.6 gives the BR-14 error copy.
**Changes in v11:** the report changes route drops `tags=` (decision brief 9 D6; contract v13).
**Changes in v10:** section 6.7 names the searches list and personal-details hooks (CDS-18 confirmation pass).
**Changes in v9:** CDS-18 review fixes. The overview's changes toggle fetches every change with one further call (section 6.2, DR-047); the debt breakdown reads `byType` (section 6.7, DR-046); the report-changes route carries `sentiment`; the edit-form catalogue row also names the open-redirect security scenarios; section 6.9 cites PR-01 to PR-11.
**Changes in v8:** the framework versions are resolved (CDS-16, DR-044): section 3 'Framework' row.
**Changes in v7:** the 'Data' row names the generated client package and its pinned tools (CDS-15, DR-043).
**Changes in v6:** decision brief 5 (owner review, CDS-01): the header greets the customer by `greetingName` from `GET /me` (DR-036); the debug panel is in local and test builds only (DR-037). Accepted as the Phase 0 baseline (DR-038).
**Changes in v5:** the email and mobile profile sub-pages join the page catalogue (Release 3, CDS-11); companion links point at API spec v7 and profile spec v4.
**Changes in v4:** decision brief 2 applied: accounts in credit read 'in credit' (DR-018); new bug flag `negative-balance` (DR-019); React + Vite accepted (DR-003); Release 3 profile sub-pages are email and mobile (DR-022).
**Changes in v3:** decision brief 1 applied: page catalogue column *Phase* renamed *Release* (DR-015); report-change hooks `change-card-{id}`, `ChangeCard`, `list-changes` (DR-016); over-limit utilisation state (DR-013); wording conformed to `DOCS/glossary.md` v2 (bug flags, verification checks).
**Changes in v2:** My Profile added to the page catalogue (section 5) and to the page specifications by reference (section 6.9); profile bug flags referenced from section 8 (backlog CDS-11). No other change.

---

## 1. Purpose and scope

The UI is a single-page app for the fictional *ScoreHarbour* credit dashboard. It exists to be tested, so testability is a functional requirement, not an afterthought: every element a test needs has a stable hook, an accessible name and a defined set of states.

The page survey records what the source pages contain. This document turns that survey into buildable pages and components, each traced to the endpoint that feeds it and the scenarios that cover it.

Out of scope: real branding, real lenders, open-banking flows, offers and marketplace pages, native mobile apps.

## 2. Specification-driven principles

1. **Contract-bound.** The UI calls nothing that is not in `openapi.yaml`. The client is generated from it, so a contract change breaks the build, not the user.
2. **Service first.** Pages are built against the live service with test control on, because the `@ui` scenarios arrange personas and the clock through it and the Prism mock has neither (decision brief 11 D1, DR-062). The mock serves component-test fixtures and the typed-client smoke only. A page is not done until its `@ui` scenarios pass against the service.
3. **States are specified, not discovered.** Every data-bound component lists its loading, empty, error and populated states below. Each state has a persona or mock example that produces it.
4. **Hooks are part of the spec.** `data-testid` values in this document are the contract between UI and harness. Renaming one is a spec change.
5. **Traceability.** Each page section names its endpoint and its feature file, so a reviewer can walk from requirement to test without reading code.

## 3. Architecture

| Concern | Decision | Status |
| --- | --- | --- |
| Framework | React with Vite and TypeScript: `react` and `react-dom` 19.3.0, `vite` 8.3.3, `@vitejs/plugin-react` 6.1.2, TypeScript 5.9.3 (aligned with `packages/api-client`), exact pins in the UI's `package.json` when it is scaffolded, taking the latest patch on that day (DR-044) | Accepted (DR-003, DR-044) |
| Routing | Client-side router; deep links work on refresh | Proposed |
| Hosting | The built UI is served by the service from the same origin (static files at `/`, the API under `/api/v1`); development uses the Vite dev server with a proxy to port 4000; no CORS (brief 11 D2) | Accepted |
| Data | Generated client `packages/api-client` (`openapi-typescript` 7.13.0 types, `openapi-fetch` 0.17.0, DR-043), base URL per environment (DR-039); query cache with retry off in test mode | Accepted (client); Proposed (cache) |
| Styling | Design tokens in CSS custom properties; light and dark themes | Proposed |
| Charts | Hand-built SVG components, so the accessibility tree is under our control | Proposed |
| Bug flags | Read from `GET /__test/state` at start, or from `?bugs=` locally | Proposed |

## 4. Global conventions

### 4.1 Test hooks

Pattern: `{area}-{element}[-{qualifier}]`, kebab-case, lowercase. Qualifiers are stable domain values (account type, year, account ID), never array indexes.

Role-based locators must also work. Every interactive element has a role and an accessible name that matches its visible label. Tests can use either strategy, and the portfolio can show both.

### 4.2 Formatting (locale en-GB)

| Value | Source | Display |
| --- | --- | --- |
| Money | `amountMinor` integer | `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`, no pence on summary figures (`£53,024`), pence on detail figures (`£4,236.00`) |
| Negative money | Negative `amountMinor` | The amount without a sign, then 'in credit': `£44 in credit` on summary figures, `£44.00 in credit` on detail figures. Applies to any negative figure, including a type total. Utilisation shows `0%` (DR-018) |
| Percentages | Integer | `54%` |
| Utilisation above 100 | Integer over 100 | `115%` plus an 'Over limit' label (DR-013); see `UtilisationBar` |
| Dates | ISO date | `12 August 2026` |
| Months on charts | `YYYY-MM` | `Mar`, with year on the first point and on January (`Sept '25`) |
| Counts | Integer | Correct plural: `1 topic`, `2 topics`, `Updates in 1 day` |

### 4.3 Component states

Every data-bound component implements four states. The hook for the state wrapper is `{component-testid}-{state}`.

| State | Trigger | Requirement |
| --- | --- | --- |
| Loading | Request in flight | Skeleton with `aria-busy="true"`; no layout shift when data arrives |
| Empty | Valid response with no items | Specific message, never a blank area |
| Error | Non-2xx or network failure | Inline message with a Retry button `{testid}-retry`; other sections keep working |
| Populated | Data present | As specified per page |

### 4.4 Layout and themes

Breakpoints: 375px (mobile), 768px (tablet), 1280px (desktop). Below 768px the primary nav becomes a bottom tab bar. Only one nav is rendered at a time unless the `duplicate-nav` bug flag is on.

A demo banner, `demo-banner`, sits above the header on every page: 'Demo application: all data is fictional'. It cannot be dismissed.

### 4.5 Accessibility baseline

WCAG 2.2 AA. With all bug flags off, an axe-core scan of every page returns zero violations. Charts expose a data table alternative (`{chart-testid}-table`, visually hidden). Progress bars set `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and a meaningful name.

## 5. Page catalogue

| Page | Route | Release | Main endpoints | Feature file |
| --- | --- | --- | --- | --- |
| Login | `/login` | 1 | `POST /auth/login` | `ui/login.feature` |
| Report overview | `/credit-health/report/:bureauId` | 1 | `GET /reports/{id}/overview`, `/score/history`; `/changes` when the changes toggle is pressed (DR-047) | `ui/report-overview.feature` |
| Payment history | `/credit-health/report/:bureauId/payment-history` | 2 | `GET /reports/{id}/payment-history` | `ui/payment-history.feature` |
| Account-type list | `/credit-health/report/:bureauId/accounts/:type` | 2 | `GET /reports/{id}/accounts`, `/accounts/totals` | `ui/account-drilldown.feature` |
| Account detail | `/credit-health/report/:bureauId/account/:accountId` | 2 | `GET /accounts/{id}`, `/balance-history`, `/payment-history` | `ui/account-drilldown.feature` |
| Detail edit form | `/data-capture/:field?accountId=&redirectUrl=` | 2 | `PATCH /accounts/{id}/details` | `ui/account-details-form.feature`, `security/open-redirect.feature` |
| Closed accounts | `/credit-health/report/:bureauId/closed-accounts` | 2 | `GET /reports/{id}/accounts?status=closed` | `ui/account-drilldown.feature` |
| Report changes | `/insights/updates?bureauId=&sentiment=` | 2 | `GET /reports/{id}/changes` | `ui/report-changes.feature` |
| Searches | `/credit-health/report/:bureauId/searches/:kind` | 3 | `GET /reports/{id}/searches` | `ui/searches.feature` |
| Personal details | `/credit-health/report/:bureauId/personal-details` | 3 | `GET /reports/{id}/personal-details` | `ui/personal-details.feature` |
| Debt overview | `/credit-health/debt-overview` | 3 | `GET /debt/overview` | `ui/debt.feature` |
| My profile | `/my-account/profile` | 3 | `GET /me/profile`, `PATCH /me/profile/preferred-name` | `ui/profile.feature` |
| Email | `/my-account/profile/email` | 3 | `PUT /me/profile/email`, `POST /me/profile/email/verification` | `ui/profile.feature` |
| Mobile | `/my-account/profile/mobile` | 3 | `PUT /me/profile/mobile`, `POST /me/profile/mobile/verification` | `ui/profile.feature` |
| Debug panel | `/__debug` | 2 | `/__test/*` | none (tooling) |

## 6. Page specifications

### 6.1 Login (Release 1)

| Element | Role | data-testid | Behaviour |
| --- | --- | --- | --- |
| Username | textbox | `login-username` | Required |
| Password | textbox (password) | `login-password` | Required; demo values listed on the page |
| Sign in | button | `login-submit` | Disabled while submitting |
| Error | alert | `login-error` | Shown on 401; focus moves to it |

On success the app stores the token in memory (not localStorage, not sessionStorage) and routes to the user's default bureau. On 401 the error reads "The sign-in details were not recognised." Demo values: username `alex` or `sam`, password `demo-only`.

### 6.2 Report overview (Release 1)

One `GET /reports/{bureauId}/overview` call feeds every section except the history chart, and except the full changes list behind the changes toggle (DR-047). Sections render in the order below. If the overview call fails, every section shows its error state with one shared Retry.

| Section | Key elements (data-testid) | Data | States worth testing |
| --- | --- | --- | --- |
| Score hero | `score-value`, `score-max`, `score-gauge` | `score` | Score 0, 1000 (`boundary`) |
| Comparison | `bureau-name`, `next-update`, `bench-national`, `bench-local` | `bureau`, `score` | `Updates in 0 days`, `1 day` (clock control) |
| Summary | `summary-text`, `btn-chat`, `link-impact`, `btn-like`, `btn-dislike`, `ai-disclaimer` | `summary` | Feedback persists after reload (BR-10) |
| History chart | `history-chart`, `range-3m`, `range-6m`, `range-1y` | `GET /score/history` | Null months render as gaps (BR-02); own loading state |
| Report changes | `changes-heading`, `change-card-{id}`, `changes-toggle`, `changes-see-all` | `recentChanges`, `changesTotal`; the toggle calls `GET /reports/{bureauId}/changes` and lists every change in place, then collapses back to the 3 newest | Toggle hidden when total ≤ 3; the toggle's own loading and error states |
| Impact | `impact-action-needed`, `impact-monitor`, `impact-doing-well`, `impact-link` | `impact` | Pluralisation |
| Debt | `debt-total`, `debt-trend`, `debt-link` | `debt` | Each trend value |
| Accounts | `account-card-{type}`, `account-balance-{type}`, `account-util-text-{type}`, `account-util-bar-{type}`, `link-closed-accounts` | `accountTypes` | Type with no accounts is hidden; donut absent when limit null |
| Payments | `payments-new-missed`, `payments-on-report`, `link-payment-history` | `payments` | Zero and non-zero |
| Searches and details | `tile-hard-searches`, `tile-soft-searches`, `tile-personal-details`, `tile-corrections` | none (navigation) | Static |

**Built in CDS-32:** the changes toggle fetches 100 changes a page and follows the pages until it has `changesTotal`; it shows its own loading (`changes-toggle-loading`) and error state (`changes-toggle-error`, `changes-toggle-retry`); the history chart defaults to 6 months, its table alternative `history-chart-table` has one row `history-chart-row-{month}` per month with 'No score' for a gap, and a point `history-point-{month}` exists only for a month with a score; `link-impact` and `impact-link` are in-page links (`#impact`, `#changes`); the chat drawer is a dialog (`chat-drawer`, `chat-input`, `chat-send`, `chat-reply`, `chat-disclaimer`, `chat-close`) that traps focus, closes on Escape and returns focus to `btn-chat`.

Header (all pages): `nav-logo`, `nav-primary-{item}`, `btn-account` (labelled with `greetingName` from `GET /me`, PR-03, DR-036), `btn-notifications` with badge `notifications-unread`, `nav-mobile-{item}`.

### 6.3 Payment history (Release 2)

| Element | Role | data-testid | Behaviour |
| --- | --- | --- | --- |
| Intro | text | `ph-intro` | Static copy: six years on file |
| Year buttons | button, `aria-pressed` | `ph-year-{yyyy}` | Seven buttons; current year selected on load; one selected at a time |
| Year status | img with text alternative | `ph-year-status-{yyyy}` | On time / missed / no data (BR-12) |
| Legend | list | `ph-legend` | Three items |
| Result | region, `aria-live="polite"` | `ph-result` | Empty message, or rows `ph-missed-{accountId}-{yyyy-mm}` |

The widget is one component (`PaymentHistoryWidget`) reused on account detail with an `accountId` prop.

### 6.4 Account-type list (Release 2)

| Element | Role | data-testid | Behaviour |
| --- | --- | --- | --- |
| Title and notice | heading, text | `list-title`, `list-notice` | Title from type |
| Summary card | region | `list-summary` | Metrics vary by type (table below) |
| Donut | progressbar | `list-donut` | Total utilisation; absent when limit null |
| Account row | link | `account-row-{accountId}` | Logo or text fallback, provider, balance, mask, utilisation |
| Excluded group | region | `list-excluded` | Shown only when `excluded` is non-empty; explains exclusion (BR-05) |
| Sub-group headings | heading | `list-group-{name}` | Utilities and telecoms only |
| Report changes | region | `list-changes` | Report-change cards `change-card-{id}` with impact badge |

| Type | Summary metrics | Donut | Row utilisation |
| --- | --- | --- | --- |
| Credit cards | Total balance, total limit | Yes | Yes |
| Loans | Total remaining, total borrowed | Yes | Yes |
| Mortgages | Total remaining | No | No |
| Current accounts | Total overdraft limit | Yes | No |
| Utilities and telecoms | None (grouped list) | No | No |
| Credit accounts | Total balance, total limit | Yes | Yes |

**Built in U4 (CDS-34).**
- The summary figures have hooks `list-total-balance`, `list-total-limit` and `list-utilisation`, and show whole pounds like the overview card (4.2), so the list total and the overview card compare as text (BR-04). The bar `list-donut` is a progress bar, shown when the type has a limit and the API reports a utilisation.
- A row is a link `account-row-{accountId}` with parts `row-balance-{id}` (with pence; a negative balance reads 'in credit', DR-018), `row-util-{id}` (the percentage alone, for card, loan and credit account) and `row-over-{id}` ('Over limit' above 100%, DR-013). The part hooks do not start with `account-row-`, so a count of `account-row-*` counts accounts. A loan that does not count in the totals (BR-05) is not a row: it is listed in `list-excluded` as `excluded-row-{id}`, with the reason.
- Not built: `list-changes`, because the changes endpoint takes no account-type filter, and the sub-group headings `list-group-{name}`, because no field tells a utility from a telecoms account. Both need a contract change and are left to the owner (backlog CDS-34).

### 6.5 Account detail (Release 2)

| Element | Role | data-testid | Shown for |
| --- | --- | --- | --- |
| Header | region | `detail-header` | All |
| Promo (mock link-your-account) | region | `detail-promo` | Credit cards, current accounts |
| Balance card | region | `detail-balance`, `detail-balance-bar`, `detail-updated` | All |
| Details tiles | link (not button) | `detail-tile-{field}`, the field in kebab case: `detail-tile-apr`, `detail-tile-interest-rate`, `detail-tile-promo-period-months`, `detail-tile-min-payment`, `detail-tile-payment-method` | Credit cards, credit accounts |
| Balances chart | img + table alternative | `detail-balance-chart` | Credit cards, credit accounts, loans |
| Payment history | region | `detail-payment-history` | All open accounts |
| Metadata | description list | `detail-meta-frequency`, `detail-meta-status`, `detail-meta-opened` | All |
| Help | region | `detail-help` | All |

Sections not shown for a type are not rendered at all, rather than rendered empty.

**Built in U4 (CDS-34).** The tiles are links to `/data-capture/{field}?accountId=&redirectUrl=`, with the page they are on as the return address, and a tile with no value reads 'Not recorded'. The promo shows for an open card or current account; a closed account has no payment history. The chart is a bar chart with the visually hidden table `detail-balance-chart-table`.

### 6.6 Detail edit form (Release 2)

| Element | Role | data-testid | Behaviour |
| --- | --- | --- | --- |
| Prompt and hint | heading, text | `dc-prompt`, `dc-hint` | Copy per field |
| Preset options | radio group | `dc-option-{value}` | Single choice; current value pre-selected |
| Other | radio | `dc-option-other` | Reveals `dc-input` (numeric, 2 dp) |
| Field error | text, linked via `aria-describedby` | `dc-error` | Client check mirrors BR-14; server 422 shown verbatim. Copy for a rate: "The rate must be between 0% and 100%, with up to two decimal places." |
| Help | button, `aria-expanded` | `dc-help-where`, `dc-help-why` | Disclosure |
| Save | button | `dc-save` | Disabled until a change; on 200 returns to `redirectUrl` |
| Cancel | button | `dc-cancel` | Returns without saving |

`redirectUrl` must be a same-origin path starting with `/`. Anything else falls back to the account detail page (open-redirect guard).

**Built in U4 (CDS-34).** Five fields: `apr` and `interestRate` (presets 9.9, 19.9, 24.9 and 34.9), `promoPeriodMonths` (0, 6, 12 and 24), `minPayment` (a percentage: 1, 2, 3 and 5) and `paymentMethod` (direct debit or manual, with no Other). The current value is pre-selected: a preset if it is one, otherwise Other holding the value. The client check mirrors BR-14 (a rate or percentage from 0 to 100 with up to two decimals; whole months from 0 to 60), and a refused value is never sent. The service's own message (a 422 `detail`) is shown as it comes. The open-redirect guard follows a return address only if it is a path that starts with a single `/` (not `//`, not `/\`) and stays on this site once resolved; otherwise the form returns to the account page, built from the signed-in customer's default bureau.

### 6.7 Closed accounts, report changes, searches, personal details, debt (Releases 2 to 3)

These pages reuse the list patterns above. Closed accounts (`closed-title`) groups rows under `closed-group-{type}` with no summary. Report changes adds filter chips `changes-filter-{sentiment}` and pagination `pager-prev`, `pager-next`, `pager-status`; filters are reflected in the URL. Searches lists `search-row-{id}` inside `search-list` (empty state `search-list-empty`). Personal details is read-only in v1: the name `pd-name` (the user's legal name), the current address `pd-address-current`, previous addresses `pd-address-previous-{n}` (newest first, from 1), and the electoral roll status `pd-electoral-roll`. Debt overview shows `debt-total`, `debt-trend` and a per-type breakdown `debt-type-{type}`, one row per `byType` entry of `GET /debt/overview` (BR-07, DR-046).

### 6.8 Debug panel (tooling)

Visible only when test control is enabled, so never in the public demo build (DR-037). Lists every bug flag as a checkbox `debug-flag-{flag}`, a persona selector `debug-persona`, a clock input `debug-clock` and `debug-reset`. It calls the `/__test/*` endpoints; it never changes UI state directly.

### 6.9 My profile (Release 3)

Specified in full in the [My Profile UI feature spec](ui-feature-profile.md): layout, element inventory with `data-testid` values, rules PR-01 to PR-11 and seed scenarios. Reached from the header account button `btn-account`. It is a different page from the report's read-only personal details in section 6.7.

Release 3 adds the email and mobile sub-pages (DR-022), specified in that spec's section 4 and now in the page catalogue; their rules PR-09 to PR-11 are enforced by the API and shown as field errors. Address, employment and finances are stretch.

## 7. Component catalogue

| Component | Props (key) | Used on | Notes |
| --- | --- | --- | --- |
| `DemoBanner` | none | All | Always on |
| `ScoreGauge` | `score`, `max` | Overview | SVG arc; `role="img"` with name 'Score 720 out of 1000' |
| `BenchmarkBar` | `label`, `value`, `max` | Overview | progressbar |
| `LineChart` | `points[]`, `range` | Overview | Gaps for null; table alternative |
| `BarChart` | `points[]`, `referenceLine` | Account detail | Limit line; table alternative |
| `SegmentedControl` | `options[]`, `value` | Overview | radiogroup, arrow-key navigation |
| `UtilisationBar` | `percent`, `label` | Overview, lists, detail | Colour bands: below 30%, 30 to 75%, above 75%. Above 100: bar full, `aria-valuenow` the real value, `aria-valuemax` raised to match, text `115%` and badge `{testid}-over-limit` reading 'Over limit' (DR-013) |
| `UtilisationDonut` | `percent` | Lists | progressbar; over limit as `UtilisationBar` |
| `AccountRow` | `account` | Lists, closed | Logo fallback to initials |
| `ChangeCard` | `change` | Overview, lists, changes | Impact badge; hook `change-card-{id}` on every page (DR-016) |
| `PaymentHistoryWidget` | `bureauId`, `accountId?` | Payment history, detail | Shared |
| `Tile` | `label`, `href`, `value?` | Overview, detail | Link semantics |
| `ChatDrawer` | `open` | Overview | Dialog, focus trap, Escape closes |
| `SectionState` | `state`, `onRetry` | All data sections | Implements section 4.3 |

## 8. UI-layer bug flags

Off by default. Each one recreates a defect seen in the source pages or a common front-end failure.

| Flag | Effect | Expected catch |
| --- | --- | --- |
| `duplicate-nav` | Desktop and mobile navs both rendered | Strict locator / visibility check |
| `util-mismatch` | Bar width differs from percentage text | Assertion comparing `aria-valuenow` with text |
| `currency-format` | Money shown unformatted (`53024`) | Format assertion |
| `minor-units-label` | Progress bar named '423600% of 510000' | ARIA name assertion |
| `placeholder-aria` | All row bars named 'Accessible label' | axe-core / role locator |
| `chart-no-values` | Chart points announced without values | Accessibility tree check |
| `range-stale` | Chart ignores range changes | Interaction scenario |
| `toggle-label` | 'See less' never flips back | State scenario |
| `like-both` | Like and Dislike both pressed | Behaviour scenario |
| `plural` | '1 topics', 'Updates in 1 days' | Copy assertion |
| `button-href` | Tiles rendered as buttons with `href` | Semantics lint |
| `double-render` | List rendered twice during route change | Strict-mode locator failure |
| `ph-a11y` | Year buttons lose `aria-pressed`; icons lose text | axe-core |
| `open-redirect` | `redirectUrl` guard removed | Security scenario |
| `truncate-summary` | Summary cut mid-word with no way to expand | Content assertion |
| `negative-balance` | An account in credit is shown as an amount owed (`£44`, no 'in credit') (DR-019) | `@BR-06` UI scenario |

Profile-page flags (`nested-button`, `decorative-alt`, `preferred-on-report`, `preferred-no-trim`, `email-stays-verified`, `pii-in-title`, `lost-edit`) are listed in the My Profile UI feature spec, section 7.

## 9. Verification checks

| Check | Tool (proposed) | Runs at |
| --- | --- | --- |
| Type check against generated client | `tsc --noEmit` | Every commit |
| Component tests | Vitest + Testing Library, states from section 4.3 | Phase 4 onwards |
| `@ui` scenarios against the live service | Serenity/JS + Playwright + Cucumber, the service with test control serving the built UI (brief 11 D1, D2) | Phase 4, each slice; exit |
| Component fixtures | Vitest with responses taken from the contract examples; Prism stays for the typed-client smoke | Phase 4 onwards |
| Accessibility | axe-core on every page, flags off: zero violations (`@axe-core/playwright`, `npm run check:ui-exit`; also in the `ui` CI job) | Phase 4 exit |
| Layouts | 375, 768 and 1280 px: one navigation at a time (the bottom tab bar below 768 px), no sideways scroll, the demo banner shown, and axe-core at each width, with normal and wider text (`npm run check:ui-exit`) | Phase 4 exit |
| Visual regression | Snapshots at 375px and 1280px, light and dark | Phase 5 |
| Bug-flag proof | Each flag on: at least one scenario fails for the stated reason | Phase 5 |

## 10. Open questions

None open. Resolved in v6 (decision brief 5): the debug panel is in local and test builds only (DR-037).
