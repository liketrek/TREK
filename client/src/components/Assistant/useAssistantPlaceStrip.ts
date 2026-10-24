import { type AssistantFoundPlace, categoryIdForKind } from '@trek/shared';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useOpenTourStore } from '../../store/openTourStore';
import { useCanDo } from '../../store/permissionsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { Assignment } from '../../types';
import { haversineKm } from '../../utils/geo';
import { safeHexColor } from '../../utils/safeColor';
import { formatDistance } from '../../utils/units';
import { useAssistantScope, useAssistantView } from './assistantViewContext';
import { useCardPoint } from './cards/parts/useCardPoint';

/** The trip category a found place most likely belongs in, for its line and its icon. */
interface StripCategory {
  name: string;
  icon: string;
  color: string;
}

/** The last stop of a day that has a spot on the map. */
function lastSpot(stops: readonly Assignment[] | undefined): { lat: number; lng: number } | null {
  const sorted = [...(stops ?? [])].sort((a, b) => a.order_index - b.order_index);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const place = sorted[i]?.place;
    if (place && typeof place.lat === 'number' && typeof place.lng === 'number') {
      return { lat: place.lat, lng: place.lng };
    }
  }
  return null;
}

/**
 * What the strip of found places needs, the same for the window and the
 * phone: the day in focus, how far a place is from that day's last stop, its
 * likely category, whether a place can be added, and the map's part (the pin
 * while the pointer rests on a card, the camera on a click).
 *
 * Adding opens the planner's own place form, filled in with the place and on
 * the day in focus: the traveller sees everything about it and saves it as
 * any other place, so nothing waits for the chat's open decisions.
 *
 * P6: while a saved hike or city walk is open in the planner, "+ Tour" takes
 * a place into it as a stop: held as a change in the chat like any other,
 * so the stop is only saved once the traveller applies it.
 */
export function useAssistantPlaceStrip() {
  const { tripId, onRevealMap } = useAssistantView();
  const scope = useAssistantScope();
  const can = useCanDo();
  const unit = useSettingsStore((s) => s.settings.distance_unit ?? 'metric');
  const { trip, days, assignments, categories } = useTripStore(
    useShallow((s) => {
      const here = s.trip?.id === tripId;
      return {
        trip: here ? s.trip : null,
        days: here ? s.days : null,
        assignments: here ? s.assignments : null,
        categories: s.categories,
      };
    })
  );
  const focusDayId = useAssistantStore((s) => chatOf(s, tripId).focus?.dayId ?? null);
  const openPlaceDraft = useAssistantStore((s) => s.openPlaceDraft);
  const insertFoundPlace = useAssistantStore((s) => s.insertFoundPlace);
  const openTour = useOpenTourStore((s) => (s.open?.tripId === tripId ? s.open : null));
  const point = useCardPoint();

  const focusDay = (days ?? []).find((d) => d.id === focusDayId) ?? null;
  const from = focusDay && assignments ? lastSpot(assignments[String(focusDay.id)]) : null;

  /** Whether "Add to trip" shows at all: a trip's chat (a journey's has no days), the planner holds the trip and the user may add to it. */
  const canAdd = scope.kind === 'trip' && !!trip && can('place_edit', trip);

  const categoryOf = (place: AssistantFoundPlace): StripCategory | null => {
    const id = categoryIdForKind(place.kind, categories);
    const category = id === null ? undefined : categories.find((c) => c.id === id);
    if (!category) return null;
    return { name: category.name, icon: category.icon, color: safeHexColor(category.color, 'var(--text-faint)') };
  };

  const distanceOf = (place: AssistantFoundPlace): string | null =>
    from ? formatDistance(haversineKm(from, place), unit) : null;

  /** Opens the place form with it; on the phone the chat steps aside first. */
  const open = (place: AssistantFoundPlace) => {
    if (!canAdd || !trip) return;
    onRevealMap?.();
    openPlaceDraft(trip.id, place, focusDay?.id ?? null);
  };

  /** The saved tour a place can be taken into as a stop, null while none is open or nothing can be added. */
  const tour = canAdd ? openTour : null;

  /** Holds the place as a stop of the open tour, to decide in the chat. */
  const addToTour = (place: AssistantFoundPlace) => {
    if (tour) void insertFoundPlace(tripId, place.ref, tour.placeId);
  };

  /** Shows the place on the map; on the phone the chat steps aside first. */
  const show = point.show;

  // The pin goes with the strip: the card point takes it away when it unmounts.
  const { hover: hoverPoint } = point;
  const hover = useCallback(
    (place: AssistantFoundPlace | null) =>
      hoverPoint(place ? { ref: place.ref, lat: place.lat, lng: place.lng, name: place.name } : null),
    [hoverPoint]
  );

  return { canAdd, categoryOf, distanceOf, open, show, hover, tour, addToTour };
}
