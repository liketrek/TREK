import { useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/client';
import { useTranslation } from '../../i18n';
import { useAddonStore } from '../../store/addonStore';
import { useToast } from '../shared/Toast';

export interface ProviderField {
  key: string;
  label: string;
  input_type: string;
  placeholder?: string | null;
  hint?: string | null;
  required: boolean;
  secret: boolean;
  settings_key?: string | null;
  payload_key?: string | null;
  sort_order: number;
}

export interface PhotoProviderAddon {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  fields?: ProviderField[];
}

export interface ProviderConfig {
  settings_get?: string;
  settings_put?: string;
  status_get?: string;
  test_get?: string;
  test_post?: string;
}

export const getProviderConfig = (provider: PhotoProviderAddon): ProviderConfig => {
  const raw = provider.config || {};
  return {
    settings_get: typeof raw.settings_get === 'string' ? raw.settings_get : undefined,
    settings_put: typeof raw.settings_put === 'string' ? raw.settings_put : undefined,
    status_get: typeof raw.status_get === 'string' ? raw.status_get : undefined,
    test_get: typeof raw.test_get === 'string' ? raw.test_get : undefined,
    test_post: typeof raw.test_post === 'string' ? raw.test_post : undefined,
  };
};

export const getProviderFields = (provider: PhotoProviderAddon): ProviderField[] => {
  return [...(provider.fields || [])].sort((a, b) => a.sort_order - b.sort_order);
};

export interface PhotoProviderConnectionOptions {
  /**
   * When the provider has a status route, let only that route set the badge and
   * ignore the `connected` flag of the settings read, so the two responses cannot
   * race. The phone does this; the desktop takes whichever answer lands last.
   */
  statusRouteOwnsBadge: boolean;
}

/**
 * The photo provider connection cards behind both settings shells: every enabled
 * photo_provider addon with its declared fields, seeded and hydrated values
 * (secrets never prefilled), the connection badge, and save and test. The desktop
 * section and its phone twin render their own markup over this.
 */
export function usePhotoProviderConnections({ statusRouteOwnsBadge }: PhotoProviderConnectionOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const { isEnabled: addonEnabled, addons } = useAddonStore();
  const memoriesEnabled = addonEnabled('memories');

  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [providerValues, setProviderValues] = useState<Record<string, Record<string, string>>>({});
  const [providerConnected, setProviderConnected] = useState<Record<string, boolean>>({});
  const [providerTesting, setProviderTesting] = useState<Record<string, boolean>>({});

  const activePhotoProviders = useMemo(
    () => addons.filter((a) => a.type === 'photo_provider' && a.enabled) as PhotoProviderAddon[],
    [addons]
  );

  const buildProviderPayload = (provider: PhotoProviderAddon): Record<string, unknown> => {
    const values = providerValues[provider.id] || {};
    const payload: Record<string, unknown> = {};
    for (const field of getProviderFields(provider)) {
      const payloadKey = field.payload_key || field.settings_key || field.key;
      if (field.input_type === 'checkbox') {
        payload[payloadKey] = values[field.key] === 'true';
        continue;
      }
      const value = (values[field.key] || '').trim();
      if (field.secret && !value) continue;
      payload[payloadKey] = value;
    }
    return payload;
  };

  const refreshProviderConnection = async (provider: PhotoProviderAddon) => {
    const cfg = getProviderConfig(provider);
    const statusPath = cfg.status_get;
    if (!statusPath) return;
    try {
      const res = await apiClient.get(statusPath);
      setProviderConnected((prev) => ({ ...prev, [provider.id]: !!res.data?.connected }));
    } catch {
      setProviderConnected((prev) => ({ ...prev, [provider.id]: false }));
    }
  };

  const activeProviderSignature = useMemo(
    () => activePhotoProviders.map((provider) => provider.id).join('|'),
    [activePhotoProviders]
  );

  useEffect(() => {
    let isCancelled = false;

    for (const provider of activePhotoProviders) {
      const cfg = getProviderConfig(provider);
      const fields = getProviderFields(provider);

      // Seed checkbox defaults before the async settings load resolves
      const checkboxDefaults: Record<string, string> = {};
      for (const field of fields) {
        if (field.input_type === 'checkbox') checkboxDefaults[field.key] = 'false';
      }
      if (Object.keys(checkboxDefaults).length > 0) {
        setProviderValues((prev) => ({
          ...prev,
          [provider.id]: { ...checkboxDefaults, ...(prev[provider.id] || {}) },
        }));
      }

      if (cfg.settings_get) {
        apiClient
          .get(cfg.settings_get)
          .then((res) => {
            if (isCancelled) return;

            const nextValues: Record<string, string> = {};
            for (const field of fields) {
              // Do not prefill secret fields; user can overwrite only when needed.
              if (field.secret) continue;
              const sourceKey = field.settings_key || field.payload_key || field.key;
              const rawValue = (res.data as Record<string, unknown>)[sourceKey];
              if (rawValue != null) {
                nextValues[field.key] = typeof rawValue === 'string' ? rawValue : String(rawValue);
              } else if (field.input_type === 'checkbox') {
                nextValues[field.key] = 'false';
              } else {
                nextValues[field.key] = '';
              }
            }
            setProviderValues((prev) => ({
              ...prev,
              [provider.id]: { ...(prev[provider.id] || {}), ...nextValues },
            }));
            if (!(statusRouteOwnsBadge && cfg.status_get) && typeof res.data?.connected === 'boolean') {
              setProviderConnected((prev) => ({ ...prev, [provider.id]: !!res.data.connected }));
            }
          })
          .catch(() => {});
      }

      refreshProviderConnection(provider).catch(() => {});
    }

    return () => {
      isCancelled = true;
    };
  }, [activePhotoProviders, activeProviderSignature, statusRouteOwnsBadge]);

  const handleProviderFieldChange = (providerId: string, key: string, value: string) => {
    setProviderValues((prev) => ({
      ...prev,
      [providerId]: { ...(prev[providerId] || {}), [key]: value },
    }));
  };

  const isProviderSaveDisabled = (provider: PhotoProviderAddon): boolean => {
    const values = providerValues[provider.id] || {};
    return getProviderFields(provider).some((field) => {
      if (!field.required) return false;
      return !(values[field.key] || '').trim();
    });
  };

  const handleSaveProvider = async (provider: PhotoProviderAddon) => {
    const cfg = getProviderConfig(provider);
    if (!cfg.settings_put) return;
    setSaving((s) => ({ ...s, [provider.id]: true }));
    try {
      await apiClient.put(cfg.settings_put, buildProviderPayload(provider));
      await refreshProviderConnection(provider);
      toast.success(t('memories.saved', { provider_name: provider.name }));
    } catch {
      toast.error(t('memories.saveError', { provider_name: provider.name }));
    } finally {
      setSaving((s) => ({ ...s, [provider.id]: false }));
    }
  };

  const handleTestProvider = async (provider: PhotoProviderAddon) => {
    const cfg = getProviderConfig(provider);
    const testPath = cfg.test_post || cfg.test_get || cfg.status_get;
    if (!testPath) return;
    setProviderTesting((prev) => ({ ...prev, [provider.id]: true }));
    try {
      // Only a POST probe carries the form values. A provider that declares just a
      // GET (test_get / status_get) is probed against its saved credentials.
      const res = cfg.test_post
        ? await apiClient.post(testPath, buildProviderPayload(provider))
        : await apiClient.get(testPath);
      const ok = !!res.data?.connected;
      setProviderConnected((prev) => ({ ...prev, [provider.id]: ok }));
      if (ok) {
        toast.success(t('memories.connectionSuccess', { provider_name: provider.name }));
      } else {
        const detail = res.data?.error ? `: ${String(res.data.error)}` : '';
        toast.error(`${t('memories.connectionError', { provider_name: provider.name })}${detail}`);
      }
    } catch {
      toast.error(t('memories.connectionError', { provider_name: provider.name }));
    } finally {
      setProviderTesting((prev) => ({ ...prev, [provider.id]: false }));
    }
  };

  return {
    memoriesEnabled,
    activePhotoProviders,
    providerValues,
    providerConnected,
    providerTesting,
    saving,
    handleProviderFieldChange,
    isProviderSaveDisabled,
    handleSaveProvider,
    handleTestProvider,
  };
}
