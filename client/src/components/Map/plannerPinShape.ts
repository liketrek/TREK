/** What a planner pin shows: its stop number, or (P2A-03) nothing on a shaping point, which only steers the route. */
export interface PlannerPinPoint {
  /** The stop number to print; shaping points do not count, so stops keep their numbers. */
  label?: string;
  shaping?: boolean;
}

/** A stop is a numbered pin; a shaping point a small dot of the same colour, without a number. */
export function plannerPinShape(
  point: PlannerPinPoint,
  index: number,
  selected: boolean
): { size: number; text: string } {
  if (point.shaping) return { size: selected ? 18 : 14, text: '' };
  return { size: selected ? 30 : 26, text: point.label ?? String(index + 1) };
}
