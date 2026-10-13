// version: 1 | created: 2026-10-13T10:45Z | project: credit-dashboard-sut | type: source | language: en-GB
// The generated client (DR-043) at the base URL of the environment (DR-039). Same origin by default: the service serves
// this UI and the API (decision brief 11 D2); in development Vite proxies /api to the service.
import { createCreditClient } from '@credit-dashboard-sut/api-client';

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export type CreditClient = ReturnType<typeof createCreditClient>;

export function clientFor(token?: string): CreditClient {
  return createCreditClient({ baseUrl: API_BASE_URL, token });
}
