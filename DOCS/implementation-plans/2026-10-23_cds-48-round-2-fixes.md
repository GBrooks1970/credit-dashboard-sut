---
title: CDS-48 round 2, the fixes after the confirmation pass
version: 1
created: 2026-10-23T09:30Z
project: credit-dashboard-sut
type: implementation-plan
status: awaiting approval
language: en-GB
---

# CDS-48 round 2: the fixes after the confirmation pass

## Goal

The confirmation pass (`.review/2026-10-23_cds-48-confirmation-report.md`, verified in `.review/2026-10-23_cds-48-confirmation-verification.md`) found one Blocker, which my own slice 3 caused, and eight Changes. The owner signed them off on 2026-10-23, all as recommended. This plan fixes them, in three small pull requests, each test-first and mutation-proved, and then closes the records (DR-068, the plan Outcomes, the implementation log) so that the project can be closed. There is no further review (decision D4 below): the proof is the author's, with every CI job read.

## Decisions already made (by interview, 2026-10-23)

| ID | Decision |
|---|---|
| D1 | C-01: hide the tab bar only in the 375 px whole-page shots; at 1280 px do not hide it; photograph the bar as a viewport-sized shot of the overview at 375 px, so its place is in the image. |
| D2 | C-02: specific assertions on all five rows of the open-redirect outline. |
| D3 | Fix C-03, C-04, C-06, C-07, C-08, C-09. C-05 limited: the three false positives and the section 9 table; the misses recorded as known limits. The cheap Notes: anchored `-g`, `.nvmrc` in the Visual paths, the guard comment, the PNG check by content in the baselines workflow. |
| D4 | No further review. Author verification: each fix test-first and mutation-proved, every CI job read, the visual check on Linux twice, evidence recorded. |
| D5 | Notes C-10 and C-12 are recorded, no change. |

## Slice A: the visual check (C-01, C-07, C-13 in part) (`claude/cds-48-r2-visual`)

- **C-01.** `cases.ts` v3: each case gets `hideBar` (true for the 16 whole-page shots at 375 px only) and the bar's case becomes a viewport shot (`fullPage: false`) of the overview at 375 px, light and dark, named `tab-bar-375-<theme>.png` as now. `visual.spec.ts`: the stylesheet is applied only when `hideBar`; the 1280 px shots are not touched, so a bar that should not be there appears in them. `cases.test.ts` first: 34 cases, `hideBar` true for exactly the 16 whole-page 375 px shots, the bar's cases are viewport shots at 375 only.
- **Proof.** Both reviewer probes, run in local-try mode and both required to fail: the bar moved to the top at 375 px, and the bar shown at 1280 px. Then the 34 images on Linux twice running.
- **Baselines.** Only the two bar images change (they become 375 by 812 viewport shots). They are made by the manual workflow on the branch and shown to the owner before they merge (as before).
- **C-07.** DR-067 and harness design 362 and 364 and the `playwright.config.ts` header state the 0.1 limit and what it lets through, with the probes (0.15 fails; a uniform brightness change of about 20 levels per channel passes; 32 fails), and give 34 cases and seven tests.
- **C-13 (in part).** `.nvmrc` added to both path lists in `visual.yml`; the proof runner's `-g` anchored to the end of the title (`prove-flags.ts`), with a test that `overview` does not select `overview: tab-bar`.

## Slice B: the proof and the rules (C-02, C-03, C-04, C-05 limited, C-11) (`claude/cds-48-r2-proof`)

- **C-03.** `failswith.mjs`: the presence-timeout phrase is refused wherever it is in the text (unanchored); a text made only of generic words and numbers (`assertionerror`, `error`, `expected`, `received`, `timeout`, `of`, `has`, `expired`, a number with `s`) is refused. `failswith.test.mjs` first, with the reviewer's seven texts (the prefixed presence timeout, the same without "to equal true", `Timeout of 5s`, `Expected 1`, `Error: 5`, `AssertionError: Expected`).
- **C-02.** `account.steps.ts`: after the cancel, the step waits for the card page or a settled state, then, if the browser is not on the card's own page, fails with one message whatever the address: `the redirect was followed: the browser is at '<its address>', not on the card's own page` (the address read from the page, so it is the real one; the browser's error page is named as such). The `javascript:` row also asserts no script ran (a flag set by the address's script; a dialog handler). `fixtures/bug-flags.json` for `open-redirect`: `failsWith` becomes `the redirect was followed: the browser is at '`. Proof: the outline with the flag on fails all five rows with that text; with the flag off all five pass; a broken Cancel button still fails differently.
- **C-04.** `util-mismatch` and `chart-no-values` record the reason as well as the rule, from the real CI lines: `has aria-valuenow 13 but the text beside it says 6%` for the bar and the line for the chart. `semantic-rules.ts` messages are made distinct per reason where they are not, with the rule tests first.
- **C-05, limited.** Fix: (a) the fill's drawn width is measured against the track's content box, so a border does not read as a short bar; (b) a name is a problem only when none of its percentages is the bar's own value (a fuller name that also states a limit is fine; `423600% of 510000` still fails); (c) a chart row's value is the last cell of the row (a month in a `td` is fine). The reviewer's three false-positive pages become tests, failing first. Recorded as known limits in UI specification section 9 (no change to the rules): a wrong value in words with no percentage sign, a wrong-width fill that is not the track's first child, a decimal percentage, the placeholder alt text by prefix, a descriptive alt not marked decorative, a value cell that repeats the month, a "0 of 0" cell. The section 9 table is brought up to date with v2 of the rules.
- **C-11.** The guard's comment no longer says `double-render` cannot be a marker.
- **Proof.** Mutations of each change (the unanchored search, the generic-word list, the single message, the content box, the "none equals" rule, the last-cell rule); the exit run on every real page reports no problem; `check:bug-flags` 30 of 30 on CI.

## Slice C: the report and the site, the README and the comments (C-06, C-08, C-09, C-13 in part) (`claude/cds-48-r2-report`)

- **C-06.** `files.ts` v2: a file is binary by its first bytes (PNG, JPEG, GIF, ICO, WOFF, WOFF2, TrueType, OpenType, EOT), not by its extension; a file named like an image or a font whose bytes are not that kind is a problem of its own (`report/a.png is named like an image but is not one`). Binary files are searched for the control key as bytes (the key as latin1 and as UTF-16, read from the buffer). The text scan adds: the key JSON-unescaped (`h` forms) and entity-decoded, the key hex-encoded, `Bearer` and `tok_` matched case-insensitively. Gzip and other compression are recorded as a known limit (the report holds none). `check-site.ts` and `check-report.ts` read buffers and use the same function. Tests first with the reviewer's cases; mutations; the new check on the real published site and the real report (3,892 files) must still pass.
- **C-13 (in part).** In the baselines workflow, `push` checks the PNG signature of each file, not only the name.
- **C-08.** The README says 216 component tests (and the count is read from the suite, not remembered).
- **C-09.** Stale comments corrected: `ci.yml` (the `ui` limit is 25), `visual.yml` (the `flags` limit is 40), `run.mjs` (the job limits are 10, 25, 25, 40), and a note at harness design section 30 that section 39 corrected its limits. The claim in section 39 that a hung run always ends with a message is corrected: the run limits sit below the job limits when the browser installs normally; with an install of 10 to 14 minutes the `ui` job's 25 minutes can be spent before the run limit (8 and 8), and a hung run is then cancelled without the message. Recorded as a known limit, not "fixed" by raising limits further.

## The records, after the three slices

- **DR-068.** What the review found (two reviews, 22 findings in the first round that were accepted, the confirmation pass's Blocker and eight Changes), what changed, the known limits (the visual check's 0.1 colour limit, the semantic rules' misses, compression in the secret scan, the unprotected `main`, the stamp that cannot tell a wrong run), and that the Phase 5 gate stands on its first evidence, now committed. The decision register's README range goes to DR-068.
- **Outcomes** appended to the review plan (2026-10-21), the fixes plan (2026-10-22) and this plan; the implementation log of CDS-48; the backlog (CDS-48 Done, the process-group kill and the other deferred items listed); CHANGELOG.
- The registry, landing card and capability matrix updates and the closure by `close-project` follow on the owner's word.

## Verification

- Every slice: `npm run verify` 14 of 14, every CI job read as a result, `check:bug-flags` 30 of 30 on CI, and the probes above.
- After slice A: the visual check green on Linux twice running against the refreshed baselines; both bar probes failing it.
- The proof is mine: no further reviewer (D4). If a probe shows a regression, I stop and report it.

## Delivery

- Order: A, B, C, then the records; each merged only on the owner's word and its own CI run. A and B and C touch different files, so they can be built while another's CI runs, and merge in order.
- Estimate (mine, not measured): about 1 session, plus the records.
- No downloads and no new dependencies.

## Out of scope

The process-group kill of timed-out catchers (backlog); protecting `main`; the other Notes as recorded; new Gherkin scenarios; the closure itself; the remaining semantic-rule misses (recorded as known limits).

## Risks

- **A new baseline refresh** and one more owner acceptance (slice A).
- **C-05's rule changes may flag, or stop flagging, a real page.** Any such page is reported, not hidden.
- **C-06's byte search on binary files may find the control key by chance** in a real report asset (a 15-character string in compressed image data is improbable; if it happens, I report it).
- **Slice B's single failure message** changes what `open-redirect` prints; the registry and the proof are changed together, and the proof on CI is the check.

## Outcome

[Appended after delivery.]
