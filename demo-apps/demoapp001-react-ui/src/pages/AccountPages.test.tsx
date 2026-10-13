import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { safeRedirect } from '../safeRedirect.ts';
import { json, money } from '../test/fixtures.ts';
import { fakeService, openSignedIn } from '../test/helpers.tsx';

afterEach(() => vi.unstubAllGlobals());

const noDetails = { apr: null, interestRate: null, promoPeriodMonths: null, minPayment: null, paymentMethod: null };
const row = (id: string, provider: string, balance: number, limit: number | null, utilisation: number | null, extra: object = {}) => ({
  id,
  type: 'creditcard',
  provider,
  logoUrl: null,
  maskedNumber: '*1234',
  balance: money(balance),
  limit: limit === null ? null : money(limit),
  utilisation,
  includedInTotals: true,
  status: 'normal',
  ...extra,
});
const account = (extra: object = {}) => ({
  ...row('acc_cc', 'Lender X', 42360, 510000, 8),
  openedDate: '2019-04-15',
  closedDate: null,
  updateFrequency: 'monthly',
  lastUpdated: '2026-09-30',
  utilisationRaw: 8,
  details: { ...noDetails, apr: 24.9 },
  closed: false,
  ...extra,
});

describe('account-type list (UI specification 6.4, BR-04, BR-05, BR-06)', () => {
  const cards = [row('acc_a', 'Lender X', 42360, 510000, 8), row('acc_b', 'Harbour Bank', -4400, 100000, 0), row('acc_c', 'Northgate Finance', 115000, 100000, 115)];
  const cardTotals = { type: 'creditcard', balance: money(37960), limit: money(610000), utilisation: 6, includedCount: 3, excluded: [] };

  function service(totals: object = cardTotals, rows: object[] = cards) {
    return fakeService({
      'GET /reports/bureau-a/accounts': () => json(200, rows),
      'GET /reports/bureau-a/accounts/totals': () => json(200, totals),
    });
  }

  it('shows the summary in whole pounds, with a bar for the total utilisation', async () => {
    const { seen } = service();
    await openSignedIn('/credit-health/report/bureau-a/accounts/creditcard');
    expect(await screen.findByTestId('list-title')).toHaveTextContent('Credit cards');
    expect(await screen.findByTestId('list-total-balance')).toHaveTextContent('£380');
    expect(screen.getByTestId('list-total-limit')).toHaveTextContent('£6,100');
    expect(screen.getByTestId('list-donut')).toHaveAttribute('aria-valuenow', '6');
    expect(seen).toContain('GET /reports/bureau-a/accounts?type=creditcard&status=open');
    expect(seen).toContain('GET /reports/bureau-a/accounts/totals?type=creditcard');
  });

  it('shows each row with its balance in pence, a card in credit as in credit, and an over-limit card as over its limit', async () => {
    service();
    await openSignedIn('/credit-health/report/bureau-a/accounts/creditcard');
    expect(await screen.findByTestId('row-balance-acc_b')).toHaveTextContent('£44.00 in credit');
    expect(screen.getByTestId('row-util-acc_b')).toHaveTextContent(/^0%$/);
    expect(screen.getByTestId('row-util-acc_c')).toHaveTextContent(/^115%$/);
    expect(screen.getByTestId('row-over-acc_c')).toBeInTheDocument();
    expect(screen.queryByTestId('row-over-acc_a')).not.toBeInTheDocument();
    expect(screen.getByTestId('account-row-acc_a')).toHaveAttribute('href', '/credit-health/report/bureau-a/account/acc_a');
  });

  it('explains the accounts left out of the totals, and does not list them as rows', async () => {
    const loans = [row('acc_l1', 'Lender Y', 1252400, 1500000, 83, { type: 'loan' }), row('acc_l2', 'Harbour Bank', 116100, null, null, { type: 'loan', includedInTotals: false })];
    service(
      { type: 'loan', balance: money(1252400), limit: money(1500000), utilisation: 83, includedCount: 1, excluded: [{ id: 'acc_l2', provider: 'Harbour Bank', maskedNumber: '*6902', balance: money(116100) }] },
      loans,
    );
    await openSignedIn('/credit-health/report/bureau-a/accounts/loan');
    const excluded = await screen.findByTestId('list-excluded');
    expect(excluded).toHaveTextContent('Harbour Bank');
    expect(excluded).toHaveTextContent('*6902');
    expect(screen.getByTestId('list-total-balance')).toHaveTextContent('£12,524');
    expect(screen.queryByTestId('account-row-acc_l2')).not.toBeInTheDocument();
    expect(screen.getByTestId('account-row-acc_l1')).toBeInTheDocument();
  });

  it('shows no excluded group when nothing is excluded', async () => {
    service();
    await openSignedIn('/credit-health/report/bureau-a/accounts/creditcard');
    await screen.findByTestId('list-summary');
    expect(screen.queryByTestId('list-excluded')).not.toBeInTheDocument();
  });

  it('a mortgage shows the remaining balance only: no limit, no bar, no utilisation on the row', async () => {
    service({ type: 'mortgage', balance: money(18500000), limit: money(22000000), utilisation: 84, includedCount: 1, excluded: [] }, [row('acc_m', 'Lender Z', 18500000, 22000000, 84, { type: 'mortgage' })]);
    await openSignedIn('/credit-health/report/bureau-a/accounts/mortgage');
    expect(await screen.findByTestId('list-total-balance')).toHaveTextContent('£185,000');
    expect(screen.getByText(/Total remaining/)).toBeInTheDocument();
    expect(screen.queryByTestId('list-total-limit')).not.toBeInTheDocument();
    expect(screen.queryByTestId('list-donut')).not.toBeInTheDocument();
    expect(screen.queryByTestId('row-util-acc_m')).not.toBeInTheDocument();
  });

  it('no bar is shown when the type has no limit', async () => {
    service({ type: 'telecomsandutilities', balance: money(3200), limit: null, utilisation: null, includedCount: 1, excluded: [] }, [row('acc_t', 'Brightline Mobile', 3200, null, null, { type: 'telecomsandutilities' })]);
    await openSignedIn('/credit-health/report/bureau-a/accounts/telecomsandutilities');
    expect(await screen.findByTestId('account-row-acc_t')).toBeInTheDocument();
    expect(screen.queryByTestId('list-donut')).not.toBeInTheDocument();
  });

  it('has the four states: empty, and error with a retry', async () => {
    service(cardTotals, []);
    await openSignedIn('/credit-health/report/bureau-a/accounts/creditcard');
    expect(await screen.findByTestId('account-list-empty')).toHaveTextContent('You have no open credit cards.');
  });

  it('an error offers a retry that loads again', async () => {
    let fail = true;
    fakeService({
      'GET /reports/bureau-a/accounts': () => (fail ? json(500, { title: 'x' }) : json(200, cards)),
      'GET /reports/bureau-a/accounts/totals': () => json(200, cardTotals),
    });
    await openSignedIn('/credit-health/report/bureau-a/accounts/creditcard');
    const retry = await screen.findByTestId('account-list-retry');
    fail = false;
    await userEvent.click(retry);
    expect(await screen.findByTestId('account-row-acc_a')).toBeInTheDocument();
  });

  it('a type we do not know is told so', async () => {
    service();
    await openSignedIn('/credit-health/report/bureau-a/accounts/horses');
    expect(await screen.findByTestId('list-unknown-type')).toBeInTheDocument();
  });
});

describe('closed accounts (UI specification 6.7, BR-13)', () => {
  const closed = [
    row('acc_x1', 'Harbour Bank', 0, null, null, { status: 'closed' }),
    row('acc_x2', 'Lender Y', 0, null, null, { type: 'loan', status: 'closed' }),
  ];

  it('groups the closed accounts by type with a balance of zero', async () => {
    const { seen } = fakeService({ 'GET /reports/bureau-a/accounts': () => json(200, closed) });
    await openSignedIn('/credit-health/report/bureau-a/closed-accounts');
    const cardGroup = await screen.findByTestId('closed-group-creditcard');
    expect(within(cardGroup).getAllByTestId(/^account-row-/)).toHaveLength(1);
    expect(within(cardGroup).getByTestId('row-balance-acc_x1')).toHaveTextContent('£0.00');
    expect(screen.getByTestId('closed-group-loan')).toBeInTheDocument();
    expect(screen.queryByTestId('closed-group-mortgage')).not.toBeInTheDocument();
    expect(seen).toContain('GET /reports/bureau-a/accounts?status=closed');
  });

  it('says so when there are none', async () => {
    fakeService({ 'GET /reports/bureau-a/accounts': () => json(200, []) });
    await openSignedIn('/credit-health/report/bureau-a/closed-accounts');
    expect(await screen.findByTestId('closed-list-empty')).toHaveTextContent('You have no closed accounts.');
  });
});

describe('account detail (UI specification 6.5)', () => {
  const history = { years: [{ year: 2026, status: 'on-time' }], selectedYear: 2026, missed: [] };
  const balances = [{ month: '2026-09', balance: money(44000), limit: money(510000) }, { month: '2026-10', balance: money(42360), limit: money(510000) }];

  function service(detail: object) {
    return fakeService({
      'GET /accounts/acc_cc': () => json(200, detail),
      'GET /accounts/acc_cc/balance-history': () => json(200, balances),
      'GET /accounts/acc_cc/payment-history': () => json(200, history),
    });
  }

  it('a credit card shows every section, with tiles that say what is not recorded', async () => {
    service(account());
    await openSignedIn('/credit-health/report/bureau-a/account/acc_cc');
    expect(await screen.findByTestId('detail-header')).toHaveTextContent('Lender X');
    expect(screen.getByTestId('detail-balance')).toHaveTextContent('£423.60');
    expect(screen.getByTestId('detail-updated')).toHaveTextContent('Updated 30 September 2026');
    expect(screen.getByTestId('detail-promo')).toBeInTheDocument();
    expect(screen.getByTestId('detail-tile-apr')).toHaveTextContent('24.9%');
    expect(screen.getByTestId('detail-tile-interest-rate')).toHaveTextContent('Not recorded');
    expect(screen.getByTestId('detail-tile-promo-period-months')).toBeInTheDocument();
    expect(screen.getByTestId('detail-tile-min-payment')).toBeInTheDocument();
    expect(screen.getByTestId('detail-tile-payment-method')).toBeInTheDocument();
    expect(await screen.findByTestId('detail-balance-chart-table')).toHaveTextContent('October 2026');
    expect(screen.getByTestId('detail-payment-history')).toBeInTheDocument();
    expect(screen.getByTestId('detail-meta-status')).toHaveTextContent('normal');
    expect(screen.getByTestId('detail-meta-opened')).toHaveTextContent('15 April 2019');
    expect(screen.getByTestId('detail-help')).toBeInTheDocument();
  });

  it('the tiles are links, not buttons, and carry the page to return to', async () => {
    service(account());
    await openSignedIn('/credit-health/report/bureau-a/account/acc_cc');
    const tile = await screen.findByTestId('detail-tile-interest-rate');
    expect(tile.tagName).toBe('A');
    const href = tile.getAttribute('href')!;
    expect(href).toContain('/data-capture/interestRate?accountId=acc_cc&redirectUrl=');
    expect(decodeURIComponent(href.split('redirectUrl=')[1]!)).toBe('/credit-health/report/bureau-a/account/acc_cc');
  });

  it('a loan shows balance, payment history and information, and no interest rate or promotional period', async () => {
    service(account({ type: 'loan', limit: money(1500000) }));
    await openSignedIn('/credit-health/report/bureau-a/account/acc_cc');
    await screen.findByTestId('detail-balance');
    expect(screen.getByTestId('detail-payment-history')).toBeInTheDocument();
    expect(screen.getByTestId('detail-meta-status')).toBeInTheDocument();
    expect(await screen.findByTestId('detail-balance-chart-table')).toBeInTheDocument();
    expect(screen.queryByTestId('detail-tile-interest-rate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('detail-tile-promo-period-months')).not.toBeInTheDocument();
    expect(screen.queryByTestId('detail-promo')).not.toBeInTheDocument();
  });

  it('a mortgage has no chart and no tiles', async () => {
    service(account({ type: 'mortgage' }));
    await openSignedIn('/credit-health/report/bureau-a/account/acc_cc');
    await screen.findByTestId('detail-balance');
    expect(screen.queryByTestId('detail-balance-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('detail-tile-apr')).not.toBeInTheDocument();
  });

  it('a closed account has no payment history', async () => {
    service(account({ closed: true, status: 'closed', closedDate: '2023-01-31', limit: null, utilisation: null }));
    await openSignedIn('/credit-health/report/bureau-a/account/acc_cc');
    await screen.findByTestId('detail-balance');
    expect(screen.queryByTestId('detail-payment-history')).not.toBeInTheDocument();
    expect(screen.getByTestId('detail-meta-status')).toHaveTextContent('Closed');
  });

  it('an account that is not found shows the error state', async () => {
    fakeService({});
    await openSignedIn('/credit-health/report/bureau-a/account/acc_cc');
    expect(await screen.findByTestId('account-detail-error')).toBeInTheDocument();
  });
});

describe('safeRedirect (UI specification 6.6, the open-redirect guard)', () => {
  const fallback = '/credit-health/report/bureau-a/account/acc_cc';

  it.each([
    ['/credit-health/report/bureau-a/account/acc_cc?x=1', '/credit-health/report/bureau-a/account/acc_cc?x=1'],
    ['/insights/updates#top', '/insights/updates#top'],
  ])('follows a path on this site: %s', (target, expected) => {
    expect(safeRedirect(target, fallback)).toBe(expected);
  });

  it.each([
    ['https://evil.example/'],
    ['http://evil.example'],
    ['//evil.example'],
    ['/\\evil.example'],
    ['/\t/evil.example'],
    ['javascript:alert(1)'],
    ['evil.example'],
    [''],
    [null],
    [undefined],
  ])('falls back for %s', (target) => {
    expect(safeRedirect(target as string | null | undefined, fallback)).toBe(fallback);
  });
});

describe('detail edit form (UI specification 6.6, BR-14)', () => {
  const detail = '/credit-health/report/bureau-a/account/acc_cc';
  const form = (field: string, redirect = detail) => `/data-capture/${field}?accountId=acc_cc&redirectUrl=${encodeURIComponent(redirect)}`;

  function service(patch?: (body: unknown) => Response, current: object = account()) {
    const bodies: unknown[] = [];
    const handlers = fakeService({
      'GET /accounts/acc_cc': () => json(200, current),
      'GET /accounts/acc_cc/balance-history': () => json(200, []),
      'GET /accounts/acc_cc/payment-history': () => json(200, { years: [], selectedYear: 2026, missed: [] }),
      'PATCH /accounts/acc_cc/details': async (request) => {
        const body = await request.json();
        bodies.push(body);
        return patch ? patch(body) : json(200, { ...noDetails, interestRate: 29.9 });
      },
    });
    return { ...handlers, bodies };
  }

  it('records another value and returns to the page it came from', async () => {
    const { bodies } = service();
    await openSignedIn(form('interestRate'));
    expect(await screen.findByTestId('dc-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('dc-save')).toBeDisabled();
    await userEvent.click(screen.getByTestId('dc-option-other'));
    await userEvent.type(await screen.findByTestId('dc-input'), '29.9');
    await userEvent.click(screen.getByTestId('dc-save'));
    expect(await screen.findByTestId('detail-header')).toBeInTheDocument();
    expect(bodies).toEqual([{ field: 'interestRate', value: 29.9 }]);
  });

  it('records a preset', async () => {
    const { bodies } = service();
    await openSignedIn(form('interestRate'));
    await userEvent.click(await screen.findByTestId('dc-option-19.9'));
    await userEvent.click(screen.getByTestId('dc-save'));
    await screen.findByTestId('detail-header');
    expect(bodies).toEqual([{ field: 'interestRate', value: 19.9 }]);
  });

  it('refuses an impossible rate at once, with the rule, and sends nothing', async () => {
    const { bodies } = service();
    await openSignedIn(form('interestRate'));
    await userEvent.click(await screen.findByTestId('dc-option-other'));
    await userEvent.type(await screen.findByTestId('dc-input'), '120');
    await userEvent.click(screen.getByTestId('dc-save'));
    const error = await screen.findByTestId('dc-error');
    expect(error).toHaveTextContent('The rate must be between 0% and 100%, with up to two decimal places.');
    expect(screen.getByTestId('dc-input')).toHaveAccessibleDescription(/between 0% and 100%/);
    expect(bodies).toEqual([]);
  });

  it.each(['-1', '10.123', 'abc', '1e2', ''])('refuses %j', async (text) => {
    const { bodies } = service();
    await openSignedIn(form('interestRate'));
    await userEvent.click(await screen.findByTestId('dc-option-other'));
    if (text) await userEvent.type(await screen.findByTestId('dc-input'), text);
    else await userEvent.type(await screen.findByTestId('dc-input'), ' ');
    await userEvent.click(screen.getByTestId('dc-save'));
    expect(await screen.findByTestId('dc-error')).toBeInTheDocument();
    expect(bodies).toEqual([]);
  });

  it('shows the service message as it comes when the service refuses', async () => {
    service(() => json(422, { type: '/problems/rule-violation', title: 'Rule violation', status: 422, detail: 'The service says no.' }));
    await openSignedIn(form('interestRate'));
    await userEvent.click(await screen.findByTestId('dc-option-24.9'));
    await userEvent.click(screen.getByTestId('dc-save'));
    expect(await screen.findByTestId('dc-error')).toHaveTextContent('The service says no.');
  });

  it('whole months for a promotional period, 0 to 60', async () => {
    const { bodies } = service();
    await openSignedIn(form('promoPeriodMonths'));
    await userEvent.click(await screen.findByTestId('dc-option-other'));
    await userEvent.type(await screen.findByTestId('dc-input'), '61');
    await userEvent.click(screen.getByTestId('dc-save'));
    expect(await screen.findByTestId('dc-error')).toHaveTextContent('whole number of months');
    await userEvent.clear(screen.getByTestId('dc-input'));
    await userEvent.type(screen.getByTestId('dc-input'), '12');
    await userEvent.click(screen.getByTestId('dc-save'));
    await screen.findByTestId('detail-header');
    expect(bodies).toEqual([{ field: 'promoPeriodMonths', value: 12 }]);
  });

  it('a payment method has two choices and no other', async () => {
    const { bodies } = service();
    await openSignedIn(form('paymentMethod'));
    await userEvent.click(await screen.findByTestId('dc-option-direct-debit'));
    expect(screen.queryByTestId('dc-option-other')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('dc-save'));
    await screen.findByTestId('detail-header');
    expect(bodies).toEqual([{ field: 'paymentMethod', value: 'direct-debit' }]);
  });

  it('a minimum payment is sent as a percentage', async () => {
    const { bodies } = service();
    await openSignedIn(form('minPayment'));
    await userEvent.click(await screen.findByTestId('dc-option-5'));
    await userEvent.click(screen.getByTestId('dc-save'));
    await screen.findByTestId('detail-header');
    expect(bodies).toEqual([{ field: 'minPayment', value: { percent: 5 } }]);
  });

  it('pre-selects the current value', async () => {
    service(undefined, account({ details: { ...noDetails, interestRate: 19.9 } }));
    await openSignedIn(form('interestRate'));
    expect(await screen.findByTestId('dc-option-19.9')).toBeChecked();
    expect(screen.getByTestId('dc-save')).toBeDisabled();
  });

  it('holds a current value that is not a preset as another value', async () => {
    service(undefined, account({ details: { ...noDetails, interestRate: 27.5 } }));
    await openSignedIn(form('interestRate'));
    expect(await screen.findByTestId('dc-option-other')).toBeChecked();
    expect(screen.getByTestId('dc-input')).toHaveValue('27.5');
  });

  it('the help buttons open and close a disclosure', async () => {
    service();
    await openSignedIn(form('interestRate'));
    const where = await screen.findByTestId('dc-help-where');
    expect(where).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(where);
    expect(where).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(where);
    expect(where).toHaveAttribute('aria-expanded', 'false');
  });

  it('cancel returns without saving', async () => {
    const { bodies } = service();
    await openSignedIn(form('interestRate'));
    await userEvent.click(await screen.findByTestId('dc-option-other'));
    await userEvent.click(await screen.findByTestId('dc-cancel'));
    expect(await screen.findByTestId('detail-header')).toBeInTheDocument();
    expect(bodies).toEqual([]);
  });

  it('a return address on another site is not followed: cancel lands on the account', async () => {
    service();
    await openSignedIn(form('interestRate', 'https://evil.example/steal'));
    await userEvent.click(await screen.findByTestId('dc-cancel'));
    expect(await screen.findByTestId('detail-header')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('dc-prompt')).not.toBeInTheDocument());
  });

  it('a field we do not know can only be left', async () => {
    service();
    await openSignedIn(form('colour'));
    expect(await screen.findByTestId('dc-prompt')).toHaveTextContent('We cannot change that detail');
  });
});
