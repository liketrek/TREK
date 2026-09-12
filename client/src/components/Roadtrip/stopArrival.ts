import { formatClock, parseClock } from './roadtripModel'
import type { RoadtripDay } from '@trek/shared/roadtrip'

export function stopArrival(day: RoadtripDay, index: number, alongKm: number): string | null {
  if (index === 0) return day.schedule.entries[0]?.arrival ?? null
  const departure = parseClock(day.schedule.entries[index - 1]?.departure)
  const leg = day.legs[index - 1]
  if (departure === null || !leg) return null
  const before = day.legs.slice(0, index - 1)
  if (before.some(leg => !leg)) return null
  const distanceBefore = before.reduce((total, leg) => total + leg!.distance, 0)
  const fraction = leg.distance > 0 ? Math.max(0, Math.min(1, (alongKm * 1000 - distanceBefore) / leg.distance)) : 0
  return formatClock(Math.round(departure + leg.duration / 60 * fraction))
}
