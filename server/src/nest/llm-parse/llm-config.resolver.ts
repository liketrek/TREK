import { InjectRepository } from '@mikro-orm/nestjs';
import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { asLlmVision } from '@trek/shared';
import { decryptLlmApiKey, LLM_PROVIDERS, type LlmProvider, type ResolvedLlmConfig } from './llm-config';
import { Addons } from '../../db/entities/Addons.entity';
import type { AddonsRepository } from '../../db/repositories/Addons.repository';
import { SettingsService } from '../settings/settings.service';
import { Injectable } from '@nestjs/common';

function asProvider(v: unknown): LlmProvider | null {
  return typeof v === 'string' && (LLM_PROVIDERS as string[]).includes(v) ? (v as LlmProvider) : null;
}

/**
 * Resolves the effective LLM config for a user, gated by the addon. Injectable
 * (settings come from SettingsService).
 *
 * Plan 4 Task 1: the addon-row read moved off `DatabaseService` onto
 * `AddonsRepository.findById` — the same shape `admin.service.ts`'s own
 * LLM-addon config read already established (3a/3i's precedent: `config` is
 * a `p.json()` column, so the repository hands back an already-parsed
 * object, never a JSON string needing its own `JSON.parse`).
 */
@Injectable()
export class LlmConfigResolver {
  constructor(
    private readonly settings: SettingsService,
    @InjectRepository(Addons) private readonly addonsRepo: AddonsRepository,
    private readonly addons: AddonsService,
  ) {}

  /**
   * Resolve the effective LLM config for a user, gated by the addon.
   * Order: addon disabled → null; admin instance config wins; else per-user config;
   * else null. This is the single place the API key is decrypted, and the single
   * place that decides which endpoint the server is allowed to call (#1772).
   */
  async resolve(userId: number): Promise<ResolvedLlmConfig | null> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.LLM_PARSING))) return null;
    return (await this.readInstanceConfig()) ?? (await this.readUserConfig(userId));
  }

  private async readInstanceConfig(): Promise<ResolvedLlmConfig | null> {
    const row = await this.addonsRepo.findById(ADDON_IDS.LLM_PARSING);
    const cfg = row?.config;
    if (!cfg) return null;
    const provider = asProvider(cfg.provider);
    const model = typeof cfg.model === 'string' ? cfg.model.trim() : '';
    if (!provider || !model) return null;
    return {
      provider,
      model,
      baseUrl: typeof cfg.baseUrl === 'string' && cfg.baseUrl.trim() ? cfg.baseUrl.trim() : undefined,
      apiKey: decryptLlmApiKey(cfg.apiKey),
      vision: asLlmVision(cfg.vision),
    };
  }

  private async readUserConfig(userId: number): Promise<ResolvedLlmConfig | null> {
    const settings = await this.settings.getUserSettings(userId);
    const provider = asProvider(settings.llm_provider);
    const model = typeof settings.llm_model === 'string' ? settings.llm_model.trim() : '';
    if (!provider || !model) return null;

    // #1772: the address this server calls is instance configuration, never a
    // personal preference. The request leaves OUR network and safeFetchLlm
    // deliberately allows loopback/LAN so a self-hosted Ollama keeps working,
    // which is a reasonable trade for whoever runs the instance and a network
    // probe for anyone else. An instance has exactly one such address, so it
    // comes from the admin-set instance-wide defaults for EVERY user, including
    // an admin's own row. This is the choke point every consumer passes
    // (booking import and the plugin RPC surface), and the only place that also
    // catches values already sitting in the db.
    const endpoints = await this.settings.getAdminUserDefaults();
    // 'local' is an endpoint choice too ("some address I name"), so without an
    // admin-set local endpoint there is no config at all, never a silent
    // redirect to a different provider.
    if (provider === 'local' && asProvider(endpoints.llm_provider) !== 'local') return null;
    const baseUrl =
      typeof endpoints.llm_base_url === 'string' && endpoints.llm_base_url.trim()
        ? endpoints.llm_base_url.trim()
        : undefined;

    const apiKey = (await this.settings.getDecryptedUserSetting(userId, 'llm_api_key')) ?? undefined;
    return {
      provider,
      model,
      baseUrl,
      apiKey,
      // The personal switch has only ever been on or off, and was saved as the
      // person set it, so it is read as exactly that.
      vision: settings.llm_multimodal === true ? 'on' : 'off',
    };
  }
}
