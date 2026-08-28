/**
 * The trip-file MCP surface (FilesMcp): listing a trip's documents, reading one
 * document's contents under its own scope, and the attach/describe writes.
 *
 * The gates are what this file is really about. Every tool has to answer exactly
 * what its REST route answers: trip access before anything else, file_edit on
 * the writes, and a file id that is only resolvable inside its own trip. And
 * read_trip_file has to stay behind files:content while list_trip_files answers
 * on files:read alone.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import fs from 'node:fs';
import nodePath from 'node:path';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

const { fixture } = vi.hoisted(() => ({ fixture: {} as { root: string } }));
// Each createMcpHarness() builds a fresh registry, and the helper hands every one
// of those its own mkdtemp root, so bytes written by a test would land in a
// directory the next registry never looks at. Pin one shared fixture instead,
// which is what lets read_trip_file return a file this suite wrote.
vi.mock('../../helpers/storage-fixture', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../helpers/storage-fixture')>();
  const shared = actual.makeStorageFixture('');
  fixture.root = shared.root;
  return { makeStorageFixture: () => shared };
});

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { invalidatePermissionsCache } from '../../../src/nest/permissions/permissions-cache';
import { createUser, createTrip, createDay, createPlace, createDayAssignment, createReservation, addTripMember } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { FilesModule } from '../../../src/nest/files/files.module';
import { FilesMcp } from '../../../src/nest/files/files.mcp';
import { FILE_CONTENT_MAX } from '../../../src/nest/files/files.service';
import { StorageService } from '../../../src/nest/storage/storage.service';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
  // resetTestDb truncates app_settings, but the permission cache is module-scoped
  // and would keep serving whatever the previous case configured.
  invalidatePermissionsCache();
});

afterAll(() => {
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

/** Lower a configurable action the way the admin permission panel does. */
function setPermission(action: string, level: string) {
  testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(`perm_${action}`, level);
  invalidatePermissionsCache();
}

interface FileRowOverrides {
  filename: string;
  original_name: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  uploaded_by: number | null;
  place_id: number | null;
  reservation_id: number | null;
  starred: number;
  deleted_at: string | null;
}

/** A trip_files row, straight in: there is no upload path through MCP to make one. */
function insertFile(tripId: number, overrides: Partial<FileRowOverrides> = {}) {
  const info = testDb.prepare(`
    INSERT INTO trip_files (trip_id, filename, original_name, file_size, mime_type, description, uploaded_by, place_id, reservation_id, starred, deleted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tripId,
    overrides.filename ?? 'stored-visa.pdf',
    overrides.original_name ?? 'visa.pdf',
    // `??` would swallow an explicit null here, and a row with no recorded size
    // or type is exactly what the fallback cases need.
    overrides.file_size === undefined ? 2 : overrides.file_size,
    overrides.mime_type === undefined ? 'application/pdf' : overrides.mime_type,
    overrides.description ?? null,
    overrides.uploaded_by ?? null,
    overrides.place_id ?? null,
    overrides.reservation_id ?? null,
    overrides.starred ?? 0,
    overrides.deleted_at ?? null,
  );
  return testDb.prepare('SELECT * FROM trip_files WHERE id = ?').get(info.lastInsertRowid) as { id: number; description: string | null; place_id: number | null; reservation_id: number | null };
}

/** Put real bytes where the storage layer will look for `filename`. */
function storeBytes(filename: string, body: Buffer | string) {
  fs.writeFileSync(nodePath.join(fixture.root, filename), body);
}

function fileRow(id: number) {
  return testDb.prepare('SELECT description, place_id, reservation_id FROM trip_files WHERE id = ?').get(id) as
    { description: string | null; place_id: number | null; reservation_id: number | null };
}

function linkRows(fileId: number) {
  return testDb.prepare('SELECT * FROM file_links WHERE file_id = ?').all(fileId) as
    { id: number; reservation_id: number | null; assignment_id: number | null; place_id: number | null }[];
}

// ---------------------------------------------------------------------------
// list_trip_files
// ---------------------------------------------------------------------------

describe('Tool: list_trip_files', () => {
  it('reports name, size, uploader, links and starred state', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const reservation = createReservation(testDb, trip.id, { title: 'Hotel Ritz' });
    const file = insertFile(trip.id, {
      original_name: 'boarding-pass.pdf', file_size: 4242, uploaded_by: user.id,
      place_id: place.id, reservation_id: reservation.id, starred: 1, description: 'AF1234',
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_trip_files', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      expect(data.files).toHaveLength(1);
      expect(data.files[0]).toMatchObject({
        id: file.id,
        original_name: 'boarding-pass.pdf',
        file_size: 4242,
        mime_type: 'application/pdf',
        description: 'AF1234',
        starred: 1,
        deleted_at: null,
        reservation_title: 'Hotel Ritz',
        uploaded_by_name: user.username,
      });
    });
  });

  it('lists the trash only when asked for it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    insertFile(trip.id, { original_name: 'live.pdf' });
    insertFile(trip.id, { original_name: 'trashed.pdf', deleted_at: '2027-01-01 10:00:00' });

    await withHarness(user.id, async (h) => {
      const live = parseToolResult(await h.client.callTool({ name: 'list_trip_files', arguments: { tripId: trip.id } })) as any;
      expect(live.files.map((f: any) => f.original_name)).toEqual(['live.pdf']);

      const trashed = parseToolResult(await h.client.callTool({ name: 'list_trip_files', arguments: { tripId: trip.id, trash: true } })) as any;
      expect(trashed.files.map((f: any) => f.original_name)).toEqual(['trashed.pdf']);
    });
  });

  it('reports the bookings and places a file is linked to', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const reservation = createReservation(testDb, trip.id);
    const file = insertFile(trip.id);
    testDb.prepare('INSERT INTO file_links (file_id, reservation_id) VALUES (?, ?)').run(file.id, reservation.id);
    testDb.prepare('INSERT INTO file_links (file_id, place_id) VALUES (?, ?)').run(file.id, place.id);

    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({ name: 'list_trip_files', arguments: { tripId: trip.id } })) as any;
      expect(data.files[0].linked_reservation_ids).toEqual([reservation.id]);
      expect(data.files[0].linked_place_ids).toEqual([place.id]);
    });
  });

  it('denies a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_trip_files', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// read_trip_file
// ---------------------------------------------------------------------------

describe('Tool: read_trip_file', () => {
  it('returns a text document as text', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const file = insertFile(trip.id, { filename: 'notes.txt', original_name: 'packing-notes.txt', mime_type: 'text/plain', file_size: 11 });
    storeBytes('notes.txt', 'Bring socks');

    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'read_trip_file', arguments: { tripId: trip.id, fileId: file.id },
      })) as any;
      expect(data.file).toMatchObject({
        id: file.id, name: 'packing-notes.txt', mimetype: 'text/plain', size: 11, encoding: 'utf8', content: 'Bring socks',
      });
    });
  });

  it('returns a binary document base64-encoded', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0xff]);
    const file = insertFile(trip.id, { filename: 'stored.pdf', mime_type: 'application/pdf', file_size: bytes.length });
    storeBytes('stored.pdf', bytes);

    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'read_trip_file', arguments: { tripId: trip.id, fileId: file.id },
      })) as any;
      expect(data.file.encoding).toBe('base64');
      expect(Buffer.from(data.file.content, 'base64').equals(bytes)).toBe(true);
    });
  });

  it('falls back to a binary mimetype when the row has none', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const file = insertFile(trip.id, { filename: 'unknown.bin', mime_type: null, file_size: null });
    storeBytes('unknown.bin', 'hi');

    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'read_trip_file', arguments: { tripId: trip.id, fileId: file.id },
      })) as any;
      expect(data.file.mimetype).toBe('application/octet-stream');
      expect(data.file.encoding).toBe('base64');
    });
  });

  it('refuses a file that belongs to another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreign = insertFile(otherTrip.id, { filename: 'foreign.txt', mime_type: 'text/plain' });
    storeBytes('foreign.txt', 'secret');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'read_trip_file', arguments: { tripId: trip.id, fileId: foreign.id } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('File not found.');
    });
  });

  it('refuses a trashed file', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const file = insertFile(trip.id, { filename: 'trashed.txt', mime_type: 'text/plain', deleted_at: '2027-01-01 10:00:00' });
    storeBytes('trashed.txt', 'gone');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'read_trip_file', arguments: { tripId: trip.id, fileId: file.id } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('File not found.');
    });
  });

  it('refuses a file over the 10 MB cap without touching the bytes', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Recorded size only: the refusal happens before the storage layer is asked,
    // which is the whole point of capping on the row.
    const file = insertFile(trip.id, { filename: 'huge.mp4', mime_type: 'video/mp4', file_size: FILE_CONTENT_MAX + 1 });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'read_trip_file', arguments: { tripId: trip.id, fileId: file.id } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('too large to read here (over 10 MB)');
    });
  });

  it('reports a row whose bytes are gone as unavailable, not as a crash', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const file = insertFile(trip.id, { filename: 'never-stored.pdf' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'read_trip_file', arguments: { tripId: trip.id, fileId: file.id } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('File contents are not available.');
    });
  });

  it('lets an unexpected storage failure surface instead of calling the file missing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const file = insertFile(trip.id, { filename: 'flaky.txt', mime_type: 'text/plain' });
    storeBytes('flaky.txt', 'hi');
    // A backend outage is not one of the three refusals: reporting it as "not
    // found" would send the caller off to fix a file that is perfectly fine.
    const outage = vi.spyOn(StorageService.prototype, 'getStream').mockRejectedValueOnce(new Error('backend down'));

    try {
      await withHarness(user.id, async (h) => {
        const result = await h.client.callTool({ name: 'read_trip_file', arguments: { tripId: trip.id, fileId: file.id } });
        expect(result.isError).toBe(true);
        const text = JSON.stringify(result.content);
        expect(text).not.toContain('File not found.');
        expect(text).not.toContain('File contents are not available.');
      });
    } finally {
      outage.mockRestore();
    }
  });

  it('denies a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const file = insertFile(trip.id, { filename: 'members-only.txt', mime_type: 'text/plain' });
    storeBytes('members-only.txt', 'secret');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'read_trip_file', arguments: { tripId: trip.id, fileId: file.id } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('Trip not found or access denied.');
    });
  });
});

// ---------------------------------------------------------------------------
// update_trip_file
// ---------------------------------------------------------------------------

describe('Tool: update_trip_file', () => {
  it('sets the description and attaches the file to a place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'update_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, description: 'Museum ticket', place_id: place.id },
      })) as any;
      expect(data.file.description).toBe('Museum ticket');
      expect(fileRow(file.id)).toMatchObject({ description: 'Museum ticket', place_id: place.id });
    });
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'file:updated', expect.objectContaining({ _source: 'mcp' }));
  });

  it('leaves out fields the caller did not send', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    const file = insertFile(trip.id, { description: 'Keep me' });

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, reservation_id: reservation.id },
      });
      expect(fileRow(file.id)).toMatchObject({ description: 'Keep me', reservation_id: reservation.id });
    });
  });

  it('detaches a booking when reservation_id is null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    const file = insertFile(trip.id, { reservation_id: reservation.id });

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, reservation_id: null },
      });
      expect(fileRow(file.id).reservation_id).toBeNull();
    });
  });

  it('refuses a place that belongs to another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreignPlace = createPlace(testDb, otherTrip.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, place_id: foreignPlace.id },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('does not belong to this trip (place_id)');
      expect(fileRow(file.id).place_id).toBeNull();
    });
  });

  it('refuses a file id from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreign = insertFile(otherTrip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip_file',
        arguments: { tripId: trip.id, fileId: foreign.id, description: 'x' },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('File not found.');
    });
  });

  it('refuses a member once file_edit is owner-only', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const file = insertFile(trip.id);
    setPermission('file_edit', 'trip_owner');

    await withHarness(member.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, description: 'nope' },
      });
      expect(result.isError).toBe(true);
      expect(fileRow(file.id).description).toBeNull();
    });
  });

  it('denies a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, description: 'nope' },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('Trip not found or access denied.');
    });
  });

  it('blocks a demo user before it looks at the trip', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@trek.app' });
    const trip = createTrip(testDb, user.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, description: 'nope' },
      });
      expect(result.isError).toBe(true);
      expect(fileRow(file.id).description).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// link_trip_file
// ---------------------------------------------------------------------------

describe('Tool: link_trip_file', () => {
  it('attaches one file to a booking, a place and a day assignment', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const day = createDay(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const first = parseToolResult(await h.client.callTool({
        name: 'link_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, reservation_id: reservation.id },
      })) as any;
      expect(first.success).toBe(true);
      expect(first.links).toHaveLength(1);

      await h.client.callTool({
        name: 'link_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, place_id: place.id, assignment_id: assignment.id },
      });
    });

    const links = linkRows(file.id);
    expect(links).toHaveLength(2);
    expect(links[0].reservation_id).toBe(reservation.id);
    expect(links[1]).toMatchObject({ place_id: place.id, assignment_id: assignment.id });
  });

  it('refuses a call with no target instead of storing an empty link', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'link_trip_file', arguments: { tripId: trip.id, fileId: file.id } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('at least one of reservation_id');
    });
    expect(linkRows(file.id)).toHaveLength(0);
  });

  it('refuses a booking from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreignReservation = createReservation(testDb, otherTrip.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, reservation_id: foreignReservation.id },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('does not belong to this trip (reservation_id)');
    });
    expect(linkRows(file.id)).toHaveLength(0);
  });

  it('refuses a day assignment from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreignDay = createDay(testDb, otherTrip.id);
    const foreignPlace = createPlace(testDb, otherTrip.id);
    const foreignAssignment = createDayAssignment(testDb, foreignDay.id, foreignPlace.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, assignment_id: foreignAssignment.id },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('does not belong to this trip (assignment_id)');
    });
  });

  it('refuses a file id from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreign = insertFile(otherTrip.id);
    const reservation = createReservation(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_trip_file',
        arguments: { tripId: trip.id, fileId: foreign.id, reservation_id: reservation.id },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('File not found.');
    });
  });

  it('refuses a member once file_edit is owner-only', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const reservation = createReservation(testDb, trip.id);
    const file = insertFile(trip.id);
    setPermission('file_edit', 'trip_owner');

    await withHarness(member.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, reservation_id: reservation.id },
      });
      expect(result.isError).toBe(true);
    });
    expect(linkRows(file.id)).toHaveLength(0);
  });

  it('denies a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const reservation = createReservation(testDb, trip.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, reservation_id: reservation.id },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('Trip not found or access denied.');
    });
  });

  it('blocks a demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@trek.app' });
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, reservation_id: reservation.id },
      });
      expect(result.isError).toBe(true);
    });
    expect(linkRows(file.id)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// unlink_trip_file
// ---------------------------------------------------------------------------

describe('Tool: unlink_trip_file', () => {
  it('removes one link and leaves the others alone', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const file = insertFile(trip.id);
    testDb.prepare('INSERT INTO file_links (file_id, reservation_id) VALUES (?, ?)').run(file.id, reservation.id);
    testDb.prepare('INSERT INTO file_links (file_id, place_id) VALUES (?, ?)').run(file.id, place.id);
    const doomed = linkRows(file.id)[0].id;

    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'unlink_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, linkId: doomed },
      })) as any;
      expect(data.success).toBe(true);
    });
    const left = linkRows(file.id);
    expect(left).toHaveLength(1);
    expect(left[0].place_id).toBe(place.id);
  });

  it('refuses a file id from another trip, so a foreign link survives', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreignFile = insertFile(otherTrip.id);
    const foreignReservation = createReservation(testDb, otherTrip.id);
    testDb.prepare('INSERT INTO file_links (file_id, reservation_id) VALUES (?, ?)').run(foreignFile.id, foreignReservation.id);
    const linkId = linkRows(foreignFile.id)[0].id;

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'unlink_trip_file',
        arguments: { tripId: trip.id, fileId: foreignFile.id, linkId },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('File not found.');
    });
    expect(linkRows(foreignFile.id)).toHaveLength(1);
  });

  it('refuses a member once file_edit is owner-only', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const reservation = createReservation(testDb, trip.id);
    const file = insertFile(trip.id);
    testDb.prepare('INSERT INTO file_links (file_id, reservation_id) VALUES (?, ?)').run(file.id, reservation.id);
    const linkId = linkRows(file.id)[0].id;
    setPermission('file_edit', 'trip_owner');

    await withHarness(member.id, async (h) => {
      const result = await h.client.callTool({
        name: 'unlink_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, linkId },
      });
      expect(result.isError).toBe(true);
    });
    expect(linkRows(file.id)).toHaveLength(1);
  });

  it('denies a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'unlink_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, linkId: 1 },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('Trip not found or access denied.');
    });
  });

  it('blocks a demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    const file = insertFile(trip.id);
    testDb.prepare('INSERT INTO file_links (file_id, reservation_id) VALUES (?, ?)').run(file.id, reservation.id);
    const linkId = linkRows(file.id)[0].id;

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'unlink_trip_file',
        arguments: { tripId: trip.id, fileId: file.id, linkId },
      });
      expect(result.isError).toBe(true);
    });
    expect(linkRows(file.id)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// list_trip_file_links
// ---------------------------------------------------------------------------

describe('Tool: list_trip_file_links', () => {
  it('returns every link with its id and the booking title', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id, { title: 'Nightjet 421' });
    const file = insertFile(trip.id);
    testDb.prepare('INSERT INTO file_links (file_id, reservation_id) VALUES (?, ?)').run(file.id, reservation.id);

    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'list_trip_file_links', arguments: { tripId: trip.id, fileId: file.id },
      })) as any;
      expect(data.links).toHaveLength(1);
      expect(data.links[0]).toMatchObject({ file_id: file.id, reservation_id: reservation.id, reservation_title: 'Nightjet 421' });
      expect(typeof data.links[0].id).toBe('number');
    });
  });

  it('refuses a file id from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreign = insertFile(otherTrip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_trip_file_links', arguments: { tripId: trip.id, fileId: foreign.id },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('File not found.');
    });
  });

  it('denies a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const file = insertFile(trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_trip_file_links', arguments: { tripId: trip.id, fileId: file.id },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Scope gating
// ---------------------------------------------------------------------------

describe('File tools: scope gating', () => {
  const READ_TOOLS = ['list_trip_files', 'list_trip_file_links'];
  const WRITE_TOOLS = ['update_trip_file', 'link_trip_file', 'unlink_trip_file'];

  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers all six tools for a full-access session', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, null);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS, 'read_trip_file']) expect(names).toContain(tool);
  });

  it('files:read lists the documents but does not open them', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['files:read']);
    for (const tool of READ_TOOLS) expect(names).toContain(tool);
    for (const tool of [...WRITE_TOOLS, 'read_trip_file']) expect(names).not.toContain(tool);
  });

  it('files:content opens a document without granting the listing', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['files:content']);
    expect(names).toContain('read_trip_file');
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).not.toContain(tool);
  });

  it('files:write carries the reads, and still not the contents', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['files:write']);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).toContain(tool);
    expect(names).not.toContain('read_trip_file');
  });

  it('a token without any files scope gets none of them', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['trips:read']);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS, 'read_trip_file']) expect(names).not.toContain(tool);
  });
});

describe('FilesMcp wiring', () => {
  it('is listed in its module providers', () => {
    expectRegisteredProvider(FilesModule, FilesMcp);
  });
});
