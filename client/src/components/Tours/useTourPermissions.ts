import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'

export interface TourPermissionProps {
  canEdit?: boolean
  canAssign?: boolean
}

export function useTourPermissions({ canEdit, canAssign, tripId }: TourPermissionProps & { tripId?: number | string } = {}) {
  const can = useCanDo()
  const trip = useTripStore(state => state.trip)
  const hasTrip = trip != null && (tripId == null || String(trip.id) === String(tripId))
  return {
    canEdit: canEdit ?? (hasTrip && can('place_edit', trip)),
    canAssign: canAssign ?? (hasTrip && can('day_edit', trip)),
  }
}