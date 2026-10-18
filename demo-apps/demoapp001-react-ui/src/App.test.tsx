import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
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
describe('signing in returns to the page asked for, and only on this site (CDS-38 R2-C-03)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fakeService());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Where the router ends up, shown as text so the test can read it. */
  function Where() {
    return <p data-testid="where">{useLocation().pathname}</p>;
  }

  async function signInWith(from: unknown) {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from } }]}>
        <SessionProvider>
          <App />
          <Where />
        </SessionProvider>
      </MemoryRouter>,
    );
    await userEvent.type(await screen.findByTestId('login-username'), 'alex');
    await userEvent.type(screen.getByTestId('login-password'), 'demo-only');
    await userEvent.click(screen.getByTestId('login-submit'));
  }

  it.each(['//evil.example', '/..//evil.example', '/.//evil.example', 'https://evil.example/x', 'javascript:alert(1)'])(
    'does not follow %s: it opens the default report',
    async (from) => {
      await signInWith(from);
      expect(await screen.findByTestId('bureau-name')).toHaveTextContent('Bureau A');
      expect(screen.getByTestId('where')).toHaveTextContent('/credit-health/report/bureau-a');
    },
  );

  it('follows a path on this site', async () => {
    await signInWith('/credit-health/debt-overview');
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/credit-health/debt-overview'));
  });
});

