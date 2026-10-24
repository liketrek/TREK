import { MAX_WAY_PINS, pinWay, type PinnedWay, type WayPin } from '@trek/shared'
import type { RoadLine } from '../Map/RouteCalculator'
import { isStoredStop, type RouteSegment } from '@trek/shared/roadtrip'
import type { RailLegRoute, RailLegRouter, RoadtripDay, RoadtripStop } from './useRoadtripRoutes'
import type { OfferedRoute, RailDrive, ViaAnchor } from './useRouteAlternatives'

/** The most points one choice may pin to the road (see `MAX_WAY_PINS`). */
export const MAX_PINS = MAX_WAY_PINS

/** A point a choice is held by, in the order the chosen road drives through them. */
export type Pin = WayPin

/** Whether the rail's router drives an offer, and the pins that make it do so. */
export type PinProof = PinnedWay<RailLegRoute>

/**
 * The fewest points that make the rail's own router drive `offer`, found by asking it.
 *
 * A choice used to be stored as one via at the point where the offer strayed furthest,
 * and nobody asked whether the router then drove the offer. Often it did not. A point on
 * a ferry is pulled to the nearest pier by OSRM, which never boards one, so Amsterdam to
 * Newcastle "without the motorway" came back as a thousand kilometres through Calais. So
 * the check is the router itself, the way `pinWay` asks it; the spacing between the
 * requests is the router's own (`RailLegRouter.route`). The server asks the same way for
 * the ways of a hike's leg.
 */
export async function pinAlternative({
  offer,
  current,
  route,
  signal,
  maxPins = MAX_PINS,
}: {
  offer: OfferedRoute
  /** The road the rail drives now; the first pin is where the offer leaves it furthest. */
  current: RoadLine | undefined
  route: RailLegRouter['route']
  signal: AbortSignal
  maxPins?: number
}): Promise<PinProof> {
  const proof = await pinWay({ offer, current, route: (pins) => route(pins, signal), signal, maxPins })
  if (!proof) throw new DOMException('The check was abandoned', 'AbortError')
  return proof
}

/**
 * The way out of a refusal, where there is one, worded by `t`; null where there is none.
 *
 * A crossing by ferry is a booking, and the drive follows a booked ferry from terminal to
 * terminal. A way offered because it leaves a class of road out is driven once the trip
 * avoids that class: without it the router holds such a way only as far as a few pins
 * reach, and on a long leg takes the class back between them, so the choice was refused
 * after seconds of checking with no word on what would work.
 */
export function refusalHint(
  offer: Pick<OfferedRoute, 'hasFerry' | 'avoids'>,
  last: Pick<RailLegRoute, 'hasFerry'>,
  t: (key: string, params?: Record<string, string | number>) => string,
): string | null {
  if (offer.hasFerry && !last.hasFerry) return t('roadtrip.alt.ferryNotHeld')
  if (!offer.avoids) return null
  return t('roadtrip.alt.avoidNotHeld', { class: t(`roadtrip.avoid.${offer.avoids}`), setting: t('roadtrip.avoid.section') })
}

/**
 * The leg the rail drives from the stop filed at `anchor` now, or null when no stop sits
 * there any more.
 *
 * Read across every day in order, so the stop after it is found whether the leg runs
 * inside one card or across to the next. The caller hands in the days with a single stop
 * too: they draw no card, but the drive into the day after one leaves from its stop. The
 * markers an automatic night puts on the chain stand on or between stops without being
 * one, and a terminal or a booked night at a day's edge borrows the index of a stored stop
 * to be seated by, so none of them can answer for the anchor.
 */
export function railLegAt(days: readonly Pick<RoadtripDay, 'stops'>[], anchor: ViaAnchor): { from: RoadtripStop; to: RoadtripStop } | null {
  const chain = days.flatMap(day => day.stops).filter(stop => !stop.automaticNight)
  const at = chain.findIndex(stop => isStoredStop(stop) && stop.ownerDayId === anchor.dayId && stop.ownerIndex === anchor.afterIndex)
  const to = at >= 0 ? chain[at + 1] : undefined
  return to ? { from: chain[at], to } : null
}

/** One drive on a card as the rail has it: its two stops, its road and the line it is drawn on. */
export interface RailDriveOnCard {
  from: RoadtripStop
  to: RoadtripStop
  seg: RouteSegment
  line: [number, number][] | undefined
}

/**
 * The drive `drive` names on `day`, or null while the card has no such drive or no road
 * for it yet.
 *
 * A leg runs from stop `index` to the next one. The drive arriving at the head of a
 * connected card has no index on it: it leaves the last stop of the day before, which the
 * card keeps as `arrivingFrom`, and ends at the card's first stop. Read here once, so the
 * picker is handed the same two stops, figures and line whichever of the two it opens on.
 */
export function railDriveOn(day: RoadtripDay, drive: RailDrive): RailDriveOnCard | null {
  const found = drive.kind === 'arriving'
    ? { from: day.arrivingFrom, to: day.stops[0], seg: day.arrivingLeg, line: day.arrivingLine }
    : { from: day.stops[drive.index], to: day.stops[drive.index + 1], seg: day.legs[drive.index], line: day.legLines?.[drive.index] }
  const { from, to, seg, line } = found
  return from && to && seg ? { from, to, seg, line } : null
}
