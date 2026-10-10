// FE-COMP-MCP-HOOK-001 to -012: the MCP configuration logic the desktop tab and the phone card share.
import { act, renderHook, waitFor } from '@testing-library/react';
import { authApi, oauthApi } from '../../api/client';
import { OAUTH_PRESETS, useMcpIntegration, type OAuthClient } from './useMcpIntegration';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k, locale: 'en' }) }));

const CLIENT: OAuthClient = {
  id: 'c1',
  name: 'Claude',
  client_id: 'cid',
  redirect_uris: ['https://x'],
  allowed_scopes: ['trips:read'],
  allows_client_credentials: false,
  created_at: '2026-01-01',
};
const SESSION = {
  id: 7,
  client_id: 'cid',
  client_name: 'Claude',
  scopes: [],
  access_token_expires_at: '',
  refresh_token_expires_at: '',
  created_at: '',
};
const TOKEN = { id: 3, name: 'old', token_prefix: 'trek_', created_at: '2026-01-01', last_used_at: null };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(authApi.mcpTokens, 'list').mockResolvedValue({ tokens: [TOKEN] });
  vi.spyOn(oauthApi.clients, 'list').mockResolvedValue({ clients: [CLIENT] });
  vi.spyOn(oauthApi.sessions, 'list').mockResolvedValue({ sessions: [SESSION] });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function loaded(reloadClientsAfterWrite: boolean) {
  const hook = renderHook(() => useMcpIntegration({ enabled: true, reloadClientsAfterWrite }));
  await waitFor(() => expect(hook.result.current.oauthSessions).toHaveLength(1));
  await waitFor(() => expect(hook.result.current.mcpTokens).toHaveLength(1));
  return hook;
}

describe('useMcpIntegration', () => {
  it('FE-COMP-MCP-HOOK-001: loads nothing while disabled and everything once enabled', async () => {
    const hook = renderHook(({ enabled }) => useMcpIntegration({ enabled, reloadClientsAfterWrite: false }), {
      initialProps: { enabled: false },
    });
    expect(authApi.mcpTokens.list).not.toHaveBeenCalled();
    expect(oauthApi.clients.list).not.toHaveBeenCalled();
    hook.rerender({ enabled: true });
    await waitFor(() => expect(hook.result.current.oauthClients).toEqual([CLIENT]));
    expect(hook.result.current.mcpTokens).toEqual([TOKEN]);
    expect(hook.result.current.oauthSessions).toEqual([SESSION]);
  });

  it('FE-COMP-MCP-HOOK-002: builds the endpoint and both mcp-remote snippets from the origin', () => {
    const { result } = renderHook(() => useMcpIntegration({ enabled: false, reloadClientsAfterWrite: false }));
    const endpoint = `${window.location.origin}/mcp`;
    expect(result.current.mcpEndpoint).toBe(endpoint);
    expect(JSON.parse(result.current.mcpJsonConfig).mcpServers.trek.args).toEqual([
      'mcp-remote',
      endpoint,
      '--header',
      'Authorization: Bearer <your_token>',
    ]);
    expect(JSON.parse(result.current.mcpJsonConfigOAuth).mcpServers.trek.args[2]).toBe('--static-oauth-client-info');
    expect(OAUTH_PRESETS.map((p) => p.id)).toEqual([
      'claude-web',
      'claude-desktop',
      'cursor',
      'vscode',
      'windsurf',
      'zed',
    ]);
  });

  it('FE-COMP-MCP-HOOK-003: a client needs a name and, unless it is a machine client, redirect URIs', async () => {
    const create = vi.spyOn(oauthApi.clients, 'create');
    const { result } = await loaded(false);
    act(() => result.current.setOauthNewName('A'));
    await act(() => result.current.handleCreateOAuthClient());
    expect(create).not.toHaveBeenCalled();
  });

  it('FE-COMP-MCP-HOOK-004: the desktop appends the created client locally without its secret and resets the form', async () => {
    const created = { ...CLIENT, id: 'c2', client_secret: 's3cret' };
    vi.spyOn(oauthApi.clients, 'create').mockResolvedValue({ client: created });
    const { result } = await loaded(false);
    act(() => result.current.setOauthNewName(' New '));
    act(() => result.current.setOauthNewUris('https://a\n\n https://b '));
    act(() => result.current.setOauthNewScopes(['trips:read']));
    vi.mocked(oauthApi.clients.list).mockClear();
    await act(() => result.current.handleCreateOAuthClient());
    expect(oauthApi.clients.create).toHaveBeenCalledWith({
      name: 'New',
      redirect_uris: ['https://a', 'https://b'],
      allowed_scopes: ['trips:read'],
    });
    expect(result.current.oauthCreatedClient).toEqual(created);
    expect(result.current.oauthClients).toEqual([CLIENT, { ...created, client_secret: undefined }]);
    expect(oauthApi.clients.list).not.toHaveBeenCalled();
    expect(result.current.oauthNewName).toBe('');
    expect(result.current.oauthNewUris).toBe('');
    expect(result.current.oauthNewScopes).toEqual([]);
  });

  it('FE-COMP-MCP-HOOK-005: the phone reads the clients back after a create, and a machine client sends no URIs', async () => {
    const created = { ...CLIENT, id: 'c2', client_secret: 's' };
    vi.spyOn(oauthApi.clients, 'create').mockResolvedValue({ client: created });
    const { result } = await loaded(true);
    vi.mocked(oauthApi.clients.list).mockResolvedValue({ clients: [CLIENT, { ...created, client_secret: undefined }] });
    act(() => result.current.setOauthNewName('Bot'));
    act(() => result.current.setOauthIsMachine(true));
    await act(() => result.current.handleCreateOAuthClient());
    expect(oauthApi.clients.create).toHaveBeenCalledWith({
      name: 'Bot',
      redirect_uris: [],
      allowed_scopes: [],
      allows_client_credentials: true,
    });
    expect(oauthApi.clients.list).toHaveBeenCalledTimes(2);
    expect(result.current.oauthClients).toHaveLength(2);
    expect(result.current.oauthIsMachine).toBe(false);
  });

  it('FE-COMP-MCP-HOOK-006: a refused create toasts the server reason', async () => {
    vi.spyOn(oauthApi.clients, 'create').mockRejectedValue({ response: { data: { error: 'Too many clients' } } });
    const { result } = await loaded(false);
    act(() => result.current.setOauthNewName('A'));
    act(() => result.current.setOauthNewUris('https://a'));
    await act(() => result.current.handleCreateOAuthClient());
    expect(toast.error).toHaveBeenCalledWith('Too many clients');
    expect(result.current.oauthCreating).toBe(false);
  });

  it('FE-COMP-MCP-HOOK-007: rotating shows the new secret and only the phone reads the clients back', async () => {
    vi.spyOn(oauthApi.clients, 'rotate').mockResolvedValue({ client_secret: 'fresh' });
    const desktop = await loaded(false);
    vi.mocked(oauthApi.clients.list).mockClear();
    act(() => desktop.result.current.setOauthRotateId('c1'));
    await act(() => desktop.result.current.handleRotateSecret('c1'));
    expect(desktop.result.current.oauthRotatedSecret).toBe('fresh');
    expect(desktop.result.current.oauthRotateId).toBeNull();
    expect(oauthApi.clients.list).not.toHaveBeenCalled();
    const phone = await loaded(true);
    vi.mocked(oauthApi.clients.list).mockClear();
    await act(() => phone.result.current.handleRotateSecret('c1'));
    expect(oauthApi.clients.list).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-MCP-HOOK-008: a failed rotate toasts and clears the busy flag', async () => {
    vi.spyOn(oauthApi.clients, 'rotate').mockRejectedValue(new Error('x'));
    const { result } = await loaded(true);
    await act(() => result.current.handleRotateSecret('c1'));
    expect(toast.error).toHaveBeenCalledWith('settings.oauth.toast.rotateError');
    expect(result.current.oauthRotating).toBe(false);
  });

  it('FE-COMP-MCP-HOOK-009: deleting a client and revoking a session drop the row and close the confirm', async () => {
    vi.spyOn(oauthApi.clients, 'delete').mockResolvedValue({});
    vi.spyOn(oauthApi.sessions, 'revoke').mockResolvedValue({});
    const { result } = await loaded(false);
    act(() => result.current.setOauthDeleteId('c1'));
    await act(() => result.current.handleDeleteOAuthClient('c1'));
    expect(result.current.oauthClients).toEqual([]);
    expect(result.current.oauthDeleteId).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('settings.oauth.toast.deleted');
    act(() => result.current.setOauthRevokeId(7));
    await act(() => result.current.handleRevokeSession(7));
    expect(result.current.oauthSessions).toEqual([]);
    expect(result.current.oauthRevokeId).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('settings.oauth.toast.revoked');
  });

  it('FE-COMP-MCP-HOOK-010: failed client and session removals keep the rows and toast', async () => {
    vi.spyOn(oauthApi.clients, 'delete').mockRejectedValue(new Error('x'));
    vi.spyOn(oauthApi.sessions, 'revoke').mockRejectedValue(new Error('x'));
    const { result } = await loaded(false);
    await act(() => result.current.handleDeleteOAuthClient('c1'));
    await act(() => result.current.handleRevokeSession(7));
    expect(result.current.oauthClients).toEqual([CLIENT]);
    expect(result.current.oauthSessions).toEqual([SESSION]);
    expect(toast.error).toHaveBeenCalledWith('settings.oauth.toast.deleteError');
    expect(toast.error).toHaveBeenCalledWith('settings.oauth.toast.revokeError');
  });

  it('FE-COMP-MCP-HOOK-011: API tokens are created at the top of the list and deleted by id', async () => {
    vi.spyOn(authApi.mcpTokens, 'create').mockResolvedValue({
      token: { id: 9, name: 'new', token_prefix: 'trek_n', created_at: '2026-02-02', raw_token: 'raw' },
    });
    vi.spyOn(authApi.mcpTokens, 'delete').mockResolvedValue({});
    const { result } = await loaded(false);
    await act(() => result.current.handleCreateMcpToken());
    expect(authApi.mcpTokens.create).not.toHaveBeenCalled();
    act(() => result.current.setMcpNewName(' new '));
    await act(() => result.current.handleCreateMcpToken());
    expect(authApi.mcpTokens.create).toHaveBeenCalledWith('new');
    expect(result.current.mcpCreatedToken).toBe('raw');
    expect(result.current.mcpTokens.map((tk) => tk.id)).toEqual([9, 3]);
    expect(result.current.mcpNewName).toBe('');
    await act(() => result.current.handleDeleteMcpToken(3));
    expect(result.current.mcpTokens.map((tk) => tk.id)).toEqual([9]);
    expect(toast.success).toHaveBeenCalledWith('settings.mcp.toast.deleted');
  });

  it('FE-COMP-MCP-HOOK-012: a copy ticks its key for two seconds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { result } = await loaded(false);
    vi.useFakeTimers();
    await act(async () => {
      result.current.handleCopy('abc', 'endpoint');
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('abc');
    expect(result.current.copiedKey).toBe('endpoint');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copiedKey).toBeNull();
  });
});
