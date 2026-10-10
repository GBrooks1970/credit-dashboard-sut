const common = {
    import: ['src/support/**/*.ts', 'src/steps/**/*.ts'],
    // Cucumber allows one stdout formatter: it must be Serenity's, or no scene events fire and actors are never
    // dismissed. Serenity's ConsoleReporter (set up in src/support/hooks.ts) prints the results.
    format: ['@serenity-js/cucumber', 'message:reports/api.ndjson'],
    strict: true,
};

/** The @api scenarios: the ten api/ files and the two @security @api files (design section 1). */
export const api = {
    ...common,
    paths: [
        '../../features-shared/api/**/*.feature',
        '../../features-shared/security/access-control.feature',
        '../../features-shared/security/session-and-test-control.feature',
    ],
};

export default api;

/** The same, for named features: positional paths are added to a profile's paths, not substituted for them. */
export const select = { ...common };
