---
version: 2
created: 2026-10-06T15:47Z
project: credit-dashboard-sut
type: decision-brief
brief: 6
subject: Who uses the generated client (D0), and how TypeScript packages sit in the repository (D1)
blocks: CDS-15 (generated TypeScript client); later the UI (Phase 4) and the harness (Phase 3)
approver: the project owner (Gary Brooks)
status: decided
supersedes: credit-dashboard-sut_decision-brief-6_v1_20261006T1020Z.md
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Put the package-layout decision to the owner with the case for and against each option.
  LOCATION: DOCS/decision-briefs/
  TEMPLATE: templates/decision-brief.template.md (portfolio root)
-->

# Decision brief 6: who uses the generated client, and how TypeScript packages sit in the repository

**Items to decide:** D0 whether the Serenity/JS harness uses the generated client; D1 the package layout for `packages/api-client` and the TypeScript packages that follow it. **Decide D0 first**: it sets how many consumers the client has, which is what D1 turns on.
**Blocks:** CDS-15 (its plan is otherwise agreed: TypeScript 5.9.3, generated types committed with a CI drift check, a root `npm run verify`). Later, the React UI (Phase 4) and the Serenity/JS harness (Phase 3).
**Reply with:** "D0: option n" and "D1: option n", with any conditions; they are read back before anything is recorded.

**Changes in v2.** D0 added at the owner's request after an explanation of what the client is, and the accepted specification's wording on the harness recorded as background (B7). D1 is unchanged except for how its options depend on D0 (section 4, 'How D0 shapes D1').

**How this brief came about.** The CDS-15 plan recommended npm workspaces; the owner deferred that choice and asked for a brief with an in-depth case for and against. This brief is written **before** the decision, as the template intends.

## 1. Why this brief exists

CDS-15 creates the first TypeScript package, `packages/api-client`. Where it sits decides how every later TypeScript part (the UI, the harness, possibly the fixtures) installs, links to it, pins its tools and runs in CI. Changing the layout later is possible but touches every package, every lock file and the CI job. A choice made silently inside CDS-15 would be drift.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (CDS-15)
- [ ] A decision already made implicitly in an artefact needs ratifying
- [ ] An earlier decision is being reversed or narrowed
- [ ] Two documents disagree

The README's Phase 1 target layout says "npm workspaces", but it was written as a target, not a decision, and no DR covers it. This brief makes it a decision either way.

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | The README target layout plans a root `package.json` with "npm workspaces", and `packages/api-client`, `demo-apps/demoapp002-react-ui` and `test-harnesses/harness-serenity` as TypeScript parts; the API is C# (DR-017) and outside npm | README, 'Phase 1 target layout'; DR-017 |
| B2 | Today the repository has two independent npm roots, each with its own lock file: the root (Prism, Ajv, yaml; 59 MB installed) and `fixtures/` (Ajv, yaml; 3.6 MB) | `git ls-files`; `du` on 2026-10-06 |
| B3 | The precedent `loan-origination-parity` uses npm workspaces over `packages/*`, `demo-apps/*` and `test-harnesses/*` with one lock file, and its CI and `npm run verify` build on that | Its `package.json` and `git ls-files` |
| B4 | The client generator `openapi-typescript` 7.13.0 requires TypeScript `^5.x`; TypeScript's latest is 7.0.2; CDS-15 pins 5.9.3 | CDS-15 spike; npm registry, 2026-10-06 |
| B5 | Only one consumer of the client exists before Phase 3: its own smoke test. The UI arrives in Phase 4; the harness in Phase 3 may use the client or its own `CallTheCreditApi` ability | README layout; DR-006 |
| B6 | npm 11.16.0 and Node 24.18.0 on the host and in CI | `npm --version`; `.nvmrc` |
| B7 | The accepted API specification (DR-038 baseline) says: "The UI consumes it through a client generated from the contract. The test harness consumes it directly, for API-level scenarios and for arranging state through the test-control endpoints." 'Directly' most naturally reads as 'not through the generated client'; it could also mean 'not through the UI' | API specification v9, section 1 |
| B8 | The generated client is two parts: compile-time types (`schema.d.ts`, no runtime code) and a small request library (`openapi-fetch`). Serenity/JS has its own `CallAnApi` ability (HTTP through axios) for API work, and the Phase 3 gate requires every API scenario response to be validated against the contract at run time | CDS-15 spike; DR-006; API specification section 11 |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q0 | Should the harness use the generated client? | Restated: three different things can be shared: nothing, the types only, or the types and the request library. Each is a separate option | Yes | D0 |
| Q1 | npm workspaces from now, or a standalone package? | Restated: it is a timing question as much as a layout one. "Workspaces" can start now or when a second consumer exists, and "standalone" can be permanent or temporary | Yes | D1 |
| Q2 | Should `fixtures/` join a workspace? | Follows from D1; not needed for CDS-15 | No (after D1) | Carried forward: revisit in CDS-15's outcome or the first package that consumes fixtures |

## 4. Decision item

### D0. Does the harness use the generated client?

**What is being decided.** Whether the Serenity/JS harness (Phase 3) builds its API calls on the generated client, and if so how much of it.

**Why it matters.** It decides whether the client has one consumer (the UI) or two, which is the evidence D1 turns on. It also decides how independent the harness is from code the UI uses, which is a testing principle in its own right: a check that shares code with what it checks can share that code's faults.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Full client.** The harness's `CallTheCreditApi` ability wraps `openapi-fetch` with the generated types | Typed calls; a contract change breaks the harness at compile time. The harness shares the UI's request code, so a fault in `openapi-fetch` (for example how it encodes a query) would be made identically by both and could hide; amends the accepted specification's "directly" (B7) | Considered |
| 2 | **Independent.** The harness uses Serenity/JS's own `CallAnApi`, builds requests from the contract and fixtures, and validates every response against the contract at run time (as `tools/mock-smoke.mjs` already does) | Matches the specification as written (B7); no code shared with the UI; the client keeps one consumer. A contract change shows up when scenarios run, not when they compile; request bodies are untyped while authoring | Considered |
| 3 | **Types only.** The harness uses Serenity/JS's own `CallAnApi` and runtime validation as in option 2, and also imports the generated *types* (not `openapi-fetch`) to type its requests and responses | Compile-time breakage on contract change, while the transport and the assertions stay independent of the UI. The types come from the contract, not from UI code, so sharing them is close to both reading the same contract. The client then has two consumers (of different parts); clarifies the specification's "directly" as "through its own transport" | **Recommended** |
| 4 | **Do nothing yet.** Decide when the harness is built (Phase 3) | No decision now. D1 then has to be decided without knowing the consumer count, or deferred too | Considered |
| 5 | **Reframe: test the API only through the UI.** No harness API calls at all | Removes the question. Contradicts the specification's API-level scenarios and the Phase 3 gate; the planted API defects could not be caught directly | Rejected: listed because it is where a 'UI-only' testing shortcut leads |

**Recommendation: option 3.** The evidence: the harness must validate responses at run time anyway (B8), so independence where it matters most, the transport and the assertions, comes free with Serenity/JS's own ability; and the generated types are derived from the contract, not from UI code (B8), so importing them shares the contract, not the UI. The judgement: that compile-time breakage in the harness, when the contract changes, is worth a second consumer of the types.

**The argument against.** Option 3 amends an accepted specification (B7) for a convenience, and the convenience is partly illusory: types vanish at run time, so a harness that compiles cleanly against the types can still receive a response that does not match them; only the runtime validation it needs anyway catches that, which is exactly option 2. Option 3 also ties the harness to the generator's TypeScript 5 pin (B4) and to whatever D1 decides about packaging, coupling the test code's build to the UI's tooling. And a type-level mistake in the generator would be shared by the UI and the harness alike. Option 2 is simpler, matches the specification word for word, keeps the harness's build independent, and loses only authoring-time convenience. **Option 2 is the stronger answer if harness independence is valued above compile-time feedback.**

**What would change the recommendation.** A reading of the specification's "directly" as a deliberate independence rule (then option 2), or a Serenity/JS limitation that makes typed requests awkward in `CallAnApi` (found at Phase 3).

### How D0 shapes D1

| D0 answer | Consumers of the client | What it means for D1 |
|---|---|---|
| Option 1 or 3 | UI and harness | Two consumers: a shared package, so D1 option 1 (workspaces now) or option 3 (standalone until the second consumer) |
| Option 2 or 5 | UI only | One consumer: D1 option 5 (generate the types into the UI) becomes credible, and the workspace question can wait for any other shared package |
| Option 4 | Unknown | D1 decided without the consumer count, or deferred with D0 |

### D1. The package layout

**What is being decided.** How `packages/api-client`, and the TypeScript packages after it, are installed and linked: one npm workspace with a single lock file, or separate packages each with their own.

**Why it matters.** It fixes how the UI and harness consume the client (a workspace link or a `file:` dependency), how many lock files and installs CI runs, how tool versions such as TypeScript can differ between packages, and how much has to change later.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **npm workspaces now.** Root `package.json` lists `packages/*` (later `demo-apps/*`, `test-harnesses/*`); one root lock file; `fixtures/` stays separate until Q2 | One `npm ci` installs everything; consumers import `@credit-dashboard-sut/api-client` through a workspace link; matches the README layout and the precedent; one lock to review. Every install carries every package's dependencies | **Recommended** |
| 2 | **Standalone packages, permanently.** `packages/api-client` has its own `package.json` and lock, like `fixtures/`; later consumers use `file:../../packages/api-client` | Each package installs and pins in isolation; a TypeScript or toolchain clash in one cannot break another's install. Several lock files and installs; `file:` links copy or symlink differently across npm versions; the README layout changes | Considered |
| 3 | **Standalone now, workspaces when the second consumer arrives** (the UI in Phase 4, or the harness in Phase 3) | No workspace machinery while there is one package; the conversion happens when there is evidence of real sharing, and costs one reorganising PR then | Considered |
| 4 | **Do nothing yet.** Postpone CDS-15 until the UI exists and generate the types inside it | No layout decision now. Phase 1 ends without a client; the "contract change breaks the build" guarantee waits until Phase 4 | Considered |
| 5 | **Reframe: the client is not a package.** Generate the types into each consumer (`demo-apps/demoapp002-react-ui/src/api/`, and the harness) from one shared script | No packaging question at all. The same 2,700-line file is committed twice and can drift between consumers; the drift check must cover every copy | Considered |
| 6 | **Workspaces with a different package manager** (pnpm) | Strict dependency isolation and fast installs. A second toolchain for the portfolio, a migration of the existing roots, and a departure from the precedent | Rejected: listed because it is the shape the idea drifts into once workspace hoisting causes trouble |

**Recommendation: option 1.** The evidence: the README layout already assumes it (B1); the precedent shows it working at three package groups with one lock and one `verify` (B3); the UI and harness will both be TypeScript consumers of the same client (B1, B5), and a workspace link is the least fragile way for them to import it; and one lock file means one dependency review per change. The judgement: that the cost of starting workspaces with a single package is small, and smaller than converting three packages later.

**The argument against.** Option 1 couples every TypeScript part into one dependency tree before there is anything to couple. Hoisting puts all packages' dependencies in the root `node_modules`, so a package can import something it never declared and it works locally, then fails when the hoisting changes; that class of bug appears exactly when the UI and harness arrive. Version conflicts become install failures for everyone: the generator holds TypeScript at 5.9.3 (B4), and the Vite and React toolchain of 2026 may want TypeScript 7; in one tree that is a peer-dependency conflict the whole repository must resolve at once, not a choice the UI makes alone. Every CI install also carries every package's dependencies, Prism's 59 MB included, even for a job that needs one. And today there is exactly one package with one consumer, its own smoke test (B5). Option 3 defers all of this until a second consumer gives evidence that sharing is real, at the price of one reorganising PR. **Option 3 is the stronger answer if the UI's toolchain turns out to need a different TypeScript major from the generator.**

**What would change the recommendation.** Evidence before CDS-15 merges that the React and Vite versions to be pinned under DR-009 need TypeScript 7; then option 3, or option 2 for the client alone, avoids a forced conflict.

## 5. Not in this brief

- Whether `fixtures/` joins the workspace (Q2, carried forward).
- The package manager for the portfolio as a whole (option 6 is listed only to reject it here).
- The C# API (DR-017): outside npm in every option.

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | New DR-042 and DR-043 | D0 and D1, citing this brief | [ ] |
| `DOCS/.design/api-specification.md` | Section 1 | Clarify how the harness consumes the API, if D0 is option 1 or 3 | [ ] |
| `DOCS/implementation-plans/` | The CDS-15 plan file | Written once agreed, with D1's outcome in its steps | [ ] |
| Root `package.json`, lock files, `.github/workflows/ci.yml` | Workspaces or standalone | As chosen | [ ] |
| `README.md` | 'How it is built'; checks | The layout as chosen | [ ] |
| `DOCS/backlog.md` | CDS-15 | Unblocked | [ ] |
| `DOCS/decision-briefs/_index.md` | Brief 6 row | Status and where the decision landed | [ ] |

## 7. Decision record

Filled when the owner decided, on 6 October 2026, by interview: D0 first, then D1 with its options re-put in the light of D0.

### 7.1 Read-back

Read back before recording, with five conditions:

1. The package owns its generation and check scripts (`npm run generate`, `npm run check` inside `packages/api-client`); the README layout's `tools/generate-client.mjs` is not created, and the layout is updated.
2. A root `npm run verify` installs the two sub-packages (`fixtures`, `packages/api-client`) and runs all five checks (contract lint, fixtures, Gherkin, mock smoke, client); the registry gate becomes `npm ci && npm run verify`; it assumes Python's `gherkin-official` is installed, and the README says so.
3. CI calls `npm run verify` instead of separate steps, so local and CI run the same thing.
4. Order: this brief, DR-042 and DR-043 and the backlog first; then the CDS-15 plan, revised for D0 and D1, for approval and written to file (DR-041); then implementation.
5. Merge authority: PR #6 (this brief) is merged once its CI is green; the CDS-15 PR's merge is not yet authorised.

Owner's reply, 6 October 2026: "All agreed as recommended; merge #6 when CI is green."

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D0 | Harness and the client | **Option 2.** Independent: own `CallAnApi`, requests from the contract and fixtures, every response validated at run time; no generated types, no `openapi-fetch` | API specification section 1 unchanged | Gary Brooks | 2026-10-06 |
| D1 | Package layout | **Option 3** (re-put after D0 as 'standalone package now'). `packages/api-client` with its own `package.json` and lock; the UI's link to it is decided in Phase 4 | Conditions 1 to 3 | Gary Brooks | 2026-10-06 |

**Recorded, not argued away.** D0 went against the recommendation (option 3, types only). The case for it stands: the harness will now notice a contract change only when its scenarios run, not when it compiles, and its request bodies are untyped while being written. The owner chose independence and the specification's wording as it stands. D0 then left the client with one consumer, so D1's recommendation was revised from workspaces now to a standalone package now; the argument against workspaces (hoisting, a TypeScript 5 pin shared across every package, every install carrying every package) carries no counterweight while nothing else shares the client.

**Left unresolved.** How the UI consumes the package (a `file:` dependency or workspaces), decided in Phase 4 (DR-043); whether `fixtures/` joins any workspace (Q2, carried forward).

### 7.3 Corrections after decision

None.
