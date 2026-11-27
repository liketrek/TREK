import type { Assignment } from '../../types';
import { isServiceStopType } from '../Roadtrip/roadtripModel';

/**
 * The number each stop of a day carries, by assignment id: counted from 1 in the
 * day's stored order. A service stop is passed over rather than counted: the map
 * draws it without a badge and the rail gives it no number, so a number spent on
 * it left the pin after a fuel stop wearing "3" where the rail said "2".
 *
 * The one count the map's pins and the plan's rows both read (#2584), so the
 * number beside a stop in the list is the one on its pin.
 */
export function stopNumbersOfDay(dayAssignments: readonly Assignment[]): Map<number, number> {
  const numbers = new Map<number, number>();
  let counted = 0;
  for (const a of [...dayAssignments].sort((x, y) => x.order_index - y.order_index)) {
    if (!a.place?.id || isServiceStopType(a.place.stop_type)) continue;
    counted += 1;
    numbers.set(a.id, counted);
  }
  return numbers;
}
