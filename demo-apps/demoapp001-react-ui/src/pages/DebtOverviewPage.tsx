// version: 1 | created: 2026-10-13T13:50Z | project: credit-dashboard-sut | type: source | language: en-GB
// Debt overview (UI specification 6.7): the total (BR-07), its trend, and one row per account type that holds debt
// (DR-046). Summary figures show no pence (UI specification 4.2).
import { ACCOUNT_TYPE_LABEL } from '../accountTypes.ts';
import { SectionState } from '../components/SectionState.tsx';
import { formatMoney } from '../format.ts';
import { useSession } from '../session.tsx';
import { useResource } from '../useResource.ts';

const TREND_LABEL = { up: 'Up', down: 'Down', steady: 'Steady' } as const;

export function DebtOverviewPage() {
  const { client } = useSession();
  const { state, data, reload } = useResource(async () => (await client.GET('/debt/overview')).data, [client]);
  return (
    <section aria-labelledby="debt-page-heading" className="card">
      <h1 id="debt-page-heading">Debt overview</h1>
      <SectionState testId="debt-overview" state={state} onRetry={() => void reload()} errorMessage="Your debt could not be loaded.">
        {data && (
          <>
            <p data-testid="debt-total" className="figure">
              {formatMoney(data.total.amountMinor, { pence: false })}
            </p>
            <p>
              Trend: <span data-testid="debt-trend">{TREND_LABEL[data.trend]}</span>
            </p>
            <ul>
              {data.byType.map((entry) => (
                <li key={entry.type} data-testid={`debt-type-${entry.type}`}>
                  {ACCOUNT_TYPE_LABEL[entry.type]}: {formatMoney(entry.amount.amountMinor, { pence: false })}
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionState>
    </section>
  );
}
