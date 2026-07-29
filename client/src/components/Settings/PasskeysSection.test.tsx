// FE-COMP-PASSKEYS-001 to FE-COMP-PASSKEYS-022
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import { server } from '../../../tests/helpers/msw/server';
import { ToastContainer } from '../shared/Toast';
import type { PasskeyCredential } from '../../api/client';
import PasskeysSection from './PasskeysSection';

// The WebAuthn ceremony is the one thing jsdom cannot do. @simplewebauthn/browser
// is the only caller of navigator.credentials here, so it is stubbed wholesale;
// navigator.credentials itself is stubbed too so nothing can slip past.
const startRegistration = vi.fn();
vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: (...args: unknown[]) => startRegistration(...args),
}));

const cred = (over: Partial<PasskeyCredential> = {}): PasskeyCredential => ({
  id: 1,
  name: 'MacBook',
  device_type: 'multiDevice',
  backed_up: true,
  created_at: '2025-05-01 08:30:00',
  last_used_at: null,
  ...over,
});

function serve(opts: {
  credentials?: PasskeyCredential[]
  passkeyLogin?: boolean
  passkeyConfigured?: boolean
} = {}): void {
  server.use(
    http.get('/api/auth/app-config', () => HttpResponse.json({
      has_users: true,
      allow_registration: true,
      demo_mode: false,
      password_login: true,
      passkey_login: opts.passkeyLogin ?? true,
      passkey_configured: opts.passkeyConfigured ?? true,
    })),
    http.get('/api/auth/passkey/credentials', () =>
      HttpResponse.json({ credentials: opts.credentials ?? [] })),
  );
}

/** The <li> that carries the given credential name. */
const item = (name: string) => screen.getByText(name).closest('li') as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'credentials', {
    configurable: true,
    writable: true,
    value: { create: vi.fn(async () => null), get: vi.fn(async () => null) },
  });
  startRegistration.mockResolvedValue({ id: 'cred-id', rawId: 'cred-id', type: 'public-key' });
  serve();
});

describe('PasskeysSection', () => {
  it('FE-COMP-PASSKEYS-001: renders nothing in demo mode', () => {
    const { container } = render(<PasskeysSection demoMode />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-COMP-PASSKEYS-002: renders nothing once loaded when the feature is off and there are no credentials', async () => {
    serve({ passkeyLogin: false, credentials: [] });
    const { container } = render(<PasskeysSection />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('FE-COMP-PASSKEYS-003: keeps the list reachable when the feature is off but credentials exist', async () => {
    serve({ passkeyLogin: false, credentials: [cred()] });
    render(<PasskeysSection />);

    expect(await screen.findByText('MacBook')).toBeInTheDocument();
    expect(screen.getByText('Passkeys')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-004: warns when the feature is on but the server has no RP ID', async () => {
    serve({ passkeyLogin: true, passkeyConfigured: false });
    render(<PasskeysSection />);

    expect(await screen.findByText(/not fully configured on this server/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-005: offers the Add action when the feature is on and configured', async () => {
    render(<PasskeysSection />);

    expect(await screen.findByRole('button', { name: 'Add a passkey' })).toBeInTheDocument();
    expect(screen.queryByText(/not fully configured on this server/)).not.toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-006: a synced credential shows its name, badge, added date and never-used note', async () => {
    serve({ credentials: [cred()] });
    render(<PasskeysSection />);

    await screen.findByText('MacBook');
    const li = item('MacBook');
    expect(within(li).getByText('Synced')).toBeInTheDocument();
    expect(within(li).getByText(/Added: 5\/1\/2025/)).toHaveTextContent('Never used');
  });

  it('FE-COMP-PASSKEYS-007: a device-bound credential without a name falls back to the default label', async () => {
    serve({ credentials: [cred({ name: null, backed_up: false, last_used_at: '2025-06-10T12:00:00Z' })] });
    render(<PasskeysSection />);

    await screen.findByText('Passkey');
    const li = item('Passkey');
    expect(within(li).getByText('This device')).toBeInTheDocument();
    expect(within(li).getByText(/Last used: 6\/10\/2025/)).toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-008: an unparseable timestamp collapses to a dash', async () => {
    serve({ credentials: [cred({ created_at: 'never' })] });
    render(<PasskeysSection />);

    await screen.findByText('MacBook');
    expect(within(item('MacBook')).getByText(/Added: —/)).toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-009: a failing credential list still renders the section', async () => {
    server.use(http.get('/api/auth/passkey/credentials', () =>
      HttpResponse.json({ error: 'boom' }, { status: 500 })));
    render(<PasskeysSection />);

    expect(await screen.findByRole('button', { name: 'Add a passkey' })).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-010: a failing app-config leaves the feature off', async () => {
    server.use(
      http.get('/api/auth/app-config', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
      http.get('/api/auth/passkey/credentials', () => HttpResponse.json({ credentials: [cred()] })),
    );
    render(<PasskeysSection />);

    expect(await screen.findByText('MacBook')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-011: the add form opens, requires a password and closes on Cancel', async () => {
    const user = userEvent.setup();
    render(<PasskeysSection />);

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    expect(screen.getByText('Confirm your current password, then follow your device prompt.')).toBeInTheDocument();
    // The submit shares its label with the trigger — it is the only one left.
    expect(screen.getByRole('button', { name: 'Add a passkey' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Current password'), 'hunter2');
    expect(screen.getByRole('button', { name: 'Add a passkey' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByPlaceholderText('Current password')).not.toBeInTheDocument());
  });

  it('FE-COMP-PASSKEYS-012: adding runs the WebAuthn ceremony and reloads the list', async () => {
    const user = userEvent.setup();
    const sent: { body?: { attestationResponse?: { id?: string }; name?: string } } = {};
    let listCalls = 0;
    server.use(
      http.get('/api/auth/passkey/credentials', () => {
        listCalls += 1;
        return HttpResponse.json({ credentials: listCalls === 1 ? [] : [cred({ name: 'YubiKey' })] });
      }),
      http.post('/api/auth/passkey/register/options', () => HttpResponse.json({ challenge: 'abc' })),
      http.post('/api/auth/passkey/register/verify', async ({ request }) => {
        sent.body = await request.json() as { attestationResponse?: { id?: string }; name?: string };
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><PasskeysSection /></>);

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    await user.type(screen.getByPlaceholderText('Current password'), 'hunter2');
    await user.type(screen.getByPlaceholderText(/Name \(optional/), '  YubiKey  ');
    await user.click(screen.getByRole('button', { name: 'Add a passkey' }));

    await screen.findByText('Passkey added');
    expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: { challenge: 'abc' } });
    expect(sent.body?.name).toBe('YubiKey');
    expect(sent.body?.attestationResponse?.id).toBe('cred-id');
    expect(await screen.findByText('YubiKey')).toBeInTheDocument();
    // The form closed and reset.
    expect(screen.queryByPlaceholderText('Current password')).not.toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-013: an empty name is sent as undefined rather than a blank string', async () => {
    const user = userEvent.setup();
    const sent: { body?: Record<string, unknown> } = {};
    server.use(
      http.post('/api/auth/passkey/register/options', () => HttpResponse.json({ challenge: 'abc' })),
      http.post('/api/auth/passkey/register/verify', async ({ request }) => {
        sent.body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><PasskeysSection /></>);

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    await user.type(screen.getByPlaceholderText('Current password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Add a passkey' }));

    await screen.findByText('Passkey added');
    expect(sent.body).toBeDefined();
    expect(sent.body).not.toHaveProperty('name');
  });

  it('FE-COMP-PASSKEYS-014: a cancelled browser prompt reports the cancellation, not an error', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/auth/passkey/register/options', () => HttpResponse.json({ challenge: 'abc' })));
    const abort = new Error('user aborted');
    abort.name = 'NotAllowedError';
    startRegistration.mockRejectedValue(abort);
    render(<><ToastContainer /><PasskeysSection /></>);

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    await user.type(screen.getByPlaceholderText('Current password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Add a passkey' }));

    await screen.findByText('Passkey setup cancelled');
    // The form stays open so the user can retry.
    expect(screen.getByPlaceholderText('Current password')).toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-015: a rejected password surfaces the server message', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/auth/passkey/register/options', () =>
      HttpResponse.json({ error: 'Wrong password' }, { status: 401 })));
    render(<><ToastContainer /><PasskeysSection /></>);

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    await user.type(screen.getByPlaceholderText('Current password'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Add a passkey' }));

    await screen.findByText('Wrong password');
    expect(startRegistration).not.toHaveBeenCalled();
  });

  it('FE-COMP-PASSKEYS-016: renaming sends the trimmed name and refreshes', async () => {
    const user = userEvent.setup();
    const sent: { body?: { name?: string } } = {};
    let listCalls = 0;
    server.use(
      http.get('/api/auth/passkey/credentials', () => {
        listCalls += 1;
        return HttpResponse.json({ credentials: [cred({ name: listCalls === 1 ? 'MacBook' : 'Work laptop' })] });
      }),
      http.patch('/api/auth/passkey/credentials/1', async ({ request }) => {
        sent.body = await request.json() as { name?: string };
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><PasskeysSection /></>);

    await screen.findByText('MacBook');
    await user.click(within(item('MacBook')).getByRole('button', { name: 'Rename' }));
    const input = screen.getByDisplayValue('MacBook');
    await user.clear(input);
    await user.type(input, '  Work laptop  ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(sent.body).toEqual({ name: 'Work laptop' }));
    expect(await screen.findByText('Work laptop')).toBeInTheDocument();
  });

  it('FE-COMP-PASSKEYS-017: Enter commits a rename and Escape abandons it', async () => {
    const user = userEvent.setup();
    let patchCalls = 0;
    server.use(
      http.patch('/api/auth/passkey/credentials/1', () => {
        patchCalls += 1;
        return HttpResponse.json({ success: true });
      }),
    );
    serve({ credentials: [cred()] });
    render(<><ToastContainer /><PasskeysSection /></>);

    await screen.findByText('MacBook');
    await user.click(within(item('MacBook')).getByRole('button', { name: 'Rename' }));
    await user.type(screen.getByDisplayValue('MacBook'), '{Escape}');
    await waitFor(() => expect(screen.queryByDisplayValue('MacBook')).not.toBeInTheDocument());
    expect(patchCalls).toBe(0);

    await user.click(within(item('MacBook')).getByRole('button', { name: 'Rename' }));
    await user.type(screen.getByDisplayValue('MacBook'), '2{Enter}');
    await waitFor(() => expect(patchCalls).toBe(1));
  });

  it('FE-COMP-PASSKEYS-018: clearing the name cancels the rename without calling the API', async () => {
    const user = userEvent.setup();
    let patchCalls = 0;
    server.use(http.patch('/api/auth/passkey/credentials/1', () => {
      patchCalls += 1;
      return HttpResponse.json({ success: true });
    }));
    serve({ credentials: [cred()] });
    render(<><ToastContainer /><PasskeysSection /></>);

    await screen.findByText('MacBook');
    await user.click(within(item('MacBook')).getByRole('button', { name: 'Rename' }));
    await user.clear(screen.getByDisplayValue('MacBook'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('MacBook')).toBeInTheDocument());
    expect(patchCalls).toBe(0);
  });

  it('FE-COMP-PASSKEYS-022: the rename X button drops the edit and restores the row', async () => {
    const user = userEvent.setup();
    let patchCalls = 0;
    server.use(http.patch('/api/auth/passkey/credentials/1', () => {
      patchCalls += 1;
      return HttpResponse.json({ success: true });
    }));
    serve({ credentials: [cred()] });
    render(<><ToastContainer /><PasskeysSection /></>);

    await screen.findByText('MacBook');
    await user.click(within(item('MacBook')).getByRole('button', { name: 'Rename' }));
    await user.type(screen.getByDisplayValue('MacBook'), '-edited');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    expect(screen.getByText('MacBook')).toBeInTheDocument();
    expect(patchCalls).toBe(0);
  });

  it('FE-COMP-PASSKEYS-019: a failing rename surfaces the server message', async () => {
    const user = userEvent.setup();
    server.use(http.patch('/api/auth/passkey/credentials/1', () =>
      HttpResponse.json({ error: 'Name taken' }, { status: 409 })));
    serve({ credentials: [cred()] });
    render(<><ToastContainer /><PasskeysSection /></>);

    await screen.findByText('MacBook');
    await user.click(within(item('MacBook')).getByRole('button', { name: 'Rename' }));
    await user.type(screen.getByDisplayValue('MacBook'), '-x');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Name taken');
  });

  it('FE-COMP-PASSKEYS-020: deleting asks for the password, calls the API and can be cancelled', async () => {
    const user = userEvent.setup();
    const sent: { body?: { password?: string } } = {};
    let listCalls = 0;
    server.use(
      http.get('/api/auth/passkey/credentials', () => {
        listCalls += 1;
        return HttpResponse.json({ credentials: listCalls === 1 ? [cred()] : [] });
      }),
      http.delete('/api/auth/passkey/credentials/1', async ({ request }) => {
        sent.body = await request.json() as { password?: string };
        return HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><PasskeysSection /></>);

    await screen.findByText('MacBook');
    await user.click(within(item('MacBook')).getByRole('button', { name: 'Delete' }));
    const panel = screen.getByText('Remove this passkey? Confirm with your password.').parentElement as HTMLElement;
    expect(within(panel).getByRole('button', { name: 'Delete' })).toBeDisabled();

    await user.click(within(panel).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByText('Remove this passkey? Confirm with your password.')).not.toBeInTheDocument());

    await user.click(within(item('MacBook')).getByRole('button', { name: 'Delete' }));
    const panel2 = screen.getByText('Remove this passkey? Confirm with your password.').parentElement as HTMLElement;
    await user.type(within(panel2).getByPlaceholderText('Current password'), 'hunter2');
    await user.click(within(panel2).getByRole('button', { name: 'Delete' }));

    await screen.findByText('Passkey removed');
    expect(sent.body).toEqual({ password: 'hunter2' });
    await waitFor(() => expect(screen.queryByText('MacBook')).not.toBeInTheDocument());
  });

  it('FE-COMP-PASSKEYS-021: a failing delete surfaces the server message and keeps the panel open', async () => {
    const user = userEvent.setup();
    server.use(http.delete('/api/auth/passkey/credentials/1', () =>
      HttpResponse.json({ error: 'Wrong password' }, { status: 401 })));
    serve({ credentials: [cred()] });
    render(<><ToastContainer /><PasskeysSection /></>);

    await screen.findByText('MacBook');
    await user.click(within(item('MacBook')).getByRole('button', { name: 'Delete' }));
    const panel = screen.getByText('Remove this passkey? Confirm with your password.').parentElement as HTMLElement;
    await user.type(within(panel).getByPlaceholderText('Current password'), 'nope');
    await user.click(within(panel).getByRole('button', { name: 'Delete' }));

    await screen.findByText('Wrong password');
    expect(screen.getByText('Remove this passkey? Confirm with your password.')).toBeInTheDocument();
  });
});
