import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { change, json, money, problem } from '../test/fixtures.ts';
import { fakeService, openSignedIn } from '../test/helpers.tsx';

afterEach(() => vi.unstubAllGlobals());

describe('payment history (UI specification 6.3, BR-12)', () => {
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year) => ({ year, status: year === 2024 ? 'missed' : year === 2023 ? 'no-data' : 'on-time' }));
  const history = (selectedYear: number, missed: { accountId: string; provider: string; month: string }[] = []) => ({ years, selectedYear, missed });

  function service() {
    return fakeService({
      'GET /reports/bureau-a/payment-history': (_r, url) => {
        const year = Number(url.searchParams.get('year') ?? 2026);
        return json(200, year === 2024 ? history(2024, [{ accountId: 'acc_stln01', provider: 'Lender Y', month: '2024-02' }, { accountId: 'acc_stln01', provider: 'Lender Y', month: '2024-03' }]) : history(year));
      },
    });
  }

  it('offers seven years and chooses the current one first', async () => {
    service();
    await openSignedIn('/credit-health/report/bureau-a/payment-history');
    await screen.findByTestId('ph-year-2026');
    const buttons = screen.getAllByRole('button').filter((b) => /^20\d\d$/.test(b.textContent ?? ''));
    expect(buttons.map((b) => b.textContent)).toEqual(['2020', '2021', '2022', '2023', '2024', '2025', '2026']);
    expect(screen.getByTestId('ph-year-2026')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('ph-year-2024')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('ph-legend').children).toHaveLength(3);
  });

  it('each year has one status with a text alternative', async () => {
    service();
    await openSignedIn('/credit-health/report/bureau-a/payment-history');
    expect(await screen.findByTestId('ph-year-status-2024')).toHaveAccessibleName('2024: Missed');
    expect(screen.getByTestId('ph-year-status-2023')).toHaveAccessibleName('2023: No data');
    expect(screen.getByTestId('ph-year-status-2026')).toHaveAccessibleName('2026: On time');
  });

  it('choosing a year lists its missed payments', async () => {
    const { seen } = service();
    await openSignedIn('/credit-health/report/bureau-a/payment-history');
    await userEvent.click(await screen.findByTestId('ph-year-2024'));
    expect(await screen.findByTestId('ph-missed-acc_stln01-2024-03')).toHaveTextContent('Lender Y · March 2024');
    expect(screen.getByTestId('ph-missed-acc_stln01-2024-02')).toBeInTheDocument();
    expect(screen.getByTestId('ph-year-2024')).toHaveAttribute('aria-pressed', 'true');
    expect(seen).toContain('GET /reports/bureau-a/payment-history?year=2024');
  });

  it('a year with no missed payments says so', async () => {
    service();
    await openSignedIn('/credit-health/report/bureau-a/payment-history');
    await userEvent.click(await screen.findByTestId('ph-year-2023'));
    await waitFor(() => expect(screen.getByTestId('ph-result')).toHaveTextContent('There were no missed payments in 2023.'));
  });

  it('an account page can use the same widget through the account endpoint', async () => {
    const { seen } = fakeService({ 'GET /accounts/acc_x/payment-history': () => json(200, history(2026)) });
    const { PaymentHistoryWidget } = await import('../components/PaymentHistoryWidget.tsx');
    const { render } = await import('@testing-library/react');
    const { SessionProvider } = await import('../session.tsx');
    const { MemoryRouter } = await import('react-router');
    render(
      <MemoryRouter>
        <SessionProvider>
          <PaymentHistoryWidget bureauId="bureau-a" accountId="acc_x" />
        </SessionProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(seen.some((s) => s.startsWith('GET /accounts/acc_x/payment-history'))).toBe(true));
  });
});

describe('report changes (UI specification 6.7, BR-11)', () => {
  const kinds = ['neutral', 'positive', 'neutral', 'positive', 'neutral'] as const;
  const five = kinds.map((sentiment, i) => ({ ...change(i + 1, `2026-09-${20 - i}`), sentiment }));

  it('narrows to one kind, reflects it in the address, and every card is of that kind', async () => {
    const { seen } = fakeService({
      'GET /reports/bureau-a/changes': (_r, url) => {
        const sentiment = url.searchParams.get('sentiment');
        const items = sentiment ? five.filter((c) => c.sentiment === sentiment) : five;
        return json(200, { page: 1, pageSize: 20, total: items.length, items });
      },
    });
    await openSignedIn('/insights/updates?bureauId=bureau-a');
    await screen.findByTestId('change-card-chg_1');
    expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(5);
    await userEvent.click(screen.getByTestId('changes-filter-positive'));
    await waitFor(() => expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(2));
    for (const card of screen.getAllByTestId(/^change-card-/)) expect(card).toHaveAttribute('data-sentiment', 'positive');
    expect(screen.getByTestId('changes-filter-positive')).toHaveAttribute('aria-pressed', 'true');
    expect(seen.some((s) => s.includes('sentiment=positive'))).toBe(true);
  });

  it('opening a narrowed address signs in, comes back to that address and shows the narrowed list', async () => {
    const { seen } = fakeService({
      'GET /reports/bureau-a/changes': (_r, url) => {
        const items = url.searchParams.get('sentiment') === 'positive' ? five.filter((c) => c.sentiment === 'positive') : five;
        return json(200, { page: 1, pageSize: 20, total: items.length, items });
      },
    });
    await openSignedIn('/insights/updates?bureauId=bureau-a&sentiment=positive');
    await waitFor(() => expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(2));
    expect(screen.getByTestId('changes-filter-positive')).toHaveAttribute('aria-pressed', 'true');
    expect(seen.some((s) => s === 'GET /reports/bureau-a/changes?page=1&pageSize=20&sentiment=positive')).toBe(true);
  });

  it('a short list is one page with no next page', async () => {
    fakeService({ 'GET /reports/bureau-a/changes': () => json(200, { page: 1, pageSize: 20, total: 5, items: five }) });
    await openSignedIn('/insights/updates?bureauId=bureau-a');
    await screen.findByTestId('pager-status');
    expect(screen.getByTestId('pager-status')).toHaveTextContent('Page 1 of 1');
    expect(screen.getByTestId('pager-next')).toBeDisabled();
    expect(screen.getByTestId('pager-prev')).toBeDisabled();
  });

  it('a long list is shown 20 at a time', async () => {
    const all = Array.from({ length: 25 }, (_, i) => change(i + 1));
    fakeService({
      'GET /reports/bureau-a/changes': (_r, url) => {
        const page = Number(url.searchParams.get('page') ?? 1);
        return json(200, { page, pageSize: 20, total: 25, items: all.slice((page - 1) * 20, page * 20) });
      },
    });
    await openSignedIn('/insights/updates?bureauId=bureau-a');
    await waitFor(() => expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(20));
    expect(screen.getByTestId('pager-status')).toHaveTextContent('Page 1 of 2');
    await userEvent.click(screen.getByTestId('pager-next'));
    await waitFor(() => expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(5));
    expect(screen.getByTestId('pager-next')).toBeDisabled();
  });

  it('a list that matches nothing says so', async () => {
    fakeService({ 'GET /reports/bureau-a/changes': () => json(200, { page: 1, pageSize: 20, total: 0, items: [] }) });
    await openSignedIn('/insights/updates?bureauId=bureau-a&sentiment=negative');
    expect(await screen.findByTestId('changes-list-empty')).toHaveTextContent('No changes match.');
  });
});

describe('searches (UI specification 6.7)', () => {
  const search = (id: string, kind: 'hard' | 'soft') => ({ id, kind, organisation: `Org ${id}`, purpose: 'Application', date: '2026-09-02' });

  it('lists the searches of one kind', async () => {
    const { seen } = fakeService({
      'GET /reports/bureau-a/searches': (_r, url) => json(200, { page: 1, pageSize: 20, total: 3, items: [search('s1', 'hard'), search('s2', 'hard'), search('s3', 'hard')] .filter(() => url.searchParams.get('kind') === 'hard') }),
    });
    await openSignedIn('/credit-health/report/bureau-a/searches/hard');
    await waitFor(() => expect(screen.getAllByTestId(/^search-row-/)).toHaveLength(3));
    expect(screen.getByTestId('search-row-s1')).toHaveAttribute('data-kind', 'hard');
    expect(screen.getByTestId('search-row-s1')).toHaveTextContent('2 September 2026');
    expect(seen.some((s) => s.includes('kind=hard'))).toBe(true);
  });

  it('keeps soft searches apart: the soft page asks for soft and shows no hard row', async () => {
    fakeService({
      'GET /reports/bureau-a/searches': (_r, url) => json(200, { page: 1, pageSize: 20, total: 1, items: url.searchParams.get('kind') === 'soft' ? [search('s9', 'soft')] : [search('s1', 'hard')] }),
    });
    await openSignedIn('/credit-health/report/bureau-a/searches/soft');
    await screen.findByTestId('search-row-s9');
    expect(document.querySelectorAll('[data-kind="hard"]')).toHaveLength(0);
  });

  it('an empty list is explained', async () => {
    fakeService({ 'GET /reports/bureau-a/searches': () => json(200, { page: 1, pageSize: 20, total: 0, items: [] }) });
    await openSignedIn('/credit-health/report/bureau-a/searches/hard');
    expect(await screen.findByTestId('search-list-empty')).toHaveTextContent('There are no hard searches on your report.');
  });

  it('an unknown kind is the not-built page', async () => {
    fakeService({});
    await openSignedIn('/credit-health/report/bureau-a/searches/odd');
    expect(await screen.findByTestId('page-not-built')).toBeInTheDocument();
  });
});

describe('personal details (UI specification 6.7)', () => {
  const details = {
    name: 'Alex Example',
    electoralRoll: true,
    addresses: [
      { line1: '7 Example Street', town: 'Exampleton', postcode: 'ZZ6 6ZZ', current: true },
      { line1: '3 Trial Avenue', town: 'Sampleford', postcode: 'ZZ7 7ZZ', current: false },
      { line1: '15 Mock Row', town: 'Sampleford', postcode: 'ZZ8 8ZZ', current: false },
    ],
  };

  it('shows the current and previous addresses and the electoral roll, numbered from 1', async () => {
    fakeService({ 'GET /reports/bureau-a/personal-details': () => json(200, details) });
    await openSignedIn('/credit-health/report/bureau-a/personal-details');
    expect(await screen.findByTestId('pd-name')).toHaveTextContent('Alex Example');
    expect(screen.getAllByTestId('pd-address-current')).toHaveLength(1);
    expect(screen.getByTestId('pd-address-previous-1')).toHaveTextContent('3 Trial Avenue');
    expect(screen.getByTestId('pd-address-previous-2')).toHaveTextContent('15 Mock Row');
    expect(screen.queryByTestId('pd-address-previous-3')).not.toBeInTheDocument();
    expect(screen.getByTestId('pd-electoral-roll')).toHaveTextContent('On the electoral roll');
  });

  it('cannot be edited here: no input, no edit control, no link to a form', async () => {
    fakeService({ 'GET /reports/bureau-a/personal-details': () => json(200, details) });
    await openSignedIn('/credit-health/report/bureau-a/personal-details');
    const page = await screen.findByTestId('personal-details-populated');
    const main = page.closest('main')!;
    expect(main.querySelectorAll('input, textarea, select, [contenteditable="true"], a[href*="data-capture"]')).toHaveLength(0);
    expect(within(main).queryAllByRole('button')).toHaveLength(0);
  });
});

describe('debt overview (UI specification 6.7, BR-07, DR-046)', () => {
  const debt = {
    total: money(19827960),
    trend: 'down',
    byType: [
      { type: 'creditcard', amount: money(42360) },
      { type: 'loan', amount: money(1252400) },
      { type: 'mortgage', amount: money(18500000) },
      { type: 'telecomsandutilities', amount: money(3200) },
      { type: 'lineofcredit', amount: money(30000) },
    ],
  };

  it('shows the total, the trend and one row per type that holds debt', async () => {
    fakeService({ 'GET /debt/overview': () => json(200, debt) });
    await openSignedIn('/credit-health/debt-overview');
    expect(await screen.findByTestId('debt-total')).toHaveTextContent('£198,280');
    expect(screen.getByTestId('debt-trend')).toHaveTextContent('Down');
    expect(screen.getByTestId('debt-type-creditcard')).toHaveTextContent('Credit cards: £424');
    // The amount has its own hook, so a step can compare it exactly and not as part of the row (CDS-38 B-04).
    expect(screen.getByTestId('debt-type-creditcard-amount').textContent).toBe('£424');
    expect(screen.getByTestId('debt-type-telecomsandutilities-amount').textContent).toBe('£32');
    expect(screen.getByTestId('debt-type-mortgage')).toHaveTextContent('Mortgages: £185,000');
    expect(screen.getByTestId('debt-type-telecomsandutilities')).toHaveTextContent('Utilities and telecoms: £32');
    expect(screen.getByTestId('debt-type-lineofcredit')).toHaveTextContent('Credit accounts: £300');
    expect(screen.queryByTestId('debt-type-currentaccount')).not.toBeInTheDocument();
  });

  it('an error is its own state with a Retry', async () => {
    let calls = 0;
    fakeService({ 'GET /debt/overview': () => (++calls === 1 ? problem(500) : json(200, debt)) });
    await openSignedIn('/credit-health/debt-overview');
    await userEvent.click(await screen.findByTestId('debt-overview-retry'));
    expect(await screen.findByTestId('debt-total')).toBeInTheDocument();
  });
});

describe('late answers do not replace the current page (CDS-38 C-03)', () => {
  const kinds = ['neutral', 'positive', 'neutral', 'positive', 'neutral'] as const;
  const five = kinds.map((sentiment, i) => ({ ...change(i + 1, `2026-09-${20 - i}`), sentiment }));
  const later = <T,>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

  it('Positive then Neutral, with the Positive answer slow: the page shows Neutral', async () => {
    fakeService({
      'GET /reports/bureau-a/changes': (_r, url) => {
        const sentiment = url.searchParams.get('sentiment');
        const items = sentiment ? five.filter((c) => c.sentiment === sentiment) : five;
        const reply = json(200, { page: 1, pageSize: 20, total: items.length, items });
        return sentiment === 'positive' ? later(400, reply) : reply;
      },
    });
    await openSignedIn('/insights/updates?bureauId=bureau-a');
    await screen.findByTestId('change-card-chg_1');
    await userEvent.click(screen.getByTestId('changes-filter-positive'));
    await userEvent.click(screen.getByTestId('changes-filter-neutral'));
    await waitFor(() => expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(3));
    await new Promise((r) => setTimeout(r, 600)); // long enough for the slow Positive answer to arrive
    expect(screen.getByTestId('changes-filter-neutral')).toHaveAttribute('aria-pressed', 'true');
    for (const card of screen.getAllByTestId(/^change-card-/)) expect(card).toHaveAttribute('data-sentiment', 'neutral');
  });

  it('a year chosen after a slow one wins', async () => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year) => ({ year, status: 'on-time' }));
    fakeService({
      'GET /reports/bureau-a/payment-history': (_r, url) => {
        const year = Number(url.searchParams.get('year') ?? 2026);
        const missed = year === 2024 ? [{ accountId: 'acc_stln01', provider: 'Lender Y', month: '2024-02' }] : [];
        const reply = json(200, { years, selectedYear: year, missed });
        return year === 2024 ? later(400, reply) : reply;
      },
    });
    await openSignedIn('/credit-health/report/bureau-a/payment-history');
    await userEvent.click(await screen.findByTestId('ph-year-2024'));
    await userEvent.click(screen.getByTestId('ph-year-2023'));
    await waitFor(() => expect(screen.getByTestId('ph-result')).toHaveTextContent('There were no missed payments in 2023.'));
    await new Promise((r) => setTimeout(r, 600));
    expect(screen.getByTestId('ph-result')).toHaveTextContent('There were no missed payments in 2023.');
    expect(screen.getByTestId('ph-year-2023')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('ph-missed-acc_stln01-2024-02')).not.toBeInTheDocument();
  });
});

describe('a report-changes page past the end (CDS-38 C-22)', () => {
  it('says so, keeps the pager and lets the customer go back', async () => {
    const all = Array.from({ length: 25 }, (_, i) => change(i + 1));
    fakeService({
      'GET /reports/bureau-a/changes': (_r, url) => {
        const page = Number(url.searchParams.get('page') ?? 1);
        return json(200, { page, pageSize: 20, total: 25, items: all.slice((page - 1) * 20, page * 20) });
      },
    });
    await openSignedIn('/insights/updates?bureauId=bureau-a&page=9');
    expect(await screen.findByTestId('changes-past-end')).toHaveTextContent('There are no changes on this page.');
    expect(screen.getByTestId('pager-status')).toHaveTextContent('Page 9 of 2');
    expect(screen.queryByText('No changes match.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('changes-last-page'));
    await screen.findByTestId('change-card-chg_21');
    expect(screen.getByTestId('pager-status')).toHaveTextContent('Page 2 of 2');
    expect(screen.queryByTestId('changes-past-end')).not.toBeInTheDocument();
  });

  it('a filter that matches nothing still says No changes match', async () => {
    fakeService({ 'GET /reports/bureau-a/changes': () => json(200, { page: 1, pageSize: 20, total: 0, items: [] }) });
    await openSignedIn('/insights/updates?bureauId=bureau-a&sentiment=negative');
    expect(await screen.findByText('No changes match.')).toBeInTheDocument();
    expect(screen.queryByTestId('changes-past-end')).not.toBeInTheDocument();
  });
});
