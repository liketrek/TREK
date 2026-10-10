import { useEffect, useRef, useState } from 'react';
import { authApi, oauthApi } from '../../api/client';
import { PRESET_SCOPES_DEFAULT, PRESET_SCOPES_READONLY } from '../../api/oauthScopes';
import { useTranslation } from '../../i18n';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../shared/Toast';

export interface OAuthPreset {
  id: string;
  label: string;
  name: string;
  uris: string;
  scopes: string[];
}

export const OAUTH_PRESETS: OAuthPreset[] = [
  {
    id: 'claude-web',
    label: 'Claude.ai',
    name: 'Claude.ai',
    uris: 'https://claude.ai/api/mcp/auth_callback',
    scopes: PRESET_SCOPES_DEFAULT,
  },
  {
    id: 'claude-desktop',
    label: 'Claude Desktop',
    name: 'Claude Desktop',
    uris: 'http://localhost',
    scopes: PRESET_SCOPES_DEFAULT,
  },
  { id: 'cursor', label: 'Cursor', name: 'Cursor', uris: 'http://localhost', scopes: PRESET_SCOPES_DEFAULT },
  {
    id: 'vscode',
    label: 'VS Code',
    name: 'VS Code / Copilot',
    uris: 'http://localhost',
    scopes: PRESET_SCOPES_READONLY,
  },
  { id: 'windsurf', label: 'Windsurf', name: 'Windsurf', uris: 'http://localhost', scopes: PRESET_SCOPES_DEFAULT },
  { id: 'zed', label: 'Zed', name: 'Zed', uris: 'http://localhost', scopes: PRESET_SCOPES_DEFAULT },
];

export interface OAuthClient {
  id: string;
  name: string;
  client_id: string;
  redirect_uris: string[];
  allowed_scopes: string[];
  allows_client_credentials: boolean;
  created_at: string;
  client_secret?: string; // only present on create
}

export interface OAuthSession {
  id: number;
  client_id: string;
  client_name: string;
  scopes: string[];
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  created_at: string;
}

export interface McpToken {
  id: number;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export interface McpIntegrationOptions {
  /** Load the tokens, clients and sessions only while this is true (the desktop passes the MCP addon flag). */
  enabled: boolean;
  /**
   * After a client is created or its secret rotated, read the client list back from
   * the server (the phone) instead of appending the new client locally (the desktop).
   */
  reloadClientsAfterWrite: boolean;
}

/**
 * The MCP configuration behind the desktop integrations tab and the phone card:
 * the endpoint and its mcp-remote snippets, the OAuth 2.1 clients with their
 * sessions, the deprecated API tokens, and the copy-to-clipboard tick. Each shell
 * renders its own rows, dialogs and sheets over this.
 */
export function useMcpIntegration({ enabled, reloadClientsAfterWrite }: McpIntegrationOptions) {
  const { t } = useTranslation();
  const toast = useToast();

  // OAuth clients state
  const [oauthClients, setOauthClients] = useState<OAuthClient[]>([]);
  const [oauthSessions, setOauthSessions] = useState<OAuthSession[]>([]);
  const [oauthCreateOpen, setOauthCreateOpen] = useState(false);
  const [oauthNewName, setOauthNewName] = useState('');
  const [oauthNewUris, setOauthNewUris] = useState('');
  const [oauthNewScopes, setOauthNewScopes] = useState<string[]>([]);
  const [oauthCreating, setOauthCreating] = useState(false);
  const [oauthCreatedClient, setOauthCreatedClient] = useState<OAuthClient | null>(null);
  const [oauthDeleteId, setOauthDeleteId] = useState<string | null>(null);
  const [oauthRevokeId, setOauthRevokeId] = useState<number | null>(null);
  const [oauthRotateId, setOauthRotateId] = useState<string | null>(null);
  const [oauthRotatedSecret, setOauthRotatedSecret] = useState<string | null>(null);
  const [oauthRotating, setOauthRotating] = useState(false);
  const [oauthScopesExpanded, setOauthScopesExpanded] = useState<Record<string, boolean>>({});
  const [oauthIsMachine, setOauthIsMachine] = useState(false);

  // MCP sub-tab state
  const [activeMcpTab, setActiveMcpTab] = useState<'oauth' | 'apitokens'>('oauth');
  const [configOpenOAuth, setConfigOpenOAuth] = useState(false);
  const [configOpenToken, setConfigOpenToken] = useState(false);

  // MCP state
  const [mcpTokens, setMcpTokens] = useState<McpToken[]>([]);
  const [mcpModalOpen, setMcpModalOpen] = useState(false);
  const [mcpNewName, setMcpNewName] = useState('');
  const [mcpCreatedToken, setMcpCreatedToken] = useState<string | null>(null);
  const [mcpCreating, setMcpCreating] = useState(false);
  const [mcpDeleteId, setMcpDeleteId] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const mcpEndpoint = `${window.location.origin}/mcp`;
  const mcpJsonConfigOAuth = `{
  "mcpServers": {
    "trek": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${mcpEndpoint}",
        "--static-oauth-client-info",
        "{\\"client_id\\": \\"<your_client_id>\\", \\"client_secret\\": \\"<your_client_secret>\\"}"
      ]
    }
  }
}`;
  const mcpJsonConfig = `{
  "mcpServers": {
    "trek": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${mcpEndpoint}",
        "--header",
        "Authorization: Bearer <your_token>"
      ]
    }
  }
}`;

  // Re-read after create/rotate so the rows show what the server actually stored.
  const reloadClients = () =>
    oauthApi.clients
      .list()
      .then((d) => setOauthClients(d.clients || []))
      .catch(() => {});

  useEffect(() => {
    if (enabled) {
      authApi.mcpTokens
        .list()
        .then((d) => setMcpTokens(d.tokens || []))
        .catch(() => {});
    }
  }, [enabled]);

  const handleCreateMcpToken = async () => {
    if (!mcpNewName.trim()) return;
    setMcpCreating(true);
    try {
      const d = await authApi.mcpTokens.create(mcpNewName.trim());
      setMcpCreatedToken(d.token.raw_token);
      setMcpNewName('');
      setMcpTokens((prev) => [
        {
          id: d.token.id,
          name: d.token.name,
          token_prefix: d.token.token_prefix,
          created_at: d.token.created_at,
          last_used_at: null,
        },
        ...prev,
      ]);
    } catch {
      toast.error(t('settings.mcp.toast.createError'));
    } finally {
      setMcpCreating(false);
    }
  };

  const handleDeleteMcpToken = async (id: number) => {
    try {
      await authApi.mcpTokens.delete(id);
      setMcpTokens((prev) => prev.filter((tk) => tk.id !== id));
      setMcpDeleteId(null);
      toast.success(t('settings.mcp.toast.deleted'));
    } catch {
      toast.error(t('settings.mcp.toast.deleteError'));
    }
  };

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // Load OAuth clients and sessions
  useEffect(() => {
    if (enabled) {
      oauthApi.clients
        .list()
        .then((d) => setOauthClients(d.clients || []))
        .catch(() => {});
      oauthApi.sessions
        .list()
        .then((d) => setOauthSessions(d.sessions || []))
        .catch(() => {});
    }
  }, [enabled]);

  const handleCreateOAuthClient = async () => {
    if (!oauthNewName.trim()) return;
    if (!oauthIsMachine && !oauthNewUris.trim()) return;
    setOauthCreating(true);
    try {
      const uris = oauthIsMachine
        ? []
        : oauthNewUris
            .split('\n')
            .map((u) => u.trim())
            .filter(Boolean);
      const d = await oauthApi.clients.create({
        name: oauthNewName.trim(),
        redirect_uris: uris,
        allowed_scopes: oauthNewScopes,
        ...(oauthIsMachine ? { allows_client_credentials: true } : {}),
      });
      setOauthCreatedClient(d.client);
      if (reloadClientsAfterWrite) await reloadClients();
      else setOauthClients((prev) => [...prev, { ...d.client, client_secret: undefined }]);
      setOauthNewName('');
      setOauthNewUris('');
      setOauthNewScopes([]);
      setOauthIsMachine(false);
    } catch (err) {
      // The server names the rule that refused the client (a scope, the
      // ten-client cap, a redirect URI it will not take); swallowing it left
      // "Failed to register OAuth client" and nothing to act on.
      toast.error(getApiErrorMessage(err, t('settings.oauth.toast.createError')));
    } finally {
      setOauthCreating(false);
    }
  };

  const handleDeleteOAuthClient = async (id: string) => {
    try {
      await oauthApi.clients.delete(id);
      setOauthClients((prev) => prev.filter((c) => c.id !== id));
      setOauthDeleteId(null);
      toast.success(t('settings.oauth.toast.deleted'));
    } catch {
      toast.error(t('settings.oauth.toast.deleteError'));
    }
  };

  const handleRotateSecret = async (id: string) => {
    setOauthRotating(true);
    try {
      const d = await oauthApi.clients.rotate(id);
      setOauthRotatedSecret(d.client_secret);
      setOauthRotateId(null);
      if (reloadClientsAfterWrite) await reloadClients();
    } catch {
      toast.error(t('settings.oauth.toast.rotateError'));
    } finally {
      setOauthRotating(false);
    }
  };

  const handleRevokeSession = async (id: number) => {
    try {
      await oauthApi.sessions.revoke(id);
      setOauthSessions((prev) => prev.filter((s) => s.id !== id));
      setOauthRevokeId(null);
      toast.success(t('settings.oauth.toast.revoked'));
    } catch {
      toast.error(t('settings.oauth.toast.revokeError'));
    }
  };

  return {
    oauthClients,
    oauthSessions,
    oauthCreateOpen,
    setOauthCreateOpen,
    oauthNewName,
    setOauthNewName,
    oauthNewUris,
    setOauthNewUris,
    oauthNewScopes,
    setOauthNewScopes,
    oauthCreating,
    oauthCreatedClient,
    setOauthCreatedClient,
    oauthDeleteId,
    setOauthDeleteId,
    oauthRevokeId,
    setOauthRevokeId,
    oauthRotateId,
    setOauthRotateId,
    oauthRotatedSecret,
    setOauthRotatedSecret,
    oauthRotating,
    oauthScopesExpanded,
    setOauthScopesExpanded,
    oauthIsMachine,
    setOauthIsMachine,
    activeMcpTab,
    setActiveMcpTab,
    configOpenOAuth,
    setConfigOpenOAuth,
    configOpenToken,
    setConfigOpenToken,
    mcpTokens,
    mcpModalOpen,
    setMcpModalOpen,
    mcpNewName,
    setMcpNewName,
    mcpCreatedToken,
    setMcpCreatedToken,
    mcpCreating,
    mcpDeleteId,
    setMcpDeleteId,
    copiedKey,
    mcpEndpoint,
    mcpJsonConfigOAuth,
    mcpJsonConfig,
    handleCreateMcpToken,
    handleDeleteMcpToken,
    handleCopy,
    handleCreateOAuthClient,
    handleDeleteOAuthClient,
    handleRotateSecret,
    handleRevokeSession,
  };
}
