import { ADDON_IDS } from '../../addons';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { num, schemaMessage } from '../plugins/host/rpc-params';
import { CollectionsService } from './collections.service';
import {
  collectionCopyToTripRequestSchema,
  collectionCreateRequestSchema,
  collectionSavePlaceRequestSchema,
  collectionUpdateRequestSchema,
} from '@trek/shared';

/**
 * The collections surface a plugin may reach (#plugins).
 *
 * CollectionsService decides per-collection access itself (owner, admin or editor via
 * its assertAccess / assertCanEdit), and reports a refusal as a status-tagged error
 * rather than a typed one. mapCollectionError turns those statuses into the RPC error
 * classes, so a 403 or 404 reaches the plugin as RESOURCE_FORBIDDEN and a 400 or 409
 * as BAD_PARAMS, instead of leaking out as HOST_ERROR.
 */
@PluginController()
export class CollectionsRpc {
  constructor(
    private readonly collections: CollectionsService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('collections.listMine', { permission: 'db:read:collections' })
  async listMine(_params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const userId = this.requireCollectionsUser(ctx, 'reads');
    await this.requireCollectionsAddon();
    return this.collections.listCollections(userId);
  }

  @PluginMethod('collections.get', { permission: 'db:read:collections' })
  async get(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // getCollection is user-scoped by the service, so a plugin only ever fetches one
    // the acting user may see.
    const userId = this.requireCollectionsUser(ctx, 'reads');
    const id = num(params.id, 'id');
    await this.requireCollectionsAddon();
    return this.collections.getCollection(userId, id);
  }

  @PluginMethod('collections.create', { permission: 'db:write:collections' })
  async create(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const parsed = collectionCreateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid collection: ${schemaMessage(parsed.error)}`);
    const userId = this.requireCollectionsUser(ctx, 'writes');
    await this.requireCollectionsAddon();
    return this.mapCollectionError(() => this.collections.createCollection(userId, parsed.data as never));
  }

  @PluginMethod('collections.update', { permission: 'db:write:collections' })
  async update(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const parsed = collectionUpdateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid collection: ${schemaMessage(parsed.error)}`);
    const userId = this.requireCollectionsUser(ctx, 'writes');
    const id = num(params.id, 'id');
    await this.requireCollectionsAddon();
    return this.mapCollectionError(() =>
      this.collections.updateCollection(userId, id, parsed.data as never, undefined),
    );
  }

  @PluginMethod('collections.savePlace', { permission: 'db:write:collections' })
  async savePlace(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const parsed = collectionSavePlaceRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid place: ${schemaMessage(parsed.error)}`);
    const userId = this.requireCollectionsUser(ctx, 'writes');
    await this.requireCollectionsAddon();
    return this.mapCollectionError(() => this.collections.savePlace(userId, parsed.data as never, undefined));
  }

  @PluginMethod('collections.copyToTrip', { permission: 'db:write:collections' })
  async copyToTrip(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const parsed = collectionCopyToTripRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid copy request: ${schemaMessage(parsed.error)}`);
    const userId = this.requireCollectionsUser(ctx, 'writes');
    await this.requireCollectionsAddon();
    return this.mapCollectionError(() => this.collections.copyToTrip(userId, parsed.data as never));
  }

  @PluginMethod('collections.deletePlace', { permission: 'db:write:collections' })
  async deletePlace(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const userId = this.requireCollectionsUser(ctx, 'writes');
    const placeId = num(params.placeId, 'placeId');
    await this.requireCollectionsAddon();
    // Awaited so a refusal actually reaches the plugin as RESOURCE_FORBIDDEN/BAD_PARAMS
    // instead of being dropped as an unhandled rejection while this returns
    // {deleted: true} anyway.
    await this.mapCollectionError(() => this.collections.deletePlace(userId, placeId, undefined));
    return { deleted: true };
  }

  private requireCollectionsUser(ctx: PluginRpcContext, kind: 'reads' | 'writes'): number {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource(`collection ${kind} require an authenticated user context`);
    }
    return ctx.actingUserId;
  }

  private async requireCollectionsAddon(): Promise<void> {
    await this.guards.requireAddon(ADDON_IDS.COLLECTIONS, 'collections');
  }

  /**
   * The service's status-tagged errors, mapped onto the RPC error taxonomy.
   *
   * Async-aware: every service method it wraps is async. Awaiting inside works for
   * a sync callback too — a sync throw from `fn()` is caught by this function's own
   * try/catch same as an awaited rejection — so every caller goes through one path.
   */
  private async mapCollectionError<T>(fn: () => T | Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      const status = (e as { status?: number })?.status;
      const msg = e instanceof Error ? e.message : 'collection error';
      if (status === 403 || status === 404) throw new ForbiddenResource(msg);
      if (status === 400 || status === 409) throw new BadParams(msg);
      throw e;
    }
  }
}
