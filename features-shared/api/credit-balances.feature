# version: 2 | created: 2026-10-05T20:00Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Credit balances
  An account that is in credit reports a negative balance, and its utilisation never drops below zero.

  # How a credit balance is displayed is DR-005, still open (backlog CDS-02).
  # These scenarios cover only what the API returns, which DR-005 does not change.

  Background:
    Given Alex holds the "drilldown" persona

  @BR-06
  Scenario: A card in credit reports a negative balance
    Given Alex has a credit card with a balance of -44.00 and a limit of 1000.00
    When Alex asks for that account
    Then the balance is -44.00
    And the utilisation is 0%
    And the unfloored utilisation is -4%
