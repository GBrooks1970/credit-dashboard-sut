# version: 4 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
@ui
Feature: Personal details page
  A customer can check the personal details the bureau holds about them. The bureau owns them, so they are read-only here.
  Covers the UI specification, section 6.7. The editable account profile is a different page (profile.feature).

  Background:
    Given Alex holds the "drilldown" persona

  Scenario: Current and previous addresses are shown
    When Alex views the personal details for "Bureau A"
    Then Alex sees 1 current address and 2 previous addresses
    And Alex is shown as on the electoral roll

  Scenario: Personal details cannot be changed here
    When Alex views the personal details for "Bureau A"
    Then none of the personal details can be edited
