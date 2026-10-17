import React from 'react'
import {
  AlertTriangle,
  Camera,
  Check,
  Copy,
  Download,
  Fingerprint,
  KeyRound,
  Lock,
  Pencil,
  Printer,
  Save,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { MSetCard, MSetEyebrow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MConfirmSheet from './MConfirmSheet'
import PasswordChecklist from '../../../components/shared/PasswordChecklist'
import { fmtDate, usePasskeys } from '../../../components/Settings/usePasskeys'
import { stripTrailingSlashes, useAccountSettings } from '../../../components/Settings/useAccountSettings'

/**
 * "Account" section — AccountTab parity: profile + avatar, password change,
 * TOTP 2FA (setup, backup codes, disable), passkeys and account deletion.
 */
export default function MSettingsAccount() {
  const { t } = useTranslation()
  const {
    user,
    demoMode,
    avatarInputRef,
    saving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    username,
    setUsername,
    email,
    setEmail,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    oidcOnlyMode,
    mfaQr,
    mfaSecret,
    mfaSetupCode,
    setMfaSetupCode,
    mfaDisablePwd,
    setMfaDisablePwd,
    mfaDisableCode,
    setMfaDisableCode,
    mfaLoading,
    backupCodes,
    backupCodesText,
    mfaRequiredByPolicy,
    oidcIssuer,
    dismissBackupCodes,
    copyBackupCodes,
    downloadBackupCodes,
    printBackupCodes,
    handleAvatarUpload,
    handleAvatarRemove,
    saveProfile,
    changePassword,
    startMfaSetup,
    cancelMfaSetup,
    enableMfa,
    disableMfa,
    requestDelete,
    deleteAccount,
  } = useAccountSettings({ avatarRemoveErrorKey: 'settings.avatarRemoveError', ignoreEmptyBackupCodes: false })

  return (
    <>
      {/* ── Profile ─────────────────────────────────────────────── */}
      <MSetCard title={t('settings.account')} icon={User}>
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-none">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--m-ic)] text-[1.375rem] font-bold text-m-ink">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <button
              type="button"
              aria-label={t('settings.uploadAvatar')}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-[3px] -end-[3px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-[color:var(--m-sheetop)] bg-m-act text-m-actfg"
            >
              <Camera size={13} />
            </button>
            {user?.avatar_url && (
              <button
                type="button"
                aria-label={t('settings.removeAvatar')}
                onClick={handleAvatarRemove}
                className="absolute -end-[2px] -top-[2px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-[color:var(--m-sheetop)] bg-[color:var(--m-st-danger)] text-m-actfg"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-[6px] text-[0.78125rem] font-bold text-m-ink">
              {user?.role === 'admin' && <Shield size={13} className="flex-none" />}
              {user?.role === 'admin' ? t('settings.roleAdmin') : t('settings.roleUser')}
              {oidcIssuer && (
                <span className="rounded-full bg-[color:var(--m-ic)] px-2 py-[1px] font-geist text-[0.625rem] font-bold text-m-muted">
                  SSO
                </span>
              )}
            </div>
            {oidcIssuer && (
              <div className="mt-[2px] font-geist text-[0.625rem] text-m-faint">
                {t('settings.oidcLinked')} {stripTrailingSlashes(oidcIssuer.replace('https://', ''))}
              </div>
            )}
          </div>
        </div>

        <MSetEyebrow className="mb-[5px]">{t('settings.username')}</MSetEyebrow>
        <MSetInput value={username} onChange={(e) => setUsername(e.target.value)} />
        <MSetEyebrow className="mb-[5px] mt-[14px]">{t('settings.email')}</MSetEyebrow>
        <MSetInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <div className="mt-4 flex items-center justify-between">
          <MSetButton onClick={saveProfile} disabled={saving}>
            <Save size={14} />
            {t('common.save')}
          </MSetButton>
          <MSetButton variant="danger" onClick={requestDelete}>
            <Trash2 size={14} />
            {t('common.delete')}
          </MSetButton>
        </div>
      </MSetCard>

      {/* ── Password ────────────────────────────────────────────── */}
      {!oidcOnlyMode && (
        <MSetCard title={t('settings.changePassword')} icon={Lock} className="mt-3">
          <MSetInput
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t('settings.currentPassword')}
          />
          <MSetInput
            type="password"
            className="mt-2"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('settings.newPassword')}
          />
          <PasswordChecklist password={newPassword} className="mt-2" />
          <MSetInput
            type="password"
            className="mt-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('settings.confirmPassword')}
          />
          <MSetButton className="mt-3" variant="ghost" onClick={changePassword}>
            <Lock size={13} />
            {t('settings.updatePassword')}
          </MSetButton>
        </MSetCard>
      )}

      {/* ── Two-factor authentication ───────────────────────────── */}
      <MSetCard title={t('settings.mfa.title')} icon={KeyRound} className="mt-3">
        {mfaRequiredByPolicy && (
          <div className="mb-3 flex gap-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3">
            <AlertTriangle size={16} className="mt-[1px] flex-none text-[color:var(--m-st-pending)]" />
            <p className="text-[0.75rem] leading-relaxed text-m-ink">{t('settings.mfa.requiredByPolicy')}</p>
          </div>
        )}
        <p className="text-[0.75rem] leading-relaxed text-m-muted">{t('settings.mfa.description')}</p>

        {demoMode ? (
          <p className="mt-2 text-[0.75rem] font-semibold text-[color:var(--m-st-pending)]">{t('settings.mfa.demoBlocked')}</p>
        ) : (
          <>
            <p className="mt-2 text-[0.78125rem] font-bold text-m-ink">
              {user?.mfa_enabled ? t('settings.mfa.enabled') : t('settings.mfa.disabled')}
            </p>

            {!user?.mfa_enabled && !mfaQr && (
              <MSetButton className="mt-3" variant="ghost" onClick={startMfaSetup} disabled={mfaLoading}>
                <KeyRound size={13} />
                {t('settings.mfa.setup')}
              </MSetButton>
            )}

            {!user?.mfa_enabled && mfaQr && (
              <div className="mt-3">
                <p className="text-[0.75rem] text-m-muted">{t('settings.mfa.scanQr')}</p>
                <div
                  className="mx-auto mt-2 w-fit overflow-hidden rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)]"
                  dangerouslySetInnerHTML={{ __html: mfaQr }}
                />
                <MSetEyebrow className="mb-1 mt-3">{t('settings.mfa.secretLabel')}</MSetEyebrow>
                <code className="block break-all rounded-xl bg-[color:var(--m-ic)] p-2 font-mono text-[0.6875rem] text-m-ink">
                  {mfaSecret}
                </code>
                <MSetInput
                  className="mt-2"
                  inputMode="numeric"
                  value={mfaSetupCode}
                  onChange={(e) => setMfaSetupCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder={t('settings.mfa.codePlaceholder')}
                />
                <div className="mt-3 flex gap-2">
                  <MSetButton onClick={enableMfa} disabled={mfaLoading || mfaSetupCode.length < 6}>
                    {t('settings.mfa.enable')}
                  </MSetButton>
                  <MSetButton
                    variant="ghost"
                    onClick={cancelMfaSetup}
                  >
                    {t('settings.mfa.cancelSetup')}
                  </MSetButton>
                </div>
              </div>
            )}

            {user?.mfa_enabled && (
              <div className="mt-3">
                <p className="text-[0.78125rem] font-bold text-m-ink">{t('settings.mfa.disableTitle')}</p>
                <MSetHint className="mb-2">{t('settings.mfa.disableHint')}</MSetHint>
                <MSetInput
                  type="password"
                  value={mfaDisablePwd}
                  onChange={(e) => setMfaDisablePwd(e.target.value)}
                  placeholder={t('settings.currentPassword')}
                />
                <MSetInput
                  className="mt-2"
                  inputMode="numeric"
                  value={mfaDisableCode}
                  onChange={(e) => setMfaDisableCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder={t('settings.mfa.codePlaceholder')}
                />
                <MSetButton
                  className="mt-3"
                  variant="danger"
                  onClick={disableMfa}
                  disabled={mfaLoading || !mfaDisablePwd || mfaDisableCode.length < 6}
                >
                  {t('settings.mfa.disable')}
                </MSetButton>
              </div>
            )}

            {backupCodes && backupCodes.length > 0 && (
              <div className="mt-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
                <p className="text-[0.78125rem] font-bold text-m-ink">{t('settings.mfa.backupTitle')}</p>
                <MSetHint className="mt-1">{t('settings.mfa.backupDescription')}</MSetHint>
                <pre className="mt-2 max-h-[220px] overflow-auto rounded-xl bg-[color:var(--m-ic)] p-2 font-mono text-[0.6875rem] text-m-ink">
                  {backupCodesText}
                </pre>
                <p className="mt-2 font-geist text-[0.625rem] font-bold text-[color:var(--m-st-pending)]">
                  {t('settings.mfa.backupWarning')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <MSetButton variant="ghost" onClick={copyBackupCodes}>
                    <Copy size={13} /> {t('settings.mfa.backupCopy')}
                  </MSetButton>
                  <MSetButton variant="ghost" onClick={downloadBackupCodes}>
                    <Download size={13} /> {t('settings.mfa.backupDownload')}
                  </MSetButton>
                  <MSetButton variant="ghost" onClick={printBackupCodes}>
                    <Printer size={13} /> {t('settings.mfa.backupPrint')}
                  </MSetButton>
                  <MSetButton variant="ghost" onClick={dismissBackupCodes}>
                    {t('common.ok')}
                  </MSetButton>
                </div>
              </div>
            )}
          </>
        )}
      </MSetCard>

      <MPasskeysCard demoMode={demoMode} />

      <MConfirmSheet
        open={showDeleteConfirm === 'blocked'}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('settings.deleteBlockedTitle')}
        message={t('settings.deleteBlockedMessage')}
        cancelLabel={t('common.ok')}
      />

      <MConfirmSheet
        open={showDeleteConfirm === true}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('settings.deleteAccountTitle')}
        message={t('settings.deleteAccountWarning')}
        confirmLabel={t('settings.deleteAccountConfirm')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={deleteAccount}
      />
    </>
  )
}

/**
 * Passkey enrolment + management (PasskeysSection parity): list / add with a
 * password step-up + WebAuthn ceremony / rename / delete (password step-up).
 */
function MPasskeysCard({ demoMode }: { demoMode?: boolean }): React.ReactElement | null {
  const { t } = useTranslation()
  const passkeys = usePasskeys({ demoMode })
  if (passkeys.hidden) return null

  return (
    <MSetCard title={t('settings.passkey.title')} icon={Fingerprint} className="mt-3">
      <p className="text-[0.75rem] leading-relaxed text-m-muted">{t('settings.passkey.description')}</p>

      {passkeys.notConfigured && (
        <p className="mt-2 text-[0.75rem] font-semibold text-[color:var(--m-st-pending)]">{t('settings.passkey.notConfigured')}</p>
      )}

      {passkeys.creds.length > 0 && (
        <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {passkeys.creds.map((c) => (
            <li key={c.id} className="flex items-center gap-[10px] rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
              <Fingerprint size={15} className="flex-none text-m-muted" />
              <div className="min-w-0 flex-1">
                {passkeys.renamingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <MSetInput
                      autoFocus
                      value={passkeys.renameVal}
                      onChange={(e) => passkeys.setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void passkeys.handleRename(c.id)
                        if (e.key === 'Escape') passkeys.setRenamingId(null)
                      }}
                    />
                    <button type="button" onClick={() => passkeys.handleRename(c.id)} className="p-1 text-[color:var(--m-st-confirmed)]" aria-label={t('common.save')}>
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={() => passkeys.setRenamingId(null)} className="p-1 text-m-muted" aria-label={t('common.cancel')}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[0.78125rem] font-bold text-m-ink">
                        {c.name || t('settings.passkey.defaultName')}
                      </span>
                      <span className="flex-none rounded-full bg-[color:var(--m-ic)] px-2 py-[1px] font-geist text-[0.5625rem] font-bold text-m-muted">
                        {c.backed_up ? t('settings.passkey.synced') : t('settings.passkey.deviceBound')}
                      </span>
                    </div>
                    <p className="m-0 mt-[2px] font-geist text-[0.625rem] text-m-faint">
                      {t('settings.passkey.added')}: {fmtDate(c.created_at) || '—'}
                      {' · '}
                      {c.last_used_at
                        ? `${t('settings.passkey.lastUsed')}: ${fmtDate(c.last_used_at)}`
                        : t('settings.passkey.neverUsed')}
                    </p>
                  </>
                )}
              </div>
              {passkeys.renamingId !== c.id && (
                <div className="flex flex-none items-center gap-1">
                  <button
                    type="button"
                    onClick={() => passkeys.startRename(c)}
                    className="rounded p-[6px] text-m-muted"
                    aria-label={t('settings.passkey.rename')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => passkeys.startDelete(c.id)}
                    className="rounded p-[6px] text-[color:var(--m-st-danger)]"
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
      {passkeys.deletingId !== null && (
        <div className="mt-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3">
          <p className="m-0 text-[0.78125rem] font-bold text-m-ink">{t('settings.passkey.deleteConfirm')}</p>
          <MSetInput
            type="password"
            className="mt-2"
            value={passkeys.deletePwd}
            onChange={(e) => passkeys.setDeletePwd(e.target.value)}
            placeholder={t('settings.currentPassword')}
          />
          <div className="mt-2 flex gap-2">
            <MSetButton variant="danger" disabled={passkeys.busy || !passkeys.deletePwd} onClick={() => passkeys.handleDelete(passkeys.deletingId)}>
              {t('common.delete')}
            </MSetButton>
            <MSetButton
              variant="ghost"
              onClick={passkeys.cancelDelete}
            >
              {t('common.cancel')}
            </MSetButton>
          </div>
        </div>
      )}

      {/* Add a passkey */}
      {passkeys.canAdd &&
        (passkeys.addOpen ? (
          <div className="mt-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
            <p className="m-0 text-[0.78125rem] font-bold text-m-ink">{t('settings.passkey.addTitle')}</p>
            <MSetHint className="mt-1">{t('settings.passkey.passwordPrompt')}</MSetHint>
            <MSetInput
              type="password"
              className="mt-2"
              value={passkeys.addPwd}
              onChange={(e) => passkeys.setAddPwd(e.target.value)}
              placeholder={t('settings.currentPassword')}
            />
            <MSetInput
              className="mt-2"
              value={passkeys.addName}
              onChange={(e) => passkeys.setAddName(e.target.value)}
              placeholder={t('settings.passkey.namePlaceholder')}
            />
            <div className="mt-3 flex gap-2">
              <MSetButton disabled={passkeys.busy || !passkeys.addPwd} onClick={passkeys.handleAdd}>
                {t('settings.passkey.add')}
              </MSetButton>
              <MSetButton
                variant="ghost"
                onClick={passkeys.cancelAdd}
              >
                {t('common.cancel')}
              </MSetButton>
            </div>
          </div>
        ) : (
          <MSetButton className="mt-3" variant="ghost" onClick={() => passkeys.setAddOpen(true)}>
            <Fingerprint size={13} />
            {t('settings.passkey.add')}
          </MSetButton>
        ))}
    </MSetCard>
  )
}
