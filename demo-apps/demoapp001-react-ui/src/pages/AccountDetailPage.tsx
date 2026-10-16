// version: 1 | created: 2026-10-13T18:16Z | project: credit-dashboard-sut | type: source | language: en-GB
// Account detail (UI specification 6.5). A section that does not apply to the type is not rendered at all: a loan has no
// interest rate or promotional period tile, and a closed account has no payment history.
import { Link, useLocation, useParams } from 'react-router';
import type { components } from '@credit-dashboard-sut/api-client';
import { BalanceChart } from '../components/BalanceChart.tsx';
import { PaymentHistoryWidget } from '../components/PaymentHistoryWidget.tsx';
import { SectionState } from '../components/SectionState.tsx';
import { formatDate, formatMoney, formatPercent } from '../format.ts';
import { useSession } from '../session.tsx';
import { useResource } from '../useResource.ts';

type Account = components['schemas']['Account'];
type Details = components['schemas']['AccountDetails'];

const TILES: { field: string; hook: string; label: string; value: (details: Details) => string | null }[] = [
  { field: 'apr', hook: 'apr', label: 'APR', value: (d) => (d.apr == null ? null : formatPercent(d.apr)) },
  { field: 'interestRate', hook: 'interest-rate', label: 'Interest rate', value: (d) => (d.interestRate == null ? null : formatPercent(d.interestRate)) },
  { field: 'promoPeriodMonths', hook: 'promo-period-months', label: 'Promotional period', value: (d) => (d.promoPeriodMonths == null ? null : `${d.promoPeriodMonths} months`) },
  {
    field: 'minPayment',
    hook: 'min-payment',
    label: 'Minimum payment',
    value: (d) => (!d.minPayment ? null : d.minPayment.amount ? formatMoney(d.minPayment.amount.amountMinor, { pence: true }) : `${d.minPayment.percent}%`),
  },
  { field: 'paymentMethod', hook: 'payment-method', label: 'Payment method', value: (d) => (d.paymentMethod == null ? null : d.paymentMethod === 'direct-debit' ? 'Direct debit' : 'Manual') },
];

const HAS_TILES = new Set(['creditcard', 'lineofcredit']);
const HAS_CHART = new Set(['creditcard', 'lineofcredit', 'loan']);
const HAS_PROMO = new Set(['creditcard', 'currentaccount']);

export function AccountDetailPage() {
  const { bureauId = '', accountId = '' } = useParams();
  const { client } = useSession();
  const location = useLocation();
  const { state, data, reload } = useResource(async () => (await client.GET('/accounts/{accountId}', { params: { path: { accountId } } })).data, [client, accountId]);
  const detailAddress = location.pathname + location.search;

  return (
    <div>
      <SectionState testId="account-detail" state={state} onRetry={() => void reload()} errorMessage="This account could not be loaded.">
        {data && <AccountBody account={data} bureauId={bureauId} detailAddress={detailAddress} />}
      </SectionState>
    </div>
  );
}

function AccountBody({ account, bureauId, detailAddress }: { account: Account; bureauId: string; detailAddress: string }) {
  const utilisation = account.utilisation;
  return (
    <>
      <header data-testid="detail-header" className="card">
        <p>
          <Link to={`/credit-health/report/${bureauId}`}>Back to your report</Link>
        </p>
        <h1>
          {account.provider} <span className="muted">{account.maskedNumber}</span>
        </h1>
      </header>

      {HAS_PROMO.has(account.type) && !account.closed && (
        <section data-testid="detail-promo" aria-label="Link your account" className="card">
          <p>Link this account to see live balances. This is a demonstration: nothing is linked.</p>
        </section>
      )}

      <section aria-labelledby="detail-balance-heading" className="card">
        <h2 id="detail-balance-heading">Balance</h2>
        <p data-testid="detail-balance" className="figure">
          {formatMoney(account.balance.amountMinor, { pence: true })}
        </p>
        {account.limit && utilisation !== null && utilisation !== undefined && (
          <>
            <p>
              {formatPercent(utilisation)} of your {formatMoney(account.limit.amountMinor, { pence: true })} limit{utilisation > 100 ? ' · Over limit' : ''}
            </p>
            <div
              data-testid="detail-balance-bar"
              role="progressbar"
              aria-label="Balance against limit"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(utilisation, 100)}
              className="bar"
            >
              <div className="bar-fill" style={{ width: `${Math.min(utilisation, 100)}%` }} />
            </div>
          </>
        )}
        <p className="muted" data-testid="detail-updated">
          Updated {formatDate(account.lastUpdated)}
        </p>
      </section>

      {HAS_TILES.has(account.type) && (
        <section aria-label="Details you can add" className="tiles">
          {TILES.map((tile) => {
            const value = tile.value(account.details);
            const target = `/data-capture/${tile.field}?accountId=${account.id}&redirectUrl=${encodeURIComponent(detailAddress)}`;
            return (
              <Link key={tile.field} to={target} data-testid={`detail-tile-${tile.hook}`}>
                {tile.label}: <span data-testid={`detail-tile-${tile.hook}-value`}>{value ?? 'Not recorded'}</span>
              </Link>
            );
          })}
        </section>
      )}

      {HAS_CHART.has(account.type) && <BalanceChart accountId={account.id} />}

      {!account.closed && (
        <div data-testid="detail-payment-history">
          <PaymentHistoryWidget bureauId={bureauId} accountId={account.id} />
        </div>
      )}

      <section aria-labelledby="detail-meta-heading" className="card">
        <h2 id="detail-meta-heading">Account information</h2>
        <dl>
          <dt>Updated</dt>
          <dd data-testid="detail-meta-frequency">{account.updateFrequency === 'monthly' ? 'Monthly' : 'Quarterly'}</dd>
          <dt>Status</dt>
          <dd data-testid="detail-meta-status">{account.closed ? 'Closed' : account.status}</dd>
          <dt>Opened</dt>
          <dd data-testid="detail-meta-opened">{formatDate(account.openedDate)}</dd>
        </dl>
      </section>

      <section data-testid="detail-help" aria-labelledby="detail-help-heading" className="card">
        <h2 id="detail-help-heading">Need help?</h2>
        <p>If something here looks wrong, contact the lender that holds the account. The bureau shows what the lender reports.</p>
      </section>
    </>
  );
}
