# version: 4 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Total debt
  Total debt counts what is owed on open accounts that count towards totals, and shows which way it is moving.

  Background:
    Given Alex holds the "drilldown" persona

  @BR-07
  Scenario: Only money owed on included accounts counts as debt
    Given Alex owes 423.60 on a credit card
    And Alex owes 12524.00 on a loan with a limit
    And Alex owes 1161.00 on a loan with no limit
    And Alex owes 185000.00 on a mortgage
    And Alex owes 32.00 on a utilities and telecoms account
    And Alex owes 300.00 on a credit account
    And Alex has a credit card that is 44.00 in credit
    When Alex asks for the debt overview
    Then the total debt is 198279.60
    And the debt on credit cards is 423.60

  # Arranged by test-control overrides (DR-020): these two accounts replace the persona's.
  # Sample: fixtures/overrides/br07-current-account.json.
  @BR-07
  Scenario: An overdraft on a current account does not count as debt
    Given Alex's only accounts are a credit card owing 423.60 and a current account overdrawn by 250.00
    When Alex asks for the debt overview
    Then the total debt is 423.60

  # Exactly 1% either way is steady (DR-011, decision brief 1 D1). From an earlier total
  # of zero there is no percentage: steady if still zero, otherwise up.
  @BR-07
  Scenario Outline: The trend compares today's debt with three months earlier
    Given Alex's total debt three months ago was <earlier>
    And Alex's total debt now is <now>
    When Alex asks for the debt overview
    Then the debt trend is <trend>
    Examples:
      | earlier | now     | trend  |
      | 1000.00 | 1005.00 | steady |
      | 1000.00 | 995.00  | steady |
      | 1000.00 | 1011.00 | up     |
      | 1000.00 | 989.00  | down   |
      | 1000.00 | 1010.00 | steady |
      | 1000.00 | 990.00  | steady |
      | 0.00    | 0.00    | steady |
      | 0.00    | 25.00   | up     |
