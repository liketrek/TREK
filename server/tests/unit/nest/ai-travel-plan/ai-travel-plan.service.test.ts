/**
 * AiTravelPlanService over a migrated test db: a plan is generated, versioned,
 * applied into a trip and undone through the real services and repositories.
 *
 * Replaced: the permission checker, trip access, the audit writer, the realtime
 * facade and the planner engine. The engine fake is deliberate — this suite
 * tests the service's persistence, state machine and write path, not the
 * planner. Trips, days, places and assignments are the real domain services on
 * the migrated in-memory db, so a rollback is observable as zero rows.
 */
import { AiTravelPlanRevisions } from '../../../../src/db/entities/AiTravelPlanRevisions.entity';
import { AiTravelPlans } from '../../../../src/db/entities/AiTravelPlans.entity';
import { dbNow } from '../../../../src/db/types';
import { AiTravelPlanModule } from '../../../../src/nest/ai-travel-plan/ai-travel-plan.module';
import { AiTravelPlanService } from '../../../../src/nest/ai-travel-plan/ai-travel-plan.service';
import { PlannerApplyService } from '../../../../src/nest/ai-travel-plan/planner-apply.service';
import { PlannerProvider, type PlannerRouteResult } from '../../../../src/nest/ai-travel-plan/planner-provider';
import {
  TRAVEL_PLAN_ENGINE,
  type TravelPlanEngineResult,
} from '../../../../src/nest/ai-travel-plan/travel-plan-engine';
import { AuditService } from '../../../../src/nest/audit/audit.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { PermissionsService } from '../../../../src/nest/permissions/permissions.service';
import { PlacesService } from '../../../../src/nest/places/places.service';
import { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import { TripAccessService } from '../../../../src/nest/trip-membership/trip-access.service';
import type { User } from '../../../../src/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { findRow } from '../../../helpers/factories/rows';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { FakeRealtimeService } from '../../../helpers/fake-realtime';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import {
  travelPlanCreateRequestSchema,
  travelPlanDraftSchema,
  type TravelPlanCreateRequest,
  type TravelPlanDraftDay,
  type TravelPlanStreamEvent,
  type TravelPlanWarning,
} from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;

const EMPTY_WARNINGS: TravelPlanWarning[] = [
  { code: 'engine_not_configured', message: '尚未配置行程生成引擎。', severity: 'warning' },
];

function emptyResult(warnings: TravelPlanWarning[] = EMPTY_WARNINGS): TravelPlanEngineResult {
  return {
    draft: {
      summary: '',
      factsCheckedAt: dbNow(),
      days: [],
      estimatedBudgetCny: { min: 0, max: 0, breakdown: {} },
      warnings,
    },
    facts: [],
    warnings,
    modelMeta: {
      engine: 'test-engine',
      provider: null,
      model: null,
      promptTokens: null,
      completionTokens: null,
      costCny: null,
    },
  };
}

const engine = {
  id: 'test-engine',
  generate: vi.fn(async (input: { onStage?: (stage: 'places') => void }) => {
    input.onStage?.('places');
    return emptyResult();
  }),
  revise: vi.fn(async () =>
    emptyResult([
      ...EMPTY_WARNINGS,
      { code: 'revision_not_applied', message: '这次修改没有检索到新的真实地点。', severity: 'warning' },
    ]),
  ),
};

/** One draft item: a real provider place, a time window and no price. */
function item(providerId: string, name: string, arriveAt: string, leaveAt: string) {
  return {
    place: { provider: 'amap', providerId, name, lat: 30.2431, lng: 120.1501 },
    arriveAt,
    leaveAt,
    activity: null,
    travelFromPrevious: null,
    estimatedCostCny: null,
    source: { provider: 'amap', sourceId: providerId, checkedAt: dbNow(), freshness: 'live' as const },
  };
}

/**
 * A ready draft with three places over two days. The provider ids are real
 * amap-shaped ids, but nothing here is looked up: this suite tests the write,
 * not the planner.
 */
const appliedDays: TravelPlanDraftDay[] = [
  {
    date: '2026-05-01',
    items: [item('B0FF0001', '西湖', '09:00', '11:30'), item('B0FF0002', '龙井村', '14:00', '16:00')],
  },
  { date: '2026-05-02', items: [item('B0FF0003', '灵隐寺', '09:30', '11:00')] },
];

function dayResult(): TravelPlanEngineResult {
  return {
    ...emptyResult([]),
    draft: {
      summary: '西湖与龙井茶园的三天慢行。',
      factsCheckedAt: dbNow(),
      days: appliedDays,
      estimatedBudgetCny: { min: 0, max: 0, breakdown: {} },
      warnings: [],
    },
  };
}

const audit = { writeAudit: vi.fn(async () => undefined) };
const permissions = { checkPermission: vi.fn(async () => true) };
const tripAccess = { findAccessible: vi.fn(async () => null) };
const realtime = new FakeRealtimeService();
/** The recalculation's only outside call; the route is faked here, the write path is real. */
const plannerProvider = {
  route: vi.fn(async (): Promise<PlannerRouteResult> => ({ ok: true, legs: [] })),
};

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [AiTravelPlanModule],
    overrides: [
      { provide: AuditService, useValue: audit },
      { provide: PermissionsService, useValue: permissions },
      { provide: TripAccessService, useValue: tripAccess },
      { provide: RealtimeService, useValue: realtime },
      { provide: PlannerProvider, useValue: plannerProvider },
      { provide: TRAVEL_PLAN_ENGINE, useValue: engine },
    ],
  });
});

afterAll(async () => {
  await t.close();
  db.close();
});

beforeEach(() => {
  resetTestDb(db);
  vi.clearAllMocks();
  realtime.reset();
  permissions.checkPermission.mockResolvedValue(true);
  tripAccess.findAccessible.mockResolvedValue(null);
});

const service = () => t.get(AiTravelPlanService);
const orm = () => t.get(MikroORM);

/** Rows visible to a fresh connection: what a rollback must leave at zero. */
function count(table: 'trips' | 'days' | 'places' | 'assignments', tripId?: number): number {
  const sql =
    table === 'assignments'
      ? tripId === undefined
        ? 'SELECT COUNT(*) AS n FROM day_assignments'
        : 'SELECT COUNT(*) AS n FROM day_assignments a JOIN days d ON d.id = a.day_id WHERE d.trip_id = ?'
      : tripId === undefined
        ? `SELECT COUNT(*) AS n FROM ${table}`
        : `SELECT COUNT(*) AS n FROM ${table} WHERE trip_id = ?`;
  const row = (tripId === undefined ? db.prepare(sql).get() : db.prepare(sql).get(tripId)) as { n: number };
  return row.n;
}

async function user(): Promise<User> {
  return (await makeUser(orm())).user as unknown as User;
}

function request(overrides: Partial<TravelPlanCreateRequest> = {}): TravelPlanCreateRequest {
  return travelPlanCreateRequestSchema.parse({
    prompt: '三天杭州，想看西湖和龙井茶园，节奏慢一点',
    destination: '杭州',
    startDate: '2026-05-01',
    endDate: '2026-05-03',
    ...overrides,
  });
}

async function refusal(promise: Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return { status: (err as DomainError).getStatus(), body: (err as DomainError).toBody() };
}

describe('create', () => {
  it('PLAN-001: stores the request, revision 1 and an honest empty draft', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    expect(plan).toMatchObject({
      status: 'ready',
      currentRevision: 1,
      targetTripId: null,
      appliedTripId: null,
      revisions: [{ version: 1, reason: null }],
    });
    expect(plan.draft?.days).toEqual([]);
    expect(plan.draft?.estimatedBudgetCny).toEqual({ min: 0, max: 0, breakdown: {} });
    expect(plan.warnings).toEqual([expect.objectContaining({ code: 'engine_not_configured', severity: 'warning' })]);
    expect(plan.request.prompt).toContain('西湖');

    const row = await findRow(orm(), AiTravelPlans, { id: plan.id });
    expect(row).toMatchObject({ status: 'ready', current_revision: 1 });
    const revision = await findRow(orm(), AiTravelPlanRevisions, { plan: plan.id, version: 1 });
    expect(revision?.duration_ms).toBeGreaterThanOrEqual(0);
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: ownerId.id,
        action: 'ai_travel_plan.create',
        resource: `ai_travel_plan:${plan.id}`,
      }),
    );
  });

  it('PLAN-002: a role without trip_create is refused before anything is written', async () => {
    const ownerId = await user();
    permissions.checkPermission.mockResolvedValueOnce(false);

    expect(await refusal(service().create(ownerId, request()))).toEqual({
      status: 403,
      body: { error: '你没有创建行程的权限。', code: 'trip_create_forbidden' },
    });
    expect(await findRow(orm(), AiTravelPlans, { owner: ownerId.id })).toBeNull();
  });
});

describe('read and revise', () => {
  it('PLAN-003: another owner sees 404, never the draft', async () => {
    const ownerId = await user();
    const strangerId = await user();
    const { plan } = await service().create(ownerId, request());

    expect(await refusal(service().get(strangerId, String(plan.id)))).toEqual({
      status: 404,
      body: { error: '行程草案不存在。', code: 'plan_not_found' },
    });
  });

  it('PLAN-004: a revision appends version 2 and points the plan at it', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    const result = await service().createRevision(ownerId, String(plan.id), {
      feedback: '第二天下午留空，不要排太满',
    });

    expect(result.plan.currentRevision).toBe(2);
    expect(result.plan.revisions.map((revision) => revision.version)).toEqual([1, 2]);
    expect(result.revision).toMatchObject({ version: 2, reason: '第二天下午留空，不要排太满' });
    expect(result.plan.warnings.map((warning) => warning.code)).toContain('revision_not_applied');
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ai_travel_plan.revise', details: { planId: plan.id, revision: 2 } }),
    );
  });

  it('PLAN-005: a stale expectedRevision is a 409 and appends nothing', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    expect(
      await refusal(
        service().createRevision(ownerId, String(plan.id), {
          feedback: '换一家酒店',
          expectedRevision: 99,
        }),
      ),
    ).toEqual({
      status: 409,
      body: { error: '草案已更新到第 1 版，请刷新后再提交。', code: 'revision_conflict', currentRevision: 1 },
    });
    expect((await service().get(ownerId, String(plan.id))).plan.currentRevision).toBe(1);
  });
});

describe('discard and expiry', () => {
  it('PLAN-006: discard marks the plan expired and is idempotent', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    const discarded = await service().discard(ownerId, String(plan.id), '计划有变');
    expect(discarded.plan.status).toBe('expired');
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ai_travel_plan.discard', details: { planId: plan.id, reason: '计划有变' } }),
    );

    const again = await service().discard(ownerId, String(plan.id));
    expect(again.plan.status).toBe('expired');
  });

  it('PLAN-007: a ready plan past its TTL reads as expired without a write', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    db.prepare('UPDATE ai_travel_plans SET expires_at = ? WHERE id = ?').run('2000-01-01 00:00:00', plan.id);

    expect((await service().get(ownerId, String(plan.id))).plan.status).toBe('expired');
    expect((await findRow(orm(), AiTravelPlans, { id: plan.id }))?.status).toBe('ready');
  });
});

describe('apply and undo (phase 3 writes the trip)', () => {
  it('PLAN-008: X-Idempotency-Key is required and bounded', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    expect(await refusal(service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, undefined))).toEqual({
      status: 400,
      body: { error: '应用方案必须携带 X-Idempotency-Key 请求头。', code: 'idempotency_key_required' },
    });
    expect(await refusal(service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'x'.repeat(201)))).toEqual({
      status: 400,
      body: { error: 'X-Idempotency-Key 不能超过 200 个字符。', code: 'idempotency_key_too_long' },
    });
  });

  it('PLAN-009: apply writes the trip, its days, places and assignments in one commit', async () => {
    engine.generate.mockResolvedValueOnce(dayResult());
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    const applied = await service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-1');

    expect(applied.tripId).toBeGreaterThan(0);
    expect(applied.plan).toMatchObject({
      status: 'applied',
      appliedTripId: applied.tripId,
      targetTripId: null,
    });
    expect(applied.plan.applyResult).toMatchObject({
      mode: 'new_trip',
      tripId: applied.tripId,
      createdPlaceIds: expect.arrayContaining([expect.any(Number)]),
      createdAssignmentIds: expect.arrayContaining([expect.any(Number)]),
    });
    // The trip's own day generation already made both draft days, so the apply
    // reuses them: `dayIds` names them, `createdDayIds` is honestly empty.
    expect(applied.plan.applyResult?.dayIds).toHaveLength(2);
    expect(applied.plan.applyResult?.createdDayIds).toHaveLength(0);
    expect(applied.plan.applyResult?.createdPlaceIds).toHaveLength(3);
    expect(applied.plan.applyResult?.createdAssignmentIds).toHaveLength(3);

    // The real write: one trip, two days, three places and three assignments.
    expect(count('trips')).toBe(1);
    expect(count('days', applied.tripId)).toBe(2);
    expect(count('places', applied.tripId)).toBe(3);
    expect(count('assignments', applied.tripId)).toBe(3);

    // A provider place keeps its id and the draft's own time window.
    const place = db
      .prepare(
        'SELECT name, amap_poi_id, place_time, end_time, duration_minutes FROM places WHERE trip_id = ? ORDER BY id',
      )
      .get(applied.tripId) as Record<string, unknown>;
    expect(place).toMatchObject({
      name: '西湖',
      amap_poi_id: 'B0FF0001',
      place_time: '09:00',
      end_time: '11:30',
      duration_minutes: 150,
    });

    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ai_travel_plan.apply',
        details: expect.objectContaining({ tripId: applied.tripId }),
      }),
    );
    expect(realtime.broadcastToUserMock).toHaveBeenCalledWith(ownerId.id, { type: 'trips:changed' });
  });

  it('PLAN-009b: a second apply replays the trip and writes nothing again', async () => {
    engine.generate.mockResolvedValueOnce(dayResult());
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    const first = await service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-1');
    const again = await service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-2');

    expect(again.tripId).toBe(first.tripId);
    expect(count('trips')).toBe(1);
    expect(count('places')).toBe(3);
    expect(count('assignments')).toBe(3);
  });

  it('PLAN-009c: an empty draft is refused before anything is written', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    expect(await refusal(service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-1'))).toEqual({
      status: 409,
      body: { error: '草案还没有可写入的行程内容，请先补充或重新生成草案。', code: 'plan_empty_draft' },
    });
    expect(count('trips')).toBe(0);
    expect(await findRow(orm(), AiTravelPlans, { id: plan.id })).toMatchObject({
      status: 'ready',
      applied_trip_id: null,
    });
  });

  it('PLAN-009d: a write that throws rolls back every row and leaves the plan ready', async () => {
    engine.generate.mockResolvedValueOnce(dayResult());
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    const places = t.get(PlacesService);
    const create = places.create.bind(places);
    let calls = 0;
    vi.spyOn(places, 'create').mockImplementation(async (...args) => {
      calls += 1;
      if (calls === 2) throw new Error('db down');
      return create(...args);
    });

    await expect(service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-1')).rejects.toThrow('db down');
    expect(count('trips')).toBe(0);
    expect(count('days')).toBe(0);
    expect(count('places')).toBe(0);
    expect(await findRow(orm(), AiTravelPlans, { id: plan.id })).toMatchObject({
      status: 'ready',
      applied_trip_id: null,
      apply_result_json: null,
    });
    expect(realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('PLAN-009e: an existing trip reuses its day by date, appends a missing one and announces after the commit', async () => {
    engine.generate.mockResolvedValueOnce(dayResult());
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    const trip = await makeTrip(orm(), ownerId.id, { start_date: '2026-05-01', end_date: '2026-05-02' });
    tripAccess.findAccessible.mockResolvedValue({ id: trip.id, user_id: ownerId.id, currency: 'CNY' });

    // Read the committed count at broadcast time: a pre-commit broadcast sees 0.
    const placesAtBroadcast: number[] = [];
    realtime.broadcastMock.mockImplementation(() => placesAtBroadcast.push(count('places', trip.id)));

    const applied = await service().apply(
      ownerId,
      String(plan.id),
      { mode: 'existing_trip', tripId: trip.id },
      'key-1',
    );

    expect(applied.tripId).toBe(trip.id);
    expect(applied.plan).toMatchObject({ status: 'applied', targetTripId: trip.id, appliedTripId: trip.id });
    expect(applied.plan.applyResult?.createdDayIds).toHaveLength(0);
    expect(count('days', trip.id)).toBe(2);
    expect(count('places', trip.id)).toBe(3);
    expect(count('assignments', trip.id)).toBe(3);

    expect(realtime.broadcastMock).toHaveBeenCalledWith(trip.id, 'place:created', expect.any(Object));
    expect(realtime.broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:created', expect.any(Object));
    expect(realtime.broadcastMock.mock.calls.filter((call) => call[1] === 'place:created')).toHaveLength(3);
    expect(placesAtBroadcast.every((seen) => seen === 3)).toBe(true);
  });

  it('PLAN-009f: losing the plan claim rolls the write back and answers the winner trip', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    const winnerTrip = await makeTrip(orm(), ownerId.id);
    // A concurrent apply already claimed the row: the claim this call makes
    // must now affect none, and every row it wrote must roll back.
    db.prepare('UPDATE ai_travel_plans SET status = ?, applied_trip_id = ? WHERE id = ?').run(
      'applied',
      winnerTrip.id,
      plan.id,
    );
    const stale = await orm().em.fork().findOneOrFail(AiTravelPlans, { id: plan.id });

    const applied = await t.get(PlannerApplyService).apply({
      plan: stale,
      user: ownerId,
      body: { mode: 'new_trip' },
      request: request(),
      draft: travelPlanDraftSchema.parse(dayResult().draft),
    });

    expect(applied.tripId).toBe(winnerTrip.id);
    expect(count('trips')).toBe(1);
    expect(count('places')).toBe(0);
    expect(count('assignments')).toBe(0);
    expect(realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('PLAN-010: an expired plan is 410', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    await service().discard(ownerId, String(plan.id));

    expect(await refusal(service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-1'))).toEqual({
      status: 410,
      body: { error: '草案已过期或已放弃，不能应用。', code: 'plan_expired' },
    });
  });

  it('PLAN-011: an inaccessible existing trip is 404, a forbidden edit is 403', async () => {
    const ownerId = await user();
    const otherId = await user();
    const { plan } = await service().create(ownerId, request());
    const body = { mode: 'existing_trip' as const, tripId: 42 };

    expect(await refusal(service().apply(ownerId, String(plan.id), body, 'key-1'))).toEqual({
      status: 404,
      body: { error: '行程不存在或无权访问。', code: 'trip_not_found' },
    });

    tripAccess.findAccessible.mockResolvedValueOnce({ id: 42, user_id: otherId.id, currency: 'CNY' });
    permissions.checkPermission.mockResolvedValueOnce(false);
    expect(await refusal(service().apply(ownerId, String(plan.id), body, 'key-1'))).toEqual({
      status: 403,
      body: { error: '你没有编辑该行程的权限。', code: 'trip_edit_forbidden' },
    });
  });

  it('PLAN-012: an applied plan replays its trip and refuses to be discarded', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    const trip = await makeTrip(orm(), ownerId.id);
    db.prepare('UPDATE ai_travel_plans SET status = ?, applied_trip_id = ? WHERE id = ?').run(
      'applied',
      trip.id,
      plan.id,
    );

    await expect(service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-1')).resolves.toMatchObject({
      tripId: trip.id,
      plan: { status: 'applied', appliedTripId: trip.id },
    });
    expect(await refusal(service().discard(ownerId, String(plan.id)))).toEqual({
      status: 409,
      body: { error: '已应用的草案不能放弃。', code: 'plan_already_applied', status: 'applied' },
    });
  });

  it('PLAN-013: a failed plan cannot be applied, an unknown status reads as failed', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    db.prepare('UPDATE ai_travel_plans SET status = ? WHERE id = ?').run('failed', plan.id);

    expect(await refusal(service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-1'))).toEqual({
      status: 409,
      body: { error: '草案当前状态为 failed，不能应用。', code: 'plan_not_applicable', status: 'failed' },
    });

    db.prepare('UPDATE ai_travel_plans SET status = ? WHERE id = ?').run('not-a-status', plan.id);
    expect((await service().get(ownerId, String(plan.id))).plan.status).toBe('failed');
  });

  it('PLAN-014: a discarded plan cannot be revised', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    await service().discard(ownerId, String(plan.id));

    expect(await refusal(service().createRevision(ownerId, String(plan.id), { feedback: '再改一版' }))).toEqual({
      status: 409,
      body: { error: '草案当前状态为 expired，不能修改。', code: 'plan_not_editable', status: 'expired' },
    });
  });

  it('UNDO-001: undoing a new_trip apply deletes the created trip and returns the plan to ready', async () => {
    engine.generate.mockResolvedValueOnce(dayResult());
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    const applied = await service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-1');

    const undone = await service().undo(ownerId, String(plan.id), '改主意了');

    expect(undone).toMatchObject({
      tripId: applied.tripId,
      tripDeleted: true,
      plan: { status: 'ready', appliedTripId: null, targetTripId: null, applyResult: null },
    });
    expect(count('trips')).toBe(0);
    expect(count('days')).toBe(0);
    expect(count('places')).toBe(0);
    expect(realtime.broadcastMock).toHaveBeenCalledWith(applied.tripId, 'trip:deleted', { id: applied.tripId });
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ai_travel_plan.undo',
        details: expect.objectContaining({ reason: '改主意了' }),
      }),
    );
    // The plan can be applied again after the undo.
    await expect(service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-2')).resolves.toMatchObject({
      plan: { status: 'applied' },
    });
  });

  it('UNDO-002: an existing_trip apply is not auto-undone; the recorded ids name what to remove', async () => {
    engine.generate.mockResolvedValueOnce(dayResult());
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    const trip = await makeTrip(orm(), ownerId.id, { start_date: '2026-05-01', end_date: '2026-05-02' });
    tripAccess.findAccessible.mockResolvedValue({ id: trip.id, user_id: ownerId.id, currency: 'CNY' });
    const applied = await service().apply(
      ownerId,
      String(plan.id),
      { mode: 'existing_trip', tripId: trip.id },
      'key-1',
    );

    const refused = await refusal(service().undo(ownerId, String(plan.id)));

    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'undo_manual_required', tripId: trip.id, dayIds: [] });
    expect(refused.body.placeIds).toHaveLength(3);
    expect(refused.body.assignmentIds).toHaveLength(3);
    // Refusing changed nothing: the trip and the applied plan are untouched.
    expect(count('trips')).toBe(1);
    expect(await findRow(orm(), AiTravelPlans, { id: plan.id })).toMatchObject({
      status: 'applied',
      applied_trip_id: applied.tripId,
    });
  });

  it('UNDO-003: a plan that was never applied cannot be undone', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    expect(await refusal(service().undo(ownerId, String(plan.id)))).toEqual({
      status: 409,
      body: { error: '草案当前状态为 ready，没有可撤销的应用。', code: 'plan_not_applied', status: 'ready' },
    });
  });

  it('UNDO-004: an applied plan with no recorded result refuses instead of guessing', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    const trip = await makeTrip(orm(), ownerId.id);
    db.prepare('UPDATE ai_travel_plans SET status = ?, applied_trip_id = ? WHERE id = ?').run(
      'applied',
      trip.id,
      plan.id,
    );

    expect(await refusal(service().undo(ownerId, String(plan.id)))).toEqual({
      status: 409,
      body: { error: '这次应用没有记录写入的实体，无法自动撤销。', code: 'apply_result_missing' },
    });
    expect(count('trips')).toBe(1);
  });
});

describe('phase 2: planner status and streaming', () => {
  it('PLAN-015: an engine status of draft is persisted and is not applicable', async () => {
    engine.generate.mockResolvedValueOnce({
      ...emptyResult([{ code: 'request_incomplete', message: '请补充出发日期。', severity: 'blocking' }]),
      status: 'draft',
    });
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    expect(plan.status).toBe('draft');
    expect(await findRow(orm(), AiTravelPlans, { id: plan.id })).toMatchObject({ status: 'draft' });
    expect(await refusal(service().apply(ownerId, String(plan.id), { mode: 'new_trip' }, 'key-1'))).toEqual({
      status: 409,
      body: { error: '草案当前状态为 draft，不能应用。', code: 'plan_not_applicable', status: 'draft' },
    });
  });

  it('PLAN-016: streaming reports the plan, each stage, then the persisted done plan', async () => {
    const ownerId = await user();
    const events: TravelPlanStreamEvent[] = [];
    await service().createStreaming(ownerId, request(), (event) => events.push(event));

    expect(events.map((event) => event.type)).toEqual(['plan', 'progress', 'done']);
    const done = events[2];
    expect(done?.type).toBe('done');
    if (done?.type === 'done') {
      expect(done.plan).toMatchObject({ status: 'ready', currentRevision: 1 });
    }
    expect(await findRow(orm(), AiTravelPlans, { owner: ownerId.id })).toMatchObject({
      status: 'ready',
      current_revision: 1,
    });
  });

  it('PLAN-017: an engine that throws leaves a failed plan, never a stuck generating one', async () => {
    engine.generate.mockRejectedValueOnce(new Error('boom'));
    const ownerId = await user();
    const events: TravelPlanStreamEvent[] = [];
    await service().createStreaming(ownerId, request(), (event) => events.push(event));

    expect(events.at(-1)).toMatchObject({ type: 'error', code: 'generation_failed' });
    expect(await findRow(orm(), AiTravelPlans, { owner: ownerId.id })).toMatchObject({ status: 'failed' });
  });
});

describe('recalculate traffic (real roads, same proposal)', () => {
  it('RECALC-001: rewrites the current draft in place — no new revision, no quota charge', async () => {
    engine.generate.mockResolvedValueOnce(dayResult());
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    const before = plan.draft?.days.map((day) => day.items.map((item) => [item.arriveAt, item.leaveAt]));

    plannerProvider.route.mockResolvedValueOnce({
      ok: true,
      legs: [{ mode: 'drive', minutes: 17, distanceMeters: 6400 }],
    });

    const { plan: updated } = await service().recalculate(ownerId, String(plan.id));

    // Only day 1 has two consecutive stops; day 2 has one and never hits the router.
    expect(plannerProvider.route).toHaveBeenCalledTimes(1);
    expect(plannerProvider.route).toHaveBeenCalledWith(
      ownerId.id,
      [
        { lat: 30.2431, lng: 120.1501 },
        { lat: 30.2431, lng: 120.1501 },
      ],
      'other',
    );

    expect(updated.currentRevision).toBe(1);
    expect(updated.revisions).toHaveLength(1);
    expect(updated.draft?.days[0]?.items.map((item) => item.travelFromPrevious)).toEqual([
      null,
      { mode: 'drive', minutes: 17, distanceMeters: 6400 },
    ]);
    expect(updated.draft?.days[1]?.items[0]?.travelFromPrevious).toBeNull();
    // The plan itself is untouched: same days, same clock.
    expect(updated.draft?.days.map((day) => day.items.map((item) => [item.arriveAt, item.leaveAt]))).toEqual(before);

    expect(await findRow(orm(), AiTravelPlanRevisions, { plan: plan.id, version: 2 })).toBeNull();
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ai_travel_plan.recalculate',
        details: { planId: plan.id, revision: 1, days: 1, mode: 'other' },
      }),
    );
  });

  it('RECALC-002: an unavailable router is a 502 and leaves every leg as it was', async () => {
    engine.generate.mockResolvedValueOnce(dayResult());
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    plannerProvider.route.mockResolvedValueOnce({ ok: false });

    expect(await refusal(service().recalculate(ownerId, String(plan.id)))).toEqual({
      status: 502,
      body: { error: '路线服务暂时不可用，请稍后重试。', code: 'route_unavailable', days: ['2026-05-01'] },
    });

    const after = await service().get(ownerId, String(plan.id));
    expect(after.plan.draft?.days[0]?.items[1]?.travelFromPrevious).toBeNull();
    expect(after.plan.currentRevision).toBe(1);
  });

  it('RECALC-003: a non-editable plan is refused before the router is called', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());
    await service().discard(ownerId, String(plan.id));

    expect(await refusal(service().recalculate(ownerId, String(plan.id)))).toEqual({
      status: 409,
      body: { error: '草案当前状态为 expired，不能重算交通。', code: 'plan_not_editable', status: 'expired' },
    });
    expect(plannerProvider.route).not.toHaveBeenCalled();
  });

  it('RECALC-004: a draft without consecutive stops is a 409, never a pointless router call', async () => {
    const ownerId = await user();
    const { plan } = await service().create(ownerId, request());

    expect(await refusal(service().recalculate(ownerId, String(plan.id)))).toEqual({
      status: 409,
      body: { error: '草案还没有可重算的连续地点。', code: 'plan_no_legs' },
    });
    expect(plannerProvider.route).not.toHaveBeenCalled();
  });
});

// The db type is only here to keep the import used in the suite's type space.
