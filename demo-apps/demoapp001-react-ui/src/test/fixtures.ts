// Component fixtures: responses with the shapes the contract documents (decision brief 11 D1: the Prism mock is not used
// by the component tests). Typed against the generated client, so a contract change breaks the build.
import type { components } from '@credit-dashboard-sut/api-client';

type Overview = components['schemas']['ReportOverview'];
type Change = components['schemas']['Change'];

export const money = (amountMinor: number) => ({ amountMinor, currency: 'GBP' as const });

export const change = (n: number, date = '2026-09-28'): Change => ({ id: `chg_${n}`, title: `Change ${n}`, sentiment: 'neutral', impact: 'low', date });

export const overviewFixture: Overview = {
  bureau: { id: 'bureau-a', name: 'Bureau A', nextUpdateInDays: 3 },
  score: { current: 720, max: 1000, nationalAverage: 600, localAverage: 615 },
  summary: { text: 'Your score is good and steady.', feedback: 'none' },
  recentChanges: [change(1), change(2)],
  changesTotal: 2,
  impact: { actionNeeded: 1, monitor: 2, doingWell: 0 },
  debt: { total: money(19827960), trend: 'down', byType: [{ type: 'creditcard', amount: money(42360) }] },
  accountTypes: [
    { type: 'creditcard', balance: money(37960), limit: money(610000), utilisation: 6, includedCount: 2, excluded: [] },
    { type: 'loan', balance: money(1252400), limit: null, utilisation: null, includedCount: 1, excluded: [] },
  ],
  payments: { newMissed: 0, onReport: 2 },
};

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': status >= 400 ? 'application/problem+json' : 'application/json' } });

export const problem = (status: number) => json(status, { type: '/problems/test', title: 'Test', status });
