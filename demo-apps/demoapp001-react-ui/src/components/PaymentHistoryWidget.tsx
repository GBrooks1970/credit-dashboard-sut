// version: 1 | created: 2026-10-13T13:50Z | project: credit-dashboard-sut | type: source | language: en-GB
// The payment history widget (UI specification 6.3), one component for the report page and, with an accountId, the account
// detail page (CDS-34). Seven year buttons, the current year chosen first (BR-12); each year has one status; the result is a
// polite live region with the missed payments of the chosen year, or a message saying there were none.
import { useCallback, useEffect, useState } from 'react';
import { useLatest } from '../useLatest.ts';
import type { components } from '@credit-dashboard-sut/api-client';
import { SectionState, type SectionStateName } from './SectionState.tsx';
import { formatMonth } from '../format.ts';
import { useSession } from '../session.tsx';

type History = components['schemas']['PaymentHistory'];
type Status = components['schemas']['PaymentStatus'];

const STATUS_LABEL: Record<Status, string> = { 'on-time': 'On time', missed: 'Missed', 'no-data': 'No data' };
const STATUS_MARK: Record<Status, string> = { 'on-time': '✓', missed: '✗', 'no-data': '–' };

export function PaymentHistoryWidget({ bureauId, accountId }: { bureauId: string; accountId?: string }) {
  const { client } = useSession();
  const [year, setYear] = useState<number | undefined>(undefined);
  const [state, setState] = useState<SectionStateName>('loading');
  const [history, setHistory] = useState<History | null>(null);
  const [busy, setBusy] = useState(false);
  const begin = useLatest();

  const load = useCallback(async () => {
    const current = begin();
    setBusy(true);
    try {
      const query = year === undefined ? {} : { year };
      const { data } = accountId
        ? await client.GET('/accounts/{accountId}/payment-history', { params: { path: { accountId }, query } })
        : await client.GET('/reports/{bureauId}/payment-history', { params: { path: { bureauId }, query } });
      if (!current()) return; // stale: a newer year was chosen, or the page was left (CDS-38 C-03)
      if (data) {
        setHistory(data);
        setState('populated');
      } else {
        setState('error');
      }
    } catch {
      if (current()) setState('error');
    } finally {
      if (current()) setBusy(false);
    }
  }, [client, bureauId, accountId, year, begin]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-labelledby="ph-heading" className="card">
      <h2 id="ph-heading">Payment history</h2>
      <p data-testid="ph-intro">We hold six years of payment history, plus the current year.</p>
      <SectionState testId="payment-history" state={state} onRetry={() => void load()} errorMessage="The payment history could not be loaded.">
        {history && (
          <>
            <div role="group" aria-label="Year" className="actions">
              {history.years.map((entry) => (
                <span key={entry.year} className="year">
                  <button type="button" data-testid={`ph-year-${entry.year}`} aria-pressed={entry.year === history.selectedYear} onClick={() => setYear(entry.year)}>
                    {entry.year}
                  </button>
                  <span data-testid={`ph-year-status-${entry.year}`} role="img" aria-label={`${entry.year}: ${STATUS_LABEL[entry.status]}`}>
                    {STATUS_MARK[entry.status]}
                  </span>
                </span>
              ))}
            </div>
            <ul data-testid="ph-legend" className="legend">
              <li>✓ On time</li>
              <li>✗ Missed</li>
              <li>– No data</li>
            </ul>
            <div data-testid="ph-result" role="region" aria-live="polite" aria-busy={busy} aria-label="Missed payments">
              {history.missed.length === 0 ? (
                <p>There were no missed payments in {history.selectedYear}.</p>
              ) : (
                <ul>
                  {history.missed.map((item) => (
                    <li key={`${item.accountId}-${item.month}`} data-testid={`ph-missed-${item.accountId}-${item.month}`}>
                      {item.provider} · {formatMonth(item.month)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </SectionState>
    </section>
  );
}
