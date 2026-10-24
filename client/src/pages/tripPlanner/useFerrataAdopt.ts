import { useCallback } from 'react';
import { ferrataEnds, ferrataLine } from '../../components/Ferratas/ferrataCrossings';
import { type FerrataGroup, ferrataLabel } from '../../components/Ferratas/ferrataGroups';
import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import { useTranslation } from '../../i18n';

type AdoptPlanner = Pick<
  TourPlannerController,
  'mode' | 'isSaving' | 'waypoints' | 'selectedWaypointId' | 'addWaypoint' | 'appendFixedLeg' | 'startNewTour'
>;

const EARTH_RADIUS_M = 6_371_000;
const RAD = Math.PI / 180;
function roughDistance([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]): number {
  const x = (lng2 - lng1) * RAD * Math.cos(((lat1 + lat2) / 2) * RAD);
  const y = (lat2 - lat1) * RAD;
  return Math.hypot(x, y) * EARTH_RADIUS_M;
}

/**
 * "Add to tour" on a via ferrata's card. The ferrata goes onto the tour as a
 * fixed leg: a waypoint at its nearer end carries the ferrata's own line from
 * OpenStreetMap to a waypoint at its other end, so the router only plans the
 * way there and on from the top, and never walks around the climb. Where the
 * ferrata's pieces do not join into one line, its two ends go on as plain
 * waypoints instead. Where a stop inside the route is selected the ferrata
 * goes in after it, so one in the middle of a hike needs no rebuilding of the
 * stops that follow; with the last stop selected, or none, it goes on the end.
 * Undefined while the tour cannot be edited.
 */
export function useFerrataAdopt(planner: AdoptPlanner, canEdit: boolean, onDone: () => void) {
  const { t } = useTranslation();
  const adopt = useCallback(
    (group: FerrataGroup) => {
      const ends = ferrataEnds(group);
      if (!ends || planner.isSaving) return;
      if (planner.mode.type === 'view-gpx') planner.startNewTour();
      const fresh = planner.mode.type === 'view-gpx';
      const stops = fresh ? [] : planner.waypoints;
      const selected = stops.findIndex((point) => point.id === planner.selectedWaypointId);
      const inside = selected >= 0 && selected < stops.length - 1;
      const last = inside ? stops[selected] : stops[stops.length - 1];
      const [a, b] = ends;
      const [first, second] =
        last && roughDistance([last.lat, last.lng], b) < roughDistance([last.lat, last.lng], a) ? [b, a] : [a, b];
      const line = ferrataLine(group, first);
      if (line) {
        planner.appendFixedLeg(
          {
            kind: 'ferrata',
            ref: group.id.replace(/^group\//, '').slice(0, 64),
            name: ferrataLabel(group, t).name.slice(0, 255),
            geometry: line,
          },
          inside ? stops[selected].id : null
        );
      } else {
        planner.addWaypoint(first[0], first[1]);
        planner.addWaypoint(second[0], second[1]);
      }
      onDone();
    },
    [planner, onDone, t]
  );
  return canEdit ? adopt : undefined;
}
