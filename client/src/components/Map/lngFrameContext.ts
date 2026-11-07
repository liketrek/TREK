// The longitude frame of the Leaflet map, for every layer that draws in it (#2975).
// See utils/lngFrame.ts for what the frame is and why only Leaflet needs it.

import { createContext, useContext, useMemo, useState } from 'react';
import type { Place, Reservation } from '../../types';
import { tripLngFrame, type LngFrame } from '../../utils/lngFrame';

const LngFrameContext = createContext<LngFrame | null>(null);

export const LngFrameProvider = LngFrameContext.Provider;

/** The frame the map draws in, or null when it draws the plain world. */
export function useLngFrame(): LngFrame | null {
  return useContext(LngFrameContext);
}

type Located = Pick<Place, 'lng'>;

function tripLngs(
  places: readonly Located[],
  dayPlaces: readonly Located[],
  reservations: readonly Reservation[]
): number[] {
  const lngs: number[] = [];
  for (const p of places) if (typeof p.lng === 'number') lngs.push(p.lng);
  for (const p of dayPlaces) if (typeof p.lng === 'number') lngs.push(p.lng);
  for (const r of reservations) for (const e of r.endpoints ?? []) if (typeof e.lng === 'number') lngs.push(e.lng);
  return lngs;
}

/**
 * The frame for a trip: its places, the day's places and every endpoint of every
 * booking, shown or not, so switching a day or a booking on and off does not move
 * the seam. The frame in use is handed back in, which keeps it while it still fits.
 */
export function useTripLngFrame(
  places: readonly Located[],
  dayPlaces: readonly Located[],
  reservations: readonly Reservation[]
): LngFrame | null {
  const [current, setCurrent] = useState<LngFrame | null>(() =>
    tripLngFrame(tripLngs(places, dayPlaces, reservations))
  );
  const next = useMemo(
    () => tripLngFrame(tripLngs(places, dayPlaces, reservations), current),
    [places, dayPlaces, reservations, current]
  );
  // Derived state, adjusted during render: the next render already draws in the new frame.
  if (next !== current) setCurrent(next);
  return next;
}
