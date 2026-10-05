# version: 1 | created: 2026-10-04T13:01Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Masked account numbers
  Account numbers leave the service only as a short mask, in one format, whatever the source supplied.

  Background:
    Given Alex holds the "drilldown" persona

  @BR-09
  Scenario Outline: Source numbers are masked to their last four characters
    Given the source supplies the account number "<source>"
    When Alex asks for that account
    Then the account number is shown as "<masked>"
    Examples:
      | source   | masked |
      | 12345678 | *5678  |
      | 4821     | *4821  |
      | **10     | *0010  |
      | ab3f     | *AB3F  |

  @BR-09 @security
  Scenario: The full account number is never returned
    Given the source supplies the account number "12345678"
    When Alex asks for that account
    Then no response contains "12345678"
