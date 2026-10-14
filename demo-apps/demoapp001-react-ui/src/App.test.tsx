import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from './App.tsx';
import { NOT_RECOGNISED } from './pages/LoginPage.tsx';
import { SessionProvider } from './session.tsx';
import { overviewFixture } from './test/fixtures.ts';

// Responses taken from the contract's shapes (component fixtures; the Prism mock is not used here, brief 11 D1).
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': status >= 400 ? 'application/problem+json' : 'application/json' } });

function fakeService(password = 'demo-only') {
  return vi.fn(async (input: Request | string | URL) => {
    const request = input instanceof Request ? input : new Request(String(input));
    const { pathname } = new URL(request.url, 'http://localhost');
    if (pathname.endsWith('/auth/login')) {
      const body = await request.json();
      return body.password === password
        ? json(200, { token: 'tok_test', expiresAt: '2026-10-13T12:00:00Z' })
        : json(401, { type: '/problems/unauthenticated', title: 'Missing or invalid token', status: 401 });
    }
    if (pathname.endsWith('/me')) return json(200, { id: 'usr_01', displayName: 'Alex Example', greetingName: 'Alex', defaultBureauId: 'bureau-a' });
    if (pathname.endsWith('/overview')) return json(200, overviewFixture);
    if (pathname.endsWith('/score/history')) return json(200, [{ month: '2026-09', score: 700 }]);
    return json(404, { type: '/problems/not-found', title: 'Not found', status: 404 });
  });
}

/** In a test build the app waits for the flags before it renders (brief 13 D1), so the sign-in form is awaited. */
async function renderApp(path = '/login') {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
  await screen.findByTestId('login-username');
  return view;
}

describe('signing in (UI specification 6.1)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fakeService());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the demo banner and the form', async () => {
    await renderApp();
    expect(screen.getByTestId('demo-banner')).toHaveTextContent('Demo application: all data is fictional');
    expect(screen.getByTestId('login-submit')).toBeEnabled();
  });

  it('signing in opens the default report and greets the customer', async () => {
    await renderApp();
    await userEvent.type(screen.getByTestId('login-username'), 'alex');
    await userEvent.type(screen.getByTestId('login-password'), 'demo-only');
    await userEvent.click(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('bureau-name')).toHaveTextContent('Bureau A');
    expect(screen.getByTestId('btn-account')).toHaveTextContent('Alex');
    expect(screen.getByTestId('demo-banner')).toBeInTheDocument();
  });

  it('a wrong password shows the alert, moves focus to it and stays on the sign-in page', async () => {
    await renderApp();
    await userEvent.type(screen.getByTestId('login-username'), 'alex');
    await userEvent.type(screen.getByTestId('login-password'), 'wrong');
    await userEvent.click(screen.getByTestId('login-submit'));
    const alert = await screen.findByTestId('login-error');
    expect(alert).toHaveTextContent(NOT_RECOGNISED);
    await waitFor(() => expect(alert).toHaveFocus());
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
  });

  it('keeps the token in memory only: nothing is written to browser storage', async () => {
    const local = vi.spyOn(Storage.prototype, 'setItem');
    await renderApp();
    await userEvent.type(screen.getByTestId('login-username'), 'alex');
    await userEvent.type(screen.getByTestId('login-password'), 'demo-only');
    await userEvent.click(screen.getByTestId('login-submit'));
    await screen.findByTestId('bureau-name');
    expect(local).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('a page that needs a session sends an anonymous visitor to the sign-in page (what a reload does)', async () => {
    await renderApp('/credit-health/report/bureau-a');
    expect(await screen.findByTestId('login-submit')).toBeInTheDocument();
    expect(screen.queryByTestId('bureau-name')).not.toBeInTheDocument();
  });
});
