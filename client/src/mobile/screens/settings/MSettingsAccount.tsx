import React, { useEffect, useRef, useState } from 'react'
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
import { useNavigate, useSearchParams } from 'react-router-dom'
import { startRegistration } from '@simplewebauthn/browser'
import { useTranslation } from '../../../i18n'
import { useAuthStore } from '../../../store/authStore'
import { useToast } from '../../../components/shared/Toast'
import { authApi, adminApi, type PasskeyCredential } from '../../../api/client'
import { getApiErrorMessage } from '../../../types'
import type { UserWithOidc } from '../../../types'
import { MSetCard, MSetEyebrow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MConfirmSheet from './MConfirmSheet'

const MFA_BACKUP_SESSION_KEY = 'trek_mfa_backup_codes_pending'

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
 * "Account" section — AccountTab parity: profile + avatar, password change,
 * TOTP 2FA (setup, backup codes, disable), passkeys and account deletion.
 */
export default function MSettingsAccount() {
  const { user, updateProfile, uploadAvatar, deleteAvatar, logout, loadUser, demoMode, appRequireMfa } = useAuthStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toast = useToast()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean | 'blocked'>(false)

  // Profile
  const [username, setUsername] = useState<string>(user?.username || '')
  const [email, setEmail] = useState<string>(user?.email || '')

  useEffect(() => {
    setUsername(user?.username || '')
    setEmail(user?.email || '')
  }, [user])

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [oidcOnlyMode, setOidcOnlyMode] = useState(false)

  useEffect(() => {
    authApi.getAppConfig?.().then((config) => {
      if (config?.oidc_only_mode) setOidcOnlyMode(true)
    }).catch(() => {})
  }, [])

  // MFA
  const [mfaQr, setMfaQr] = useState<string | null>(null)
  const [mfaSecret, setMfaSecret] = useState<string | null>(null)
  const [mfaSetupCode, setMfaSetupCode] = useState('')
  const [mfaDisablePwd, setMfaDisablePwd] = useState('')
  const [mfaDisableCode, setMfaDisableCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)

  const mfaRequiredByPolicy =
    !demoMode && !user?.mfa_enabled && (searchParams.get('mfa') === 'required' || appRequireMfa)

  const backupCodesText = backupCodes?.join('\n') || ''

  useEffect(() => {
    if (!user?.mfa_enabled || backupCodes) return
    try {
      const raw = sessionStorage.getItem(MFA_BACKUP_SESSION_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((x) => typeof x === 'string')) {
        setBackupCodes(parsed)
      }
    } catch {
      sessionStorage.removeItem(MFA_BACKUP_SESSION_KEY)
    }
  }, [user?.mfa_enabled, backupCodes])

  const dismissBackupCodes = () => {
    sessionStorage.removeItem(MFA_BACKUP_SESSION_KEY)
    setBackupCodes(null)
  }

  const copyBackupCodes = async () => {
    if (!backupCodesText) return
    try {
      await navigator.clipboard.writeText(backupCodesText)
      toast.success(t('settings.mfa.backupCopied'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const downloadBackupCodes = () => {
    if (!backupCodesText) return
    const blob = new Blob([backupCodesText + '\n'], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trek-mfa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const printBackupCodes = () => {
    if (!backupCodesText) return
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>TREK MFA Backup Codes</title>
      <style>body{font-family:Arial,sans-serif;padding:32px}h1{font-size:20px}pre{font-size:16px;line-height:1.6}</style>
      </head><body><h1>TREK MFA Backup Codes</h1><p>${new Date().toLocaleString()}</p><pre>${backupCodesText}</pre></body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadAvatar(file)
      toast.success(t('settings.avatarUploaded'))
    } catch {
      toast.error(t('settings.avatarError'))
    }
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleAvatarRemove = async () => {
    try {
      await deleteAvatar()
      toast.success(t('settings.avatarRemoved'))
    } catch {
      toast.error(t('settings.avatarError'))
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({ username, email })
      toast.success(t('settings.toast.profileSaved'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!currentPassword) return toast.error(t('settings.currentPasswordRequired'))
    if (!newPassword) return toast.error(t('settings.passwordRequired'))
    if (newPassword.length < 8) return toast.error(t('settings.passwordTooShort'))
    if (newPassword !== confirmPassword) return toast.error(t('settings.passwordMismatch'))
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword })
      toast.success(t('settings.passwordChanged'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await loadUser({ silent: true })
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }

  const startMfaSetup = async () => {
    setMfaLoading(true)
    try {
      const data = (await authApi.mfaSetup()) as { qr_svg: string; secret: string }
      setMfaQr(data.qr_svg)
      setMfaSecret(data.secret)
      setMfaSetupCode('')
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setMfaLoading(false)
    }
  }

  const enableMfa = async () => {
    setMfaLoading(true)
    try {
      const resp = (await authApi.mfaEnable({ code: mfaSetupCode })) as { backup_codes?: string[] }
      toast.success(t('settings.mfa.toastEnabled'))
      setMfaQr(null)
      setMfaSecret(null)
      setMfaSetupCode('')
      const codes = resp.backup_codes || null
      if (codes?.length) {
        try {
          sessionStorage.setItem(MFA_BACKUP_SESSION_KEY, JSON.stringify(codes))
        } catch { /* ignore */ }
      }
      setBackupCodes(codes)
      await loadUser({ silent: true })
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setMfaLoading(false)
    }
  }

  const disableMfa = async () => {
    setMfaLoading(true)
    try {
      await authApi.mfaDisable({ password: mfaDisablePwd, code: mfaDisableCode })
      toast.success(t('settings.mfa.toastDisabled'))
      setMfaDisablePwd('')
      setMfaDisableCode('')
      sessionStorage.removeItem(MFA_BACKUP_SESSION_KEY)
      setBackupCodes(null)
      await loadUser({ silent: true })
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setMfaLoading(false)
    }
  }

  const requestDelete = async () => {
    if (user?.role === 'admin') {
      try {
        await adminApi.stats()
        const adminUsers = (await adminApi.users()).users.filter((u: { role: string }) => u.role === 'admin')
        if (adminUsers.length <= 1) {
          setShowDeleteConfirm('blocked')
          return
        }
      } catch { /* fall through to the normal confirm */ }
    }
    setShowDeleteConfirm(true)
  }

  const deleteAccount = async () => {
    try {
      await authApi.deleteOwnAccount()
      logout()
      navigate('/login', { state: { noRedirect: true } })
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
      setShowDeleteConfirm(false)
    }
  }

  const oidcIssuer = (user as UserWithOidc)?.oidc_issuer

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
              className="absolute -bottom-[3px] -right-[3px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-[color:var(--m-sheetop)] bg-m-act text-m-actfg"
            >
              <Camera size={13} />
            </button>
            {user?.avatar_url && (
              <button
                type="button"
                aria-label={t('settings.removeAvatar')}
                onClick={handleAvatarRemove}
                className="absolute -right-[2px] -top-[2px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-[color:var(--m-sheetop)] bg-[color:var(--m-st-danger)] text-m-actfg"
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
                {t('settings.oidcLinked')} {oidcIssuer.replace('https://', '').replace(/\/+$/, '')}
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
                    onClick={() => {
                      setMfaQr(null)
                      setMfaSecret(null)
                      setMfaSetupCode('')
                    }}
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
      .then((r) => setCreds(r.credentials))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    authApi.getAppConfig?.()
      .then((c) => {
        setEnabled(!!c?.passkey_login)
        setConfigured(!!c?.passkey_configured)
      })
      .catch(() => {})
    refresh()
  }, [])

  const canAdd = enabled && configured

  const handleAdd = async () => {
    if (!addPwd) {
      toast.error(t('settings.passkey.passwordRequired'))
      return
    }
    setBusy(true)
    try {
      const options = await authApi.passkey.registerOptions(addPwd)
      const attResp = await startRegistration({ optionsJSON: options })
      await authApi.passkey.registerVerify(attResp, addName.trim() || undefined)
      toast.success(t('settings.passkey.addedToast'))
      setAddOpen(false)
      setAddPwd('')
      setAddName('')
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
    if (!name) {
      setRenamingId(null)
      return
    }
    try {
      await authApi.passkey.rename(id, name)
      setRenamingId(null)
      refresh()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }

  const handleDelete = async (id: number) => {
    if (!deletePwd) {
      toast.error(t('settings.passkey.passwordRequired'))
      return
    }
    setBusy(true)
    try {
      await authApi.passkey.delete(id, deletePwd)
      toast.success(t('settings.passkey.deleted'))
      setDeletingId(null)
      setDeletePwd('')
      refresh()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setBusy(false)
    }
  }

  if (demoMode) return null
  // Nothing to show: feature off and no credentials left to manage.
  if (!loading && !enabled && creds.length === 0) return null

  return (
    <MSetCard title={t('settings.passkey.title')} icon={Fingerprint} className="mt-3">
      <p className="text-[0.75rem] leading-relaxed text-m-muted">{t('settings.passkey.description')}</p>

      {enabled && !configured && (
        <p className="mt-2 text-[0.75rem] font-semibold text-[color:var(--m-st-pending)]">{t('settings.passkey.notConfigured')}</p>
      )}

      {creds.length > 0 && (
        <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {creds.map((c) => (
            <li key={c.id} className="flex items-center gap-[10px] rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
              <Fingerprint size={15} className="flex-none text-m-muted" />
              <div className="min-w-0 flex-1">
                {renamingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <MSetInput
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(c.id)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                    />
                    <button type="button" onClick={() => handleRename(c.id)} className="p-1 text-[color:var(--m-st-confirmed)]" aria-label={t('common.save')}>
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={() => setRenamingId(null)} className="p-1 text-m-muted" aria-label={t('common.cancel')}>
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
              {renamingId !== c.id && (
                <div className="flex flex-none items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(c.id)
                      setRenameVal(c.name || '')
                    }}
                    className="rounded p-[6px] text-m-muted"
                    aria-label={t('settings.passkey.rename')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingId(c.id)
                      setDeletePwd('')
                    }}
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
      {deletingId !== null && (
        <div className="mt-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3">
          <p className="m-0 text-[0.78125rem] font-bold text-m-ink">{t('settings.passkey.deleteConfirm')}</p>
          <MSetInput
            type="password"
            className="mt-2"
            value={deletePwd}
            onChange={(e) => setDeletePwd(e.target.value)}
            placeholder={t('settings.currentPassword')}
          />
          <div className="mt-2 flex gap-2">
            <MSetButton variant="danger" disabled={busy || !deletePwd} onClick={() => handleDelete(deletingId)}>
              {t('common.delete')}
            </MSetButton>
            <MSetButton
              variant="ghost"
              onClick={() => {
                setDeletingId(null)
                setDeletePwd('')
              }}
            >
              {t('common.cancel')}
            </MSetButton>
          </div>
        </div>
      )}

      {/* Add a passkey */}
      {canAdd &&
        (addOpen ? (
          <div className="mt-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
            <p className="m-0 text-[0.78125rem] font-bold text-m-ink">{t('settings.passkey.addTitle')}</p>
            <MSetHint className="mt-1">{t('settings.passkey.passwordPrompt')}</MSetHint>
            <MSetInput
              type="password"
              className="mt-2"
              value={addPwd}
              onChange={(e) => setAddPwd(e.target.value)}
              placeholder={t('settings.currentPassword')}
            />
            <MSetInput
              className="mt-2"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder={t('settings.passkey.namePlaceholder')}
            />
            <div className="mt-3 flex gap-2">
              <MSetButton disabled={busy || !addPwd} onClick={handleAdd}>
                {t('settings.passkey.add')}
              </MSetButton>
              <MSetButton
                variant="ghost"
                onClick={() => {
                  setAddOpen(false)
                  setAddPwd('')
                  setAddName('')
                }}
              >
                {t('common.cancel')}
              </MSetButton>
            </div>
          </div>
        ) : (
          <MSetButton className="mt-3" variant="ghost" onClick={() => setAddOpen(true)}>
            <Fingerprint size={13} />
            {t('settings.passkey.add')}
          </MSetButton>
        ))}
    </MSetCard>
  )
}
