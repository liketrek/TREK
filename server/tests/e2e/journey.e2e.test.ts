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
vi.mock('../../src/services/adminService', () => ({ isAddonEnabled }));
vi.mock('../../src/services/fileService', () => ({
  getAllowedExtensions: () => '*',
  MAX_VIDEO_SIZE: 500 * 1024 * 1024,
  isVideoExtension: (ext: string) => ['mp4', 'm4v', 'webm', 'mov'].includes(String(ext).toLowerCase().replace(/^\./, '')),
  isVideoMime: (m?: string) => !!m && m.startsWith('video/'),
}));
vi.mock('../../src/services/memories/immichService', () => ({ uploadToImmich: vi.fn(), streamImmichAsset: vi.fn() }));
vi.mock('../../src/services/memories/photoResolverService', () => ({ streamPhoto: vi.fn() }));

const { jsvc } = vi.hoisted(() => ({
  jsvc: { listJourneys: vi.fn(), createJourney: vi.fn(), getJourneyFull: vi.fn() },
}));
vi.mock('../../src/services/journeyService', () => jsvc);

const { sharesvc } = vi.hoisted(() => ({ sharesvc: { getPublicJourney: vi.fn() } }));
vi.mock('../../src/services/journeyShareService', () => sharesvc);

import { JourneyModule } from '../../src/nest/journey/journey.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Journey e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [JourneyModule] }).compile();
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

  it('public journey read is unguarded (200 with a valid token, no cookie)', async () => {
    const res = await request(server).get('/api/public/journey/tok');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 9 });
  });

  it('public journey 404 for an unknown token', async () => {
    sharesvc.getPublicJourney.mockReturnValueOnce(null);
    const res = await request(server).get('/api/public/journey/bad');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
