# version: 3 | created: 2026-10-07T12:50Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Accounts in credit
  An account that is in credit reports a negative balance, and its utilisation never drops below zero.

  # How an account in credit is displayed is DR-018 (ui/account-drilldown.feature, 'A card in credit says so').
  # These scenarios cover only what the API returns.

  Background:
    Given Alex holds the "drilldown" persona

  @BR-06
  Scenario: A card in credit reports a negative balance
    Given Alex has a credit card with a balance of -44.00 and a limit of 1000.00
    When Alex asks for that account
    Then the balance is -44.00
    And the utilisation is 0%
    And the unfloored utilisation is -4%
