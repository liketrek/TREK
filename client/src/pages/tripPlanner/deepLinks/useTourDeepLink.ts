import { useCallback, useEffect, useRef } from 'react';

import type { DeepLinkProps } from './deepLinkTypes';

/** How long a tour the chat just made may take to reach the tour list before the link gives up on it. */
const LATE_TOUR_MS = 3000;

/**
 * A tour the chat points at (`?tour=<placeId>`, from "Open in Tours"), on
 * the desktop planner: the Tours tab opens and the tour opens in it, in the
 * editor or as it came in, as a click on it in the tour list does. A tour
 * the chat has only just made can beat the broadcast that brings it into the
 * list, so once the list has loaded it is asked for once more, and only a
 * tour still missing three seconds later says it could not be opened. A
 * tour being edited is never discarded for it: the planner says to save or
 * discard first. With Tours switched off, or on the phone, the tour shows
 * as its place on the plan instead. The link leaves the URL once taken,
 * whichever way.
 */
export function useTourDeepLink({ planner, workspace, searchParams, setSearchParams }: DeepLinkProps): void {
  const raw = searchParams.get('tour');
  const placeId = raw !== null && /^\d{1,12}$/.test(raw) ? Number(raw) : null;
  const tabPending = searchParams.get('tab') === 'tour-planner';
  const { activeTab, enabledAddons, handleTabChange, invalidateTourPlaceIds, isMobile, setSelectedPlaceId } = planner;
  const { t, toast, tourDataReady, tours } = planner;
  const { openTourInPlanner, tourPlanner } = workspace;
  const unsaved = tourPlanner.hasUnsavedChanges;
  const known = placeId !== null && tours.some((tour) => tour.place_id === placeId);
  /** The tour the list was asked for again, and until when it may still arrive. */
  const asked = useRef<{ placeId: number; until: number } | null>(null);

  const drop = useCallback(() => {
    setSearchParams(
      (current) => {
        current.delete('tour');
        return current;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (raw === null) return;
    if (placeId === null) {
      drop();
      return;
    }
    if (!enabledAddons.tours || isMobile) {
      setSelectedPlaceId(placeId);
      drop();
      return;
    }
    if (activeTab !== 'tour-planner') {
      // The chat's `?tab=` link is switching already; otherwise this link switches itself.
      if (!tabPending) handleTabChange('tour-planner');
      return;
    }
    if (unsaved) {
      toast.warning(t('assistant.card.tour.unsaved'));
      drop();
      return;
    }
    if (known) {
      asked.current = null;
      openTourInPlanner(placeId);
      drop();
      return;
    }
    // The list itself is still on its way: wait for it before counting the tour late.
    if (!tourDataReady) return;
    if (asked.current?.placeId !== placeId) {
      asked.current = { placeId, until: Date.now() + LATE_TOUR_MS };
      invalidateTourPlaceIds();
    }
    const timer = window.setTimeout(
      () => {
        asked.current = null;
        toast.error(t('tours.planner.openFailed'));
        drop();
      },
      Math.max(0, asked.current.until - Date.now())
    );
    return () => window.clearTimeout(timer);
  }, [
    activeTab,
    drop,
    enabledAddons.tours,
    handleTabChange,
    invalidateTourPlaceIds,
    isMobile,
    known,
    openTourInPlanner,
    placeId,
    raw,
    setSelectedPlaceId,
    t,
    tabPending,
    toast,
    tourDataReady,
    unsaved,
  ]);
}
