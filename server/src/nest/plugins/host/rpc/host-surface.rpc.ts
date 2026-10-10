import { PluginController, PluginMethod } from '../../../../nest-rpc/rpc-kit/decorators';
import { PluginGuards } from '../../../../nest-rpc/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../../../../nest-rpc/rpc-errors';
import { asPayload, num, str } from '../../../../nest-rpc/rpc-params';
import type { PluginRpcContext } from '../../../../nest-rpc/rpc-kit/types';
import { budgetFor } from '../plugin-host-state';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PluginCapabilityAudit } from '../../../../db/entities/PluginCapabilityAudit.entity';
import type { PluginCapabilityAuditRepository } from '../../../../db/repositories/PluginCapabilityAudit.repository';
import { Users } from '../../../../db/entities/Users.entity';
import type { UsersRepository } from '../../../../db/repositories/Users.repository';
import { Trips } from '../../../../db/entities/Trips.entity';
import type { TripsRepository } from '../../../../db/repositories/Trips.repository';
import { PluginScheduledTasks } from '../../../../db/entities/PluginScheduledTasks.entity';
import type { PluginScheduledTasksRepository } from '../../../../db/repositories/PluginScheduledTasks.repository';
import { RealtimeService } from '../../../realtime/realtime.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { LlmConfigResolver } from '../../../llm-parse/llm-config.resolver';
import { createLlmClient } from '../../../llm-parse/llm-client.factory';
import { UnreadableLlmResponse } from '../../../llm-parse/clients/openai-compatible.client';
import type { ResolvedLlmConfig } from '../../../llm-parse/llm-config';
import type { LlmExtractionInput } from '../../../llm-parse/llm-provider.interface';
import { PluginOAuthService } from '../../oauth/plugin-oauth.service';
import { stripEmoji } from '../../text-sanitize';

/** Caps on the persistent scheduler, bounding the abuse surface. */
const SCHED_MAX = 100; // entries per plugin
const SCHED_NAME_MAX = 128;
const SCHED_PAYLOAD_MAX = 8 * 1024; // 8 KB JSON
const SCHED_EVERY_MIN = 60_000; // 1 min floor for a recurring task
const SCHED_DUE_WINDOW = 366 * 24 * 60 * 60 * 1000; // at most ~a year out

const AI_TEXT_MAX = 20_000;

/**
 * The host-mediated surface: the user lookup, the two broadcasts, notifications, the
 * LLM bridge, the OAuth token and the persistent scheduler.
 *
 * What these have in common is that the HOST owns the dangerous half. The plugin
 * supplies a prompt, a message or a target; recipient resolution, credentials,
 * channel fan-out and the event namespace stay here, and every target is scoped to
 * something the acting user may already reach.
 */
@PluginController()
export class HostSurfaceRpc {
  constructor(
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this reuses the `trips: TripsRepository` param below (findAccessible).
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly llmConfig: LlmConfigResolver,
    private readonly oauth: PluginOAuthService,
    private readonly guards: PluginGuards,
    @InjectRepository(PluginCapabilityAudit) private readonly audit: PluginCapabilityAuditRepository,
    // HR1 (Plan 3j Task 5) — the plugin-visible user row.
    @InjectRepository(Users) private readonly users: UsersRepository,
    // HR9 (Plan 3j Task 5) — the bilateral "do these two users share a trip" gate.
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    // HR5–HR8 (Plan 3j Task 5) — a plugin's own scheduler.set/scheduler.cancel RPCs.
    @InjectRepository(PluginScheduledTasks) private readonly scheduledTasks: PluginScheduledTasksRepository,
  ) {}

  @PluginMethod('users.getById', { permission: 'db:read:users' })
  async getUser(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // Scoped to people the acting user can actually see (themselves, or someone they
    // share a trip with), so a plugin cannot enumerate every account by looping ids.
    const id = num(params.id, 'id');
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('user reads require an authenticated user context');
    if (id !== ctx.actingUserId && !(await this.sharesATrip(ctx.actingUserId, id))) {
      throw new ForbiddenResource(`no access to user ${id}`);
    }
    // `?? undefined`: `findPublicIdentity` returns `null` on a miss (this
    // repository's own convention); the legacy `better-sqlite3` `.get()`
    // returned `undefined` — preserved so a missing row still serializes
    // the same way over the wire to the plugin.
    return (await this.users.findPublicIdentity(id)) ?? undefined;
  }

  @PluginMethod('ws.broadcastToTrip', { permission: 'ws:broadcast:trip' })
  async broadcastToTrip(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // The TARGET is gated like a read: only a trip room the acting user belongs to.
    // Namespacing the event type alone does not cross the membership boundary.
    const tripId = num(params.tripId, 'tripId');
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('broadcasts require an authenticated user context');
    if (!(await this.trips.findAccessible(tripId, ctx.actingUserId))) throw new ForbiddenResource(`no access to trip ${tripId}`);
    // The host forces the plugin:{id}:{event} namespace, so a plugin cannot forge a
    // core event.
    this.realtime.broadcast(tripId, `plugin:${ctx.pluginId}:${str(params.event, 'event')}`, asPayload(params.data));
    return { ok: true };
  }

  @PluginMethod('ws.broadcastToUser', { permission: 'ws:broadcast:user' })
  broadcastToUser(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // Authorised by identity, not by a predicate: only the acting user's own sockets.
    const userId = num(params.userId, 'userId');
    if (ctx.actingUserId === undefined || userId !== ctx.actingUserId) {
      throw new ForbiddenResource('a plugin may only broadcast to the acting user');
    }
    this.realtime.broadcastToUser(userId, {
      type: `plugin:${ctx.pluginId}`,
      event: str(params.event, 'event'),
      ...asPayload(params.data),
    });
    return { ok: true };
  }

  @PluginMethod('notify.send', { permission: 'notify:send' })
  async notify(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const actor = this.guards.requireActor(ctx, 'notification');
    const input = asPayload(params.input);
    // Emoji-stripped so a bell or push notification matches the lucide-only UI; this
    // also trims and collapses whitespace, so an all-emoji title collapses to '' and
    // is rejected below.
    const title = typeof input.title === 'string' ? stripEmoji(input.title) : '';
    const body = typeof input.body === 'string' ? stripEmoji(input.body) : '';
    if (!title || title.length > 200) throw new BadParams('notification title is required (max 200 chars)');
    if (!body || body.length > 1000) throw new BadParams('notification body is required (max 1000 chars)');
    const scope = input.scope;
    // 'admin' is deliberately absent: there is no arbitrary-recipient or
    // admin-broadcast path, so a plugin cannot spam or phish through the host.
    if (scope !== 'user' && scope !== 'trip') throw new BadParams("scope must be 'user' or 'trip'");
    const targetId = num(input.targetId, 'targetId');
    if (scope === 'user' && targetId !== actor) throw new ForbiddenResource('a plugin may only notify the acting user');
    if (scope === 'trip' && !(await this.trips.findAccessible(targetId, actor))) {
      throw new ForbiddenResource('the acting user is not a member of that trip');
    }
    const link = this.safeLink(input.link);
    if (!(await budgetFor(ctx.pluginId, this.audit)).take('notify', Date.now())) {
      throw new BadParams('daily notification budget exhausted (resets at UTC midnight)');
    }
    await this.notifications.send({
      event: 'plugin_notification',
      actorId: null,
      params: { title, body, ...(link ? { link } : {}) },
      scope,
      targetId,
      inApp: link ? { navigateTarget: link } : undefined,
    });
    return { sent: true };
  }

  @PluginMethod('ai.complete', { permission: 'ai:invoke' })
  async aiComplete(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const actor = this.guards.requireActor(ctx, 'AI');
    const config = await this.requireLlm(actor);
    const prompt = typeof params.prompt === 'string' ? params.prompt : '';
    if (prompt.trim() === '') throw new BadParams('prompt is required');
    if (prompt.length > AI_TEXT_MAX) throw new BadParams(`prompt exceeds the ${AI_TEXT_MAX}-char cap`);
    await this.takeAiBudget(ctx);
    const system = typeof params.system === 'string' ? params.system.slice(0, 4000) : undefined;
    const results = await this.runModel(config, {
      prompt: system || 'You are a helpful assistant. Reply with a JSON object of the form {"text": "..."} whose "text" field holds your answer.',
      jsonSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      text: prompt,
    });
    const first = results[0] as { text?: unknown } | undefined;
    return { text: typeof first?.text === 'string' ? first.text : '' };
  }

  @PluginMethod('ai.extract', { permission: 'ai:invoke' })
  async aiExtract(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const actor = this.guards.requireActor(ctx, 'AI');
    const config = await this.requireLlm(actor);
    const text = typeof params.text === 'string' ? params.text : '';
    if (text.trim() === '') throw new BadParams('text is required');
    if (text.length > AI_TEXT_MAX) throw new BadParams(`text exceeds the ${AI_TEXT_MAX}-char cap`);
    if (typeof params.jsonSchema !== 'object' || params.jsonSchema === null) {
      throw new BadParams('jsonSchema (an object) is required');
    }
    await this.takeAiBudget(ctx);
    const hint = typeof params.prompt === 'string' ? params.prompt.slice(0, 4000) : '';
    const results = await this.runModel(config, {
      prompt: hint || 'Extract structured data from the text into the given JSON schema.',
      jsonSchema: params.jsonSchema as object,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      text,
    });
    return { results };
  }

  @PluginMethod('oauth.getToken', { permission: 'oauth:client' })
  async getOAuthToken(_params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // A userless context (a job or scheduled task) gets null rather than a refusal,
    // matching the SDK contract and its mock: a background caller cannot do anything
    // useful with RESOURCE_FORBIDDEN. The plugin never sees the refresh token.
    if (ctx.actingUserId === undefined) return { accessToken: null };
    return { accessToken: await this.oauth.getAccessToken(ctx.pluginId, ctx.actingUserId, Date.now()) };
  }

  @PluginMethod('scheduler.set', { permission: 'jobs:run' })
  async schedulerSet(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const name = str(params.name, 'name');
    const dueAt = num(params.dueAt, 'dueAt');
    const everyMs = params.everyMs != null ? num(params.everyMs, 'everyMs') : undefined;
    if (!name || name.length > SCHED_NAME_MAX) throw new BadParams(`scheduler name is required (max ${SCHED_NAME_MAX} chars)`);
    if (!Number.isFinite(dueAt) || dueAt > Date.now() + SCHED_DUE_WINDOW) throw new BadParams('scheduler dueAt out of range');
    if (everyMs !== undefined && (!Number.isFinite(everyMs) || everyMs < SCHED_EVERY_MIN)) {
      throw new BadParams(`recurring interval must be >= ${SCHED_EVERY_MIN} ms`);
    }
    const json = JSON.stringify(params.payload ?? null);
    if (json.length > SCHED_PAYLOAD_MAX) throw new BadParams(`scheduler payload too large (max ${SCHED_PAYLOAD_MAX} bytes)`);
    // HR5/HR6/HR7 — Plan 3j Task 7 fix (must-land 3): one atomic call, not
    // three separately-awaited ones (task-7-review.md's concurrent-cap-bypass).
    // Upsert by (plugin, name): re-scheduling the same name replaces it.
    const written = await this.scheduledTasks.upsertTaskCapped(
      { plugin_id: ctx.pluginId, name, due_at: Math.max(dueAt, Date.now()), payload: json, every_ms: everyMs ?? null },
      SCHED_MAX,
    );
    if (!written) throw new BadParams(`too many scheduled tasks (max ${SCHED_MAX})`);
    return { scheduled: true };
  }

  @PluginMethod('scheduler.cancel', { permission: 'jobs:run' })
  async schedulerCancel(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const cancelled = await this.scheduledTasks.deleteByPluginAndName(ctx.pluginId, str(params.name, 'name')); // HR8 — Plan 3j
    return { cancelled };
  }

  /** Two users share a trip when both are owner-or-member of the same one. */
  private async sharesATrip(actingUserId: number, targetUserId: number): Promise<boolean> {
    return await this.trips.sharesTripWith(actingUserId, targetUserId); // HR9 — Plan 3j
  }

  private async requireLlm(userId: number) {
    const config = await this.llmConfig.resolve(userId);
    if (!(await config)) throw new BadParams('no AI provider is configured for this user');
    return config;
  }

  /**
   * The model's answer, without the diagnosis the booking import asked for.
   *
   * A client raises `UnreadableLlmResponse` when the model replies with prose or
   * with nothing at all, so an import can warn about that file (#2375). Plugins
   * were written against the older contract here — an empty answer, never an
   * error — and this surface is versioned on its own, so that one stays empty. A
   * request that actually failed still reaches the plugin as HOST_ERROR.
   */
  private async runModel(config: ResolvedLlmConfig, input: LlmExtractionInput): Promise<Record<string, unknown>[]> {
    try {
      return await createLlmClient(config).extract(input);
    } catch (err) {
      if (err instanceof UnreadableLlmResponse) return [];
      throw err;
    }
  }

  private async takeAiBudget(ctx: PluginRpcContext): Promise<void> {
    if (!(await budgetFor(ctx.pluginId, this.audit)).take('ai', Date.now())) {
      throw new BadParams('daily AI budget exhausted (resets at UTC midnight)');
    }
  }

  /**
   * In-app paths only. A bare startsWith check misses `/\evil.com` and `/<tab>/…`,
   * which browsers normalize to protocol-relative, so resolve against a throwaway
   * origin and require the result to stay on it.
   */
  private safeLink(value: unknown): string | undefined {
    if (typeof value !== 'string' || value === '') return undefined;
    let safe: string | null = null;
    try {
      const u = new URL(value, 'http://x.invalid');
      if (u.origin === 'http://x.invalid') safe = u.pathname + u.search + u.hash;
    } catch {
      /* invalid, rejected below */
    }
    if (!safe) throw new BadParams('link must be an in-app path starting with /');
    return safe.slice(0, 512);
  }
}
