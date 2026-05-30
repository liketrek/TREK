/**
 * S1 parity — vacay addon.
 *
 * Fires the same request at the legacy Express /api/addons/vacay route and the
 * migrated Nest controller with vacayService mocked identically for both,
 * asserting client-identical status + body. Auth is neutralised identically; the
 * 401 path is covered by the e2e test. Covers the validation/403/error-status
 * paths and the POST-stays-200 behaviour.
 */
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({
  fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' },
}));

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
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

const { svc } = vi.hoisted(() => ({
  svc: {
    getPlanData: vi.fn(), getActivePlanId: vi.fn(), getActivePlan: vi.fn(), updatePlan: vi.fn(),
    addHolidayCalendar: vi.fn(), updateHolidayCalendar: vi.fn(), deleteHolidayCalendar: vi.fn(),
    getPlanUsers: vi.fn(), setUserColor: vi.fn(), sendInvite: vi.fn(), acceptInvite: vi.fn(),
    declineInvite: vi.fn(), cancelInvite: vi.fn(), dissolvePlan: vi.fn(), getAvailableUsers: vi.fn(),
    listYears: vi.fn(), addYear: vi.fn(), deleteYear: vi.fn(), getEntries: vi.fn(),
    toggleEntry: vi.fn(), toggleCompanyHoliday: vi.fn(), getStats: vi.fn(), updateStats: vi.fn(),
    getCountries: vi.fn(), getHolidays: vi.fn(),
  },
}));
vi.mock('../../src/services/vacayService', () => svc);

import vacayRoutes from '../../src/routes/vacay';
import { VacayModule } from '../../src/nest/vacay/vacay.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('S1 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/addons/vacay', vacayRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [VacayModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    svc.getActivePlanId.mockReturnValue(10);
    svc.getActivePlan.mockReturnValue({ id: 10 });
    svc.getPlanUsers.mockReturnValue([{ id: 1 }]);
    svc.getPlanData.mockReturnValue({ plan: { id: 10 }, users: [] });
    svc.addHolidayCalendar.mockReturnValue({ id: 1, region: 'DE-BY' });
    svc.listYears.mockReturnValue([2026]);
    svc.addYear.mockReturnValue([2026, 2027]);
    svc.getEntries.mockReturnValue({ entries: [] });
    svc.toggleEntry.mockReturnValue({ action: 'added' });
    svc.getStats.mockReturnValue({ used: 5 });
    svc.getAvailableUsers.mockReturnValue([{ id: 2 }]);
    svc.sendInvite.mockReturnValue({});
    svc.getCountries.mockResolvedValue({ data: [{ code: 'DE' }] });
    svc.getHolidays.mockResolvedValue({ data: [{ date: '2026-01-01' }] });
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET /plan', () => expectParity(expressServer, nestServer, { path: '/api/addons/vacay/plan' }));
  it('POST /plan/holiday-calendars (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/vacay/plan/holiday-calendars', body: { region: 'DE-BY', label: 'Bayern' } }));
  it('POST /plan/holiday-calendars missing region (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/vacay/plan/holiday-calendars', body: {} }));
  it('PUT /color in-plan (200)', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/addons/vacay/color', body: { color: '#fff' } }));
  it('PUT /color not in plan (403)', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/addons/vacay/color', body: { color: '#fff', target_user_id: 99 } }));
  it('POST /invite (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/vacay/invite', body: { user_id: 2 } }));
  it('POST /invite missing user_id (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/vacay/invite', body: {} }));
  it('POST /dissolve (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/vacay/dissolve' }));
  it('GET /available-users', () => expectParity(expressServer, nestServer, { path: '/api/addons/vacay/available-users' }));
  it('GET /years', () => expectParity(expressServer, nestServer, { path: '/api/addons/vacay/years' }));
  it('POST /years (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/vacay/years', body: { year: 2027 } }));
  it('POST /years missing (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/vacay/years', body: {} }));
  it('GET /entries/:year', () => expectParity(expressServer, nestServer, { path: '/api/addons/vacay/entries/2026' }));
  it('POST /entries/toggle (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/vacay/entries/toggle', body: { date: '2026-07-01' } }));
  it('POST /entries/toggle missing date (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/vacay/entries/toggle', body: {} }));
  it('GET /stats/:year', () => expectParity(expressServer, nestServer, { path: '/api/addons/vacay/stats/2026' }));
  it('GET /holidays/countries', () => expectParity(expressServer, nestServer, { path: '/api/addons/vacay/holidays/countries' }));
  it('GET /holidays/:year/:country', () => expectParity(expressServer, nestServer, { path: '/api/addons/vacay/holidays/2026/DE' }));
});
