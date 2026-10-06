---
version: 1
created: 2026-10-06T18:02Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-16
status: implemented
approved: 2026-10-06, Gary Brooks; merges of the CDS-16 PR and its records PR authorised once each one's own CI run reports success
delivered: "#11, squash b0fbb3f (2026-10-06); no registry change"
language: en-GB
---

# Implementation plan: CDS-16, resolve and record the remaining version pins

**History of this plan.** The owner was interviewed on four decisions on 2026-10-06. The plan was presented at 18:02Z, approved, and written to this file at 18:28Z, before any implementation (DR-041).

**Goal.** Close Phase 1's remaining version question (DR-009). Versions are decided and recorded now. The files that enforce them (`global.json`, the UI `package.json`) are created when each project is scaffolded in Phase 3 (service) and Phase 4 (UI).

## Evidence gathered before planning

Queried live on 2026-10-06 and queried again at 18:27Z before writing this file, with the same results. Nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| .NET releases index: 10.0 is the active LTS, latest SDK 10.0.401 (2026-09-08); 11.0 is a release candidate (STS) | The API pin is SDK 10.0.401, consistent with DR-017 ('current LTS') |
| This machine has SDKs 8.0.204, 8.0.400 and 9.0.318 only | The owner installs the .NET 10 SDK before Phase 3; noted, not blocking |
| npm: `react` and `react-dom` 19.3.0, `vite` 8.3.3 (engines `^20.19.0 \|\| >=22.12.0`), `@vitejs/plugin-react` 6.1.2 (peer `vite ^8.0.0`) | Compatible with Node 24.18.0 and with each other |
| `packages/api-client` pins TypeScript 5.9.3 because `openapi-typescript` 7.13.0 requires `^5.x` | The UI aligns on 5.9.3 |

## Steps

1. **Decision register v10, DR-044:** the resolved versions:
   - .NET SDK 10.0.401 in `global.json` with `rollForward: latestPatch`;
   - `react` and `react-dom` 19.3.0, `vite` 8.3.3 and `@vitejs/plugin-react` 6.1.2, all exact pins;
   - UI TypeScript 5.9.3, aligned with the client; the two move to 7 together.

   On the day each project is scaffolded, the latest patch of the same major.minor is taken if one exists and recorded in the same PR; a major or minor change needs a new DR. The entry also lists the versions already pinned (Node, Redocly CLI, Prism, Ajv, `openapi-typescript`, `openapi-fetch`, TypeScript for the client), so that one place answers "what are we on".
2. **API specification v11, section 3:** the Runtime row names .NET SDK 10.0.401, the planned `global.json` with `latestPatch`, and the local install.
3. **UI specification v8, section 3:** the Framework row names React 19.3.0, Vite 8.3.3, `@vitejs/plugin-react` 6.1.2 and TypeScript 5.9.3 (DR-044).
4. **Records:**
   - backlog v28: CDS-16 complete, and every Phase 1 item complete except CDS-17 (owner's timing);
   - CHANGELOG;
   - this plan's Outcome and its index row;
   - an implementation log.

## Verification

Re-query npm and the .NET index on the day, and stop if anything has moved. `npm run verify` stays 8 of 8, which includes the Redocly lint. Every cross-link resolves. No failing probe is planned: this change adds no executable check, and the pins take effect only when their files exist.

## Delivery

Branch `claude/cds16-version-pins`, one PR, merged once its own CI run reports success. The Outcome and the implementation log follow in a records PR, as for CDS-15. No registry change.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| Timing | Resolve now, files later; pin files now; defer to Phase 3 and 4 | Resolve now, files later | Resolve now, files later (2026-10-06) |
| .NET SDK | 10.0.401 with `latestPatch`; with `latestFeature`; exact (`disable`) | `latestPatch` | 10.0.401, `latestPatch` (2026-10-06) |
| React and Vite | Exact versions; caret ranges with a lock file | Exact | Exact (2026-10-06) |
| UI TypeScript | 5.9.3 aligned; TypeScript 7 for the UI; decide in Phase 4 | 5.9.3 aligned | 5.9.3 aligned (2026-10-06) |
| Approval | Approve, merge when CI is green; approve, owner merges; change | (owner's call) | Approve, merge when CI is green (2026-10-06) |

## Outcome

Delivered as planned in #11 (squash `b0fbb3f`; CI run 37511724429 green, `verify` 8 of 8, job 20 s). The versions were queried again at 18:27Z and had not changed. Every Phase 1 item is complete except CDS-17.

Differences from the plan:

- **README.** Its decision range was updated to DR-044 (not listed in the steps).
- **Timestamps.** The plan's `created` (18:02Z) and the "presented at 18:02Z" in its history were not read from the clock. The presentation fell between 17:56Z and 18:27Z, the last two clock readings either side of it. The approved body is left as written. The four document headers written in #11 said 18:30Z; their commit is from 18:29Z, and they were corrected in the records PR.

Full record: [`DOCS/implementation-logs/2026-10-06_cds-16-version-pins.md`](../implementation-logs/2026-10-06_cds-16-version-pins.md).
