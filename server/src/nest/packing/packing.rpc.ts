import { packingCreateItemRequestSchema, packingUpdateItemRequestSchema } from '@trek/shared';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { asPayload, num, schemaMessage } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { PackingService } from './packing.service';
import { isUpdateConflict } from '../common/conflictResult';

/** Packing rides on the app's own 'packing_edit' permission, exactly like the REST path. */
const PACKING_EDIT_ACTION = 'packing_edit';

type PrivacyItem = { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] };

/**
 * The packing surface a plugin may reach (#plugins).
 *
 * The privacy-scoped broadcasts (#858) go through PackingService, the same methods
 * the REST controller calls. They used to be duplicated inside the plugin deps
 * factory, with a comment asking for both copies to be kept in lockstep by hand;
 * that copy is gone. Getting this wrong leaks a private item to the whole trip room,
 * which is why `wasPrivate` is read BEFORE the write and why the four transitions
 * live in exactly one place.
 *
 * Bags carry no privacy, so they broadcast to the room unfiltered.
 */
@PluginController()
export class PackingRpc {
  constructor(
    private readonly packing: PackingService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('packing.list', { permission: 'db:read:packing' })
  list(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // Scoped to the acting user so the #858 visibility filter applies: a plugin must
    // not see another member's private items.
    return this.guards.tripRead(params, ctx, (userId) => this.packing.listItems(num(params.tripId, 'tripId'), userId));
  }

  @PluginMethod('packing.create', { permission: 'db:write:packing' })
  create(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'packing item');
    const parsed = packingCreateItemRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid packing item: ${schemaMessage(parsed.error)}`);
    this.guards.requireTripEdit(tripId, actor, PACKING_EDIT_ACTION);
    const item = this.packing.createItem(String(tripId), parsed.data as never, actor) as PrivacyItem;
    this.packing.emitToViewers(String(tripId), 'packing:created', { item }, item, undefined);
    return item;
  }

  @PluginMethod('packing.update', { permission: 'db:write:packing' })
  update(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const itemId = num(params.itemId, 'itemId');
    const actor = this.guards.requireActor(ctx, 'packing item');
    const parsed = packingUpdateItemRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid packing item: ${schemaMessage(parsed.error)}`);
    this.guards.requireTripEdit(tripId, actor, PACKING_EDIT_ACTION);
    // Read the privacy BEFORE the write, so a public/private toggle routes correctly.
    const before = this.packing.getItemPrivacy(tripId, itemId);
    const input = parsed.data as Record<string, unknown>;
    const updated = this.packing.updateItem(String(tripId), String(itemId), input as never, Object.keys(input), undefined, actor);
    if (!updated) throw new ForbiddenResource(`no packing item ${itemId} on trip ${tripId}`);
    if (isUpdateConflict(updated)) throw new BadParams('packing item was modified concurrently');
    this.packing.broadcastUpdate(String(tripId), itemId, updated as PrivacyItem, !!before?.is_private, undefined);
    return updated;
  }

  @PluginMethod('packing.delete', { permission: 'db:write:packing' })
  delete(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const itemId = num(params.itemId, 'itemId');
    const actor = this.guards.requireActor(ctx, 'packing item');
    this.guards.requireTripEdit(tripId, actor, PACKING_EDIT_ACTION);
    const deleted = this.packing.deleteItem(String(tripId), String(itemId), actor) as PrivacyItem | null;
    if (!deleted) throw new ForbiddenResource(`no packing item ${itemId} on trip ${tripId}`);
    this.packing.emitToViewers(String(tripId), 'packing:deleted', { itemId }, deleted, undefined);
    return { deleted: true };
  }

  @PluginMethod('packing.listBags', { permission: 'db:write:packing' })
  listBags(params: Record<string, unknown>, ctx: PluginRpcContext): unknown[] {
    // Note the permission: the envelope really does gate this READ on the write
    // grant. The decorator makes the oddity visible instead of burying it.
    return this.guards.tripRead(params, ctx, () => this.packing.listBags(String(num(params.tripId, 'tripId'))) as unknown[]);
  }

  @PluginMethod('packing.createBag', { permission: 'db:write:packing' })
  createBag(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'packing bag');
    const input = asPayload(params.input);
    if (typeof input.name !== 'string' || input.name.trim() === '') throw new BadParams('bag name is required');
    this.guards.requireTripEdit(tripId, actor, PACKING_EDIT_ACTION);
    const bag = this.packing.createBag(String(tripId), { name: input.name, color: typeof input.color === 'string' ? input.color : undefined });
    this.realtime.broadcast(tripId, 'packing:bag-created', { bag }, undefined);
    return bag;
  }

  @PluginMethod('packing.updateBag', { permission: 'db:write:packing' })
  updateBag(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const bagId = num(params.bagId, 'bagId');
    const actor = this.guards.requireActor(ctx, 'packing bag');
    this.guards.requireTripEdit(tripId, actor, PACKING_EDIT_ACTION);
    const input = asPayload(params.input);
    const bag = this.packing.updateBag(String(tripId), String(bagId), input as never, Object.keys(input));
    if (!bag) throw new ForbiddenResource(`no packing bag ${bagId} on trip ${tripId}`);
    this.realtime.broadcast(tripId, 'packing:bag-updated', { bag }, undefined);
    return bag;
  }

  @PluginMethod('packing.deleteBag', { permission: 'db:write:packing' })
  deleteBag(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const bagId = num(params.bagId, 'bagId');
    const actor = this.guards.requireActor(ctx, 'packing bag');
    this.guards.requireTripEdit(tripId, actor, PACKING_EDIT_ACTION);
    if (!this.packing.deleteBag(String(tripId), String(bagId))) {
      throw new ForbiddenResource(`no packing bag ${bagId} on trip ${tripId}`);
    }
    this.realtime.broadcast(tripId, 'packing:bag-deleted', { bagId }, undefined);
    return { deleted: true };
  }

  @PluginMethod('packing.setBagMembers', { permission: 'db:write:packing' })
  setBagMembers(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const bagId = num(params.bagId, 'bagId');
    const actor = this.guards.requireActor(ctx, 'packing bag');
    this.guards.requireTripEdit(tripId, actor, PACKING_EDIT_ACTION);
    // userIds sits on the params object itself, not under `input`.
    const raw = asPayload(params).userIds;
    const userIds = Array.isArray(raw) ? raw.filter((x): x is number => typeof x === 'number') : [];
    const members = this.packing.setBagMembers(String(tripId), String(bagId), userIds);
    if (!members) throw new ForbiddenResource(`no packing bag ${bagId} on trip ${tripId}`);
    this.realtime.broadcast(tripId, 'packing:bag-members-updated', { bagId, members }, undefined);
    return members;
  }
}
