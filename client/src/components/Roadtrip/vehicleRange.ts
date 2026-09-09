import type { VehicleKind } from './roadtripModel'

/**
 * How far the vehicle goes on one fill, worked out from what it is made of.
 *
 * Two ways to the same number, and the point of having both is that people know their
 * car in different ways. Some know "about 600 km"; some know the tank holds 55 litres
 * and it does 7 per hundred, and would have to do the division themselves. Whoever types
 * a range directly still gets exactly what they typed — this only fills that number in
 * when it can and the field is empty.
 *
 * Deliberately not a consumption model. ABRP asks for reference speed, relative speed and
 * a drive profile because it predicts a specific drive; this answers "how far on one
 * fill", which is a division. Adding speed terms would make the number look precise
 * without making it right, since the biggest factor by far is how the person drives.
 *
 * Pure: no React, no store, no network.
 */

export interface VehicleSpec {
  /** Litres the tank holds. Petrol only. */
  tankLitres?: number | null
  /** Litres per 100 km. Petrol only. */
  litresPer100?: number | null
  /** Usable battery when new, in kWh. Electric only. */
  batteryKwh?: number | null
  /** kWh per 100 km. Electric only. */
  kwhPer100?: number | null
  /**
   * How much of the battery the years have taken, as a percentage.
   *
   * A five-year-old car does not carry the capacity on its data sheet, and the gap is
   * the difference between arriving and not on the last leg of a day.
   */
  degradationPercent?: number | null
}

/** A positive, finite number, or null. Everything here comes from a text field. */
function positive(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/**
 * The range in kilometres that the parts add up to, or null when they do not add up.
 *
 * Null rather than a guess whenever a piece is missing: half a specification is not a
 * range, and a made-up figure here becomes a fuel warning that fires at the wrong place.
 */
export function rangeFromSpec(vehicle: VehicleKind | null | undefined, spec: VehicleSpec): number | null {
  if (vehicle === 'combustion') {
    const tank = positive(spec.tankLitres)
    const per100 = positive(spec.litresPer100)
    if (!tank || !per100) return null
    return Math.round((tank / per100) * 100)
  }

  if (vehicle === 'electric') {
    const battery = positive(spec.batteryKwh)
    const per100 = positive(spec.kwhPer100)
    if (!battery || !per100) return null
    // Degradation only ever takes away, and never all of it: a battery reported as 100 %
    // gone is a typo, not a car, and dividing by zero range would put the dry point at
    // the first metre of the trip.
    const lost = Math.min(90, Math.max(0, positive(spec.degradationPercent) ?? 0))
    const usable = battery * (1 - lost / 100)
    return Math.round((usable / per100) * 100)
  }

  return null
}

/**
 * The range to plan with: what the parts say, or what was typed, in that order.
 *
 * The computed one wins because it is the more specific answer — somebody who filled in
 * a tank size and a consumption said something more exact than a round number, and the
 * dialog shows them the result so it is never a surprise.
 */
export function effectiveRangeKm(
  vehicle: VehicleKind | null | undefined,
  spec: VehicleSpec,
  typedKm: number | null | undefined,
): number | null {
  return rangeFromSpec(vehicle, spec) ?? positive(typedKm)
}

/**
 * The unit each field is typed in, per measurement system.
 *
 * Storage is always metric, exactly as the range itself is always kilometres: an imperial
 * traveller who typed 15 into a field labelled "gallons" must not have 15 litres stored,
 * or every warning after it fires at a quarter of the right distance.
 *
 * The imperial pair is not a straight translation of the metric one. Fuel economy is
 * quoted as miles per gallon, which is the INVERSE of litres per hundred, while electric
 * economy is quoted by the EPA as kWh per 100 miles, which is not. Forcing one shape onto
 * both would leave one of the two reading as a figure nobody recognises.
 */
export type SpecKey = keyof VehicleSpec

const LITRES_PER_GALLON = 3.785411784
/** litres/100 km × mpg = this. The one constant that makes the inversion exact. */
const MPG_PRODUCT = 235.214583
const KM_PER_MILE = 1.609344

export function specUnit(key: SpecKey, imperial: boolean): string {
  switch (key) {
    case 'tankLitres': return imperial ? 'gal' : 'L'
    case 'litresPer100': return imperial ? 'mpg' : 'L/100 km'
    case 'batteryKwh': return 'kWh'
    case 'kwhPer100': return imperial ? 'kWh/100 mi' : 'kWh/100 km'
    default: return '%'
  }
}

/** How many decimals the field is worth typing. A tank is not measured to a tenth. */
function places(key: SpecKey, imperial: boolean): number {
  if (key === 'degradationPercent') return 0
  if (key === 'tankLitres') return imperial ? 1 : 0
  if (key === 'litresPer100') return imperial ? 0 : 1
  return 1
}

function convert(key: SpecKey, value: number, imperial: boolean, toStorage: boolean): number {
  if (!imperial) return value
  switch (key) {
    case 'tankLitres': return toStorage ? value * LITRES_PER_GALLON : value / LITRES_PER_GALLON
    // Inverse in both directions, which is why one expression covers the pair.
    case 'litresPer100': return MPG_PRODUCT / value
    case 'kwhPer100': return toStorage ? value / KM_PER_MILE : value * KM_PER_MILE
    default: return value
  }
}

function round(value: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** The stored figure as it should appear in the field, or undefined when there is none. */
export function showSpec(key: SpecKey, stored: number | null | undefined, imperial: boolean): number | undefined {
  const value = positive(stored)
  if (value === null) return undefined
  return round(convert(key, value, imperial, false), places(key, imperial))
}

/**
 * A typed figure as it should be stored. Zero comes back as zero, meaning "not said".
 *
 * Two decimals rather than none: a gallon is 3.79 litres, so an imperial figure that
 * round-tripped through a whole number would drift by up to half a litre and show the
 * traveller a different number than the one they typed.
 */
export function storeSpec(key: SpecKey, shown: number, imperial: boolean): number {
  if (!(shown > 0)) return 0
  return round(convert(key, shown, imperial, true), 2)
}
