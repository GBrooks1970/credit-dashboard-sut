// version: 1 | created: 2026-10-13T20:30Z | project: credit-dashboard-sut | type: source | language: en-GB
// The email sub-page (My Profile UI feature spec 4.2). A different address is held as unverified and a link is sent (PR-04);
// the address already held is not a change (DR-027). Resend is offered only while the address is unverified, and the
// service decides when it is too soon (PR-09: 429 with Retry-After). The form is `noValidate`: the service checks the format
// and its message is shown at `email-error`, not the browser's own bubble.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { SectionState } from '../../components/SectionState.tsx';
import { problemText } from '../../problem.ts';
import { useSession } from '../../session.tsx';
import { useResource } from '../../useResource.ts';

const BADGE = { verified: 'Verified', unverified: 'Unverified' } as const;

export function EmailPage() {
  const { client } = useSession();
  const navigate = useNavigate();
  const { state, data, reload } = useResource(async () => (await client.GET('/me/profile')).data, [client]);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resend, setResend] = useState('');
  const [busy, setBusy] = useState(false);
  const email = data?.email;
  const value = draft ?? email?.address ?? '';
  const back = () => navigate('/my-account/profile');

  async function save() {
    setError(null);
    setBusy(true);
    try {
      const { data: saved, error: problem } = await client.PUT('/me/profile/email', { body: { address: value.trim() } });
      if (saved) back();
      else setError(problemText(problem, 'The email address could not be saved.'));
    } catch {
      setError('The email address could not be saved. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function resendLink() {
    setResend('');
    try {
      const { response, error: problem } = await client.POST('/me/profile/email/verification');
      if (response.status === 202) setResend('Link sent');
      else if (response.status === 429) setResend(`Try again in ${response.headers.get('Retry-After') ?? 'a few'} seconds`);
      else if (response.status === 422) setResend('This address is already verified');
      else setResend(problemText(problem, 'The link could not be sent.'));
    } catch {
      setResend('The link could not be sent. Try again.');
    }
  }

  return (
    <section aria-labelledby="email-heading" className="card">
      <h1 id="email-heading">Email</h1>
      <SectionState testId="email-page" state={state} onRetry={() => void reload()} errorMessage="Your email could not be loaded.">
        {email && (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <p data-testid="email-current">
              {email.address} · {BADGE[email.status]}
            </p>
            <label>
              Email address
              <input
                type="email"
                data-testid="email-input"
                value={value}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'email-error' : undefined}
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>
            {error && (
              <p id="email-error" data-testid="email-error" role="alert">
                {error}
              </p>
            )}
            <div className="actions">
              <button type="submit" data-testid="email-save" disabled={busy}>
                Save
              </button>
              <button type="button" data-testid="email-cancel" onClick={back}>
                Cancel
              </button>
              {email.status === 'unverified' && (
                <button type="button" data-testid="email-resend" onClick={() => void resendLink()}>
                  Send the link again
                </button>
              )}
            </div>
            <p role="status" data-testid="email-resend-status">
              {resend}
            </p>
          </form>
        )}
      </SectionState>
    </section>
  );
}
