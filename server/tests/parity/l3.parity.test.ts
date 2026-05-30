/**
 * L3 parity — maps / geo.
 *
 * Fires the same request at the legacy Express /api/maps route and the migrated
 * Nest controller with mapsService mocked identically for both, asserting
 * client-identical status + body. Covers the JSON endpoints; the file-serving
 * /place-photo/:placeId/bytes route is covered by the controller unit test.
 *
 * The per-endpoint kill-switches read app_settings; the stubbed DB returns no
 * rows, so every switch reads as "enabled" — the disabled short-circuits are
 * covered by the unit + e2e tests. Auth is neutralised identically for both apps.
 */
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({
  fixedUser: { id: 1, username: 'parity', email: 'parity@example.test', role: 'user' },
}));

// Stub DB: every app_settings lookup misses -> kill-switches read as enabled.
vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) },
  closeDb: () => {},
  reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  extractToken: () => 'parity-token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    searchPlaces: vi.fn(),
    autocompletePlaces: vi.fn(),
    getPlaceDetails: vi.fn(),
    getPlaceDetailsExpanded: vi.fn(),
    getPlacePhoto: vi.fn(),
    reverseGeocode: vi.fn(),
    resolveGoogleMapsUrl: vi.fn(),
  },
}));
vi.mock('../../src/services/mapsService', async (importActual) => {
  const actual = await importActual<typeof import('../../src/services/mapsService')>();
  return { ...actual, ...mocks };
});

import mapsRoutes from '../../src/routes/maps';
import { MapsModule } from '../../src/nest/maps/maps.module';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('L3 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/maps', mapsRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, MapsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    mocks.searchPlaces.mockResolvedValue({ places: [{ name: 'Berlin' }], source: 'osm' });
    mocks.autocompletePlaces.mockResolvedValue({ suggestions: [{ placeId: 'p', mainText: 'Berlin', secondaryText: 'DE' }], source: 'osm' });
    mocks.getPlaceDetails.mockResolvedValue({ place: { id: 'p1', name: 'Spot' } });
    mocks.getPlaceDetailsExpanded.mockResolvedValue({ place: { id: 'p1', name: 'Spot', expanded: true } });
    mocks.getPlacePhoto.mockResolvedValue({ photoUrl: 'http://x/y.jpg', attribution: 'CC' });
    mocks.reverseGeocode.mockResolvedValue({ name: 'Spot', address: 'Street 1' });
    mocks.resolveGoogleMapsUrl.mockResolvedValue({ lat: 52.5, lng: 13.4, name: null, address: null });
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('POST /search success', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/maps/search', body: { query: 'berlin' } }));

  it('POST /search missing query (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/maps/search', body: {} }));

  it('POST /search service error', async () => {
    mocks.searchPlaces.mockRejectedValueOnce(Object.assign(new Error('Rate limited'), { status: 429 }));
    mocks.searchPlaces.mockRejectedValueOnce(Object.assign(new Error('Rate limited'), { status: 429 }));
    await expectParity(expressServer, nestServer, { method: 'post', path: '/api/maps/search', body: { query: 'x' } });
  });

  it('POST /autocomplete success', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/maps/autocomplete', body: { input: 'ber' } }));

  it('POST /autocomplete missing input (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/maps/autocomplete', body: {} }));

  it('POST /autocomplete too long (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/maps/autocomplete', body: { input: 'x'.repeat(201) } }));

  it('POST /autocomplete invalid locationBias (400)', () =>
    expectParity(expressServer, nestServer, {
      method: 'post', path: '/api/maps/autocomplete',
      body: { input: 'ber', locationBias: { low: { lat: 1, lng: 'no' }, high: { lat: 2, lng: 3 } } },
    }));

  it('GET /details/:placeId', () =>
    expectParity(expressServer, nestServer, { path: '/api/maps/details/p1' }));

  it('GET /details/:placeId?expand=full', () =>
    expectParity(expressServer, nestServer, { path: '/api/maps/details/p1', query: { expand: 'full' } }));

  it('GET /place-photo/:placeId', () =>
    expectParity(expressServer, nestServer, { path: '/api/maps/place-photo/p1', query: { lat: '1', lng: '2' } }));

  it('GET /reverse success', () =>
    expectParity(expressServer, nestServer, { path: '/api/maps/reverse', query: { lat: '52.5', lng: '13.4' } }));

  it('GET /reverse missing lat/lng (400)', () =>
    expectParity(expressServer, nestServer, { path: '/api/maps/reverse', query: { lat: '52.5' } }));

  it('POST /resolve-url success', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/maps/resolve-url', body: { url: 'https://maps.app.goo.gl/x' } }));

  it('POST /resolve-url missing url (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/maps/resolve-url', body: {} }));
});
