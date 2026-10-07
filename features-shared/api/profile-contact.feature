# version: 2 | created: 2026-10-07T10:25Z | project: credit-dashboard-sut | type: feature | language: en-GB
@api @profile
Feature: Email and mobile verification
  A customer can change their email and add a mobile number, and each must be verified before it is trusted.
  Covers the My Profile UI feature spec, section 5, and the API specification, section 6.6.

  Background:
    Given Alex holds the "excellent" persona
    And today is 3 October 2026

  @PR-04
  Scenario: Submitting the email already held changes nothing
    Given Alex's email is verified
    When Alex changes their email to the address already held
    Then the email is still verified

  # A link is sent at 10:00:00 by the email change; resends are timed from it (PR-09).
  @PR-09
  Scenario Outline: A verification link cannot be resent within a minute
    Given Alex changed their email to "alex.new@example.com" at 10:00:00
    When Alex asks for another verification link at <time>
    Then the resend is <outcome>

    Examples:
      | time     | outcome |
      | 10:00:59 | refused |
      | 10:01:00 | sent    |

  @PR-09
  Scenario: A verified email is not resent
    Given Alex's email is verified
    When Alex asks for another verification link
    Then Alex is told the email is already verified

  @PR-06
  Scenario Outline: Only UK mobile numbers are accepted
    When Alex adds the mobile number "<number>"
    Then the number is <outcome>

    Examples:
      | number        | outcome                     |
      | 07700 900456  | held as unverified          |
      | +447700900456 | held as unverified          |
      | 01632 960456  | refused                     |

  @PR-10
  Scenario Outline: A code is valid for less than ten minutes
    Given Alex added the mobile number "07700 900456" at 10:00:00
    When Alex enters the code 123456 at <time>
    Then the mobile number is <state>

    Examples:
      | time     | state            |
      | 10:09:59 | verified         |
      | 10:10:00 | still unverified |

  @PR-11
  Scenario: A third wrong code voids the code
    Given Alex added the mobile number "07700 900456"
    When Alex enters a wrong code 3 times
    Then Alex is told to request a new code
    And the code 123456 is no longer accepted
