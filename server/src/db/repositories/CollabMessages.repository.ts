import type { CollabMessages } from '../entities/CollabMessages.entity';
import type { TripFileRow } from './TripFiles.repository';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `collab_messages` row — every scalar column of the entity, incl. the three `persist(false)` mirrors (`trip_id`, `user_id`, `reply_to`). */
export interface CollabMessageRow {
  id: number;
  trip_id: number;
  user_id: number;
  text: string;
  reply_to: number | null;
  created_at: string | null;
  deleted: number | null;
}

const _collabMessageRowKeys: AssertRowKeys<CollabMessageRow, CollabMessages> = true;

/** CB45/CB50's joined projection — `m.*, u.username, u.avatar, reply_text, reply_username`. */
export interface CollabMessageJoinRow extends CollabMessageRow {
  username: string;
  avatar: string | null;
  reply_text: string | null;
  reply_username: string | null;
}

/** {@link CollabMessagesRepository.listPublicForShare}'s projection (SH16) — `m.*, u.username, u.avatar` only. */
export interface SharePublicCollabMessageRow extends CollabMessageRow {
  username: string;
  avatar: string | null;
}

interface CollabMessagesKyselyDB {
  collab_messages: CollabMessageRow;
  users: { id: number; username: string; avatar: string | null };
}

/** Only the `trip_files` columns the message-attachment methods below touch — the `CollabNotesRepository` class docstring explains why they live on the OWNING collab entity's repository rather than on `TripFilesRepository`. */
interface MessageAttachmentsKyselyDB {
  trip_files: TripFileRow;
}

/** CB43's narrow attachment projection (`formatMessage`'s hydration read). `message_id` keeps `TripFileRow`'s own nullable typing even though the WHERE clause below always matches a non-null value — no narrowing cast. */
export interface MessageAttachmentRow {
  id: number;
  trip_id: number;
  message_id: number | null;
  filename: string;
  original_name: string;
  file_size: number | null;
  mime_type: string | null;
}

/** CB49's insert-only shape — every OTHER `trip_files` column is autoincrement/nullable-defaulted and omitted, matching the legacy statement's own seven-column list (the `NoteAttachmentInsertKyselyDB` precedent, `CollabNotes.repository.ts`). */
interface MessageAttachmentInsertKyselyDB {
  trip_files: {
    trip_id: number | string;
    message_id: number | string;
    filename: string;
    original_name: string;
    file_size: number;
    mime_type: string;
    uploaded_by: number;
  };
}

/**
 * `collab_messages` — trip chat, plus (second half of this class) the
 * `trip_files` rows a message owns as attachments. Kysely throughout for
 * `collab_messages` itself: `trip_id`/`user_id`/`reply_to` are
 * `persist(false)` mirrors (the `TripFilesRepository` class docstring's
 * trap).
 */
export class CollabMessagesRepository extends TrekRepository<CollabMessages> {
  /**
   * CB45/CB50's shared shape — `m.*, u.username, u.avatar, CASE WHEN
   * rm.deleted = 1 THEN '' ELSE rm.text END AS reply_text, ru.username AS
   * reply_username FROM collab_messages m JOIN users u ON m.user_id = u.id
   * LEFT JOIN collab_messages rm ON m.reply_to = rm.id LEFT JOIN users ru ON
   * rm.user_id = ru.id`. A genuine self-join (`rm`/`ru` are second aliases
   * of `collab_messages`/`users`), expressed as a second Kysely alias rather
   * than the ORM's `replyToRef` relation: `CollabMessages.entity.ts` DOES
   * have a real `replyToRef` manyToOne(CollabMessages) relation (Task 0's
   * dialect finding, `progress.md`), but populating it through the
   * QueryBuilder would hydrate a full `CollabMessages` entity for the reply
   * (and a SEPARATE query/join for `ru.username`, since `replyToRef` doesn't
   * carry the reply's own author's username) rather than the two flat scalar
   * columns (`reply_text`, `reply_username`) this statement actually
   * projects — the `Reservations.repository.ts#listUpcomingForUser`
   * self-join precedent (`reservations as r2`) is the exact same shape:
   * Kysely, not a relation walk, for a flat projected self-join.
   */
  private joinedQuery() {
    return this.kysely<CollabMessagesKyselyDB>()
      .selectFrom('collab_messages as m')
      .innerJoin('users as u', 'u.id', 'm.user_id')
      .leftJoin('collab_messages as rm', 'rm.id', 'm.reply_to')
      .leftJoin('users as ru', 'ru.id', 'rm.user_id')
      .selectAll('m')
      .select((eb) => [
        'u.username',
        'u.avatar',
        eb.case().when('rm.deleted', '=', 1).then('').else(eb.ref('rm.text')).end().as('reply_text'),
        'ru.username as reply_username',
      ]);
  }

  /**
   * CB45 (`listMessages`) — the joined shape above, `WHERE m.trip_id = ?[
   * AND m.id < ?] ORDER BY m.id DESC LIMIT 100`. `before` undefined omits
   * the cursor filter entirely (matching the legacy's conditional extra
   * param), not `>= 0`/`null` — the same shape the legacy ternary between
   * two whole query strings expressed.
   */
  async listForTrip(trip_id: number, before?: number): Promise<CollabMessageJoinRow[]> {
    let q = this.joinedQuery().where('m.trip_id', '=', trip_id);
    if (before !== undefined) q = q.where('m.id', '<', before);
    return await q.orderBy('m.id', 'desc').limit(100).execute();
  }

  /** CB50 (`createMessage`'s post-tx re-select) — the joined shape above, `WHERE m.id = ?`, no trip filter (the caller just wrote this exact id inside the transaction). */
  async findWithReply(id: number): Promise<CollabMessageJoinRow | undefined> {
    return await this.joinedQuery().where('m.id', '=', id).executeTakeFirst();
  }

  /**
   * `share.service.ts:400` SH16 (`getSharedTripData`'s share_collab read) —
   * `SELECT m.*, u.username, u.avatar FROM collab_messages m JOIN users u
   * ON m.user_id = u.id WHERE m.trip_id = ? AND m.deleted = 0 ORDER BY
   * m.created_at`. A narrower projection than {@link joinedQuery} above (no
   * `reply_text`/`reply_username` — a public share viewer never resolves a
   * reply thread through this read) and a different order/shape than
   * `listForTrip` (ascending, no cursor, no `LIMIT`).
   */
  async listPublicForShare(trip_id: number): Promise<SharePublicCollabMessageRow[]> {
    return await this.kysely<CollabMessagesKyselyDB>()
      .selectFrom('collab_messages as m')
      .innerJoin('users as u', 'u.id', 'm.user_id')
      .selectAll('m')
      .select(['u.username', 'u.avatar'])
      .where('m.trip_id', '=', trip_id)
      .where('m.deleted', '=', 0)
      .orderBy('m.created_at', 'asc')
      .execute();
  }

  /**
   * CB2/CB51 (`reactMessage`'s existence guard, `deleteMessage`'s
   * trip-scoping + owner-check read) — `SELECT * FROM collab_messages WHERE
   * id = ? AND trip_id = ?` (CB2's own text is `SELECT id FROM ...`, a
   * narrower projection of the SAME WHERE — reading the full row for both
   * call sites is behaviourally identical since CB2 only tests truthiness).
   * `SELECT *` here has NO `username` column (`collab_messages` alone, no
   * join) — `deleteMessage`'s legacy `return { username: message.username
   * }` reads a column this statement never selected; see the `CollabService
   * .deleteMessage` docstring for how that pre-existing gap is preserved.
   */
  async findInTrip(id: number, trip_id: number): Promise<CollabMessageRow | undefined> {
    return await this.kysely<CollabMessagesKyselyDB>()
      .selectFrom('collab_messages')
      .selectAll()
      .where('id', '=', id)
      .where('trip_id', '=', trip_id)
      .executeTakeFirst();
  }

  /** CB47 (`createMessage`'s reply-target validation) — `SELECT id FROM collab_messages WHERE id = ? AND trip_id = ? AND deleted = 0`. A soft-deleted message is gone as far as anyone replying is concerned. */
  async findActiveInTrip(id: number, trip_id: number): Promise<{ id: number } | undefined> {
    return await this.kysely<CollabMessagesKyselyDB>()
      .selectFrom('collab_messages')
      .select(['id'])
      .where('id', '=', id)
      .where('trip_id', '=', trip_id)
      .where('deleted', '=', 0)
      .executeTakeFirst();
  }

  /** CB44 (`countMessages`) — `SELECT COUNT(*) as cnt FROM collab_messages WHERE trip_id = ?`. */
  async countForTrip(trip_id: number): Promise<number> {
    return await this.count({ trip: trip_id });
  }

  /** CB48 (`createMessage`, inside its transaction) — `INSERT INTO collab_messages (trip_id, user_id, text, reply_to) VALUES (?×4)`. Returns the new row's id. */
  async insertMessage(
    trip_id: number | string,
    user_id: number,
    text: string,
    reply_to: number | null,
  ): Promise<number> {
    return await this.insert({ trip: trip_id, user: user_id, text, reply_to });
  }

  /** CB54 (`deleteMessage`, inside its transaction) — `UPDATE collab_messages SET deleted = 1 WHERE id = ?`, soft delete — the row survives for the placeholder. */
  async softDelete(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { deleted: 1 });
  }

  // -------------------------------------------------------------------------
  // Message attachments (`trip_files` scoped by `message_id`) — see
  // `CollabNotesRepository`'s class docstring for why these live here
  // rather than on `TripFilesRepository`.
  // -------------------------------------------------------------------------

  /** CB43 (`formatMessage`'s hydration read) — `SELECT id, trip_id, message_id, filename, original_name, file_size, mime_type FROM trip_files WHERE message_id = ? AND trip_id = ? AND deleted_at IS NULL ORDER BY id ASC`. */
  async listAttachmentsForMessage(message_id: number, trip_id: number): Promise<MessageAttachmentRow[]> {
    return await this.kysely<MessageAttachmentsKyselyDB>()
      .selectFrom('trip_files')
      .select(['id', 'trip_id', 'message_id', 'filename', 'original_name', 'file_size', 'mime_type'])
      .where('message_id', '=', message_id)
      .where('trip_id', '=', trip_id)
      .where('deleted_at', 'is', null)
      .orderBy('id', 'asc')
      .execute();
  }

  /**
   * CB49 (`createMessage`, inside its transaction, once per uploaded file) —
   * `INSERT INTO trip_files (trip_id, message_id, filename, original_name,
   * file_size, mime_type, uploaded_by) VALUES (?×7)`.
   */
  async insertAttachmentForMessage(row: {
    trip_id: number | string;
    message_id: number | string;
    filename: string;
    original_name: string;
    file_size: number;
    mime_type: string;
    uploaded_by: number;
  }): Promise<void> {
    await this.kysely<MessageAttachmentInsertKyselyDB>()
      .insertInto('trip_files')
      .values({
        trip_id: row.trip_id,
        message_id: row.message_id,
        filename: row.filename,
        original_name: row.original_name,
        file_size: row.file_size,
        mime_type: row.mime_type,
        uploaded_by: row.uploaded_by,
      })
      .execute();
  }

  /** CB52 (`deleteMessage`'s pre-tx storage-cleanup list) — `SELECT filename FROM trip_files WHERE message_id = ? AND trip_id = ?`, run BEFORE the transaction (the legacy ordering). */
  async listFilenamesForMessage(message_id: number, trip_id: number): Promise<{ filename: string }[]> {
    return await this.kysely<MessageAttachmentsKyselyDB>()
      .selectFrom('trip_files')
      .select(['filename'])
      .where('message_id', '=', message_id)
      .where('trip_id', '=', trip_id)
      .execute();
  }

  /** CB53 (`deleteMessage`, inside its transaction, before CB54) — `DELETE FROM trip_files WHERE message_id = ? AND trip_id = ?`. */
  async deleteAttachmentsForMessage(message_id: number, trip_id: number): Promise<void> {
    await this.kysely<MessageAttachmentsKyselyDB>()
      .deleteFrom('trip_files')
      .where('message_id', '=', message_id)
      .where('trip_id', '=', trip_id)
      .execute();
  }
}
