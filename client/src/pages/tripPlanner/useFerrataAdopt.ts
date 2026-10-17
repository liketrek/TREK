import { useCallback } from 'react';
import { ferrataEnds, ferrataLine } from '../../components/Ferratas/ferrataCrossings';
import { type FerrataGroup, ferrataLabel } from '../../components/Ferratas/ferrataGroups';
import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import { useTranslation } from '../../i18n';

type AdoptPlanner = Pick<
  TourPlannerController,
  'mode' | 'isSaving' | 'waypoints' | 'addWaypoint' | 'appendFixedLeg' | 'startNewTour'
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
 * waypoints instead. Undefined while the tour cannot be edited.
 */
export function useFerrataAdopt(planner: AdoptPlanner, canEdit: boolean, onDone: () => void) {
  const { t } = useTranslation();
  const adopt = useCallback(
    (group: FerrataGroup) => {
      const ends = ferrataEnds(group);
      if (!ends || planner.isSaving) return;
      if (planner.mode.type === 'view-gpx') planner.startNewTour();
      const last = planner.mode.type === 'view-gpx' ? undefined : planner.waypoints[planner.waypoints.length - 1];
      const [a, b] = ends;
      const [first, second] =
        last && roughDistance([last.lat, last.lng], b) < roughDistance([last.lat, last.lng], a) ? [b, a] : [a, b];
      const line = ferrataLine(group, first);
      if (line) {
        planner.appendFixedLeg({
          kind: 'ferrata',
          ref: group.id.replace(/^group\//, '').slice(0, 64),
          name: ferrataLabel(group, t).name.slice(0, 255),
          geometry: line,
        });
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
