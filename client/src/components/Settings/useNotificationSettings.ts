import { useEffect, useEffectEvent, useState } from 'react';

import { notificationsApi, settingsApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useToast } from '../shared/Toast';
import { isLockedCell } from './notificationLabels';

export interface ChannelDescriptor {
  id: string;
  source: 'builtin' | 'plugin';
  /** Built-ins: an i18n key. */
  labelKey?: string;
  /** Plugin channels: a literal name, already resolved by the server. */
  label?: string;
  settingsPath?: string;
  active: boolean;
  configured: boolean;
}

export interface PreferencesMatrix {
  preferences: Record<string, Record<string, boolean>>;
  channels: ChannelDescriptor[];
  event_types: string[];
  implemented_combos: Record<string, string[]>;
  /** Cells the admin switched off for everyone (#1536). */
  locked?: Record<string, string[]>;
  defaults?: { ntfyServer: string | null };
}

/** What the server sends back in place of a stored secret. */
export const MASKED = '••••••••';

export interface NotificationSettingsOptions {
  /** The phone never sends an ntfy token that reads exactly like the mask. */
  skipMaskedToken?: boolean;
}

/**
 * The notification settings behind both settings shells (the desktop tab and the
 * phone section render their own markup over this): the event/channel matrix, the
 * webhook and ntfy credentials, and the test sends for every channel.
 */
export function useNotificationSettings({ skipMaskedToken = false }: NotificationSettingsOptions = {}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [matrix, setMatrix] = useState<PreferencesMatrix | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookIsSet, setWebhookIsSet] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [ntfyServer, setNtfyServer] = useState('');
  const [ntfyToken, setNtfyToken] = useState('');
  const [ntfyTokenIsSet, setNtfyTokenIsSet] = useState(false);
  const [ntfySaving, setNtfySaving] = useState(false);
  const [ntfyTesting, setNtfyTesting] = useState(false);
  const [channelTesting, setChannelTesting] = useState<string | null>(null);

  // The loader runs once; the error toast reads the latest t and toast.
  const loadError = useEffectEvent(() => toast.error(t('common.error')));

  useEffect(() => {
    let cancelled = false;
    // Both loads fail together when the server is down; one toast is enough,
    // the matrix shows its own error line.
    let toasted = false;
    const failed = () => {
      if (toasted) return;
      toasted = true;
      loadError();
    };
    notificationsApi
      .getPreferences()
      .then((data: PreferencesMatrix) => {
        if (!cancelled) setMatrix(data);
      })
      .catch(() => {
        // Without this the matrix would sit on its loading line for good.
        if (cancelled) return;
        setLoadFailed(true);
        failed();
      });
    settingsApi
      .get()
      .then((data: { settings: Record<string, unknown> }) => {
        if (cancelled) return;
        const val = (data.settings?.webhook_url as string) || '';
        if (val === MASKED) {
          setWebhookIsSet(true);
          setWebhookUrl('');
        } else {
          setWebhookUrl(val);
        }
        setNtfyTopic((data.settings?.ntfy_topic as string) || '');
        setNtfyServer((data.settings?.ntfy_server as string) || '');
        const rawToken = (data.settings?.ntfy_token as string) || '';
        if (rawToken === MASKED) {
          setNtfyTokenIsSet(true);
          setNtfyToken('');
        } else {
          setNtfyToken(rawToken);
        }
      })
      .catch(() => {
        if (!cancelled) failed();
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Columns are whatever the server says exists and the admin turned on, so a
  // plugin channel gets a column here with no client change.
  const visibleChannels = matrix
    ? matrix.channels.filter((ch) => {
        if (!ch.active) return false;
        return matrix.event_types.some((evt) => matrix.implemented_combos[evt]?.includes(ch.id));
      })
    : [];

  const hasChannel = (id: string) => matrix?.channels.some((ch) => ch.id === id && ch.active) ?? false;

  // Plugin channels have no bespoke credential form here; the user fills those in on the
  // plugin's own settings page. What they DO get is a test send, through the generic route.
  const pluginChannels = matrix?.channels.filter((ch) => ch.source === 'plugin' && ch.active) ?? [];

  // A stored token is only masked in the placeholder, never in state, so an empty
  // token makes the server fall back to the saved one.
  const tokenToSend = skipMaskedToken ? ntfyToken && ntfyToken !== MASKED : ntfyToken;

  const testChannel = async (ch: ChannelDescriptor) => {
    setChannelTesting(ch.id);
    try {
      const result = await notificationsApi.testChannel(ch.id);
      if (result.success) toast.success(t('settings.notificationPreferences.testSuccess'));
      else toast.error(result.error || t('settings.notificationPreferences.testFailed'));
    } catch {
      toast.error(t('settings.notificationPreferences.testFailed'));
    } finally {
      setChannelTesting(null);
    }
  };

  const toggle = async (eventType: string, channel: string) => {
    if (!matrix || isLockedCell(matrix.locked, eventType, channel)) return;
    const current = matrix.preferences[eventType]?.[channel] ?? true;
    setMatrix((m) =>
      m
        ? {
            ...m,
            preferences: { ...m.preferences, [eventType]: { ...m.preferences[eventType], [channel]: !current } },
          }
        : m
    );
    // Only the toggled cell goes out. The server merges what it gets, and sending the
    // whole matrix would carry this render's value for every other cell: a second
    // toggle made while this request is in flight would be overwritten by it.
    const payload = { [eventType]: { [channel]: !current } };
    setSaving(true);
    try {
      await notificationsApi.updatePreferences(payload);
    } catch {
      // Only this cell rolls back: restoring the whole snapshot would also undo a
      // toggle the user made while this request was in flight.
      setMatrix((m) =>
        m
          ? {
              ...m,
              preferences: { ...m.preferences, [eventType]: { ...m.preferences[eventType], [channel]: current } },
            }
          : m
      );
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const saveWebhookUrl = async () => {
    setWebhookSaving(true);
    try {
      await settingsApi.set('webhook_url', webhookUrl);
      setWebhookIsSet(!!webhookUrl);
      toast.success(t('settings.webhookUrl.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setWebhookSaving(false);
    }
  };

  const testWebhookUrl = async () => {
    if (!webhookUrl && !webhookIsSet) return;
    setWebhookTesting(true);
    try {
      const result = await notificationsApi.testWebhook(webhookUrl || undefined);
      if (result.success) toast.success(t('settings.webhookUrl.testSuccess'));
      else toast.error(result.error || t('settings.webhookUrl.testFailed'));
    } catch {
      toast.error(t('settings.webhookUrl.testFailed'));
    } finally {
      setWebhookTesting(false);
    }
  };

  const saveNtfySettings = async () => {
    setNtfySaving(true);
    try {
      await settingsApi.setBulk({
        ntfy_topic: ntfyTopic,
        ntfy_server: ntfyServer,
        ...(tokenToSend ? { ntfy_token: ntfyToken } : {}),
      });
      if (tokenToSend) setNtfyTokenIsSet(true);
      toast.success(t('settings.ntfyUrl.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setNtfySaving(false);
    }
  };

  const clearNtfyToken = async () => {
    try {
      await settingsApi.set('ntfy_token', '');
      setNtfyToken('');
      setNtfyTokenIsSet(false);
      toast.success(t('settings.ntfyUrl.tokenCleared'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const testNtfySettings = async () => {
    if (!ntfyTopic) return;
    setNtfyTesting(true);
    try {
      const result = await notificationsApi.testNtfy({
        topic: ntfyTopic,
        server: ntfyServer || null,
        token: tokenToSend ? ntfyToken : null,
      });
      if (result.success) toast.success(t('settings.ntfyUrl.testSuccess'));
      else toast.error(result.error || t('settings.ntfyUrl.testFailed'));
    } catch {
      toast.error(t('settings.ntfyUrl.testFailed'));
    } finally {
      setNtfyTesting(false);
    }
  };

  return {
    matrix,
    loadFailed,
    saving,
    visibleChannels,
    hasChannel,
    pluginChannels,
    toggle,
    testChannel,
    channelTesting,
    webhookUrl,
    setWebhookUrl,
    webhookIsSet,
    webhookSaving,
    webhookTesting,
    saveWebhookUrl,
    testWebhookUrl,
    ntfyTopic,
    setNtfyTopic,
    ntfyServer,
    setNtfyServer,
    ntfyToken,
    setNtfyToken,
    ntfyTokenIsSet,
    ntfySaving,
    ntfyTesting,
    saveNtfySettings,
    clearNtfyToken,
    testNtfySettings,
  };
}
