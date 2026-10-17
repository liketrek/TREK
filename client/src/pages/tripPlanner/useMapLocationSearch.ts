import { useCallback, useState } from 'react';
import type { LocationPoint } from '../../components/Planner/LocationSelect';
import type { PaddleFocus } from '../../store/paddleObstacleStore';

interface CameraIntent {
  plannerFocusKey: number;
  sequence: number;
  /** A picked search result, or an obstacle or area the paddle checklist asked for. */
  kind: 'search' | 'paddle';
  points: [number, number][];
}

/**
 * The TOUR-PLANNER location search: a picked result only moves the camera.
 * A focus the paddle checklist asks for (PAD-06) is an intent of the same
 * kind, and the newest of them wins until the planner bumps its own focus key.
 */
export function useMapLocationSearch(
  plannerFocusKey: number,
  focusPoints: [number, number][],
  paddleFocus: PaddleFocus | null = null
) {
  const [locationSearchValue, setLocationSearchValue] = useState<LocationPoint | null>(null);
  const [intent, setIntent] = useState<CameraIntent | null>(null);
  const [seenPaddleSeq, setSeenPaddleSeq] = useState(paddleFocus?.seq ?? null);
  // A new focus from the checklist becomes the newest intent, adjusted while rendering as React advises for a changed prop.
  if ((paddleFocus?.seq ?? null) !== seenPaddleSeq) {
    setSeenPaddleSeq(paddleFocus?.seq ?? null);
    if (paddleFocus && paddleFocus.points.length > 0) {
      const points = paddleFocus.points;
      setIntent((current) => ({ plannerFocusKey, sequence: (current?.sequence ?? 0) + 1, kind: 'paddle', points }));
    }
  }
  const onLocationSearchChange = useCallback(
    (location: LocationPoint | null) => {
      setLocationSearchValue(location);
      if (!location) return;
      setIntent((current) => ({
        plannerFocusKey,
        sequence: (current?.sequence ?? 0) + 1,
        kind: 'search',
        points: [[location.lat, location.lng]],
      }));
    },
    [plannerFocusKey]
  );

  const current = intent?.plannerFocusKey === plannerFocusKey ? intent : null;
  const mapFocusPoints = current ? current.points : focusPoints;
  const mapFocusKey = current
    ? `tour:${plannerFocusKey}:${current.kind}:${current.sequence}`
    : `tour:${plannerFocusKey}`;

  return {
    mapFocusPoints,
    mapFocusKey,
    locationSearch: { value: locationSearchValue, onChange: onLocationSearchChange },
  };
}
