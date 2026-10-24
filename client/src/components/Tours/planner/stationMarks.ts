import type { useTranslation } from '../../../i18n';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

type Translate = ReturnType<typeof useTranslation>['t'];

/**
 * CW-03: how much a station matters, as a ring around its number: a full ring
 * in the warning colour for a must-see, a dashed muted one for an optional
 * stop, none for a normal one.
 */
export function stationRingClass(importance: TourPlannerWaypoint['importance']): string {
  if (importance === 'must') return 'outline outline-2 outline-offset-1 outline-warning';
  if (importance === 'optional') return 'outline outline-2 outline-offset-1 outline-dashed outline-content-faint';
  return '';
}

/** CW-03, CW-10: what the ring and the shield on a station's number say, for its label and tooltip. */
export function stationMarkNote(
  point: Pick<TourPlannerWaypoint, 'importance' | 'protected'>,
  t: Translate
): string | null {
  const parts = [
    point.importance ? t(`tours.walk.importance.${point.importance}`) : null,
    point.protected ? t('tours.walk.station.protected') : null,
  ].filter((part): part is string => part !== null);
  return parts.length ? parts.join(', ') : null;
}
