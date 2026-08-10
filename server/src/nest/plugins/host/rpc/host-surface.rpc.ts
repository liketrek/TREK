import { PluginController, PluginMethod } from '../rpc-kit/decorators';
import { PluginGuards } from '../plugin-guards.service';
import { BadParams, ForbiddenResource } from '../rpc-errors';
import { asPayload, num, str } from '../rpc-params';
import type { PluginRpcContext } from '../rpc-kit/types';
import { budgetFor } from '../plugin-host-state';
import { DatabaseService } from '../../../database/database.service';
import { RealtimeService } from '../../../realtime/realtime.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { LlmConfigResolver } from '../../../llm-parse/llm-config.resolver';
import { createLlmClient } from '../../../llm-parse/llm-client.factory';
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
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly llmConfig: LlmConfigResolver,
    private readonly oauth: PluginOAuthService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('users.getById', { permission: 'db:read:users' })
  getUser(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // Scoped to people the acting user can actually see (themselves, or someone they
    // share a trip with), so a plugin cannot enumerate every account by looping ids.
    const id = num(params.id, 'id');
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('user reads require an authenticated user context');
    if (id !== ctx.actingUserId && !this.sharesATrip(ctx.actingUserId, id)) {
      throw new ForbiddenResource(`no access to user ${id}`);
    }
    return this.db.prepare('SELECT id, username, display_name, avatar FROM users WHERE id = ?').get(id);
  }

  @PluginMethod('ws.broadcastToTrip', { permission: 'ws:broadcast:trip' })
  broadcastToTrip(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // The TARGET is gated like a read: only a trip room the acting user belongs to.
    // Namespacing the event type alone does not cross the membership boundary.
    const tripId = num(params.tripId, 'tripId');
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('broadcasts require an authenticated user context');
    if (!this.db.canAccessTrip(tripId, ctx.actingUserId)) throw new ForbiddenResource(`no access to trip ${tripId}`);
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
    if (scope === 'trip' && !this.db.canAccessTrip(targetId, actor)) {
      throw new ForbiddenResource('the acting user is not a member of that trip');
    }
    const link = this.safeLink(input.link);
    if (!budgetFor(ctx.pluginId, this.db.connection).take('notify', Date.now())) {
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
    const config = this.requireLlm(actor);
    const prompt = typeof params.prompt === 'string' ? params.prompt : '';
    if (prompt.trim() === '') throw new BadParams('prompt is required');
    if (prompt.length > AI_TEXT_MAX) throw new BadParams(`prompt exceeds the ${AI_TEXT_MAX}-char cap`);
    this.takeAiBudget(ctx);
    const system = typeof params.system === 'string' ? params.system.slice(0, 4000) : undefined;
    const results = await createLlmClient(config).extract({
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
    const config = this.requireLlm(actor);
    const text = typeof params.text === 'string' ? params.text : '';
    if (text.trim() === '') throw new BadParams('text is required');
    if (text.length > AI_TEXT_MAX) throw new BadParams(`text exceeds the ${AI_TEXT_MAX}-char cap`);
    if (typeof params.jsonSchema !== 'object' || params.jsonSchema === null) {
      throw new BadParams('jsonSchema (an object) is required');
    }
    this.takeAiBudget(ctx);
    const hint = typeof params.prompt === 'string' ? params.prompt.slice(0, 4000) : '';
    const results = await createLlmClient(config).extract({
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
  schedulerSet(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
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
    const existing = this.db
      .prepare('SELECT id FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?')
      .get(ctx.pluginId, name) as { id: number } | undefined;
    if (!existing) {
      const n = (this.db.prepare('SELECT COUNT(*) AS c FROM plugin_scheduled_tasks WHERE plugin_id = ?').get(ctx.pluginId) as { c: number }).c;
      if (n >= SCHED_MAX) throw new BadParams(`too many scheduled tasks (max ${SCHED_MAX})`);
    }
    // Upsert by (plugin, name): re-scheduling the same name replaces it.
    this.db
      .prepare(`INSERT INTO plugin_scheduled_tasks (plugin_id, name, due_at, payload, every_ms) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (plugin_id, name) DO UPDATE SET due_at = excluded.due_at, payload = excluded.payload, every_ms = excluded.every_ms`)
      .run(ctx.pluginId, name, Math.max(dueAt, Date.now()), json, everyMs ?? null);
    return { scheduled: true };
  }

  @PluginMethod('scheduler.cancel', { permission: 'jobs:run' })
  schedulerCancel(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const r = this.db
      .prepare('DELETE FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?')
      .run(ctx.pluginId, str(params.name, 'name'));
    return { cancelled: r.changes > 0 };
  }

  /** Two users share a trip when both are owner-or-member of the same one. */
  private sharesATrip(actingUserId: number, targetUserId: number): boolean {
    return !!this.db
      .prepare(
        `SELECT 1 FROM trips t
               LEFT JOIN trip_members m1 ON m1.trip_id = t.id AND m1.user_id = ?
               LEFT JOIN trip_members m2 ON m2.trip_id = t.id AND m2.user_id = ?
              WHERE (t.user_id = ? OR m1.user_id IS NOT NULL)
                AND (t.user_id = ? OR m2.user_id IS NOT NULL)
              LIMIT 1`,
      )
      .get(actingUserId, targetUserId, actingUserId, targetUserId);
  }

  private requireLlm(userId: number) {
    const config = this.llmConfig.resolve(userId);
    if (!config) throw new BadParams('no AI provider is configured for this user');
    return config;
  }

  private takeAiBudget(ctx: PluginRpcContext): void {
    if (!budgetFor(ctx.pluginId, this.db.connection).take('ai', Date.now())) {
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
