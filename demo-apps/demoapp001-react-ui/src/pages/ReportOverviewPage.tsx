// version: 1 | created: 2026-10-13T10:45Z | project: credit-dashboard-sut | type: source | language: en-GB
// Report overview (UI specification 6.2). CDS-31 (U1) renders the bureau name from the overview call so sign-in has
// somewhere to land; the sections follow in CDS-32 (U2).
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { components } from '@credit-dashboard-sut/api-client';
import { SectionState, type SectionStateName } from '../components/SectionState.tsx';
import { useSession } from '../session.tsx';

type Overview = components['schemas']['ReportOverview'];

export function ReportOverviewPage() {
  const { bureauId = '' } = useParams();
  const { client } = useSession();
  const [state, setState] = useState<SectionStateName>('loading');
  const [overview, setOverview] = useState<Overview | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const { data } = await client.GET('/reports/{bureauId}/overview', { params: { path: { bureauId } } });
      if (data) {
        setOverview(data);
        setState('populated');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }, [client, bureauId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SectionState testId="report-overview" state={state} onRetry={() => void load()} errorMessage="The report could not be loaded.">
      <h1 data-testid="bureau-name">{overview?.bureau.name}</h1>
    </SectionState>
  );
}
