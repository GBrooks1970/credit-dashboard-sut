// version: 2 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// Report overview (UI specification 6.2). One GET /reports/{bureauId}/overview feeds every section except the history
// chart and the full changes list behind the toggle. If that call fails, the page shows one error state with one Retry.
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { components } from '@credit-dashboard-sut/api-client';
import { SectionState, type SectionStateName } from '../components/SectionState.tsx';
import { useSession } from '../session.tsx';
import { HistoryChart } from './overview/HistoryChart.tsx';
import { ReportChanges } from './overview/ReportChanges.tsx';
import { AccountsSection, DebtSection, ImpactSection, PaymentsSection, TilesSection } from './overview/ReportSections.tsx';
import { ScoreSection } from './overview/ScoreSection.tsx';
import { SummarySection } from './overview/SummarySection.tsx';

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
      {overview && (
        <>
          <ScoreSection overview={overview} />
          <SummarySection bureauId={bureauId} summary={overview.summary} />
          <HistoryChart bureauId={bureauId} max={overview.score.max} />
          <ReportChanges bureauId={bureauId} recent={overview.recentChanges} total={overview.changesTotal} />
          <ImpactSection impact={overview.impact} />
          <DebtSection debt={overview.debt} />
          <AccountsSection bureauId={bureauId} accountTypes={overview.accountTypes} />
          <PaymentsSection bureauId={bureauId} payments={overview.payments} />
          <TilesSection bureauId={bureauId} />
        </>
      )}
    </SectionState>
  );
}
