# version: 4 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
@ui
Feature: Report changes page
  A customer can read every change to their report, narrow the list to one kind, and share what they are looking at.
  Covers the UI specification, section 6.7.

  Background:
    Given Alex holds the "drilldown" persona

  Scenario: Changes can be narrowed to one kind
    Given Alex is viewing the report changes for "Bureau A"
    When Alex shows only positive changes
    Then 2 changes are listed
    And every change listed is positive

  Scenario: A narrowed list can be opened again from its address
    Given Alex is viewing the report changes for "Bureau A"
    And Alex shows only positive changes
    When Alex opens the same address later
    Then only positive changes are listed

  Scenario: A short list fits on one page
    Given Alex has 5 report changes
    And Alex is viewing the report changes for "Bureau A"
    Then 5 changes are listed
    And there is no next page

  # Arranged by test-control overrides (DR-020): 25 changes replace the persona's 5.
  # Sample: fixtures/overrides/changes-twenty-five.json.
  Scenario: Long lists are shown 20 at a time
    Given Alex's report has 25 changes
    And Alex is viewing the report changes for "Bureau A"
    Then 20 changes are listed
    When Alex moves to the next page
    Then 5 changes are listed
