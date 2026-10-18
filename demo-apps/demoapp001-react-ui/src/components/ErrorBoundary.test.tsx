import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { fakeService, openSignedIn } from '../test/helpers.tsx';
import { json, overviewFixture } from '../test/fixtures.ts';

afterEach(() => vi.unstubAllGlobals());

describe('the error boundary (CDS-38 R2-C-05)', () => {
  it('shows a message, not an empty screen, when a child throws while rendering', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Bomb = (): never => {
      throw new Error('boom');
    };
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('page-error')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    logged.mockRestore();
  });

  it('shows its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>All well</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('All well')).toBeInTheDocument();
    expect(screen.queryByTestId('page-error')).not.toBeInTheDocument();
  });

  it('a month the contract allows but no calendar has (2026-13) leaves the overview on screen', async () => {
    fakeService({
      'GET /reports/bureau-a/overview': () => json(200, overviewFixture),
      'GET /reports/bureau-a/score/history': () => json(200, [{ month: '2026-12', score: 700 }, { month: '2026-13', score: 710 }]),
    });
    await openSignedIn('/credit-health/report/bureau-a');
    expect(await screen.findByTestId('score-value')).toBeInTheDocument();
    expect(await screen.findByTestId('history-chart-row-2026-13')).toHaveTextContent('2026-13');
    expect(screen.queryByTestId('page-error')).not.toBeInTheDocument();
  });
});
