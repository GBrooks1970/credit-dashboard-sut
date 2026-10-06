---
version: 1
created: 2026-10-06T16:10Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-15
status: approved
approved: 2026-10-06, Gary Brooks; merges of the CDS-15 PR and the registry follow-up authorised once each one's own CI run reports success
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-15, generated TypeScript client

**History of this plan.** A first version was presented on 2026-10-06 at about 09:45Z, recommending npm workspaces. The owner agreed three of its four decisions and deferred the package layout to decision brief 6, which then gained a D0 on whether the harness uses the client. Brief 6 was decided at 16:08Z (DR-042, DR-043) and this revised plan was presented at 16:10Z, approved, and written to this file at 16:33Z, before any implementation (DR-041).

**Goal.** A typed client, generated from the contract, as a standalone package (DR-043). Its consumer is the future React UI; the harness stays independent of it (DR-042). A contract change must break the client's type check, not a user.

## Evidence gathered before planning

From a throwaway spike in the session scratchpad on 2026-10-06; nothing in the repository changed, and port 4011 was freed afterwards.

| Finding | Consequence for the plan |
|---|---|
| `openapi-typescript` 7.13.0 generates 2,674 lines of types for all 36 operations in 0.2 s, without warnings | The generator suits the contract as it is |
| `openapi-typescript` 7.13.0 requires TypeScript `^5.x`; TypeScript's latest is 7.0.2 | TypeScript 5.9.3 (agreed); revisit when the generator supports 7 |
| Strict `tsc` (5.9.3) compiles typed calls and catches `type: 'savings'` (not in `AccountType`) and `greetingName` used as a number | The types enforce the contract at compile time |
| An `openapi-fetch` 0.17.0 client, run directly by Node 24.18.0 (type stripping), called Prism: `GET /me` 200 with `greetingName` "Al"; totals 200 with utilisation 83 | Client, mock and contract work together; TypeScript tests need no build step |

## Steps

1. **Specifications** (edited in place, DR-040): API specification section 3 gains a "Client" row (standalone package, pins, base URLs per environment: mock `http://localhost:4010`, service `http://localhost:4000/api/v1`, DR-039); UI specification section 3's "Data" row names the pinned tools; the README layout shows `packages/api-client` with its own lock and drops `tools/generate-client.mjs`.
2. **`packages/api-client/`** (own `package.json` and lock): `openapi-fetch` 0.17.0 (runtime), `openapi-typescript` 7.13.0 and `typescript` 5.9.3 (development). `scripts/generate.mjs` writes `src/generated/schema.d.ts` through the generator's programmatic interface, with a "generated; do not edit" header, and `--check` fails if the committed file differs from a fresh generation. `src/index.ts`: `createCreditClient({ baseUrl, token })`, the two base-URL constants, and the `paths` and `components` types, using only erasable syntax. `test/types-negative.ts`: `// @ts-expect-error` lines for a wrong enum, a wrong type and a missing required parameter. `npm run check`: drift check, then strict `tsc --noEmit`.
3. **Client smoke** at the root (`tools/client-smoke.ts`, run by Node directly): four typed calls through the package against Prism (login, public; totals, query enum; an account, path parameter; persona binding with overrides, request body). Prism start and stop move into a shared `tools/lib/prism.mjs`, also used by `tools/mock-smoke.mjs`; the root's Prism is reused (owner's choice).
4. **Root `npm run verify`** (`tools/verify.mjs`): installs `fixtures` and `packages/api-client`, then runs the six checks in order (contract lint, fixtures, Gherkin, mock smoke, client check, client smoke) with one result line each, and exits non-zero if any fails.
5. **CI:** set up Node and Python, `pip install gherkin-official==29.0.0`, `npm ci`, `npm run verify`.
6. **Records:** README checks lead with `npm ci && npm run verify`; CHANGELOG; backlog (CDS-15 complete); this plan's Outcome; an implementation log.
7. **Registry follow-up:** gates become `["npm ci && npm run verify"]`, with the Python prerequisite noted.

## Verification

All green locally and in CI. Probe 1: change a description in the contract without regenerating; the drift check and `verify` must fail; restore byte for byte. Probe 2: remove one planted mistake from the negative test; `tsc` must fail ("unused @ts-expect-error"); restore. Port 4010 free after passing and failing runs.

## Delivery

Branch `claude/cds15-api-client`, one PR, merged once its own CI run reports success; then the registry PR, merged the same way.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| TypeScript version | 5.9.3; 7.0.2 | 5.9.3 | 5.9.3 (2026-10-06) |
| Package layout | Workspaces now; standalone; generate into the UI; postpone | Workspaces now (first version) | Deferred to decision brief 6; decided as a standalone package (DR-043) |
| Generated types | Commit with a CI drift check; generate at build | Commit with a drift check | Commit with a drift check (2026-10-06) |
| Aggregate check | `verify` as the registry gate; `verify` plus listed gates; none | `verify` as the gate | `verify` as the gate (2026-10-06) |
| Harness use of the client | Types only; independent; full client; decide at Phase 3 | Types only | Independent (DR-042, brief 6 D0) |
| Prism for the client smoke | Reuse the root's; the package's own | Reuse the root's | Reuse the root's (2026-10-06) |
| Approval | Approve and merge when CI is green; approve and leave merges; change | (owner's call) | Approve, merge when CI is green (2026-10-06) |

## Outcome

Appended after delivery.
