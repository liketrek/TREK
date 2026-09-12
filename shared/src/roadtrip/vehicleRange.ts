import type { VehicleKind } from './roadtripModel';

export interface VehicleSpec {
  tankLitres?: number | null;

  litresPer100?: number | null;

  batteryKwh?: number | null;

  kwhPer100?: number | null;

  degradationPercent?: number | null;
}

function positive(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function atLeastAKilometre(km: number): number | null {
  return km >= 1 ? km : null;
}

export function rangeFromSpec(vehicle: VehicleKind | null | undefined, spec: VehicleSpec): number | null {
  if (vehicle === 'combustion') {
    const tank = positive(spec.tankLitres);
    const per100 = positive(spec.litresPer100);
    if (!tank || !per100) return null;
    return atLeastAKilometre(Math.round((tank / per100) * 100));
  }

  if (vehicle === 'electric') {
    const battery = positive(spec.batteryKwh);
    const per100 = positive(spec.kwhPer100);
    if (!battery || !per100) return null;

    const lost = Math.min(90, Math.max(0, positive(spec.degradationPercent) ?? 0));
    const usable = battery * (1 - lost / 100);
    return atLeastAKilometre(Math.round((usable / per100) * 100));
  }

  return null;
}

export function effectiveRangeKm(
  vehicle: VehicleKind | null | undefined,
  spec: VehicleSpec,
  typedKm: number | null | undefined,
): number | null {
  return rangeFromSpec(vehicle, spec) ?? positive(typedKm);
}

export type SpecKey = keyof VehicleSpec;

const LITRES_PER_GALLON = 3.785411784;

const MPG_PRODUCT = 235.214583;
const KM_PER_MILE = 1.609344;

export function specUnit(key: SpecKey, imperial: boolean): string {
  switch (key) {
    case 'tankLitres':
      return imperial ? 'gal' : 'L';
    case 'litresPer100':
      return imperial ? 'mpg' : 'L/100 km';
    case 'batteryKwh':
      return 'kWh';
    case 'kwhPer100':
      return imperial ? 'kWh/100 mi' : 'kWh/100 km';
    default:
      return '%';
  }
}

function places(key: SpecKey, imperial: boolean): number {
  if (key === 'degradationPercent') return 0;
  if (key === 'tankLitres') return imperial ? 1 : 0;
  if (key === 'litresPer100') return imperial ? 0 : 1;
  return 1;
}

function convert(key: SpecKey, value: number, imperial: boolean, toStorage: boolean): number {
  if (!imperial) return value;
  switch (key) {
    case 'tankLitres':
      return toStorage ? value * LITRES_PER_GALLON : value / LITRES_PER_GALLON;

    case 'litresPer100':
      return MPG_PRODUCT / value;
    case 'kwhPer100':
      return toStorage ? value / KM_PER_MILE : value * KM_PER_MILE;
    default:
      return value;
  }
}

function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function showSpec(key: SpecKey, stored: number | null | undefined, imperial: boolean): number | undefined {
  const value = positive(stored);
  if (value === null) return undefined;
  return round(convert(key, value, imperial, false), places(key, imperial));
}

export function storeSpec(key: SpecKey, shown: number, imperial: boolean): number {
  if (!(shown > 0)) return 0;
  return round(convert(key, shown, imperial, true), 2);
}
