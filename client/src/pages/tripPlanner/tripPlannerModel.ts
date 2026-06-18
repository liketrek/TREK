/**
 * Trip planner pure helpers — React/IO-free logic shared by the data hook
 * (useTripPlanner) and kept here so it can be unit-tested in isolation. Part of
 * the FE "page = wiring container + data hook" convention (see PATTERN.md).
 */

import type { Assignment } from '../../types'

/**
 * Resolve the day-assignment to use when a place is edited from the Places pool,
 * where no day is in context. Times live per day-assignment (#1247), so we can
 * only hydrate/persist a place's time when it is assigned to exactly one day.
 * Returns that assignment's id, or null when the place has 0 or 2+ assignments
 * (ambiguous — the modal then hides the time fields).
 */
export function resolvePoolAssignmentId(
  assignments: Record<string | number, Assignment[]>,
  placeId: number,
): number | null {
  const matches = Object.values(assignments)
    .flat()
    .filter((a) => a.place?.id === placeId)
  return matches.length === 1 ? matches[0].id : null
}
