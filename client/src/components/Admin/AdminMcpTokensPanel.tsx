import { useState, useEffect, type ReactNode } from 'react'
import { adminApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { Key, Trash2, User, Loader2, Shield, KeyRound, Bot } from 'lucide-react'
import { useTranslation } from '../../i18n'
import ConfirmDialog from '../shared/ConfirmDialog'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
import { SETTINGS_ICON_BUTTON, SettingRows, SettingsCard, SettingsHint, StatusPill } from '../Settings/settingsKit'

interface AdminOAuthSession {
  id: number
  client_id: string
  client_name: string
  user_id: number
  username: string
  scopes: string[]
  access_token_expires_at: string
  refresh_token_expires_at: string
  created_at: string
}

interface AdminMcpToken {
  id: number
  name: string
  token_prefix: string
  created_at: string
  last_used_at: string | null
  user_id: number
  username: string
}

const SCOPES_PREVIEW = 6

const ROW = 'flex flex-wrap items-center gap-x-4 gap-y-2 px-3.5 py-3'
const TILE = 'grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary'
const CHIP = 'inline-flex items-center rounded-full border border-edge-faint bg-surface-secondary px-2 py-[1px] font-geist text-content-muted'

/** The spinner or the empty line a list shows in place of its rows. */
function ListState({ loading, icon, text }: { loading: boolean; icon: ReactNode; text: string }) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={18} className="animate-spin text-content-faint" />
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-content-faint">
      {icon}
      <SettingsHint>{text}</SettingsHint>
    </div>
  )
}

/** One fact on the right of a row: an eyebrow over its value. */
function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 text-right">
      <div className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>{label}</div>
      <div className="whitespace-nowrap font-geist tabular-nums text-content-muted" style={fs(12, 'body')}>{children}</div>
    </div>
  )
}

/** The owner of a session or token, with the person glyph in front. */
function Owner({ name }: { name: string }) {
  return (
    <span className="inline-flex min-w-0 max-w-[180px] items-center gap-1.5 text-content-secondary" style={fs(12.5, 'body')}>
      <User size={13} className="flex-none text-content-faint" />
      <span className="truncate">{name}</span>
    </span>
  )
}

/** The trash button of a row, named by its tooltip. */
function DeleteAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Tooltip label={label} placement="left">
      <button type="button" onClick={onClick} aria-label={label} className={`${SETTINGS_ICON_BUTTON} hover:text-danger`}>
        <Trash2 size={14} />
      </button>
    </Tooltip>
  )
}

export default function AdminMcpTokensPanel() {
  const [sessions, setSessions] = useState<AdminOAuthSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [tokens, setTokens] = useState<AdminMcpToken[]>([])
  const [tokensLoading, setTokensLoading] = useState(true)
  const [expandedScopes, setExpandedScopes] = useState<Set<number>>(new Set())
  const [revokeConfirmId, setRevokeConfirmId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const toggleScopes = (id: number) =>
    setExpandedScopes(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const toast = useToast()
  const { t, locale } = useTranslation()

  useEffect(() => {
    adminApi.oauthSessions()
      .then(d => setSessions(d.sessions || []))
      .catch(() => toast.error(t('admin.oauthSessions.loadError')))
      .finally(() => setSessionsLoading(false))

    adminApi.mcpTokens()
      .then(d => setTokens(d.tokens || []))
      .catch(() => toast.error(t('admin.mcpTokens.loadError')))
      .finally(() => setTokensLoading(false))
  }, [])

  const handleRevoke = async (id: number) => {
    try {
      await adminApi.revokeOAuthSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      setRevokeConfirmId(null)
      toast.success(t('admin.oauthSessions.revokeSuccess'))
    } catch {
      toast.error(t('admin.oauthSessions.revokeError'))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteMcpToken(id)
      setTokens(prev => prev.filter(tk => tk.id !== id))
      setDeleteConfirmId(null)
      toast.success(t('admin.mcpTokens.deleteSuccess'))
    } catch {
      toast.error(t('admin.mcpTokens.deleteError'))
    }
  }

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale)

  return (
    <div>
      {/* OAuth Sessions. The tab's own subtitle sits in its band: the sidebar
          already names the tab, so a bare heading over the cards only repeated it. */}
      <SettingsCard
        icon={Bot}
        title={t('admin.oauthSessions.sectionTitle')}
        hint={t('admin.mcpTokens.subtitle')}
        badge={!sessionsLoading && sessions.length > 0 ? <StatusPill>{sessions.length}</StatusPill> : undefined}
      >
        {sessionsLoading || sessions.length === 0 ? (
          <ListState loading={sessionsLoading} icon={<Shield size={24} strokeWidth={1.6} />} text={t('admin.oauthSessions.empty')} />
        ) : (
          <SettingRows>
            {sessions.map(session => {
              const expanded = expandedScopes.has(session.id)
              const visible = expanded ? session.scopes : session.scopes.slice(0, SCOPES_PREVIEW)
              const hidden = session.scopes.length - SCOPES_PREVIEW
              return (
                <div key={session.id} className={`${ROW} items-start`}>
                  <span className={TILE}><Bot size={16} strokeWidth={1.9} /></span>
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="m-0 truncate font-semibold text-content" style={fs(13, 'body')}>{session.client_name}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1" style={fs(11)}>
                      {visible.map(scope => (
                        <span key={scope} className={CHIP}>{scope}</span>
                      ))}
                      {hidden > 0 && (
                        <button type="button" onClick={() => toggleScopes(session.id)}
                          className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-[1px] font-semibold text-content-secondary hover:text-content">
                          {expanded ? 'show less' : `+${hidden} more`}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-4 pt-0.5">
                    <Owner name={session.username} />
                    <Meta label={t('admin.oauthSessions.created')}>{date(session.created_at)}</Meta>
                    <DeleteAction label={t('common.delete')} onClick={() => setRevokeConfirmId(session.id)} />
                  </div>
                </div>
              )
            })}
          </SettingRows>
        )}
      </SettingsCard>

      {/* MCP Tokens */}
      <SettingsCard
        icon={KeyRound}
        title={t('admin.mcpTokens.sectionTitle')}
        badge={!tokensLoading && tokens.length > 0 ? <StatusPill>{tokens.length}</StatusPill> : undefined}
      >
        {tokensLoading || tokens.length === 0 ? (
          <ListState loading={tokensLoading} icon={<Key size={24} strokeWidth={1.6} />} text={t('admin.mcpTokens.empty')} />
        ) : (
          <SettingRows>
            {tokens.map(token => (
              <div key={token.id} className={ROW}>
                <span className={TILE}><KeyRound size={16} strokeWidth={1.9} /></span>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="m-0 truncate font-semibold text-content" style={fs(13, 'body')}>{token.name}</p>
                  <p className="m-0 mt-0.5 truncate font-geist text-content-faint" style={fs(11)}>{token.token_prefix}...</p>
                </div>
                <div className="flex flex-none items-center gap-4">
                  <Owner name={token.username} />
                  <Meta label={t('admin.mcpTokens.created')}>{date(token.created_at)}</Meta>
                  <Meta label={t('admin.mcpTokens.lastUsed')}>
                    {token.last_used_at ? date(token.last_used_at) : t('admin.mcpTokens.never')}
                  </Meta>
                  <DeleteAction label={t('common.delete')} onClick={() => setDeleteConfirmId(token.id)} />
                </div>
              </div>
            ))}
          </SettingRows>
        )}
      </SettingsCard>

      {/* Revoke OAuth session */}
      <ConfirmDialog
        isOpen={revokeConfirmId !== null}
        onClose={() => setRevokeConfirmId(null)}
        onConfirm={() => { if (revokeConfirmId !== null) void handleRevoke(revokeConfirmId) }}
        title={t('admin.oauthSessions.revokeTitle')}
        message={t('admin.oauthSessions.revokeMessage')}
        confirmLabel={t('common.delete')}
        danger
      />

      {/* Delete MCP token */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { if (deleteConfirmId !== null) void handleDelete(deleteConfirmId) }}
        title={t('admin.mcpTokens.deleteTitle')}
        message={t('admin.mcpTokens.deleteMessage')}
        confirmLabel={t('common.delete')}
        danger
      />
    </div>
  )
}
