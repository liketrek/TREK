import type { Notifications } from '../entities/Notifications.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * A bare `notifications` row — every scalar column of the entity, incl. the
 * two `persist(false)` relation mirrors (`sender_id`, `recipient_id` — the
 * program-wide trap: a bare wildcard/`fields:`-narrowed ORM read silently
 * drops these, so every full-row read below goes through Kysely with an
 * explicit column list instead).
 */
export interface NotificationRow {
  id: number;
  type: string;
  scope: string;
  target: number;
  sender_id: number | null;
  recipient_id: number;
  title_key: string;
  title_params: string | null;
  text_key: string;
  text_params: string | null;
  positive_text_key: string | null;
  negative_text_key: string | null;
  positive_callback: string | null;
  negative_callback: string | null;
  response: string | null;
  navigate_text_key: string | null;
  navigate_target: string | null;
  is_read: number | null;
  created_at: string | null;
}

const _notificationRowKeys: AssertRowKeys<NotificationRow, Notifications> = true;

/** NT10/NT22's joined shape — `n.*, u.username AS sender_username, u.avatar AS sender_avatar`. */
export interface NotificationJoinRow extends NotificationRow {
  sender_username: string | null;
  sender_avatar: string | null;
}

/** The 15-column insert shape NT5/NT8 share (`id`/`response`/`is_read`/`created_at` are autoincrement/defaulted, matching the legacy column list). */
export interface NotificationInsertRow {
  type: string;
  scope: string;
  target: number;
  sender_id: number | null;
  recipient_id: number;
  title_key: string;
  title_params: string;
  text_key: string;
  text_params: string;
  positive_text_key: string | null;
  negative_text_key: string | null;
  positive_callback: string | null;
  negative_callback: string | null;
  navigate_text_key: string | null;
  navigate_target: string | null;
}

/**
 * The minimal cross-table read shapes this repository needs for
 * `resolveRecipients`/sender-info lookups (NT1/NT2/NT3/NT4/NT6/NT23/NT24).
 * `trips`/`trip_members`/`users` are other plans' tables (3c/3b) — reached
 * here via Kysely the same way `CollabMessagesRepository`/`BudgetItemsRepository`
 * read `users`/`trip_files` for their own domain-specific joins, rather than
 * a new cross-domain `@InjectRepository`, which would widen this module's
 * `MikroOrmModule.forFeature` registration (and every OTHER module that
 * constructs `NotificationsService`, per the BOOT GATE note) for reads that
 * are each a single, narrow, already-indexed lookup.
 */
interface NotificationsKyselyDB {
  notifications: NotificationRow;
  users: { id: number; username: string; avatar: string | null; is_guest: number; role: string };
  trips: { id: number; user_id: number };
  trip_members: { trip_id: number; user_id: number };
}

/**
 * `notifications` — the in-app notification store. Kysely throughout for
 * `notifications` itself: `sender_id`/`recipient_id` are `persist(false)`
 * mirrors (the `TripFilesRepository`/`BudgetItemsRepository` class docstring
 * trap). The generic ORM helpers (`count`/`nativeUpdate`/`nativeDelete`/
 * `insert`) are used wherever the statement doesn't need a full-row
 * projection, since `is_read`/`response`/the relation properties themselves
 * are ordinary (non-mirror) columns.
 */
export class NotificationsRepository extends TrekRepository<Notifications> {
  private joinedQuery() {
    return this.kysely<NotificationsKyselyDB>()
      .selectFrom('notifications as n')
      .leftJoin('users as u', 'u.id', 'n.sender_id')
      .selectAll('n')
      .select(['u.username as sender_username', 'u.avatar as sender_avatar']);
  }

  // ── Recipient resolution (NT1-NT4) ─────────────────────────────────────

  /** NT1 — `SELECT user_id FROM trips WHERE id = ?` (the trip owner). */
  async getTripOwnerId(tripId: number): Promise<number | null> {
    const row = await this.kysely<NotificationsKyselyDB>()
      .selectFrom('trips')
      .select('user_id')
      .where('id', '=', tripId)
      .executeTakeFirst();
    return row?.user_id ?? null;
  }

  /**
   * NT2 — the guest-exclusion chokepoint (#1362): `SELECT m.user_id FROM
   * trip_members m JOIN users u ON u.id = m.user_id WHERE m.trip_id = ? AND
   * COALESCE(u.is_guest, 0) = 0`. `is_guest` is a non-nullable
   * `p.integer().default(0)` column on `Users` (never actually NULL), so a
   * plain `= 0` reproduces the legacy `COALESCE(..., 0) = 0` result set
   * exactly — the COALESCE was defensive, not load-bearing on this schema.
   * This is THE single chokepoint for in-app/email/webhook/ntfy recipient
   * resolution across the whole app (the service's own doc comment) —
   * preserved byte-exact, not "helpfully" folded into a relation walk.
   */
  async listNonGuestTripMemberIds(tripId: number): Promise<number[]> {
    const rows = await this.kysely<NotificationsKyselyDB>()
      .selectFrom('trip_members as m')
      .innerJoin('users as u', 'u.id', 'm.user_id')
      .select('m.user_id')
      .where('m.trip_id', '=', tripId)
      .where('u.is_guest', '=', 0)
      .execute();
    return rows.map((r) => r.user_id);
  }

  /** NT3 — `SELECT is_guest FROM users WHERE id = ?` (a guest todo-assignee, scope='user', is never notified). */
  async findGuestFlag(userId: number): Promise<{ is_guest: number } | undefined> {
    return await this.kysely<NotificationsKyselyDB>()
      .selectFrom('users')
      .select('is_guest')
      .where('id', '=', userId)
      .executeTakeFirst();
  }

  /** NT4 — `SELECT id FROM users WHERE role = ? AND COALESCE(is_guest, 0) = 0` — same non-nullable-column reasoning as `listNonGuestTripMemberIds`. */
  async listNonGuestUserIdsByRole(role: string): Promise<number[]> {
    const rows = await this.kysely<NotificationsKyselyDB>()
      .selectFrom('users')
      .select('id')
      .where('role', '=', role)
      .where('is_guest', '=', 0)
      .execute();
    return rows.map((r) => r.id);
  }

  /** NT6/NT23/NT24 — `SELECT username, avatar FROM users WHERE id = ?` (sender info for WS payloads and the dev-fallback self-notification), three identical-text call sites folded onto one method. */
  async findUserBasic(userId: number): Promise<{ username: string; avatar: string | null } | undefined> {
    return await this.kysely<NotificationsKyselyDB>()
      .selectFrom('users')
      .select(['username', 'avatar'])
      .where('id', '=', userId)
      .executeTakeFirst();
  }

  // ── Notification CRUD ───────────────────────────────────────────────────

  /** NT5/NT8 — the 15-column insert, shared by `createNotification`'s per-recipient loop and `createNotificationForRecipient`'s single insert. Returns the new row's id. */
  async insertNotification(row: NotificationInsertRow): Promise<number> {
    return await this.insert({
      type: row.type,
      scope: row.scope,
      target: row.target,
      sender: row.sender_id,
      recipient: row.recipient_id,
      title_key: row.title_key,
      title_params: row.title_params,
      text_key: row.text_key,
      text_params: row.text_params,
      positive_text_key: row.positive_text_key,
      negative_text_key: row.negative_text_key,
      positive_callback: row.positive_callback,
      negative_callback: row.negative_callback,
      navigate_text_key: row.navigate_text_key,
      navigate_target: row.navigate_target,
    });
  }

  /** NT7/NT9/NT19 — `SELECT * FROM notifications WHERE id = ?`, full row incl. the persist(false) mirrors. */
  async findById(id: number): Promise<NotificationRow | undefined> {
    return await this.kysely<NotificationsKyselyDB>()
      .selectFrom('notifications')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /** NT19 — `respond`'s recipient-scoped initial read: `SELECT * FROM notifications WHERE id = ? AND recipient_id = ?`. */
  async findByIdForRecipient(id: number, recipientId: number): Promise<NotificationRow | undefined> {
    return await this.kysely<NotificationsKyselyDB>()
      .selectFrom('notifications')
      .selectAll()
      .where('id', '=', id)
      .where('recipient_id', '=', recipientId)
      .executeTakeFirst();
  }

  /** NT10 — `listInApp`'s joined page read, `unreadOnly` toggling the extra `is_read = 0` predicate (the legacy statement's two dynamic-WHERE variants). */
  async listForRecipient(
    recipientId: number,
    limit: number,
    offset: number,
    unreadOnly: boolean,
  ): Promise<NotificationJoinRow[]> {
    let q = this.joinedQuery().where('n.recipient_id', '=', recipientId);
    if (unreadOnly) q = q.where('n.is_read', '=', 0);
    return await q.orderBy('n.created_at', 'desc').limit(limit).offset(offset).execute();
  }

  /** NT22 — `respond`'s post-update re-select: the same joined shape, `WHERE n.id = ?`, deliberately unscoped by recipient (the id was already recipient-scope-verified by `findByIdForRecipient` earlier in the same call). */
  async findWithSenderById(id: number): Promise<NotificationJoinRow | undefined> {
    return await this.joinedQuery().where('n.id', '=', id).executeTakeFirst();
  }

  /** NT11/NT12 — `listInApp`'s `total`/`unread_count` reads. Neither `recipient`(relation)/`is_read` is a persist(false) mirror, so the generic `count()` helper is exact. */
  async countForRecipient(recipientId: number, unreadOnly: boolean): Promise<number> {
    return await this.count(unreadOnly ? { recipient: recipientId, is_read: 0 } : { recipient: recipientId });
  }

  /** NT12/NT13 — `SELECT COUNT(*) ... WHERE recipient_id = ? AND is_read = 0`, the same predicate `listInApp`'s `unread_count` and the standalone `unreadCount` method both need. */
  async countUnreadForRecipient(recipientId: number): Promise<number> {
    return await this.count({ recipient: recipientId, is_read: 0 });
  }

  /** NT14/NT15 — `markRead`/`markUnread`: `UPDATE notifications SET is_read = ? WHERE id = ? AND recipient_id = ?`. Returns the affected-row count (0 or 1). */
  async setRead(id: number, recipientId: number, isRead: 0 | 1): Promise<number> {
    return await this.nativeUpdate({ id, recipient: recipientId }, { is_read: isRead });
  }

  /** NT16 — `markAllRead`: `UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0`. */
  async markAllRead(recipientId: number): Promise<number> {
    return await this.nativeUpdate({ recipient: recipientId, is_read: 0 }, { is_read: 1 });
  }

  /** NT17 — `deleteOne`: `DELETE FROM notifications WHERE id = ? AND recipient_id = ?`. */
  async deleteForRecipient(id: number, recipientId: number): Promise<number> {
    return await this.nativeDelete({ id, recipient: recipientId });
  }

  /** NT18 — `deleteAll`: `DELETE FROM notifications WHERE recipient_id = ?`. */
  async deleteAllForRecipient(recipientId: number): Promise<number> {
    return await this.nativeDelete({ recipient: recipientId });
  }

  /**
   * NT20 — `respond`'s atomic claim, preserved byte-exact: `UPDATE
   * notifications SET response = ?, is_read = 1 WHERE id = ? AND
   * recipient_id = ? AND response IS NULL`. `response: null` in the filter
   * compiles to `response IS NULL` (MikroORM's standard null-filter
   * semantics) — only updates, and only returns a nonzero count, if no
   * concurrent responder has already claimed this notification. This is the
   * security-critical double-submit fix (R8): claim BEFORE the handler runs,
   * so a concurrent second call's UPDATE affects 0 rows and can never
   * execute the callback action a second time.
   */
  async claimResponse(id: number, recipientId: number, response: string): Promise<number> {
    return await this.nativeUpdate({ id, recipient: recipientId, response: null }, { response, is_read: 1 });
  }

  /** NT21 — `respond`'s handler-failure release: `UPDATE notifications SET response = NULL, is_read = ? WHERE id = ? AND recipient_id = ?`, restoring the claim so the user can retry. */
  async releaseResponse(id: number, recipientId: number, isRead: number | null): Promise<void> {
    await this.nativeUpdate({ id, recipient: recipientId }, { response: null, is_read: isRead });
  }
}
