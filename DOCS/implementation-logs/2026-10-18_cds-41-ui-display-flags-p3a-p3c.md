# CDS-41: P3, the eleven UI display and semantics flags (P3a to P3c) — 2026-10-18

## Session Summary

The eleven group B bug flags are built in the UI's test build and each is caught for its stated reason by a committed check (#103, #104, #105). Along the way the proof runner gained a third catcher kind (the exit run on one target with a flag on), the exit run gained seven semantic rules, the one unproven CDS-38 fix (form controls at doubled text, R2-C-04) was proved, and the flag proof moved to its own CI job. 19 of the 30 flags are now implemented and caught; 11 (group C) remain.

---

## Objectives

1. ✅ P3a (#103): the `exit-check` catcher kind, `duplicate-nav`, `nested-button`.
2. ✅ P3b (#104): seven semantic rules; `util-mismatch`, `minor-units-label`, `placeholder-aria`, `chart-no-values`, `button-href`, `decorative-alt`; the form-control font-size rule.
3. ✅ P3c (#105): `currency-format`, `double-render`, `ph-a11y`; the proof in its own CI job.
4. ✅ Records (this pull request): plan Outcome, backlog v69, CHANGELOG, README figures, this log.
5. ⏸️ P4 (CDS-42), the twelve behaviour flags: next, plan first.
6. ⏸️ The registry, landing card and capability matrix, updated when the owner asks.

---

## Test Results

| Check | Before (CDS-38 close) | After (`eee78fa`) | Status |
|---|---|---|---|
| `check:bug-flags` | 8 of 8 implemented | 19 of 19 implemented, 11 pending | ✅ PASS |
| Harness unit tests | 21 | 23 | ✅ PASS |
| Component tests | 198 | 198 | ✅ PASS |
| `@ui` executions | 59 | 59 | ✅ PASS |
| `check:ui-exit` | 124 axe scans, 288 layout checks | 124 and 288, 0 problems (the seven semantic rules run in the same scans) | ✅ PASS |
| `verify` | 14 of 14 | 14 of 14 | ✅ PASS |

CI durations, measured: `ui` job 5m37s (P3a), 8m47s with 16 flags in it (P3b), 4m57s after the proof moved out (P3c); `flags` job 7m39s (P3c); `Verify` 1m33s to 1m44s. Every pull request was merged after every job showed `pass`.

---

## Changes Implemented

### P3a (#103, `30e3168`)
`exit-check` catcher kind in `fixtures/bug-flags.json`, `schema-check.mjs` (target must exist; `failsWith` must be a message the run builds) and `prove-flags.ts`; `exitCheckRan` (unit tested). `exit-checks.ts` sets `HARNESS_BUGS` after its reset, clears them at the end, carries the control key in its browser contexts, and takes an exact target name. `duplicate-nav` and `nested-button` as `TEST_BUILD && flagOn(...)`. UI specification v30, harness design v4.

### P3b (#104, `9c86205`)
`src/exit/semantic-rules.ts`: `progress-value-matches-text`, `progress-name-matches-value`, `no-placeholder-names`, `chart-table-has-values`, `no-button-with-href`, `decorative-image-empty-alt`, `form-controls-follow-text-size`, evaluated after axe in every scan. Six flags built (`UtilisationBar`, the two chart tables, the overview tiles, the profile header image). With `font: inherit` removed, the font rule reports "13.3333px among text of 32px" (the CDS-38 R2-C-04 measurement). UI specification v31, harness design v5.

### P3c (#105, `eee78fa`)
`currency-format`, `double-render`, `ph-a11y`. The registry's planned scenarios caught all three, so no scenario changed (decision D3 not needed); `ph-a11y` also has axe `role-img-alt` for its icons. The proof moved to a `flags` CI job (decision D4). The public-build guard looks for five more flag names. UI specification v32, harness design v6.

---

## Technical Decisions

- Every defect branch is `TEST_BUILD && flagOn('name')` so the bundler removes it; the public-build guard (now 16 flag names plus the five markers, 21 strings) and a planted branch without `TEST_BUILD` prove it.
- The semantic rules run inside the existing scans, so the expected counts (124 and 288) did not change.
- A rule reports only its own flag (checked for `minor-units-label` and `placeholder-aria`).
- The proof's `flags` CI job runs beside the `ui` job; limit 30 minutes.

---

## Documentation Updates

UI specification v30 to v32 (sections 8 and 9); harness design v4 to v6 (sections 21); plan `2026-10-18_cds-41-ui-display-flags.md` (Outcome, delivered); plans index; backlog v69; CHANGELOG; README (19 of 30, the `flags` job).

---

## Lessons Learned

- **A flag that does not reach the page is not a failed catcher.** The first exit-check proof showed "PASSES" with the flag on because the exit run's browser contexts lacked the control key a test build needs to read the flags. A catcher that cannot fail looks the same as one that is not tried; the probe of removing the flag setting caught it.
- **Estimates of cost need one measurement.** An exit-check proof run was 17 seconds, not the 8 estimated; the decision to move the proof out of the `ui` job was taken on measured numbers.
- **Plan for the planned catchers to be wrong, and they were not.** The three scenario-caught flags needed no scenario change; the plan's stop for that case was never needed.
- **Shell quoting again:** edits with quotes or backslashes went through script files written with the file tool.

---

## Recommendations / Next Steps

1. P4 (CDS-42), the twelve group C flags: write the plan, present it, get it approved.
2. Update the registry, the landing card and the capability matrix (19 of 30) when you ask.

---
