import React, { useEffect, useState } from 'react'
import { Fingerprint, Plus, Trash2, Pencil, Check, X, AlertTriangle } from 'lucide-react'
import { startRegistration } from '@simplewebauthn/browser'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { authApi, type PasskeyCredential } from '../../api/client'
import { getApiErrorMessage } from '../../types'
import Section from './Section'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
import { GRID_2, INPUT, PANEL } from '../shared/dialogParts'
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON, SettingsHint, StatusPill } from './settingsKit'

/** The step-up's final answer: the danger fill, white on red like ConfirmDialog's. */
const DANGER_FILL = 'inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-danger px-4 py-2 font-medium text-white hover:opacity-90 disabled:cursor-default disabled:opacity-50' // theme-lint-disable: white on the danger fill, as ConfirmDialog draws it

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

  // Both step-up flows are gated by disabled={busy || !pwd} on their submit button,
  // so the password is always present by the time these run.
  const handleAdd = async () => {
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
    <Section
      title={t('settings.passkey.title')}
      icon={Fingerprint}
      badge={creds.length > 0 ? <StatusPill>{creds.length}</StatusPill> : undefined}
      // The way in sits on the band, like the planner's "add" actions; the step-up opens in the body.
      action={canAdd && !addOpen ? (
        <button type="button" onClick={() => setAddOpen(true)} className={SETTINGS_BUTTON} style={fs(12.5, 'body')}>
          <Plus size={14} />
          {t('settings.passkey.add')}
        </button>
      ) : undefined}
    >
      <SettingsHint>{t('settings.passkey.description')}</SettingsHint>

      {enabled && !configured && (
        <div className="flex gap-2.5 rounded-[12px] bg-warning-soft px-3.5 py-2.5 text-content" style={fs(12.5, 'body')}>
          <AlertTriangle size={15} className="mt-px flex-none text-warning" />
          <p className="m-0 leading-snug">{t('settings.passkey.notConfigured')}</p>
        </div>
      )}

      {creds.length > 0 && (
        <ul className="m-0 list-none divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card p-0">
          {creds.map(c => (
            <li key={c.id} className="flex items-center gap-3 px-3.5 py-3">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary">
                <Fingerprint size={16} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                {renamingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') void handleRename(c.id); if (e.key === 'Escape') setRenamingId(null) }}
                      aria-label={t('settings.passkey.rename')}
                      className={`${INPUT} flex-1`}
                    />
                    <Tooltip label={t('common.save')}>
                      <button type="button" onClick={() => handleRename(c.id)} className={`${SETTINGS_ICON_BUTTON} !text-success`} aria-label={t('common.save')}>
                        <Check size={15} strokeWidth={2.4} />
                      </button>
                    </Tooltip>
                    <Tooltip label={t('common.cancel')}>
                      <button type="button" onClick={() => setRenamingId(null)} className={SETTINGS_ICON_BUTTON} aria-label={t('common.cancel')}>
                        <X size={15} />
                      </button>
                    </Tooltip>
                  </div>
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate font-semibold text-content" style={fs(13, 'body')}>{c.name || t('settings.passkey.defaultName')}</span>
                      <StatusPill tone={c.backed_up ? 'success' : 'neutral'}>
                        {c.backed_up ? t('settings.passkey.synced') : t('settings.passkey.deviceBound')}
                      </StatusPill>
                    </div>
                    <p className="m-0 mt-0.5 truncate tabular-nums text-content-faint" style={fs(11.5)}>
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
                <div className="flex flex-none items-center gap-1.5">
                  <Tooltip label={t('settings.passkey.rename')}>
                    <button
                      type="button"
                      onClick={() => { setRenamingId(c.id); setRenameVal(c.name || '') }}
                      className={SETTINGS_ICON_BUTTON}
                      aria-label={t('settings.passkey.rename')}
                    >
                      <Pencil size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip label={t('common.delete')}>
                    <button
                      type="button"
                      onClick={() => { setDeletingId(c.id); setDeletePwd('') }}
                      className={`${SETTINGS_ICON_BUTTON} hover:!bg-danger-soft hover:!text-danger`}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </Tooltip>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Delete confirmation (password step-up) */}
      {deletingId !== null && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-edge-faint bg-danger-soft p-3.5">
          <p className="m-0 font-semibold text-content" style={fs(13, 'body')}>{t('settings.passkey.deleteConfirm')}</p>
          <input
            type="password"
            value={deletePwd}
            onChange={e => setDeletePwd(e.target.value)}
            placeholder={t('settings.currentPassword')}
            aria-label={t('settings.currentPassword')}
            className={INPUT}
          />
          <div className="flex justify-end gap-2" style={fs(13, 'body')}>
            <button
              type="button"
              onClick={() => { setDeletingId(null); setDeletePwd('') }}
              className={SETTINGS_BUTTON}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={busy || !deletePwd}
              onClick={() => handleDelete(deletingId)}
              className={DANGER_FILL}
            >
              <Trash2 size={14} />
              {t('common.delete')}
            </button>
          </div>
        </div>
      )}

      {/* Add a passkey */}
      {canAdd && addOpen && (
        <div className={PANEL}>
          <div>
            <p className="m-0 font-semibold text-content" style={fs(13, 'body')}>{t('settings.passkey.addTitle')}</p>
            <SettingsHint className="mt-0.5">{t('settings.passkey.passwordPrompt')}</SettingsHint>
          </div>
          <div className={GRID_2}>
            <input
              type="password"
              value={addPwd}
              onChange={e => setAddPwd(e.target.value)}
              placeholder={t('settings.currentPassword')}
              aria-label={t('settings.currentPassword')}
              className={INPUT}
            />
            <input
              type="text"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder={t('settings.passkey.namePlaceholder')}
              aria-label={t('settings.passkey.namePlaceholder')}
              className={INPUT}
            />
          </div>
          <div className="flex justify-end gap-2" style={fs(13, 'body')}>
            <button
              type="button"
              onClick={() => { setAddOpen(false); setAddPwd(''); setAddName('') }}
              className={SETTINGS_BUTTON}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={busy || !addPwd}
              onClick={handleAdd}
              className={SETTINGS_BUTTON_PRIMARY}
            >
              {busy
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                : <><Fingerprint size={14} />{t('settings.passkey.add')}</>}
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}
