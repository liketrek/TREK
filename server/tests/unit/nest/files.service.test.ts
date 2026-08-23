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

const { testDb, bareDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  // A second, schema-less DB for the getAllowedExtensions catch branch.
  const bare = new Database(':memory:');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: unknown, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: unknown, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, bareDb: bare, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

const checkPermission = vi.fn(() => true);
const permissionsStub = { checkPermission } as unknown as PermissionsService;

const { verifyJwtAndLoadUser } = vi.hoisted(() => ({ verifyJwtAndLoadUser: vi.fn() }));
vi.mock('../../../src/nest/auth/jwt-verify', () => ({ verifyJwtAndLoadUser }));

const { consumeEphemeralToken } = vi.hoisted(() => ({ consumeEphemeralToken: vi.fn() }));
vi.mock('../../../src/nest/auth/ephemeral-tokens', () => ({ consumeEphemeralToken }));

import type { Request } from 'express';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember, createPlace, createReservation, createDay, createDayAssignment, setAppSetting } from '../../helpers/factories';
import { DatabaseService, type TripAccess } from '../../../src/nest/database/database.service';
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
import type { TripFile, User } from '../../../src/types';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';

const storageDelete = vi.fn();
const storageStub = { delete: storageDelete } as unknown as import('../../../src/nest/storage/storage.service').StorageService;
const svc = new FilesService(new DatabaseService(testDb), permissionsStub, new RealtimeService(), new EphemeralTokenService(), storageStub);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  testDb.close();
  bareDb.close();
});

function seedTrip() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  return { user, trip };
}

function makeFile(tripId: number, userId: number, overrides: Partial<{ filename: string; originalname: string; size: number; mimetype: string }> = {}, opts: Parameters<FilesService['createFile']>[3] = {}) {
  return svc.createFile(
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
  it('FILE-SVC-006: returns the app_settings value when set', () => {
    setAppSetting(testDb, 'allowed_file_types', 'pdf,txt');
    expect(new AllowedFileTypesService(new DatabaseService(testDb)).get()).toBe('pdf,txt');
  });

  it('FILE-SVC-007: returns the default when the row is absent', () => {
    expect(new AllowedFileTypesService(new DatabaseService(testDb)).get()).toBe(DEFAULT_ALLOWED_EXTENSIONS);
  });

  it('FILE-SVC-008: returns the default for an empty value (|| coercion, not ??)', () => {
    setAppSetting(testDb, 'allowed_file_types', '');
    expect(new AllowedFileTypesService(new DatabaseService(testDb)).get()).toBe(DEFAULT_ALLOWED_EXTENSIONS);
  });

  it('FILE-SVC-009: returns the default when the query throws (no app_settings table)', () => {
    expect(new AllowedFileTypesService(new DatabaseService(bareDb)).get()).toBe(DEFAULT_ALLOWED_EXTENSIONS);
  });
});

// ── trip-scoped reads ─────────────────────────────────────────────────────────

describe('getFileById / getDeletedFile', () => {
  it('FILE-SVC-010: getFileById is trip-scoped', () => {
    const { user, trip } = seedTrip();
    const other = createTrip(testDb, user.id);
    const file = makeFile(trip.id, user.id);
    expect(svc.getFileById(file.id, trip.id)?.id).toBe(file.id);
    expect(svc.getFileById(file.id, other.id)).toBeUndefined();
  });

  it('FILE-SVC-011: getDeletedFile returns only soft-deleted rows', () => {
    const { user, trip } = seedTrip();
    const file = makeFile(trip.id, user.id);
    expect(svc.getDeletedFile(file.id, trip.id)).toBeUndefined();
    svc.softDeleteFile(file.id);
    expect(svc.getDeletedFile(file.id, trip.id)?.id).toBe(file.id);
  });
});

describe('listFiles', () => {
  it('FILE-SVC-012: active list excludes trash, is starred-first and carries the formatted shape', () => {
    const { user, trip } = seedTrip();
    makeFile(trip.id, user.id, { originalname: 'plain.pdf' });
    const starred = makeFile(trip.id, user.id, { originalname: 'starred.pdf' });
    const trashed = makeFile(trip.id, user.id, { originalname: 'gone.pdf' });
    svc.toggleStarred(starred.id, 0);
    svc.softDeleteFile(trashed.id);

    const files = svc.listFiles(trip.id, false) as Record<string, unknown>[];
    expect(files.map((f) => f.id)).toHaveLength(2);
    expect(files[0].id).toBe(starred.id); // ORDER BY f.starred DESC first
    expect(files.map((f) => f.id)).not.toContain(trashed.id);
    expect(files[0].url).toBe(`/api/trips/${trip.id}/files/${starred.id}/download`);
    expect(files[0].uploaded_by_name).toBe(user.username);
    expect(files[0]).toHaveProperty('uploaded_by_avatar');
  });

  it('FILE-SVC-013: trash list returns only soft-deleted files', () => {
    const { user, trip } = seedTrip();
    const kept = makeFile(trip.id, user.id);
    const trashed = makeFile(trip.id, user.id);
    svc.softDeleteFile(trashed.id);

    const trash = svc.listFiles(trip.id, true) as Record<string, unknown>[];
    expect(trash.map((f) => f.id)).toEqual([trashed.id]);
    expect(trash.map((f) => f.id)).not.toContain(kept.id);
  });

  it('FILE-SVC-014: batches file_links and filters null targets by truthiness', () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const linked = makeFile(trip.id, user.id);
    const bare = makeFile(trip.id, user.id);
    svc.createFileLink(linked.id, { reservation_id: reservation.id });
    svc.createFileLink(linked.id, { place_id: place.id });

    const files = svc.listFiles(trip.id, false) as Record<string, unknown>[];
    const linkedRow = files.find((f) => f.id === linked.id);
    const bareRow = files.find((f) => f.id === bare.id);
    expect(linkedRow.linked_reservation_ids).toEqual([reservation.id]);
    expect(linkedRow.linked_place_ids).toEqual([place.id]);
    expect(bareRow.linked_reservation_ids).toEqual([]);
    expect(bareRow.linked_place_ids).toEqual([]);

    // The empty-trip guard skips the IN () batch entirely.
    const empty = createTrip(testDb, user.id);
    expect(svc.listFiles(empty.id, false)).toEqual([]);
  });
});

// ── createFile / updateFile / toggleStarred ───────────────────────────────────

describe('createFile', () => {
  it('FILE-SVC-015: coerces falsy opts to NULL (|| null) and re-selects the formatted row', () => {
    const { user, trip } = seedTrip();
    const file = makeFile(trip.id, user.id, {}, { place_id: '', reservation_id: undefined, description: '' });
    const row = testDb.prepare('SELECT * FROM trip_files WHERE id = ?').get(file.id) as Record<string, unknown>;
    expect(row.place_id).toBeNull();
    expect(row.reservation_id).toBeNull();
    expect(row.description).toBeNull();
    expect(file.url).toBe(`/api/trips/${trip.id}/files/${file.id}/download`);
    expect((file as unknown as Record<string, unknown>).uploaded_by_name).toBe(user.username);
  });

  it('FILE-SVC-016: stores the provided metadata and links the reservation title through FILE_SELECT', () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id, { title: 'Night train' });
    const file = makeFile(trip.id, user.id, { originalname: 'ticket.pdf', size: 99, mimetype: 'application/pdf' }, {
      reservation_id: String(reservation.id),
      description: 'the booking',
    });
    expect((file as unknown as Record<string, unknown>).reservation_title).toBe('Night train');
    expect(file.description).toBe('the booking');
    expect(file.original_name).toBe('ticket.pdf');
    expect(file.file_size).toBe(99);
    expect(file.uploaded_by).toBe(user.id);
  });
});

describe('updateFile', () => {
  it('FILE-SVC-017: undefined fields keep the current values', () => {
    const { user, trip } = seedTrip();
    const place = createPlace(testDb, trip.id);
    const file = makeFile(trip.id, user.id, {}, { description: 'keep me', place_id: String(place.id) });
    const current = svc.getFileById(file.id, trip.id)!;
    const updated = svc.updateFile(file.id, current, {}) as Record<string, unknown>;
    expect(updated.description).toBe('keep me');
    expect(updated.place_id).toBe(place.id);
  });

  it("FILE-SVC-018: '' clears every field (|| null) — description matches createFile's coercion", () => {
    const { user, trip } = seedTrip();
    const place = createPlace(testDb, trip.id);
    const reservation = createReservation(testDb, trip.id);
    const file = makeFile(trip.id, user.id, {}, { description: 'old', place_id: String(place.id), reservation_id: String(reservation.id) });
    const current = svc.getFileById(file.id, trip.id)!;
    const updated = svc.updateFile(file.id, current, { description: '', place_id: '', reservation_id: null }) as Record<string, unknown>;
    expect(updated.description).toBeNull(); // '' → NULL on update too (post-migration fix: symmetric with createFile)
    expect(updated.place_id).toBeNull();
    expect(updated.reservation_id).toBeNull();
  });
});

describe('toggleStarred / softDeleteFile / restoreFile', () => {
  it('FILE-SVC-019: toggleStarred flips 0→1 and 1→0', () => {
    const { user, trip } = seedTrip();
    const file = makeFile(trip.id, user.id);
    const on = svc.toggleStarred(file.id, 0);
    expect(on.starred).toBe(1);
    const off = svc.toggleStarred(file.id, on.starred);
    expect(off.starred).toBe(0);
  });

  it('FILE-SVC-020: softDeleteFile stamps deleted_at', () => {
    const { user, trip } = seedTrip();
    const file = makeFile(trip.id, user.id);
    svc.softDeleteFile(file.id);
    const row = testDb.prepare('SELECT deleted_at FROM trip_files WHERE id = ?').get(file.id) as Record<string, unknown>;
    expect(row.deleted_at).not.toBeNull();
  });

  it('FILE-SVC-021: restoreFile clears deleted_at and returns the formatted row', () => {
    const { user, trip } = seedTrip();
    const file = makeFile(trip.id, user.id);
    svc.softDeleteFile(file.id);
    const restored = svc.restoreFile(file.id) as Record<string, unknown>;
    expect(restored.deleted_at).toBeNull();
    expect(restored.url).toBe(`/api/trips/${trip.id}/files/${file.id}/download`);
  });
});

// ── permanentDeleteFile / emptyTrash (unlink-first semantics) ─────────────────

describe('permanentDeleteFile', () => {
  it('FILE-SVC-022: deletes the storage object (idempotent on missing), then the DB row', async () => {
    const { user, trip } = seedTrip();
    const file = makeFile(trip.id, user.id, { filename: 'on-disk.pdf' });
    storageDelete.mockResolvedValue(undefined);
    await svc.permanentDeleteFile(svc.getFileById(file.id, trip.id) as TripFile);
    expect(storageDelete).toHaveBeenCalledWith('files', 'on-disk.pdf');
    expect(svc.getFileById(file.id, trip.id)).toBeUndefined();
  });

  it('FILE-SVC-023: a delete failure logs [files], rethrows and keeps the DB row', async () => {
    const { user, trip } = seedTrip();
    const file = makeFile(trip.id, user.id, { filename: 'stuck.pdf' });
    const boom = new Error('EACCES');
    storageDelete.mockRejectedValue(boom);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(svc.permanentDeleteFile(svc.getFileById(file.id, trip.id) as TripFile)).rejects.toThrow('EACCES');
    expect(err).toHaveBeenCalledWith('[files] unlink failed for stuck.pdf, keeping DB row:', boom);
    expect(svc.getFileById(file.id, trip.id)).toBeDefined();
  });
});

describe('emptyTrash', () => {
  it('FILE-SVC-024: unlinks every trashed file and deletes their rows, returning the count', async () => {
    const { user, trip } = seedTrip();
    const a = makeFile(trip.id, user.id, { filename: 'a.pdf' });
    const b = makeFile(trip.id, user.id, { filename: 'b.pdf' });
    const kept = makeFile(trip.id, user.id, { filename: 'kept.pdf' });
    svc.softDeleteFile(a.id);
    svc.softDeleteFile(b.id);
    storageDelete.mockResolvedValue(undefined);

    await expect(svc.emptyTrash(trip.id)).resolves.toBe(2);
    expect(svc.listFiles(trip.id, true)).toEqual([]);
    expect(svc.getFileById(kept.id, trip.id)).toBeDefined();
  });

  it('FILE-SVC-025: a partial unlink failure keeps the failed row, swallows the error and counts only successes', async () => {
    const { user, trip } = seedTrip();
    const good = makeFile(trip.id, user.id, { filename: 'good.pdf' });
    const bad = makeFile(trip.id, user.id, { filename: 'bad.pdf' });
    svc.softDeleteFile(good.id);
    svc.softDeleteFile(bad.id);
    const boom = new Error('EBUSY');
    storageDelete.mockImplementation((_category: string, name: string) =>
      name.includes('bad.pdf') ? Promise.reject(boom) : Promise.resolve()
    );
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(svc.emptyTrash(trip.id)).resolves.toBe(1);
    expect(err).toHaveBeenCalledWith('[files] unlink failed for bad.pdf, keeping DB row:', boom);
    expect(svc.getFileById(good.id, trip.id)).toBeUndefined();
    expect(svc.getDeletedFile(bad.id, trip.id)).toBeDefined();
  });

  it('FILE-SVC-026: an empty trash resolves to 0 without touching storage', async () => {
    const { trip } = seedTrip();
    await expect(svc.emptyTrash(trip.id)).resolves.toBe(0);
    expect(storageDelete).not.toHaveBeenCalled();
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

  it('FILE-SVC-027: flags each foreign target kind and passes same-trip ids', () => {
    const { mine, foreign } = twoTrips();
    const foreignRes = createReservation(testDb, foreign.id);
    const foreignPlace = createPlace(testDb, foreign.id);
    const foreignDay = createDay(testDb, foreign.id);
    const foreignAssignment = createDayAssignment(testDb, foreignDay.id, createPlace(testDb, foreign.id).id);
    const myRes = createReservation(testDb, mine.id);

    expect(svc.findForeignLinkTarget(mine.id, { reservation_id: foreignRes.id })).toBe('reservation_id');
    expect(svc.findForeignLinkTarget(mine.id, { place_id: foreignPlace.id })).toBe('place_id');
    expect(svc.findForeignLinkTarget(mine.id, { assignment_id: foreignAssignment.id })).toBe('assignment_id');
    expect(svc.findForeignLinkTarget(mine.id, { reservation_id: myRes.id })).toBeNull();
  });

  it('FILE-SVC-028: falsy ids are skipped (they clear the link) and reservation is checked first', () => {
    const { mine, foreign } = twoTrips();
    const foreignRes = createReservation(testDb, foreign.id);
    const foreignPlace = createPlace(testDb, foreign.id);

    expect(svc.findForeignLinkTarget(mine.id, { reservation_id: 0, place_id: null, assignment_id: undefined })).toBeNull();
    expect(svc.findForeignLinkTarget(mine.id, { reservation_id: '' })).toBeNull();
    // Both foreign — the reservation check runs before the place check.
    expect(svc.findForeignLinkTarget(mine.id, { reservation_id: foreignRes.id, place_id: foreignPlace.id })).toBe('reservation_id');
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
  it('FILE-SVC-029: inserts with || null coercion, dedupes via INSERT OR IGNORE and returns the re-select', () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id, { title: 'Ferry' });
    const file = makeFile(trip.id, user.id);

    const links = svc.createFileLink(file.id, { reservation_id: reservation.id, place_id: '' }) as FileLinkRow[];
    expect(links).toHaveLength(1);
    expect(links[0].reservation_id).toBe(reservation.id);
    expect(links[0].place_id).toBeNull();

    const again = svc.createFileLink(file.id, { reservation_id: reservation.id }) as FileLinkRow[];
    expect(again).toHaveLength(1); // UNIQUE(file_id, reservation_id) + OR IGNORE

    const hydrated = svc.getFileLinks(file.id) as FileLinkRow[];
    expect(hydrated[0].reservation_title).toBe('Ferry');
  });

  it('FILE-SVC-030: an insert error propagates (post-migration fix: no silent swallow)', () => {
    const { user, trip } = seedTrip();
    const file = makeFile(trip.id, user.id);
    expect(() => svc.createFileLink(file.id, { reservation_id: { bad: true } as never })).toThrow();
  });

  it('FILE-SVC-031: deleteFileLink is scoped to (id AND file_id)', () => {
    const { user, trip } = seedTrip();
    const reservation = createReservation(testDb, trip.id);
    const file = makeFile(trip.id, user.id);
    const other = makeFile(trip.id, user.id);
    const [link] = svc.createFileLink(file.id, { reservation_id: reservation.id }) as FileLinkRow[];

    svc.deleteFileLink(link.id, other.id); // wrong file — no-op
    expect(svc.getFileLinks(file.id)).toHaveLength(1);
    svc.deleteFileLink(link.id, file.id);
    expect(svc.getFileLinks(file.id)).toHaveLength(0);
  });
});

// ── download auth & glue ──────────────────────────────────────────────────────

describe('authenticateDownload', () => {
  it('FILE-SVC-032: a valid session cookie wins over a bearer token', () => {
    verifyJwtAndLoadUser.mockReturnValue({ id: 42 });
    const result = svc.authenticateDownload(req({ cookie: 'cookie-jwt', bearer: 'bearer-jwt' }));
    expect(result).toEqual({ userId: 42 });
    expect(verifyJwtAndLoadUser).toHaveBeenCalledWith('cookie-jwt');
  });

  it('FILE-SVC-033: a bearer token is used when no cookie is present; invalid JWTs 401', () => {
    verifyJwtAndLoadUser.mockReturnValue({ id: 7 });
    expect(svc.authenticateDownload(req({ bearer: 'bearer-jwt' }))).toEqual({ userId: 7 });
    expect(verifyJwtAndLoadUser).toHaveBeenCalledWith('bearer-jwt');

    verifyJwtAndLoadUser.mockReturnValue(null);
    expect(svc.authenticateDownload(req({ bearer: 'stale' }))).toEqual({ error: 'Invalid or expired token', status: 401 });
  });

  it('FILE-SVC-034: a ?token= ephemeral token is consumed with the download purpose', () => {
    consumeEphemeralToken.mockReturnValue(9);
    expect(svc.authenticateDownload(req({ token: 'eph' }))).toEqual({ userId: 9 });
    expect(consumeEphemeralToken).toHaveBeenCalledWith('eph', 'download');

    consumeEphemeralToken.mockReturnValue(null);
    expect(svc.authenticateDownload(req({ token: 'spent' }))).toEqual({ error: 'Invalid or expired token', status: 401 });
  });

  it('FILE-SVC-035: no credentials at all is a 401 Authentication required', () => {
    expect(svc.authenticateDownload(req({}))).toEqual({ error: 'Authentication required', status: 401 });
    expect(verifyJwtAndLoadUser).not.toHaveBeenCalled();
    expect(consumeEphemeralToken).not.toHaveBeenCalled();
  });
});

describe('verifyTripAccess / can / files.bridge', () => {
  it('FILE-SVC-036: verifyTripAccess resolves owner and member, refuses strangers', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    expect(svc.verifyTripAccess(trip.id, owner.id)?.id).toBe(trip.id);
    expect(svc.verifyTripAccess(trip.id, member.id)).toBeDefined();
    expect(svc.verifyTripAccess(trip.id, stranger.id)).toBeFalsy();
  });

  it('FILE-SVC-037: can() forwards to checkPermission with the shared-trip flag', () => {
    const { user, trip } = seedTrip();
    const guest = { id: user.id + 1, role: 'user' } as unknown as User;
    checkPermission.mockReturnValue(true);
    // can() reads only trip.user_id, so the row stays deliberately partial:
    // TripAccess also carries currency, which no assertion here looks at.
    const tripRow = { id: trip.id, user_id: user.id } as TripAccess;

    expect(svc.can('file_edit', tripRow, guest)).toBe(true);
    expect(checkPermission).toHaveBeenCalledWith('file_edit', 'user', user.id, guest.id, true);

    svc.can('file_upload', tripRow, { id: user.id, role: 'user' } as unknown as User);
    expect(checkPermission).toHaveBeenLastCalledWith('file_upload', 'user', user.id, user.id, false);
  });

  it('FILE-SVC-038: the allowed-extension list is a live read, not a boot snapshot', () => {
    // Was asserted against files.bridge, which built its own FilesService. The
    // list moved to a leaf service the multer factories inject, and the property
    // that matters is unchanged: an admin editing the list in settings applies
    // to the next upload, with no invalidation wiring.
    const allowed = new AllowedFileTypesService(new DatabaseService(testDb));
    setAppSetting(testDb, 'allowed_file_types', 'md,markdown');
    expect(allowed.get()).toBe('md,markdown');
  });
});
