import { useCallback } from 'react'
import type { RoadtripPreferences } from '@trek/shared'
import { isStoredStop, type CarrierTerminal } from '@trek/shared/roadtrip'
import { projectOntoRoute, type CorridorHit } from '../../components/Roadtrip/corridor'
import { roadtripInsertion } from '../../components/Roadtrip/dayWindow'
import type { ManualStopTarget } from '../../components/Roadtrip/manualStop'
import type { RefuelCandidate } from '../../components/Roadtrip/refuelSuggestion'
import { insertIndexForAlong, refuelStopTypeFor, type DryPoint } from '../../components/Roadtrip/roadtripModel'
import type { PlannerBase } from './plannerTypes'
import type { PlannerDialogs } from './usePlannerDialogs'
import type { RoadtripFeed } from './useRoadtripFeed'

interface RoadtripDriveShapingOptions
  extends Pick<PlannerBase, 'trip' | 'can' | 'toast' | 't'>,
  Pick<PlannerDialogs, 'setStopDraft'>,
  Pick<RoadtripFeed, 'roadtripRoutes' | 'roadtripVias' | 'roadtripCorridor' | 'refuel'> {
  /** Read for the vehicle, which decides whether a refuel stop is a pump or a charger. */
  roadtripSettings: RoadtripPreferences
}

/**
 * Shaping the drawn drive: which stop a point on the road belongs behind, where a place
 * chosen by hand goes, adding, dragging and removing vias, asking for and accepting a
 * refuel stop, and a corridor hit dropped onto the route.
 *
 * Nothing here runs an effect, so where useTripPlanner calls it changes nothing.
 */
export function useRoadtripDriveShaping(options: RoadtripDriveShapingOptions) {
  const { trip, can, toast, t, roadtripSettings, setStopDraft, roadtripRoutes, roadtripVias, roadtripCorridor, refuel } = options
  /**
   * Which stop of which day a point belongs behind, measured along the drive.
   *
   * Shared by placing a via and by dragging one, because it is the same question both
   * times and the answer has to be recomputed both times. A drag used to send only the
   * new coordinates, so a via pulled past the stop it used to precede kept claiming the
   * earlier leg: the route then ran out to the point and back before carrying on, which
   * looks exactly like a drag that did nothing.
   */
  const anchorFor = useCallback((lat: number, lng: number, onlyDayId?: number) => {
    // `terminal` names the anchor when it is one end of a ride rather than a stored stop
    // (#2428). Nothing can be filed against a terminal: it stands in for no assignment,
    // so a via anchored to it would be stored at a position that belongs to the stop
    // after it and bend that stop's road instead. The callers decide what to refuse.
    //
    // `bookendLeg` says the drive leaves or reaches a booked night's hotel at the day's
    // edge, which files nothing either: the morning's hotel has no index of its own, and
    // the evening's drive is reached from the index that shapes the road into tomorrow.
    // `card` is where the point fell on the card it was measured on, the day and the index
    // of the stop before it there, -1 for the drive in before the card's first stop.
    type Anchor = {
      dayId: number
      afterIndex: number
      offRouteKm: number
      terminal: CarrierTerminal['role'] | null
      bookendLeg: boolean
      card: { dayId: number; index: number }
    }
    // A road the day drives twice, out of the hotel in the morning and past it again later,
    // is on the line twice, and the closer pass wins by metres at most. A pass that can
    // take a via beats one on the hotel's drive, which files nothing, by this much.
    const SAME_ROAD_KM = 0.03
    const beats = (c: Anchor, b: Anchor | null) => {
      if (!b) return true
      if (c.bookendLeg === b.bookendLeg) return c.offRouteKm < b.offRouteKm
      return c.bookendLeg ? c.offRouteKm + SAME_ROAD_KM < b.offRouteKm : c.offRouteKm <= b.offRouteKm + SAME_ROAD_KM
    }
    // Which stop of this card the point falls behind, for a hit measured on its line.
    const readAnchor = (day: (typeof roadtripRoutes.days)[number], hit: CorridorHit, stopsAlong: number[]): Anchor | null => {
      // Before the card's first stop means a drive that arrives here but leaves from a
      // stop on the card BEFORE this one: the incoming night drive (`nightSpill.ts`), or
      // on a trip with connected days the drive from where yesterday ended, which is drawn
      // at the head of this card in yesterday's colour. Anchoring either to this card's
      // first stop would file the via on the leg AFTER that stop, and the route would run
      // forward, double back to the point, and carry on.
      //
      // Asked of the distance rather than of the index, because the index cannot answer
      // it: `insertIndexForAlong` clamps to at least 1 for any list of two or more, and
      // the rail only ever publishes cards with two stops or more. Written against the
      // index this read as a guard and behaved as dead code, so a via dropped on the
      // night stretch went to the first drawn stop after all, which is the exact failure
      // the paragraph above describes.
      const arrivedFrom = day.spills?.find(sp => sp.at === 0)?.fromStop ?? day.arrivingFrom
      if (arrivedFrom && hit.alongKm < (stopsAlong[0] ?? 0)) {
        const owner = arrivedFrom.ownerDayId ?? day.dayId
        if (onlyDayId !== undefined && owner !== onlyDayId) return null
        return {
          dayId: owner,
          afterIndex: arrivedFrom.ownerIndex ?? 0,
          offRouteKm: hit.offRouteKm,
          terminal: arrivedFrom.carrier?.role ?? null,
          bookendLeg: !!arrivedFrom.bookend || !!day.stops[0]?.bookend,
          card: { dayId: day.dayId, index: -1 },
        }
      }
      const at = insertIndexForAlong(stopsAlong, hit.alongKm) - 1
      // Named by the day the anchor stop is STORED on and its position there, not by the
      // card and the position within it. A card is a date and can hold stops from the day
      // before (`nightSpill.ts`), so those two numbers differ on any day that received a
      // night drive, and a via filed under the card's numbers matches no stop when the
      // route is next built, which reads as a drag that did nothing at all.
      const anchor = day.stops[at]
      if (!anchor) return null
      // Falling back to the card's own numbers is not a guard against a bug, it is the
      // meaning: a stop that names no other day IS stored on the card it is drawn on,
      // which is every stop on a trip that never drives past midnight.
      const owner = anchor.ownerDayId ?? day.dayId
      // A drag stays on its own day; a fresh click may land wherever it landed.
      if (onlyDayId !== undefined && owner !== onlyDayId) return null
      return {
        dayId: owner,
        afterIndex: anchor.ownerIndex ?? at,
        offRouteKm: hit.offRouteKm,
        terminal: anchor.carrier?.role ?? null,
        bookendLeg: !!anchor.bookend || !!day.stops[at + 1]?.bookend,
        card: { dayId: day.dayId, index: at },
      }
    }
    let best: Anchor | null = null
    for (const day of roadtripRoutes.days) {
      // NOT `day.dayId !== onlyDayId`. A dragged via has to stay on the day it is stored
      // on, but that day's stops are no longer all on the card of the same name: after a
      // night drive they are drawn on the next one (`nightSpill.ts`). Filtering by card
      // measured the new position against a line that no longer covers those stops: a
      // point dragged near Brandenburg was projected onto the short remainder of card 1
      // and came back anchored to its last stop, which put the via on the night drive
      // itself and pushed the stop before it over midnight.
      //
      // So every card is measured, and the answer is filtered by the day the ANCHOR is
      // stored on. Same promise, kept against the stops rather than against the card.
      if (day.geometry.length < 2) continue
      const spine = day.geometry.map(([la, ln]) => ({ lat: la, lng: ln }))
      const hit = projectOntoRoute({ lat, lng }, spine)
      if (!hit) continue
      if (best && hit.offRouteKm >= best.offRouteKm + SAME_ROAD_KM) continue
      // Which stop the via follows: the last one the car passes before reaching it.
      const stopsAlong = day.stops.map(stop => projectOntoRoute({ lat: stop.lat, lng: stop.lng }, spine)?.alongKm ?? 0)
      let candidate = readAnchor(day, hit, stopsAlong)
      if (candidate?.bookendLeg) {
        // Landed on the drive to or from the hotel, a road the day can drive again between
        // two of its own stops. Asked once more of the stretch between the day's first and
        // last stop, and taken when that answer lies on the same road.
        const first = day.stops.findIndex(stop => !stop.bookend)
        const last = day.stops.length - 1 - [...day.stops].reverse().findIndex(stop => !stop.bookend)
        const fromKm = stopsAlong[first] ?? 0
        const toKm = stopsAlong[last] ?? 0
        const inner = first >= 0 && first < last && fromKm < toKm
          ? projectOntoRoute({ lat, lng }, spine, { fromKm, toKm })
          : null
        const retry = inner && inner.offRouteKm <= hit.offRouteKm + SAME_ROAD_KM ? readAnchor(day, inner, stopsAlong) : null
        if (retry && !retry.bookendLeg) candidate = retry
      }
      if (candidate && beats(candidate, best)) best = candidate
    }
    return best
  }, [roadtripRoutes.days])

  /**
   * Where a place chosen by hand belongs in the drive, as a card and a position in it.
   *
   * `anchorFor` answers in the space a via is STORED in: the day the anchor stop belongs
   * to, and its index there. A stop is placed at a position counted along the card it is
   * drawn on, which is the same thing on every day that does not drive past midnight and
   * a different one on the days that do (`nightSpill.ts`). Translating between the two
   * happens here, once, rather than at whichever surface asked.
   *
   * Deliberately with no distance limit, unlike `addRoadtripVia`: the place this answers
   * for is the charger the corridor search did not find, which is exactly the one sitting
   * further off the drawn line than a via is allowed to be. The projection is the default
   * the dialog offers, never a gate it applies.
   */
  const manualStopTargetFor = useCallback((lat: number, lng: number): ManualStopTarget | null => {
    const anchor = anchorFor(lat, lng)
    // Nothing is stopped at on a flight. Behind an arrival terminal or a hire car's desk
    // is a road, and a stop there is the first stop after landing or after the pick-up.
    if (!anchor || anchor.terminal === 'departure') return null
    // Behind a terminal, and on the drive from the hotel a day sets out from or to the one
    // it ends at, the place goes where it fell on the card. None of them is a stored stop
    // to be found by its index, which each shares with one: after the morning's hotel is
    // before the day's first stop, before the evening's is after its last.
    if (anchor.bookendLeg || anchor.terminal) {
      return { dayId: anchor.card.dayId, position: anchor.card.index + 1, offRouteKm: anchor.offRouteKm }
    }
    for (const day of roadtripRoutes.days) {
      // The stored stop the anchor names, not a terminal or a hotel seated in front of it
      // with the same index, which put the place one stop early.
      const at = day.stops.findIndex(stop => isStoredStop(stop) && stop.ownerDayId === anchor.dayId && stop.ownerIndex === anchor.afterIndex)
      if (at >= 0) return { dayId: day.dayId, position: at + 1, offRouteKm: anchor.offRouteKm }
    }
    // No card draws that stop, which happens while the rail is between rebuilds. Its own
    // numbers are the best answer there is, and `roadtripInsertion` measures them against
    // the card again when the stop actually lands.
    return { dayId: anchor.dayId, position: anchor.afterIndex + 1, offRouteKm: anchor.offRouteKm }
  }, [anchorFor, roadtripRoutes.days])

  /**
   * A click on the drawn route puts a via there, and the drive is redrawn through it.
   *
   * Which pair of stops it belongs between comes from projecting the click onto the
   * day's routed geometry, the same measurement the corridor search uses, so "after the
   * third stop" means the same thing everywhere. The day is the one whose line was hit,
   * found by trying each day's geometry and keeping the closest.
   */
  const addRoadtripVia = useCallback(async (lat: number, lng: number) => {
    if (!can('day_edit', trip)) return
    const best = anchorFor(lat, lng)
    // A click that landed on some other line is not a via anywhere. Neither is one on a
    // ride, or on the road out of a terminal: a via is filed by the position of a stored
    // stop, and a terminal is not one.
    if (!best || best.offRouteKm > 2 || best.terminal) return
    // Nor on the drive from or to a booked night's hotel, which says so rather than
    // ignoring the click (`legReroutable`).
    if (best.bookendLeg) { toast.info(t('roadtrip.bookend.noVia')); return }
    try {
      await roadtripVias.add(best.dayId, best.afterIndex, lat, lng)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [anchorFor, roadtripVias, can, trip, toast, t])

  /** Dragging a via redraws the route through its new position. */
  const moveRoadtripVia = useCallback(async (dayId: number, id: number, lat: number, lng: number) => {
    if (!can('day_edit', trip)) return
    // Measured against this day only. A drag is a drag WITHIN a day: letting the nearest
    // day win, the way placing one does, would hand the via to a neighbouring day whose
    // road happens to pass closer, and it would vanish from the day it was dragged in.
    //
    // No distance guard either. Dragging a via well off the current road is the whole
    // point of dragging it, and refusing that would be refusing the gesture; the anchor
    // just says which leg gets bent, and the router answers the rest.
    const anchor = anchorFor(lat, lng, dayId)
    try {
      await roadtripVias.move(dayId, id, lat, lng, anchor && !anchor.terminal && !anchor.bookendLeg ? anchor.afterIndex : undefined)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [anchorFor, roadtripVias, can, trip, toast, t])

  /**
   * Somewhere to fill up before this tank runs out.
   *
   * Measured against the day's DRIVING line, the same one the dry point was placed on, so
   * a station's distance along the road is comparable with the distance the fuel lasts.
   * The day's own places go in as well: a pump already on the plan should not be offered
   * beside itself.
   */
  const askRefuel = useCallback((dayId: number, dry: DryPoint & { lat: number; lng: number }) => {
    const day = roadtripRoutes.days.find(d => d.dayId === dayId)
    if (!day) return
    const line = (dry.inboundLine ?? day.drivingGeometry ?? day.geometry).map(([lat, lng]) => ({ lat, lng }))
    if (line.length < 2) return
    const vehicle = roadtripSettings.roadtrip_vehicle
    const refuelTypes = refuelStopTypeFor(vehicle === 'electric' || vehicle === 'combustion' ? vehicle : null)
    let fromAlongKm = 0
    let drivenKm = 0
    for (let i = 0; i <= dry.legIndex; i++) {
      if (refuelTypes.includes(day.stops[i]?.stopType as 'fuel' | 'charging')) fromAlongKm = drivenKm
      const leg = day.legs[i]
      if (leg?.mode === 'driving') drivenKm += (leg.distance ?? 0) / 1000
    }
    void refuel.ask(
      `${dayId}:${dry.legIndex}`,
      { lat: dry.lat, lng: dry.lng },
      line,
      dry.drivenMeters / 1000,
      day.stops.map(stop => ({ lat: stop.lat, lng: stop.lng })),
      fromAlongKm,
    )
  }, [roadtripRoutes.days, refuel, roadtripSettings.roadtrip_vehicle])

  /**
   * Accepting one hands it to the same popup a corridor hit goes through.
   *
   * Deliberately not a direct write: the popup is where the stop kind and the time spent
   * are decided, it defaults both from the category, and every step after it (the place,
   * the assignment at the right position, the via re-anchoring, the re-route) is already
   * correct there and pinned by tests. A second path to the same end would be a second
   * place for it to go wrong.
   */
  const acceptRefuel = useCallback((dayId: number, poi: RefuelCandidate, dry: DryPoint & { lat: number; lng: number }) => {
    if (!can('day_edit', trip)) return
    const day = roadtripRoutes.days.find(d => d.dayId === dayId)
    if (!day) return
    // Before the stop the tank would have run out on, which is the leg the dry point
    // names. A station reached after the day's last stop is tomorrow's problem, and
    // clamping it onto the final leg would re-route the arrival through it.
    let drivenKm = 0
    const stationLeg = day.legs.findIndex(leg => {
      if (leg?.mode !== 'driving') return false
      drivenKm += (leg.distance ?? 0) / 1000
      return poi.alongKm <= drivenKm
    })
    const at = dry.inboundLine ? -dry.legIndex - 1 : Math.min((stationLeg >= 0 ? stationLeg : dry.legIndex) + 1, day.stops.length - 1)
    // That index counts along the CARD, and after a night drive a card is not one stored
    // day: its first stops belong to yesterday. The new stop goes in front of the one it
    // was measured against, so it is that stop's own day and position that place it.
    // Written against the card's day it would land in the wrong list, at an index that
    // means something else there.
    const anchor = day.stops[at]
    if (!anchor) return
    refuel.close()
    setStopDraft({ poi, ...roadtripInsertion(day, at)!, dayNumber: day.dayNumber })
  }, [roadtripRoutes.days, refuel, can, trip, setStopDraft])

  /** Removing a via lets the drive take the direct road again. */
  const removeRoadtripVia = useCallback(async (dayId: number, id: number) => {
    if (!can('day_edit', trip)) return
    try {
      await roadtripVias.remove(dayId, id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [roadtripVias, can, trip, toast, t])

  /**
   * A corridor hit dropped on the map, placed where it was dropped rather than where the
   * corridor projected it.
   *
   * The two differ whenever a drive passes near the same spot twice (a loop, an
   * out-and-back), and the automatic projection can only pick one of them. Dropping says
   * which, and the drop coordinate is projected onto the same routed line the hits were
   * measured along, so the answer is in the same units as everything else.
   *
   * A drop nowhere near the drive is ignored rather than guessed at: adding a stop
   * fifty kilometres off the route because the pointer slipped is worse than nothing
   * happening.
   */
  const dropPoiOnRoute = useCallback((osmId: string, lat: number, lng: number) => {
    if (!can('place_edit', trip)) return
    const hit = roadtripCorridor.visible.find(p => p.osm_id === osmId)
    const day = roadtripCorridor.day
    if (!hit || !day) return
    const at = projectOntoRoute({ lat, lng }, roadtripCorridor.search.spine)
    if (!at || at.offRouteKm > roadtripCorridor.widthKm) return
    const insert = roadtripInsertion(day, roadtripCorridor.insertIndexFor(at))
    if (!insert) return
    setStopDraft({
      poi: hit,
      ...insert,
      dayNumber: day.dayNumber,
    })
  }, [roadtripCorridor, can, trip, setStopDraft])

  return { manualStopTargetFor, addRoadtripVia, moveRoadtripVia, removeRoadtripVia, askRefuel, acceptRefuel, dropPoiOnRoute }
}

export type RoadtripDriveShaping = ReturnType<typeof useRoadtripDriveShaping>
