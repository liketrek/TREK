import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Copy, KeyRound, Plus, RefreshCw, Terminal, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import { authApi, oauthApi } from '../../../api/client'
import { ALL_SCOPES } from '../../../api/oauthScopes'
import ScopeGroupPicker from '../../../components/OAuth/ScopeGroupPicker'
import MSheet from '../../components/MSheet'
import MToggle from '../../components/MToggle'
import MChip from '../../components/MChip'
import { MSetCard, MSetEyebrow, MSetInput, MSetTextarea, MSetButton, MSetHint, MSetRow } from './MSettingsUi'
import MConfirmSheet from './MConfirmSheet'
import MSegmented from '../../components/MSegmented'

interface OAuthPreset {
  id: string
  label: string
  name: string
  uris: string
  scopes: string[]
}

const OAUTH_PRESETS: OAuthPreset[] = [
  { id: 'claude-web', label: 'Claude.ai', name: 'Claude.ai', uris: 'https://claude.ai/api/mcp/auth_callback', scopes: ALL_SCOPES.filter((s) => !s.includes(':delete')) },
  { id: 'claude-desktop', label: 'Claude Desktop', name: 'Claude Desktop', uris: 'http://localhost', scopes: ALL_SCOPES.filter((s) => !s.includes(':delete')) },
  { id: 'cursor', label: 'Cursor', name: 'Cursor', uris: 'http://localhost', scopes: ALL_SCOPES.filter((s) => !s.includes(':delete')) },
  { id: 'vscode', label: 'VS Code', name: 'VS Code / Copilot', uris: 'http://localhost', scopes: ALL_SCOPES.filter((s) => s.endsWith(':read')) },
  { id: 'windsurf', label: 'Windsurf', name: 'Windsurf', uris: 'http://localhost', scopes: ALL_SCOPES.filter((s) => !s.includes(':delete')) },
  { id: 'zed', label: 'Zed', name: 'Zed', uris: 'http://localhost', scopes: ALL_SCOPES.filter((s) => !s.includes(':delete')) },
]

interface OAuthClient {
  id: string
  name: string
  client_id: string
  redirect_uris: string[]
  allowed_scopes: string[]
  allows_client_credentials: boolean
  created_at: string
  client_secret?: string // only present on create
}

interface OAuthSession {
  id: number
  client_id: string
  client_name: string
  scopes: string[]
  access_token_expires_at: string
  refresh_token_expires_at: string
  created_at: string
}

interface McpToken {
  id: number
  name: string
  token_prefix: string
  created_at: string
  last_used_at: string | null
}

function CopyButton({ text, copied, onCopy }: { text: string; copied: boolean; onCopy: (text: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onCopy(text)}
      aria-label="Copy"
      className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink"
    >
      {copied ? <Check size={14} className="text-[color:var(--m-st-confirmed)]" /> : <Copy size={14} />}
    </button>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3 font-mono text-[0.625rem] leading-relaxed text-m-ink">
      {children}
    </pre>
  )
}

/**
 * "MCP Configuration" card — IntegrationsTab MCP parity: endpoint, OAuth 2.1
 * clients (create/rotate/delete + active sessions) and the deprecated API
 * tokens, with the desktop modals as floating sheets.
 */
export default function MSettingsMcp() {
  const { t, locale } = useTranslation()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'oauth' | 'apitokens'>('oauth')
  const [configOpenOAuth, setConfigOpenOAuth] = useState(false)
  const [configOpenToken, setConfigOpenToken] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // OAuth clients
  const [clients, setClients] = useState<OAuthClient[]>([])
  const [sessions, setSessions] = useState<OAuthSession[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUris, setNewUris] = useState('')
  const [newScopes, setNewScopes] = useState<string[]>([])
  const [isMachine, setIsMachine] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createdClient, setCreatedClient] = useState<OAuthClient | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [revokeId, setRevokeId] = useState<number | null>(null)
  const [rotateId, setRotateId] = useState<string | null>(null)
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null)
  const [rotating, setRotating] = useState(false)
  const [scopesExpanded, setScopesExpanded] = useState<Record<string, boolean>>({})

  // API tokens (deprecated)
  const [tokens, setTokens] = useState<McpToken[]>([])
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [tokenNewName, setTokenNewName] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [tokenCreating, setTokenCreating] = useState(false)
  const [tokenDeleteId, setTokenDeleteId] = useState<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  useEffect(() => {
    authApi.mcpTokens.list().then((d) => setTokens(d.tokens || [])).catch(() => {})
    oauthApi.clients.list().then((d) => setClients(d.clients || [])).catch(() => {})
    oauthApi.sessions.list().then((d) => setSessions(d.sessions || [])).catch(() => {})
  }, [])

  const mcpEndpoint = `${window.location.origin}/mcp`
  const jsonConfigOAuth = `{
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
}`
  const jsonConfigToken = `{
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
}`

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  const createClient = async () => {
    if (!newName.trim()) return
    if (!isMachine && !newUris.trim()) return
    setCreating(true)
    try {
      const uris = isMachine ? [] : newUris.split('\n').map((u) => u.trim()).filter(Boolean)
      const d = await oauthApi.clients.create({
        name: newName.trim(),
        redirect_uris: uris,
        allowed_scopes: newScopes,
        ...(isMachine ? { allows_client_credentials: true } : {}),
      })
      setCreatedClient(d.client)
      setClients((prev) => [...prev, { ...d.client, client_secret: undefined }])
      setNewName('')
      setNewUris('')
      setNewScopes([])
      setIsMachine(false)
    } catch {
      toast.error(t('settings.oauth.toast.createError'))
    } finally {
      setCreating(false)
    }
  }

  const deleteClient = async (id: string) => {
    try {
      await oauthApi.clients.delete(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
      setDeleteId(null)
      toast.success(t('settings.oauth.toast.deleted'))
    } catch {
      toast.error(t('settings.oauth.toast.deleteError'))
    }
  }

  const rotateSecret = async (id: string) => {
    setRotating(true)
    try {
      const d = await oauthApi.clients.rotate(id)
      setRotatedSecret(d.client_secret)
      setRotateId(null)
    } catch {
      toast.error(t('settings.oauth.toast.rotateError'))
    } finally {
      setRotating(false)
    }
  }

  const revokeSession = async (id: number) => {
    try {
      await oauthApi.sessions.revoke(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      setRevokeId(null)
      toast.success(t('settings.oauth.toast.revoked'))
    } catch {
      toast.error(t('settings.oauth.toast.revokeError'))
    }
  }

  const createToken = async () => {
    if (!tokenNewName.trim()) return
    setTokenCreating(true)
    try {
      const d = await authApi.mcpTokens.create(tokenNewName.trim())
      setCreatedToken(d.token.raw_token)
      setTokenNewName('')
      setTokens((prev) => [
        { id: d.token.id, name: d.token.name, token_prefix: d.token.token_prefix, created_at: d.token.created_at, last_used_at: null },
        ...prev,
      ])
    } catch {
      toast.error(t('settings.mcp.toast.createError'))
    } finally {
      setTokenCreating(false)
    }
  }

  const deleteToken = async (id: number) => {
    try {
      await authApi.mcpTokens.delete(id)
      setTokens((prev) => prev.filter((tk) => tk.id !== id))
      setTokenDeleteId(null)
      toast.success(t('settings.mcp.toast.deleted'))
    } catch {
      toast.error(t('settings.mcp.toast.deleteError'))
    }
  }

  const configToggle = (open: boolean, setOpen: (v: boolean) => void, json: string, copyKey: string, hint: string) => (
    <div className="overflow-hidden rounded-xl border border-[color:var(--m-rowbr)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-[color:var(--m-sheet)] px-3 py-[10px] text-[0.78125rem] font-bold text-m-ink"
      >
        {t('settings.mcp.clientConfig')}
        {open ? <ChevronDown size={14} className="text-m-faint" /> : <ChevronRight size={14} className="text-m-faint" />}
      </button>
      {open && (
        <div className="border-t border-[color:var(--m-rowbr)] p-3">
          <div className="mb-[6px] flex justify-end">
            <MSetButton variant="ghost" onClick={() => handleCopy(json, copyKey)}>
              {copiedKey === copyKey ? <Check size={12} className="text-[color:var(--m-st-confirmed)]" /> : <Copy size={12} />}
              {copiedKey === copyKey ? t('settings.mcp.copied') : t('settings.mcp.copy')}
            </MSetButton>
          </div>
          <CodeBlock>{json}</CodeBlock>
          <MSetHint>{hint}</MSetHint>
        </div>
      )}
    </div>
  )

  return (
    <MSetCard title={t('settings.mcp.title')} icon={Terminal} className="mt-3">
      <MSetEyebrow className="mb-[5px]">{t('settings.mcp.endpoint')}</MSetEyebrow>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] font-mono text-[0.75rem] text-m-ink">
          {mcpEndpoint}
        </code>
        <CopyButton text={mcpEndpoint} copied={copiedKey === 'endpoint'} onCopy={(txt) => handleCopy(txt, 'endpoint')} />
      </div>

      <MSegmented<'oauth' | 'apitokens'>
        className="mt-3"
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: 'oauth', label: t('settings.oauth.clients') },
          { value: 'apitokens', label: t('settings.mcp.apiTokens') },
        ]}
      />

      {activeTab === 'oauth' && (
        <div className="mt-3 flex flex-col gap-3">
          {configToggle(configOpenOAuth, setConfigOpenOAuth, jsonConfigOAuth, 'json-oauth', t('settings.mcp.clientConfigHintOAuth'))}

          <div>
            <MSetHint className="mb-2 mt-0">{t('settings.oauth.clientsHint')}</MSetHint>
            <div className="mb-2 flex justify-end">
              <MSetButton
                onClick={() => {
                  setCreateOpen(true)
                  setCreatedClient(null)
                  setNewName('')
                  setNewUris('')
                  setNewScopes([])
                  setIsMachine(false)
                }}
              >
                <Plus size={13} /> {t('settings.oauth.createClient')}
              </MSetButton>
            </div>

            {clients.length === 0 ? (
              <p className="rounded-xl border border-[color:var(--m-rowbr)] py-3 text-center font-geist text-[0.6875rem] text-m-faint">
                {t('settings.oauth.noClients')}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {clients.map((client) => (
                  <div key={client.id} className="rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
                    <div className="flex items-center gap-2">
                      <KeyRound size={14} className="flex-none text-m-muted" />
                      <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-bold text-m-ink">{client.name}</span>
                      {client.allows_client_credentials && (
                        <span className="flex-none rounded-full bg-[color:var(--m-ic)] px-2 py-[1px] font-geist text-[0.5625rem] font-bold text-m-muted">
                          {t('settings.oauth.badge.machine')}
                        </span>
                      )}
                      <button type="button" onClick={() => setRotateId(client.id)} aria-label={t('settings.oauth.rotateSecret')} className="rounded p-[6px] text-m-muted">
                        <RefreshCw size={14} />
                      </button>
                      <button type="button" onClick={() => setDeleteId(client.id)} aria-label={t('settings.oauth.deleteClient')} className="rounded p-[6px] text-[color:var(--m-st-danger)]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="mt-1 break-all font-mono text-[0.625rem] text-m-faint">
                      {t('settings.oauth.clientId')}: {client.client_id}
                    </p>
                    <p className="mt-[2px] font-geist text-[0.625rem] text-m-faint">
                      {t('settings.mcp.tokenCreatedAt')} {new Date(client.created_at).toLocaleDateString(locale)}
                    </p>
                    <div className="mt-[6px] flex flex-wrap gap-1">
                      {(scopesExpanded[client.id] ? client.allowed_scopes : client.allowed_scopes.slice(0, 5)).map((s) => (
                        <span key={s} className="rounded bg-[color:var(--m-ic)] px-[5px] py-[2px] font-geist text-[0.5625rem] text-m-muted">
                          {s}
                        </span>
                      ))}
                      {client.allowed_scopes.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setScopesExpanded((prev) => ({ ...prev, [client.id]: !prev[client.id] }))}
                          className="rounded border border-[color:var(--m-rowbr)] px-[5px] py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted"
                        >
                          {scopesExpanded[client.id] ? '−' : `+${client.allowed_scopes.length - 5}`}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {sessions.length > 0 && (
            <div>
              <MSetEyebrow className="mb-[5px]">{t('settings.oauth.activeSessions')}</MSetEyebrow>
              <div className="flex flex-col gap-2">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8125rem] font-bold text-m-ink">{session.client_name}</p>
                      <p className="mt-[2px] font-geist text-[0.625rem] text-m-faint">
                        {t('settings.oauth.sessionScopes')}: {session.scopes.join(', ')}
                      </p>
                      <p className="font-geist text-[0.625rem] text-m-faint">
                        {t('settings.oauth.sessionExpires')} {new Date(session.access_token_expires_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <MSetButton variant="danger" onClick={() => setRevokeId(session.id)}>
                      {t('settings.oauth.revoke')}
                    </MSetButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'apitokens' && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3 font-geist text-[0.625rem] leading-relaxed text-[color:var(--m-st-pending)]">
            {t('settings.mcp.apiTokensDeprecated')}
          </p>

          {configToggle(configOpenToken, setConfigOpenToken, jsonConfigToken, 'json-token', t('settings.mcp.clientConfigHint'))}

          <div className="flex justify-end">
            <MSetButton
              variant="ghost"
              onClick={() => {
                setTokenModalOpen(true)
                setCreatedToken(null)
                setTokenNewName('')
              }}
            >
              <Plus size={13} /> {t('settings.mcp.createToken')}
            </MSetButton>
          </div>

          {tokens.length === 0 ? (
            <p className="py-2 text-center font-geist text-[0.6875rem] text-m-faint">{t('settings.mcp.noTokens')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center gap-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-bold text-m-ink">{token.name}</p>
                    <p className="mt-[2px] font-mono text-[0.625rem] text-m-faint">
                      {token.token_prefix}...
                      <span className="ml-2 font-geist">
                        {t('settings.mcp.tokenCreatedAt')} {new Date(token.created_at).toLocaleDateString(locale)}
                      </span>
                      {token.last_used_at && (
                        <span className="ml-1 font-geist">
                          · {t('settings.mcp.tokenUsedAt')} {new Date(token.last_used_at).toLocaleDateString(locale)}
                        </span>
                      )}
                    </p>
                  </div>
                  <button type="button" onClick={() => setTokenDeleteId(token.id)} aria-label={t('settings.mcp.deleteTokenTitle')} className="rounded p-[6px] text-[color:var(--m-st-danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create OAuth client */}
      <MSheet
        open={createOpen}
        onClose={() => {
          if (!createdClient) setCreateOpen(false)
        }}
        variant="card"
        material="opaque"
        ariaLabel={t('settings.oauth.modal.createTitle')}
      >
        <div className="min-h-0 overflow-y-auto p-[18px]">
          {!createdClient ? (
            <>
              <div className="text-[0.9375rem] font-extrabold text-m-ink">{t('settings.oauth.modal.createTitle')}</div>

              <MSetEyebrow className="mb-[6px] mt-3">{t('settings.oauth.modal.presets')}</MSetEyebrow>
              <div className="flex flex-wrap gap-[6px]">
                {OAUTH_PRESETS.map((preset) => (
                  <MChip
                    key={preset.id}
                    onClick={() => {
                      setNewName(preset.name)
                      setNewUris(preset.uris)
                      setNewScopes(preset.scopes)
                    }}
                  >
                    {preset.label}
                  </MChip>
                ))}
              </div>

              <MSetEyebrow className="mb-[5px] mt-3">{t('settings.oauth.modal.clientName')}</MSetEyebrow>
              <MSetInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('settings.oauth.modal.clientNamePlaceholder')} />

              <MSetRow
                label={t('settings.oauth.modal.machineClient')}
                sub={t('settings.oauth.modal.machineClientHint')}
                trailing={<MToggle checked={isMachine} onChange={setIsMachine} ariaLabel={t('settings.oauth.modal.machineClient')} />}
              />

              {!isMachine && (
                <>
                  <MSetEyebrow className="mb-[5px]">{t('settings.oauth.modal.redirectUris')}</MSetEyebrow>
                  <MSetTextarea
                    rows={3}
                    value={newUris}
                    onChange={(e) => setNewUris(e.target.value)}
                    placeholder={t('settings.oauth.modal.redirectUrisPlaceholder')}
                  />
                  <MSetHint>{t('settings.oauth.modal.redirectUrisHint')}</MSetHint>
                </>
              )}

              <MSetEyebrow className="mb-[5px] mt-3">{t('settings.oauth.modal.scopes')}</MSetEyebrow>
              <MSetHint className="mb-2 mt-0">{t('settings.oauth.modal.scopesHint')}</MSetHint>
              <ScopeGroupPicker selected={newScopes} onChange={setNewScopes} />

              <div className="mt-4 flex justify-end gap-2">
                <MSetButton variant="ghost" onClick={() => setCreateOpen(false)}>
                  {t('common.cancel')}
                </MSetButton>
                <MSetButton onClick={createClient} disabled={!newName.trim() || (!isMachine && !newUris.trim()) || creating}>
                  {creating ? t('settings.oauth.modal.creating') : t('settings.oauth.modal.create')}
                </MSetButton>
              </div>
            </>
          ) : (
            <>
              <div className="text-[0.9375rem] font-extrabold text-m-ink">{t('settings.oauth.modal.createdTitle')}</div>
              <p className="mt-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3 font-geist text-[0.625rem] leading-relaxed text-[color:var(--m-st-pending)]">
                {t('settings.oauth.modal.createdWarning')}
              </p>

              <MSetEyebrow className="mb-1 mt-3">{t('settings.oauth.clientId')}</MSetEyebrow>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-xl bg-[color:var(--m-ic)] p-2 font-mono text-[0.6875rem] text-m-ink">
                  {createdClient.client_id}
                </code>
                <CopyButton text={createdClient.client_id} copied={copiedKey === 'new-client-id'} onCopy={(txt) => handleCopy(txt, 'new-client-id')} />
              </div>
              <MSetEyebrow className="mb-1 mt-3">{t('settings.oauth.clientSecret')}</MSetEyebrow>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-xl bg-[color:var(--m-ic)] p-2 font-mono text-[0.6875rem] text-m-ink">
                  {createdClient.client_secret}
                </code>
                <CopyButton text={createdClient.client_secret || ''} copied={copiedKey === 'new-client-secret'} onCopy={(txt) => handleCopy(txt, 'new-client-secret')} />
              </div>

              {createdClient.allows_client_credentials && (
                <p className="mt-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3 font-mono text-[0.625rem] leading-relaxed text-m-muted">
                  {t('settings.oauth.modal.machineClientUsage')}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <MSetButton
                  onClick={() => {
                    setCreateOpen(false)
                    setCreatedClient(null)
                  }}
                >
                  {t('settings.mcp.modal.done')}
                </MSetButton>
              </div>
            </>
          )}
        </div>
      </MSheet>

      {/* Create API token */}
      <MSheet
        open={tokenModalOpen}
        onClose={() => {
          if (!createdToken) setTokenModalOpen(false)
        }}
        variant="card"
        material="opaque"
        ariaLabel={t('settings.mcp.modal.createTitle')}
      >
        <div className="p-[18px]">
          {!createdToken ? (
            <>
              <div className="text-[0.9375rem] font-extrabold text-m-ink">{t('settings.mcp.modal.createTitle')}</div>
              <MSetEyebrow className="mb-[5px] mt-3">{t('settings.mcp.modal.tokenName')}</MSetEyebrow>
              <MSetInput
                autoFocus
                value={tokenNewName}
                onChange={(e) => setTokenNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createToken()}
                placeholder={t('settings.mcp.modal.tokenNamePlaceholder')}
              />
              <div className="mt-4 flex justify-end gap-2">
                <MSetButton variant="ghost" onClick={() => setTokenModalOpen(false)}>
                  {t('common.cancel')}
                </MSetButton>
                <MSetButton onClick={createToken} disabled={!tokenNewName.trim() || tokenCreating}>
                  {tokenCreating ? t('settings.mcp.modal.creating') : t('settings.mcp.modal.create')}
                </MSetButton>
              </div>
            </>
          ) : (
            <>
              <div className="text-[0.9375rem] font-extrabold text-m-ink">{t('settings.mcp.modal.createdTitle')}</div>
              <p className="mt-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3 font-geist text-[0.625rem] leading-relaxed text-[color:var(--m-st-pending)]">
                {t('settings.mcp.modal.createdWarning')}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-xl bg-[color:var(--m-ic)] p-2 font-mono text-[0.6875rem] text-m-ink">
                  {createdToken}
                </code>
                <CopyButton text={createdToken} copied={copiedKey === 'new-token'} onCopy={(txt) => handleCopy(txt, 'new-token')} />
              </div>
              <div className="mt-4 flex justify-end">
                <MSetButton
                  onClick={() => {
                    setTokenModalOpen(false)
                    setCreatedToken(null)
                  }}
                >
                  {t('settings.mcp.modal.done')}
                </MSetButton>
              </div>
            </>
          )}
        </div>
      </MSheet>

      {/* Rotated secret display */}
      <MSheet open={rotatedSecret !== null} onClose={() => setRotatedSecret(null)} variant="card" material="opaque" ariaLabel={t('settings.oauth.rotateSecretDoneTitle')}>
        <div className="p-[18px]">
          <div className="text-[0.9375rem] font-extrabold text-m-ink">{t('settings.oauth.rotateSecretDoneTitle')}</div>
          <p className="mt-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3 font-geist text-[0.625rem] leading-relaxed text-[color:var(--m-st-pending)]">
            {t('settings.oauth.rotateSecretDoneWarning')}
          </p>
          <MSetEyebrow className="mb-1 mt-3">{t('settings.oauth.clientSecret')}</MSetEyebrow>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-xl bg-[color:var(--m-ic)] p-2 font-mono text-[0.6875rem] text-m-ink">
              {rotatedSecret}
            </code>
            <CopyButton text={rotatedSecret || ''} copied={copiedKey === 'rotated-secret'} onCopy={(txt) => handleCopy(txt, 'rotated-secret')} />
          </div>
          <div className="mt-4 flex justify-end">
            <MSetButton onClick={() => setRotatedSecret(null)}>{t('settings.mcp.modal.done')}</MSetButton>
          </div>
        </div>
      </MSheet>

      <MConfirmSheet
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title={t('settings.oauth.deleteClient')}
        message={t('settings.oauth.deleteClientMessage')}
        confirmLabel={t('settings.oauth.deleteClient')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => deleteId && deleteClient(deleteId)}
      />

      <MConfirmSheet
        open={rotateId !== null}
        onClose={() => setRotateId(null)}
        title={t('settings.oauth.rotateSecret')}
        message={t('settings.oauth.rotateSecretMessage')}
        confirmLabel={rotating ? t('settings.oauth.rotateSecretConfirming') : t('settings.oauth.rotateSecretConfirm')}
        cancelLabel={t('common.cancel')}
        busy={rotating}
        onConfirm={() => rotateId && rotateSecret(rotateId)}
      />

      <MConfirmSheet
        open={revokeId !== null}
        onClose={() => setRevokeId(null)}
        title={t('settings.oauth.revokeSession')}
        message={t('settings.oauth.revokeSessionMessage')}
        confirmLabel={t('settings.oauth.revoke')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => revokeId !== null && revokeSession(revokeId)}
      />

      <MConfirmSheet
        open={tokenDeleteId !== null}
        onClose={() => setTokenDeleteId(null)}
        title={t('settings.mcp.deleteTokenTitle')}
        message={t('settings.mcp.deleteTokenMessage')}
        confirmLabel={t('settings.mcp.deleteTokenTitle')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => tokenDeleteId !== null && deleteToken(tokenDeleteId)}
      />
    </MSetCard>
  )
}
