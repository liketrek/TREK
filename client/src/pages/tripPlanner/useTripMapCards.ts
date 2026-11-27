import { useCallback, useLayoutEffect, useRef } from 'react';
import { MAP_ROUND_CONTROL_SIZE } from '../../components/Map/MapLayerSwitcher';
import { TRIP_OVERVIEW_INSET, TRIP_OVERVIEW_MAX_WIDTH } from '../../components/Map/TripRouteOverview';
import type { Day } from '../../types';
import type { useTripPlanner } from './useTripPlanner';

const CARD_GAP = 8;
type TripMapCard = 'day' | 'overview';

type Options = Pick<
  ReturnType<typeof useTripPlanner>,
  | 'activeTab'
  | 'hideOverview'
  | 'isLoading'
  | 'isMobile'
  | 'leftHidden'
  | 'leftWidth'
  | 'overviewActive'
  | 'overviewShown'
  | 'rightHidden'
  | 'rightWidth'
  | 'roadtripActive'
  | 'selectAssignment'
  | 'selectedDayId'
  | 'selectedPlace'
  | 'setSelectedPlaceId'
  | 'setShowDayDetail'
  | 'showDayDetail'
  | 'toggleOverview'
  | 'trip'
  | 'tripOverview'
  | 'viewportWidth'
>;

export function useTripMapCards({
  activeTab,
  hideOverview,
  isLoading,
  isMobile,
  leftHidden,
  leftWidth,
  overviewActive,
  overviewShown,
  rightHidden,
  rightWidth,
  roadtripActive,
  selectAssignment,
  selectedDayId,
  selectedPlace,
  setSelectedPlaceId,
  setShowDayDetail,
  showDayDetail,
  toggleOverview,
  trip,
  tripOverview,
  viewportWidth,
}: Options) {
  // The panels float 10 px inside the map when open.
  const leftPanelPx = leftHidden ? 0 : leftWidth;
  const rightPanelPx = rightHidden ? 0 : rightWidth;
  const mapInsetLeft = leftPanelPx ? leftPanelPx + 10 : 0;
  const mapInsetRight = rightPanelPx ? rightPanelPx + 10 : 0;
  const overviewRightInset = mapInsetRight + TRIP_OVERVIEW_INSET;
  const overviewRightGap = overviewRightInset - rightPanelPx + MAP_ROUND_CONTROL_SIZE + 8;
  const dayCardRef = useRef<HTMLDivElement>(null);
  const overviewCardRef = useRef<HTMLDivElement>(null);
  const lastOpenedCard = useRef<TripMapCard>('day');
  const closeDayDetail = useCallback(() => setShowDayDetail(null), [setShowDayDetail]);
  const bothOpen =
    !isLoading &&
    !!trip &&
    !isMobile &&
    activeTab === 'plan' &&
    !roadtripActive &&
    overviewActive &&
    !!showDayDetail &&
    !selectedPlace;
  const overviewHasRoute = tripOverview?.hasPlannedRoute === true;
  const overviewHasCard = !!tripOverview?.days?.length;
  const openSelectedDayDetail = overviewActive && showDayDetail?.id !== selectedDayId;

  useLayoutEffect(() => {
    const dayCard = dayCardRef.current;
    const overviewCard = overviewCardRef.current;
    // A routable overview starts with an empty result. Its first card lands with
    // the estimated route, which gives us its real width before the router answers.
    if (!bothOpen || !dayCard || (overviewHasRoute && !overviewCard)) return;

    const checkFit = () => {
      const day = dayCard.getBoundingClientRect();
      if (day.width === 0) return;
      // Reserve the overview's full width for a trip with no route to render.
      const overviewLeft =
        overviewCard?.getBoundingClientRect().left ?? viewportWidth - overviewRightInset - TRIP_OVERVIEW_MAX_WIDTH;
      if (overviewLeft - day.right >= CARD_GAP) return;
      if (lastOpenedCard.current === 'overview') closeDayDetail();
      else hideOverview();
    };

    checkFit();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(checkFit);
    observer.observe(dayCard);
    if (overviewCard) observer.observe(overviewCard);
    return () => observer.disconnect();
  }, [
    bothOpen,
    overviewHasRoute,
    overviewHasCard,
    viewportWidth,
    leftPanelPx,
    overviewRightInset,
    closeDayDetail,
    hideOverview,
  ]);

  const handleToggleOverview = () => {
    if (!overviewShown) lastOpenedCard.current = 'overview';
    toggleOverview();
  };
  const handleDayDetail = (day: Day | null) => {
    if (day) lastOpenedCard.current = 'day';
    setShowDayDetail(day);
    setSelectedPlaceId(null);
    selectAssignment(null);
  };

  return {
    leftPanelPx,
    rightPanelPx,
    mapInsetLeft,
    mapInsetRight,
    overviewRightGap,
    dayCardRef,
    overviewCardRef,
    handleToggleOverview,
    handleDayDetail,
    closeDayDetail,
    openSelectedDayDetail,
  };
}
