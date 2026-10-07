---
version: 1
created: 2026-10-07T19:46Z
project: credit-dashboard-sut
type: design-cases
language: en-GB
---

# Credit Dashboard SUT: Business-rule cases (BR-01 to BR-15)

**Purpose.** For each business rule in [API specification](api-specification.md) section 7, the inputs, the output and every boundary row the rule's unit tests must cover (CDS-20). Written before the library, so the cases come from the specification and its decisions, not from the code. Each row becomes one NUnit test tagged `[Category("BR-nn")]`; a gate test fails if a rule has no tagged test (plan `2026-10-07_cds-20-business-rules-library.md`).

**Companion:** the Gherkin scenarios in `features-shared/api/` assert the same rules through the API in Phase 3; these cases assert them one level down, with no web host.

## Conventions

| Topic | Convention |
|---|---|
| Money | Integer minor units in a `long`; currency is carried but never converted. All arithmetic is integer: no floating point anywhere in the library |
| Today | A `DateOnly`, the UTC date of the controlled clock. The service derives it; the library has no clock (spec section 6.5). Clock time of day is CDS-24's Note and does not enter the library |
| Months | `YearMonth` (year, month), compared and stepped without day arithmetic |
| Rounding | "Half up" is round half towards positive infinity: `floor(x + 1/2)`, done in integers (D2, below) |
| Results | A rule that can reject returns a result type naming the outcome (for example `OutOfRange`); it never throws for bad input. The service maps outcomes to Problem types (spec section 8) |
| Readings | A row marked **Reading** is how the spec's wording is read where it is silent. It is reviewed with this document; a reading the owner rejects changes the row before any code |

## BR-01: score range

Output: whether an integer is a valid score or benchmark.

| Case | Input | Output |
|---|---|---|
| Lowest | 0 | valid |
| Highest | 1000 | valid |
| Below | -1 | invalid |
| Above | 1001 | invalid |
| Typical | 612 | valid |

## BR-02: score history

Input: range (`3m`, `6m`, `1y`), the current month, the known scores by month. Output: 3, 6 or 12 points, oldest first, ending at the current month; a month with no score has `null`, never the previous score.

| Case | Input | Output |
|---|---|---|
| Three months | `3m`, 2026-10, all known | 2026-08, 2026-09, 2026-10 |
| Six months | `6m`, 2026-10 | 2026-05 to 2026-10 |
| Twelve months | `1y`, 2026-10 | 2026-11 of 2025 to 2026-10 |
| Year boundary | `3m`, 2026-01 | 2025-11, 2025-12, 2026-01 |
| Gap in the middle | `6m`, 2026-07 unknown | 2026-07 is `null`, its neighbours are their own scores |
| Gap at the oldest end | `3m`, 2026-08 unknown | first point `null` (nothing carried forward) |
| Gap at the current month | `3m`, 2026-10 unknown | last point `null` |
| Every month unknown | `3m` | three `null` points |
| Range not allowed | `2m` | rejected (a shape error, caught at the edge; the library refuses it too) |

## BR-03: utilisation

Input: balance and limit (minor units). Output: the raw utilisation integer, or `null`. Raw = balance × 100 / limit, rounded half up; limit of zero or no limit gives `null`; no upper bound (DR-013).

| Case | Balance / limit | Output |
|---|---|---|
| Typical | 42360 / 510000 (8.31) | 8 |
| Exactly half rounds up | 1250 / 10000 (12.5) | 13 |
| One part in two hundred | 1 / 200 (0.5) | 1 |
| Just under half | 4949 / 10000 (49.49) | 49 |
| Zero balance | 0 / 10000 | 0 |
| At the limit | 10000 / 10000 | 100 |
| Just over the limit | 10001 / 10000 (100.01) | 100 |
| Over the limit | 11500 / 10000 | 115 |
| Zero limit | 0 / 0 | `null` |
| Zero limit, a balance | 500 / 0 | `null` |
| No limit | 500 / none | `null` |
| In credit | -4400 / 100000 (-4.4) | -4 |
| Negative exact half | -450 / 10000 (-4.5) | -4 (D2) |
| Negative, larger half | -550 / 10000 (-5.5) | -5 (D2) |
| Negative, just over half | -4501 / 100000 (-4.501) | -5 |
| Tiny credit | -50 / 10000 (-0.5) | 0 (D2) |
| Large values | 9 000 000 000 / 10 000 000 000 | 90, with no overflow |

## BR-06: accounts in credit

Input: the raw utilisation from BR-03 and the balance. Output: the displayed `utilisation` (floored at 0), the `utilisationRaw` kept as is, and the balance returned as a negative integer.

| Case | Raw | Output |
|---|---|---|
| In credit | -4 | `utilisation` 0, `utilisationRaw` -4, balance -4400 stays -4400 |
| Zero | 0 | 0 and 0 |
| Positive | 8 | 8 and 8 |
| Over the limit | 115 | 115 and 115 |
| No utilisation | `null` | `null` and `null` |

## BR-04: type totals

Input: the accounts of one type. Output: the summed balance, the summed limit and the utilisation of the totals (BR-03). Only open accounts with `includedInTotals` true count. A negative balance is summed as it is.

| Case | Input | Output |
|---|---|---|
| Two included cards | 10000/50000 and 20000/50000 | 30000, 100000, 30 |
| One not included | a second account with `includedInTotals` false | ignored |
| A closed account | closed, balance 0 | ignored |
| A balance in credit | 10000/50000 and -2000/50000 | 8000, 100000, 8 |
| Limit sums to zero | two accounts, limit 0 | balance summed, limit 0, utilisation `null` |
| No account counts | an empty list | 0, 0, `null` |
| Rounding applies to the total | balance 1, limit 200 | utilisation 1 (BR-03 half up) |

## BR-05: loans without a limit

Input: an account. Output: whether it is `includedInTotals`, and, for the totals response, the separate `excluded` list.

| Case | Input | Output |
|---|---|---|
| Loan without a limit | type `loan`, no limit | not included; listed in `excluded` |
| Loan with a limit | type `loan`, limit 500000 | included |
| Another type without a limit | a utilities account with no limit | included (the rule is about loans) |
| **Reading**: a limit of zero | type `loan`, limit 0 | included (a limit of zero is a limit; BR-03 gives it `null` utilisation) |
| Excluded loan in a totals request | the `drilldown` loan | appears only in `excluded`, never in the sums |

## BR-07: total debt, trend and breakdown

Input: the accounts and each account's balance three months earlier. Output: total debt, trend and `byType`. Total = the sum of positive balances of open accounts with `includedInTotals` true, excluding current accounts. Trend: a change of at most 1% either way, unrounded, is `steady` (DR-011). `byType`: one entry per type above zero, in enum order (DR-046).

| Case | Input | Output |
|---|---|---|
| Exactly +1% | earlier 10000, now 10100 | `steady` |
| Exactly -1% | earlier 10000, now 9900 | `steady` |
| Just over +1% | earlier 10000, now 10101 | `up` |
| Just under -1% | earlier 10000, now 9899 | `down` |
| Large values, exact comparison | earlier 1 000 000 000, now 1 010 000 000 | `steady` (the test is integer: 100 × difference ≤ earlier) |
| Earlier zero, now zero | 0, 0 | `steady` |
| Earlier zero, now positive | 0, 5000 | `up` |
| Now zero, earlier positive | 5000, 0 | `down` |
| A balance in credit | one card at -4400 | not in the total |
| A current account | positive balance | not in the total |
| Not included | `includedInTotals` false | not in the total |
| A closed account | closed | not in the total |
| Breakdown order | a mortgage and a card | card first, then mortgage (enum order) |
| Breakdown omits zero | a type whose positive balances sum to zero | no entry |
| Breakdown sums to the total | any of the above | the entries add up to total debt |
| **Reading**: earlier balance missing | an account with no point three months back | contributes nothing to the earlier total |

## BR-08: days until the next refresh

Input: today and the bureau's next refresh date. Output: whole days, minimum 0.

| Case | Today / refresh | Output |
|---|---|---|
| Same day | 2026-10-03 / 2026-10-03 | 0 |
| Tomorrow | 2026-10-03 / 2026-10-04 | 1 |
| Past | 2026-10-05 / 2026-10-03 | 0 |
| Across a month | 2026-10-03 / 2026-11-02 | 30 |
| Across a leap day | 2028-02-28 / 2028-03-01 | 2 |
| Across a year | 2026-12-31 / 2027-01-01 | 1 |

## BR-09: masked number

Input: a source string. Output: `*` plus the last four characters of the source once every character other than ASCII letters and digits is removed, uppercased, left-padded with `0` to four (`^\*[A-Z0-9]{4}$`).

| Case | Source | Output |
|---|---|---|
| Four digits | `4821` | `*4821` |
| Longer, separators | `1234-5678-9012-4821` | `*4821` |
| Letters | `ab3f` | `*AB3F` |
| Mixed case | `aB12` | `*AB12` |
| Too short | `12` | `*0012` |
| Empty | (empty) | `*0000` |
| Only separators | `----` | `*0000` |
| Malformed (the `drilldown` fixture) | `**10` | `*0010` |
| Separators inside the last four | `12 34` | `*1234` |
| One character | `a` | `*000A` |
| Five characters | `abcde` | `*BCDE` |
| **Reading**: a non-ASCII letter | `é1234` | `*1234` (only A to Z and 0 to 9 survive, as the pattern requires) |

## BR-10: summary feedback

Input: the stored value and the requested value. Output: the new stored value. Values: `like`, `dislike`, `none`; setting one replaces the other.

| Case | Stored, requested | Output |
|---|---|---|
| Like from none | none, like | like |
| Dislike replaces like | like, dislike | dislike |
| Like replaces dislike | dislike, like | like |
| Clear | like, none | none |
| Same again | like, like | like |
| Not a value | like, `love` | rejected |

## BR-11: changes

Input: a list of changes with dates. Output: the list newest first; the overview's `recentChanges` is the three newest, and `changesTotal` is the full count.

| Case | Input | Output |
|---|---|---|
| Already sorted | three, newest first | same order |
| Unsorted | the `br11-unsorted-changes` sample | newest first |
| Overview of many | 25 changes | three newest in `recentChanges`; `changesTotal` 25 |
| Overview of two | 2 changes | both; `changesTotal` 2 |
| Overview of none | none | empty; `changesTotal` 0 |
| Same date | two changes on one date | their original order is kept (a stable sort) |

## BR-12: payment history

Input: each account's missed months, opened and closed dates, and today. Output per account and per report: a status for each month, then a status for each year in the window (the current year and the six before it).

Month, one account: `missed` if in `missedMonths`; `no-data` if before the month of the opened date, after the month of the closed date, or after the current month; otherwise `on-time`. Across a report: `missed` if any account missed it; otherwise `on-time` if any was on time; otherwise `no-data`. Year: any `missed` month gives `missed`; only `no-data` months give `no-data`; every other year, including one mixing `on-time` and `no-data`, gives `on-time` (DR-014).

| Case | Input | Output |
|---|---|---|
| All on time | open since 2019, nothing missed | every month `on-time`; year `on-time` |
| One missed month | 2026-03 missed | that month `missed`; year `missed` |
| Before the account opened | opened 2026-05 | months to 2026-04 `no-data` |
| The opening month itself | opened 2026-05-31 | 2026-05 is `on-time` |
| After the account closed | closed 2026-03-01 | months from 2026-04 `no-data` |
| The closing month itself | closed 2026-03-01 | 2026-03 is `on-time` |
| After the current month | today 2026-10-03 | 2026-11 `no-data` |
| Year of all no-data | opened after the year | year `no-data` |
| Year mixing on-time and no-data | opened mid-year | year `on-time` (DR-014) |
| Report, two accounts, one missed | month missed by one | `missed` |
| Report, one on time, one no-data | | `on-time` |
| Report, none with data | | `no-data` |
| Window | today 2026-10-03 | years 2020 to 2026, seven in all |
| Window across a year end | today 2027-01-01 | years 2021 to 2027 |
| Missed month outside the window | 2018-05 | not counted (the fixture check rejects it; the library ignores it) |

## BR-13: closed accounts

Input: a closed account's close date and today. Output: whether it is listed, and the balance reported (always 0). Listed while today is before the close date plus six calendar years; a 29 February close drops off on 28 February (DR-012).

| Case | Close date / today | Output |
|---|---|---|
| Well inside | 2024-05-10 / 2026-10-03 | listed |
| The day before the sixth anniversary | 2020-10-03 / 2026-10-02 | listed |
| The sixth anniversary | 2020-10-03 / 2026-10-03 | not listed |
| After | 2020-10-03 / 2026-10-04 | not listed |
| Leap-day close, day before | 2020-02-29 / 2026-02-27 | listed |
| Leap-day close, drop-off | 2020-02-29 / 2026-02-28 | not listed |
| Leap-day close in a leap target year | 2016-02-29 / 2022-02-28 | not listed (2022 is not a leap year) |
| Reported balance | any closed account with a stored balance | 0 |

## BR-14: user-supplied details

Input: a field and a value. Output: valid or `OutOfRange`. `interestRate` and `apr`: 0 to 100, up to two decimal places; `promoPeriodMonths`: whole 0 to 60; `minPayment`: `amountMinor` at least 0, or `percent` 0 to 100.

| Case | Field, value | Output |
|---|---|---|
| Lowest rate | `apr` 0 | valid |
| Highest rate | `apr` 100 | valid |
| Two decimals | `interestRate` 29.99 | valid |
| One decimal | `interestRate` 29.9 | valid |
| Over | `apr` 100.01 | `OutOfRange` |
| Below | `apr` -0.01 | `OutOfRange` |
| Three decimals | `apr` 29.999 | `OutOfRange` |
| Promo lowest | `promoPeriodMonths` 0 | valid |
| Promo highest | `promoPeriodMonths` 60 | valid |
| Promo over | `promoPeriodMonths` 61 | `OutOfRange` |
| Promo below | `promoPeriodMonths` -1 | `OutOfRange` |
| Promo fractional | `promoPeriodMonths` 1.5 | `OutOfRange` |
| Minimum payment amount, zero | `amountMinor` 0 | valid |
| Minimum payment amount, negative | `amountMinor` -1 | `OutOfRange` |
| Minimum payment percent, ends | `percent` 0 and 100 | valid |
| Minimum payment percent, over | `percent` 100.01 or 101 | `OutOfRange` |
| Minimum payment percent, below | `percent` -1 | `OutOfRange` |

## BR-15: ownership

Input: an account ID and the IDs in the signed-in user's persona. Output: found, or not found. Anything else is not found (404, never 403), so IDs cannot be probed.

| Case | Input | Output |
|---|---|---|
| Own account | an ID in the persona | found |
| Another persona's account | an ID in a different persona | not found |
| Unknown ID | `acc_nope00` | not found |
| Same text, different case | the owned ID in upper case | not found (IDs are opaque and compared exactly) |
| Empty ID | (empty) | not found |
| Persona with no accounts | `thin-file` | every ID not found |

## Fixture parity

A test loads the seven personas (28 accounts) from `fixtures/personas/` and recomputes, for every account: `utilisation` and `utilisationRaw` (BR-03, BR-06), `maskedNumber` from `sourceMask` where present (BR-09), the loan rule (BR-05), the closed-account balance (BR-13) and each bureau's change order (BR-11). It fails on any difference from the stored value. The override samples in `fixtures/overrides/` are not re-implemented here: the JS fixture check already applies them.

## Decisions recorded with this document

- **D2 (CDS-20 plan):** "half up" means half towards positive infinity, so -4.5 gives -4 and -5.5 gives -5. The specification's BR-03 now says so (API specification v16). No fixture contains an exact negative half, so no stored value changes.
- **Readings** (BR-05 zero limit, BR-07 missing earlier point, BR-09 non-ASCII letters) are the rows marked **Reading**. They are open to correction when this document is reviewed.
