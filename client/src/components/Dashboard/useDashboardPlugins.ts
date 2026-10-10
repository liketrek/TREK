import { usePluginStore } from '../../store/pluginStore';
import { useTripCardBadges } from '../Plugins/TripCardBadges';

/**
 * What plugins add to the dashboard: the widgets for the side column (hero widgets
 * mount on the spotlight, place-detail/day-detail/reservation-detail ones inside the
 * planner, so none of those) and the badges on the trip cards. The badges cost one
 * fetch for all cards and only run while at least one plugin is active.
 */
export function useDashboardPlugins(tripIds: number[]) {
  const widgetPlugins = usePluginStore((s) => s.plugins).filter(
    (p) =>
      p.type === 'widget' &&
      p.slot !== 'hero' &&
      p.slot !== 'place-detail' &&
      p.slot !== 'day-detail' &&
      p.slot !== 'reservation-detail'
  );
  const anyPluginActive = usePluginStore((s) => s.plugins).length > 0;
  const badgesFor = useTripCardBadges(tripIds, anyPluginActive);
  return { widgetPlugins, badgesFor };
}
