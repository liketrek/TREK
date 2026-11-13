import { mailIngestSettingsResponseSchema, mailIngestUploadResponseSchema, type MailIngestPrefs } from '@trek/shared';
import { useEffect, useRef, useState } from 'react';
import { mailIngestApi } from '../../api/mailIngest';
import { useTranslation } from '../../i18n';
import { useMailIngestStore } from '../../store/mailIngestStore';
import { copyText } from '../../utils/clipboard';
import { useToast } from '../shared/Toast';

/** How long the renew button waits for its second tap before it gives up. */
const CONFIRM_MS = 4000;

/**
 * The booking mail import card behind both settings shells: the person's
 * address with copy and renew, the three switches, and the .eml upload. The
 * desktop section and its phone twin only lay this out. Renewing needs a second
 * tap within a few seconds, because the old address stops working at once and
 * every forwarding rule pointing at it has to change.
 */
export function useMailImportSettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const settings = useMailIngestStore((s) => s.settings);
  const setSettings = useMailIngestStore((s) => s.setSettings);
  const loadSettings = useMailIngestStore((s) => s.loadSettings);
  const [saving, setSaving] = useState<keyof MailIngestPrefs | null>(null);
  const [renewArmed, setRenewArmed] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const armTimer = useRef(0);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);
  useEffect(() => () => window.clearTimeout(armTimer.current), []);

  const toggle = async (key: keyof MailIngestPrefs) => {
    if (!settings || saving) return;
    setSaving(key);
    try {
      const parsed = mailIngestSettingsResponseSchema.parse(
        await mailIngestApi.updateSettings({ [key]: !settings.prefs[key] }),
      );
      setSettings(parsed);
    } catch {
      toast.error(t('mailInbox.settings.saveError'));
    } finally {
      setSaving(null);
    }
  };

  const copyAddress = async () => {
    if (!settings?.address) return;
    if (await copyText(settings.address.address)) toast.success(t('common.copied'));
    else toast.error(t('mailInbox.settings.copyError'));
  };

  const renew = async () => {
    if (!renewArmed) {
      setRenewArmed(true);
      armTimer.current = window.setTimeout(() => setRenewArmed(false), CONFIRM_MS);
      return;
    }
    window.clearTimeout(armTimer.current);
    setRenewArmed(false);
    setRenewing(true);
    try {
      await mailIngestApi.renewAddress();
      await loadSettings();
      toast.success(t('mailInbox.settings.renewed'));
    } catch {
      toast.error(t('mailInbox.settings.saveError'));
    } finally {
      setRenewing(false);
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { duplicate } = mailIngestUploadResponseSchema.parse(await mailIngestApi.upload(file));
      toast.success(duplicate ? t('mailInbox.settings.uploadDuplicate') : t('mailInbox.settings.uploaded'));
    } catch {
      toast.error(t('mailInbox.settings.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return {
    /** Null while loading; the card renders nothing where the import is not available. */
    settings: settings?.available ? settings : null,
    saving,
    toggle,
    copyAddress,
    renew,
    renewArmed,
    renewing,
    upload,
    uploading,
  };
}
