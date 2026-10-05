# version: 5 | created: 2026-10-05T20:41Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Account type totals
  Summary figures for each account type follow the totals and utilisation rules,
  so the overview card and the type list always agree.

  Background:
    Given Alex holds the "drilldown" persona

  @BR-03 @BR-04
  Scenario Outline: Utilisation rounds half up
    Given Alex has a credit card with a balance of <balance> and a limit of <limit>
    When Alex asks for the credit card totals
    Then the total utilisation is <utilisation>%
    Examples:
      | balance | limit   | utilisation |
      | 49.50   | 100.00  | 50          |
      | 49.49   | 100.00  | 49          |
      | 0.00    | 500.00  | 0           |
      | 500.00  | 500.00  | 100         |
      | 1150.00 | 1000.00 | 115         |

  @BR-05
  Scenario: Loans without a limit stay out of the totals
    Given Alex has a loan of 12524.00 against 15000.00 borrowed
    And Alex owes 1161.00 on a loan with no limit
    When Alex asks for the loan totals
    Then the total remaining is 12524.00
    And the loan of 1161.00 is listed as excluded

  @BR-03
  Scenario: A zero limit gives no utilisation
    Given Alex has a credit card with a balance of 0.00 and a limit of 0.00
    When Alex asks for the credit card totals
    Then no utilisation is reported

  # The BR-15 scenario moved to features-shared/security/access-control.feature (CDS-09).
