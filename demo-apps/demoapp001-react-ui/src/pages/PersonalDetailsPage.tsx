// version: 1 | created: 2026-10-13T13:50Z | project: credit-dashboard-sut | type: source | language: en-GB
// Personal details (UI specification 6.7): what the bureau holds, read-only here. The bureau owns it, so there is no input,
// no edit control and no link to a data-capture form on this page. The editable profile is a different page.
import { useParams } from 'react-router';
import { SectionState } from '../components/SectionState.tsx';
import { useSession } from '../session.tsx';
import { useResource } from '../useResource.ts';

export function PersonalDetailsPage() {
  const { bureauId = '' } = useParams();
  const { client } = useSession();
  const { state, data, reload } = useResource(
    async () => (await client.GET('/reports/{bureauId}/personal-details', { params: { path: { bureauId } } })).data,
    [client, bureauId],
  );
  const current = data?.addresses.filter((a) => a.current) ?? [];
  const previous = data?.addresses.filter((a) => !a.current) ?? [];
  const line = (a: { line1: string; town?: string; postcode: string }) => [a.line1, a.town, a.postcode].filter(Boolean).join(', ');

  return (
    <section aria-labelledby="pd-heading" className="card">
      <h1 id="pd-heading">Personal details</h1>
      <p className="muted" id="corrections">
        These details come from the credit bureau, so you cannot change them here. To correct something, contact the bureau.
      </p>
      <SectionState testId="personal-details" state={state} onRetry={() => void reload()} errorMessage="Your personal details could not be loaded.">
        {data && (
          <dl>
            <dt>Name</dt>
            <dd data-testid="pd-name">{data.name}</dd>
            <dt>Current address</dt>
            {current.map((a) => (
              <dd key={line(a)} data-testid="pd-address-current">
                {line(a)}
              </dd>
            ))}
            <dt>Previous addresses</dt>
            {previous.map((a, index) => (
              <dd key={line(a)} data-testid={`pd-address-previous-${index + 1}`}>
                {line(a)}
              </dd>
            ))}
            <dt>Electoral roll</dt>
            <dd data-testid="pd-electoral-roll">{data.electoralRoll ? 'On the electoral roll' : 'Not on the electoral roll'}</dd>
          </dl>
        )}
      </SectionState>
    </section>
  );
}
