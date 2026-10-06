# CDS-16: Remaining version pins resolved (DR-044) — 2026-10-06

## Session Summary

CDS-16 asked for the .NET SDK, React and Vite to be pinned "as each project is created", and no service or UI project exists yet. The owner was interviewed on four decisions: timing, .NET roll-forward, range style and UI TypeScript. The versions are now resolved and recorded in DR-044. The files that enforce them are created when each project is scaffolded. Delivered in #11 (squash `b0fbb3f`). With this, every Phase 1 item is complete except CDS-17, which waits for the owner's timing.

---

## Objectives

1. ✅ Interview the owner on the open choices, each with a recommendation.
2. ✅ Present the full plan, get approval, and write it to file before implementation (`8f6178c`, squashed into #11).
3. ✅ Resolve the versions from live sources, and check them again before implementing.
4. ✅ Record them in one place (DR-044), with the specifications citing it.
5. ✅ Keep the repository green (`npm run verify`, 8 of 8, locally and in CI).

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| All | `npm run verify` (local) | 8/8 | 8/8 | ✅ PASS |
| CI | GitHub Actions run 37511724429 (PR #11) | 8/8 | 8/8, job 20 s | ✅ PASS |

No probe was expected to fail, because the change adds no executable check (stated in the plan).

---

## Changes Implemented

### Version evidence (live, not committed)

The same queries were run when the plan was presented and again at 18:27Z, with identical results:

- **npm:**
  - `react` and `react-dom` 19.3.0;
  - `vite` 8.3.3, with engines `^20.19.0 || >=22.12.0`, which Node 24.18.0 meets;
  - `@vitejs/plugin-react` 6.1.2, with peer `vite ^8.0.0`;
  - `typescript@5` latest 5.9.3.
- **.NET releases index:** 10.0 is the `active` LTS, latest SDK 10.0.401 (2026-09-08); 11.0 is a release candidate (STS).
- **This machine:** `dotnet --list-sdks` shows 8.0.204, 8.0.400 and 9.0.318 only.

### Decisions and specifications

**Files changed:**
- `DOCS/decision-register.md`: v10, DR-044. It records the resolved versions, the rule for scaffold day (take the latest patch of the same major.minor and record it in that PR; a major or minor change needs a new entry), and every version already pinned.
- `DOCS/.design/api-specification.md`: v11. The Runtime row names SDK 10.0.401, `global.json` with `rollForward: latestPatch`, and the local install.
- `DOCS/.design/ui-specification.md`: v8. The Framework row names the four UI pins and TypeScript 5.9.3.
- `README.md`: the decision range now runs to DR-044.
- `CHANGELOG.md`, `DOCS/backlog.md` v28.

---

## Technical Decisions

The structural decision is **DR-044**. The owner's answers, each the recommended option:

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Resolve now, create the files at scaffold | Decide while the facts are fresh, without empty projects beside the specification | Pin files now; defer to Phase 3 and 4 |
| SDK 10.0.401 with `latestPatch` | Patches flow; feature bands do not drift | `latestFeature`; exact (`disable`) |
| Exact pins for React and Vite | Matches every other pin in the repository; updates come by deliberate PR | Caret ranges with a lock file |
| UI TypeScript 5.9.3 | One compiler across the UI-client link (DR-043); both move to 7 together | TypeScript 7 for the UI; decide in Phase 4 |

---

## Documentation Updates

- `DOCS/implementation-plans/2026-10-06_cds-16-version-pins.md`: the plan, with its Outcome appended in this change; index v4, then v5.
- `DOCS/implementation-logs/2026-10-06_cds-16-version-pins.md`: this log.

---

## Lessons Learned

- **"Pin when created" needs a decision about when to decide.** Resolving now and creating the files later keeps the specification honest without scaffolding empty projects.
- **Read the clock before writing a stamp.** Two stamps in this item were estimated: the plan's presentation time (18:02Z), and four document headers that said 18:30Z although their commit is from 18:29Z. Both are corrected or annotated in the records PR. The rule stands: read the time, then write it.

---

## Recommendations / Next Steps

- [ ] Install the .NET 10 SDK on the development machine before Phase 3. Owner.
- [ ] Phase 3 scaffold: create `global.json` (10.0.4xx latest patch) and check DR-044's patch rule. With the service.
- [ ] Phase 4 scaffold: create the UI `package.json` with the DR-044 pins (latest patches), and decide how the UI consumes the client (DR-043). With the UI.
- [ ] CDS-17: Kanban dialect, when a board is wanted. Owner's timing.
- [ ] Decide what Phase 2 means now that its items (CDS-06, 07, 08, 13) are complete: whether the Phase 1 and Phase 2 exit gates are recorded as met, and what comes next. Owner.

---

*Session logged: 2026-10-06. Author: Claude Code.*
