import { currentTimestampKysely } from '../dialect/kysely-functions';
import { caseWhenEquals, coalesce } from '../dialect/sql-functions';
import type { TripMembers } from '../entities/TripMembers.entity';
import { Trips } from '../entities/Trips.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';
import { TICKET_NOTE_PREFIX } from '@trek/shared';

/**
 * One row of `TripMembersService.listMembers` (`trip-members.service.ts:117-125`,
 * TM2). `is_guest` stays the raw SQLite integer here — the `!!m.is_guest`
 * boolean coercion is a service-layer default (D4), same split every other
 * repository in this program keeps.
 */
export interface MemberWithUserAndInviterRow {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  is_guest: number;
  role: string;
  added_at: string | null;
  invited_by_username: string | null;
}

export interface GuestTransferScope {
  tripId: number;
  guestId: number;
  memberId: number;
}

export type GuestTicketWrite = { id: number; storage: 'ticket_json' | 'note'; json: string };

export class TripMembersRepository extends TrekRepository<TripMembers> {
  async findIdentityCheckMember(tripId: number, memberId: number) {
    return this.kysely<Pick<DB, 'trip_members' | 'trips' | 'users'>>()
      .selectFrom('trip_members as membership')
      .innerJoin('trips as trip', 'trip.id', 'membership.trip_id')
      .innerJoin('users as member', 'member.id', 'membership.user_id')
      .select('membership.new_member_identity_check_completed_at as completedAt')
      .where('membership.trip_id', '=', tripId)
      .where('membership.user_id', '=', memberId)
      .where('trip.user_id', '!=', memberId)
      .where((eb) => eb.or([eb('member.is_guest', '=', 0), eb('member.is_guest', 'is', null)]))
      .executeTakeFirst();
  }

  async completeIdentityCheck(tripId: number, memberId: number): Promise<void> {
    await this.kysely<Pick<DB, 'trip_members'>>()
      .updateTable('trip_members')
      .set({ new_member_identity_check_completed_at: currentTimestampKysely(this.getEntityManager().getPlatform()) })
      .where('trip_id', '=', tripId)
      .where('user_id', '=', memberId)
      .where('new_member_identity_check_completed_at', 'is', null)
      .execute();
  }

  async listIdentityTransferGuests(tripId: number) {
    return this.kysely<Pick<DB, 'trip_members' | 'users'>>()
      .selectFrom('trip_members as membership')
      .innerJoin('users as guest', 'guest.id', 'membership.user_id')
      .select(['guest.id', 'guest.display_name', 'guest.username'])
      .where('membership.trip_id', '=', tripId)
      .where('guest.is_guest', '=', 1)
      .orderBy('membership.added_at')
      .orderBy('guest.id')
      .execute();
  }

  async hasOtherMembership(tripId: number, guestId: number): Promise<boolean> {
    return !!(await this.kysely<Pick<DB, 'trip_members'>>()
      .selectFrom('trip_members')
      .select('id')
      .where('user_id', '=', guestId)
      .where('trip_id', '!=', tripId)
      .executeTakeFirst());
  }

  async guestTransferFinancials({ tripId, guestId, memberId }: GuestTransferScope) {
    const db =
      this.kysely<Pick<DB, 'budget_items' | 'budget_item_payers' | 'budget_item_members' | 'budget_settlements'>>();
    const expenses = await db
      .selectFrom('budget_items as item')
      .where('item.trip_id', '=', tripId)
      .select(['item.id', 'item.note', 'item.ticket_json', 'item.paid_by_user_id'])
      .select((eb) => [
        eb
          .exists(
            eb
              .selectFrom('budget_item_payers')
              .select('id')
              .whereRef('budget_item_id', '=', 'item.id')
              .where('user_id', '=', guestId),
          )
          .as('guest_pays'),
        eb
          .exists(
            eb
              .selectFrom('budget_item_payers')
              .select('id')
              .whereRef('budget_item_id', '=', 'item.id')
              .where('user_id', '=', memberId),
          )
          .as('member_pays'),
        eb
          .exists(
            eb
              .selectFrom('budget_item_members')
              .select('id')
              .whereRef('budget_item_id', '=', 'item.id')
              .where('user_id', '=', guestId),
          )
          .as('guest_shares'),
        eb
          .exists(
            eb
              .selectFrom('budget_item_members')
              .select('id')
              .whereRef('budget_item_id', '=', 'item.id')
              .where('user_id', '=', memberId),
          )
          .as('member_shares'),
      ])
      .orderBy('item.id')
      .execute();
    const settlements = await db
      .selectFrom('budget_settlements')
      .select(['id', 'from_user_id', 'to_user_id'])
      .where('trip_id', '=', tripId)
      .where((eb) => eb.or([eb('from_user_id', '=', guestId), eb('to_user_id', '=', guestId)]))
      .orderBy('id')
      .execute();
    return { expenses, settlements };
  }

  async guestTransferParticipation({ tripId, guestId, memberId }: GuestTransferScope) {
    const db =
      this.kysely<
        Pick<
          DB,
          | 'assignment_participants'
          | 'day_assignments'
          | 'days'
          | 'reservation_travelers'
          | 'reservations'
          | 'todo_items'
          | 'todo_category_assignees'
          | 'packing_items'
          | 'packing_item_recipients'
          | 'packing_item_contributors'
          | 'packing_category_assignees'
          | 'packing_bags'
          | 'packing_bag_members'
          | 'place_ratings'
          | 'places'
        >
      >();
    const itinerary = await db
      .selectFrom('assignment_participants as participant')
      .innerJoin('day_assignments as assignment', 'assignment.id', 'participant.assignment_id')
      .innerJoin('days as day', 'day.id', 'assignment.day_id')
      .where('day.trip_id', '=', tripId)
      .where('participant.user_id', '=', guestId)
      .select((eb) => eb.fn.count<number>('participant.assignment_id').distinct().as('count'))
      .executeTakeFirstOrThrow();
    const bookings = await db
      .selectFrom('reservation_travelers as traveler')
      .innerJoin('reservations as booking', 'booking.id', 'traveler.reservation_id')
      .where('booking.trip_id', '=', tripId)
      .where('traveler.user_id', '=', guestId)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const todos = await db
      .selectFrom('todo_items')
      .where('trip_id', '=', tripId)
      .where('assigned_user_id', '=', guestId)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const todoCategories = await db
      .selectFrom('todo_category_assignees')
      .where('trip_id', '=', tripId)
      .where('user_id', '=', guestId)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const packingItems = await db
      .selectFrom('packing_items as item')
      .where('trip_id', '=', tripId)
      .where((eb) =>
        eb.or([
          eb('item.owner_id', '=', guestId),
          eb.exists(
            eb
              .selectFrom('packing_item_recipients')
              .select('user_id')
              .whereRef('item_id', '=', 'item.id')
              .where('user_id', '=', guestId),
          ),
          eb.exists(
            eb
              .selectFrom('packing_item_contributors')
              .select('user_id')
              .whereRef('item_id', '=', 'item.id')
              .where('user_id', '=', guestId),
          ),
        ]),
      )
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const packingCategories = await db
      .selectFrom('packing_category_assignees')
      .where('trip_id', '=', tripId)
      .where('user_id', '=', guestId)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const packingBags = await db
      .selectFrom('packing_bags as bag')
      .where('trip_id', '=', tripId)
      .where((eb) =>
        eb.or([
          eb('bag.user_id', '=', guestId),
          eb.exists(
            eb
              .selectFrom('packing_bag_members')
              .select('user_id')
              .whereRef('bag_id', '=', 'bag.id')
              .where('user_id', '=', guestId),
          ),
        ]),
      )
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const ratings = await db
      .selectFrom('place_ratings as guest')
      .innerJoin('places', 'places.id', 'guest.place_id')
      .leftJoin('place_ratings as member', (join) =>
        join.onRef('member.place_id', '=', 'guest.place_id').on('member.user_id', '=', memberId),
      )
      .where('places.trip_id', '=', tripId)
      .where('guest.user_id', '=', guestId)
      .select((eb) => [eb.fn.countAll<number>().as('count'), eb.fn.count<number>('member.user_id').as('overlaps')])
      .executeTakeFirstOrThrow();
    return {
      itinerary: Number(itinerary.count),
      bookings: Number(bookings.count),
      todos: Number(todos.count) + Number(todoCategories.count),
      packing: Number(packingItems.count) + Number(packingCategories.count) + Number(packingBags.count),
      ratings: Number(ratings.count),
      rating_overlaps: Number(ratings.overlaps),
    };
  }

  async rewriteGuestFinancials(
    { tripId, guestId, memberId }: GuestTransferScope,
    tickets: GuestTicketWrite[],
  ): Promise<void> {
    const db =
      this.kysely<Pick<DB, 'budget_items' | 'budget_item_payers' | 'budget_item_members' | 'budget_settlements'>>();
    const expenseIds = db.selectFrom('budget_items').select('id').where('trip_id', '=', tripId);
    await db
      .updateTable('budget_item_members')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('budget_item_id', 'in', expenseIds)
      .execute();
    await db
      .updateTable('budget_item_payers')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('budget_item_id', 'in', expenseIds)
      .execute();
    await db
      .updateTable('budget_items')
      .set({ paid_by_user_id: memberId })
      .where('trip_id', '=', tripId)
      .where('paid_by_user_id', '=', guestId)
      .execute();
    await db
      .updateTable('budget_settlements')
      .set({ from_user_id: memberId })
      .where('trip_id', '=', tripId)
      .where('from_user_id', '=', guestId)
      .execute();
    await db
      .updateTable('budget_settlements')
      .set({ to_user_id: memberId })
      .where('trip_id', '=', tripId)
      .where('to_user_id', '=', guestId)
      .execute();
    await db
      .updateTable('budget_settlements')
      .set({ created_by_user_id: null })
      .where('trip_id', '=', tripId)
      .where('created_by_user_id', '=', guestId)
      .execute();
    for (const ticket of tickets) {
      const changes =
        ticket.storage === 'ticket_json' ? { ticket_json: ticket.json } : { note: TICKET_NOTE_PREFIX + ticket.json };
      await db
        .updateTable('budget_items')
        .set(changes)
        .where('id', '=', ticket.id)
        .where('trip_id', '=', tripId)
        .execute();
    }
  }

  async rewriteGuestParticipation({ tripId, guestId, memberId }: GuestTransferScope): Promise<void> {
    const db =
      this.kysely<
        Pick<
          DB,
          | 'assignment_participants'
          | 'day_assignments'
          | 'days'
          | 'reservation_travelers'
          | 'reservations'
          | 'todo_items'
          | 'todo_category_assignees'
          | 'packing_items'
          | 'packing_item_recipients'
          | 'packing_item_contributors'
          | 'packing_category_assignees'
          | 'packing_bags'
          | 'packing_bag_members'
          | 'place_ratings'
          | 'places'
        >
      >();
    const assignments = db
      .selectFrom('day_assignments as assignment')
      .innerJoin('days as day', 'day.id', 'assignment.day_id')
      .where('day.trip_id', '=', tripId)
      .select('assignment.id');
    const reservations = db.selectFrom('reservations').where('trip_id', '=', tripId).select('id');
    const items = db.selectFrom('packing_items').where('trip_id', '=', tripId).select('id');
    const bags = db.selectFrom('packing_bags').where('trip_id', '=', tripId).select('id');
    const places = db.selectFrom('places').where('trip_id', '=', tripId).select('id');

    await db
      .updateTable('todo_items')
      .set({ assigned_user_id: memberId })
      .where('trip_id', '=', tripId)
      .where('assigned_user_id', '=', guestId)
      .execute();
    await db
      .updateTable('packing_items')
      .set({ owner_id: memberId })
      .where('trip_id', '=', tripId)
      .where('owner_id', '=', guestId)
      .execute();
    await db
      .updateTable('packing_bags')
      .set({ user_id: memberId })
      .where('trip_id', '=', tripId)
      .where('user_id', '=', guestId)
      .execute();

    await db
      .deleteFrom('assignment_participants')
      .where('user_id', '=', guestId)
      .where('assignment_id', 'in', assignments)
      .where(
        'assignment_id',
        'in',
        db.selectFrom('assignment_participants').select('assignment_id').where('user_id', '=', memberId),
      )
      .execute();
    await db
      .updateTable('assignment_participants')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('assignment_id', 'in', assignments)
      .execute();

    await db
      .deleteFrom('reservation_travelers')
      .where('user_id', '=', guestId)
      .where('reservation_id', 'in', reservations)
      .where(
        'reservation_id',
        'in',
        db.selectFrom('reservation_travelers').select('reservation_id').where('user_id', '=', memberId),
      )
      .execute();
    await db
      .updateTable('reservation_travelers')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('reservation_id', 'in', reservations)
      .execute();

    await db
      .deleteFrom('packing_item_recipients')
      .where('user_id', '=', guestId)
      .where('item_id', 'in', items)
      .where(
        'item_id',
        'in',
        db.selectFrom('packing_item_recipients').select('item_id').where('user_id', '=', memberId),
      )
      .execute();
    await db
      .updateTable('packing_item_recipients')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('item_id', 'in', items)
      .execute();

    await db
      .deleteFrom('packing_item_contributors')
      .where('user_id', '=', guestId)
      .where('item_id', 'in', items)
      .where(
        'item_id',
        'in',
        db.selectFrom('packing_item_contributors').select('item_id').where('user_id', '=', memberId),
      )
      .execute();
    await db
      .updateTable('packing_item_contributors')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('item_id', 'in', items)
      .execute();

    await db
      .deleteFrom('packing_bag_members')
      .where('user_id', '=', guestId)
      .where('bag_id', 'in', bags)
      .where('bag_id', 'in', db.selectFrom('packing_bag_members').select('bag_id').where('user_id', '=', memberId))
      .execute();
    await db
      .updateTable('packing_bag_members')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('bag_id', 'in', bags)
      .execute();

    await db
      .deleteFrom('place_ratings')
      .where('user_id', '=', guestId)
      .where('place_id', 'in', places)
      .where('place_id', 'in', db.selectFrom('place_ratings').select('place_id').where('user_id', '=', memberId))
      .execute();
    await db
      .updateTable('place_ratings')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('place_id', 'in', places)
      .execute();

    await db
      .deleteFrom('todo_category_assignees')
      .where('user_id', '=', guestId)
      .where('trip_id', '=', tripId)
      .where(
        'category_name',
        'in',
        db
          .selectFrom('todo_category_assignees')
          .select('category_name')
          .where('user_id', '=', memberId)
          .where('trip_id', '=', tripId),
      )
      .execute();
    await db
      .updateTable('todo_category_assignees')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('trip_id', '=', tripId)
      .execute();

    await db
      .deleteFrom('packing_category_assignees')
      .where('user_id', '=', guestId)
      .where('trip_id', '=', tripId)
      .where(
        'category_name',
        'in',
        db
          .selectFrom('packing_category_assignees')
          .select('category_name')
          .where('user_id', '=', memberId)
          .where('trip_id', '=', tripId),
      )
      .execute();
    await db
      .updateTable('packing_category_assignees')
      .set({ user_id: memberId })
      .where('user_id', '=', guestId)
      .where('trip_id', '=', tripId)
      .execute();
  }

  /**
   * The user ids a trip may refer to: its members plus the owner. Byte-for-byte
   * the legacy `DatabaseService.rosterUserIds`'s statement in intent —
   * `SELECT user_id FROM trip_members WHERE trip_id = ? UNION SELECT user_id
   * FROM trips WHERE id = ?` — as two reads merged through a `Set` (which
   * already dedupes, the same guarantee `UNION` gives) rather than one `UNION`
   * statement: the two `SELECT`s read different tables with no FK between
   * them, so a single-entity `QueryBuilder` (rooted on `TripMembers`) cannot
   * express the second half without losing rows on a trip that has no
   * members yet — an inner join from `trip_members` would produce zero rows
   * for exactly the case (an owner-only trip) the legacy statement's second
   * `SELECT` exists to cover. `trips` has no `TripMembersRepository` field to
   * reach it through, so this repository asks the `EntityManager` for
   * `TripsRepository` the same way `DatabaseService`/the guards resolve a
   * repository outside their own entity — one `EntityManager`, two
   * repositories, two independent reads.
   */
  async rosterUserIds(trip_id: number | string): Promise<Set<number>> {
    // Raw conditions (D4's T5 escape hatch), not `.where({ 'm.trip': trip_id })`:
    // MikroORM's typed filter rejects a `string` against the relation's
    // branded id type, and coercing to `Number(trip_id)` first would change
    // the raw-bind id-shape parity `TripsRepository`'s docstring describes.
    // `m.trip_id`/`t.id` are the physical column names.
    const members = await this.qb('m')
      .select(['m.user'])
      .where('m.trip_id = ?', [trip_id])
      .execute<{ user_id: number }[]>('all', false);

    const trips = this.getEntityManager().getRepository(Trips);
    const owner = await trips
      .qb('t')
      .select(['t.user'])
      .where('t.id = ?', [trip_id])
      .execute<{ user_id: number } | undefined>('get', false);

    const ids = new Set(members.map((m) => m.user_id));
    if (owner) ids.add(owner.user_id);
    return ids;
  }

  /**
   * `SELECT user_id FROM trip_members WHERE trip_id = ? ORDER BY added_at ASC`
   * (`trip-membership.service.ts:29-31`, TB2) — the owner is excluded by
   * construction (the table has no row for the owner), matching the legacy
   * statement exactly. Raw-bind (D4's T5 escape hatch), the same
   * `number | string` seam `TripsRepository.findAccessible` documents.
   */
  async listUserIdsByTrip(trip_id: number | string): Promise<number[]> {
    const rows = await this.qb('m')
      .select(['m.user'])
      .where('m.trip_id = ?', [trip_id])
      .orderBy({ 'm.added_at': 'asc' })
      .execute<{ user_id: number }[]>('all', false);
    return rows.map((r) => r.user_id);
  }

  /**
   * `SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?`
   * (`trip-membership.service.ts:70`, TB5 — `joinTripAsMember`'s
   * already-a-member check, one leg of a non-transactional check-then-act
   * sequence, §18.4: unchanged by this conversion; also `trip-members
   * .service.ts:151`, TM5 — `addMember`'s own "already has access" check,
   * the SAME non-transactional shape against TM6's insert). `TripMembershipService
   * .joinTripAsMember`'s `tripId` is always a real `number`; `TripMembersService
   * .addMember`'s is still the route's unconverted `tripId`
   * (`string | number`) — raw-bind (D4's T5 escape hatch, the same seam
   * `TripsRepository.findAccessible` documents) covers both without forking
   * the statement into two methods.
   */
  async exists(trip_id: number | string, user_id: number): Promise<boolean> {
    const row = await this.qb('m')
      .select(['m.id'])
      .where('m.trip_id = ?', [trip_id])
      .andWhere({ user: user_id })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * `INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)`
   * (`trip-membership.service.ts:72`, TB6 — the third leg of the same
   * non-transactional sequence as `exists` above; also `trip-members
   * .service.ts:155`, TM6 — `addMember`'s own insert, and `:227`, TM17 —
   * `createGuest`'s membership row for the new guest, inside its own
   * transaction). `invitedBy` may be `null`. `trip_id: number`, not
   * `number | string`: unlike `exists`'s WHERE-comparison shape, `insert`'s
   * typed `EntityData` requires the relation's real `Primary<Trips>` type.
   * This is still exact parity for `TripMembersService`'s two still-string
   * `tripId` callers (TM6/TM17): by the time either call happens, the
   * route's `tripId` has already matched a real trip through one of the
   * four raw-bind access primitives earlier in the SAME request (the
   * controller's inline `canAccessTrip` check for `addMember`;
   * `TripOwnerGuard`'s `isOwner`/`findAccessible` for `createGuest`'s
   * owner-only route) — which only succeeds for a string SQLite's own
   * affinity rules already recognise as numeric, and `Number(...)` of
   * exactly that class of string always agrees with SQLite's own
   * numeric-affinity conversion. The two call sites document this and pass
   * `Number(tripId)`, not a widened raw bind.
   */
  async addMember(trip_id: number, user_id: number, invitedBy: number | null): Promise<void> {
    await this.insert({ trip: trip_id, user: user_id, invited_by: invitedBy });
  }

  /**
   * `SELECT u.id, COALESCE(u.display_name, u.username) AS username, u.email,
   *  u.avatar, u.is_guest, CASE WHEN u.id = ? THEN 'owner' ELSE 'member' END
   *  as role, m.added_at, COALESCE(ib.display_name, ib.username) as
   *  invited_by_username FROM trip_members m JOIN users u ON u.id = m.user_id
   *  LEFT JOIN users ib ON ib.id = m.invited_by WHERE m.trip_id = ?
   *  ORDER BY m.added_at ASC` (`trip-members.service.ts:117-125`, TM2) —
   * the self-join on `users` (once as `u` for the member, once as `ib` for
   * the inviter) via `TripMembers.entity.ts`'s `invitedByRef` relation,
   * which exists precisely for this join. Every joined-alias column is
   * selected with an explicit inline `as <name>` (the `PlaceRatingsRepository
   * .listForPlaces`/`AssignmentParticipantsRepository.insertIgnore`
   * precedent — rule 19's trap: selecting a joined alias's bare `.id`
   * without an explicit alias risks MikroORM's own `<alias>__<col>` prefix
   * for a relation-property select, verified NOT to reproduce the legacy's
   * bare `id`/`email`/`avatar`/`is_guest`/`added_at` keys otherwise), never
   * left to MikroORM's own column-collision aliasing.
   */
  async listWithUserAndInviter(trip_id: number | string, owner_id: number): Promise<MemberWithUserAndInviterRow[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('m')
      .join('m.user', 'u')
      .leftJoin('m.invitedByRef', 'ib')
      .select([
        'u.id as id',
        coalesce(platform, 'u.display_name', 'u.username').as('username'),
        'u.email as email',
        'u.avatar as avatar',
        'u.is_guest as is_guest',
        caseWhenEquals(platform, 'u.id', owner_id, 'owner', 'member').as('role'),
        'm.added_at as added_at',
        coalesce(platform, 'ib.display_name', 'ib.username').as('invited_by_username'),
      ])
      .where('m.trip_id = ?', [trip_id])
      .orderBy({ 'm.added_at': 'asc' })
      .execute<MemberWithUserAndInviterRow[]>('all', false);
  }

  /**
   * `SELECT u.id FROM users u JOIN trip_members m ON m.user_id = u.id
   *  WHERE u.id = ? AND m.trip_id = ? AND u.is_guest = 1`
   *  (`trip-members.service.ts:235-237`, TM18) — security-sensitive: the
   * scoping guard that keeps guest mutations trip-local (#1362). Rooted on
   * `TripMembers` (this repository's entity) rather than `Users`: the
   * legacy statement's `users u JOIN trip_members m` becomes `trip_members m
   * JOIN users u` here, the same join and the same result set, only rooted
   * the other way because that is this repository's entity.
   *
   * Raw-bind on `user_id` (not `.andWhere({ user: user_id })`) plus a
   * `Number.isFinite` short-circuit guard — the same reason `remove()` below
   * has both: `renameGuest`/`deleteGuest`'s callers still do a bare
   * `Number.parseInt(userId)` on the route's `:userId`, unvalidated — a
   * non-numeric id parses to `NaN`. **Mechanism (Task 6 review's I1,
   * captured by wrapping `better-sqlite3.prepare`, not assumed): MikroORM
   * formats every query with ALL parameters inlined as escaped literals —
   * the params array that reaches better-sqlite3 is always empty — so a
   * non-finite `NaN`/`Infinity` renders as a bare, unquoted SQL token and
   * SQLite fails at PREPARE time (`no such column: NaN`, a 500), before any
   * statement runs. A raw `?` placeholder does not avoid this (a typed
   * filter has the identical failure) because the inlining happens during
   * formatting, not at the bind step.** The legacy statement bound it as a
   * genuine better-sqlite3 parameter, matching zero rows (404 `'Guest not
   * found'`, not a crash) — only skipping the query for a non-finite
   * `user_id` reproduces that byte for byte.
   */
  async isGuestOfTrip(trip_id: number | string, user_id: number): Promise<boolean> {
    if (!Number.isFinite(user_id)) return false;
    const row = await this.qb('m')
      .join('m.user', 'u')
      .select(['u.id as id'])
      .where('m.trip_id = ?', [trip_id])
      .andWhere('m.user_id = ?', [user_id])
      .andWhere({ 'u.is_guest': 1 })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * `INSERT OR IGNORE INTO trip_members (trip_id, user_id, invited_by)
   *  VALUES (?, ?, ?)` (`trip-members.service.ts:200`, TM15) —
   * security-sensitive: `transferOwnership`'s third statement, giving the
   * former owner membership back. `upsert` with `onConflictAction: 'ignore'`
   * on the table's real unique key, named by entity property (`trip`/`user`,
   * `AssignmentParticipantsRepository.insertIgnore`'s precedent for a
   * relation-backed `onConflictFields` list) — `UNIQUE(trip_id, user_id)`
   * per `TripMembersSchema`'s own `uniques` declaration, not assumed.
   * `trip_id: number`, the same reasoning as `addMember`'s docstring above
   * (an `upsert` is INSERT-shaped; the caller passes `Number(tripId)`,
   * justified there — `transferOwnership`'s route is `TripOwnerGuard`-gated,
   * so `tripId` has already matched a real trip through the raw-bind
   * `isOwner`/`findAccessible` primitive earlier in the same request).
   */
  async addIgnoringConflict(trip_id: number, user_id: number, invitedBy: number | null): Promise<void> {
    // `invitedByRef`, not `invited_by`: the latter is a `persist(false)` mirror
    // column (like `trip_id`/`user_id`) that `upsert` — unlike `insert` above,
    // per `addMember`'s test — silently drops when building its INSERT.
    // `invitedByRef` is the real, joined-column-backed relation property.
    await this.upsert(
      { trip: trip_id, user: user_id, invitedByRef: invitedBy },
      { onConflictFields: ['trip', 'user'], onConflictAction: 'ignore' },
    );
  }

  /**
   * `DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?`
   * (`trip-members.service.ts:166`, TM8 `removeMember`; `:198`, TM14
   * `transferOwnership`'s "no longer a plain member" step —
   * security-sensitive). `trip_id: number` (Plan 4 Task 8a, narrowed from
   * `number | string` — its last raw-string caller,
   * `TripMembersController.removeMember`, now parses its route param once
   * itself before calling this), so `trip_id` is a typed `.where({ trip:
   * trip_id })` filter below; `user_id` stays a raw `m.user_id = ?`
   * placeholder — NOT the same seam, a different reason entirely:
   * `TripMembersController.removeMember` still does a bare
   * `Number.parseInt(userId)` on the route's `:userId`, unvalidated (rule
   * 15's exact trap — a non-numeric id parses to `NaN`), and a typed filter
   * cannot carry a `NaN` through this ORM layer intact (see below).
   *
   * **`Number.isFinite` guard, checked directly against a compiled boot, not
   * assumed:** a typed `.andWhere({ user: user_id })` filter renders `NaN` as
   * a literal, unquoted SQL token (`WHERE … AND user_id = NaN`), which
   * SQLite's parser reads as a column reference and rejects at PREPARE time
   * (`no such column: NaN`, a 500). Switching to a raw `m.user_id = ?`
   * placeholder does NOT fix this (Task 6 review's I1, captured by wrapping
   * `better-sqlite3.prepare`): MikroORM formats every query with ALL
   * parameters inlined as escaped literals — the params array that reaches
   * better-sqlite3 is always empty — so `NaN` renders as that same bare
   * token regardless of whether the predicate was written as a typed filter
   * or a raw `?` placeholder (reproduced directly: still `no such column:
   * NaN` at prepare time, before any bind happens — the inlining happens
   * during formatting, not at the bind step). The legacy statement bound
   * `targetUserId` (`NaN`) straight into a real better-sqlite3 parameter,
   * which silently matches zero rows and returns 200 `{ success: true }` —
   * only skipping the query entirely for a non-finite `user_id` reproduces
   * that, byte for byte, since neither the typed filter nor the raw
   * placeholder route can pass `NaN` through the ORM layer intact.
   */
  async remove(trip_id: number, user_id: number): Promise<void> {
    if (!Number.isFinite(user_id)) return;
    await this.qb('m').delete().where({ trip: trip_id }).andWhere('m.user_id = ?', [user_id]).execute('run');
  }

  /**
   * Notes that somebody else took this user off the trip, so the trip's invite
   * link stops letting them back in (GHSA-wr4c-964p-39jg). A second removal
   * keeps the first note.
   */
  async recordRemoval(tripId: number, userId: number): Promise<void> {
    await this.kysely<Pick<DB, 'trip_member_removals'>>()
      .insertInto('trip_member_removals')
      .values({ trip_id: tripId, user_id: userId })
      .onConflict((oc) => oc.columns(['trip_id', 'user_id']).doNothing())
      .execute();
  }

  /**
   * Lifts the note once a member manager adds the user back.
   *
   * @txStandalone it runs after the membership insert and only lifts a refusal;
   * when it fails, the user is a member anyway and the invite link keeps
   * refusing them, which is the safe side.
   */
  async clearRemoval(tripId: number, userId: number): Promise<void> {
    await this.kysely<Pick<DB, 'trip_member_removals'>>()
      .deleteFrom('trip_member_removals')
      .where('trip_id', '=', tripId)
      .where('user_id', '=', userId)
      .execute();
  }

  /** Whether somebody else took this user off the trip and nobody added them back since. */
  async wasRemoved(tripId: number, userId: number): Promise<boolean> {
    const row = await this.kysely<Pick<DB, 'trip_member_removals'>>()
      .selectFrom('trip_member_removals')
      .select('id')
      .where('trip_id', '=', tripId)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return !!row;
  }

  /**
   * Takes someone who left the trip off its journal link, so coming back later
   * does not quietly reopen the journal. Their access already ended with the
   * membership (the link's reach requires it); this tidies the row. Here rather
   * than in the journey domain because leaving is the roster's to finish, and
   * reaching into journey from the roster closed a cycle between the two.
   */
  async leaveJournalLink(tripId: number, userId: number): Promise<void> {
    const db = this.kysely<Pick<DB, 'trip_journal_links' | 'trip_journal_link_members'>>();
    await db
      .deleteFrom('trip_journal_link_members')
      .where('user_id', '=', userId)
      .where('link_id', 'in', db.selectFrom('trip_journal_links').select('id').where('trip_id', '=', tripId))
      .execute();
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 7 (`trips.rpc.ts::members`) — additive: no other repository
  // is rooted at `trip_members` joined to `users`, and RP3's shape is
  // deliberately NOT `listWithUserAndInviter`'s (TM2's COALESCE'd
  // `username`), so it gets its own method here rather than a variant
  // parameter on TM2's.
  // ---------------------------------------------------------------------------

  /**
   * RP3 (`trips.rpc.ts::members`) — `SELECT u.id, u.username, u.display_name,
   * u.avatar FROM trip_members tm JOIN users u ON u.id = tm.user_id WHERE
   * tm.trip_id = ?`. Emits raw `username` AND `display_name` as SEPARATE
   * fields — deliberately NOT `listWithUserAndInviter`'s (TM2) COALESCE'd
   * single `username` (the ruling: "do not harmonise" — a plugin reading
   * `trips.members` and the REST/MCP roster are two different wire shapes on
   * purpose, inventory §18.10).
   */
  async listRawUsernameAndDisplayName(
    trip_id: number | string,
  ): Promise<{ id: number; username: string; display_name: string | null; avatar: string | null }[]> {
    return await this.qb('m')
      .join('m.user', 'u')
      .select(['u.id', 'u.username', 'u.display_name', 'u.avatar'])
      .where('m.trip_id = ?', [trip_id])
      .execute<{ id: number; username: string; display_name: string | null; avatar: string | null }[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 4 Task 1 (UC4, `user-cleanup.service.ts::cleanupUserReferences`) —
  // additive: the table's own Plan 3c ownership, mis-filed by an earlier
  // ledger under Plan 3g/3j and left unconverted.
  // ---------------------------------------------------------------------------

  /**
   * UC4 — `UPDATE trip_members SET invited_by = NULL WHERE invited_by = ?`
   * (GDPR erasure: severs every membership row's reference to a user being
   * deleted, without deleting the membership itself). Filtered and set
   * through `invitedByRef`, the real joined-column relation property —
   * `invited_by` itself is the `persist(false)` mirror `addIgnoringConflict`'s
   * docstring above already names.
   */
  async clearInvitedBy(userId: number): Promise<void> {
    await this.nativeUpdate({ invitedByRef: userId }, { invitedByRef: null });
  }

  /**
   * Before a member's account is deleted: the trip tags they created pass to
   * each trip's owner, so a tag the whole trip uses keeps its place_tags. The
   * user's personal tags are left to the delete.
   */
  async handTripTagsToTripOwners(userId: number): Promise<void> {
    await this.kysely<Pick<DB, 'tags' | 'trips'>>()
      .updateTable('tags')
      .set((eb) => ({
        user_id: eb.selectFrom('trips').select('trips.user_id').whereRef('trips.id', '=', 'tags.trip_id'),
      }))
      .where('user_id', '=', userId)
      .where('trip_id', 'is not', null)
      .execute();
  }
}
