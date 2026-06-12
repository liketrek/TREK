/**
 * Assignments module e2e — exercises both migrated controllers through the real
 * JwtAuthGuard against a temp SQLite db. assignmentService, journeyService,
 * the permission check, canAccessTrip and the WebSocket broadcast are mocked.
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

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db, canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
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

import { AssignmentsModule } from '../../src/nest/assignments/assignments.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Assignments e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [AssignmentsModule] }).compile();
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
    asg.listDayAssignments.mockReturnValue([{ id: 1 }]);
    asg.createAssignment.mockReturnValue({ id: 9 });
    asg.getParticipants.mockReturnValue([{ user_id: 2 }]);
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
    asg.dayExists.mockReturnValue(true);
    asg.placeExists.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/days/3/assignments')).status).toBe(401);
  });

  it('200 list day-assignments', async () => {
    const res = await request(server).get('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ assignments: [{ id: 1 }] });
  });

  it('201 create, 404 place', async () => {
    const ok = await request(server).post('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1)).send({ place_id: 2 });
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({ assignment: { id: 9 } });
    asg.placeExists.mockReturnValue(false);
    const miss = await request(server).post('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1)).send({ place_id: 99 });
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Place not found' });
  });

  it('200 participants (access-only)', async () => {
    const res = await request(server).get('/api/trips/5/assignments/9/participants').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ participants: [{ user_id: 2 }] });
  });

  it('400 set participants with non-array', async () => {
    const res = await request(server).put('/api/trips/5/assignments/9/participants').set('Cookie', sessionCookie(1)).send({ user_ids: 'no' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'user_ids must be an array' });
  });
});
