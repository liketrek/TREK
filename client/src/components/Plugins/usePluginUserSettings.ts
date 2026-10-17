import { useEffect, useState } from 'react';
import { pluginsApi, type PluginAction, type PluginUserSettingField } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useToast } from '../shared/Toast';
import { findMissingRequired, seedSettingsValues, settingsPatch, type SettingsValues } from './settingsForm';

export interface PluginOAuthState {
  configured: boolean;
  connected: boolean;
}

export interface PluginActionOutcome {
  ok: boolean;
  message?: string;
}

/**
 * A user's own settings for one plugin, behind the desktop settings tab and the
 * phone screen alike: the declared `scope:'user'` fields and their draft values,
 * the declared actions with their results, and the host-brokered OAuth state. Each
 * shell renders its own form, confirm step and picker over this.
 */
export function usePluginUserSettings(id: string) {
  const { t } = useTranslation();
  const toast = useToast();
  const [fields, setFields] = useState<PluginUserSettingField[] | null>(null);
  const [values, setValues] = useState<SettingsValues>({});
  const [saving, setSaving] = useState(false);
  const [oauth, setOauth] = useState<PluginOAuthState | null>(null);
  const [actions, setActions] = useState<PluginAction[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<Record<string, PluginActionOutcome>>({});
  // A dangerous action waits here for the user's answer in the confirm step.
  const [pendingAction, setPendingAction] = useState<PluginAction | null>(null);

  useEffect(() => {
    let alive = true;
    pluginsApi
      .userSettings(id)
      .then((r) => {
        if (!alive) return;
        setFields(r.fields);
        setActions(r.actions ?? []);
        setValues(seedSettingsValues(r.fields, r.config));
      })
      .catch(() => {
        if (alive) setFields([]);
      });
    pluginsApi
      .oauthStatus(id)
      .then((s) => {
        if (alive) setOauth(s);
      })
      .catch(() => {
        if (alive) setOauth(null);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const hasFields = (fields?.length ?? 0) > 0;
  // Show the card if the plugin has user fields, actions, OR an OAuth connection to offer.
  const visible = fields !== null && (hasFields || actions.length > 0 || !!oauth?.configured);

  // An action runs AS the caller, so it sees the values they just saved. Running the save
  // first if the form is dirty would be nicer, but keeping it explicit is less surprising.
  const performAction = async (a: PluginAction) => {
    setRunning(a.key);
    try {
      const res = await pluginsApi.runAction(id, a.key);
      setActionResult((prev) => ({ ...prev, [a.key]: res }));
    } catch {
      setActionResult((prev) => ({ ...prev, [a.key]: { ok: false, message: t('common.error') } }));
    } finally {
      setRunning(null);
    }
  };

  const runAction = (a: PluginAction) => {
    if (a.danger) {
      setPendingAction(a);
      return;
    }
    void performAction(a);
  };

  const save = async () => {
    if (!fields) return;
    const missing = findMissingRequired(fields, values);
    if (missing) {
      toast.error(t('settings.plugins.requiredMissing', { field: missing.label || missing.key }));
      return;
    }
    setSaving(true);
    try {
      const r = await pluginsApi.saveUserSettings(id, settingsPatch(fields, values));
      setValues(seedSettingsValues(fields, r.config));
      toast.success(t('settings.plugins.saved'));
    } catch (e) {
      // A 4xx names what the server refused (a required field it knows about and this
      // stale field list doesn't); a 5xx body is not for the user.
      const err = e as { response?: { status?: number; data?: { error?: string } } };
      const refused = err.response?.status && err.response.status < 500 ? err.response.data?.error : undefined;
      toast.error(refused || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const setValue = (key: string, value: string | boolean) => setValues((v) => ({ ...v, [key]: value }));

  return {
    fields,
    values,
    setValue,
    hasFields,
    visible,
    saving,
    save,
    actions,
    running,
    actionResult,
    runAction,
    performAction,
    pendingAction,
    setPendingAction,
    oauth,
    setOauth,
  };
}

/**
 * Host-brokered OAuth for one plugin: the host runs the whole flow and holds the
 * tokens, so this only starts a connect (a redirect to the provider) or a disconnect.
 */
export function usePluginOAuth(id: string, state: PluginOAuthState | null, setState: (s: PluginOAuthState) => void) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      const { authorizeUrl } = await pluginsApi.oauthConnect(id);
      window.location.href = authorizeUrl; // hand off to the provider; returns to /settings
    } catch {
      toast.error(t('common.error'));
      setBusy(false);
    }
  };
  const disconnect = async () => {
    if (!state) return;
    setBusy(true);
    try {
      await pluginsApi.oauthDisconnect(id);
      setState({ ...state, connected: false });
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return { busy, connect, disconnect };
}
