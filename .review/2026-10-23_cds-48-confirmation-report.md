# CDS-48 confirmation pass: the reviewer's report, verbatim

- **Plan:** `DOCS/implementation-plans/2026-10-21_cds-48-phase-5-review.md` decision D4 (one confirmation pass), fixes plan `DOCS/implementation-plans/2026-10-22_cds-48-fixes.md` decision D5 (one fresh reviewer, Opus, blind, scoped to the fixes).
- **Reviewer:** one fresh-context subagent, model Opus, started 2026-10-23, blind to the first review's findings and to the author's reasons for each change.
- **Prompt:** `prompt_c.md`, SHA-256 `e6ba150b491f436490875a5bbb40aa4d733816f7c1d966c4d90727fd6c843fe9` (11,620 bytes), kept verbatim with the reviewer's copy of the repository (commit `663d9fb8a273af34544f6f0704c75c70684ff4ff`, which is `main` at `393f7b9` plus pull request #138) in the author's scratch folder.
- **The report below is unchanged.** The author's verification is in the file `2026-10-23_cds-48-confirmation-verification.md`.

---

# Review of the changes to credit-dashboard-sut since `1f87a06`

**Commit** `663d9fb8a273af34544f6f0704c75c70684ff4ff`. **Reviewed** 2026-10-23 (finished 08:58Z). **Ran:**
- the fixture check and the failure-text unit tests;
- the harness typecheck, `test:unit` and `test:rules`;
- the UI's own checks (`npm run check`) and a look through the public bundle;
- `npm run verify`;
- the visual check in local-try mode, with three probes;
- a local flag proof for `util-mismatch` and `open-redirect`, and the open-redirect outline with the flag on;
- `check:report` and `check:site` on the real CI artifacts of run 39921248868 (`main` at `393f7b9`), with mutation probes;
- read-only reads of CI runs, artifacts, action tags and the live site.

## Checks

| ID | What I examined | Items | Findings |
|---|---|---|---|
| C1 | All 30 registry entries (34 catchers); `failswith.mjs`, `schema-check.mjs`, `verdict.ts`, `prove-flags.ts`, `run.mjs`; the open-redirect path (`safeRedirect.ts`, two pages, the step); the CI proof table; a local proof of 2 flags; 6 judging mutations | 34 catchers, 6 mutations | 3 (C-02, C-03, C-04) |
| C2 | Public build guard and its test; `format.ts` flag calls; the public bundle searched for all 30 flag names plus 5 markers; 7 semantic rules with 11 hand-made pages in Chromium; exit counts in code, CI log, README and design | 7 rules, 35 strings, 11 pages, 4 count sources | 2 (C-05, C-11) |
| C3 | `cases.ts`, `visual.spec.ts`, `hide-tab-bar.css`, `playwright.config.ts`, both visual workflows; 34 baselines (sizes, hashes against 2 CI artifacts, pixel diff); 3 local-try probes | 34 cases, 34 images, 3 probes | 3 (C-01, C-07, C-10) |
| C4 | `files.ts`, `checks.ts`, `manifest.ts`, `site.ts`, both check scripts; real JSON (33 + 44 files), real report (3,890 files), real Pages artifact (3,892 files), live `commit.txt`; 18 report probes and 6 site probes | 24 probes | 2 (C-06, C-12) |
| C5 | Three workflows: permissions, tokens, 10 action pins against their tags, time limits against real durations (runs 39921248868, 39921248906, 39872760119), the two-job baselines workflow | 3 workflows, 10 pins, 3 runs | 2 (C-09, C-13) |
| C6 | Everything runnable locally; document counts (scans, layout checks, images, tests, executions, scenarios) against code and CI | 6 commands, 9 counts | 1 (C-08); others grouped above |

## Findings

### C-01 Blocker: the visual check no longer sees where the tab bar is, or a tab bar that should not be there

**Where:**
- `test-harnesses/harness-serenity/src/visual/hide-tab-bar.css:2`
- `src/visual/visual.spec.ts:54-55`
- `src/visual/cases.ts:28-30`

**What the code says:**
- `nav.nav-mobile { visibility: hidden !important; }` is applied to every whole-page shot, at both widths.
- The tab-bar case is `page.locator('nav.nav-mobile').toHaveScreenshot(...)`, a crop of the bar alone, so its position is lost.
- `cases.ts` says "nothing says it is right: it is photographed on its own".

**What it contradicts:**
- The project aim that the visual check catches a visible change.
- The UI specification's "one navigation at a time".

**Probes (local-try, against images made on this machine):**
- **Bar moved to the top.** `.nav-mobile { inset: 0 0 auto 0 }` puts the bar at the top of the screen at 375 px. Result: **35 passed**.
- **Bar shown on desktop.** `Layout.tsx:79` changed to `true || ...` renders the tab bar at 1280 px. Result: **35 passed**. The 1280 shots hide the extra bar too.
- **This is a regression.** Before this change the whole-page shots included the bar, so both mutations would have changed pixels.

**Why it matters:** these are visible layout defects the visual check caught before and does not now. The exit run's layout check counts navigations, so it catches the second probe but not the first.

**Suggested fix:**
- Apply the hiding stylesheet only to the 375 px shots.
- At 1280 px, assert `nav.nav-mobile` is absent.
- Take the tab bar as a viewport-sized (not full-page) shot of the overview at 375 px, so its position is in the image.

### C-02 Change: the open-redirect catcher fails for the stated reason on only 2 of its 5 rows

**Where:** `features-shared/security/open-redirect.feature` (the outline), `src/ui/steps/account.steps.ts:176-182`, `fixtures/bug-flags.json` (the `open-redirect` entry).

**What the registry and specification say:** the catcher fails with "the browser left the site: it is at '". UI specification section 8 lists this scenario as the catch.

**What happens.** I ran the outline locally with the flag on:
- `https://evil.example/steal` and `//evil.example/steal` print `LogicError: the browser left the site: it is at 'chrome-error://chromewebdata/'`.
- `/..//evil.example/steal`, `/.//evil.example/steal` and `javascript:alert(1)` print `AssertionError: Timeout of 5s has expired while waiting for <<detail-header>>.isPresent() to equal true`. That is the presence timeout `failswith.mjs` exists to refuse.
- With the flag on, the `javascript:` row is handed to `window.location.assign`, so a script runs in the page (test build only).
- The message names `chrome-error://chromewebdata/`, not the address. Design section 39 says it names `'<address>'`.

**Why it matters:**
- The verdict is right, because one row is enough. But 3 of the catcher's 5 executions are generic timeouts.
- The dot-segment and `javascript:` rows show nothing specific about the flag.
- Harness design section 39 records the 2-of-5 split. The registry and the UI specification do not.

**Suggested fix:**
- Make the other rows assert where the browser ended up: still on this origin, and on the fallback page. They should fail with a specific message.
- Have the `javascript:` row assert that no script ran.
- Or narrow the catcher to the two rows that leave the site.

### C-03 Change: the generic-failure-text rule can be bypassed with a prefix or a substring

**Where:** `fixtures/failswith.mjs:13-19`, `fixtures/schema-check.mjs:205`.

**What the code says:** the presence timeout is refused only when the whole text matches `^timeout of \d+s ... to equal true$`, and bare words only on an exact match.

**What it lets through:**
- The probe accepted:
  - `AssertionError: Timeout of 5s has expired while waiting for <<detail-header>>.isPresent() to equal true` (the real line from C-02);
  - the same message without "to equal true";
  - `Timeout of 5s`, `Expected 1`, `Error: 5`, `AssertionError: Expected`.
- I put the first text into `open-redirect`'s `failsWith` and `Timeout of 5s` into `range-stale`'s. `schema-check` then reported "868 checks, 0 failures".
- `judgeOn` matches by `includes`, so a prefixed or shortened text matches the output just as the full one does.

**Why it matters:** the rule's own claim, "rejects a recorded failure text that is ... a presence timeout", is not true of these texts.

**Suggested fix:**
- Search for the presence-timeout phrase anywhere in the text, without anchors.
- Refuse any text that is a substring of a known generic message.
- Require a timeout text to name a value.

### C-04 Change: exit-check failure texts name the rule and the element, not the reason

**Where:** `fixtures/bug-flags.json`: `util-mismatch` ("progress-value-matches-text: 'account-util-bar-creditcard'") and `chart-no-values` ("chart-table-has-values: 'history-chart-table'"). Rules at `src/exit/semantic-rules.ts:34, 36, 42, 66`.

**What the code does:**
- Since semantic rules v2, `progress-value-matches-text` prints three different reasons under the same prefix: no percentage beside the bar, aria-valuenow differing from the text, and the bar drawn the wrong width.
- `chart-table-has-values` now also fires for any cell without a digit, such as `n/a`.

**What it contradicts:** the registry's purpose, a text "another defect ... could not produce" (`schema-check.mjs:207-211`). A CSS defect that draws the bar too wide would be credited as `util-mismatch`.

**Suggested fix:** record the detail as well. The real CI line gives it: `'account-util-bar-creditcard' has aria-valuenow 13 but the text beside it says 6%`, and for the chart "has 6 of its rows without a value".

### C-05 Change: the semantic rules miss real defects and flag good pages

**Where:** `src/exit/semantic-rules.ts:33, 41-42, 51-52, 56, 66, 75`.

**Results in Chromium**, through the same `page.evaluate(SEMANTIC_RULES)` the rules test uses:

| Page | Expected | Result |
|---|---|---|
| A bar valued 100, drawn full, on a 60 px track with a 2 px border | No problem | Flagged: "drawn 93% wide" |
| The name "Credit cards utilisation 6%, best kept under 30%" | No problem | Flagged by `progress-name-matches-value` |
| A chart table with the month in a `td` ("May") | No problem | Flagged |
| A name with the wrong value and no % sign ("13 percent" for 6) | Problem | Missed |
| A wrong-width fill that is not the first child | Problem | Missed |
| Text "6.5%" (the regex reads it as 5) | Problem | Missed |
| The placeholder "Accessible label 1" | Problem | Missed |
| A descriptive alt on an image not marked `data-decorative` | Problem | Missed |
| A chart value cell that repeats the month | Problem | Missed |
| The value cell "score 0 of 0" | Problem | Missed |

UI specification section 9's table still describes the v1 rules: "aria-valuenow differs from the percentage" and "a row ... has an empty cell". It leaves out the drawn-width and figure checks.

**Why it matters:** the real pages pass today (the real bar has no border), so this is a weakness, not wrong evidence.

**Suggested fix:**
- Measure the fill against the track's content box.
- Compare only the percentage nearest the bar's own wording.
- Match placeholders by prefix.
- Read the value cell by its column header.
- Update the section 9 table.

### C-06 Change: the secret scans skip anything named like an image or font, and miss common encodings

**Where:**
- `src/report/files.ts:7` (`BINARY` decides by extension only)
- `scripts/check-site.ts:158`
- `scripts/check-report.ts:44`
- `src/report/checks.ts:56-59`
- `src/report/site.test.ts:76` (the test titled "found in any kind of file")

**On the real report and site, these passed with no problem:**
- the control key as plain text in `report/a.png` and in `report/a.ttf` (`check:site`);
- the control key in a `.png` and a `.woff2`, and `Bearer tok_<32 hex>` in a `.jpg` (`check:report`);
- the key JSON-escaped (`harness-run-key`), HTML-entity escaped, hex-encoded, as UTF-16, or gzipped;
- a lower-case `bearer` header;
- an upper-case `TOK_` token.

Base64 and `.svg` were caught. The site test passes text straight to the pure function, so it never exercises the extension skip its title claims to cover.

**Why it matters:** the instruction asks whether such a file gets through "whatever its name or type". It does. Nothing today does this: there is no Photographer, and the 64 PNGs are Serenity's own assets.

**Suggested fix:**
- Decide binary by magic bytes.
- Also search binary files' bytes, read as latin1, for the key.
- Add JSON-unescaped, entity-decoded and case-insensitive passes.

### C-07 Change: the documents still give the old colour limit, and do not say what 0.1 lets through

**Where:**
- `DOCS/decision-register.md:82` (DR-067, edited in this change): "cannot see a one-channel colour change of 10 steps (inside its 0.2 colour distance)".
- `DOCS/.design/harness-design.md:364`: "inside the colour distance of 0.2, and that is the check's stated limit".
- `harness-design.md:362`: "lists the 32 cases ... six tests" (the code has 34 cases and 7 tests).
- `playwright.config.ts:6`: "fails 12 of the 32 images".

**What the code says:** `threshold: 0.1, maxDiffPixelRatio: 0`.

**Probe (local-try):** a 20-level rise in every channel of the light accent (`#0b5cad` to `#1f70c1`) and of the body text (`#14202b` to `#28343f`) together passed all **35**. Raising the accent by 32 and shifting the text's green failed 14.

My reading of the maths (YIQ distance): a uniform brightness change of up to about 26 levels per channel passes. The one-channel 10-step change named in DR-067 still passes at 0.1.

**Suggested fix:** state the 0.1 limit and what it lets through, in DR-067's successor and in harness design section 32, and correct "32 cases, six tests".

### C-08 Change: the README's component-test count is out of date

**Where:** `README.md:17`: "with 208 component tests".

**Measured:** `npm run check` in the UI reports "Tests 216 passed (216)".

**Suggested fix:** 216, or drop the count.

### C-09 Change: the time-limit comments are stale, and the run limits do not always sit below the job limits

**Stale comments:**
- `ci.yml:134-135`: "the `ui` job has a 15 minute limit". It is 25.
- `visual.yml:4`: "the `flags` job, which is at 17 of its 30 minutes". It is 40.
- `scripts/run.mjs:14`: "below the CI job's own (10, 15, 15, 30 minutes)". The jobs are now 10, 25, 25 and 40.
- `harness-design.md:330` gives api 10, ui and exit 15, flags 60. Section 39 corrects this later, with no note at section 30.

**The claim that does not hold:** design section 39 (A-09) says the run limits "sit below the job limits ... so a hung run ends with a message and not a cancelled job". The `ui` job's own comment allows a browser install of over 10 minutes (design: 10 to 14). Add the `ui` limit (8) and the `exit` limit (8) and the job's 25 minutes are exceeded. In that case a hung exit run is cancelled with no message.

**Measured:** flags proof 16 min 10 s against its 25-minute run limit; exit run 1 min 54 s.

**Suggested fix:** correct the comments, and either size the `ui` job for install plus both run limits or record the gap.

### C-10 Note: the committed baselines are a mix of two CI runs, and CI rendering varies

- 31 of the 34 images equal the `visual-baselines` artifact of run 39872760119.
- 3 (`hard-searches-1280-light`, `personal-details-1280-{light,dark}`) are unchanged from `1f87a06`.
- Pixel diff: between CI runs these pages differ on 4 to 18 pixels, each by one channel step. The 0.1 colour distance absorbs this.
- So the colour distance cannot drop much further without flaky failures.

### C-11 Note: the public build is clean; the guard has small gaps

The bundle built without the test-build variable holds none of the 30 flag names and none of the 5 markers. Every flag call in `src` sits behind `TEST_BUILD &&`. The guard covers all 21 UI flags in the registry.

Gaps:
- `QUOTED_FLAG_MARKERS` would miss `plural` as an unquoted object key or property after minifying.
- The guard's comment (lines 15-16) names `double-render` as a flag that "cannot be a marker", yet it is in `FLAG_MARKERS`.
- `schema-check`'s UI specification section 8 cross-check skips the 7 profile flags, which are listed in another document.

### C-12 Note: what `check:report` compares, and what it cannot

- It caught a dropped scenario, a scenario recorded twice and a removed outline row.
- It passed: a row whose values changed, an outline whose own result is `FAILURE` while its rows say `SUCCESS`, and a scenario with every step removed.
- The commit stamp is written and checked from the same `github.sha`, so it cannot tell a wrong run. This is documented (N-3).
- The live `/report/commit.txt` names `393f7b9e...`, which is current `main`. I found no key or token in the live index pages.

### C-13 Note: the workflows are tightly scoped, with three small gaps

- All 10 action pins match their stated tags.
- In run 39872760119, `make` had "Contents: read" and `push` had "Contents: write". `push` runs only git and shell.
- Gaps:
  - `push` checks PNGs by file name only, not by content.
  - `make` can still write the npm and NuGet caches.
  - `visual.yml`'s path filter leaves out `.nvmrc`.
- `prove-flags.ts:81` uses an unanchored `-g`. A future 375 px catcher for `overview` would also match `overview: tab-bar`.

## What I ran

| Command | Outcome |
|---|---|
| `npm ci` in `fixtures`, root, `packages/api-client`, UI, harness | OK |
| `fixtures: npm run check` | 868 checks, 0 failures; 4 of 4 tests |
| `harness: npm run typecheck` | Clean |
| `harness: npm run test:unit` | 83 of 83 |
| `harness: npm run test:rules` | 8 of 8 |
| `UI: npm run check` | 216 component tests, 32 guard tests, build, guard: "none of 25 markers" |
| `npm run verify` (venv inside the copy) | 12 of 14 pass. Service tests failed because Windows refused to launch testhost ("The directory name is invalid"; "The filename or extension is too long": a path-length limit). The Kanban step failed because `DOCS/backlog.md` was removed from the copy. Both are environmental; CI Verify passed |
| `VISUAL_LOCAL_TRY=1 run.mjs visual --update`, then `visual` | 35 passed (throw-away images, not a result) |
| `VISUAL_LOCAL_TRY=1 run.mjs flags util-mismatch open-redirect` | Both caught; the visual catcher ran locally |
| `run.mjs flags util-mismatch` without local-try | Visual catcher "not run here"; still caught |
| `HARNESS_BUGS=open-redirect run.mjs ui security/open-redirect` | 2 rows left the site, 3 presence timeouts (C-02) |
| `CI=true check:report` on the real artifacts | Pass: 33 @api (60 executions), 44 @ui (59), 3,799 files read |
| `check:site` on the real Pages artifact | Pass: 3,892 files |
| `gh run view` / `download` for runs 39921248868, 39921248906, 39872760119, 39813135437 | Read logs, durations, proof table, baselines, permissions |

**Mutation probes, all reverted (confirmed with `cmp`):**

| Probe | Result |
|---|---|
| `failsWith` set to the prefixed presence timeout, and `Timeout of 5s` | Accepted (C-03) |
| `verdictOf` counting a visual catcher as a reason | 1 test fails |
| `judgeOff` ignoring the failure text | 1 test fails |
| Image-name rule without the visual-check exemption | 1 test and 2 registry checks fail |
| Tab bar moved to the top; tab bar shown at 1280 px | 35 passed (C-01) |
| Colour +20 per channel | 35 passed; +32 fails 14 (C-07) |
| 11 semantic-rule pages | See C-05 |
| 18 report probes and 6 site probes | See C-06 and C-12 |

## What I could not examine

- **The Serenity HTML generation.** It needs Java, which is not on this machine. I checked the HTML only as the CI artifact.
- **The visual check against the Linux baselines,** and the visual catchers against them. I used only local-try images and CI logs.
- **The .NET service tests,** which Windows would not launch from this folder.
- **The Kanban check,** because the backlog was removed on purpose.
- **Repository settings,** such as required checks and branch protection, which decide whether the path-filtered `Visual` workflow can be skipped on a pull request.
- **The CI run for this commit (39923798977),** which was still in progress.
- **Tool caches.** The permitted `npm ci`, `pip` and `dotnet` runs wrote their usual caches under the user profile, outside the copy.
