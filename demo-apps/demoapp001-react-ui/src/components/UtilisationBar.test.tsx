import { render, screen } from '@testing-library/react';
import { UtilisationBar, bandOf } from './UtilisationBar.tsx';

// UI specification section 7, DR-013; CDS-38 C-02 and C-05.
describe('the utilisation bar', () => {
  it.each([
    [0, 'low'],
    [29, 'low'],
    [30, 'mid'],
    [75, 'mid'],
    [76, 'high'],
    [100, 'high'],
    [115, 'high'],
  ] as const)('%i%% is in the %s band', (percent, band) => {
    expect(bandOf(percent)).toBe(band);
    render(<UtilisationBar testId="bar" label="Test" percent={percent} />);
    expect(screen.getByTestId('bar')).toHaveAttribute('data-band', band);
    expect(screen.getByTestId('bar').firstElementChild).toHaveClass(`band-${band}`);
  });

  it('reports the real value and raises the maximum above 100, with the fill full and the badge shown', () => {
    render(<UtilisationBar testId="bar" label="Test" percent={115} />);
    const bar = screen.getByRole('progressbar', { name: 'Test' });
    expect(bar).toHaveAttribute('aria-valuenow', '115');
    expect(bar).toHaveAttribute('aria-valuemax', '115');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar.firstElementChild).toHaveStyle({ width: '100%' });
    expect(screen.getByTestId('bar-over-limit')).toHaveTextContent('Over limit');
  });

  it('keeps the maximum at 100 and shows no badge at or below the limit', () => {
    render(<UtilisationBar testId="bar" label="Test" percent={100} />);
    expect(screen.getByTestId('bar')).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByTestId('bar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.queryByTestId('bar-over-limit')).not.toBeInTheDocument();
  });

  it('draws a partial fill in proportion', () => {
    render(<UtilisationBar testId="bar" label="Test" percent={42} />);
    expect(screen.getByTestId('bar').firstElementChild).toHaveStyle({ width: '42%' });
  });
});
