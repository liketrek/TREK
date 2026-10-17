/**
 * Tags module e2e: exercises the migrated /api/tags endpoints through the real
 * JwtAuthGuard against a real migrated temp SQLite db (createSnapshotTestDb(),
 * no hand-rolled CREATE TABLEs). Rows are seeded and read through the
 * factories in tests/helpers/factories, which go through MikroORM rather than
 * raw SQL; tags are user-scoped (no admin gate), so a normal authenticated
 * user can do everything.
 */
import { db } from '../../src/db/database';
import { Tags } from '../../src/db/entities/Tags.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { TagsModule } from '../../src/nest/tags/tags.module';
import { makeTag } from '../helpers/factories/places';
import { deleteRows, findRow } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
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

async function insertTag(userId: number, name: string, color = '#10b981'): Promise<number> {
  return (await makeTag(orm, userId, { name, color })).id;
}

describe('Tags e2e (real auth guard + migrated temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), TagsModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: sessionCookie(1) and (2) sign for exactly these users.
    await makeUser(orm, { id: 1, email: 'e2e@example.test' });
    await makeUser(orm, { id: 2, email: 'e2e-2@example.test' });
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, Tags);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/tags');
    expect(res.status).toBe(401);
  });

  it('200 list scoped to the user, ordered by name', async () => {
    await insertTag(1, 'Zebra');
    await insertTag(1, 'Apple');
    await insertTag(2, 'Other-User-Tag');
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
    const id = await insertTag(1, 'Beach', '#ff0000');
    const res = await request(server).put(`/api/tags/${id}`).set('Cookie', sessionCookie(1)).send({ name: 'Hike' });
    expect(res.status).toBe(200);
    expect(res.body.tag).toMatchObject({ id, name: 'Hike', color: '#ff0000' });
  });

  it('404 on update of a tag the user does not own', async () => {
    const id = await insertTag(2, 'Not-Yours');
    const res = await request(server).put(`/api/tags/${id}`).set('Cookie', sessionCookie(1)).send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not found' });
  });

  it('200 on delete of an owned tag, removing the row', async () => {
    const id = await insertTag(1, 'ToDelete');
    const res = await request(server).delete(`/api/tags/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(await findRow(orm, Tags, { id })).toBeNull();
  });

  it('404 on delete of a tag the user does not own', async () => {
    const id = await insertTag(2, 'Not-Yours');
    const res = await request(server).delete(`/api/tags/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not found' });
    expect(await findRow(orm, Tags, { id })).not.toBeNull();
  });
});
