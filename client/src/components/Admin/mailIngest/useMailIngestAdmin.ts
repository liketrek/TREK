import type { MailIngestAdminStatusResponse, MailIngestAdminTestResponse } from '@trek/shared';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { mailIngestRepo } from '../../../repo/mailIngestRepo';
import { getApiErrorMessage } from '../../../types';
import { useToast } from '../../shared/Toast';
import {
  ENABLED_KEY,
  changesOf,
  enabledOf,
  formOf,
  problemsOf,
  type MailAdminField,
  type MailAdminForm,
} from './mailIngestAdminModel';

/**
 * The admin card of the booking mail import, desktop and phone alike: the
 * instance switch (saved at once, as every switch in the admin settings), the
 * transport fields (saved together, only the changed ones), the connection
 * test and the status in counts. Loads once when shown.
 */
export function useMailIngestAdmin(active: boolean) {
  const { t } = useTranslation();
  const toast = useToast();
  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState<MailAdminForm | null>(null);
  const [form, setForm] = useState<MailAdminForm | null>(null);
  const [status, setStatus] = useState<MailIngestAdminStatusResponse | null>(null);
  const [test, setTest] = useState<MailIngestAdminTestResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await mailIngestRepo.adminStatus());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void (async () => {
      try {
        const raw = await mailIngestRepo.adminSettings();
        if (cancelled) return;
        const loaded = formOf(raw);
        setEnabled(enabledOf(raw));
        setSaved(loaded);
        setForm(loaded);
      } catch {
        if (!cancelled) toast.error(t('mailAdmin.loadError'));
      }
      if (!cancelled) await loadStatus();
    })();
    return () => {
      cancelled = true;
    };
  }, [active, loadStatus, t, toast]);

  const toggle = async (on: boolean) => {
    setEnabled(on);
    try {
      await mailIngestRepo.saveAdminSettings({ [ENABLED_KEY]: on });
      void loadStatus();
    } catch (err: unknown) {
      setEnabled(!on);
      toast.error(getApiErrorMessage(err, t('common.error')));
    }
  };

  const set = <K extends MailAdminField>(field: K, value: MailAdminForm[K]) =>
    setForm((current) => (current ? { ...current, [field]: value } : current));

  const patch = form && saved ? changesOf(form, saved) : {};
  const problems = form ? problemsOf(form) : [];

  const save = async () => {
    if (!form || Object.keys(patch).length === 0 || problems.length > 0) return;
    setSaving(true);
    try {
      await mailIngestRepo.saveAdminSettings(patch);
      setSaved(form);
      setTest(null);
      toast.success(t('common.saved'));
      void loadStatus();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    try {
      setTest(await mailIngestRepo.adminTest());
    } catch (err: unknown) {
      setTest({ transport: form?.transport ?? 'off', ok: false, error: getApiErrorMessage(err, t('common.error')) });
    } finally {
      setTesting(false);
    }
  };

  return {
    loaded: form !== null,
    enabled,
    toggle: (on: boolean) => void toggle(on),
    form,
    set,
    dirty: Object.keys(patch).length > 0,
    problems,
    saving,
    save: () => void save(),
    status,
    test,
    testing,
    runTest: () => void runTest(),
  };
}

export type MailIngestAdmin = ReturnType<typeof useMailIngestAdmin>;
