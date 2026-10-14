---
version: 1
created: 2026-10-14T08:30Z
project: credit-dashboard-sut
type: decision-brief
brief: 13
subject: "Phase 5 (defects and evidence): how the flags reach the UI, what counts as a catch, and three build choices"
blocks: The Phase 5 plan (CDS-37); slices P1 to P7 (CDS-39 to CDS-45)
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

# Decision brief 13: Phase 5, defects and evidence

**Items to decide:** D1 how a browser learns which flags are on; D2 where screenshot baselines are made; D3 where the Serenity report is published; D4 the three flags that have no catching scenario; D5 what counts as a "catch"; D6 when the independent review (CDS-38) runs.
**Blocks:** approval of the plan `DOCS/implementation-plans/2026-10-14_cds-37-phase-5-defects-and-evidence.md`. Nothing is built until it is approved. Nothing in the repository is broken while this waits.
**Reply with:** "D1: option n, D2: option n, D3: option n, D4: option n, D5: option n, D6: option n", with any conditions. The answer is read back before anything is recorded.

## 1. Why this brief exists

Phase 5 is the reason the system under test exists: it can be made to break on command, and the portfolio's checks should notice. The spike found that **none of the 30 flags changes any behaviour yet**, so the phase builds the defects as well as proving them, and it found six choices the plan cannot make for you.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (the plan cannot be approved with D1 to D6 open)
- [ ] A decision already made implicitly in an artefact needs ratifying
- [x] An earlier decision is being narrowed (DR-060 says the Pages site carries the board only; the README gate says "scenario")
- [ ] Two documents disagree

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | The contract's `BugFlag` enum holds 30 flags: 7 API, 16 UI, 7 profile. The service stores them and nothing reads them; the UI never asks for them | `openapi.yaml`; `PersonaStore.SetFlags`; a search of the service and the UI |
| B2 | `GET /__test/state` returns the flags but needs the control key (DR-008). UI specification 3 proposes the UI read it "at start, or `?bugs=` locally" | UI specification 3 and 6.8 |
| B3 | 21 of the 30 flags already have a committed catcher on paper. **Nine do not:** six accessibility or semantics flags (`util-mismatch`, `minor-units-label`, `placeholder-aria`, `chart-no-values`, `button-href`, `decorative-alt`) and three behaviour flags with no scenario (`toggle-label`, `truncate-summary`, `lost-edit`; CDS-18 finding F-20) | The plan, 'The 30 flags, grouped' |
| B4 | The README gate for Phase 5 reads: "every flag turns at least one **scenario** red for the stated reason; report published" | README 'SDD workflow' |
| B5 | Screenshot comparison depends on fonts. The same pages differed between this Windows machine and Linux CI (a 5 px sideways scroll), found in CDS-36 | Run 38477792933; harness design section 25 |
| B6 | The Pages site serves the Kanban board only (DR-060). Another portfolio project (`parabank-bank-automation`) publishes a Serenity BDD report on Pages with Java 21 in CI | `pages.yml`; that project's `ci.yml` |
| B7 | CDS-38, an independent review of the UI and harness, is commissioned (brief 12 D1 option 2) and has no place in the order yet | Backlog v62 |

## 3. Decision items

### D1. How a browser learns which flags are on

**What is being decided.** The UI must change its behaviour when test control switches a flag, without leaking test control into the public demo (DR-008, DR-037).

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **A test build of the UI reads `GET /__test/state` once at start, with the control key the harness supplies** (put in session storage by the browser script before the page loads). The public build contains none of this code | Flags are set one way (test control) and reach the UI the same way; the key never ships in a public build; the harness builds the UI in test mode | Recommended |
| 2 | **`?bugs=` in the address only** | Simple, but the flag is then set by the browser, not by test control, so the API flags and the UI flags are set two different ways and the proof runner must know which | Considered |
| 3 | **A new keyless read endpoint** for the flags, on only when test control is on | The UI needs no key; but a contract change and a softer DR-008 (state readable without the key) | Considered |
| 4 | **Do nothing.** Build flags into the UI at build time | Rejected by DR-008 (flags are off by default and switched at run time) | Considered |
| 5 | **Reframe.** Make every UI flag a server-side switch that changes what the API returns | Cannot recreate a front-end defect (a wrong label, a missing `aria`) | Considered |

**Recommendation: option 1.** The evidence: DR-008 puts flags behind the key, and B2 already proposes this read. The judgement: one way to set a flag is easier to prove than two. **The argument against.** A key in a browser's session storage is a secret in a place scripts can read; it exists only in a test build against a synthetic key, but it is a habit worth not forming. Option 2 avoids it at the cost of two mechanisms. **What would change it:** wanting the proof to run with no key in the browser at all (then option 2, with the runner setting `?bugs=`).

### D2. Where screenshot baselines are made

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Linux CI only.** Baselines are generated and compared in CI; a manual workflow refreshes them; the diff images are an artefact on failure. The check does not run on the Windows machine | Reliable; no font noise; a local developer cannot run the visual check | Recommended |
| 2 | **A pinned container image** for both machines | Same pixels everywhere; needs Docker for the check and a container image the project does not have (out of scope) | Considered |
| 3 | **Local and CI, with a wide tolerance** | Runs anywhere; the tolerance hides real changes | Considered |
| 4 | **Do nothing.** No visual regression | The README Phase 5 deliverable is not met | Considered |

**Recommendation: option 1.** B5 is the evidence: a 5 px difference already cost a CI failure. **The argument against.** A check you cannot run locally is a check you learn about late. **What would change it:** a container image becoming available for other reasons (option 2).

### D3. Where the Serenity report is published

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **GitHub Pages, beside the board:** the board at `/`, the report at `/report/`, from `main` only; DR-060 amended | One site; the report is public evidence (scenario names and step text only, no secrets); the Pages workflow grows | Recommended |
| 2 | **A CI artefact only** (downloadable, not published) | Nothing public to maintain; the README deliverable "report published" is not met | Considered |
| 3 | **Pages from release tags only** | A stable report, but the project has no releases | Considered |
| 4 | **Do nothing** | As option 2 | Considered |

**Recommendation: option 1.** The portfolio's other projects publish theirs (B6) and a published report is the point of the phase. **The argument against.** DR-060 limited Pages to the board deliberately ("nothing else"); widening it widens what a mistake can publish. The check that prepares the folder and refuses anything else (as `parabank-bank-automation` does) is the control. **What would change it:** discomfort with publishing step text for a system that has deliberately defective modes (option 2).

### D4. The three flags with no catching scenario

`toggle-label` ("See less" never flips back), `truncate-summary` (the summary is cut mid-word with no way to expand) and `lost-edit` (an unsaved preferred name is discarded without warning). The 41 `@ui` scenarios were reviewed in three passes; adding to them is a scenario change.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Add three `@ui` scenarios** (the changes toggle flips back; a long summary can be expanded; leaving with an unsaved preferred name warns), with steps and glossary entries, reviewed by the owner before merge | The `@ui` count moves 41 to 44, the specified total 73 to 76; the claim "each flag turns a scenario red" holds for these three | Recommended |
| 2 | **Catch them with component tests** (CDS-18 F-20's second suggestion) | No scenario change; the catch is in the UI package's tests, run by `check:ui`; the phase must then say "check", not "scenario" (D5) | Considered |
| 3 | **Drop the three flags** from the contract | 27 flags; a contract change and a specification change | Considered |
| 4 | **Do nothing** | Three flags can never be shown caught | Considered |

**Recommendation: option 1.** These are behaviours a customer would notice, which is what a scenario is for. **The argument against.** A scenario that exists only so a flag can be caught is reasoning backwards, and it adds a scenario change after three review passes. Option 2 is cheaper. **What would change it:** preferring to keep the reviewed 41 untouched.

### D5. What counts as a "catch"

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Any committed automated check, listed per flag:** a scenario, an exit check (axe-core or a role or structure check), or a service test. The README gate is reworded: "every flag turns at least one committed check red for the stated reason" | Honest about what catches an accessibility defect; the six accessibility and semantics flags are caught by exit checks | Recommended |
| 2 | **Gherkin scenarios only**, as the gate is worded now | Six more scenarios about ARIA names and structure; the Gherkin store fills with checks that are not behaviour | Considered |
| 3 | **Do nothing.** Leave the wording and the six flags uncaught | The gate cannot be met | Considered |

**Recommendation: option 1.** An unnamed progress bar is not a business behaviour; axe-core and a role check are the right tools, and the exit checks already exist. **The argument against.** "Scenario" was chosen for a reason: it is readable by a non-engineer, and a showcase of a shared Gherkin store should lean on it. **What would change it:** wanting every catch to be business-readable (option 2).

### D6. When the independent review (CDS-38) runs

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **After P2 (the API flags), before the UI flags (P3).** The review reads the UI and harness before flags add branches to them | Findings are fixed before 23 flags are built into the UI; delays P3 by the review and its fixes | Recommended |
| 2 | **After Phase 5** | No delay; flags are built into code that may be changed by the review | Considered |
| 3 | **Alongside** (the review reads while P3 is built) | Fastest; findings and flags collide | Considered |
| 4 | **Do nothing** | The commissioned review never happens | Considered |

**Recommendation: option 1.** The cheapest moment to review code is before it is wrapped in switches. **The argument against.** It stalls the phase's visible progress for a session. **What would change it:** an owner preference to see flags working sooner (option 2).

## 4. Not in this brief

- The slice order and sizes (they follow from the answers; they are in the plan).
- The pixel-comparison library and its pin: chosen in P5 against the two-week-old rule.
- The Phase 5 gate: a brief for the owner at the end (P7).

## 5. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | New entry | The Phase 5 choices D1 to D6 | [x] DR-064 |
| `DOCS/implementation-plans/2026-10-14_cds-37-phase-5-defects-and-evidence.md` | Decisions table; status | Owner's answers; `approved` | [x] answers (v2); `approved` follows the owner's word |
| `README.md` | 'SDD workflow' Phase 5 row | Gate wording if D5 option 1 | [x] |
| `DOCS/backlog.md` | Phase 5 section | Slice tickets CDS-39 to CDS-45 | [x] v64 |
| `DOCS/.design/ui-specification.md`, `api-specification.md` | Sections 3, 6.8, 8, 10 | What they say about flags (D1, D5) | [x] UI specification v21 and My Profile feature spec v10; the API specification note follows in P1 |
| `.github/workflows/pages.yml`, DR-060 | Pages | Only if D3 option 1 | [ ] follows in P6 (CDS-44) |
| `DOCS/decision-briefs/_index.md` | Brief 13 row | Status and where the decision landed | [x] row added as awaiting-decision |

## 6. Decision record

The owner replied on 2026-10-14, in chat: "D1: option 1, D2: option 1, D3: option 1, D4: option 2, D5: option 1, D6: option 1". Five are the recommended options; **D4 is not**: the owner chose option 2 (component-test catchers) over the recommended option 1 (three new scenarios). The read-back below is for the owner to confirm; section 6.3 is where a correction goes.

### 6.1 Read-back

1. **D1 option 1.** A test build of the UI reads `GET /__test/state` once at start with the control key the harness supplies (session storage, set before the page loads). The public build contains none of this code.
2. **D2 option 1.** Screenshot baselines are made and compared in Linux CI only; a manual workflow refreshes them; diff images are an artefact on failure.
3. **D3 option 1.** The Serenity report is published on GitHub Pages beside the Kanban board (board at `/`, report at `/report/`, from `main` only). DR-060 is amended when P6 builds it.
4. **D4 option 2.** `toggle-label`, `truncate-summary` and `lost-edit` are caught by component tests, not new scenarios. The `@ui` count stays 41 and the specified total 73. The proof runner runs a component-test catcher with the flag given to the fake service.
5. **D5 option 1.** A "catch" is any committed automated check listed per flag (a scenario, an exit check, a component test or a service test). The README gate for Phase 5 now reads "every flag turns at least one committed check red for the stated reason".
6. **D6 option 1.** The independent review (CDS-38) runs after P2 (the API flags) and before P3 (the UI flags).

### 6.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | How a browser learns the flags | **Option 1** | Test build only | Gary Brooks | 2026-10-14 |
| D2 | Screenshot baselines | **Option 1** | Linux CI only | Gary Brooks | 2026-10-14 |
| D3 | Where the report is published | **Option 1** | DR-060 amended in P6 | Gary Brooks | 2026-10-14 |
| D4 | The three uncaught flags | **Option 2** | Component tests; no scenario change | Gary Brooks | 2026-10-14 |
| D5 | What counts as a catch | **Option 1** | README gate reworded | Gary Brooks | 2026-10-14 |
| D6 | When CDS-38 runs | **Option 1** | After P2, before P3 | Gary Brooks | 2026-10-14 |

### 6.3 Corrections after decision

None yet. Awaiting the owner's confirmation of the read-back in 6.1 and approval of the plan.
