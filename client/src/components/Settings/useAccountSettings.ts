import { escapeHtml } from '@trek/shared';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { adminApi, authApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage, type UserWithOidc } from '../../types';
import { passwordErrorKey } from '../../utils/passwordError';
import { useToast } from '../shared/Toast';

export const MFA_BACKUP_SESSION_KEY = 'trek_mfa_backup_codes_pending';

/** Drops every trailing slash for display, as a scan: the `/\/+$/` it stands in for backtracks quadratically. */
export function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') end--;
  return value.slice(0, end);
}

export interface AccountSettingsOptions {
  /** The toast key when removing the avatar fails ('settings.avatarError' on the desktop, 'settings.avatarRemoveError' on the phone). */
  avatarRemoveErrorKey: string;
  /** Skip copy, download and print while the backup code text is empty (the desktop does, the phone does not). */
  ignoreEmptyBackupCodes: boolean;
}

/**
 * The account settings behind the desktop tab and the phone screen: profile and
 * avatar, the password change, TOTP two factor setup with its backup codes, and
 * deleting the account (refused for the last admin). Each shell renders its own
 * cards, dialogs and sheets over this.
 */
export function useAccountSettings({ avatarRemoveErrorKey, ignoreEmptyBackupCodes }: AccountSettingsOptions) {
  const { user, updateProfile, uploadAvatar, deleteAvatar, logout, loadUser, demoMode, appRequireMfa } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean | 'blocked'>(false);

  // Profile
  const [username, setUsername] = useState<string>(user?.username || '');
  const [email, setEmail] = useState<string>(user?.email || '');

  useEffect(() => {
    setUsername(user?.username || '');
    setEmail(user?.email || '');
  }, [user]);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oidcOnlyMode, setOidcOnlyMode] = useState(false);

  useEffect(() => {
    authApi
      .getAppConfig?.()
      .then((config) => {
        if (config?.oidc_only_mode) setOidcOnlyMode(true);
      })
      .catch(() => {});
  }, []);

  // MFA
  const [mfaQr, setMfaQr] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaSetupCode, setMfaSetupCode] = useState('');
  const [mfaDisablePwd, setMfaDisablePwd] = useState('');
  const [mfaDisableCode, setMfaDisableCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const mfaRequiredByPolicy =
    !demoMode && !user?.mfa_enabled && (searchParams.get('mfa') === 'required' || appRequireMfa);

  const backupCodesText = backupCodes?.join('\n') || '';
  const skipBackupCodes = ignoreEmptyBackupCodes && !backupCodesText;

  useEffect(() => {
    if (!user?.mfa_enabled || backupCodes) return;
    try {
      const raw = sessionStorage.getItem(MFA_BACKUP_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((x) => typeof x === 'string')) {
        setBackupCodes(parsed);
      }
    } catch {
      sessionStorage.removeItem(MFA_BACKUP_SESSION_KEY);
    }
  }, [user?.mfa_enabled, backupCodes]);

  const dismissBackupCodes = () => {
    sessionStorage.removeItem(MFA_BACKUP_SESSION_KEY);
    setBackupCodes(null);
  };

  const copyBackupCodes = async () => {
    if (skipBackupCodes) return;
    try {
      await navigator.clipboard.writeText(backupCodesText);
      toast.success(t('settings.mfa.backupCopied'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const downloadBackupCodes = () => {
    if (skipBackupCodes) return;
    const blob = new Blob([backupCodesText + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trek-mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const printBackupCodes = () => {
    if (skipBackupCodes) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>TREK MFA Backup Codes</title>
      <style>body{font-family:Arial,sans-serif;padding:32px}h1{font-size:20px}pre{font-size:16px;line-height:1.6}</style>
      </head><body><h1>TREK MFA Backup Codes</h1><p>${escapeHtml(new Date().toLocaleString())}</p><pre>${escapeHtml(backupCodesText)}</pre></body></html>`;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
      toast.success(t('settings.avatarUploaded'));
    } catch {
      toast.error(t('settings.avatarError'));
    }
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleAvatarRemove = async () => {
    try {
      await deleteAvatar();
      toast.success(t('settings.avatarRemoved'));
    } catch {
      toast.error(t(avatarRemoveErrorKey));
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ username, email });
      toast.success(t('settings.toast.profileSaved'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword) return toast.error(t('settings.currentPasswordRequired'));
    if (!newPassword) return toast.error(t('settings.passwordRequired'));
    const weak = passwordErrorKey(newPassword);
    if (weak) return toast.error(t(weak));
    if (newPassword !== confirmPassword) return toast.error(t('settings.passwordMismatch'));
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success(t('settings.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await loadUser({ silent: true });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
  };

  const startMfaSetup = async () => {
    setMfaLoading(true);
    try {
      const data = (await authApi.mfaSetup()) as { qr_svg: string; secret: string };
      setMfaQr(data.qr_svg);
      setMfaSecret(data.secret);
      setMfaSetupCode('');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setMfaLoading(false);
    }
  };

  const cancelMfaSetup = () => {
    setMfaQr(null);
    setMfaSecret(null);
    setMfaSetupCode('');
  };

  const enableMfa = async () => {
    setMfaLoading(true);
    try {
      const resp = (await authApi.mfaEnable({ code: mfaSetupCode })) as { backup_codes?: string[] };
      toast.success(t('settings.mfa.toastEnabled'));
      setMfaQr(null);
      setMfaSecret(null);
      setMfaSetupCode('');
      const codes = resp.backup_codes || null;
      if (codes?.length) {
        try {
          sessionStorage.setItem(MFA_BACKUP_SESSION_KEY, JSON.stringify(codes));
        } catch {
          /* ignore */
        }
      }
      setBackupCodes(codes);
      await loadUser({ silent: true });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setMfaLoading(false);
    }
  };

  const disableMfa = async () => {
    setMfaLoading(true);
    try {
      await authApi.mfaDisable({ password: mfaDisablePwd, code: mfaDisableCode });
      toast.success(t('settings.mfa.toastDisabled'));
      setMfaDisablePwd('');
      setMfaDisableCode('');
      sessionStorage.removeItem(MFA_BACKUP_SESSION_KEY);
      setBackupCodes(null);
      await loadUser({ silent: true });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setMfaLoading(false);
    }
  };

  const requestDelete = async () => {
    if (user?.role === 'admin') {
      try {
        await adminApi.stats();
        const adminUsers = (await adminApi.users()).users.filter((u: { role: string }) => u.role === 'admin');
        if (adminUsers.length <= 1) {
          setShowDeleteConfirm('blocked');
          return;
        }
      } catch {
        /* fall through to the normal confirm */
      }
    }
    setShowDeleteConfirm(true);
  };

  const deleteAccount = async () => {
    try {
      await authApi.deleteOwnAccount();
      logout();
      navigate('/login', { state: { noRedirect: true } });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')));
      setShowDeleteConfirm(false);
    }
  };

  const oidcIssuer = (user as UserWithOidc)?.oidc_issuer;

  return {
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
  };
}
