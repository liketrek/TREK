/**
 * Ferratas e2e: GET /api/trips/:tripId/ferratas through the real JwtAuthGuard and
 * TripAccessGuard over a migrated snapshot db. Only Overpass is faked, by stubbing
 * the global fetch; the response contract is checked on every 200 (NODE_ENV=test).
 */
import { FerrataTiles } from '../../src/db/entities/FerrataTiles.entity';
import { AppConfigModule } from '../../src/nest/app-config/app-config.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { FerratasModule } from '../../src/nest/ferratas/ferratas.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { countRows } from '../helpers/factories/rows';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import { Test } from '@nestjs/testing';
import {
  FERRATA_BBOX_INVALID_MESSAGE,
  FERRATA_BBOX_TOO_LARGE_MESSAGE,
  FERRATAS_ATTRIBUTION,
  FERRATAS_UNAVAILABLE_CODE,
} from '@trek/shared';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();

const overpassAnswer = {
  elements: [
    {
      type: 'way',
      id: 4242,
      tags: { highway: 'via_ferrata', name: 'Ferrata Test', via_ferrata_scale: '4-' },
      geometry: [
        { lat: 46.51, lon: 12.06 },
        { lat: 46.52, lon: 12.07 },
      ],
    },
    {
      type: 'relation',
      id: 7,
      tags: { route: 'via_ferrata', name: 'Alta Via' },
      members: [{ type: 'way', ref: 4242 }],
    },
  ],
};

describe('Ferratas e2e (real guards + snapshot SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let ownerId: number;
  let strangerId: number;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        AppConfigModule,
        FerratasModule,
      ],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    app = await build();
    server = app.getHttpServer();
    const orm = app.get(MikroORM);
    const { user: owner } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    ownerId = owner.id;
    strangerId = stranger.id;
    tripId = (await makeTrip(orm, owner.id)).id;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
    db.close();
  });

  const url = (id: number = tripId) => `/api/trips/${id}/ferratas`;

  it('401 without a session cookie', async () => {
    const res = await request(server).get(url()).query({ bbox: '46.5,12.05,46.6,12.2' });
    expect(res.status).toBe(401);
  });

  it('404 "Trip not found" for a trip the caller cannot reach', async () => {
    const res = await request(server)
      .get(url())
      .set('Cookie', sessionCookie(strangerId))
      .query({ bbox: '46.5,12.05,46.6,12.2' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('400 for a missing or malformed bbox', async () => {
    const missing = await request(server).get(url()).set('Cookie', sessionCookie(ownerId));
    expect(missing.status).toBe(400);
    expect(missing.body).toEqual({ error: FERRATA_BBOX_INVALID_MESSAGE });

    const malformed = await request(server)
      .get(url())
      .set('Cookie', sessionCookie(ownerId))
      .query({ bbox: '46.5,abc,46.6,12.2' });
    expect(malformed.body).toEqual({ error: FERRATA_BBOX_INVALID_MESSAGE });
  });

  it('400 for a box over the span cap, before Overpass is asked', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const res = await request(server).get(url()).set('Cookie', sessionCookie(ownerId)).query({ bbox: '45,11,46,11.3' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: FERRATA_BBOX_TOO_LARGE_MESSAGE });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('200 with the ferratas, their grade, route name and the attribution', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(overpassAnswer), { status: 200 })),
    );
    const res = await request(server)
      .get(url())
      .set('Cookie', sessionCookie(ownerId))
      .query({ bbox: '46.5,12.05,46.6,12.2' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ferratas: [
        {
          id: 'way/4242',
          name: 'Ferrata Test',
          grade: { raw: '4-', level: 4, plus: '-' },
          routeName: 'Alta Via',
          geometry: [
            [46.51, 12.06],
            [46.52, 12.07],
          ],
          osmUrl: 'https://www.openstreetmap.org/way/4242',
        },
      ],
      truncated: false,
      source: 'openstreetmap',
      attribution: FERRATAS_ATTRIBUTION,
    });
  });

  it('200 from the stored cells for the same box, without asking Overpass again', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const res = await request(server)
      .get(url())
      .set('Cookie', sessionCookie(ownerId))
      .query({ bbox: '46.5,12.05,46.6,12.2' });
    expect(res.status).toBe(200);
    expect(res.body.ferratas.map((f: { id: string }) => f.id)).toEqual(['way/4242']);
    expect(fetcher).not.toHaveBeenCalled();
    // 46.5 to 46.6 by 12.05 to 12.2: two rows of three cells.
    expect(await countRows(app.get(MikroORM), FerrataTiles)).toBe(6);
  });

  it('502 { error, code } when no Overpass mirror answers', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>busy</html>', { status: 504 })),
    );
    const res = await request(server)
      .get(url())
      .set('Cookie', sessionCookie(ownerId))
      .query({ bbox: '40.5,10.05,40.6,10.2' });
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: expect.any(String), code: FERRATAS_UNAVAILABLE_CODE });
    expect(JSON.stringify(res.body)).not.toMatch(/stack|at .*\.ts/);
  });
});
