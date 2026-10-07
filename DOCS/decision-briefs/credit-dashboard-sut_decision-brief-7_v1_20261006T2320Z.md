---
version: 1
created: 2026-10-06T23:20Z
project: credit-dashboard-sut
type: decision-brief
brief: 7
subject: Recording the Phase 1 and Phase 2 exit gates, where gates are recorded, and what comes next
blocks: Phase 3 (API) entry; README status; registry status label; landing card summary
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Put to the owner whether the Phase 1 and Phase 2 exit gates are met and how that is recorded,
            with the case for and against each option.
  LOCATION: DOCS/decision-briefs/
  TEMPLATE: templates/decision-brief.template.md (portfolio root)
-->

# Decision brief 7: recording the Phase 1 and Phase 2 exit gates

**Items to decide:**

- D1: is Phase 1 closed?
- D2: is the Phase 2 gate recorded as met, given that its work was done out of sequence?
- D3: where are the phase gates and their records kept?
- D4: what comes next?

**Decide D1 and D2 first.** D3 records their outcome, and D4 depends on both.

**Blocks:** Phase 3 entry. Also stale public text: the README says "Phase 1 (contract) has started", and the registry label says only that the Phase 1 gate is met.

**Reply with:** "D1: option n" to "D4: option n", with any conditions. Answers are read back before anything is recorded.

**How this brief came about.** After CDS-16 the owner asked to record Phases 1 and 2, through a brief. This brief is written **before** the decision.

## 1. Why this brief exists

The SDD workflow says each phase has an exit gate, and that "a phase does not start until the previous gate is green". Every Phase 1 and Phase 2 backlog item is now complete except CDS-17, but nothing records either phase as closed. Three things make this more than a formality:

- the Phase 2 work was done before the Phase 1 gate was met;
- one Phase 1 work item ("pin versions") is met by a decision rather than by files;
- the gate definitions are not in this repository at all.

**Trigger:**

- [ ] A decision blocks work and nothing scheduled will reach it in time
- [x] A decision already made implicitly in an artefact needs ratifying (the backlog treats both phases as done)
- [ ] An earlier decision is being reversed or narrowed
- [x] Two documents disagree (README 'Status' says Phase 1 "has started"; the backlog, registry and landing card say its gate is met)

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | **The gates are defined only in the frozen pack.** Phase 1 (Contract): the work is the own repository (DR-001), pinned versions (DR-009), a lint ruleset, an example for every response, the Prism mock and the generated TS client. The gate is "Lint clean; every example validates against its schema; mock serves every operation". Phase 2 (Behaviour): the work is `features-shared/` covering every BR and every page "in Phase 1 and 2 scope", a step glossary, and persona fixtures validated against the schemas. The gate is "Three-amigos review recorded; every BR tagged by at least one scenario; fixtures pass schema validation" | The frozen pack, `project-specs/credit-dashboard-sut/README.md`, 'SDD workflow' (portfolio root) |
| B2 | **This repository's README does not carry that table.** It says only that "Each phase has an exit gate (API specification, 'Verification checks'; backlog)". Section 11 of the specification lists checks by phase, but not the phase gates | `README.md` 'How it is built'; API specification v11 section 11 |
| B3 | **Phase 1 gate evidence.** Redocly CLI 2.57.0 lint passes ("valid", run 2026-10-06T23:19Z). `no-invalid-media-type-examples` and `no-invalid-schema-examples` are errors with `allowAdditionalProperties: false` (CDS-05). The mock smoke passes 36 of 36 operations, with Ajv validating each body, plus 401 without a token (CDS-14). All of it runs in CI on every push through `npm run verify` | `redocly.yaml`; CI run 37512063602 |
| B4 | **Phase 1 work items.** Own repository: CDS-09. Lint ruleset: CDS-04. Examples: CDS-05. Mock: CDS-14. Client: CDS-15. Versions: CDS-16, met by DR-044. DR-044 resolves the versions now, but `global.json` and the UI's `package.json` are created when each project is scaffolded. CDS-17 (Kanban dialect) is labelled Phase 1, but was added at onboarding and is not in the pack's Phase 1 work | Backlog v29; DR-044 |
| B5 | **Phase 2 gate evidence.** Three-amigos review recorded: brief 4, DR-028 to DR-033, with DR-033 naming it the Phase 2 evidence. Every BR tagged: `tools/check-gherkin.py` reports BR 15 of 15, enforced in CI. Fixtures: 7 personas, 2 users and 8 override samples pass 404 of 404 checks in CI | DR-033; `check-gherkin.py`; `fixtures/schema-check.mjs` |
| B6 | **Phase 2 work items.** Pages: every page in the UI catalogue has a feature file, Releases 1 to 3, except the debug panel (tooling). "Phase 1 and 2 scope" in the pack's wording predates DR-015, which renamed the catalogue's Phase column to Release. Step glossary: CDS-07, v5 normative. Fixtures: CDS-08 and CDS-13 | UI specification section 5; DR-015; DR-033 |
| B7 | **Sequence.** CDS-06, 07, 08 and 13 were done on 4 and 5 October, during Phase 0, before the Phase 1 gate was met on 6 October. Since the review the contract changed twice: v8 added `info.license`, and v9 added path-parameter examples and the Prism server entry. Neither changed an operation, schema rule or response. The generated client changes no behaviour | Backlog; `git log` of `openapi.yaml`; CHANGELOG |
| B8 | **Profile rules.** PR tags are 10 of 11; PR-05 (address history) has no scenario. Address is a stretch sub-page, specified but not built (DR-022). The Phase 2 gate names BRs only | `check-gherkin.py`; DR-022 |
| B9 | **The Phase 3 gate.** All `@api` and `@security` scenarios green; every response validated against the contract; a clean Schemathesis run. The work: the service against the contract, test-control endpoints, and the harness abilities `CallAnApi` and `ControlTheTestEnvironment`. The .NET 10 SDK 10.0.401 is installed (2026-10-06). Schemathesis has no pinned version yet | Frozen pack 'SDD workflow'; DR-044; `dotnet --list-sdks` |
| B10 | **Public text that follows the gates:** README 'Status'; the registry `status_label` ("Phase 1 exit gate met 2026-10-06"); the landing card summary; the capability matrix ledger ("in progress: Phase 0 specification and Phase 1 contract") | Those files |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | Record Phase 1 as done | The gate is evidenced. The question is whether "pin versions" is met by a decision without files, and whether CDS-17 holds the phase open | Yes | D1 |
| Q2 | Record Phase 2 as done | The gate is evidenced. The question is whether out-of-sequence work, reviewed before contract v8 and v9, needs another look first | Yes | D2 |
| Q3 | (implicit) Where should this be written? | The gate table is not in the repository (B2). Where do gate definitions and gate outcomes live? | Yes | D3 |
| Q4 | (implicit) Then what? | Does Phase 3 start, and in what order? | Yes | D4 |

## 4. Decision items

### D1. Is Phase 1 closed?

**What is being decided.** Whether Phase 1 is recorded as complete, not just its gate.

**Why it matters.** The SDD rule says Phase 2 work (already done) and Phase 3 work wait on it, and every public status line depends on it.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Closed.** The gate is met (B3). The work is complete, with "pin versions" met by DR-044. CDS-17 is relabelled as unphased tooling, done at the owner's timing | Phase 1 is recorded as closed on the gate's evidence. The pin files arrive with their projects, under DR-044's rule | **Recommended** |
| 2 | **Gate met, phase open until CDS-17** | Phase 1 stays open for a board nobody has asked for yet; Phase 3 waits on tooling | Considered |
| 3 | **Gate met, phase open until the pin files exist** | "Pin versions" read strictly. Phase 1 cannot close before Phase 3 and Phase 4 scaffold their projects, which contradicts the sequence | Rejected: listed because it is where a literal reading of "pin versions" leads |

**Recommendation: option 1.** The evidence: every gate criterion runs in CI on every push (B3), and every pack work item has a completed backlog item (B4). The judgement: a version decided and recorded, with a rule for scaffold day, meets "pin versions" for projects that do not exist yet.

**The argument against.** A pin that lives only in a document is not enforced. Nothing stops Phase 3 from scaffolding with whatever SDK happens to be installed, and DR-044's rule depends on someone remembering it. Relabelling CDS-17 to close the phase is also convenient: the item was put in Phase 1 at onboarding, and moving it out because it is inconvenient is the kind of quiet re-scoping a gate exists to prevent. **Option 2 is the stronger answer if the board is wanted soon anyway.**

**What would change the recommendation.** The owner wanting the Kanban board before Phase 3 starts; then do CDS-17 first and close Phase 1 with it.

### D2. Is the Phase 2 gate recorded as met?

**What is being decided.** Whether Phase 2 is recorded as closed now, given that its work came before the Phase 1 gate (B7).

**Why it matters.** The workflow's sequencing rule exists so that behaviour is specified against a settled contract. If the contract had moved under the scenarios, the review would be stale.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Met; ratify the order.** Record the gate as met on its evidence (B5, B6), state that the work preceded the Phase 1 gate, and record that contract v8 and v9 changed no behaviour (B7) | Phase 2 is closed today, with the departure from the sequence stated rather than hidden. The pack's "Phase 1 and 2 scope" is read as Releases 1 and 2 (DR-015), and in fact every release is covered | **Recommended** |
| 2 | **Short re-review first.** A focused check of the feature files and step glossary against contract v9 before recording | One more session; would find nothing if B7 is right, but would show it | Considered |
| 3 | **Met, with PR-05 required too** | Adds a scenario for a stretch sub-page (DR-022) to a gate that names BRs only | Rejected: listed because it is the shape over-reach takes here |

**Recommendation: option 1.** The evidence: the three gate criteria are recorded or enforced in CI (B5), and the two contract changes since the review touched no behaviour (B7). The judgement: stating the out-of-sequence order in the record is honest enough, and a re-review that can only confirm B7 is ceremony.

**The argument against.** "Changed no behaviour" is this agent's reading of two diffs. The point of the sequence rule is that an independent look, not the author's, confirms nothing drifted. The review was also an interview between the owner and the agent (brief 4), so "three amigos" was already two parties. A short re-review costs one session and turns a claim into evidence. **Option 2 is the stronger answer if the record should stand on observation rather than inference.**

**What would change the recommendation.** Any contract change since 5 October that touched a schema rule, status code or example value used by a scenario. B7 says there is none.

### D3. Where are the phase gates and their records kept?

**What is being decided.** Where the gate definitions live in this repository (today only in the frozen pack, B1 and B2), and where a gate's outcome is recorded.

**Why it matters.** Phases 3 to 5 need their gates in the repository, and a gate outcome should be findable from one place, not spread across the backlog.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **README 'SDD workflow' table restored, with a 'Gate status' column linking evidence; one DR per gate outcome** (DR-045 Phase 1, DR-046 Phase 2) | The definitions are back where the pack had them and visible to readers. The decision register holds the immutable outcome, and the README shows the current state. Two places, one of which only links | **Recommended** |
| 2 | **A dedicated `DOCS/phase-gates.md`**, holding the definitions, then each gate's evidence and outcome as it is met | One durable gate record, like the `project-contract.md` used by `auth-separation`. The README links to it. The README shows less | Considered |
| 3 | **DR entries and the backlog only** | No new structure. The definitions stay in the frozen pack outside the repository, so Phase 3 has no in-repository gate | Considered |

**Recommendation: option 1.** The evidence: the README already says each phase has an exit gate (B2) but points nowhere, and the pack, which this repository was seeded from, kept the table in its README (B1). The judgement: readers look at the README, and the register is the place for decisions that do not change.

**The argument against.** A README that carries both gate definitions and gate status grows with every phase, and status in a README goes stale, exactly as 'Status' has now (B10). A dedicated file gives each gate room for its evidence: CI run numbers, check outputs and the sequence note in D2. Option 2 also matches a precedent in the portfolio. **Option 2 is the stronger answer if the gate records are expected to carry more evidence than a link.**

**What would change the recommendation.** The owner preferring a short README; then option 2.

### D4. What comes next?

**What is being decided.** Whether Phase 3 (API) starts now, and how its work enters the backlog.

**Why it matters.** It sets the next backlog items, and what the public status lines say.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Phase 3 starts.** Add Phase 3 items to the backlog: scaffold the service with `global.json` (DR-044), test-control endpoints, harness abilities, Schemathesis pinned (B9). The first item is planned and approved before any code (DR-041) | Continues the sequence. The first plan settles the service layout and the Schemathesis version | **Recommended** |
| 2 | **Phase 3 and Phase 4 in parallel.** Start the UI against the Prism mock alongside the service, since the UI specification builds pages against the mock first | Faster to a visible product, but two streams at once, and against the sequence rule | Considered |
| 3 | **Rest the project** after recording the gates | Stable state: no code yet, the specification complete. The registry would show it resting | Considered |

**Recommendation: option 1.** The evidence: the SDK is installed and pinned (B9), and the contract, scenarios and fixtures are complete. The judgement: the sequence has served the project, and the API is the dependency of everything after it.

**The argument against.** The UI against the mock is the cheaper, more visible next step. The mock exists, the client exists, and the UI specification itself says to build against the mock first. Phase 3 is the most expensive phase: a new C# service, code generation from the contract, a test-control surface and Schemathesis. Starting there delays anything a visitor can see. **Option 2 is the stronger answer if a visible demo matters more than strict order.**

**What would change the recommendation.** A portfolio need for a live demo soon; then option 2.

## 5. Not in this brief

- The content of Phase 3's backlog items. They are set in the first Phase 3 plan.
- CDS-17's timing, beyond its phase label (D1).
- Whether PR-05 ever gets a scenario: only if the address sub-page leaves stretch (DR-022).

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | New entries | The D1 and D2 outcomes (and D3, D4 as decided), citing this brief | [[x] |
| `README.md` | 'Status'; 'SDD workflow' (D3 option 1) | Phase status corrected; gate table, if chosen | [[x] |
| `DOCS/phase-gates.md` | New (D3 option 2) | Not chosen | n/a |
| `DOCS/backlog.md` | CDS-17 phase label; Phase 3 items (D4) | As decided | [[x] |
| `DOCS/decision-briefs/_index.md` | Brief 7 row | Status and where the decision landed | [[x] |
| `portfolio-prompts/registry.yml` | `status_label`, notes | New label (separate repository) | [ ] |
| `portfolio-landing` presentation data | Card summary | Phase status (separate repository) | [ ] |
| `portfolio-docs/PORTFOLIO_CAPABILITY_MATRIX.md` | SDD ledger row | Phase status (portfolio root) | [ ] |

## 7. Decision record

The owner decided on 2026-10-07, by interview. All four items were put together; the read-back then set the order and the method of the re-review.

### 7.1 Read-back

Read back before recording:

1. **D1 option 2.** The Phase 1 gate is recorded as met now (DR-045). Phase 1 closes when CDS-17 is done, and CDS-17 stays in Phase 1.
2. **D2 option 2.** A new item, CDS-18, is an independent re-review of the feature files and step glossary against contract v9. The Phase 2 gate is recorded as met, as DR-046, only after it. **Method (owner's choice):** a separate agent with fresh context, not the author, checks every scenario's operations, statuses, fields and example values against contract v9. The owner then accepts or acts on the findings by interview.
3. **D3 option 1.** The README regains the 'SDD workflow' table, with a gate-status column linking evidence, and its 'Status' section is corrected. Each gate outcome is recorded in a decision-register entry.
4. **D4 option 1.** Phase 3 starts, but under the sequence rule only after Phase 1 closes (CDS-17) and the Phase 2 gate is recorded (CDS-18). The Phase 3 items enter the backlog now as BLOCKED by both. The first of them is planned and approved before any code (DR-041).
5. **Order:** this brief, DR-045, the README, the backlog and the index in one PR; then CDS-17; then CDS-18; then the first Phase 3 plan.
6. **Merge authority:** this PR is merged once its own CI run reports success.

Owner's reply, 2026-10-07: "Agreed; merge when green."

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Phase 1 closed | **Option 2.** Gate met (DR-045); the phase stays open until CDS-17 | CDS-17 stays in Phase 1 | Gary Brooks | 2026-10-07 |
| D2 | Phase 2 gate | **Option 2.** Recorded only after the CDS-18 re-review | An independent agent, then owner sign-off by interview; the outcome becomes DR-046 | Gary Brooks | 2026-10-07 |
| D3 | Gate records | **Option 1.** README 'SDD workflow' table with gate status; a register entry for each gate outcome | README 'Status' corrected | Gary Brooks | 2026-10-07 |
| D4 | What next | **Option 1.** Phase 3, after CDS-17 and CDS-18 | Phase 3 items in the backlog as BLOCKED; the first is planned before code | Gary Brooks | 2026-10-07 |

**Recorded, not argued away.** D1 and D2 went against the recommendations:

- **D1.** The case for closing Phase 1 now stands: every gate criterion runs in CI, and the Kanban conversion is tooling nobody needs before Phase 3. The owner chose not to re-scope an item to close a phase.
- **D2.** The case for recording now stands: the two contract changes since the review appear to change no behaviour. The owner chose observation by an independent reviewer over the author's inference.

Together they put two items between today and Phase 3, which is the cost the recommendations avoided.

**Left unresolved.** The content of the Phase 3 items, beyond their outline (set by the first Phase 3 plan). The registry label, landing card summary and capability-matrix ledger are updated when Phase 1 closes and the Phase 2 gate is recorded, not before.

### 7.3 Corrections after decision

- **2026-10-07, the Phase 2 entry is DR-049, not DR-046.** The read-back named DR-046 for the Phase 2 outcome. The CDS-18 re-review needed three decisions first (DR-046 to DR-048, owner's approval of the fixes addendum), so the gate is recorded as DR-049.
