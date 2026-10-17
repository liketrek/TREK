import React from 'react'
import { Fingerprint, Plus, Trash2, Pencil, Check, X, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n'
import Section from './Section'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
import { GRID_2, INPUT, PANEL } from '../shared/dialogParts'
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON, SettingsHint, StatusPill } from './settingsKit'
import { fmtDate, usePasskeys } from './usePasskeys'

/** The step-up's final answer: the danger fill, white on red like ConfirmDialog's. */
const DANGER_FILL = 'inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-danger px-4 py-2 font-medium text-white hover:opacity-90 disabled:cursor-default disabled:opacity-50' // theme-lint-disable: white on the danger fill, as ConfirmDialog draws it

/**
 * Passkey enrolment + management. Mirrors the MFA block: list / add (with a
 * password step-up + the WebAuthn ceremony) / rename / delete (password step-up).
 * The "Add a passkey" action only appears when the instance toggle is on AND a
 * usable RP ID resolves; the existing-credential list stays reachable even when
 * the feature is later disabled so users can always clean up.
 */
export default function PasskeysSection({ demoMode }: { demoMode?: boolean }): React.ReactElement | null {
  const { t } = useTranslation()
  const pk = usePasskeys({ demoMode })
  if (pk.hidden) return null

  return (
    <Section
      title={t('settings.passkey.title')}
      icon={Fingerprint}
      badge={pk.creds.length > 0 ? <StatusPill>{pk.creds.length}</StatusPill> : undefined}
      // The way in sits on the band, like the planner's "add" actions; the step-up opens in the body.
      action={pk.canAdd && !pk.addOpen ? (
        <button type="button" onClick={() => pk.setAddOpen(true)} className={SETTINGS_BUTTON} style={fs(12.5, 'body')}>
          <Plus size={14} />
          {t('settings.passkey.add')}
        </button>
      ) : undefined}
    >
      <SettingsHint>{t('settings.passkey.description')}</SettingsHint>

      {pk.notConfigured && (
        <div className="flex gap-2.5 rounded-[12px] bg-warning-soft px-3.5 py-2.5 text-content" style={fs(12.5, 'body')}>
          <AlertTriangle size={15} className="mt-px flex-none text-warning" />
          <p className="m-0 leading-snug">{t('settings.passkey.notConfigured')}</p>
        </div>
      )}

      {pk.creds.length > 0 && (
        <ul className="m-0 list-none divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card p-0">
          {pk.creds.map(c => (
            <li key={c.id} className="flex items-center gap-3 px-3.5 py-3">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary">
                <Fingerprint size={16} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                {pk.renamingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={pk.renameVal}
                      onChange={e => pk.setRenameVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') void pk.handleRename(c.id); if (e.key === 'Escape') pk.setRenamingId(null) }}
                      aria-label={t('settings.passkey.rename')}
                      className={`${INPUT} flex-1`}
                    />
                    <Tooltip label={t('common.save')}>
                      <button type="button" onClick={() => pk.handleRename(c.id)} className={`${SETTINGS_ICON_BUTTON} !text-success`} aria-label={t('common.save')}>
                        <Check size={15} strokeWidth={2.4} />
                      </button>
                    </Tooltip>
                    <Tooltip label={t('common.cancel')}>
                      <button type="button" onClick={() => pk.setRenamingId(null)} className={SETTINGS_ICON_BUTTON} aria-label={t('common.cancel')}>
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
              {pk.renamingId !== c.id && (
                <div className="flex flex-none items-center gap-1.5">
                  <Tooltip label={t('settings.passkey.rename')}>
                    <button
                      type="button"
                      onClick={() => pk.startRename(c)}
                      className={SETTINGS_ICON_BUTTON}
                      aria-label={t('settings.passkey.rename')}
                    >
                      <Pencil size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip label={t('common.delete')}>
                    <button
                      type="button"
                      onClick={() => pk.startDelete(c.id)}
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
      {pk.deletingId !== null && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-edge-faint bg-danger-soft p-3.5">
          <p className="m-0 font-semibold text-content" style={fs(13, 'body')}>{t('settings.passkey.deleteConfirm')}</p>
          <input
            type="password"
            value={pk.deletePwd}
            onChange={e => pk.setDeletePwd(e.target.value)}
            placeholder={t('settings.currentPassword')}
            aria-label={t('settings.currentPassword')}
            className={INPUT}
          />
          <div className="flex justify-end gap-2" style={fs(13, 'body')}>
            <button
              type="button"
              onClick={pk.cancelDelete}
              className={SETTINGS_BUTTON}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={pk.busy || !pk.deletePwd}
              onClick={() => pk.handleDelete(pk.deletingId)}
              className={DANGER_FILL}
            >
              <Trash2 size={14} />
              {t('common.delete')}
            </button>
          </div>
        </div>
      )}

      {/* Add a passkey */}
      {pk.canAdd && pk.addOpen && (
        <div className={PANEL}>
          <div>
            <p className="m-0 font-semibold text-content" style={fs(13, 'body')}>{t('settings.passkey.addTitle')}</p>
            <SettingsHint className="mt-0.5">{t('settings.passkey.passwordPrompt')}</SettingsHint>
          </div>
          <div className={GRID_2}>
            <input
              type="password"
              value={pk.addPwd}
              onChange={e => pk.setAddPwd(e.target.value)}
              placeholder={t('settings.currentPassword')}
              aria-label={t('settings.currentPassword')}
              className={INPUT}
            />
            <input
              type="text"
              value={pk.addName}
              onChange={e => pk.setAddName(e.target.value)}
              placeholder={t('settings.passkey.namePlaceholder')}
              aria-label={t('settings.passkey.namePlaceholder')}
              className={INPUT}
            />
          </div>
          <div className="flex justify-end gap-2" style={fs(13, 'body')}>
            <button
              type="button"
              onClick={pk.cancelAdd}
              className={SETTINGS_BUTTON}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={pk.busy || !pk.addPwd}
              onClick={pk.handleAdd}
              className={SETTINGS_BUTTON_PRIMARY}
            >
              {pk.busy
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                : <><Fingerprint size={14} />{t('settings.passkey.add')}</>}
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}
