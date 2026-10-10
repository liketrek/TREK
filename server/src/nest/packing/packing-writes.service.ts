import type { User } from '../../types';
import { isUpdateConflict } from '../common/conflictResult';
import { DomainError } from '../common/domain-error';
import { requireTripWrite, type TripWriter } from '../common/trip-writer';
import { PermissionsService } from '../permissions/permissions.service';
import { PackingService, isInvalidBagRef } from './packing.service';
import { Injectable } from '@nestjs/common';
import type { TrekWsPayload } from '@trek/shared';

/** The item fields a create takes, as PackingService.createItem reads them. */
export type PackingItemCreateInput = Parameters<PackingService['createItem']>[1];
/** The item fields an update takes, as PackingService.updateItem reads them. */
export type PackingItemUpdateInput = Parameters<PackingService['updateItem']>[2];

/** A packing item with the privacy fields that decide who an event reaches (#858). */
type PrivacyItem = { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] };

const itemNotFound = () => new DomainError(404, 'Item not found', { mcpMessage: 'Packing item not found.' });
// The payload named a bag that is not on this trip (#2154): 400, as on create.
const bagNotFound = () => new DomainError(400, 'Bag not found', { mcpMessage: 'Bag not found.' });

/** Writes that can move a bag's weight, the only ones worth a bag-totals ping (#2191). */
const WEIGHT_KEYS = ['weight_grams', 'quantity', 'bag_id'];

/**
 * The packing item writes, one method per use case, for every surface.
 *
 * Each holds the trip gate, the reference and conflict checks, the write and
 * every event it sends; PackingController and PackingMcp are adapters over it.
 * Before this each surface ran its own copy of the gate and the broadcasts, and
 * they had drifted: the MCP update pinged bag totals on every write to a common
 * item, which the REST route had stopped doing on purpose.
 *
 * One difference stays, on purpose, because changing it would change who sees
 * what: an update to a restricted item reaches its owner only on REST
 * (PackingService.broadcastUpdate), and its owner plus recipients on MCP. Which
 * of the two is right is a product decision; until it is made, each surface
 * keeps the routing it had.
 */
@Injectable()
export class PackingWritesService {
  constructor(
    private readonly packing: PackingService,
    private readonly permissions: PermissionsService,
  ) {}

  /**
   * The REST caller of a packing write. Its events go through PackingService's own
   * broadcast and broadcastToViewers, skipping the sender's socket, exactly the
   * calls emitToViewers made for the routes.
   */
  restWriter(tripId: string, user: User, socketId: string | undefined): TripWriter {
    return {
      userId: user.id,
      role: user.role,
      socketId,
      surface: 'rest',
      events: {
        emit: (event, payload, onlyUserIds) =>
          onlyUserIds == null
            ? this.packing.broadcast(tripId, event, payload, socketId)
            : this.packing.broadcastToViewers(tripId, event, payload, [...onlyUserIds], socketId),
        emitAll: (event, payload) => this.packing.broadcast(tripId, event, payload, undefined),
      },
    };
  }

  private gate(tripId: string | number, writer: TripWriter) {
    return requireTripWrite(
      {
        access: { findAccessible: (id, userId) => this.packing.verifyTripAccess(id, userId) },
        permissions: this.permissions,
      },
      'packing_edit',
      tripId,
      writer,
    );
  }

  async createItem(tripId: string | number, input: PackingItemCreateInput, writer: TripWriter) {
    await this.gate(tripId, writer);
    const item = await this.packing.createItem(tripId, input, writer.userId);
    if (isInvalidBagRef(item)) throw bagNotFound();
    // A restricted item reaches its owner and recipients only; a common one the room.
    writer.events.emit('packing:created', { item } as TrekWsPayload<'packing:created'>, this.packing.viewersOf(item));
    this.packing.broadcastBagTotals(String(tripId));
    return item;
  }

  /**
   * Change an item. `bodyKeys` names the fields the caller sent (an explicit null
   * clears one); `ifMatch` is REST's X-Base-Updated-At for a stale offline write.
   */
  async updateItem(
    tripId: string | number,
    itemId: number,
    input: PackingItemUpdateInput,
    bodyKeys: string[],
    writer: TripWriter,
    ifMatch?: string,
  ) {
    await this.gate(tripId, writer);
    // Read before the write: getting it wrong leaks a freshly privatized item.
    const wasPrivate = !!(await this.packing.getItemPrivacy(tripId, itemId))?.is_private;
    const updated = await this.packing.updateItem(tripId, itemId, input, bodyKeys, ifMatch, writer.userId);
    if (!updated) throw itemNotFound();
    // A stale offline overwrite: the client resolves it against the server row (#1135).
    if (isUpdateConflict(updated)) throw new DomainError(409, 'conflict', { details: { server: updated.server } });
    if (isInvalidBagRef(updated)) throw bagNotFound();
    const item = updated as PrivacyItem;
    if (writer.surface === 'rest')
      this.packing.broadcastUpdate(String(tripId), itemId, item, wasPrivate, writer.socketId);
    else this.announceUpdateToViewers(itemId, item, wasPrivate, writer);
    // Checking an item off is the most frequent packing write there is, and every
    // ping costs every connected client a listBags round trip.
    if (WEIGHT_KEYS.some((k) => bodyKeys.includes(k))) this.packing.broadcastBagTotals(String(tripId));
    return updated;
  }

  /**
   * The four privacy transitions of an update (#858) as the MCP tools always sent
   * them: a restricted item goes to its owner and recipients.
   */
  private announceUpdateToViewers(itemId: number, item: PrivacyItem, wasPrivate: boolean, writer: TripWriter) {
    const viewers = this.packing.viewersOf(item);
    const payload = { item } as TrekWsPayload<'packing:updated'>;
    if (item.is_private) {
      // Newly restricted: off the room's screens first, then back to who may see it.
      if (!wasPrivate) writer.events.emit('packing:deleted', { itemId });
      writer.events.emit(wasPrivate ? 'packing:updated' : 'packing:created', payload, viewers);
      return;
    }
    // Newly common: the members who never had the row need it created, not updated.
    if (wasPrivate) writer.events.emit('packing:created', payload);
    writer.events.emit('packing:updated', payload);
  }

  async deleteItem(tripId: string | number, itemId: number, writer: TripWriter) {
    await this.gate(tripId, writer);
    const deleted = await this.packing.deleteItem(tripId, itemId, writer.userId);
    if (!deleted) throw itemNotFound();
    // Scoped to the people who could see it (owner + recipients, #858, #1976).
    writer.events.emit('packing:deleted', { itemId }, this.packing.viewersOf(deleted));
    this.packing.broadcastBagTotals(String(tripId));
    return deleted;
  }
}
