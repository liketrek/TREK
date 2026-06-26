import type { DistanceUnit } from '../types'

const KM_TO_MI = 0.621371

export function getDistanceUnitLabel(unit: DistanceUnit): 'km' | 'mi' {
  return unit === 'imperial' ? 'mi' : 'km'
}

export function convertDistance(km: number, unit: DistanceUnit): number {
  const safeKm = Number.isFinite(km) ? Math.max(0, km) : 0
  return unit === 'imperial' ? safeKm * KM_TO_MI : safeKm
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  const value = convertDistance(km, unit)
  const label = getDistanceUnitLabel(unit)
  const rounded = Math.round(value * 10) / 10
  const text = value > 0 && rounded === 0
    ? '<0.1'
    : rounded.toLocaleString(undefined, { maximumFractionDigits: 1 })
  return `${text} ${label}`
}
