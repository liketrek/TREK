import type {
  TravelPlan,
  TravelPlanApplyRequest,
  TravelPlanApplyResponse,
  TravelPlanCreateRequest,
  TravelPlanRevisionRequest,
} from '@trek/shared';
import { useEffect, useRef } from 'react';
import {
  briefToCreateRequest,
  validateBrief,
  type Translate,
  type TravelBrief,
} from '../../components/AiTravelPlan/aiPlanModel';
import { useToast } from '../../components/shared/Toast';
import { getApiErrorMessage } from '../../types';
import { randomId } from '../../utils/randomId';

type ApplyMode = 'new_trip' | 'existing_trip';

interface RequestContext {
  t: Translate;
  toast: ReturnType<typeof useToast>;
  plan: TravelPlan | null;
  isBusy: boolean;
  canApply: boolean;
  brief: TravelBrief;
  feedback: string;
  applyMode: ApplyMode;
  applyTripId: string;
  applyTitle: string;
  create: (request: TravelPlanCreateRequest) => Promise<TravelPlan>;
  revise: (id: number, request: TravelPlanRevisionRequest) => Promise<TravelPlan>;
  recalculate: (id: number) => Promise<TravelPlan>;
  apply: (id: number, request: TravelPlanApplyRequest, idempotencyKey: string) => Promise<TravelPlanApplyResponse>;
  setError: (message: string | null) => void;
  setFeedback: (feedback: string) => void;
  onCreated: (plan: TravelPlan) => void;
}

/**
 * The three calls that change the proposal: create, revise and apply.
 *
 * They are kept apart from the page's own state because each is a single
 * request with its own validation and its own message; the hook only decides
 * when to run one. The apply key lives here, next to the call it protects.
 */
export function useAiTravelPlanRequests(ctx: RequestContext) {
  const {
    t,
    toast,
    plan,
    isBusy,
    canApply,
    brief,
    feedback,
    applyMode,
    applyTripId,
    applyTitle,
    create,
    revise,
    recalculate,
    apply,
    setError,
    setFeedback,
    onCreated,
  } = ctx;

  // One key per apply attempt: a retried click after a lost response replays the
  // same apply instead of writing the draft into the trip twice. Cleared once
  // the server confirms — or when the draft under it changes.
  const applyKeyRef = useRef<string | null>(null);
  useEffect(() => {
    applyKeyRef.current = null;
  }, [plan?.id, plan?.currentRevision]);

  const handleCreate = async () => {
    if (isBusy) return;
    const message = validateBrief(brief, t);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    try {
      const created = await create(briefToCreateRequest(brief));
      onCreated(created);
      setFeedback('');
      toast.success(t('planner.ai.created'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('planner.ai.createFailed')));
    }
  };

  const handleRevise = async () => {
    if (!plan || isBusy) return;
    const text = feedback.trim();
    if (!text) {
      setError(t('planner.ai.feedbackRequired'));
      return;
    }
    setError(null);
    try {
      await revise(plan.id, {
        feedback: text,
        expectedRevision: plan.currentRevision > 0 ? plan.currentRevision : undefined,
      });
      setFeedback('');
      toast.success(t('planner.ai.revised'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('planner.ai.reviseFailed')));
    }
  };

  /**
   * Rewrites the travel legs of the same proposal from the real road network.
   * The server keeps every day and time window; only the legs change.
   */
  const handleRecalculate = async () => {
    if (!plan || isBusy) return;
    setError(null);
    try {
      await recalculate(plan.id);
      toast.success(t('planner.ai.recalculated'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('planner.ai.recalculateFailed')));
    }
  };

  const handleApply = async () => {
    if (!plan || isBusy) return;
    if (!canApply) {
      setError(t('planner.ai.blockingCannotApply'));
      return;
    }
    let request: TravelPlanApplyRequest;
    if (applyMode === 'new_trip') {
      request = { mode: 'new_trip' };
      const title = applyTitle.trim();
      if (title) request.title = title;
    } else {
      const tripId = Number(applyTripId);
      if (!Number.isInteger(tripId) || tripId <= 0) {
        setError(t('planner.ai.selectTripRequired'));
        return;
      }
      request = { mode: 'existing_trip', tripId };
    }
    setError(null);
    if (!applyKeyRef.current) applyKeyRef.current = randomId();
    try {
      await apply(plan.id, request, applyKeyRef.current);
      applyKeyRef.current = null;
      toast.success(t('planner.ai.applied'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('planner.ai.applyFailed')));
    }
  };

  return { handleCreate, handleRevise, handleRecalculate, handleApply };
}
