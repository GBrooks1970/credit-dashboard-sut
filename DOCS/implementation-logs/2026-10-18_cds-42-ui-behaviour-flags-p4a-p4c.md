# CDS-42: P4, the eleven remaining behaviour flags (P4a to P4c) — 2026-10-18

## Session Summary

The last eleven bug flags are built and each is caught for its stated reason by a committed check (#108, #109, #110): two in the service, six in the UI with the registry's planned `@ui` scenarios, and three with component tests that needed two behaviours the product did not yet have. `npm run check:bug-flags` now shows **30 of 30 implemented flags caught for the stated reason, none pending**, which is stop point 3 of the Phase 5 plan. The two CDS-38 items deferred to P4 (A-24, C-26) are closed.

---

## Objectives

1. ✅ P4a (#108): `preferred-no-trim`, `email-stays-verified` (service).
2. ✅ P4b (#109): `range-stale`, `like-both`, `open-redirect`, `negative-balance`, `preferred-on-report`, `pii-in-title`; C-26.
3. ✅ P4c (#110): `toggle-label`, `truncate-summary`, `lost-edit`; the summary expander and the unsaved-name warning.
4. ✅ Records (this pull request).
5. ⏸️ Stop for the owner's decision (decision D6) before P5 (CDS-43, visual regression).
6. ⏸️ The registry, landing card and capability matrix (30 of 30), updated when the owner asks.

---

## Test Results

| Check | Before (end of P3, `eee78fa`) | After (`8f3c3fb`) | Status |
|---|---|---|---|
| `check:bug-flags` | 19 of 19 implemented, 11 pending | **30 of 30 implemented, 0 pending** | ✅ PASS |
| Service tests | 435 | 437 | ✅ PASS |
| Rules tests | 239 | 239 | ✅ PASS |
| Component tests | 198 | 208 | ✅ PASS |
| Harness unit tests | 23 | 23 | ✅ PASS |
| `@api` executions | 59 | 60 (33 scenarios and outlines) | ✅ PASS |
| `@ui` executions | 59 | 59 | ✅ PASS |
| `check:ui-exit` | 124 axe scans, 288 layout checks | 124 and 288, 0 problems | ✅ PASS |
| `verify` | 14 of 14 | 14 of 14 | ✅ PASS |

CI durations, measured on each pull request (every one merged after all three jobs showed `pass`): `flags` job 9m22s (P4a, 21 flags), 15m16s (P4b, 27 flags), 16m41s (P4c, 30 flags); `ui` job 4m47s to 4m57s; `Verify` 1m32s to 2m7s. The `flags` limit is 30 minutes.

---

## Changes Implemented

### P4a (#108, `c3547c0`)
`Defects.PreferredName` and `Defects.EmailStatusAfterChange`, two call sites at the profile routes; the BusinessRules library is unchanged. Service tests failed first. `email-stays-verified` is caught by the existing `@ui` scenario "A changed email needs verifying again"; `preferred-no-trim` by a new `@api` scenario "Spaces around a preferred name are removed" (two new `@api` steps, glossary v17), because the UI trims the name before it sends it and the planned `@ui` scenario stayed green (decision D2, the owner chose the `@api` scenario). With the flag on the contract validator refuses the response, which became the recorded reason. API specification v36. A-24 closed.

### P4b (#109, `642f4e2`)
Six flags, each `TEST_BUILD && flagOn(...)`: `range-stale` (`HistoryChart`), `like-both` (`SummarySection`), `open-redirect` (`safeRedirect`), `negative-balance` (`formatMoney`), `preferred-on-report` (`PersonalDetailsPage`), `pii-in-title` (`ProfilePage`). The planned `@ui` scenarios caught all six; no scenario changed. C-26: `problemText` shows the service's `errors[0]` message when there is one, test first. The public-build guard looks for three more names. UI specification v33.

### P4c (#110, `8f3c3fb`)
The behaviours first, specified, tested and built (decision D3): a summary over 280 characters is cut at the last whole word with a "Read more" / "Read less" button; leaving the profile by an in-app link with an unsaved preferred name asks first. Then `toggle-label`, `truncate-summary` and `lost-edit`, each caught by a component test in `src/flags.test.tsx` with a message that names the defect. UI specification v34, My Profile spec v12.

---

## Technical Decisions

- A flag whose planned catcher does not fail is a stop, not a workaround (D2): `preferred-no-trim` showed why.
- The unsaved-name warning uses a document-level capture listener on link clicks, because the app uses `BrowserRouter` and `useBlocker` needs a data router. Reload and tab close are left to the browser and the specification says so.
- Component-test catchers carry assertion messages that name the defect, so the proof can tell them from any other failure.

---

## Documentation Updates

API specification v36; UI specification v33, v34; My Profile spec v12; step glossary v17; `api/profile-contact.feature` v3; plan `2026-10-18_cds-42-ui-behaviour-flags.md` (Outcome); plans index; backlog v70; CHANGELOG; README (30 of 30, counts).

---

## Lessons Learned

- **A catcher can pass because of the layer above the defect.** The UI's own trim hid `preferred-no-trim` from the UI scenario. The probe (flag on, planned scenario) showed it in a minute; trusting the registry would have recorded a flag as caught that was not.
- **A defect with nothing to break needs the behaviour built first.** `lost-edit` and `truncate-summary` described missing behaviour; building it under a specification first made the flags meaningful and left the product better.
- **The proof job's time grows with the flags, about 30 seconds a flag.** At 30 flags it is 16m41s of a 30-minute limit; the next growth (visual regression) must not share it.
- **A version bump by string replace can silently miss** when a file has CRLF endings: the My Profile spec version stayed at 11 through P4b and was found while writing P4c. Check the number after editing it.

---

## Recommendations / Next Steps

1. Stop for the owner's decision, then P5 (CDS-43, visual regression): plan first.
2. Update the registry, landing card and capability matrix (30 of 30) when asked.

---
