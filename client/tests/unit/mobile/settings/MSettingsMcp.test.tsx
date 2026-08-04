// FE-MOB-SETMCP-001 onwards
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen, fireEvent, waitFor } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MSettingsMcp from '../../../../src/mobile/screens/settings/MSettingsMcp';

const OAUTH_CLIENT = {
  id: 'cl-1',
  name: 'Claude Web',
  client_id: 'clid-abc',
  redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
  allowed_scopes: ['trips:read', 'trips:write', 'places:read', 'places:write', 'budget:read', 'budget:write', 'packing:read'],
  allows_client_credentials: false,
  created_at: '2025-03-01T10:00:00.000Z',
};

const SESSION = {
  id: 77,
  client_id: 'clid-abc',
  client_name: 'Claude Desktop',
  scopes: ['trips:read'],
  access_token_expires_at: '2025-12-31T00:00:00.000Z',
  refresh_token_expires_at: '2026-12-31T00:00:00.000Z',
  created_at: '2025-03-01T10:00:00.000Z',
};

const TOKEN = {
  id: 5,
  name: 'Work laptop',
  token_prefix: 'trek_ab12',
  created_at: '2025-02-01T09:00:00.000Z',
  last_used_at: '2025-02-05T09:00:00.000Z',
};

function seedApi(opts: { clients?: unknown[]; sessions?: unknown[]; tokens?: unknown[] } = {}) {
  server.use(
    http.get('/api/oauth/clients', () => HttpResponse.json({ clients: opts.clients ?? [] })),
    http.get('/api/oauth/sessions', () => HttpResponse.json({ sessions: opts.sessions ?? [] })),
    http.get('/api/auth/mcp-tokens', () => HttpResponse.json({ tokens: opts.tokens ?? [] })),
  );
}

function renderScreen() {
  return render(<><ToastContainer /><MSettingsMcp /></>);
}

/** Switch to the deprecated API-tokens tab. */
async function openTokenTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'API Tokens' }));
}

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  });
});

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: buildSettings({ language: 'en' }) });
  seedApi();
});

describe('MSettingsMcp', () => {
  it('FE-MOB-SETMCP-001: shows the MCP endpoint and defaults to the OAuth tab', async () => {
    renderScreen();

    expect(screen.getByText('MCP Configuration')).toBeInTheDocument();
    expect(screen.getByText(`${window.location.origin}/mcp`)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'OAuth 2.1 Clients' })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(screen.getByText('No OAuth clients registered.')).toBeInTheDocument());
    expect(screen.queryByText('No tokens yet. Create one to connect MCP clients.')).toBeNull();
  });

  it('FE-MOB-SETMCP-002: copying the endpoint writes it to the clipboard and flips the icon', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    renderScreen();

    const copyBtn = screen.getByRole('button', { name: 'Copy' });
    fireEvent.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/mcp`);
    await waitFor(() => expect(copyBtn.querySelector('svg')).toHaveClass('text-[color:var(--m-st-confirmed)]'));
  });

  it('FE-MOB-SETMCP-003: the OAuth client config block expands and copies its JSON', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    renderScreen();

    expect(document.querySelector('pre')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Client Configuration' }));

    const pre = document.querySelector('pre');
    expect(pre?.textContent).toContain('mcpServers');
    expect(pre?.textContent).toContain('--static-oauth-client-info');

    // [0] is the endpoint copy button, [1] the one above the JSON block
    fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[1]);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('--static-oauth-client-info'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument());
  });

  it('FE-MOB-SETMCP-004: the API tokens tab shows the deprecation notice and the bearer config', async () => {
    const user = userEvent.setup();
    renderScreen();
    await openTokenTab(user);

    expect(screen.getByText(/API Tokens are deprecated/)).toBeInTheDocument();
    await screen.findByText('No tokens yet. Create one to connect MCP clients.');
    expect(screen.queryByText('No OAuth clients registered.')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Client Configuration' }));
    expect(document.querySelector('pre')?.textContent).toContain('Authorization: Bearer <your_token>');
  });

  it('FE-MOB-SETMCP-005: an OAuth client renders with its id and a collapsed scope list', async () => {
    seedApi({ clients: [OAUTH_CLIENT] });
    renderScreen();

    await screen.findByText('Claude Web');
    expect(screen.getByText(/clid-abc/)).toBeInTheDocument();
    // 7 scopes, 5 shown plus a "+2" expander
    expect(screen.queryByText('packing:read')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '+2' }));
    expect(screen.getByText('packing:read')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '−' }));
    expect(screen.queryByText('packing:read')).toBeNull();
  });

  it('FE-MOB-SETMCP-006: a client-credentials client is badged as machine', async () => {
    seedApi({ clients: [{ ...OAUTH_CLIENT, allows_client_credentials: true, allowed_scopes: ['trips:read'] }] });
    renderScreen();

    await screen.findByText('Claude Web');
    expect(screen.getByText('machine')).toBeInTheDocument();
    // Below the 5-scope threshold — no expander
    expect(screen.queryByRole('button', { name: /^\+\d+$/ })).toBeNull();
  });

  it('FE-MOB-SETMCP-007: a preset fills the create form and registers the client with split URIs', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    // The list is re-read after the registration, so the server keeps the
    // registered client and hands back its normalised name.
    const registered: unknown[] = [];
    server.use(
      http.post('/api/oauth/clients', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        registered.push({ ...OAUTH_CLIENT, id: 'new', name: 'Claude.ai (web)', client_id: 'clid-new' });
        return HttpResponse.json({ client: { ...OAUTH_CLIENT, id: 'new', client_id: 'clid-new', client_secret: 'sec-new' } });
      }),
      http.get('/api/oauth/clients', () => HttpResponse.json({ clients: registered })),
    );
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'New Client' }));
    await screen.findByText('Register OAuth Client');

    await user.click(screen.getByRole('button', { name: 'Claude.ai' }));
    expect(screen.getByPlaceholderText(/Claude Web, My MCP App/)).toHaveValue('Claude.ai');

    const uris = screen.getByPlaceholderText(/your-app/);
    fireEvent.change(uris, { target: { value: 'https://a.example/cb\n \nhttps://b.example/cb' } });
    await user.click(screen.getByRole('button', { name: 'Register Client' }));

    await screen.findByText('Client Registered');
    expect(body).toMatchObject({
      name: 'Claude.ai',
      redirect_uris: ['https://a.example/cb', 'https://b.example/cb'],
    });
    // trips:delete is filtered out of the Claude.ai preset
    expect((body as unknown as { allowed_scopes: string[] }).allowed_scopes).toContain('trips:read');
    expect((body as unknown as { allowed_scopes: string[] }).allowed_scopes).not.toContain('trips:delete');

    expect(screen.getByText('clid-new')).toBeInTheDocument();
    expect(screen.getByText('sec-new')).toBeInTheDocument();
    // The row comes from the re-read, so it carries the server's name
    expect(await screen.findByText('Claude.ai (web)')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-008: the created-client sheet ignores Escape and closes on Done', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/oauth/clients', () =>
        HttpResponse.json({ client: { ...OAUTH_CLIENT, client_id: 'clid-x', client_secret: 'sec-x' } })),
    );
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'New Client' }));
    await screen.findByText('Register OAuth Client');
    // Escape closes while the form is still editable
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Register OAuth Client')).toBeNull());

    await user.click(screen.getByRole('button', { name: 'New Client' }));
    await user.type(await screen.findByPlaceholderText(/Claude Web, My MCP App/), 'X');
    fireEvent.change(screen.getByPlaceholderText(/your-app/), { target: { value: 'http://localhost' } });
    await user.click(screen.getByRole('button', { name: 'Register Client' }));
    await screen.findByText('Client Registered');

    await user.keyboard('{Escape}');
    expect(screen.getByText('Client Registered')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByText('Client Registered')).toBeNull());
  });

  it('FE-MOB-SETMCP-009: the machine toggle drops the redirect URIs and posts client_credentials', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/oauth/clients', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          client: { ...OAUTH_CLIENT, client_id: 'clid-m', client_secret: 'sec-m', allows_client_credentials: true },
        });
      }),
    );
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'New Client' }));
    await screen.findByText('Register OAuth Client');
    expect(screen.getByText('Redirect URIs')).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Machine client (no browser login)' }));
    expect(screen.queryByText('Redirect URIs')).toBeNull();

    await user.type(screen.getByPlaceholderText(/Claude Web, My MCP App/), 'CI bot');
    await user.click(screen.getByRole('button', { name: 'Register Client' }));

    await screen.findByText('Client Registered');
    expect(body).toMatchObject({ name: 'CI bot', redirect_uris: [], allows_client_credentials: true });
    expect(screen.getByText(/grant_type=client_credentials/)).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-010: copies the new client id and secret from the created sheet', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/oauth/clients', () =>
        HttpResponse.json({ client: { ...OAUTH_CLIENT, client_id: 'clid-copy', client_secret: 'sec-copy' } })),
    );
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'New Client' }));
    await user.type(await screen.findByPlaceholderText(/Claude Web, My MCP App/), 'C');
    fireEvent.change(screen.getByPlaceholderText(/your-app/), { target: { value: 'http://localhost' } });
    await user.click(screen.getByRole('button', { name: 'Register Client' }));
    await screen.findByText('Client Registered');

    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
    fireEvent.click(copyButtons[copyButtons.length - 2]);
    fireEvent.click(copyButtons[copyButtons.length - 1]);

    expect(writeText).toHaveBeenNthCalledWith(1, 'clid-copy');
    expect(writeText).toHaveBeenNthCalledWith(2, 'sec-copy');
  });

  it('FE-MOB-SETMCP-011: a failed registration surfaces an error toast and keeps the form open', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/oauth/clients', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'New Client' }));
    await user.type(await screen.findByPlaceholderText(/Claude Web, My MCP App/), 'Broken');
    fireEvent.change(screen.getByPlaceholderText(/your-app/), { target: { value: 'http://localhost' } });
    await user.click(screen.getByRole('button', { name: 'Register Client' }));

    await screen.findByText('Failed to register OAuth client');
    expect(screen.getByText('Register OAuth Client')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-012: deleting a client removes it from the list and toasts', async () => {
    const user = userEvent.setup();
    seedApi({ clients: [OAUTH_CLIENT] });
    server.use(http.delete('/api/oauth/clients/cl-1', () => HttpResponse.json({ success: true })));
    renderScreen();

    await screen.findByText('Claude Web');
    await user.click(screen.getByRole('button', { name: 'Delete Client' }));
    await screen.findByText(/This client and all active sessions will be permanently removed/);

    const confirms = screen.getAllByRole('button', { name: 'Delete Client' });
    await user.click(confirms[confirms.length - 1]);

    await waitFor(() => expect(screen.queryByText('Claude Web')).toBeNull());
    expect(screen.getByText('OAuth client deleted')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-013: a failed delete keeps the client and toasts the error', async () => {
    const user = userEvent.setup();
    seedApi({ clients: [OAUTH_CLIENT] });
    server.use(http.delete('/api/oauth/clients/cl-1', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();

    await screen.findByText('Claude Web');
    await user.click(screen.getByRole('button', { name: 'Delete Client' }));
    const confirms = await screen.findAllByRole('button', { name: 'Delete Client' });
    await user.click(confirms[confirms.length - 1]);

    await screen.findByText('Failed to delete OAuth client');
    expect(screen.getByText('Claude Web')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-014: rotating a secret shows the new one and copies it', async () => {
    const user = userEvent.setup();
    seedApi({ clients: [OAUTH_CLIENT] });
    server.use(http.post('/api/oauth/clients/cl-1/rotate', () => HttpResponse.json({ client_secret: 'rotated-1' })));
    renderScreen();

    await screen.findByText('Claude Web');
    await user.click(screen.getByRole('button', { name: 'Rotate Secret' }));
    await screen.findByText(/A new client secret will be generated/);

    await user.click(screen.getByRole('button', { name: 'Rotate' }));
    await screen.findByText('New Secret Generated');
    expect(screen.getByText('rotated-1')).toBeInTheDocument();

    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
    fireEvent.click(copyButtons[copyButtons.length - 1]);
    expect(writeText).toHaveBeenCalledWith('rotated-1');

    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByText('New Secret Generated')).toBeNull());
  });

  it('FE-MOB-SETMCP-015: a failed rotation toasts and leaves the confirm open', async () => {
    const user = userEvent.setup();
    seedApi({ clients: [OAUTH_CLIENT] });
    server.use(http.post('/api/oauth/clients/cl-1/rotate', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();

    await screen.findByText('Claude Web');
    await user.click(screen.getByRole('button', { name: 'Rotate Secret' }));
    await user.click(await screen.findByRole('button', { name: 'Rotate' }));

    await screen.findByText('Failed to rotate client secret');
    expect(screen.queryByText('New Secret Generated')).toBeNull();
  });

  it('FE-MOB-SETMCP-016: an active session can be revoked', async () => {
    const user = userEvent.setup();
    seedApi({ sessions: [SESSION] });
    server.use(http.delete('/api/oauth/sessions/77', () => HttpResponse.json({ success: true })));
    renderScreen();

    await screen.findByText('Claude Desktop');
    expect(screen.getByText(/Scopes: trips:read/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    await screen.findByText('This will immediately revoke access for this OAuth session.');
    const revokes = screen.getAllByRole('button', { name: 'Revoke' });
    await user.click(revokes[revokes.length - 1]);

    await waitFor(() => expect(screen.queryByText('Claude Desktop')).toBeNull());
    expect(screen.getByText('Session revoked')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-017: a failed revoke keeps the session and toasts', async () => {
    const user = userEvent.setup();
    seedApi({ sessions: [SESSION] });
    server.use(http.delete('/api/oauth/sessions/77', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();

    await screen.findByText('Claude Desktop');
    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    const revokes = await screen.findAllByRole('button', { name: 'Revoke' });
    await user.click(revokes[revokes.length - 1]);

    await screen.findByText('Failed to revoke session');
    expect(screen.getByText('Claude Desktop')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-018: existing API tokens render with their prefix and usage dates', async () => {
    const user = userEvent.setup();
    seedApi({ tokens: [TOKEN, { ...TOKEN, id: 6, name: 'Phone', last_used_at: null }] });
    renderScreen();
    await openTokenTab(user);

    expect(await screen.findByText('Work laptop')).toBeInTheDocument();
    expect(screen.getAllByText(/trek_ab12\.\.\./)).toHaveLength(2);
    // only the first token was ever used
    expect(screen.getByText(/· Used/)).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-019: Enter in the token name field creates the token and shows it once', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/auth/mcp-tokens', () =>
        HttpResponse.json({
          token: { id: 9, name: 'CLI', token_prefix: 'trek_cli', created_at: '2025-04-01T00:00:00.000Z', raw_token: 'trek_cli_secret' },
        })),
    );
    renderScreen();
    await openTokenTab(user);

    await user.click(screen.getByRole('button', { name: 'Create New Token' }));
    await screen.findByText('Create API Token');
    expect(screen.getByRole('button', { name: 'Create Token' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/Claude Desktop, Work laptop/), 'CLI');
    await user.keyboard('{Enter}');

    await screen.findByText('Token Created');
    expect(screen.getByText('trek_cli_secret')).toBeInTheDocument();

    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
    fireEvent.click(copyButtons[copyButtons.length - 1]);
    expect(writeText).toHaveBeenCalledWith('trek_cli_secret');

    // Escape is refused while the one-time secret is on screen
    await user.keyboard('{Escape}');
    expect(screen.getByText('Token Created')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByText('Token Created')).toBeNull());
    // The new token was prepended to the list
    expect(screen.getByText('CLI')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-020: a failed token creation toasts the error', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/auth/mcp-tokens', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();
    await openTokenTab(user);

    await user.click(screen.getByRole('button', { name: 'Create New Token' }));
    await user.type(await screen.findByPlaceholderText(/Claude Desktop, Work laptop/), 'Nope');
    await user.click(screen.getByRole('button', { name: 'Create Token' }));

    await screen.findByText('Failed to create token');
    expect(screen.getByText('Create API Token')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-021: cancelling the create-token sheet closes it without a request', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(http.post('/api/auth/mcp-tokens', () => { posted = true; return HttpResponse.json({}); }));
    renderScreen();
    await openTokenTab(user);

    await user.click(screen.getByRole('button', { name: 'Create New Token' }));
    await screen.findByText('Create API Token');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Create API Token')).toBeNull());
    expect(posted).toBe(false);
  });

  it('FE-MOB-SETMCP-022: deleting a token removes it and toasts', async () => {
    const user = userEvent.setup();
    seedApi({ tokens: [TOKEN] });
    server.use(http.delete('/api/auth/mcp-tokens/5', () => HttpResponse.json({ success: true })));
    renderScreen();
    await openTokenTab(user);

    await screen.findByText('Work laptop');
    await user.click(screen.getByRole('button', { name: 'Delete Token' }));
    await screen.findByText('This token will stop working immediately. Any MCP client using it will lose access.');

    const confirms = screen.getAllByRole('button', { name: 'Delete Token' });
    await user.click(confirms[confirms.length - 1]);

    await waitFor(() => expect(screen.queryByText('Work laptop')).toBeNull());
    expect(screen.getByText('Token deleted')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-023: a failed token delete keeps the row and toasts', async () => {
    const user = userEvent.setup();
    seedApi({ tokens: [TOKEN] });
    server.use(http.delete('/api/auth/mcp-tokens/5', () => HttpResponse.json({}, { status: 500 })));
    renderScreen();
    await openTokenTab(user);

    await screen.findByText('Work laptop');
    await user.click(screen.getByRole('button', { name: 'Delete Token' }));
    const confirms = await screen.findAllByRole('button', { name: 'Delete Token' });
    await user.click(confirms[confirms.length - 1]);

    await screen.findByText('Failed to delete token');
    expect(screen.getByText('Work laptop')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-024: cancelling the create-client sheet discards the draft', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(http.post('/api/oauth/clients', () => { posted = true; return HttpResponse.json({}); }));
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'New Client' }));
    await user.type(await screen.findByPlaceholderText(/Claude Web, My MCP App/), 'Draft');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Register OAuth Client')).toBeNull());
    expect(posted).toBe(false);

    // Re-opening resets the form
    await user.click(screen.getByRole('button', { name: 'New Client' }));
    expect(await screen.findByPlaceholderText(/Claude Web, My MCP App/)).toHaveValue('');
  });

  it('FE-MOB-SETMCP-025: cancelling the client confirm sheets performs no request', async () => {
    const user = userEvent.setup();
    let calls = 0;
    seedApi({ clients: [OAUTH_CLIENT], sessions: [SESSION] });
    server.use(
      http.delete('/api/oauth/clients/cl-1', () => { calls += 1; return HttpResponse.json({}); }),
      http.post('/api/oauth/clients/cl-1/rotate', () => { calls += 1; return HttpResponse.json({ client_secret: 'x' }); }),
      http.delete('/api/oauth/sessions/77', () => { calls += 1; return HttpResponse.json({}); }),
    );
    renderScreen();
    await screen.findByText('Claude Web');

    for (const trigger of ['Delete Client', 'Rotate Secret', 'Revoke']) {
      await user.click(screen.getByRole('button', { name: trigger }));
      await user.click(await screen.findByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull());
    }

    expect(calls).toBe(0);
    expect(screen.getByText('Claude Web')).toBeInTheDocument();
    expect(screen.getByText('Claude Desktop')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-026: cancelling the delete-token confirm keeps the token', async () => {
    const user = userEvent.setup();
    let deleted = false;
    seedApi({ tokens: [TOKEN] });
    server.use(http.delete('/api/auth/mcp-tokens/5', () => { deleted = true; return HttpResponse.json({}); }));
    renderScreen();
    await openTokenTab(user);

    await screen.findByText('Work laptop');
    await user.click(screen.getByRole('button', { name: 'Delete Token' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull());
    expect(deleted).toBe(false);
    expect(screen.getByText('Work laptop')).toBeInTheDocument();
  });

  it('FE-MOB-SETMCP-027: the rotated-secret sheet dismisses on Escape', async () => {
    const user = userEvent.setup();
    seedApi({ clients: [OAUTH_CLIENT] });
    server.use(http.post('/api/oauth/clients/cl-1/rotate', () => HttpResponse.json({ client_secret: 'rotated-esc' })));
    renderScreen();

    await screen.findByText('Claude Web');
    await user.click(screen.getByRole('button', { name: 'Rotate Secret' }));
    await user.click(await screen.findByRole('button', { name: 'Rotate' }));
    await screen.findByText('rotated-esc');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('rotated-esc')).toBeNull());
  });

  it('FE-MOB-SETMCP-028: failing list requests leave the empty states in place', async () => {
    server.use(
      http.get('/api/oauth/clients', () => HttpResponse.json({}, { status: 500 })),
      http.get('/api/oauth/sessions', () => HttpResponse.json({}, { status: 500 })),
      http.get('/api/auth/mcp-tokens', () => HttpResponse.json({}, { status: 500 })),
    );
    renderScreen();

    await waitFor(() => expect(screen.getByText('No OAuth clients registered.')).toBeInTheDocument());
    expect(screen.queryByText('Active OAuth Sessions')).toBeNull();
  });
});
