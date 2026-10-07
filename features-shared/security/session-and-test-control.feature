# version: 1 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
@security @api
Feature: Expired sessions and test control
  A session ends when its token expires, and the test-control surface does not exist unless it is switched on.
  Covers the API specification, sections 6.5 (test control) and 8 (401), and the 'Security' verification check.

  Scenario: An expired token is refused
    Given Alex holds the "excellent" persona
    And Alex's token has expired
    When Alex asks for the score from "Bureau A"
    Then Alex is refused as not signed in

  # No persona is bound here: binding is itself a test-control call (DR-008).
  Scenario: Test control is off by default
    Given test control is switched off
    When the clock is set through test control
    Then test control is not found
