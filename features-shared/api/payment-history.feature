# version: 2 | created: 2026-10-04T18:09Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Payment history
  Payment history covers the current year and the six before it, and gives each year one status.

  Background:
    Given Alex holds the "struggling" persona

  @BR-12
  Scenario: Seven years are covered
    Given today is 3 October 2026
    When Alex asks for the payment history for "Bureau A"
    Then the years 2020 to 2026 are covered

  @BR-12
  Scenario: The window moves on with the date
    Given today is 1 January 2027
    When Alex asks for the payment history for "Bureau A"
    Then the years 2021 to 2027 are covered

  @BR-12
  Scenario Outline: Each year has one status
    Given today is 3 October 2026
    And Alex's payments in 2025 were <payments>
    When Alex asks for the payment history for "Bureau A"
    Then 2025 is marked <status>
    Examples:
      | payments                              | status  |
      | all on time                           | on time |
      | on time, apart from one missed month  | missed  |
      | not reported in any month             | no data |
      | on time in the months reported        | on time |
  # The last row mixes on-time and no-data months with no missed month: on time
  # (DR-014, decision brief 1 D4).
