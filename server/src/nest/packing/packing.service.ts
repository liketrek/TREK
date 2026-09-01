import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import { avatarUrl } from '../common/avatarUrl';
import type { UpdateConflict } from '../common/conflictResult';
import type { User } from '../../types';
import { DatabaseService, type TripAccess } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';

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
 * Packing domain service — owns the packing SQL (moved from the legacy
 * services/packingService.ts: the bodyKeys sentinel protocol on the updates,
 * the #858 three-tier sharing model and the post-write re-selects). Trip
 * access, the 'packing_edit' permission and the WebSocket broadcast keep their
 * legacy call paths. Post-migration fixes over the legacy code: a single
 * 'Other' category default, bodyKeys-gated weight_limit_grams (explicit null
 * clears it), and transactions around every multi-statement write. The
 * remaining non-Nest consumer went with the legacy MCP prompts registrar, and
 * packing.bridge.ts was deleted with it.
 */
@Injectable()
export class PackingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  verifyTripAccess(tripId: string | number, userId: number) {
    return this.db.canAccessTrip(tripId, userId);
  }

  /** Mirrors the inline checkPermission('packing_edit', ...) the legacy route runs. */
  canEdit(trip: Trip, user: User): boolean {
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
  private enrichItems(items: any[]): any[] {
    if (items.length === 0) return items;
    const ids = items.map(i => i.id);
    const placeholders = ids.map(() => '?').join(',');

    const owners = this.db.all<{ id: number; username: string }>(`SELECT id, username FROM users WHERE id IN (SELECT owner_id FROM packing_items WHERE id IN (${placeholders}))`, ...ids);
    const ownerName = new Map(owners.map(o => [o.id, o.username]));

    const recipientRows = this.db.all<{ item_id: number; user_id: number; username: string }>(`
    SELECT r.item_id, r.user_id, COALESCE(u.display_name, u.username) AS username
    FROM packing_item_recipients r JOIN users u ON u.id = r.user_id
    WHERE r.item_id IN (${placeholders})
  `, ...ids);
    const recipientsByItem = new Map<number, { user_id: number; username: string }[]>();
    for (const r of recipientRows) {
      if (!recipientsByItem.has(r.item_id)) recipientsByItem.set(r.item_id, []);
      recipientsByItem.get(r.item_id)!.push({ user_id: r.user_id, username: r.username });
    }

    const contributorRows = this.db.all<{ item_id: number; user_id: number; status: string; username: string }>(`
    SELECT c.item_id, c.user_id, c.status, COALESCE(u.display_name, u.username) AS username
    FROM packing_item_contributors c JOIN users u ON u.id = c.user_id
    WHERE c.item_id IN (${placeholders})
  `, ...ids);
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

  listItems(tripId: string | number, userId?: number) {
    // Three-tier visibility (#858): Common (is_private=0) is visible to everyone;
    // Personal/Shared (is_private=1) only to the owner (bringer) and the recipients
    // it was explicitly shared with. Without a userId the unfiltered list is
    // returned — every current caller (trip summary, offline bundle, prompts,
    // resources, plugin host) passes the viewer; omit it only for genuinely
    // viewer-less internal reads.
    let rows: any[];
    if (userId == null) {
      rows = this.db.all(
        'SELECT * FROM packing_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC',
        tripId
      );
    } else {
      rows = this.db.all(`
      SELECT * FROM packing_items
      WHERE trip_id = ?
        AND (is_private = 0
             OR owner_id = ?
             OR EXISTS (SELECT 1 FROM packing_item_recipients r WHERE r.item_id = packing_items.id AND r.user_id = ?))
      ORDER BY sort_order ASC, created_at ASC
    `, tripId, userId, userId);
    }
    return this.enrichItems(rows);
  }

  /** Reads an item's current privacy fields (#858) before an update, so the
   *  controller can detect a public↔private transition and route the broadcast. */
  getItemPrivacy(tripId: string | number, id: string | number): PrivacyFields | undefined {
    return this.db.get<PrivacyFields>('SELECT is_private, owner_id FROM packing_items WHERE id = ? AND trip_id = ?', id, tripId);
  }

  /** Maps the three-tier visibility (#858) onto the stored is_private flag. */
  private visibilityToPrivate(visibility?: PackingVisibility, isPrivateFallback?: boolean): number {
    if (visibility) return visibility === 'common' ? 0 : 1;
    return isPrivateFallback ? 1 : 0;
  }

  createItem(
    tripId: string | number,
    data: { name: string; category?: string; checked?: boolean; quantity?: number; weight_grams?: number | null; bag_id?: number | null; is_private?: boolean; visibility?: PackingVisibility; recipient_ids?: number[] },
    ownerId?: number,
  ) {
    if (data.bag_id != null && !this.bagInTrip(tripId, data.bag_id)) return { invalidBag: true } as const;
    const maxOrder = this.db.get<{ max: number | null }>('SELECT MAX(sort_order) as max FROM packing_items WHERE trip_id = ?', tripId)!;
    const sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;
    const qty = Math.max(1, Math.min(999, Number(data.quantity) || 1));
    const isPrivate = this.visibilityToPrivate(data.visibility, data.is_private);

    const itemId = this.db.transaction(() => {
      const result = this.db.run(
        'INSERT INTO packing_items (trip_id, name, checked, category, sort_order, quantity, weight_grams, bag_id, is_private, owner_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        tripId, data.name, data.checked ? 1 : 0, data.category || 'Other', sortOrder, qty, data.weight_grams ?? null, data.bag_id ?? null, isPrivate, ownerId ?? null
      );
      const id = Number(result.lastInsertRowid);
      // "Shared with specific people" — record the recipients it covers.
      if (data.visibility === 'shared' && Array.isArray(data.recipient_ids)) {
        const ins = this.db.prepare('INSERT OR IGNORE INTO packing_item_recipients (item_id, user_id) VALUES (?, ?)');
        const roster = this.tripRosterIds(tripId);
        for (const uid of data.recipient_ids) if (uid !== ownerId && roster.has(uid)) ins.run(id, uid);
      }
      return id;
    });

    return this.enrichItems([this.db.get('SELECT * FROM packing_items WHERE id = ?', itemId)])[0];
  }

  updateItem(
    tripId: string | number,
    id: string | number,
    data: { name?: string; checked?: number; category?: string; weight_grams?: number | null; bag_id?: number | null; quantity?: number; is_private?: boolean },
    bodyKeys: string[],
    ifMatch?: string,
    actingUserId?: number,
  ): unknown | UpdateConflict | null {
    // Was a trip-scoped lookup, which let any member with packing_edit write to
    // another member's restricted item (and read it back off the response).
    const item = this.getItemInTrip(tripId, id, actingUserId);
    if (!item) return null;

    // Optimistic concurrency (#1135): reject a stale offline overwrite. Absent
    // token => unconditional update (back-compat with older clients).
    if (ifMatch !== undefined && item.updated_at != null && String(item.updated_at) !== ifMatch) {
      return { conflict: true, server: this.db.get('SELECT * FROM packing_items WHERE id = ?', id) };
    }

    // A non-null bag about to be bound must belong to this trip (#2154) — the
    // FK alone let any member point an item at another trip's bag.
    if (bodyKeys.includes('bag_id') && data.bag_id != null && !this.bagInTrip(tripId, data.bag_id)) {
      return { invalidBag: true } as const;
    }

    // Privatizing an unowned (legacy) item stamps the acting user as its owner so
    // the visibility filter still has someone to match (#858).
    const claimOwner = bodyKeys.includes('is_private') && !!data.is_private && item.owner_id == null && actingUserId != null;

    this.db.run(`
    UPDATE packing_items SET
      name = COALESCE(?, name),
      checked = CASE WHEN ? IS NOT NULL THEN ? ELSE checked END,
      category = COALESCE(?, category),
      weight_grams = CASE WHEN ? THEN ? ELSE weight_grams END,
      bag_id = CASE WHEN ? THEN ? ELSE bag_id END,
      quantity = CASE WHEN ? THEN ? ELSE quantity END,
      is_private = CASE WHEN ? THEN ? ELSE is_private END,
      owner_id = CASE WHEN ? THEN ? ELSE owner_id END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
      data.name || null,
      data.checked !== undefined ? 1 : null,
      data.checked ? 1 : 0,
      data.category || null,
      bodyKeys.includes('weight_grams') ? 1 : 0,
      data.weight_grams ?? null,
      bodyKeys.includes('bag_id') ? 1 : 0,
      data.bag_id ?? null,
      bodyKeys.includes('quantity') ? 1 : 0,
      Math.max(1, Math.min(999, Number(data.quantity) || 1)),
      bodyKeys.includes('is_private') ? 1 : 0,
      data.is_private ? 1 : 0,
      claimOwner ? 1 : 0,
      actingUserId ?? null,
      id
    );

    return this.enrichItems([this.db.get('SELECT * FROM packing_items WHERE id = ?', id)])[0];
  }

  // ── Three-tier sharing (#858): recipients, contributors, clone ───────────────

  /**
   * The one visibility rule (#858), as a SQL fragment: Common belongs to the whole
   * trip, a restricted item belongs to its owner and to the people it was shared
   * with. Binds the actor id twice.
   */
  private static readonly VISIBLE_TO_ACTOR = `(
    is_private = 0
    OR owner_id = ?
    OR EXISTS (SELECT 1 FROM packing_item_recipients r WHERE r.item_id = packing_items.id AND r.user_id = ?)
  )`;

  /**
   * Loads an item scoped to its trip AND to what the actor may see.
   *
   * Trip membership used to be the whole check here, so any member holding
   * packing_edit could reach another member's Personal or Shared item by id
   * through update, delete, clone or the contributor routes. It resolves through
   * the visibility rule now, and an item the actor may not see comes back
   * undefined — deliberately indistinguishable from one that does not exist, so
   * these routes cannot be used to probe for ids. A missing actor denies too,
   * rather than falling through unfiltered.
   */
  private getItemInTrip(tripId: string | number, id: string | number, actorId: number | undefined) {
    if (actorId == null) return undefined;
    return this.db.get<{ id: number; owner_id: number | null; is_private: number; name: string; category: string | null; quantity: number; weight_grams: number | null; bag_id: number | null; updated_at?: string | null }>(
      `SELECT * FROM packing_items WHERE id = ? AND trip_id = ? AND ${PackingService.VISIBLE_TO_ACTOR}`,
      id, tripId, actorId, actorId,
    );
  }

  /**
   * Re-set who a "shared with specific people" item covers, and its visibility tier.
   * Only the owner (bringer) may change this; a non-owner caller is rejected with null.
   */
  setItemSharing(
    tripId: string | number,
    id: string | number,
    actingUserId: number,
    visibility: PackingVisibility,
    recipientIds: number[],
  ) {
    const item = this.getItemInTrip(tripId, id, actingUserId);
    if (!item) return null;
    // The owner controls sharing; an unowned legacy item is claimed by the actor.
    if (item.owner_id != null && item.owner_id !== actingUserId) return { forbidden: true as const };

    this.db.transaction(() => {
      this.db.run('UPDATE packing_items SET is_private = ?, owner_id = COALESCE(owner_id, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        this.visibilityToPrivate(visibility), actingUserId, id);
      this.db.run('DELETE FROM packing_item_recipients WHERE item_id = ?', id);
      if (visibility === 'shared') {
        const ins = this.db.prepare('INSERT OR IGNORE INTO packing_item_recipients (item_id, user_id) VALUES (?, ?)');
        const owner = item.owner_id ?? actingUserId;
        const roster = this.tripRosterIds(tripId);
        for (const uid of recipientIds) if (uid !== owner && roster.has(uid)) ins.run(id, uid);
      }
      // Leaving the Common tier drops any co-contributors (they only apply to Common).
      if (visibility !== 'common') this.db.run('DELETE FROM packing_item_contributors WHERE item_id = ?', id);
    });
    return this.enrichItems([this.db.get('SELECT * FROM packing_items WHERE id = ?', id)])[0];
  }

  /** "I can bring that too" — adds the user as a co-contributor on a Common item. */
  addContributor(tripId: string | number, id: string | number, userId: number) {
    const item = this.getItemInTrip(tripId, id, userId);
    if (!item || item.is_private !== 0) return null; // co-contribution is a Common-list concept
    if (item.owner_id === userId) return null; // the bringer is already covering it
    this.db.run("INSERT OR IGNORE INTO packing_item_contributors (item_id, user_id, status) VALUES (?, ?, 'accepted')", id, userId);
    return this.enrichItems([this.db.get('SELECT * FROM packing_items WHERE id = ?', id)])[0];
  }

  removeContributor(tripId: string | number, id: string | number, userId: number) {
    const item = this.getItemInTrip(tripId, id, userId);
    if (!item) return null;
    this.db.run('DELETE FROM packing_item_contributors WHERE item_id = ? AND user_id = ?', id, userId);
    return this.enrichItems([this.db.get('SELECT * FROM packing_items WHERE id = ?', id)])[0];
  }

  /** True when the bag exists AND belongs to the trip — the referenced-id rule
   *  the FK cannot enforce (it only checks existence). */
  private bagInTrip(tripId: string | number, bagId: number): boolean {
    return !!this.db.get('SELECT id FROM packing_bags WHERE id = ? AND trip_id = ?', bagId, tripId);
  }

  /**
   * A copy keeps the original's bag only when that bag is the caller's to pack: one nobody
   * owns, or one they belong to. Inheriting someone else's bag would drop the copy into
   * their luggage and inflate their weight (#207).
   */
  private bagForCloner(tripId: string | number, bagId: number | null, userId: number): number | null {
    if (bagId == null) return null;
    const bag = this.db.get<{ user_id: number | null }>('SELECT user_id FROM packing_bags WHERE id = ? AND trip_id = ?', bagId, tripId);
    if (!bag) return null;
    if (bag.user_id === userId) return bagId;
    const members = this.db.all<{ user_id: number }>('SELECT user_id FROM packing_bag_members WHERE bag_id = ?', bagId);
    if (bag.user_id == null && members.length === 0) return bagId; // shared bag, nobody's in particular
    return members.some(m => m.user_id === userId) ? bagId : null;
  }

  /**
   * Clone a (Common) item onto the caller's Personal list as a private starting point.
   * Weight comes along — it is a property of the thing, and re-entering it by hand for
   * every traveller was the whole complaint in #207.
   */
  cloneItem(tripId: string | number, id: string | number, userId: number) {
    const item = this.getItemInTrip(tripId, id, userId);
    if (!item) return null;
    return this.createItem(tripId, {
      name: item.name,
      category: item.category || undefined,
      quantity: item.quantity,
      weight_grams: item.weight_grams,
      bag_id: this.bagForCloner(tripId, item.bag_id, userId),
      visibility: 'personal',
    }, userId);
  }

  deleteItem(tripId: string | number, id: string | number, actingUserId?: number) {
    // Return the deleted row (not just a boolean) so callers can target the
    // delete broadcast at the owner when the item was private (#858).
    // Scoped to what the actor may see: trip membership alone used to be enough
    // to delete another member's restricted item.
    const item = this.getItemInTrip(tripId, id, actingUserId);
    if (!item) return null;

    this.db.run('DELETE FROM packing_items WHERE id = ?', id);
    return item;
  }

  // ── Bulk Import ────────────────────────────────────────────────────────────

  bulkImport(tripId: string | number, items: ImportItem[], ownerId?: number) {
    const maxOrder = this.db.get<{ max: number | null }>('SELECT MAX(sort_order) as max FROM packing_items WHERE trip_id = ?', tripId)!;
    let sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;

    const stmt = this.db.prepare('INSERT INTO packing_items (trip_id, name, checked, category, weight_grams, bag_id, sort_order, quantity, is_private, owner_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
    const created: any[] = [];

    this.db.transaction(() => {
      for (const item of items) {
        if (!item.name?.trim()) continue;
        const checked = item.checked ? 1 : 0;
        const weight = item.weight_grams ? Number.parseInt(String(item.weight_grams)) || null : null;

        // Resolve bag by name if provided
        let bagId = null;
        if (item.bag?.trim()) {
          const bagName = item.bag.trim();
          const existing = this.db.get<{ id: number }>('SELECT id FROM packing_bags WHERE trip_id = ? AND name = ?', tripId, bagName);
          if (existing) {
            bagId = existing.id;
          } else {
            const bagCount = this.db.get<{ c: number }>('SELECT COUNT(*) as c FROM packing_bags WHERE trip_id = ?', tripId)!.c;
            const newBag = this.db.run('INSERT INTO packing_bags (trip_id, name, color) VALUES (?, ?, ?)', tripId, bagName, BAG_COLORS[bagCount % BAG_COLORS.length]);
            bagId = newBag.lastInsertRowid;
          }
        }

        const qty = Math.max(1, Math.min(999, Number(item.quantity) || 1));
        const result = stmt.run(tripId, item.name.trim(), checked, item.category?.trim() || 'Other', weight, bagId, sortOrder++, qty, item.is_private ? 1 : 0, ownerId ?? null);
        created.push(this.db.get('SELECT * FROM packing_items WHERE id = ?', result.lastInsertRowid));
      }
    });

    return created;
  }

  // ── Bags ───────────────────────────────────────────────────────────────────

  listBags(tripId: string | number) {
    const bags = this.db.all<any>('SELECT * FROM packing_bags WHERE trip_id = ? ORDER BY sort_order, id', tripId);
    const members = this.db.all<{ bag_id: number; user_id: number; username: string; avatar: string | null }>(`
    SELECT bm.bag_id, bm.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM packing_bag_members bm
    JOIN users u ON bm.user_id = u.id
    JOIN packing_bags b ON bm.bag_id = b.id
    WHERE b.trip_id = ?
  `, tripId);
    const membersByBag = new Map<number, typeof members>();
    for (const m of members) {
      if (!membersByBag.has(m.bag_id)) membersByBag.set(m.bag_id, []);
      membersByBag.get(m.bag_id)!.push(m);
    }
    return bags.map(b => ({
      ...b,
      members: (membersByBag.get(b.id) || []).map(m => ({ ...m, avatar: avatarUrl(m) })),
    }));
  }

  /**
   * Owner + collaborators of a trip, guests included — the only user ids
   * assignable anywhere on it, not just to a bag. The wording used to say
   * "assigned to a bag", which is why the category and recipient writes below
   * grew up without it.
   */
  private tripRosterIds(tripId: string | number): Set<number> {
    return this.db.rosterUserIds(tripId);
  }

  setBagMembers(tripId: string | number, bagId: string | number, userIds: number[]) {
    const bag = this.db.get('SELECT * FROM packing_bags WHERE id = ? AND trip_id = ?', bagId, tripId);
    if (!bag) return null;
    this.db.transaction(() => {
      this.db.run('DELETE FROM packing_bag_members WHERE bag_id = ?', bagId);
      const ins = this.db.prepare('INSERT OR IGNORE INTO packing_bag_members (bag_id, user_id) VALUES (?, ?)');
      // Only real trip members may be bag members — never write an arbitrary account id.
      const roster = this.tripRosterIds(tripId);
      for (const uid of userIds) if (roster.has(uid)) ins.run(bagId, uid);
    });
    const rows = this.db.all<{ user_id: number; username: string; avatar: string | null }>(`
    SELECT bm.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM packing_bag_members bm JOIN users u ON bm.user_id = u.id
    WHERE bm.bag_id = ?
  `, bagId);
    return rows.map(m => ({ ...m, avatar: avatarUrl(m) }));
  }

  createBag(tripId: string | number, data: { name: string; color?: string; weight_limit_grams?: number | null }) {
    const maxOrder = this.db.get<{ max: number | null }>('SELECT MAX(sort_order) as max FROM packing_bags WHERE trip_id = ?', tripId)!;
    const result = this.db.run('INSERT INTO packing_bags (trip_id, name, color, sort_order, weight_limit_grams) VALUES (?, ?, ?, ?, ?)',
      tripId, data.name.trim(), data.color || '#6366f1', (maxOrder.max ?? -1) + 1, data.weight_limit_grams ?? null
    );
    return this.db.get('SELECT * FROM packing_bags WHERE id = ?', result.lastInsertRowid);
  }

  updateBag(
    tripId: string | number,
    bagId: string | number,
    data: { name?: string; color?: string; weight_limit_grams?: number | null; user_id?: number | null },
    bodyKeys?: string[]
  ) {
    const bag = this.db.get('SELECT * FROM packing_bags WHERE id = ? AND trip_id = ?', bagId, tripId);
    if (!bag) return null;

    // A bag may only be assigned to a real trip member; an off-roster id becomes unassigned.
    const assignUser = data.user_id != null && this.tripRosterIds(tripId).has(data.user_id) ? data.user_id : null;
    // weight_limit_grams follows the bodyKeys presence protocol like user_id:
    // an omitted key leaves the limit unchanged, an explicit null clears it.
    this.db.run(`UPDATE packing_bags SET
    name = COALESCE(?, name),
    color = COALESCE(?, color),
    weight_limit_grams = CASE WHEN ? THEN ? ELSE weight_limit_grams END,
    user_id = CASE WHEN ? THEN ? ELSE user_id END
    WHERE id = ?`,
      data.name?.trim() || null,
      data.color || null,
      bodyKeys?.includes('weight_limit_grams') ? 1 : 0,
      data.weight_limit_grams ?? null,
      bodyKeys?.includes('user_id') ? 1 : 0,
      assignUser,
      bagId
    );
    return this.db.get('SELECT b.*, COALESCE(u.display_name, u.username) as assigned_username FROM packing_bags b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = ?', bagId);
  }

  deleteBag(tripId: string | number, bagId: string | number): boolean {
    const bag = this.db.get('SELECT * FROM packing_bags WHERE id = ? AND trip_id = ?', bagId, tripId);
    if (!bag) return false;

    this.db.run('DELETE FROM packing_bags WHERE id = ?', bagId);
    return true;
  }

  // ── List Templates ─────────────────────────────────────────────────────────

  /**
   * Read-only template list for trip members (name + item count), so non-admins
   * can pick a template to apply. Management (create/edit/delete) stays admin-only
   * under /api/admin/packing-templates.
   */
  listTemplates() {
    return this.db.all<{ id: number; name: string; item_count: number }>(`
    SELECT pt.id, pt.name,
      (SELECT COUNT(*) FROM packing_template_items ti JOIN packing_template_categories tc ON ti.category_id = tc.id WHERE tc.template_id = pt.id) as item_count
    FROM packing_templates pt
    ORDER BY pt.created_at DESC
  `);
  }

  // ── Apply Template ─────────────────────────────────────────────────────────

  applyTemplate(
    tripId: string | number,
    templateId: string | number,
    visibility: 'common' | 'personal' = 'common',
    ownerId?: number,
  ) {
    const templateItems = this.db.all<{ name: string; category: string }>(`
    SELECT ti.name, tc.name as category
    FROM packing_template_items ti
    JOIN packing_template_categories tc ON ti.category_id = tc.id
    WHERE tc.template_id = ?
    ORDER BY tc.sort_order, ti.sort_order
  `, templateId);

    if (templateItems.length === 0) return null;

    const maxOrder = this.db.get<{ max: number | null }>('SELECT MAX(sort_order) as max FROM packing_items WHERE trip_id = ?', tripId)!;
    let sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;
    const isPrivate = ownerId != null ? this.visibilityToPrivate(visibility) : 0;
    const owner = isPrivate ? ownerId! : null;

    const insert = this.db.prepare('INSERT INTO packing_items (trip_id, name, checked, category, sort_order, is_private, owner_id, updated_at) VALUES (?, ?, 0, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
    const added: any[] = [];
    this.db.transaction(() => {
      for (const ti of templateItems) {
        const result = insert.run(tripId, ti.name, ti.category, sortOrder++, isPrivate, owner);
        const item = this.db.get('SELECT * FROM packing_items WHERE id = ?', result.lastInsertRowid);
        added.push(item);
      }
    });

    return added;
  }

  // ── Save as Template ──────────────────────────────────────────────────────

  saveAsTemplate(tripId: string | number, userId: number, templateName: string) {
    // A template is a durable, shareable artifact, so it may only capture what is
    // the actor's to publish: the Common list plus their own items. It used to
    // take every row in the trip, restricted ones included.
    const items = this.db.all<{ name: string; category: string }>(
      'SELECT name, category FROM packing_items WHERE trip_id = ? AND (is_private = 0 OR owner_id = ?) ORDER BY sort_order ASC',
      tripId, userId,
    );

    if (items.length === 0) return null;

    const categories = [...new Set(items.map(i => i.category || 'Other'))];

    const templateId = this.db.transaction(() => {
      const result = this.db.run('INSERT INTO packing_templates (name, created_by) VALUES (?, ?)', templateName, userId);
      const id = result.lastInsertRowid;

      const catIdMap = new Map<string, number | bigint>();
      for (let i = 0; i < categories.length; i++) {
        const catResult = this.db.run('INSERT INTO packing_template_categories (template_id, name, sort_order) VALUES (?, ?, ?)', id, categories[i], i);
        catIdMap.set(categories[i], catResult.lastInsertRowid);
      }

      const itemsByCategory = new Map<string, number>();
      for (const item of items) {
        const catId = catIdMap.get(item.category || 'Other')!;
        const order = itemsByCategory.get(item.category || 'Other') || 0;
        this.db.run('INSERT INTO packing_template_items (category_id, name, sort_order) VALUES (?, ?, ?)', catId, item.name, order);
        itemsByCategory.set(item.category || 'Other', order + 1);
      }
      return id;
    });

    return { id: Number(templateId), name: templateName, categoryCount: categories.length, itemCount: items.length };
  }

  // ── Category Assignees ─────────────────────────────────────────────────────

  getCategoryAssignees(tripId: string | number) {
    const rows = this.db.all<{ category_name: string; user_id: number; username: string; avatar: string | null }>(`
    SELECT pca.category_name, pca.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM packing_category_assignees pca
    JOIN users u ON pca.user_id = u.id
    WHERE pca.trip_id = ?
  `, tripId);

    // Group by category
    const assignees: Record<string, { user_id: number; username: string; avatar: string | null }[]> = {};
    for (const row of rows) {
      if (!assignees[row.category_name]) assignees[row.category_name] = [];
      assignees[row.category_name].push({ user_id: row.user_id, username: row.username, avatar: avatarUrl(row) });
    }

    return assignees;
  }

  updateCategoryAssignees(tripId: string | number, categoryName: string, userIds: number[] | undefined) {
    this.db.transaction(() => {
      this.db.run('DELETE FROM packing_category_assignees WHERE trip_id = ? AND category_name = ?', tripId, categoryName);

      if (Array.isArray(userIds) && userIds.length > 0) {
        const insert = this.db.prepare('INSERT OR IGNORE INTO packing_category_assignees (trip_id, category_name, user_id) VALUES (?, ?, ?)');
        // Same rule as setBagMembers: only people on this trip may be assigned.
        const roster = this.tripRosterIds(tripId);
        for (const uid of userIds) if (roster.has(uid)) insert.run(tripId, categoryName, uid);
      }
    });

    const updated = this.db.all<{ user_id: number; username: string; avatar: string | null }>(`
    SELECT pca.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM packing_category_assignees pca
    JOIN users u ON pca.user_id = u.id
    WHERE pca.trip_id = ? AND pca.category_name = ?
  `, tripId, categoryName);
    return updated.map(m => ({ ...m, avatar: avatarUrl(m) }));
  }

  // ── Reorder ────────────────────────────────────────────────────────────────

  reorderItems(tripId: string | number, orderedIds: number[]): void {
    const update = this.db.prepare('UPDATE packing_items SET sort_order = ? WHERE id = ? AND trip_id = ?');
    this.db.transaction(() => {
      orderedIds.forEach((id, index) => {
        update.run(index, id, tripId);
      });
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

  /** An item looked up through its category, so :templateId actually scopes it. */
  private scopedTemplateItem(templateId: string, itemId: string) {
    return this.db.get(`
    SELECT ti.* FROM packing_template_items ti
    JOIN packing_template_categories tc ON ti.category_id = tc.id
    WHERE ti.id = ? AND tc.template_id = ?
  `, itemId, templateId);
  }

  listPackingTemplates() {
    return this.db.all(`
    SELECT pt.*, u.username as created_by_name,
      (SELECT COUNT(*) FROM packing_template_items ti JOIN packing_template_categories tc ON ti.category_id = tc.id WHERE tc.template_id = pt.id) as item_count,
      (SELECT COUNT(*) FROM packing_template_categories WHERE template_id = pt.id) as category_count
    FROM packing_templates pt
    JOIN users u ON pt.created_by = u.id
    ORDER BY pt.created_at DESC
  `);
  }

  getPackingTemplate(id: string) {
    const template = this.db.get('SELECT * FROM packing_templates WHERE id = ?', id);
    if (!template) return { error: 'Template not found', status: 404 };
    const categories = this.db.all('SELECT * FROM packing_template_categories WHERE template_id = ? ORDER BY sort_order, id', id);
    const items = this.db.all(`
    SELECT ti.* FROM packing_template_items ti
    JOIN packing_template_categories tc ON ti.category_id = tc.id
    WHERE tc.template_id = ? ORDER BY ti.sort_order, ti.id
  `, id);
    return { template, categories, items };
  }

  createPackingTemplate(name: string, createdBy: number) {
    if (!name?.trim()) return { error: 'Name is required', status: 400 };
    const result = this.db.run('INSERT INTO packing_templates (name, created_by) VALUES (?, ?)', name.trim(), createdBy);
    const template = this.db.get('SELECT * FROM packing_templates WHERE id = ?', result.lastInsertRowid);
    return { template };
  }

  updatePackingTemplate(id: string, data: { name?: string }) {
    const template = this.db.get('SELECT * FROM packing_templates WHERE id = ?', id);
    if (!template) return { error: 'Template not found', status: 404 };
    if (data.name?.trim()) this.db.run('UPDATE packing_templates SET name = ? WHERE id = ?', data.name.trim(), id);
    return { template: this.db.get('SELECT * FROM packing_templates WHERE id = ?', id) };
  }

  deletePackingTemplate(id: string) {
    const template = this.db.get<{ name?: string }>('SELECT * FROM packing_templates WHERE id = ?', id);
    if (!template) return { error: 'Template not found', status: 404 };
    this.db.run('DELETE FROM packing_templates WHERE id = ?', id);
    return { name: template.name };
  }

  // Template categories

  createTemplateCategory(templateId: string, name: string) {
    if (!name?.trim()) return { error: 'Category name is required', status: 400 };
    const template = this.db.get('SELECT * FROM packing_templates WHERE id = ?', templateId);
    if (!template) return { error: 'Template not found', status: 404 };
    const maxOrder = this.db.get<{ max: number | null }>('SELECT MAX(sort_order) as max FROM packing_template_categories WHERE template_id = ?', templateId)!;
    const result = this.db.run('INSERT INTO packing_template_categories (template_id, name, sort_order) VALUES (?, ?, ?)', templateId, name.trim(), (maxOrder.max ?? -1) + 1);
    return { category: this.db.get('SELECT * FROM packing_template_categories WHERE id = ?', result.lastInsertRowid) };
  }

  updateTemplateCategory(templateId: string, catId: string, data: { name?: string }) {
    const cat = this.db.get('SELECT * FROM packing_template_categories WHERE id = ? AND template_id = ?', catId, templateId);
    if (!cat) return { error: 'Category not found', status: 404 };
    if (data.name?.trim())
      this.db.run('UPDATE packing_template_categories SET name = ? WHERE id = ?', data.name.trim(), catId);
    return { category: this.db.get('SELECT * FROM packing_template_categories WHERE id = ?', catId) };
  }

  deleteTemplateCategory(templateId: string, catId: string) {
    const cat = this.db.get('SELECT * FROM packing_template_categories WHERE id = ? AND template_id = ?', catId, templateId);
    if (!cat) return { error: 'Category not found', status: 404 };
    this.db.run('DELETE FROM packing_template_categories WHERE id = ?', catId);
    return {};
  }

  // Template items

  createTemplateItem(templateId: string, catId: string, name: string) {
    if (!name?.trim()) return { error: 'Item name is required', status: 400 };
    const cat = this.db.get('SELECT * FROM packing_template_categories WHERE id = ? AND template_id = ?', catId, templateId);
    if (!cat) return { error: 'Category not found', status: 404 };
    const maxOrder = this.db.get<{ max: number | null }>('SELECT MAX(sort_order) as max FROM packing_template_items WHERE category_id = ?', catId)!;
    const result = this.db.run('INSERT INTO packing_template_items (category_id, name, sort_order) VALUES (?, ?, ?)', catId, name.trim(), (maxOrder.max ?? -1) + 1);
    return { item: this.db.get('SELECT * FROM packing_template_items WHERE id = ?', result.lastInsertRowid) };
  }

  updateTemplateItem(templateId: string, itemId: string, data: { name?: string }) {
    const item = this.scopedTemplateItem(templateId, itemId);
    if (!item) return { error: 'Item not found', status: 404 };
    if (data.name?.trim())
      this.db.run('UPDATE packing_template_items SET name = ? WHERE id = ?', data.name.trim(), itemId);
    return { item: this.db.get('SELECT * FROM packing_template_items WHERE id = ?', itemId) };
  }

  deleteTemplateItem(templateId: string, itemId: string) {
    const item = this.scopedTemplateItem(templateId, itemId);
    if (!item) return { error: 'Item not found', status: 404 };
    this.db.run('DELETE FROM packing_template_items WHERE id = ?', itemId);
    return {};
  }

  /** Fire-and-forget tag notification, mirroring the legacy dynamic import. */
  notifyTagged(tripId: string, actor: User, category: string, userIds: unknown): void {
    if (!Array.isArray(userIds) || userIds.length === 0) return;
    // Injected, not a lazy import of the old notifications bridge. The laziness bought
    // nothing the module graph does not already give — NotificationsModule
    // reaches nothing in this direction — and it hid the edge while handing the
    // send a second NotificationsService built outside the container.
    const tripInfo = this.db.get<{ title: string }>('SELECT title FROM trips WHERE id = ?', tripId);
    this.notifications.send({
      event: 'packing_tagged',
      actorId: actor.id,
      scope: 'trip',
      targetId: Number(tripId),
      params: { trip: tripInfo?.title || 'Untitled', actor: actor.email, category, tripId: String(tripId) },
    }).catch(() => {});
  }
}
