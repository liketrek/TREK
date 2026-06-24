import { maybe_encrypt_api_key, decrypt_api_key } from './apiKeyCrypto';

/**
 * Shared types + helpers for the `llm_parsing` addon configuration.
 *
 * Config can live in two places (resolution happens in
 * server/src/nest/llm-parse/llm-config.resolver.ts):
 *  - instance-wide: the `llm_parsing` addon's `config` JSON (admin-set, wins)
 *  - per-user: the `llm_*` keys in the per-user settings table (fallback)
 *
 * The API key is encrypted at rest (reusing apiKeyCrypto) and never returned to
 * the client in plaintext — it is masked with MASKED_VALUE, matching the
 * per-user encrypted-settings pattern in settingsService.ts.
 */

export type LlmProvider = 'local' | 'openai' | 'anthropic';

/** Fully-resolved config the clients consume. */
export interface ResolvedLlmConfig {
  provider: LlmProvider;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  multimodal: boolean;
}

/** Shape of the admin instance config stored in `addons.config` (apiKey encrypted). */
export interface LlmAddonConfig {
  provider?: LlmProvider;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  multimodal?: boolean;
}

export const LLM_PROVIDERS: LlmProvider[] = ['local', 'openai', 'anthropic'];
export const MASKED_VALUE = '••••••••';

/**
 * Prepare an admin config blob for persistence: encrypt a freshly-entered apiKey,
 * and preserve the previously-stored (already-encrypted) key when the client
 * echoes back the mask sentinel (i.e. the user didn't change it).
 */
export function prepareLlmAddonConfigForWrite(
  incoming: Record<string, unknown>,
  existingStored: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...incoming };
  const key = incoming.apiKey;
  if (key === undefined || key === null || key === '' || key === MASKED_VALUE) {
    // Keep the existing encrypted key untouched (mask echoed or no key supplied).
    if (existingStored && 'apiKey' in existingStored) out.apiKey = existingStored.apiKey;
    else delete out.apiKey;
  } else {
    out.apiKey = maybe_encrypt_api_key(String(key)) ?? String(key);
  }
  return out;
}

/** Mask the apiKey for any client-facing response (never leak plaintext). */
export function maskLlmAddonConfig(config: Record<string, unknown>): Record<string, unknown> {
  if (config && config.apiKey) return { ...config, apiKey: MASKED_VALUE };
  return config;
}

/** Decrypt the stored apiKey for server-side use (resolver only). */
export function decryptLlmApiKey(stored: unknown): string | undefined {
  if (!stored) return undefined;
  return decrypt_api_key(stored) ?? undefined;
}
