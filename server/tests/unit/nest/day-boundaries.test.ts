/**
 * `DayBoundariesService`/`DayBoundariesController`/`DayBoundariesMcp` (Plan
 * 3d Task 1). Rewritten off the hand-DDL `DatabaseService`-shaped facade
 * (§15a/§15c test risk 2) onto real rows through `DayAssignmentsRepository`/
 * `RoadtripDayBoundariesRepository` — the real schema, not a 4-column
 * hand-written subset.
 */
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { RoadtripDayBoundaries } from '../../../src/db/entities/RoadtripDayBoundaries.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { DayBoundariesController } from '../../../src/nest/roadtrip/day-boundaries.controller';
import { DayBoundariesMcp } from '../../../src/nest/roadtrip/day-boundaries.mcp';
import { DayBoundariesService } from '../../../src/nest/roadtrip/day-boundaries.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createDay, createDayAssignment, createPlace, createTrip, createUser } from '../../helpers/factories';
import { deleteRows } from '../../helpers/factories/rows';
import { callGatedTool } from '../../helpers/mcp-gate';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { HttpException } from '@nestjs/common';

import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
beforeAll(async () => {
  t = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function setup() {
  const { user } = createUser(testDb);
  const tripA = createTrip(testDb, user.id);
  const tripB = createTrip(testDb, user.id);
  const dayA = createDay(testDb, tripA.id);
  const dayB = createDay(testDb, tripB.id);
  const placeA = createPlace(testDb, tripA.id);
  const placeB = createPlace(testDb, tripB.id);
  const from = createDayAssignment(testDb, dayA.id, placeA.id);
  const to = createDayAssignment(testDb, dayA.id, placeA.id);
  const foreign = createDayAssignment(testDb, dayB.id, placeB.id);

  const dayAssignmentsRepo = t.repo(DayAssignments);
  const boundariesRepo = t.repo(RoadtripDayBoundaries);
  const service = new DayBoundariesService(dayAssignmentsRepo, boundariesRepo);
  const realtime = { broadcast: vi.fn() };
  const demo = { isDemoUser: vi.fn(async () => false) };
  const guards = { hasTripPermission: vi.fn(() => true) };
  const tripsRepo = { findAccessible: vi.fn(async () => ({ id: tripA.id, user_id: user.id })) };
  const mcp = new DayBoundariesMcp(service, tripsRepo as never, guards as never, realtime as never, {} as never);
  return {
    service,
    controller: new DayBoundariesController(service, realtime as never),
    mcp,
    tripsRepo,
    demo,
    guards,
    realtime,
    tripA,
    tripB,
    fromId: from.id,
    toId: to.id,
    foreignId: foreign.id,
  };
}

it('replaces one day only, persists place snapping and cascades deleted visits', async () => {
  const { service, tripA, tripB, fromId, toId } = setup();
  const boundary = { day_number: 1, from_assignment_id: fromId, to_assignment_id: toId, fraction: 0.4 };
  await service.save(tripA.id, boundary);
  await service.save(tripA.id, { ...boundary, day_number: 2, fraction: 0.8 });
  expect(await service.save(tripA.id, { ...boundary, to_assignment_id: null })).toEqual([
    { ...boundary, to_assignment_id: null, fraction: 1 },
    { ...boundary, day_number: 2, fraction: 0.8 },
  ]);
  expect(await service.list(tripB.id)).toEqual([]);
  await service.remove(tripB.id, 1);
  expect(await service.list(tripA.id)).toHaveLength(2);
  await deleteRows(t, DayAssignments, { id: toId });
  expect(await service.list(tripA.id)).toEqual([{ ...boundary, to_assignment_id: null, fraction: 1 }]);
});

it('rejects either endpoint from a different trip without writing (RB2)', async () => {
  const { service, tripA, fromId, foreignId } = setup();
  const boundary = { day_number: 1, from_assignment_id: fromId, to_assignment_id: foreignId, fraction: 0.4 };
  await expect(service.save(tripA.id, { ...boundary, from_assignment_id: foreignId })).rejects.toThrow(HttpException);
  await expect(service.save(tripA.id, boundary)).rejects.toThrow(HttpException);
  expect(await service.list(tripA.id)).toEqual([]);
});

it('RB2 (`belongs`): a foreign `to_assignment_id` is refused with the exact legacy message', async () => {
  // The async-closure-truthiness-guards ratchet
  // (`tests/integration/async-closure-truthiness-guards.test.ts`, RB2-001)
  // drives the real route end to end and is mutation-proved there (Task 0's
  // report: dropping the `await` on `belongs` turns a 404 into a 200). This
  // unit case pins the exact error string at the service boundary.
  const { service, tripA, fromId, foreignId } = setup();
  await expect(
    service.save(tripA.id, { day_number: 1, from_assignment_id: fromId, to_assignment_id: foreignId, fraction: 0.4 }),
  ).rejects.toMatchObject({ response: { error: 'Stop not found' }, status: 404 });
});

it('REST changes broadcast the complete state and exclude the saving socket', async () => {
  const { controller, realtime, tripA, fromId, toId } = setup();
  const boundary = { day_number: 1, from_assignment_id: fromId, to_assignment_id: toId, fraction: 0.4 };
  await controller.save(String(tripA.id), boundary, 'self');
  expect(realtime.broadcast).toHaveBeenCalledWith(
    String(tripA.id),
    'roadtripBoundary:changed',
    { boundaries: [boundary] },
    'self',
  );
  expect(await controller.remove(String(tripA.id), 1)).toEqual({ boundaries: [] });
});

// R7 (task-7-review.md L4 / 3d ledger's carry): `save`'s ownership check
// (RB2 `belongs`) and its upsert (RB3) are two un-transacted statements, the
// same class of race as `roadtrip.service.test.ts`'s R7 vias pin. Both
// concurrent callers pass their own `belongs` check independently (neither
// references the other's write), then race on `upsertBoundary`'s single
// `ON CONFLICT (trip, day_number) DO UPDATE` — that statement is atomic, so
// the row can never end up a hybrid of the two payloads; exactly one caller's
// fraction survives. Pinning today's actual outcome, not a fix.
it("R7: two concurrent saves for the same day_number both succeed; the upsert leaves one caller's row intact, never a hybrid (unserialized belongs-check-then-upsert)", async () => {
  const { service, tripA, fromId, toId } = setup();
  const boundaryA = { day_number: 1, from_assignment_id: fromId, to_assignment_id: toId, fraction: 0.25 };
  const boundaryB = { day_number: 1, from_assignment_id: fromId, to_assignment_id: toId, fraction: 0.75 };

  const results = await Promise.allSettled([service.save(tripA.id, boundaryA), service.save(tripA.id, boundaryB)]);

  expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
  const rows = await service.list(tripA.id);
  // No duplicate row from the race, and no hybrid of the two fractions.
  expect(rows).toHaveLength(1);
  expect([0.25, 0.75]).toContain(rows[0].fraction);
});

it('MCP checks demo, trip access and edit permission before saving', async () => {
  const s = setup();
  const ctx = { userId: 1 } as McpContext;
  const boundary = { day_number: 1, from_assignment_id: s.fromId, to_assignment_id: s.toId, fraction: 0.4 };
  const request = { tripId: s.tripA.id, dayNumber: 1, boundary };
  const save = (req: typeof request) => callGatedTool(s.mcp, 'save', req, ctx, s.demo.isDemoUser);
  s.demo.isDemoUser.mockResolvedValue(true);
  await save(request);
  s.demo.isDemoUser.mockResolvedValue(false);
  s.tripsRepo.findAccessible.mockResolvedValue(undefined);
  await s.mcp.save(request, ctx);
  s.tripsRepo.findAccessible.mockResolvedValue({ id: s.tripA.id, user_id: 1 });
  s.guards.hasTripPermission.mockReturnValue(false);
  await s.mcp.save(request, ctx);
  expect(await s.service.list(s.tripA.id)).toEqual([]);
  s.guards.hasTripPermission.mockReturnValue(true);
  await s.mcp.save(request, ctx);
  expect(await s.service.list(s.tripA.id)).toEqual([boundary]);
  await s.mcp.save({ ...request, boundary: null }, ctx);
  expect(await s.service.list(s.tripA.id)).toEqual([]);
});
