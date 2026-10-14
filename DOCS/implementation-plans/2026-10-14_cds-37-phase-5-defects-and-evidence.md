---
version: 1
created: 2026-10-14T08:30Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-37
status: proposed
approved: not yet
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-37, Phase 5, defects and evidence

**History of this plan.** Presented in full to the owner on 2026-10-14 after a read-only spike, with six decisions put in decision brief 13 (awaiting the owner). Until the brief is answered and the plan approved, no flag, scenario or workflow is built. This file is the plan as written for approval.

**Goal.** Make the system under test do what it was built to do: break on command, and prove that the portfolio's checks notice. The README exit for Phase 5 is: *every flag turns at least one scenario red for the stated reason; the report is published* (with visual regression in the phase's deliverables). Concretely: the 30 bug flags in the contract change behaviour when test control switches them on; each flag has a named, committed check that goes red for the stated reason with the flag on and stays green with it off; screenshots are compared at two widths and two themes; and the Serenity/JS report is published.

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| The contract's `BugFlag` enum holds **30 flags**: 7 for the API (API specification section 10), 16 for the UI (UI specification section 8) and 7 for the profile (My Profile feature spec section 7) | The work is sized by 30 flags, grouped 7 / 11 / 12 below |
| **No flag changes any behaviour.** The service stores flags (`PersonaStore.SetFlags`, `GET /__test/state`, 4 188 lines of service code) and nothing reads them; the UI never asks for them | Every flag must be implemented, not only proved. The proof is meaningless until a flag does something |
| UI specification section 3 proposes that the UI reads flags "from `GET /__test/state` at start, or from `?bugs=` locally"; section 6.8 specifies a debug panel; neither is built. `/__test/state` needs the control key (DR-008) | How a browser learns the flags is a real decision (D1) |
| Existing checks already catch 21 of the 30 on paper (the 59 `@api` scenarios and response validation catch all 7 API flags; the 41 `@ui` scenarios, the exit checks and the security scenario catch most UI and profile flags) | Most of the proof is a mapping plus a runner, not new tests |
| **Nine flags have no committed catcher today:** `util-mismatch`, `minor-units-label`, `placeholder-aria`, `chart-no-values`, `button-href` and `decorative-alt` (accessibility and semantics) have no check that reads the thing they break; `toggle-label`, `truncate-summary` and `lost-edit` have no scenario (the CDS-18 review's finding F-20) | Six need an exit check; three need a scenario or a component test (D4, D5) |
| The README gate says "every flag turns at least one **scenario** red"; six of the flags are accessibility or semantics defects that axe-core or a role check catches, not a Gherkin scenario | The gate wording needs deciding (D5) |
| The harness validates every response against the contract (Ajv), so a flag that breaks the contract is caught by whichever scenario fetches that response | The API proof can reuse the existing scenarios unchanged |
| The harness design lists a `setBugs(flags)` method on `ControlTheTestEnvironment`, but the class has only `reset`, `bind` and `setClock`; no harness code calls the `testSetBugs` operation | The proof runner needs `setBugs` added (a small change in P1). Scenarios stay as written: the runner, not the scenarios, switches the flag |
| Another portfolio project (`parabank-bank-automation`) already publishes a Serenity BDD report on Pages: `@serenity-js/serenity-bdd` with a Java 21 step in CI, a prepared-and-checked Pages folder, then `deploy-pages` from `main` | A precedent to follow. Here Pages already serves the Kanban board and DR-060 says "the board only" |
| The UI has a light and a dark theme (`prefers-color-scheme`). CI found on Linux fonts what the Windows machine did not (a 5 px sideways scroll) | Screenshot baselines are font-dependent: they cannot be compared across the two machines (D2) |
| Phase 3 and Phase 4 had no independent review (DR-058, DR-063); CDS-38 is commissioned (brief 12 D1 option 2) | Flags add branches to the UI code. Reviewing first is cheaper than reviewing around them (D6) |

## The 30 flags, grouped

| Group | Flags | Where the defect lives | Catcher today |
|---|---|---|---|
| A. API (7) | `excluded-in-total`, `rounding-down`, `history-carry-forward`, `idor`, `problem-json-missing`, `mask-format`, `currency-float` | Service | `@BR-05`, `@BR-03`, `@BR-02`, the `idor` security scenario, the response validator (three flags), the masking scenarios |
| B. UI display and semantics (11) | `duplicate-nav`, `util-mismatch`, `currency-format`, `minor-units-label`, `placeholder-aria`, `chart-no-values`, `button-href`, `double-render`, `ph-a11y`, `nested-button`, `decorative-alt` | UI | `currency-format`, `double-render` and `ph-a11y` by `@ui` scenarios; `duplicate-nav` and `nested-button` by the exit checks; **six have none** |
| C. UI behaviour (12) | `range-stale`, `toggle-label`, `like-both`, `plural`, `open-redirect`, `truncate-summary`, `negative-balance`, `preferred-on-report`, `preferred-no-trim`, `email-stays-verified`, `pii-in-title`, `lost-edit` | UI (and `preferred-no-trim` in the service's trim) | Scenarios for nine; **three have none** |

## Steps

Specification first. Eight pull requests (P0 to P7), each merged in order on the owner's word and its own CI run. Each slice ends with its own flags proved, its records, and a stop point: the owner may stop the phase after any slice with an honest label ("Phase 5 partly built: n of 30 flags proved").

**P0, specification (this plan's pull request).** The plan; decision brief 13 (D1 to D6); the next decision record; backlog v63 with the slice tickets CDS-39 to CDS-45; the README gate wording if D5 changes it; UI specification and API specification notes for what they now say about flags (v21 and v26).

**P1 (CDS-39), the mechanism and the proof runner.**
1. `Flags` in the service: one place that answers "is this flag on for this request"; test control stays the only way to set it (DR-008); a service test that every one of the 30 names in the enum is either implemented or listed as pending, as the operations coverage test does.
2. The UI reads the flags once at start in a **test build** only (D1); the public build contains none of it; a hook `useFlag(name)`.
3. The debug panel of UI specification 6.8 (`debug-flag-{flag}`, `debug-persona`, `debug-clock`, `debug-reset`), test build only.
4. `fixtures/bug-flags.json`: for each flag, its group, the layer it lives in, its catcher (a scenario name or tag, an exit check, or a service test) and the failure it must produce (a substring of the failing step or message). A schema check in `verify` that every contract flag has an entry and every entry names a flag in the contract.
5. `scripts/prove-flags.mjs` (harness package): starts the service as `run.mjs` does; for each flag, runs its catcher with the flag **off** (must pass), then **on** (must fail, and the failure must contain the recorded text), then resets; writes a table (`reports/bug-flags.json` and `.md`) and exits non-zero if any flag is "not caught", "caught for another reason" or "no effect". `npm run check:bug-flags` at the repository root; a step in the `ui` CI job once P1 to P4 are in.
6. Probes: a flag mapped to a catcher that does not fail is reported "not caught"; a flag whose effect is removed is reported "no effect"; a catcher that fails with the flag off is reported as a false alarm.

**P2 (CDS-40), group A, the seven API flags.** Implement each in the service where the rule lives (`BusinessRules` stays pure: the flag changes the call site, not the rule's tests). Each has a service test showing the contract or rule breaks with the flag on. Prove with the existing `@api` scenarios and the response validator; Schemathesis stays clean with every flag off. *Stop point 1: the API half of the proof.*

**CDS-38, the independent review of the UI and harness**, between P2 and P3 if D6 is accepted. Fresh-context agent, findings triaged and handled as CDS-24 was. Its own short plan.

**P3 (CDS-41), group B, the eleven UI display and semantics flags.** Implement; add the exit-check catchers for the six that have none (a progress bar's name must match its value and may not be a placeholder; a chart's table alternative must carry values; no `button` with `href`; no interactive element inside another; a decorative image has an empty `alt`; the percentage text equals `aria-valuenow`). These live in `src/exit/exit-checks.ts` and are listed per flag in `bug-flags.json`. *Stop point 2: the display half.*

**P4 (CDS-42), group C, the twelve UI behaviour flags.** Implement; add the three missing catchers (D4: scenarios `toggle-label`, `truncate-summary`, `lost-edit` in the existing feature files, with steps and glossary entries; a scenario change goes to the owner's review before merge, as CDS-24's did). The `@ui` count moves 41 to 44 and the specified total 73 to 76. *Stop point 3: all 30 flags proved.*

**P5 (CDS-43), visual regression.** Screenshots of eight pages at 375 and 1280 px in light and dark (32 images) compared against baselines with a small pixel tolerance (D2): a script `src/exit/visual-checks.ts` beside the exit checks, `npm run check:visual`, baselines generated and compared in CI on Linux only, a manual workflow to refresh them, the diff images uploaded as a CI artefact on failure. The proof: a visible change (a colour, a margin) fails the check; a flag that changes the look (`util-mismatch`, `currency-format`) is caught by the snapshot as well as by its own catcher.

**P6 (CDS-44), the published Serenity report.** `@serenity-js/serenity-bdd` added to the harness; the `ui` and `api` runs write Serenity JSON; Java 21 in CI; the report generated and checked; a Pages folder prepared and validated (as `parabank-bank-automation` does); `pages.yml` extended to publish the board at `/` and the report at `/report/` from `main` only (D3). DR-060 amended. The page states the commit it was built from.

**P7 (CDS-45), exit.** `check:bug-flags` for all 30 in CI; the visual checks and the report published and linked from the README; the full run; records; a Phase 5 gate decision brief for the owner. The gate record is the owner's.

## Verification

- Every slice: `npm run verify` and the `ui` job pass locally and in the pull request's own CI run, with counts and durations as measured. The existing 59 `@api` and 41 (later 44) `@ui` scenarios stay green with every flag off.
- Probes that must fail, reverted afterwards: for the runner (above); for each new exit check, a planted defect; for each new scenario, the flag it exists for.
- Exit: 30 of 30 flags "caught for the stated reason" in `reports/bug-flags.md`; the visual check green on Linux CI and failing on a planted visual change; the report published and reachable; the Pages site still serves the board.

## Delivery

- Branches `claude/cds-37-phase-5-plan` (P0), then `claude/cds-39-flag-mechanism`, `claude/cds-40-api-flags`, `claude/cds-41-ui-display-flags`, `claude/cds-42-ui-behaviour-flags`, `claude/cds-43-visual-regression`, `claude/cds-44-serenity-report`, `claude/cds-45-phase-5-exit`, each followed by a records pull request and an implementation log. Merge in order only on the owner's word and each pull request's own CI run.
- Estimates (mine, not measured), in sessions: P0 0.5, P1 1.5, P2 1, P3 1.5, P4 1.5, P5 1, P6 1, P7 0.5: about 8 to 9. Phase 4 took one long run for what was estimated at 7 to 8.
- Possible downloads needing the owner's permission: none expected; a pixel-comparison library (pinned, at least two weeks old) is a dependency, not a download of a binary. Java 21 is installed in CI only.

## Out of scope

The address, employment and finances profile pages (DR-022); a container image; the nightly Schemathesis run with a stateful phase; flags beyond the 30 in the contract; any change to the Phase 4 UI that is not a flag or a catcher for one (CDS-38's findings are separate).

## Decisions put to the owner

Decision brief 13 holds the options, the arguments against and the read-back.

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 How the browser learns the flags | A test build reads `GET /__test/state` with the key the harness supplies; `?bugs=` only; a new keyless read endpoint; build-time flags | Test build reads state with the harness's key | pending |
| D2 Screenshot baselines | Linux CI only; a pinned container; local and CI with a wide tolerance | Linux CI only | pending |
| D3 Where the report is published | Pages beside the board; a CI artefact only; Pages from release tags | Pages beside the board | pending |
| D4 The three missing catchers | Three new `@ui` scenarios; component-test catchers; drop the flags | Three new scenarios | pending |
| D5 What counts as a catch | Any committed automated check listed per flag; Gherkin scenarios only | Any committed check, listed per flag | pending |
| D6 When CDS-38 (the independent review) runs | After P2, before the UI flags; after Phase 5; alongside | After P2 | pending |

## Outcome

[Appended after delivery.]
