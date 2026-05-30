/**
 * Categories module e2e — exercises the migrated /api/categories endpoints
 * through the real JwtAuthGuard + AdminGuard against a temp SQLite db seeded
 * with an admin and a normal user. categoryService is mocked.
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
    listCategories: vi.fn(),
    createCategory: vi.fn(),
    getCategoryById: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));
vi.mock('../../src/services/categoryService', () => mocks);

import { CategoriesModule } from '../../src/nest/categories/categories.module';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const cat = { id: 1, name: 'Food', color: '#fff', icon: '🍔' };

describe('Categories e2e (real JwtAuthGuard + AdminGuard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, CategoriesModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1, role: 'admin', email: 'admin@example.test' });
    seedUser(db as never, { id: 2, role: 'user', email: 'user@example.test' });
    app = await build();
    server = app.getHttpServer();
    mocks.listCategories.mockReturnValue([cat]);
    mocks.createCategory.mockReturnValue(cat);
    mocks.getCategoryById.mockImplementation((id: string | number) => (String(id) === '1' ? cat : undefined));
    mocks.updateCategory.mockReturnValue({ ...cat, name: 'Drinks' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('200 list for any authenticated user (non-admin allowed)', async () => {
    const res = await request(server).get('/api/categories').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ categories: [cat] });
  });

  it('403 when a non-admin tries to create', async () => {
    const res = await request(server).post('/api/categories').set('Cookie', sessionCookie(2)).send({ name: 'X' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
    expect(mocks.createCategory).not.toHaveBeenCalled();
  });

  it('201 when an admin creates a category', async () => {
    const res = await request(server).post('/api/categories').set('Cookie', sessionCookie(1)).send({ name: 'Food', color: '#fff', icon: '🍔' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ category: cat });
    expect(mocks.createCategory).toHaveBeenCalledWith(1, 'Food', '#fff', '🍔');
  });

  it('400 when an admin creates without a name', async () => {
    const res = await request(server).post('/api/categories').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Category name is required' });
  });

  it('200 when an admin updates an existing category', async () => {
    const res = await request(server).put('/api/categories/1').set('Cookie', sessionCookie(1)).send({ name: 'Drinks' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ category: { ...cat, name: 'Drinks' } });
  });

  it('404 when an admin updates a missing category', async () => {
    const res = await request(server).put('/api/categories/9').set('Cookie', sessionCookie(1)).send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Category not found' });
  });

  it('200 when an admin deletes an existing category', async () => {
    const res = await request(server).delete('/api/categories/1').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mocks.deleteCategory).toHaveBeenCalledWith('1');
  });
});
