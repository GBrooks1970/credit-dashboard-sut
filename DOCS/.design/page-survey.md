---
version: 2
created: 2026-10-03T17:05Z
project: credit-dashboard-sut
type: design-spec
language: en-GB
---

# Credit Dashboard SUT: Element Specification

**Status:** Draft outline for a potential portfolio project
**Working name:** `credit-dashboard-sut` (fictional brand *ScoreHarbour*, placeholder)
**Source:** structure of a typical UK credit-score app report overview page, captured 3 October 2026 (overview, payment history, account-type lists, account detail, data-capture form, closed accounts). Structure only; no data copied.

---

## Purpose and ground rules

This spec describes a fictional credit-health dashboard to serve as a system under test (SUT) for the test automation portfolio. It models the page structure and interaction patterns, not the source product.

- **Fictional brand only.** No real company names, logos, colours or wordmarks of the source app, credit reference agencies or lenders.
- **Synthetic data only.** No figures or details from any real credit report. All lenders, balances and scores come from a seeded fixture file.
- **Visible demo marking.** A persistent banner: 'Demo application: all data is fictional'.
- **Credit bureaux** become fictional providers, e.g. *Bureau A* and *Bureau B*.
- **AI assistant** becomes a mock chat widget with canned responses (no real LLM call).

## Page layout overview

Route: `/credit-health/report/:bureau`. A single scrolling page with a header and ten stacked regions, top to bottom:

1. **Global header:** logo, primary nav, account and notifications buttons
2. **Score hero:** large score on an arc gauge
3. **Score comparison:** bureau name, next-update text, two benchmark bars
4. **Report summary:** AI-style summary text, chat CTA, feedback buttons
5. **Score history chart:** line chart with 3m / 6m / 1y segmented control
6. **Report changes:** list of change cards, 'See all' link, expand/collapse
7. **Impacting your score:** three category tiles with topic counts
8. **Debt overview:** total debt and trend indicator
9. **Accounts:** six account-type cards plus a closed-accounts link
10. **Payment history:** two summary tiles and a link
11. **Searches and details:** four navigation tiles

Responsive: desktop shows a horizontal nav; below 768px the nav moves to a bottom tab bar (the source page renders both navs in the DOM, a useful locator-ambiguity exercise).

## Element inventory

Every interactive or asserted element gets a stable `data-testid` plus a correct ARIA role and accessible name, so tests can show both test-id and role-based locator strategies.

| Section | Element | Role / type | data-testid | Behaviour / assertion |
| --- | --- | --- | --- | --- |
| Header | Logo link | link | `nav-logo` | Navigates to `/` |
| Header | Primary nav (Home, Credit Health, Offers, Improve, Protect) | navigation > list > link | `nav-primary-{item}` | Active item has `aria-current="page"` |
| Header | My account | button | `btn-account` | Opens account menu (dropdown) |
| Header | Notifications | button | `btn-notifications` | Opens panel; badge shows unread count |
| Header | Mobile tab bar | navigation | `nav-mobile-{item}` | Visible below 768px only |
| Score hero | Score value | heading | `score-value` | Integer 0 to 1000 |
| Score hero | Score max label | text | `score-max` | 'Out of 1000' |
| Score hero | Arc gauge | img (SVG) | `score-gauge` | Fill angle proportional to score |
| Comparison | Bureau name | text | `bureau-name` | Matches `:bureau` route param |
| Comparison | Next update | text | `next-update` | 'Updates in N day(s)'; check pluralisation |
| Comparison | National average bar | progressbar | `bench-national` | `aria-valuenow`, `aria-valuemax=1000` |
| Comparison | Local area bar | progressbar | `bench-local` | As above |
| Summary | Summary text | text | `summary-text` | Truncated with ellipsis beyond N chars |
| Summary | Chat CTA | button | `btn-chat` | Opens mock chat drawer |
| Summary | Impact link | link | `link-impact` | Navigates to impact page |
| Summary | Like / Dislike | button (toggle) | `btn-like`, `btn-dislike` | Mutually exclusive; `aria-pressed` |
| Summary | AI disclaimer | text | `ai-disclaimer` | Always visible |
| History | Line chart | SVG / graphics-data | `history-chart` | One point per month; labelled points |
| History | Axis labels | text | `history-x-{n}`, `history-y-{n}` | Update with range |
| History | Range selector (3m / 6m / 1y) | radiogroup > radio | `range-{3m,6m,1y}` | Single selection; re-renders chart |
| Changes | Section heading | heading | `changes-heading` | 'Report changes' |
| Changes | See all | link | `changes-see-all` | Query-string filters in URL |
| Changes | Change card | article (link) | `change-card-{id}` | Title, sentiment (positive / negative) |
| Changes | See more / See less | button | `changes-toggle` | Toggles 3 vs all cards; label flips |
| Impact | Category tile (Action needed, Monitor, Doing well) | article | `impact-{category}` | 'N topic(s)' count |
| Impact | Impact link | link | `impact-link` | Duplicate of summary link |
| Debt | Total debt | text | `debt-total` | GBP format `£NN,NNN` |
| Debt | Trend | text | `debt-trend` | Up / down / steady |
| Debt | Overview link | link | `debt-link` | Navigates to debt page |
| Accounts | Account-type card (credit cards, loans, mortgages, current accounts, utilities, credit accounts) | link card | `account-card-{type}` | Heading, provider logos, balance |
| Accounts | Provider logo | img | `account-logo-{type}-{n}` | Alt text = provider name |
| Accounts | Balance | text | `account-balance-{type}` | GBP format |
| Accounts | Utilisation text | text | `account-util-text-{type}` | 'NN% of £X total' |
| Accounts | Utilisation bar | progressbar | `account-util-bar-{type}` | Matches text; colour band by % |
| Accounts | Closed accounts | link | `link-closed-accounts` | Navigates to closed list |
| Payments | New missed payments tile | article | `payments-new-missed` | Count |
| Payments | On your report tile | article | `payments-on-report` | Count |
| Payments | Payment history link | link | `link-payment-history` | Navigates |
| Searches | Hard searches / Soft searches / Personal details / Disputes and corrections | link tile | `tile-{name}` | Navigates to sub-page |

## Routes and linked pages

Phase 1 builds the overview page fully; linked pages can start as stubs with a heading and back link, then grow in later phases.

| Route | Page | Phase |
| --- | --- | --- |
| `/credit-health/report/:bureau` | Report overview (this spec) | 1 |
| `/credit-health/report/:bureau/accounts/:type` | Accounts by type (table, sort, filter) | 2 |
| `/credit-health/report/:bureau/closed-accounts` | Closed accounts list | 2 |
| `/credit-health/report/:bureau/payment-history` | Payment history grid (month × account) | 2 |
| `/credit-health/report/:bureau/searches/:kind` | Hard / soft searches list | 2 |
| `/credit-health/report/:bureau/personal-details` | Editable personal details form | 3 |
| `/credit-health/report/:bureau/corrections` | Dispute submission form (multi-step) | 3 |
| `/credit-health/debt-overview` | Debt breakdown | 3 |
| `/insights/updates?tags=&bureau=` | All report changes, filtered by query string | 2 |
| `/insights/impact/:bureau` | Impact topics detail | 3 |
| `/login` | Login (needed for auth fixtures) | 1 |

## Payment history page

Route `/credit-health/report/:bureau/payment-history`. One reusable widget: a seven-year selector plus a result panel. The same widget appears on each account detail page, scoped to that account, which makes it a good component-test target.

| Element | Role / type | data-testid | Behaviour / assertion |
| --- | --- | --- | --- |
| Page title and intro | heading, text | `ph-title`, `ph-intro` | Intro states missed payments stay on file for 6 years |
| Year selector (current year minus 6 to current) | button group | `ph-year-{yyyy}` | One selected at a time; selection exposed via `aria-pressed` |
| Year status icon | img | `ph-year-status-{yyyy}` | On time / missed / no data; needs a text alternative |
| Legend | list | `ph-legend` | Three items: On time, Missed payment, No data |
| Result panel | region | `ph-result` | Empty state 'You have no missed payments', or list of missed payments for the selected year |
| Missed payment row | listitem | `ph-missed-{accountId}-{month}` | Account name, month, status code |

In the source, the year buttons expose no selected state and the status icons have no text alternative. Recreate both as an accessibility bug flag (`ph-a11y`).

## Account drilldown structure

Accounts drill down four levels: overview card, account-type list, account detail, then a single-field edit form. Closed accounts sit beside the type lists as a flat grouped page.

1. **Overview card** (`/credit-health/report/:bureau`): one card per account type, described above.
2. **Account-type list** (`/accounts/:type`): summary card, account rows, updates panel.
3. **Account detail** (`/account/:accountId`): balance, details tiles, 6-month chart, payment history, metadata.
4. **Data-capture form** (`/data-capture/:field?accountId=&redirectUrl=`): edit one detail, then return.

### Level 2: account-type list

Every list page opens with the type title and a data-latency notice ('can take 5 weeks to update'). The summary card changes by type:

| Account type | Summary metrics | Utilisation donut | Row extras |
| --- | --- | --- | --- |
| Credit cards | Total balance, total limit | Yes | Utilisation text and bar per row |
| Loans | Total remaining, total borrowed | Yes | Bar per row; separate 'Loans without limits' group |
| Mortgages | Total remaining | No | Balance only |
| Current accounts | Total overdraft limit | Yes (empty at 0%) | No balance shown |
| Utilities and telecoms | None | No | Grouped sub-lists: Utilities, Telecoms |
| Credit accounts | Total balance, total limit | Yes | Utilisation text and bar per row |

| Element | Role / type | data-testid | Behaviour / assertion |
| --- | --- | --- | --- |
| Latency notice | text | `list-notice` | Static copy |
| Summary card | article | `list-summary` | Totals equal the sum of included rows |
| Utilisation donut | progressbar | `list-donut` | Matches total balance divided by total limit |
| Account row | link | `account-row-{accountId}` | Navigates to detail; opaque ID in URL |
| Provider logo | img | `account-row-logo-{accountId}` | Falls back to the text name when no logo exists |
| Masked number | text | `account-row-mask-{accountId}` | Format `*1234` |
| Excluded group | region | `list-excluded` | 'Not included in the borrowing calculation'; rows excluded from totals |
| Updates panel | region | `list-updates` | Signal cards with impact badge (LOW / MEDIUM / HIGH IMPACT) |

The excluded loans group is a useful business rule to test: its balances must not appear in the summary totals or the overview card.

### Level 3: account detail

| Element | Role / type | data-testid | Behaviour / assertion |
| --- | --- | --- | --- |
| Header card | article | `detail-header` | Logo, provider heading, type plus `****1234` |
| Link-your-account promo | article | `detail-promo` | Conditional; CTA opens a mock consent page |
| Balance card | article | `detail-balance` | 'Last balance', amount, 'NN% of £X limit', bar, 'Updated on DD Month YYYY' |
| Details tiles (APR, interest rate, promotional period, repayment, payment method) | button | `detail-tile-{field}` | 'None' when unknown; opens the data-capture form |
| Balances chart (6 months) | SVG | `detail-balance-chart` | One bar per month; credit-limit reference line |
| Payment history widget | region | `detail-payment-history` | Same component as the payment history page, scoped to this account |
| Account metadata | article | `detail-meta` | Update frequency, status (Normal / Arrears / Default / Settled), date opened |
| Help footer | region | `detail-help` | 'See something wrong?' plus help link |

Detail pages render by account type. Revolving credit shows everything above. Loans show balance, payment history and metadata only, leaving empty regions in the source; a good test of conditional rendering.

### Level 4: data-capture form

| Element | Role / type | data-testid | Behaviour / assertion |
| --- | --- | --- | --- |
| Prompt and hint | text | `dc-prompt`, `dc-hint` | e.g. 'Tell us the interest rate for this account' |
| Preset options | button list | `dc-option-{value}` | Single select (e.g. 24.9%, 29.9%, 33.9%, 39.9%, 49.9%) |
| Other | button | `dc-option-other` | Reveals a numeric input `dc-input` |
| Help disclosures | button | `dc-help-where`, `dc-help-why` | Expand / collapse; `aria-expanded` |
| Save / Cancel | button | `dc-save`, `dc-cancel` | Save returns to `redirectUrl` and the tile shows the new value; Cancel discards |

Form tests: range (0 to 100), decimal places, empty input, and `redirectUrl` limited to same-origin paths (open-redirect check).

### Closed accounts

Route `/closed-accounts`. No summary card; rows grouped under type headings, each showing a £0 balance and masked number, with a note that closed accounts stay on file for 6 years.

## Test data model

The UI reads from a small REST API (e.g. `GET /api/report/:bureau`) backed by JSON fixtures, so tests can stub, seed or intercept at the network layer.

```json
{
  "user": { "id": "u-001", "displayName": "Alex Example" },
  "bureau": { "id": "bureau-a", "name": "Bureau A", "nextUpdateDays": 1 },
  "score": { "current": 720, "max": 1000, "nationalAvg": 600, "localAvg": 615 },
  "history": [ { "month": "2025-10", "score": 680 } ],
  "summary": { "text": "...", "sentiment": "steady" },
  "changes": [ { "id": "c1", "title": "A search by Lender X was removed", "sentiment": "positive", "date": "2026-09-20" } ],
  "impact": { "actionNeeded": 0, "monitor": 1, "doingWell": 10 },
  "debt": { "total": 25000, "trend": "down" },
  "accounts": [ { "type": "creditcard", "provider": "Lender X", "balance": 1200, "limit": 5000, "status": "open" } ],
  "payments": { "newMissed": 0, "onReport": 0 },
  "searches": { "hard": [], "soft": [] }
}
```

Named personas (switchable via query param or login user) drive state coverage:

| Persona | Purpose |
| --- | --- |
| `excellent` | High score, no negatives, all 'Doing well' |
| `struggling` | Low score, missed payments, high utilisation (>90%) |
| `thin-file` | No accounts; every section shows its empty state |
| `boundary` | Score 0 and 1000; utilisation exactly 0% and 100% |
| `error` | API returns 500; error banner and retry button |
| `slow` | API delayed 3s; skeleton loaders visible |

Each account record needs these fields to drive the drilldown pages:

```json
{
  "id": "acc-7f3k2",
  "type": "creditcard",
  "provider": "Lender X",
  "logoUrl": null,
  "maskedNumber": "*1234",
  "balance": 1200,
  "limit": 5000,
  "includedInTotals": true,
  "status": "normal",
  "openedDate": "2025-05-12",
  "updateFrequency": "monthly",
  "lastUpdated": "2026-08-12",
  "details": { "apr": null, "interestRate": 24.9, "promoPeriod": null, "minPayment": { "amount": 25, "percent": 3.1 }, "paymentMethod": null },
  "balanceHistory": [ { "month": "2026-03", "balance": 900 } ],
  "paymentHistory": { "2026": ["on-time", "on-time", "no-data"] },
  "closed": false
}
```

Add a `drilldown` persona with every account type, one excluded loan, one account with no logo and one negative balance.

## Testability features and deliberate defects

The source page already contains several real-world testing challenges worth recreating on purpose:

- **Duplicate navigation:** desktop and mobile navs both in the DOM; tests must scope locators or check visibility.
- **Duplicate links:** 'See what's having an impact' appears twice; forces `.first()` or scoping decisions.
- **SVG chart with sparse labels:** the source exposes many chart points as 'undefined: 778'; reproduce as a toggleable accessibility defect.
- **Truncated text:** summary cut mid-word; assert full text via tooltip or expand.
- **Dynamic content:** 'Updates in N days' depends on the clock; supports time-mocking exercises.
- **Generated IDs in hrefs:** change-card URLs carry UUIDs; tests should match by pattern.

A bug toggle panel (`/__debug`, or `?bugs=` query param) switches seeded defects on and off for demo runs:

| Bug flag | Effect | Caught by |
| --- | --- | --- |
| `util-mismatch` | Utilisation bar width disagrees with the % text | Visual or assertion test |
| `currency-format` | Balance shown as `53024` instead of `£53,024` | Formatting assertion |
| `range-stale` | Chart does not re-render after range change | Interaction test |
| `toggle-label` | 'See less' label does not flip back | State test |
| `like-both` | Like and Dislike can both be pressed | Behaviour test |
| `a11y-labels` | Chart points and logos lose accessible names | axe-core scan |
| `plural` | '1 topics' instead of '1 topic' | Copy assertion |
| `slow-api` | Random 0 to 5s latency | Flakiness / wait strategy |

Defects seen on the drilldown pages, added as further flags:

| Bug flag | Effect (as seen in the source) | Caught by |
| --- | --- | --- |
| `minor-units-label` | Detail progress bar labelled in pence, e.g. '423600% of 510000' | ARIA attribute assertion |
| `placeholder-aria` | Row progress bars all named 'Accessible label' | axe-core / role locator |
| `chart-no-values` | Chart bars announced as 'Mar: Mar' with no amount | Accessibility tree check |
| `mask-format` | Malformed masked numbers such as `* P` or `* 0` | Regex assertion |
| `negative-balance` | Credit balance shown as '-£44' and '-1%' utilisation | Boundary test; expected display needs a decision |
| `button-href` | Details tiles are buttons carrying an `href` | Role / semantics lint |
| `double-render` | List region rendered twice during route transition | Strict-mode locator failure |
| `excluded-in-total` | 'Loans without limits' wrongly added to totals | Business rule test |

## Example test scenarios

A starter set covering UI, API, accessibility and visual layers:

```gherkin
Feature: Credit report overview

  Background:
    Given Alex is logged in as the "excellent" persona
    And Alex views the report for "Bureau A"

  Scenario: Score and benchmarks are displayed
    Then the score shows 720 out of 1000
    And the national average bar reads 600

  Scenario Outline: Score history range selection
    When Alex selects the "<range>" range
    Then the chart shows <points> monthly points
    Examples:
      | range | points |
      | 3m    | 3      |
      | 6m    | 6      |
      | 1y    | 12     |

  Scenario: Utilisation text matches the bar
    Then each account card's utilisation bar matches its percentage text

  Scenario: Report changes expand and collapse
    When Alex expands the report changes
    Then all changes are listed
    And the toggle reads "See less"

  Scenario: Empty states for a thin file
    Given Alex is logged in as the "thin-file" persona
    Then every accounts card shows its empty state
```

Other checks to include:

- API contract test on `GET /api/report/:bureau` (schema validation).
- Network interception: stub the `error` persona and assert the retry banner.
- axe-core scan of the full page, with and without the `a11y-labels` bug flag.
- Visual regression snapshots at 375px and 1280px widths.
- Screenplay tasks such as `ViewReport.for(bureau)` and `SelectHistoryRange.of('6m')`; questions such as `TheScore.displayed()`.
