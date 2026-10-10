/**
 * Transit backend switch e2e (#1699) — the whole path a self-hoster actually
 * walks, through the real Nest stack: an admin flips Admin → Settings → Transit
 * Provider, and the next /api/transit/plan leaves for a different upstream.
 *
 * Unlike transit.e2e.test.ts, TransitService is NOT stubbed here — only the
 * outbound `fetch` is, so what is asserted is the URL the install would really
 * have called and the setting/key state that decided it.
 */
import { db } from '../../src/db/database';
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { clearGoogleTransitCache } from '../../src/nest/transit/google-transit.provider';
import { TransitModule } from '../../src/nest/transit/transit.module';
import { deleteRows, updateRows } from '../helpers/factories/rows';
import { setAppSetting } from '../helpers/factories/settings';
import { makeAdmin } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

let orm: TestOrm;

const ADMIN = 1;

// TransitService's Transitous cache is module-scoped with no reset hook, so
// each case plans between its own pair of Osaka coordinates rather than being
// answered by the previous one.
let planNo = 0;
const nextPlanUrl = () => `/api/transit/plan?from=34.69${planNo},135.4900&to=34.68${planNo++},135.5155`;

describe('Transit backend switch e2e (#1699)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  const fetchMock = vi.fn();

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        TransitModule,
      ],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeAdmin(orm, { id: ADMIN });
    app = await build();
    server = app.getHttpServer();
  });
  afterAll(async () => {
    await app?.close();
    await orm?.close();
  });

  beforeEach(async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    // MOTIS and Routes shapes both parse as "no itineraries", which is all this
    // suite needs — it asserts where the request went, not how it mapped.
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({}),
    });
    await deleteRows(orm, AppSettings);
    await updateRows(orm, Users, { id: ADMIN }, { maps_api_key: null });
    clearGoogleTransitCache();
  });

  let lastBody: Record<string, unknown> = {};

  async function planUpstream(): Promise<string> {
    const res = await request(server).get(nextPlanUrl()).set('Cookie', sessionCookie(ADMIN));
    expect(res.status).toBe(200);
    lastBody = res.body;
    return String(fetchMock.mock.calls[0][0]);
  }

  it('TRANSIT-PROV-E2E-001: an untouched install plans through Transitous', async () => {
    expect(await planUpstream()).toContain('transitous.org');
    expect(lastBody.provider).toBe('transitous');
  });

  it('TRANSIT-PROV-E2E-002: selecting Google without a key still plans through Transitous', async () => {
    await setAppSetting(orm, 'transit_provider', 'google');
    expect(await planUpstream()).toContain('transitous.org');
    // The response says who really answered, so the empty state cannot blame
    // Google for a Transitous result.
    expect(lastBody.provider).toBe('transitous');
  });

  it('TRANSIT-PROV-E2E-003: with the switch on and a key set, the plan leaves for the Routes API', async () => {
    await setAppSetting(orm, 'transit_provider', 'google');
    await setAppSetting(orm, 'maps_api_key', 'instance-key');
    expect(await planUpstream()).toBe('https://routes.googleapis.com/directions/v2:computeRoutes');
    expect(lastBody.provider).toBe('google');
  });

  it('TRANSIT-PROV-E2E-004: the picker follows the switch to Google Places', async () => {
    await setAppSetting(orm, 'transit_provider', 'google');
    await setAppSetting(orm, 'maps_api_key', 'instance-key');

    const res = await request(server)
      .get('/api/transit/geocode?q=Nakanoshima&lang=ja')
      .set('Cookie', sessionCookie(ADMIN));
    expect(res.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://places.googleapis.com/v1/places:searchText');
  });

  it("TRANSIT-PROV-E2E-005: a member's own key is used when the instance has none", async () => {
    await setAppSetting(orm, 'transit_provider', 'google');
    await updateRows(orm, Users, { id: ADMIN }, { maps_api_key: 'personal-key' });

    expect(await planUpstream()).toBe('https://routes.googleapis.com/directions/v2:computeRoutes');
    expect(fetchMock.mock.calls[0][1].headers['X-Goog-Api-Key']).toBe('personal-key');
  });
});
