import {
  recommendedPaddleSpeedKmh,
  type PaddleBoatType,
  type PaddleWaterContext,
  type TourListItem,
} from '@trek/shared';
import { useCallback, useState } from 'react';

export interface PaddleFieldValues {
  boatType: PaddleBoatType | null;
  waterContext: PaddleWaterContext | null;
  /** The speed the paddler chose, km/h; null while the boat's suggested speed applies. */
  speedKmh: number | null;
  /** PAD-07: the carrying speed the paddler chose, km/h; null while the starting value applies. Absent in an older draft. */
  portageSpeedKmh?: number | null;
}

export const NO_PADDLE_FIELDS: PaddleFieldValues = {
  boatType: null,
  waterContext: null,
  speedKmh: null,
  portageSpeedKmh: null,
};

/** The paddle fields of a saved tour, or none for a hike or a list cached before they existed. */
export function paddleFieldsOf(
  tour: Pick<TourListItem, 'boat_type' | 'water_context' | 'paddle_speed_kmh' | 'portage_speed_kmh'>
): PaddleFieldValues {
  return {
    boatType: tour.boat_type ?? null,
    waterContext: tour.water_context ?? null,
    speedKmh: tour.paddle_speed_kmh ?? null,
    portageSpeedKmh: tour.portage_speed_kmh ?? null,
  };
}

/**
 * PAD-01: the boat, the water and the planning speed of a paddle tour. A
 * speed the paddler typed stays when the boat changes; the boat's suggestion
 * is offered beside it and only taken on purpose. `onEdit` tells the planner
 * the draft changed, like any other field.
 */
export function usePaddleFields(initial: PaddleFieldValues, onEdit: () => boolean) {
  const [values, setValues] = useState<PaddleFieldValues>(initial);

  // Only a real change marks the draft edited: choosing the boat already chosen is no edit.
  const edit = useCallback(
    (next: Partial<PaddleFieldValues>) => {
      const merged = { ...values, ...next };
      const same =
        merged.boatType === values.boatType &&
        merged.waterContext === values.waterContext &&
        Object.is(merged.speedKmh, values.speedKmh) &&
        Object.is(merged.portageSpeedKmh ?? null, values.portageSpeedKmh ?? null);
      if (!same && onEdit()) setValues(merged);
    },
    [onEdit, values]
  );

  const recommended = recommendedPaddleSpeedKmh(values.boatType);
  return {
    ...values,
    portageSpeedKmh: values.portageSpeedKmh ?? null,
    recommendedSpeedKmh: recommended,
    /** The speed the time is worked out with: the chosen one, else the boat's suggestion. */
    effectiveSpeedKmh: values.speedKmh ?? recommended,
    setBoatType: useCallback((boatType: PaddleBoatType) => edit({ boatType }), [edit]),
    setWaterContext: useCallback((waterContext: PaddleWaterContext) => edit({ waterContext }), [edit]),
    setSpeedKmh: useCallback((speedKmh: number | null) => edit({ speedKmh }), [edit]),
    /** PAD-07: the carrying speed, or back to the starting value with null. */
    setPortageSpeedKmh: useCallback((portageSpeedKmh: number | null) => edit({ portageSpeedKmh }), [edit]),
    /** Back to the boat's suggestion, by choice. */
    adoptRecommendedSpeed: useCallback(() => edit({ speedKmh: null }), [edit]),
    /** Loaded from a tour or a draft, or cleared; not an edit. */
    load: useCallback((next: PaddleFieldValues) => setValues(next), []),
  };
}
