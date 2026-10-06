// version: 1 | created: 2026-10-06T16:33Z | project: credit-dashboard-sut | type: source | language: en-GB
// The typed client for the credit-dashboard-sut API (CDS-15, DR-043). Types come from the contract through
// src/generated/schema.d.ts; requests are made by openapi-fetch. Only erasable syntax, so Node runs it directly.
// Its consumer is the UI; the test harness calls the API independently (DR-042).
import createClient from 'openapi-fetch';
import type { Client, Middleware } from 'openapi-fetch';
import type { components, paths } from './generated/schema.d.ts';

export type { components, paths };

/** The Prism mock, which serves the contract without the /api/v1 base path (DR-039). */
export const MOCK_BASE_URL = 'http://localhost:4010';
/** The real service. */
export const SERVICE_BASE_URL = 'http://localhost:4000/api/v1';

export interface CreditClientOptions {
  /** MOCK_BASE_URL, SERVICE_BASE_URL or another deployment's base URL. */
  baseUrl: string;
  /** Bearer token from POST /auth/login; sent on every request when present. */
  token?: string;
}

export function createCreditClient(options: CreditClientOptions): Client<paths> {
  const client = createClient<paths>({ baseUrl: options.baseUrl });
  const { token } = options;
  if (token) {
    const bearer: Middleware = {
      onRequest({ request }) {
        request.headers.set('Authorization', `Bearer ${token}`);
        return request;
      },
    };
    client.use(bearer);
  }
  return client;
}
