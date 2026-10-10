import type { DayPlanSidebarProps } from './DayPlanSidebar';

/**
 * The day plan's props with the optional ones filled in. The plan's hook and its
 * view both read the props through this, so the fallbacks are written once.
 */
export function withDayPlanDefaults(props: DayPlanSidebarProps) {
  const {
    accommodations = [],
    reservations = [],
    visibleConnectionIds = [],
    allConnectionsShown = false,
    routeShown = false,
    routeProfile = 'driving',
    canUndo = false,
    lastActionLabel = null,
    showRouteToolsWhenExpanded = false,
    isMobile = false,
    ...rest
  } = props;
  return {
    ...rest,
    accommodations,
    reservations,
    visibleConnectionIds,
    allConnectionsShown,
    routeShown,
    routeProfile,
    canUndo,
    lastActionLabel,
    showRouteToolsWhenExpanded,
    isMobile,
  };
}
