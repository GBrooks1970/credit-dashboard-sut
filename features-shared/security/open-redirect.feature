# version: 4 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
# Moved unchanged from ui/account-details-form.feature v2 at CDS-09 (README 'Where Phase 0 files land').
@security @ui
Feature: Return links stay on this site
  The details form returns the customer to where they came from, but never to another site.
  Covers the UI specification, section 6.6 (open-redirect guard).

  Background:
    Given Alex holds the "drilldown" persona

  # One address per way the guard has been found wanting (CDS-38 C-04): another origin, a protocol-relative address, and dot
  # segments that collapse to one. Backslash forms are covered by the component table (a backslash is an escape in a Gherkin table).
  Scenario Outline: The return link cannot leave the site
    When Alex opens the interest rate form with the return address "<address>"
    And Alex cancels the form
    Then Alex is back on the credit card's own page

    Examples:
      | address                    |
      | https://evil.example/steal |
      | //evil.example/steal       |
      | /..//evil.example/steal    |
      | /.//evil.example/steal     |
      | javascript:alert(1)        |

  # The positive control (CDS-38 R2-B-18): the tests above end on the card's own page, which an app that ignores the return address
  # entirely would also do. A path on this site must be followed, so the guard is shown to let the right address through.
  Scenario: A return link on this site is followed
    When Alex opens the interest rate form with the return address "/credit-health/debt-overview"
    And Alex cancels the form
    Then Alex is on the page "/credit-health/debt-overview"
