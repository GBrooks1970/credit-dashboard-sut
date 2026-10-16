import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { components } from '@credit-dashboard-sut/api-client';
import { SessionProvider, useSession } from '../session.tsx';
import { change, json, money, overviewFixture, problem } from '../test/fixtures.ts';
import { ReportOverviewPage } from './ReportOverviewPage.tsx';
import { useEffect } from 'react';

type Overview = components['schemas']['ReportOverview'];
type Handler = (request: Request, url: URL) => Response | Promise<Response>;

/** A fake service: handlers by "METHOD /path-suffix"; anything else is a 404. Every request is recorded. */
function fakeService(handlers: Record<string, Handler>) {
  const seen: string[] = [];
  const fetchMock = vi.fn(async (input: Request | string | URL) => {
    const request = input instanceof Request ? input : new Request(String(input));
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname.replace('/api/v1', '');
    seen.push(`${request.method} ${path}${url.search}`);
    if (path === '/auth/login') return json(200, { token: 'tok', expiresAt: '2026-10-13T12:00:00Z' });
    if (path === '/me') return json(200, { id: 'usr_01', displayName: 'Alex Example', greetingName: 'Alex', defaultBureauId: 'bureau-a' });
    const handler = handlers[`${request.method} ${path}`];
    return handler ? handler(request, url) : problem(404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { seen, fetchMock };
}

/** Signs the user in, then shows the overview page. */
function SignedIn() {
  const { signIn, signedIn } = useSession();
  useEffect(() => {
    void signIn('alex', 'demo-only');
  }, [signIn]);
  return signedIn ? (
    <Routes>
      <Route path="/credit-health/report/:bureauId" element={<ReportOverviewPage />} />
    </Routes>
  ) : null;
}

function renderOverview() {
  return render(
    <MemoryRouter initialEntries={['/credit-health/report/bureau-a']}>
      <SessionProvider>
        <SignedIn />
      </SessionProvider>
    </MemoryRouter>,
  );
}

const history = (scores: (number | null)[]) => scores.map((score, i) => ({ month: `2026-${String(i + 5).padStart(2, '0')}`, score }));

const baseHandlers = (overview: Overview = overviewFixture): Record<string, Handler> => ({
  'GET /reports/bureau-a/overview': () => json(200, overview),
  'GET /reports/bureau-a/score/history': (_r, url) => {
    const range = url.searchParams.get('range');
    return json(200, history(range === '3m' ? [700, 710, 720] : range === '1y' ? Array(12).fill(700) : [700, null, 710, 720, 715, 720]));
  },
});

afterEach(() => vi.unstubAllGlobals());

describe('the score, the comparison and the sections (UI specification 6.2)', () => {
  it('shows the score on its scale, the benchmarks and the days to the next update', async () => {
    fakeService(baseHandlers());
    renderOverview();
    expect(await screen.findByTestId('score-value')).toHaveTextContent('720');
    expect(screen.getByTestId('score-max')).toHaveTextContent('1000');
    expect(screen.getByTestId('score-gauge')).toHaveAttribute('aria-valuenow', '720');
    expect(screen.getByTestId('bench-national')).toHaveTextContent('600');
    expect(screen.getByTestId('bench-local')).toHaveTextContent('615');
    expect(screen.getByTestId('bureau-name')).toHaveTextContent('Bureau A');
    expect(screen.getByTestId('next-update')).toHaveTextContent('Updates in 3 days');
  });

  it.each([
    [0, 'Updates in 0 days'],
    [1, 'Updates in 1 day'],
  ])('the next update with %i days reads "%s" (BR-08)', async (days, wording) => {
    fakeService(baseHandlers({ ...overviewFixture, bureau: { ...overviewFixture.bureau, nextUpdateInDays: days } }));
    renderOverview();
    expect(await screen.findByTestId('next-update')).toHaveTextContent(wording);
  });

  it('shows the debt, the trend, the impact counts, the payments and the account cards', async () => {
    fakeService(baseHandlers());
    renderOverview();
    expect(await screen.findByTestId('debt-total')).toHaveTextContent('£198,280');
    expect(screen.getByTestId('debt-trend')).toHaveTextContent('Down');
    expect(screen.getByTestId('impact-action-needed')).toHaveTextContent('1 item needs action');
    expect(screen.getByTestId('impact-monitor')).toHaveTextContent('2 items to monitor');
    expect(screen.getByTestId('payments-new-missed')).toHaveTextContent('0 new missed payments');
    expect(screen.getByTestId('payments-on-report')).toHaveTextContent('2 missed payments on your report');
    expect(screen.getByTestId('account-balance-creditcard')).toHaveTextContent('£380');
    expect(screen.getByTestId('account-util-text-creditcard')).toHaveTextContent('6% used');
    expect(screen.getByTestId('account-util-bar-creditcard')).toHaveAttribute('aria-valuenow', '6');
  });

  it('a type with no limit has no utilisation text or bar', async () => {
    fakeService(baseHandlers());
    renderOverview();
    await screen.findByTestId('account-card-loan');
    expect(screen.queryByTestId('account-util-text-loan')).not.toBeInTheDocument();
    expect(screen.queryByTestId('account-util-bar-loan')).not.toBeInTheDocument();
  });

  it('over the limit says so (DR-013) and the bar stops at the full width', async () => {
    const over: Overview = { ...overviewFixture, accountTypes: [{ type: 'creditcard', balance: money(115000), limit: money(100000), utilisation: 115, includedCount: 1, excluded: [] }] };
    fakeService(baseHandlers(over));
    renderOverview();
    expect(await screen.findByTestId('account-util-text-creditcard')).toHaveTextContent('115% used · Over limit');
    expect(screen.getByTestId('account-util-bar-creditcard')).toHaveAttribute('aria-valuenow', '100');
  });

  it('one failed overview call is one error state with one Retry that loads the page', async () => {
    let calls = 0;
    fakeService({ ...baseHandlers(), 'GET /reports/bureau-a/overview': () => (++calls === 1 ? problem(500) : json(200, overviewFixture)) });
    renderOverview();
    await userEvent.click(await screen.findByTestId('report-overview-retry'));
    expect(await screen.findByTestId('score-value')).toHaveTextContent('720');
  });
});

describe('the summary feedback (BR-10)', () => {
  it('pressing like stores it and marks only like as pressed; pressing it again clears it', async () => {
    const bodies: unknown[] = [];
    fakeService({
      ...baseHandlers(),
      'PUT /reports/bureau-a/summary/feedback': async (request) => {
        const body = await request.json();
        bodies.push(body);
        return json(200, body);
      },
    });
    renderOverview();
    await userEvent.click(await screen.findByTestId('btn-like'));
    await waitFor(() => expect(screen.getByTestId('btn-like')).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByTestId('btn-dislike')).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByTestId('btn-like'));
    await waitFor(() => expect(screen.getByTestId('btn-like')).toHaveAttribute('aria-pressed', 'false'));
    expect(bodies).toEqual([{ value: 'like' }, { value: 'none' }]);
  });

  it('a stored like is shown as pressed on a new visit', async () => {
    fakeService(baseHandlers({ ...overviewFixture, summary: { ...overviewFixture.summary, feedback: 'like' } }));
    renderOverview();
    expect(await screen.findByTestId('btn-like')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('btn-dislike')).toHaveAttribute('aria-pressed', 'false');
  });

  it('a failed save says so and leaves the buttons as they were', async () => {
    fakeService({ ...baseHandlers(), 'PUT /reports/bureau-a/summary/feedback': () => problem(500) });
    renderOverview();
    await userEvent.click(await screen.findByTestId('btn-like'));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be saved');
    expect(screen.getByTestId('btn-like')).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('the score history (BR-02)', () => {
  it.each([
    ['range-3m', 3],
    ['range-6m', 6],
    ['range-1y', 12],
  ])('%s shows one row per month', async (button, rows) => {
    fakeService(baseHandlers());
    renderOverview();
    await screen.findByTestId('history-chart');
    await userEvent.click(screen.getByTestId(button));
    await waitFor(() => expect(within(screen.getByTestId('history-chart-table')).getAllByRole('row')).toHaveLength(rows + 1)); // plus the header
    expect(screen.getByTestId(button)).toHaveAttribute('aria-pressed', 'true');
  });

  it('a month with no score is a gap: a row that says so and no point, never carried forward', async () => {
    fakeService(baseHandlers());
    renderOverview();
    const missing = await screen.findByTestId('history-chart-row-2026-06');
    expect(missing).toHaveTextContent('No score');
    expect(screen.queryByTestId('history-point-2026-06')).not.toBeInTheDocument();
    expect(screen.getByTestId('history-point-2026-05')).toBeInTheDocument();
  });

  it('has its own error state while the rest of the page keeps working', async () => {
    fakeService({ ...baseHandlers(), 'GET /reports/bureau-a/score/history': () => problem(500) });
    renderOverview();
    expect(await screen.findByTestId('history-chart-error')).toBeInTheDocument();
    expect(screen.getByTestId('score-value')).toHaveTextContent('720');
  });
});

describe('the report changes and the toggle (BR-11, DR-047)', () => {
  const five = [1, 2, 3, 4, 5].map((n) => change(n));

  it('hides the toggle when the total is three or fewer', async () => {
    fakeService(baseHandlers());
    renderOverview();
    await screen.findByTestId('changes-heading');
    expect(screen.queryByTestId('changes-toggle')).not.toBeInTheDocument();
    expect(screen.getByTestId('changes-see-all')).toHaveAttribute('href', '/insights/updates?bureauId=bureau-a');
  });

  it('lists the three newest, then every change in place, then collapses back', async () => {
    const asked: string[] = [];
    fakeService({
      ...baseHandlers({ ...overviewFixture, recentChanges: five.slice(0, 3), changesTotal: 5 }),
      'GET /reports/bureau-a/changes': (_r, url) => {
        asked.push(url.search);
        return json(200, { page: 1, pageSize: 100, total: 5, items: five });
      },
    });
    renderOverview();
    await screen.findByTestId('changes-toggle');
    expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(3);
    await userEvent.click(screen.getByTestId('changes-toggle'));
    await waitFor(() => expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(5));
    expect(screen.getByTestId('changes-toggle')).toHaveAttribute('aria-expanded', 'true');
    expect(asked).toEqual(['?page=1&pageSize=100']);
    await userEvent.click(screen.getByTestId('changes-toggle'));
    expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(3);
    await userEvent.click(screen.getByTestId('changes-toggle'));
    expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(5);
    expect(asked).toHaveLength(1); // the list is kept: the toggle does not call again
  });

  it('follows the pages until it has every change', async () => {
    const many = Array.from({ length: 130 }, (_, i) => change(i + 1));
    const pages: string[] = [];
    fakeService({
      ...baseHandlers({ ...overviewFixture, recentChanges: many.slice(0, 3), changesTotal: 130 }),
      'GET /reports/bureau-a/changes': (_r, url) => {
        const page = Number(url.searchParams.get('page'));
        pages.push(String(page));
        return json(200, { page, pageSize: 100, total: 130, items: many.slice((page - 1) * 100, page * 100) });
      },
    });
    renderOverview();
    await userEvent.click(await screen.findByTestId('changes-toggle'));
    await waitFor(() => expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(130));
    expect(pages).toEqual(['1', '2']);
  });

  it('the toggle has its own error state with a Retry', async () => {
    let calls = 0;
    fakeService({
      ...baseHandlers({ ...overviewFixture, recentChanges: five.slice(0, 3), changesTotal: 5 }),
      'GET /reports/bureau-a/changes': () => (++calls === 1 ? problem(500) : json(200, { page: 1, pageSize: 100, total: 5, items: five })),
    });
    renderOverview();
    await userEvent.click(await screen.findByTestId('changes-toggle'));
    await userEvent.click(await screen.findByTestId('changes-toggle-retry'));
    await waitFor(() => expect(screen.getAllByTestId(/^change-card-/)).toHaveLength(5));
  });
});

describe('the chat drawer', () => {
  it('opens from the button, shows a canned reply with its disclaimer, closes on Escape and returns focus', async () => {
    fakeService({
      ...baseHandlers(),
      'POST /assistant/messages': () => json(200, { reply: 'Your score is 720 out of 1000.', disclaimer: 'Demo assistant with canned replies.' }),
    });
    renderOverview();
    const button = await screen.findByTestId('btn-chat');
    await userEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toHaveFocus();
    await userEvent.type(screen.getByTestId('chat-input'), 'How is my score?');
    await userEvent.click(screen.getByTestId('chat-send'));
    expect(await screen.findByTestId('chat-reply')).toHaveTextContent('720 out of 1000');
    expect(screen.getByTestId('chat-disclaimer')).toHaveTextContent('canned replies');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('keeps focus inside the dialog when tabbing past the last control', async () => {
    fakeService(baseHandlers());
    renderOverview();
    await userEvent.click(await screen.findByTestId('btn-chat'));
    screen.getByTestId('chat-close').focus();
    await userEvent.tab();
    expect(screen.getByTestId('chat-input')).toHaveFocus();
  });
});

describe('a history range chosen after a slow one wins (CDS-38 C-03)', () => {
  it('shows three months after 1 year (slow) then 3 months', async () => {
    fakeService({
      ...baseHandlers(),
      'GET /reports/bureau-a/score/history': (_r, url) => {
        const range = url.searchParams.get('range');
        const reply = json(200, history(range === '3m' ? [700, 710, 720] : range === '1y' ? Array(12).fill(700) : [700, null, 710, 720, 715, 720]));
        return range === '1y' ? new Promise<Response>((resolve) => setTimeout(() => resolve(reply), 400)) : reply;
      },
    });
    renderOverview();
    await screen.findByTestId('history-chart');
    await userEvent.click(screen.getByTestId('range-1y'));
    await userEvent.click(screen.getByTestId('range-3m'));
    await waitFor(() => expect(within(screen.getByTestId('history-chart-table')).getAllByRole('row')).toHaveLength(4));
    await new Promise((r) => setTimeout(r, 600));
    expect(within(screen.getByTestId('history-chart-table')).getAllByRole('row')).toHaveLength(4);
    expect(screen.getByTestId('range-3m')).toHaveAttribute('aria-pressed', 'true');
  });
});
