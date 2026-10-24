import { Moon } from 'lucide-react';
import { createElement } from 'react';
import { renderIconMarkup } from '../../utils/iconMarkup';

/** What a planner pin shows: its stop number, or (P2A-03) nothing on a shaping point, which only steers the route. */
export interface PlannerPinPoint {
  /** The stop number to print; shaping points do not count, so stops keep their numbers. */
  label?: string;
  shaping?: boolean;
  /** MDT-01: a stage of a multi-day tour ends at this stop. */
  stageEnd?: boolean;
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

const MOON = renderIconMarkup(createElement(Moon, { size: 9, strokeWidth: 2.6, 'aria-hidden': true }));

/**
 * MDT-01: the moon at the corner of a pin where a stage ends, the night
 * between two days of the tour, as the planner's list marks the stop's number.
 * Laid over the pin, so it needs no room of its own and moves with it.
 */
export function plannerPinBadge(point: PlannerPinPoint): string {
  if (!point.stageEnd || point.shaping) return '';
  return `<span data-stage-end="true" aria-hidden="true" style="position:absolute;bottom:-4px;inset-inline-end:-4px;display:grid;place-items:center;width:15px;height:15px;border-radius:9999px;background:var(--bg-card);color:var(--text-primary);box-shadow:var(--shadow-sm);pointer-events:none">${MOON}</span>`;
}
