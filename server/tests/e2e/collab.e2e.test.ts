/**
 * Collab module e2e — exercises the migrated /api/trips/:tripId/collab endpoints
 * through the real JwtAuthGuard against a real migrated temp SQLite db
 * (createSnapshotTestDb(), no hand-rolled CREATE TABLEs), running CollabService's
 * real queries (DI-injected, no service mock). The permission check and
 * the chat/note notification are mocked; this focuses
 * on auth, trip-access 404, permission 403, the create-201 status codes, the
 * vote/react 200 overrides and the persisted rows. Rows are seeded and read
 * through the factories in tests/helpers/factories.
 */
import { db } from '../../src/db/database';
import { CollabLinks } from '../../src/db/entities/CollabLinks.entity';
import { CollabMessageReactions } from '../../src/db/entities/CollabMessageReactions.entity';
import { CollabMessages } from '../../src/db/entities/CollabMessages.entity';
import { CollabNotes } from '../../src/db/entities/CollabNotes.entity';
import { CollabPollVotes } from '../../src/db/entities/CollabPollVotes.entity';
import { CollabPolls } from '../../src/db/entities/CollabPolls.entity';
import { TripFiles } from '../../src/db/entities/TripFiles.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { CollabModule } from '../../src/nest/collab/collab.module';
import { RateLimitService } from '../../src/nest/common/rate-limit.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { countRows, deleteRows, findRow, insertRow } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

let orm: TestOrm;

describe('Collab e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        CollabModule,
      ],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // AppModule registers this as APP_PIPE; the harness only pulls CollabModule,
    // so without it the write routes would run unvalidated here and a broken
    // contract would still look green.
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned id: sessionCookie(1) signs for exactly this user.
    await makeUser(orm, { id: 1, username: 'e2e-user', email: 'e2e@example.test', role: 'user', password_version: 0 });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    // Plan 3c Task 0b: TripAccessGuard reads TripsRepository.findAccessible
    // directly now, a real query, so trip 5's real row is (re-)seeded every
    // test, owned by user 1.
    await deleteRows(orm, Trips, { id: 5 });
    await insertRow(orm, Trips, { id: 5, title: 'Trip', user: 1 });
    checkPermission.mockReturnValue(true);
    await deleteRows(orm, CollabMessageReactions);
    await deleteRows(orm, CollabPollVotes);
    await deleteRows(orm, CollabMessages);
    await deleteRows(orm, CollabPolls);
    await deleteRows(orm, TripFiles);
    await deleteRows(orm, CollabNotes);
    await deleteRows(orm, CollabLinks);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/trips/5/collab/notes')).status).toBe(401);
  });

  it('200 list notes for an accessible trip', async () => {
    await insertRow(orm, CollabNotes, { id: 1, trip: 5, user: 1, title: 'N' });
    const res = await request(server).get('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.notes).toHaveLength(1);
    expect(res.body.notes[0]).toMatchObject({ id: 1, title: 'N', category: 'General', attachments: [] });
  });

  it('404 when the trip is not accessible', async () => {
    await deleteRows(orm, Trips, { id: 5 });
    const res = await request(server).get('/api/trips/5/collab/notes').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 on note create with permission, row persisted', async () => {
    const res = await request(server)
      .post('/api/trips/5/collab/notes')
      .set('Cookie', sessionCookie(1))
      .send({ title: 'N' });
    expect(res.status).toBe(201);
    expect(res.body.note).toMatchObject({ title: 'N', category: 'General', color: '#6366f1', pinned: 0 });
    const row = await findRow(orm, CollabNotes, { trip: 5 });
    expect(row?.title).toBe('N');
  });

  it('403 on note create without permission', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server)
      .post('/api/trips/5/collab/notes')
      .set('Cookie', sessionCookie(1))
      .send({ title: 'N' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
  });

  it('200 on poll vote (not 201), vote persisted', async () => {
    await insertRow(orm, CollabPolls, { id: 7, trip: 5, user: 1, question: 'Q?', options: JSON.stringify(['A', 'B']) });
    const res = await request(server)
      .post('/api/trips/5/collab/polls/7/vote')
      .set('Cookie', sessionCookie(1))
      .send({ option_index: 0 });
    expect(res.status).toBe(200);
    expect(res.body.poll).toMatchObject({ id: 7, is_closed: false });
    expect(res.body.poll.options[0].voters).toHaveLength(1);
    const vote = await findRow(orm, CollabPollVotes, { poll: 7 });
    expect(vote?.option_index).toBe(0);
  });

  it('201 on message create, row persisted', async () => {
    const res = await request(server)
      .post('/api/trips/5/collab/messages')
      .set('Cookie', sessionCookie(1))
      .send({ text: 'hi' });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatchObject({ text: 'hi', trip_id: 5, user_id: 1 });
    const row = await findRow(orm, CollabMessages, { trip: 5 });
    expect(row?.text).toBe('hi');
  });

  it('200 on react (not 201), reaction persisted and toggled', async () => {
    await insertRow(orm, CollabMessages, { id: 3, trip: 5, user: 1, text: 'react me' });
    const res = await request(server)
      .post('/api/trips/5/collab/messages/3/react')
      .set('Cookie', sessionCookie(1))
      .send({ emoji: '👍' });
    expect(res.status).toBe(200);
    expect(res.body.reactions).toHaveLength(1);
    expect(res.body.reactions[0]).toMatchObject({ emoji: '👍', count: 1 });
    expect(await countRows(orm, CollabMessageReactions, { message: 3 })).toBe(1);
  });

  // The advisory this route was reported under: it answered anyone with a session,
  // for any trip id, and drove an outbound fetch from that.
  it('404 on link-preview for a trip the caller cannot reach', async () => {
    await deleteRows(orm, Trips, { id: 5 });
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: async () => '<title>Lesbar</title>',
      }),
    );
    const res = await request(server)
      .get('/api/trips/5/collab/link-preview?url=https://example.com/reader')
      .set('Cookie', sessionCookie(1));
    vi.unstubAllGlobals();
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Lesbar');
  });

  it('429 once the caller has spent a minute of preview fetches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: async () => '<title>T</title>',
      }),
    );
    // Distinct URLs, because a repeat is served from the cache and costs nothing.
    let last = 200;
    for (let i = 0; i < 61 && last === 200; i++) {
      last = (
        await request(server)
          .get(`/api/trips/5/collab/link-preview?url=${encodeURIComponent(`https://example.com/e2e-${i}`)}`)
          .set('Cookie', sessionCookie(1))
      ).status;
    }
    vi.unstubAllGlobals();
    expect(last).toBe(429);
    // The counters live on the container singleton, so a spent budget would
    // follow this user into every test declared after it.
    await app.get(RateLimitService).reset('collab_link_preview');
  });

  it('400 on link-preview without a url', async () => {
    const res = await request(server).get('/api/trips/5/collab/link-preview').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'URL is required' });
  });

  describe('shared links', () => {
    it('401 without a session cookie', async () => {
      expect((await request(server).get('/api/trips/5/collab/links')).status).toBe(401);
    });

    it('404 when the trip is not accessible', async () => {
      await deleteRows(orm, Trips, { id: 5 });
      const res = await request(server).get('/api/trips/5/collab/links').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
    });

    it('201 on create, and the row is persisted with the acting user', async () => {
      const res = await request(server)
        .post('/api/trips/5/collab/links')
        .set('Cookie', sessionCookie(1))
        .send({ title: 'Ferry', url: 'https://example.com/ferry' });
      expect(res.status).toBe(201);
      expect(res.body.link).toMatchObject({ title: 'Ferry', url: 'https://example.com/ferry' });
      const row = await findRow(orm, CollabLinks, { trip: 5 });
      expect(row).toMatchObject({ title: 'Ferry', user_id: 1 });
    });

    it('403 on create without collab_edit', async () => {
      checkPermission.mockReturnValue(false);
      const res = await request(server)
        .post('/api/trips/5/collab/links')
        .set('Cookie', sessionCookie(1))
        .send({ title: 'Ferry', url: 'https://example.com/ferry' });
      expect(res.status).toBe(403);
    });

    it('400 when the body does not satisfy the contract', async () => {
      const res = await request(server)
        .post('/api/trips/5/collab/links')
        .set('Cookie', sessionCookie(1))
        .send({ title: 'Ferry' });
      expect(res.status).toBe(400);
    });

    it('200 on list, pinned first', async () => {
      await insertRow(orm, CollabLinks, { id: 1, trip: 5, user: 1, title: 'Plain', url: 'https://a.test', pinned: 0 });
      await insertRow(orm, CollabLinks, { id: 2, trip: 5, user: 1, title: 'Pinned', url: 'https://b.test', pinned: 1 });
      const res = await request(server).get('/api/trips/5/collab/links').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body.links.map((l: { title: string }) => l.title)).toEqual(['Pinned', 'Plain']);
    });

    it('200 on update and the pin lands in the row', async () => {
      await insertRow(orm, CollabLinks, { id: 1, trip: 5, user: 1, title: 'Plain', url: 'https://a.test' });
      const res = await request(server)
        .put('/api/trips/5/collab/links/1')
        .set('Cookie', sessionCookie(1))
        .send({ pinned: true });
      expect(res.status).toBe(200);
      expect(res.body.link).toMatchObject({ id: 1, pinned: 1 });
    });

    it('404 on update and delete of a link that is not there', async () => {
      expect(
        (
          await request(server)
            .put('/api/trips/5/collab/links/99')
            .set('Cookie', sessionCookie(1))
            .send({ pinned: true })
        ).status,
      ).toBe(404);
      expect(
        (await request(server).delete('/api/trips/5/collab/links/99').set('Cookie', sessionCookie(1))).status,
      ).toBe(404);
    });

    it('200 on delete and the row is gone', async () => {
      await insertRow(orm, CollabLinks, { id: 1, trip: 5, user: 1, title: 'Plain', url: 'https://a.test' });
      const res = await request(server).delete('/api/trips/5/collab/links/1').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(await countRows(orm, CollabLinks)).toBe(0);
    });

    it('403 on delete without collab_edit', async () => {
      await insertRow(orm, CollabLinks, { id: 1, trip: 5, user: 1, title: 'Plain', url: 'https://a.test' });
      checkPermission.mockReturnValue(false);
      expect((await request(server).delete('/api/trips/5/collab/links/1').set('Cookie', sessionCookie(1))).status).toBe(
        403,
      );
    });
  });
});
