/**
 * Tags module e2e — exercises the migrated /api/tags endpoints through the real
 * JwtAuthGuard against a temp SQLite db. tagService is mocked; tags are
 * user-scoped (no admin gate), so a normal authenticated user can do everything.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    listTags: vi.fn(),
    createTag: vi.fn(),
    getTagByIdAndUser: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
  },
}));
vi.mock('../../src/services/tagService', () => mocks);

import { TagsModule } from '../../src/nest/tags/tags.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const tag = { id: 1, user_id: 1, name: 'Beach', color: '#10b981' };

describe('Tags e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [TagsModule] }).compile();
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
    mocks.listTags.mockReturnValue([tag]);
    mocks.createTag.mockReturnValue(tag);
    mocks.getTagByIdAndUser.mockImplementation((id: string | number) => (String(id) === '1' ? tag : undefined));
    mocks.updateTag.mockReturnValue({ ...tag, name: 'Hike' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/tags');
    expect(res.status).toBe(401);
  });

  it('200 list scoped to the user', async () => {
    const res = await request(server).get('/api/tags').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tags: [tag] });
    expect(mocks.listTags).toHaveBeenCalledWith(1);
  });

  it('201 on create', async () => {
    const res = await request(server).post('/api/tags').set('Cookie', sessionCookie(1)).send({ name: 'Beach', color: '#10b981' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ tag });
    expect(mocks.createTag).toHaveBeenCalledWith(1, 'Beach', '#10b981');
  });

  it('400 on create without a name', async () => {
    const res = await request(server).post('/api/tags').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Tag name is required' });
  });

  it('200 on update of an owned tag', async () => {
    const res = await request(server).put('/api/tags/1').set('Cookie', sessionCookie(1)).send({ name: 'Hike' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tag: { ...tag, name: 'Hike' } });
  });

  it('404 on update of a tag the user does not own', async () => {
    const res = await request(server).put('/api/tags/9').set('Cookie', sessionCookie(1)).send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not found' });
  });

  it('200 on delete of an owned tag', async () => {
    const res = await request(server).delete('/api/tags/1').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mocks.deleteTag).toHaveBeenCalledWith('1');
  });
});
