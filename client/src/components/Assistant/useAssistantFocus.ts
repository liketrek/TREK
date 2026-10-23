import { useEffect, useMemo } from 'react';

import { useTranslation } from '../../i18n';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';
import type { Place } from '../../types';
import { dayLabel } from '../../utils/dayLabel';

/**
 * What the next question is about: the place the user asked from, or else the
 * day selected in the planner. The chip above the composer names it, and the
 * suggestions turn to it.
 */

/**
 * The selected day becomes the focus by itself, quietly, and follows the
 * selection. A removed chip stays away until another day is selected, and a
 * place asked about is never replaced by the day. Run once per chat.
 */
export function useFollowSelectedDay(tripId: number): void {
  const setFocus = useAssistantStore((s) => s.setFocus);
  // The planner's own store holds the trip it shows; for any other trip there is no selection to follow.
  const here = useTripStore((s) => s.trip?.id === tripId);
  const selectedDayId = useTripStore((s) => s.selectedDayId);

  useEffect(() => {
    if (!here) return;
    const current = chatOf(useAssistantStore.getState(), tripId).focus;
    if (current?.placeIds?.length) return;
    if (selectedDayId === null) {
      if (current) setFocus(tripId, null);
    } else if (current?.dayId !== selectedDayId) {
      setFocus(tripId, { dayId: selectedDayId });
    }
  }, [here, selectedDayId, tripId, setFocus]);
}

interface AssistantFocusView {
  /** The place or day named on the chip; null when nothing is in focus or it is not at hand. */
  label: string | null;
  kind: 'place' | 'day' | null;
  /** The place on a place chip, for its picture. */
  place: Place | null;
  clear: () => void;
}

export function useAssistantFocus(tripId: number): AssistantFocusView {
  const { t, locale } = useTranslation();
  const focus = useAssistantStore((s) => chatOf(s, tripId).focus);
  const setFocus = useAssistantStore((s) => s.setFocus);
  const here = useTripStore((s) => s.trip?.id === tripId);
  const days = useTripStore((s) => s.days);
  const places = useTripStore((s) => s.places);

  const named = useMemo((): { label: string; kind: 'place' | 'day'; place: Place | null } | null => {
    if (!here || !focus) return null;
    const placeIds = focus.placeIds ?? [];
    if (placeIds.length > 0) {
      const first = places.find((p) => p.id === placeIds[0]);
      if (!first) return null;
      const label = placeIds.length > 1 ? `${first.name} +${placeIds.length - 1}` : first.name;
      return { kind: 'place', label, place: first };
    }
    const index = days.findIndex((d) => d.id === focus.dayId);
    const day = days[index];
    return day ? { kind: 'day', label: dayLabel(day, index, t, locale), place: null } : null;
  }, [here, focus, places, days, t, locale]);

  return {
    label: named?.label ?? null,
    kind: named?.kind ?? null,
    place: named?.place ?? null,
    clear: () => setFocus(tripId, null),
  };
}
