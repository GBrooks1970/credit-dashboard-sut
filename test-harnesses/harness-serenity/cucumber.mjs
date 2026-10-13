const base = {
    // Cucumber allows one stdout formatter: it must be Serenity's, or no scene events fire and actors are never
    // dismissed. Serenity's ConsoleReporter (set up in each profile's hooks) prints the results.
    strict: true,
};

const apiImport = ['src/support/**/*.ts', 'src/api/**/*.ts', 'src/steps/**/*.ts'];
// The ui profile reuses the arrange steps (persona, clock) and nothing else from steps/: its own steps are in src/ui/.
const uiImport = ['src/support/**/*.ts', 'src/ui/**/*.ts', 'src/steps/arrange.steps.ts'];

const apiFormat = ['@serenity-js/cucumber', 'message:reports/api.ndjson'];
const uiFormat = ['@serenity-js/cucumber', 'message:reports/ui.ndjson'];

/** The @api scenarios: the ten api/ files and the two @security @api files (design section 1). */
export const api = {
    ...base,
    import: apiImport,
    format: apiFormat,
    paths: [
        '../../features-shared/api/**/*.feature',
        '../../features-shared/security/access-control.feature',
        '../../features-shared/security/session-and-test-control.feature',
    ],
};

export default api;

/**
 * The @ui scenarios (CDS-29 plan). The list grows with each slice: U1 has the login feature only, and U2 to U5 add
 * theirs. The other UI files are specified and reviewed but not yet implemented, so they are not selected.
 */
export const ui = {
    ...base,
    import: uiImport,
    format: uiFormat,
    paths: [
        '../../features-shared/ui/login.feature',
        '../../features-shared/ui/report-overview.feature',
        '../../features-shared/ui/payment-history.feature',
        '../../features-shared/ui/report-changes.feature',
        '../../features-shared/ui/searches.feature',
        '../../features-shared/ui/personal-details.feature',
        '../../features-shared/ui/debt.feature',
        '../../features-shared/ui/account-drilldown.feature',
        '../../features-shared/ui/account-details-form.feature',
        '../../features-shared/security/open-redirect.feature',
    ],
};

/** Named features: positional paths are added to a profile's paths, not substituted for them, so these have none. */
const selectApi = { ...base, import: apiImport, format: apiFormat };
const selectUi = { ...base, import: uiImport, format: uiFormat };
export { selectApi as 'select-api', selectUi as 'select-ui' };
