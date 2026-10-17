import React, { useId } from 'react'
import { User, Save, Lock, KeyRound, AlertTriangle, Shield, Camera, Trash2, Copy, Download, Printer, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../../i18n'
import Section from './Section'
import PasskeysSection from './PasskeysSection'
import PasswordChecklist from '../shared/PasswordChecklist'
import ConfirmDialog from '../shared/ConfirmDialog'
import { Tooltip } from '../shared/Tooltip'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { EditorField, GRID_2, INPUT, PANEL } from '../shared/dialogParts'
import {
  SETTINGS_BUTTON, SETTINGS_BUTTON_DANGER, SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsHint, StatusPill,
} from './settingsKit'
import { stripTrailingSlashes, useAccountSettings } from './useAccountSettings'

/** The small turning ring a button shows while its request is on the way. */
const SPINNER = 'h-3.5 w-3.5 flex-none animate-spin rounded-full border-2 border-current border-t-transparent'

/** The eyebrow over a block inside a card body. */
const EYEBROW = 'm-0 font-geist font-bold uppercase tracking-[.08em] text-content-faint'

export default function AccountTab(): React.ReactElement {
  const { t } = useTranslation()
  const blockedLabelId = useId()
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
  } = useAccountSettings({ avatarRemoveErrorKey: 'settings.avatarError', ignoreEmptyBackupCodes: true })

  return (
    <>
      <Section title={t('settings.account')} icon={User}>
        {/* Who is signed in: the picture with its two actions, the role and the SSO link. */}
        <div className="flex items-center gap-4 rounded-[14px] border border-edge-faint bg-surface-card px-4 py-3.5">
          <div className="relative flex-none">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-edge-faint" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-surface-tertiary font-bold text-content-secondary" style={fs(24, 'subtitle')}>
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <Tooltip label={t('settings.uploadAvatar')}>
              <button type="button"
                onClick={() => avatarInputRef.current?.click()}
                aria-label={t('settings.uploadAvatar')}
                className="absolute -bottom-1 -end-1 grid h-7 w-7 place-items-center rounded-full border-2 border-[color:var(--bg-card)] bg-[color:var(--text-primary)] text-[color:var(--bg-card)] shadow-sm transition-transform hover:scale-110"
              >
                <Camera size={13} strokeWidth={2.2} />
              </button>
            </Tooltip>
            {user?.avatar_url && (
              <Tooltip label={t('settings.removeAvatar')}>
                <button type="button"
                  onClick={handleAvatarRemove}
                  aria-label={t('settings.removeAvatar')}
                  className="absolute -end-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[color:var(--bg-card)] bg-danger text-white shadow-sm transition-transform hover:scale-110" // theme-lint-disable: white glyph on the danger fill, as ConfirmDialog draws it
                >
                  <Trash2 size={11} strokeWidth={2.2} />
                </button>
              </Tooltip>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="truncate font-bold text-content" style={fs(15, 'subtitle')}>{user?.username}</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {user?.role === 'admin'
                ? <StatusPill tone="warning" icon={<Shield size={11} strokeWidth={2.4} />}>{t('settings.roleAdmin')}</StatusPill>
                : <StatusPill>{t('settings.roleUser')}</StatusPill>}
              {oidcIssuer && <StatusPill tone="accent">SSO</StatusPill>}
            </div>
            {oidcIssuer && (
              <p className="m-0 truncate text-content-faint" style={fs(11.5)}>
                {t('settings.oidcLinked')} {stripTrailingSlashes(oidcIssuer.replace('https://', ''))}
              </p>
            )}
          </div>
        </div>

        <div className={GRID_2}>
          <EditorField label={t('settings.username')} htmlFor="account-username">
            <input
              id="account-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={INPUT}
            />
          </EditorField>
          <EditorField label={t('settings.email')} htmlFor="account-email">
            <input
              id="account-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={INPUT}
            />
          </EditorField>
        </div>

        {/* The card's foot: the way out on the left, the save on the right, like a dialog's bar. */}
        <div className="-mx-4 -mb-4 flex items-center gap-2 border-t border-edge-faint bg-surface-card px-4 py-3" style={fs(13, 'body')}>
          <button type="button"
            onClick={requestDelete}
            className={SETTINGS_BUTTON_DANGER}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">{t('settings.deleteAccount')}</span>
            <span className="sm:hidden">{t('common.delete')}</span>
          </button>
          <span className="flex-1" />
          <button type="button"
            onClick={saveProfile}
            disabled={saving}
            className={SETTINGS_BUTTON_PRIMARY}
          >
            {saving ? <span className={SPINNER} /> : <Save size={14} />}
            <span className="hidden sm:inline">{t('settings.saveProfile')}</span>
            <span className="sm:hidden">{t('common.save')}</span>
          </button>
        </div>
      </Section>

      {/* Change Password */}
      {!oidcOnlyMode && (
        <Section title={t('settings.changePassword')} icon={Lock}>
          <EditorField label={t('settings.currentPassword')} htmlFor="account-current-password">
            <input
              id="account-current-password"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder={t('settings.currentPassword')}
              className={INPUT}
            />
          </EditorField>
          <div className={GRID_2}>
            <EditorField label={t('settings.newPassword')} htmlFor="account-new-password">
              <input
                id="account-new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={t('settings.newPassword')}
                className={INPUT}
              />
            </EditorField>
            <EditorField label={t('settings.confirmPassword')} htmlFor="account-confirm-password">
              <input
                id="account-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t('settings.confirmPassword')}
                className={INPUT}
              />
            </EditorField>
          </div>
          <PasswordChecklist password={newPassword} />
          <div className="flex justify-end" style={fs(13, 'body')}>
            <button type="button"
              onClick={changePassword}
              className={SETTINGS_BUTTON}
            >
              <Lock size={14} />
              {t('settings.updatePassword')}
            </button>
          </div>
        </Section>
      )}

      {/* MFA */}
      <Section title={t('settings.mfa.title')} icon={KeyRound}>
        {mfaRequiredByPolicy && (
          <div className="flex gap-3 rounded-[12px] bg-warning-soft px-3.5 py-3 text-content" style={fs(12.5, 'body')}>
            <AlertTriangle size={16} className="mt-px flex-none text-warning" />
            <p className="m-0 leading-relaxed">{t('settings.mfa.requiredByPolicy')}</p>
          </div>
        )}
        <SettingsHint>{t('settings.mfa.description')}</SettingsHint>
        {demoMode ? (
          <p className="m-0 font-medium text-warning" style={fs(12.5, 'body')}>{t('settings.mfa.demoBlocked')}</p>
        ) : (
          <>
            <SettingRows>
              <SettingRow
                label={user?.mfa_enabled ? t('settings.mfa.enabled') : t('settings.mfa.disabled')}
                control={!user?.mfa_enabled && !mfaQr ? (
                  <button
                    type="button"
                    disabled={mfaLoading}
                    onClick={startMfaSetup}
                    className={SETTINGS_BUTTON}
                    style={fs(13, 'body')}
                  >
                    {mfaLoading ? <span className={SPINNER} /> : <KeyRound size={14} />}
                    {t('settings.mfa.setup')}
                  </button>
                ) : user?.mfa_enabled ? (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-success-soft text-success">
                    <ShieldCheck size={16} strokeWidth={2.2} />
                  </span>
                ) : undefined}
              />
            </SettingRows>

            {!user?.mfa_enabled && mfaQr && (
              <div className={PANEL}>
                <SettingsHint>{t('settings.mfa.scanQr')}</SettingsHint>
                <div className="flex flex-wrap items-start gap-4">
                  {/* A QR code needs its light quiet zone in either theme to scan. */}
                  <div
                    className="flex-none overflow-hidden rounded-[12px] border border-edge-faint p-1.5"
                    style={{ background: '#ffffff' }} // theme-lint-disable: a QR code needs a white quiet zone to scan
                    dangerouslySetInnerHTML={{ __html: mfaQr! }}
                  />
                  <div className="flex min-w-0 flex-1 basis-56 flex-col gap-3">
                    <EditorField label={t('settings.mfa.secretLabel')}>
                      <code className="block break-all rounded-[10px] border border-edge-faint bg-surface-tertiary px-3 py-2 font-geist tracking-wide text-content" style={fs(12.5, 'body')}>{mfaSecret}</code>
                    </EditorField>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={mfaSetupCode}
                      onChange={e => setMfaSetupCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder={t('settings.mfa.codePlaceholder')}
                      className={`${INPUT} font-geist tabular-nums tracking-[.2em]`}
                    />
                    <div className="flex flex-wrap justify-end gap-2" style={fs(13, 'body')}>
                      <button
                        type="button"
                        onClick={cancelMfaSetup}
                        className={SETTINGS_BUTTON}
                      >
                        {t('settings.mfa.cancelSetup')}
                      </button>
                      <button
                        type="button"
                        disabled={mfaLoading || mfaSetupCode.length < 6}
                        onClick={enableMfa}
                        className={SETTINGS_BUTTON_PRIMARY}
                      >
                        {t('settings.mfa.enable')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {user?.mfa_enabled && (
              <div className={PANEL}>
                <div>
                  <p className={EYEBROW} style={fs(10)}>{t('settings.mfa.disableTitle')}</p>
                  <SettingsHint className="mt-1">{t('settings.mfa.disableHint')}</SettingsHint>
                </div>
                <div className={GRID_2}>
                  <input
                    type="password"
                    value={mfaDisablePwd}
                    onChange={e => setMfaDisablePwd(e.target.value)}
                    placeholder={t('settings.currentPassword')}
                    aria-label={t('settings.currentPassword')}
                    className={INPUT}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={mfaDisableCode}
                    onChange={e => setMfaDisableCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder={t('settings.mfa.codePlaceholder')}
                    aria-label={t('settings.mfa.codePlaceholder')}
                    className={`${INPUT} font-geist tabular-nums`}
                  />
                </div>
                <div className="flex justify-end" style={fs(13, 'body')}>
                  <button
                    type="button"
                    disabled={mfaLoading || !mfaDisablePwd || mfaDisableCode.length < 6}
                    onClick={disableMfa}
                    className={SETTINGS_BUTTON_DANGER}
                  >
                    {t('settings.mfa.disable')}
                  </button>
                </div>
              </div>
            )}

            {backupCodes && backupCodes.length > 0 && (
              <div className={PANEL}>
                <div>
                  <p className="m-0 font-semibold text-content" style={fs(13, 'body')}>{t('settings.mfa.backupTitle')}</p>
                  <SettingsHint className="mt-0.5">{t('settings.mfa.backupDescription')}</SettingsHint>
                </div>
                <pre className="m-0 max-h-[220px] overflow-auto rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3 font-geist tabular-nums leading-relaxed tracking-wide text-content" style={fs(12.5, 'body')}>{backupCodesText}</pre>
                <p className="m-0 flex items-center gap-1.5 font-medium text-warning" style={fs(11.5)}>
                  <AlertTriangle size={13} className="flex-none" />{t('settings.mfa.backupWarning')}
                </p>
                <div className="flex flex-wrap items-center gap-2" style={fs(12.5, 'body')}>
                  <button type="button" onClick={copyBackupCodes} className={SETTINGS_BUTTON}>
                    <Copy size={13} /> {t('settings.mfa.backupCopy')}
                  </button>
                  <button type="button" onClick={downloadBackupCodes} className={SETTINGS_BUTTON}>
                    <Download size={13} /> {t('settings.mfa.backupDownload')}
                  </button>
                  <button type="button" onClick={printBackupCodes} className={SETTINGS_BUTTON}>
                    <Printer size={13} /> {t('settings.mfa.backupPrint')}
                  </button>
                  <span className="flex-1" />
                  <button type="button" onClick={dismissBackupCodes} className={SETTINGS_BUTTON_PRIMARY}>
                    {t('common.ok')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      {/* Passkeys */}
      <PasskeysSection demoMode={demoMode} />

      {/* Delete Account Blocked */}
      <DialogShell
        open={showDeleteConfirm === 'blocked'}
        onClose={() => setShowDeleteConfirm(false)}
        labelledBy={blockedLabelId}
        width="narrow"
        header={(
          <DialogHeader
            tile={<DialogTile><Shield size={20} strokeWidth={1.9} className="text-warning" /></DialogTile>}
            tint={NEUTRAL_TINT}
            labelId={blockedLabelId}
            onClose={() => setShowDeleteConfirm(false)}
            title={t('settings.deleteBlockedTitle')}
          />
        )}
        footer={(
          <DialogFooter>
            <FooterSpacer />
            <DialogButton variant="primary" onClick={() => setShowDeleteConfirm(false)}>
              {t('common.ok') || 'OK'}
            </DialogButton>
          </DialogFooter>
        )}
      >
        <p className="m-0 leading-relaxed text-content-secondary" style={fs(13.5, 'body')}>
          {t('settings.deleteBlockedMessage')}
        </p>
      </DialogShell>

      {/* Delete Account Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm === true}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteAccount}
        title={t('settings.deleteAccountTitle')}
        message={t('settings.deleteAccountWarning')}
        confirmLabel={t('settings.deleteAccountConfirm')}
        danger
      />
    </>
  )
}
