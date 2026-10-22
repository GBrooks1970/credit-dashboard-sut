// version: 1 | created: 2026-10-13T18:16Z | project: credit-dashboard-sut | type: source | language: en-GB
// The detail edit form (UI specification 6.6): one field of one account, recorded as a preset or as another value. The
// client check mirrors BR-14 so the customer is told at once; the service checks again and its message is shown as it comes.
// The return address is followed only if it stays on this site (the open-redirect guard).
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import type { components } from '@credit-dashboard-sut/api-client';
import { SectionState } from '../components/SectionState.tsx';
import { followAddress, safeRedirect } from '../safeRedirect.ts';
import { useSession } from '../session.tsx';
import { useResource } from '../useResource.ts';

type Details = components['schemas']['AccountDetails'];
type DetailUpdate = components['schemas']['DetailUpdate'];

interface Field {
  prompt: string;
  hint: string;
  kind: 'rate' | 'months' | 'percent' | 'method';
  presets: { value: string; label: string }[];
  current: (details: Details) => string | null;
  error: string;
}

const percentPresets = (values: number[]) => values.map((v) => ({ value: String(v), label: `${v}%` }));

const FIELDS: Record<string, Field> = {
  apr: {
    prompt: 'What is the APR on this account?',
    hint: 'You will find it in your latest statement or agreement.',
    kind: 'rate',
    presets: percentPresets([9.9, 19.9, 24.9, 34.9]),
    current: (d) => (d.apr == null ? null : String(d.apr)),
    error: 'The rate must be between 0% and 100%, with up to two decimal places.',
  },
  interestRate: {
    prompt: 'What interest rate do you pay on this account?',
    hint: 'You will find it in your latest statement or agreement.',
    kind: 'rate',
    presets: percentPresets([9.9, 19.9, 24.9, 34.9]),
    current: (d) => (d.interestRate == null ? null : String(d.interestRate)),
    error: 'The rate must be between 0% and 100%, with up to two decimal places.',
  },
  promoPeriodMonths: {
    prompt: 'How many months does the promotional period last?',
    hint: 'Count from the date the offer began.',
    kind: 'months',
    presets: [0, 6, 12, 24].map((v) => ({ value: String(v), label: `${v} months` })),
    current: (d) => (d.promoPeriodMonths == null ? null : String(d.promoPeriodMonths)),
    error: 'The period must be a whole number of months, from 0 to 60.',
  },
  minPayment: {
    prompt: 'What is the minimum payment, as a percentage of the balance?',
    hint: 'It is shown on your statement.',
    kind: 'percent',
    presets: percentPresets([1, 2, 3, 5]),
    current: (d) => (d.minPayment?.percent == null ? null : String(d.minPayment.percent)),
    error: 'The percentage must be between 0% and 100%, with up to two decimal places.',
  },
  paymentMethod: {
    prompt: 'How do you pay this account?',
    hint: 'Choose the way you usually pay.',
    kind: 'method',
    presets: [
      { value: 'direct-debit', label: 'Direct debit' },
      { value: 'manual', label: 'Manual payment' },
    ],
    current: (d) => d.paymentMethod ?? null,
    error: 'Choose a payment method.',
  },
};

/** The BR-14 check on the client: a number from 0 to 100 with up to two decimals, or whole months from 0 to 60. */
function parse(field: Field, text: string): number | string | null {
  if (field.kind === 'method') return text === 'direct-debit' || text === 'manual' ? text : null;
  if (!/^\d+(\.\d{1,2})?$/.test(text.trim())) return null;
  const value = Number(text);
  if (field.kind === 'months') return Number.isInteger(value) && value >= 0 && value <= 60 ? value : null;
  return value >= 0 && value <= 100 ? value : null;
}

export function DetailFormPage() {
  const { field: fieldName = '' } = useParams();
  const [params] = useSearchParams();
  const accountId = params.get('accountId') ?? '';
  const redirectUrl = params.get('redirectUrl');
  const { client, user } = useSession();
  const navigate = useNavigate();
  const field = FIELDS[fieldName];

  const fallback = `/credit-health/report/${user?.defaultBureauId ?? ''}/account/${accountId}`;
  const goBack = () => followAddress(navigate, safeRedirect(redirectUrl, fallback));

  const { state, data, reload } = useResource(async () => (accountId ? (await client.GET('/accounts/{accountId}', { params: { path: { accountId } } })).data : null), [client, accountId]);

  const [choice, setChoice] = useState<string | null>(null);
  const [other, setOther] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [help, setHelp] = useState<'where' | 'why' | null>(null);
  const [saving, setSaving] = useState(false);

  if (!field) {
    return (
      <section className="card">
        <h1 data-testid="dc-prompt">We cannot change that detail</h1>
        <button type="button" data-testid="dc-cancel" onClick={goBack}>
          Go back
        </button>
      </section>
    );
  }

  // The current value is pre-selected: a preset if it is one, otherwise "other" holding the value.
  const current = data ? field.current(data.details) : null;
  const initial = current === null ? null : field.presets.some((p) => p.value === current) ? current : field.kind === 'method' ? null : 'other';
  const selected = choice ?? initial;
  const otherText = choice === null && initial === 'other' ? (current ?? '') : other;
  const text = selected === 'other' ? otherText : selected;
  const changed = selected !== initial || (selected === 'other' && otherText !== (current ?? ''));

  async function save() {
    if (text === null || text === undefined) return;
    const value = parse(field!, text);
    if (value === null) {
      setError(field!.error);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body =
        field!.kind === 'percent' ? { field: fieldName, value: { percent: value } } : { field: fieldName, value };
      const { response, error: problem } = await client.PATCH('/accounts/{accountId}/details', {
        params: { path: { accountId } },
        body: body as unknown as DetailUpdate,
      });
      if (response.ok) {
        goBack();
        return;
      }
      // The service's own message is shown as it comes (a 422 explains which rule the value broke).
      const detail = (problem as { detail?: string; title?: string } | undefined) ?? {};
      setError(detail.detail ?? detail.title ?? 'The detail could not be saved.');
    } catch {
      setError('The detail could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="dc-prompt" className="card">
      <SectionState testId="detail-form" state={state} onRetry={() => void reload()} errorMessage="This account could not be loaded.">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h1 id="dc-prompt" data-testid="dc-prompt">
            {field.prompt}
          </h1>
          <p className="muted" data-testid="dc-hint">
            {field.hint}
          </p>
          <fieldset aria-describedby={error ? 'dc-error' : undefined}>
            <legend className="visually-hidden">{field.prompt}</legend>
            {field.presets.map((preset) => (
              <label key={preset.value} className="option">
                <input type="radio" name="dc-choice" data-testid={`dc-option-${preset.value}`} checked={selected === preset.value} onChange={() => setChoice(preset.value)} />
                {preset.label}
              </label>
            ))}
            {field.kind !== 'method' && (
              <>
                <label className="option">
                  <input type="radio" name="dc-choice" data-testid="dc-option-other" checked={selected === 'other'} onChange={() => setChoice('other')} />
                  Other
                </label>
                {selected === 'other' && (
                  <label>
                    <span className="visually-hidden">Other value</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      data-testid="dc-input"
                      value={otherText}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? 'dc-error' : undefined}
                      onChange={(event) => {
                        setChoice('other');
                        setOther(event.target.value);
                      }}
                    />
                  </label>
                )}
              </>
            )}
          </fieldset>
          {error && (
            <p id="dc-error" data-testid="dc-error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <button type="button" data-testid="dc-help-where" aria-expanded={help === 'where'} onClick={() => setHelp(help === 'where' ? null : 'where')}>
              Where do I find this?
            </button>
            <button type="button" data-testid="dc-help-why" aria-expanded={help === 'why'} onClick={() => setHelp(help === 'why' ? null : 'why')}>
              Why do you ask?
            </button>
          </div>
          {help === 'where' && <p>Look at your latest statement, or the agreement you signed with the lender.</p>}
          {help === 'why' && <p>The bureau does not hold this detail. Adding it makes this page more useful to you; it does not change your report.</p>}
          <div className="actions">
            <button type="submit" data-testid="dc-save" disabled={!changed || saving}>
              Save
            </button>
            <button type="button" data-testid="dc-cancel" onClick={goBack}>
              Cancel
            </button>
          </div>
        </form>
      </SectionState>
    </section>
  );
}
