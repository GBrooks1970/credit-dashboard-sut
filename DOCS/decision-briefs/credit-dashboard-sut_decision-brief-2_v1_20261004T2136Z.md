---
version: 1
created: 2026-10-04T21:36Z
project: credit-dashboard-sut
type: decision-brief
brief: 2
subject: Test arrangement, credit display, frameworks and profile scope (CDS-02, CDS-03, CDS-12, CDS-13)
blocks: CDS-09 (CDS-02, CDS-03); Phase 3 (CDS-13); CDS-11 sub-page operations (CDS-12)
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Record eight decisions with the options and arguments as they were put.
  LOCATION: DOCS/decision-briefs/ (Phase 0 pack)
  TEMPLATE: templates/decision-brief.template.md (portfolio root)
-->

# Decision brief 2: test arrangement, credit display, frameworks and profile scope

**Items decided:** D1 test-control overrides (CDS-13); D2 credit display (CDS-02, DR-005); D3 the `negative-balance` flag; D4 profile sub-page survey (CDS-12); D5 API framework (CDS-03, DR-002); D6 UI framework (CDS-03, DR-003); D7 Release 3 sub-page scope; D8 preferred-name save model.
**Blocked:** CDS-09 waited on CDS-02 and CDS-03; Phase 3 waits on CDS-13; the CDS-11 sub-page operations waited on CDS-12 and the scope question.

**How this brief came about.** As with brief 1, the options were put to the owner in a structured interview on 4 October 2026 (two rounds, 20:16Z to 21:36Z), the owner answered in that session, and the read-back in section 7.1 was done before anything was recorded. This brief was written **after** the decisions, from the options and arguments exactly as put.

## 1. Why this brief exists

Four backlog items needed the owner (CDS-02, CDS-03, CDS-12, and CDS-13, found the same day while building the step glossary, #257, squash `01652c7`). Two open questions in the My Profile spec (section 9: sub-page scope and the save model) were put alongside them because they shape the CDS-11 contract work.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (CDS-09; Phase 3)
- [ ] A decision already made implicitly in an artefact needs ratifying
- [x] An earlier decision is being reversed or narrowed: DR-002 (Node.js API), DR-005 (default `-£44`)
- [x] Two documents disagree: backlog CDS-02 names a `negative-balance` flag that no bug-flag table defines

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | Test control binds personas and sets clock, flags and latency; it cannot create or change account data | API spec v4 section 6.5 |
| B2 | Five Given patterns state data no persona holds | Step glossary v1 sections 3, 6.1 |
| B3 | UI spec v3 shows a negative balance as `-£44` pending DR-005; the source app shows `-£44` and `-1%` | UI spec v3 section 4.2; DR-005 |
| B4 | DR-002 proposed Node.js + TypeScript with Fastify or Express; alternative .NET 9 minimal API | Decision register |
| B5 | The harness (Serenity/JS), generated client, fixture check and UI are TypeScript | README target layout; DR-006 |
| B6 | Profile sub-pages were never opened because they hold the owner's real details | Backlog CDS-12; profile spec v2 section 4 |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | How do scenarios arrange data no persona holds? (CDS-13) | Unchanged | Yes | D1 |
| Q2 | How does a credit balance display? (DR-005) | Restated: how does an **account in credit** display, per glossary v2 | Yes | D2 |
| Q3 | What is the `negative-balance` flag? | Restated: the premise that a flag exists was false; the question is whether to define one | Yes | D3 |
| Q4 | Survey the sub-pages or keep the designs? (CDS-12) | Unchanged | Yes | D4 |
| Q5 | Accept or amend DR-002 and DR-003? (CDS-03) | Restated as two questions | Yes | D5, D6 |
| Q6 | Which sub-pages are in Release 3? (profile spec section 9) | Unchanged | Yes | D7 |
| Q7 | Explicit save or save on blur? (profile spec section 9) | Unchanged | Yes | D8 |

Nothing carried forward.

## 4. Decision items

### D1. Arranging data no persona holds (CDS-13)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Test-control overrides on persona binding, validated against the contract | Scenarios stay as written; a contract change | **Recommended** |
| 2 | Push rule outlines down to unit tests | Fast; boundary rows leave the business-readable layer | Considered |
| 3 | Hybrid: unit tests own the tables, Gherkin keeps a row or two | Two mechanisms; the rule specified twice | Considered |
| 4 | More personas | Persona count grows with every outline row | Considered |

**Recommendation: option 1.** Keeps the scenarios the three amigos read, and matches API spec principle 5: test control is part of the contract.
**The argument against.** More test-only surface to build and secure, and fixtures stop being the only source of state.

### D2. Account in credit display (CDS-02, DR-005)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | `£44 in credit` | Plain words; read clearly by screen readers | **Recommended** |
| 2 | `-£44` | Matches the source app; the minus is easy to miss | Considered |
| 3 | `£0` | Hides money owed to the customer; API and UI disagree by design | Considered |

**Recommendation: option 1.**
**The argument against.** Departs from the source app, so the SUT is less faithful to what was surveyed.

### D3. The `negative-balance` flag

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | UI flag: an account in credit is shown as an amount owed | Caught by the D2 UI scenario; a customer-harming defect | **Recommended** |
| 2 | API flag: the balance sign is dropped | Caught by the BR-06 API scenario; less distinctive | Considered |
| 3 | Drop the reference | BR-06 has no planted defect | Considered |

**Recommendation: option 1.**
**The argument against.** One more flag to prove in Phase 5.

### D4. Profile sub-page survey (CDS-12)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Keep the proposed designs | No contact with the owner's personal account | **Recommended** |
| 2 | The owner surveys, structure only | Owner's time; personal data to strip | Considered |
| 3 | Agent survey with the owner present | Exposes real data to the session | Considered |

**Recommendation: option 1.**
**The argument against.** The sub-pages may differ from the real structure.

### D5. API framework (CDS-03, DR-002)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Fastify | Built-in schema validation; OpenAPI plugins; one language across the repo | **Recommended** |
| 2 | Express | Familiar; mature validator; validation and typing bolted on | Considered |
| 3 | .NET minimal API | Adds C# to the portfolio, matching the owner's Playwright + C# stack | Considered |

**Recommendation: option 1.**
**The argument against.** Less familiar than Express, and a smaller plugin ecosystem.
**The owner chose option 3.** See section 7.2.

### D6. UI framework (CDS-03, DR-003)

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | React + Vite | Widest tooling; strongest accessibility testing support | **Recommended** |
| 2 | Vue + Vite | Widens portfolio coverage; less familiar | Considered |
| 3 | Svelte + Vite | Widest coverage gain; smallest testing ecosystem | Considered |

**Recommendation: option 1.**
**The argument against.** `loan-origination-parity` already covers React, so it adds nothing to the portfolio's framework spread.

### D7. Release 3 sub-page scope

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Email and mobile only; address, employment and finances become stretch | Most test interest for the least build | **Recommended** |
| 2 | All five | Release 3 roughly doubles | Considered |
| 3 | None for now | Tiles link to pages that do not exist | Considered |

**Recommendation: option 1.**
**The argument against.** The multi-step address form, the richest form to test, is deferred.

### D8. Preferred-name save model

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | Explicit Save and Cancel | Deterministic to test; no lost edits | **Recommended** |
| 2 | Save on blur | Closer to the source; timing-sensitive; edits easy to lose | Considered |

**Recommendation: option 1.**
**The argument against.** Departs from the source app, which shows no visible Save.

## 5. Not in this brief

- CDS-01, the owner's overall review of the specifications. D7 and D8 settle two of its questions; the rest remains.
- The CDS-07 three-amigos review (step glossary sections 6.2 to 6.4).
- The contract changes D1 and D7 require. They follow as their own specification-first changes (section 7.1, condition 6).

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | DR-002, DR-003, DR-005; new DR-017 to DR-023 | Supersede DR-002 and DR-005; accept DR-003; record each item | [x] |
| API spec | v5: sections 3, 6.5, 6.6, 12 | D1 (decided, contract to follow), D5, D7 | [x] |
| UI spec | v4: sections 3, 4.2, 6.9, 8, 10 | D2, D3, D6, D7 | [x] |
| My Profile UI feature spec | v3: sections 3.2, 4, 6, 9 | D4, D7, D8 | [x] |
| `README.md` | Target layout, differences, contents | D5 | [x] |
| `features-shared/ui/account-drilldown.feature` | New `@BR-06` scenario | D2, D3 | [x] |
| `DOCS/step-glossary.md`, `DOCS/glossary.md` | New step; in credit, stretch, overrides | D1, D2, D7 | [x] |
| `DOCS/backlog.md`, `_manifest.md` | CDS-02, CDS-03, CDS-12 complete; CDS-13, CDS-11 next; CDS-09 blocker | All | [x] |
| `DOCS/decision-briefs/_index.md` | Brief 2 row | Status and landing | [x] |

## 7. Decision record

### 7.1 Read-back

Read back to the owner on 4 October 2026 before recording. It surfaced six conditions the answers had not stated, each put with a default:

1. D5, version: record "a .NET minimal API on the current LTS (today .NET 10), pinned at Phase 1" (DR-009), not .NET 9, which is a standard-term release.
2. D5, contract-first in C#: generate C# request and response types from `openapi.yaml`; validate requests at the edge; keep the harness gate that validates every response against the contract. No code-first generation of the contract.
3. D5, business rules: a C# library inside the API service, unit-tested with NUnit and tagged by BR ID; `packages/domain-rules` leaves the target layout; `demoapp001-node-api` becomes `demoapp001-dotnet-api`.
4. D1, overrides: a partial persona document; each list it names (`accounts`, `changes`, `searches`) replaces that list for the named bureau; validated against the persona schema; cleared by `POST /__test/reset`.
5. D2, totals: the same display rule applies to any negative money figure, including a type total.
6. Scope of this change: record the brief, DR entries, specification text, the flag and the D2 UI scenario now; the overrides endpoint (CDS-13) and the email and mobile operations (CDS-11) follow as their own specification-first changes.

Owner's reply, 4 October 2026: "All agreed as recommended."

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Arranging data (CDS-13) | **Option 1.** Test-control overrides | Condition 4; contract change to follow | Gary Brooks | 2026-10-04 |
| D2 | Account in credit (DR-005) | **Option 1.** `£44 in credit` (`£44.00 in credit` on detail figures); utilisation 0% | Condition 5 | Gary Brooks | 2026-10-04 |
| D3 | `negative-balance` flag | **Option 1.** UI flag: credit shown as an amount owed | | Gary Brooks | 2026-10-04 |
| D4 | Sub-page survey (CDS-12) | **Option 1.** Keep the proposed designs | | Gary Brooks | 2026-10-04 |
| D5 | API framework (DR-002) | **Option 3.** .NET minimal API | Conditions 1 to 3 | Gary Brooks | 2026-10-04 |
| D6 | UI framework (DR-003) | **Option 1.** React + Vite + TypeScript | | Gary Brooks | 2026-10-04 |
| D7 | Release 3 sub-page scope | **Option 1.** Email and mobile; address, employment and finances are stretch | | Gary Brooks | 2026-10-04 |
| D8 | Preferred-name save model | **Option 1.** Explicit Save and Cancel | | Gary Brooks | 2026-10-04 |

**Recorded, not argued away.** D5 went against the recommendation. The case for Fastify stands as written: one language across the repository, built-in schema validation, and OpenAPI plugins that make contract-first validation a configuration step rather than a build step. Choosing .NET means the repository has two languages, the contract-first discipline in C# rests on generated types and edge validation (condition 2) rather than an off-the-shelf plugin, and the business-rule unit tests are NUnit rather than Vitest. The owner's reason, as put in the option: it adds C# to the portfolio and matches the Playwright + C# stack. Every other item went with its recommendation, so each argument against still stands.

**Left unresolved.** The contract changes for D1 (CDS-13) and D7 (CDS-11). Next actions, not open decisions.

### 7.3 Corrections after decision

None.
