# Phase 5 gate evidence: the bug-flag proof table

- **What it is:** the table the flag proof wrote (`reports/bug-flags.md`) in the `flags` job of the `CI` workflow, kept here because the CI artifact expires (90 days) and the gate (DR-067) cites it. Review finding B-01 (CDS-48) found that the earlier copy, an artifact with a 14-day life, would have gone on 2026-11-03.
- **Commit:** `393f7b9` (main, after CDS-48 slices 1 to 4: pull requests #133 to #137).
- **Run:** [CI run 39921248868](https://github.com/GBrooks1970/credit-dashboard-sut/actions/runs/39921248868), conclusion `success`: `Verify`, `UI`, `Bug-flag proof`, `Report`, `Site` and `Deploy` all `success`. Read on 2026-10-23.
- **Verdicts:** 30 flags, each `caught`. A flag is caught for the stated reason only when a committed catcher passes with the flag off and fails with it on, with the failure text the registry states; a visual catcher alone is a "page changed" catch, not a catch for the stated reason (CDS-48 B-08).
- **Machine-readable copy:** `phase-5-bug-flag-proof_2026-10-23.json` (the same run, with each catcher's matched failure line).
- **Taken from:** the `bug-flag-proof` artifact of that run; the table below the line is unchanged.

---

# Bug flags: proof

| Flag | Group | Layer | Verdict | Catchers (off, on) |
|---|---|---|---|---|
| `excluded-in-total` | A | service | caught | scenario: passed, failed-as-stated |
| `rounding-down` | A | service | caught | scenario: passed, failed-as-stated |
| `history-carry-forward` | A | service | caught | scenario: passed, failed-as-stated |
| `idor` | A | service | caught | scenario: passed, failed-as-stated |
| `problem-json-missing` | A | service | caught | scenario: passed, failed-as-stated |
| `mask-format` | A | service | caught | scenario: passed, failed-as-stated |
| `currency-float` | A | service | caught | scenario: passed, failed-as-stated |
| `duplicate-nav` | B | ui | caught | exit-check: passed, failed-as-stated |
| `util-mismatch` | B | ui | caught | exit-check: passed, failed-as-stated; visual-check: passed, failed-as-stated |
| `currency-format` | B | ui | caught | scenario: passed, failed-as-stated; visual-check: passed, failed-as-stated |
| `minor-units-label` | B | ui | caught | exit-check: passed, failed-as-stated |
| `placeholder-aria` | B | ui | caught | exit-check: passed, failed-as-stated |
| `chart-no-values` | B | ui | caught | exit-check: passed, failed-as-stated |
| `button-href` | B | ui | caught | exit-check: passed, failed-as-stated |
| `double-render` | B | ui | caught | scenario: passed, failed-as-stated |
| `ph-a11y` | B | ui | caught | scenario: passed, failed-as-stated; exit-check: passed, failed-as-stated |
| `nested-button` | B | ui | caught | exit-check: passed, failed-as-stated |
| `decorative-alt` | B | ui | caught | exit-check: passed, failed-as-stated |
| `range-stale` | C | ui | caught | scenario: passed, failed-as-stated |
| `toggle-label` | C | ui | caught | component-test: passed, failed-as-stated |
| `like-both` | C | ui | caught | scenario: passed, failed-as-stated |
| `plural` | C | ui | caught | scenario: passed, failed-as-stated; component-test: passed, failed-as-stated |
| `open-redirect` | C | ui | caught | scenario: passed, failed-as-stated |
| `truncate-summary` | C | ui | caught | component-test: passed, failed-as-stated |
| `negative-balance` | C | ui | caught | scenario: passed, failed-as-stated |
| `preferred-on-report` | C | ui | caught | scenario: passed, failed-as-stated |
| `preferred-no-trim` | C | service | caught | scenario: passed, failed-as-stated |
| `email-stays-verified` | C | service | caught | scenario: passed, failed-as-stated |
| `pii-in-title` | C | ui | caught | scenario: passed, failed-as-stated |
| `lost-edit` | C | ui | caught | component-test: passed, failed-as-stated |

## What each catcher failed with

The first line of the catcher's output with the flag on that holds the recorded failure text. A visual-check catcher is a page-changed catch: its text is the image's name.

| Flag | Catcher | Recorded text | The line it failed with |
|---|---|---|---|
| `excluded-in-total` | scenario: Loans without a limit stay out of the totals | `+ 1368500` | `+ 1368500` |
| `rounding-down` | scenario: Utilisation rounds half up | `49 !== 50` | `49 !== 50` |
| `history-carry-forward` | scenario: A month with no score is reported as missing, not carried forward | `642 !== null` | `642 !== null` |
| `idor` | scenario: Another customer's account cannot be found | `200 !== 404` | `200 !== 404` |
| `problem-json-missing` | scenario: Another customer's account cannot be found | `has content type 'text/plain'` | `✗ Error: getAccount: the 404 response has content type 'text/plain', and the contract documents 'application/problem+json'` |
| `mask-format` | scenario: Source numbers are masked to their last four characters | `the 200 response does not match the contract at '/maskedNumber'` | `✗ Error: getAccount: the 200 response does not match the contract at '/maskedNumber': must match pattern "^\*[A-Z0-9]{4}$" (1 error); body: {"id":"acc_ovcc03","type":"creditcard","provider":"Lender X","logoUrl":null,"maskedNumber":"12345678","balance":{"amountMinor":0,"currency":"GBP"},"limit":{"amo` |
| `currency-float` | scenario: Type totals sum the open accounts of that type | `at '/balance/amountMinor': must be integer` | `✗ Error: getAccountTotals: the 200 response does not match the contract at '/balance/amountMinor': must be integer (1 error); body: {"type":"creditcard","balance":{"amountMinor":379.6,"currency":"GBP"},"limit":{"amountMinor":6100,"currency":"GBP"},"utilisation":6,"includedCount":2,"excluded":[]}` |
| `duplicate-nav` | exit-check: exit check: layouts | `found 3 tab(s) and 3 top link(s)` | `FAIL  layout 375px  overview: expected the bottom tab bar only, found 3 tab(s) and 3 top link(s)` |
| `util-mismatch` | exit-check: exit check: text equals aria-valuenow | `progress-value-matches-text: 'account-util-bar-creditcard'` | `FAIL  layout 375px  overview: progress-value-matches-text: 'account-util-bar-creditcard' has aria-valuenow 13 but the text beside it says 6%; progress-value-matches-text: 'account-util-bar-loan' has aria-valuenow 90 but the text beside it says 83%; progress-value-matches-text: 'account-util-bar-mort` |
| `util-mismatch` | visual-check: visual check: the credit card list at 1280 px, light | `account-list-creditcard-1280-light-actual.png` | `Received: reports/visual-results/visual-1280px-light-account-list-creditcard/account-list-creditcard-1280-light-actual.png` |
| `currency-format` | scenario: Total debt and its trend are shown | `Received string: 19827960` | `Received string: 19827960` |
| `currency-format` | visual-check: visual check: the overview at 1280 px, light | `overview-1280-light-actual.png` | `Received: reports/visual-results/visual-1280px-light-overview/overview-1280-light-actual.png` |
| `minor-units-label` | exit-check: exit check: a bar's name matches its value | `progress-name-matches-value: 'account-util-bar-creditcard'` | `FAIL  layout 375px  overview: progress-name-matches-value: 'account-util-bar-creditcard' is named '37960% of 610000' but its value is 6; progress-name-matches-value: 'account-util-bar-loan' is named '1252400% of 1500000' but its value is 83; progress-name-matches-value: 'account-util-bar-mortgage' i` |
| `placeholder-aria` | exit-check: exit check: no placeholder names | `no-placeholder-names: 'account-util-bar-creditcard'` | `FAIL  layout 375px  overview: no-placeholder-names: 'account-util-bar-creditcard' is named 'Accessible label'; no-placeholder-names: 'account-util-bar-loan' is named 'Accessible label'; no-placeholder-names: 'account-util-bar-mortgage' is named 'Accessible label'; no-placeholder-names: 'account-util` |
| `chart-no-values` | exit-check: exit check: the table alternative carries values | `chart-table-has-values: 'history-chart-table'` | `FAIL  layout 375px  overview: chart-table-has-values: 'history-chart-table' has 6 of its rows without a value` |
| `button-href` | exit-check: exit check: no button with href | `no-button-with-href: 'tile-hard-searches'` | `FAIL  layout 375px  overview: no-button-with-href: 'tile-hard-searches' is a button with an href; no-button-with-href: 'tile-soft-searches' is a button with an href; no-button-with-href: 'tile-personal-details' is a button with an href; no-button-with-href: 'tile-corrections' is a button with an hre` |
| `double-render` | scenario: Only the three newest changes are shown at first | `Received number: 6` | `Received number: 6` |
| `ph-a11y` | scenario: The current year is chosen first | `Expected "aria-pressed" attribute of ph-year-2026 to equal "true"` | `AssertionError: Expected "aria-pressed" attribute of ph-year-2026 to equal "true"` |
| `ph-a11y` | exit-check: exit check: axe role-img-alt | `role-img-alt (serious): 7 node(s)` | `FAIL  layout 375px  payment history: role-img-alt (serious): 7 node(s), e.g. span[data-testid="ph-year-status-2020"]` |
| `nested-button` | exit-check: exit check: axe nested-interactive | `nested-interactive (serious): 1 node(s)` | `FAIL  layout 375px  profile: nested-interactive (serious): 1 node(s), e.g. button[data-testid="profile-name-info-wrap"]; target-size (serious): 1 node(s), e.g. button[data-testid="profile-name-info-wrap"]` |
| `decorative-alt` | exit-check: exit check: a decorative image has an empty alt | `decorative-image-empty-alt: 'profile-header-image'` | `FAIL  layout 375px  profile: decorative-image-empty-alt: 'profile-header-image' is decorative but has alt 'Profile header image'` |
| `range-stale` | scenario: Score history range | `history-chart-row-"]') to equal 12` | `AssertionError: Timeout of 5s has expired while waiting for the number of page elements located by css ('[data-testid^="history-chart-row-"]') to equal 12` |
| `toggle-label` | component-test: reads "Show fewer" while open and "Show all 5" again once closed | `the label did not flip back to 'Show all 5'` | `::error file=/home/runner/work/credit-dashboard-sut/credit-dashboard-sut/demo-apps/demoapp001-react-ui/src/flags.test.tsx,title=src/flags.test.tsx > the changes toggle flips back (the catcher of toggle-label) > reads "Show fewer" while open and "Show all 5" again once closed,line=134,column=97::Erro` |
| `like-both` | scenario: Summary feedback is remembered | `Expected "aria-pressed" attribute of btn-dislike to equal "false"` | `AssertionError: Expected "aria-pressed" attribute of btn-dislike to equal "false"` |
| `plural` | scenario: Next update wording | `Received string: Updates in 1 days` | `Received string: Updates in 1 days` |
| `plural` | component-test: says "1 day" for one day to the next update | `Updates in 1 days` | `::error file=/home/runner/work/credit-dashboard-sut/credit-dashboard-sut/demo-apps/demoapp001-react-ui/src/flags.test.tsx,title=src/flags.test.tsx > the bug flags in the UI (brief 13 D1%2C DR-064) > says "1 day" for one day to the next update,line=26,column=51::Error: expect(element).not.toHaveTextC` |
| `open-redirect` | scenario: The return link cannot leave the site | `the browser left the site: it is at '` | `LogicError: the browser left the site: it is at 'chrome-error://chromewebdata/'` |
| `truncate-summary` | component-test: cuts at the last whole word before 280 characters, shows an ellipsis, and Read more shows it all | `the summary was cut inside a word at the limit of 280` | `::error file=/home/runner/work/credit-dashboard-sut/credit-dashboard-sut/demo-apps/demoapp001-react-ui/src/flags.test.tsx,title=src/flags.test.tsx > a long summary is cut at a word and can be expanded (the catcher of truncate-summary) > cuts at the last whole word before 280 characters%2C shows an e` |
| `negative-balance` | scenario: A card in credit says so | `Expected the text of row-balance-acc_ddcc02 to equal "£44.00 in credit"` | `AssertionError: Expected the text of row-balance-acc_ddcc02 to equal "£44.00 in credit"` |
| `preferred-on-report` | scenario: Alex sets a preferred name | `Expected the text of pd-name to equal "Alex Example"` | `AssertionError: Expected the text of pd-name to equal "Alex Example"` |
| `preferred-no-trim` | scenario: Spaces around a preferred name are removed | `body: {"preferredName":"  Sam  "}` | `✗ Error: updatePreferredName: the 200 response does not match the contract at '/preferredName': must match pattern "^[\p{L}'-]([\p{L}' -]*[\p{L}'-])?$" (3 errors); body: {"preferredName":"  Sam  "}` |
| `email-stays-verified` | scenario: A changed email needs verifying again | `text of profile-email-badge to equal "Unverified"` | `AssertionError: Timeout of 5s has expired while waiting for the text of profile-email-badge to equal "Unverified"` |
| `pii-in-title` | scenario: Profile details stay out of the page title and address | `Expected <<current page>>.title() to not include "Alex Example"` | `AssertionError: Expected <<current page>>.title() to not include "Alex Example"` |
| `lost-edit` | component-test: asks, and staying keeps the page and the typed name | `no question was asked about the unsaved 'Ally'` | `::error file=/home/runner/work/credit-dashboard-sut/credit-dashboard-sut/demo-apps/demoapp001-react-ui/src/flags.test.tsx,title=src/flags.test.tsx > leaving with an unsaved preferred name asks first (the catcher of lost-edit) > asks%2C and staying keeps the page and the typed name,line=190,column=71` |
