/**
 * Unit tests for the DI-native CollabService — COLLAB-SVC-001 to COLLAB-SVC-038
 * (001–030 moved 1:1 from the legacy tests/unit/services/collabService.test.ts;
 * 031–033 (collab.bridge delegation) died with the bridge; 034–038 pin the post-migration
 * hardening: transactional writes, trip-scoped getFormattedNoteById, the
 * integer vote guard and malformed-URL absorption). Covers votePoll edge
 * cases, listMessages pagination, deleteMessage ownership, updateNote partial
 * fields, linkPreview, avatarUrl, createMessage reply validation. Uses a real
 * in-memory SQLite DB so SQL logic is exercised faithfully.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

// ── DB setup ─────────────────────────────────────────────────────────────────

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
      db.prepare(`
        SELECT t.id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
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
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

// Stub checkSsrf so linkPreview tests can control SSRF behaviour. Typed from the real
// checkSsrf rather than from the default implementation below, so the stubbed results
// stay full SsrfResult objects instead of whatever shape the first fixture happened to have.
const { mockCheckSsrf, mockCreatePinnedDispatcher } = vi.hoisted(() => ({
  mockCheckSsrf: vi.fn<typeof import('../../../src/utils/ssrfGuard').checkSsrf>(
    async () => ({ allowed: true, isPrivate: false, resolvedIp: '93.184.216.34' }),
  ),
  mockCreatePinnedDispatcher: vi.fn(() => ({})),
}));
vi.mock('../../../src/utils/ssrfGuard', () => ({
  checkSsrf: mockCheckSsrf,
  createPinnedDispatcher: mockCreatePinnedDispatcher,
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { avatarUrl } from '../../../src/nest/common/avatarUrl';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { CollabService } from '../../../src/nest/collab/collab.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { notificationsStub } from '../../helpers/notifications';
import { makeStorageFixture } from '../../helpers/storage-fixture';

const collabFx = makeStorageFixture('files/');
const svc = new CollabService(new DatabaseService(testDb), new PermissionsService(new DatabaseService(testDb)), new RealtimeService(), notificationsStub(), collabFx.storage);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  mockCheckSsrf.mockResolvedValue({ allowed: true, isPrivate: false, resolvedIp: '93.184.216.34' });
});

afterAll(() => {
  testDb.close();
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockCheckSsrf.mockReset();
  mockCheckSsrf.mockResolvedValue({ allowed: true, isPrivate: false, resolvedIp: '93.184.216.34' });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup() {
  const { user: user1 } = createUser(testDb);
  const { user: user2 } = createUser(testDb);
  const trip = createTrip(testDb, user1.id);
  return { user1, user2, trip };
}

// ── avatarUrl ─────────────────────────────────────────────────────────────────

describe('avatarUrl', () => {
  it('COLLAB-SVC-001: returns null when avatar is null', () => {
    expect(avatarUrl({ avatar: null })).toBeNull();
  });

  it('COLLAB-SVC-002: returns upload path when avatar is set', () => {
    expect(avatarUrl({ avatar: 'abc.jpg' })).toBe('/uploads/avatars/abc.jpg');
  });

  it('COLLAB-SVC-003: returns null when avatar is empty string', () => {
    expect(avatarUrl({ avatar: '' })).toBeNull();
  });
});

// ── votePoll ──────────────────────────────────────────────────────────────────

describe('votePoll', () => {
  it('COLLAB-SVC-004: returns error "closed" when poll is closed', () => {
    const { user1, trip } = setup();
    const poll = svc.createPoll(trip.id, user1.id, { question: 'Q?', options: ['A', 'B'] });
    svc.closePoll(trip.id, poll!.id);

    const result = svc.votePoll(trip.id, poll!.id, user1.id, 0);
    expect(result.error).toBe('closed');
  });

  it('COLLAB-SVC-005: returns error "invalid_index" for negative index', () => {
    const { user1, trip } = setup();
    const poll = svc.createPoll(trip.id, user1.id, { question: 'Q?', options: ['A', 'B'] });

    const result = svc.votePoll(trip.id, poll!.id, user1.id, -1);
    expect(result.error).toBe('invalid_index');
  });

  it('COLLAB-SVC-006: returns error "invalid_index" for out-of-range index', () => {
    const { user1, trip } = setup();
    const poll = svc.createPoll(trip.id, user1.id, { question: 'Q?', options: ['A', 'B'] });

    const result = svc.votePoll(trip.id, poll!.id, user1.id, 5);
    expect(result.error).toBe('invalid_index');
  });

  it('COLLAB-SVC-007: returns error "not_found" for nonexistent poll', () => {
    const { user1, trip } = setup();
    const result = svc.votePoll(trip.id, 9999, user1.id, 0);
    expect(result.error).toBe('not_found');
  });

  it('COLLAB-SVC-008: successfully votes and returns poll with voters', () => {
    const { user1, trip } = setup();
    const poll = svc.createPoll(trip.id, user1.id, { question: 'Q?', options: ['Yes', 'No'] });

    const result = svc.votePoll(trip.id, poll!.id, user1.id, 0);
    expect(result.error).toBeUndefined();
    expect(result.poll).toBeDefined();
    expect(result.poll!.options[0].voters).toHaveLength(1);
  });

  it('COLLAB-SVC-009: toggles vote off when voted again on same option', () => {
    const { user1, trip } = setup();
    const poll = svc.createPoll(trip.id, user1.id, { question: 'Q?', options: ['Yes', 'No'] });

    svc.votePoll(trip.id, poll!.id, user1.id, 0);
    const result = svc.votePoll(trip.id, poll!.id, user1.id, 0);
    expect(result.poll!.options[0].voters).toHaveLength(0);
  });
});

// ── listMessages with before cursor ──────────────────────────────────────────

describe('listMessages', () => {
  it('COLLAB-SVC-010: returns all messages when no before cursor', () => {
    const { user1, trip } = setup();
    svc.createMessage(trip.id, user1.id, 'Hello');
    svc.createMessage(trip.id, user1.id, 'World');

    const msgs = svc.listMessages(trip.id);
    expect(msgs).toHaveLength(2);
  });

  it('COLLAB-SVC-011: paginates using before cursor (returns messages with id < before)', () => {
    const { user1, trip } = setup();
    svc.createMessage(trip.id, user1.id, 'First');
    svc.createMessage(trip.id, user1.id, 'Second');
    const r3 = svc.createMessage(trip.id, user1.id, 'Third');

    const id3 = r3.message!.id;
    const msgs = svc.listMessages(trip.id, id3);
    expect(msgs.length).toBe(2);
    const texts = msgs.map(m => m.text);
    expect(texts).toContain('First');
    expect(texts).toContain('Second');
    expect(texts).not.toContain('Third');
  });

  it('COLLAB-SVC-012: returns messages in ascending order (reversed after DESC query)', () => {
    const { user1, trip } = setup();
    svc.createMessage(trip.id, user1.id, 'A');
    svc.createMessage(trip.id, user1.id, 'B');
    svc.createMessage(trip.id, user1.id, 'C');

    const msgs = svc.listMessages(trip.id);
    expect(msgs[0].text).toBe('A');
    expect(msgs[2].text).toBe('C');
  });

  it('COLLAB-SVC-013a: blanks the text of a deleted message but keeps the flag', () => {
    const { user1, trip } = setup();
    const r = svc.createMessage(trip.id, user1.id, 'Secret plans');
    svc.deleteMessage(trip.id, r.message!.id, user1.id);

    const msgs = svc.listMessages(trip.id);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].text).toBe('');
    expect(msgs[0].deleted).toBe(1);
  });

  it('COLLAB-SVC-013b: blanks reply_text when the quoted message was deleted', () => {
    const { user1, trip } = setup();
    const original = svc.createMessage(trip.id, user1.id, 'Original secret');
    svc.createMessage(trip.id, user1.id, 'Quoting it', original.message!.id);
    svc.deleteMessage(trip.id, original.message!.id, user1.id);

    const msgs = svc.listMessages(trip.id);
    const reply = msgs.find(m => m.text === 'Quoting it')!;
    expect(reply.reply_text).toBe('');
  });

  it('COLLAB-SVC-013c: a deleted message cannot be quoted, and the create path blanks too', () => {
    const { user1, trip } = setup();
    const original = svc.createMessage(trip.id, user1.id, 'Original secret');
    svc.deleteMessage(trip.id, original.message!.id, user1.id);

    // Replying to something that is no longer there is refused outright.
    expect(svc.createMessage(trip.id, user1.id, 'Too late', original.message!.id)).toEqual({ error: 'reply_not_found' });

    // And the row the create path returns carries the same blanking listMessages
    // does, for a message quoted before the original was deleted.
    const second = svc.createMessage(trip.id, user1.id, 'Another secret');
    const quoting = svc.createMessage(trip.id, user1.id, 'Quoting it', second.message!.id);
    expect(quoting.message!.reply_text).toBe('Another secret');
    svc.deleteMessage(trip.id, second.message!.id, user1.id);
    expect(svc.listMessages(trip.id).find(m => m.text === 'Quoting it')!.reply_text).toBe('');
  });

  it('COLLAB-SVC-013: includes reactions grouped by emoji', () => {
    const { user1, trip } = setup();
    const r = svc.createMessage(trip.id, user1.id, 'React me');
    const msgId = r.message!.id;
    testDb.prepare('INSERT INTO collab_message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)').run(msgId, user1.id, '👍');

    const msgs = svc.listMessages(trip.id);
    expect(msgs[0].reactions).toBeDefined();
    expect(msgs[0].reactions).toHaveLength(1);
    expect(msgs[0].reactions[0].emoji).toBe('👍');
  });
});

// ── createMessage with invalid replyTo ───────────────────────────────────────

describe('createMessage', () => {
  it('COLLAB-SVC-014: returns error when replyTo message does not exist', () => {
    const { user1, trip } = setup();
    const result = svc.createMessage(trip.id, user1.id, 'Reply to nothing', 9999);
    expect(result.error).toBe('reply_not_found');
  });

  it('COLLAB-SVC-015: creates message with valid replyTo', () => {
    const { user1, trip } = setup();
    const r1 = svc.createMessage(trip.id, user1.id, 'Original');
    const r2 = svc.createMessage(trip.id, user1.id, 'Reply', r1.message!.id);
    expect(r2.error).toBeUndefined();
    expect(r2.message!.reply_to).toBe(r1.message!.id);
  });
});

// ── deleteMessage ownership check ─────────────────────────────────────────────

describe('deleteMessage', () => {
  it('COLLAB-SVC-016: returns error "not_owner" when user does not own message', () => {
    const { user1, user2, trip } = setup();
    const r = svc.createMessage(trip.id, user1.id, 'My message');

    const result = svc.deleteMessage(trip.id, r.message!.id, user2.id);
    expect(result.error).toBe('not_owner');
  });

  it('COLLAB-SVC-017: returns error "not_found" for nonexistent message', () => {
    const { user1, trip } = setup();
    const result = svc.deleteMessage(trip.id, 9999, user1.id);
    expect(result.error).toBe('not_found');
  });

  it('COLLAB-SVC-018: marks message as deleted when owner deletes it', () => {
    const { user1, trip } = setup();
    const r = svc.createMessage(trip.id, user1.id, 'Delete me');

    const result = svc.deleteMessage(trip.id, r.message!.id, user1.id);
    expect(result.error).toBeUndefined();

    const row = testDb.prepare('SELECT deleted FROM collab_messages WHERE id = ?').get(r.message!.id) as any;
    expect(row.deleted).toBe(1);
  });
});

// ── updateNote partial fields ─────────────────────────────────────────────────

describe('updateNote', () => {
  it('COLLAB-SVC-019: updates only title when other fields are undefined', () => {
    const { user1, trip } = setup();
    const note = svc.createNote(trip.id, user1.id, { title: 'Original', content: 'Some content', website: 'https://example.com' });

    svc.updateNote(trip.id, note.id, { title: 'Updated' });

    const updated = testDb.prepare('SELECT * FROM collab_notes WHERE id = ?').get(note.id) as any;
    expect(updated.title).toBe('Updated');
    expect(updated.content).toBe('Some content'); // unchanged
    expect(updated.website).toBe('https://example.com'); // unchanged
  });

  it('COLLAB-SVC-020: clears content when content is explicitly set to empty string', () => {
    const { user1, trip } = setup();
    const note = svc.createNote(trip.id, user1.id, { title: 'T', content: 'Old content' });

    svc.updateNote(trip.id, note.id, { content: '' });

    const updated = testDb.prepare('SELECT * FROM collab_notes WHERE id = ?').get(note.id) as any;
    expect(updated.content).toBe('');
  });

  it('COLLAB-SVC-021: updates website when website is defined', () => {
    const { user1, trip } = setup();
    const note = svc.createNote(trip.id, user1.id, { title: 'T' });

    svc.updateNote(trip.id, note.id, { website: 'https://new.example.com' });

    const updated = testDb.prepare('SELECT * FROM collab_notes WHERE id = ?').get(note.id) as any;
    expect(updated.website).toBe('https://new.example.com');
  });

  it('COLLAB-SVC-022: clears website when website is explicitly set to empty string', () => {
    const { user1, trip } = setup();
    const note = svc.createNote(trip.id, user1.id, { title: 'T', website: 'https://old.com' });

    svc.updateNote(trip.id, note.id, { website: '' });

    const updated = testDb.prepare('SELECT * FROM collab_notes WHERE id = ?').get(note.id) as any;
    expect(updated.website).toBe('');
  });

  it('COLLAB-SVC-023: returns null when note does not exist', () => {
    const { trip } = setup();
    const result = svc.updateNote(trip.id, 9999, { title: 'Ghost' });
    expect(result).toBeNull();
  });

  it('COLLAB-SVC-024: updates pinned flag', () => {
    const { user1, trip } = setup();
    const note = svc.createNote(trip.id, user1.id, { title: 'T', pinned: false });

    svc.updateNote(trip.id, note.id, { pinned: true });

    const updated = testDb.prepare('SELECT * FROM collab_notes WHERE id = ?').get(note.id) as any;
    expect(updated.pinned).toBe(1);
  });
});

// ── linkPreview ───────────────────────────────────────────────────────────────

describe('linkPreview', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('COLLAB-SVC-025: returns OG title and description from HTML', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `
        <html>
          <head>
            <meta property="og:title" content="Test Title" />
            <meta property="og:description" content="Test Description" />
            <meta property="og:image" content="https://example.com/image.jpg" />
            <meta property="og:site_name" content="Example" />
          </head>
        </html>
      `,
    }));

    const result = await svc.linkPreview('https://example.com/page');
    expect(result.title).toBe('Test Title');
    expect(result.description).toBe('Test Description');
    expect(result.image).toBe('https://example.com/image.jpg');
    expect(result.url).toBe('https://example.com/page');
  });

  it('COLLAB-SVC-026: falls back to <title> tag when no og:title', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `<html><head><title>Page Title</title></head></html>`,
    }));

    const result = await svc.linkPreview('https://example.com/');
    expect(result.title).toBe('Page Title');
  });

  it('COLLAB-SVC-027: returns fallback when fetch response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      text: async () => '',
    }));

    const result = await svc.linkPreview('https://example.com/bad');
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.url).toBe('https://example.com/bad');
  });

  it('COLLAB-SVC-028: returns fallback when SSRF check blocks the URL', async () => {
    // 169.254.x is link-local, which the real guard reports as private and blocked.
    mockCheckSsrf.mockResolvedValue({ allowed: false, isPrivate: true, error: 'SSRF blocked' });

    const result = await svc.linkPreview('https://169.254.169.254/');
    expect(result.title).toBeNull();
  });

  it('COLLAB-SVC-029: returns fallback when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await svc.linkPreview('https://example.com/net-error');
    expect(result.title).toBeNull();
    expect(result.url).toBe('https://example.com/net-error');
  });

  it('COLLAB-SVC-030a: returns the fallback when the page declares a body over the cap', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (h: string) => (h === 'content-length' ? String(10 * 1024 * 1024) : null) },
      text: async () => '<html><head><title>Huge</title></head></html>',
    }));

    const result = await svc.linkPreview('https://example.com/huge');
    expect(result.title).toBeNull();
  });

  it('COLLAB-SVC-030b: reads only up to the cap and still scrapes the head tags', async () => {
    let cancelled = false;
    const chunks = [
      new TextEncoder().encode('<html><head><title>Head Title</title></head><body>'),
      new TextEncoder().encode('x'.repeat(1024 * 1024)),
    ];
    let i = 0;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      body: {
        getReader: () => ({
          read: async () => (i < chunks.length ? { done: false, value: chunks[i++] } : { done: true }),
          cancel: async () => { cancelled = true; },
        }),
      },
    }));

    const result = await svc.linkPreview('https://example.com/streamed');
    // The head arrives first, so the scrape still works; the megabyte of padding
    // past the 512KB budget is dropped and the reader is cancelled.
    expect(result.title).toBe('Head Title');
    expect(cancelled).toBe(true);
  });

  it('COLLAB-SVC-030: falls back to meta description tag when no og:description', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `
        <html><head>
          <meta name="description" content="Meta description here" />
        </head></html>
      `,
    }));

    const result = await svc.linkPreview('https://example.com/meta');
    expect(result.description).toBe('Meta description here');
  });
});

// COLLAB-SVC-031..033 (collab.bridge delegation) were deleted with the bridge —
// its last consumers (the legacy tripService and the legacy get_trip_summary
// registrar) migrated into the DI-native TripsService/TripsMcp.

// ── Post-migration hardening (transactions, scoping, guards) ──────────────────

describe('hardening', () => {
  it('COLLAB-SVC-034: votePoll switch is atomic — prior vote survives a failed INSERT', () => {
    const { user1, trip } = setup();
    const dbs = new DatabaseService(testDb);
    const failing = new CollabService(dbs, new PermissionsService(dbs), new RealtimeService(), notificationsStub(), collabFx.storage);
    const poll = failing.createPoll(trip.id, user1.id, { question: 'Q?', options: ['A', 'B'] });
    failing.votePoll(trip.id, poll!.id, user1.id, 0);

    const realRun = dbs.run.bind(dbs);
    const spy = vi.spyOn(dbs, 'run').mockImplementation((sql: string, ...params: unknown[]) => {
      if (sql.includes('INSERT INTO collab_poll_votes')) throw new Error('boom');
      return realRun(sql, ...params);
    });
    // Single-choice switch: DELETE prior votes, then the INSERT fails — the
    // transaction must roll the DELETE back too.
    expect(() => failing.votePoll(trip.id, poll!.id, user1.id, 1)).toThrow('boom');
    spy.mockRestore();

    const votes = testDb.prepare('SELECT option_index FROM collab_poll_votes WHERE poll_id = ?').all(poll!.id) as { option_index: number }[];
    expect(votes).toEqual([{ option_index: 0 }]);
  });

  it('COLLAB-SVC-035: deleteNote is atomic — trip_files rows survive a failed note DELETE', async () => {
    const { user1, trip } = setup();
    const dbs = new DatabaseService(testDb);
    const failing = new CollabService(dbs, new PermissionsService(dbs), new RealtimeService(), notificationsStub(), collabFx.storage);
    const note = failing.createNote(trip.id, user1.id, { title: 'With file' });
    testDb.prepare('INSERT INTO trip_files (trip_id, note_id, filename, original_name) VALUES (?, ?, ?, ?)')
      .run(trip.id, note.id, 'files/a.pdf', 'a.pdf');

    const realRun = dbs.run.bind(dbs);
    const spy = vi.spyOn(dbs, 'run').mockImplementation((sql: string, ...params: unknown[]) => {
      if (sql.includes('DELETE FROM collab_notes')) throw new Error('boom');
      return realRun(sql, ...params);
    });
    await expect(failing.deleteNote(trip.id, note.id)).rejects.toThrow('boom');
    spy.mockRestore();

    expect(testDb.prepare('SELECT COUNT(*) as c FROM trip_files WHERE note_id = ?').get(note.id)).toEqual({ c: 1 });
    expect(testDb.prepare('SELECT COUNT(*) as c FROM collab_notes WHERE id = ?').get(note.id)).toEqual({ c: 1 });
  });

  it('COLLAB-SVC-036: a failing storage delete is swallowed — note + file deletes still succeed', async () => {
    const { user1, trip } = setup();
    const dbs = new DatabaseService(testDb);
    const failingStorage = { delete: vi.fn().mockRejectedValue(new Error('EACCES')) };
    const failing = new CollabService(dbs, new PermissionsService(dbs), new RealtimeService(), notificationsStub(), failingStorage as unknown as import('../../../src/nest/storage/storage.service').StorageService);
    const note = failing.createNote(trip.id, user1.id, { title: 'Sticky file' });
    testDb.prepare('INSERT INTO trip_files (trip_id, note_id, filename, original_name) VALUES (?, ?, ?, ?)')
      .run(trip.id, note.id, 'stuck.pdf', 'stuck.pdf');
    const fileId = (testDb.prepare('SELECT id FROM trip_files WHERE note_id = ?').get(note.id) as { id: number }).id;

    expect(await failing.deleteNoteFile(trip.id, note.id, fileId)).toBe(true);
    expect(testDb.prepare('SELECT COUNT(*) as c FROM trip_files WHERE id = ?').get(fileId)).toEqual({ c: 0 });

    testDb.prepare('INSERT INTO trip_files (trip_id, note_id, filename, original_name) VALUES (?, ?, ?, ?)')
      .run(trip.id, note.id, 'stuck2.pdf', 'stuck2.pdf');
    expect(await failing.deleteNote(trip.id, note.id)).toBe(true);
    expect(testDb.prepare('SELECT COUNT(*) as c FROM collab_notes WHERE id = ?').get(note.id)).toEqual({ c: 0 });
  });

  it('COLLAB-SVC-036: getFormattedNoteById is trip-scoped and null-safe', () => {
    const { user1, trip } = setup();
    const otherTrip = createTrip(testDb, user1.id);
    const note = svc.createNote(trip.id, user1.id, { title: 'Scoped' });

    expect(svc.getFormattedNoteById(trip.id, note.id)!.title).toBe('Scoped');
    expect(svc.getFormattedNoteById(otherTrip.id, note.id)).toBeNull();
    expect(svc.getFormattedNoteById(trip.id, 9999)).toBeNull();
  });

  it('COLLAB-SVC-037: votePoll rejects a non-integer option index with "invalid_index"', () => {
    const { user1, trip } = setup();
    const poll = svc.createPoll(trip.id, user1.id, { question: 'Q?', options: ['A', 'B'] });

    expect(svc.votePoll(trip.id, poll!.id, user1.id, '0' as unknown as number).error).toBe('invalid_index');
    expect(svc.votePoll(trip.id, poll!.id, user1.id, 0.5).error).toBe('invalid_index');
    expect(testDb.prepare('SELECT COUNT(*) as c FROM collab_poll_votes WHERE poll_id = ?').get(poll!.id)).toEqual({ c: 0 });
  });

  it('COLLAB-SVC-038: linkPreview returns the fallback for a malformed URL without throwing', async () => {
    const result = await svc.linkPreview('not a url');
    expect(result).toEqual({ title: null, description: null, image: null, url: 'not a url' });
    expect(mockCheckSsrf).not.toHaveBeenCalled();
  });
});
