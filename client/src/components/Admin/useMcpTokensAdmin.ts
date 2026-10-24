import { useEffect, useEffectEvent, useState } from 'react';

import { adminApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useToast } from '../shared/Toast';

interface AdminOAuthSession {
  id: number;
  client_id: string;
  client_name: string;
  user_id: number;
  username: string;
  scopes: string[];
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  created_at: string;
}

export interface AdminMcpToken {
  id: number;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  user_id: number;
  username: string;
}

/** How many scope chips a session shows before the "more" toggle. */
export const SCOPES_PREVIEW = 6;

/**
 * The OAuth sessions and long-lived MCP tokens behind both admin shells: both lists load
 * once on mount, a session can be revoked and a token deleted after a confirm step, and a
 * session's scope chips can be expanded. The desktop cards and the phone cards render
 * their own markup over it.
 */
export function useMcpTokensAdmin() {
  const [sessions, setSessions] = useState<AdminOAuthSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [tokens, setTokens] = useState<AdminMcpToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [expandedScopes, setExpandedScopes] = useState<Set<number>>(new Set());
  const [revokeConfirmId, setRevokeConfirmId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const toggleScopes = (id: number) =>
    setExpandedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toast = useToast();
  const { t } = useTranslation();

  // The loader runs once, but a language switch while the requests are in flight must
  // still toast in the current locale, so the error toast reads the latest t.
  const loadError = useEffectEvent((key: string) => toast.error(t(key)));

  useEffect(() => {
    adminApi
      .oauthSessions()
      .then((d) => setSessions(d.sessions || []))
      .catch(() => loadError('admin.oauthSessions.loadError'))
      .finally(() => setSessionsLoading(false));

    adminApi
      .mcpTokens()
      .then((d) => setTokens(d.tokens || []))
      .catch(() => loadError('admin.mcpTokens.loadError'))
      .finally(() => setTokensLoading(false));
  }, []);

  const handleRevoke = async (id: number) => {
    try {
      await adminApi.revokeOAuthSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setRevokeConfirmId(null);
      toast.success(t('admin.oauthSessions.revokeSuccess'));
    } catch {
      toast.error(t('admin.oauthSessions.revokeError'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteMcpToken(id);
      setTokens((prev) => prev.filter((tk) => tk.id !== id));
      setDeleteConfirmId(null);
      toast.success(t('admin.mcpTokens.deleteSuccess'));
    } catch {
      toast.error(t('admin.mcpTokens.deleteError'));
    }
  };

  return {
    sessions,
    sessionsLoading,
    tokens,
    tokensLoading,
    expandedScopes,
    toggleScopes,
    revokeConfirmId,
    setRevokeConfirmId,
    deleteConfirmId,
    setDeleteConfirmId,
    handleRevoke,
    handleDelete,
  };
}
