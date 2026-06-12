import React, { useEffect, useState } from 'react'
import { Fingerprint, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { startRegistration } from '@simplewebauthn/browser'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { authApi, type PasskeyCredential } from '../../api/client'
import { getApiErrorMessage } from '../../types'

/** Parse a SQLite UTC timestamp ("YYYY-MM-DD HH:MM:SS") into a local date string. */
function fmtDate(ts: string | null): string | null {
  if (!ts) return null
  const iso = ts.includes('T') ? ts : ts.replace(' ', 'T')
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString()
}

/** True when the browser cancellation / no-matching-credential DOMExceptions fire. */
function isWebauthnAbort(err: unknown): boolean {
  const name = (err as { name?: string })?.name
  return name === 'NotAllowedError' || name === 'AbortError'
}

/**
 * Passkey enrolment + management. Mirrors the MFA block: list / add (with a
 * password step-up + the WebAuthn ceremony) / rename / delete (password step-up).
 * The "Add a passkey" action only appears when the instance toggle is on AND a
 * usable RP ID resolves; the existing-credential list stays reachable even when
 * the feature is later disabled so users can always clean up.
 */
export default function PasskeysSection({ demoMode }: { demoMode?: boolean }): React.ReactElement | null {
  const { t } = useTranslation()
  const toast = useToast()

  const [enabled, setEnabled] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [creds, setCreds] = useState<PasskeyCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addPwd, setAddPwd] = useState('')
  const [addName, setAddName] = useState('')

  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameVal, setRenameVal] = useState('')

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deletePwd, setDeletePwd] = useState('')

  const refresh = () => {
    authApi.passkey.list()
      .then(r => setCreds(r.credentials))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    authApi.getAppConfig?.()
      .then(c => { setEnabled(!!c?.passkey_login); setConfigured(!!c?.passkey_configured) })
      .catch(() => {})
    refresh()
  }, [])

  const canAdd = enabled && configured

  const handleAdd = async () => {
    if (!addPwd) { toast.error(t('settings.passkey.passwordRequired')); return }
    setBusy(true)
    try {
      const options = await authApi.passkey.registerOptions(addPwd)
      const attResp = await startRegistration({ optionsJSON: options })
      await authApi.passkey.registerVerify(attResp, addName.trim() || undefined)
      toast.success(t('settings.passkey.addedToast'))
      setAddOpen(false); setAddPwd(''); setAddName('')
      refresh()
    } catch (err: unknown) {
      if (isWebauthnAbort(err)) toast.error(t('settings.passkey.cancelled'))
      else toast.error(getApiErrorMessage(err, t('settings.passkey.addError')))
    } finally {
      setBusy(false)
    }
  }

  const handleRename = async (id: number) => {
    const name = renameVal.trim()
    if (!name) { setRenamingId(null); return }
    try {
      await authApi.passkey.rename(id, name)
      setRenamingId(null)
      refresh()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }

  const handleDelete = async (id: number) => {
    if (!deletePwd) { toast.error(t('settings.passkey.passwordRequired')); return }
    setBusy(true)
    try {
      await authApi.passkey.delete(id, deletePwd)
      toast.success(t('settings.passkey.deleted'))
      setDeletingId(null); setDeletePwd('')
      refresh()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setBusy(false)
    }
  }

  if (demoMode) return null
  // Nothing to show: feature off and the user has no credentials to manage.
  if (!loading && !enabled && creds.length === 0) return null

  return (
    <div className="pt-4 mt-4 border-t border-edge-secondary">
      <div className="flex items-center gap-2 mb-3">
        <Fingerprint className="w-5 h-5 text-content-secondary" />
        <h3 className="font-semibold text-base m-0 text-content">{t('settings.passkey.title')}</h3>
      </div>
      <div className="space-y-3">
        <p className="text-sm m-0 text-content-muted" style={{ lineHeight: 1.5 }}>{t('settings.passkey.description')}</p>

        {enabled && !configured && (
          <p className="text-sm m-0 text-amber-700">{t('settings.passkey.notConfigured')}</p>
        )}

        {creds.length > 0 && (
          <ul className="space-y-2 list-none p-0 m-0">
            {creds.map(c => (
              <li key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-edge bg-surface-card">
                <Fingerprint className="w-4 h-4 flex-shrink-0 text-content-secondary" />
                <div className="flex-1 min-w-0">
                  {renamingId === c.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(c.id); if (e.key === 'Escape') setRenamingId(null) }}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                      />
                      <button type="button" onClick={() => handleRename(c.id)} className="p-1 text-emerald-600" aria-label={t('common.save')}><Check size={16} /></button>
                      <button type="button" onClick={() => setRenamingId(null)} className="p-1 text-content-muted" aria-label={t('common.cancel')}><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-content truncate">{c.name || t('settings.passkey.defaultName')}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-hover text-content-secondary">
                          {c.backed_up ? t('settings.passkey.synced') : t('settings.passkey.deviceBound')}
                        </span>
                      </div>
                      <p className="text-xs m-0 mt-0.5 text-content-faint">
                        {t('settings.passkey.added')}: {fmtDate(c.created_at) || '—'}
                        {' · '}
                        {c.last_used_at
                          ? `${t('settings.passkey.lastUsed')}: ${fmtDate(c.last_used_at)}`
                          : t('settings.passkey.neverUsed')}
                      </p>
                    </>
                  )}
                </div>
                {renamingId !== c.id && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => { setRenamingId(c.id); setRenameVal(c.name || '') }}
                      className="p-1.5 rounded text-content-muted hover:text-content"
                      aria-label={t('settings.passkey.rename')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDeletingId(c.id); setDeletePwd('') }}
                      className="p-1.5 rounded text-red-500 hover:bg-red-50"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Delete confirmation (password step-up) */}
        {deletingId !== null && (
          <div className="space-y-2 p-3 rounded-lg border border-red-200 bg-red-50/40">
            <p className="text-sm font-medium m-0 text-content">{t('settings.passkey.deleteConfirm')}</p>
            <input
              type="password"
              value={deletePwd}
              onChange={e => setDeletePwd(e.target.value)}
              placeholder={t('settings.currentPassword')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !deletePwd}
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                {t('common.delete')}
              </button>
              <button
                type="button"
                onClick={() => { setDeletingId(null); setDeletePwd('') }}
                className="px-4 py-2 rounded-lg text-sm border border-edge text-content-secondary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Add a passkey */}
        {canAdd && (addOpen ? (
          <div className="space-y-2 p-3 rounded-lg border border-edge bg-surface-hover">
            <p className="text-sm font-medium m-0 text-content">{t('settings.passkey.addTitle')}</p>
            <p className="text-xs m-0 text-content-muted">{t('settings.passkey.passwordPrompt')}</p>
            <input
              type="password"
              value={addPwd}
              onChange={e => setAddPwd(e.target.value)}
              placeholder={t('settings.currentPassword')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder={t('settings.passkey.namePlaceholder')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !addPwd}
                onClick={handleAdd}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50"
              >
                {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('settings.passkey.add')}
              </button>
              <button
                type="button"
                onClick={() => { setAddOpen(false); setAddPwd(''); setAddName('') }}
                className="px-4 py-2 rounded-lg text-sm border border-edge text-content-secondary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-edge bg-surface-card text-content"
          >
            <Plus size={14} />
            {t('settings.passkey.add')}
          </button>
        ))}
      </div>
    </div>
  )
}
