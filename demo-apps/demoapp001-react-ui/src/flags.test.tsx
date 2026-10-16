import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ALL_FLAGS, KEY_STORAGE, readFlags } from './flags.tsx';
import { json, overviewFixture } from './test/fixtures.ts';
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
