/**
 * To-do module e2e — exercises the migrated /api/trips/:tripId/todo endpoints
 * through the real JwtAuthGuard against a temp SQLite db. todoService, the
 * permission check and the WebSocket broadcast are mocked.
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
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { svc } = vi.hoisted(() => ({
  svc: {
    verifyTripAccess: vi.fn(), listItems: vi.fn(), createItem: vi.fn(), updateItem: vi.fn(),
    deleteItem: vi.fn(), reorderItems: vi.fn(), getCategoryAssignees: vi.fn(), updateCategoryAssignees: vi.fn(),
  },
}));
vi.mock('../../src/services/todoService', () => svc);

import { TodoModule } from '../../src/nest/todo/todo.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('To-do e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [TodoModule] }).compile();
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
    svc.listItems.mockReturnValue([{ id: 1, name: 'Book hotel' }]);
    svc.createItem.mockReturnValue({ id: 9, name: 'Book hotel' });
  });

  beforeEach(() => {
    svc.verifyTripAccess.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/trips/5/todo');
    expect(res.status).toBe(401);
  });

  it('200 list for an accessible trip', async () => {
    const res = await request(server).get('/api/trips/5/todo').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [{ id: 1, name: 'Book hotel' }] });
  });

  it('404 when the trip is not accessible', async () => {
    svc.verifyTripAccess.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/todo').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 on create with permission', async () => {
    const res = await request(server).post('/api/trips/5/todo').set('Cookie', sessionCookie(1)).send({ name: 'Book hotel' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ item: { id: 9, name: 'Book hotel' } });
  });

  it('403 on create without permission', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).post('/api/trips/5/todo').set('Cookie', sessionCookie(1)).send({ name: 'Book hotel' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
  });
});
