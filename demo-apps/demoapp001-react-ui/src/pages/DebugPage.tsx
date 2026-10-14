// version: 1 | created: 2026-10-14T09:40Z | project: credit-dashboard-sut | type: source | language: en-GB
// The debug panel (UI specification 6.8, DR-037): test builds only, at /debug. It lists every bug flag as a checkbox, and has a
// persona selector, a clock input and a reset. It calls the /__test endpoints with the control key from browser storage and
// never changes UI state directly: a flag you switch takes effect when the page is loaded again (flags are read once at start).
import { useEffect, useState } from 'react';
import { ALL_FLAGS, KEY_STORAGE, controlKey, readFlags } from '../flags.tsx';
import { API_BASE_URL } from '../api.ts';

const PERSONAS = ['excellent', 'struggling', 'thin-file', 'boundary', 'drilldown', 'error', 'slow'] as const;

async function control(path: string, method: string, body?: unknown): Promise<string> {
  const key = controlKey();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { ...(key ? { 'x-test-control-key': key } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return response.ok ? 'Done' : `Test control answered ${response.status}`;
}

export function DebugPage() {
  const [on, setOn] = useState<string[]>([]);
  const [username, setUsername] = useState('alex');
  const [persona, setPersona] = useState<string>('excellent');
  const [clock, setClock] = useState('');
  const [key, setKey] = useState(controlKey() ?? '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void readFlags().then(setOn);
  }, []);

  async function toggle(flag: string, checked: boolean) {
    const next = checked ? [...on, flag] : on.filter((f) => f !== flag);
    setMessage(await control('/__test/bugs', 'PUT', { flags: next }));
    setOn(next);
  }

  return (
    <section aria-labelledby="debug-heading" className="card">
      <h1 id="debug-heading">Debug panel</h1>
      <p className="muted">Test builds only. A flag takes effect when the page is loaded again.</p>
      <label>
        Control key
        <input
          type="password"
          data-testid="debug-key"
          value={key}
          autoComplete="off"
          onChange={(event) => {
            setKey(event.target.value);
            window.localStorage.setItem(KEY_STORAGE, event.target.value);
          }}
        />
      </label>
      <fieldset>
        <legend>Bug flags</legend>
        {ALL_FLAGS.map((flag) => (
          <label key={flag} className="option">
            <input type="checkbox" data-testid={`debug-flag-${flag}`} checked={on.includes(flag)} onChange={(event) => void toggle(flag, event.target.checked)} />
            {flag}
          </label>
        ))}
      </fieldset>
      <div className="actions">
        <label>
          User
          <input type="text" data-testid="debug-username" value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Persona
          <select data-testid="debug-persona" value={persona} onChange={(event) => setPersona(event.target.value)}>
            {PERSONAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <button type="button" data-testid="debug-bind" onClick={() => void control(`/__test/users/${encodeURIComponent(username)}/persona`, 'PUT', { persona }).then(setMessage)}>
          Bind persona
        </button>
      </div>
      <div className="actions">
        <label>
          Clock (RFC 3339)
          <input type="text" data-testid="debug-clock" value={clock} placeholder="2026-10-03T09:00:00Z" onChange={(event) => setClock(event.target.value)} />
        </label>
        <button type="button" data-testid="debug-set-clock" onClick={() => void control('/__test/clock', 'PUT', { now: clock }).then(setMessage)}>
          Set clock
        </button>
        <button
          type="button"
          data-testid="debug-reset"
          onClick={() =>
            void control('/__test/reset', 'POST').then((result) => {
              setMessage(result);
              setOn([]);
            })
          }
        >
          Reset
        </button>
      </div>
      <p role="status" data-testid="debug-status">
        {message}
      </p>
    </section>
  );
}
