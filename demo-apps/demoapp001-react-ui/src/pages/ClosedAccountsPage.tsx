// version: 1 | created: 2026-10-13T18:16Z | project: credit-dashboard-sut | type: source | language: en-GB
// Closed accounts (UI specification 6.7): grouped by type, no summary. A closed account's balance is zero (BR-13).
import { Link, useParams } from 'react-router';
import { AccountRow } from '../components/AccountRow.tsx';
import { SectionState } from '../components/SectionState.tsx';
import { ACCOUNT_TYPE_LABEL, type AccountType } from '../accountTypes.ts';
import { useSession } from '../session.tsx';
import { useResource } from '../useResource.ts';

export function ClosedAccountsPage() {
  const { bureauId = '' } = useParams();
  const { client } = useSession();
  const { state, data, reload } = useResource(
    async () => (await client.GET('/reports/{bureauId}/accounts', { params: { path: { bureauId }, query: { status: 'closed' } } })).data,
    [client, bureauId],
    (rows) => rows.length === 0,
  );
  const types = (Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).filter((type) => data?.some((row) => row.type === type));

  return (
    <section aria-labelledby="closed-title" className="card">
      <p>
        <Link to={`/credit-health/report/${bureauId}`}>Back to your report</Link>
      </p>
      <h1 id="closed-title" data-testid="closed-title">
        Closed accounts
      </h1>
      <SectionState testId="closed-list" state={state} onRetry={() => void reload()} emptyMessage="You have no closed accounts." errorMessage="Your closed accounts could not be loaded.">
        {types.map((type) => (
          <section key={type} data-testid={`closed-group-${type}`} aria-labelledby={`closed-heading-${type}`}>
            <h2 id={`closed-heading-${type}`}>{ACCOUNT_TYPE_LABEL[type]}</h2>
            <ul className="account-list">
              {data!
                .filter((row) => row.type === type)
                .map((account) => (
                  <AccountRow key={account.id} bureauId={bureauId} account={account} showUtilisation={false} />
                ))}
            </ul>
          </section>
        ))}
      </SectionState>
    </section>
  );
}
