import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import { pickOnTrack, refuseTrackPick, useTrackMarkToolStore } from '../../store/trackMarkToolStore';
import { projectOntoTrack, TRACK_PICK_TOLERANCE_M } from '../../utils/paddleTrackMarks';

type MapClick = (lat: number, lng: number) => void;

/**
 * PAD-03 on a recorded paddle track: with a marking tool on, a click on the
 * line marks the spot on it, one too far from the line is refused. Otherwise
 * the planner's own click (adding a waypoint) stays.
 */
export function useTrackLinePick(
  tourPlanner: Pick<TourPlannerController, 'mode' | 'readOnlyGpxAnalysis'>,
  canPlaceEdit: boolean,
  guard: (handler: MapClick | undefined) => MapClick | undefined,
  onAdd: MapClick | undefined
): { pickOnLine: boolean; onAddOrMark: MapClick | undefined } {
  const trackPick = useTrackMarkToolStore((state) => state.pick);
  const trackLine = tourPlanner.mode.type === 'view-gpx' ? tourPlanner.readOnlyGpxAnalysis?.routeCoordinates : null;
  const pickOnLine = canPlaceEdit && trackPick !== null && !!trackLine?.length;
  const onTrackClick = guard(
    pickOnLine && trackLine
      ? (lat, lng) => {
          const projected = projectOntoTrack(trackLine, { lat, lng });
          if (!projected || projected.offM > TRACK_PICK_TOLERANCE_M) refuseTrackPick();
          else pickOnTrack(projected.atM);
        }
      : undefined
  );
  return { pickOnLine, onAddOrMark: onAdd ?? onTrackClick };
}
