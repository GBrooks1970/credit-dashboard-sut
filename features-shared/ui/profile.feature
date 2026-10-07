# version: 5 | created: 2026-10-07T13:05Z | project: credit-dashboard-sut | type: feature | language: en-GB
@ui @profile
Feature: My profile
  A customer can see what the app holds about them, choose how the app addresses them,
  and keep their contact details current.
  Covers the My Profile UI feature spec (UI specification, section 6.9).

  Background:
    Given Alex holds the "excellent" persona
    And Alex is viewing their profile

  @PR-01
  Scenario: Legal details cannot be changed here
    Then Alex sees their legal name and date of birth
    And neither can be edited
    When Alex opens the name information
    Then Alex is told that it matches the credit report

  @PR-02 @PR-03
  Scenario: Alex sets a preferred name
    When Alex sets their preferred name to "Ally"
    Then Alex is told the change is saved
    And the app greets Alex as "Ally"
    But the credit report still shows Alex's legal name

  @PR-02
  Scenario Outline: Preferred name rules
    When Alex tries to set their preferred name to "<name>"
    Then the preferred name is <outcome>
    Examples:
      | name                            | outcome          |
      | Jo-Ann                          | saved as Jo-Ann  |
      | R2D2                            | refused          |
      | Alexandra-Catherine Montgomeryx | refused          |

  @PR-02
  Scenario: Spaces around a preferred name are removed
    When Alex sets their preferred name to "Sam" with spaces either side
    Then the preferred name is saved as Sam

  @PR-02
  Scenario: Clearing the preferred name
    Given Alex's preferred name is "Al"
    When Alex clears their preferred name
    Then the app greets Alex by their legal first name

  @PR-04
  Scenario: A changed email needs verifying again
    Given Alex's email is verified
    When Alex changes their email to "alex.new@example.com"
    Then the email shows as unverified

  Scenario: A missing mobile number is shown as not added
    Given Sam holds the "thin-file" persona
    And Sam is viewing their profile
    Then the mobile tile shows "Not added"

  @PR-10
  Scenario: A mobile number added on the mobile sub-page is verified with its code
    Given Sam holds the "thin-file" persona
    And Sam is viewing their profile
    When Sam adds the mobile number "07700 900456"
    And Sam enters the code 123456
    Then the mobile tile shows "Verified"

  @PR-07
  Scenario: Finance figures stay off the profile overview
    Given Alex has added their finances
    Then the finances tile shows "Added"
    And no amounts are shown on the profile

  # PR-08 covers URLs, page titles and client-side logs. Logs are left to component tests (decision brief 4 D6).
  @PR-08 @security
  Scenario: Profile details stay out of the page title and address
    Then the page title contains none of Alex's legal name, email address or mobile digits
    And the page address contains none of them either
