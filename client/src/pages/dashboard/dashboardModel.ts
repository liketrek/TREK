/**
 * Dashboard data model + pure helpers — shared by the data hook (useDashboard)
 * and the presentational components in DashboardPage. Kept free of React/IO so
 * both sides can import it without a cycle. Part of the FE "page = wiring
 * container + data hook" convention (see dashboard/README.md).
 */

export interface DashboardTrip {
  id: number
  title: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  cover_image?: string | null
  is_archived?: boolean
  is_owner?: boolean
  owner_username?: string
  day_count?: number
  place_count?: number
  shared_count?: number
  [key: string]: string | number | boolean | null | undefined
}

export interface Member { id: number; username: string; avatar_url?: string | null }
export interface Place {
  id: number; name: string; image_url: string | null; lat: number | null; lng: number | null
  google_place_id: string | null; osm_id: string | null
  category_color?: string | null; category_icon?: string | null
}
export interface HeroBundle { members: Member[]; places: Place[] }
export interface TravelStats { totalTrips?: number; totalDays?: number; totalPlaces?: number; totalDistanceKm?: number; countries?: string[] }
export interface UpcomingReservation {
  id: number; trip_id: number; title: string; type: string
  reservation_time?: string | null; day_date?: string | null
  location?: string | null; place_name?: string | null; trip_title?: string | null
}

export const MS_PER_DAY = 86400000

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T00:00:00'); d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / MS_PER_DAY)
}

export function getTripStatus(trip: DashboardTrip): 'ongoing' | 'today' | 'tomorrow' | 'future' | 'past' | null {
  const today = new Date().toISOString().split('T')[0]
  if (trip.start_date && trip.end_date && trip.start_date <= today && trip.end_date >= today) return 'ongoing'
  const until = daysUntil(trip.start_date)
  if (until === null) return null
  if (until === 0) return 'today'
  if (until === 1) return 'tomorrow'
  if (until > 1) return 'future'
  return 'past'
}

export function sortTrips(trips: DashboardTrip[]): DashboardTrip[] {
  const today = new Date().toISOString().split('T')[0]
  const rank = (t: DashboardTrip) => {
    if (t.start_date && t.end_date && t.start_date <= today && t.end_date >= today) return 0
    if (t.start_date && t.start_date >= today) return 1
    return 2
  }
  return [...trips].sort((a, b) => {
    const ra = rank(a), rb = rank(b)
    if (ra !== rb) return ra - rb
    const ad = a.start_date || '', bd = b.start_date || ''
    if (ra <= 1) return ad.localeCompare(bd)
    return bd.localeCompare(ad)
  })
}
