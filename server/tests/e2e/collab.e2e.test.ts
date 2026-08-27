/**
 * Collab module e2e — exercises the migrated /api/trips/:tripId/collab endpoints
 * through the real JwtAuthGuard against a temp SQLite db, running CollabService's
 * real SQL (DI-injected, no service mock). canAccessTrip, the permission check,
 * the WebSocket broadcast and the chat/note notification are mocked; this focuses
 * on auth, trip-access 404, permission 403, the create-201 status codes, the
 * vote/react 200 overrides and the persisted rows.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  // The note/message/poll formatters join users for username + avatar.
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT);`);
  // The note/message notifications read the trip title fire-and-forget; the table
  // must exist so that query doesn't throw after the test has torn down.
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT);');
  tmp.prepare("INSERT INTO trips (id, title) VALUES (5, 'Trip')").run();
  // CollabService's real SQL (DI-injected, no mock) — the collab tables as the
  // real schema + migrations shape them (website on notes, deleted on messages,
  // note_id on trip_files).
  tmp.exec(`CREATE TABLE collab_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, category TEXT DEFAULT 'General', title TEXT NOT NULL, content TEXT,
    color TEXT DEFAULT '#6366f1', pinned INTEGER DEFAULT 0, website TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE collab_polls (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, question TEXT NOT NULL, options TEXT NOT NULL, multiple INTEGER DEFAULT 0,
    closed INTEGER DEFAULT 0, deadline TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE collab_poll_votes (id INTEGER PRIMARY KEY AUTOINCREMENT, poll_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, option_index INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id, option_index));`);
  tmp.exec(`CREATE TABLE collab_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, text TEXT NOT NULL, reply_to INTEGER, deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE collab_message_reactions (id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL, user_id INTEGER NOT NULL, emoji TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE trip_files (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    note_id INTEGER, filename TEXT NOT NULL, original_name TEXT NOT NULL, file_size INTEGER,
    mime_type TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db, canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

import { CollabModule } from '../../src/nest/collab/collab.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { RateLimitService } from '../../src/nest/common/rate-limit.service';

describe('Collab e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, RealtimeModule, CollabModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
    db.prepare('DELETE FROM collab_message_reactions').run();
    db.prepare('DELETE FROM collab_poll_votes').run();
    db.prepare('DELETE FROM collab_messages').run();
    db.prepare('DELETE FROM collab_polls').run();
    db.prepare('DELETE FROM trip_files').run();
    db.prepare('DELETE FROM collab_notes').run();
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/trips/5/collab/notes')).status).toBe(401);
  });

  it('200 list notes for an accessible trip', async () => {
    db.prepare("INSERT INTO collab_notes (id, trip_id, user_id, title) VALUES (1, 5, 1, 'N')").run();
    const res = await request(server).get('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.notes).toHaveLength(1);
    expect(res.body.notes[0]).toMatchObject({ id: 1, title: 'N', category: 'General', attachments: [] });
  });

  it('404 when the trip is not accessible', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 on note create with permission, row persisted', async () => {
    const res = await request(server).post('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1)).send({ title: 'N' });
    expect(res.status).toBe(201);
    expect(res.body.note).toMatchObject({ title: 'N', category: 'General', color: '#6366f1', pinned: 0 });
    const row = db.prepare('SELECT * FROM collab_notes WHERE trip_id = 5').get() as { title: string };
    expect(row.title).toBe('N');
  });

  it('403 on note create without permission', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).post('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1)).send({ title: 'N' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
  });

  it('200 on poll vote (not 201), vote persisted', async () => {
    db.prepare('INSERT INTO collab_polls (id, trip_id, user_id, question, options) VALUES (7, 5, 1, ?, ?)')
      .run('Q?', JSON.stringify(['A', 'B']));
    const res = await request(server).post('/api/trips/5/collab/polls/7/vote').set('Cookie', sessionCookie(1)).send({ option_index: 0 });
    expect(res.status).toBe(200);
    expect(res.body.poll).toMatchObject({ id: 7, is_closed: false });
    expect(res.body.poll.options[0].voters).toHaveLength(1);
    const vote = db.prepare('SELECT * FROM collab_poll_votes WHERE poll_id = 7').get() as { option_index: number };
    expect(vote.option_index).toBe(0);
  });

  it('201 on message create, row persisted', async () => {
    const res = await request(server).post('/api/trips/5/collab/messages').set('Cookie', sessionCookie(1)).send({ text: 'hi' });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatchObject({ text: 'hi', trip_id: 5, user_id: 1 });
    const row = db.prepare('SELECT * FROM collab_messages WHERE trip_id = 5').get() as { text: string };
    expect(row.text).toBe('hi');
  });

  it('200 on react (not 201), reaction persisted and toggled', async () => {
    db.prepare("INSERT INTO collab_messages (id, trip_id, user_id, text) VALUES (3, 5, 1, 'react me')").run();
    const res = await request(server).post('/api/trips/5/collab/messages/3/react').set('Cookie', sessionCookie(1)).send({ emoji: '👍' });
    expect(res.status).toBe(200);
    expect(res.body.reactions).toHaveLength(1);
    expect(res.body.reactions[0]).toMatchObject({ emoji: '👍', count: 1 });
    expect(db.prepare('SELECT COUNT(*) as c FROM collab_message_reactions WHERE message_id = 3').get()).toEqual({ c: 1 });
  });

  // The advisory this route was reported under: it answered anyone with a session,
  // for any trip id, and drove an outbound fetch from that.
  it('404 on link-preview for a trip the caller cannot reach', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server)
      .get('/api/trips/5/collab/link-preview?url=https://example.com/')
      .set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('401 on link-preview without a session cookie', async () => {
    const res = await request(server).get('/api/trips/5/collab/link-preview?url=https://example.com/');
    expect(res.status).toBe(401);
  });

  // A read-only member still gets previews: the route is requested while rendering
  // the chat, so gating it on the write permission would blank the chat for them.
  it('200 on link-preview for a member without collab_edit', async () => {
    checkPermission.mockReturnValue(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, headers: { get: () => null }, text: async () => '<title>Lesbar</title>',
    }));
    const res = await request(server)
      .get('/api/trips/5/collab/link-preview?url=https://example.com/reader')
      .set('Cookie', sessionCookie(1));
    vi.unstubAllGlobals();
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Lesbar');
  });

  it('429 once the caller has spent a minute of preview fetches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, headers: { get: () => null }, text: async () => '<title>T</title>',
    }));
    // Distinct URLs, because a repeat is served from the cache and costs nothing.
    let last = 200;
    for (let i = 0; i < 61 && last === 200; i++) {
      last = (await request(server)
        .get(`/api/trips/5/collab/link-preview?url=${encodeURIComponent(`https://example.com/e2e-${i}`)}`)
        .set('Cookie', sessionCookie(1))).status;
    }
    vi.unstubAllGlobals();
    expect(last).toBe(429);
    // The counters live on the container singleton, so a spent budget would
    // follow this user into every test declared after it.
    app.get(RateLimitService).reset('collab_link_preview');
  });

  it('400 on link-preview without a url', async () => {
    const res = await request(server).get('/api/trips/5/collab/link-preview').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'URL is required' });
  });
});
