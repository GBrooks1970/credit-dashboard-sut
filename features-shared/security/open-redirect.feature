# version: 2 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
# Moved unchanged from ui/account-details-form.feature v2 at CDS-09 (README 'Where Phase 0 files land').
@security @ui
Feature: Return links stay on this site
  The details form returns the customer to where they came from, but never to another site.
  Covers the UI specification, section 6.6 (open-redirect guard).

  Background:
    Given Alex holds the "drilldown" persona

  Scenario: The return link cannot leave the site
    When Alex opens the interest rate form with a return address on another site
    And Alex cancels the form
    Then Alex is back on the credit card's own page
