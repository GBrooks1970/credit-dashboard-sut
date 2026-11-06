# Recommendations

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (Codex GPT-6)

## Recommended Refactors

- Fix C-01 in the narrow normalisation function, with pure-rule and in-memory HTTP boundary controls. Keep request schema/domain responsibility intact.
- Refresh development dependency graphs and their recorded acceptance for C-02 package by package; preserve clean production scopes.
- Treat C-03's combined publication gate as a product/assurance decision, not a mechanical prerequisite to every report.
- Address C-04 through a small process-owner abstraction only when the deferred lifecycle item is selected.

## Next Steps

- Preserve a failing LF regression first; prove valid national/international and space-containing inputs still work after the fix, with correct response schemas and no state changes on refusals.
- Record dated full/production npm audits per package root, identify compatible patched versions and rerun that root's relevant checks. Do not fold existing Prism acceptance into new unrelated advisory acceptance.
- Keep 48 Done as the current historical closure until new owner-authorised work is registered. This review's findings are candidates, not implemented or scheduled work.
- After a future repair, run exact-commit CI and make the report's source and lane scope explicit. Today's isolated results do not establish remote CI success.

## Future Project Ideas

- Add a small input-boundary corpus for control characters and Unicode, spanning pure rules and HTTP responses.
- Explore process-tree cancellation with controlled child/grandchild fixtures, independent of a full browser suite.
- If whole-project publication becomes a requirement, build an explicit per-commit evidence manifest covering API/UI, flags and visual lanes.

The deferred container image, stretch profile pages and semantic-rule misses remain explicit choices, not mandatory expansions of this review.

---

[<- Previous](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20261105T0859Z.md) | [Next ->](06_ARCHITECTURE_ASSESSMENT.md)
