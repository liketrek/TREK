import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminApi } from '../../api/client';
import { useMcpTokensAdmin } from './useMcpTokensAdmin';

// FE-HOOK-MCPADMIN-001 to FE-HOOK-MCPADMIN-008

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const i18n = vi.hoisted(() => ({ prefix: '' }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
// Each render's t keeps the prefix it was made with, like a real locale switch.
vi.mock('../../i18n', () => ({
  useTranslation: () => {
    const prefix = i18n.prefix;
    return { t: (k: string) => `${prefix}${k}` };
  },
}));

const SESSION = {
  id: 11,
  client_id: 'c',
  client_name: 'Claude',
  user_id: 1,
  username: 'alice',
  scopes: ['trips:read'],
  access_token_expires_at: '2026-01-01',
  refresh_token_expires_at: '2026-02-01',
  created_at: '2025-01-01',
};
const TOKEN = {
  id: 21,
  name: 'cli',
  token_prefix: 'trek_ab',
  created_at: '2025-01-01',
  last_used_at: null,
  user_id: 1,
  username: 'alice',
};

beforeEach(() => {
  i18n.prefix = '';
  toast.success.mockReset();
  toast.error.mockReset();
  vi.spyOn(adminApi, 'oauthSessions').mockResolvedValue({ sessions: [SESSION] });
  vi.spyOn(adminApi, 'mcpTokens').mockResolvedValue({ tokens: [TOKEN] });
  vi.spyOn(adminApi, 'revokeOAuthSession').mockResolvedValue({ success: true });
  vi.spyOn(adminApi, 'deleteMcpToken').mockResolvedValue({ success: true });
});
afterEach(() => vi.restoreAllMocks());

async function loaded() {
  const hook = renderHook(() => useMcpTokensAdmin());
  await waitFor(() => {
    expect(hook.result.current.sessionsLoading).toBe(false);
    expect(hook.result.current.tokensLoading).toBe(false);
  });
  return hook;
}

describe('useMcpTokensAdmin', () => {
  it('FE-HOOK-MCPADMIN-001: loads sessions and tokens once on mount', async () => {
    const { result, rerender } = await loaded();
    rerender();
    expect(adminApi.oauthSessions).toHaveBeenCalledTimes(1);
    expect(adminApi.mcpTokens).toHaveBeenCalledTimes(1);
    expect(result.current.sessions).toEqual([SESSION]);
    expect(result.current.tokens).toEqual([TOKEN]);
  });

  it('FE-HOOK-MCPADMIN-002: missing lists read as empty', async () => {
    vi.mocked(adminApi.oauthSessions).mockResolvedValue({});
    vi.mocked(adminApi.mcpTokens).mockResolvedValue({});
    const { result } = await loaded();
    expect(result.current.sessions).toEqual([]);
    expect(result.current.tokens).toEqual([]);
  });

  it('FE-HOOK-MCPADMIN-003: each failed list toasts its own error, in the locale current when it fails', async () => {
    let failSessions!: (e: unknown) => void;
    vi.mocked(adminApi.oauthSessions).mockReturnValue(new Promise((_, reject) => (failSessions = reject)));
    vi.mocked(adminApi.mcpTokens).mockRejectedValue(new Error('down'));
    const { result, rerender } = renderHook(() => useMcpTokensAdmin());
    await waitFor(() => expect(result.current.tokensLoading).toBe(false));
    expect(toast.error).toHaveBeenCalledWith('admin.mcpTokens.loadError');
    i18n.prefix = 'de:';
    rerender();
    await act(async () => failSessions(new Error('down')));
    await waitFor(() => expect(result.current.sessionsLoading).toBe(false));
    expect(toast.error).toHaveBeenCalledWith('de:admin.oauthSessions.loadError');
  });

  it('FE-HOOK-MCPADMIN-004: toggling scopes expands and collapses one session', async () => {
    const { result } = await loaded();
    act(() => result.current.toggleScopes(11));
    expect(result.current.expandedScopes.has(11)).toBe(true);
    act(() => result.current.toggleScopes(11));
    expect(result.current.expandedScopes.has(11)).toBe(false);
  });

  it('FE-HOOK-MCPADMIN-005: revoke drops the session, closes the confirm and toasts', async () => {
    const { result } = await loaded();
    act(() => result.current.setRevokeConfirmId(11));
    await act(() => result.current.handleRevoke(11));
    expect(adminApi.revokeOAuthSession).toHaveBeenCalledWith(11);
    expect(result.current.sessions).toEqual([]);
    expect(result.current.revokeConfirmId).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('admin.oauthSessions.revokeSuccess');
  });

  it('FE-HOOK-MCPADMIN-006: a failed revoke keeps the session and the confirm open', async () => {
    vi.mocked(adminApi.revokeOAuthSession).mockRejectedValue(new Error('nope'));
    const { result } = await loaded();
    act(() => result.current.setRevokeConfirmId(11));
    await act(() => result.current.handleRevoke(11));
    expect(result.current.sessions).toEqual([SESSION]);
    expect(result.current.revokeConfirmId).toBe(11);
    expect(toast.error).toHaveBeenCalledWith('admin.oauthSessions.revokeError');
  });

  it('FE-HOOK-MCPADMIN-007: delete drops the token, closes the confirm and toasts', async () => {
    const { result } = await loaded();
    act(() => result.current.setDeleteConfirmId(21));
    await act(() => result.current.handleDelete(21));
    expect(adminApi.deleteMcpToken).toHaveBeenCalledWith(21);
    expect(result.current.tokens).toEqual([]);
    expect(result.current.deleteConfirmId).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('admin.mcpTokens.deleteSuccess');
  });

  it('FE-HOOK-MCPADMIN-008: a failed delete keeps the token and the confirm open', async () => {
    vi.mocked(adminApi.deleteMcpToken).mockRejectedValue(new Error('nope'));
    const { result } = await loaded();
    act(() => result.current.setDeleteConfirmId(21));
    await act(() => result.current.handleDelete(21));
    expect(result.current.tokens).toEqual([TOKEN]);
    expect(result.current.deleteConfirmId).toBe(21);
    expect(toast.error).toHaveBeenCalledWith('admin.mcpTokens.deleteError');
  });
});
