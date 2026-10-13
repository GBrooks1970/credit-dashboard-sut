---
version: 1
created: 2026-10-12T18:32Z
project: credit-dashboard-sut
type: decision-brief
brief: 11
subject: "Phase 4 (the React UI): backend for the UI scenarios, how the browser reaches the API, layout, CI, harness, pins"
blocks: CDS-29 plan; CDS-31 to CDS-36
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

# Decision brief 11: Phase 4, the React UI

**Items decided:** D1 the backend for the `@ui` scenarios; D2 how the browser reaches the API; D3 package layout; D4 CI placement; D5 the harness; D6 version pins.
**Blocks:** the CDS-29 plan and the slices CDS-31 to CDS-36.

**How this brief came about, stated so the record is not misread.** The options were put to the owner in chat on 2026-10-12 after a read-only spike. D1, D2, D4 and D6 were answered by choosing an option; D3 and D5 were put as "stand as recommended unless you say otherwise" and the owner did not object, so they are recorded as defaults, not as explicit choices.

## 1. Why this brief exists

Phase 4 starts from a UI specification written before the service existed. The spike found two things the specification does not cover: the Prism mock cannot run the `@ui` scenarios, and the service cannot be reached by a browser on another origin. Both need a decision before a plan can be written. The other four choices are conventional but change the layout, CI and pins, so they are recorded here too.

**Trigger:**

- [x] A decision blocks work and nothing scheduled will reach it in time (CDS-29)
- [ ] A decision already made implicitly in an artefact needs ratifying
- [x] An earlier decision is being narrowed (UI specification principle 2, "mock first, and a page is not done until it passes the same `@ui` scenarios against both")
- [x] Two documents disagree (principle 2 and the test-control arrangement every `@ui` file depends on)

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | All 11 `@ui` feature files (41 scenarios) arrange a persona with `holds the "<persona>" persona`, a test-control call. The Prism mock serves the contract's examples and has no test control or personas | `grep` of `features-shared/ui/` and `security/open-redirect.feature`; `tools/mock-smoke.mjs` |
| B2 | The service has no CORS and no static-file hosting. A UI on another port calling port 4000 is blocked by the browser | `Program.cs`; no `UseCors` or `UseStaticFiles` |
| B3 | The UI stack in UI specification section 3 installs and builds on Node 24.18.0 (React 19.3.0, Vite 8.3.4, TypeScript 5.9.3, Vitest 5.0.4); a Chromium drove a built page by `data-testid` and role | Spike, 2026-10-12 |
| B4 | The 41 scenarios have 107 distinct step patterns; the existing harness package has the abilities and runner for the API; the `verify` run is 14 steps | Step glossary; harness design |
| B5 | `@serenity-js/playwright` 3.49.0 needs `playwright-core ~1.64.0`; the harness is on Serenity/JS 3.48.2 | `npm view` |

## 3. Decision items

### D1. Which backend runs the `@ui` scenarios

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **The live service only.** Prism stays for the typed-client smoke and component-test fixtures; UI specification principle 2 and the verification table are amended | One backend to keep true; personas, clock and bug flags work. A page is never tried against a pure mock | Recommended, chosen |
| 2 | **A persona-aware mock.** Build a mock that implements personas and test control | Keeps "mock first", but is a second implementation of the service | Considered |
| 3 | **Both, a reduced mock subset.** Run only the persona-independent scenarios against Prism | Almost none exist (B1); the subset would be a handful | Considered |
| 4 | **Do nothing.** Keep principle 2 as written | The exit gate cannot be met | Considered |
| 5 | **Reframe.** Treat the service as the mock: a UI development launch profile with test control on | The same as option 1 in practice | Considered |

**The argument against.** The mock-first principle meant a page could be built before the service existed; that reason is gone, but a UI developed only against the service can hide contract assumptions that the Prism examples would expose. **What would change it:** a need to demonstrate the UI without the .NET service.

### D2. How the browser reaches the API

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **The service serves the built UI** from `/`, beside `/api/v1`; development uses a Vite dev proxy to port 4000 | Same origin for tests and demos; no CORS code; the service gains a static-file step | Recommended, chosen |
| 2 | **Add CORS to the service** | A security-relevant service change, and an origin list to maintain | Considered |
| 3 | **A separate reverse proxy** | More moving parts for the harness | Considered |
| 4 | **Do nothing** | The UI cannot call the API from a browser | Considered |

**The argument against.** It couples the UI to the service's deployment; a deployed UI might want its own host. **What would change it:** a requirement to host the UI separately (then option 2).

### D3. Package layout

**Chosen (default): a new `demo-apps/demoapp001-react-ui/`** with its own `package.json` and lock, as the service and the client are. Alternative: inside the service project (rejected: mixes two toolchains). **Argument against:** another package to install and audit.

### D4. CI placement

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **A separate `ui` job** (install, typecheck, Vitest, build, the `@ui` scenarios) | `verify` stays near its length; browser setup is isolated | Recommended, chosen |
| 2 | **Steps inside `verify`** | One gate, but roughly double the time and a browser install on every run | Considered |

**The argument against.** Two gates can drift; a green `verify` no longer means the UI is green. Mitigation: the README names both.

### D5. The harness

**Chosen (default): extend `test-harnesses/harness-serenity`** with a `ui` profile and UI steps, sharing the abilities, the parameter types and the runner. Alternative: a new package (rejected: duplicates the contract validation and the runner). **Argument against:** the package grows and its dependencies now include a browser.

### D6. Version pins

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Spec pins with patch bumps:** Vite 8.3.4, TypeScript 5.9.3 (aligned with the client), Vitest 5.0.4, Testing Library 16.3.3; the router proven in U1; Serenity/JS 3.49.0 with Playwright 1.64.0 together | The tested stack (B3); TypeScript 7.0.2 and react-router 8 are left alone | Recommended, chosen |
| 2 | **The latest of everything** | TypeScript 7.0.2 and react-router 8.4.0 now; the client package moves to TypeScript 7 | Considered |

**The argument against.** Staying on TypeScript 5.9.3 leaves a major version behind. **What would change it:** the client package moving to TypeScript 7 for its own reasons.

## 4. Not in this brief

The page designs (UI specification), the slicing and estimates (the CDS-29 plan), Phase 5.

## 5. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | New entry DR-062 | D1 to D6 | [x] |
| `DOCS/.design/ui-specification.md` | Principle 2; section 3; section 9 | Amend for D1 and D2 | [x] v13 |
| `DOCS/implementation-plans/` | CDS-29 plan | The plan, with the slices | [x] |
| `DOCS/backlog.md` | Phase 4 | CDS-31 to CDS-36 | [x] v53 |
| `DOCS/.design/api-specification.md` | Hosting | The service serves the UI | [ ] in U1 (v25) |
| `DOCS/decision-briefs/_index.md` | Brief 11 row | Status | [x] |

## 6. Decision record

The owner decided on 2026-10-12, by answers in chat: D1 "Live service only (Recommended)", D2 "Service serves the built UI (Recommended)", D4 "Separate ui job (Recommended)", D6 "Spec pins with patch bumps (Recommended)". D3 and D5 were put as defaults.

### 6.1 Read-back

1. **D1 option 1.** `@ui` scenarios run against the live service. Prism is kept for the typed-client smoke and component-test fixtures. UI specification principle 2 and the verification table are amended (v13).
2. **D2 option 1.** The service serves the built UI from the same origin; a Vite dev proxy for development; no CORS.
3. **D3 (default).** A new `demo-apps/demoapp001-react-ui/` with its own lock.
4. **D4 option 1.** A separate `ui` CI job.
5. **D5 (default).** The existing harness package gains a `ui` profile and UI steps.
6. **D6 option 1.** Spec pins with patch bumps; the router proven in U1; Serenity/JS 3.49.0 and Playwright 1.64.0 together.

### 6.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | Backend for `@ui` scenarios | **Option 1.** Live service only | | Gary Brooks | 2026-10-12 |
| D2 | How the browser reaches the API | **Option 1.** The service serves the UI | | Gary Brooks | 2026-10-12 |
| D3 | Package layout | New package (default) | | Gary Brooks | 2026-10-12 |
| D4 | CI placement | **Option 1.** A separate `ui` job | | Gary Brooks | 2026-10-12 |
| D5 | The harness | Extend the existing package (default) | | Gary Brooks | 2026-10-12 |
| D6 | Pins | **Option 1.** Spec pins with patch bumps | | Gary Brooks | 2026-10-12 |

**Recorded, not argued away.** Every decision followed the recommendation. The argument against D1 stands: a UI never tried against a pure mock can hide a contract assumption. D3 and D5 are defaults, not explicit choices; a correction goes in 6.3.

### 6.3 Corrections after decision

None.
