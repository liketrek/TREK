import { useState, useEffect } from 'react'
import { Key, Trash2, User, Loader2, Shield } from 'lucide-react'
import { adminApi } from '../../../api/client'
import { useToast } from '../../../components/shared/Toast'
import { useTranslation } from '../../../i18n'
import { MAdminCard } from './MAdminUi'
import MConfirmSheet from '../settings/MConfirmSheet'

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

// Mobile MCP tokens admin section: OAuth sessions + long-lived MCP tokens, each
// as a card list with loading/empty states, expandable scope chips and a
// delete confirm sheet. Drop-in for the desktop AdminMcpTokensPanel — no props,
// same adminApi calls and state machine, only the presentation is mobile.
export default function MAdminMcpTokensPanel() {
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

  return (
    <div className="space-y-3">
      {/* Section title */}
      <div>
        <div className="text-[0.875rem] font-extrabold text-m-ink">{t('admin.mcpTokens.title')}</div>
        <div className="mt-[2px] font-geist text-[0.625rem] leading-relaxed text-m-muted">
          {t('admin.mcpTokens.subtitle')}
        </div>
      </div>

      {/* OAuth Sessions */}
      <div>
        <div className="mb-2 px-1 font-geist text-[0.625rem] font-bold uppercase tracking-[0.06em] text-m-faint">
          {t('admin.oauthSessions.sectionTitle')}
        </div>
        <MAdminCard>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-m-faint" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Shield className="h-8 w-8 text-m-faint" />
              <p className="font-geist text-[0.6875rem] text-m-muted">{t('admin.oauthSessions.empty')}</p>
            </div>
          ) : (
            sessions.map((session, i) => {
              const expanded = expandedScopes.has(session.id)
              const visible = expanded ? session.scopes : session.scopes.slice(0, SCOPES_PREVIEW)
              const hidden = session.scopes.length - SCOPES_PREVIEW
              return (
                <div
                  key={session.id}
                  className={`flex items-start gap-2 py-[11px] ${i === 0 ? '' : 'border-t border-[color:var(--m-rowbr)]'}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.8125rem] font-bold text-m-ink">{session.client_name}</div>
                    <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-[2px] font-geist text-[0.625rem] text-m-muted">
                      <span className="inline-flex items-center gap-1">
                        <User size={11} strokeWidth={2.2} className="flex-none" />
                        {session.username}
                      </span>
                      <span className="text-m-faint">·</span>
                      <span>{new Date(session.created_at).toLocaleDateString(locale)}</span>
                    </div>
                    <div className="mt-[6px] flex flex-wrap gap-1">
                      {visible.map(scope => (
                        <span
                          key={scope}
                          className="inline-flex items-center rounded-md border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-1.5 py-0.5 font-mono text-[0.5625rem] text-m-muted"
                        >
                          {scope}
                        </span>
                      ))}
                      {!expanded && hidden > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleScopes(session.id)}
                          className="inline-flex items-center rounded-md border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-1.5 py-0.5 font-geist text-[0.5625rem] font-bold text-m-ink"
                        >
                          +{hidden} more
                        </button>
                      )}
                      {expanded && hidden > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleScopes(session.id)}
                          className="inline-flex items-center rounded-md border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-1.5 py-0.5 font-geist text-[0.5625rem] font-bold text-m-ink"
                        >
                          show less
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRevokeConfirmId(session.id)}
                    aria-label={t('common.delete')}
                    title={t('common.delete')}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--m-st-danger)_12%,transparent)] text-[color:var(--m-st-danger)]"
                  >
                    <Trash2 size={14} strokeWidth={2.2} />
                  </button>
                </div>
              )
            })
          )}
        </MAdminCard>
      </div>

      {/* MCP Tokens */}
      <div>
        <div className="mb-2 px-1 font-geist text-[0.625rem] font-bold uppercase tracking-[0.06em] text-m-faint">
          {t('admin.mcpTokens.sectionTitle')}
        </div>
        <MAdminCard>
          {tokensLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-m-faint" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Key className="h-8 w-8 text-m-faint" />
              <p className="font-geist text-[0.6875rem] text-m-muted">{t('admin.mcpTokens.empty')}</p>
            </div>
          ) : (
            tokens.map((token, i) => (
              <div
                key={token.id}
                className={`flex items-start gap-2 py-[11px] ${i === 0 ? '' : 'border-t border-[color:var(--m-rowbr)]'}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.8125rem] font-bold text-m-ink">{token.name}</div>
                  <div className="mt-[2px] font-mono text-[0.625rem] text-m-faint">{token.token_prefix}...</div>
                  <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-[2px] font-geist text-[0.625rem] text-m-muted">
                    <span className="inline-flex items-center gap-1">
                      <User size={11} strokeWidth={2.2} className="flex-none" />
                      {token.username}
                    </span>
                    <span className="text-m-faint">·</span>
                    <span>{new Date(token.created_at).toLocaleDateString(locale)}</span>
                    <span className="text-m-faint">·</span>
                    <span>
                      {token.last_used_at
                        ? new Date(token.last_used_at).toLocaleDateString(locale)
                        : t('admin.mcpTokens.never')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(token.id)}
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--m-st-danger)_12%,transparent)] text-[color:var(--m-st-danger)]"
                >
                  <Trash2 size={14} strokeWidth={2.2} />
                </button>
              </div>
            ))
          )}
        </MAdminCard>
      </div>

      {/* Revoke OAuth session confirm */}
      <MConfirmSheet
        open={revokeConfirmId !== null}
        onClose={() => setRevokeConfirmId(null)}
        title={t('admin.oauthSessions.revokeTitle')}
        message={t('admin.oauthSessions.revokeMessage')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => revokeConfirmId !== null && handleRevoke(revokeConfirmId)}
      />

      {/* Delete MCP token confirm */}
      <MConfirmSheet
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title={t('admin.mcpTokens.deleteTitle')}
        message={t('admin.mcpTokens.deleteMessage')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
      />
    </div>
  )
}
