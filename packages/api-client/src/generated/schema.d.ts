// Generated from DOCS/.architecture/openapi.yaml by openapi-typescript (packages/api-client/scripts/generate.mjs).
// Do not edit: change the contract and run `npm run generate` in packages/api-client.
export interface paths {
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Exchange test credentials for a token */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Revoke the current token */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Current user and default bureau */
        get: operations["getMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Identity header, preferred name and tile summaries
         * @description Feeds the My Profile page. Legal name and date of birth are read-only (PR-01).
         *     Tile summaries never carry finance figures (PR-07) or a full mobile number.
         */
        get: operations["getProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile/preferred-name": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Set or clear the preferred name
         * @description The service trims the value, then applies PR-02. An empty string or null clears it.
         *     A value that breaks PR-02 after trimming returns 422.
         */
        patch: operations["updatePreferredName"];
        trace?: never;
    };
    "/me/profile/email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Change the email address
         * @description A different address is stored as unverified and a verification link is sent (PR-04); the link starts the resend window (PR-09). The address already held is not a change: address and status are kept and the current state is returned (PR-04, DR-027).
         */
        put: operations["changeEmail"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile/email/verification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Send the verification link again
         * @description Allowed once at least 60 seconds have passed since the last link was sent, on the controlled clock (PR-09). Sooner is a 429 with Retry-After. An email that is already verified is a 422 (`/problems/rule-violation/already-verified`) and nothing is sent.
         */
        post: operations["resendEmailVerification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile/mobile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Add or change the mobile number
         * @description A UK number (PR-06) is stored at once, normalised to +44, as unverified, and a six-digit code is issued (PR-10). The demo sends no message: the code is always 123456. A number outside PR-06 is a 422 (`/problems/rule-violation/mobile-number`).
         */
        put: operations["changeMobile"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/profile/mobile/verification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Submit the one-time code
         * @description The correct code, while less than 10 minutes have passed since issue, marks the number verified (PR-10). A wrong code with attempts left is a 422 `/problems/rule-violation/code-wrong` carrying `attemptsRemaining` (PR-11). The third wrong code voids the challenge; it, an expired or voided code, and a code with nothing pending are a 422 `/problems/rule-violation/code-invalid`, asking for a new code.
         */
        post: operations["verifyMobile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bureaux": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Bureaux available to the user */
        get: operations["listBureaux"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Overview page aggregate */
        get: operations["getReportOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/score": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Current score and benchmarks */
        get: operations["getScore"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/score/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Monthly score history for a range */
        get: operations["getScoreHistory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/changes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Report changes, newest first */
        get: operations["listChanges"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/impact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Topic counts per category */
        get: operations["getImpact"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/payment-history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Missed payments across all accounts */
        get: operations["getReportPaymentHistory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/searches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Hard or soft search records */
        get: operations["listSearches"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/personal-details": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Personal details held on the report */
        get: operations["getPersonalDetails"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Account rows for a type or the closed list */
        get: operations["listAccounts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reports/{bureauId}/accounts/totals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Summary card figures for one account type */
        get: operations["getAccountTotals"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/accounts/{accountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Account detail */
        get: operations["getAccount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/accounts/{accountId}/balance-history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Last six months of balances */
        get: operations["getBalanceHistory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/accounts/{accountId}/payment-history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Payment history for one account */
        get: operations["getAccountPaymentHistory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/accounts/{accountId}/details": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Set one user-supplied account detail */
        patch: operations["updateAccountDetail"];
        trace?: never;
    };
    "/debt/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Total debt, trend and the breakdown by account type */
        get: operations["getDebtOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Notifications, unread first */
        get: operations["listNotifications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/{notificationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Mark a notification read */
        patch: operations["markNotificationRead"];
        trace?: never;
    };
    "/reports/{bureauId}/summary/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Like, dislike or clear the summary */
        put: operations["setSummaryFeedback"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Send a message to the mock assistant */
        post: operations["sendAssistantMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/__test/reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reset fixtures, flags, clock and latency */
        post: operations["testReset"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/__test/users/{username}/persona": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Bind a test user to a persona, optionally with data overrides
         * @description Binds the user to the persona. Optional `overrides` arrange data no persona holds (DR-020): each list named for a bureau replaces that bureau's list, for this user only, until rebound or reset. Overrides are source data in the fixture format (API spec section 9.1); derived values are recomputed from them. A body that fails the schema is a 400; overrides that break a business rule (for example a stored utilisation that does not match its balance and limit, BR-03) are a 422 (`/problems/rule-violation/overrides-inconsistent`); an unknown bureau ID is a 404.
         */
        put: operations["testBindPersona"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/__test/bugs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Set the active bug flags */
        put: operations["testSetBugs"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/__test/clock": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Freeze server time */
        put: operations["testSetClock"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/__test/latency": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Set artificial latency */
        put: operations["testSetLatency"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/__test/state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read the current test-control state */
        get: operations["testGetState"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/__test/verify-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark a test user's email verified without the link */
        post: operations["testVerifyEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Money: {
            /** @description Minor units (pence). Negative means a credit balance. */
            amountMinor: number;
            /** @enum {string} */
            currency: "GBP";
        };
        /** @description Balance over limit, x 100, rounded half up (BR-03). No upper bound: above 100 means over the limit (DR-013). Floored at 0 for a negative balance (BR-06). Null when the limit is zero or absent. */
        Utilisation: number | null;
        /** @enum {string} */
        Sentiment: "positive" | "neutral" | "negative";
        /** @enum {string} */
        AccountType: "creditcard" | "loan" | "mortgage" | "currentaccount" | "telecomsandutilities" | "lineofcredit";
        /** @enum {string} */
        AccountStatus: "normal" | "arrears" | "default" | "settled" | "closed";
        /** @enum {string} */
        PaymentStatus: "on-time" | "missed" | "no-data";
        /** @enum {string} */
        Persona: "excellent" | "struggling" | "thin-file" | "boundary" | "drilldown" | "error" | "slow";
        /**
         * @description A defect that test control can switch on (DR-008). The API flags are in API specification section 10; the UI and profile flags are in the UI specification section 8 and the My Profile feature specification. A name outside this list is a 400, so a typo cannot silently do nothing.
         * @enum {string}
         */
        BugFlag: "excluded-in-total" | "rounding-down" | "history-carry-forward" | "idor" | "problem-json-missing" | "mask-format" | "currency-float" | "duplicate-nav" | "util-mismatch" | "currency-format" | "minor-units-label" | "placeholder-aria" | "chart-no-values" | "range-stale" | "toggle-label" | "like-both" | "plural" | "button-href" | "double-render" | "ph-a11y" | "open-redirect" | "truncate-summary" | "negative-balance" | "nested-button" | "decorative-alt" | "preferred-on-report" | "preferred-no-trim" | "email-stays-verified" | "pii-in-title" | "lost-edit";
        MaskedNumber: string;
        /** @enum {string} */
        VerificationStatus: "verified" | "unverified";
        /** @enum {string} */
        EmploymentStatus: "employed-full-time" | "employed-part-time" | "self-employed" | "unemployed" | "retired" | "student" | "other";
        /** @description PR-02 after trimming; 1 to 30 letters, spaces, hyphens or apostrophes, no leading or trailing space */
        PreferredNameValue: string;
        Profile: {
            /** @description Read-only in the app (PR-01) */
            legalName: string;
            /**
             * Format: date
             * @description Read-only in the app (PR-01)
             */
            dateOfBirth: string;
            /** Format: date */
            memberSince: string;
            preferredName: components["schemas"]["PreferredNameValue"] | null;
            email: components["schemas"]["EmailContact"];
            /** @description Null when no number is held. Only the last three digits leave the service. */
            mobile: components["schemas"]["MobileContact"] | null;
            /** @description Current address summary; null when none is held */
            address: {
                line1: string;
                postcode: string;
                previousCount: number;
            } | null;
            /** @description Null when not added */
            employment: {
                status: components["schemas"]["EmploymentStatus"];
            } | null;
            /** @description Whether finance details are held; never the figures (PR-07) */
            finances: {
                added: boolean;
            };
        };
        EmailContact: {
            /** Format: email */
            address: string;
            status: components["schemas"]["VerificationStatus"];
        };
        EmailChange: {
            /** Format: email */
            address: string;
        };
        VerificationSent: {
            /** Format: date-time */
            sentAt: string;
            /**
             * Format: date-time
             * @description sentAt plus 60 seconds (PR-09)
             */
            nextResendAt: string;
        };
        MobileContact: {
            lastDigits: string;
            status: components["schemas"]["VerificationStatus"];
        };
        MobileChange: {
            /** @description Checked against PR-06 by the service (422) */
            number: string;
        };
        MobileChallenge: components["schemas"]["MobileContact"] & {
            /**
             * Format: date-time
             * @description Issue time plus 10 minutes (PR-10)
             */
            expiresAt: string;
            /** @description PR-11 */
            attemptsRemaining: number;
        };
        MobileVerification: {
            code: string;
        };
        PreferredNameUpdate: {
            /** @description Raw input; trimmed by the service before PR-02 is applied */
            preferredName: string | null;
        };
        PreferredName: {
            preferredName: components["schemas"]["PreferredNameValue"] | null;
        };
        LoginRequest: {
            username: string;
            password: string;
        };
        LoginResponse: {
            token: string;
            /** Format: date-time */
            expiresAt: string;
        };
        User: {
            id: string;
            /** @description The legal name */
            displayName: string;
            /** @description The name the app greets the customer by (PR-03): the preferred name when set, otherwise the first word of the legal name (DR-036). */
            greetingName: string;
            defaultBureauId: string;
        };
        Bureau: {
            id: string;
            name: string;
            /** @description BR-08 */
            nextUpdateInDays: number;
        };
        Score: {
            current: number;
            /** @constant */
            max: 1000;
            nationalAverage: number;
            localAverage: number;
        };
        ScorePoint: {
            month: string;
            score: number | null;
        };
        Change: {
            id: string;
            title: string;
            sentiment: components["schemas"]["Sentiment"];
            /** @enum {string} */
            impact: "low" | "medium" | "high";
            /** Format: date */
            date: string;
        };
        ChangePage: components["schemas"]["PageMeta"] & {
            items: components["schemas"]["Change"][];
        };
        Impact: {
            actionNeeded: number;
            monitor: number;
            doingWell: number;
        };
        Summary: {
            text: string;
            /** @enum {string} */
            feedback: "like" | "dislike" | "none";
        };
        ReportOverview: {
            bureau: components["schemas"]["Bureau"];
            score: components["schemas"]["Score"];
            summary: components["schemas"]["Summary"];
            recentChanges: components["schemas"]["Change"][];
            changesTotal: number;
            impact: components["schemas"]["Impact"];
            debt: components["schemas"]["DebtOverview"];
            accountTypes: components["schemas"]["AccountTotals"][];
            /** @description onReport is the number of (account, month) pairs with status missed in the BR-12 window across the bureau's accounts; newMissed is those in the three months ending at the current month (decision brief 9 D4). */
            payments: {
                newMissed: number;
                onReport: number;
            };
        };
        AccountSummary: {
            id: string;
            type: components["schemas"]["AccountType"];
            provider: string;
            /** Format: uri */
            logoUrl?: string | null;
            maskedNumber: components["schemas"]["MaskedNumber"];
            balance: components["schemas"]["Money"];
            limit?: components["schemas"]["Money"] | null;
            utilisation?: components["schemas"]["Utilisation"];
            includedInTotals: boolean;
            status: components["schemas"]["AccountStatus"];
        };
        AccountTotals: {
            type: components["schemas"]["AccountType"];
            balance: components["schemas"]["Money"];
            limit?: components["schemas"]["Money"] | null;
            utilisation?: components["schemas"]["Utilisation"];
            includedCount: number;
            excluded: {
                id: string;
                provider: string;
                maskedNumber: components["schemas"]["MaskedNumber"];
                balance: components["schemas"]["Money"];
            }[];
        };
        AccountDetails: {
            apr?: number | null;
            interestRate?: number | null;
            promoPeriodMonths?: number | null;
            minPayment?: {
                amount?: components["schemas"]["Money"];
                percent?: number;
            } | null;
            /** @enum {string|null} */
            paymentMethod?: "direct-debit" | "manual" | null;
        };
        Account: components["schemas"]["AccountSummary"] & {
            /** Format: date */
            openedDate: string;
            /** Format: date */
            closedDate?: string | null;
            /** @enum {string} */
            updateFrequency: "monthly" | "quarterly";
            /** Format: date */
            lastUpdated: string;
            /** @description Unfloored value (BR-06) */
            utilisationRaw?: number | null;
            details: components["schemas"]["AccountDetails"];
            closed: boolean;
        };
        DetailUpdate: {
            /** @enum {string} */
            field: "apr" | "interestRate" | "promoPeriodMonths" | "minPayment" | "paymentMethod";
            value: unknown;
        };
        BalancePoint: {
            month: string;
            balance: components["schemas"]["Money"];
            limit?: components["schemas"]["Money"] | null;
        };
        /** @description An account as source data (API spec section 9.1): the contract Account plus the inputs the service derives from. Used by persona fixtures and by test-control overrides (DR-020). */
        FixtureAccount: components["schemas"]["Account"] & {
            /** @description BR-09 input as the source supplies it */
            sourceMask?: string;
            /** @description BR-12 source */
            missedMonths: string[];
            /** @description Oldest first; also the BR-07 trend source */
            balanceHistory: components["schemas"]["BalancePoint"][];
        };
        /** @description Test-control data for one binding (DR-020). Each list named for a bureau replaces that list; lists not named are kept from the persona. */
        PersonaOverrides: {
            bureaux: {
                id: string;
                accounts?: components["schemas"]["FixtureAccount"][];
                changes?: components["schemas"]["Change"][];
                searches?: components["schemas"]["Search"][];
            }[];
        };
        PaymentHistory: {
            years: {
                year: number;
                status: components["schemas"]["PaymentStatus"];
            }[];
            selectedYear: number;
            missed: {
                accountId: string;
                provider: string;
                month: string;
            }[];
        };
        Search: {
            id: string;
            /** @enum {string} */
            kind: "hard" | "soft";
            organisation: string;
            purpose?: string;
            /** Format: date */
            date: string;
        };
        SearchPage: components["schemas"]["PageMeta"] & {
            items: components["schemas"]["Search"][];
        };
        PersonalDetails: {
            name: string;
            addresses: {
                line1: string;
                town?: string;
                postcode: string;
                current: boolean;
            }[];
            electoralRoll: boolean;
        };
        DebtOverview: {
            total: components["schemas"]["Money"];
            /** @description The total split by account type (BR-07, DR-046): for each type, the sum of positive balances of open accounts with includedInTotals true. One entry per type whose sum is above zero, in AccountType enum order; current accounts never appear. The entries sum to total. */
            byType: {
                type: components["schemas"]["AccountType"];
                amount: components["schemas"]["Money"];
            }[];
            /**
             * @description Against total debt three months earlier (BR-07). Steady when the unrounded change is at most 1% either way; if the earlier total was zero, steady when now zero, otherwise up (DR-011).
             * @enum {string}
             */
            trend: "up" | "down" | "steady";
        };
        Notification: {
            id: string;
            title: string;
            read: boolean;
            /** Format: date-time */
            createdAt: string;
        };
        NotificationPage: components["schemas"]["PageMeta"] & {
            items: components["schemas"]["Notification"][];
            unread: number;
        };
        Feedback: {
            /** @enum {string} */
            value: "like" | "dislike" | "none";
        };
        PageMeta: {
            page: number;
            pageSize: number;
            total: number;
        };
        Problem: {
            /**
             * Format: uri-reference
             * @description The problem type (API specification section 8). A 422 names its rule outcome under /problems/rule-violation/ (DR-048); clients and tests branch on type, never on title or detail.
             */
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            /** @description code-wrong only (PR-11); code-invalid carries none */
            attemptsRemaining?: number;
            errors?: {
                field?: string;
                message?: string;
            }[];
        };
    };
    responses: {
        /** @description Request failed validation */
        Validation: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/validation",
                 *       "title": "Request failed validation",
                 *       "status": 400,
                 *       "detail": "One or more fields are invalid.",
                 *       "instance": "/api/v1/reports/bureau-a/score/history",
                 *       "errors": [
                 *         {
                 *           "field": "range",
                 *           "message": "must be one of 3m, 6m, 1y"
                 *         }
                 *       ]
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description Missing or invalid token */
        Unauthenticated: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/unauthenticated",
                 *       "title": "Missing or invalid token",
                 *       "status": 401,
                 *       "detail": "The token has expired.",
                 *       "instance": "/api/v1/me"
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description Not found, or owned by another user (BR-15) */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/not-found",
                 *       "title": "Not found",
                 *       "status": 404,
                 *       "detail": "No account with this ID was found.",
                 *       "instance": "/api/v1/accounts/acc_zz9zz"
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description An account detail is out of range (BR-14) */
        RuleViolation: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/rule-violation/out-of-range",
                 *       "title": "Value out of range",
                 *       "status": 422,
                 *       "detail": "interestRate must be between 0 and 100 (BR-14).",
                 *       "instance": "/api/v1/accounts/acc_7f3k2q/details",
                 *       "errors": [
                 *         {
                 *           "field": "value",
                 *           "message": "must be between 0 and 100"
                 *         }
                 *       ]
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description The preferred name breaks PR-02 after trimming */
        PreferredNameRefused: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/rule-violation/preferred-name",
                 *       "title": "Preferred name not allowed",
                 *       "status": 422,
                 *       "detail": "A preferred name is 1 to 30 letters, spaces, hyphens or apostrophes (PR-02).",
                 *       "instance": "/api/v1/me/profile/preferred-name"
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description The email is already verified; nothing is sent (PR-09) */
        AlreadyVerified: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/rule-violation/already-verified",
                 *       "title": "Email already verified",
                 *       "status": 422,
                 *       "detail": "This email address is already verified.",
                 *       "instance": "/api/v1/me/profile/email/verification"
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description The number is not a UK mobile number (PR-06) */
        MobileNumberRefused: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/rule-violation/mobile-number",
                 *       "title": "Not a UK mobile number",
                 *       "status": 422,
                 *       "detail": "Enter a UK mobile number starting 07 or +447 (PR-06).",
                 *       "instance": "/api/v1/me/profile/mobile"
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description The code is refused. `code-wrong` while attempts remain (PR-11); `code-invalid` for the third wrong code, an expired or voided code, or nothing pending (PR-10, PR-11, DR-026) */
        CodeRefused: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description Test-control overrides break a business rule (DR-020) */
        OverridesInconsistent: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/rule-violation/overrides-inconsistent",
                 *       "title": "Overrides break a business rule",
                 *       "status": 422,
                 *       "detail": "acc_ovcc01 utilisation 40 does not match its balance and limit (BR-03).",
                 *       "instance": "/api/v1/__test/users/alex/persona"
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description Too many requests; try again after Retry-After seconds */
        RateLimited: {
            headers: {
                /** @description Seconds until the request is allowed */
                "Retry-After"?: number;
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/rate-limited",
                 *       "title": "Too many requests",
                 *       "status": 429,
                 *       "detail": "A verification link was sent less than 60 seconds ago (PR-09).",
                 *       "instance": "/api/v1/me/profile/email/verification"
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description Server fault */
        Internal: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/internal",
                 *       "title": "Server fault",
                 *       "status": 500,
                 *       "detail": "The report could not be loaded.",
                 *       "instance": "/api/v1/reports/bureau-a/overview"
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description Test control is disabled (TEST_CONTROL is not true), or the target does not exist (DR-008) */
        TestControlDisabled: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "type": "/problems/not-found",
                 *       "title": "Not found",
                 *       "status": 404,
                 *       "detail": "Test control is not enabled.",
                 *       "instance": "/api/v1/__test/reset"
                 *     }
                 */
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
    };
    parameters: {
        BureauId: string;
        AccountId: string;
        Year: number;
        Page: number;
        PageSize: number;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "username": "alex",
                 *       "password": "demo-only"
                 *     }
                 */
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Token issued */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "token": "tok_demo_123",
                     *       "expiresAt": "2026-10-03T18:15:00Z"
                     *     }
                     */
                    "application/json": components["schemas"]["LoginResponse"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Token revoked */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthenticated"];
        };
    };
    getMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Current user */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "usr_01",
                     *       "displayName": "Alex Example",
                     *       "greetingName": "Al",
                     *       "defaultBureauId": "bureau-a"
                     *     }
                     */
                    "application/json": components["schemas"]["User"];
                };
            };
            401: components["responses"]["Unauthenticated"];
        };
    };
    getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The caller's profile */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "legalName": "Alex Example",
                     *       "dateOfBirth": "1985-03-12",
                     *       "memberSince": "2021-06-01",
                     *       "preferredName": "Al",
                     *       "email": {
                     *         "address": "alex.example@example.com",
                     *         "status": "verified"
                     *       },
                     *       "mobile": {
                     *         "lastDigits": "123",
                     *         "status": "verified"
                     *       },
                     *       "address": {
                     *         "line1": "1 Example Street",
                     *         "postcode": "ZZ1 1ZZ",
                     *         "previousCount": 1
                     *       },
                     *       "employment": {
                     *         "status": "employed-full-time"
                     *       },
                     *       "finances": {
                     *         "added": true
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Profile"];
                };
            };
            401: components["responses"]["Unauthenticated"];
        };
    };
    updatePreferredName: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "preferredName": "  Sam  "
                 *     }
                 */
                "application/json": components["schemas"]["PreferredNameUpdate"];
            };
        };
        responses: {
            /** @description Stored value after trimming; null when cleared (PR-02) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "preferredName": "Sam"
                     *     }
                     */
                    "application/json": components["schemas"]["PreferredName"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            422: components["responses"]["PreferredNameRefused"];
        };
    };
    changeEmail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "address": "alex.new@example.com"
                 *     }
                 */
                "application/json": components["schemas"]["EmailChange"];
            };
        };
        responses: {
            /** @description The email as now held */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "address": "alex.new@example.com",
                     *       "status": "unverified"
                     *     }
                     */
                    "application/json": components["schemas"]["EmailContact"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
        };
    };
    resendEmailVerification: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Link sent */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "sentAt": "2026-10-03T10:01:00Z",
                     *       "nextResendAt": "2026-10-03T10:02:00Z"
                     *     }
                     */
                    "application/json": components["schemas"]["VerificationSent"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            422: components["responses"]["AlreadyVerified"];
            429: components["responses"]["RateLimited"];
        };
    };
    changeMobile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "number": "07700 900456"
                 *     }
                 */
                "application/json": components["schemas"]["MobileChange"];
            };
        };
        responses: {
            /** @description Number held as unverified; a code is pending */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "lastDigits": "456",
                     *       "status": "unverified",
                     *       "expiresAt": "2026-10-03T10:10:00Z",
                     *       "attemptsRemaining": 3
                     *     }
                     */
                    "application/json": components["schemas"]["MobileChallenge"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            422: components["responses"]["MobileNumberRefused"];
        };
    };
    verifyMobile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "code": "123456"
                 *     }
                 */
                "application/json": components["schemas"]["MobileVerification"];
            };
        };
        responses: {
            /** @description Number verified */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "lastDigits": "456",
                     *       "status": "verified"
                     *     }
                     */
                    "application/json": components["schemas"]["MobileContact"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            422: components["responses"]["CodeRefused"];
        };
    };
    listBureaux: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Bureaux */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": "bureau-a",
                     *         "name": "Bureau A",
                     *         "nextUpdateInDays": 1
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["Bureau"][];
                };
            };
            401: components["responses"]["Unauthenticated"];
        };
    };
    getReportOverview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Aggregate for the overview page */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "bureau": {
                     *         "id": "bureau-a",
                     *         "name": "Bureau A",
                     *         "nextUpdateInDays": 1
                     *       },
                     *       "score": {
                     *         "current": 720,
                     *         "max": 1000,
                     *         "nationalAverage": 600,
                     *         "localAverage": 615
                     *       },
                     *       "summary": {
                     *         "text": "Your score is good and steady. Paying on time is helping.",
                     *         "feedback": "none"
                     *       },
                     *       "recentChanges": [
                     *         {
                     *           "id": "chg_2b7k9",
                     *           "title": "A credit card balance went down",
                     *           "sentiment": "positive",
                     *           "impact": "low",
                     *           "date": "2026-09-28"
                     *         },
                     *         {
                     *           "id": "chg_8d1x4",
                     *           "title": "A new hard search was recorded",
                     *           "sentiment": "negative",
                     *           "impact": "medium",
                     *           "date": "2026-09-14"
                     *         }
                     *       ],
                     *       "changesTotal": 2,
                     *       "impact": {
                     *         "actionNeeded": 0,
                     *         "monitor": 1,
                     *         "doingWell": 10
                     *       },
                     *       "debt": {
                     *         "total": {
                     *           "amountMinor": 1294760,
                     *           "currency": "GBP"
                     *         },
                     *         "trend": "steady",
                     *         "byType": [
                     *           {
                     *             "type": "creditcard",
                     *             "amount": {
                     *               "amountMinor": 42360,
                     *               "currency": "GBP"
                     *             }
                     *           },
                     *           {
                     *             "type": "loan",
                     *             "amount": {
                     *               "amountMinor": 1252400,
                     *               "currency": "GBP"
                     *             }
                     *           }
                     *         ]
                     *       },
                     *       "accountTypes": [
                     *         {
                     *           "type": "creditcard",
                     *           "balance": {
                     *             "amountMinor": 42360,
                     *             "currency": "GBP"
                     *           },
                     *           "limit": {
                     *             "amountMinor": 510000,
                     *             "currency": "GBP"
                     *           },
                     *           "utilisation": 8,
                     *           "includedCount": 1,
                     *           "excluded": []
                     *         },
                     *         {
                     *           "type": "loan",
                     *           "balance": {
                     *             "amountMinor": 1252400,
                     *             "currency": "GBP"
                     *           },
                     *           "limit": {
                     *             "amountMinor": 1500000,
                     *             "currency": "GBP"
                     *           },
                     *           "utilisation": 83,
                     *           "includedCount": 1,
                     *           "excluded": [
                     *             {
                     *               "id": "acc_9x2m1",
                     *               "provider": "Harbour Bank",
                     *               "maskedNumber": "*6902",
                     *               "balance": {
                     *                 "amountMinor": 116100,
                     *                 "currency": "GBP"
                     *               }
                     *             }
                     *           ]
                     *         }
                     *       ],
                     *       "payments": {
                     *         "newMissed": 0,
                     *         "onReport": 0
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ReportOverview"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    getScore: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Current score (BR-01) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "current": 720,
                     *       "max": 1000,
                     *       "nationalAverage": 600,
                     *       "localAverage": 615
                     *     }
                     */
                    "application/json": components["schemas"]["Score"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    getScoreHistory: {
        parameters: {
            query: {
                range: "3m" | "6m" | "1y";
            };
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Monthly points, oldest first (BR-02) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "month": "2026-08",
                     *         "score": 700
                     *       },
                     *       {
                     *         "month": "2026-09",
                     *         "score": null
                     *       },
                     *       {
                     *         "month": "2026-10",
                     *         "score": 720
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["ScorePoint"][];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    listChanges: {
        parameters: {
            query?: {
                sentiment?: components["schemas"]["Sentiment"];
                page?: components["parameters"]["Page"];
                pageSize?: components["parameters"]["PageSize"];
            };
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Changes, newest first (BR-11) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "page": 1,
                     *       "pageSize": 20,
                     *       "total": 2,
                     *       "items": [
                     *         {
                     *           "id": "chg_2b7k9",
                     *           "title": "A credit card balance went down",
                     *           "sentiment": "positive",
                     *           "impact": "low",
                     *           "date": "2026-09-28"
                     *         },
                     *         {
                     *           "id": "chg_8d1x4",
                     *           "title": "A new hard search was recorded",
                     *           "sentiment": "negative",
                     *           "impact": "medium",
                     *           "date": "2026-09-14"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ChangePage"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    getImpact: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Topic counts */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "actionNeeded": 0,
                     *       "monitor": 1,
                     *       "doingWell": 10
                     *     }
                     */
                    "application/json": components["schemas"]["Impact"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    getReportPaymentHistory: {
        parameters: {
            query?: {
                year?: components["parameters"]["Year"];
            };
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Seven-year summary plus missed payments for the selected year (BR-12) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "years": [
                     *         {
                     *           "year": 2026,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2025,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2024,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2023,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2022,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2021,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2020,
                     *           "status": "no-data"
                     *         }
                     *       ],
                     *       "selectedYear": 2026,
                     *       "missed": []
                     *     }
                     */
                    "application/json": components["schemas"]["PaymentHistory"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    listSearches: {
        parameters: {
            query: {
                kind: "hard" | "soft";
                page?: components["parameters"]["Page"];
                pageSize?: components["parameters"]["PageSize"];
            };
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Search records */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "page": 1,
                     *       "pageSize": 20,
                     *       "total": 1,
                     *       "items": [
                     *         {
                     *           "id": "srch_5n2c8",
                     *           "kind": "hard",
                     *           "organisation": "Lender Y",
                     *           "purpose": "Loan application",
                     *           "date": "2026-09-14"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["SearchPage"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    getPersonalDetails: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Synthetic personal details (Release 3) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "name": "Alex Example",
                     *       "electoralRoll": true,
                     *       "addresses": [
                     *         {
                     *           "line1": "1 Example Street",
                     *           "town": "Exampleton",
                     *           "postcode": "ZZ1 1ZZ",
                     *           "current": true
                     *         },
                     *         {
                     *           "line1": "22 Sample Road",
                     *           "town": "Exampleton",
                     *           "postcode": "ZZ2 2ZZ",
                     *           "current": false
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["PersonalDetails"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    listAccounts: {
        parameters: {
            query?: {
                type?: components["schemas"]["AccountType"];
                status?: "open" | "closed";
            };
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Account rows */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "id": "acc_7f3k2q",
                     *         "type": "creditcard",
                     *         "provider": "Lender X",
                     *         "logoUrl": null,
                     *         "maskedNumber": "*4821",
                     *         "balance": {
                     *           "amountMinor": 42360,
                     *           "currency": "GBP"
                     *         },
                     *         "limit": {
                     *           "amountMinor": 510000,
                     *           "currency": "GBP"
                     *         },
                     *         "utilisation": 8,
                     *         "includedInTotals": true,
                     *         "status": "normal"
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["AccountSummary"][];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    getAccountTotals: {
        parameters: {
            query: {
                type: components["schemas"]["AccountType"];
            };
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Summary card figures (BR-04, BR-05) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "type": "loan",
                     *       "balance": {
                     *         "amountMinor": 1252400,
                     *         "currency": "GBP"
                     *       },
                     *       "limit": {
                     *         "amountMinor": 1500000,
                     *         "currency": "GBP"
                     *       },
                     *       "utilisation": 83,
                     *       "includedCount": 1,
                     *       "excluded": [
                     *         {
                     *           "id": "acc_9x2m1",
                     *           "provider": "Harbour Bank",
                     *           "maskedNumber": "*6902",
                     *           "balance": {
                     *             "amountMinor": 116100,
                     *             "currency": "GBP"
                     *           }
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["AccountTotals"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    getAccount: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: components["parameters"]["AccountId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Account detail */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "acc_7f3k2q",
                     *       "type": "creditcard",
                     *       "provider": "Lender X",
                     *       "logoUrl": null,
                     *       "maskedNumber": "*4821",
                     *       "balance": {
                     *         "amountMinor": 42360,
                     *         "currency": "GBP"
                     *       },
                     *       "limit": {
                     *         "amountMinor": 510000,
                     *         "currency": "GBP"
                     *       },
                     *       "utilisation": 8,
                     *       "includedInTotals": true,
                     *       "status": "normal",
                     *       "openedDate": "2019-04-15",
                     *       "closedDate": null,
                     *       "updateFrequency": "monthly",
                     *       "lastUpdated": "2026-09-30",
                     *       "utilisationRaw": 8,
                     *       "details": {
                     *         "apr": 24.9,
                     *         "interestRate": null,
                     *         "promoPeriodMonths": null,
                     *         "minPayment": null,
                     *         "paymentMethod": "direct-debit"
                     *       },
                     *       "closed": false
                     *     }
                     */
                    "application/json": components["schemas"]["Account"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
        };
    };
    getBalanceHistory: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: components["parameters"]["AccountId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Last 6 months, oldest first */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example [
                     *       {
                     *         "month": "2026-05",
                     *         "balance": {
                     *           "amountMinor": 61200,
                     *           "currency": "GBP"
                     *         },
                     *         "limit": {
                     *           "amountMinor": 510000,
                     *           "currency": "GBP"
                     *         }
                     *       },
                     *       {
                     *         "month": "2026-06",
                     *         "balance": {
                     *           "amountMinor": 55840,
                     *           "currency": "GBP"
                     *         },
                     *         "limit": {
                     *           "amountMinor": 510000,
                     *           "currency": "GBP"
                     *         }
                     *       },
                     *       {
                     *         "month": "2026-07",
                     *         "balance": {
                     *           "amountMinor": 50110,
                     *           "currency": "GBP"
                     *         },
                     *         "limit": {
                     *           "amountMinor": 510000,
                     *           "currency": "GBP"
                     *         }
                     *       },
                     *       {
                     *         "month": "2026-08",
                     *         "balance": {
                     *           "amountMinor": 47930,
                     *           "currency": "GBP"
                     *         },
                     *         "limit": {
                     *           "amountMinor": 510000,
                     *           "currency": "GBP"
                     *         }
                     *       },
                     *       {
                     *         "month": "2026-09",
                     *         "balance": {
                     *           "amountMinor": 44000,
                     *           "currency": "GBP"
                     *         },
                     *         "limit": {
                     *           "amountMinor": 510000,
                     *           "currency": "GBP"
                     *         }
                     *       },
                     *       {
                     *         "month": "2026-10",
                     *         "balance": {
                     *           "amountMinor": 42360,
                     *           "currency": "GBP"
                     *         },
                     *         "limit": {
                     *           "amountMinor": 510000,
                     *           "currency": "GBP"
                     *         }
                     *       }
                     *     ]
                     */
                    "application/json": components["schemas"]["BalancePoint"][];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
        };
    };
    getAccountPaymentHistory: {
        parameters: {
            query?: {
                year?: components["parameters"]["Year"];
            };
            header?: never;
            path: {
                accountId: components["parameters"]["AccountId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Payment history for one account */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "years": [
                     *         {
                     *           "year": 2026,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2025,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2024,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2023,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2022,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2021,
                     *           "status": "on-time"
                     *         },
                     *         {
                     *           "year": 2020,
                     *           "status": "no-data"
                     *         }
                     *       ],
                     *       "selectedYear": 2026,
                     *       "missed": []
                     *     }
                     */
                    "application/json": components["schemas"]["PaymentHistory"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
        };
    };
    updateAccountDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: components["parameters"]["AccountId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "field": "interestRate",
                 *       "value": 29.9
                 *     }
                 */
                "application/json": components["schemas"]["DetailUpdate"];
            };
        };
        responses: {
            /** @description Updated details (BR-14) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "apr": 24.9,
                     *       "interestRate": 29.9,
                     *       "promoPeriodMonths": null,
                     *       "minPayment": null,
                     *       "paymentMethod": "direct-debit"
                     *     }
                     */
                    "application/json": components["schemas"]["AccountDetails"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["RuleViolation"];
        };
    };
    getDebtOverview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Total debt, trend and the breakdown by account type (BR-07) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "total": {
                     *         "amountMinor": 1294760,
                     *         "currency": "GBP"
                     *       },
                     *       "trend": "steady",
                     *       "byType": [
                     *         {
                     *           "type": "creditcard",
                     *           "amount": {
                     *             "amountMinor": 42360,
                     *             "currency": "GBP"
                     *           }
                     *         },
                     *         {
                     *           "type": "loan",
                     *           "amount": {
                     *             "amountMinor": 1252400,
                     *             "currency": "GBP"
                     *           }
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["DebtOverview"];
                };
            };
            401: components["responses"]["Unauthenticated"];
        };
    };
    listNotifications: {
        parameters: {
            query?: {
                page?: components["parameters"]["Page"];
                pageSize?: components["parameters"]["PageSize"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Notifications, unread first */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "page": 1,
                     *       "pageSize": 20,
                     *       "total": 1,
                     *       "unread": 1,
                     *       "items": [
                     *         {
                     *           "id": "ntf_3q9w1",
                     *           "title": "Your Bureau A report has been updated",
                     *           "read": false,
                     *           "createdAt": "2026-10-03T07:00:00Z"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["NotificationPage"];
                };
            };
            401: components["responses"]["Unauthenticated"];
        };
    };
    markNotificationRead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                notificationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "read": true
                 *     }
                 */
                "application/json": {
                    read: boolean;
                };
            };
        };
        responses: {
            /** @description Updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "ntf_3q9w1",
                     *       "title": "Your Bureau A report has been updated",
                     *       "read": true,
                     *       "createdAt": "2026-10-03T07:00:00Z"
                     *     }
                     */
                    "application/json": components["schemas"]["Notification"];
                };
            };
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
        };
    };
    setSummaryFeedback: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bureauId: components["parameters"]["BureauId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "value": "like"
                 *     }
                 */
                "application/json": components["schemas"]["Feedback"];
            };
        };
        responses: {
            /** @description Stored (BR-10) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "value": "like"
                     *     }
                     */
                    "application/json": components["schemas"]["Feedback"];
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["Internal"];
        };
    };
    sendAssistantMessage: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "message": "Why did my score change?"
                 *     }
                 */
                "application/json": {
                    message: string;
                };
            };
        };
        responses: {
            /** @description Canned reply */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "reply": "Your score is 720 out of 1000, which is above the national average of 600.",
                     *       "disclaimer": "Demo assistant with canned replies. It does not give financial advice."
                     *     }
                     */
                    "application/json": {
                        reply: string;
                        disclaimer: string;
                    };
                };
            };
            400: components["responses"]["Validation"];
            401: components["responses"]["Unauthenticated"];
        };
    };
    testReset: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Fixtures reloaded; flags, clock and latency cleared */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            404: components["responses"]["TestControlDisabled"];
        };
    };
    testBindPersona: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                username: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    persona: components["schemas"]["Persona"];
                    overrides?: components["schemas"]["PersonaOverrides"];
                };
            };
        };
        responses: {
            /** @description Bound */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Validation"];
            404: components["responses"]["TestControlDisabled"];
            422: components["responses"]["OverridesInconsistent"];
        };
    };
    testSetBugs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "flags": [
                 *         "util-mismatch",
                 *         "minor-units-label"
                 *       ]
                 *     }
                 */
                "application/json": {
                    flags: components["schemas"]["BugFlag"][];
                };
            };
        };
        responses: {
            /** @description Flags set */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Validation"];
            404: components["responses"]["TestControlDisabled"];
        };
    };
    testSetClock: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "now": "2026-10-03T09:00:00Z"
                 *     }
                 */
                "application/json": {
                    /** Format: date-time */
                    now: string;
                };
            };
        };
        responses: {
            /** @description Clock frozen */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Validation"];
            404: components["responses"]["TestControlDisabled"];
        };
    };
    testSetLatency: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "fixedMs": 3000
                 *     }
                 */
                "application/json": {
                    fixedMs?: number;
                    minMs?: number;
                    maxMs?: number;
                };
            };
        };
        responses: {
            /** @description Latency set */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Validation"];
            404: components["responses"]["TestControlDisabled"];
        };
    };
    testGetState: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Current control state */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "personas": {
                     *         "alex": "excellent"
                     *       },
                     *       "overridden": {
                     *         "alex": false
                     *       },
                     *       "flags": [],
                     *       "now": null,
                     *       "latency": {}
                     *     }
                     */
                    "application/json": {
                        personas?: {
                            [key: string]: components["schemas"]["Persona"];
                        };
                        /** @description Whether each bound user has overrides in force (DR-020) */
                        overridden?: {
                            [key: string]: boolean;
                        };
                        flags?: components["schemas"]["BugFlag"][];
                        /** Format: date-time */
                        now?: string | null;
                        latency?: Record<string, never>;
                    };
                };
            };
            404: components["responses"]["TestControlDisabled"];
        };
    };
    testVerifyEmail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "username": "alex"
                 *     }
                 */
                "application/json": {
                    username: string;
                };
            };
        };
        responses: {
            /** @description Email marked verified */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Validation"];
            404: components["responses"]["TestControlDisabled"];
        };
    };
}
