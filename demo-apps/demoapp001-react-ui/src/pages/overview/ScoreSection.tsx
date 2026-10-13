// version: 1 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// Score hero and comparison (UI specification 6.2): the score on its 0 to 1000 scale, the bureau, the days to the next
// update (BR-08) and the national and local averages.
import type { components } from '@credit-dashboard-sut/api-client';
import { plural } from '../../format.ts';

type Overview = components['schemas']['ReportOverview'];

export function ScoreSection({ overview }: { overview: Overview }) {
  const { score, bureau } = overview;
  return (
    <section aria-labelledby="score-heading" className="card">
      <h1 data-testid="bureau-name">{bureau.name}</h1>
      <h2 id="score-heading" className="visually-hidden">
        Your credit score
      </h2>
      <div className="score-hero">
        <div
          data-testid="score-gauge"
          role="progressbar"
          aria-label="Credit score"
          aria-valuemin={0}
          aria-valuemax={score.max}
          aria-valuenow={score.current}
          className="gauge"
        >
          <div className="gauge-fill" style={{ width: `${(score.current / score.max) * 100}%` }} />
        </div>
        <p className="score-line">
          <span data-testid="score-value" className="score-value">
            {score.current}
          </span>{' '}
          out of{' '}
          <span data-testid="score-max" className="score-max">
            {score.max}
          </span>
        </p>
      </div>
      <p data-testid="next-update">Updates in {plural(bureau.nextUpdateInDays, 'day', 'days')}</p>
      <dl className="benchmarks">
        <div>
          <dt>National average</dt>
          <dd data-testid="bench-national">{score.nationalAverage}</dd>
        </div>
        <div>
          <dt>Local average</dt>
          <dd data-testid="bench-local">{score.localAverage}</dd>
        </div>
      </dl>
    </section>
  );
}
