// version: 1 | created: 2026-10-13T20:30Z | project: credit-dashboard-sut | type: source | language: en-GB
// The mobile sub-page (My Profile UI feature spec 4.1). Saving a number holds it as unverified and issues a code (PR-10); the
// page stays open for the code and returns to the profile once the number is verified. The demo sends no message, so the
// page says the code is always 123456 (DR-025). A wrong code shows the attempts left (PR-11); the third voids the code and
// asks for the number to be added again.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { SectionState } from '../../components/SectionState.tsx';
import { problemText } from '../../problem.ts';
import { useSession } from '../../session.tsx';
import { useResource } from '../../useResource.ts';

const BADGE = { verified: 'Verified', unverified: 'Unverified' } as const;

export function MobilePage() {
  const { client } = useSession();
  const navigate = useNavigate();
  const { state, data, reload } = useResource(async () => (await client.GET('/me/profile')).data, [client]);
  const [number, setNumber] = useState('');
  const [numberError, setNumberError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const mobile = data?.mobile;
  const back = () => navigate('/my-account/profile');

  async function saveNumber() {
    setNumberError(null);
    setBusy(true);
    try {
      const { data: challenge, error: problem } = await client.PUT('/me/profile/mobile', { body: { number } });
      if (challenge) {
        setPending(true);
        setAttempts(null); // attempts left are shown from the first wrong code, not before (CDS-38 C-33, PR-11)
        setCode('');
        setCodeError(null);
      } else {
        setNumberError(problemText(problem, 'The mobile number could not be saved.'));
      }
    } catch {
      setNumberError('The mobile number could not be saved. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function submitCode() {
    setCodeError(null);
    setBusy(true);
    try {
      const { response, data: verified, error: problem } = await client.POST('/me/profile/mobile/verification', { body: { code } });
      if (verified) {
        back();
        return;
      }
      setCodeError(problemText(problem, 'The code could not be checked.'));
      const extra = problem as { type?: string; attemptsRemaining?: number } | undefined;
      if (response.status === 422 && extra?.type?.endsWith('/code-invalid')) {
        // The code is void: the number must be added again for a new one.
        setPending(false);
        setAttempts(null);
      } else if (typeof extra?.attemptsRemaining === 'number') {
        setAttempts(extra.attemptsRemaining);
      }
    } catch {
      setCodeError('The code could not be checked. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="mobile-heading" className="card">
      <h1 id="mobile-heading">Mobile</h1>
      <SectionState testId="mobile-page" state={state} onRetry={() => void reload()} errorMessage="Your mobile number could not be loaded.">
        <div>
          {mobile && (
            <p data-testid="mobile-current">
              •••• ••• {mobile.lastDigits} · {BADGE[mobile.status]}
            </p>
          )}
          {!pending && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveNumber();
              }}
            >
              <label>
                {mobile ? 'New mobile number' : 'Mobile number'}
                <input
                  type="tel"
                  data-testid="mobile-input"
                  value={number}
                  autoComplete="off"
                  aria-invalid={numberError ? true : undefined}
                  aria-describedby={numberError ? 'mobile-error' : undefined}
                  onChange={(event) => setNumber(event.target.value)}
                />
              </label>
              {numberError && (
                <p id="mobile-error" data-testid="mobile-error" role="alert">
                  {numberError}
                </p>
              )}
              {codeError && (
                <p data-testid="mobile-code-error" role="alert">
                  {codeError}
                </p>
              )}
              <div className="actions">
                <button type="submit" data-testid="mobile-save" disabled={busy}>
                  Save
                </button>
                <button type="button" data-testid="mobile-cancel" onClick={back}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          {pending && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitCode();
              }}
            >
              <label>
                Six-digit code
                <input
                  type="text"
                  inputMode="numeric"
                  data-testid="mobile-code-input"
                  value={code}
                  autoComplete="off"
                  aria-invalid={codeError ? true : undefined}
                  aria-describedby={codeError ? 'mobile-code-hint mobile-code-error' : 'mobile-code-hint'}
                  onChange={(event) => setCode(event.target.value)}
                />
              </label>
              <p className="muted" id="mobile-code-hint" data-testid="mobile-code-hint">
                This demo sends no message. The code is always 123456.
              </p>
              {attempts !== null && <p data-testid="mobile-attempts">{attempts === 1 ? '1 attempt left' : `${attempts} attempts left`}</p>}
              {codeError && (
                <p id="mobile-code-error" data-testid="mobile-code-error" role="alert">
                  {codeError}
                </p>
              )}
              <div className="actions">
                <button type="submit" data-testid="mobile-code-submit" disabled={busy}>
                  Check the code
                </button>
                <button type="button" data-testid="mobile-cancel" onClick={back}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </SectionState>
    </section>
  );
}
