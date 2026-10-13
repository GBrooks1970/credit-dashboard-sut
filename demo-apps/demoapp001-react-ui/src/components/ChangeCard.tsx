// version: 1 | created: 2026-10-13T13:50Z | project: credit-dashboard-sut | type: source | language: en-GB
// One report change. The hook `change-card-{id}` is the same on every page that lists changes (DR-016); `data-sentiment`
// lets a test check what kind a card is without reading its wording.
import type { components } from '@credit-dashboard-sut/api-client';
import { formatDate } from '../format.ts';

export type Change = components['schemas']['Change'];

const SENTIMENT_LABEL: Record<Change['sentiment'], string> = { positive: 'Positive', neutral: 'Neutral', negative: 'Negative' };

export function ChangeCard({ change }: { change: Change }) {
  return (
    <li data-testid={`change-card-${change.id}`} data-sentiment={change.sentiment} className={`change change-${change.sentiment}`}>
      <span className="badge">{SENTIMENT_LABEL[change.sentiment]}</span> <strong>{change.title}</strong>
      <div className="muted">
        {formatDate(change.date)} · {change.impact} impact
      </div>
    </li>
  );
}
