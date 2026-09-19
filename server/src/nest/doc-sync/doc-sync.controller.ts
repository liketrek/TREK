import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../types';
import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { docFailed } from './document-provider';
import { DocSyncConfigService, type LinkRow } from './doc-sync-config.service';
import { DocSyncService } from './doc-sync.service';
import { DocumentProviderRegistry } from './document-provider.registry';
import { PROVIDER_DISABLED } from './doc-sync.constants';
import {
  DocsyncConnectionDto,
  DocsyncConnectionTestDto,
  DocsyncLinkDto,
  DocsyncLinkUpdateDto,
  DocsyncResolveConflictDto,
  DocsyncScopeCreateDto,
  DocsyncSyncNowDto,
} from './doc-sync.dto';

/**
 * `/api/trips/:tripId/docsync`: a trip's document provider binding.
 *
 * Trip-scoped rather than user-scoped, and that is the whole point of the
 * feature: one connection per trip, which every member reads through. The
 * routes therefore sit under the trip, not under `/api/integrations`.
 *
 * Two shapes of answer, the split Dawarich already established: connection
 * routes (`test`, `status`) answer 200 even when the provider is unreachable,
 * with the reason in the body, because a form showing someone their own typo
 * needs a field to render rather than an exception. Everything else answers the
 * status the failure deserves.
 *
 * Only the trip owner may change a binding (plus an instance admin, who
 * overrides trip permissions everywhere else too). It hands TREK a credential
 * that usually reaches the owner's entire document archive, so widening this to
 * every member would let any member point the trip at a folder the owner never
 * meant to share. Reading the status is open to all members: they need to know
 * where their documents are going.
 */
@Controller('api/trips/:tripId/docsync')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.DOCUMENTS, 'Documents')
export class DocSyncController {
  constructor(
    private readonly config: DocSyncConfigService,
    private readonly sync: DocSyncService,
    private readonly registry: DocumentProviderRegistry,
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Tell the trip that a binding came or went.
   *
   * Whether a trip is bound decides whether its members see the sync button
   * at all, and a run only pings when it moved a document. Binding two empty
   * sides, or unbinding, moves nothing, so a member sitting on the Files tab
   * kept the old answer until they left it. The whole room, the caller
   * included: it is a ping to re-read, not a change to apply, and the owner's
   * own button depends on it too once every provider is switched off.
   */
  private announceBinding(link: Pick<LinkRow, 'id' | 'trip_id'>): void {
    this.realtime.broadcast(link.trip_id, 'docsync:changed', { linkId: link.id, pulled: 0, pushed: 0 });
  }

  /**
   * The trip owner or an instance admin, the same rule as `canManageDocSync`
   * on the client. Checked here rather than through @RequirePermission: the
   * permission table has no "manage integrations" action and inventing one
   * would grant it to every trip_member by default, which is the opposite of
   * what a credential this broad needs.
   *
   * The 403 still says "owner": an admin never sees it, and to everybody who
   * does, the owner is the person to ask.
   */
  private assertCanManage(tripId: string, user: User): void {
    if (user.role === 'admin') return;
    const trip = this.db.get<{ user_id: number }>('SELECT user_id FROM trips WHERE id = ?', tripId);
    if (!trip) throw new HttpException('Trip not found', 404);
    if (Number(trip.user_id) !== Number(user.id)) {
      throw new HttpException('Only the trip owner can change document sync', 403);
    }
  }

  // ── Providers and status ───────────────────────────────────────────────────

  /** Which providers this instance has switched on, with their form fields. */
  @Get('providers')
  providers() {
    const rows = this.db.connection
      .prepare('SELECT id, name, description, icon FROM document_providers WHERE enabled = 1 ORDER BY sort_order')
      .all() as Array<{ id: string; name: string; description: string | null; icon: string }>;
    return rows.map((p) => ({
      ...p,
      // A provider row with no registered adapter would render a form that
      // cannot work, so it is reported rather than hidden.
      available: !!this.registry.get(p.id),
      fields: this.config.providerFields(p.id).map((f) => ({ ...f, secret: f.secret === 1, required: f.required === 1 })),
    }));
  }

  @Get('status')
  status(@Param('tripId') tripId: string) {
    return this.sync.status(Number(tripId));
  }

  // ── Connections ────────────────────────────────────────────────────────────

  @Get('connections')
  listConnections(@Param('tripId') tripId: string) {
    return this.config.listConnections(Number(tripId)).map((c) => this.config.publicConnection(c));
  }

  @Put('connections')
  @HttpCode(200)
  async upsertConnection(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() body: DocsyncConnectionDto,
  ) {
    this.assertCanManage(tripId, user);
    if (!this.config.enabledProviderIds().includes(body.providerId)) {
      throw new HttpException(`Provider: "${body.providerId}" is not enabled, contact server administrator`, 400);
    }
    const res = await this.config.upsertConnection(Number(tripId), Number(user.id), body);
    if (docFailed(res)) throw new HttpException(res.error.detail || res.error.code, 400);
    return this.config.publicConnection(res.data);
  }

  /**
   * Probe form values. Always 200: the result is in the body, because this is
   * a form field, not a failure of the request. The photo providers pin the
   * same contract with a test their e2e suite marks CRITICAL.
   */
  @Post('connections/test')
  @HttpCode(200)
  async testConnection(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() body: DocsyncConnectionTestDto,
  ) {
    this.assertCanManage(tripId, user);
    const provider = this.registry.get(body.providerId);
    if (!provider) return { connected: false, error: 'unknown_provider' };

    const urlCheck = await this.config.validateBaseUrl(body.baseUrl);
    if (docFailed(urlCheck)) return { connected: false, error: urlCheck.error.code };

    // Probing with the values on screen, merged over whatever is stored, so a
    // user testing an unchanged connection does not have to retype the secret.
    const existing = this.config
      .listConnections(Number(tripId))
      .find((c) => c.provider_id === body.providerId);
    // Only for the address the credential was stored against. Merging it into a
    // probe of an arbitrary baseUrl turns this route into a way to have TREK
    // post a stored API token at a server of the caller's choosing, which is
    // exactly what somebody who inherited a trip but not its credentials would
    // reach for. Same host, same scheme, same port, or the caller types it in.
    const sameTarget = !!existing && sameOrigin(existing.base_url, urlCheck.data.url);
    const stored = sameTarget && existing ? this.config.toRef(existing) : null;
    const fields = this.config.providerFields(body.providerId);
    const secrets: Record<string, string> = { ...(stored?.secrets ?? {}) };
    const settings: Record<string, string> = { ...(stored?.settings ?? {}) };
    for (const f of fields) {
      const submitted = body.credentials[f.field_key];
      if (submitted === undefined || submitted === '') continue;
      if (f.secret === 1) secrets[f.field_key] = submitted;
      else settings[f.field_key] = submitted;
    }

    const res = await provider.probe({
      connectionId: existing?.id ?? 0,
      createdAt: existing?.created_at ?? '',
      ownerId: Number(user.id),
      baseUrl: urlCheck.data.url,
      secrets,
      settings,
      allowInsecureTls: body.allowInsecureTls,
    });
    if (docFailed(res)) return { connected: false, error: res.error.code, detail: res.error.detail };
    if (existing) this.config.recordProbe(existing.id, 'ok', null, res.data.capabilities);
    return { connected: true, account: res.data.account, capabilities: res.data.capabilities };
  }

  @Delete('connections/:connectionId')
  @HttpCode(200)
  deleteConnection(
    @Param('tripId') tripId: string,
    @Param('connectionId') connectionId: string,
    @CurrentUser() user: User,
  ) {
    this.assertCanManage(tripId, user);
    const conn = this.config.getConnection(Number(connectionId));
    if (!conn || conn.trip_id !== Number(tripId)) throw new HttpException('Connection not found', 404);
    // Its bindings go with it (ON DELETE CASCADE), so read them first.
    const unbound = this.config.listLinks(conn.trip_id).filter((l) => l.connection_id === conn.id);
    this.config.deleteConnection(conn.id);
    for (const link of unbound) this.announceBinding(link);
    return { success: true };
  }

  // ── Scopes ─────────────────────────────────────────────────────────────────

  /** Folders, tags or spaces the trip could be bound to. */
  @Get('connections/:connectionId/scopes')
  async listScopes(
    @Param('tripId') tripId: string,
    @Param('connectionId') connectionId: string,
    @CurrentUser() user: User,
    @Query('q') q?: string,
  ) {
    this.assertCanManage(tripId, user);
    const conn = this.config.getConnection(Number(connectionId));
    if (!conn || conn.trip_id !== Number(tripId)) throw new HttpException('Connection not found', 404);
    const provider = this.registry.get(conn.provider_id);
    if (!provider) throw new HttpException('Provider not available', 400);
    const res = await provider.listScopes(this.config.toRef(conn), q);
    if (docFailed(res)) return { scopes: [], error: res.error.code };
    return { scopes: res.data };
  }

  @Post('connections/:connectionId/scopes')
  async createScope(
    @Param('tripId') tripId: string,
    @Param('connectionId') connectionId: string,
    @CurrentUser() user: User,
    @Body() body: DocsyncScopeCreateDto,
  ) {
    this.assertCanManage(tripId, user);
    const conn = this.config.getConnection(Number(connectionId));
    if (!conn || conn.trip_id !== Number(tripId)) throw new HttpException('Connection not found', 404);
    const provider = this.registry.get(conn.provider_id);
    if (!provider) throw new HttpException('Provider not available', 400);
    const res = await provider.createScope(this.config.toRef(conn), body.name);
    if (docFailed(res)) throw new HttpException(res.error.code, 400);
    return res.data;
  }

  // ── Bindings ───────────────────────────────────────────────────────────────

  @Get('links')
  listLinks(@Param('tripId') tripId: string, @Req() req: Request) {
    const base = publicOrigin(req);
    return this.config.listLinks(Number(tripId)).map((l) => this.config.publicLink(l, base));
  }

  @Post('links')
  @HttpCode(200)
  async createLink(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() body: DocsyncLinkDto,
    @Req() req: Request,
  ) {
    this.assertCanManage(tripId, user);
    const res = this.config.createLink(Number(tripId), Number(user.id), body);
    if (docFailed(res)) throw new HttpException(res.error.detail || res.error.code, 400);
    this.announceBinding(res.data);

    // Subscribe where the provider lets TREK do it itself. A failure here is
    // not a failure of the binding (polling still carries it), so it is logged
    // into the link state rather than thrown at the user.
    const conn = this.config.getConnection(res.data.connection_id);
    const provider = conn ? this.registry.get(conn.provider_id) : undefined;
    if (conn && provider?.registerWebhook) {
      const base = publicOrigin(req);
      if (base) {
        const hook = await provider.registerWebhook(
          this.config.toRef(conn),
          this.config.toScopeRef(res.data),
          `${base}/api/docsync/webhook/${res.data.webhook_token}`,
          this.config.webhookSecret(res.data),
        );
        if (hook.success) {
          this.db.connection
            .prepare('UPDATE trip_document_links SET webhook_subscription_id = ? WHERE id = ?')
            .run(hook.data.subscriptionId, res.data.id);
        }
      }
    }

    // A first run right away, so the user sees something happen instead of
    // waiting out a poll interval and wondering whether it worked.
    void this.sync.syncLink(res.data, { full: true });
    return this.config.publicLink(this.config.getLink(res.data.id) ?? res.data, publicOrigin(req));
  }

  @Patch('links/:linkId')
  @HttpCode(200)
  updateLink(
    @Param('tripId') tripId: string,
    @Param('linkId') linkId: string,
    @CurrentUser() user: User,
    @Body() body: DocsyncLinkUpdateDto,
    @Req() req: Request,
  ) {
    this.assertCanManage(tripId, user);
    const link = this.config.getLink(Number(linkId));
    if (!link || link.trip_id !== Number(tripId)) throw new HttpException('Link not found', 404);
    const updated = this.config.updateLink(link.id, body);
    return this.config.publicLink(updated ?? link, publicOrigin(req));
  }

  @Delete('links/:linkId')
  @HttpCode(200)
  async deleteLink(
    @Param('tripId') tripId: string,
    @Param('linkId') linkId: string,
    @CurrentUser() user: User,
  ) {
    this.assertCanManage(tripId, user);
    const link = this.config.getLink(Number(linkId));
    if (!link || link.trip_id !== Number(tripId)) throw new HttpException('Link not found', 404);

    const conn = this.config.getConnection(link.connection_id);
    const provider = conn ? this.registry.get(conn.provider_id) : undefined;
    if (conn && provider?.unregisterWebhook && link.webhook_subscription_id) {
      await provider.unregisterWebhook(this.config.toRef(conn), link.webhook_subscription_id);
    }
    this.config.deleteLink(link.id);
    this.announceBinding(link);
    // Unbinding keeps both copies. Nothing is deleted anywhere.
    return { success: true, documentsKept: true };
  }

  @Post('links/:linkId/sync')
  @HttpCode(200)
  async syncNow(
    @Param('tripId') tripId: string,
    @Param('linkId') linkId: string,
    @Body() body: DocsyncSyncNowDto,
  ) {
    const link = this.config.getLink(Number(linkId));
    if (!link || link.trip_id !== Number(tripId)) throw new HttpException('Link not found', 404);
    // An orphaned binding stays orphaned: its credential belongs to somebody who
    // is no longer on this trip, and a manual run would use it anyway. The
    // scheduler already refuses it (sync_enabled is 0), so without this the
    // button was a way around that.
    if (link.last_sync_state === 'orphaned') {
      throw new HttpException({ error: 'This binding lost its owner and has to be reconnected' }, 409);
    }
    // Refused before the shelved rows are touched, so a binding an admin
    // switched off stays exactly as it was and resumes where it stopped. A code
    // rather than a sentence: the client says it in the reader's language.
    if (this.sync.isSwitchedOff(link)) {
      throw new HttpException({ error: PROVIDER_DISABLED }, 409);
    }
    // A person asking for a run is also asking for the rows that gave up to be
    // tried once more; the scheduler gets no such reprieve.
    this.sync.retryShelvedItems(link.id);
    return this.sync.syncLink(link, { full: body.full });
  }

  // ── Documents and conflicts ────────────────────────────────────────────────

  @Get('items')
  items(@Param('tripId') tripId: string, @Query('state') state?: string) {
    const rows = state
      ? this.db.connection
          .prepare(
            `SELECT i.*, f.original_name AS file_name FROM document_sync_items i
               LEFT JOIN trip_files f ON f.id = i.file_id
              WHERE i.trip_id = ? AND i.state = ? ORDER BY i.id DESC LIMIT 500`,
          )
          .all(Number(tripId), state)
      : this.db.connection
          .prepare(
            `SELECT i.*, f.original_name AS file_name FROM document_sync_items i
               LEFT JOIN trip_files f ON f.id = i.file_id
              WHERE i.trip_id = ? ORDER BY i.id DESC LIMIT 500`,
          )
          .all(Number(tripId));
    return rows;
  }

  @Post('items/:itemId/resolve')
  @HttpCode(200)
  async resolve(
    @Param('tripId') tripId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
    @Body() body: DocsyncResolveConflictDto,
  ) {
    this.assertCanManage(tripId, user);
    const ok = await this.sync.resolveConflict(Number(itemId), body.keep, Number(tripId));
    if (!ok) throw new HttpException('Item is not in conflict', 400);
    return { success: true };
  }
}


/** Whether two URLs address the same server, for deciding if a stored secret may be reused. */
function sameOrigin(a: string | null | undefined, b: string): boolean {
  if (!a) return false;
  try {
    const x = new URL(a);
    const y = new URL(b);
    return x.protocol === y.protocol && x.host === y.host;
  } catch {
    return false;
  }
}

/**
 * The origin a provider has to call back on.
 *
 * Derived from the request rather than from configuration because a self-hosted
 * TREK is reached under whatever name its operator chose, and asking them to
 * maintain a second copy of it would get it wrong. Returns null behind a proxy
 * that strips the host, in which case the webhook is simply not offered and
 * polling carries the binding.
 */
function publicOrigin(req: Request): string | null {
  const host = req.get('x-forwarded-host') || req.get('host');
  if (!host) return null;
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
  return `${proto}://${host}`;
}
