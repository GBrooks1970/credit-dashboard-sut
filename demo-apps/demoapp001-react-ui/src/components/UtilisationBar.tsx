// version: 1 | created: 2026-10-16T15:00Z | project: credit-dashboard-sut | type: source | language: en-GB
// The utilisation bar (UI specification section 7, DR-013), one component for the overview, the lists and the account page. It is a
// progressbar whose value is the real figure: above 100 the fill stays full, `aria-valuenow` is the real value, `aria-valuemax` is
// raised to match, and an 'Over limit' badge with the hook `{testId}-over-limit` follows. The colour band (below 30, 30 to 75,
// above 75) is on the fill and in `data-band`; it is never the only cue, because the figure is always written beside the bar.
export type Band = 'low' | 'mid' | 'high';

export const bandOf = (percent: number): Band => (percent < 30 ? 'low' : percent <= 75 ? 'mid' : 'high');

export function UtilisationBar({ testId, label, percent }: { testId: string; label: string; percent: number }) {
  const band = bandOf(percent);
  return (
    <>
      <div data-testid={testId} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={Math.max(100, percent)} aria-valuenow={percent} data-band={band} className="bar">
        <div className={`bar-fill band-${band}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      {percent > 100 && (
        <strong data-testid={`${testId}-over-limit`} className="over-limit">
          Over limit
        </strong>
      )}
    </>
  );
}
