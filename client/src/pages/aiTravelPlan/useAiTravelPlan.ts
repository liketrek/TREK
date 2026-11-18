import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { countDraftPlaces, emptyBrief, type TravelBrief } from '../../components/AiTravelPlan/aiPlanModel';
import { useToast } from '../../components/shared/Toast';
import { useTranslation } from '../../i18n';
import { tripRepo } from '../../repo/tripRepo';
import { useAiTravelPlanStore } from '../../store/aiTravelPlanStore';
import type { Trip } from '../../types';
import { useAiTravelPlanLifecycle } from './useAiTravelPlanLifecycle';
import { useAiTravelPlanRequests } from './useAiTravelPlanRequests';

/**
 * Everything the AI plan page does, outside JSX.
 *
 * The hook owns the brief being edited and the apply card's choices; the plan
 * itself lives in `aiTravelPlanStore`, because it is the one piece a reload
 * must find again (`?plan=<id>`) and because the create/revise/apply calls are
 * deliberately not part of the offline mutation queue.
 */
export function useAiTravelPlan() {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const plan = useAiTravelPlanStore((s) => s.plan);
  const pending = useAiTravelPlanStore((s) => s.pending);
  const create = useAiTravelPlanStore((s) => s.create);
  const load = useAiTravelPlanStore((s) => s.load);
  const revise = useAiTravelPlanStore((s) => s.revise);
  const apply = useAiTravelPlanStore((s) => s.apply);
  const undo = useAiTravelPlanStore((s) => s.undo);
  const discard = useAiTravelPlanStore((s) => s.discard);
  const resetPlan = useAiTravelPlanStore((s) => s.reset);

  const [brief, setBrief] = useState<TravelBrief>(emptyBrief);
  const [feedback, setFeedback] = useState('');
  const [applyMode, setApplyMode] = useState<'new_trip' | 'existing_trip'>('new_trip');
  const [applyTripId, setApplyTripId] = useState<string | null>(null);
  const [applyTitle, setApplyTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trips = useTripChoices();

  // A reload keeps only the id in the URL; the draft itself is the server's.
  const urlPlanId = Number(searchParams.get('plan'));
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    if (!Number.isInteger(urlPlanId) || urlPlanId <= 0) return;
    restoredRef.current = true;
    if (plan?.id === urlPlanId) return;
    load(urlPlanId).catch(() => toast.error(t('planner.ai.loadFailed')));
  }, [urlPlanId, plan?.id, load, toast, t]);

  const draft = plan?.draft ?? null;
  const blocking = plan?.warnings.some((warning) => warning.severity === 'blocking') ?? false;
  const canApply = plan?.status === 'ready' && !blocking;
  const isBusy = pending !== null;
  const placeCount = countDraftPlaces(draft);
  const dayCount = draft?.days.length ?? 0;
  const applyTripIdValue = applyTripId ?? (plan?.targetTripId ? String(plan.targetTripId) : '');
  const applyTitleValue = applyTitle ?? plan?.request.destination ?? '';

  const tripOptions = useMemo(() => trips.map((trip) => ({ id: trip.id, title: trip.title })), [trips]);
  const updateBrief = (patch: Partial<TravelBrief>) => {
    setBrief((current) => ({ ...current, ...patch }));
  };

  const clearUrl = () => setSearchParams({}, { replace: true });
  const resetApply = () => {
    setApplyMode('new_trip');
    setApplyTripId(null);
    setApplyTitle(null);
  };

  const requests = useAiTravelPlanRequests({
    t,
    toast,
    plan,
    isBusy,
    canApply,
    brief,
    feedback,
    applyMode,
    applyTripId: applyTripIdValue,
    applyTitle: applyTitleValue,
    create,
    revise,
    apply,
    setError,
    setFeedback,
    onCreated: (created) => {
      setSearchParams({ plan: String(created.id) }, { replace: true });
      resetApply();
    },
  });

  const lifecycle = useAiTravelPlanLifecycle({
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
    navigate: (path) => {
      void navigate(path);
    },
  });

  return {
    t,
    locale,
    brief,
    updateBrief,
    plan,
    draft,
    pending,
    isBusy,
    error,
    blocking,
    canApply,
    placeCount,
    dayCount,
    tripOptions,
    feedback,
    setFeedback,
    applyMode,
    setApplyMode,
    applyTripId: applyTripIdValue,
    applyTitle: applyTitleValue,
    setApplyTripId,
    setApplyTitle,
    ...requests,
    ...lifecycle,
  };
}

/** The trips an existing-trip apply can write into; the offline-aware repo the dashboard already reads. */
function useTripChoices(): Trip[] {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    let cancelled = false;
    tripRepo
      .list()
      .then(({ trips: loaded }) => {
        if (!cancelled) setTrips(loaded);
      })
      .catch(() => {
        if (!cancelled) setTrips([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return trips;
}
