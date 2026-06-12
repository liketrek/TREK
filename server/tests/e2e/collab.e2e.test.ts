/**
 * Collab module e2e — exercises the migrated /api/trips/:tripId/collab endpoints
 * through the real JwtAuthGuard against a temp SQLite db. The collab service,
 * permission check, WebSocket broadcast and the chat/note notification are
 * mocked; this focuses on auth, trip-access 404, permission 403, the create-201
 * status codes and the vote/react 200 overrides.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  // The note/message notifications read the trip title fire-and-forget; the table
  // must exist so that query doesn't throw after the test has torn down.
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT);');
  tmp.prepare("INSERT INTO trips (id, title) VALUES (5, 'Trip')").run();
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/services/notificationService', () => ({ send: vi.fn().mockResolvedValue(undefined) }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { svc } = vi.hoisted(() => ({
  svc: {
    verifyTripAccess: vi.fn(), listNotes: vi.fn(), createNote: vi.fn(), updateNote: vi.fn(), deleteNote: vi.fn(),
    addNoteFile: vi.fn(), getFormattedNoteById: vi.fn(), deleteNoteFile: vi.fn(),
    listPolls: vi.fn(), createPoll: vi.fn(), votePoll: vi.fn(), closePoll: vi.fn(), deletePoll: vi.fn(),
    listMessages: vi.fn(), createMessage: vi.fn(), deleteMessage: vi.fn(), addOrRemoveReaction: vi.fn(), fetchLinkPreview: vi.fn(),
  },
}));
vi.mock('../../src/services/collabService', () => svc);

import { CollabModule } from '../../src/nest/collab/collab.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Collab e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [CollabModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
    svc.listNotes.mockReturnValue([{ id: 1, title: 'N' }]);
    svc.createNote.mockReturnValue({ id: 9, title: 'N' });
    svc.createPoll.mockReturnValue({ id: 7 });
    svc.votePoll.mockReturnValue({ poll: { id: 7 } });
    svc.createMessage.mockReturnValue({ message: { id: 3, text: 'hi' } });
    svc.addOrRemoveReaction.mockReturnValue({ found: true, reactions: [{ emoji: '👍', count: 1 }] });
    svc.fetchLinkPreview.mockResolvedValue({ title: 'T', description: null, image: null, url: 'http://x' });
  });

  beforeEach(() => {
    svc.verifyTripAccess.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/trips/5/collab/notes')).status).toBe(401);
  });

  it('200 list notes for an accessible trip', async () => {
    const res = await request(server).get('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ notes: [{ id: 1, title: 'N' }] });
  });

  it('404 when the trip is not accessible', async () => {
    svc.verifyTripAccess.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 on note create with permission', async () => {
    const res = await request(server).post('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1)).send({ title: 'N' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ note: { id: 9, title: 'N' } });
  });

  it('403 on note create without permission', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).post('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1)).send({ title: 'N' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
  });

  it('200 on poll vote (not 201)', async () => {
    const res = await request(server).post('/api/trips/5/collab/polls/7/vote').set('Cookie', sessionCookie(1)).send({ option_index: 0 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ poll: { id: 7 } });
  });

  it('201 on message create', async () => {
    const res = await request(server).post('/api/trips/5/collab/messages').set('Cookie', sessionCookie(1)).send({ text: 'hi' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: { id: 3, text: 'hi' } });
  });

  it('200 on react (not 201)', async () => {
    const res = await request(server).post('/api/trips/5/collab/messages/3/react').set('Cookie', sessionCookie(1)).send({ emoji: '👍' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reactions: [{ emoji: '👍', count: 1 }] });
  });

  it('400 on link-preview without a url', async () => {
    const res = await request(server).get('/api/trips/5/collab/link-preview').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'URL is required' });
  });
});
