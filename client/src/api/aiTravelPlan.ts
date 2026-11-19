import type {
  TravelPlanApplyRequest,
  TravelPlanApplyResponse,
  TravelPlanCreateRequest,
  TravelPlanDiscardRequest,
  TravelPlanDiscardResponse,
  TravelPlanResponse,
  TravelPlanRevisionRequest,
  TravelPlanRevisionResponse,
  TravelPlanUndoRequest,
  TravelPlanUndoResponse,
} from '@trek/shared';
import apiClient from './client';

/**
 * Creating or revising a plan is a model call, not a CRUD write: the shared
 * axios instance carries `timeout: 8000`, which would abort every generation
 * long before the planner answers. These two get a finite ceiling of their own
 * — long enough for a full generation, still short enough that a dead
 * connection fails instead of hanging forever. Reads and applies keep the
 * shared timeout; they are ordinary writes.
 */
const GENERATION_TIMEOUT_MS = 180_000;

/** Route recalculation asks each day's legs from the relay, which budgets 15 s per day. */
const RECALCULATE_TIMEOUT_MS = 60_000;

/**
 * AI travel plans (China MVP).
 *
 * Every type comes from the shared contract, so a server-side change the
 * client has not caught up with is a typecheck failure rather than a runtime
 * surprise. The paths and envelopes are also the contract a future
 * Java/Spring AI service keeps if it takes over `/api/ai-travel-plans`: the
 * client must not need to know which process answered.
 *
 * Nothing here writes a trip. `apply` is the only call that can, and the
 * server requires an explicit `X-Idempotency-Key` for it.
 */
export const aiTravelPlanApi = {
  /** Creates the plan and generates revision 1. */
  create: (data: TravelPlanCreateRequest): Promise<TravelPlanResponse> =>
    apiClient.post('/ai-travel-plans', data, { timeout: GENERATION_TIMEOUT_MS }).then((r) => r.data),

  /** The plan, its current draft and its revision history. */
  get: (id: number): Promise<TravelPlanResponse> => apiClient.get(`/ai-travel-plans/${id}`).then((r) => r.data),

  /** Appends a revision; `expectedRevision` makes a stale client a 409. */
  revise: (id: number, data: TravelPlanRevisionRequest): Promise<TravelPlanRevisionResponse> =>
    apiClient.post(`/ai-travel-plans/${id}/revisions`, data, { timeout: GENERATION_TIMEOUT_MS }).then((r) => r.data),

  /**
   * Refreshes the current draft's traffic legs from the real road network.
   * No model call, no new revision, no quota charge — the same proposal with
   * checked travel times.
   */
  recalculate: (id: number): Promise<TravelPlanResponse> =>
    apiClient
      .post(`/ai-travel-plans/${id}/recalculate`, undefined, { timeout: RECALCULATE_TIMEOUT_MS })
      .then((r) => r.data),

  /**
   * Applies the current draft into a new or existing trip.
   *
   * The key is required, not optional: the server refuses without it, and a
   * repeated key must replay the same apply instead of writing twice.
   */
  apply: (id: number, data: TravelPlanApplyRequest, idempotencyKey: string): Promise<TravelPlanApplyResponse> =>
    apiClient
      .post(`/ai-travel-plans/${id}/apply`, data, { headers: { 'X-Idempotency-Key': idempotencyKey } })
      .then((r) => r.data),

  /**
   * Reverts a `new_trip` apply by deleting the trip it created. An apply into
   * an existing trip answers 409 `undo_manual_required` instead of guessing;
   * the recorded ids in `plan.applyResult` name what a person must remove.
   */
  undo: (id: number, data: TravelPlanUndoRequest = {}): Promise<TravelPlanUndoResponse> =>
    apiClient.post(`/ai-travel-plans/${id}/undo`, data).then((r) => r.data),

  /** Marks the plan expired; idempotent on a plan that already is. */
  discard: (id: number, data: TravelPlanDiscardRequest = {}): Promise<TravelPlanDiscardResponse> =>
    apiClient.post(`/ai-travel-plans/${id}/discard`, data).then((r) => r.data),
};
