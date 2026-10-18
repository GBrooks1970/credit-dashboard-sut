// version: 1 | created: 2026-10-13T13:50Z | project: credit-dashboard-sut | type: source | language: en-GB
// Report changes (UI specification 6.7): every change, newest first (BR-11), narrowed by kind, 20 to a page. The kind and
// the page are in the address (`?bureauId=&sentiment=&page=`), so a narrowed list can be opened again from its address.
import { useSearchParams } from 'react-router';
import type { components } from '@credit-dashboard-sut/api-client';
import { ChangeCard } from '../components/ChangeCard.tsx';
import { Pager } from '../components/Pager.tsx';
import { SectionState } from '../components/SectionState.tsx';
import { TEST_BUILD, flagOn } from '../flags.tsx';
import { useResource } from '../useResource.ts';
import { useSession } from '../session.tsx';

type Sentiment = components['schemas']['Sentiment'];

const PAGE_SIZE = 20;
const KINDS: { value: Sentiment | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

const isSentiment = (value: string | null): value is Sentiment => value === 'positive' || value === 'neutral' || value === 'negative';

export function ReportChangesPage() {
  const { client, user } = useSession();
  const [params, setParams] = useSearchParams();
  const bureauId = params.get('bureauId') ?? user?.defaultBureauId ?? '';
  const sentiment = isSentiment(params.get('sentiment')) ? (params.get('sentiment') as Sentiment) : undefined;
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);

  const { state, data, reload } = useResource(
    async () => {
      const { data } = await client.GET('/reports/{bureauId}/changes', {
        params: { path: { bureauId }, query: { page, pageSize: PAGE_SIZE, ...(sentiment ? { sentiment } : {}) } },
      });
      return data;
    },
    [client, bureauId, sentiment, page],
    // Empty only when nothing matches at all: a page past the end of a list that has changes is a page, with its pager (CDS-38 C-22).
    (result) => result.total === 0,
  );

  function update(next: { sentiment?: Sentiment; page?: number }) {
    const query = new URLSearchParams();
    query.set('bureauId', bureauId);
    if (next.sentiment) query.set('sentiment', next.sentiment);
    if (next.page && next.page > 1) query.set('page', String(next.page));
    setParams(query);
  }

  return (
    <section aria-labelledby="updates-heading" className="card">
      <h1 id="updates-heading">Report changes</h1>
      <div role="group" aria-label="Kind of change" className="actions">
        {KINDS.map((kind) => (
          <button
            key={kind.value}
            type="button"
            data-testid={`changes-filter-${kind.value}`}
            aria-pressed={(sentiment ?? 'all') === kind.value}
            onClick={() => update({ sentiment: kind.value === 'all' ? undefined : kind.value })}
          >
            {kind.label}
          </button>
        ))}
      </div>
      <SectionState testId="changes-list" state={state} onRetry={() => void reload()} emptyMessage="No changes match." errorMessage="The changes could not be loaded.">
        {data && (
          <>
            {data.items.length === 0 ? (
              <p data-testid="changes-past-end">
                There are no changes on this page.{' '}
                <button type="button" data-testid="changes-last-page" onClick={() => update({ sentiment, page: Math.max(1, Math.ceil(data.total / PAGE_SIZE)) })}>
                  Go to the last page
                </button>
              </p>
            ) : (
              <ul className="change-list">
                {(TEST_BUILD && flagOn('double-render') ? [...data.items, ...data.items] : data.items).map((change, index) => (
                  <ChangeCard key={`${change.id}-${index}`} change={change} />
                ))}
              </ul>
            )}
            <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={(next) => update({ sentiment, page: next })} />
          </>
        )}
      </SectionState>
    </section>
  );
}
