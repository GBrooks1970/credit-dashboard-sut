# version: 3 | created: 2026-10-05T20:41Z | project: credit-dashboard-sut | type: feature | language: en-GB
# Split from account-drilldown.feature v1 (CDS-07 point 3). The return-link scenario moved to
# features-shared/security/open-redirect.feature at CDS-09.
@ui
Feature: Account details form
  A customer can record the details the report is missing, within sensible limits, and the form only ever returns them to this site.
  Covers UI specification v5, section 6.6.

  Background:
    Given Alex holds the "drilldown" persona

  @BR-14
  Scenario: Alex records an interest rate
    Given Alex is viewing a credit card with no interest rate recorded
    When Alex records an interest rate of 29.9%
    Then the credit card shows an interest rate of 29.9%

  @BR-14
  Scenario: An impossible interest rate is refused
    Given Alex is viewing a credit card with no interest rate recorded
    When Alex tries to record an interest rate of 120%
    Then Alex is told the rate must be between 0% and 100%
    And no interest rate is recorded
