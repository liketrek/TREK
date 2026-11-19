/**
 * OPS-01: the planner's rate and cost caps.
 *
 * The engine and the connection resolver are fakes; the quota service, the
 * repositories and the settings reader are the real ones over a migrated test
 * db. Each case writes the app_settings row an admin would write, so the test
 * proves the same "read fresh on every generation" path the product uses.
 */
import { AiTravelPlans } from '../../../../src/db/entities/AiTravelPlans.entity';
import { AssistantUsage } from '../../../../src/db/entities/AssistantUsage.entity';
import { dbNow } from '../../../../src/db/types';
import { AiConnectionsService } from '../../../../src/nest/ai-connections/ai-connections.service';
import { AiTravelPlanModule } from '../../../../src/nest/ai-travel-plan/ai-travel-plan.module';
import { AiTravelPlanService } from '../../../../src/nest/ai-travel-plan/ai-travel-plan.service';
import {
  TRAVEL_PLAN_ENGINE,
  type GenerateTravelPlanInput,
  type TravelPlanEngineResult,
} from '../../../../src/nest/ai-travel-plan/travel-plan-engine';
import { AuditService } from '../../../../src/nest/audit/audit.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { PermissionsService } from '../../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import { TripAccessService } from '../../../../src/nest/trip-membership/trip-access.service';
import type { User } from '../../../../src/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, findRow, insertRow } from '../../../helpers/factories/rows';
import { setAppSetting } from '../../../helpers/factories/settings';
import { makeUser } from '../../../helpers/factories/users';
import { FakeRealtimeService } from '../../../helpers/fake-realtime';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { todayUtc, travelPlanCreateRequestSchema, type TravelPlanCreateRequest } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;

const EMPTY_WARNINGS = [
  { code: 'engine_not_configured', message: '尚未配置行程生成引擎。', severity: 'warning' as const },
];

/** A plan row is enough for these cases; the draft itself is not under test. */
function result(promptTokens = 40, completionTokens = 60): TravelPlanEngineResult {
  return {
    draft: {
      summary: '',
      factsCheckedAt: dbNow(),
      days: [],
      estimatedBudgetCny: { min: 0, max: 0, breakdown: {} },
      warnings: EMPTY_WARNINGS,
    },
    facts: [],
    warnings: EMPTY_WARNINGS,
    modelMeta: {
      engine: 'test-engine',
      provider: 'openai',
      model: 'test-model',
      promptTokens,
      completionTokens,
      costCny: null,
    },
  };
}

const engine = {
  id: 'test-engine',
  generate: vi.fn(async (_input: GenerateTravelPlanInput) => result()),
  revise: vi.fn(async () => result()),
};

/** The resolver only answers who pays; no model call is made by these cases. */
const connections = {
  resolveForUser: vi.fn(async () => ({ paidBy: 'instance' as 'instance' | 'user' })),
};

const audit = { writeAudit: vi.fn(async () => undefined) };
const permissions = { checkPermission: vi.fn(async () => true) };
const tripAccess = { findAccessible: vi.fn(async () => null) };
const realtime = new FakeRealtimeService();

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [AiTravelPlanModule],
    overrides: [
      { provide: AuditService, useValue: audit },
      { provide: PermissionsService, useValue: permissions },
      { provide: TripAccessService, useValue: tripAccess },
      { provide: RealtimeService, useValue: realtime },
      { provide: AiConnectionsService, useValue: connections },
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
  connections.resolveForUser.mockResolvedValue({ paidBy: 'instance' });
});

const service = () => t.get(AiTravelPlanService);
const orm = () => t.get(MikroORM);

async function user(): Promise<User> {
  return (await makeUser(orm())).user as unknown as User;
}

function request(overrides: Partial<TravelPlanCreateRequest> = {}): TravelPlanCreateRequest {
  return travelPlanCreateRequestSchema.parse({
    destination: '杭州',
    startDate: '2026-05-01',
    endDate: '2026-05-03',
    ...overrides,
  });
}

/** Writes the row an admin writes; a later call is the "change takes effect" check. */
function setSetting(key: string, value: string): Promise<void> {
  return setAppSetting(orm(), key, value);
}

function seedUsage(
  userId: number,
  paidBy: 'instance' | 'user',
  inputTokens: number,
  outputTokens = 0,
): Promise<unknown> {
  return insertRow(orm(), AssistantUsage, {
    user: userId,
    day: todayUtc(),
    paid_by: paidBy,
    turns: 0,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
}

async function usageRow(userId: number): Promise<Record<string, unknown> | null> {
  return findRow(orm(), AssistantUsage, { user: userId, day: todayUtc(), paid_by: 'instance' });
}

async function refusal(promise: Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return { status: (err as DomainError).getStatus(), body: (err as DomainError).toBody() };
}

describe('OPS-01 generation cap', () => {
  it('OPS01-001: refuses the generation after the daily cap, before the engine runs', async () => {
    await setSetting('ai_planner_daily_generations', '1');
    const owner = await user();

    const first = await service().create(owner, request());
    expect(first.quota).toEqual({ used: 1, limit: 1 });

    const refused = await refusal(service().create(owner, request()));
    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ code: 'daily_limit', used: 1, limit: 1 });
    expect(engine.generate).toHaveBeenCalledTimes(1);
  });

  it('OPS01-002: one user reaching the cap does not refuse another user', async () => {
    await setSetting('ai_planner_daily_generations', '1');
    const first = await user();
    const second = await user();

    await service().create(first, request());
    const other = await service().create(second, request());

    expect(other.quota).toEqual({ used: 1, limit: 1 });
  });

  it('OPS01-003: an admin raising the cap applies to the next generation', async () => {
    await setSetting('ai_planner_daily_generations', '1');
    const owner = await user();

    await service().create(owner, request());
    await setSetting('ai_planner_daily_generations', '2');
    const second = await service().create(owner, request());

    expect(second.quota).toEqual({ used: 2, limit: 2 });
  });

  it('OPS01-004: a revision spends a generation; the next one is refused', async () => {
    await setSetting('ai_planner_daily_generations', '1');
    const owner = await user();
    const { plan } = await service().create(owner, request());

    const refused = await refusal(service().createRevision(owner, String(plan.id), { feedback: '再慢一点' }));
    expect(refused.status).toBe(429);
    expect(refused.body).toMatchObject({ code: 'daily_limit' });
    expect(engine.revise).not.toHaveBeenCalled();
  });

  it('OPS01-005: the streaming route refuses before creating a plan row', async () => {
    await setSetting('ai_planner_daily_generations', '1');
    const owner = await user();
    await service().create(owner, request());

    const refused = await refusal(service().createStreaming(owner, request(), () => undefined));
    expect(refused.status).toBe(429);
    expect(await countRows(orm(), AiTravelPlans)).toBe(1);
  });
});

describe('OPS-01 token caps', () => {
  it('OPS01-010: a user over the daily token cap keeps the plan but skips the model', async () => {
    await setSetting('ai_planner_daily_tokens', '100');
    const owner = await user();
    await seedUsage(owner.id, 'instance', 100);

    await service().create(owner, request());

    expect(engine.generate).toHaveBeenCalledWith(expect.objectContaining({ allowModel: false }));
  });

  it('OPS01-011: the instance daily cap counts every user, so another user is degraded too', async () => {
    await setSetting('ai_planner_instance_daily_tokens', '100');
    const spender = await user();
    const other = await user();
    await seedUsage(spender.id, 'instance', 100);

    await service().create(other, request());

    expect(engine.generate).toHaveBeenCalledWith(expect.objectContaining({ allowModel: false }));
  });

  it('OPS01-012: the instance monthly cap degrades the model for the rest of the month', async () => {
    await setSetting('ai_planner_instance_monthly_tokens', '100');
    const owner = await user();
    await seedUsage(owner.id, 'instance', 100);

    await service().create(owner, request());

    expect(engine.generate).toHaveBeenCalledWith(expect.objectContaining({ allowModel: false }));
  });

  it('OPS01-013: a user-paid connection never spends the instance token budget', async () => {
    await setSetting('ai_planner_daily_tokens', '100');
    await setSetting('ai_planner_instance_daily_tokens', '100');
    await setSetting('ai_planner_instance_monthly_tokens', '100');
    const owner = await user();
    await seedUsage(owner.id, 'user', 1_000);
    connections.resolveForUser.mockResolvedValue({ paidBy: 'user' });

    await service().create(owner, request());

    expect(engine.generate).toHaveBeenCalledWith(expect.objectContaining({ allowModel: true }));
  });

  it('OPS01-014: the model tokens are booked on the payer the resolver reported', async () => {
    const owner = await user();

    await service().create(owner, request());

    expect(await usageRow(owner.id)).toMatchObject({ input_tokens: 40, output_tokens: 60, turns: 0 });
  });
});

describe('OPS-01 quota view', () => {
  it('OPS01-020: the create response carries today’s usage against the cap', async () => {
    await setSetting('ai_planner_daily_generations', '5');
    const owner = await user();

    const response = await service().create(owner, request());

    expect(response.quota).toEqual({ used: 1, limit: 5 });
  });

  it('OPS01-021: a cap of zero turns the quota off', async () => {
    await setSetting('ai_planner_daily_generations', '0');
    const owner = await user();

    const response = await service().create(owner, request());

    expect(response.quota).toBeNull();
  });
});

describe('OPS-01 generation counting', () => {
  it('OPS01-030: a failed streaming create still counts as a generation', async () => {
    engine.generate.mockRejectedValueOnce(new Error('boom'));
    await setSetting('ai_planner_daily_generations', '2');
    const owner = await user();

    await service().createStreaming(owner, request(), () => undefined);
    const response = await service().create(owner, request());

    expect(response.quota).toEqual({ used: 2, limit: 2 });
  });
});
