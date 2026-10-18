// version: 1 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// The score history (UI specification 6.2): a hand-built SVG so the accessibility tree is ours (section 3), a range
// choice, its own loading and error states, and a visually hidden table with one row per month (4.5). A month with no
// score is a gap in the line and a row that says so (BR-02); it is never carried forward.
import { useCallback, useEffect, useState } from 'react';
import { useLatest } from '../../useLatest.ts';
import type { components } from '@credit-dashboard-sut/api-client';
import { SectionState, type SectionStateName } from '../../components/SectionState.tsx';
import { TEST_BUILD, flagOn } from '../../flags.tsx';
import { formatMonth } from '../../format.ts';
import { useSession } from '../../session.tsx';

type Point = components['schemas']['ScorePoint'];
type Range = '3m' | '6m' | '1y';

const RANGES: { value: Range; label: string }[] = [
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/** `2026-03` as `Mar`; the year is shown on the first point and on January (`Sept '25`). */
export function monthLabel(month: string, index: number): string {
  const [year, number] = month.split('-');
  const name = MONTH_NAMES[Number(number) - 1] ?? month;
  return index === 0 || number === '01' ? `${name} '${year!.slice(2)}` : name;
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD = 28;

export function HistoryChart({ bureauId, max }: { bureauId: string; max: number }) {
  const { client } = useSession();
  const [range, setRange] = useState<Range>('6m');
  const [state, setState] = useState<SectionStateName>('loading');
  const [points, setPoints] = useState<Point[]>([]);
  const begin = useLatest();

  const load = useCallback(async () => {
    const current = begin();
    setState('loading');
    try {
      // The `range-stale` bug flag (test build only; UI specification 8): the chart asks for the default range whatever was chosen.
      const asked = TEST_BUILD && flagOn('range-stale') ? '6m' : range;
      const { data } = await client.GET('/reports/{bureauId}/score/history', { params: { path: { bureauId }, query: { range: asked } } });
      if (!current()) return; // stale: another range was chosen, or the page was left (CDS-38 C-03)
      if (data) {
        setPoints(data);
        setState(data.length === 0 ? 'empty' : 'populated');
      } else {
        setState('error');
      }
    } catch {
      if (current()) setState('error');
    }
  }, [client, bureauId, range, begin]);

  useEffect(() => {
    void load();
  }, [load]);

  const x = (index: number) => PAD + (points.length <= 1 ? (WIDTH - 2 * PAD) / 2 : (index * (WIDTH - 2 * PAD)) / (points.length - 1));
  const y = (score: number) => HEIGHT - PAD - (score / max) * (HEIGHT - 2 * PAD);

  // One line segment per run of consecutive months with a score, so a missing month leaves a gap.
  const segments: string[] = [];
  let run: string[] = [];
  points.forEach((point, index) => {
    if (point.score === null) {
      if (run.length > 1) segments.push(run.join(' '));
      run = [];
    } else {
      run.push(`${x(index)},${y(point.score)}`);
    }
  });
  if (run.length > 1) segments.push(run.join(' '));

  return (
    <section aria-labelledby="history-heading" className="card">
      <h2 id="history-heading">Score history</h2>
      <div role="group" aria-label="Range" className="actions">
        {RANGES.map((r) => (
          <button key={r.value} type="button" data-testid={`range-${r.value}`} aria-pressed={range === r.value} onClick={() => setRange(r.value)}>
            {r.label}
          </button>
        ))}
      </div>
      <SectionState testId="history-chart" state={state} onRetry={() => void load()} errorMessage="The score history could not be loaded." emptyMessage="There is no score history yet.">
        <svg data-testid="history-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Score over the last ${RANGES.find((r) => r.value === range)!.label}`} className="chart">
          {segments.map((line, i) => (
            <polyline key={i} points={line} fill="none" stroke="currentColor" strokeWidth="2" />
          ))}
          {points.map((point, index) =>
            point.score === null ? null : <circle key={point.month} data-testid={`history-point-${point.month}`} cx={x(index)} cy={y(point.score)} r="4" fill="currentColor" />,
          )}
          {points.map((point, index) => (
            <text key={point.month} x={x(index)} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fill="currentColor">
              {monthLabel(point.month, index)}
            </text>
          ))}
        </svg>
        <div className="visually-hidden">
        <table data-testid="history-chart-table">
          <caption>Score by month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Score</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.month} data-testid={`history-chart-row-${point.month}`}>
                <th scope="row">{formatMonth(point.month)}</th>
                <td>{TEST_BUILD && flagOn('chart-no-values') ? '' : point.score === null ? 'No score' : point.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </SectionState>
    </section>
  );
}
