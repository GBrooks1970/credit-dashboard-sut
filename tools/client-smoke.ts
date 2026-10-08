// version: 1 | created: 2026-10-06T16:41Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Client smoke run (CDS-15): typed calls through packages/api-client against the Prism mock. Proves the generated
// client, the mock and the contract agree at run time; the package's own check proves it at compile time.
// Run from the repository root:  npm run check:client-smoke   (Node runs this TypeScript file directly; MOCK_PORT overrides 4010)
import { startPrism } from './lib/prism.mjs';
import { createCreditClient, MOCK_BASE_URL } from '../packages/api-client/src/index.ts';

const contractPath = new URL('../DOCS/.architecture/openapi.yaml', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
// MOCK_PORT moves the mock off 4010, as for the mock smoke, when another process holds the default port.
// The package type-checks this file without Node typings, so the environment is read through globalThis.
const mockPort = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.MOCK_PORT;
const port = Number(mockPort || 4010);
const mockUrl = mockPort ? `http://localhost:${port}` : MOCK_BASE_URL;
const prism = startPrism({ contractPath, port });
const failures: string[] = [];
const expect = (ok: boolean, what: string): void => { if (!ok) failures.push(what); };

try {
  await prism.ready;

  // Public operation: no token.
  const anon = createCreditClient({ baseUrl: mockUrl });
  const login = await anon.POST('/auth/login', { body: { username: 'alex', password: 'demo-only' } });
  expect(login.response.status === 200 && typeof login.data?.token === 'string', `login: status ${login.response.status}`);

  const api = createCreditClient({ baseUrl: mockUrl, token: login.data?.token ?? 'client-smoke' });

  // Query parameter typed by the AccountType enum. Prism answers with the contract's static example whatever the
  // query, so only the status and the presence of the figures are checked here, not the echoed type.
  const totals = await api.GET('/reports/{bureauId}/accounts/totals', {
    params: { path: { bureauId: 'bureau-a' }, query: { type: 'creditcard' } },
  });
  expect(totals.response.status === 200 && typeof totals.data?.includedCount === 'number', `totals: status ${totals.response.status}`);

  // Path parameter.
  const account = await api.GET('/accounts/{accountId}', { params: { path: { accountId: 'acc_7f3k2q' } } });
  expect(account.response.status === 200 && account.data?.id === 'acc_7f3k2q', `account: status ${account.response.status}`);

  // Request body: persona binding with overrides (test control, DR-020).
  const bind = await anon.PUT('/__test/users/{username}/persona', {
    params: { path: { username: 'alex' } },
    headers: { 'X-Test-Control-Key': 'client-smoke' },
    body: {
      persona: 'drilldown',
      overrides: { bureaux: [{ id: 'bureau-a', changes: [{ id: 'chg_cs01', title: 'A balance went down', sentiment: 'positive', impact: 'low', date: '2026-09-28' }] }] },
    },
  });
  expect(bind.response.status === 204, `persona binding: status ${bind.response.status}`);
} catch (err) {
  failures.push(String((err as Error).message ?? err));
} finally {
  prism.stop();
}

console.log(`client smoke: 4 typed calls through packages/api-client, ${4 - failures.length} passed`);
for (const f of failures) console.log(`  FAIL ${f}`);
if (failures.length) throw new Error('client smoke failed');
