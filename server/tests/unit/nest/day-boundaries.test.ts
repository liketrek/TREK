import Database from 'better-sqlite3';
import { afterEach, expect, it, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { DayBoundariesService } from '../../../src/nest/roadtrip/day-boundaries.service';
import { DayBoundariesController } from '../../../src/nest/roadtrip/day-boundaries.controller';
import { DayBoundariesMcp } from '../../../src/nest/roadtrip/day-boundaries.mcp';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { McpContext } from '../../../src/nest-mcp';

const open: Database.Database[] = [];
afterEach(() => open.splice(0).forEach(db => db.close()));
function setup() {
  const raw = new Database(':memory:');
  open.push(raw);
  raw.pragma('foreign_keys = ON');
  raw.exec(`CREATE TABLE days (id INTEGER PRIMARY KEY, trip_id INTEGER);
    CREATE TABLE day_assignments (id INTEGER PRIMARY KEY, day_id INTEGER REFERENCES days(id) ON DELETE CASCADE);
    CREATE TABLE roadtrip_day_boundaries (trip_id INTEGER, day_number INTEGER, from_assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE CASCADE,
      to_assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE CASCADE, fraction REAL, PRIMARY KEY(trip_id, day_number));
    INSERT INTO days VALUES (1, 10), (2, 20);
    INSERT INTO day_assignments VALUES (11, 1), (12, 1), (21, 2);`);
  const db = {
    get: (sql: string, ...params: unknown[]) => raw.prepare(sql).get(...params),
    all: (sql: string, ...params: unknown[]) => raw.prepare(sql).all(...params),
    run: (sql: string, ...params: unknown[]) => raw.prepare(sql).run(...params),
    canAccessTrip: vi.fn(() => true),
  };
  const service = new DayBoundariesService(db as unknown as DatabaseService);
  const realtime = { broadcast: vi.fn() };
  const auth = { isDemoUser: vi.fn(() => false) };
  const guards = { hasTripPermission: vi.fn(() => true) };
  const mcp = new DayBoundariesMcp(service, db as unknown as DatabaseService, auth as never, guards as never, realtime as never, {} as never);
  return { raw, service, controller: new DayBoundariesController(service, realtime as never), mcp, db, auth, guards, realtime };
}
const boundary = { day_number: 1, from_assignment_id: 11, to_assignment_id: 12, fraction: 0.4 };

it('replaces one day only, persists place snapping and cascades deleted visits', () => {
  const { service, raw } = setup();
  service.save(10, boundary);
  service.save(10, { ...boundary, day_number: 2, fraction: 0.8 });
  expect(service.save(10, { ...boundary, to_assignment_id: null })).toEqual([
    { ...boundary, to_assignment_id: null, fraction: 1 }, { ...boundary, day_number: 2, fraction: 0.8 },
  ]);
  expect(service.list(20)).toEqual([]);
  service.remove(20, 1);
  expect(service.list(10)).toHaveLength(2);
  raw.prepare('DELETE FROM day_assignments WHERE id = 12').run();
  expect(service.list(10)).toEqual([{ ...boundary, to_assignment_id: null, fraction: 1 }]);
});

it('rejects either endpoint from a different trip without writing', () => {
  const { service } = setup();
  expect(() => service.save(10, { ...boundary, from_assignment_id: 21 })).toThrow(HttpException);
  expect(() => service.save(10, { ...boundary, to_assignment_id: 21 })).toThrow(HttpException);
  expect(service.list(10)).toEqual([]);
});

it('REST changes broadcast the complete state and exclude the saving socket', () => {
  const { controller, realtime } = setup();
  controller.save('10', boundary, 'self');
  expect(realtime.broadcast).toHaveBeenCalledWith('10', 'roadtripBoundary:changed', { boundaries: [boundary] }, 'self');
  expect(controller.remove('10', 1)).toEqual({ boundaries: [] });
});

it('MCP checks demo, trip access and edit permission before saving', async () => {
  const s = setup(), ctx = { userId: 1 } as McpContext;
  const request = { tripId: 10, dayNumber: 1, boundary };
  s.auth.isDemoUser.mockReturnValue(true);
  await s.mcp.save(request, ctx);
  s.auth.isDemoUser.mockReturnValue(false);
  s.db.canAccessTrip.mockReturnValue(false);
  await s.mcp.save(request, ctx);
  s.db.canAccessTrip.mockReturnValue(true);
  s.guards.hasTripPermission.mockReturnValue(false);
  await s.mcp.save(request, ctx);
  expect(s.service.list(10)).toEqual([]);
  s.guards.hasTripPermission.mockReturnValue(true);
  await s.mcp.save(request, ctx);
  expect(s.service.list(10)).toEqual([boundary]);
  await s.mcp.save({ ...request, boundary: null }, ctx);
  expect(s.service.list(10)).toEqual([]);
});
