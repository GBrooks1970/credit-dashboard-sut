---
version: 36
created: 2026-10-14T09:43Z
supersedes: v10 (2026-10-07T12:50Z); earlier versions are in git history (DR-040)
project: credit-dashboard-sut
type: ui-spec
language: en-GB
---

# Credit Dashboard SUT: UI Specification

**Status:** Normative since Phase 0 was accepted on 5 October 2026 (DR-038); changes are recorded in the lines below
**Data source:** the API contract only ([`DOCS/.architecture/openapi.yaml`](../.architecture/openapi.yaml)), through a generated typed client
**Companion:** [API specification](api-specification.md) · [UI feature spec: My Profile](ui-feature-profile.md) · [Page survey](page-survey.md)
**Changes in v36:** CDS-43 (P5b): the visual check is enabled in CI (workflow `visual.yml`, runner pinned to `ubuntu-24.04`, because the baselines are images that depend on the runner's fonts) against the 32 Linux baselines. A second kind of catcher, the visual check, is listed in section 9: `util-mismatch` and `currency-format` are each also caught by one image. The flag proof runs these on Linux CI only.
**Changes in v35:** CDS-43 (P5a): the visual regression check is specified (section 9): eight pages, two widths, two themes, 32 images compared with Linux CI baselines with no pixel difference allowed beyond a colour distance of 0.2. The check is built; the first baselines and the job that runs it follow in P5b.
**Changes in v34:** CDS-42 (P4c): two behaviours the flag table already assumed are now specified and built, so that a flag can remove them. A summary longer than 280 characters is shown cut at the last whole word before the limit, followed by an ellipsis, with a button `summary-toggle` ("Read more" and "Read less") that shows the whole text and folds it again; a shorter summary has no button (section 6.2). `toggle-label`, `truncate-summary` and `lost-edit` are built in the test build only, each caught for the stated reason by a component test in `src/flags.test.tsx`; that is 30 of 30 implemented flags caught.
**Changes in v33:** CDS-42 (P4b): `range-stale`, `like-both`, `open-redirect`, `negative-balance`, `preferred-on-report` and `pii-in-title` are built in the test build only. The `@ui` scenarios the registry planned catch all six for the stated reason, so no scenario, step or component test changed. The public-build guard also looks for `open-redirect`, `preferred-on-report` and `pii-in-title`. 27 of 27 implemented flags caught; 3 pending (`toggle-label`, `truncate-summary`, `lost-edit`). The profile pages show the service's specific `errors[0]` message when it sends one (capitalised, with a full stop), else its `detail` (CDS-38 C-26).
**Changes in v32:** CDS-41 (P3c): `currency-format` (money shown as the count of pence), `double-render` (a list drawn twice) and `ph-a11y` (the year buttons lose `aria-pressed`, the status icons lose their text) are built in the test build only. The `@ui` scenarios the registry planned catch all three for the stated reason, so no scenario, step or component test changed; `ph-a11y` has a second catcher, axe `role-img-alt` on the payment-history target, for the icons. 19 of 19 implemented flags caught; 11 pending.
**Changes in v31:** CDS-41 (P3b): section 9 lists the seven semantic rules the exit run applies to every page and state, in the same pass as axe-core (`src/exit/semantic-rules.ts`). Six UI bug flags are built in the test build only, each caught by its own rule for the stated reason: `util-mismatch`, `minor-units-label`, `placeholder-aria`, `chart-no-values`, `button-href` and `decorative-alt` (16 of 16 implemented flags caught; 14 pending). The profile header image carries `data-decorative`. The rule `form-controls-follow-text-size` proves the CDS-38 fix R2-C-04, which no check read before: with `font: inherit` removed it reports the control at 13.33 px among text of 32 px.
**Changes in v30:** CDS-41 (P3a): section 9 says what an exit-check catcher is. `duplicate-nav` (both navigations rendered) and `nested-button` (the information button inside another button) are built in the test build only, and each is caught by an existing exit check, proved by `npm run check:bug-flags` (10 of 10 implemented flags; the other 20 of 30 are pending).
**Changes in v29:** CDS-38 (F11f, the confirmation pass): section 8's 'Expected catch' column is the registry's (`fixtures/bug-flags.json`) for every flag in the table, and `schema-check` fails if the two differ (R2-C-08); the catalogue in section 5 lists what is built (R2-C-12). The guard's marker list, the flags it cannot see and the exit run's own cover are in sections 3 and 9 (R2-C-06, R2-C-07, R2-C-15).
**Changes in v28:** CDS-38 (F11e, the confirmation pass): what the second review found the UI built differently from this specification, now as it says. Closing the chat drawer returns focus to `btn-chat` after the drawer has lifted its `inert` from the page (a browser refuses to focus an inert element), pinned by a `@ui` scenario (R2-C-01). Feedback and chat answers use latest-request-wins like every other fetching widget (R2-C-02). Form controls follow the text size, so 'wider text' doubles them too (R2-C-04). A month the formatter cannot read is shown as sent, and a page that throws shows a message with the menu still working (R2-C-05). The mobile page shows the number just saved in the code step (R2-C-11). The client's preferred-name pattern takes the straight apostrophe only, as PR-02 and the service do (R2-C-14). Below 768px the page leaves room for the bottom tab bar (R2-C-16). A failed greeting refresh after a saved preferred name is not reported as a failed save (R2-C-18).
**Changes in v27:** CDS-38 (F10): the exit checks (section 9) are as wide as section 9 says. `npm run check:ui-exit` scans every page and every state that shows something new (an open dialog, a section error with its Retry, an empty list, a form error or a saved message, the debug page, the pages not built yet) with axe-core in the light and in the dark theme (60 targets and the two sign-in states, 124 scans), and checks every page that is not a state of another page in the three layouts with this machine's text and with the root text doubled (282 checks). "Wider text" means `html { font-size: 200% }`, so `rem` sizes follow (WCAG 1.4.4). The public build is checked after `vite build`: `npm run check` in the UI package fails if `dist/` holds any of `cds.testControlKey`, `__test`, `x-test-control-key`, `debug-flag` or `Debug panel`. The harness builds its test build into `dist-test/`, never `dist/`. The catch stated for `ph-a11y` is narrowed to what axe can see: axe has no rule for a missing `aria-pressed`, so the year buttons' `aria-pressed` is caught by the component tests, and axe catches the icons that lose their text. The widened checks found, and this change fixed, a dark-theme error colour that failed contrast (`#dc-error`), account cards that did not shrink to a phone with doubled text, and two hidden chart tables that widened the page.
**Changes in v26:** CDS-38 (F9): what the review found the UI built differently from this specification, now built as written, with the few places where the specification follows the build. One `UtilisationBar` serves the overview, the lists and the account page: `aria-valuenow` is the real value, `aria-valuemax` is raised above 100, the fill stops at full, the colour band is on the fill and in `data-band` (below 30 `low`, 30 to 75 `mid`, above 75 `high`), and the badge `{testid}-over-limit` reads `Over limit`; the text beside the bar carries the figure only (C-02, C-05). An account row shows the provider's initials as its logo fallback (`row-initials-{id}`, decorative); real logos are not loaded, because the data's `logoUrl` is a placeholder (C-21). The searches list is `search-list` (C-06). The account detail header is a region named `Account summary` (C-28). While the chat drawer is open, everything outside it is `inert` (C-25). The history chart's table words its months (`June 2026`) as the balance chart's does (C-32).
**Changes in v25:** CDS-38 (F8): the open-redirect guard judges the address the URL parser resolves, not the text it was given: dot segments (`/..//host`), a backslash and a tab are resolved first, and the result must start with a single `/` followed by a character that is neither `/` nor `\`; the sign-in redirect-back uses the same guard (C-01, C-20). A response that arrives after a newer request, or after the page was left, is ignored in every fetching page and widget, so the page always shows the answer to the last thing the customer asked for (C-03). A report-changes page past the end of a list that has changes is a page, not an empty list: it says `There are no changes on this page.` (`changes-past-end`), offers `Go to the last page` (`changes-last-page`) and keeps the pager; "No changes match." is only for a list with nothing in it (C-22).
**Changes in v24:** CDS-38 (F5, B-04, B-19): two value hooks so a step can compare a figure exactly: `debt-type-{type}-amount` inside each debt row, and `detail-tile-{field}-value` inside each details tile. The row and tile text is unchanged.
**Changes in v23:** CDS-38 (F1): the debug panel is at `/debug` (it was written `/__debug`), is present only in a test build and only for a signed-in customer, and 6.8 lists its hooks (C-08). The score gauge is a `progressbar` named 'Credit score' with the score as its value and 0 to the maximum as its range, not an `img` (C-07).
**Changes in v22:** CDS-39 (P1): the flag mechanism is built. The control key reaches a test build through browser local storage (`cds.testControlKey`), which the harness seeds before the page loads (a browser context can seed local storage, not session storage); the app waits for the flags before it renders; the debug panel of 6.8 is the page `/debug` and exists only in a test build; `plural` is the first UI flag implemented.
**Changes in v21:** decision brief 13 (DR-064): the bug flags are read by a test build of the UI from `GET /__test/state` once at start, with the key the harness supplies (section 3); the expected catch of `toggle-label` and `truncate-summary` is a component test; the bug-flag proof in section 9 is "at least one committed check" and is run by `npm run check:bug-flags`.
**Changes in v20:** decision brief 12 D3 (DR-063): `list-changes` and the utilities and telecoms sub-group headings `list-group-{name}` are dropped from section 6.4. The list shows the summary, the rows and the excluded group; no scenario needed either, and each would have needed a contract change.
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
| Framework | React with Vite and TypeScript: `react` and `react-dom` 19.3.0, `vite` 8.3.4, `@vitejs/plugin-react` 6.1.2, TypeScript 5.9.3 (aligned with `packages/api-client`), exact pins in the UI's `package.json` when it is scaffolded, taking the latest patch on that day (DR-044) | Accepted (DR-003, DR-044) |
| Routing | Client-side router; deep links work on refresh | Proposed |
| Hosting | The built UI is served by the service from the same origin (static files at `/`, the API under `/api/v1`); development uses the Vite dev server with a proxy to port 4000; no CORS (brief 11 D2) | Accepted |
| Data | Generated client `packages/api-client` (`openapi-typescript` 7.13.0 types, `openapi-fetch` 0.17.0, DR-043), base URL per environment (DR-039); query cache with retry off in test mode | Accepted (client); Proposed (cache) |
| Styling | Design tokens in CSS custom properties; light and dark themes | Proposed |
| Charts | Hand-built SVG components, so the accessibility tree is under our control | Proposed |
| Bug flags | A test build reads `GET /__test/state` once at start with the control key the harness supplies (browser local storage, `cds.testControlKey`, set before the page loads); the public build contains none of this code (brief 13 D1, DR-064) | Accepted |

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
| Debug panel | `/debug` | 2 | `/__test/*` | none (tooling) |

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
| Summary | `summary-text`, `summary-toggle`, `btn-chat`, `link-impact`, `btn-like`, `btn-dislike`, `ai-disclaimer` | `summary` | Feedback persists after reload (BR-10). A summary over 280 characters is cut at the last whole word before the limit with an ellipsis; `summary-toggle` ("Read more", "Read less") shows the whole text and folds it again (CDS-42) |
| History chart | `history-chart`, `range-3m`, `range-6m`, `range-1y` | `GET /score/history` | Null months render as gaps (BR-02); own loading state |
| Report changes | `changes-heading`, `change-card-{id}`, `changes-toggle`, `changes-see-all` | `recentChanges`, `changesTotal`; the toggle calls `GET /reports/{bureauId}/changes` and lists every change in place, then collapses back to the 3 newest | Toggle hidden when total ≤ 3; the toggle's own loading and error states |
| Impact | `impact-action-needed`, `impact-monitor`, `impact-doing-well`, `impact-link` | `impact` | Pluralisation |
| Debt | `debt-total`, `debt-trend`, `debt-link` | `debt` | Each trend value |
| Accounts | `account-card-{type}`, `account-balance-{type}`, `account-util-text-{type}`, `account-util-bar-{type}`, `link-closed-accounts` | `accountTypes` | Type with no accounts is hidden; donut absent when limit null |
| Payments | `payments-new-missed`, `payments-on-report`, `link-payment-history` | `payments` | Zero and non-zero |
| Searches and details | `tile-hard-searches`, `tile-soft-searches`, `tile-personal-details`, `tile-corrections` | none (navigation) | Static |

**Built in CDS-32:** the changes toggle fetches 100 changes a page and follows the pages until it has `changesTotal`; it shows its own loading (`changes-toggle-loading`) and error state (`changes-toggle-error`, `changes-toggle-retry`); the history chart defaults to 6 months, its table alternative `history-chart-table` has one row `history-chart-row-{month}` per month with 'No score' for a gap, and a point `history-point-{month}` exists only for a month with a score; `link-impact` and `impact-link` are in-page links (`#impact`, `#changes`); the chat drawer is a dialog (`chat-drawer`, `chat-input`, `chat-send`, `chat-reply`, `chat-disclaimer`, `chat-close`) that traps focus, closes on Escape and returns focus to `btn-chat`.

Header (all pages): `nav-logo`, `nav-primary-{item}`, `btn-account` (labelled with `greetingName` from `GET /me`, PR-03, DR-036), `nav-mobile-{item}`. The notifications button (`btn-notifications`, badge `notifications-unread`) is specified and not built: the notifications operations are in the contract and no page uses them.

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
| Account row | link | `account-row-{accountId}` | Initials fallback `row-initials-{accountId}` (decorative; no logo is loaded), provider, balance, mask, utilisation |
| Excluded group | region | `list-excluded` | Shown only when `excluded` is non-empty; explains exclusion (BR-05) |

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
- Dropped (v20, brief 12 D3): `list-changes` (the changes endpoint takes no account-type filter) and the sub-group headings `list-group-{name}` (no field tells a utility from a telecoms account). Each would have needed a contract change.

### 6.5 Account detail (Release 2)

| Element | Role | data-testid | Shown for |
| --- | --- | --- | --- |
| Header | region, named 'Account summary' | `detail-header` | All |
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

**Built in U4 (CDS-34).** Five fields: `apr` and `interestRate` (presets 9.9, 19.9, 24.9 and 34.9), `promoPeriodMonths` (0, 6, 12 and 24), `minPayment` (a percentage: 1, 2, 3 and 5) and `paymentMethod` (direct debit or manual, with no Other). The current value is pre-selected: a preset if it is one, otherwise Other holding the value. The client check mirrors BR-14 (a rate or percentage from 0 to 100 with up to two decimals; whole months from 0 to 60), and a refused value is never sent. The service's own message (a 422 `detail`) is shown as it comes. The open-redirect guard follows a return address only if it is a path that starts with a single `/` and stays on this site once resolved (dot segments removed, a backslash read as a slash): the resolved path must again start with a single `/` followed by a character that is neither `/` nor `\`, so `//host`, `/\host`, `/..//host` and `/./\host` all fall back; otherwise the form returns to the account page, built from the signed-in customer's default bureau.

### 6.7 Closed accounts, report changes, searches, personal details, debt (Releases 2 to 3)

These pages reuse the list patterns above. The debt overview rows are `debt-type-{type}`, each with its amount in `debt-type-{type}-amount`; each details tile holds its value in `detail-tile-{field}-value`. Closed accounts (`closed-title`) groups rows under `closed-group-{type}` with no summary. Report changes adds filter chips `changes-filter-{sentiment}` and pagination `pager-prev`, `pager-next`, `pager-status`; filters are reflected in the URL. Searches lists `search-row-{id}` inside `search-list` (empty state `search-list-empty`). Personal details is read-only in v1: the name `pd-name` (the user's legal name), the current address `pd-address-current`, previous addresses `pd-address-previous-{n}` (newest first, from 1), and the electoral roll status `pd-electoral-roll`. Debt overview shows `debt-total`, `debt-trend` and a per-type breakdown `debt-type-{type}`, one row per `byType` entry of `GET /debt/overview` (BR-07, DR-046).

### 6.8 Debug panel (tooling)

Present only in a test build (`VITE_TEST_BUILD`) and only for a signed-in customer, so never in the public demo build (DR-037); whether its calls succeed is decided by the service's test-control gate. Lists every bug flag as a checkbox `debug-flag-{flag}`, a persona selector `debug-persona`, a clock input `debug-clock` and `debug-reset`, with a key field `debug-key`, a user field `debug-username`, `debug-bind`, `debug-set-clock` and a status line `debug-status`. It calls the `/__test/*` endpoints; it never changes UI state directly.

**What the public-build guard can and cannot see (CDS-38 R2-C-06).** `public-build-guard.mjs` looks in the built bundle for the five strings above, and for the names of the UI flags that no ordinary word could spell (`duplicate-nav`, `util-mismatch`, `currency-format`, `minor-units-label`, `placeholder-aria`, `chart-no-values`, `range-stale`, `toggle-label`, `like-both`, `truncate-summary`, `negative-balance`). It cannot see a flag whose defect branch is a plain expression, such as `plural`, which folds into the page's own text. When the remaining UI flags are built (P3), each defect branch is written inside a constant `TEST_BUILD && ...` check, which the bundler removes from the public build, and the guard's marker list gains any string the branch leaves behind.

### 6.9 My profile (Release 3)

Specified in full in the [My Profile UI feature spec](ui-feature-profile.md): layout, element inventory with `data-testid` values, rules PR-01 to PR-11 and seed scenarios. Reached from the header account button `btn-account`. It is a different page from the report's read-only personal details in section 6.7.

Release 3 adds the email and mobile sub-pages (DR-022), specified in that spec's section 4 and now in the page catalogue; their rules PR-09 to PR-11 are enforced by the API and shown as field errors. Address, employment and finances are stretch.

## 7. Component catalogue

| Component | Props (key) | Used on | Notes |
| --- | --- | --- | --- |
| `DemoBanner` | none | All | Always on |
| `ScoreSection` (the gauge) | `score` | Overview | Not a separate component. A bar; `role="progressbar"` named 'Credit score' with `aria-valuenow` the score, `aria-valuemin` 0 and `aria-valuemax` the maximum |
| Benchmarks | none | Overview | Not a separate component: the national and local averages are figures in `ScoreSection` (`bench-national`, `bench-local`), not bars |
| `HistoryChart` | `points[]`, `range` | Overview | Gaps for null; table alternative (`history-chart-table`) |
| `BalanceChart` | `points[]` | Account detail | Balance for each of the last six months; table alternative. No limit line is drawn |
| Range buttons | none | Overview | Not a separate component: three `aria-pressed` buttons (`range-3m`, `range-6m`, `range-1y`), reached with Tab like any button; there is no arrow-key navigation |
| `UtilisationBar` | `percent`, `label` | Overview, lists, detail | Colour bands: below 30%, 30 to 75%, above 75%. Above 100: bar full, `aria-valuenow` the real value, `aria-valuemax` raised to match, text `115%` and badge `{testid}-over-limit` reading 'Over limit' (DR-013) |
| (no donut) | none | Lists | Lists use `UtilisationBar`; no donut is built |
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
| `duplicate-nav` | Desktop and mobile navs both rendered | exit check: layouts |
| `util-mismatch` | Bar width differs from percentage text | exit check: text equals aria-valuenow; visual check: the credit card list at 1280 px, light |
| `currency-format` | Money shown unformatted (`53024`) | Scenario `Total debt and its trend are shown`; visual check: the overview at 1280 px, light |
| `minor-units-label` | Progress bar named '423600% of 510000' | exit check: a bar's name matches its value |
| `placeholder-aria` | All row bars named 'Accessible label' | exit check: no placeholder names |
| `chart-no-values` | Chart points announced without values | exit check: the table alternative carries values |
| `range-stale` | Chart ignores range changes | Scenario `Score history range` |
| `toggle-label` | 'See less' never flips back | Component test `reads "Show fewer" while open and "Show all 5" again once closed` |
| `like-both` | Like and Dislike both pressed | Scenario `Summary feedback is remembered` |
| `plural` | '1 topics', 'Updates in 1 days' | Scenario `Next update wording`; component test `says "1 day" for one day to the next update` |
| `button-href` | Tiles rendered as buttons with `href` | exit check: no button with href |
| `double-render` | List rendered twice during route change | Scenario `Only the three newest changes are shown at first` |
| `ph-a11y` | Year buttons lose `aria-pressed`; icons lose text | Scenario `The current year is chosen first`; exit check: axe role-img-alt |
| `open-redirect` | `redirectUrl` guard removed | Scenario `The return link cannot leave the site` |
| `truncate-summary` | Summary cut mid-word with no way to expand | Component test `cuts at the last whole word before 280 characters, shows an ellipsis, and Read more shows it all` |
| `negative-balance` | An account in credit is shown as an amount owed (`£44`, no 'in credit') (DR-019) | Scenario `A card in credit says so` |

Profile-page flags (`nested-button`, `decorative-alt`, `preferred-on-report`, `preferred-no-trim`, `email-stays-verified`, `pii-in-title`, `lost-edit`) are listed in the My Profile UI feature spec, section 7.

## 9. Verification checks

**Semantic rules (CDS-41).** Applied with axe-core on every page and state, in every scan and layout check (the counts of section 9 do not change). Each reports `rule: 'test id' detail`:

| Rule | A page breaks it when |
|---|---|
| `progress-value-matches-text` | a progress bar's `aria-valuenow` differs from the percentage written just before it (the score gauge has none) |
| `progress-name-matches-value` | a progress bar's name holds a figure that is not its value |
| `no-placeholder-names` | any `aria-label` is a stand-in (`Accessible label`, `label`, `TODO` and the like) |
| `chart-table-has-values` | a row of a chart's table alternative has an empty cell |
| `no-button-with-href` | a `button` or `role="button"` carries an `href` |
| `decorative-image-empty-alt` | an image marked `data-decorative` has any `alt` but the empty one |
| `form-controls-follow-text-size` | an input, select or textarea has a font size different from the text around it |

**Visual-check catchers (CDS-43).** A UI bug flag that changes how a page looks may be caught by one case of the visual check. The flag proof runs that case alone with the flag on (`HARNESS_BUGS`): with the flag off it must pass, with it on it must fail, and the failure must name the image the case writes (`<page>-<width>-<theme>-actual.png`). The baselines are Linux CI images, so the proof runs these catchers on CI (or locally with `VISUAL_LOCAL_TRY=1` against throw-away images); anywhere else it says they were not run and the flag's other catchers judge it.

**Exit-check catchers (CDS-41).** A UI bug flag may be caught by the exit run (`npm run check:ui-exit`) on one of its targets. The flag proof runs the exit script for that target alone (`CDS_EXIT_ONLY=<target>`) with the flag switched on through `HARNESS_BUGS`: with the flag off it must pass, and with it on it must fail with the message the registry records as `failsWith`. A browser context of the exit run carries the control key in storage, because a test build of the UI reads the flags once at start. A filtered run leaves out the sign-in page and the expected-size assertion, which belong to the whole run.

| Check | Tool (proposed) | Runs at |
| --- | --- | --- |
| Type check against generated client | `tsc --noEmit` | Every commit |
| Component tests | Vitest + Testing Library, states from section 4.3 | Phase 4 onwards |
| `@ui` scenarios against the live service | Serenity/JS + Playwright + Cucumber, the service with test control serving the built UI (brief 11 D1, D2) | Phase 4, each slice; exit |
| Component fixtures | Vitest with responses taken from the contract examples; Prism stays for the typed-client smoke | Phase 4 onwards |
| Accessibility | axe-core on every page and every state that shows something new, in the light and the dark theme, flags off: zero violations (`@axe-core/playwright`, `npm run check:ui-exit`; also in the `ui` CI job) | Phase 4 exit |
| Layouts | 375, 768 and 1280 px: one navigation at a time (the bottom tab bar below 768 px), no sideways scroll, the demo banner shown, and axe-core at each width, with normal text and with the root text doubled (`npm run check:ui-exit`) | Phase 4 exit |
| Visual regression | Eight pages at 375 and 1280 px, light and dark: 32 images against Linux CI baselines, `npm run check:visual` (CDS-43; see below) | Phase 5 |
| Bug-flag proof | Each flag on: at least one committed check (scenario, exit check, component test or service test) fails for the stated reason, and passes with it off; `npm run check:bug-flags` (brief 13 D5, DR-064) | Phase 5 |

**Visual regression (CDS-43).** `npm run check:visual` (`src/visual/`, run by `node scripts/run.mjs visual`) photographs eight pages (overview, payment history, report changes, hard searches, personal details, the credit card list, a credit card's detail, the profile) at 375 and 1280 px in the light and the dark theme, 32 images, each whole page in its settled state with the flags off, persona `drilldown` and the service's clock frozen at 2026-10-03T09:00Z (what a page shows depends on it), animations off. Each is compared with a baseline in `test-harnesses/harness-serenity/visual-baselines/` with a colour distance of 0.2 per pixel and no pixel allowed to differ beyond it (0.1% of the pixels was tried first and hid `util-mismatch`; decision D4 revised on 2026-10-19). A missing baseline fails, and so does a file in the folder that no case compares. Baselines are made and compared on Linux CI only: anywhere else the run refuses. They are refreshed by the manual workflow `visual-baselines.yml`, which pushes a branch for a reviewed pull request and never commits to `main`. The workflow `visual.yml` runs the check when the UI, the service or the harness changes, and uploads the actual, expected and diff images when it fails.

## 10. Open questions

None open. Resolved in v6 (decision brief 5): the debug panel is in local and test builds only (DR-037).
