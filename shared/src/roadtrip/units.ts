import type { DistanceUnit } from './planning-types';

const KM_TO_MI = 0.621371;
const M_TO_FT = 3.28084;

export function getDistanceUnitLabel(unit: DistanceUnit): 'km' | 'mi' {
  return unit === 'imperial' ? 'mi' : 'km';
}

export function formatElevation(meters: number, unit: DistanceUnit): string {
  const safe = Number.isFinite(meters) ? meters : 0;
  return unit === 'imperial' ? `${Math.round(safe * M_TO_FT)} ft` : `${Math.round(safe)} m`;
}

export function convertDistance(km: number, unit: DistanceUnit): number {
  const safeKm = Number.isFinite(km) ? Math.max(0, km) : 0;
  return unit === 'imperial' ? safeKm * KM_TO_MI : safeKm;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  const safeKm = Number.isFinite(km) ? Math.max(0, km) : 0;

  if (unit === 'metric' && safeKm < 1) {
    return `${Math.round(safeKm * 1000)} m`;
  }
  const value = convertDistance(safeKm, unit);
  const label = getDistanceUnitLabel(unit);
  const rounded = Math.round(value * 10) / 10;

  const text = value > 0 && rounded === 0 ? '<0.1' : String(rounded);
  return `${text} ${label}`;
}
