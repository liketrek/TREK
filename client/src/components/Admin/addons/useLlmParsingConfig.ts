import { type LlmVision, asLlmVision } from '@trek/shared';
import { useEffect, useEffectEvent, useState } from 'react';

import { adminApi } from '../../../api/client';
import { useToast } from '../../shared/Toast';
import { type Addon, DEFAULT_OLLAMA_URL } from './addonModel';

/**
 * Instance-wide AI-parsing config behind both admin shells. When set, it applies to the
 * whole instance and overrides per-user config (see server llmConfig.ts). The API key is
 * masked on read; an unchanged mask is treated as a no-op by the server. For the local
 * provider it also lists the installed Ollama models and can pull the recommended ones.
 */
export function useLlmParsingConfig(addon: Addon) {
  const toast = useToast();
  const cfg = addon.config ?? {};
  const [provider, setProvider] = useState<string>((cfg.provider as string) ?? 'local');
  const [model, setModel] = useState<string>((cfg.model as string) ?? '');
  const [baseUrl, setBaseUrl] = useState<string>((cfg.baseUrl as string) ?? '');
  const [apiKey, setApiKey] = useState<string>((cfg.apiKey as string) ?? '');
  const [vision, setVision] = useState<LlmVision>(asLlmVision(cfg.vision));
  const [saving, setSaving] = useState(false);

  // Local-provider model management.
  const [installed, setInstalled] = useState<string[]>([]);
  const [modelsErr, setModelsErr] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullPct, setPullPct] = useState(0);
  const [pullStatus, setPullStatus] = useState('');

  const effectiveUrl = baseUrl.trim() || DEFAULT_OLLAMA_URL;
  const isInstalled = (id: string) => installed.some((n) => n === id || n.startsWith(id + ':') || n.startsWith(id));

  const loadModels = async () => {
    if (provider !== 'local') return;
    setLoadingModels(true);
    setModelsErr('');
    try {
      const res = await adminApi.llmLocalModels(effectiveUrl);
      setInstalled(res.models.map((m) => m.name));
    } catch (e: unknown) {
      setModelsErr(e instanceof Error ? e.message : 'Could not reach the local LLM server');
      setInstalled([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // Load installed models when the local provider is active. Only a provider change
  // triggers it; the base URL is read as it stands then (its own blur reloads).
  const loadModelsForProvider = useEffectEvent(() => {
    if (provider === 'local') void loadModels();
  });
  useEffect(() => {
    loadModelsForProvider();
  }, [provider]);

  const pull = async (id: string) => {
    if (pulling) return;
    setPulling(id);
    setPullPct(0);
    setPullStatus('starting…');
    try {
      await adminApi.llmLocalPull(effectiveUrl, id, (p) => {
        if (p.error) throw new Error(p.error);
        if (p.status) setPullStatus(p.status);
        if (p.total && p.completed != null) setPullPct(Math.round((p.completed / p.total) * 100));
      });
      toast.success('Model pulled');
      setModel(id);
      await loadModels();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Pull failed');
    } finally {
      setPulling(null);
      setPullPct(0);
      setPullStatus('');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      // Send the masked sentinel unchanged so the server keeps the stored key.
      await adminApi.updateAddon(addon.id, {
        config: {
          provider,
          model: model.trim(),
          baseUrl: provider === 'anthropic' ? '' : baseUrl.trim(),
          apiKey,
          vision,
        },
      });
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return {
    provider,
    setProvider,
    model,
    setModel,
    baseUrl,
    setBaseUrl,
    apiKey,
    setApiKey,
    vision,
    setVision,
    saving,
    installed,
    modelsErr,
    loadingModels,
    pulling,
    pullPct,
    pullStatus,
    isInstalled,
    loadModels,
    pull,
    save,
  };
}
