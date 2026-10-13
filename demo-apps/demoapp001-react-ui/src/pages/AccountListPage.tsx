// version: 1 | created: 2026-10-13T18:16Z | project: credit-dashboard-sut | type: source | language: en-GB
// The list of one account type (UI specification 6.4): a summary whose figures vary by type, a bar for the total
// utilisation, the open accounts, and the accounts left out of the totals with the reason (BR-05). The summary figures use
// the same whole-pound format as the overview card, so the two can be compared as text (BR-04).
import { Link, useParams } from 'react-router';
import { AccountRow } from '../components/AccountRow.tsx';
import { SectionState } from '../components/SectionState.tsx';
import { ACCOUNT_TYPE_LABEL, type AccountType } from '../accountTypes.ts';
import { formatMoney, formatPercent } from '../format.ts';
import { useSession } from '../session.tsx';
import { useResource } from '../useResource.ts';

interface Metrics {
  balance?: string;
  limit?: string;
  donut: boolean;
  utilisation: boolean;
}

const METRICS: Record<AccountType, Metrics> = {
  creditcard: { balance: 'Total balance', limit: 'Total limit', donut: true, utilisation: true },
  loan: { balance: 'Total remaining', limit: 'Total borrowed', donut: true, utilisation: true },
  mortgage: { balance: 'Total remaining', donut: false, utilisation: false },
  currentaccount: { limit: 'Total overdraft limit', donut: true, utilisation: false },
  telecomsandutilities: { donut: false, utilisation: false },
  lineofcredit: { balance: 'Total balance', limit: 'Total limit', donut: true, utilisation: true },
};

const isType = (value: string | undefined): value is AccountType => value !== undefined && value in METRICS;

export function AccountListPage() {
  const { bureauId = '', type: typeParam } = useParams();
  const { client } = useSession();
  const type = isType(typeParam) ? typeParam : null;
  const { state, data, reload } = useResource(
    async () => {
      if (!type) return null;
      const [rows, totals] = await Promise.all([
        client.GET('/reports/{bureauId}/accounts', { params: { path: { bureauId }, query: { type, status: 'open' } } }),
        client.GET('/reports/{bureauId}/accounts/totals', { params: { path: { bureauId }, query: { type } } }),
      ]);
      return rows.data && totals.data ? { rows: rows.data, totals: totals.data } : null;
    },
    [client, bureauId, type],
    (result) => result.rows.length === 0,
  );

  if (!type) {
    return (
      <section className="card">
        <h1 data-testid="list-title">Accounts</h1>
        <p data-testid="list-unknown-type">We do not know that kind of account.</p>
        <Link to={`/credit-health/report/${bureauId}`}>Back to your report</Link>
      </section>
    );
  }

  const metrics = METRICS[type];
  const label = ACCOUNT_TYPE_LABEL[type];
  const totals = data?.totals;
  const utilisation = totals?.utilisation;
  const included = data?.rows.filter((row) => row.includedInTotals) ?? [];

  return (
    <section aria-labelledby="list-title" className="card">
      <p>
        <Link to={`/credit-health/report/${bureauId}`}>Back to your report</Link>
      </p>
      <h1 id="list-title" data-testid="list-title">
        {label}
      </h1>
      <p className="muted" data-testid="list-notice">
        Balances are as at the last update from the bureau.
      </p>
      <SectionState testId="account-list" state={state} onRetry={() => void reload()} emptyMessage={`You have no open ${label.toLowerCase()}.`} errorMessage="Your accounts could not be loaded.">
        {data && totals && (
          <>
            <div data-testid="list-summary" role="region" aria-label="Summary" className="card">
              {metrics.balance && (
                <p>
                  {metrics.balance}: <strong data-testid="list-total-balance">{formatMoney(totals.balance.amountMinor, { pence: false })}</strong>
                </p>
              )}
              {metrics.limit && totals.limit && (
                <p>
                  {metrics.limit}: <strong data-testid="list-total-limit">{formatMoney(totals.limit.amountMinor, { pence: false })}</strong>
                </p>
              )}
              {/* No limit means no utilisation, and no bar (UI specification 6.4: absent when the limit is null). */}
              {metrics.donut && totals.limit && utilisation !== null && utilisation !== undefined && (
                <>
                  <p data-testid="list-utilisation">{formatPercent(utilisation)} used</p>
                  <div
                    data-testid="list-donut"
                    role="progressbar"
                    aria-label={`${label} utilisation`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(utilisation, 100)}
                    className="bar"
                  >
                    <div className="bar-fill" style={{ width: `${Math.min(utilisation, 100)}%` }} />
                  </div>
                </>
              )}
            </div>
            <ul className="account-list">
              {included.map((account) => (
                <AccountRow key={account.id} bureauId={bureauId} account={account} showUtilisation={metrics.utilisation} />
              ))}
            </ul>
            {totals.excluded.length > 0 && (
              <section data-testid="list-excluded" aria-labelledby="excluded-heading" className="card">
                <h2 id="excluded-heading">Left out of the totals</h2>
                <p>These are not counted in the figures above, because they have no limit to measure them against.</p>
                <ul>
                  {totals.excluded.map((account) => (
                    <li key={account.id} data-testid={`excluded-row-${account.id}`}>
                      {account.provider} {account.maskedNumber}: {formatMoney(account.balance.amountMinor, { pence: true })}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </SectionState>
    </section>
  );
}
