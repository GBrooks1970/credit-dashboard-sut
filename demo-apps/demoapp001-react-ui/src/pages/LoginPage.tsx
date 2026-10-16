// version: 1 | created: 2026-10-13T10:45Z | project: credit-dashboard-sut | type: source | language: en-GB
// Login (UI specification 6.1). On success the token is kept in memory and the customer goes to their default bureau.
// On 401 the alert `login-error` is shown and takes focus.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { DemoBanner } from '../layout/Layout.tsx';
import { safeRedirect } from '../safeRedirect.ts';
import { useSession } from '../session.tsx';

export const NOT_RECOGNISED = 'The sign-in details were not recognised.';
export const UNAVAILABLE = 'Sign-in is not available right now. Try again in a moment.';

export function LoginPage() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) alertRef.current?.focus();
  }, [error]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(username, password);
    setSubmitting(false);
    if (result.ok) {
      // Back to the address that sent the visitor here, if it is a path on this site; otherwise the default report.
      const from = (location.state as { from?: unknown } | null)?.from;
      // The one guard for every return address (CDS-38 C-20): the same rule as the details form.
      navigate(safeRedirect(typeof from === 'string' ? from : null, `/credit-health/report/${result.user.defaultBureauId}`), { replace: true });
    } else {
      setError(result.reason === 'rejected' ? NOT_RECOGNISED : UNAVAILABLE);
    }
  }

  return (
    <>
      <DemoBanner />
      <main id="main" className="login">
        <h1>Sign in to ScoreHarbour</h1>
        <form onSubmit={submit} noValidate={false}>
          <label htmlFor="login-username">Username</label>
          <input id="login-username" data-testid="login-username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" data-testid="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" data-testid="login-submit" disabled={submitting}>
            Sign in
          </button>
          {error && (
            <div role="alert" tabIndex={-1} ref={alertRef} data-testid="login-error" className="login-error">
              {error}
            </div>
          )}
        </form>
        <p className="demo-values">
          Demo details: username <code>alex</code> or <code>sam</code>, password <code>demo-only</code>.
        </p>
      </main>
    </>
  );
}
