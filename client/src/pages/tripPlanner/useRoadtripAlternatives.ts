import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { viasLeaving } from '@trek/shared/roadtrip'
import { alternativesBusy, buildAlternativeOverlays } from '../../components/Roadtrip/alternativeOverlays'
import { pinAlternative, railDriveOn, railLegAt, refusalHint, type PinProof } from '../../components/Roadtrip/alternativePins'
import { useAutomaticDayPoints } from '../../components/Roadtrip/useAutomaticDayPoints'
import { openOn, useRouteAlternatives, type RailDrive } from '../../components/Roadtrip/useRouteAlternatives'
import type { PlannerBase } from './plannerTypes'
import type { RoadtripFeed } from './useRoadtripFeed'

interface RoadtripAlternativesOptions
  extends Pick<PlannerBase, 'toast' | 't'>,
  Pick<RoadtripFeed, 'roadtripActive' | 'roadtripFeedActive' | 'roadtripRoutes' | 'roadtripVias' | 'refuel' | 'collapsedRoadtripDays'> {
  isMobile: boolean
  activeTab: string
}

/**
 * The other ways of driving one leg and what the road trip map frames: the routes on
 * offer and the one the pointer is on, their overlays and the stretch they cover, the
 * automatic day points and their markers, and asking for and choosing an alternative.
 *
 * Its effects run where useTripPlanner calls it, after the road trip feed's, in the
 * order they always had.
 */
export function useRoadtripAlternatives(options: RoadtripAlternativesOptions) {
  const {
    t, toast, isMobile, activeTab, roadtripActive, roadtripFeedActive, roadtripRoutes, roadtripVias, refuel,
    collapsedRoadtripDays,
  } = options
  const routeAlternatives = useRouteAlternatives()
  /**
   * Which offered route the pointer is on, so the map can light that one up.
   *
   * Lives here rather than in the bar because the map draws it and the bar reports it:
   * neither owns it, and passing it through the page would put state in a wiring
   * container the Page pattern keeps stateless.
   */
  const [highlightedAlternative, setHighlightedAlternative] = useState<number | null>(null)
  // Closing the picker has to clear it, or the next one opens with a road already lit.
  useEffect(() => {
    if (!routeAlternatives.open) setHighlightedAlternative(null)
  }, [routeAlternatives.open])

  // Leaving road trip mode closes it too. The switch sits in the left sidebar and
  // is reachable while the bar is open over the map, and the overlay depends only
  // on the picker, so flipping the mode off left pale blue alternatives, their
  // casings and their drive-time pills drawn on an ordinary planner map, with no
  // road trip UI left to dismiss them from.
  //
  // The gate is where the picker can be seen, not the mode. `roadtripActive` is false
  // on a phone by design (see `roadtripMode` in useTripPlanner), so gating on it alone
  // closed a picker the phone had just opened, on the very next render. On the phone the
  // picker lives on the drive tab, so it stays open there and closes once the tab is
  // left. At desk width `isMobile` is false and this is exactly `roadtripActive`, as it
  // always was.
  const alternativesShown = roadtripActive || (isMobile && roadtripFeedActive && activeTab === 'roadtrip')
  useEffect(() => {
    if (!alternativesShown) routeAlternatives.close()
  }, [alternativesShown, routeAlternatives])

  /**
   * The offered routes as the map draws them: line, colour, and the label that sits on
   * the road. Built here rather than in the page so the page stays a wiring container
   * and both renderers get the identical shape.
   */
  const alternativeOverlays = useMemo(
    () => buildAlternativeOverlays(routeAlternatives.open?.routes, {
      fastest: t('roadtrip.alt.fastest'),
      current: t('roadtrip.alt.current'),
      noMotorway: t('roadtrip.alt.noMotorway'),
      noToll: t('roadtrip.alt.noToll'),
      noFerry: t('roadtrip.alt.noFerry'),
    }, routeAlternatives.open?.engine),
    [routeAlternatives.open, t],
  )

  /**
   * The stretch of map the offered routes cover, handed to whichever renderer is up.
   *
   * Opening the picker without moving the camera means weighing three roads you cannot
   * see. Derived from the overlays rather than from the two endpoints so the frame holds
   * the whole of every alternative, including one that swings far off the direct line.
   * Empty while nothing is open, and the map is told to do nothing with an empty list,
   * so closing the picker leaves the view where the user put it.
   */
  const alternativeFocusPoints = useMemo(
    () => alternativeOverlays.flatMap(o => o.coordinates),
    [alternativeOverlays],
  )

  const automaticPoints = useAutomaticDayPoints(roadtripRoutes, collapsedRoadtripDays)
  const focusRoadtripPoint = useCallback((lat: number, lng: number) => {
    refuel.close()
    routeAlternatives.close()
    automaticPoints.focusPoint(lat, lng)
  }, [refuel, routeAlternatives, automaticPoints])
  const roadtripMapVias = automaticPoints.markers
  /**
   * What the map should bring into view.
   *
   * Refuel offers win while they are open, and for the reason they exist at all: somebody
   * is being asked to accept a stop, and a stop off the edge of the map cannot be judged.
   * They are the newer, smaller and more specific answer, so they take the view from the
   * alternatives rather than being averaged with them into a frame that shows neither.
   */
  const mapFocusPoints = useMemo<[number, number][]>(
    () => (refuel.offered.length
      ? refuel.offered.map(p => [p.lat, p.lng] as [number, number])
      : alternativeFocusPoints.length ? alternativeFocusPoints : automaticPoints.focusPoints ?? alternativeFocusPoints),
    [refuel.offered, alternativeFocusPoints, automaticPoints.focusPoints],
  )

  /**
   * The rail as it stands now, for a choice that is written several router answers after
   * the render that started it. Checked against before anything is written.
   */
  const railDaysRef = useRef<Parameters<typeof railLegAt>[0]>(roadtripRoutes.days)
  // The days with a single stop as well, in day order: they draw no card, but a drive
  // into the day after one leaves from its stop, and a choice for that drive is filed there.
  useEffect(() => {
    railDaysRef.current = [...roadtripRoutes.days, ...roadtripRoutes.quietDays].sort((a, b) => a.dayNumber - b.dayNumber)
  }, [roadtripRoutes.days, roadtripRoutes.quietDays])

  /**
   * Asks the rail's own router for other ways of one drive on a card.
   *
   * The picker is handed everything about the leg as the rail has it: the road it is on
   * now, which heads the list as the current one; where a choice would be written; and
   * the router with the leg's own mode and avoided classes, not the trip-wide profile.
   *
   * The drive arriving at the head of a connected card is asked about the same way, as
   * the pair from the last stop of the day before to the card's first. Its router is the
   * one the rail drives that seam with, under the card it arrives on, and a choice is
   * filed behind the stop it leaves, where the map already files a point dropped on it.
   * It used to be the one drive on the rail that could not be offered another way.
   */
  const askRouteAlternatives = useCallback((dayId: number, drive: RailDrive) => {
    const day = roadtripRoutes.days.find(d => d.dayId === dayId)
    const found = day ? railDriveOn(day, drive) : null
    const router = found ? roadtripRoutes.legRouter?.(found.from, found.to, dayId) : undefined
    if (!found || !router) return
    if (openOn(routeAlternatives.open, dayId, drive)) {
      routeAlternatives.close()
      return
    }
    const { from, to, seg, line } = found
    routeAlternatives.ask({
      dayId,
      drive,
      from: { lat: from.lat, lng: from.lng },
      to: { lat: to.lat, lng: to.lng },
      driven: { coordinates: line ?? [], distance: seg.distance, duration: seg.duration },
      // The vias of a leg are filed behind the stop it leaves, on the day that stop is
      // stored on, which on a card holding a night drive or a drive in from yesterday is
      // not the card's own day.
      anchor: { dayId: from.ownerDayId, afterIndex: from.ownerIndex },
      ends: { from: from.assignmentId, to: to.assignmentId },
      router,
    })
  }, [roadtripRoutes, routeAlternatives])

  /**
   * Taking one of the offered routes: pinned, proven, and only then written.
   *
   * Saved as vias, not as a stored polyline: a polyline goes stale with the next OSM update
   * and with every stop that moves, while a via keeps forcing the router back onto this
   * road for as long as the road exists. But a via only holds a road the router is willing
   * to drive through it, and nothing used to check that: a point on a ferry was pulled to
   * the pier and the day went the long way round, and a way weighed away from motorways
   * kept the motorway after its one pinned point. So the rail's own router is asked first
   * (`pinAlternative`), and a way it will not follow is not saved and says why.
   *
   * The pins replace the leg's vias in one write rather than joining them. Appending put a
   * new point behind the old one and routed out to each in turn, a zigzag matching neither
   * the preview nor the distance printed on it; and one delete per via meant a full re-route
   * between each of them. A write that fails is reported and leaves the picker open:
   * swallowed, it closed on a leg that still carried its via, and not even the reload ran
   * to contradict the traveller.
   *
   * A refusal is said twice: as a toast, and to the bar (`settle`), which keeps it beside
   * the offers and announces it. A leg the rail drew with OSRM standing in for an engine
   * that did not answer is asked for again once a choice holds, since the road the router
   * chose is not the one on the map: taking the router's own road there wrote nothing and
   * left the stand-in line in place, which read as a click that did nothing.
   */
  const chooseRouteAlternative = useCallback(async (index: number) => {
    const open = routeAlternatives.open
    const offer = open?.routes[index]
    if (!open || !offer) return
    // Choosing the road already being driven changes nothing.
    if (offer.current) { routeAlternatives.close(); return }
    // One choice at a time: the map line can be clicked while a chip's choice is checked.
    if (alternativesBusy(open)) return
    // Vias are written online only, so a choice that could not be kept is not checked.
    if (!roadtripVias.editable) { toast.error(t('roadtrip.alt.offline')); return }

    const signal = routeAlternatives.prove(index)
    let proof: PinProof
    try {
      proof = await pinAlternative({ offer, current: open.routes.find(r => r.current), route: open.route, signal })
    } catch {
      if (signal.aborted) return
      routeAlternatives.settle(t('roadtrip.alt.failed'))
      // The desk's bar says it in its own status line; a toast on top covered that line
      // and printed the same sentence twice. The phone's bar has no room for a sentence.
      if (isMobile) toast.error(t('roadtrip.alt.failed'))
      return
    }
    if (signal.aborted) return
    if (!proof.held) {
      const refusal = t(proof.fellBack ? 'roadtrip.alt.failed' : 'roadtrip.alt.notHeld')
      const hint = proof.fellBack ? null : refusalHint(offer, proof.last, t)
      routeAlternatives.settle(hint ? `${refusal} ${hint}` : refusal)
      if (isMobile) {
        toast.error(refusal, 6000)
        if (hint) toast.info(hint, 8000)
      }
      return
    }

    // The chain may have moved while the router was asked: a stop dragged, a collaborator's
    // edit arriving. Pins worked out for this leg are only written where it still runs.
    const { anchor, ends } = open
    const leg = railLegAt(railDaysRef.current, anchor)
    if (!leg || leg.from.assignmentId !== ends.from || leg.to.assignmentId !== ends.to) {
      toast.error(t('roadtrip.alt.legChanged'), 6000)
      routeAlternatives.close()
      return
    }
    // The router's own road on a leg nothing bends is already what is driven, unless OSRM
    // drew the leg in its engine's place. A write routes the leg again by itself; without
    // one the rail is asked to, and either way the picker says why the map may still hold
    // the stand-in line for a moment, or for as long as that engine does not answer.
    const bent = viasLeaving(leg.from, roadtripVias.byDay[anchor.dayId] ?? []).length > 0
    if (proof.pins.length || bent) {
      try {
        await roadtripVias.addMany(
          anchor.dayId,
          proof.pins.map(pin => ({ after_order_index: anchor.afterIndex, lat: pin.lat, lng: pin.lng })),
          [anchor.afterIndex],
        )
      } catch (err: unknown) {
        // Said even when the picker has moved on in the meantime: the write was asked for.
        const message = err instanceof Error ? err.message : t('common.unknownError')
        if (!signal.aborted) routeAlternatives.settle(message)
        toast.error(message)
        return
      }
    } else if (open.standIn) {
      roadtripRoutes.reroute?.()
    }
    if (open.standIn) toast.info(t('roadtrip.alt.standIn'), 8000)
    // A picker opened on another leg while this was written belongs to that leg now.
    if (!signal.aborted) routeAlternatives.close()
  }, [routeAlternatives, roadtripVias, roadtripRoutes, toast, t, isMobile])

  return {
    routeAlternatives, highlightedAlternative, setHighlightedAlternative, alternativeOverlays, alternativeFocusPoints,
    focusRoadtripPoint, roadtripMapVias, mapFocusPoints, askRouteAlternatives, chooseRouteAlternative,
  }
}

export type RoadtripAlternatives = ReturnType<typeof useRoadtripAlternatives>
