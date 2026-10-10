import { startRegistration } from '@simplewebauthn/browser';
import { useEffect, useState } from 'react';
import { authApi, type PasskeyCredential } from '../../api/client';
import { useTranslation } from '../../i18n';
import { getApiErrorMessage } from '../../types';
import { useToast } from '../shared/Toast';

/** Parse a SQLite UTC timestamp ("YYYY-MM-DD HH:MM:SS") into a local date string. */
export function fmtDate(ts: string | null): string | null {
  if (!ts) return null;
  const iso = ts.includes('T') ? ts : ts.replace(' ', 'T');
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

/** True when the browser cancellation / no-matching-credential DOMExceptions fire. */
export function isWebauthnAbort(err: unknown): boolean {
  const name = (err as { name?: string })?.name;
  return name === 'NotAllowedError' || name === 'AbortError';
}

/**
 * Passkey enrolment and management behind the desktop section and the phone card:
 * list, add (a password step-up, then the WebAuthn ceremony), rename, and delete
 * (password step-up). Adding needs the instance toggle on AND a usable RP ID; the
 * list stays reachable when the feature is later switched off so users can clean up.
 * `hidden` tells a view to render nothing: in demo mode, or when there is nothing to show.
 */
export function usePasskeys({ demoMode = false }: { demoMode?: boolean } = {}) {
  const { t } = useTranslation();
  const toast = useToast();

  const [enabled, setEnabled] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [creds, setCreds] = useState<PasskeyCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addPwd, setAddPwd] = useState('');
  const [addName, setAddName] = useState('');

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletePwd, setDeletePwd] = useState('');

  const refresh = () => {
    authApi.passkey
      .list()
      .then((r) => setCreds(r.credentials))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    authApi
      .getAppConfig?.()
      .then((c) => {
        setEnabled(!!c?.passkey_login);
        setConfigured(!!c?.passkey_configured);
      })
      .catch(() => {});
    refresh();
  }, []);

  const canAdd = enabled && configured;
  // Nothing to show: feature off and the user has no credentials to manage.
  const nothingToShow = !loading && !enabled && creds.length === 0;
  const hidden = demoMode || nothingToShow;
  // The toggle is on but no usable RP ID resolves, so adding stays off.
  const notConfigured = enabled && !configured;

  // Both step-up flows are gated by disabled={busy || !pwd} on their submit button,
  // so the password is always present by the time these run.
  const handleAdd = async () => {
    setBusy(true);
    try {
      const options = await authApi.passkey.registerOptions(addPwd);
      const attResp = await startRegistration({ optionsJSON: options });
      await authApi.passkey.registerVerify(attResp, addName.trim() || undefined);
      toast.success(t('settings.passkey.addedToast'));
      setAddOpen(false);
      setAddPwd('');
      setAddName('');
      refresh();
    } catch (err: unknown) {
      if (isWebauthnAbort(err)) toast.error(t('settings.passkey.cancelled'));
      else toast.error(getApiErrorMessage(err, t('settings.passkey.addError')));
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (id: number) => {
    const name = renameVal.trim();
    if (!name) {
      setRenamingId(null);
      return;
    }
    try {
      await authApi.passkey.rename(id, name);
      setRenamingId(null);
      refresh();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
  };

  const handleDelete = async (id: number) => {
    setBusy(true);
    try {
      await authApi.passkey.delete(id, deletePwd);
      toast.success(t('settings.passkey.deleted'));
      setDeletingId(null);
      setDeletePwd('');
      refresh();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setBusy(false);
    }
  };

  const startRename = (c: PasskeyCredential) => {
    setRenamingId(c.id);
    setRenameVal(c.name || '');
  };
  const startDelete = (id: number) => {
    setDeletingId(id);
    setDeletePwd('');
  };
  const cancelDelete = () => {
    setDeletingId(null);
    setDeletePwd('');
  };
  const cancelAdd = () => {
    setAddOpen(false);
    setAddPwd('');
    setAddName('');
  };

  return {
    enabled,
    configured,
    creds,
    loading,
    busy,
    canAdd,
    nothingToShow,
    hidden,
    notConfigured,
    addOpen,
    setAddOpen,
    addPwd,
    setAddPwd,
    addName,
    setAddName,
    renamingId,
    setRenamingId,
    renameVal,
    setRenameVal,
    deletingId,
    deletePwd,
    setDeletePwd,
    handleAdd,
    handleRename,
    handleDelete,
    startRename,
    startDelete,
    cancelDelete,
    cancelAdd,
  };
}
