import { Fuel, Zap, ParkingSquare, Tent, Utensils, Camera, BedDouble, type LucideIcon } from 'lucide-react'
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

/**
 * A category the corridor search offers, which is not the same question as a stop kind.
 *
 * Every stop kind is a category, but not every category is a stop kind: somewhere to
 * sleep is something the search can find, and staying there ends the day rather than
 * interrupting the drive. A hotel therefore keeps its number in the chain and gets a row
 * in `day_accommodations`; it never becomes a `stop_type`.
 */
export interface CorridorCategory {
  key: string
  labelKey: string
  Icon: LucideIcon
  color: string
  /** The kind a hit of this category becomes, or null when it becomes something else. */
  stopKind: RoadtripStopType | null
}

/** Somewhere to sleep. Blue rather than the campsite's green: both are a night, but one
 * of them has a roof, and telling the two apart on a map matters more than grouping them.
 * theme-lint-disable — the road-signage palette, shared with the general place search so
 * a hotel found along a route looks like the hotels found anywhere else. */
export const HOTEL_COLOR = '#2563EB'

/**
 * The categories, in the order the panel shows them.
 *
 * Written out rather than derived, because the order is a judgement: sleeping sits next
 * to sleeping, so `hotel` follows `campsite` instead of landing wherever the stop-kind
 * table happens to end.
 */
export const CORRIDOR_CATEGORIES: CorridorCategory[] = [
  ...STOP_KINDS.filter(k => k.isCorridorCategory && k.key !== 'restaurant' && k.key !== 'sights')
    .map(k => ({ key: k.key as string, labelKey: k.labelKey, Icon: k.Icon, color: k.color, stopKind: k.key })),
  { key: 'hotel', labelKey: 'poi.cat.hotels', Icon: BedDouble, color: HOTEL_COLOR, stopKind: null },
  ...STOP_KINDS.filter(k => k.key === 'restaurant' || k.key === 'sights')
    .map(k => ({ key: k.key as string, labelKey: k.labelKey, Icon: k.Icon, color: k.color, stopKind: k.key })),
]

export const CORRIDOR_CATEGORY_BY_KEY: Record<string, CorridorCategory> = Object.fromEntries(
  CORRIDOR_CATEGORIES.map(c => [c.key, c]),
)

/** The keys the corridor search offers, in the order the panel shows them. */
export const CORRIDOR_CATEGORY_KEYS = CORRIDOR_CATEGORIES.map(c => c.key)

/** Categories whose hit becomes a night rather than a pause. */
export function isOvernightCategory(category: string | null | undefined): boolean {
  // Campsite is both: it is a service stop today and stays one, but a night can be
  // booked there just as well, so the popup offers the choice rather than deciding.
  return category === 'hotel' || category === 'campsite'
}

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
