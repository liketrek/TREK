import { db } from '../../db/database';
import { ADDON_IDS } from '../../addons';
import { isAddonEnabled } from '../../services/adminService';
import { getUserSettings, getDecryptedUserSetting } from '../../services/settingsService';
import { decryptLlmApiKey, LLM_PROVIDERS, type LlmProvider, type ResolvedLlmConfig } from '../../services/llmConfig';

function asProvider(v: unknown): LlmProvider | null {
  return typeof v === 'string' && (LLM_PROVIDERS as string[]).includes(v) ? (v as LlmProvider) : null;
}

function readInstanceConfig(): ResolvedLlmConfig | null {
  const row = db.prepare('SELECT config FROM addons WHERE id = ?').get(ADDON_IDS.LLM_PARSING) as { config?: string } | undefined;
  if (!row?.config) return null;
  let cfg: Record<string, unknown>;
  try {
    cfg = JSON.parse(row.config || '{}');
  } catch {
    return null;
  }
  const provider = asProvider(cfg.provider);
  const model = typeof cfg.model === 'string' ? cfg.model.trim() : '';
  if (!provider || !model) return null;
  return {
    provider,
    model,
    baseUrl: typeof cfg.baseUrl === 'string' && cfg.baseUrl.trim() ? cfg.baseUrl.trim() : undefined,
    apiKey: decryptLlmApiKey(cfg.apiKey),
    multimodal: cfg.multimodal === true,
  };
}

function readUserConfig(userId: number): ResolvedLlmConfig | null {
  const settings = getUserSettings(userId);
  const provider = asProvider(settings.llm_provider);
  const model = typeof settings.llm_model === 'string' ? settings.llm_model.trim() : '';
  if (!provider || !model) return null;
  const apiKey = getDecryptedUserSetting(userId, 'llm_api_key') ?? undefined;
  return {
    provider,
    model,
    baseUrl: typeof settings.llm_base_url === 'string' && settings.llm_base_url.trim() ? settings.llm_base_url.trim() : undefined,
    apiKey,
    multimodal: settings.llm_multimodal === true,
  };
}

/**
 * Resolve the effective LLM config for a user, gated by the addon.
 * Order: addon disabled → null; admin instance config wins; else per-user config;
 * else null. This is the single place the API key is decrypted.
 */
export function resolveLlmConfig(userId: number): ResolvedLlmConfig | null {
  if (!isAddonEnabled(ADDON_IDS.LLM_PARSING)) return null;
  return readInstanceConfig() ?? readUserConfig(userId);
}
