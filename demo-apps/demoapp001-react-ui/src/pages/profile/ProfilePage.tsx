// version: 1 | created: 2026-10-13T20:30Z | project: credit-dashboard-sut | type: source | language: en-GB
// My profile (My Profile UI feature spec, sections 2 to 3). The customer's own record: legal name and date of birth are
// read-only (PR-01), the preferred name is edited here (PR-02, PR-03), and five tiles lead to the sub-pages. A tile shows a
// summary and never a figure (PR-07). Nothing on this page puts the customer's details in the page title or the address (PR-08).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { components } from '@credit-dashboard-sut/api-client';
import { SectionState } from '../../components/SectionState.tsx';
import { formatDate } from '../../format.ts';
import { problemText } from '../../problem.ts';
import { useSession } from '../../session.tsx';
import { useResource } from '../../useResource.ts';

type Profile = components['schemas']['Profile'];

/** PR-02: 1 to 30 letters, spaces, hyphens and apostrophes, after trimming. Empty clears the name. */
const PREFERRED_NAME = /^[\p{L} '-]{1,30}$/u;
const PREFERRED_NAME_RULE = 'A preferred name is 1 to 30 letters, spaces, hyphens or apostrophes.';

const BADGE = { verified: 'Verified', unverified: 'Unverified' } as const;
const sentence = (slug: string) => {
  const text = slug.replace(/-/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export function ProfilePage() {
  const { client } = useSession();
  const { state, data, reload } = useResource(async () => (await client.GET('/me/profile')).data, [client]);
  return (
    <div>
      <SectionState testId="profile" state={state} onRetry={() => void reload()} errorMessage="Your profile could not be loaded.">
        {data && <ProfileBody profile={data} />}
      </SectionState>
    </div>
  );
}

function ProfileBody({ profile }: { profile: Profile }) {
  return (
    <>
      <Identity profile={profile} />
      <PreferredName stored={profile.preferredName ?? ''} />
      <Tiles profile={profile} />
    </>
  );
}

function Identity({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // A non-modal dialog: Escape and a click outside close it, and focus returns to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      button.current?.focus();
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close();
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <section data-testid="profile-identity" aria-labelledby="profile-legal-name" className="card">
      <img data-testid="profile-header-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" width="1" height="1" />
      <h1 id="profile-legal-name" data-testid="profile-legal-name">
        {profile.legalName}
      </h1>
      <button ref={button} type="button" data-testid="profile-name-info" aria-expanded={open} aria-controls="profile-name-info-panel" onClick={() => setOpen(!open)}>
        Why can I not change my name?
      </button>
      {open && (
        <div ref={panel} id="profile-name-info-panel" data-testid="profile-name-info-panel" role="dialog" aria-label="About your legal name" className="card">
          <p>Your legal name matches the credit report, so it cannot be changed here. To correct it, use the corrections route on your report.</p>
        </div>
      )}
      <dl>
        <dt>Date of birth</dt>
        <dd data-testid="profile-dob">{formatDate(profile.dateOfBirth)}</dd>
        <dt>Member since</dt>
        <dd data-testid="profile-member-since">{formatDate(profile.memberSince)}</dd>
      </dl>
    </section>
  );
}

function PreferredName({ stored: initial }: { stored: string }) {
  const { client, refreshUser } = useSession();
  const [stored, setStored] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const changed = draft !== stored;

  async function save() {
    const value = draft.trim();
    setStatus('');
    if (value !== '' && !PREFERRED_NAME.test(value)) {
      setError(PREFERRED_NAME_RULE);
      setStatus(PREFERRED_NAME_RULE);
      return;
    }
    setError(null);
    setSaving(true);
    let saved = false;
    try {
      const { data, error: problem } = await client.PATCH('/me/profile/preferred-name', { body: { preferredName: value === '' ? null : value } });
      if (data) {
        const next = data.preferredName ?? '';
        setStored(next);
        setDraft(next);
        setStatus('Saved');
        saved = true;
      } else {
        const text = problemText(problem, 'The preferred name could not be saved.');
        setError(text);
        setStatus(text);
      }
    } catch {
      setError('The preferred name could not be saved. Try again.');
      setStatus('The preferred name could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
    // The greeting is refreshed outside the save: a failure here must not say the name could not be saved (CDS-38 R2-C-18).
    if (saved) await refreshUser().catch(() => undefined);
  }

  return (
    <section aria-labelledby="profile-preferred-heading" className="card">
      <h2 id="profile-preferred-heading" data-testid="profile-preferred-heading">
        Preferred name
      </h2>
      <p className="muted" id="profile-preferred-hint" data-testid="profile-preferred-hint">
        We use your preferred name in this app only. It never appears on your credit report.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (changed) void save();
        }}
      >
        <label>
          <span className="visually-hidden">Preferred name</span>
          <input
            type="text"
            data-testid="profile-preferred-input"
            placeholder="Enter your preferred name"
            value={draft}
            aria-describedby={error ? 'profile-preferred-hint profile-preferred-error' : 'profile-preferred-hint'}
            aria-invalid={error ? true : undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              setStatus('');
              setError(null);
            }}
          />
        </label>
        {changed && (
          <div className="actions">
            <button type="submit" data-testid="profile-preferred-save" disabled={saving}>
              Save
            </button>
            <button
              type="button"
              data-testid="profile-preferred-cancel"
              onClick={() => {
                setDraft(stored);
                setError(null);
                setStatus('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <p role="status" aria-live="polite" data-testid="profile-preferred-status">
          {status}
        </p>
        {error && (
          <p id="profile-preferred-error" data-testid="profile-preferred-error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

function Tiles({ profile }: { profile: Profile }) {
  const mobile = profile.mobile;
  return (
    <section aria-label="Your details" className="tiles">
      <Link to="/my-account/profile/email" data-testid="profile-tile-email">
        <strong>Email</strong>
        <span>{profile.email.address}</span>
        <span data-testid="profile-email-badge" className="badge">
          {BADGE[profile.email.status]}
        </span>
      </Link>
      <Link to="/my-account/profile/mobile" data-testid="profile-tile-mobile">
        <strong>Mobile</strong>
        {mobile ? (
          <>
            <span>•••• ••• {mobile.lastDigits}</span>
            <span data-testid="profile-mobile-badge" className="badge">
              {BADGE[mobile.status]}
            </span>
          </>
        ) : (
          <span>Not added</span>
        )}
      </Link>
      <Link to="/my-account/profile/address" data-testid="profile-tile-address">
        <strong>Address</strong>
        <span>{profile.address ? `${profile.address.line1}, ${profile.address.postcode}` : 'Not added'}</span>
      </Link>
      <Link to="/my-account/profile/employment" data-testid="profile-tile-employment">
        <strong>Employment</strong>
        <span>{profile.employment ? sentence(profile.employment.status) : 'Not added'}</span>
      </Link>
      <Link to="/my-account/profile/finances" data-testid="profile-tile-finances">
        <strong>Finances</strong>
        <span>{profile.finances.added ? 'Added' : 'Not added'}</span>
      </Link>
    </section>
  );
}
