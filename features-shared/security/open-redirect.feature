# version: 1 | created: 2026-10-05T20:41Z | project: credit-dashboard-sut | type: feature | language: en-GB
# Moved unchanged from ui/account-details-form.feature v2 at CDS-09 (README 'Where Phase 0 files land').
@security @ui
Feature: Return links stay on this site
  The details form returns the customer to where they came from, but never to another site.
  Covers UI specification v6, section 6.6 (open-redirect guard).

  Background:
    Given Alex holds the "drilldown" persona

  Scenario: The return link cannot leave the site
    When Alex opens the interest rate form with a return address on another site
    And Alex cancels the form
    Then Alex is back on the credit card's own page
