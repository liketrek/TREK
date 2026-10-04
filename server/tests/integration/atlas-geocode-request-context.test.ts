/**
 * Atlas background-geocode request-context ratchet (L5, task-7-review.md).
 *
 * `AtlasService`'s `/stats` (AT4) and `/regions` (AT29) handlers start
 * `cacheRegionsInBackground` after the response: a detached loop that
 * reverse-geocodes a place and writes through
 * `PlaceRegionsRepository.upsertRegionWhileUnmoved` (#2527) — a repository
 * method, so it validates it is running inside a request context rather than
 * the global one. The reviewer traced this with a real `buildApp()` boot, a
 * 1.2s-delayed `reverseGeocodeRegion` and a spy on the write catching
 * whatever it would otherwise swallow: `GET /stats` writes `FR`/`FR-IDF`
 * after the response, `GET /regions` writes two places about 2.4s apart, and
 * in both cases `AsyncLocalStorage` carried the request fork with zero
 * `cannotUseGlobalContext` errors. The loop now forks its own request context
 * with `withRequestContext` all the same, like every other detached chain;
 * because the carry would keep an HTTP-driven case green with that wrap
 * removed, the load-bearing proof is ATLAS-CTX-001 in `atlas.service.test.ts`,
 * which starts the loop from a bare context. This file stays as the parity
 * proof for the real routes: the writes still land after the response, with
 * the same timing, and nothing reaches the error log.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h', SESSION_DURATION_MS: 86400000, SESSION_DURATION_SECONDS: 86400, DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
vi.mock('../../src/nest/atlas/atlas-geo', async (orig) => {
  const actual = await orig<typeof import('../../src/nest/atlas/atlas-geo')>();
  return {
    ...actual,
    resolveCountryCodeSync: () => null,
    reverseGeocodeRegion: async (lat: number) => {
      await new Promise((r) => setTimeout(r, 1200)); // Nominatim-rate delay
      return { country_code: 'FR', region_code: lat > 45 ? 'FR-IDF' : 'FR-PAC', region_name: 'R' };
    },
  };
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb } from '../helpers/test-db';
import { createUser, createTrip, createPlace } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { PlaceRegionsRepository } from '../../src/db/repositories/PlaceRegions.repository';

let nestApp: INestApplication;
let app: Application;
const errors: unknown[] = [];
beforeAll(async () => {
  const orig = PlaceRegionsRepository.prototype.upsertRegionWhileUnmoved;
  PlaceRegionsRepository.prototype.upsertRegionWhileUnmoved = async function (...a: Parameters<typeof orig>) {
    try {
      return await orig.apply(this, a);
    } catch (e) {
      errors.push(e);
      throw e;
    }
  };
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
}, 60_000);
afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('AT4/AT29 background geocode request context', () => {
  it('IIFE-CTX-AT4 — /stats IIFE writes place_regions after the response, no cannotUseGlobalContext', async () => {
    resetTestDb(testDb);
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const p = createPlace(testDb, trip.id, { lat: 48.85, lng: 2.35 });
    const res = await request(app).get('/api/addons/atlas/stats').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(testDb.prepare('SELECT * FROM place_regions WHERE place_id=?').get(p.id)).toBeUndefined();
    await new Promise((r) => setTimeout(r, 2500));
    expect(errors).toEqual([]);
    expect(testDb.prepare('SELECT * FROM place_regions WHERE place_id=?').get(p.id)).toMatchObject({ country_code: 'FR', region_code: 'FR-IDF' });
  }, 15_000);

  it('IIFE-CTX-AT29 — /regions IIFE writes two places sequentially (2nd after ~2.4s)', async () => {
    resetTestDb(testDb);
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id, { lat: 48.85, lng: 2.35 });
    const p2 = createPlace(testDb, trip.id, { lat: 43.3, lng: 5.4 });
    const res = await request(app).get('/api/addons/atlas/regions').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 3500));
    expect(errors).toEqual([]);
    const rows = testDb.prepare('SELECT place_id, region_code FROM place_regions ORDER BY place_id').all();
    expect(rows).toEqual([
      { place_id: p1.id, region_code: 'FR-IDF' },
      { place_id: p2.id, region_code: 'FR-PAC' },
    ]);
  }, 15_000);
});
