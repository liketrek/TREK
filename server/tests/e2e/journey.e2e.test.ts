/**
 * Journey e2e — exercises the migrated /api/journeys and /api/public/journey
 * endpoints through the real JwtAuthGuard against a temp SQLite db. The journey
 * services + addon gate are mocked; this focuses on the addon-gate-before-auth
 * ordering (404 wins over 401), auth, the service-owned 403/404 mapping, status
 * codes and the unguarded public route.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { DatabaseModule } from '../../src/nest/database/database.module';
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

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true) }));
// The controller's pure helpers (isVideoExtension/isVideoMime/MAX_VIDEO_SIZE)
// now come from the real files.constants; only the request-time app_settings
// read is mocked, preserving the old '*'-allowlist semantics for the fixtures.
// The memories providers are injected since the fold — stubbed on the prototype
// so JourneyModule still resolves them through DI.
vi.mock('../../src/nest/memories/immich.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/nest/memories/immich.service')>();
  actual.ImmichService.prototype.uploadToImmich = vi.fn();
  actual.ImmichService.prototype.streamImmichAsset = vi.fn();
  return actual;
});
vi.mock('../../src/nest/memories/photo-resolver.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/nest/memories/photo-resolver.service')>();
  actual.PhotoResolverService.prototype.streamPhoto = vi.fn();
  return actual;
});

const { jsvc } = vi.hoisted(() => ({
  jsvc: {
    listJourneys: vi.fn(), createJourney: vi.fn(), getJourneyFull: vi.fn(),
    journeyStats: vi.fn(),
  },
}));
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';

const { sharesvc } = vi.hoisted(() => ({ sharesvc: { getPublicJourney: vi.fn() } }));
import { JourneyShareService } from '../../src/nest/journey/journey-share.service';

import { JourneyModule } from '../../src/nest/journey/journey.module';
import { AddonsService } from '../../src/nest/addons/addons.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Journey e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, JourneyModule] })
      .overrideProvider(JourneyDomainService)
      .useValue(jsvc)
      .overrideProvider(JourneyShareService)
      .useValue(sharesvc)
      .overrideProvider(AddonsService)
      .useValue({ isAddonEnabled })
      .compile();
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
    jsvc.listJourneys.mockReturnValue([{ id: 1, title: 'J' }]);
    jsvc.createJourney.mockReturnValue({ id: 9, title: 'J' });
    sharesvc.getPublicJourney.mockReturnValue({ id: 9 });
  });

  beforeEach(() => {
    isAddonEnabled.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('404 (addon gate wins over auth) when the Journey addon is disabled', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server).get('/api/journeys');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey addon is not enabled' });
  });

  it('401 with the addon enabled but no session cookie', async () => {
    expect((await request(server).get('/api/journeys')).status).toBe(401);
  });

  it('200 list with a session', async () => {
    const res = await request(server).get('/api/journeys').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ journeys: [{ id: 1, title: 'J' }] });
  });

  it('201 create, 400 without a title', async () => {
    const ok = await request(server).post('/api/journeys').set('Cookie', sessionCookie(1)).send({ title: 'J' });
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({ id: 9, title: 'J' });
    const bad = await request(server).post('/api/journeys').set('Cookie', sessionCookie(1)).send({});
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: 'Title is required' });
  });

  it('404 for an inaccessible journey', async () => {
    jsvc.getJourneyFull.mockReturnValue(null);
    const res = await request(server).get('/api/journeys/9').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey not found' });
  });

  /*
   * The journey figures TREK Studio prints (#1973). Read-only and derived, so
   * what e2e adds over the controller unit test is that the addon gate and the
   * auth guard both run in front of it — a route that reports where someone has
   * been must not be reachable without a session.
   */
  it('401 for the journey stats without a session', async () => {
    expect((await request(server).get('/api/journeys/9/stats')).status).toBe(401);
  });

  it('404 for the stats of an inaccessible journey', async () => {
    jsvc.journeyStats.mockReturnValue(null);
    const res = await request(server).get('/api/journeys/9/stats').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey not found' });
  });

  it('200 with the figures, returned bare rather than in an envelope', async () => {
    jsvc.journeyStats.mockReturnValue({
      journeyId: 9, distance: 1_189_000, days: 14, steps: 14, photos: 57, places: 0,
      furthest: 408_000,
      countries: [{ code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' }],
      points: [{ lat: 64.14, lng: -21.94, label: 'Reykjavík', date: '2026-06-02', country: 'IS' }],
      start: '2026-06-02', end: '2026-06-15',
    });
    const res = await request(server).get('/api/journeys/9/stats').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.distance).toBe(1_189_000);
    expect(res.body.countries).toEqual([{ code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' }]);
    expect(jsvc.journeyStats).toHaveBeenCalledWith(9, 1);
  });

  it('404 (addon gate) for the stats when the Journey addon is disabled', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server).get('/api/journeys/9/stats').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Journey addon is not enabled' });
  });

  it('public journey read is unguarded (200 with a valid token, no cookie)', async () => {
    const res = await request(server).get('/api/public/journey/tok');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 9 });
  });

  it('the image fileFilter is wired: a disallowed extension is rejected, not stored', async () => {
    // The multer options are built by MulterModule.registerAsync now, and Nest
    // injects MULTER_MODULE_OPTIONS with @Optional(): a token that fails to
    // resolve is not a boot error, it silently falls back to defaults, which
    // means no fileFilter and no size cap. This case is what turns that into a
    // visible failure, since an unfiltered upload would answer 201.
    const res = await request(server)
      .post('/api/journeys/9/cover')
      .set('Cookie', sessionCookie(1))
      .attach('cover', Buffer.from('MZ'), { filename: 'payload.exe', contentType: 'application/octet-stream' });
    expect(res.status).toBe(400);
  });

  it('public journey 404 for an unknown token', async () => {
    sharesvc.getPublicJourney.mockReturnValueOnce(null);
    const res = await request(server).get('/api/public/journey/bad');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
