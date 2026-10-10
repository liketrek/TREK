import { currentTimestamp } from '../dialect/sql-functions';
import type { CollabNotes } from '../entities/CollabNotes.entity';
import type { DB } from '../kysely/db';
import type { TripFileRow } from './TripFiles.repository';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `collab_notes` row — every scalar column of the entity, incl. the two `persist(false)` relation mirrors (`trip_id`, `user_id`). */
export interface CollabNoteRow {
  id: number;
  trip_id: number;
  user_id: number;
  category: string | null;
  title: string;
  content: string | null;
  color: string | null;
  pinned: number | null;
  created_at: string | null;
  updated_at: string | null;
  website: string | null;
}

const _collabNoteRowKeys: AssertRowKeys<CollabNoteRow, CollabNotes> = true;

/** CB7/CB9/CB12/CB20's joined projection — `n.*, u.username, u.avatar`. */
export interface CollabNoteJoinRow extends CollabNoteRow {
  username: string;
  avatar: string | null;
}

/** CB6's narrow attachment projection (`formatNote`'s hydration read). */
export interface NoteAttachmentRow {
  id: number;
  filename: string;
  original_name: string;
  file_size: number | null;
  mime_type: string | null;
}

type CollabNotesKyselyDB = Pick<DB, 'collab_notes' | 'users'>;

/** The `trip_files` table the note-attachment methods below touch (see the class docstring's second half). */
type NoteAttachmentsKyselyDB = Pick<DB, 'trip_files'>;

/**
 * CB18's insert table. It binds the legacy statement's own six-column list;
 * `id`/`place_id`/`reservation_id`/`description`/`created_at`/`uploaded_by`/
 * `starred`/`deleted_at`/`message_id` stay unbound, and the columns the statement leaves out (the rowid, defaulted and nullable ones) are `InsertOptional` in the generated type, so `.values()` may omit them.
 */
type NoteAttachmentInsertKyselyDB = Pick<DB, 'trip_files'>;

/**
 * `collab_notes` — shared trip notes, plus (second half of this class) the
 * `trip_files` rows a note owns as attachments.
 *
 * Kysely throughout for `collab_notes` itself: `trip_id`/`user_id` are
 * `persist(false)` mirrors (the `TripFilesRepository` class docstring's
 * trap), so a bare QueryBuilder `.select([...])` silently drops them —
 * `selectAll()`/a typed column list reads the real DB columns directly.
 *
 * **Why the note-attachment methods (CB6/CB14/CB15/CB18/CB19/CB21/CB22) live
 * here instead of on `TripFilesRepository`.** The inventory's own proposal
 * (`plan3e-sql-inventory.md` §4's "Proposed repositories" note) expected
 * `TripFilesRepository` to grow `listForNote`/`deleteForNote`/`findScoped`/
 * `listForMessage`/`insertForMessage`/`deleteForMessage`. Task 1 (files)
 * landed first (`399ca58a7`) and did NOT add those — its report lists only
 * `findInTrip`/`findDeletedInTrip`/`listForTrip`/`findByIdWithJoins`/
 * `listTrashed`/`insertFile`/`updateFile`/`setStarred`/`softDelete`/
 * `restore`/`deleteById`/`deleteMany`, none scoped by `note_id`/`message_id`.
 * `TripFiles.repository.ts` is Task 1's named file and this task's brief
 * says "you read TripFilesRepository..., you do not edit them" — so rather
 * than editing a landed, other-task-owned file, the note-scoped queries are
 * expressed here (and the message-scoped twins on `CollabMessages
 * .repository.ts`) via `this.kysely()` against the `trip_files` table
 * directly, the same "a repository touches more than its own table via
 * Kysely" shape `TripFilesRepository.joinedQuery` itself uses for
 * `reservations`/`users`. `TripFileRow`'s TYPE is imported (read-only) from
 * `TripFiles.repository.ts` for column-shape parity — no write to that file.
 * Flagged in the task-5 report as a deviation from the inventory's proposal,
 * not a defect.
 */
export class CollabNotesRepository extends TrekRepository<CollabNotes> {
  private joinedQuery() {
    return this.kysely<CollabNotesKyselyDB>()
      .selectFrom('collab_notes as n')
      .innerJoin('users as u', 'u.id', 'n.user_id')
      .selectAll('n')
      .select(['u.username', 'u.avatar']);
  }

  /**
   * CB7 (`CollabService.listNotes`) — `SELECT n.*, u.username, u.avatar FROM
   * collab_notes n JOIN users u ON n.user_id = u.id WHERE n.trip_id = ?
   * ORDER BY n.pinned DESC, n.updated_at DESC`. `trip_id: number`: the
   * service resolves the route's `string | number` id via `toRowId` before
   * calling (rule 15), same as every other read below — a malformed id
   * short-circuits to the "not found"/empty legacy result without reaching
   * this query at all.
   */
  async listForTrip(trip_id: number): Promise<CollabNoteJoinRow[]> {
    return await this.joinedQuery()
      .where('n.trip_id', '=', trip_id)
      .orderBy('n.pinned', 'desc')
      .orderBy('n.updated_at', 'desc')
      .execute();
  }

  /** CB10/CB13/CB17 (`updateNote`/`deleteNote`/`addNoteFile`'s shared trip-scoping guard) — `SELECT * FROM collab_notes WHERE id = ? AND trip_id = ?`, same text at all three call sites. */
  async findInTrip(id: number, trip_id: number): Promise<CollabNoteRow | undefined> {
    return await this.kysely<CollabNotesKyselyDB>()
      .selectFrom('collab_notes')
      .selectAll()
      .where('id', '=', id)
      .where('trip_id', '=', trip_id)
      .executeTakeFirst();
  }

  /** CB9/CB12 (`createNote`'s post-insert re-select, `updateNote`'s post-write re-select) — `SELECT n.*, u.username, u.avatar FROM collab_notes n JOIN users u ON n.user_id = u.id WHERE n.id = ?`, no trip filter (the caller already knows `id` is in-scope, having just written it). */
  async findWithUser(id: number): Promise<CollabNoteJoinRow | undefined> {
    return await this.joinedQuery().where('n.id', '=', id).executeTakeFirst();
  }

  /** CB20 (`getFormattedNoteById`) — same shape as {@link findWithUser} plus the trip scope (`n.trip_id = ?`) the legacy statement adds at this one call site (the post-migration hardening the class docstring on `CollabService` describes). */
  async findWithUserInTrip(id: number, trip_id: number): Promise<CollabNoteJoinRow | undefined> {
    return await this.joinedQuery().where('n.id', '=', id).where('n.trip_id', '=', trip_id).executeTakeFirst();
  }

  /** CB8 (`createNote`) — `INSERT INTO collab_notes (trip_id, user_id, title, content, category, color, website, pinned) VALUES (?×8)`. The service resolves the `|| null`/`|| 'General'`/`|| '#6366f1'` defaults before calling (D2's split). Returns the new row's id. */
  async insertNote(row: {
    trip_id: number | string;
    user_id: number;
    title: string;
    content: string | null;
    category: string;
    color: string;
    website: string | null;
    pinned: number;
  }): Promise<number> {
    return await this.insert({
      trip: row.trip_id,
      user: row.user_id,
      title: row.title,
      content: row.content,
      category: row.category,
      color: row.color,
      website: row.website,
      pinned: row.pinned,
    });
  }

  /**
   * CB11 (`updateNote`) — the 6-column `UPDATE collab_notes SET title =
   * COALESCE(?, title), content = CASE WHEN ? THEN ? ELSE content END,
   * category = COALESCE(?, category), color = COALESCE(?, color), pinned =
   * CASE WHEN ? IS NOT NULL THEN ? ELSE pinned END, website = CASE WHEN ?
   * THEN ? ELSE website END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`.
   *
   * The `Reservations.repository.ts#updateReservation` / `PlacesRepository
   * #updatePlace` precedent (RS41/PL11): the SERVICE resolves every
   * COALESCE-keep and presence-sentinel column to its FINAL value first (it
   * already holds the pre-image via `findInTrip`'s CB10 read every caller
   * makes) — this method just writes what it is handed, no SQL-side
   * COALESCE/CASE. R11 names a shared "presence-sentinel helper" other Plan
   * 3e tasks (2/3/4) should copy; at the time this task ran, Task 2 (budget)
   * had not landed yet (`progress.md`'s task table), so there was no landed
   * helper to copy — this repeats the ALREADY-LANDED RS41/PL11 read-merge-
   * write shape from Plans 3c/3d directly instead of inventing a new raw-SQL
   * `CASE` helper, and this class docstring records that choice for
   * whichever task reads it next.
   */
  async update(
    id: number,
    write: {
      title: string;
      content: string | null;
      category: string | null;
      color: string | null;
      pinned: number | null;
      website: string | null;
    },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        title: write.title,
        content: write.content,
        category: write.category,
        color: write.color,
        pinned: write.pinned,
        website: write.website,
        updated_at: currentTimestamp(platform),
      },
    );
  }

  /** CB16 (`deleteNote`, inside its transaction, after CB15's attachment sweep) — `DELETE FROM collab_notes WHERE id = ?`. */
  async delete(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  // -------------------------------------------------------------------------
  // Note attachments (`trip_files` scoped by `note_id`) — see the class
  // docstring's second half for why these live here rather than on
  // `TripFilesRepository`.
  // -------------------------------------------------------------------------

  /**
   * CB6 (`formatNote`'s hydration read): `SELECT id, filename, original_name,
   * file_size, mime_type FROM trip_files WHERE note_id = ? AND deleted_at IS
   * NULL`. A note's file can be moved to the trash from the file manager; it
   * leaves the note then, as a chat attachment leaves its message.
   */
  async listAttachmentsForNote(note_id: number): Promise<NoteAttachmentRow[]> {
    return await this.kysely<NoteAttachmentsKyselyDB>()
      .selectFrom('trip_files')
      .select(['id', 'filename', 'original_name', 'file_size', 'mime_type'])
      .where('note_id', '=', note_id)
      .where('deleted_at', 'is', null)
      .execute();
  }

  /** CB14 (`deleteNote`'s pre-tx storage-cleanup list) — `SELECT id, filename FROM trip_files WHERE note_id = ?`, run BEFORE the transaction (the legacy ordering: the storage deletes happen outside/before the DB transaction). */
  async listFilenamesForNote(note_id: number): Promise<{ id: number; filename: string }[]> {
    return await this.kysely<NoteAttachmentsKyselyDB>()
      .selectFrom('trip_files')
      .select(['id', 'filename'])
      .where('note_id', '=', note_id)
      .execute();
  }

  /** CB15 (`deleteNote`, inside its transaction, before CB16) — `DELETE FROM trip_files WHERE note_id = ?`. */
  async deleteAttachmentsForNote(note_id: number): Promise<void> {
    await this.kysely<NoteAttachmentsKyselyDB>().deleteFrom('trip_files').where('note_id', '=', note_id).execute();
  }

  /**
   * CB18 (`addNoteFile`'s insert half) — `INSERT INTO trip_files (trip_id,
   * note_id, filename, original_name, file_size, mime_type) VALUES (?×6)`.
   * Returns the new row's id (read back with `RETURNING id`, which every
   * supported engine answers, unlike `InsertResult.insertId`) for CB19's
   * re-select.
   */
  async insertAttachmentForNote(row: {
    trip_id: number | string;
    note_id: number | string;
    filename: string;
    original_name: string;
    file_size: number;
    mime_type: string;
  }): Promise<number> {
    const inserted = await this.kysely<NoteAttachmentInsertKyselyDB>()
      .insertInto('trip_files')
      .values({
        trip_id: row.trip_id as number,
        note_id: row.note_id as number,
        filename: row.filename,
        original_name: row.original_name,
        file_size: row.file_size,
        mime_type: row.mime_type,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  /** CB19 (`addNoteFile`'s re-select, immediately after {@link insertAttachmentForNote}) — `SELECT * FROM trip_files WHERE id = ?`, unscoped (the caller just wrote this exact id). */
  async findAttachmentById(id: number): Promise<TripFileRow | undefined> {
    return await this.kysely<NoteAttachmentsKyselyDB>()
      .selectFrom('trip_files')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * CB21 (`deleteNoteFile`) — `SELECT * FROM trip_files WHERE id = ? AND
   * note_id = ? AND trip_id = ?`. **IDOR guard, security-critical**: all
   * three scoping columns in ONE query, never split into separate existence
   * checks a caller could satisfy independently (the legacy doc comment's
   * own warning, task-5-brief.md's explicit instruction) — this ties the
   * deleted object to the URL's `:tripId` the controller already
   * access-checked, not just to a note/file id an attacker can enumerate.
   */
  async findScopedForNote(id: number, note_id: number, trip_id: number): Promise<TripFileRow | undefined> {
    return await this.kysely<NoteAttachmentsKyselyDB>()
      .selectFrom('trip_files')
      .selectAll()
      .where('id', '=', id)
      .where('note_id', '=', note_id)
      .where('trip_id', '=', trip_id)
      .executeTakeFirst();
  }

  /** CB22 (`deleteNoteFile`, after the IDOR-guarded read and the storage delete) — `DELETE FROM trip_files WHERE id = ?`. */
  async deleteAttachmentById(id: number): Promise<void> {
    await this.kysely<NoteAttachmentsKyselyDB>().deleteFrom('trip_files').where('id', '=', id).execute();
  }
}
