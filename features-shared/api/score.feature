# version: 2 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Credit score scale
  Every score and benchmark sits on one 0 to 1000 scale, so scores from different bureaux can be compared.

  Background:
    Given Alex holds the "boundary" persona

  @BR-01
  Scenario Outline: Scores at either end of the scale are reported exactly
    When Alex asks for the score from "<bureau>"
    Then the score is <score> out of 1000
    Examples:
      | bureau   | score |
      | Bureau A | 0     |
      | Bureau B | 1000  |

  @BR-01
  Scenario: Benchmarks share the score's scale
    When Alex asks for the score from "Bureau A"
    Then the national and local averages are each between 0 and 1000

  # Sam holds a different persona from the background: drilldown's history has no score for January 2026.
  @BR-02
  Scenario: A month with no score is reported as missing, not carried forward
    Given Sam holds the "drilldown" persona
    And today is 3 October 2026
    When Sam asks for the score history from "Bureau A" over 1 year
    Then 12 monthly points are returned
    And the score for January 2026 is missing
