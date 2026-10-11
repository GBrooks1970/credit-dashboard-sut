---
version: 1
created: 2026-10-11T09:58Z
project: credit-dashboard-sut
type: implementation-plan
item: CDS-30
status: implemented
approved: "2026-10-11, Gary Brooks, 'approve Kanban plan as recommended, run the one gh api, Landing card link - Leave it for now'; merge authority: per pull request, on request"
delivered: "#59 (workflow, plan, DR-060, backlog v49), squash 6079496; records in the following pull request"
language: en-GB
---

# Implementation plan: CDS-30, publish the Kanban board on GitHub Pages

**History of this plan.** Presented in full to the owner on 2026-10-11 in the same session, and approved with all decisions as recommended. The owner then asked for the one `gh api` call that enables Pages, which was run before the workflow existed (it publishes nothing until a deployment).

**Goal.** Make the implementation Kanban board a public page, as `auth-separation` does, so a visitor can see the project's state: 29 tickets, 27 of them Done.

## Evidence gathered before planning

Read-only; nothing in the repository was changed.

| Finding | Consequence for the plan |
|---|---|
| `auth-separation/.github/workflows/pages.yml` publishes its board: copy the one file to `_site/index.html`, assert the payload is present, deploy with `actions/deploy-pages` | Copy that design; it is already proved |
| The board is one generated, self-contained file (`credit-dashboard-sut_implementation-kanban_v1.html`) with `id="payload-tickets"` and every ticket as JSON (`"id":"CDS-01"` to `"id":"CDS-28"` present) | The payload check can assert those |
| The repository is public and had no Pages site; CI already fails if the board drifts from the backlog | Nothing to add to CI; the workflow deploys the file that CI keeps current |
| Everything the board shows (IDs, titles, status, blockers) is already public in `DOCS/backlog.md` | No new information goes public |

## Steps

1. Enable Pages with the source set to GitHub Actions (`gh api -X POST repos/GBrooks1970/credit-dashboard-sut/pages -f build_type=workflow`). Done by the agent at the owner's request, before this pull request.
2. `.github/workflows/pages.yml`: on a push to `main` that changes the board file or the workflow, and by hand; copies the board to `_site/index.html`; asserts `id="payload-tickets"`, `"id":"CDS-01"` and `"id":"CDS-28"` before deploying; deploys with `actions/deploy-pages`. Permissions `contents: read`, `pages: write`, `id-token: write`; never cancels a deployment.
3. Backlog v49 (CDS-30), README (the Kanban row), CHANGELOG, decision register entry DR-060 (what is public: the board only).
4. After the merge deploys: fetch the live URL, check it returns 200 and carries the payload, then a records pull request marks CDS-30 Done and appends the Outcome.
5. The landing card is left as it is (owner's choice).

## Verification

- The workflow's payload checks pass locally against the committed board, and fail against an empty file (a probe that must fail).
- The workflow run succeeds on `main`; the live page returns 200 with 29 tickets.
- The pull request's own CI run (`verify`) passes; the workflow file does not run on a pull request, so its first real run is the merge.

## Delivery

- Branch `claude/cds-pages-kanban`, one pull request; a records pull request after the deploy.
- Merge only on the owner's authority and the pull request's own CI run reporting success.
- Estimate (mine, not measured): about 0.25 session.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| D1 Approve the plan | As written, or changed | As written | As written (2026-10-11) |
| D2 Who enables Pages | The owner in settings, or the agent with `gh api` | The owner | The agent ran the one `gh api` call at the owner's request (2026-10-11) |
| D3 Landing card link | Add it, or leave the card as is | Leave it | Leave it for now (2026-10-11) |

## Outcome

Delivered as planned in one pull request.

- **#59** (`6079496`, PR CI run 38130319008, `verify` 1 m 56 s). The Pages workflow ran on the merge: run 38130860560, job "Publish the Kanban board", success in 11 s (10:08:10Z to 10:08:21Z).
- **Live check (2026-10-11):** `https://gbrooks1970.github.io/credit-dashboard-sut/` returned HTTP 200 (22,563 bytes, `text/html`); it carries `id="payload-tickets"`, `CDS-01`, `CDS-28` and `CDS-30`; its 30 tickets are 27 Done, 2 Ready and 1 Backlog; it is identical to the committed board after line-ending normalisation; an unknown path returns 404.
- **Probe that had to fail, and did:** the payload checks failed against an empty file (run locally before the merge).

Differences from the plan: none. Pages was enabled by the agent with the one `gh api` call at the owner's request, before the pull request. The landing card was not linked (owner's choice).
