import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json } from '../../test/fixtures.ts';
import { fakeService, openSignedIn } from '../../test/helpers.tsx';

afterEach(() => vi.unstubAllGlobals());

const profile = (extra: object = {}) => ({
  legalName: 'Alex Example',
  dateOfBirth: '1985-03-12',
  memberSince: '2021-06-01',
  preferredName: 'Al',
  email: { address: 'alex.example@example.com', status: 'verified' },
  mobile: { lastDigits: '123', status: 'verified' },
  address: { line1: '1 Example Street', postcode: 'ZZ1 1ZZ', previousCount: 1 },
  employment: { status: 'employed-full-time' },
  finances: { added: true },
  ...extra,
});
const problem = (status: number, type: string, detail: string, extra: object = {}) =>
  new Response(JSON.stringify({ type, title: 'x', status, detail, ...extra }), { status, headers: { 'content-type': 'application/problem+json' } });

describe('my profile (My Profile UI feature spec 2 to 3)', () => {
  it('shows the legal name and dates, none of them editable', async () => {
    fakeService({ 'GET /me/profile': () => json(200, profile()) });
    await openSignedIn('/my-account/profile');
    expect(await screen.findByTestId('profile-legal-name')).toHaveTextContent('Alex Example');
    expect(screen.getByTestId('profile-legal-name').tagName).toBe('H1');
    expect(screen.getByTestId('profile-dob')).toHaveTextContent('12 March 1985');
    expect(screen.getByTestId('profile-member-since')).toHaveTextContent('1 June 2021');
    expect(screen.getByTestId('profile-identity').querySelectorAll('input, textarea, [contenteditable]')).toHaveLength(0);
    expect(screen.getByTestId('profile-header-image')).toHaveAttribute('alt', '');
  });

  it('explains the name in a non-modal dialog that Escape closes, returning focus to the button', async () => {
    fakeService({ 'GET /me/profile': () => json(200, profile()) });
    await openSignedIn('/my-account/profile');
    const button = await screen.findByTestId('profile-name-info');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('profile-name-info-panel')).toHaveTextContent('matches the credit report');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByTestId('profile-name-info-panel')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('a click outside closes the panel', async () => {
    fakeService({ 'GET /me/profile': () => json(200, profile()) });
    await openSignedIn('/my-account/profile');
    await userEvent.click(await screen.findByTestId('profile-name-info'));
    await userEvent.click(screen.getByTestId('profile-dob'));
    expect(screen.queryByTestId('profile-name-info-panel')).not.toBeInTheDocument();
  });

  it('shows five tiles with a summary each and badges, and no amounts', async () => {
    fakeService({ 'GET /me/profile': () => json(200, profile()) });
    await openSignedIn('/my-account/profile');
    await screen.findByTestId('profile-tile-email');
    expect(screen.getByTestId('profile-tile-email')).toHaveTextContent('alex.example@example.com');
    expect(screen.getByTestId('profile-email-badge')).toHaveTextContent('Verified');
    expect(screen.getByTestId('profile-tile-mobile')).toHaveTextContent('•••• ••• 123');
    expect(screen.getByTestId('profile-mobile-badge')).toHaveTextContent('Verified');
    expect(screen.getByTestId('profile-tile-address')).toHaveTextContent('1 Example Street, ZZ1 1ZZ');
    expect(screen.getByTestId('profile-tile-employment')).toHaveTextContent('Employed full time');
    expect(screen.getByTestId('profile-tile-finances')).toHaveTextContent('Added');
    expect(screen.getByTestId('profile-tile-email').tagName).toBe('A');
    expect(document.body.textContent).not.toContain('£');
  });

  it('empty tiles say Not added', async () => {
    fakeService({ 'GET /me/profile': () => json(200, profile({ mobile: null, address: null, employment: null, finances: { added: false }, email: { address: 'sam@example.com', status: 'unverified' } })) });
    await openSignedIn('/my-account/profile');
    expect(await screen.findByTestId('profile-tile-mobile')).toHaveTextContent('Not added');
    expect(screen.queryByTestId('profile-mobile-badge')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-tile-address')).toHaveTextContent('Not added');
    expect(screen.getByTestId('profile-tile-employment')).toHaveTextContent('Not added');
    expect(screen.getByTestId('profile-tile-finances')).toHaveTextContent('Not added');
    expect(screen.getByTestId('profile-email-badge')).toHaveTextContent('Unverified');
  });

  it('keeps the customer out of the page title and address (PR-08)', async () => {
    fakeService({ 'GET /me/profile': () => json(200, profile()) });
    await openSignedIn('/my-account/profile');
    await screen.findByTestId('profile-legal-name');
    for (const secret of ['Alex Example', 'alex.example@example.com', '123']) expect(document.title).not.toContain(secret);
  });

  it('has an error state with a retry', async () => {
    let fail = true;
    fakeService({ 'GET /me/profile': () => (fail ? json(500, { title: 'x' }) : json(200, profile())) });
    await openSignedIn('/my-account/profile');
    const retry = await screen.findByTestId('profile-retry');
    fail = false;
    await userEvent.click(retry);
    expect(await screen.findByTestId('profile-legal-name')).toBeInTheDocument();
  });
});

describe('preferred name (PR-02, PR-03)', () => {
  function service(patch?: (body: { preferredName: string | null }) => Response) {
    const bodies: unknown[] = [];
    let greeting = 'Al';
    fakeService({
      'GET /me/profile': () => json(200, profile()),
      'GET /me': () => json(200, { id: 'usr_01', displayName: 'Alex Example', greetingName: greeting, defaultBureauId: 'bureau-a' }),
      'PATCH /me/profile/preferred-name': async (request) => {
        const body = (await request.json()) as { preferredName: string | null };
        bodies.push(body);
        if (patch) return patch(body);
        greeting = body.preferredName?.trim() ?? 'Alex';
        return json(200, { preferredName: body.preferredName?.trim() ?? null });
      },
    });
    return { bodies };
  }
  const input = () => screen.findByTestId('profile-preferred-input');

  it('Save and Cancel appear only once the value changes, and Cancel restores it', async () => {
    service();
    await openSignedIn('/my-account/profile');
    const field = await input();
    expect(field).toHaveValue('Al');
    expect(screen.queryByTestId('profile-preferred-save')).not.toBeInTheDocument();
    await userEvent.type(field, 'x');
    expect(screen.getByTestId('profile-preferred-save')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('profile-preferred-cancel'));
    expect(field).toHaveValue('Al');
    expect(screen.queryByTestId('profile-preferred-save')).not.toBeInTheDocument();
  });

  it('saves, says so, and the greeting follows', async () => {
    const { bodies } = service();
    await openSignedIn('/my-account/profile');
    const field = await input();
    await userEvent.clear(field);
    await userEvent.type(field, 'Ally');
    await userEvent.click(screen.getByTestId('profile-preferred-save'));
    await waitFor(() => expect(screen.getByTestId('profile-preferred-status')).toHaveTextContent('Saved'));
    expect(bodies).toEqual([{ preferredName: 'Ally' }]);
    await waitFor(() => expect(screen.getByTestId('btn-account')).toHaveTextContent('Ally'));
  });

  it('shows the stored value, trimmed by the service', async () => {
    service();
    await openSignedIn('/my-account/profile');
    const field = await input();
    await userEvent.clear(field);
    await userEvent.type(field, '  Sam  ');
    await userEvent.click(screen.getByTestId('profile-preferred-save'));
    await waitFor(() => expect(field).toHaveValue('Sam'));
  });

  it('clearing sends null and the greeting returns to the legal first name', async () => {
    const { bodies } = service();
    await openSignedIn('/my-account/profile');
    await userEvent.clear(await input());
    await userEvent.click(screen.getByTestId('profile-preferred-save'));
    await waitFor(() => expect(screen.getByTestId('btn-account')).toHaveTextContent('Alex'));
    expect(bodies).toEqual([{ preferredName: null }]);
  });

  it.each(['R2D2', 'Alexandra-Catherine Montgomeryx', 'Al!', '<b>'])('refuses %j at once and sends nothing', async (name) => {
    const { bodies } = service();
    await openSignedIn('/my-account/profile');
    const field = await input();
    await userEvent.clear(field);
    await userEvent.type(field, name);
    await userEvent.click(screen.getByTestId('profile-preferred-save'));
    expect(await screen.findByTestId('profile-preferred-error')).toHaveTextContent('1 to 30 letters');
    expect(bodies).toEqual([]);
  });

  it.each(['Jo-Ann', "D'Arcy", 'Zoë'])('accepts %j', async (name) => {
    const { bodies } = service();
    await openSignedIn('/my-account/profile');
    const field = await input();
    await userEvent.clear(field);
    await userEvent.type(field, name);
    await userEvent.click(screen.getByTestId('profile-preferred-save'));
    await waitFor(() => expect(bodies).toEqual([{ preferredName: name }]));
  });

  it("shows the service's own words when it refuses", async () => {
    service(() => problem(422, '/problems/rule-violation/preferred-name', 'The service says no.'));
    await openSignedIn('/my-account/profile');
    const field = await input();
    await userEvent.type(field, 'x');
    await userEvent.click(screen.getByTestId('profile-preferred-save'));
    expect(await screen.findByTestId('profile-preferred-error')).toHaveTextContent('The service says no.');
    expect(screen.getByTestId('profile-preferred-status')).toHaveTextContent('The service says no.');
  });
});

describe('email sub-page (My Profile UI feature spec 4.2)', () => {
  const verified = profile();
  const unverified = profile({ email: { address: 'alex.new@example.com', status: 'unverified' } });

  it('is pre-filled and saves a new address, returning to the profile', async () => {
    const bodies: unknown[] = [];
    fakeService({
      'GET /me/profile': () => json(200, verified),
      'PUT /me/profile/email': async (request) => {
        bodies.push(await request.json());
        return json(200, { address: 'alex.new@example.com', status: 'unverified' });
      },
    });
    await openSignedIn('/my-account/profile/email');
    const field = await screen.findByTestId('email-input');
    expect(field).toHaveValue('alex.example@example.com');
    expect(screen.getByTestId('email-current')).toHaveTextContent('Verified');
    await userEvent.clear(field);
    await userEvent.type(field, 'alex.new@example.com');
    await userEvent.click(screen.getByTestId('email-save'));
    expect(await screen.findByTestId('profile-legal-name')).toBeInTheDocument();
    expect(bodies).toEqual([{ address: 'alex.new@example.com' }]);
  });

  it('shows the service message for a bad address and stays', async () => {
    fakeService({ 'GET /me/profile': () => json(200, verified), 'PUT /me/profile/email': () => problem(400, '/problems/validation', 'That is not an email address.') });
    await openSignedIn('/my-account/profile/email');
    const field = await screen.findByTestId('email-input');
    await userEvent.clear(field);
    await userEvent.type(field, 'nonsense');
    await userEvent.click(screen.getByTestId('email-save'));
    const error = await screen.findByTestId('email-error');
    expect(error).toHaveTextContent('That is not an email address.');
    expect(field).toHaveAccessibleDescription('That is not an email address.');
  });

  it('offers no resend while the address is verified', async () => {
    fakeService({ 'GET /me/profile': () => json(200, verified) });
    await openSignedIn('/my-account/profile/email');
    await screen.findByTestId('email-input');
    expect(screen.queryByTestId('email-resend')).not.toBeInTheDocument();
  });

  it.each([
    ['sent', () => json(202, { sentAt: '2026-10-03T10:01:00Z', nextResendAt: '2026-10-03T10:02:00Z' }), 'Link sent'],
    ['too soon', () => new Response(JSON.stringify({ type: '/problems/rate-limited', title: 'x', status: 429 }), { status: 429, headers: { 'content-type': 'application/problem+json', 'Retry-After': '42' } }), 'Try again in 42 seconds'],
    ['already verified', () => problem(422, '/problems/rule-violation/already-verified', 'x'), 'This address is already verified'],
  ])('resend %s', async (_name, response, text) => {
    fakeService({ 'GET /me/profile': () => json(200, unverified), 'POST /me/profile/email/verification': response });
    await openSignedIn('/my-account/profile/email');
    await userEvent.click(await screen.findByTestId('email-resend'));
    await waitFor(() => expect(screen.getByTestId('email-resend-status')).toHaveTextContent(text));
  });

  it('cancel returns without saving', async () => {
    const put = vi.fn();
    fakeService({ 'GET /me/profile': () => json(200, verified), 'PUT /me/profile/email': put });
    await openSignedIn('/my-account/profile/email');
    await userEvent.click(await screen.findByTestId('email-cancel'));
    expect(await screen.findByTestId('profile-legal-name')).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });
});

describe('mobile sub-page (My Profile UI feature spec 4.1)', () => {
  const none = profile({ mobile: null });
  const challenge = { lastDigits: '456', status: 'unverified', expiresAt: '2026-10-03T10:10:00Z', attemptsRemaining: 3 };

  async function addNumber() {
    await userEvent.type(await screen.findByTestId('mobile-input'), '07700 900456');
    await userEvent.click(screen.getByTestId('mobile-save'));
  }

  it('starts empty, then asks for the code on the same page, with the demo hint', async () => {
    const bodies: unknown[] = [];
    fakeService({
      'GET /me/profile': () => json(200, none),
      'PUT /me/profile/mobile': async (request) => {
        bodies.push(await request.json());
        return json(200, challenge);
      },
    });
    await openSignedIn('/my-account/profile/mobile');
    expect(await screen.findByTestId('mobile-input')).toHaveValue('');
    expect(screen.queryByTestId('mobile-current')).not.toBeInTheDocument();
    await addNumber();
    expect(await screen.findByTestId('mobile-code-input')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-code-hint')).toHaveTextContent('123456');
    // The attempts left appear with the first wrong code, not before it (PR-11, CDS-38 C-33).
    expect(screen.queryByTestId('mobile-attempts')).not.toBeInTheDocument();
    expect(bodies).toEqual([{ number: '07700 900456' }]);
  });

  it('a held number is shown masked, and the input is still empty', async () => {
    fakeService({ 'GET /me/profile': () => json(200, profile()) });
    await openSignedIn('/my-account/profile/mobile');
    expect(await screen.findByTestId('mobile-current')).toHaveTextContent('•••• ••• 123 · Verified');
    expect(screen.getByTestId('mobile-input')).toHaveValue('');
  });

  it('the right code returns to the profile', async () => {
    const codes: unknown[] = [];
    fakeService({
      'GET /me/profile': () => json(200, none),
      'PUT /me/profile/mobile': () => json(200, challenge),
      'POST /me/profile/mobile/verification': async (request) => {
        codes.push(await request.json());
        return json(200, { lastDigits: '456', status: 'verified' });
      },
    });
    await openSignedIn('/my-account/profile/mobile');
    await addNumber();
    await userEvent.type(await screen.findByTestId('mobile-code-input'), '123456');
    await userEvent.click(screen.getByTestId('mobile-code-submit'));
    expect(await screen.findByTestId('profile-legal-name')).toBeInTheDocument();
    expect(codes).toEqual([{ code: '123456' }]);
  });

  it('a wrong code shows the service message and the attempts left', async () => {
    fakeService({
      'GET /me/profile': () => json(200, none),
      'PUT /me/profile/mobile': () => json(200, challenge),
      'POST /me/profile/mobile/verification': () => problem(422, '/problems/rule-violation/code-wrong', 'That code is not right. You have 2 attempts left.', { attemptsRemaining: 2 }),
    });
    await openSignedIn('/my-account/profile/mobile');
    await addNumber();
    await userEvent.type(await screen.findByTestId('mobile-code-input'), '000000');
    await userEvent.click(screen.getByTestId('mobile-code-submit'));
    expect(await screen.findByTestId('mobile-code-error')).toHaveTextContent('2 attempts left');
    expect(screen.getByTestId('mobile-attempts')).toHaveTextContent('2 attempts left');
  });

  it('a void code asks for the number to be added again', async () => {
    fakeService({
      'GET /me/profile': () => json(200, none),
      'PUT /me/profile/mobile': () => json(200, challenge),
      'POST /me/profile/mobile/verification': () => problem(422, '/problems/rule-violation/code-invalid', 'That code is no longer valid. Add your number again to get a new one.'),
    });
    await openSignedIn('/my-account/profile/mobile');
    await addNumber();
    await userEvent.type(await screen.findByTestId('mobile-code-input'), '000000');
    await userEvent.click(screen.getByTestId('mobile-code-submit'));
    expect(await screen.findByTestId('mobile-input')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-code-error')).toHaveTextContent('Add your number again');
    expect(screen.queryByTestId('mobile-code-input')).not.toBeInTheDocument();
  });

  it('a number that is not a UK mobile is refused with the service message', async () => {
    fakeService({
      'GET /me/profile': () => json(200, none),
      'PUT /me/profile/mobile': () => problem(422, '/problems/rule-violation/mobile-number', 'Enter a UK mobile number starting 07 or +447 (PR-06).'),
    });
    await openSignedIn('/my-account/profile/mobile');
    await addNumber();
    expect(await screen.findByTestId('mobile-error')).toHaveTextContent('Enter a UK mobile number');
    expect(screen.queryByTestId('mobile-code-input')).not.toBeInTheDocument();
  });

  it('cancel returns to the profile', async () => {
    fakeService({ 'GET /me/profile': () => json(200, none) });
    await openSignedIn('/my-account/profile/mobile');
    await userEvent.click(await screen.findByTestId('mobile-cancel'));
    expect(await screen.findByTestId('profile-legal-name')).toBeInTheDocument();
  });
});

describe('the profile header image (CDS-38 C-27)', () => {
  it('is a whole GIF, ending in its trailer byte', async () => {
    fakeService({ 'GET /me/profile': () => json(200, profile()) });
    await openSignedIn('/my-account/profile');
    const src = (await screen.findByTestId('profile-header-image')).getAttribute('src')!;
    const bytes = Uint8Array.from(atob(src.split(',')[1]!), (c) => c.charCodeAt(0));
    expect(String.fromCharCode(...bytes.slice(0, 3))).toBe('GIF');
    expect(bytes[bytes.length - 1]).toBe(0x3b); // the GIF trailer: a truncated file lacks it
  });
});
