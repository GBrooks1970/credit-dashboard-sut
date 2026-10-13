// version: 1 | created: 2026-10-13T18:16Z | project: credit-dashboard-sut | type: source | language: en-GB
// One account in a list (UI specification 6.4): a link to the account, its provider and mask, its balance with pence, and,
// where the type has one, its utilisation. The hooks `row-*` do not share the prefix `account-row-`, so a count of
// `account-row-*` is a count of accounts.
import { Link } from 'react-router';
import type { components } from '@credit-dashboard-sut/api-client';
import { formatMoney, formatPercent } from '../format.ts';

export type AccountSummary = components['schemas']['AccountSummary'];

export function AccountRow({ bureauId, account, showUtilisation }: { bureauId: string; account: AccountSummary; showUtilisation: boolean }) {
  const utilisation = account.utilisation;
  return (
    <li>
      <Link to={`/credit-health/report/${bureauId}/account/${account.id}`} data-testid={`account-row-${account.id}`} className="account-row">
        <span className="row-provider">{account.provider}</span>
        <span className="muted">{account.maskedNumber}</span>
        <span data-testid={`row-balance-${account.id}`}>{formatMoney(account.balance.amountMinor, { pence: true })}</span>
        {showUtilisation && utilisation !== null && utilisation !== undefined && (
          <>
            <span data-testid={`row-util-${account.id}`}>{formatPercent(utilisation)}</span>
            {utilisation > 100 && <strong data-testid={`row-over-${account.id}`}>Over limit</strong>}
          </>
        )}
      </Link>
    </li>
  );
}
