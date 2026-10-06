---
version: 1
created: 2026-10-06T10:20Z
project: credit-dashboard-sut
type: decision-brief
brief: 6
subject: How TypeScript packages sit in the repository (npm workspaces or standalone)
blocks: CDS-15 (generated TypeScript client); later the UI (Phase 4) and the harness (Phase 3)
approver: the project owner (Gary Brooks)
status: superseded
supersedes: none
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Put the package-layout decision to the owner with the case for and against each option.
  LOCATION: DOCS/decision-briefs/
  TEMPLATE: templates/decision-brief.template.md (portfolio root)
-->

# Decision brief 6: how TypeScript packages sit in the repository

**Items to decide:** D1 the package layout for `packages/api-client` and the TypeScript packages that follow it.
**Blocks:** CDS-15 (its plan is otherwise agreed: TypeScript 5.9.3, generated types committed with a CI drift check, a root `npm run verify`). Later, the React UI (Phase 4) and the Serenity/JS harness (Phase 3).
**Reply with:** "D1: option n", with any conditions; they are read back before anything is recorded.

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

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | npm workspaces from now, or a standalone package? | Restated: it is a timing question as much as a layout one. "Workspaces" can start now or when a second consumer exists, and "standalone" can be permanent or temporary | Yes | D1 |
| Q2 | Should `fixtures/` join a workspace? | Follows from D1; not needed for CDS-15 | No (after D1) | Carried forward: revisit in CDS-15's outcome or the first package that consumes fixtures |

## 4. Decision item

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
| `DOCS/decision-register.md` | New DR-042 | The chosen layout, citing this brief | [ ] |
| `DOCS/implementation-plans/` | The CDS-15 plan file | Written once agreed, with D1's outcome in its steps | [ ] |
| Root `package.json`, lock files, `.github/workflows/ci.yml` | Workspaces or standalone | As chosen | [ ] |
| `README.md` | 'How it is built'; checks | The layout as chosen | [ ] |
| `DOCS/backlog.md` | CDS-15 | Unblocked | [ ] |
| `DOCS/decision-briefs/_index.md` | Brief 6 row | Status and where the decision landed | [ ] |

## 7. Decision record

Filled only when the owner decides. **Not pre-filled.**

### 7.1 Read-back

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Package layout | | | | |

### 7.3 Corrections after decision
