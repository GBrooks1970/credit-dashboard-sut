# version: 4 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
@ui
Feature: Debt overview page
  A customer can see how much they owe, which way it is moving, and where it sits.
  Covers the UI specification, section 6.7.

  Background:
    Given Alex holds the "drilldown" persona
    And today is 3 October 2026

  @BR-07
  Scenario: Total debt and its trend are shown
    When Alex views the debt overview
    Then the total debt is 198279.60
    And the debt trend is down

  @BR-07
  Scenario Outline: Debt is broken down by account type
    When Alex views the debt overview
    Then the debt on <type> is <amount>
    Examples:
      | type                   | amount    |
      | credit cards           | 423.60    |
      | loans                  | 12524.00  |
      | mortgages              | 185000.00 |
      | utilities and telecoms | 32.00     |
      | credit accounts        | 300.00    |
