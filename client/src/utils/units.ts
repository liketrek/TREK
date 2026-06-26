import type { DistanceUnit } from '../types'

const KM_TO_MI = 0.621371
const M_TO_FT = 3.28084

export function getDistanceUnitLabel(unit: DistanceUnit): 'km' | 'mi' {
  return unit === 'imperial' ? 'mi' : 'km'
}

/** Formats an elevation in metres as feet for imperial, so it doesn't mix with mi distances. */
export function formatElevation(meters: number, unit: DistanceUnit): string {
  const safe = Number.isFinite(meters) ? meters : 0
  return unit === 'imperial' ? `${Math.round(safe * M_TO_FT)} ft` : `${Math.round(safe)} m`
}

export function convertDistance(km: number, unit: DistanceUnit): number {
  const safeKm = Number.isFinite(km) ? Math.max(0, km) : 0
  return unit === 'imperial' ? safeKm * KM_TO_MI : safeKm
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  const safeKm = Number.isFinite(km) ? Math.max(0, km) : 0
  // Metric keeps a metres reading below 1 km (e.g. "300 m"), matching the route
  // connectors; imperial has no sub-mile unit, so short hops just show "0.x mi".
  if (unit === 'metric' && safeKm < 1) {
    return `${Math.round(safeKm * 1000)} m`
  }
  const value = convertDistance(safeKm, unit)
  const label = getDistanceUnitLabel(unit)
  const rounded = Math.round(value * 10) / 10
  // String() keeps a '.' decimal regardless of locale, matching the rest of the app
  // (toFixed elsewhere) and avoiding "1,5 km" in non-English environments.
  const text = value > 0 && rounded === 0 ? '<0.1' : String(rounded)
  return `${text} ${label}`
}
