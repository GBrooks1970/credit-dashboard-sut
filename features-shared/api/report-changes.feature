# version: 2 | created: 2026-10-05T20:00Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api
Feature: Report changes
  Changes to a report are listed newest first, and the overview carries only the latest few.

  Background:
    Given Alex holds the "excellent" persona

  @BR-11
  Scenario: Changes are listed newest first
    Given Alex has report changes dated 14 September 2026 and 28 September 2026
    When Alex asks for the report changes for "Bureau A"
    Then the changes are dated 28 September 2026 and 14 September 2026, in that order

  # Arranged by test-control overrides (DR-020): the changes arrive out of date order, so the
  # service must sort them. Sample: fixtures/overrides/br11-unsorted-changes.json.
  @BR-11
  Scenario: Changes that arrive out of order are listed newest first
    Given Alex's report changes arrive dated 15 July 2026, 28 September 2026 and 31 August 2026
    When Alex asks for the report changes for "Bureau A"
    Then the changes are dated 28 September 2026, 31 August 2026 and 15 July 2026, in that order

  @BR-11
  Scenario: The overview carries the three newest changes and the full count
    Given Sam holds the "drilldown" persona
    And Sam has 5 report changes
    When Sam asks for the report overview for "Bureau A"
    Then the 3 newest changes are included
    And the change count reads 5
