// version: 1 | created: 2026-10-20T23:40Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Whether a Cucumber run writes the Serenity JSON the published report is made from (CDS-47). Only a whole `api` or `ui` run does: scripts/run.mjs
// marks it with HARNESS_SERENITY_JSON=on. A run of one named feature, or one of the bug-flag proof's single scenarios, must not empty the folder and
// replace the whole suite's JSON with a scenario; the Phase 5 gate's full run found exactly that. A pure function, so the rule is a unit test.

export function writesSerenityJson(env: { HARNESS_SERENITY_JSON?: string }): boolean {
    return env.HARNESS_SERENITY_JSON === 'on';
}
