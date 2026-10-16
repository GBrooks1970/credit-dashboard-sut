// version: 1 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// The rest of the overview (UI specification 6.2): impact, debt, accounts, payments, and the tiles that lead to the
// searches and personal details. Every figure comes from the one overview call.
import { Link } from 'react-router';
import type { components } from '@credit-dashboard-sut/api-client';
import { ACCOUNT_TYPE_LABEL } from '../../accountTypes.ts';
import { UtilisationBar } from '../../components/UtilisationBar.tsx';
import { formatMoney, formatPercent, plural } from '../../format.ts';

type Overview = components['schemas']['ReportOverview'];

export function ImpactSection({ impact }: { impact: Overview['impact'] }) {
  return (
    <section id="impact" aria-labelledby="impact-heading" className="card">
      <h2 id="impact-heading">What affects your score</h2>
      <ul>
        <li data-testid="impact-action-needed">{plural(impact.actionNeeded, 'item needs', 'items need')} action</li>
        <li data-testid="impact-monitor">{plural(impact.monitor, 'item', 'items')} to monitor</li>
        <li data-testid="impact-doing-well">{plural(impact.doingWell, 'item', 'items')} doing well</li>
      </ul>
      <a href="#changes" data-testid="impact-link">
        See the changes
      </a>
    </section>
  );
}

const TREND_LABEL: Record<Overview['debt']['trend'], string> = { up: 'Up', down: 'Down', steady: 'Steady' };

export function DebtSection({ debt }: { debt: Overview['debt'] }) {
  return (
    <section aria-labelledby="debt-heading" className="card">
      <h2 id="debt-heading">Total debt</h2>
      <p data-testid="debt-total" className="figure">
        {formatMoney(debt.total.amountMinor, { pence: false })}
      </p>
      <p>
        Trend: <span data-testid="debt-trend">{TREND_LABEL[debt.trend]}</span>
      </p>
      <Link to="/credit-health/debt-overview" data-testid="debt-link">
        See your debt
      </Link>
    </section>
  );
}

export function AccountsSection({ bureauId, accountTypes }: { bureauId: string; accountTypes: Overview['accountTypes'] }) {
  return (
    <section aria-labelledby="accounts-heading" className="card">
      <h2 id="accounts-heading">Your accounts</h2>
      <div className="cards">
        {accountTypes.map((totals) => {
          const type = totals.type;
          const utilisation = totals.utilisation;
          return (
            <article key={type} data-testid={`account-card-${type}`} className="account-card">
              <h3>
                <Link to={`/credit-health/report/${bureauId}/accounts/${type}`}>{ACCOUNT_TYPE_LABEL[type]}</Link>
              </h3>
              <p data-testid={`account-balance-${type}`}>{formatMoney(totals.balance.amountMinor, { pence: false })}</p>
              {/* No limit means no utilisation, and no bar (UI specification 6.2: the donut is absent when the limit is null). */}
              {utilisation !== null && utilisation !== undefined && totals.limit && (
                <>
                  <p data-testid={`account-util-text-${type}`}>{formatPercent(utilisation)} used</p>
                  <UtilisationBar testId={`account-util-bar-${type}`} label={`${ACCOUNT_TYPE_LABEL[type]} utilisation`} percent={utilisation} />
                </>
              )}
            </article>
          );
        })}
      </div>
      <Link to={`/credit-health/report/${bureauId}/closed-accounts`} data-testid="link-closed-accounts">
        See closed accounts
      </Link>
    </section>
  );
}

export function PaymentsSection({ bureauId, payments }: { bureauId: string; payments: Overview['payments'] }) {
  return (
    <section aria-labelledby="payments-heading" className="card">
      <h2 id="payments-heading">Payments</h2>
      <p data-testid="payments-new-missed">{plural(payments.newMissed, 'new missed payment', 'new missed payments')}</p>
      <p data-testid="payments-on-report">{plural(payments.onReport, 'missed payment', 'missed payments')} on your report</p>
      <Link to={`/credit-health/report/${bureauId}/payment-history`} data-testid="link-payment-history">
        See payment history
      </Link>
    </section>
  );
}

export function TilesSection({ bureauId }: { bureauId: string }) {
  const base = `/credit-health/report/${bureauId}`;
  return (
    <section aria-label="More about your report" className="tiles">
      <Link to={`${base}/searches/hard`} data-testid="tile-hard-searches">
        Hard searches
      </Link>
      <Link to={`${base}/searches/soft`} data-testid="tile-soft-searches">
        Soft searches
      </Link>
      <Link to={`${base}/personal-details`} data-testid="tile-personal-details">
        Personal details
      </Link>
      <Link to={`${base}/personal-details`} data-testid="tile-corrections">
        Corrections
      </Link>
    </section>
  );
}
