import { Fuel, Zap, ParkingSquare, Tent, Utensils, Camera, type LucideIcon } from 'lucide-react'
import { SERVICE_COLORS, SERVICE_STOP_TYPES } from './roadtripModel'
import type { RoadtripStopType } from '@trek/shared'

/**
 * One row per kind of stop a drive can have, and the only place a new one is added.
 *
 * The six kinds used to be written out in nine separate lists: the enum in `@trek/shared`,
 * `SERVICE_STOP_TYPES` and `SERVICE_COLORS` here in the model, the corridor's category
 * keys, the map's `ROADTRIP_POI_CATEGORIES`, the popup's own `STOP_KINDS`, two lookups in
 * the rail, one in the map markers and one in the corridor panel. Every one of those
 * carried a comment telling the next person to keep the others in step, and it still came
 * apart: a rest area was a parking sign in the popup, on the map pill and in the panel,
 * and a coffee cup on the rail disc and the map marker, for the same stop. That is fixed
 * here in favour of the parking sign, because the colour is already documented as "the
 * blue every parking sign in Europe is printed in".
 *
 * The table lives beside the model rather than in it because an icon is a React component
 * and `roadtripModel.ts` is deliberately free of React so it can be unit tested on its
 * own. The colours and the service list stay there and are read from here.
 *
 * `isService` and `isCorridorCategory` are not the same question, and a coming lodging
 * kind is why they are separate: the corridor can find a hotel, but sleeping somewhere
 * ends the day rather than interrupting the drive, so it would be a category without
 * being a service stop.
 */
export interface StopKind {
  key: RoadtripStopType
  /** Two of the six do not match their key: `rest_area` is named under `rest`, `restaurant` under `food`. */
  labelKey: string
  Icon: LucideIcon
  color: string
  /** What the popup offers before anyone changes it — how long this kind usually takes. */
  defaultMinutes: number
  /** Interrupts the drive: drawn on the dashed line, no number, left out of every stop count. */
  isService: boolean
  /** Offered as a category in the corridor search. */
  isCorridorCategory: boolean
}

export const STOP_KINDS: StopKind[] = [
  { key: 'fuel', labelKey: 'roadtrip.poi.fuel', Icon: Fuel, color: SERVICE_COLORS.fuel, defaultMinutes: 10, isService: true, isCorridorCategory: true },
  { key: 'charging', labelKey: 'roadtrip.poi.charging', Icon: Zap, color: SERVICE_COLORS.charging, defaultMinutes: 30, isService: true, isCorridorCategory: true },
  { key: 'rest_area', labelKey: 'roadtrip.poi.rest', Icon: ParkingSquare, color: SERVICE_COLORS.rest_area, defaultMinutes: 20, isService: true, isCorridorCategory: true },
  { key: 'campsite', labelKey: 'roadtrip.poi.campsite', Icon: Tent, color: SERVICE_COLORS.campsite, defaultMinutes: 60, isService: true, isCorridorCategory: true },
  { key: 'restaurant', labelKey: 'roadtrip.poi.food', Icon: Utensils, color: SERVICE_COLORS.restaurant, defaultMinutes: 45, isService: true, isCorridorCategory: true },
  { key: 'sights', labelKey: 'roadtrip.poi.sights', Icon: Camera, color: SERVICE_COLORS.sights, defaultMinutes: 30, isService: true, isCorridorCategory: true },
]

/** By key, for the lookups the rail, the markers and the panel used to keep themselves. */
export const STOP_KIND_BY_KEY: Record<string, StopKind> = Object.fromEntries(
  STOP_KINDS.map(k => [k.key, k]),
)

/** The categories the corridor search offers, in the order the panel shows them. */
export const CORRIDOR_CATEGORY_KEYS = STOP_KINDS.filter(k => k.isCorridorCategory).map(k => k.key)

/**
 * A guard against the drift this file exists to end.
 *
 * `SERVICE_STOP_TYPES` is the model's own list and stays there, because the arithmetic
 * must not depend on anything that imports React. The two are checked against each other
 * in `stopKinds.test.ts` rather than derived, so a kind added to one and forgotten in the
 * other fails a test instead of quietly counting as a destination.
 */
export const SERVICE_KIND_KEYS = STOP_KINDS.filter(k => k.isService).map(k => k.key)

/** The kinds where a tank or a battery is filled, so a range budget starts over. */
export const REFUELLING_STOP_TYPES = ['fuel', 'charging'] as const

export { SERVICE_STOP_TYPES }
