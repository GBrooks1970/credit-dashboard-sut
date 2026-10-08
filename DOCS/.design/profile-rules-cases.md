---
version: 1
created: 2026-10-08T00:30Z
project: credit-dashboard-sut
type: design-cases
language: en-GB
---

# Credit Dashboard SUT: Profile-rule cases (PR-02 to PR-11)

**Purpose.** For each profile rule the API enforces ([API specification](api-specification.md) 6.6; rules in the [My Profile UI feature spec](ui-feature-profile.md) section 5), the inputs, the output and every boundary row the rule's unit tests must cover (CDS-27). Written before the library, as [business-rules-cases.md](business-rules-cases.md) was for BR-01 to BR-15. Each row becomes one NUnit test tagged `[Category("PR-nn")]`.

**Not covered here, and why.** PR-01 (read-only identity) is a design fact: no operation writes the legal name or date of birth, which the contract coverage test already holds. PR-05 (address history) is stretch (DR-022). PR-08 (no profile value in a path, query or log) is a design fact about route templates, not a function. The traceability gate lists all three as exempt, with these reasons.

## Conventions

| Topic | Convention |
|---|---|
| Time | A `DateTimeOffset` supplied by the caller: the controlled clock's current instant. The library has no clock |
| Results | Outcome types, never exceptions for bad input. The service maps outcomes to Problem types (specification section 8) |
| State | The library holds none. A caller passes the stored state in and gets the new state back |
| Readings | A row marked **Reading** is how the specification's wording is read where it is silent. It is reviewed with this document |

## PR-02: preferred name

Input: the submitted value. Output: `Cleared`, `Saved(value)` or `Rejected` (422 `preferred-name`). The value is trimmed first. Present means 1 to 30 characters of letters, spaces, hyphens and apostrophes. An empty string or null clears it. (A value over 100 characters, or not a string, is a 400 at the edge and never reaches the rule.)

| Case | Input | Output |
|---|---|---|
| A name | `Sam` | `Saved("Sam")` |
| Trimmed | `  Sam  ` | `Saved("Sam")` |
| Cleared by empty | (empty) | `Cleared` |
| Cleared by null | null | `Cleared` |
| Only spaces | `   ` | `Cleared` (**Reading**: trimming leaves empty, and empty clears) |
| One character | `S` | `Saved("S")` |
| Thirty characters | thirty letters | `Saved` |
| Thirty-one characters | thirty-one letters | `Rejected` |
| Thirty after trimming | thirty letters with spaces either side | `Saved` (the length is after trimming) |
| Hyphen | `Anne-Marie` | `Saved` |
| Apostrophe | `O'Neil` | `Saved` |
| Inner space | `Mary Jane` | `Saved` |
| Digit | `Sam2` | `Rejected` |
| Symbol | `Sam!` | `Rejected` |
| Accented letter | `Zoë` | `Saved` (**Reading**: letters are Unicode letters, so that real names are not refused) |
| Only a hyphen | `-` | `Saved` (**Reading**: the rule lists characters, not a minimum of letters) |

## PR-03: greeting

Input: the preferred name (or none) and the legal first name. Output: the greeting name. The preferred name replaces the legal first name when set (DR-036: `greetingName` on `GET /me`).

| Case | Input | Output |
|---|---|---|
| Preferred set | `Sam`, legal first name `Samuel` | `Sam` |
| No preferred name | none, `Samuel` | `Samuel` |
| Cleared | cleared, `Samuel` | `Samuel` |
| Legal first name | `Alex Example` | the first word, `Alex` (**Reading**: the legal first name is the text before the first space) |

## PR-04: changing the email address

Input: the stored address, its verification status, and the submitted address. Output: `Unchanged` or `Changed(address, Unverified, linkSent)`. Submitting the address already held is not a change: address and status are kept (DR-027). A different address is stored as unverified and a link is sent.

| Case | Stored, submitted | Output |
|---|---|---|
| Different address | `a@example.com` (verified), `b@example.com` | `Changed`, unverified, link sent |
| Same address | `a@example.com` (verified), `a@example.com` | `Unchanged`, still verified |
| Same address, unverified | `a@example.com` (unverified), `a@example.com` | `Unchanged`, still unverified, no new link |
| Different case | `a@example.com`, `A@Example.com` | `Unchanged` (**Reading**: the comparison ignores case) |
| Surrounding spaces | `a@example.com`, ` a@example.com ` | `Unchanged` (**Reading**: the submitted value is trimmed) |
| No address held | none, `b@example.com` | `Changed`, unverified, link sent |

## PR-06: UK mobile numbers

Input: the submitted text. Output: `Normalised("+44...")` or `Rejected` (422 `mobile-number`). `07` plus 9 digits, or `+447` plus 9 digits. Stored normalised to `+44`. **Spaces are ignored** (decision D1 of the CDS-27 plan; review Note F-15); no other separator is.

| Case | Input | Output |
|---|---|---|
| National form | `07700900456` | `+447700900456` |
| With spaces | `07700 900456` | `+447700900456` |
| International form | `+447700900456` | `+447700900456` |
| International with spaces | `+44 7700 900456` | `+447700900456` |
| Landline | `01632 960456` | `Rejected` |
| Too short | `0770090045` | `Rejected` |
| Too long | `077009004567` | `Rejected` |
| Letters | `07700 90045a` | `Rejected` |
| Hyphens | `07700-900456` | `Rejected` (D1: only spaces are ignored) |
| Missing plus | `447700900456` | `Rejected` |
| Empty | (empty) | `Rejected` |
| Only spaces | `   ` | `Rejected` |
| Last three digits | `+447700900456` | `456` (for the profile summary, PR-07) |

## PR-07: summaries

Input: the stored finances and mobile number. Output: the profile tiles. Finances report only whether they are added; the mobile number reports only its last three digits; no profile value is formatted into an amount.

| Case | Input | Output |
|---|---|---|
| Finances added | an income and a housing cost | `added: true`, no figures |
| Finances not added | none | `added: false` |
| Mobile held | `+447700900456` | last three digits `456` |
| No mobile | none | none |

## PR-09: resending the verification link

Input: the verification status, when the last link was sent, and now. Output: `Sent`, `AlreadyVerified` (422 `already-verified`) or `RateLimited(retryAfterSeconds)` (429). A link may be resent once at least 60 seconds have passed since the last was sent. An already verified email is not resent (DR-024).

| Case | Status, last sent, now | Output |
|---|---|---|
| Already verified | verified | `AlreadyVerified` (regardless of timing) |
| Immediately after | unverified, 09:00:00, 09:00:00 | `RateLimited(60)` |
| After 59 seconds | 09:00:00, 09:00:59 | `RateLimited(1)` |
| After exactly 60 seconds | 09:00:00, 09:01:00 | `Sent` |
| After 61 seconds | 09:00:00, 09:01:01 | `Sent` |
| After a long time | 09:00:00, one day later | `Sent` |
| No link sent yet | unverified, none | `Sent` |
| Clock moved back | 09:00:00, 08:59:00 | `RateLimited(120)` (**Reading**: the wait is measured from the last send even if the controlled clock was moved back) |

## PR-10: issuing and checking the code

Input: when the code was issued, the submitted code, and now. The code is always `123456` (DR-025). It is valid while less than 10 minutes have passed since issue.

| Case | Issued, submitted, now | Output |
|---|---|---|
| Correct, immediately | 09:00:00, `123456`, 09:00:00 | `Verified` |
| Correct, after 9 minutes 59 seconds | 09:00:00, `123456`, 09:09:59 | `Verified` |
| Correct, after exactly 10 minutes | 09:00:00, `123456`, 09:10:00 | `Invalid` (expired) |
| Correct, after 11 minutes | 09:00:00, `123456`, 09:11:00 | `Invalid` (expired) |
| New challenge | any number | code pending, 3 attempts remaining, expires at issue plus 10 minutes |
| A new number replaces a pending challenge | a second add | a fresh challenge with 3 attempts |

## PR-11: wrong codes

Input: the challenge state (or none), the submitted code, and now. Each wrong code is refused with the attempts remaining (422 `code-wrong`); the third wrong code voids the challenge and is refused as `code-invalid`, as is an expired or voided code or a code with nothing pending. `code-invalid` carries no `attemptsRemaining`: specification section 8 says only `code-wrong` does, and contract v11 removes the stray `attemptsRemaining: 0` from its example.

| Case | State, submitted | Output |
|---|---|---|
| First wrong code | 3 attempts, `000000` | `Wrong(attemptsRemaining: 2)` |
| Second wrong code | 2 attempts, `000000` | `Wrong(attemptsRemaining: 1)` |
| Third wrong code | 1 attempt, `000000` | `Invalid`, challenge voided |
| Correct code after a voided challenge | voided, `123456` | `Invalid` |
| Correct code after two wrong codes | 1 attempt, `123456` | `Verified` |
| A wrong code after an expired challenge | expired, `000000` | `Invalid` (expiry first) |
| Nothing pending | none, `123456` | `Invalid` |
| A wrong code with nothing pending | none, `000000` | `Invalid` |
| Verified challenge reused | verified, `123456` | `Invalid` (**Reading**: a verified challenge is no longer pending) |

## Decisions recorded with this document

- **D1 (CDS-27 plan):** spaces are ignored in a mobile number, hyphens are not.
- **D2:** the rules join `CreditDashboard.BusinessRules` (a `Profile/` folder) and its test project.
- **D3:** PR-03's greeting and PR-07's summaries are in scope.
- **Readings** are the rows marked **Reading**. They are open to correction at review.
