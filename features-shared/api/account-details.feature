# version: 1 | created: 2026-10-07T12:50Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Account details the customer supplies
  A customer can record details the bureau does not supply, within the limits the rules set.
  Covers the API specification, section 6.3 (PATCH /accounts/{accountId}/details) and BR-14.

  Background:
    Given Alex holds the "drilldown" persona

  # The UI's client check stops some of these values first (ui/account-details-form.feature); the API must refuse them too.
  @BR-14
  Scenario Outline: An interest rate is 0 to 100 with up to two decimal places
    When Alex sets the interest rate on the Lender X card to <rate>
    Then the interest rate is <outcome>
    Examples:
      | rate    | outcome  |
      | 0%      | accepted |
      | 100%    | accepted |
      | 100.01% | refused  |
      | 29.999% | refused  |
