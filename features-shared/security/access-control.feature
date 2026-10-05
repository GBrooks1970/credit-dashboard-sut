# version: 1 | created: 2026-10-05T20:41Z | project: credit-dashboard-sut | type: feature | language: en-GB
# Moved unchanged from api/account-totals.feature v4 at CDS-09 (README 'Where Phase 0 files land').
@security @api
Feature: Access to other customers' accounts
  A customer can read only the accounts in their own report; anything else looks as if it does not exist.

  Background:
    Given Alex holds the "drilldown" persona

  @BR-15
  Scenario: Another customer's account cannot be found
    Given Sam holds the "excellent" persona
    When Alex asks for one of Sam's accounts
    Then the account is not found
