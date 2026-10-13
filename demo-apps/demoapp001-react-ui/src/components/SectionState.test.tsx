import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionState } from './SectionState.tsx';

describe('SectionState (UI specification 4.3)', () => {
  it('loading is a busy skeleton', () => {
    render(<SectionState testId="debt" state="loading" />);
    expect(screen.getByTestId('debt-loading')).toHaveAttribute('aria-busy', 'true');
  });

  it('empty is a specific message, never a blank area', () => {
    render(<SectionState testId="debt" state="empty" emptyMessage="You have no debt on this report." />);
    expect(screen.getByTestId('debt-empty')).toHaveTextContent('You have no debt on this report.');
  });

  it('error has a Retry button that calls back, and is an alert', async () => {
    const retry = vi.fn();
    render(<SectionState testId="debt" state="error" onRetry={retry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('debt-retry'));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('populated shows its children under the populated hook', () => {
    render(
      <SectionState testId="debt" state="populated">
        <p>£198,280</p>
      </SectionState>,
    );
    expect(screen.getByTestId('debt-populated')).toHaveTextContent('£198,280');
  });
});
