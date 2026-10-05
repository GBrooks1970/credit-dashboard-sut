# version: 2 | created: 2026-10-04T18:09Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Closed accounts
  Closed accounts stay on the report for six years from the day they closed, with nothing owing.

  Background:
    Given Alex holds the "struggling" persona
    And today is 3 October 2026

  @BR-13
  Scenario: A closed account reports nothing owing
    Given Alex has a credit card that closed on 31 May 2022
    When Alex asks for the closed accounts for "Bureau A"
    Then the credit card is listed
    And its balance is 0.00

  # An account drops off on the sixth anniversary of its close date (DR-012, decision
  # brief 1 D2). The 29 February case is a unit test of the date rule, not a scenario.
  @BR-13
  Scenario Outline: Closed accounts drop off after six years
    Given Alex has a credit card that closed on <closed>
    When Alex asks for the closed accounts for "Bureau A"
    Then the credit card is <shown>
    Examples:
      | closed         | shown      |
      | 4 October 2020 | listed     |
      | 2 October 2020 | not listed |
      | 3 October 2020 | not listed |
