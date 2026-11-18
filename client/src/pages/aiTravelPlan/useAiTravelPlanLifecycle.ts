import type { TravelPlan, TravelPlanUndoResponse } from '@trek/shared';
import {
  briefFromRequest,
  emptyBrief,
  type Translate,
  type TravelBrief,
} from '../../components/AiTravelPlan/aiPlanModel';
import { useToast } from '../../components/shared/Toast';
import { getApiErrorMessage } from '../../types';

interface LifecycleContext {
  t: Translate;
  toast: ReturnType<typeof useToast>;
  plan: TravelPlan | null;
  isBusy: boolean;
  undo: (id: number) => Promise<TravelPlanUndoResponse>;
  discard: (id: number) => Promise<TravelPlan>;
  resetPlan: () => void;
  setError: (message: string | null) => void;
  setFeedback: (feedback: string) => void;
  setBrief: (brief: TravelBrief) => void;
  resetApply: () => void;
  clearUrl: () => void;
  navigate: (path: string) => void;
}

/**
 * What happens to a plan after the proposal itself: undo an apply, discard the
 * draft, open the trip it produced, or go back and rewrite the brief. None of
 * these changes the proposal, so they stay out of the request hook.
 */
export function useAiTravelPlanLifecycle(ctx: LifecycleContext) {
  const {
    t,
    toast,
    plan,
    isBusy,
    undo,
    discard,
    resetPlan,
    setError,
    setFeedback,
    setBrief,
    resetApply,
    clearUrl,
    navigate,
  } = ctx;

  const handleUndo = async () => {
    if (!plan || isBusy) return;
    setError(null);
    try {
      const result = await undo(plan.id);
      toast.success(result.tripDeleted ? t('planner.ai.undone') : t('planner.ai.undoneKeepTrip'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('planner.ai.undoFailed')));
    }
  };

  const handleDiscard = async () => {
    if (!plan || isBusy) return;
    setError(null);
    try {
      await discard(plan.id);
      toast.success(t('planner.ai.discarded'));
    } catch (err) {
      setError(getApiErrorMessage(err, t('planner.ai.discardFailed')));
    }
  };

  const handleOpenTrip = () => {
    if (plan?.appliedTripId) void navigate(`/trips/${plan.appliedTripId}`);
  };

  /** Back to the form with the plan's own brief, ready to be changed and regenerated. */
  const handleEditRequest = () => {
    if (!plan) return;
    setBrief(briefFromRequest(plan.request));
    setError(null);
    setFeedback('');
    resetApply();
    resetPlan();
    clearUrl();
  };

  const handleStartOver = () => {
    setBrief(emptyBrief());
    setError(null);
    setFeedback('');
    resetApply();
    resetPlan();
    clearUrl();
  };

  return { handleUndo, handleDiscard, handleOpenTrip, handleEditRequest, handleStartOver };
}
