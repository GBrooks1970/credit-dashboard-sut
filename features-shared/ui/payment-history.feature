# version: 3 | created: 2026-10-05T20:00Z | project: credit-dashboard-sut | type: feature | language: en-GB
@ui
Feature: Payment history page
  A customer can see, year by year, whether payments were made on time and which ones were missed.
  Covers UI specification v5, section 6.3.

  Background:
    Given Alex holds the "struggling" persona
    And today is 3 October 2026
    And Alex is viewing the payment history for "Bureau A"

  @BR-12
  Scenario: The current year is chosen first
    Then seven years are offered, from 2020 to 2026
    And 2026 is chosen

  @BR-12
  Scenario: Choosing a year shows its missed payments
    When Alex chooses 2024
    Then Alex sees 3 missed payments, all on the Lender Y loan

  Scenario: A year with no missed payments says so
    When Alex chooses 2023
    Then Alex is told there were no missed payments in 2023
