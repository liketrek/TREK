/**
 * S6 parity — days + day notes (trip-scoped).
 *
 * Same request at the legacy Express days route + the day-notes route (both
 * mergeParams) and the migrated Nest controllers, with dayService /
 * dayNoteService, the permission check, canAccessTrip, the WebSocket broadcast
 * and auth all mocked identically. Covers trip 404, permission 403, the bespoke
 * 404s, the create 201, and the string-length-before-access ordering.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser, trip } = vi.hoisted(() => ({
  fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' },
  trip: { id: 5, user_id: 1 },
}));

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) },
  canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { day, note } = vi.hoisted(() => ({
  day: { listDays: vi.fn(), createDay: vi.fn(), getDay: vi.fn(), updateDay: vi.fn(), deleteDay: vi.fn() },
  note: {
    verifyTripAccess: vi.fn(), listNotes: vi.fn(), dayExists: vi.fn(), createNote: vi.fn(),
    getNote: vi.fn(), updateNote: vi.fn(), deleteNote: vi.fn(),
  },
}));
vi.mock('../../src/services/dayService', () => day);
vi.mock('../../src/services/dayNoteService', () => note);

import daysRoutes from '../../src/routes/days';
import dayNotesRoutes from '../../src/routes/dayNotes';
import { DaysModule } from '../../src/nest/days/days.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('S6 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/trips/:tripId/days/:dayId/notes', dayNotesRoutes);
    app.use('/api/trips/:tripId/days', daysRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [DaysModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    day.listDays.mockReturnValue({ days: [{ id: 1 }] });
    day.createDay.mockReturnValue({ id: 9 });
    day.getDay.mockImplementation((id: string) => (id === '9' ? { id: 9 } : undefined));
    day.updateDay.mockReturnValue({ id: 9, title: 'T' });
    note.listNotes.mockReturnValue([{ id: 1 }]);
    note.dayExists.mockReturnValue(true);
    note.createNote.mockReturnValue({ id: 7 });
    note.getNote.mockImplementation((id: string) => (id === '7' ? { id: 7 } : undefined));
    note.updateNote.mockReturnValue({ id: 7 });
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue(trip);
    note.verifyTripAccess.mockReturnValue(trip);
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  // Days
  it('GET /days', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/days' }));
  it('GET /days 404 trip', () => {
    canAccessTrip.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/days' });
  });
  it('POST /days create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/days', body: { date: '2026-07-01' } }));
  it('POST /days 403', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/days', body: {} });
  });
  it('PUT /days/:id 404 missing', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/days/77', body: { title: 'X' } }));
  it('DELETE /days/:id 404 missing', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/days/77' }));

  // Day notes
  it('GET notes', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/days/3/notes' }));
  it('POST notes create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/days/3/notes', body: { text: 'Lunch', time: '12:00' } }));
  it('POST notes 400 empty text', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/days/3/notes', body: { text: '  ' } }));
  it('POST notes 400 over-long text (before access)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/days/3/notes', body: { text: 'x'.repeat(501) } }));
  it('POST notes 404 day not found', () => {
    note.dayExists.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/days/3/notes', body: { text: 'ok' } });
  });
  it('PUT notes/:id 404 missing', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/days/3/notes/99', body: { text: 'x' } }));
  it('DELETE notes/:id 404 missing', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/days/3/notes/99' }));
});
