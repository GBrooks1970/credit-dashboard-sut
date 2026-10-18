// version: 1 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// The report changes (UI specification 6.2): the three newest from the overview, and a toggle that lists every change in
// place (DR-047). The toggle follows the pages of GET /changes, 100 at a time (the contract's largest page), until it
// has them all, and collapses back to the three newest. It is hidden when there are three changes or fewer.
import { useState } from 'react';
import { Link } from 'react-router';
import { ChangeCard, type Change } from '../../components/ChangeCard.tsx';
import { SectionState } from '../../components/SectionState.tsx';
import { TEST_BUILD, flagOn } from '../../flags.tsx';
import { useSession } from '../../session.tsx';

const PAGE_SIZE = 100;

export function ReportChanges({ bureauId, recent, total }: { bureauId: string; recent: Change[]; total: number }) {
  const { client } = useSession();
  const [all, setAll] = useState<Change[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function loadAll() {
    setLoading(true);
    setFailed(false);
    try {
      const collected: Change[] = [];
      for (let page = 1; collected.length < total; page++) {
        const { data } = await client.GET('/reports/{bureauId}/changes', { params: { path: { bureauId }, query: { page, pageSize: PAGE_SIZE } } });
        if (!data || data.items.length === 0) throw new Error('no page');
        collected.push(...data.items);
      }
      setAll(collected);
      setExpanded(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    if (expanded) setExpanded(false);
    else if (all) setExpanded(true);
    else void loadAll();
  }

  const shown = expanded && all ? all : recent;
  return (
    <section id="changes" aria-labelledby="changes-heading" className="card">
      <h2 id="changes-heading" data-testid="changes-heading">
        Report changes
      </h2>
      {shown.length === 0 ? (
        <p>No changes to your report yet.</p>
      ) : (
        <ul className="change-list">
          {/* The `double-render` bug flag (test build only; UI specification 8): the list drawn twice. */}
          {(TEST_BUILD && flagOn('double-render') ? [...shown, ...shown] : shown).map((change, index) => (
            <ChangeCard key={`${change.id}-${index}`} change={change} />
          ))}
        </ul>
      )}
      {total > recent.length && (
        <>
          <button type="button" data-testid="changes-toggle" aria-expanded={expanded} disabled={loading} onClick={toggle}>
            {expanded ? 'Show fewer' : `Show all ${total}`}
          </button>
          {loading && <div data-testid="changes-toggle-loading" aria-busy="true" role="status" aria-label="Loading changes" />}
          {failed && (
            <SectionState testId="changes-toggle" state="error" errorMessage="The full list of changes could not be loaded." onRetry={() => void loadAll()} />
          )}
        </>
      )}
      <Link to={`/insights/updates?bureauId=${encodeURIComponent(bureauId)}`} data-testid="changes-see-all">
        See all report changes
      </Link>
    </section>
  );
}
