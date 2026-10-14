import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from '../App.tsx';
import { SessionProvider } from '../session.tsx';
import { json, problem } from './fixtures.ts';

export type Handler = (request: Request, url: URL) => Response | Promise<Response>;

/** A fake service: handlers by "METHOD /path"; anything else is a 404. Sign-in and the profile are built in. Requests are recorded. */
/** Bug flags a test wants on: the environment variable CDS_FLAGS (comma separated) is how the proof runner turns one on (CDS-39). */
const flagsFromEnvironment = () => (process.env.CDS_FLAGS ?? '').split(',').map((f) => f.trim()).filter(Boolean);

export function fakeService(handlers: Record<string, Handler>, options: { flags?: string[] } = {}) {
  const seen: string[] = [];
  const flags = [...flagsFromEnvironment(), ...(options.flags ?? [])];
  const fetchMock = vi.fn(async (input: Request | string | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname.replace('/api/v1', '');
    seen.push(`${request.method} ${path}${url.search}`);
    if (path === '/__test/state') return json(200, { personas: {}, overridden: {}, flags, now: null, latency: {} });
    if (path === '/auth/login') return json(200, { token: 'tok', expiresAt: '2026-10-13T12:00:00Z' });
    if (path === '/me' && !handlers['GET /me']) return json(200, { id: 'usr_01', displayName: 'Alex Example', greetingName: 'Alex', defaultBureauId: 'bureau-a' });
    const handler = handlers[`${request.method} ${path}`];
    return handler ? handler(request, url) : problem(404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { seen, fetchMock };
}

/** Opens an address as an anonymous visitor, signs in, and lands back on that address (the redirect-back). */
export async function openSignedIn(address: string) {
  const view = render(
    <MemoryRouter initialEntries={[address]}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  await userEvent.type(await view.findByTestId('login-username'), 'alex');
  await userEvent.type(view.getByTestId('login-password'), 'demo-only');
  await userEvent.click(view.getByTestId('login-submit'));
  return view;
}
