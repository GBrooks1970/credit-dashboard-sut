// version: 1 | created: 2026-10-13T13:50Z | project: credit-dashboard-sut | type: source | language: en-GB
// Searches (UI specification 6.7): the organisations that searched the report, hard and soft apart.
import { useParams } from 'react-router';
import { Pager } from '../components/Pager.tsx';
import { SectionState } from '../components/SectionState.tsx';
import { formatDate } from '../format.ts';
import { useSession } from '../session.tsx';
import { useResource } from '../useResource.ts';
import { useState } from 'react';
import { NotBuiltPage } from './NotBuiltPage.tsx';

const PAGE_SIZE = 20;

export function SearchesPage() {
  const { bureauId = '', kind } = useParams();
  if (kind !== 'hard' && kind !== 'soft') return <NotBuiltPage />;
  return <Searches bureauId={bureauId} kind={kind} />;
}

function Searches({ bureauId, kind }: { bureauId: string; kind: 'hard' | 'soft' }) {
  const { client } = useSession();
  const [page, setPage] = useState(1);
  const { state, data, reload } = useResource(
    async () => (await client.GET('/reports/{bureauId}/searches', { params: { path: { bureauId }, query: { kind, page, pageSize: PAGE_SIZE } } })).data,
    [client, bureauId, kind, page],
    (result) => result.items.length === 0,
  );
  const title = kind === 'hard' ? 'Hard searches' : 'Soft searches';
  return (
    <section aria-labelledby="searches-heading" className="card">
      <h1 id="searches-heading" data-testid="searches-heading">{title}</h1>
      <SectionState testId="search-list" state={state} onRetry={() => void reload()} emptyMessage={`There are no ${kind} searches on your report.`} errorMessage="The searches could not be loaded.">
        {data && (
          <>
            <ul data-testid="search-list">
              {data.items.map((search) => (
                <li key={search.id} data-testid={`search-row-${search.id}`} data-kind={search.kind}>
                  <strong>{search.organisation}</strong>
                  {search.purpose ? ` · ${search.purpose}` : ''} · {formatDate(search.date)}
                </li>
              ))}
            </ul>
            {data.total > PAGE_SIZE && <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />}
          </>
        )}
      </SectionState>
    </section>
  );
}
