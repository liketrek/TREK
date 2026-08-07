import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { decryptLlmApiKey, LLM_PROVIDERS, type LlmProvider, type ResolvedLlmConfig } from './llm-config';
import { DatabaseService } from '../database/database.service';
import { SettingsService } from '../settings/settings.service';
import { Injectable } from '@nestjs/common';

function asProvider(v: unknown): LlmProvider | null {
  return typeof v === 'string' && (LLM_PROVIDERS as string[]).includes(v) ? (v as LlmProvider) : null;
}

/**
 * Resolves the effective LLM config for a user, gated by the addon. Injectable
 * (settings come from SettingsService); the addon-row read and the addon gate
 * still go through the legacy db/adminService seams until their waves migrate.
 */
@Injectable()
export class LlmConfigResolver {
  constructor(
    private readonly settings: SettingsService,
    private readonly dbService: DatabaseService,
    private readonly addons: AddonsService,
  ) {}

  /**
   * Resolve the effective LLM config for a user, gated by the addon.
   * Order: addon disabled → null; admin instance config wins; else per-user config;
   * else null. This is the single place the API key is decrypted.
   */
  resolve(userId: number): ResolvedLlmConfig | null {
    if (!this.addons.isAddonEnabled(ADDON_IDS.LLM_PARSING)) return null;
    return this.readInstanceConfig() ?? this.readUserConfig(userId);
  }

  private readInstanceConfig(): ResolvedLlmConfig | null {
    const row = this.dbService.get<{ config?: string } | undefined>(
      'SELECT config FROM addons WHERE id = ?',
      ADDON_IDS.LLM_PARSING,
    );
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

  private readUserConfig(userId: number): ResolvedLlmConfig | null {
    const settings = this.settings.getUserSettings(userId);
    const provider = asProvider(settings.llm_provider);
    const model = typeof settings.llm_model === 'string' ? settings.llm_model.trim() : '';
    if (!provider || !model) return null;
    const apiKey = this.settings.getDecryptedUserSetting(userId, 'llm_api_key') ?? undefined;
    return {
      provider,
      model,
      baseUrl:
        typeof settings.llm_base_url === 'string' && settings.llm_base_url.trim()
          ? settings.llm_base_url.trim()
          : undefined,
      apiKey,
      multimodal: settings.llm_multimodal === true,
    };
  }
}
