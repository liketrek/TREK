import type { FileLinks } from '../entities/FileLinks.entity';
import type { DB } from '../kysely/db';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `file_links` row — every scalar column of the entity, incl. its five `persist(false)` relation mirrors. */
export interface FileLinkRow {
  id: number;
  file_id: number;
  reservation_id: number | null;
  assignment_id: number | null;
  place_id: number | null;
  created_at: string | null;
  budget_item_id: number | null;
}

const _fileLinkRowKeys: AssertRowKeys<FileLinkRow, FileLinks> = true;

/** FL27's joined projection (`getFileLinks`). */
export interface FileLinkWithReservationRow extends FileLinkRow {
  reservation_title: string | null;
}

/** FL8's narrow batch projection (`listFiles`'s link lookup). */
export interface FileLinkTargetRow {
  file_id: number;
  reservation_id: number | null;
  place_id: number | null;
  budget_item_id: number | null;
}

type FileLinksKyselyDB = Pick<DB, 'file_links' | 'reservations'>;

/**
 * The insert's table. `id`/`created_at` are autoincrement/`DEFAULT
 * CURRENT_TIMESTAMP` and omitted from `.values()` below (the legacy
 * statement's own column list omits them too). Both are `InsertOptional` in
 * the generated type, which keeps them optional for the insert while every
 * SELECT still reads them as present.
 */
type FileLinksWriteKyselyDB = Pick<DB, 'file_links'>;

/**
 * `file_links` — the many-to-many between a `trip_files` row and the
 * reservation/assignment/place/budget-expense it points at. Kysely
 * throughout, same reasoning as `TripFilesRepository`'s class docstring
 * (five `persist(false)` mirrors on this entity too), and because the
 * `INSERT OR IGNORE` write below has no `em.upsert`-expressible single
 * conflict target (four independent partial-unique indexes, only one of
 * which any given insert touches) — Kysely's target-less `ON CONFLICT DO
 * NOTHING` is the exact SQLite equivalent of `OR IGNORE`, ignoring
 * whichever constraint the row happens to violate, matching the legacy
 * statement precisely (`Tags.repository.ts#insertIgnore`'s explicit-target
 * precedent is the WRONG shape here — that pivot has exactly one unique key).
 */
export class FileLinksRepository extends TrekRepository<FileLinks> {
  /**
   * FL8 (`FilesService.listFiles`'s link batch) — `SELECT file_id,
   * reservation_id, place_id, budget_item_id FROM file_links WHERE file_id
   * IN (dynamic)`. Empty `file_ids` short-circuits before any query,
   * matching the legacy service's own guard.
   */
  async listForFiles(file_ids: number[]): Promise<FileLinkTargetRow[]> {
    if (file_ids.length === 0) return [];
    return await this.kysely<FileLinksKyselyDB>()
      .selectFrom('file_links')
      .select(['file_id', 'reservation_id', 'place_id', 'budget_item_id'])
      .where('file_id', 'in', file_ids)
      .execute();
  }

  /**
   * FL10/FL13/FL24 (`createFile`'s conditional insert, `updateFile`'s
   * conditional insert, `createFileLink`) — `INSERT OR IGNORE INTO
   * file_links (file_id, reservation_id, assignment_id, place_id,
   * budget_item_id) VALUES (?×5)`, the same statement shape at all three
   * legacy sites (FL10/FL13 pass only `budget_item_id`; FL24 passes any
   * combination the caller supplies) — one method, not three.
   */
  async insertIgnore(row: {
    file_id: number;
    reservation_id?: number | null;
    assignment_id?: number | null;
    place_id?: number | null;
    budget_item_id?: number | null;
  }): Promise<void> {
    await this.kysely<FileLinksWriteKyselyDB>()
      .insertInto('file_links')
      .values({
        file_id: row.file_id,
        reservation_id: row.reservation_id ?? null,
        assignment_id: row.assignment_id ?? null,
        place_id: row.place_id ?? null,
        budget_item_id: row.budget_item_id ?? null,
      })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  /** FL14 (`FilesService.updateFile`'s conditional clear) — `DELETE FROM file_links WHERE file_id = ? AND budget_item_id IS NOT NULL`. */
  async clearBudgetLink(file_id: number): Promise<void> {
    await this.kysely<FileLinksKyselyDB>()
      .deleteFrom('file_links')
      .where('file_id', '=', file_id)
      .where('budget_item_id', 'is not', null)
      .execute();
  }

  /** FL26 (`FilesService.deleteFileLink`) — `DELETE FROM file_links WHERE id = ? AND file_id = ?`. */
  async deleteById(id: number, file_id: number): Promise<void> {
    await this.kysely<FileLinksKyselyDB>()
      .deleteFrom('file_links')
      .where('id', '=', id)
      .where('file_id', '=', file_id)
      .execute();
  }

  /** FL25 (`createFileLink`'s bare re-select) — `SELECT * FROM file_links WHERE file_id = ?`. */
  async listForFile(file_id: number): Promise<FileLinkRow[]> {
    return await this.kysely<FileLinksKyselyDB>()
      .selectFrom('file_links')
      .selectAll()
      .where('file_id', '=', file_id)
      .execute();
  }

  /** FL27 (`FilesService.getFileLinks`) — `SELECT fl.*, r.title as reservation_title FROM file_links fl LEFT JOIN reservations r ON fl.reservation_id = r.id WHERE fl.file_id = ?`. */
  async listForFileWithReservationTitle(file_id: number): Promise<FileLinkWithReservationRow[]> {
    return await this.kysely<FileLinksKyselyDB>()
      .selectFrom('file_links as fl')
      .leftJoin('reservations as r', 'r.id', 'fl.reservation_id')
      .selectAll('fl')
      .select(['r.title as reservation_title'])
      .where('fl.file_id', '=', file_id)
      .execute();
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 5 (doc-sync) — cross-domain additive method, flagged per the
  // task brief (DS16 is cross-domain).
  // ---------------------------------------------------------------------------

  /**
   * DS16 (`DocSyncService.pull`, inside `uow.transactional`, the "gone"
   * branch) — `INSERT OR IGNORE INTO file_links (file_id, reservation_id,
   * assignment_id, place_id, budget_item_id) SELECT ?, reservation_id,
   * assignment_id, place_id, budget_item_id FROM file_links WHERE file_id =
   * ?` — a genuine `INSERT ... SELECT`, copying every link the SUPERSEDED
   * file held onto the new file that replaces it (a provider edit that
   * bumped the version), so the booking/place/budget attachment follows the
   * new revision. `INSERT OR IGNORE` because the new file may already hold
   * one of the same links (an earlier partial run) — `ON CONFLICT DO
   * NOTHING` targetless, same reasoning as {@link insertIgnore}'s own
   * docstring (four independent partial-unique indexes, only one of which
   * any given copied row happens to touch).
   */
  async copySelectIgnore(newFileId: number, fromFileId: number): Promise<void> {
    await this.kysely<FileLinksWriteKyselyDB>()
      .insertInto('file_links')
      .columns(['file_id', 'reservation_id', 'assignment_id', 'place_id', 'budget_item_id'])
      .expression((eb) =>
        eb
          .selectFrom('file_links')
          .select([eb.val(newFileId).as('file_id'), 'reservation_id', 'assignment_id', 'place_id', 'budget_item_id'])
          .where('file_id', '=', fromFileId),
      )
      .onConflict((oc) => oc.doNothing())
      .execute();
  }
}
