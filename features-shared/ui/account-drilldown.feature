# version: 6 | created: 2026-10-07T12:50Z | project: credit-dashboard-sut | type: feature | language: en-GB
@ui
Feature: Account drilldown
  A customer can move from a summary of each account type down to a single account.
  Covers the UI specification, sections 6.4, 6.5 and 6.7 (closed accounts). The edit form is in account-details-form.feature.

  Background:
    Given Alex holds the "drilldown" persona

  Scenario: The type list agrees with the overview card
    Given Alex has noted the credit card total on the report overview
    When Alex opens the credit card list
    Then the list total matches the overview total

  @BR-05
  Scenario: Excluded loans are explained
    When Alex opens the loan list
    Then Alex sees which loans are excluded from the loan totals

  Scenario: A loan shows only the sections that apply to loans
    When Alex opens a loan account
    Then Alex sees the balance, payment history and account information
    But Alex does not see interest rate or promotional period details

  # In credit: DR-018. The negative-balance bug flag (DR-019) turns this scenario red.
  @BR-06
  Scenario: A card in credit says so
    When Alex opens the credit card list
    Then the Harbour Bank card shows a balance of 44.00 in credit
    And the Harbour Bank card shows a utilisation of 0%

  # Over limit: DR-013, UI specification section 7. Sam holds a different persona from the background.
  @BR-03
  Scenario: A card over its limit shows its real utilisation
    Given Sam holds the "struggling" persona
    When Sam opens the credit card list
    Then the Northgate Finance card shows a utilisation of 115%
    And the Northgate Finance card is marked as over its limit

  @BR-13
  Scenario: Closed accounts are grouped by type with a balance of zero
    Given Sam holds the "struggling" persona
    And today is 3 October 2026
    When Sam opens the closed accounts for "Bureau A"
    Then the closed credit cards group lists 1 account
    And its balance is 0.00
