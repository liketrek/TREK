/**
 * OPS-02: one generation writes one chain.
 *
 * The engine, the connection resolver and the audit sink are fakes; the
 * service, the quota service, the repositories and the settings reader are the
 * real ones over a migrated test db. The logger is mocked so each case reads
 * the exact lines the product writes and can assert what is not in them: the
 * traveller's sentence, the destination and the revision feedback must never
 * appear, in any line, on either the JSON or the streaming route.
 */
import { dbNow } from '../../../../src/db/types';
import { AiConnectionsService } from '../../../../src/nest/ai-connections/ai-connections.service';
import { AiTravelPlanModule } from '../../../../src/nest/ai-travel-plan/ai-travel-plan.module';
import { AiTravelPlanService } from '../../../../src/nest/ai-travel-plan/ai-travel-plan.service';
import {
  TRAVEL_PLAN_ENGINE,
  type GenerateTravelPlanInput,
  type ReviseTravelPlanInput,
  type TravelPlanEngineResult,
} from '../../../../src/nest/ai-travel-plan/travel-plan-engine';
import { logInfo, logWarn } from '../../../../src/nest/audit/audit-log.logger';
import { AuditService } from '../../../../src/nest/audit/audit.service';
import { PermissionsService } from '../../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import { TripAccessService } from '../../../../src/nest/trip-membership/trip-access.service';
import type { User } from '../../../../src/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeUser } from '../../../helpers/factories/users';
import { FakeRealtimeService } from '../../../helpers/fake-realtime';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { travelPlanCreateRequestSchema, type TravelPlanCreateRequest, type TravelPlanStreamEvent } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
}));

const db = createSnapshotTestDb();
let t: TestModule;

const info = logInfo as unknown as Mock;
const warn = logWarn as unknown as Mock;

const WARNINGS = [{ code: 'engine_not_configured', message: '尚未配置行程生成引擎。', severity: 'warning' as const }];

function result(status?: 'ready' | 'failed'): TravelPlanEngineResult {
  return {
    draft: {
      summary: '',
      factsCheckedAt: dbNow(),
      days: [],
      estimatedBudgetCny: { min: 0, max: 0, breakdown: {} },
      warnings: WARNINGS,
    },
    facts: [],
    warnings: WARNINGS,
    modelMeta: {
      engine: 'test-engine',
      provider: 'openai',
      model: 'test-model',
      promptTokens: 40,
      completionTokens: 60,
      costCny: null,
    },
    ...(status ? { status } : {}),
  };
}

/** The stages a real engine reports; the log lines must follow them. */
const engine = {
  id: 'test-engine',
  generate: vi.fn(async (input: GenerateTravelPlanInput) => {
    input.onStage?.('parsing');
    input.onStage?.('places');
    return result();
  }),
  revise: vi.fn(async (input: ReviseTravelPlanInput) => {
    input.onStage?.('parsing');
    return result();
  }),
};

/** No connection: OPS-01's policy degrades to "structured fields only", which is not under test here. */
const connections = {
  resolveForUser: vi.fn(async () => {
    throw new Error('not connected');
  }),
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

/** A traveller sentence that names a precise place and who is coming along. */
const PROMPT = '带两岁女儿去杭州，住西湖边';

function allLines(): string[] {
  return [...info.mock.calls, ...warn.mock.calls].map((call) => String(call[0]));
}

function expectLine(sink: Mock, pattern: RegExp): void {
  const lines = sink.mock.calls.map((call) => String(call[0]));
  const found = lines.find((line) => pattern.test(line));
  if (!found) throw new Error(`no log line matches ${pattern}; got:\n${lines.join('\n')}`);
}

describe('OPS-02 the JSON create chain', () => {
  it('OPS02-001: writes started, each stage, finished and persisted — the closing line names the plan', async () => {
    const owner = await user();
    const response = await service().create(owner, request({ prompt: PROMPT }));
    const planId = response.plan.id;

    expectLine(info, /^\[ai-travel-plan\] event=generation_started revision=1 mode=create allowModel=true$/);
    expectLine(info, /^\[ai-travel-plan\] event=stage revision=1 mode=create stage=parsing durationMs=\d+$/);
    expectLine(info, /^\[ai-travel-plan\] event=stage revision=1 mode=create stage=places durationMs=\d+$/);
    expectLine(
      info,
      /^\[ai-travel-plan\] event=generation_finished revision=1 mode=create provider=openai model=test-model promptTokens=40 completionTokens=60 durationMs=\d+ outcome=ready warnings=engine_not_configured$/,
    );
    expectLine(
      info,
      new RegExp(
        `^\\[ai-travel-plan\\] event=revision_persisted planId=${planId} revision=1 mode=create durationMs=\\d+ outcome=ready$`,
      ),
    );
  });

  it('OPS02-002: never writes the traveller sentence, the destination or a warning message to any line', async () => {
    const owner = await user();
    await service().create(owner, request({ prompt: PROMPT, origin: '上海' }));

    const text = allLines().join('\n');
    expect(text).not.toContain('两岁');
    expect(text).not.toContain('西湖');
    expect(text).not.toContain('杭州');
    expect(text).not.toContain('上海');
    expect(text).not.toContain('尚未配置');
    // The id, tokens and warning code that make the line useful are still there.
    expect(text).toContain('promptTokens=40');
    expect(text).toContain('warnings=engine_not_configured');
  });

  it('OPS02-003: a failed draft closes with a warn line and outcome=failed', async () => {
    engine.generate.mockResolvedValueOnce(result('failed'));
    const owner = await user();

    await service().create(owner, request({ prompt: PROMPT }));

    expectLine(warn, /^\[ai-travel-plan\] event=generation_finished revision=1 mode=create .* outcome=failed /);
  });

  it('OPS02-004: an engine throw is a warn line naming the error class only, and still propagates', async () => {
    engine.generate.mockRejectedValueOnce(new Error(`provider said: ${PROMPT}`));
    const owner = await user();

    await expect(service().create(owner, request({ prompt: PROMPT }))).rejects.toThrow('provider said');

    expectLine(
      warn,
      /^\[ai-travel-plan\] event=generation_failed revision=1 mode=create durationMs=\d+ outcome=error error=Error$/,
    );
    expect(allLines().join('\n')).not.toContain('两岁');
  });
});

describe('OPS-02 the streaming chain', () => {
  it('OPS02-010: carries the planId from the first line, through every stage, to the persisted revision', async () => {
    const owner = await user();
    const events: TravelPlanStreamEvent[] = [];

    await service().createStreaming(owner, request({ prompt: PROMPT }), (event) => events.push(event));

    const planEvent = events.find((event) => event.type === 'plan');
    const planId = planEvent && planEvent.type === 'plan' ? planEvent.plan.id : 0;
    expect(planId).toBeGreaterThan(0);

    expectLine(info, new RegExp(`event=generation_started planId=${planId} revision=1 mode=stream allowModel=true$`));
    expectLine(info, new RegExp(`event=stage planId=${planId} revision=1 mode=stream stage=parsing durationMs=\\d+$`));
    expectLine(info, new RegExp(`event=stage planId=${planId} revision=1 mode=stream stage=places durationMs=\\d+$`));
    expectLine(info, new RegExp(`event=generation_finished planId=${planId} revision=1 mode=stream .* outcome=ready `));
    expectLine(
      info,
      new RegExp(`event=revision_persisted planId=${planId} revision=1 mode=stream durationMs=\\d+ outcome=ready$`),
    );
    expect(allLines().join('\n')).not.toContain('两岁');
  });

  it('OPS02-011: an engine failure is a warn line with the planId, and the row is marked failed', async () => {
    engine.generate.mockRejectedValueOnce(new Error(`provider said: ${PROMPT}`));
    const owner = await user();
    const events: TravelPlanStreamEvent[] = [];

    await service().createStreaming(owner, request({ prompt: PROMPT }), (event) => events.push(event));

    const planEvent = events.find((event) => event.type === 'plan');
    const planId = planEvent && planEvent.type === 'plan' ? planEvent.plan.id : 0;
    expectLine(
      warn,
      new RegExp(
        `^\\[ai-travel-plan\\] event=generation_failed planId=${planId} revision=1 mode=stream durationMs=\\d+ outcome=error error=Error$`,
      ),
    );
    expect(events.some((event) => event.type === 'error')).toBe(true);
    expect(allLines().join('\n')).not.toContain('两岁');
  });
});

describe('OPS-02 the revision chain', () => {
  it('OPS02-020: a revision logs revision=2 mode=revise, with the model-call ids threaded through', async () => {
    const owner = await user();
    const created = await service().create(owner, request({ prompt: PROMPT }));
    vi.clearAllMocks();

    await service().createRevision(owner, String(created.plan.id), { feedback: '把西湖换成室内博物馆' });

    expect(engine.revise).toHaveBeenCalledWith(
      expect.objectContaining({ trace: { planId: created.plan.id, revision: 2 } }),
    );
    expectLine(
      info,
      new RegExp(
        `^\\[ai-travel-plan\\] event=generation_started planId=${created.plan.id} revision=2 mode=revise allowModel=true$`,
      ),
    );
    expectLine(
      info,
      new RegExp(`^\\[ai-travel-plan\\] event=stage planId=${created.plan.id} revision=2 mode=revise stage=parsing `),
    );
    expectLine(
      info,
      new RegExp(
        `event=revision_persisted planId=${created.plan.id} revision=2 mode=revise durationMs=\\d+ outcome=ready$`,
      ),
    );
    expect(allLines().join('\n')).not.toContain('室内');
  });
});
