/**
 * Unit tests for the DI-native FilesService — FILE-SVC-001 through FILE-SVC-036.
 * The legacy services/fileService.ts never had a unit suite (behavior was pinned
 * only by tests/integration/files.test.ts), so these cases are new: they pin the
 * relocated SQL, the falsy-coercion defaults, the unlink-first delete semantics
 * and the download-token auth over a real in-memory SQLite DB, plus the
 * files.bridge delegation (inside the src/nest coverage gate).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import path from 'path';

// ── DB setup ──────────────────────────────────────────────────────────────────

// A second, schema-less DB for the getAllowedExtensions catch branch.
const { bareDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  return { bareDb: new Database(':memory:') };
});

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
  };
});

import { db as testDb } from '../../../src/db/database';
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

const checkPermission = vi.fn(() => true);
const permissionsStub = { checkPermission } as unknown as PermissionsService;

const { verifyJwtAndLoadUser } = vi.hoisted(() => ({ verifyJwtAndLoadUser: vi.fn() }));
vi.mock('../../../src/nest/auth-core/jwt-verify', () => ({ verifyJwtAndLoadUser }));

const { consumeEphemeralToken } = vi.hoisted(() => ({ consumeEphemeralToken: vi.fn() }));
vi.mock('../../../src/nest/auth-core/ephemeral-tokens', () => ({ consumeEphemeralToken }));

import type { Request } from 'express';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember, createPlace, createReservation, createDay, createDayAssignment, setAppSetting, createCollabNote } from '../../helpers/factories';
import type { TripAccess } from '../../../src/db/repositories/Trips.repository';
import { createTestUnitOfWork, createTestAppSettingsRepo, createTestReservationsRepo, createTestPlacesRepo, createTestDayAssignmentsRepo, createTestTripsRepo } from '../../helpers/test-uow';
import { createTestTripFilesRepo, createTestFileLinksRepo, createTestBudgetItemsRepo } from '../../helpers/files-repos';
import { sharedTestOrm } from '../../helpers/test-uow';
import type { TestOrm } from '../../helpers/test-orm';
import { countRows, findRow, insertRow } from '../../helpers/factories/rows';
import { makeCollabMessage } from '../../helpers/factories/collab';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { FileLinks } from '../../../src/db/entities/FileLinks.entity';
import { TripFiles } from '../../../src/db/entities/TripFiles.entity';
import type { TripFilesRepository } from '../../../src/db/repositories/TripFiles.repository';
import type { FileLinksRepository } from '../../../src/db/repositories/FileLinks.repository';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { FilesService } from '../../../src/nest/files/files.service';
import { AllowedFileTypesService } from '../../../src/nest/files/allowed-file-types.service';
import {
  DEFAULT_ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_VIDEO_SIZE,
  BLOCKED_EXTENSIONS,
  filesDir,
  isVideoMime,
  isVideoExtension,
} from '../../../src/nest/files/files.constants';
import type { User } from '../../../src/types';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { EphemeralTokenService } from '../../../src/nest/auth-core/ephemeral-token.service';
import type { EntityManager } from '@mikro-orm/core';
import { Users } from '../../../src/db/entities/Users.entity';
import { UserSessions } from '../../../src/db/entities/UserSessions.entity';
import { TripAccessService } from '../../../src/nest/trip-membership/trip-access.service';

const storageDelete = vi.fn();
const storageStub = { delete: storageDelete } as unknown as import('../../../src/nest/storage/storage.service').StorageService;
// EntityManager stub (Plan 3b Task 1 RULING): verifyJwtAndLoadUser is
// fully mocked above, so `em.getRepository` never needs to return
// anything meaningful; it just has to not throw when the service calls it.
// `getRepository` is a spy, not a plain arrow (task-1-rereview.md F-R4): a
// fixed `() => ({})` pinned only the RETURN value, not which entity class
// `files.service.ts` asks for — the assertion below would hold even if the
// production code asked for `Trips`. The spy lets FILE-SVC-032/033 pin
// `Users` specifically.
const getRepository = vi.fn(() => ({}));
const emStub = { getRepository } as unknown as EntityManager;

// Constructed in `beforeAll` (async — the repositories below resolve through
// `sharedTestOrm`), not at module load: Plan 3e Task 1 adds the `UnitOfWork`
// and the five repositories `FilesService` now needs. `tripFilesRepo`/
// `fileLinksRepo` are kept as named bindings (not only inside `svc`) so the
// R2 rollback tests below can spy on them directly, the same shape
// `reservations.service.test.ts`'s `RESV-FIX-001/002` already use.
let svc: FilesService;
let tripFilesRepo: TripFilesRepository;
let fileLinksRepo: FileLinksRepository;
let orm: TestOrm;

/** An expense on the trip with only a name, the bare row a receipt hangs off. */
function insertBudgetItem(tripId: number, name: string): Promise<number> {
  return insertRow(orm, BudgetItems, { trip: tripId, name });
}

beforeAll(async () => {
  orm = await sharedTestOrm(testDb);
  tripFilesRepo = await createTestTripFilesRepo(testDb);
  fileLinksRepo = await createTestFileLinksRepo(testDb);
  svc = new FilesService(
    new TripAccessService(await createTestTripsRepo(testDb)),
    permissionsStub,
    new RealtimeService(),
    new EphemeralTokenService(),
    storageStub,
    emStub,
    await createTestUnitOfWork(testDb),
    tripFilesRepo,
    fileLinksRepo,
    await createTestReservationsRepo(testDb),
    await createTestPlacesRepo(testDb),
    await createTestDayAssignmentsRepo(testDb),
    await createTestBudgetItemsRepo(testDb),
  );
});

beforeEach(async () => {
  resetTestDb(testDb);
  vi.clearAllMocks();
  // Plan 4 Task 2: unlike the old `DatabaseService` (which threw without an
  // `EntityManager` and needed a per-test respy), `svc`'s `TripsRepository`
  // (built in `beforeAll` via `createTestTripsRepo`) already carries a real,
  // working `EntityManager` and reads bypass the identity map (rule 14), so
  // no per-test re-pointing is needed — the old spy dance is gone.
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  testDb.close();
  bareDb.close();
});

function seedTrip() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  return { user, trip };
}

async function makeFile(tripId: number, userId: number, overrides: Partial<{ filename: string; originalname: string; size: number; mimetype: string }> = {}, opts: Parameters<FilesService['createFile']>[3] = {}) {
  return await svc.createFile(
    tripId,
    { filename: 'stored-name.pdf', originalname: 'visa.pdf', size: 1234, mimetype: 'application/pdf', ...overrides },
    userId,
    opts
  );
}

function req(parts: { cookie?: string; bearer?: string; token?: string }): Request {
  return {
    cookies: parts.cookie ? { trek_session: parts.cookie } : {},
    headers: parts.bearer ? { authorization: `Bearer ${parts.bearer}` } : {},
    query: parts.token ? { token: parts.token } : {},
  } as unknown as Request;
}

// ── constants & pure helpers (files.constants.ts) ─────────────────────────────

describe('files.constants', () => {
  it('FILE-SVC-001: isVideoMime accepts video/* only', () => {
    expect(isVideoMime('video/mp4')).toBe(true);
    expect(isVideoMime('image/png')).toBe(false);
    expect(isVideoMime(undefined)).toBe(false);
    expect(isVideoMime(null)).toBe(false);
    expect(isVideoMime('')).toBe(false);
  });

  it('FILE-SVC-002: isVideoExtension strips a leading dot and lowercases', () => {
    expect(isVideoExtension('mp4')).toBe(true);
    expect(isVideoExtension('.MP4')).toBe(true);
    expect(isVideoExtension('.mov')).toBe(true);
    expect(isVideoExtension('pdf')).toBe(false);
    expect(isVideoExtension('svg')).toBe(false);
  });

  it('FILE-SVC-003: blocklist, size caps and the default allowlist are pinned', () => {
    expect(BLOCKED_EXTENSIONS).toHaveLength(29);
    expect(BLOCKED_EXTENSIONS).toContain('.svg');
    expect(BLOCKED_EXTENSIONS).toContain('.exe');
    expect(BLOCKED_EXTENSIONS).toContain('.ps1');
    // The alternative spellings a browser still renders as a document.
    for (const ext of ['.svgz', '.shtml', '.shtm', '.xht']) {
      expect(BLOCKED_EXTENSIONS).toContain(ext);
    }
    expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    expect(MAX_VIDEO_SIZE).toBe(500 * 1024 * 1024);
    expect(DEFAULT_ALLOWED_EXTENSIONS).toBe('jpg,jpeg,png,gif,webp,heic,pdf,doc,docx,xls,xlsx,txt,csv,pkpass,pkpasses,md,markdown');
  });

  it('FILE-SVC-004: filesDir resolves to <server>/uploads/files despite the deeper module location', () => {
    const serverRoot = path.resolve(__dirname, '../../..');
    expect(path.resolve(filesDir)).toBe(path.join(serverRoot, 'uploads', 'files'));
  });
});

// ── allowed extensions (canonical owner: AllowedFileTypesService) ─────────────
// FilesService.getAllowedExtensions was deleted in the storage slice-2
// consolidation (it had no callers); the same four behaviors are pinned
// against the single remaining query owner.

describe('AllowedFileTypesService.get', () => {
  it('FILE-SVC-006: returns the app_settings value when set', async () => {
    setAppSetting(testDb, 'allowed_file_types', 'pdf,txt');
    expect(await new AllowedFileTypesService(await createTestAppSettingsRepo(testDb)).get()).toBe('pdf,txt');
  });

  it('FILE-SVC-007: returns the default when the row is absent', async () => {
    expect(await new AllowedFileTypesService(await createTestAppSettingsRepo(testDb)).get()).toBe(DEFAULT_ALLOWED_EXTENSIONS);
  });

  it('FILE-SVC-008: returns the default for an empty value (|| coercion, not ??)', async () => {
    setAppSetting(testDb, 'allowed_file_types', '');
    expect(await new AllowedFileTypesService(await createTestAppSettingsRepo(testDb)).get()).toBe(DEFAULT_ALLOWED_EXTENSIONS);
  });

  it('FILE-SVC-009: returns the default when the query throws (no app_settings table)', async () => {
    expect(await new AllowedFileTypesService(await createTestAppSettingsRepo(bareDb)).get()).toBe(DEFAULT_ALLOWED_EXTENSIONS);
  });
});

// ── trip-scoped reads ─────────────────────────────────────────────────────────

describe('getFileById / getDeletedFile', () => {
  it('FILE-SVC-010: getFileById is trip-scoped', async () => {
    const { user, trip } = seedTrip();
    const other = createTrip(testDb, user.id);
    const file = await makeFile(trip.id, user.id);
    expect((await svc.getFileById(file.id, trip.id))?.id).toBe(file.id);
    expect(await svc.getFileById(file.id, other.id)).toBeUndefined();
  });

  it('FILE-SVC-011: getDeletedFile returns only soft-deleted rows', async () => {
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id);
    expect(await svc.getDeletedFile(file.id, trip.id)).toBeUndefined();
    await svc.softDeleteFile(file.id);
    expect((await svc.getDeletedFile(file.id, trip.id))?.id).toBe(file.id);
  });

  it('M2-FILES-001: getDeletedFile refuses a soft-deleted file from a different trip (TripFiles.findDeletedInTrip trip-scoping)', async () => {
    const { user, trip } = seedTrip();
    const other = createTrip(testDb, user.id);
    const file = await makeFile(trip.id, user.id);
    await svc.softDeleteFile(file.id);

    expect((await svc.getDeletedFile(file.id, trip.id))?.id).toBe(file.id);
    expect(await svc.getDeletedFile(file.id, other.id)).toBeUndefined();
  });
});

describe('listFiles', () => {
  it('FILE-SVC-012: active list excludes trash, is starred-first and carries the formatted shape', async () => {
    const { user, trip } = seedTrip();
    await makeFile(trip.id, user.id, { originalname: 'plain.pdf' });
    const starred = await makeFile(trip.id, user.id, { originalname: 'starred.pdf' });
    const trashed = await makeFile(trip.id, user.id, { originalname: 'gone.pdf' });
    await svc.toggleStarred(starred.id, 0);
    await svc.softDeleteFile(trashed.id);

    const files = await svc.listFiles(trip.id, false) as Record<string, unknown>[];
    expect(files.map((f) => f.id)).toHaveLength(2);
    expect(files[0].id).toBe(starred.id); // ORDER BY f.starred DESC first
    expect(files.map((f) => f.id)).not.toContain(trashed.id);
    expect(files[0].url).toBe(`/api/trips/${trip.id}/files/${starred.id}/download`);
    expect(files[0].uploaded_by_name).toBe(user.username);
    expect(files[0]).toHaveProperty('uploaded_by_avatar');
  });

  it('FILE-SVC-013: trash list returns only soft-deleted files', async () => {
    const { user, trip } = seedTrip();
    const kept = await makeFile(trip.id, user.id);
    const trashed = await makeFile(trip.id, user.id);
    await svc.softDeleteFile(trashed.id);

    const trash = await svc.listFiles(trip.id, true) as Record<string, unknown>[];
    expect(trash.map((f) => f.id)).toEqual([trashed.id]);
    expect(trash.map((f) => f.id)).not.toContain(kept.id);
  });

  it('FILE-SVC-014: batches file_links and filters null targets by truthiness', async () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const linked = await makeFile(trip.id, user.id);
    const bare = await makeFile(trip.id, user.id);
    await svc.createFileLink(linked.id, { reservation_id: reservation.id });
    await svc.createFileLink(linked.id, { place_id: place.id });

    const files = await svc.listFiles(trip.id, false) as Record<string, unknown>[];
    const linkedRow = files.find((f) => f.id === linked.id);
    const bareRow = files.find((f) => f.id === bare.id);
    expect(linkedRow.linked_reservation_ids).toEqual([reservation.id]);
    expect(linkedRow.linked_place_ids).toEqual([place.id]);
    expect(bareRow.linked_reservation_ids).toEqual([]);
    expect(bareRow.linked_place_ids).toEqual([]);

    const item = await insertBudgetItem(trip.id, 'Dinner');
    await svc.createFileLink(linked.id, { budget_item_id: item });
    const withReceipt = (await svc.listFiles(trip.id, false) as Record<string, unknown>[]).find((f) => f.id === linked.id);
    expect(withReceipt.linked_budget_item_ids).toEqual([item]);
    expect((await svc.listFiles(trip.id, false) as Record<string, unknown>[]).find((f) => f.id === bare.id).linked_budget_item_ids).toEqual([]);

    // The empty-trip guard skips the IN () batch entirely.
    const empty = createTrip(testDb, user.id);
    expect(await svc.listFiles(empty.id, false)).toEqual([]);
  });
});

// ── receipts on an expense ────────────────────────────────────────────────────

describe('budget receipts', () => {
  function seedItem(tripId: number) {
    return insertBudgetItem(tripId, 'Dinner');
  }

  it('FILE-SVC-040: an upload naming an expense gets its link row straight away', async () => {
    const { user, trip } = seedTrip();
    const item = await seedItem(trip.id);
    const file = await makeFile(trip.id, user.id, {}, { budget_item_id: item });
    expect(await countRows(orm, FileLinks, { file: file.id, budgetItem: item })).toBe(1);
  });

  it('FILE-SVC-041: an upload without one writes no link at all', async () => {
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id);
    expect(await countRows(orm, FileLinks, { file: file.id })).toBe(0);
  });

  it('FILE-SVC-042: updateFile attaches to an expense and detaches on a falsy id', async () => {
    const { user, trip } = seedTrip();
    const item = await seedItem(trip.id);
    const file = await makeFile(trip.id, user.id);

    await svc.updateFile(file.id, file, { budget_item_id: item });
    expect(await countRows(orm, FileLinks, { file: file.id, budgetItem: item })).toBe(1);

    // Sending it twice must not double the row.
    await svc.updateFile(file.id, file, { budget_item_id: item });
    expect(await countRows(orm, FileLinks, { file: file.id })).toBe(1);

    await svc.updateFile(file.id, file, { budget_item_id: null });
    expect(await countRows(orm, FileLinks, { file: file.id, budgetItem: { $ne: null } })).toBe(0);
  });

  it('FILE-SVC-043: leaving budget_item_id out touches no link', async () => {
    const { user, trip } = seedTrip();
    const item = await seedItem(trip.id);
    const file = await makeFile(trip.id, user.id, {}, { budget_item_id: item });

    await svc.updateFile(file.id, file, { description: 'renamed' });
    expect(await countRows(orm, FileLinks, { file: file.id, budgetItem: item })).toBe(1);
  });
});

// ── createFile / updateFile / toggleStarred ───────────────────────────────────

describe('createFile', () => {
  it('FILE-SVC-015: coerces falsy opts to NULL (|| null) and re-selects the formatted row', async () => {
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id, {}, { place_id: '', reservation_id: undefined, description: '' });
    const row = await findRow(orm, TripFiles, { id: file.id });
    expect(row?.place_id).toBeNull();
    expect(row?.reservation_id).toBeNull();
    expect(row?.description).toBeNull();
    expect(file.url).toBe(`/api/trips/${trip.id}/files/${file.id}/download`);
    expect((file as unknown as Record<string, unknown>).uploaded_by_name).toBe(user.username);
  });

  it('FILE-SVC-016: stores the provided metadata and links the reservation title through FILE_SELECT', async () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id, { title: 'Night train' });
    const file = await makeFile(trip.id, user.id, { originalname: 'ticket.pdf', size: 99, mimetype: 'application/pdf' }, {
      reservation_id: String(reservation.id),
      description: 'the booking',
    });
    expect((file as unknown as Record<string, unknown>).reservation_title).toBe('Night train');
    expect(file.description).toBe('the booking');
    expect(file.original_name).toBe('ticket.pdf');
    expect(file.file_size).toBe(99);
    expect(file.uploaded_by).toBe(user.id);
  });

  it('FILE-SVC-060 (R2): a failing file_links insert rolls back the trip_files row too', async () => {
    const { user, trip } = seedTrip();
    const item = await insertBudgetItem(trip.id, 'Dinner');
    const spy = vi.spyOn(fileLinksRepo, 'insertIgnore').mockRejectedValueOnce(new Error('boom'));
    await expect(makeFile(trip.id, user.id, {}, { budget_item_id: item })).rejects.toThrow('boom');
    expect(await countRows(orm, TripFiles, { trip: trip.id })).toBe(0);
    spy.mockRestore();
  });
});

describe('updateFile', () => {
  it('FILE-SVC-017: undefined fields keep the current values', async () => {
    const { user, trip } = seedTrip();
    const place = createPlace(testDb, trip.id);
    const file = await makeFile(trip.id, user.id, {}, { description: 'keep me', place_id: String(place.id) });
    const current = (await svc.getFileById(file.id, trip.id))!;
    const updated = await svc.updateFile(file.id, current, {}) as Record<string, unknown>;
    expect(updated.description).toBe('keep me');
    expect(updated.place_id).toBe(place.id);
  });

  it("FILE-SVC-018: '' clears every field (|| null) — description matches createFile's coercion", async () => {
    const { user, trip } = seedTrip();
    const place = createPlace(testDb, trip.id);
    const reservation = createReservation(testDb, trip.id);
    const file = await makeFile(trip.id, user.id, {}, { description: 'old', place_id: String(place.id), reservation_id: String(reservation.id) });
    const current = (await svc.getFileById(file.id, trip.id))!;
    const updated = await svc.updateFile(file.id, current, { description: '', place_id: '', reservation_id: null }) as Record<string, unknown>;
    expect(updated.description).toBeNull(); // '' → NULL on update too (post-migration fix: symmetric with createFile)
    expect(updated.place_id).toBeNull();
    expect(updated.reservation_id).toBeNull();
  });

  it('FILE-SVC-061 (R2): a failing file_links swap rolls back the description/place/reservation update too', async () => {
    const { user, trip } = seedTrip();
    const item = await insertBudgetItem(trip.id, 'Dinner');
    const place = createPlace(testDb, trip.id);
    const file = await makeFile(trip.id, user.id, {}, { description: 'old' });
    const current = (await svc.getFileById(file.id, trip.id))!;
    const spy = vi.spyOn(fileLinksRepo, 'insertIgnore').mockRejectedValueOnce(new Error('boom'));
    await expect(svc.updateFile(file.id, current, { description: 'new', place_id: String(place.id), budget_item_id: item })).rejects.toThrow('boom');
    const row = await findRow(orm, TripFiles, { id: file.id });
    expect(row?.description).toBe('old');
    expect(row?.place_id).toBeNull();
    spy.mockRestore();
  });
});

describe('toggleStarred / softDeleteFile / restoreFile', () => {
  it('FILE-SVC-019: toggleStarred flips 0→1 and 1→0', async () => {
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id);
    const on = await svc.toggleStarred(file.id, 0);
    expect(on.starred).toBe(1);
    const off = await svc.toggleStarred(file.id, on.starred);
    expect(off.starred).toBe(0);
  });

  it('FILE-SVC-020: softDeleteFile stamps deleted_at', async () => {
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id);
    await svc.softDeleteFile(file.id);
    const row = await findRow(orm, TripFiles, { id: file.id });
    // The row must still be there: a hard delete would leave findRow at null.
    expect(row).not.toBeNull();
    expect(row!.deleted_at).not.toBeNull();
  });

  it('FILE-SVC-021: restoreFile clears deleted_at and returns the formatted row', async () => {
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id);
    await svc.softDeleteFile(file.id);
    const restored = await svc.restoreFile(file.id) as Record<string, unknown>;
    expect(restored.deleted_at).toBeNull();
    expect(restored.url).toBe(`/api/trips/${trip.id}/files/${file.id}/download`);
  });
});

// ── permanentDeleteFile / emptyTrash (unlink-first semantics) ─────────────────

describe('permanentDeleteFile', () => {
  it('FILE-SVC-022: deletes the storage object (idempotent on missing), then the DB row', async () => {
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id, { filename: 'on-disk.pdf' });
    storageDelete.mockResolvedValue(undefined);
    await svc.permanentDeleteFile((await svc.getFileById(file.id, trip.id))!);
    expect(storageDelete).toHaveBeenCalledWith('files', 'on-disk.pdf');
    expect(await svc.getFileById(file.id, trip.id)).toBeUndefined();
  });

  it('FILE-SVC-023: a delete failure logs [files], rethrows and keeps the DB row', async () => {
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id, { filename: 'stuck.pdf' });
    const boom = new Error('EACCES');
    storageDelete.mockRejectedValue(boom);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(svc.permanentDeleteFile((await svc.getFileById(file.id, trip.id))!)).rejects.toThrow('EACCES');
    expect(err).toHaveBeenCalledWith('[files] unlink failed for stuck.pdf, keeping DB row:', boom);
    expect(await svc.getFileById(file.id, trip.id)).toBeDefined();
  });
});

describe('emptyTrash', () => {
  it('FILE-SVC-024: unlinks every trashed file and deletes their rows, returning the count', async () => {
    const { user, trip } = seedTrip();
    const a = await makeFile(trip.id, user.id, { filename: 'a.pdf' });
    const b = await makeFile(trip.id, user.id, { filename: 'b.pdf' });
    const kept = await makeFile(trip.id, user.id, { filename: 'kept.pdf' });
    await svc.softDeleteFile(a.id);
    await svc.softDeleteFile(b.id);
    storageDelete.mockResolvedValue(undefined);

    await expect(svc.emptyTrash(trip.id)).resolves.toBe(2);
    expect(await svc.listFiles(trip.id, true)).toEqual([]);
    expect(await svc.getFileById(kept.id, trip.id)).toBeDefined();
  });

  it('FILE-SVC-025: a partial unlink failure keeps the failed row, swallows the error and counts only successes', async () => {
    const { user, trip } = seedTrip();
    const good = await makeFile(trip.id, user.id, { filename: 'good.pdf' });
    const bad = await makeFile(trip.id, user.id, { filename: 'bad.pdf' });
    await svc.softDeleteFile(good.id);
    await svc.softDeleteFile(bad.id);
    const boom = new Error('EBUSY');
    storageDelete.mockImplementation((_category: string, name: string) =>
      name.includes('bad.pdf') ? Promise.reject(boom) : Promise.resolve()
    );
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(svc.emptyTrash(trip.id)).resolves.toBe(1);
    expect(err).toHaveBeenCalledWith('[files] unlink failed for bad.pdf, keeping DB row:', boom);
    expect(await svc.getFileById(good.id, trip.id)).toBeUndefined();
    expect(await svc.getDeletedFile(bad.id, trip.id)).toBeDefined();
  });

  it('FILE-SVC-026: an empty trash resolves to 0 without touching storage', async () => {
    const { trip } = seedTrip();
    await expect(svc.emptyTrash(trip.id)).resolves.toBe(0);
    expect(storageDelete).not.toHaveBeenCalled();
  });

  it('FILE-SVC-062: a failing bulk delete leaves every trashed row in place (single-statement atomicity, not a transaction)', async () => {
    // `emptyTrash`'s bulk delete is one statement (`tripFilesRepo.deleteMany`),
    // not wrapped in `uow.transactional` (task-8-review.md L1/U1: that wrapper
    // was vacuous — there is nothing else in the body for a rollback to undo,
    // and the FILE-SVC-062 name's old "(R2)" tag overclaimed transactional
    // rollback semantics it never actually proved). This pins the honest
    // claim instead: a single statement that never runs leaves nothing
    // half-done, by construction — the row survives because `deleteMany`
    // itself rejected before touching the DB, not because a transaction
    // rolled anything back.
    const { user, trip } = seedTrip();
    const a = await makeFile(trip.id, user.id, { filename: 'a.pdf' });
    await svc.softDeleteFile(a.id);
    storageDelete.mockResolvedValue(undefined);
    const spy = vi.spyOn(tripFilesRepo, 'deleteMany').mockRejectedValueOnce(new Error('boom'));
    await expect(svc.emptyTrash(trip.id)).rejects.toThrow('boom');
    expect(await countRows(orm, TripFiles, { id: a.id })).toBe(1);
    spy.mockRestore();
  });
});

// ── findForeignLinkTarget ─────────────────────────────────────────────────────

describe('findForeignLinkTarget', () => {
  function twoTrips() {
    const { user } = createUser(testDb);
    const mine = createTrip(testDb, user.id);
    const foreign = createTrip(testDb, user.id);
    return { user, mine, foreign };
  }

  it('FILE-SVC-027: flags each foreign target kind and passes same-trip ids', async () => {
    const { mine, foreign } = twoTrips();
    const foreignRes = createReservation(testDb, foreign.id);
    const foreignPlace = createPlace(testDb, foreign.id);
    const foreignDay = createDay(testDb, foreign.id);
    const foreignAssignment = createDayAssignment(testDb, foreignDay.id, createPlace(testDb, foreign.id).id);
    const myRes = createReservation(testDb, mine.id);

    expect(await svc.findForeignLinkTarget(mine.id, { reservation_id: foreignRes.id })).toBe('reservation_id');
    expect(await svc.findForeignLinkTarget(mine.id, { place_id: foreignPlace.id })).toBe('place_id');
    expect(await svc.findForeignLinkTarget(mine.id, { assignment_id: foreignAssignment.id })).toBe('assignment_id');
    expect(await svc.findForeignLinkTarget(mine.id, { reservation_id: myRes.id })).toBeNull();

    // A receipt may only point at an expense on the same trip.
    const foreignItem = await insertBudgetItem(foreign.id, 'Foreign');
    const myItem = await insertBudgetItem(mine.id, 'Mine');
    expect(await svc.findForeignLinkTarget(mine.id, { budget_item_id: foreignItem })).toBe('budget_item_id');
    expect(await svc.findForeignLinkTarget(mine.id, { budget_item_id: myItem })).toBeNull();
  });

  it('FILE-SVC-028: falsy ids are skipped (they clear the link) and reservation is checked first', async () => {
    const { mine, foreign } = twoTrips();
    const foreignRes = createReservation(testDb, foreign.id);
    const foreignPlace = createPlace(testDb, foreign.id);

    expect(await svc.findForeignLinkTarget(mine.id, { reservation_id: 0, place_id: null, assignment_id: undefined })).toBeNull();
    expect(await svc.findForeignLinkTarget(mine.id, { reservation_id: '' })).toBeNull();
    // Both foreign — the reservation check runs before the place check.
    expect(await svc.findForeignLinkTarget(mine.id, { reservation_id: foreignRes.id, place_id: foreignPlace.id })).toBe('reservation_id');
  });

  it('M1: a malformed (non-canonical) id for each target kind is refused as foreign (toRowId narrows to null, rule 15)', async () => {
    const { mine } = twoTrips();
    expect(await svc.findForeignLinkTarget(mine.id, { reservation_id: 'abc' })).toBe('reservation_id');
    expect(await svc.findForeignLinkTarget(mine.id, { place_id: 'abc' })).toBe('place_id');
    expect(await svc.findForeignLinkTarget(mine.id, { assignment_id: 'abc' })).toBe('assignment_id');
    expect(await svc.findForeignLinkTarget(mine.id, { budget_item_id: 'abc' })).toBe('budget_item_id');
  });
});

// ── rule 21 — every `toRowId(x) ?? -1` guard's malformed-id branch ─────────────

describe('malformed (non-canonical) ids narrow to -1, not a live row', () => {
  it('M1: getFileById / getDeletedFile return undefined for a malformed id', async () => {
    const { trip } = seedTrip();
    expect(await svc.getFileById('abc', trip.id)).toBeUndefined();
    expect(await svc.getDeletedFile('abc', trip.id)).toBeUndefined();
  });

  it('M1: listFiles / emptyTrash treat a malformed trip id as an empty trip', async () => {
    expect(await svc.listFiles('abc', false)).toEqual([]);
    expect(await svc.emptyTrash('abc')).toBe(0);
  });

  it('M1: updateFile with a malformed id writes nothing and there is no row left to format', async () => {
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id);
    await expect(svc.updateFile('abc', file, { description: 'x' })).rejects.toThrow();
  });

  it('M1: toggleStarred with a malformed id writes nothing and there is no row left to format', async () => {
    await expect(svc.toggleStarred('abc', 0)).rejects.toThrow();
  });

  it('M1: restoreFile with a malformed id writes nothing and there is no row left to format', async () => {
    await expect(svc.restoreFile('abc')).rejects.toThrow();
  });

  it('M1: softDeleteFile with a malformed id is a safe no-op', async () => {
    await expect(svc.softDeleteFile('abc')).resolves.toBeUndefined();
  });

  it('M1: deleteFileLink / getFileLinks with malformed ids are safe no-ops', async () => {
    await expect(svc.deleteFileLink('abc', 'abc')).resolves.toBeUndefined();
    expect(await svc.getFileLinks('abc')).toEqual([]);
  });

  it('M1: createFileLink with a malformed fileId cannot satisfy the file_links FK and rejects', async () => {
    await expect(svc.createFileLink('abc', {})).rejects.toThrow();
  });

  it('M1: TripFilesRepository.deleteMany short-circuits on an empty id array', async () => {
    await expect(tripFilesRepo.deleteMany([])).resolves.toBeUndefined();
  });
});

// ── file links ────────────────────────────────────────────────────────────────

// The link queries go through the untyped DatabaseService.all, so the service
// hands back unknown[]. Name the columns these cases read instead of widening
// every row to Record<string, unknown> and losing the id's type on the way into
// deleteFileLink.
type FileLinkRow = {
  id: number;
  file_id: number;
  reservation_id: number | null;
  place_id: number | null;
  reservation_title?: string | null;
};

describe('createFileLink / deleteFileLink / getFileLinks', () => {
  it('FILE-SVC-029: inserts with || null coercion, dedupes via INSERT OR IGNORE and returns the re-select', async () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id, { title: 'Ferry' });
    const file = await makeFile(trip.id, user.id);

    const links = await svc.createFileLink(file.id, { reservation_id: reservation.id, place_id: '' }) as FileLinkRow[];
    expect(links).toHaveLength(1);
    expect(links[0].reservation_id).toBe(reservation.id);
    expect(links[0].place_id).toBeNull();

    const again = await svc.createFileLink(file.id, { reservation_id: reservation.id }) as FileLinkRow[];
    expect(again).toHaveLength(1); // UNIQUE(file_id, reservation_id) + OR IGNORE

    const hydrated = await svc.getFileLinks(file.id) as FileLinkRow[];
    expect(hydrated[0].reservation_title).toBe('Ferry');
  });

  it('FILE-SVC-030: an insert error propagates (post-migration fix: no silent swallow)', async () => {
    // Plan 3e Task 1 deviation: the legacy raw statement bound whatever JS
    // value the caller passed straight into the driver, so a non-primitive
    // (an object) reached better-sqlite3's bind and threw there. The write
    // is now typed `number | null` end to end (`FileLinksRepository
    // .insertIgnore`), so a value that shape can never reach the repository
    // at all — the `toRowId`-backed `coerceLinkId` narrows it to `null`
    // (no link) instead, the same accepted narrowing every other
    // non-canonical id gets. What the "no silent swallow" fix still means is
    // tested directly against the repository call: a genuine insert failure
    // (any error, not a type mismatch this layer now prevents) propagates
    // rather than being caught and turned into a success-shaped links list.
    const { user, trip } = seedTrip();
    const file = await makeFile(trip.id, user.id);
    const spy = vi.spyOn(fileLinksRepo, 'insertIgnore').mockRejectedValueOnce(new Error('boom'));
    await expect(svc.createFileLink(file.id, { reservation_id: 1 })).rejects.toThrow('boom');
    spy.mockRestore();
  });

  it('FILE-SVC-031: deleteFileLink is scoped to (id AND file_id)', async () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id);
    const file = await makeFile(trip.id, user.id);
    const other = await makeFile(trip.id, user.id);
    const [link] = await svc.createFileLink(file.id, { reservation_id: reservation.id }) as FileLinkRow[];

    await svc.deleteFileLink(link.id, other.id); // wrong file — no-op
    expect(await svc.getFileLinks(file.id)).toHaveLength(1);
    await svc.deleteFileLink(link.id, file.id);
    expect(await svc.getFileLinks(file.id)).toHaveLength(0);
  });
});

// ── Plan 3e Task 1 — full-key parity on the fully-seeded read models ──────────
// Rule 19: one `toEqual(<legacy statement run raw on the same seeded rows>)`
// per converted read model, on rows with every optional column populated
// (incl. all six `trip_files` `persist(false)` mirrors) and both trashed and
// live rows.

describe('read-model parity: raw SQL vs. the repository-backed reads', () => {
  it('FILE-SVC-070: getFileById (FL5) is byte-identical to `SELECT * FROM trip_files WHERE id = ? AND trip_id = ?`, all six persist(false) mirrors set', async () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const note = createCollabNote(testDb, trip.id, user.id);
    const messageId = (await makeCollabMessage(orm, trip.id, user.id, { text: 'hi' })).id;
    // Direct insert, not svc.createFile: note_id/message_id are set by OTHER
    // domains (collab), never by FilesService itself — this seeds every
    // persist(false) mirror at once to prove the Kysely `selectAll()` read
    // carries all six, the trap the class docstring names.
    const id = await insertRow(orm, TripFiles, {
      trip: trip.id, place: place.id, reservation: reservation.id, filename: 'a.pdf', original_name: 'A.pdf', file_size: 10,
      mime_type: 'application/pdf', description: 'a note', note: note.id, uploadedByRef: user.id, starred: 1, message: messageId,
    });

    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacy = testDb.prepare('SELECT * FROM trip_files WHERE id = ? AND trip_id = ?').get(id, trip.id);
    expect(await svc.getFileById(id, trip.id)).toEqual(legacy);
  });

  it('FILE-SVC-071: listFiles (FL7, FILE_SELECT) is byte-identical to the legacy joined SELECT, live and trashed alike, with reservation+place+budget_item links all present', async () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id, { title: 'Night train' });
    const place = createPlace(testDb, trip.id);
    const item = await insertBudgetItem(trip.id, 'Dinner');
    // `linked_*_ids` come from `file_links` rows (FL8), a SEPARATE mechanism
    // from `trip_files.reservation_id`/`place_id` (FILE_SELECT's own join) —
    // one `createFileLink` call can attach several targets to the same file
    // at once (the legacy statement writes all four columns in one INSERT).
    const live = await makeFile(trip.id, user.id);
    await svc.createFileLink(live.id, { reservation_id: String(reservation.id), place_id: String(place.id), budget_item_id: item });
    const trashed = await makeFile(trip.id, user.id, { filename: 'gone.pdf' });
    await svc.softDeleteFile(trashed.id);

    const FILE_SELECT = `
      SELECT f.*, r.title as reservation_title, u.username as uploaded_by_name, u.avatar as uploaded_by_avatar
      FROM trip_files f
      LEFT JOIN reservations r ON f.reservation_id = r.id
      LEFT JOIN users u ON f.uploaded_by = u.id
    `;
    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacyLive = testDb.prepare(`${FILE_SELECT} WHERE f.id = ?`).get(live.id) as Record<string, unknown>;
    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacyTrashed = testDb.prepare(`${FILE_SELECT} WHERE f.id = ?`).get(trashed.id) as Record<string, unknown>;

    const activeRow = (await svc.listFiles(trip.id, false) as Record<string, unknown>[]).find((f) => f.id === live.id)!;
    const pickedActive = Object.fromEntries(Object.keys(legacyLive).map((k) => [k, activeRow[k]]));
    expect(pickedActive).toEqual(legacyLive);
    expect(activeRow.linked_reservation_ids).toEqual([reservation.id]);
    expect(activeRow.linked_place_ids).toEqual([place.id]);
    expect(activeRow.linked_budget_item_ids).toEqual([item]);

    const trashedRow = (await svc.listFiles(trip.id, true) as Record<string, unknown>[]).find((f) => f.id === trashed.id)!;
    const pickedTrashed = Object.fromEntries(Object.keys(legacyTrashed).map((k) => [k, trashedRow[k]]));
    expect(pickedTrashed).toEqual(legacyTrashed);
  });

  it('FILE-SVC-072: getFileLinks (FL27) is byte-identical to the legacy joined SELECT', async () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id, { title: 'Ferry' });
    const file = await makeFile(trip.id, user.id);
    await svc.createFileLink(file.id, { reservation_id: String(reservation.id) });

    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacy = testDb.prepare(`
      SELECT fl.*, r.title as reservation_title
      FROM file_links fl
      LEFT JOIN reservations r ON fl.reservation_id = r.id
      WHERE fl.file_id = ?
    `).all(file.id);
    expect(await svc.getFileLinks(file.id)).toEqual(legacy);
  });
});

// ── download auth & glue ──────────────────────────────────────────────────────

describe('authenticateDownload', () => {
  it('FILE-SVC-032: a valid session cookie wins over a bearer token', async () => {
    verifyJwtAndLoadUser.mockReturnValue({ id: 42 });
    const result = await svc.authenticateDownload(req({ cookie: 'cookie-jwt', bearer: 'bearer-jwt' }));
    expect(result).toEqual({ userId: 42 });
    // The concrete expected argument, not expect.anything(): emStub.getRepository
    // always returns a fresh `{}` (task-1-review.md F6) — deep-equal, not a
    // reference match, so this pins WHICH repository (an empty object, this
    // suite's stand-in for UsersRepository), not merely "a repository".
    // `getRepository` itself is a spy (task-1-rereview.md F-R4), so this ALSO
    // pins which entity class was asked for: the deep-equal alone would still
    // hold if the production code called `em.getRepository(Trips)`. The third
    // argument is the session lookup the session gate reads (UserSessions).
    expect(verifyJwtAndLoadUser).toHaveBeenCalledWith('cookie-jwt', {}, {});
    expect(getRepository).toHaveBeenCalledWith(Users);
    expect(getRepository).toHaveBeenCalledWith(UserSessions);
  });

  it('FILE-SVC-033: a bearer token is used when no cookie is present; invalid JWTs 401', async () => {
    verifyJwtAndLoadUser.mockReturnValue({ id: 7 });
    expect(await svc.authenticateDownload(req({ bearer: 'bearer-jwt' }))).toEqual({ userId: 7 });
    expect(verifyJwtAndLoadUser).toHaveBeenCalledWith('bearer-jwt', {}, {}); // see FILE-SVC-032's comment
    expect(getRepository).toHaveBeenCalledWith(Users);
    expect(getRepository).toHaveBeenCalledWith(UserSessions);

    verifyJwtAndLoadUser.mockReturnValue(null);
    expect(await svc.authenticateDownload(req({ bearer: 'stale' }))).toEqual({ error: 'Invalid or expired token', status: 401 });
  });

  it('FILE-SVC-034: a ?token= ephemeral token is consumed with the download purpose', async () => {
    consumeEphemeralToken.mockReturnValue(9);
    expect(await svc.authenticateDownload(req({ token: 'eph' }))).toEqual({ userId: 9 });
    expect(consumeEphemeralToken).toHaveBeenCalledWith('eph', 'download');

    consumeEphemeralToken.mockReturnValue(null);
    expect(await svc.authenticateDownload(req({ token: 'spent' }))).toEqual({ error: 'Invalid or expired token', status: 401 });
  });

  it('FILE-SVC-035: no credentials at all is a 401 Authentication required', async () => {
    expect(await svc.authenticateDownload(req({}))).toEqual({ error: 'Authentication required', status: 401 });
    expect(verifyJwtAndLoadUser).not.toHaveBeenCalled();
    expect(consumeEphemeralToken).not.toHaveBeenCalled();
  });
});

describe('verifyTripAccess / can / files.bridge', () => {
  it('FILE-SVC-036: verifyTripAccess resolves owner and member, refuses strangers', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    expect((await svc.verifyTripAccess(trip.id, owner.id))?.id).toBe(trip.id);
    expect(await svc.verifyTripAccess(trip.id, member.id)).toBeDefined();
    expect(await svc.verifyTripAccess(trip.id, stranger.id)).toBeFalsy();
  });

  it('FILE-SVC-037: can() forwards to checkPermission with the shared-trip flag', async () => {
    const { user, trip } = seedTrip();
    const guest = { id: user.id + 1, role: 'user' } as unknown as User;
    checkPermission.mockReturnValue(true);
    // can() reads only trip.user_id, so the row stays deliberately partial:
    // TripAccess also carries currency, which no assertion here looks at.
    const tripRow = { id: trip.id, user_id: user.id } as TripAccess;

    expect(await svc.can('file_edit', tripRow, guest)).toBe(true);
    expect(checkPermission).toHaveBeenCalledWith('file_edit', 'user', user.id, guest.id, true);

    await svc.can('file_upload', tripRow, { id: user.id, role: 'user' } as unknown as User);
    expect(checkPermission).toHaveBeenLastCalledWith('file_upload', 'user', user.id, user.id, false);
  });

  it('FILE-SVC-038: the allowed-extension list is a live read, not a boot snapshot', async () => {
    // Was asserted against files.bridge, which built its own FilesService. The
    // list moved to a leaf service the multer factories inject, and the property
    // that matters is unchanged: an admin editing the list in settings applies
    // to the next upload, with no invalidation wiring.
    const allowed = new AllowedFileTypesService(await createTestAppSettingsRepo(testDb));
    setAppSetting(testDb, 'allowed_file_types', 'md,markdown');
    expect(await allowed.get()).toBe('md,markdown');
  });
});
