import { localIsoDate } from './localDate'

export type JourneyLifecycle = 'archived' | 'live' | 'upcoming' | 'completed' | 'draft'

export type JourneyStatusOverride = 'draft' | 'live' | 'completed'

export function computeJourneyLifecycle(
  status: string,
  tripDateMin: string | null | undefined,
  tripDateMax: string | null | undefined,
  /** The owner's own pick (#762); wins over the dates, never over archived. */
  override?: string | null,
): JourneyLifecycle {
  if (status === 'archived') return 'archived'
  if (override === 'draft' || override === 'live' || override === 'completed') return override

  if (tripDateMin && tripDateMax) {
    const today = localIsoDate()
    if (tripDateMin <= today && today <= tripDateMax) return 'live'
    if (tripDateMin > today) return 'upcoming'
    return 'completed'
  }

  if (!tripDateMin && !tripDateMax) {
    return 'draft'
  }

  // Single boundary: only start or only end
  if (tripDateMin && !tripDateMax) {
    const today = localIsoDate()
    return tripDateMin > today ? 'upcoming' : 'live'
  }
  if (!tripDateMin && tripDateMax) {
    const today = localIsoDate()
    return tripDateMax < today ? 'completed' : 'live'
  }

  return 'completed'
}
