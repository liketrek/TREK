import type { TravelPlan, TravelPlanApplyResponse, TravelPlanResponse, TravelPlanUndoResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiTravelPlanApi } from '../../../src/api/aiTravelPlan';
import { useAiTravelPlanStore } from '../../../src/store/aiTravelPlanStore';

vi.mock('../../../src/api/aiTravelPlan', () => ({
  aiTravelPlanApi: {
    create: vi.fn(),
    get: vi.fn(),
    revise: vi.fn(),
    apply: vi.fn(),
    undo: vi.fn(),
    discard: vi.fn(),
  },
}));

function plan(overrides: Partial<TravelPlan> = {}): TravelPlan {
  return {
    id: 7,
    status: 'ready',
    request: {
      travelers: { adults: 1, children: 0, seniors: 0 },
      pace: 'balanced',
      interests: [],
      transport: 'public_transit',
      constraints: [],
    },
    currentRevision: 1,
    targetTripId: null,
    appliedTripId: null,
    applyResult: null,
    expiresAt: null,
    createdAt: null,
    updatedAt: null,
    draft: null,
    warnings: [],
    revisions: [],
    ...overrides,
  };
}

const createRequest = {
  destination: '重庆',
  travelers: { adults: 1, children: 0, seniors: 0 },
  pace: 'balanced' as const,
  transport: 'public_transit' as const,
  interests: [],
  constraints: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  useAiTravelPlanStore.getState().reset();
});

describe('aiTravelPlanStore', () => {
  it('FE-AI-STORE-001: create marks the request in flight, stores the plan and clears pending', async () => {
    const created = plan();
    let resolveCreate: (value: TravelPlanResponse) => void = () => {};
    vi.mocked(aiTravelPlanApi.create).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      })
    );

    const promise = useAiTravelPlanStore.getState().create(createRequest);
    expect(useAiTravelPlanStore.getState().pending).toBe('creating');

    resolveCreate({ plan: created });

    await expect(promise).resolves.toBe(created);
    expect(useAiTravelPlanStore.getState().plan).toBe(created);
    expect(useAiTravelPlanStore.getState().pending).toBeNull();
  });

  it('FE-AI-STORE-002: a failed create clears pending and keeps the previous plan', async () => {
    const previous = plan({ id: 3 });
    useAiTravelPlanStore.setState({ plan: previous });
    vi.mocked(aiTravelPlanApi.create).mockRejectedValue(new Error('engine unavailable'));

    await expect(useAiTravelPlanStore.getState().create(createRequest)).rejects.toThrow('engine unavailable');

    expect(useAiTravelPlanStore.getState().plan).toBe(previous);
    expect(useAiTravelPlanStore.getState().pending).toBeNull();
  });

  it('FE-AI-STORE-003: load restores a plan from its id', async () => {
    const loaded = plan({ id: 11 });
    vi.mocked(aiTravelPlanApi.get).mockResolvedValue({ plan: loaded });

    await expect(useAiTravelPlanStore.getState().load(11)).resolves.toBe(loaded);

    expect(aiTravelPlanApi.get).toHaveBeenCalledWith(11);
    expect(useAiTravelPlanStore.getState().plan).toBe(loaded);
  });

  it('FE-AI-STORE-004: revise replaces the stored plan with the new revision', async () => {
    const revised = plan({ currentRevision: 2 });
    vi.mocked(aiTravelPlanApi.revise).mockResolvedValue({
      plan: revised,
      revision: {
        version: 2,
        reason: 'less walking',
        draft: revised.draft ?? {
          summary: '',
          factsCheckedAt: null,
          days: [],
          estimatedBudgetCny: { min: 0, max: 0, breakdown: {}, breakdownMax: {}, assumptions: [] },
          lodgingAreas: [],
          warnings: [],
        },
        facts: [],
        warnings: [],
        modelMeta: {
          engine: 'test',
          provider: null,
          model: null,
          promptTokens: null,
          completionTokens: null,
          costCny: null,
        },
        durationMs: null,
        createdAt: null,
      },
    });

    await expect(useAiTravelPlanStore.getState().revise(7, { feedback: 'less walking' })).resolves.toBe(revised);

    expect(aiTravelPlanApi.revise).toHaveBeenCalledWith(7, { feedback: 'less walking' });
    expect(useAiTravelPlanStore.getState().plan).toBe(revised);
  });

  it('FE-AI-STORE-005: apply passes the idempotency key and stores the applied plan', async () => {
    const applied = plan({ status: 'applied', appliedTripId: 42 });
    const response: TravelPlanApplyResponse = { plan: applied, tripId: 42 };
    vi.mocked(aiTravelPlanApi.apply).mockResolvedValue(response);

    await expect(useAiTravelPlanStore.getState().apply(7, { mode: 'new_trip' }, 'key-1')).resolves.toBe(response);

    expect(aiTravelPlanApi.apply).toHaveBeenCalledWith(7, { mode: 'new_trip' }, 'key-1');
    expect(useAiTravelPlanStore.getState().plan).toBe(applied);
    expect(useAiTravelPlanStore.getState().pending).toBeNull();
  });

  it('FE-AI-STORE-006: undo sends an empty body by default and stores the reverted plan', async () => {
    const reverted = plan({ status: 'ready', appliedTripId: null });
    const response: TravelPlanUndoResponse = { plan: reverted, tripId: 42, tripDeleted: true };
    vi.mocked(aiTravelPlanApi.undo).mockResolvedValue(response);

    await expect(useAiTravelPlanStore.getState().undo(7)).resolves.toBe(response);

    expect(aiTravelPlanApi.undo).toHaveBeenCalledWith(7, {});
    expect(useAiTravelPlanStore.getState().plan).toBe(reverted);
  });

  it('FE-AI-STORE-007: discard sends an empty body by default and stores the expired plan', async () => {
    const expired = plan({ status: 'expired' });
    vi.mocked(aiTravelPlanApi.discard).mockResolvedValue({ plan: expired });

    await expect(useAiTravelPlanStore.getState().discard(7)).resolves.toBe(expired);

    expect(aiTravelPlanApi.discard).toHaveBeenCalledWith(7, {});
    expect(useAiTravelPlanStore.getState().plan).toBe(expired);
  });

  it('FE-AI-STORE-008: reset drops the plan and any pending request', () => {
    useAiTravelPlanStore.setState({ plan: plan(), pending: 'applying' });

    useAiTravelPlanStore.getState().reset();

    expect(useAiTravelPlanStore.getState().plan).toBeNull();
    expect(useAiTravelPlanStore.getState().pending).toBeNull();
  });
});
