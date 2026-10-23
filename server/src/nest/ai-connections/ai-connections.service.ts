import { ADDON_IDS } from '../../addons';
import { readEnv } from '../../app-config';
import { AiConnections } from '../../db/entities/AiConnections.entity';
import type { AiConnectionRow, AiConnectionsRepository } from '../../db/repositories/AiConnections.repository';
import { AddonsService } from '../addons/addons.service';
import { AuditService } from '../audit/audit.service';
import { RateLimitService } from '../common/rate-limit.service';
import { LlmParseService } from '../llm-parse/llm-parse.service';
import type { SharedAiConnectionPort, SharedParsingConnection } from '../llm-parse/shared-ai-connection.interface';
import { SettingsService } from '../settings/settings.service';
import { pickConnection } from './ai-connection.resolver';
import {
  AI_BASE_URLS,
  AI_PRIVACY_ACK_SETTING,
  AI_STUDIO_IMAGES_ACK_SETTING,
  aiHostOf,
  aiRefusal,
  openrouterOAuthAvailable,
  providerRefusal,
} from './ai-connections.constants';
import type { AiCredential, ResolvedAiConnection } from './ai-connections.types';
import { maskHint, openSecrets, sealSecrets } from './ai-secrets';
import { AiSettingsService } from './ai-settings.service';
import { AiUsageService } from './ai-usage.service';
import { ChatgptAuthService } from './chatgpt-auth.service';
import { ModelCatalogService, modelReadsImages, pickDefaultModel, type CatalogTarget } from './model-catalog.service';
import { AiProviderError } from './providers/provider-errors';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  MASKED_SETTING_VALUE,
  type AiAdminConnectionResponse,
  type AiAdminSettings,
  type AiApiKeyConnectRequest,
  type AiConnectionKind,
  type AiConnectionScope,
  type AiConnectionStatus,
  type AiConnectionView,
  type AiInstanceConnectionRequest,
  type AiModelInfo,
  type AiParsingPrefill,
  type AiPrivacyAckRequest,
  type AiStatusResponse,
  type AssistantErrorCode,
} from '@trek/shared';

/** A key test asks the provider for its models: a few a minute per user, so the server is no oracle for keys. */
const MODEL_CALLS_PER_MINUTE = 5;

function kindOf(row: AiConnectionRow): AiConnectionKind {
  return row.kind as AiConnectionKind;
}

function viewOf(row: AiConnectionRow): AiConnectionView {
  return {
    scope: row.scope as AiConnectionScope,
    kind: kindOf(row),
    model: row.model,
    hint: row.hint,
    status: row.status as AiConnectionStatus,
    host: aiHostOf(kindOf(row), row.base_url),
  };
}

/**
 * The assistant's connections to a language model: the one the admin sets up
 * for everyone and the one a user brings, which of them a user's assistant
 * runs on under the policy, and the credential it calls with.
 *
 * Saving a key is testing it: the provider's model list is asked first, which
 * fails for a key the provider refuses and fills the model choice for one it
 * takes. Secrets are sealed (ai-secrets.ts) and never leave the server; every
 * answer shows a hint instead. `custom` (an OpenAI-compatible server at an
 * address of the admin's choosing) is instance-only, as #1772 settled for AI
 * parsing; a ChatGPT plan is user-only.
 */
@Injectable()
export class AiConnectionsService implements SharedAiConnectionPort {
  constructor(
    @InjectRepository(AiConnections) private readonly connections: AiConnectionsRepository,
    private readonly aiSettings: AiSettingsService,
    private readonly chatgpt: ChatgptAuthService,
    private readonly catalog: ModelCatalogService,
    private readonly usage: AiUsageService,
    private readonly addons: AddonsService,
    private readonly settings: SettingsService,
    private readonly rateLimit: RateLimitService,
    private readonly llmParse: LlmParseService,
    private readonly audit: AuditService,
  ) {}

  /** `kind:model` of the models a provider refused an image for, while this process runs. */
  private readonly textOnly = new Set<string>();

  /** Whether the assistant exists here at all: the addon is on and the install is not centrally administered. */
  async enabled(): Promise<boolean> {
    return !readEnv().managed.enabled && (await this.addons.isAddonEnabled(ADDON_IDS.AI_ASSISTANT));
  }

  async status(userId: number): Promise<AiStatusResponse> {
    const settings = await this.aiSettings.read();
    const own = await this.connections.findForUser(userId);
    const instance = await this.connections.findInstance();
    const picked = (await this.enabled()) ? pickConnection(settings.policy, own, instance) : null;
    const effective = picked?.connection;
    const host = effective ? aiHostOf(kindOf(effective), effective.base_url) : '';
    // A user's own connection was acknowledged when they set it up; the instance's is acknowledged once per kind@host.
    const acked =
      picked?.paidBy === 'instance'
        ? (await this.settings.getDecryptedUserSetting(userId, AI_PRIVACY_ACK_SETTING)) === `${effective?.kind}@${host}`
        : !!picked;
    return {
      available: !!picked,
      policy: settings.policy,
      canConnectOwn: await this.aiSettings.canConnectOwn(userId),
      effective:
        picked && effective
          ? {
              source: viewOf(effective).scope,
              kind: kindOf(effective),
              model: effective.model,
              host,
              paidBy: picked.paidBy,
            }
          : null,
      own: own ? viewOf(own) : null,
      instance: instance
        ? { kind: kindOf(instance), model: instance.model, host: aiHostOf(kindOf(instance), instance.base_url) }
        : null,
      quota:
        picked?.paidBy === 'instance'
          ? { used: await this.usage.instanceTurnsToday(userId), limit: settings.dailyTurns }
          : null,
      privacyAcked: acked,
      studioImages: !!effective && this.readsImages({ kind: kindOf(effective), model: effective.model }),
      studioImagesAcked: !!effective && (await this.studioImagesAckedFor(userId, `${kindOf(effective)}@${host}`)),
      retention: settings.retention,
      openrouterOAuth: openrouterOAuthAvailable(),
    };
  }

  /**
   * The connection a user's assistant runs on now, with its credential, or the
   * refusal the client shows: nothing connected, a sign-in to renew, a key to
   * replace. A ChatGPT token about to expire is refreshed here.
   */
  async resolveForUser(userId: number): Promise<ResolvedAiConnection> {
    if (!(await this.enabled())) throw aiRefusal('not_connected', 'The AI assistant is not available');
    const { policy } = await this.aiSettings.read();
    const picked = pickConnection(
      policy,
      await this.connections.findForUser(userId),
      await this.connections.findInstance(),
    );
    if (!picked) throw aiRefusal('not_connected', 'No AI provider is connected');
    const row = picked.connection;
    if (row.status === 'needs_reauth') throw aiRefusal('needs_reauth', 'The sign-in with the provider has expired');
    return {
      id: row.id,
      scope: viewOf(row).scope,
      kind: kindOf(row),
      model: row.model,
      baseUrl: row.base_url,
      host: aiHostOf(kindOf(row), row.base_url),
      paidBy: picked.paidBy,
      status: row.status as AiConnectionStatus,
      credential: await this.credentialOf(row),
    };
  }

  /**
   * What a turn's outcome says about the connection it ran on: a key the
   * provider refused marks it (the settings show it), a ChatGPT sign-in the
   * provider refused after a refresh needs renewing, and a turn that worked
   * clears an earlier mark.
   */
  async noteOutcome(connection: ResolvedAiConnection, code: AssistantErrorCode | null): Promise<void> {
    if (code === 'invalid_key' && connection.status !== 'error') {
      await this.connections.setStatus(connection.id, 'error');
    } else if (code === 'needs_reauth' && connection.kind === 'chatgpt') {
      await this.connections.setStatus(connection.id, 'needs_reauth');
    } else if (code === null && connection.status === 'error') {
      await this.connections.setStatus(connection.id, 'ok');
    }
  }

  // ── A user's own connection ────────────────────────────────────────────────

  async saveOwnKey(userId: number, req: AiApiKeyConnectRequest): Promise<AiConnectionView> {
    await this.aiSettings.assertCanConnectOwn(userId);
    const model = await this.testedModel(userId, { kind: req.kind, baseUrl: null, secret: req.apiKey }, req.model);
    await this.connections.save(userId, {
      kind: req.kind,
      model,
      baseUrl: null,
      secrets: sealSecrets({ apiKey: req.apiKey }),
      hint: maskHint(req.apiKey),
      account: null,
    });
    await this.audit.writeAudit({ userId, action: 'ai.connection.saved', details: { scope: 'user', kind: req.kind } });
    return this.ownView(userId);
  }

  /**
   * Picks the model of the user's own connection, one the provider offers.
   * @txIndependent reading the credential may renew a ChatGPT sign-in first; that write stands on its own.
   */
  async setOwnModel(userId: number, model: string): Promise<AiConnectionView> {
    const row = await this.ownRow(userId);
    const models = await this.modelsOf(userId, row);
    if (!models.some((m) => m.id === model)) throw aiRefusal('unknown_model', 'This model is not offered here');
    await this.connections.setModel(row.id, model);
    return this.ownView(userId);
  }

  async listOwnModels(userId: number): Promise<AiModelInfo[]> {
    return this.modelsOf(userId, await this.ownRow(userId));
  }

  async removeOwn(userId: number): Promise<void> {
    const row = await this.ownRow(userId);
    await this.connections.deleteById(row.id);
    await this.audit.writeAudit({
      userId,
      action: 'ai.connection.removed',
      details: { scope: 'user', kind: row.kind },
    });
  }

  /** The current view of the user's own connection, after a sign-in or a sign-out changed it. */
  async ownView(userId: number): Promise<AiConnectionView> {
    return viewOf(await this.ownRow(userId));
  }

  /**
   * The user saw that `kind@host` receives their messages on the instance's
   * connection, or (`scope: 'studio_images'`) that it may also receive images
   * of their Studio pages, on any connection.
   */
  async ackPrivacy(userId: number, req: AiPrivacyAckRequest): Promise<void> {
    const key = req.scope === 'studio_images' ? AI_STUDIO_IMAGES_ACK_SETTING : AI_PRIVACY_ACK_SETTING;
    await this.settings.upsertSetting(userId, key, `${req.kind}@${req.host}`);
  }

  /** Whether the user let this connection receive images of their Studio pages; without it a turn stays text. */
  async studioImagesAcked(userId: number, connection: Pick<ResolvedAiConnection, 'kind' | 'host'>): Promise<boolean> {
    return this.studioImagesAckedFor(userId, `${connection.kind}@${connection.host}`);
  }

  private async studioImagesAckedFor(userId: number, target: string): Promise<boolean> {
    return (await this.settings.getDecryptedUserSetting(userId, AI_STUDIO_IMAGES_ACK_SETTING)) === target;
  }

  /**
   * Whether a model is shown the Studio's pages as images: its name says it
   * reads them, and no provider refused an image for it while this process
   * runs. Status asks this too, so the Studio offers images only where a turn
   * would send them.
   */
  readsImages({ kind, model }: Pick<ResolvedAiConnection, 'kind' | 'model'>): boolean {
    return modelReadsImages(kind, model) && !this.textOnly.has(`${kind}:${model}`);
  }

  /** A provider refused an image for this model: it reads pages in words until the process restarts. */
  refuseImages({ kind, model }: Pick<ResolvedAiConnection, 'kind' | 'model'>): void {
    this.textOnly.add(`${kind}:${model}`);
  }

  // ── The instance's connection (admin) ──────────────────────────────────────

  async readSettings(): Promise<AiAdminSettings> {
    return this.aiSettings.read();
  }

  async writeSettings(adminId: number, next: AiAdminSettings): Promise<AiAdminSettings> {
    const saved = await this.aiSettings.write(next);
    await this.audit.writeAudit({ userId: adminId, action: 'ai.settings.saved', details: { ...next } });
    return saved;
  }

  /** The instance's connection as a user's own is shown, once a sign-in saved it. */
  async instanceView(): Promise<AiConnectionView> {
    const row = await this.connections.findInstance();
    if (!row) throw aiRefusal('not_found', 'No connection for everyone yet');
    return viewOf(row);
  }

  async instanceConnection(): Promise<AiAdminConnectionResponse> {
    const row = await this.connections.findInstance();
    return {
      connection: row ? { ...viewOf(row), baseUrl: row.base_url } : null,
      prefill: row ? null : await this.parsingPrefill(),
    };
  }

  /**
   * Saves the instance's connection. A key sent as the mask keeps the stored
   * one, as long as it is a key of the same kind (and, for a custom server, of
   * the same address): a stored key never goes to a server it was not saved for.
   */
  async saveInstance(adminId: number, req: AiInstanceConnectionRequest): Promise<AiAdminConnectionResponse> {
    const stored = await this.connections.findInstance();
    const sameTarget = stored?.kind === req.kind && (req.kind !== 'custom' || stored.base_url === req.baseUrl);
    const storedKey = sameTarget ? this.storedApiKey(stored) : null;
    const typed = req.apiKey === MASKED_SETTING_VALUE ? storedKey : req.apiKey || null;
    if (req.kind !== 'custom' && !typed) throw aiRefusal('invalid_key', 'An API key is needed');
    const baseUrl = req.kind === 'custom' ? req.baseUrl : null;
    const model = await this.testedModel(adminId, { kind: req.kind, baseUrl, secret: typed }, req.model);
    await this.connections.save(null, {
      kind: req.kind,
      model,
      baseUrl,
      secrets: typed ? sealSecrets({ apiKey: typed }) : null,
      hint: typed ? maskHint(typed) : null,
      account: null,
    });
    await this.audit.writeAudit({
      userId: adminId,
      action: 'ai.connection.saved',
      details: { scope: 'instance', kind: req.kind },
    });
    return this.instanceConnection();
  }

  async listInstanceModels(adminId: number): Promise<AiModelInfo[]> {
    const row = await this.connections.findInstance();
    if (!row) throw aiRefusal('not_found', 'No connection is set up for everyone');
    return this.modelsOf(adminId, row);
  }

  async removeInstance(adminId: number): Promise<void> {
    const row = await this.connections.findInstance();
    if (!row) throw aiRefusal('not_found', 'No connection is set up for everyone');
    await this.connections.deleteById(row.id);
    await this.audit.writeAudit({
      userId: adminId,
      action: 'ai.connection.removed',
      details: { scope: 'instance', kind: row.kind },
    });
  }

  /** Saves an OpenRouter key an OAuth exchange produced, for the scope the exchange was started for. */
  async saveOpenrouterKey(userId: number, scope: AiConnectionScope, apiKey: string): Promise<AiConnectionView> {
    if (scope === 'user') return this.saveOwnKey(userId, { kind: 'openrouter', apiKey });
    const saved = await this.saveInstance(userId, { kind: 'openrouter', apiKey });
    if (!saved.connection) throw aiRefusal('generic', 'The connection was not saved');
    return saved.connection;
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private async ownRow(userId: number): Promise<AiConnectionRow> {
    const row = await this.connections.findForUser(userId);
    if (!row) throw aiRefusal('not_found', 'You have no AI connection of your own');
    return row;
  }

  /**
   * Asks the provider for its models with the given secret and answers the
   * model the connection is saved with: the one asked for, if the provider
   * offers it (a custom server's model is taken as named, since it may be
   * pulled later), else a sensible default.
   */
  private async testedModel(userId: number, target: CatalogTarget, wanted: string | undefined): Promise<string> {
    const models = await this.listModels(userId, target);
    if (wanted && (target.kind === 'custom' || models.some((m) => m.id === wanted))) return wanted;
    if (wanted) throw aiRefusal('unknown_model', 'This model is not offered here');
    const fallback = pickDefaultModel(target.kind, models);
    if (!fallback) throw aiRefusal('unknown_model', 'The provider offers no model the assistant can use');
    return fallback;
  }

  private async modelsOf(userId: number, row: AiConnectionRow): Promise<AiModelInfo[]> {
    const credential = await this.credentialOf(row);
    const secret = credential.type === 'chatgpt' ? credential.accessToken : credential.apiKey;
    return this.listModels(userId, { kind: kindOf(row), baseUrl: row.base_url, secret });
  }

  private async listModels(userId: number, target: CatalogTarget): Promise<AiModelInfo[]> {
    if (!(await this.rateLimit.check('ai_models', String(userId), MODEL_CALLS_PER_MINUTE, 60_000, Date.now()))) {
      throw aiRefusal('rate_limited', 'Too many requests, try again in a minute');
    }
    try {
      return await this.catalog.list(target);
    } catch (err) {
      if (err instanceof AiProviderError) throw providerRefusal(err);
      throw err;
    }
  }

  /**
   * The connection a user's assistant would run on, as AI parsing reads it, so
   * an instance sets up one provider for both. The admin's policy decides it
   * the same way. A ChatGPT plan is left out: its sign-in only reaches the chat
   * models, not the completions endpoint parsing calls. Gemini and OpenRouter
   * go through their OpenAI-compatible endpoints; a custom server is the
   * admin's own address, read like parsing's local provider (#1772).
   */
  async forParsing(userId: number): Promise<SharedParsingConnection | null> {
    if (readEnv().managed.enabled) return null;
    const { policy } = await this.aiSettings.read();
    const picked = pickConnection(
      policy,
      await this.connections.findForUser(userId),
      await this.connections.findInstance(),
    );
    const row = picked?.connection;
    if (!row || row.status !== 'ok' || !row.model) return null;
    const apiKey = this.storedApiKey(row) ?? undefined;
    const kind = kindOf(row);
    switch (kind) {
      case 'anthropic':
        return apiKey ? { provider: 'anthropic', model: row.model, apiKey } : null;
      case 'openai':
        return apiKey ? { provider: 'openai', model: row.model, apiKey } : null;
      case 'gemini':
      case 'openrouter':
        return apiKey ? { provider: 'openai', model: row.model, apiKey, baseUrl: AI_BASE_URLS[kind] } : null;
      case 'custom':
        return row.base_url ? { provider: 'local', model: row.model, apiKey, baseUrl: row.base_url } : null;
      default:
        return null;
    }
  }

  private async credentialOf(row: AiConnectionRow): Promise<AiCredential> {
    if (row.kind === 'chatgpt') {
      try {
        return { type: 'chatgpt', accessToken: await this.chatgpt.accessToken(row) };
      } catch (err) {
        if (err instanceof AiProviderError) throw providerRefusal(err);
        throw err;
      }
    }
    const apiKey = this.storedApiKey(row);
    if (!apiKey && row.kind !== 'custom') {
      throw aiRefusal('invalid_key', 'The stored key cannot be read; enter it again');
    }
    return { type: 'api_key', apiKey };
  }

  private storedApiKey(row: AiConnectionRow | null): string | null {
    const secrets = openSecrets(row?.secrets);
    return secrets && 'apiKey' in secrets ? secrets.apiKey : null;
  }

  /**
   * What AI parsing is set up with, offered to fill the instance connection's
   * form while none exists. Its key is not carried over: the form shows the
   * provider and the model, the admin enters the key once more.
   */
  private async parsingPrefill(): Promise<AiParsingPrefill | null> {
    const parsing = await this.llmParse.instanceEndpoint();
    if (!parsing) return null;
    if (parsing.provider === 'anthropic') return { kind: 'anthropic', baseUrl: null, model: parsing.model };
    if (parsing.provider === 'openai' && !parsing.baseUrl) {
      return { kind: 'openai', baseUrl: null, model: parsing.model };
    }
    return { kind: 'custom', baseUrl: parsing.baseUrl ?? null, model: parsing.model };
  }
}
