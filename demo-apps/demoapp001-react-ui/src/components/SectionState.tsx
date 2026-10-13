// version: 1 | created: 2026-10-13T10:45Z | project: credit-dashboard-sut | type: source | language: en-GB
// Every data-bound section implements four states (UI specification 4.3). The hook for the wrapper is
// `{testId}-{state}`; the error state has a Retry button `{testId}-retry`.
import type { ReactNode } from 'react';

export type SectionStateName = 'loading' | 'empty' | 'error' | 'populated';

interface Props {
  testId: string;
  state: SectionStateName;
  /** Shown when the state is empty: a specific message, never a blank area. */
  emptyMessage?: string;
  /** Shown when the state is error. */
  errorMessage?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

export function SectionState({ testId, state, emptyMessage, errorMessage, onRetry, children }: Props) {
  if (state === 'loading') {
    return <div data-testid={`${testId}-loading`} className="section-skeleton" aria-busy="true" aria-label="Loading" role="status" />;
  }
  if (state === 'empty') {
    return <p data-testid={`${testId}-empty`}>{emptyMessage ?? 'Nothing to show yet.'}</p>;
  }
  if (state === 'error') {
    return (
      <div data-testid={`${testId}-error`} role="alert">
        <p>{errorMessage ?? 'This section could not be loaded.'}</p>
        <button type="button" data-testid={`${testId}-retry`} onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  return <div data-testid={`${testId}-populated`}>{children}</div>;
}
