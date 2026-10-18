# version: 7 | created: 2026-10-12T09:49Z | project: credit-dashboard-sut | type: feature | language: en-GB
@ui
Feature: Report overview
  The overview gives a customer their score, how it compares, and a route into every part of the report.
  Covers the UI specification, section 6.2.

  Background:
    Given Alex holds the "excellent" persona
    And Alex is viewing the report for "Bureau A"

  Scenario: Score and benchmarks are shown
    Then Alex sees a score of 720 out of 1000
    And the national average reads 600

  @BR-02
  Scenario Outline: Score history range
    When Alex chooses the <range> range
    Then the chart shows <points> monthly points
    Examples:
      | range    | points |
      | 3 months | 3      |
      | 6 months | 6      |
      | 1 year   | 12     |

  @BR-10
  Scenario: Summary feedback is remembered
    When Alex likes the report summary
    And Alex returns to the report later
    Then the summary is still marked as liked
    And it is not marked as disliked

  @BR-11
  Scenario: Only the three newest changes are shown at first
    Given Sam holds the "drilldown" persona
    And Sam is viewing the report for "Bureau A"
    Then 3 changes are listed
    When Sam shows all changes
    Then 5 changes are listed

  @BR-08
  Scenario Outline: Next update wording
    Given the next bureau refresh is <days> away
    When Alex returns to the report later
    Then Alex is told the report updates in <wording>
    Examples:
      | days   | wording |
      | 0 days | 0 days  |
      | 1 day  | 1 day   |
      | 2 days | 2 days  |

  # The drawer makes the rest of the page inert while it is open. A browser refuses to focus an inert element, so focus must go back
  # after the page is live again (CDS-38 R2-C-01): a component test cannot see this.
  Scenario Outline: The chat drawer gives focus back
    When Alex opens the chat drawer
    And Alex closes the chat drawer with <closer>
    Then the focus is on the chat button
    Examples:
      | closer           |
      | Escape           |
      | the Close button |
