---
version: 1
created: 2026-10-20T19:50Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-45
status: approved
approved: "2026-10-20, Gary Brooks, 'Approved as recommended, Merge and continue' (D1 to D6 as recommended); merge only on the owner's word per pull request"
delivered: not yet
language: en-GB
---

# Implementation plan: CDS-45, P7 the Phase 5 exit

**Goal.** Close Phase 5 the way Phases 1 to 4 were closed: gather the exit evidence from CI and from a full local run, link the published report from the README, and put a decision brief to the owner (brief 14) that records the gate with its exceptions. The gate record itself (a new DR) is the owner's: the README gate is not marked "Met" until the owner decides.

## The gate, as the README states it

"Every flag turns at least one committed check (a scenario, exit check, component test or service test) red for the stated reason; report published." The Phase 5 plan adds: the visual check green on Linux CI and failing on a planted change.

## Evidence already gathered, and what is missing

Read only; nothing was run against the repository and nothing in it was changed.

| Gate condition | Evidence today | Gap |
|---|---|---|
| 30 of 30 flags caught for the stated reason, in CI | The `flags` job prints "30 of 30 implemented flags caught" and passed on every pull request and on `main` since #117 (15m26s to 17m12s); the push runs for `3bdeefe` and `4381fcb` both passed in full | The job keeps no record beyond its log, which expires. The brief needs a durable record |
| Visual check green on Linux CI, red on a planted change | Green twice running; a colour change failed 16 of 32 and a margin change 32 of 32 (P5b) | Recorded in the P5 log; the brief cites it |
| Report published | Live at `/report/` (77 scenarios, 119 test cases), commit stamp checked | Not linked from the README yet. The landing card says it is published, without a link |
| The full run | `verify` 14 of 14, `check:ui`, `check:ui-scenarios`, `check:ui-exit` and the unit tests pass on every slice | One recorded full run on the final commit, with counts, for the brief |
| `main` CI green | Two pushes to `main` since the CDS-46 fix passed in full | The brief cites the run on the final commit |

## Work, in slices

**P7a, the evidence made durable, and the README link.**
1. The `flags` job writes its table (`reports/bug-flags.md`) to the job summary and uploads `reports/bug-flags.json` and `.md` as an artifact, always (14 days), so a gate cites a record and not a log line (D3). A small change to `ci.yml`.
2. The README links the published report and the board (the two public URLs) and states what the report is (D2). A live check of every README claim that names a URL or a count, recorded in the log (the plan's equivalent of the `close-project` verification).
3. CHANGELOG, harness design note, backlog.

**P7b, the full run and the gate brief.**
1. A full local run on the final `main` (D5): `npm run verify`, `check:ui`, `check:ui-scenarios`, `check:ui-exit`, `check:bug-flags`, `check:report` (JSON), with counts and durations. The CI run on the same commit supplies `check:visual`, the HTML half of `check:report`, and the deployed site.
2. Decision brief 14, in the form of brief 12: why it exists, background facts with evidence (B1 to B8), the exceptions stated plainly, the decisions with options and a recommendation, and "reply with" instructions. It stops for the owner's answers (D6); the answer is read back before anything is recorded.

**P7c, after the owner's answers: the gate record.**
1. DR-067: the Phase 5 gate (met, met with exceptions, or not yet), its conditions, its exceptions, and the course after it.
2. README gate row set to what the owner decides; backlog (CDS-45 and the CDS-37 umbrella Done); the plan Outcome and implementation log.
3. Registry, landing card and capability matrix updated to the new status, and handover v21, only when the owner asks.

## Exceptions the brief will state (known now)

- The independent review (CDS-38) was held; its deferred items A-22, R2-B-13, R2-B-17 and R2-B-19 stay open as low-priority backlog.
- The visual check cannot see a one-channel colour change of 10 steps (inside the 0.2 colour distance), and its baselines depend on the runner image (pinned to `ubuntu-24.04`).
- The flag proof flaked twice on `main` (CDS-46); the cause is unproved, the runner now retries and keeps the log, and two pushes to `main` have passed since. If it flakes again before the gate, the brief says so.
- A planted failing scenario was proved locally and on real JSON, not on CI (a failing suite skips the report job).
- The probes were chosen by their author, as in Phase 4. The CDS-38 reviews covered the harness and the UI, not the Phase 5 additions (the flags are covered by their own proof; the visual and report code was not independently reviewed). The brief offers an independent review of P3 to P6 as an option (D4).
- `@serenity-js/serenity-bdd` 3.49.0 was accepted at nine days old.
- Java is not installed on the author's machine, so the HTML half of the report is proved on CI only.

## Verification

Each slice: `npm run verify` 14 of 14 and every CI job `pass`, read. The brief's numbers are copied from run output, with run ids and commits, not estimated.

## Out of scope

New flags, scenarios or pages; the address, employment and finances profile pages (DR-022); a service container image; the landing card link to the report (D2); closing the project (the brief offers it as an option, the owner decides); the deferred review items; changes to the board.

## Risks

- **The flag proof flakes while the evidence is being gathered.** Then the gate evidence shows a re-run, and the brief says so; a red run is not hidden.
- **The README gate wording** already reads "report published", so linking it is part of the evidence, not a change of the gate.
- **Estimate:** about 0.5 session (the Phase 5 plan's figure; mine, not measured).

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 How the Phase 5 gate is recorded | brief 14 first, then DR-067 after the owner's answers, as Phases 1 to 4; record directly without a brief | brief 14 first | as recommended, 2026-10-20 |
| D2 Where the report is linked | the README only, now; the README and the landing card; neither | the README only, with the landing link offered after the gate | as recommended, 2026-10-20 |
| D3 The flag proof's record | job summary plus an uploaded artifact; log only | summary and artifact | as recommended, 2026-10-20 |
| D4 An independent review of P3 to P6 (flags, visual check, report) | not before the gate, offered in the brief as an option after; held before the gate | not before the gate | as recommended, 2026-10-20 |
| D5 Evidence from the final commit | the CI run on the final `main` commit plus one full local run; CI only | both | as recommended, 2026-10-20 |
| D6 After the brief | stop for the owner's answers before P7c; go straight on | stop | as recommended, 2026-10-20 |

The course after Phase 5 (rest and maintain, build the stretch profile pages, the container image, or close the project with a final handover) is not decided here: brief 14 puts it to the owner with the evidence in front of them.

## Outcome

[Appended after delivery.]
