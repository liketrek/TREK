/**
 * Place enrichment e2e — exercises POST /api/maps/enrichment through the real
 * JwtAuthGuard and the real Zod validation pipe against a temp SQLite db. The
 * provider fan-out on the container's MapsService is stubbed (no outbound
 * HTTP); the photo cache is stubbed on its own instance so nothing touches disk.
 */
import { RateLimitService } from '../../src/nest/common/rate-limit.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { MapsService } from '../../src/nest/maps/maps.service';
import { PlaceEnrichmentModule } from '../../src/nest/place-enrichment/place-enrichment.module';
import { candidateKey } from '../../src/nest/place-enrichment/place-enrichment.service';
import { PlacePhotoCacheService } from '../../src/nest/place-photos/place-photo-cache.service';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    maps_api_key TEXT);`);
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  // The enrichment result cache shares the details cache table (expanded = 2).
  tmp.exec(`CREATE TABLE place_details_cache (place_id TEXT NOT NULL, lang TEXT NOT NULL DEFAULT '',
    expanded INTEGER NOT NULL DEFAULT 0, payload_json TEXT NOT NULL, fetched_at INTEGER NOT NULL,
    PRIMARY KEY (place_id, lang, expanded));`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

const BODY = { lat: 50.9, lng: 6.96, name: 'Museum Ludwig', placeId: 'way:12345' };

describe('Place enrichment e2e (real auth guard + real validation pipe)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let maps: MapsService;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, PlaceEnrichmentModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // The APP_PIPE from app.module.ts isn't in this focused graph — wire it by
    // hand so the body really is validated against the shared Zod contract.
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();

    maps = app.get(MapsService);
    const photoCache = app.get(PlacePhotoCacheService);
    vi.spyOn(photoCache, 'get').mockReturnValue(null);
    vi.spyOn(photoCache, 'put').mockImplementation(async (key: string, _b: Buffer, attribution: string | null) => ({
      photoUrl: `/api/maps/place-photo/${encodeURIComponent(key)}/bytes`,
      filePath: `/tmp/${key}.jpg`,
      attribution,
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    db.prepare('DELETE FROM app_settings').run();
    db.prepare('DELETE FROM place_details_cache').run();
    app.get(RateLimitService).reset('place_enrichment');
    // spyOn hands back the same spy on a second call, so the call counts carry
    // over between tests unless they are cleared explicitly.
    vi.spyOn(maps, 'fetchCommonsCandidates').mockClear().mockResolvedValue([]);
    vi.spyOn(maps, 'fetchWikiExtract').mockClear().mockResolvedValue(null);
    vi.spyOn(maps, 'fetchCommonsCategoryCandidates').mockClear().mockResolvedValue([]);
    vi.spyOn(maps, 'details').mockClear().mockResolvedValue({ place: null });
    // Every provider the service can reach has to be stubbed here, not just the
    // ones a given case cares about: anything left open goes out over the real
    // network from CI, which is both slow and rude to the provider.
    vi.spyOn(maps, 'resolveOsmIdentity').mockClear().mockResolvedValue(null);
    vi.spyOn(maps, 'fetchWikidataSitelinks').mockClear().mockResolvedValue({});
    vi.spyOn(maps, 'fetchWikiExtractFor').mockClear().mockResolvedValue(null);
    vi.spyOn(maps, 'fetchWikidataCandidates').mockClear().mockResolvedValue({ candidates: [], commonsCategory: null });
    vi.spyOn(maps, 'fetchWikiLeadImageName').mockClear().mockResolvedValue(null);
    vi.spyOn(maps, 'fetchCommonsFilesByName').mockClear().mockResolvedValue(new Map());
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).post('/api/maps/enrichment').send(BODY);
    expect(res.status).toBe(401);
  });

  it('400 when the coordinates are missing', async () => {
    const res = await request(server)
      .post('/api/maps/enrichment')
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Museum Ludwig' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 when a coordinate arrives as a string', async () => {
    const res = await request(server)
      .post('/api/maps/enrichment')
      .set('Cookie', sessionCookie(1))
      .send({ ...BODY, lat: '50.9' });
    expect(res.status).toBe(400);
  });

  it('200 with an empty result when no provider has anything (POST stays 200)', async () => {
    const res = await request(server).post('/api/maps/enrichment').set('Cookie', sessionCookie(1)).send(BODY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ photos: [], description: null, facts: [], hours: null, rating: null });
  });

  it('200 with a Commons candidate carrying its licence', async () => {
    vi.spyOn(maps, 'fetchCommonsCandidates').mockResolvedValue([
      {
        photoUrl: 'https://commons.org/thumb.jpg',
        attribution: 'Alice',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
        pageId: 4711,
        title: 'File:X.jpg',
        width: 1600,
        height: 1200,
        descriptors: null,
      },
    ]);
    // The bytes download goes through the SSRF-guarded fetch — stub the network.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer })),
    );

    const res = await request(server).post('/api/maps/enrichment').set('Cookie', sessionCookie(1)).send(BODY);

    expect(res.status).toBe(200);
    expect(res.body.photos).toHaveLength(1);
    expect(res.body.photos[0]).toMatchObject({
      // Keyed by the file's Commons page id, not by its slot in the strip.
      key: candidateKey('way:12345', 'commons:4711'),
      attribution: 'Alice',
      license: 'CC BY-SA 4.0',
      source: 'wikimedia',
    });
    vi.unstubAllGlobals();
  });

  it('200 with the disabled envelope once an admin switches enrichment off', async () => {
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('places_enrich_enabled', 'false')").run();

    const res = await request(server).post('/api/maps/enrichment').set('Cookie', sessionCookie(1)).send(BODY);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ photos: [], description: null, facts: [], disabled: true });
    expect(maps.fetchCommonsCandidates).not.toHaveBeenCalled();
  });

  it('stays enabled on an instance that has never seen the setting', async () => {
    const res = await request(server).post('/api/maps/enrichment').set('Cookie', sessionCookie(1)).send(BODY);
    expect(res.body.disabled).toBeUndefined();
    expect(maps.fetchCommonsCandidates).toHaveBeenCalled();
  });

  it('serves the second request for the same place from the row cache', async () => {
    vi.spyOn(maps, 'details').mockResolvedValue({
      place: { summary: 'Ein Museum in Köln.', source: 'openstreetmap', osm_url: 'https://osm.org/way/12345' },
    });

    const first = await request(server).post('/api/maps/enrichment').set('Cookie', sessionCookie(1)).send(BODY);
    expect(first.body.description).toMatchObject({ text: 'Ein Museum in Köln.', source: 'osm', license: 'ODbL 1.0' });

    (maps.details as unknown as ReturnType<typeof vi.fn>).mockClear();
    const second = await request(server).post('/api/maps/enrichment').set('Cookie', sessionCookie(1)).send(BODY);

    expect(second.body.description).toEqual(first.body.description);
    expect(maps.details).not.toHaveBeenCalled();
  });

  it('200 with the stored credit for a cached picture', async () => {
    const photoCache = app.get(PlacePhotoCacheService);
    vi.spyOn(photoCache, 'get').mockResolvedValueOnce({
      photoUrl: '/x',
      attribution: 'Alice · CC BY-SA 4.0',
    });

    const res = await request(server)
      .get('/api/maps/enrichment/credit/' + encodeURIComponent('way:12345~p0'))
      .set('Cookie', sessionCookie(1));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ credit: 'Alice · CC BY-SA 4.0' });
  });

  it('200 with a null credit for an image the cache does not know', async () => {
    const res = await request(server)
      .get('/api/maps/enrichment/credit/' + encodeURIComponent('uploaded.jpg'))
      .set('Cookie', sessionCookie(1));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ credit: null });
  });

  it('401 on the credit route without a session cookie', async () => {
    const res = await request(server).get('/api/maps/enrichment/credit/x');
    expect(res.status).toBe(401);
  });

  it('429 once one user passes sixty requests a minute', async () => {
    const send = () =>
      request(server)
        .post('/api/maps/enrichment')
        .set('Cookie', sessionCookie(1))
        // Vary the place so the row cache cannot mask the limiter.
        .send({ ...BODY, placeId: `way:${Math.random()}` });

    for (let i = 0; i < 60; i++) expect((await send()).status).toBe(200);
    const blocked = await send();

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: 'Too many requests' });
  });
});
