import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { resolvePackedState, type TrekWsPayload, type TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import { avatarUrl } from '../common/avatarUrl';
import type { UpdateConflict } from '../common/conflictResult';
import type { User } from '../../types';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { UnitOfWork } from '../database/unit-of-work';
import { PackingItems } from '../../db/entities/PackingItems.entity';
import type { PackingItemsRepository, PackingItemRow } from '../../db/repositories/PackingItems.repository';
import { PackingItemContributors } from '../../db/entities/PackingItemContributors.entity';
import type { PackingItemContributorsRepository } from '../../db/repositories/PackingItemContributors.repository';
import { PackingBags } from '../../db/entities/PackingBags.entity';
import type { PackingBagsRepository, PackingBagMemberForTripRow } from '../../db/repositories/PackingBags.repository';
import { PackingCategoryAssignees } from '../../db/entities/PackingCategoryAssignees.entity';
import type { PackingCategoryAssigneesRepository } from '../../db/repositories/PackingCategoryAssignees.repository';
import { PackingTemplates } from '../../db/entities/PackingTemplates.entity';
import type { PackingTemplatesRepository } from '../../db/repositories/PackingTemplates.repository';
import { PackingTemplateCategories } from '../../db/entities/PackingTemplateCategories.entity';
import type { PackingTemplateCategoriesRepository } from '../../db/repositories/PackingTemplateCategories.repository';
import { PackingTemplateItems } from '../../db/entities/PackingTemplateItems.entity';
import type { PackingTemplateItemsRepository } from '../../db/repositories/PackingTemplateItems.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';

/** Privacy fields stamped on a packing item (#858). */
type PrivacyFields = { is_private?: number; owner_id?: number | null };

/**
 * Rejection sentinel for a body-referenced bag that does not exist on the trip
 * (#2154). The packing_bags FK only guarantees the id exists somewhere: a
 * cross-trip bag_id used to be accepted silently and a dead one surfaced as an
 * SQLite FK error. Returned by createItem/updateItem so REST, MCP and the
 * plugin RPC all map it to their surface's 400/BadParams.
 */
export interface InvalidBagRef {
  invalidBag: true;
}

export function isInvalidBagRef(result: unknown): result is InvalidBagRef {
  return !!result && typeof result === 'object' && (result as { invalidBag?: unknown }).invalidBag === true;
}

type Trip = TripAccess;

export type PackingVisibility = 'common' | 'personal' | 'shared';

interface ImportItem {
  name?: string;
  checked?: boolean;
  category?: string;
  weight_grams?: string | number;
  bag?: string;
  quantity?: number;
  is_private?: boolean;
}

const BAG_COLORS = ['#6366f1', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#f59e0b', '#3b82f6', '#84cc16', '#d946ef', '#14b8a6', '#f43f5e', '#a855f7', '#eab308', '#64748b'];

/**
 * Packing domain service — owns the packing business logic (the bodyKeys
 * sentinel protocol on the updates, the #858 three-tier sharing model and
 * the post-write re-selects); the SQL itself lives in the nine `Packing*`
 * repositories (Plan 3e Task 3) this class is built on. Trip access, the
 * 'packing_edit' permission and the WebSocket broadcast keep their legacy
 * call paths. Post-migration fixes over the legacy code: a single 'Other'
 * category default, bodyKeys-gated weight_limit_grams (explicit null
 * clears it), and transactions around every multi-statement write. The
 * remaining non-Nest consumer went with the legacy MCP prompts registrar, and
 * packing.bridge.ts was deleted with it.
 *
 * **The per-actor visibility guard (#858, `PackingItemsRepository
 * .findVisibleInTrip`) is this domain's entire security model** — Task 0's
 * shared `packingVisibleToActorExpr` predicate
 * (`_shared/packing-visibility.ts`), consumed here rather than re-derived
 * (R1). `PackingService.getItemInTrip` no longer exists on this class: every
 * call site below calls the repository method directly.
 */
@Injectable()
export class PackingService {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly uow: UnitOfWork,
    @InjectRepository(PackingItems) private readonly itemsRepo: PackingItemsRepository,
    @InjectRepository(PackingItemContributors) private readonly contributorsRepo: PackingItemContributorsRepository,
    @InjectRepository(PackingBags) private readonly bagsRepo: PackingBagsRepository,
    @InjectRepository(PackingCategoryAssignees) private readonly categoryAssigneesRepo: PackingCategoryAssigneesRepository,
    @InjectRepository(PackingTemplates) private readonly templatesRepo: PackingTemplatesRepository,
    @InjectRepository(PackingTemplateCategories) private readonly templateCategoriesRepo: PackingTemplateCategoriesRepository,
    @InjectRepository(PackingTemplateItems) private readonly templateItemsRepo: PackingTemplateItemsRepository,
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    // Plan 4 Task 3: `DatabaseService.rosterUserIds` inlined onto
    // `TripMembersRepository.rosterUserIds`. Plan 4 Task 4 made this
    // required (`conflictUpdate.test.ts`'s hand-construction landed) and
    // dropped the `DatabaseService` fallback in `tripRosterIds` below.
    @InjectRepository(TripMembers) private readonly tripMembersRepo: TripMembersRepository,
  ) {}

  async verifyTripAccess(tripId: string | number, userId: number) {
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is
    // gone: this reuses the TripsRepository already injected for other
    // reads and calls findAccessible.
    return await this.tripsRepo.findAccessible(tripId, userId);
  }

  /** Mirrors the inline checkPermission('packing_edit', ...) the legacy route runs. */
  async canEdit(trip: Trip, user: User): Promise<boolean> {
    return this.permissions.checkPermission('packing_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /**
   * Broadcast an item event, but keep private items (#858) off other members'
   * screens: when the item is private the event is delivered only to its owner's
   * sockets. Shared items broadcast to the whole trip room as before.
   */
  broadcastItem<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, item: PrivacyFields | null | undefined, socketId: string | undefined): void {
    const onlyUserId = item?.is_private && item.owner_id != null ? item.owner_id : undefined;
    this.realtime.broadcast(tripId, event, payload, socketId, onlyUserId);
  }

  /** Deliver an item event to a specific set of viewers (#858 shared items) — the
   *  owner plus the recipients it was shared with — without leaking to the room. */
  broadcastToViewers<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, viewerIds: number[], socketId: string | undefined): void {
    for (const uid of new Set(viewerIds)) {
      if (uid != null) this.realtime.broadcast(tripId, event, payload, socketId, uid);
    }
  }

  /** The users who can currently see an item: everyone (null) for Common, or
   *  owner + recipients for a restricted item. */
  viewersOf(item: { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] } | null | undefined): number[] | null {
    if (!item || !item.is_private) return null; // Common — visible to the whole room
    const ids = [item.owner_id, ...(item.recipients || []).map(r => r.user_id)].filter((x): x is number => x != null);
    return ids;
  }

  /** Deliver an item event to exactly the people who can see it (#858): the whole
   *  room for a Common item, or owner + recipients for a restricted one. */
  emitToViewers<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, item: PrivacyFields | null | undefined, socketId: string | undefined): void {
    const viewers = this.viewersOf(item);
    if (viewers === null) {
      this.broadcast(tripId, event, payload, socketId);
    } else {
      this.broadcastToViewers(tripId, event, payload, viewers, socketId);
    }
  }

  /**
   * Tell the whole room its bag weights moved (#2191).
   *
   * Deliberately NOT excluding the originating socket, which every other
   * broadcast here does: the payload carries nothing to echo, and the sender's
   * own client cannot recompute a server-side total from the item it just
   * wrote either. Everyone refetches, everyone gets numbers.
   *
   * Called for item writes, and for a bag DELETE: packing_items.bag_id is
   * ON DELETE SET NULL, so deleting a bag moves everything in it to the
   * unassigned pile and moves both figures. A bag create or rename does not,
   * and already broadcasts its own row.
   */
  broadcastBagTotals(tripId: string): void {
    this.broadcast(tripId, 'packing:bag-totals', {}, undefined);
  }

  /**
   * The four public/private transitions after an update (#858). `wasPrivate` must be
   * read BEFORE the write: getting it wrong leaks a freshly-privatized item to the
   * whole room.
   *
   *  - private -> private: owner-only update
   *  - public  -> private: drop it from the room, then re-add it for the owner
   *  - private -> public:  add it for the members who did not have it, then update
   *  - public  -> public:  a plain update to everyone
   *
   * Both the REST controller and the plugin RPC handler call this. It used to exist
   * three times over (here, in the controller, and as a standalone copy inside the
   * plugin deps factory), with a comment asking for all of them to be kept in
   * lockstep by hand.
   */
  broadcastUpdate(tripId: string, id: string | number, item: PrivacyFields, wasPrivate: boolean, socketId: string | undefined): void {
    const nowPrivate = !!item.is_private;
    if (nowPrivate) {
      if (wasPrivate) {
        this.broadcastItem(tripId, 'packing:updated', { item } as TrekWsPayload<'packing:updated'>, item, socketId);
      } else {
        this.broadcast(tripId, 'packing:deleted', { itemId: Number(id) }, socketId);
        this.broadcastItem(tripId, 'packing:created', { item } as TrekWsPayload<'packing:created'>, item, socketId);
      }
    } else {
      if (wasPrivate) {
        this.broadcast(tripId, 'packing:created', { item } as TrekWsPayload<'packing:created'>, socketId);
      }
      this.broadcast(tripId, 'packing:updated', { item } as TrekWsPayload<'packing:updated'>, socketId);
    }
  }

  // ── Items ──────────────────────────────────────────────────────────────────

  /**
   * Attach the bringer name, recipients and co-contributors to a set of packing
   * items (#858 three-tier sharing). Batched so the list endpoint stays one round
   * of queries regardless of item count.
   */
  private async enrichItems(items: any[]): Promise<any[]> {
    if (items.length === 0) return items;
    const ids = items.map(i => i.id);
    const ownerIds = [...new Set(items.map(i => i.owner_id).filter((id): id is number => id != null))];

    const owners = await this.itemsRepo.listOwnersForIds(ownerIds);
    const ownerName = new Map(owners.map(o => [o.id, o.username]));

    const recipientRows = await this.itemsRepo.listRecipientsForItems(ids);
    const recipientsByItem = new Map<number, { user_id: number; username: string }[]>();
    for (const r of recipientRows) {
      if (!recipientsByItem.has(r.item_id)) recipientsByItem.set(r.item_id, []);
      recipientsByItem.get(r.item_id)!.push({ user_id: r.user_id, username: r.username });
    }

    const contributorRows = await this.contributorsRepo.listForItems(ids);
    const contributorsByItem = new Map<number, { user_id: number; username: string; status: string }[]>();
    for (const c of contributorRows) {
      if (!contributorsByItem.has(c.item_id)) contributorsByItem.set(c.item_id, []);
      contributorsByItem.get(c.item_id)!.push({ user_id: c.user_id, username: c.username, status: c.status });
    }

    return items.map(i => ({
      ...i,
      owner_username: i.owner_id != null ? ownerName.get(i.owner_id) ?? null : null,
      recipients: recipientsByItem.get(i.id) || [],
      contributors: contributorsByItem.get(i.id) || [],
    }));
  }

  async listItems(tripId: string | number, userId?: number) {
    // Three-tier visibility (#858): Common (is_private=0) is visible to everyone;
    // Personal/Shared (is_private=1) only to the owner (bringer) and the recipients
    // it was explicitly shared with. Without a userId the unfiltered list is
    // returned — every current caller (trip summary, offline bundle, prompts,
    // resources, plugin host) passes the viewer; omit it only for genuinely
    // viewer-less internal reads.
    const rows: PackingItemRow[] = userId == null ? await this.itemsRepo.listForTrip(tripId) : await this.itemsRepo.listVisibleToActor(tripId, userId);
    return await this.enrichItems(rows);
  }

  /**
   * Reads an item's current privacy fields (#858) before an update, so the
   * controller can detect a public↔private transition and route the
   * broadcast. `id: number` (Plan 4 Task 8b, U6 — the program's gate-level
   * id parsing carry: `PackingController.update` parses `:id` once via
   * `toRowId` and threads the number here; `packing.rpc.ts`'s `num()`-
   * derived `itemId` was already a number).
   */
  async getItemPrivacy(tripId: string | number, id: number): Promise<PrivacyFields | undefined> {
    return await this.itemsRepo.getPrivacy(id, tripId);
  }

  /** Maps the three-tier visibility (#858) onto the stored is_private flag. */
  private visibilityToPrivate(visibility?: PackingVisibility, isPrivateFallback?: boolean): number {
    if (visibility) return visibility === 'common' ? 0 : 1;
    return isPrivateFallback ? 1 : 0;
  }

  async createItem(
    tripId: string | number,
    data: { name: string; category?: string; checked?: boolean; quantity?: number; weight_grams?: number | null; bag_id?: number | null; is_private?: boolean; visibility?: PackingVisibility; recipient_ids?: number[] },
    ownerId?: number,
  ) {
    if (data.bag_id != null && !(await this.bagInTrip(tripId, data.bag_id))) return { invalidBag: true } as const;
    const maxOrder = await this.itemsRepo.maxSortOrder(tripId);
    const sortOrder = (maxOrder !== null ? maxOrder : -1) + 1;
    const qty = Math.max(1, Math.min(999, Number(data.quantity) || 1));
    const isPrivate = this.visibilityToPrivate(data.visibility, data.is_private);

    const itemId = await this.uow.transactional(async () => {
      const id = await this.itemsRepo.insertItem({
        trip_id: tripId,
        name: data.name,
        checked: data.checked ? 1 : 0,
        category: data.category || 'Other',
        sort_order: sortOrder,
        quantity: qty,
        weight_grams: data.weight_grams ?? null,
        bag_id: data.bag_id ?? null,
        is_private: isPrivate,
        owner_id: ownerId ?? null,
      });
      // "Shared with specific people" — record the recipients it covers.
      if (data.visibility === 'shared' && Array.isArray(data.recipient_ids)) {
        const roster = await this.tripRosterIds(tripId);
        const recipients = data.recipient_ids.filter(uid => uid !== ownerId && roster.has(uid));
        await this.itemsRepo.insertRecipientsIgnore(id, recipients);
      }
      return id;
    });

    return (await this.enrichItems([await this.itemsRepo.findById(itemId)]))[0];
  }

  /** `id: number` — same Plan 4 Task 8b (U6) gate-level narrowing as {@link getItemPrivacy} (`PackingController.update`/`packing.mcp.ts`'s Zod-typed `itemId`/`packing.rpc.ts`'s `num()`-derived `itemId`). */
  async updateItem(
    tripId: string | number,
    id: number,
    data: { name?: string; checked?: number; category?: string; weight_grams?: number | null; bag_id?: number | null; quantity?: number; packed_quantity?: number | null; is_private?: boolean },
    bodyKeys: string[],
    ifMatch?: string,
    actingUserId?: number,
  ): Promise<unknown | UpdateConflict | null> {
    // Was a trip-scoped lookup, which let any member with packing_edit write to
    // another member's restricted item (and read it back off the response).
    const item = await this.itemsRepo.findVisibleInTrip(id, tripId, actingUserId);
    if (!item) return null;

    // Optimistic concurrency (#1135): reject a stale offline overwrite. Absent
    // token => unconditional update (back-compat with older clients).
    if (ifMatch !== undefined && item.updated_at != null && String(item.updated_at) !== ifMatch) {
      return { conflict: true, server: await this.itemsRepo.findById(id) };
    }

    // A non-null bag about to be bound must belong to this trip (#2154) — the
    // FK alone let any member point an item at another trip's bag.
    if (bodyKeys.includes('bag_id') && data.bag_id != null && !(await this.bagInTrip(tripId, data.bag_id))) {
      return { invalidBag: true } as const;
    }

    // Privatizing an unowned (legacy) item stamps the acting user as its owner so
    // the visibility filter still has someone to match (#858).
    const claimOwner = bodyKeys.includes('is_private') && !!data.is_private && item.owner_id == null && actingUserId != null;

    // The box and the packed count (#2296) are settled together, so a count
    // that reaches the quantity ticks the item and a tick clears the count.
    const quantity = bodyKeys.includes('quantity') ? Math.max(1, Math.min(999, Number(data.quantity) || 1)) : (item.quantity || 1);
    const packed = resolvePackedState(
      { checked: item.checked ? 1 : 0, packed_quantity: item.packed_quantity ?? null },
      { bodyKeys, checked: data.checked, packed_quantity: data.packed_quantity, quantity },
    );

    await this.itemsRepo.update(id, {
      name: [!!data.name, data.name || null],
      checked: [true, packed.checked],
      packed_quantity: [true, packed.packed_quantity],
      category: [!!data.category, data.category || null],
      weight_grams: [bodyKeys.includes('weight_grams'), data.weight_grams ?? null],
      bag_id: [bodyKeys.includes('bag_id'), data.bag_id ?? null],
      quantity: [true, quantity],
      is_private: [bodyKeys.includes('is_private'), data.is_private ? 1 : 0],
      owner_id: [claimOwner, actingUserId ?? null],
    });

    return (await this.enrichItems([await this.itemsRepo.findById(id)]))[0];
  }

  // ── Three-tier sharing (#858): recipients, contributors, clone ───────────────

  /**
   * Re-set who a "shared with specific people" item covers, and its visibility tier.
   * Only the owner (bringer) may change this; a non-owner caller is rejected with null.
   */
  /** `id: number` — same Plan 4 Task 8b (U6) gate-level narrowing as {@link getItemPrivacy} (`PackingController.setSharing`/`packing.mcp.ts`'s Zod-typed `itemId`). */
  async setItemSharing(
    tripId: string | number,
    id: number,
    actingUserId: number,
    visibility: PackingVisibility,
    recipientIds: number[],
  ) {
    const item = await this.itemsRepo.findVisibleInTrip(id, tripId, actingUserId);
    if (!item) return null;
    // The owner controls sharing; an unowned legacy item is claimed by the actor.
    if (item.owner_id != null && item.owner_id !== actingUserId) return { forbidden: true as const };

    await this.uow.transactional(async () => {
      // COALESCE(owner_id, ?) at the SQL level kept the existing owner if one was
      // set; passing the claim only when the pre-image had none reproduces that
      // exactly (nothing else touches owner_id inside this same transaction).
      const claimOwnerId = item.owner_id == null ? actingUserId : undefined;
      await this.itemsRepo.updateSharing(id, this.visibilityToPrivate(visibility), claimOwnerId);
      await this.itemsRepo.deleteRecipientsForItem(id);
      if (visibility === 'shared') {
        const owner = item.owner_id ?? actingUserId;
        const roster = await this.tripRosterIds(tripId);
        const recipients = recipientIds.filter(uid => uid !== owner && roster.has(uid));
        await this.itemsRepo.insertRecipientsIgnore(id, recipients);
      }
      // Leaving the Common tier drops any co-contributors (they only apply to Common).
      if (visibility !== 'common') await this.contributorsRepo.deleteForItem(id);
    });
    return (await this.enrichItems([await this.itemsRepo.findById(id)]))[0];
  }

  /**
   * "I can bring that too" — adds the user as a co-contributor on a Common
   * item. `id: number` — same Plan 4 Task 8b (U6) narrowing as {@link
   * getItemPrivacy} (`PackingController.addContributor`, native Nest code
   * with no pre-ORM Express precedent — #858 landed post-migration).
   */
  async addContributor(tripId: string | number, id: number, userId: number) {
    const item = await this.itemsRepo.findVisibleInTrip(id, tripId, userId);
    if (!item || item.is_private !== 0) return null; // co-contribution is a Common-list concept
    if (item.owner_id === userId) return null; // the bringer is already covering it
    await this.contributorsRepo.insertIgnore(id, userId);
    return (await this.enrichItems([await this.itemsRepo.findById(id)]))[0];
  }

  /** `id: number` — same Plan 4 Task 8b (U6) narrowing as {@link addContributor}; `userId` here is the target being removed, not the acting viewer (`PackingController.removeContributor` now parses both `:id`/`:userId` via `toRowId` instead of a bare `Number.parseInt`). */
  async removeContributor(tripId: string | number, id: number, userId: number) {
    const item = await this.itemsRepo.findVisibleInTrip(id, tripId, userId);
    if (!item) return null;
    await this.contributorsRepo.deleteOne(id, userId);
    return (await this.enrichItems([await this.itemsRepo.findById(id)]))[0];
  }

  /** True when the bag exists AND belongs to the trip — the referenced-id rule
   *  the FK cannot enforce (it only checks existence). */
  private async bagInTrip(tripId: string | number, bagId: number): Promise<boolean> {
    return !!(await this.bagsRepo.findInTrip(bagId, tripId));
  }

  /**
   * A copy keeps the original's bag only when that bag is the caller's to pack: one nobody
   * owns, or one they belong to. Inheriting someone else's bag would drop the copy into
   * their luggage and inflate their weight (#207).
   */
  private async bagForCloner(tripId: string | number, bagId: number | null, userId: number): Promise<number | null> {
    if (bagId == null) return null;
    const bag = await this.bagsRepo.findInTrip(bagId, tripId);
    if (!bag) return null;
    if (bag.user_id === userId) return bagId;
    const memberIds = await this.bagsRepo.listMemberIdsForBag(bagId);
    if (bag.user_id == null && memberIds.length === 0) return bagId; // shared bag, nobody's in particular
    return memberIds.some(uid => uid === userId) ? bagId : null;
  }

  /**
   * Clone a (Common) item onto the caller's Personal list as a private starting point.
   * Weight comes along — it is a property of the thing, and re-entering it by hand for
   * every traveller was the whole complaint in #207.
   */
  /** `id: number` — same Plan 4 Task 8b (U6) narrowing as {@link addContributor} (`PackingController.clone`). */
  async cloneItem(tripId: string | number, id: number, userId: number) {
    const item = await this.itemsRepo.findVisibleInTrip(id, tripId, userId);
    if (!item) return null;
    return await this.createItem(tripId, {
      name: item.name,
      category: item.category || undefined,
      quantity: item.quantity,
      weight_grams: item.weight_grams,
      bag_id: await this.bagForCloner(tripId, item.bag_id, userId),
      visibility: 'personal',
    }, userId);
  }

  /** `id: number` — same Plan 4 Task 8b (U6) narrowing as {@link addContributor} (`PackingController.remove`/`packing.mcp.ts`'s Zod-typed `itemId`/`packing.rpc.ts`'s `num()`-derived `itemId`). */
  async deleteItem(tripId: string | number, id: number, actingUserId?: number) {
    // Return the deleted row (not just a boolean) so callers can target the
    // delete broadcast at the owner when the item was private (#858).
    // Scoped to what the actor may see: trip membership alone used to be enough
    // to delete another member's restricted item.
    const item = await this.itemsRepo.findVisibleInTrip(id, tripId, actingUserId);
    if (!item) return null;

    await this.itemsRepo.delete(id);
    return item;
  }

  /**
   * The trip's bag called `name`, created with the next colour when there is
   * none yet. Shared by the bulk import and template apply (#1131), which both
   * carry bags by name. Runs inside the caller's transaction.
   */
  private async bagIdByName(tripId: string | number, name: string | null | undefined): Promise<number | null> {
    const bagName = name?.trim();
    if (!bagName) return null;
    const existing = await this.bagsRepo.byNameInTrip(tripId, bagName);
    if (existing) return existing.id;
    const bagCount = await this.bagsRepo.countForTrip(tripId);
    return await this.bagsRepo.insertMinimal(tripId, bagName, BAG_COLORS[bagCount % BAG_COLORS.length]);
  }

  // ── Bulk Import ────────────────────────────────────────────────────────────

  async bulkImport(tripId: string | number, items: ImportItem[], ownerId?: number) {
    const maxOrder = await this.itemsRepo.maxSortOrder(tripId);
    let sortOrder = (maxOrder !== null ? maxOrder : -1) + 1;

    const created: any[] = [];

    await this.uow.transactional(async () => {
      for (const item of items) {
        if (!item.name?.trim()) continue;
        const checked = item.checked ? 1 : 0;
        const weight = item.weight_grams ? Number.parseInt(String(item.weight_grams)) || null : null;

        const bagId = await this.bagIdByName(tripId, item.bag);

        const qty = Math.max(1, Math.min(999, Number(item.quantity) || 1));
        const newId = await this.itemsRepo.insertItem({
          trip_id: tripId,
          name: item.name.trim(),
          checked,
          category: item.category?.trim() || 'Other',
          sort_order: sortOrder++,
          quantity: qty,
          weight_grams: weight,
          bag_id: bagId,
          is_private: item.is_private ? 1 : 0,
          owner_id: ownerId ?? null,
        });
        created.push(await this.itemsRepo.findById(newId));
      }
    });

    return created;
  }

  // ── Bags ───────────────────────────────────────────────────────────────────

  /**
   * What each bag actually weighs (#2191).
   *
   * Every weight TREK showed used to be a client-side sum over `listItems`,
   * which is privacy-filtered — so a bag's "total" silently omitted the private
   * items of every other member, and no one but their owner could ever see the
   * real figure. That number is then measured against `weight_limit_grams`, an
   * absolute airline limit, which makes a per-viewer subtotal not merely
   * incomplete but wrong: a shared bag could sit over its limit and warn nobody.
   *
   * So the sum is computed here, over EVERY row, and only integers cross the
   * wire. A member learns that a bag is heavier than the items they can see —
   * never a name, category, quantity or owner. That is a deliberate, bounded
   * disclosure and the point of the issue. `PackingItemsRepository.bagWeightTotals`
   * is a genuinely separate, unfiltered aggregate — never built on the
   * visibility-filtered reads (§17 surprise 10).
   *
   * Keyed by bag id, with the unassigned pile under `null` — the same shape the
   * "no bag" row on every packing surface needs.
   */
  private async bagWeightTotals(tripId: string | number): Promise<Map<number | null, number>> {
    const rows = await this.itemsRepo.bagWeightTotals(tripId);
    return new Map(rows.map(r => [r.bag_id, r.total ?? 0]));
  }

  /** The weight of everything in the trip that is in no bag (#2191). */
  async unassignedWeightGrams(tripId: string | number): Promise<number> {
    return (await this.bagWeightTotals(tripId)).get(null) ?? 0;
  }

  /**
   * The bags plus the unassigned pile, from ONE pass over the aggregate.
   *
   * The REST list route wants both, and the WS ping (#2191) makes that route
   * fire on every item write for every connected client — running the same
   * SUM…GROUP BY twice per request is not a cost worth paying for a nicer
   * method list.
   */
  async listBagsWithWeights(tripId: string | number): Promise<{ bags: unknown[]; unassigned_weight_grams: number }> {
    const totals = await this.bagWeightTotals(tripId);
    return { bags: await this.decorateBags(tripId, totals), unassigned_weight_grams: totals.get(null) ?? 0 };
  }

  async listBags(tripId: string | number) {
    return await this.decorateBags(tripId, await this.bagWeightTotals(tripId));
  }

  private async decorateBags(tripId: string | number, totals: Map<number | null, number>) {
    const bags = await this.bagsRepo.listForTrip(tripId);
    const members = await this.bagsRepo.listMembersForTrip(tripId);
    const membersByBag = new Map<number, PackingBagMemberForTripRow[]>();
    for (const m of members) {
      if (!membersByBag.has(m.bag_id)) membersByBag.set(m.bag_id, []);
      membersByBag.get(m.bag_id)!.push(m);
    }
    return bags.map(b => ({
      ...b,
      members: (membersByBag.get(b.id) || []).map(m => ({ ...m, avatar: avatarUrl(m) })),
      total_weight_grams: totals.get(b.id) ?? 0,
    }));
  }

  /**
   * Owner + collaborators of a trip, guests included — the only user ids
   * assignable anywhere on it, not just to a bag. The wording used to say
   * "assigned to a bag", which is why the category and recipient writes below
   * grew up without it.
   */
  private async tripRosterIds(tripId: string | number): Promise<Set<number>> {
    // Plan 4 Task 3/4: `DatabaseService.rosterUserIds` inlined onto
    // `TripMembersRepository.rosterUserIds`.
    return await this.tripMembersRepo.rosterUserIds(tripId);
  }

  /** `bagId: number` (Plan 4 Task 8b, U6 — the program's gate-level id parsing carry: `PackingController.setBagMembers` parses `:bagId` once via `toRowId`; `packing.mcp.ts`'s Zod-typed `bagId`/`packing.rpc.ts`'s `num()`-derived `bagId` were already numbers). */
  async setBagMembers(tripId: string | number, bagId: number, userIds: number[]) {
    const bag = await this.bagsRepo.findInTrip(bagId, tripId);
    if (!bag) return null;
    await this.uow.transactional(async () => {
      await this.bagsRepo.deleteMembersForBag(bagId);
      // Only real trip members may be bag members — never write an arbitrary account id.
      const roster = await this.tripRosterIds(tripId);
      const members = userIds.filter(uid => roster.has(uid));
      await this.bagsRepo.insertMembersIgnore(bagId, members);
    });
    const rows = await this.bagsRepo.listMembersWithUserForBag(bagId);
    return rows.map(m => ({ ...m, avatar: avatarUrl(m) }));
  }

  async createBag(tripId: string | number, data: { name: string; color?: string; weight_limit_grams?: number | null }) {
    const maxOrder = await this.bagsRepo.maxSortOrder(tripId);
    const newId = await this.bagsRepo.insertBag({
      trip_id: tripId,
      name: data.name.trim(),
      color: data.color || '#6366f1',
      sort_order: (maxOrder ?? -1) + 1,
      weight_limit_grams: data.weight_limit_grams ?? null,
    });
    return await this.bagsRepo.findById(newId);
  }

  /** `bagId: number` — same Plan 4 Task 8b (U6) narrowing as {@link setBagMembers} (`PackingController.updateBag`). */
  async updateBag(
    tripId: string | number,
    bagId: number,
    data: { name?: string; color?: string; weight_limit_grams?: number | null; user_id?: number | null },
    bodyKeys?: string[]
  ) {
    const bag = await this.bagsRepo.findInTrip(bagId, tripId);
    if (!bag) return null;

    // A bag may only be assigned to a real trip member; an off-roster id becomes unassigned.
    const assignUser = data.user_id != null && (await this.tripRosterIds(tripId)).has(data.user_id) ? data.user_id : null;
    // weight_limit_grams follows the bodyKeys presence protocol like user_id:
    // an omitted key leaves the limit unchanged, an explicit null clears it.
    await this.bagsRepo.update(bagId, {
      name: [!!data.name?.trim(), data.name?.trim() || null],
      color: [!!data.color, data.color || null],
      weight_limit_grams: [!!bodyKeys?.includes('weight_limit_grams'), data.weight_limit_grams ?? null],
      user_id: [!!bodyKeys?.includes('user_id'), assignUser],
    });
    return await this.bagsRepo.findWithAssignee(bagId);
  }

  /** `bagId: number` — same Plan 4 Task 8b (U6) narrowing as {@link setBagMembers} (`PackingController.deleteBag`). */
  async deleteBag(tripId: string | number, bagId: number): Promise<boolean> {
    const bag = await this.bagsRepo.findInTrip(bagId, tripId);
    if (!bag) return false;

    await this.bagsRepo.delete(bagId);
    return true;
  }

  // ── List Templates ─────────────────────────────────────────────────────────

  /**
   * Read-only template list for trip members (name + item count), so non-admins
   * can pick a template to apply. Management (create/edit/delete) stays admin-only
   * under /api/admin/packing-templates.
   */
  async listTemplates() {
    return await this.templatesRepo.listWithItemCount();
  }

  // ── Apply Template ─────────────────────────────────────────────────────────

  /** `templateId: number` (Plan 4 Task 8b, U6 — the program's gate-level id parsing carry: `PackingController.applyTemplate` parses `:templateId` once via `toRowId`; `packing.mcp.ts`'s Zod-typed `templateId` was already a number). */
  async applyTemplate(
    tripId: string | number,
    templateId: number,
    visibility: 'common' | 'personal' = 'common',
    ownerId?: number,
  ) {
    const templateItems = await this.templateItemsRepo.listForApply(templateId);

    if (templateItems.length === 0) return null;

    const maxOrder = await this.itemsRepo.maxSortOrder(tripId);
    let sortOrder = (maxOrder !== null ? maxOrder : -1) + 1;
    const isPrivate = ownerId != null ? this.visibilityToPrivate(visibility) : 0;
    const owner = isPrivate ? ownerId! : null;

    const added: any[] = [];
    await this.uow.transactional(async () => {
      for (const ti of templateItems) {
        // Weight, count and bag ride along since #1131; a bag the trip lacks is
        // created, the way the import does it.
        const bagId = await this.bagIdByName(tripId, ti.bag_name);
        const newId = await this.itemsRepo.insertFromTemplate({
          trip_id: tripId, name: ti.name, category: ti.category, sort_order: sortOrder++, is_private: isPrivate, owner_id: owner,
          weight_grams: ti.weight_grams ?? null, quantity: Math.max(1, ti.quantity), bag_id: bagId,
        });
        added.push(await this.itemsRepo.findById(newId));
      }
    });

    return added;
  }

  // ── Save as Template ──────────────────────────────────────────────────────

  async saveAsTemplate(tripId: string | number, userId: number, templateName: string) {
    // A template is a durable, shareable artifact, so it may only capture what is
    // the actor's to publish: the Common list plus their own items. It used to
    // take every row in the trip, restricted ones included.
    const items = await this.itemsRepo.listExportable(tripId, userId);

    if (items.length === 0) return null;

    const categories = [...new Set(items.map(i => i.category || 'Other'))];

    const templateId = await this.uow.transactional(async () => {
      const id = await this.templatesRepo.insertTemplate(templateName, userId);

      const catIdMap = new Map<string, number>();
      for (let i = 0; i < categories.length; i++) {
        const catId = await this.templateCategoriesRepo.insertCategory(id, categories[i], i);
        catIdMap.set(categories[i], catId);
      }

      const itemsByCategory = new Map<string, number>();
      for (const item of items) {
        const catId = catIdMap.get(item.category || 'Other')!;
        const order = itemsByCategory.get(item.category || 'Other') || 0;
        await this.templateItemsRepo.insertTemplateItem({
          category_id: catId, name: item.name, sort_order: order,
          weight_grams: item.weight_grams ?? null, quantity: Math.max(1, item.quantity), bag_name: item.bag_name ?? null,
        });
        itemsByCategory.set(item.category || 'Other', order + 1);
      }
      return id;
    });

    return { id: Number(templateId), name: templateName, categoryCount: categories.length, itemCount: items.length };
  }

  // ── Category Assignees ─────────────────────────────────────────────────────

  async getCategoryAssignees(tripId: string | number) {
    const rows = await this.categoryAssigneesRepo.listForTrip(tripId);

    // Group by category
    const assignees: Record<string, { user_id: number; username: string; avatar: string | null }[]> = {};
    for (const row of rows) {
      if (!assignees[row.category_name]) assignees[row.category_name] = [];
      assignees[row.category_name].push({ user_id: row.user_id, username: row.username, avatar: avatarUrl(row) });
    }

    return assignees;
  }

  async updateCategoryAssignees(tripId: string | number, categoryName: string, userIds: number[] | undefined) {
    await this.uow.transactional(async () => {
      await this.categoryAssigneesRepo.deleteForCategory(tripId, categoryName);

      if (Array.isArray(userIds) && userIds.length > 0) {
        // Same rule as setBagMembers: only people on this trip may be assigned.
        const roster = await this.tripRosterIds(tripId);
        const scoped = userIds.filter(uid => roster.has(uid));
        await this.categoryAssigneesRepo.insertIgnore(tripId, categoryName, scoped);
      }
    });

    const updated = await this.categoryAssigneesRepo.listForCategory(tripId, categoryName);
    return updated.map(m => ({ ...m, avatar: avatarUrl(m) }));
  }

  // ── Reorder ────────────────────────────────────────────────────────────────

  async reorderItems(tripId: string | number, orderedIds: number[]): Promise<void> {
    await this.uow.transactional(async () => {
      for (const [index, id] of orderedIds.entries()) {
        await this.itemsRepo.setSortOrder(id, tripId, index);
      }
    });
  }

  // ── Admin Template CRUD ────────────────────────────────────────────────────
  // Relocated byte-identically from services/adminService.ts with the 2026-08
  // admin fold. These back the admin-only /api/admin/packing-templates routes
  // (AdminService delegates here) and the delete_packing_template MCP tool.
  // They live in this service because it already owns all three template
  // tables — saveAsTemplate above writes packing_templates,
  // packing_template_categories and packing_template_items. Note the
  // deliberate name split: listTemplates() above is the trip-member read;
  // listPackingTemplates() below is the richer admin listing.
  // Legacy quirks preserved on purpose: the `data.name?.trim()` truthiness
  // guards (a blank name is a silent no-op, not a 400), the post-insert
  // re-selects instead of RETURNING, `(max ?? -1) + 1` sort ordering, the
  // exact error strings. The item routes originally ignored their :templateId
  // path param entirely; since the 2026-08 quirk fix they scope through
  // packing_template_categories like the sibling category routes do.

  async listPackingTemplates() {
    return await this.templatesRepo.listAdmin();
  }

  async getPackingTemplate(id: string) {
    const template = await this.templatesRepo.findById(id);
    if (!template) return { error: 'Template not found', status: 404 };
    const categories = await this.templateCategoriesRepo.listForTemplate(id);
    const items = await this.templateItemsRepo.listForTemplate(id);
    return { template, categories, items };
  }

  async createPackingTemplate(name: string, createdBy: number) {
    if (!name?.trim()) return { error: 'Name is required', status: 400 };
    const newId = await this.templatesRepo.insertTemplate(name.trim(), createdBy);
    const template = await this.templatesRepo.findById(newId);
    return { template };
  }

  async updatePackingTemplate(id: string, data: { name?: string }) {
    const template = await this.templatesRepo.findById(id);
    if (!template) return { error: 'Template not found', status: 404 };
    if (data.name?.trim()) await this.templatesRepo.updateName(id, data.name.trim());
    return { template: await this.templatesRepo.findById(id) };
  }

  async deletePackingTemplate(id: string) {
    const template = await this.templatesRepo.findById(id);
    if (!template) return { error: 'Template not found', status: 404 };
    await this.templatesRepo.delete(id);
    return { name: template.name };
  }

  // Template categories

  async createTemplateCategory(templateId: string, name: string) {
    if (!name?.trim()) return { error: 'Category name is required', status: 400 };
    const template = await this.templatesRepo.findById(templateId);
    if (!template) return { error: 'Template not found', status: 404 };
    const maxOrder = await this.templateCategoriesRepo.maxSortOrder(templateId);
    const newId = await this.templateCategoriesRepo.insertCategory(templateId, name.trim(), (maxOrder ?? -1) + 1);
    return { category: await this.templateCategoriesRepo.findById(newId) };
  }

  async updateTemplateCategory(templateId: string, catId: string, data: { name?: string }) {
    const cat = await this.templateCategoriesRepo.findInTemplate(catId, templateId);
    if (!cat) return { error: 'Category not found', status: 404 };
    if (data.name?.trim())
      await this.templateCategoriesRepo.updateName(catId, data.name.trim());
    return { category: await this.templateCategoriesRepo.findById(catId) };
  }

  async deleteTemplateCategory(templateId: string, catId: string) {
    const cat = await this.templateCategoriesRepo.findInTemplate(catId, templateId);
    if (!cat) return { error: 'Category not found', status: 404 };
    await this.templateCategoriesRepo.delete(catId);
    return {};
  }

  // Template items

  async createTemplateItem(templateId: string, catId: string, name: string) {
    if (!name?.trim()) return { error: 'Item name is required', status: 400 };
    const cat = await this.templateCategoriesRepo.findInTemplate(catId, templateId);
    if (!cat) return { error: 'Category not found', status: 404 };
    const maxOrder = await this.templateItemsRepo.maxSortOrder(catId);
    const newId = await this.templateItemsRepo.insertTemplateItem({ category_id: catId, name: name.trim(), sort_order: (maxOrder ?? -1) + 1 });
    return { item: await this.templateItemsRepo.findById(newId) };
  }

  async updateTemplateItem(templateId: string, itemId: string, data: { name?: string }) {
    const item = await this.templateItemsRepo.findScoped(itemId, templateId);
    if (!item) return { error: 'Item not found', status: 404 };
    if (data.name?.trim())
      await this.templateItemsRepo.updateName(itemId, data.name.trim());
    return { item: await this.templateItemsRepo.findById(itemId) };
  }

  async deleteTemplateItem(templateId: string, itemId: string) {
    const item = await this.templateItemsRepo.findScoped(itemId, templateId);
    if (!item) return { error: 'Item not found', status: 404 };
    await this.templateItemsRepo.delete(itemId);
    return {};
  }

  /** Fire-and-forget tag notification, mirroring the legacy dynamic import. */
  async notifyTagged(tripId: string, actor: User, category: string, userIds: unknown): Promise<void> {
    if (!Array.isArray(userIds) || userIds.length === 0) return;
    // Injected, not a lazy import of the old notifications bridge. The laziness bought
    // nothing the module graph does not already give — NotificationsModule
    // reaches nothing in this direction — and it hid the edge while handing the
    // send a second NotificationsService built outside the container.
    const tripTitle = await this.tripsRepo.getTitle(tripId);
    this.notifications.send({
      event: 'packing_tagged',
      actorId: actor.id,
      scope: 'trip',
      targetId: Number(tripId),
      params: { trip: tripTitle || 'Untitled', actor: actor.email, category, tripId: String(tripId) },
    }).catch(() => {});
  }
}
