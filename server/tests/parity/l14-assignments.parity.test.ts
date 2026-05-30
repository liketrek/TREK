/**
 * S7 parity — assignments (place↔day itinerary).
 *
 * Same request at the legacy Express assignments route (mounted on /api, with
 * full /trips/... paths) and the migrated Nest controllers, with
 * assignmentService, journeyService.onPlaceCreated, the permission check,
 * canAccessTrip, the WebSocket broadcast and auth all mocked identically. Covers
 * trip 404, permission 403, the bespoke 404s, the create 201 and validation 400.
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
vi.mock('../../src/services/journeyService', () => ({ onPlaceCreated: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { asg } = vi.hoisted(() => ({
  asg: {
    getAssignmentWithPlace: vi.fn(), listDayAssignments: vi.fn(), dayExists: vi.fn(), placeExists: vi.fn(),
    createAssignment: vi.fn(), assignmentExistsInDay: vi.fn(), deleteAssignment: vi.fn(), reorderAssignments: vi.fn(),
    getAssignmentForTrip: vi.fn(), moveAssignment: vi.fn(), getParticipants: vi.fn(), updateTime: vi.fn(), setParticipants: vi.fn(),
  },
}));
vi.mock('../../src/services/assignmentService', () => asg);

import assignmentsRoutes from '../../src/routes/assignments';
import { AssignmentsModule } from '../../src/nest/assignments/assignments.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('S7 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api', assignmentsRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [AssignmentsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    asg.listDayAssignments.mockReturnValue([{ id: 1 }]);
    asg.createAssignment.mockReturnValue({ id: 9 });
    asg.assignmentExistsInDay.mockReturnValue(true);
    asg.getAssignmentForTrip.mockImplementation((id: string) => (id === '9' ? { id: 9, day_id: 3 } : undefined));
    asg.moveAssignment.mockReturnValue({ assignment: { id: 9 } });
    asg.getParticipants.mockReturnValue([{ user_id: 2 }]);
    asg.updateTime.mockReturnValue({ id: 9 });
    asg.setParticipants.mockReturnValue([{ user_id: 2 }]);
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue(trip);
    checkPermission.mockReturnValue(true);
    asg.dayExists.mockReturnValue(true);
    asg.placeExists.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET day-assignments', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/days/3/assignments' }));
  it('GET day-assignments 404 day', () => {
    asg.dayExists.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/days/3/assignments' });
  });
  it('POST create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/days/3/assignments', body: { place_id: 2 } }));
  it('POST 403', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/days/3/assignments', body: { place_id: 2 } });
  });
  it('POST 404 place', () => {
    asg.placeExists.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/days/3/assignments', body: { place_id: 99 } });
  });
  it('PUT reorder', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/days/3/assignments/reorder', body: { orderedIds: [1, 2] } }));
  it('DELETE /:id 404 not in day', () => {
    asg.assignmentExistsInDay.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/days/3/assignments/77' });
  });
  it('PUT move 404 assignment', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/assignments/77/move', body: { new_day_id: 4 } }));
  it('PUT move success', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/assignments/9/move', body: { new_day_id: 4, order_index: 0 } }));
  it('GET participants', () =>
    expectParity(expressServer, nestServer, { path: '/api/trips/5/assignments/9/participants' }));
  it('PUT time success', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/assignments/9/time', body: { place_time: '10:00' } }));
  it('PUT participants 400 not array', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/assignments/9/participants', body: { user_ids: 'no' } }));
});
