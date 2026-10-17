import type { useSearchParams } from 'react-router'
import type { useToast } from '../../components/shared/Toast'
import type { usePlannerHistory } from '../../hooks/usePlannerHistory'
import type { useTranslation } from '../../i18n'
import type { useCanDo } from '../../store/permissionsStore'
import type { TripStoreState } from '../../store/tripStore'

/*
 * The types the planner's sub-hooks take their options in. Each one is read off the
 * hook or store that produces the value rather than written out by hand, so a
 * sub-hook sees exactly what useTripPlanner holds and the planner's return type
 * cannot drift when a piece of it moves into a sub-hook.
 */

export type Translate = ReturnType<typeof useTranslation>['t']
export type PlannerToast = ReturnType<typeof useToast>
export type Can = ReturnType<typeof useCanDo>
export type PlannerHistory = ReturnType<typeof usePlannerHistory>
/** The `[searchParams, setSearchParams]` pair, read once by useTripPlanner and handed down. */
export type PlannerSearchParams = ReturnType<typeof useSearchParams>

/** The core values most planner sub-hooks read. */
export interface PlannerBase {
  tripId: number
  trip: TripStoreState['trip']
  can: Can
  /** The store's actions as snapshotted once by useTripPlanner, never read again. */
  tripActions: TripStoreState
  toast: PlannerToast
  t: Translate
}
