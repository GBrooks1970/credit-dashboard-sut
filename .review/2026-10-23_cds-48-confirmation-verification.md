# CDS-48 confirmation pass: the author's verification and the owner's sign-off

- **The reviewer's report:** `2026-10-23_cds-48-confirmation-report.md`, unchanged.
- **Method:** each finding checked against the code or by a run on this machine, kept apart from the report. "Reproduced" means I ran it. "Confirmed" means I read both sides and they say what the reviewer quotes. "Not re-run" means I have only the reviewer's result.
- **Date:** 2026-10-23.

## Verification

| ID | Severity (reviewer) | My check | Result |
|---|---|---|---|
| C-01 | Blocker | Moved the tab bar to the top (`inset: 0 0 auto 0` on `.nav-mobile`) and ran `VISUAL_LOCAL_TRY=1 node scripts/run.mjs visual` against images made from the unchanged code | **Reproduced.** 35 passed. The whole-page shots hide the bar and the bar's own image is a crop, so its position is in no image. A regression from CDS-48 slice 3: before it the bar was in every 375 px page image. The second probe (the bar shown at 1280 px) follows from the same CSS and is not re-run. |
| C-02 | Change | `HARNESS_BUGS=open-redirect node scripts/run.mjs ui security/open-redirect` | **Reproduced.** Two rows fail with "the browser left the site: it is at 'chrome-error://chromewebdata/'"; three fail with the presence timeout. The message names the browser's error page, not the address. |
| C-03 | Change | Read `fixtures/failswith.mjs` | **Confirmed.** The presence-timeout rule is `^…$`, so a prefixed or shortened text passes; bare words are refused on an exact match only. |
| C-04 | Change | Read `fixtures/bug-flags.json` and `semantic-rules.ts` | **Confirmed.** The recorded texts are `rule: 'element'`; since semantic rules v2 `progress-value-matches-text` prints three different reasons under that prefix. |
| C-05 | Change | Not re-run | The reviewer ran 11 hand-made pages through `SEMANTIC_RULES`: three false positives and seven misses. I have not run them. The false positives follow from the code as I wrote it (all percentages in a name are compared; every cell of a chart row needs a figure). |
| C-06 | Change | Read `files.ts` and both scripts | **Confirmed.** A file is binary by extension alone and its text is then empty, so the key in `report/a.png` is never looked at. The bearer pattern is case-sensitive. |
| C-07 | Change | Read DR-067, harness design 362 and 364, `playwright.config.ts` | **Confirmed.** All still say 0.2, "32 cases", "six tests", "12 of the 32". The reviewer's colour probe (+20 per channel passes, +32 fails 14) is not re-run; my own probe on 2026-10-22 showed a shift of 0.15 passes 0.2 and fails 0.1. |
| C-08 | Change | `README.md` line 17 | **Confirmed.** "208 component tests"; the UI suite has 216. |
| C-09 | Change | Read the comments | **Confirmed.** `ci.yml` 135 ("15 minute limit"), `visual.yml` 4 ("17 of its 30 minutes"), `run.mjs` 14 ("10, 15, 15, 30") are stale. The reviewer's arithmetic on the `ui` job (install up to 14 minutes + run limits 8 and 8 exceeds 25) is correct. |
| C-10 | Note | Not re-run | The baselines are a mix of two CI runs, as I recorded when I kept three old files. |
| C-11 | Note | Read `public-build-guard.mjs` | **Confirmed.** The comment says `double-render` cannot be a marker while `FLAG_MARKERS` has it. |
| C-12 | Note | Not re-run | Recorded as the reviewer wrote it. |
| C-13 | Note | Read `visual.yml` and `prove-flags.ts` | **Confirmed.** `.nvmrc` is not in the Visual path filters; the `-g` title is escaped but not anchored. The two PNG-by-name and cache points are not re-run. |

## Owner's sign-off (2026-10-23, by interview, all as recommended)

- **C-01:** hide the bar only in 375 px whole-page shots; do not hide it at 1280 px; photograph the bar as a viewport-sized shot of the overview at 375 px. Baselines refreshed once more and shown to the owner.
- **C-02:** specific assertions on all five rows (where the browser ended up; no script ran for `javascript:`).
- **Other Changes:** fix C-03, C-04, C-06, C-07, C-08, C-09; C-05 limited to the two false positives, the bar's border box and the section 9 table, the rest recorded as known limits; the cheap Notes (anchored `-g`, `.nvmrc` in the Visual paths, the guard comment).
- **A further review:** none. Author verification instead: each fix test-first and mutation-proved, every CI job read, the visual check on Linux twice, the evidence recorded.
- **Notes C-10 and C-12:** recorded, no change.
