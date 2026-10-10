import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import type { Settings } from '../../types';
import { useToast } from '../shared/Toast';

export type LlmProvider = NonNullable<Settings['llm_provider']>;

/**
 * The per-user AI parsing model form behind both settings shells (the desktop
 * section and its phone twin render their own markup over this). The key is never
 * prefilled: a blank field keeps the stored key. Only the two hosted providers are
 * offered (#1772), the endpoint is instance configuration.
 */
export function useLlmConnection() {
  const { t } = useTranslation();
  const toast = useToast();
  const settings = useSettingsStore((s) => s.settings);
  const isLoaded = useSettingsStore((s) => s.isLoaded);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  const [provider, setProvider] = useState<LlmProvider>('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [multimodal, setMultimodal] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate from the loaded settings. llm_api_key arrives masked, so we only use
  // its presence to drive the placeholder, never the value itself. A stored
  // 'local' from before #1772 shows as OpenAI (local state only, nothing is
  // saved until Save is pressed) so the form never offers a value the server
  // would refuse.
  useEffect(() => {
    if (!isLoaded) return;
    const stored = settings.llm_provider || 'openai';
    setProvider(stored === 'local' ? 'openai' : stored);
    setModel(settings.llm_model || '');
    setMultimodal(settings.llm_multimodal === true);
    setHasStoredKey(!!settings.llm_api_key);
  }, [isLoaded, settings.llm_provider, settings.llm_model, settings.llm_multimodal, settings.llm_api_key]);

  const providerOptions = useMemo(
    () => [
      { value: 'openai' as const, label: t('settings.aiParsing.providerOpenai') },
      { value: 'anthropic' as const, label: t('settings.aiParsing.providerAnthropic') },
    ],
    [t]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<Settings> = {
        llm_provider: provider,
        llm_model: model.trim(),
        // Always cleared: the endpoint is instance configuration now, and this
        // also drops a value left over from before #1772.
        llm_base_url: '',
        llm_multimodal: multimodal,
      };
      // Send the key only when the user typed a new one, a blank field means
      // "keep the stored key".
      const key = apiKey.trim();
      if (key) payload.llm_api_key = key;
      await updateSettings(payload);
      setApiKey('');
      if (key) setHasStoredKey(true);
      toast.success(t('settings.aiParsing.toast.saved'));
    } catch {
      // updateSettings patches the store before the request and keeps the patch
      // when the request fails, so a refused save (the 403 from #1772, or any
      // other error) would leave the form showing a value the server never
      // stored. Pull the stored settings back in so what is on screen is real.
      await loadSettings();
      toast.error(t('settings.aiParsing.toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return {
    isLoaded,
    provider,
    setProvider,
    providerOptions,
    model,
    setModel,
    apiKey,
    setApiKey,
    multimodal,
    toggleMultimodal: () => setMultimodal((v) => !v),
    hasStoredKey,
    saving,
    handleSave,
  };
}
