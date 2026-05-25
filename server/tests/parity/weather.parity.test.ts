/**
 * Nest-vs-Express parity for the /api/weather pilot module.
 *
 * Both apps call the SAME mocked weather service, so identical responses prove the
 * Nest controller is a drop-in for the legacy Express route (status + { error }
 * bodies, lang default, ApiError pass-through, 500 fallback messages).
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { mockGet, mockGetDetailed } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockGetDetailed: vi.fn(),
}));

// Same service mock for both apps — ApiError kept real so `instanceof` still works.
vi.mock('../../src/services/weatherService', async (importActual) => {
  const actual = await importActual<typeof import('../../src/services/weatherService')>();
  return { ...actual, getWeather: mockGet, getDetailedWeather: mockGetDetailed };
});

// Auth passes on both layers: Express `authenticate` middleware + Nest guard helpers.
vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = { id: 1, role: 'user' };
    next();
  },
  extractToken: () => 'tok',
  verifyJwtAndLoadUser: () => ({ id: 1, username: 'u', email: 'e@e', role: 'user' }),
}));

import weatherRouter from '../../src/routes/weather';
import { WeatherModule } from '../../src/nest/weather/weather.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ApiError } from '../../src/services/weatherService';

describe('Weather parity: Nest controller vs legacy Express route', () => {
  let expressServer: Server;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [WeatherModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalFilters(new TrekExceptionFilter());
    await app.init();
    return app;
  }

  beforeAll(async () => {
    const ex = express();
    ex.use(express.json());
    ex.use('/api/weather', weatherRouter);
    expressServer = ex.listen(0);

    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    expressServer.close();
    await nestApp.close();
  });

  beforeEach(() => {
    mockGet.mockReset();
    mockGetDetailed.mockReset();
  });

  const sample = { temp: 21, temp_max: 24, temp_min: 17, main: 'Clear', description: 'Klar', type: 'forecast' };

  it('GET /api/weather — success (forecast)', async () => {
    mockGet.mockResolvedValue(sample);
    await expectParity(expressServer, nestServer, {
      path: '/api/weather', query: { lat: '52.5', lng: '13.4', date: '2026-07-01' },
    });
  });

  it('GET /api/weather — 400 when lat/lng missing', async () => {
    await expectParity(expressServer, nestServer, { path: '/api/weather', query: { lng: '13.4' } });
  });

  it('GET /api/weather — ApiError passes status + message through', async () => {
    mockGet.mockRejectedValue(new ApiError(502, 'Open-Meteo API error'));
    await expectParity(expressServer, nestServer, { path: '/api/weather', query: { lat: '1', lng: '2' } });
  });

  it('GET /api/weather — unexpected error maps to 500 fallback', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    await expectParity(expressServer, nestServer, { path: '/api/weather', query: { lat: '1', lng: '2' } });
  });

  it('GET /api/weather/detailed — success', async () => {
    mockGetDetailed.mockResolvedValue({ ...sample, hourly: [] });
    await expectParity(expressServer, nestServer, {
      path: '/api/weather/detailed', query: { lat: '1', lng: '2', date: '2026-07-01' },
    });
  });

  it('GET /api/weather/detailed — 400 when date missing', async () => {
    await expectParity(expressServer, nestServer, {
      path: '/api/weather/detailed', query: { lat: '1', lng: '2' },
    });
  });

  it('GET /api/weather/detailed — unexpected error maps to 500 fallback', async () => {
    mockGetDetailed.mockRejectedValue(new Error('boom'));
    await expectParity(expressServer, nestServer, {
      path: '/api/weather/detailed', query: { lat: '1', lng: '2', date: '2026-07-01' },
    });
  });
});
