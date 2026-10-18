---
version: 1
created: 2026-10-18T17:10Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-42
status: approved
approved: "2026-10-18, Gary Brooks, 'all as recommended, approved' (D1 to D6 as recommended); merge only on the owner's word per pull request"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-42, P4 the eleven remaining behaviour flags

**Goal.** Build the eleven group C bug flags still pending (`range-stale`, `toggle-label`, `like-both`, `open-redirect`, `truncate-summary`, `negative-balance`, `preferred-on-report`, `pii-in-title`, `lost-edit` in the UI, and `preferred-no-trim`, `email-stays-verified` in the service), each shown by `npm run check:bug-flags` to turn a committed check red for its stated reason. It takes the proof from 19 to 30 of 30, which is stop point 3 of the Phase 5 plan (decision brief 13, DR-064). The Phase 5 plan called this group "twelve flags"; `plural` is the twelfth and is already built, so eleven remain.

It also takes the two CDS-38 items deferred to P4: **A-24** (pending service flags are accepted and do nothing: closed by building the last two, since no flag is pending afterwards) and **C-26** (the UI shows the service's `detail` and ignores the specific `errors[]` message; decision D4).

## Evidence gathered before planning

Read only; nothing was run against the repository and nothing in it was changed.

| Finding | Consequence for the plan |
|---|---|
| `fixtures/bug-flags.json` has 11 pending flags, all group C: nine in the UI, two (`preferred-no-trim`, `email-stays-verified`) in the service. Planned catchers: `@ui` scenarios for `range-stale`, `like-both`, `open-redirect`, `negative-balance`, `preferred-on-report`, `pii-in-title`; `@ui` and `@api` scenarios for the two service flags; **new component tests** for `toggle-label`, `truncate-summary`, `lost-edit` (decision brief 13 D4, option 2). | Three groups of work: the two service flags, the six scenario-caught UI flags, the three component-test flags. |
| P3c showed the registry's planned scenario catchers were right for all three flags it covered. Whether they are right for these six is **not yet known**: it is the first thing each flag's loop shows. The existing scenarios named in the profile spec (`Spaces around a preferred name are removed`, `A changed email needs verifying again`, `Profile details stay out of the page title and address`, `A card in credit says so` (BR-06), the open-redirect outline) exist today. | Same rule as P3: the planned scenario is run with the flag on first; if it does not fail, I stop and ask (decision D2). |
| Service flags are `Flags` and `Defects` call sites that change a call site, never a rule (P2, DR-064). `preferred-no-trim` would keep leading and trailing spaces in `PreferredName`'s stored value; `email-stays-verified` would keep the Verified status after `PUT /me/profile/email` (breaking PR-04). The `BusinessRules` library stays pure. | Each is one `Defects` call at the route, with a service test that shows the rule breaks, like the seven API flags. |
| The component-test catchers run through the proof runner as `kind: "component-test"` with `CDS_FLAGS`; the only UI flag test today is `flags.test.tsx` (for `plural`). The `ui` CI job is 5 minutes and the `flags` job 7m39s (P3c); the new catchers add two runs each. | The flags job grows by about 3 to 4 minutes (estimate: component tests are quick, scenarios about 25 s a run); measured and reported. Limit 30 minutes. |
| `lost-edit` and `truncate-summary`: I searched the UI source (`useBlocker`, `beforeunload`, `confirm`, "unsaved") and found no warning on leaving the profile with an unsaved preferred name; the summary (`SummarySection.tsx`) is shown whole, with no expander. The My Profile spec and section 8 name both as defects in behaviour the product should have. `toggle-label` has its toggle (`ReportChanges.tsx`, "Show all N" and "Show fewer"). | For these two there is nothing to break yet. P4c builds the behaviour first (a confirmation when leaving the profile with an unsaved change; a long summary cut at a word boundary with an expander), then the flag removes it. Decision D3. |
| The UI shows `problemText(problem)` as the service's `detail` (C-26). A bad email shows "One or more fields are invalid." although `errors[]` carries "must be an email address". | A small change in `problem.ts` with a component test; decision D4. |

## Steps

Specification first, then three pull requests (each its own branch and CI run, merged only on your word), then records.

### P4a: the two service flags

1. **Specification.** API specification section 10 (the flags table gains the two with their effects and catchers); `fixtures/bug-flags.json` (`implemented`, catchers); API specification v36.
2. **`preferred-no-trim`** (`Defects`, used by the preferred-name route): the stored value keeps its surrounding spaces. Service test red/green; caught by the `@api` scenario for the trim and the `@ui` scenario `Spaces around a preferred name are removed` (to be probed).
3. **`email-stays-verified`** (`Defects`, used by the email route): the email status stays `verified` after a change. Service test; caught by `A changed email needs verifying again` (`@ui`) and its `@api` counterpart (to be probed).
4. `FlagTests` (the registry and the service agree) updated; `check:service-contract` unchanged (no contract change).

### P4b: the six UI flags with scenario catchers

For each flag one loop: run the planned scenario with the flag off (must pass), add the branch as `TEST_BUILD && flagOn(...)`, run it with the flag on (must fail), record it in the registry.

5. **`range-stale`** (`HistoryChart.tsx`): choosing a range does not change the chart. Planned catcher: the `@ui` score history range outline.
6. **`like-both`** (`SummarySection.tsx`): both feedback buttons show pressed. Planned: the `@ui` summary feedback scenarios.
7. **`open-redirect`** (`safeRedirect.ts`): the guard returns its target unchecked. Planned: the open-redirect outline. This one must not be left in the public bundle: the guard's marker list already has the name.
8. **`negative-balance`** (`formatMoney`): an account in credit reads as an amount owed (`£44`, no "in credit"). Planned: `A card in credit says so` (`@BR-06`).
9. **`preferred-on-report`** (the report pages' heading): the preferred name appears where PR-03 says only the legal name does. Planned: a `@ui` profile scenario.
10. **`pii-in-title`** (`ProfilePage.tsx`): the legal name is placed in `document.title`. Planned: `Profile details stay out of the page title and address`.
11. If a planned scenario does not fail with the flag on, I stop and bring you the choice (decision D2) before any scenario text changes.
12. **C-26** (decision D4): `problemText` prefers the first `errors[]` message when the service sends one; a component test for the email page. UI specification wording follows.

### P4c: the three flags with component-test catchers

13. **`toggle-label`**: the label of the changes toggle (`changes-toggle`, "Show all N" and "Show fewer") never flips back to "Show all N" after it has been expanded. Test: the toggle flips both ways (new, in `src/flags.test.tsx`).
14. **`truncate-summary`**: a long summary is cut mid-word with no way to expand. Test: a long summary shows whole words only and can be expanded. If the summary has no expander today, the test is written for the behaviour the specification names and the expander is built first (a short, named change; decision D3 covers both this and `lost-edit`).
15. **`lost-edit`**: leaving the profile page with an unsaved preferred name asks first; the flag removes the question. Test: a typed name and a navigation away show the confirmation. (The warning is built in this step, see the evidence table.)
16. Each catcher is run by the proof runner with the flag supplied (`CDS_FLAGS`): passes off, fails on with the recorded text.

### Records (after P4c)

17. Implementation log, this plan's Outcome, backlog (CDS-42 Done, CDS-43 Ready), CHANGELOG, README (30 of 30), UI specification and API specification wording, the capability matrix figure when you ask.

## Verification

- Every pull request: `npm run verify` 14 of 14, `check:ui`, `check:ui-scenarios`, `check:ui-exit` (124 axe scans and 288 layout checks unchanged), and its own CI run with all three jobs (`Verify`, `UI`, `flags`) read as results.
- `npm run check:bug-flags`: 30 of 30 implemented flags caught for the stated reason, none pending.
- Probes that must fail, reverted afterwards: a branch written without `TEST_BUILD` fails the public-build guard (for each new UI flag name; add the new names to the guard's marker list); a catcher run with the flag supplied but removed from the branch reports "PASSES"; for each service flag, the service test fails with the flag on and passes with it off.
- Flags-off regression: every existing check stays green with all flags off, including 435 service tests, 239 rules tests, 198 component tests, 59 `@api` and 59 `@ui` executions.
- Measured and reported, not estimated: the `flags` job duration after P4b and P4c.

## Delivery

- Branches `claude/cds-42-service-flags` (P4a), `claude/cds-42-scenario-flags` (P4b), `claude/cds-42-component-flags` (P4c), then `claude/cds-42-records`. Merge in order only on your word and after every job of each pull request's own CI run is read as a result.
- Estimate (mine, not measured), in sessions: P4a 0.5, P4b 0.75, P4c 0.5, records 0.25: 2.0, against the Phase 5 plan's 1.5.
- No new dependency and no download. The registry, landing card and capability matrix are updated when you ask.

## Out of scope

Visual regression (CDS-43); the Serenity report (CDS-44); Phase 5 exit (CDS-45); A-22, R2-B-13, R2-B-17, R2-B-19; any scenario change not accepted by you; the address, employment and finances profile pages.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1. Pull requests | (1) three, by kind of catcher: service flags, scenario-caught UI flags, component-test flags (2) one for all eleven (3) one for each flag | (1) | as recommended, 2026-10-18 |
| D2. If a planned scenario does not catch its flag | (1) stop and ask, per case (2) add a component test as the catcher without asking (3) change the scenario | (1): a scenario change is yours | as recommended, 2026-10-18 |
| D3. `lost-edit` and `truncate-summary` have nothing to break yet (no unsaved-change warning; no summary expander). | (1) build the behaviour the specification names, then the flag removes it, each as a named change in P4c (2) change the specification to say the behaviour is not built, and drop the two flags from the 30 | (1): the flags are about defects in a behaviour the product should have, and the 30-flag gate stands | as recommended, 2026-10-18 |
| D4. C-26 (the UI shows `detail`, not the specific `errors[]` message) | (1) fix it in P4b: prefer the first `errors[]` message, with a component test (2) leave it as a recorded Note | (1): small, and the profile pages are the ones affected | as recommended, 2026-10-18 |
| D5. A-24 (pending service flags do nothing) | (1) closed by P4a, since no flag is pending afterwards; no code (2) also refuse pending flags with 422 in the meantime | (1) | as recommended, 2026-10-18 |
| D6. After P4 | (1) stop for your decision: all 30 flags proved is stop point 3 of the Phase 5 plan (2) go straight on to P5 (CDS-43) | (1) | as recommended, 2026-10-18 |

## Outcome

[Appended after delivery.]
