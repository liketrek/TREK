/**
 * /uploads static-mount parity tests (UPLOADS-P01…P24).
 *
 * Written BEFORE the storage slice-3 swap of the four express.static mounts
 * (avatars / covers / journey / places) for a storage-backed handler on the
 * same URLs. P01–P21 pin today's express.static behavior — ETag /
 * Last-Modified / conditional-GET / Range / HEAD, miss-falls-through to the
 * Nest 404 envelope — and must stay green across the swap. P22–P24 are the
 * approved deliberate deltas (D1–D3 in the slice-3 plan): RED against
 * express.static, green against the storage handler.
 *
 * These routes are unauthenticated BY DESIGN (audit SEC-M9): server-chosen
 * UUIDv4 filenames; gating them would break share-link trip cards, journey
 * public pages, and email-embedded avatars. No auth setup here is deliberate.
 */
import { buildApp } from '../../src/bootstrap';
import { runMigrations } from '../../src/db/migrations';
import { createTables } from '../../src/db/schema';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({
  broadcast: vi.fn(),
  broadcastToUser: vi.fn(),
  getOnlineUserIds: vi.fn(() => []),
}));

let nestApp: INestApplication;
let app: Application;

const uploadsDir = path.join(__dirname, '../../uploads');
// 8 known bytes (the PNG magic) so Content-Length / Range math is exact.
const BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const NAME = 'uploads-static-parity.png';

// Every path this suite creates, for targeted afterAll cleanup — the uploads
// tree is shared with other integration workers, so no directory-wide rm of
// the category dirs themselves.
const created: string[] = [];

function writeFixture(rel: string, bytes: Buffer = BYTES): void {
  const abs = path.join(uploadsDir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, bytes);
  created.push(abs);
}

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  // Written AFTER buildApp(): LocalDriver init ensures + realpaths the
  // category dirs at boot.
  writeFixture(`avatars/${NAME}`);
  writeFixture(`covers/${NAME}`);
  writeFixture(`journey/thumbs/uploads-static-parity.jpg`);
  writeFixture(`places/${NAME}`);
  writeFixture('avatars/.uploads-static-parity-hidden');
  writeFixture('avatars/.tmp/uploads-static-parity-spooled.bin');
  fs.mkdirSync(path.join(uploadsDir, 'journey/parity-subdir'), { recursive: true });
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
  for (const abs of created) fs.rmSync(abs, { force: true });
  fs.rmSync(path.join(uploadsDir, 'avatars/.tmp'), { recursive: true, force: true });
  fs.rmSync(path.join(uploadsDir, 'journey/parity-subdir'), { recursive: true, force: true });
});

describe('/uploads static parity — hit headers and bytes', () => {
  it('UPLOADS-P01 — GET hit: 200 with express.static header set', async () => {
    const res = await request(app).get(`/uploads/avatars/${NAME}`);
    expect(res.status).toBe(200);
    expect(res.body.equals ? res.body.equals(BYTES) : Buffer.from(res.body).equals(BYTES)).toBe(true);
    expect(res.headers.etag).toMatch(/^W\/"[0-9a-f]+-[0-9a-f]+"$/);
    expect(res.headers['last-modified']).toBeDefined();
    expect(res.headers['cache-control']).toBe('public, max-age=0');
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['content-length']).toBe('8');
  });

  it('UPLOADS-P02 — HEAD hit: 200, same headers, empty body', async () => {
    const res = await request(app).head(`/uploads/avatars/${NAME}`);
    expect(res.status).toBe(200);
    expect(res.headers.etag).toMatch(/^W\/"[0-9a-f]+-[0-9a-f]+"$/);
    expect(res.headers['content-length']).toBe('8');
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.text ?? '').toBe('');
  });

  it('UPLOADS-P19 — query string is ignored', async () => {
    const res = await request(app).get(`/uploads/avatars/${NAME}?x=1`);
    expect(res.status).toBe(200);
    expect(res.headers['content-length']).toBe('8');
  });

  it('UPLOADS-P20 — doubled leading slash still serves', async () => {
    const res = await request(app).get(`/uploads/avatars//${NAME}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-length']).toBe('8');
  });
});

describe('/uploads static parity — conditional GET', () => {
  it('UPLOADS-P03 — If-None-Match with the current ETag → 304', async () => {
    const first = await request(app).get(`/uploads/avatars/${NAME}`);
    const res = await request(app).get(`/uploads/avatars/${NAME}`).set('If-None-Match', first.headers.etag);
    expect(res.status).toBe(304);
    expect(res.headers.etag).toBe(first.headers.etag);
    expect(res.text ?? '').toBe('');
  });

  it('UPLOADS-P04 — If-Modified-Since with the current Last-Modified → 304', async () => {
    const first = await request(app).get(`/uploads/avatars/${NAME}`);
    const res = await request(app)
      .get(`/uploads/avatars/${NAME}`)
      .set('If-Modified-Since', first.headers['last-modified']);
    expect(res.status).toBe(304);
  });

  it('UPLOADS-P05 — stale If-None-Match → 200 full', async () => {
    const res = await request(app).get(`/uploads/avatars/${NAME}`).set('If-None-Match', 'W/"0-0"');
    expect(res.status).toBe(200);
    expect(res.headers['content-length']).toBe('8');
  });

  it('UPLOADS-P06 — If-Match mismatch → 412', async () => {
    const res = await request(app).get(`/uploads/avatars/${NAME}`).set('If-Match', '"mismatch"');
    expect(res.status).toBe(412);
  });
});

describe('/uploads static parity — Range', () => {
  it('UPLOADS-P07 — single satisfiable range → 206 with Content-Range', async () => {
    const res = await request(app).get(`/uploads/avatars/${NAME}`).set('Range', 'bytes=0-3');
    expect(res.status).toBe(206);
    expect(res.headers['content-range']).toBe('bytes 0-3/8');
    expect(res.headers['content-length']).toBe('4');
    expect(Buffer.from(res.body).equals(BYTES.subarray(0, 4))).toBe(true);
  });

  it('UPLOADS-P08 — unsatisfiable range → 416 with Content-Range */size', async () => {
    const res = await request(app).get(`/uploads/avatars/${NAME}`).set('Range', 'bytes=999-');
    expect(res.status).toBe(416);
    expect(res.headers['content-range']).toBe('bytes */8');
  });

  it('UPLOADS-P09 — multi-range is ignored → 200 full', async () => {
    const res = await request(app).get(`/uploads/avatars/${NAME}`).set('Range', 'bytes=0-0,4-5');
    expect(res.status).toBe(200);
    expect(res.headers['content-length']).toBe('8');
  });

  it('UPLOADS-P10 — non-bytes range unit is ignored → 200 full', async () => {
    const res = await request(app).get(`/uploads/avatars/${NAME}`).set('Range', 'apples=0-1');
    expect(res.status).toBe(200);
  });

  it('UPLOADS-P11 — stale If-Range drops the range → 200 full', async () => {
    const res = await request(app).get(`/uploads/avatars/${NAME}`).set('Range', 'bytes=0-3').set('If-Range', 'W/"0-0"');
    expect(res.status).toBe(200);
    expect(res.headers['content-length']).toBe('8');
  });

  it('UPLOADS-P12 — fresh If-Range honors the range → 206', async () => {
    const first = await request(app).get(`/uploads/avatars/${NAME}`);
    const res = await request(app)
      .get(`/uploads/avatars/${NAME}`)
      .set('Range', 'bytes=0-3')
      .set('If-Range', first.headers.etag);
    expect(res.status).toBe(206);
  });
});

describe('/uploads static parity — miss falls through to the Nest 404 envelope', () => {
  it('UPLOADS-P13 — GET miss → Nest envelope, not a bespoke 404', async () => {
    const res = await request(app).get('/uploads/avatars/nope.png');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Cannot GET /uploads/avatars/nope.png' });
  });

  it('UPLOADS-P14 — HEAD miss → 404, empty body', async () => {
    const res = await request(app).head('/uploads/avatars/nope.png');
    expect(res.status).toBe(404);
    expect(res.text ?? '').toBe('');
  });

  it('UPLOADS-P15 — POST to a hit URL falls through (no 405)', async () => {
    const res = await request(app).post(`/uploads/avatars/${NAME}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe(`Cannot POST /uploads/avatars/${NAME}`);
  });

  it('UPLOADS-P16 — malformed percent-encoding falls through', async () => {
    const res = await request(app).get('/uploads/avatars/%ZZ');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/^Cannot GET /);
  });

  it('UPLOADS-P17 — traversal shapes fall through, raw and encoded', async () => {
    const raw = await request(app).get('/uploads/avatars/../covers/x.png');
    expect(raw.status).toBe(404);
    const encoded = await request(app).get('/uploads/avatars/..%2Fcovers%2Fx.png');
    expect(encoded.status).toBe(404);
  });

  it('UPLOADS-P18 — dotfile basename falls through', async () => {
    const res = await request(app).get('/uploads/avatars/.uploads-static-parity-hidden');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Cannot GET /uploads/avatars/.uploads-static-parity-hidden');
  });
});

describe('/uploads static parity — all four mounts', () => {
  it('UPLOADS-P21 — covers/journey(nested)/places each serve a hit and 404 a miss', async () => {
    // Fixtures are (re)written immediately before each request: other suites
    // rm their whole category dir in afterAll (collections/trips → covers,
    // collections → places, journey.test → journey), so a beforeAll-written
    // file can vanish mid-run when the tier runs in parallel workers.
    writeFixture(`covers/${NAME}`);
    const coverHit = await request(app).get(`/uploads/covers/${NAME}`);
    expect(coverHit.status).toBe(200);
    const coverMiss = await request(app).get('/uploads/covers/nope.png');
    expect(coverMiss.status).toBe(404);
    expect(coverMiss.body.error).toBe('Cannot GET /uploads/covers/nope.png');

    // Nested name — journey thumbs live at journey/thumbs/<hash>.jpg and are
    // served through the same mount; pins multi-segment storage keys.
    writeFixture('journey/thumbs/uploads-static-parity.jpg');
    const journeyHit = await request(app).get('/uploads/journey/thumbs/uploads-static-parity.jpg');
    expect(journeyHit.status).toBe(200);
    expect(journeyHit.headers['content-type']).toBe('image/jpeg');
    const journeyMiss = await request(app).get('/uploads/journey/thumbs/nope.jpg');
    expect(journeyMiss.status).toBe(404);

    writeFixture(`places/${NAME}`);
    const placeHit = await request(app).get(`/uploads/places/${NAME}`);
    expect(placeHit.status).toBe(200);
    const placeMiss = await request(app).get('/uploads/places/nope.png');
    expect(placeMiss.status).toBe(404);
  });
});

describe('/uploads static — approved deliberate deltas (RED against express.static)', () => {
  // D3 (slice-3 plan): send's legacy dotfiles mode only ignores dot BASENAMES,
  // so a file under a dot-directory is servable today. Central storage key
  // validation rejects every dot segment — the spec's ".tmp must remain
  // unservable" pin.
  it('UPLOADS-P22 — a file under a dot-directory is NOT servable', async () => {
    const res = await request(app).get('/uploads/avatars/.tmp/uploads-static-parity-spooled.bin');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Cannot GET /uploads/avatars/.tmp/uploads-static-parity-spooled.bin');
  });

  // D1/D2: express.static answers directory URLs with a 301 trailing-slash
  // redirect (and an index.html lookup on the slashed form). The storage
  // handler treats both as a plain miss.
  it('UPLOADS-P23 — mount root (with and without slash) is a miss', async () => {
    const bare = await request(app).get('/uploads/avatars');
    expect(bare.status).toBe(404);
    expect(bare.body.error).toBe('Cannot GET /uploads/avatars');
    const slashed = await request(app).get('/uploads/avatars/');
    expect(slashed.status).toBe(404);
  });

  it('UPLOADS-P24 — a real subdirectory URL is a miss, not a redirect', async () => {
    const res = await request(app).get('/uploads/journey/parity-subdir');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Cannot GET /uploads/journey/parity-subdir');
  });
});
