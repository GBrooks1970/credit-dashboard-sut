// version: 1 | created: 2026-10-13T18:16Z | project: credit-dashboard-sut | type: source | language: en-GB
// The last six months of balances for one account (UI specification 6.5): a hand-built SVG with a visually hidden table
// alternative (4.5), one row per month.
import type { components } from '@credit-dashboard-sut/api-client';
import { SectionState } from './SectionState.tsx';
import { TEST_BUILD, flagOn } from '../flags.tsx';
import { formatMoney, formatMonth } from '../format.ts';
import { useSession } from '../session.tsx';
import { useResource } from '../useResource.ts';

type Point = components['schemas']['BalancePoint'];

const WIDTH = 600;
const HEIGHT = 200;
const PAD = 28;

export function BalanceChart({ accountId }: { accountId: string }) {
  const { client } = useSession();
  const { state, data, reload } = useResource(
    async () => (await client.GET('/accounts/{accountId}/balance-history', { params: { path: { accountId } } })).data,
    [client, accountId],
    (points: Point[]) => points.length === 0,
  );
  const points = data ?? [];
  const highest = Math.max(1, ...points.map((p) => Math.max(0, p.balance.amountMinor)));
  const width = (WIDTH - 2 * PAD) / Math.max(1, points.length);

  return (
    <section aria-labelledby="balance-chart-heading" className="card">
      <h2 id="balance-chart-heading">Balance over six months</h2>
      <SectionState testId="detail-balance-chart" state={state} onRetry={() => void reload()} emptyMessage="There is no balance history yet." errorMessage="The balance history could not be loaded.">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Balance for each of the last six months" className="chart" data-testid="detail-balance-chart">
          {points.map((point, index) => {
            const height = (Math.max(0, point.balance.amountMinor) / highest) * (HEIGHT - 2 * PAD);
            return (
              <g key={point.month}>
                <rect x={PAD + index * width + 4} y={HEIGHT - PAD - height} width={width - 8} height={height} fill="currentColor" />
                <text x={PAD + index * width + width / 2} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill="currentColor">
                  {point.month.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
        {/* The hiding is on a wrapper: `overflow` does not clip the cells of a table, which then widened the page (CDS-38 C-11). */}
        <div className="visually-hidden">
        <table data-testid="detail-balance-chart-table">
          <caption>Balance by month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Balance</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.month}>
                <th scope="row">{formatMonth(point.month)}</th>
                <td>{TEST_BUILD && flagOn('chart-no-values') ? '' : formatMoney(point.balance.amountMinor, { pence: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </SectionState>
    </section>
  );
}
