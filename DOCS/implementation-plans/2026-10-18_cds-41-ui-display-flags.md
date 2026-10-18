---
version: 1
created: 2026-10-18T14:40Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-41
status: approved
approved: "2026-10-18, Gary Brooks, 'all as recommended, approved, push the plan PR' (D1 to D6 as recommended); merge only on the owner's word per pull request"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-41, P3 the eleven UI display and semantics flags

**Goal.** Implement the eleven group B bug flags in the React UI (`duplicate-nav`, `util-mismatch`, `currency-format`, `minor-units-label`, `placeholder-aria`, `chart-no-values`, `button-href`, `double-render`, `ph-a11y`, `nested-button`, `decorative-alt`), each shown by `npm run check:bug-flags` to turn a committed check red **for its stated reason**, and add the catchers the registry says do not exist yet. It serves the Phase 5 gate (decision brief 13, DR-064: every flag turns at least one committed check red for the stated reason) and takes the proof from 8 of 30 to 19 of 30. Stop point 2 of the Phase 5 plan.

## Evidence gathered before planning

Read only; nothing was run against the repository and nothing in it was changed.

| Finding | Consequence for the plan |
|---|---|
| `fixtures/bug-flags.json` marks all eleven `pending`, with a `plannedCatcher` for each: `currency-format`, `double-render` and `ph-a11y` by `@ui` scenarios; `duplicate-nav` and `nested-button` by existing exit checks; `util-mismatch`, `minor-units-label`, `placeholder-aria`, `chart-no-values`, `button-href` and `decorative-alt` by **new** exit checks. | Five flags need no new check if the planned one really fails (to be probed, not assumed); six need new exit-check rules. |
| The proof runner (`src/flags/prove-flags.ts`) and `schema-check` know two catcher kinds, `scenario` and `component-test`. The exit checks are a script, not Cucumber or Vitest. | A third catcher kind, `exit-check`, is needed first: the runner runs the exit script on one target with the flag set, off (must pass) and on (must fail with the recorded text). It is the largest part of this plan. |
| `exit-checks.ts` already has `CDS_EXIT_ONLY` (run the targets whose name holds the text) and fails when it matches nothing. It sets no flags. A UI flag is read once at start from `GET /__test/state`, so the flag must be set through test control before the page loads. | The exit script gains `HARNESS_BUGS`: it sets the flags once after the reset, as the Cucumber hooks do, and reads the state back. |
| The only UI flag built, `plural`, is `flagOn('plural')` inside `format.ts`. A call such as `flagOn('x')` keeps the string `'x'` in the public bundle; the public-build guard now looks for the names of the eleven group B flags (F11f). | Every defect branch is written as `TEST_BUILD && flagOn('name')` so the bundler removes it. The guard is the proof, and one probe plants a branch without `TEST_BUILD` to show it fails. |
| The exit run is about 2 min 45 s, and the `ui` CI job takes 5 to 6.5 minutes against a 15 minute limit (finding C-23, deferred to P5). Proving 8 exit-caught flags, off and on, adds up to 16 single-target exit runs. | The cost is measured in the first pull request and reported. If the job passes about 11 minutes, the proof moves to its own job before the next flag is added (decision D4). |
| The UI today: navigation in `layout/Layout.tsx`; bars in `components/UtilisationBar.tsx`; money in `format.ts`; charts in `pages/overview/HistoryChart.tsx` and `components/BalanceChart.tsx`; the payment-history year buttons in `components/PaymentHistoryWidget.tsx`; the info button and the header image in `pages/profile/ProfilePage.tsx`. | These are the places the defect branches go. No other UI behaviour changes. |

## Steps

Specification first, then three pull requests (each its own branch, its own CI run, merged only on your word). Each flag follows one loop: write or find the catcher and see it **pass with the flag off**, add the flag branch, see the catcher **fail on, with the recorded text**, record it in the registry, and run `check:bug-flags`.

### P3a: the exit-check catcher kind, and the flags the existing exit checks catch

1. **Specification.** UI specification section 8 (the catcher column follows the registry, F11f) and section 9 (what an exit-check catcher is); `bug-flags.json` and its schema check allow `kind: "exit-check"` with `target` (a name for `CDS_EXIT_ONLY`) and `failsWith`; harness design gains a line.
2. **Runner.** `prove-flags.ts` runs an exit-check catcher as `node scripts/run.mjs exit` with `CDS_EXIT_ONLY=<target>` and the flags in `HARNESS_BUGS`; `verdict.ts` is unchanged (it already judges `passed`, `ran` and output). `exit-checks.ts` sets the flags after its reset (`HARNESS_BUGS`) and prints "ran N checks"; a run of zero checks counts as `did-not-run`. Unit tests in `verdict.test.ts` for the new kind's `ran` rule.
3. **`duplicate-nav`** (`Layout.tsx`: both navigations rendered, `TEST_BUILD && flagOn(...)`). Caught by the existing layout check ("expected the bottom tab bar only, found 3 tab(s) and 3 top link(s)"), target `overview`.
4. **`nested-button`** (`ProfilePage.tsx`: the information button rendered inside a button). Caught by the existing axe pass (`nested-interactive`), target `profile`.
5. Probes (reverted afterwards): a flag branch written without `TEST_BUILD` makes the public-build guard fail; with the exit script's flag setting removed, each catcher reports "did not fail".

### P3b: the six flags that need a new exit-check rule

The rules are DOM checks run in every axe pass, so the 124 axe scans and 288 layout checks keep their counts; each rule has a named result so the recorded `failsWith` is specific.

6. **`util-mismatch`**: every `role="progressbar"` has `aria-valuenow` equal to the number in its visible percentage text (the score gauge excluded; it has no percentage). New rule `progress-value-matches-text`.
7. **`minor-units-label`**: a progress bar's accessible name may not hold a figure that is not its value (the defect names a bar "423600% of 510000"). New rule `progress-name-matches-value`.
8. **`placeholder-aria`**: no accessible name is a placeholder (`Accessible label`, `TODO`, `label`, empty). New rule `no-placeholder-names`.
9. **`chart-no-values`**: each chart's table alternative has a value in every row that the chart plots. New rule `chart-table-has-values`.
10. **`button-href`**: no `button` element, and no element with `role="button"`, carries an `href`. New rule `no-button-with-href`.
11. **`decorative-alt`**: an image the page marks decorative (`aria-hidden` or inside a decorative wrapper, here the profile header image) has `alt=""`. New rule `decorative-image-empty-alt`.
12. Each rule is first run **flags off against every target** (it must find nothing in the 62 pages and states), then its flag is added and it must find exactly the planted defect. The registry records the rule name as `failsWith`.

### P3c: the three flags the registry says scenarios already catch

13. **`currency-format`** (`format.ts`: money shown unformatted, `53024`), **`double-render`** (a list rendered twice during a route change), **`ph-a11y`** (the year buttons lose `aria-pressed`, the icons lose their text). For each: add the flag, then run the planned `@ui` scenarios with it on. **Whether the planned scenario fails is not yet known.** If one does not, I stop and bring you the choice (a one-line assertion in an existing step, a component test, or a new scenario) before changing any scenario text, because a scenario change is yours (the Gherkin store is specified).
14. Records for the whole of P3 (not per pull request): the implementation log, this plan's Outcome, backlog (CDS-41 Done, CDS-42 Ready), UI specification section 8 and the capability matrix figure (19 of 30), the CHANGELOG, DR entry only if a decision above changes a gate.

## Verification

- Every pull request: `npm run verify` 14 of 14, `check:ui`, `check:ui-scenarios`, `check:ui-exit` (124 scans and 288 layout checks unchanged), and its own CI run, jobs read as results.
- `npm run check:bug-flags`: 11 more flags "caught for the stated reason", 19 of 19 implemented flags, with each flag's table row showing off passes and on fails with the recorded text.
- Probes that must fail, reverted afterwards: a defect branch without `TEST_BUILD` (public-build guard); the flag-setting in the exit script removed (each exit catcher "did not fail"); each new rule against a deliberately planted defect other than its flag's (it must report its own rule name, so a rule cannot pass by catching something else).
- Flags-off regression: every existing check stays green with every flag off, including the 59 `@api` and 59 `@ui` executions and the 198 component tests.
- Measured and reported, not estimated: the `ui` job duration after P3a and after P3b.

## Delivery

- Branches `claude/cds-41-exit-check-catchers` (P3a), `claude/cds-41-semantic-rules` (P3b), `claude/cds-41-scenario-flags` (P3c), then `claude/cds-41-records`. Merge in order only on your word and after every job of each pull request's own CI run is read as a result.
- Estimate (mine, not measured): P3a 0.5 session, P3b 0.75, P3c 0.25, records 0.25: 1.75 sessions, against the Phase 5 plan's 1.5.
- No new dependency and no download. The portfolio root, registry and landing are updated when you ask.

## Out of scope

The twelve group C flags (CDS-42); visual regression (CDS-43); the Serenity report (CDS-44); the form-control font-size check (the CDS-38 follow-up; it can ride with P3b if you want, decision D5); any change to a scenario that is not accepted by you; the deferred review items.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1. Pull requests | (1) three: exit-check kind and two flags, six new rules, three scenario-caught flags (2) one for all eleven (3) one for each flag | (1) | as recommended, 2026-10-18 |
| D2. Where the new rules live | (1) a new module `src/exit/semantic-rules.ts` imported by `exit-checks.ts` (2) inside `exit-checks.ts` | (1): the file is already long, and the rules can be read and reviewed on their own | as recommended, 2026-10-18 |
| D3. If a planned scenario does not catch its flag (`currency-format`, `double-render`, `ph-a11y`) | (1) stop and ask, per case (2) add a component test as the catcher without asking (3) change the scenario | (1): a scenario change is yours; (2) is allowed only if you say so now | as recommended, 2026-10-18 |
| D4. If the `ui` job passes 11 minutes | (1) move the proof into its own CI job in P3b (2) keep one job and raise the limit (3) keep going and leave it to P5 (C-23) | (1) | as recommended, 2026-10-18 |
| D5. The form-control font-size check (follow-up from CDS-38) | (1) in P3b, as a twelfth rule `form-controls-follow-text-size` (2) later, with P5 (3) not at all | (1): it is the same mechanism and closes the one unproven fix | as recommended, 2026-10-18 |
| D6. Stop point after P3 | (1) stop after P3 for your decision (2) go straight on to P4 (CDS-42) | (1): the Phase 5 plan names this stop point | as recommended, 2026-10-18 |

## Outcome

[Appended after delivery.]
