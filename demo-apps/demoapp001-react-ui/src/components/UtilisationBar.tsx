// version: 1 | created: 2026-10-16T15:00Z | project: credit-dashboard-sut | type: source | language: en-GB
// The utilisation bar (UI specification section 7, DR-013), one component for the overview, the lists and the account page. It is a
// progressbar whose value is the real figure: above 100 the fill stays full, `aria-valuenow` is the real value, `aria-valuemax` is
// raised to match, and an 'Over limit' badge with the hook `{testId}-over-limit` follows. The colour band (below 30, 30 to 75,
// above 75) is on the fill and in `data-band`; it is never the only cue, because the figure is always written beside the bar.
import { TEST_BUILD, flagOn } from '../flags.tsx';

export type Band = 'low' | 'mid' | 'high';

export const bandOf = (percent: number): Band => (percent < 30 ? 'low' : percent <= 75 ? 'mid' : 'high');

export function UtilisationBar({ testId, label, percent, figures }: { testId: string; label: string; percent: number; figures?: { balanceMinor: number; limitMinor: number } }) {
  const band = bandOf(percent);
  // Bug flags, in a test build only (UI specification 8): `util-mismatch` draws and announces a value that is not the figure beside the
  // bar; `placeholder-aria` names every bar with a stand-in; `minor-units-label` names a bar with the counts of pence taken for a percentage.
  const value = TEST_BUILD && flagOn('util-mismatch') ? percent + 7 : percent;
  const name = TEST_BUILD && flagOn('placeholder-aria') ? 'Accessible label' : TEST_BUILD && flagOn('minor-units-label') && figures ? `${figures.balanceMinor}% of ${figures.limitMinor}` : label;
  return (
    <>
      <div data-testid={testId} role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={Math.max(100, value)} aria-valuenow={value} data-band={band} className="bar">
        <div className={`bar-fill band-${band}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      {percent > 100 && (
        <strong data-testid={`${testId}-over-limit`} className="over-limit">
          Over limit
        </strong>
      )}
    </>
  );
}
