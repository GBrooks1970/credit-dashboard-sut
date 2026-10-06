---
version: [REQUIRED: N]
created: [REQUIRED: YYYY-MM-DDTHH:MMZ, when the plan was first presented]
project: credit-dashboard-sut
type: implementation-plan
item: [REQUIRED: backlog ID, for example CDS-15]
status: [REQUIRED: proposed | approved | implemented | superseded]
approved: [REQUIRED once approved: YYYY-MM-DD, by whom, and the merge authority given; else "not yet"]
delivered: [REQUIRED once implemented: PR number and squash commit; else "not yet"]
language: en-GB
---

<!--
  AUDIENCE: The owner, engineers and AI agents working on credit-dashboard-sut.
  PURPOSE:  Record an implementation plan as it was put for approval, the choices made, and what was delivered.
  LOCATION: DOCS/implementation-plans/YYYY-MM-DD_<item>-<slug>.md (DR-041); index in _index.md
  TEMPLATE: DOCS/templates/implementation-plan.template.md
  RULES:    Written before implementation starts. Once approved, the body is not edited to match the outcome;
            the Outcome section is appended, and a changed plan is a new version (bump `version`, add a
            'Changes in vN' line). Delete this comment from the written plan.
-->

# Implementation plan: [REQUIRED: item and title]

**Goal.** [REQUIRED: what the item achieves and which gate or rule it serves]

## Evidence gathered before planning

[REQUIRED: spikes, surveys and checks run before writing the plan, with what each showed. Say where they ran
and that they changed nothing in the repository.]

| Finding | Consequence for the plan |
|---|---|
| [finding] | [consequence] |

## Steps

[REQUIRED: numbered, specification first. Name every file to create or change, every pin, every check.]

1. [step]

## Verification

[REQUIRED: the checks and probes that will show the work is done, including at least one that must fail.]

## Delivery

[REQUIRED: branch, PRs, who merges, and any follow-up in other repositories.]

## Decisions put to the owner

[REQUIRED: each choice with its options and the recommendation; then the owner's answer.]

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| [decision] | [options] | [option] | [answer, date] |

## Outcome

[Appended after delivery: what was delivered, where it differed from the plan and why, and links to the
implementation log, PRs and commits.]
