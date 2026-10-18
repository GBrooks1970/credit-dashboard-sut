import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ALL_FLAGS, KEY_STORAGE, readFlags } from './flags.tsx';
import { change, json, overviewFixture } from './test/fixtures.ts';
import { fakeService, openSignedIn } from './test/helpers.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const overviewWith = (days: number) => ({ ...overviewFixture, bureau: { ...overviewFixture.bureau, nextUpdateInDays: days } });

describe('the bug flags in the UI (brief 13 D1, DR-064)', () => {
  it('lists the 30 flags of the contract once each', () => {
    expect(ALL_FLAGS).toHaveLength(30);
    expect(new Set(ALL_FLAGS).size).toBe(30);
  });

  // The component-test catcher for the `plural` flag (bug-flags.json): the proof runner gives the fake service the flag with
  // CDS_FLAGS=plural, and this test must then fail.
  it('says "1 day" for one day to the next update', async () => {
    fakeService({ 'GET /reports/bureau-a/overview': () => json(200, overviewWith(1)), 'GET /reports/bureau-a/score/history': () => json(200, []) });
    await openSignedIn('/credit-health/report/bureau-a');
    expect(await screen.findByTestId('next-update')).toHaveTextContent('Updates in 1 day');
    expect(screen.getByTestId('next-update')).not.toHaveTextContent('1 days');
  });

  it('with the plural flag on, one day reads "1 days"', async () => {
    fakeService({ 'GET /reports/bureau-a/overview': () => json(200, overviewWith(1)), 'GET /reports/bureau-a/score/history': () => json(200, []) }, { flags: ['plural'] });
    await openSignedIn('/credit-health/report/bureau-a');
    expect(await screen.findByTestId('next-update')).toHaveTextContent('Updates in 1 days');
  });

  it('reads the flags once, with the control key from browser storage', async () => {
    window.localStorage.setItem(KEY_STORAGE, 'synthetic-key');
    const { fetchMock } = fakeService({}, { flags: ['plural', 'idor'] });
    expect(await readFlags()).toEqual(['plural', 'idor']);
    const [, init] = fetchMock.mock.calls[0]! as [unknown, RequestInit];
    expect(new Headers(init.headers).get('x-test-control-key')).toBe('synthetic-key');
  });

  it('no flags when test control answers with an error, or the call fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
    expect(await readFlags()).toEqual([]);
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('network'))));
    expect(await readFlags()).toEqual([]);
  });
});

describe('the debug panel (UI specification 6.8)', () => {
  it('lists every flag, and switching one sends the new list to test control', async () => {
    const bodies: unknown[] = [];
    fakeService({
      'PUT /__test/bugs': async (request) => {
        bodies.push(await request.json());
        return new Response(null, { status: 204 });
      },
    });
    await openSignedIn('/debug');
    const boxes = await screen.findAllByTestId(/^debug-flag-/);
    expect(boxes).toHaveLength(30);
    await userEvent.click(screen.getByTestId('debug-flag-plural'));
    await waitFor(() => expect(bodies).toEqual([{ flags: ['plural'] }]));
    expect(screen.getByTestId('debug-status')).toHaveTextContent('Done');
  });

  it('resets, binds a persona and sets the clock', async () => {
    const seen: string[] = [];
    fakeService({
      'POST /__test/reset': () => {
        seen.push('reset');
        return new Response(null, { status: 204 });
      },
      'PUT /__test/users/alex/persona': async (request) => {
        seen.push(`persona ${JSON.stringify(await request.json())}`);
        return new Response(null, { status: 204 });
      },
      'PUT /__test/clock': async (request) => {
        seen.push(`clock ${JSON.stringify(await request.json())}`);
        return new Response(null, { status: 204 });
      },
    });
    await openSignedIn('/debug');
    await userEvent.selectOptions(await screen.findByTestId('debug-persona'), 'drilldown');
    await userEvent.click(screen.getByTestId('debug-bind'));
    await userEvent.type(screen.getByTestId('debug-clock'), '2026-10-03T09:00:00Z');
    await userEvent.click(screen.getByTestId('debug-set-clock'));
    await userEvent.click(screen.getByTestId('debug-reset'));
    await waitFor(() => expect(seen).toEqual(['persona {"persona":"drilldown"}', 'clock {"now":"2026-10-03T09:00:00Z"}', 'reset']));
  });
});

describe('the debug panel with storage blocked (CDS-38 C-30)', () => {
  it('typing the control key does not throw', async () => {
    fakeService({});
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    // An error thrown in an event handler is reported to the window by React; none must be.
    const uncaught: unknown[] = [];
    const listener = (event: ErrorEvent) => {
      event.preventDefault();
      uncaught.push(event.error);
    };
    window.addEventListener('error', listener);
    await openSignedIn('/debug');
    await userEvent.type(await screen.findByTestId('debug-key'), 'k');
    window.removeEventListener('error', listener);
    expect(screen.getByTestId('debug-key')).toHaveValue('k');
    expect(uncaught).toEqual([]);
    setItem.mockRestore();
  });
});

// The component-test catchers for three behaviour flags (bug-flags.json, decision brief 13 D4, CDS-42): the proof runner gives the
// fake service the flag with CDS_FLAGS=<flag>, and the test of that flag must then fail with the text recorded in the registry.

describe('the changes toggle flips back (the catcher of toggle-label)', () => {
  const five = [1, 2, 3, 4, 5].map((n) => change(n));

  it('reads "Show fewer" while open and "Show all 5" again once closed', async () => {
    fakeService({
      'GET /reports/bureau-a/overview': () => json(200, { ...overviewFixture, recentChanges: five.slice(0, 3), changesTotal: 5 }),
      'GET /reports/bureau-a/score/history': () => json(200, []),
      'GET /reports/bureau-a/changes': () => json(200, { page: 1, pageSize: 100, total: 5, items: five }),
    });
    await openSignedIn('/credit-health/report/bureau-a');
    const toggle = await screen.findByTestId('changes-toggle');
    expect(toggle).toHaveTextContent('Show all 5');
    await userEvent.click(toggle);
    await waitFor(() => expect(screen.getByTestId('changes-toggle')).toHaveTextContent('Show fewer'));
    await userEvent.click(screen.getByTestId('changes-toggle'));
    expect(screen.getByTestId('changes-toggle'), "the label did not flip back to 'Show all 5'").toHaveTextContent('Show all 5');
  });
});

describe('a long summary is cut at a word and can be expanded (the catcher of truncate-summary)', () => {
  const words = Array.from({ length: 60 }, (_, i) => `word${i}`);
  const long = words.join(' ');
  const overviewWithSummary = (text: string) => ({ ...overviewFixture, summary: { ...overviewFixture.summary, text } });
  const serve = (text: string) =>
    fakeService({ 'GET /reports/bureau-a/overview': () => json(200, overviewWithSummary(text)), 'GET /reports/bureau-a/score/history': () => json(200, []) });

  it('cuts at the last whole word before 280 characters, shows an ellipsis, and Read more shows it all', async () => {
    expect(long.length).toBeGreaterThan(280);
    serve(long);
    await openSignedIn('/credit-health/report/bureau-a');
    const text = await screen.findByTestId('summary-text');
    const shown = (text.textContent ?? '').replace(/…$/, '');
    expect(text.textContent).toMatch(/…$/);
    expect(long.startsWith(shown)).toBe(true);
    expect(long.charAt(shown.length), 'the summary was cut inside a word at the limit of 280').toBe(' '); // the cut falls on a word boundary, never inside a word
    expect(shown.length).toBeLessThanOrEqual(280);
    await userEvent.click(screen.getByTestId('summary-toggle'));
    expect(screen.getByTestId('summary-text')).toHaveTextContent(long);
    expect(screen.getByTestId('summary-toggle')).toHaveTextContent('Read less');
    await userEvent.click(screen.getByTestId('summary-toggle'));
    expect(screen.getByTestId('summary-text').textContent).toMatch(/…$/);
  });

  it('shows a short summary whole, with no button', async () => {
    serve('Your score is good and steady.');
    await openSignedIn('/credit-health/report/bureau-a');
    expect(await screen.findByTestId('summary-text')).toHaveTextContent('Your score is good and steady.');
    expect(screen.queryByTestId('summary-toggle')).not.toBeInTheDocument();
  });
});

describe('leaving with an unsaved preferred name asks first (the catcher of lost-edit)', () => {
  const profile = {
    legalName: 'Alex Example', dateOfBirth: '1985-03-12', memberSince: '2021-06-01', preferredName: 'Al',
    email: { address: 'alex.example@example.com', status: 'verified' }, mobile: { lastDigits: '123', status: 'verified' },
    address: { line1: '1 Example Street', postcode: 'ZZ1 1ZZ', previousCount: 1 }, employment: { status: 'employed-full-time' }, finances: { added: true },
  };
  const MESSAGE = 'You have a preferred name that is not saved. Leave without saving it?';

  async function typeAnUnsavedName() {
    fakeService({ 'GET /me/profile': () => json(200, profile) });
    await openSignedIn('/my-account/profile');
    const field = await screen.findByTestId('profile-preferred-input');
    await userEvent.clear(field);
    await userEvent.type(field, 'Ally');
  }

  it('asks, and staying keeps the page and the typed name', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await typeAnUnsavedName();
    await userEvent.click(screen.getByTestId('nav-primary-debt'));
    expect(confirm, "no question was asked about the unsaved 'Ally'").toHaveBeenCalledWith(MESSAGE);
    expect(screen.getByTestId('profile-legal-name')).toBeInTheDocument();
    expect(screen.getByTestId('profile-preferred-input')).toHaveValue('Ally');
    confirm.mockRestore();
  });

  it('asks, and leaving goes on', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await typeAnUnsavedName();
    await userEvent.click(screen.getByTestId('nav-primary-debt'));
    expect(confirm, "no question was asked about the unsaved 'Ally'").toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByTestId('profile-legal-name')).not.toBeInTheDocument());
    confirm.mockRestore();
  });

  it('does not ask when nothing is unsaved', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fakeService({ 'GET /me/profile': () => json(200, profile) });
    await openSignedIn('/my-account/profile');
    await screen.findByTestId('profile-preferred-input');
    await userEvent.click(screen.getByTestId('nav-primary-debt'));
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
});
