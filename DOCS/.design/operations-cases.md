---
version: 1
created: 2026-10-08T10:02Z
project: credit-dashboard-sut
type: design-cases
language: en-GB
---

# Credit Dashboard SUT: Operation cases (the 29 business operations)

**Purpose.** For each business operation of the [contract](../.architecture/openapi.yaml), how its response is composed from the bound persona's data and the rule libraries, the checks that come before it, and the cases its tests must cover (CDS-25). Written before the service code, as [business-rules-cases.md](business-rules-cases.md) and [profile-rules-cases.md](profile-rules-cases.md) were for the rules. The decisions are those of decision brief 9 (D1 to D8).

**Companions.** [API specification](api-specification.md) (conventions, rules, error catalogue); the contract wins where they disagree.

## 1. Conventions

| Topic | Convention |
|---|---|
| The bound document | Each request reads the signed-in user's persona document with their overrides applied (`PersonaStore.Document`), so derived values follow the controlled clock |
| Today | The UTC date of the controlled clock. The current month is its year and month |
| Order of checks | Brief 9 D3. For every operation: (1) the route is matched, else 404; (2) authentication, else 401, except `login`; (3) path, query and body shape, else 400; (4) the target exists and is the user's own, else 404; (5) the persona behaviours (below); (6) the rules, else 422 |
| Authentication | A bearer token. It is refused (401 `/problems/unauthenticated`) when missing, unknown, revoked, or at or after its `expiresAt` on the controlled clock |
| Token lifetime | Brief 9 D2: the setting `TOKEN_LIFETIME_MINUTES`, default 60. `expiresAt` is the issue instant plus the lifetime. A value that is not a whole number of minutes from 1 to 1,440 stops the service starting |
| Persona behaviours | `behaviour.failReportEndpoints` (persona `error`): every operation under `/reports/{bureauId}/` answers 500 `/problems/internal` after the 404 check. `behaviour.latencyMs` (persona `slow`): every authenticated operation is delayed by that many milliseconds, added to any latency test control set |
| Session state | Brief 9 D8. Per user, in memory: account details edits, notification read flags, summary feedback, and the profile edits (preferred name, email, mobile and its challenge, the instant the last verification link was sent). Binding a persona to a user, and a reset, clear it. Reading a document never writes |
| Money | `{ amountMinor, currency: "GBP" }` |
| Pages | `page` (default 1) and `pageSize` (default 20, at most 100). A page beyond the end has empty `items` and the true `total` |
| Unknown bureau or account | 404 `/problems/not-found`. An account that exists in another persona is the same 404 (BR-15) |
| **Reading** | A row marked **Reading** is how the specification is read where it is silent. It is reviewed with this document |

## 2. Foundation: login, logout, getMe, listBureaux

| Case | Request | Response |
|---|---|---|
| `login` valid | `alex` / `demo-only` | 200 `{ token, expiresAt }`; `expiresAt` is now plus the lifetime; the token is non-empty |
| `login` wrong password | `alex` / wrong | 401 `/problems/unauthenticated` (the same for an unknown user, so users cannot be probed) |
| `login` shape | no password | 400 |
| `login` needs no token | a token that is invalid | still answered as a login |
| `logout` | a valid token | 204; the token is refused afterwards (401) |
| `logout` twice | the same token | the second is 401 |
| Expiry | a token at exactly `expiresAt` | 401 (at or after) |
| Expiry, one second before | | accepted |
| Clock moved | the clock frozen past `expiresAt` | 401 |
| A token from another login | | each login gives an independent token; logging out one leaves the others |
| `getMe` | `alex` on `excellent` | 200 `{ id: usr_01, displayName: legal name, greetingName, defaultBureauId }` |
| `getMe` greeting | preferred name set or not | the preferred name, else the first word of the legal name (PR-03) |
| `getMe` default bureau | | the first bureau of the bound persona |
| `listBureaux` | `excellent` | one entry per bureau: `{ id, name, nextUpdateInDays }`; `nextUpdateInDays` follows BR-08 on the controlled clock |
| `listBureaux` after the clock moves | the clock set to the refresh date | `nextUpdateInDays` 0 |
| Missing or bad token on any of these | | 401 before any 400 (D3) |

## 3. Report: nine operations

### 3.1 getScore and getScoreHistory

| Case | Request | Response |
|---|---|---|
| Score | `excellent`, `bureau-a` | 200 the bureau `score` as stored (`current`, `max`, `nationalAverage`, `localAverage`) |
| Unknown bureau | `bureau-zzz` | 404 |
| History ranges | `range=3m`, `6m`, `1y` | 3, 6 or 12 points, oldest first, ending at the current month (BR-02) |
| History month with no stored score | the clock moved forward a month | that point's `score` is `null`, never carried forward (BR-02) |
| History range missing or not allowed | none, `2m` | 400 |

### 3.2 getReportOverview

One aggregate call (DR-034).

| Field | Composition |
|---|---|
| `bureau` | as `listBureaux` for this bureau |
| `score` | the stored score |
| `summary` | `{ text: stored text, feedback: the user's current feedback for this bureau, else the stored one }` |
| `recentChanges` | the three newest changes (BR-11) |
| `changesTotal` | the full count of changes (BR-11) |
| `impact` | the stored impact |
| `debt` | the debt overview (BR-07), for this bureau's accounts |
| `accountTypes` | **Reading:** one `AccountTotals` (as `getAccountTotals`) for each type that has an open account in this bureau, in the contract's type order |
| `payments.onReport` | Brief 9 D4: the number of (account, month) pairs with status `missed` in the BR-12 window, across this bureau's accounts |
| `payments.newMissed` | Brief 9 D4: of those, the pairs whose month is one of the three months ending at the current month |

| Case | Request | Response |
|---|---|---|
| Overview | `drilldown` | 200 with every field above; validates against `ReportOverview` |
| Overview for an `error` persona | `error` | 404 for an unknown bureau first, else 500 |
| `payments` for `excellent` | | `{ newMissed: 0, onReport: 0 }` |
| `payments` for `struggling` | | non-zero `onReport`; `newMissed` counts only the last three months |
| A missed month 4 months back | | counted in `onReport`, not in `newMissed` |
| A missed month 3 months back | | the three months end at the current month, so the third month back from it is outside: counted in `onReport` only (months: current, current minus 1, current minus 2) |
| Missed month outside the window | | in neither count |

### 3.3 listChanges

Brief 9 D6: the `tags` parameter is removed from the contract.

| Case | Request | Response |
|---|---|---|
| Default | `drilldown` | page 1, newest first, `total` the count |
| `sentiment` filter | `sentiment=positive` | only positive changes; `total` is the filtered count |
| Unknown `sentiment` | `sentiment=bad` | 400 |
| Paging | `pageSize=2&page=2` | the third and fourth newest |
| A page beyond the end | `page=99` | empty `items`, true `total` |
| Unsorted source | the `br11-unsorted-changes` sample | newest first (BR-11) |
| Twenty-five changes | the `changes-twenty-five` sample | 20 on page 1, 5 on page 2, `total` 25 |
| `pageSize` over 100 | `pageSize=101` | 400 |

### 3.4 getImpact and getPersonalDetails

| Case | Response |
|---|---|
| `getImpact` | the stored impact |
| `getPersonalDetails` | the stored details, with `name` replaced by the user's legal name (API specification 9.1) |
| Unknown bureau | 404 |

### 3.5 getReportPaymentHistory

| Case | Request | Response |
|---|---|---|
| Default year | none | `selectedYear` the current year |
| Years | | seven entries, the current year and the six before, oldest first; each status is the year status across all this bureau's accounts (BR-12) |
| Missed list | `year=2025` | one `{ accountId, provider, month }` for each missed account-month in that year, ordered by month then account ID |
| A year outside the window | `year=2018` | 400 (`year`: must be within the seven-year window) |
| A year inside the window with no missed month | | empty `missed` |
| Overrides | the `br12-*` samples | the statuses their scenarios assert |

### 3.6 listSearches

| Case | Request | Response |
|---|---|---|
| By kind | `kind=hard` | only hard searches, newest first, paged |
| Kind missing | none | 400 |
| `thin-file` | `kind=soft` | empty `items`, `total` 0 |
| Unknown bureau | | 404 |

### 3.7 setSummaryFeedback

| Case | Request | Response |
|---|---|---|
| Set | `{ value: "like" }` | 200 `{ value: "like" }`; the overview's `summary.feedback` then says `like` |
| Replace | like, then `dislike` | `dislike` (BR-10) |
| Clear | `none` | `none` |
| Not a value | `love` | 400 |
| Unknown bureau | | 404 |
| After a rebind or a reset | | back to the stored value (D8) |

## 4. Accounts: six operations

| Case | Request | Response |
|---|---|---|
| `listAccounts` default | `drilldown` | open accounts, `AccountSummary` each, in stored order |
| By type | `type=creditcard` | only that type |
| Closed | `status=closed` | closed accounts still listed under BR-13 (before the sixth anniversary of the close date) |
| A closed account on its anniversary | | not listed |
| Unknown `type` or `status` | `type=boat` | 400 |
| Utilisation | each item | the value BR-03 and BR-06 compute from balance and limit, not a stored copy |
| `getAccountTotals` | `type=creditcard` | BR-04 and BR-05: `balance`, `limit` (the sum, or `null` when no counted account has a limit), `utilisation`, `includedCount`, `excluded` |
| Totals, no accounts of the type | | zero balance, `limit` null, `utilisation` null, `includedCount` 0, empty `excluded` |
| Totals, `type` missing | | 400 |
| Totals, unknown bureau | | 404 (the contract is corrected to say so in v13) |
| `getAccount` | an owned ID | the `Account` projection: no `missedMonths`, `balanceHistory` or `sourceMask`; `details` includes edits made in this session |
| `getAccount` another persona's | `acc_exln02` as `drilldown` | 404 (BR-15) |
| `getAccount` unknown ID | `acc_nope00` | 404 |
| `getAccount` ID shape | `not-an-id` | 400 |
| **Reading:** a closed account past its window | | 404, as if not listed (BR-13) |
| `getBalanceHistory` | an owned ID | the stored `balanceHistory`, six points, oldest first |
| `getAccountPaymentHistory` | an owned ID | seven years of statuses for that account (BR-12) and its missed months for `selectedYear` |
| `updateAccountDetail` valid | `{ field: "apr", value: 29.9 }` | 200 the full `AccountDetails`; a later `getAccount` shows it |
| Detail out of range | `{ field: "apr", value: 100.01 }` | 422 `/problems/rule-violation/out-of-range` (BR-14) |
| Detail, minimum payment | `{ field: "minPayment", value: { percent: 5 } }` or `{ amount: { amountMinor: 2500, currency: "GBP" } }` | 200; **Reading:** the amount is `value.amount.amountMinor` |
| Detail, payment method | `value: "manual"`, `"direct-debit"` | 200 |
| Detail, payment method not allowed | `value: "cheque"` | 422 `out-of-range` (**Reading**) |
| Detail cleared | `value: null` | 200; the field is `null` (**Reading**) |
| Detail on another persona's account | | 404 (BR-15) |
| Detail edit after a rebind | | back to the stored details (D8) |
| Unknown `field` | `field: "colour"` | 400 |

## 5. Supporting: four operations

| Case | Request | Response |
|---|---|---|
| `getDebtOverview` | `drilldown` | BR-07 for the user's default bureau (**Reading**: the operation has no bureau parameter); the total is 198279.60 for `drilldown` and 12947.60 for `excellent` |
| Debt trend | the `br07-debt-trend` sample | the trend its scenario asserts |
| Debt `byType` | | one entry per type above zero, enum order, adding up to `total` (DR-046) |
| `listNotifications` | `drilldown` | unread first, then the newest first; `unread` the count of unread in all pages |
| Notifications, paging | `pageSize=1` | one item; `total` all |
| `markNotificationRead` | `{ read: true }` | 200 the notification, now read; `unread` falls by one |
| Mark unread | `{ read: false }` | 200, unread again |
| Unknown notification | `ntf_nope` | 404 |
| Another persona's notification | | 404 |
| Mark read after a rebind | | back to the stored flag (D8) |
| `sendAssistantMessage` | `{ message: "What is my score?" }` | 200 `{ reply, disclaimer }` from the table below |
| Message empty or over 500 characters | | 400 |

**The assistant (brief 9 D5).** The reply depends on the first intent whose word the message contains, ignoring case, tested in this order; otherwise the fallback. The disclaimer is the same for all.

| Intent | Word | Reply |
|---|---|---|
| score | `score` | Your credit score is on the overview page, shown against the national and local averages. |
| debt | `debt` | Your total debt, and how it is split by account type, is on the debt page. |
| payments | `payment` | Your payment history shows each year as on time, missed or no data. |
| fallback | none of the above | I can help with your score, your debt and your payments. |
| Disclaimer | all | This is a demonstration assistant. It does not give financial advice. |

| Case | Message | Reply |
|---|---|---|
| Score | `What is my SCORE?` | the score reply |
| Two words | `my score and my debt` | the score reply (first in the order) |
| Payments | `late payments` | the payments reply |
| Nothing matches | `hello` | the fallback |

## 6. Profile: six operations

These use the CDS-27 functions ([profile-rules-cases.md](profile-rules-cases.md)). The stored profile comes from the persona's `profile` block and the signed-in user (legal name, date of birth and email address come from `fixtures/users.json`).

| Case | Request | Response |
|---|---|---|
| `getProfile` | `excellent` | `Profile`: `legalName`, `dateOfBirth`, `memberSince`, `preferredName`, `email { address, status }`, `mobile { lastDigits, status }` or `null`, `address`, `employment`, `finances { added }` (PR-07: no figure) |
| Email status | persona `emailStatus` | `verified` or `unverified`; `verify-email` by test control makes it `verified` |
| `updatePreferredName` | `{ preferredName: "  Sam  " }` | 200 `{ preferredName: "Sam" }` (PR-02); `GET /me` greets by it (PR-03) |
| Clear | `""` or `null` | 200 `{ preferredName: null }` |
| Refused | `"Sam2"` | 422 `/problems/rule-violation/preferred-name` |
| Over 100 characters, or not a string | | 400 |
| `changeEmail` different | `{ address: "b@example.com" }` | 200 `{ address, status: "unverified" }`; the instant a link was sent is the clock now (PR-04) |
| `changeEmail` same | the address held | 200 the stored address and status, unchanged; no link sent |
| `changeEmail` shape | `not-an-email` | 400 |
| `resendEmailVerification` | unverified, last link a minute ago | 202 `{ sentAt, nextResendAt }`; `nextResendAt` is `sentAt` plus 60 seconds (PR-09) |
| Resend too soon | last link 30 seconds ago | 429 `/problems/rate-limited` with `Retry-After` 30 |
| Resend, already verified | | 422 `/problems/rule-violation/already-verified` |
| Resend, no link yet | unverified, none sent | 202 |
| `changeMobile` | `{ number: "07700 900456" }` | 200 `MobileChallenge` `{ lastDigits: "456", status: "unverified", expiresAt: now plus 10 minutes, attemptsRemaining: 3 }` (PR-06, PR-10) |
| `changeMobile` refused | `01632 960456` | 422 `/problems/rule-violation/mobile-number` |
| `verifyMobile` correct | `{ code: "123456" }` | 200 `{ lastDigits, status: "verified" }` |
| `verifyMobile` wrong | `{ code: "000000" }` | 422 `/problems/rule-violation/code-wrong` with `attemptsRemaining` 2, then 1 (PR-11) |
| `verifyMobile` third wrong | | 422 `/problems/rule-violation/code-invalid`, no `attemptsRemaining` |
| `verifyMobile` expired | the clock moved 10 minutes | 422 `code-invalid` |
| `verifyMobile` nothing pending | | 422 `code-invalid` |
| `verifyMobile` shape | `{ code: "12" }` | 400 |
| Profile after a rebind | | back to the stored profile (D8) |

## 7. Checks that run over all of them

| Check | What it asserts |
|---|---|
| Every response validates | For every served operation and success status, a request is sent and the body is checked against the contract's response schema |
| Every problem validates | Every 4xx and 5xx body is checked against the contract's `Problem` schema, and its `type` is the one named above |
| The coverage test | The pending list shrinks with each slice and is empty after the profile slice |
| Order of checks | A request with no token and a bad query is 401 (D3); an unknown route with no token is 404 |
| Persona behaviours | The `error` persona gets 500 on every report operation; the `slow` persona's calls take at least its delay |

## 8. Decisions recorded with this document

- **D2 to D8 (brief 9):** the token lifetime setting, authentication before shape, the `payments` definition, the assistant table, `tags` removed, the 503 dropped, and a rebind clearing session state.
- **Readings** are the rows marked **Reading**. They are open to correction at review.
