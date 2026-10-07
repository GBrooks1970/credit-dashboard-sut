---
version: 1
created: 2026-10-07T19:17Z
project: credit-dashboard-sut
type: decision-brief
brief: 8
subject: The Prism development-dependency audit findings (CDS-26)
blocks: CDS-26; nothing else
approver: the project owner (Gary Brooks)
status: decided
supersedes: none
language: en-GB
---

# Decision brief 8: the Prism development-dependency audit findings

**Items to decide:** D1 what to do about the 15 development-only audit findings in the Prism tree.
**Blocks:** CDS-26 only. No phase gate depends on it.
**Reply with:** "D1: option n", with any conditions. The answer is read back before anything is recorded.

## 1. Why this brief exists

A full `npm audit` at the repository root, run while gathering evidence for the 7 October walkthrough, reported 15 vulnerabilities (9 high, 6 moderate) that nobody had recorded. All sit inside `@stoplight/prism-cli` 5.16.0, the pinned contract mock (CDS-14). CDS-26 recorded the risk and left the choice to the owner. Nothing is broken and no scenario depends on it, but the repository is public and a visitor who runs `npm audit` sees the result.

**Trigger:**

- [ ] A decision blocks work and nothing scheduled will reach it in time
- [x] A decision already made implicitly in an artefact needs ratifying (Prism 5.16.0 was pinned by DR-009 without its dependency tree being audited)
- [ ] An earlier decision is being reversed or narrowed
- [ ] Two documents disagree

## 2. Background

| Ref | Fact | Evidence |
|---|---|---|
| B1 | **The findings.** 15 in all: 9 high and 6 moderate, none critical. Packages with a published advisory title: `@faker-js/faker` (code execution through `helpers.fake`), `lodash` (code injection through `_.template`; prototype pollution in `_.unset` and `_.omit`), `braces` (stack-exhaustion denial of service), `sprintf-js` and `uuid` (denial of service; a missing bounds check). The rest are flagged only because they depend on those or on `@stoplight/*` packages | `npm audit --json` at the root, 2026-10-07T19:17Z |
| B2 | **The exposure.** Development only. Prism serves `openapi.yaml` examples on `127.0.0.1:4010` through `npm run mock`, the mock smoke and the client smoke, and is not in any deployed artefact. The production audit (`npm audit --omit=dev`), `fixtures/` and `packages/api-client/` report 0. CI runs with `contents: read`, `persist-credentials: false` and no repository secrets | `package.json`; `.github/workflows/ci.yml`; audit runs |
| B3 | **The input is ours.** Prism generates responses from this repository's own contract. The advisories need attacker-controlled input (a template string, a pattern, a path); the mock is given none. This is judgement from the advisory titles, not a code review of Prism | B1; CDS-26 |
| B4 | **No clean upstream release.** 5.16.0 is the newest published version, and the package was last modified on 2026-07-17. npm's offered fix is `@stoplight/prism-cli` 3.1.1, a semver-major downgrade across two majors, which would not satisfy DR-039's mock behaviour | `npm view @stoplight/prism-cli`; audit `fixAvailable` |
| B5 | **Overrides, trialled.** In a scratch copy of `package.json` and the lock file only (nothing in the repository changed), overriding `lodash` 4.18.1, `braces` 3.0.3, `uuid` 14.0.2, `@faker-js/faker` 10.6.0, `sprintf-js` 1.1.3, `js-yaml` 4.1.1 and `argparse` 2.0.1 cut the count from 15 to 8 (4 high, 4 moderate). The remainder are `@stoplight/*` packages and the packages that have no patched release in a compatible range (`braces` and `chokidar` still flag). No `js-yaml` 3.x patch exists, so that override is a major bump of a package Prism calls with the 3.x API. **Not run:** Prism with the overrides, so whether the mock still passes its 36 of 36 smoke is unknown | Scratch trial 2026-10-07; lock-only install |
| B6 | **The repository's own signals are off.** Dependabot alerts and security updates are disabled on `GBrooks1970/credit-dashboard-sut`, so no automatic alert exists either way. Secret scanning and push protection are on | `gh api repos/GBrooks1970/credit-dashboard-sut` |
| B7 | **What replacing costs.** Prism is used by `npm run mock`, `tools/mock-smoke.mjs`, `tools/client-smoke.ts` and `tools/lib/prism.mjs`, by the CI gate (Phase 1) and, from Phase 4, by the UI development workflow, which builds pages against the mock first. No replacement has been evaluated here | `tools/`; UI specification |

## 3. Open questions

| Ref | Question as received | Restatement | Decidable now? | Disposition |
|---|---|---|---|---|
| Q1 | CDS-26: accept, wait for a fixed Prism release, or apply npm overrides | The first two collapse: accepting is waiting, with a re-check. Replacement was not offered but is the third real option. Premise checked: no fixed release exists (B4) | Yes | D1 |

## 4. Decision items

### D1. What to do about the 15 findings

**What is being decided.** Whether the repository carries the findings as a recorded, bounded risk, reduces them, or removes their source.

**Why it matters.** The portfolio exists to show disciplined engineering. A visible red audit is a small credibility cost; the work to remove it is not small. The answer also sets a precedent for the next development-only finding, since the same pattern will recur.

| # | Option | Consequence | Standing |
|---|---|---|---|
| 1 | **Accept and record.** A decision-register entry names the exposure (B2) and a trigger to revisit: any new Prism release, each phase gate, or Prism ever running with credentials or beyond localhost. `npm audit --omit=dev` becomes the gate-relevant audit, written into the README 'Checks' section | No code change, no risk of breaking the mock. The root audit stays red for visitors, with the reason written down | **Recommended** |
| 2 | **Apply npm overrides.** Pin the patched leaf packages (B5). Count falls from 15 to 8 | Fewer findings, but a major bump of `js-yaml` under a package that expects 3.x, and 8 remain. The mock may break in ways the 36 of 36 smoke catches or does not. Needs its own plan, the override list is then a thing to maintain | Considered |
| 3 | **Replace Prism.** Choose another contract-example mock and rebuild CDS-14, the smokes and the Phase 4 workflow on it | The finding disappears at its source. Cost: re-doing a delivered, working item, with the risk that the replacement has findings of its own (not evaluated here, B7) | Considered |
| 4 | **Do nothing.** Leave CDS-26 open as it is | The risk is recorded in the backlog but undecided, so every walkthrough, review and visitor re-raises it | Considered |
| 5 | **Reframe.** Move Prism into its own package with its own lock, as `packages/api-client` is (DR-043), so the root audit is clean and the Prism tree is audited, and labelled, separately | The root reports 0, which is true of the root and says nothing of the nested tree. It looks cleaner without being safer; a reader may call it hiding | Set aside: revive if the owner wants the root audit gate-able and is content to label the nested one plainly |

**Recommendation: option 1.** The evidence: the exposure is development-only on loopback with no secrets (B2), the production audit is clean, and no fixed Prism exists (B4), so options 2 and 3 buy a lower number at a real cost. The judgement: the advisories need attacker-controlled input the mock never receives (B3), so the practical risk is low. What the owner gets is a risk that is named, bounded and revisited on a trigger, which is stronger than either a red number nobody explains or an unrun override.

**The argument against.** A showcase repository for test automation should not carry nine high findings, and "development only" is the sentence every dependency incident begins with. Dependabot is off (B6), so nothing would tell the owner if the exposure changed, and a recorded trigger depends on someone remembering it, exactly the weakness of a pin that lives only in a document. Prism is also the one dependency whose upstream looks quiet (B4). Option 3 deals with the cause once, while the project is still at Phase 3 and nothing but tooling depends on the mock; after Phase 4 the UI will be built on it and the price roughly doubles. **Option 3 is the stronger answer if the owner expects to keep this repository as a long-lived public exemplar, or if the quiet upstream concerns them.** Whichever option is chosen, enabling Dependabot alerts is cheap and answers the monitoring half of the argument.

**What would change the recommendation.** Prism being run anywhere with credentials or a non-loopback bind; a Prism release that clears the tree (then take it, which makes this moot); or a trial showing the mock passes its smoke under overrides, in which case option 2 becomes a cheap partial improvement.

## 5. Not in this brief

- Enabling Dependabot alerts on the repository. It is a repository setting and the owner's to change; it helps whichever option is chosen.
- `@scarf/scarf`'s install script, still open for the owner from handover v12.
- Evaluating replacement mocks in detail. That would be the first step of a plan for option 3 and is not done unless it is chosen.

## 6. What the decision obliges

| File | Section | Change required | Done |
|---|---|---|---|
| `DOCS/decision-register.md` | New entry | The outcome, citing this brief | [x] DR-051 |
| `DOCS/backlog.md` | CDS-26 | Close with the outcome, or replace with the plan item the choice creates | [x] v39 |
| `README.md` | 'Checks' (option 1) | State which audit is the gate-relevant one | [x] |
| `DOCS/decision-briefs/_index.md` | Brief 8 row | Status and where the decision landed | [x] row added as awaiting-decision |

## 7. Decision record

The owner decided on 2026-10-07, by reply in chat: "D1: option 1, accept and record".

### 7.1 Read-back

1. **D1 option 1.** The 15 development-only findings in the Prism 5.16.0 tree are accepted as a recorded, bounded risk (DR-051). Nothing is overridden or replaced.
2. **Revisit triggers:** a new Prism release; each phase gate; Prism ever run with credentials or on a non-loopback address.
3. **Gate-relevant audit:** `npm audit --omit=dev` (README 'Checks'). The full audit's 15 findings are expected until a trigger fires.
4. **Not done here:** enabling Dependabot alerts (the owner's repository setting, section 5).

### 7.2 Decisions

| Ref | Item | Decision | Conditions | Who | When |
|---|---|---|---|---|---|
| D1 | The 15 audit findings | **Option 1.** Accept and record | The three triggers above | Gary Brooks | 2026-10-07 |

**Recorded, not argued away.** The decision followed the recommendation. The argument against stands: the repository is a public showcase, monitoring is off, and replacing Prism costs more once Phase 4 is built on it. Option 3 remains the answer if a trigger fires or the owner wants the repository as a long-lived exemplar.

### 7.3 Corrections after decision

None.
