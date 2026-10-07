# version: 4 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
@ui
Feature: Signing in
  A customer signs in with the demo details and lands on their own report.
  Covers the UI specification, section 6.1.

  Background:
    Given Alex holds the "excellent" persona

  Scenario: Signing in opens the default report
    When Alex signs in
    Then Alex sees the report for "Bureau A"

  Scenario: A wrong password is refused
    When Alex signs in with the wrong password
    Then Alex is told the sign-in details were not recognised
    And Alex is still on the sign-in page

  @security
  Scenario: The session is not kept in the browser
    Given Alex has signed in
    When Alex reloads the page
    Then Alex is asked to sign in again
