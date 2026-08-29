/**
 * Tags module e2e — exercises the migrated /api/tags endpoints through the real
 * JwtAuthGuard against a temp SQLite db. TagsService runs its real SQL via
 * DatabaseModule (the DATABASE_CONNECTION factory picks up the mocked db
 * singleton); tags are user-scoped (no admin gate), so a normal authenticated
 * user can do everything.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TagsModule } from '../../src/nest/tags/tags.module';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  tmp.exec(`CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#10b981',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

function insertTag(userId: number, name: string, color = '#10b981'): number {
  const res = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(userId, name, color);
  return Number(res.lastInsertRowid);
}

describe('Tags e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, TagsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    seedUser(db as never, { id: 2, email: 'e2e-2@example.test' });
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.exec('DELETE FROM tags');
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/tags');
    expect(res.status).toBe(401);
  });

  it('200 list scoped to the user, ordered by name', async () => {
    insertTag(1, 'Zebra');
    insertTag(1, 'Apple');
    insertTag(2, 'Other-User-Tag');
    const res = await request(server).get('/api/tags').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.tags.map((t: { name: string }) => t.name)).toEqual(['Apple', 'Zebra']);
    expect(res.body.tags.every((t: { user_id: number }) => t.user_id === 1)).toBe(true);
  });

  it('201 on create, echoing the provided color', async () => {
    const res = await request(server)
      .post('/api/tags')
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Beach', color: '#ff0000' });
    expect(res.status).toBe(201);
    expect(res.body.tag).toMatchObject({ user_id: 1, name: 'Beach', color: '#ff0000' });
    expect(typeof res.body.tag.id).toBe('number');
  });

  it('201 on create with the #10b981 default color when omitted', async () => {
    const res = await request(server).post('/api/tags').set('Cookie', sessionCookie(1)).send({ name: 'Default' });
    expect(res.status).toBe(201);
    expect(res.body.tag.color).toBe('#10b981');
  });

  it('400 on create without a name', async () => {
    const res = await request(server).post('/api/tags').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Tag name is required' });
  });

  it('200 on update of an owned tag, COALESCE preserving the color', async () => {
    const id = insertTag(1, 'Beach', '#ff0000');
    const res = await request(server).put(`/api/tags/${id}`).set('Cookie', sessionCookie(1)).send({ name: 'Hike' });
    expect(res.status).toBe(200);
    expect(res.body.tag).toMatchObject({ id, name: 'Hike', color: '#ff0000' });
  });

  it('404 on update of a tag the user does not own', async () => {
    const id = insertTag(2, 'Not-Yours');
    const res = await request(server).put(`/api/tags/${id}`).set('Cookie', sessionCookie(1)).send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not found' });
  });

  it('200 on delete of an owned tag, removing the row', async () => {
    const id = insertTag(1, 'ToDelete');
    const res = await request(server).delete(`/api/tags/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(db.prepare('SELECT id FROM tags WHERE id = ?').get(id)).toBeUndefined();
  });

  it('404 on delete of a tag the user does not own', async () => {
    const id = insertTag(2, 'Not-Yours');
    const res = await request(server).delete(`/api/tags/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not found' });
    expect(db.prepare('SELECT id FROM tags WHERE id = ?').get(id)).toBeDefined();
  });
});
