import { type LlmVision, asLlmVision } from '@trek/shared';
import { useEffect, useEffectEvent, useState } from 'react';

import { adminApi } from '../../../api/client';
import { useTranslation } from '../../../i18n';
import { getApiErrorMessage } from '../../../types';
import { useToast } from '../../shared/Toast';
import { type Addon, DEFAULT_OLLAMA_URL, LLM_BASE_URL_PLACEHOLDER } from './addonModel';

/** What AI parsing keeps in its addon config: a connection of its own (or none) and the vision setting. */
interface SavedParsing {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  vision: LlmVision;
}

function savedOf(cfg: Record<string, unknown>): SavedParsing {
  return {
    provider: typeof cfg.provider === 'string' ? cfg.provider : '',
    model: typeof cfg.model === 'string' ? cfg.model : '',
    baseUrl: typeof cfg.baseUrl === 'string' ? cfg.baseUrl : '',
    apiKey: typeof cfg.apiKey === 'string' ? cfg.apiKey : '',
    vision: asLlmVision(cfg.vision),
  };
}

/**
 * The models a local (Ollama) server has, and pulling the recommended ones.
 * The list loads while the form shows the local provider: a provider change or
 * opening the form loads it, the address field's own blur reloads it.
 */
function useLocalModels(baseUrl: string, isLocal: boolean, formOpen: boolean, onPulled: (id: string) => void) {
  const { t } = useTranslation();
  const toast = useToast();
  const [installed, setInstalled] = useState<string[]>([]);
  const [modelsErr, setModelsErr] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullPct, setPullPct] = useState(0);
  const [pullStatus, setPullStatus] = useState('');
  const effectiveUrl = baseUrl.trim() || DEFAULT_OLLAMA_URL;
  const isInstalled = (id: string) => installed.some((n) => n === id || n.startsWith(id + ':') || n.startsWith(id));

  const loadModels = async () => {
    if (!isLocal) return;
    setLoadingModels(true);
    setModelsErr('');
    try {
      const res = await adminApi.llmLocalModels(effectiveUrl);
      setInstalled(res.models.map((m) => m.name));
    } catch (e: unknown) {
      // The server says why (unreachable, key refused); axios' own status line does not.
      setModelsErr(getApiErrorMessage(e, t('admin.addons.ai.parsing.unreachable')));
      setInstalled([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadModelsForProvider = useEffectEvent(() => {
    if (formOpen && isLocal) void loadModels();
  });
  useEffect(() => {
    loadModelsForProvider();
  }, [isLocal, formOpen]);

  const pull = async (id: string) => {
    if (pulling) return;
    setPulling(id);
    setPullPct(0);
    setPullStatus(t('admin.addons.ai.parsing.pulling'));
    try {
      await adminApi.llmLocalPull(effectiveUrl, id, (p) => {
        if (p.error) throw new Error(p.error);
        if (p.status) setPullStatus(p.status);
        if (p.total && p.completed != null) setPullPct(Math.round((p.completed / p.total) * 100));
      });
      toast.success(t('admin.addons.ai.parsing.pulled'));
      onPulled(id);
      await loadModels();
    } catch (e: unknown) {
      toast.error(e instanceof Error && e.message ? e.message : t('admin.addons.ai.parsing.pullFailed'));
    } finally {
      setPulling(null);
      setPullPct(0);
      setPullStatus('');
    }
  };

  return { installed, modelsErr, loadingModels, pulling, pullPct, pullStatus, isInstalled, loadModels, pull };
}

/**
 * AI parsing's admin settings behind both admin shells. Parsing reads with the
 * AI connection the assistant runs on unless the instance keeps one of its own
 * here; an install set up before the two shared one keeps its own until the
 * admin switches it over. The API key is masked on read and an unchanged mask
 * keeps the stored key. For a local server it lists the installed Ollama models
 * and pulls the recommended ones.
 */
export function useLlmParsingConfig(addon: Addon) {
  const { t } = useTranslation();
  const toast = useToast();
  const [saved, setSaved] = useState<SavedParsing>(() => savedOf(addon.config ?? {}));
  const [editing, setEditing] = useState(false);
  const [provider, setProviderState] = useState<string>(saved.provider || 'local');
  const [model, setModel] = useState<string>(saved.model);
  const [baseUrl, setBaseUrl] = useState<string>(saved.baseUrl);
  const [apiKey, setApiKey] = useState<string>(saved.apiKey);
  const [saving, setSaving] = useState(false);

  /** A connection of its own, which wins over the shared one. */
  const ownConnection = !!(saved.provider && saved.model);
  const formOpen = ownConnection || editing;

  /**
   * A different provider never inherits the last one's endpoint: an Ollama address
   * left in the field would quietly receive the OpenAI or Anthropic key. Back on the
   * saved provider, its saved address returns. Any provider, Anthropic included, may
   * keep an address the admin typed for it (#2655); empty means the provider default.
   */
  const setProvider = (next: string) => {
    if (next !== provider) setBaseUrl(next === saved.provider ? saved.baseUrl : '');
    setProviderState(next);
  };
  const baseUrlPlaceholder = LLM_BASE_URL_PLACEHOLDER[provider] ?? LLM_BASE_URL_PLACEHOLDER.openai;
  const local = useLocalModels(baseUrl, provider === 'local', formOpen, setModel);

  /** Writes the config; the stored key stays as long as the mask is sent in its place. */
  const write = async (next: SavedParsing, config: Record<string, unknown>): Promise<boolean> => {
    setSaving(true);
    try {
      await adminApi.updateAddon(addon.id, { config });
      setSaved(next);
      toast.success(t('settings.aiParsing.toast.saved'));
      return true;
    } catch {
      toast.error(t('settings.aiParsing.toast.saveError'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const ownConfig = (s: SavedParsing) => ({
    provider: s.provider,
    model: s.model,
    baseUrl: s.baseUrl,
    apiKey: s.apiKey,
  });

  const save = async () => {
    const next: SavedParsing = { provider, model: model.trim(), baseUrl: baseUrl.trim(), apiKey, vision: saved.vision };
    if (await write(next, { ...ownConfig(next), vision: next.vision })) setEditing(false);
  };

  /** Back on the shared connection: the own one and its key are dropped, the vision setting stays. */
  const switchToShared = async () => {
    const next: SavedParsing = { provider: '', model: '', baseUrl: '', apiKey: '', vision: saved.vision };
    if (await write(next, { vision: next.vision })) {
      setEditing(false);
      setProviderState('local');
      setModel('');
      setBaseUrl('');
      setApiKey('');
    }
  };

  /** Saved at once, with the connection as it was saved: a draft in the form is not sent along. */
  const setVision = (value: LlmVision) => {
    const next = { ...saved, vision: value };
    void write(next, ownConnection ? { ...ownConfig(saved), vision: value } : { vision: value });
  };

  return {
    provider,
    setProvider,
    model,
    setModel,
    baseUrl,
    setBaseUrl,
    baseUrlPlaceholder,
    apiKey,
    setApiKey,
    vision: saved.vision,
    setVision,
    saving,
    ownConnection,
    savedProvider: saved.provider,
    savedModel: saved.model,
    formOpen,
    startOwn: () => setEditing(true),
    cancelOwn: () => setEditing(false),
    switchToShared,
    ...local,
    save,
  };
}
