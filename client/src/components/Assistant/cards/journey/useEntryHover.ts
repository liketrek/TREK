import type { JourneyEntryLook } from '@trek/shared';

import { useTranslation } from '../../../../i18n';
import { cardTitle } from '../../../Journey/journeyCard';
import { useCardPoint } from '../parts/useCardPoint';
import { titleSourceOf } from './journeyCardModel';

/** Shows an entry on the plan's map, or takes it away (null). */
export type EntryHover = (look: JourneyEntryLook | null) => void;

/**
 * The way a card's entries show on the map while the pointer rests on one or
 * the keyboard is on it: a pin under the entry's own key; nothing for one
 * without a place. The pin goes when the card does.
 */
export function useEntryHover(journeyId: number, fallbackRef: string): EntryHover {
  const { t } = useTranslation();
  const point = useCardPoint();
  return (look) => {
    if (!look?.point) {
      point.hover(null);
      return;
    }
    point.hover({
      ref: `journey:${journeyId}:${look.entryId ?? fallbackRef}`,
      lat: look.point.lat,
      lng: look.point.lng,
      name: cardTitle(titleSourceOf(look), t),
    });
  };
}

/** What an element standing for one entry listens to: the pointer resting on it and the focus inside it. */
export function entryHoverProps(hover: EntryHover, look: JourneyEntryLook) {
  return {
    onMouseEnter: () => hover(look),
    onMouseLeave: () => hover(null),
    onFocus: () => hover(look),
    onBlur: () => hover(null),
  };
}
