import { ADDON_IDS } from '../../addons';
import { Addons } from '../../db/entities/Addons.entity';
import type { AddonsRepository } from '../../db/repositories/Addons.repository';
import { AddonsService } from '../addons/addons.service';
import { SettingsService } from '../settings/settings.service';
import { decryptLlmApiKey, LLM_PROVIDERS, type LlmProvider, type ResolvedLlmConfig } from './llm-config';
import { SHARED_AI_CONNECTION, type SharedAiConnectionPort } from './shared-ai-connection.interface';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { asLlmVision } from '@trek/shared';

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
    private readonly moduleRef: ModuleRef,
  ) {}

  /**
   * Resolve the effective LLM config for a user, gated by the addon.
   * Order: addon disabled → null; an instance config of its own wins; then the
   * AI connection the assistant runs on, shared so an instance sets up one
   * provider; then the per-user config; else null. This is the single place
   * the API key is decrypted, and the single place that decides which endpoint
   * the server is allowed to call (#1772).
   */
  async resolve(userId: number): Promise<ResolvedLlmConfig | null> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.LLM_PARSING))) return null;
    return (
      (await this.readInstanceConfig()) ??
      (await this.readSharedConnection(userId)) ??
      (await this.readUserConfig(userId))
    );
  }

  /**
   * The assistant's connection, read with the vision setting AI parsing keeps
   * in its own addon config (an instance on the shared connection keeps only
   * that there). Null when nothing provides the port or it has no connection.
   */
  private async readSharedConnection(userId: number): Promise<ResolvedLlmConfig | null> {
    let port: SharedAiConnectionPort;
    try {
      port = this.moduleRef.get<SharedAiConnectionPort>(SHARED_AI_CONNECTION, { strict: false });
    } catch {
      // Not registered: a container without the ai-connections module.
      return null;
    }
    const shared = await port.forParsing(userId);
    if (!shared) return null;
    const row = await this.addonsRepo.findById(ADDON_IDS.LLM_PARSING);
    return { ...shared, vision: asLlmVision(row?.config?.vision) };
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

  /**
   * The instance config without its key: the provider, the model and the
   * address, for the AI assistant's admin form to start from while it has no
   * connection of its own. Read only; nothing here changes AI parsing.
   */
  async readInstanceEndpoint(): Promise<Pick<ResolvedLlmConfig, 'provider' | 'model' | 'baseUrl'> | null> {
    const config = await this.readInstanceConfig();
    return config ? { provider: config.provider, model: config.model, baseUrl: config.baseUrl } : null;
  }

  /**
   * The saved local server and its decrypted key, for the admin screen's model
   * list and pull (#2649): a server behind an auth proxy answers neither without
   * the key. Read before a model is chosen, since listing the models is how one
   * gets chosen, and only while the saved provider is local. The caller decides
   * whether the address it is about to call is this one.
   */
  async readLocalServerAccess(): Promise<{ baseUrl?: string; apiKey?: string } | null> {
    const row = await this.addonsRepo.findById(ADDON_IDS.LLM_PARSING);
    const cfg = row?.config;
    if (!cfg || asProvider(cfg.provider) !== 'local') return null;
    return {
      baseUrl: typeof cfg.baseUrl === 'string' && cfg.baseUrl.trim() ? cfg.baseUrl.trim() : undefined,
      apiKey: decryptLlmApiKey(cfg.apiKey),
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
