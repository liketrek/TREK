import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Readable } from 'node:stream';
import type { Request } from 'express';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import { avatarUrl } from '../common/avatarUrl';
import { EphemeralTokenService } from '../auth/ephemeral-token.service';
import { verifyJwtAndLoadUser } from '../auth/jwt-verify';
import { EntityManager } from '@mikro-orm/core';
import { Users } from '../../db/entities/Users.entity';
import type { User } from '../../types';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { UnitOfWork } from '../database/unit-of-work';
import { toRowId } from '../common/row-id';
import { StorageService } from '../storage/storage.service';
import { StorageNotFoundError, StorageInvalidKeyError, type ObjectStat } from '../storage/storage.types';
import { TripFiles } from '../../db/entities/TripFiles.entity';
import type { TripFilesRepository, TripFileRow, TripFileJoinRow } from '../../db/repositories/TripFiles.repository';
import { FileLinks } from '../../db/entities/FileLinks.entity';
import type { FileLinksRepository, FileLinkTargetRow } from '../../db/repositories/FileLinks.repository';
import { Reservations } from '../../db/entities/Reservations.entity';
import type { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import type { DayAssignmentsRepository } from '../../db/repositories/DayAssignments.repository';
import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import type { BudgetItemsRepository } from '../../db/repositories/BudgetItems.repository';

type Trip = TripAccess;
type FilePermission = 'file_upload' | 'file_edit' | 'file_delete';

function formatFile(file: TripFileJoinRow) {
  const tripId = file.trip_id;
  return {
    ...file,
    url: `/api/trips/${tripId}/files/${file.id}/download`,
    uploaded_by_avatar: avatarUrl({ avatar: file.uploaded_by_avatar }),
  };
}

export interface FileLink {
  file_id: number;
  reservation_id: number | null;
  place_id: number | null;
  budget_item_id: number | null;
}

/**
 * Decoded bytes one non-HTTP caller may pull out of a file in a single read.
 * The browser download streams instead and is not bound by this.
 */
export const FILE_CONTENT_MAX = 10 * 1024 * 1024;

/** Why a content read was refused. Each caller maps it onto its own error shape. */
export type FileContentRefusal = 'not-found' | 'too-large' | 'not-accessible';

export class FileContentError extends Error {
  constructor(readonly reason: FileContentRefusal, message: string) {
    super(message);
  }
}

/**
 * A truthy, non-canonical link-target id is narrowed to `null` (rule 15's
 * accepted deviation, applied everywhere a foreign-key id from the wire
 * reaches a typed repository write): the legacy statements bound the raw
 * value straight into `WHERE id = ? AND trip_id = ?`/an INSERT column and
 * let SQLite's loose affinity or a constraint failure decide, matching
 * `|| null` on falsy. A falsy value (`0`/`''`/`null`/`undefined`) always
 * meant "no link" and still does; a truthy value that isn't a canonical
 * decimal id now also resolves to "no link" instead of whatever SQLite's
 * affinity would have matched or thrown on.
 */
function coerceLinkId(value: string | number | null | undefined): number | null {
  if (!value) return null;
  return toRowId(value);
}

/**
 * File domain service — owns the file SQL (moved 1:1 from the legacy
 * services/fileService.ts: identical statements, the `||` falsy-coercion
 * defaults, the post-write FILE_SELECT re-selects, the dynamic IN batches and
 * the unlink-first delete semantics; Plan 3e Task 1 moved the SQL itself onto
 * `TripFilesRepository`/`FileLinksRepository`). Trip access goes through the
 * injected DatabaseService's canAccessTrip (the legacy verifyTripAccess
 * re-export was a plain wrapper over the same helper); the file_*
 * permissions, path-resolution guard, download-token auth and WebSocket
 * broadcasts are unchanged. The load-time constants live in files.constants.ts;
 * the admin allowed-types live-read is AllowedFileTypesService (the single
 * query owner since the storage slice-2 consolidation).
 *
 * Two deliberate post-migration fixes over the legacy behavior, carried
 * unchanged from the pre-repository version: createFileLink no longer
 * swallows insert errors, and updateFile coerces an empty-string description
 * to NULL exactly like createFile does.
 *
 * **R2 (Plan 3e, flagged behaviour change — failure atomicity):** `files`
 * was the one domain in this cluster with ZERO `uow.transactional` calls
 * despite three genuinely multi-statement writes (`createFile`+its
 * conditional `file_links` insert, `updateFile`+its conditional
 * `file_links` insert/delete, `emptyTrash`'s DB-only bulk delete). Every
 * sibling domain already carries this fix from its own 2026-08 fold; files
 * never got it. `createFile`, `updateFile` and `emptyTrash`'s bulk delete
 * now run inside `uow.transactional` — a failed second statement no longer
 * leaves an orphaned `trip_files` row with no matching `file_links` row (or
 * vice versa). The storage I/O in `permanentDeleteFile`/`emptyTrash` stays
 * OUTSIDE every transactional body (program rule 24); `emptyTrash`'s read
 * (the trashed-file list) also stays outside, matching the DB-only-body rule.
 */
@Injectable()
export class FilesService {
  constructor(
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this injects TripsRepository directly (same constructor slot) and
    // calls findAccessible.
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly tokens: EphemeralTokenService,
    private readonly storage: StorageService,
    // EntityManager, not @InjectRepository(Users) — same reasoning as
    // JwtAuthGuard (Plan 3b Task 1 RULING on verifyJwtAndLoadUser's callers):
    // kept uniform with the guards rather than adding a one-off
    // MikroOrmModule.forFeature([Users]) to FilesModule for this single call.
    private readonly em: EntityManager,
    private readonly uow: UnitOfWork,
    @InjectRepository(TripFiles) private readonly tripFilesRepo: TripFilesRepository,
    @InjectRepository(FileLinks) private readonly fileLinksRepo: FileLinksRepository,
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(DayAssignments) private readonly dayAssignmentsRepo: DayAssignmentsRepository,
    @InjectRepository(BudgetItems) private readonly budgetItemsRepo: BudgetItemsRepository,
  ) {}

  async verifyTripAccess(tripId: string | number, userId: number) {
    return await this.trips.findAccessible(tripId, userId);
  }

  async can(action: FilePermission, trip: Trip, user: User): Promise<boolean> {
    return this.permissions.checkPermission(action, user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  // ---------------------------------------------------------------------------
  // Token-based download auth & safe path resolution (used by the unguarded
  // download route)
  // ---------------------------------------------------------------------------

  async authenticateDownload(req: Request): Promise<{ userId: number } | { error: string; status: number }> {
    const cookieToken = (req as { cookies?: Record<string, string> }).cookies?.trek_session;
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader ? (authHeader.split(' ')[1] || undefined) : undefined;
    const queryToken = req.query.token as string | undefined;

    // Cookie and Bearer both carry a full JWT — try them first (cookie wins).
    const jwtToken = cookieToken || bearerToken;
    if (jwtToken) {
      // Use the shared helper so the password_version gate applies here too;
      // previously this bypassed the check and stolen download tokens stayed
      // valid across a password reset.
      const user = await verifyJwtAndLoadUser(jwtToken, this.em.getRepository(Users));
      if (!user) return { error: 'Invalid or expired token', status: 401 };
      return { userId: user.id };
    }

    if (queryToken) {
      const uid = this.tokens.consume(queryToken, 'download');
      if (!uid) return { error: 'Invalid or expired token', status: 401 };
      return { userId: uid };
    }

    return { error: 'Authentication required', status: 401 };
  }

  // ---------------------------------------------------------------------------
  // Trip-scoped link validation
  // ---------------------------------------------------------------------------

  /**
   * A file, and any reservation / day-assignment / place it points at, must all
   * live in the same trip. FILE_SELECT and getFileLinks join the reservation and
   * return its title, so without this guard a member of trip A could aim a file
   * (or a file_link) at trip B's reservation id and read the title back. Returns
   * the first field that escapes `tripId`, or null when every supplied id belongs
   * to the trip. Absent / null / zero ids are ignored (they clear the link).
   *
   * FL1-4 (`findForeignLinkTarget`'s four-table dispatch) are each now one
   * `findTripId(id)` method on the target's OWN repository (R12 — no
   * interpolated/dynamic table-name dispatch): the id is parsed once via
   * `toRowId` here and compared against the row's own `trip_id` — a
   * non-canonical id or a row in a different trip both read as "foreign"
   * (rule 15's accepted narrowing: a non-canonical id can never have been
   * produced by our own client).
   */
  async findForeignLinkTarget(
    tripId: string | number,
    opts: { reservation_id?: string | number | null; assignment_id?: string | number | null; place_id?: string | number | null; budget_item_id?: string | number | null }
  ): Promise<'reservation_id' | 'assignment_id' | 'place_id' | 'budget_item_id' | null> {
    const tripIdNum = toRowId(tripId);
    if (opts.reservation_id) {
      const idNum = toRowId(opts.reservation_id);
      const rowTripId = idNum === null ? undefined : await this.reservationsRepo.findTripId(idNum);
      if (rowTripId === undefined || rowTripId !== tripIdNum) return 'reservation_id';
    }
    if (opts.place_id) {
      const idNum = toRowId(opts.place_id);
      const rowTripId = idNum === null ? undefined : await this.placesRepo.findTripId(idNum);
      if (rowTripId === undefined || rowTripId !== tripIdNum) return 'place_id';
    }
    if (opts.assignment_id) {
      const idNum = toRowId(opts.assignment_id);
      const rowTripId = idNum === null ? undefined : await this.dayAssignmentsRepo.findTripId(idNum);
      if (rowTripId === undefined || rowTripId !== tripIdNum) return 'assignment_id';
    }
    if (opts.budget_item_id) {
      const idNum = toRowId(opts.budget_item_id);
      const rowTripId = idNum === null ? undefined : await this.budgetItemsRepo.findTripId(idNum);
      if (rowTripId === undefined || rowTripId !== tripIdNum) return 'budget_item_id';
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async getFileById(id: string | number, tripId: string | number): Promise<TripFileRow | undefined> {
    const idNum = toRowId(id);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return undefined;
    return await this.tripFilesRepo.findInTrip(idNum, tripIdNum);
  }

  async getDeletedFile(id: string | number, tripId: string | number): Promise<TripFileRow | undefined> {
    const idNum = toRowId(id);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return undefined;
    return await this.tripFilesRepo.findDeletedInTrip(idNum, tripIdNum);
  }

  /**
   * A file's bytes for a caller that is not the browser download.
   *
   * Shared by the plugin RPC (ctx.files.getContent) and the MCP read tool so the
   * rules exist once. Three of them matter. The size is capped BEFORE the read,
   * so a 500MB video is never pulled into memory just to be refused afterwards.
   * The bytes come from the storage layer rather than from disk, so this keeps
   * working on S3 or a mirrored pair. And the read runs off the event loop:
   * 10MB of readFile on the host thread stalls every other request for its
   * duration.
   *
   * Access is the caller's job. REST-side that is trip access plus the file
   * row being on the trip, which the getFileById lookup below re-checks.
   */
  async readContent(
    tripId: string | number,
    fileId: string | number,
  ): Promise<{ name: string; mimetype: string; bytes: Buffer }> {
    const file = await this.getFileById(fileId, tripId);
    if (!file || file.deleted_at) throw new FileContentError('not-found', `no file ${fileId} on trip ${tripId}`);
    if ((file.file_size ?? 0) > FILE_CONTENT_MAX) {
      throw new FileContentError('too-large', `file too large to read (>${FILE_CONTENT_MAX} bytes); use the download UI`);
    }
    let stream: Readable;
    let stat: ObjectStat;
    try {
      ({ stream, stat } = await this.storage.getStream('files', path.basename(file.filename)));
    } catch (err) {
      if (err instanceof StorageNotFoundError || err instanceof StorageInvalidKeyError) {
        throw new FileContentError('not-accessible', 'file path is not accessible');
      }
      throw err;
    }
    // Re-checked against the OBJECT, not the DB row: file_size can drift.
    if (stat.size > FILE_CONTENT_MAX) {
      stream.destroy();
      throw new FileContentError('too-large', `file too large to read (>${FILE_CONTENT_MAX} bytes); use the download UI`);
    }
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of stream) {
      const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      total += part.length;
      // A driver whose stat under-reports must not hand back an oversized
      // payload: abort as soon as the running total crosses the cap.
      if (total > FILE_CONTENT_MAX) {
        stream.destroy();
        throw new FileContentError('too-large', 'file too large to read');
      }
      chunks.push(part);
    }
    return {
      name: file.original_name,
      mimetype: file.mime_type ?? 'application/octet-stream',
      bytes: Buffer.concat(chunks),
    };
  }

  async listFiles(tripId: string | number, showTrash: boolean) {
    const tripIdNum = toRowId(tripId) ?? -1;
    const files = await this.tripFilesRepo.listForTrip(tripIdNum, showTrash);

    const fileIds = files.map(f => f.id);
    const links = await this.fileLinksRepo.listForFiles(fileIds);
    const linksMap: Record<number, FileLinkTargetRow[]> = {};
    for (const link of links) {
      if (!linksMap[link.file_id]) linksMap[link.file_id] = [];
      linksMap[link.file_id].push(link);
    }

    return files.map(f => {
      const fileLinks = linksMap[f.id] || [];
      return {
        ...formatFile(f),
        linked_reservation_ids: fileLinks.filter(l => l.reservation_id).map(l => l.reservation_id),
        linked_place_ids: fileLinks.filter(l => l.place_id).map(l => l.place_id),
        linked_budget_item_ids: fileLinks.filter(l => l.budget_item_id).map(l => l.budget_item_id),
      };
    });
  }

  /** R2: `createFile`'s `trip_files` insert and its conditional `file_links` insert (FL9+FL10) run inside one transaction. */
  async createFile(
    tripId: string | number,
    file: { filename: string; originalname: string; size: number; mimetype: string },
    uploadedBy: number,
    opts: { place_id?: string | number | null; reservation_id?: string | number | null; budget_item_id?: string | number | null; description?: string | null }
  ) {
    const newId = await this.uow.transactional(async () => {
      const id = await this.tripFilesRepo.insertFile({
        trip_id: tripId,
        place_id: coerceLinkId(opts.place_id),
        reservation_id: coerceLinkId(opts.reservation_id),
        filename: file.filename,
        original_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        description: opts.description || null,
        uploaded_by: uploadedBy,
      });

      const budgetItemId = coerceLinkId(opts.budget_item_id);
      if (budgetItemId) {
        await this.fileLinksRepo.insertIgnore({ file_id: id, budget_item_id: budgetItemId });
      }
      return id;
    });

    const created = await this.tripFilesRepo.findByIdWithJoins(newId);
    return formatFile(created!);
  }

  /**
   * Store bytes that arrived without multipart (the MCP upload tool, #1566) and
   * record them like a multipart upload: same random storage key, same row. The
   * caller has already run the type and size checks.
   */
  async createFileFromBytes(
    tripId: string | number,
    upload: { originalname: string; mimetype: string; bytes: Buffer },
    uploadedBy: number,
    opts: { place_id?: number | null; reservation_id?: number | null; description?: string | null },
  ) {
    const filename = `${randomUUID()}${path.extname(upload.originalname)}`;
    await this.storage.put('files', filename, Readable.from([upload.bytes]), { contentType: upload.mimetype });
    return this.createFile(tripId, { filename, originalname: upload.originalname, size: upload.bytes.length, mimetype: upload.mimetype }, uploadedBy, opts);
  }

  /** R2: `updateFile`'s field update and its conditional `file_links` insert/delete (FL12+FL13+FL14) run inside one transaction. */
  async updateFile(
    id: string | number,
    current: TripFileRow,
    updates: { description?: string; place_id?: string | number | null; reservation_id?: string | number | null; budget_item_id?: string | number | null }
  ) {
    const idNum = toRowId(id) ?? -1;

    await this.uow.transactional(async () => {
      await this.tripFilesRepo.updateFile(idNum, {
        description: updates.description !== undefined ? (updates.description || null) : (current.description ?? null),
        place_id: updates.place_id !== undefined ? coerceLinkId(updates.place_id) : (current.place_id ?? null),
        reservation_id: updates.reservation_id !== undefined ? coerceLinkId(updates.reservation_id) : (current.reservation_id ?? null),
      });

      if (updates.budget_item_id !== undefined) {
        const budgetItemId = coerceLinkId(updates.budget_item_id);
        if (budgetItemId) {
          await this.fileLinksRepo.insertIgnore({ file_id: idNum, budget_item_id: budgetItemId });
        } else {
          await this.fileLinksRepo.clearBudgetLink(idNum);
        }
      }
    });

    const updated = await this.tripFilesRepo.findByIdWithJoins(idNum);
    return formatFile(updated!);
  }

  async toggleStarred(id: string | number, currentStarred: number | undefined) {
    const idNum = toRowId(id) ?? -1;
    const newStarred = currentStarred ? 0 : 1;
    await this.tripFilesRepo.setStarred(idNum, newStarred);

    const updated = await this.tripFilesRepo.findByIdWithJoins(idNum);
    return formatFile(updated!);
  }

  async softDeleteFile(id: string | number) {
    await this.tripFilesRepo.softDelete(toRowId(id) ?? -1);
  }

  async restoreFile(id: string | number) {
    const idNum = toRowId(id) ?? -1;
    await this.tripFilesRepo.restore(idNum);
    const restored = await this.tripFilesRepo.findByIdWithJoins(idNum);
    return formatFile(restored!);
  }

  async permanentDeleteFile(file: TripFileRow): Promise<void> {
    // storage.delete is idempotent on a missing object (the old rm force:true
    // contract). Only drop the DB row when the delete either succeeded or the
    // object was already gone — otherwise a permission / ENOSPC failure
    // would orphan the bytes with no DB pointer left to clean them.
    try {
      await this.storage.delete('files', path.basename(file.filename));
    } catch (e) {
      console.error(`[files] unlink failed for ${file.filename}, keeping DB row:`, e);
      throw e;
    }
    await this.tripFilesRepo.deleteById(file.id);
  }

  /** R2: the storage-delete loop stays outside any transaction (rule 24); only the final bulk `trip_files` delete (FL23) runs inside one. */
  async emptyTrash(tripId: string | number): Promise<number> {
    const tripIdNum = toRowId(tripId) ?? -1;
    const trashed = await this.tripFilesRepo.listTrashed(tripIdNum);
    // Collect successful IDs separately so we only DELETE rows whose disk
    // content was actually removed — failing unlinks keep their DB row
    // and a retry via the single-file delete path can try again.
    const successfullyUnlinked: number[] = [];
    await Promise.all(trashed.map(async (file) => {
      try {
        await this.storage.delete('files', path.basename(file.filename));
        successfullyUnlinked.push(file.id);
      } catch (e) {
        console.error(`[files] unlink failed for ${file.filename}, keeping DB row:`, e);
      }
    }));
    // A single statement is already atomic — no `uow.transactional` wrapper
    // needed here (task-8-review.md L1/U1: the wrapper this method used to
    // carry was vacuous, and FILE-SVC-062's "rollback" claim never actually
    // exercised it — removing it keeps every test green).
    if (successfullyUnlinked.length > 0) {
      await this.tripFilesRepo.deleteMany(successfullyUnlinked);
    }
    return successfullyUnlinked.length;
  }

  // ---------------------------------------------------------------------------
  // File links (many-to-many)
  // ---------------------------------------------------------------------------

  // Dedupe rides INSERT OR IGNORE + the UNIQUE(file_id, <target>) constraints;
  // a genuine insert failure propagates to the global exception filter instead
  // of returning a success-shaped links list (the legacy catch swallowed it).
  async createFileLink(
    fileId: string | number,
    opts: { reservation_id?: string | number | null; assignment_id?: string | number | null; place_id?: string | number | null; budget_item_id?: string | number | null }
  ) {
    const idNum = toRowId(fileId) ?? -1;
    await this.fileLinksRepo.insertIgnore({
      file_id: idNum,
      reservation_id: coerceLinkId(opts.reservation_id),
      assignment_id: coerceLinkId(opts.assignment_id),
      place_id: coerceLinkId(opts.place_id),
      budget_item_id: coerceLinkId(opts.budget_item_id),
    });
    return await this.fileLinksRepo.listForFile(idNum);
  }

  async deleteFileLink(linkId: string | number, fileId: string | number) {
    await this.fileLinksRepo.deleteById(toRowId(linkId) ?? -1, toRowId(fileId) ?? -1);
  }

  async getFileLinks(fileId: string | number) {
    return await this.fileLinksRepo.listForFileWithReservationTitle(toRowId(fileId) ?? -1);
  }
}
