---
version: 1
created: 2026-10-16T22:01Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-38
status: approved
approved: "2026-10-17, Gary Brooks, 'all as recommended, approved, merge #93 once CI green, then start F11a' (D1 to D5 as recommended); merge authority: per pull request, on request"
delivered: 2026-10-18
language: en-GB
---

# Implementation plan: CDS-38 F11a to F11f, the fixes from the confirmation pass

**History of this plan.** The confirmation pass (F11) ran on 2026-10-16 at `20ecebc`: three Sonnet 5.5 reviewers checked 57 earlier fixes (41 Fixed, 16 Partly fixed, none Not fixed) and reported 12 new Blockers, 27 Changes and 16 Notes. The author reproduced every Blocker and Change (the record, `.review/2026-10-16_cds-38-confirmation-pass.md`, section 4) and the owner signed them off by interview (section 5): all 12 Blockers and 27 Changes accepted, 11 Notes accepted, 3 deferred, 2 no action. The fix plan (F11) says accepted findings are fixed in small pull requests, specification first, with an addendum for any fix that is more than a correction. This is that plan, written for approval before any code changes (DR-041); the owner approved it on 2026-10-17.

**Goal.** Put right what the confirmation pass found, in six slices, so that no Blocker and no Change remains open before the records (F12) and the UI flags (P3). Every fix is shown to fail without it, as in F1 to F10.

## Evidence gathered before planning

| Finding | Consequence for the plan |
|---|---|
| The Blockers cluster: five in the service's request handling (A-01 with C-13, A-05, A-06, A-04, A-07), one in a rule's output after F5 (A-08), two in checks that stay green (A-09, A-10), three in the UI (C-01, C-02, C-04) | Service slices first (a to c), UI after |
| Two Blockers were introduced by fixes: C-25's `inert` page broke focus return (C-01), and F5's fixture change exposed A-08 | Both are regressions the earlier slices' own checks could not see: a browser check for focus, and a closed-account utilisation step |
| R2-A-05 reproduced for the trailing newline but not for full-width digits (the later parse refuses them) | The fix covers both and the test keeps both rows; the record says which one reproduced |
| R2-B-08 (SIGTERM and limits) and R2-B-10 (the harness type check) change how CI and the runner behave | They are in F11d, with the CI cost stated |
| The accepted findings touch a contract-visible rule only in one place: R2-A-08 changes what a closed account's `utilisation` is (0 instead of the stored basis). The contract's schema is unchanged | No contract version bump; API specification v33 records the rule |
| Slice sizes, by what the sign-off assigns: F11a 10 findings (eight Blockers and Changes and two Notes), F11b 5 (four, with R2-B-06, and one Note), F11c 2 (service tests and fuzzing), F11d 15 (ten Changes and five Notes), F11e 8 (six Changes and two Notes), F11f 9 (eight Changes and one Note) | F11d is the largest; it can split into two pull requests if it grows (stated, not assumed) |

## Steps

Six slices, one pull request each, in this order. Each branch is `claude/cds-38-f11x-<topic>`. Each is merged only on the owner's word and after every job of its own CI run has succeeded (read as a result, not a summary line). Specification first: a slice that changes behaviour a specification states changes the specification in the same pull request, and the test is written red before the code.

**F11a. Service faults, parsing and the clock.** R2-A-01 and R2-C-13, R2-A-09, R2-A-02, R2-A-03, R2-A-05, R2-A-11, R2-A-06; Notes R2-A-12 and R2-A-15.
- **A-01 and C-13.** Read the request body strictly at the edge: after the shape check, walk the string values with the strict UTF-8 reader and answer 400 `validation` (`body` is not valid text) for a lone surrogate or an invalid byte sequence; catch `InvalidOperationException` beside `JsonException` and `ArgumentException`. Test first: a login body with `\ud800`, one with `\xc3\x28`, and one string field of each other body-reading operation.
- **A-09.** A test through `WebApplicationFactory<Program>` that reaches a real fault: a request that the handler cannot answer once the edge is bypassed (a test-only path is refused by design, so the test registers a throwing endpoint through the factory's `ConfigureWebHost`), run in Development and Production, asserting the 500 Problem with no trace. Mutation: `Program.cs` without the handler must turn it red.
- **A-05, A-11.** The clock pattern ends at `\z` and uses `[0-9]`; both bad inputs stay as table rows. Instants outside 1990 to 2100 are a 400. API specification section 6.5 says so.
- **A-02.** Test-control numbers are read as decimals and checked whole, so `1e3` is accepted as 1000 or refused with a 400; the choice is 400 for any exponent form (a keyed tool does not need one).
- **A-03.** Dates in an override are checked in the overrides check (D3 below) and a bad one is a 422 `overrides-inconsistent`; a test for each of `openedDate`, `closedDate`, `lastUpdated`.
- **A-06.** The handlers parse `year` and `page` with the edge's rule (leading sign allowed), then apply the window check; a parameter that parses is never replaced by a default. Tests: `+2018` is 400, `+2025` is 2025, `+2` is page 2.
- **Notes.** A-12: the PATCH response stores the parsed decimal and `amountMinor` is bounded to a 64-bit integer (a 422 above it). A-15: the edge no longer unescapes a path parameter twice.
- **Evidence for the pull request:** each new test red on the unfixed code; the reviewers' own probes (R2-A-01, 05, 06, 11, 02, 03) re-run live.

**F11b. Service rules and races.** R2-A-04, R2-A-07, R2-A-08 (with R2-B-06), R2-A-10; Note R2-A-17.
- **A-04.** The PR-11 read, check and write sit under one lock (a `MobileLock` beside `EmailLock`, never held across an await), and a burst test like the PR-09 one: 40 parallel wrong codes give at most two `code-wrong` answers and then `code-invalid`, ten bursts in a row. Mutation: the write moved outside the lock turns it red.
- **A-07.** `MissedIn` takes the current month and drops later months, for both payment-history operations. Test: a clock before the persona's missed months lists none of them; a case for the current month itself.
- **A-08, B-06.** A closed account's utilisation and raw utilisation come from the reported balance (0). API specification v33, BR-03 and BR-13 say so; a service test on the closed list and a harness step ("its utilisation is 0%") on the closed-accounts scenario. The UI is unaffected (it hides utilisation for closed accounts).
- **A-10.** The A-07 account test uses `acc_nope00`; a second mutation (the check moved after the owner lookup) must turn it red.
- **Note A-17.** Section 10 gains the two sentences on the flags' side effects.

**F11c. Service tests and fuzzing.** R2-A-13, R2-A-14.
- Schemathesis: the blanket `response_schema_conformance = false` for `PATCH /me/profile/preferred-name` becomes a narrower exemption for the one pattern its validator cannot express (`\p{L}`), if the tool allows it, and otherwise a custom check; `testSetLatency` is fuzzed with a fixed seed and a reset afterwards; `PYTHONIOENCODING` is set in the runner. If a narrower exemption is not possible, the pull request says so and keeps the exemption with a test that covers the field in the service tests.
- The response-shape tests loop the read operations over the six personas, with the closed contract; a leak that appears for one persona only turns it red (mutation: an extra property in one persona's block).

**F11d. Harness guards.** R2-B-01, 02, 03, 04, 05, 07, 08, 09, 10, 11; Notes R2-B-12, 14, 15, 16, 18.
- **B-01** the non-JSON test asserts the message `not JSON` with a body that would otherwise match; **B-02** a unit test walks every response schema of the contract and requires `additionalProperties: false` except an allow list (`Problem`, `Problem.errors[]`, `testGetState_200.latency`); **B-03** `failsWith` must be unique across the registry and contain a location or a value, checked by `schema-check`; **B-04** `schema-check` requires a non-zero stored balance and limit on the closed accounts the BR-13 and BR-04 scenarios use; **B-05** `secretsOf` gains the address line, the employment status and the member-since date, and the "every" claim is derived from the profile schema or dropped; **B-07** `arrangeFlags` also asserts `now` is null, the default personas and an empty latency.
- **B-08** the runner starts the child with `spawn`, forwards SIGINT and SIGTERM to it, and gives every mode a limit (the proof's 240 s per catcher stays; `api`, `ui` and `exit` get a whole-run limit, with an environment override). **B-09** a run that resolves a feature path that does not exist, or reports no scenario, fails. **B-10** `typecheck` runs inside the `api` mode before the services start (D2 below). **B-11** the design drops the coverage-check and non-existent-method claims and says what exists.
- **Notes:** the unit test moves out of the Cucumber globs (B-12); the response is recorded before it is validated and the page URL is added for UI scenarios (B-14); `keepToken` goes (B-15); the stale `cucumber.mjs` comment (B-16); a same-site return address row in `open-redirect.feature` (B-18).
- **Evidence:** the reviewers' probes re-run (P3c, P4a/c, F1 loose, V1, U3c, M5), and a run in which the runner is signalled mid-run on the platform where that can be shown. The signal path on Windows is stated as not exercised if it cannot be.

**F11e. UI behaviour.** R2-C-01, C-02, C-04, C-05, C-11, C-14; Notes R2-C-16, C-18.
- **C-01** `inert` is removed before focus returns (focus in an effect after the drawer has gone); a `@ui` scenario opens the drawer, presses Escape and asserts the focused element is `btn-chat`, and the same for Close. **C-02** `useLatest` in `SummarySection.choose` and `ChatDrawer.send`, with tests like F8's. **C-04** `input, select, textarea { font: inherit }`, then the exit checks; overflow it exposes is fixed here or put to the owner. **C-05** `formatMonth` falls back to the raw month and the app has an error boundary around the routes, with a test for `2026-13`. **C-11** the mobile page re-reads the profile after the PUT. **C-14** U+2019 leaves the client pattern.
- **Notes:** `main` has bottom padding below 768 px (C-16); `refreshUser` moves out of the save's `try` (C-18).

**F11f. UI checks, CI and documents.** R2-C-03, 06, 07, 08, 09, 10, 12, 15; Note R2-C-17.
- **C-03** a component test and a `@ui` row for the sign-in redirect-back with `//evil.example` and `/..//evil.example`. **C-06** the guard's marker list gains the flag names that are not ordinary words (the rest, such as `plural`, is recorded for P3, where the UI flags are built through `useFlag` inside a constant `TEST_BUILD` check). **C-07** the guard's test asserts the list equals the five (and the new ones) in the specification. **C-08** the registry's `plannedCatcher` and section 8 say the same for every UI flag. **C-09** `npx --no-install redocly lint` and the stale `redocly.yaml` comment. **C-10** `AfterAll` kills the browser before it throws. **C-12** the component catalogue and the `vite` pin match what is built. **C-15** the exit run fails when `CDS_EXIT_ONLY` matches no target, asserts its expected counts, runs axe in the doubled-text passes, and lays out the sign-in page at the three widths.
- **Note:** each SHA comment names the full release tag (C-17).

## Verification

- Every fix has a test or check that was red on the unfixed code, shown in the pull request, and, where a reviewer gave a probe, that probe re-run.
- Each pull request: `npm run verify` 14 of 14 (or the count the pull request states if F11d changes it), the `ui` job green, `check:bug-flags` 8 of 8 for the stated reason, `check:ui-exit` at 0 problems. The local run includes `check:ui-scenarios` and the flag proof before the pull request is opened (the lesson of #80).
- After F11f: the author re-runs the reviewers' probe sets for the 12 Blockers, with the results in the plan's Outcome. No second fresh reviewer is launched (confirmation-pass decision D5).

## Delivery

- Branches: `claude/cds-38-confirmation-record` (the record and this plan), then `claude/cds-38-f11a-faults-and-parsing` to `claude/cds-38-f11f-checks-ci-docs`. Merge in order, each on the owner's word and a checked, all-green result.
- Estimate (mine, not measured), in sessions: F11a 0.5, F11b 0.5, F11c 0.25, F11d 0.75, F11e 0.5, F11f 0.5: about 3.
- No downloads; no new dependencies.

## Out of scope

The three deferred Notes (R2-B-13, 17, 19); the two no-action Notes; the earlier deferrals (C-23, A-24, C-26, A-22); the records of F12.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Order | a, b, c, d, e, f as written (service, harness, UI); UI first; Blockers of all areas first | As written: the service fixes come first so that the harness guards in d are judged against the corrected service |  As written (2026-10-17) |
| D2 The harness type check (R2-B-10) | Inside the `api` mode before the services start (keeps 14 steps); a 15th `verify` step; a CI step in the `ui` job | Inside the `api` mode |  Inside the `api` mode (2026-10-17) |
| D3 Date formats on overrides (R2-A-03) | Check them in the overrides check only; enable format assertion for every `date` and `date-time` at the edge | The overrides check only: format assertion at the edge would refuse request bodies elsewhere that the contract does not treat as errors today |  The overrides check only (2026-10-17) |
| D4 Test-control numbers (R2-A-02) | Refuse any exponent form with a 400; accept whole values written with an exponent | Refuse (a keyed tool does not need one) |  Refuse (2026-10-17) |
| D5 Signals and limits (R2-B-08) | Asynchronous child with forwarded signals and a limit for every mode; keep `spawnSync` and add only the limits | Asynchronous child: it is the only way a handler can run |  Asynchronous child (2026-10-17) |

## Outcome

**Delivered 2026-10-18.** F11a #94, F11b #95, F11c #96, F11d in two pull requests #97 (guards) and #98 (the runner), F11e #99, F11f #100; the records are F12.

**Where it departed from the plan.** (1) F11d was split into two pull requests, as the plan allowed. (2) The specification versions the plan named moved with the order of merging: API specification v33 (F11a), v34 (F11b), v35 (F11c); UI specification v28 (F11e), v29 (F11f). (3) Three things were not mutation-proven and say so in their pull requests: the SIGINT and SIGTERM handlers of `run.mjs` (Windows cannot deliver the signal), the doubling of form controls by `font: inherit` (no check read the size), and the exit run's expected-count assertion. (4) Two overflows that the new checks found were fixed in place: the debug page (F11e) and the sign-in page (F11f), both at 375 px with doubled text.

**Counts at the close of CDS-38 (2026-10-18, `88e44a8`):** 435 service tests, 239 rules tests, 198 component tests, 20 guard tests, 21 harness unit tests, 59 `@api` executions (32 scenarios and outlines), 59 `@ui` executions (44 scenarios and outlines), 124 axe scans and 288 layout checks, `check:bug-flags` 8 of 8 implemented flags caught for the stated reason, `verify` 14 of 14, the `ui` CI job about 6.5 minutes (15 minute limit; C-23 stays with P5).
