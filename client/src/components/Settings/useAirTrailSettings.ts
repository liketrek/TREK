import { useEffect, useState } from 'react';
import { airtrailApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useToast } from '../shared/Toast';

/**
 * The per-user AirTrail connection form behind both settings shells: the desktop
 * section and its phone twin render their own markup over this. The key is never
 * prefilled, so a blank field means "keep the stored key". Not to be confused with
 * hooks/useAirtrailConnection, which only answers whether a trip may offer AirTrail.
 */
export function useAirTrailSettings() {
  const { t } = useTranslation();
  const toast = useToast();

  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [allowInsecureTls, setAllowInsecureTls] = useState(false);
  const [writeEnabled, setWriteEnabled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    airtrailApi
      .getSettings()
      .then((d) => {
        setUrl(d.url || '');
        setAllowInsecureTls(!!d.allowInsecureTls);
        setWriteEnabled(!!d.writeEnabled);
        setConnected(!!d.connected);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Send the key only when the user typed a new one, never prefilled, so a blank
  // field means "keep the stored key".
  const keyPayload = (): { apiKey?: string } => {
    const k = apiKey.trim();
    return k ? { apiKey: k } : {};
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const d = await airtrailApi.saveSettings({ url: url.trim(), allowInsecureTls, writeEnabled, ...keyPayload() });
      const status = await airtrailApi.status().catch(() => ({ connected: false }));
      setConnected(!!status.connected);
      setApiKey('');
      if (d?.warning) toast.warning(d.warning);
      else toast.success(t('settings.airtrail.toast.saved'));
    } catch (err) {
      const reason = (err as { response?: { data?: { error?: string } } } | null)?.response?.data?.error;
      toast.error(reason || t('settings.airtrail.toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const d = await airtrailApi.test({ url: url.trim(), allowInsecureTls, ...keyPayload() });
      setConnected(!!d.connected);
      if (d.connected) toast.success(t('settings.airtrail.test.success', { count: d.flightCount ?? 0 }));
      else toast.error(d.error || t('settings.airtrail.test.failed'));
    } catch {
      toast.error(t('settings.airtrail.test.failed'));
    } finally {
      setTesting(false);
    }
  };

  const canSave = !!url.trim() && (connected || !!apiKey.trim());

  return {
    url,
    setUrl,
    apiKey,
    setApiKey,
    allowInsecureTls,
    toggleInsecureTls: () => setAllowInsecureTls((v) => !v),
    writeEnabled,
    toggleWriteEnabled: () => setWriteEnabled((v) => !v),
    connected,
    loading,
    saving,
    testing,
    canSave,
    handleSave,
    handleTest,
  };
}
