/**
 * Categories module e2e — exercises the migrated /api/categories endpoints
 * through the real JwtAuthGuard + AdminGuard against a migrated temp SQLite db
 * (createSnapshotTestDb()) seeded with an admin and a normal user through the
 * factories in tests/helpers/factories. CategoriesService runs its real
 * queries: listing is open to any authenticated user; writes are admin-only.
 */
import { db } from '../../src/db/database';
import { Categories } from '../../src/db/entities/Categories.entity';
import { CategoriesModule } from '../../src/nest/categories/categories.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { makeCategory } from '../helpers/factories/places';
import { countRows, deleteRows, findRow } from '../helpers/factories/rows';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

let orm: TestOrm;

async function insertCategory(name: string, color = '#6366f1', icon = '📍', userId = 1): Promise<number> {
  return (await makeCategory(orm, { name, color, icon, user: userId })).id;
}

describe('Categories e2e (real JwtAuthGuard + AdminGuard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    // RealtimeModule is @Global in the app graph but not in a partial container,
    // and CategoriesModule now pulls McpSharedModule in for the admin tools, whose
    // guard service takes it. days.e2e.test.ts imports it for the same reason.
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        CategoriesModule,
      ],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // The harness builds a container around the one domain module, so the APP_PIPE
    // from app.module.ts is not in it. Registering it here is what the other e2e
    // suites do (see places.e2e.test.ts) and it is required for the DTO bodies to
    // be validated at all.
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeAdmin(orm, { id: 1, username: 'e2e-admin', email: 'admin@example.test' });
    await makeUser(orm, { id: 2, username: 'e2e-user', email: 'user@example.test' });
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, Categories);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('200 list for any authenticated user (non-admin allowed), ordered by name', async () => {
    await insertCategory('Zoo');
    await insertCategory('Aquarium');
    const res = await request(server).get('/api/categories').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(200);
    expect(res.body.categories.map((c: { name: string }) => c.name)).toEqual(['Aquarium', 'Zoo']);
  });

  it('403 when a non-admin tries to create', async () => {
    const res = await request(server).post('/api/categories').set('Cookie', sessionCookie(2)).send({ name: 'X' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
    expect(await countRows(orm, Categories)).toBe(0);
  });

  it('201 when an admin creates a category, echoing name/color/icon and user_id', async () => {
    const res = await request(server)
      .post('/api/categories')
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Food', color: '#fff', icon: '🍔' });
    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ name: 'Food', color: '#fff', icon: '🍔', user_id: 1 });
    expect(typeof res.body.category.id).toBe('number');
  });

  it('201 on create with the #6366f1/📍 defaults when color and icon are omitted', async () => {
    const res = await request(server)
      .post('/api/categories')
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Defaults' });
    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ color: '#6366f1', icon: '📍' });
  });

  it('400 when an admin creates without a name', async () => {
    const res = await request(server).post('/api/categories').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
  });

  // The colour is pasted into a style="…" attribute of hand-built marker HTML on
  // both map renderers and on the share page, which answers without a guard. It
  // was reaching the database unvalidated, because @Body('color') reads a property
  // and carries no metatype for the pipe to work with.
  it('400 when an admin sends a colour that is not a hex value', async () => {
    const res = await request(server)
      .post('/api/categories')
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Food', color: 'red" onmouseover="alert(1)' });
    expect(res.status).toBe(400);
  });

  it('400 when an admin updates a category to a non-hex colour', async () => {
    const id = await insertCategory('Food', '#fff', '🍔');
    const res = await request(server)
      .put(`/api/categories/${id}`)
      .set('Cookie', sessionCookie(1))
      .send({ color: 'url(https://evil.example/px)' });
    expect(res.status).toBe(400);
  });

  it('200 when an admin updates, COALESCE preserving omitted fields', async () => {
    const id = await insertCategory('Food', '#fff', '🍔');
    const res = await request(server)
      .put(`/api/categories/${id}`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Drinks' });
    expect(res.status).toBe(200);
    expect(res.body.category).toMatchObject({ id, name: 'Drinks', color: '#fff', icon: '🍔' });
  });

  it('404 when an admin updates a missing category', async () => {
    const res = await request(server).put('/api/categories/9999').set('Cookie', sessionCookie(1)).send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Category not found' });
  });

  it('200 when an admin deletes an existing category, removing the row', async () => {
    const id = await insertCategory('ToDelete');
    const res = await request(server).delete(`/api/categories/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(await findRow(orm, Categories, { id })).toBeNull();
  });

  it('404 when an admin deletes a missing category', async () => {
    const res = await request(server).delete('/api/categories/9999').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Category not found' });
  });
});
