// version: 1 | created: 2026-10-06T16:33Z | project: credit-dashboard-sut | type: test | language: en-GB
// Negative type tests (CDS-15): each line below must FAIL to compile. If the contract or the generated types
// change so that one compiles, `tsc` reports an unused @ts-expect-error and the check fails. Type-checked only;
// never run.
import { createCreditClient, MOCK_BASE_URL } from '../src/index.ts';

const api = createCreditClient({ baseUrl: MOCK_BASE_URL });

// A value outside the AccountType enum is refused.
// @ts-expect-error 'savings' is not an AccountType
await api.GET('/reports/{bureauId}/accounts/totals', { params: { path: { bureauId: 'bureau-a' }, query: { type: 'savings' } } });

// greetingName is a string, not a number (DR-036).
const me = await api.GET('/me');
// @ts-expect-error greetingName is a string
const greeting: number | undefined = me.data?.greetingName;

// A required path parameter cannot be left out.
// @ts-expect-error accountId is required
await api.GET('/accounts/{accountId}', { params: {} });

export { greeting };
