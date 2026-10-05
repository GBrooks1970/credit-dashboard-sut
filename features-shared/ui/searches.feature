# version: 3 | created: 2026-10-05T20:00Z | project: credit-dashboard-sut | type: feature | language: en-GB
@ui
Feature: Searches page
  A customer can see which organisations have searched their report, hard and soft searches apart.
  Covers UI specification v5, section 6.7.

  Scenario: Hard searches are listed
    Given Alex holds the "struggling" persona
    When Alex views the hard searches for "Bureau A"
    Then 3 hard searches are listed

  Scenario: Soft searches are kept apart from hard searches
    Given Alex holds the "drilldown" persona
    When Alex views the soft searches for "Bureau A"
    Then 1 soft search is listed
    And no hard search is listed

  Scenario: An empty list is explained
    Given Alex holds the "thin-file" persona
    When Alex views the hard searches for "Bureau A"
    Then Alex is told there are no hard searches
