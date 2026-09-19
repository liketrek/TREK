import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { MapViewAuto } from '../../../../components/Map/MapViewAuto'
import { MapCompassPill, type CompassMap } from '../../../../components/Map/MapCompassPill'
import { MAP_LAYER_SWITCHER_INSET, MAP_ROUND_CONTROL_SIZE } from '../../../../components/Map/MapLayerSwitcher'
import { TripRouteOverviewPill, TripRouteOverviewPanel } from '../../../../components/Map/TripRouteOverview'
import { DawarichTrailPill } from '../../../../components/Map/DawarichTrailPill'
import PoiCategoryPill from '../../../../components/Map/PoiCategoryPill'
import { usePoiExplore } from '../../../../components/Map/usePoiExplore'
import { useMergedMapPois } from '../../../../components/Map/useMergedMapPois'
import { firstStopOfPlace, stageOf } from '../../../../components/Roadtrip/roadtripRowModel'
import { stageMapData } from '../../../../components/Roadtrip/stageMap'
import { useRoadtripSettings } from '../../../../hooks/useRoadtripSettings'
import { useSettingsStore } from '../../../../store/settingsStore'
import { useTripStore } from '../../../../store/tripStore'
import { RT_ALT_BAR_LIFT } from '../roadtrip/useMRtAlternatives'
import type { MMapAreaProps } from '../MTripShell'
import type { Poi } from '../../../../components/Map/poiCategories'
import type { ViewportPadding } from '../../../../utils/mapViewport'

/** One array, so an explore set switched off does not move every pin on the stage. */
const NO_POIS: Poi[] = []

/**
 * The compass stands one gap to the right of the base-layer switcher both engines draw
 * in the bottom left corner. Worked out from the switcher's own numbers rather than
 * written down as 70, so moving or resizing the switcher carries the compass along.
 */
const COMPASS_LEFT = MAP_LAYER_SWITCHER_INSET + MAP_ROUND_CONTROL_SIZE + 8

/** The safe-area insets at the top and the bottom of the screen, in pixels. */
interface SafeInsets {
  top: number
  bottom: number
}

const NO_INSETS: SafeInsets = { top: 0, bottom: 0 }

/**
 * The safe-area insets as numbers, read off a probe that is padded by them.
 *
 * The frame handed to the map engine is pixels, and `env()` only resolves inside CSS. On a
 * phone with a notch the chrome sits a status bar lower (and a home indicator higher) than
 * its classes spell out, so a frame worked out without the insets would put the far end of
 * a leg under the day chips. A computed padding is where the browser hands the resolved
 * inset back. Read on mount and again on a resize, which is what turning the phone does.
 */
function useSafeInsets(probe: RefObject<HTMLElement | null>): SafeInsets {
  const [insets, setInsets] = useState<SafeInsets>(NO_INSETS)
  useLayoutEffect(() => {
    const read = () => {
      const el = probe.current
      if (!el) return
      const style = window.getComputedStyle(el)
      const top = Number.parseFloat(style.paddingTop) || 0
      const bottom = Number.parseFloat(style.paddingBottom) || 0
      setInsets(prev => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }))
    }
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [probe])
  return insets
}

/**
 * Where the roads offered for a leg are framed: in the strip of map between the day chips
 * and the alternatives bar, rather than behind either of them.
 *
 * Both engines fit a phone with a flat margin that knows nothing of this shell's bars, and
 * with the picker open those cover most of the screen: that margin would leave the leg's
 * ends and their time pills under the chips and under a 174px bar. The numbers are the
 * ones the classes on this screen are built from, so a change there has to be carried here.
 *
 * Top: the safe area, then `--m-safe-top`'s own 12px, the chip rail's 50px offset under it
 * and its 42px height, then a 12px gap so a time pill at the far end is not flush against
 * the rail. The search bar that sits below the rail on the stage steps away while the
 * picker is open, so the rail is the lowest chrome up there.
 *
 * Bottom: the safe area, the dock's 74px (62px tall, 12px off the bottom) and the bar's
 * lift (its height and the 15px gap between the dock and its foot). That is the very line
 * `--bottom-nav-h` puts the round controls' band on, so the frame ends where they begin,
 * and they only take the two corners of it.
 *
 * The sides keep the 20px both engines already give a phone: nothing floats there.
 */
function alternativesFitPadding(insets: SafeInsets): ViewportPadding {
  return {
    top: insets.top + 12 + 50 + 42 + 12,
    right: 20,
    bottom: insets.bottom + 74 + RT_ALT_BAR_LIFT,
    left: 20,
  }
}

type FocusPoints = readonly [number, number][]

/** A camera focus the planner is holding, and the day that was on screen when it arrived. */
interface HeldFocus {
  points: FocusPoints
  dayId: number | null
  live: boolean
  /**
   * Every array held before this one. Weak, so the offers of a long session are not kept
   * alive by it. Only ever added to, and adding twice changes nothing, so a render React
   * runs twice or throws away leaves it saying the same thing.
   */
  shown: WeakSet<FocusPoints>
}

/**
 * Lets go of a pending focus once the day moves off the one it arrived with, and never
 * takes one back that the planner hands over a second time.
 *
 * The planner keeps a point it was asked to show until its next routing round, whatever
 * day is picked in the meantime, and a pending focus wins over the stage's own frame. So
 * after "show on map" every stage swiped to afterwards stayed on that one point instead of
 * framing its drive. Coming back to the day does not bring the point back either: the
 * traveller has moved on since, and the camera belongs to the stage they came back to.
 *
 * The same kept point is also what the planner falls back to once the fuel offers or the
 * other roads for a leg close, as the very array it handed over before. Read as a new
 * focus, closing either one flew the camera back to that old stop, on another day's stage
 * too. So only an array never held before is a new focus. The one exception is the open
 * picker's roads (`openRoads`): fuel offers asked for over an open picker take the camera
 * from it, and once they close the picker is still asking about its leg.
 */
function holdFocus(
  prev: HeldFocus,
  points: FocusPoints,
  dayId: number | null,
  openRoads: FocusPoints,
): HeldFocus {
  if (prev.points !== points) {
    prev.shown.add(prev.points)
    return { points, dayId, live: points === openRoads || !prev.shown.has(points), shown: prev.shown }
  }
  if (prev.live && prev.dayId !== dayId) return { ...prev, dayId, live: false }
  return prev
}

/**
 * Fullscreen map layer of the mobile trip screen (plan tab). Stays mounted for
 * the whole plan-tab lifetime — the plan timeline / places browser overlays
 * simply cover it — so tiles, markers and the GL engine stay warm across view
 * toggles.
 *
 * The map itself is the shared planner renderer (Leaflet or GL, per user
 * setting) with the full desktop feature set: clusters, photo/icon markers,
 * day-order badges, dashed day route, transport overlays per booking, POI
 * explore markers and long-press → add place. Only the floating chrome is
 * mobile: the POI bar spans the full width below the day-chip rail, and the round
 * controls share one band above the dock: the map's own base-layer switcher
 * with the compass beside it on the left, the map's built-in three-state locate
 * button on the right, all riding the --bottom-nav-h contract the map already reads
 * so they cannot drift apart. The map credit sits under that band, alone in the
 * bottom right corner.
 *
 * On the plan tab, marker data honours the shared places category filter (#1541)
 * because planner.mapPlaces is derived from tripStore's placesCategoryFilter, the
 * same set the places browser renders, so the two can't desync. The road trip
 * stage draws the stops of its chain instead, see `stagePlaces`.
 */
export default function MMapArea({ planner, shell }: MMapAreaProps) {
  const poi = usePoiExplore()
  const [glMap, setGlMap] = useState<CompassMap | null>(null)
  const poiPillEnabled = useSettingsStore(s => s.settings.map_poi_pill_enabled) !== false
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)

  const dayColorsOn = useRoadtripSettings(s => s.roadtrip_day_colors, planner.tripId)
  const tripPlaces = useTripStore(s => s.places)

  // One instance, two tabs. `mapFront` is true whenever the map is the front layer
  // in either of them, so the floating chrome below keys off that rather than off
  // `view`, which only ever meant the plan tab.
  const mapActive = shell.mapFront
  const onStage = shell.trTab === 'roadtrip'

  // The stage the road trip tab is looking at, and what the map draws for it. Passed
  // through unconditionally while that tab is open, list half included: `focusPoints`
  // going array → undefined → array is two dependency changes to React, and the
  // second one would throw away whatever the traveller had panned to.
  //
  // Memoised on what the stage is made of rather than rebuilt per render: the shell
  // re-renders on every store write, a settings toggle included, and a fresh
  // `focusPoints` array reframes the camera while fresh lines and places set their
  // GeoJSON sources again. On the stage that also kept the GL style busy, which is how
  // the satellite switch came to miss every tap there.
  const stage = useMemo(
    () => onStage ? stageOf(planner.roadtripRoutes.days, planner.selectedDayId) : null,
    [onStage, planner.roadtripRoutes.days, planner.selectedDayId],
  )
  const stageMap = useMemo(
    () => onStage ? stageMapData(planner.roadtripRoutes, stage, !!dayColorsOn) : null,
    [onStage, planner.roadtripRoutes, stage, dayColorsOn],
  )

  // Only what the stage carries, so a trip's other 200 pins stay off a screen that
  // is answering one question. Without a stage (the all-days view) every place a stored
  // visit stops at comes back, which is what the drive looks like end to end.
  //
  // Out of the trip store rather than `planner.mapPlaces`, which is the plan tab's map.
  // That list drops the pins of every day its declutter has put away, and this tab moves
  // the day without touching the declutter (a swipe, or a chip tap while the plan tab sits
  // on its list): after the all days switch and back, the next stage picked came up with
  // most of its pins missing. It also runs the places browser's filters, where 'unplanned'
  // hides every stop a drive has, and it lacks the service stops hidden from the day lists
  // that the chain still draws. The category filter stays off the stage too, on purpose:
  // the stage is one day's chain on a map, and a stop the chain lists with no pin under its
  // line, hidden by a control on another tab, reads as a broken map rather than a filter.
  //
  // The all-days view reads the stored visits for the same reasons, not the planner's
  // planned list: that one is built from the day lists, which on a phone always leave out
  // a booked night and, with the setting off, the service stops, while the drive the routing
  // round draws still ends at that hotel and stops at that pump. Its pin is what opens the
  // stop, so a missing one left the stop out of reach from this view.
  const drivePlaceIds = useMemo(
    () => new Set(Object.values(planner.storedAssignments).flat().map(visit => visit.place_id)),
    [planner.storedAssignments],
  )
  const stagePlaces = useMemo(() => {
    const pinned = stageMap && stage ? stageMap.placeIds : drivePlaceIds
    return tripPlaces.filter(p => p.lat != null && p.lng != null && pinned.has(p.id))
  }, [stageMap, stage, tripPlaces, drivePlaceIds])

  // Computed during render rather than in an effect, so the frame handed over below is
  // already the right one in the render a day change happens in. See holdFocus.
  const [heldFocus, setHeldFocus] = useState<HeldFocus>(
    () => ({ points: planner.mapFocusPoints, dayId: planner.selectedDayId, live: true, shown: new WeakSet() }),
  )
  const focus = holdFocus(heldFocus, planner.mapFocusPoints, planner.selectedDayId, planner.alternativeFocusPoints)
  if (focus !== heldFocus) setHeldFocus(focus)
  const focusPending = focus.live && planner.mapFocusPoints.length > 0

  // Handed over only once there are roads to frame, not as soon as the picker opens: the
  // engines refit whatever they hold when this padding changes, and while the router is
  // still thinking that is the stage, which would be flown out to a smaller frame just
  // before the answer flies it to the leg. So the padding and the roads arrive in one
  // render and the camera moves once, and on close both go in one render as well.
  // Memoised for the reason the stage data is, the shell re-rendering on every store write.
  const insetProbe = useRef<HTMLSpanElement>(null)
  const insets = useSafeInsets(insetProbe)
  const framingOffers = onStage && planner.alternativeOverlays.length > 0
  const fitPadding = useMemo(
    () => (framingOffers ? alternativesFitPadding(insets) : undefined),
    [framingOffers, insets],
  )

  /**
   * A pin on the road trip tab opens its stop: the sheet the chain row opens, not the
   * place inspector.
   *
   * The plan tab's marker click moves the planner's place selection, and the inspector
   * opens off that selection, so a tap on a stop of the drive came up with the plan tab's
   * card over the map and no word about the stop. Over a stage the stop is found on that
   * card, over the whole drive on the first routed day that stops there (firstStopOfPlace).
   * A pin no routed day stops at still gets the inspector: the road trip has nothing to
   * say about it, and the place does.
   *
   * One handler for the life of the map, reading the latest values through a ref. Leaflet
   * rebuilds every marker whenever this identity moves, and the shell re-renders on every
   * store write and on every sheet it opens, this handler's own included.
   */
  const latest = useRef({ planner, shell, stage })
  latest.current = { planner, shell, stage }
  const openStagePin = useCallback((placeId?: number) => {
    const { planner: now, shell: chrome, stage: card } = latest.current
    const stop = placeId == null ? null : firstStopOfPlace(card ? [card] : now.roadtripRoutes.days, placeId)
    if (stop) chrome.openSheet('rtstop', { dayId: stop.ownerDayId, assignmentId: stop.assignmentId })
    else now.handleMarkerClick(placeId)
  }, [])

  /**
   * The pins, and they are not the same question on the two tabs.
   *
   * On the stage: what the corridor search found and what the fuel search is offering,
   * both measured along the drive. The explore categories stay off it, and so does their
   * bar. "What is around this piece of map" has no relationship to a route, and two
   * search bars stacked over a 375px map is the clutter this tab exists to avoid. The
   * plan tab is one tap away and shows the same map.
   *
   * Merged through the planner's own hook rather than concatenated here, because the
   * sets overlap: the same petrol station found twice would be two pins on one roof.
   */
  /**
   * The vias the phone map draws: on a stage, only the night that belongs to it.
   *
   * A night pause is a pill with a moon and a day number, drawn where one travel day
   * ends. The markers are built from the WHOLE drive (`automaticPoints`), which is right
   * for the desktop rail and for the all-days view here, but a stage shows one day: with
   * the unfiltered list, day 1 carried day 2's pill as well, in the middle of a map that
   * is otherwise entirely day 1. Two ends on a map that draws one is a question, not a
   * label.
   *
   * So on a stage the pill is kept only where its day is the day on screen, and off a
   * stage the list is left alone, because in the all-days view every night does belong to
   * a line that is drawn. `nightPause.day` is the day number the marker was built from
   * (see `useAutomaticDayPoints`), which is the same number the stage carries.
   */
  const mapVias = useMemo(() => {
    const vias = onStage ? planner.roadtripMapVias : planner.routeVias
    if (!vias || !stage) return vias
    return vias.filter(v => !v.nightPause || v.nightPause.day === stage.dayNumber)
  }, [onStage, planner.roadtripMapVias, planner.routeVias, stage])

  const pois = useMergedMapPois(
    onStage ? planner.roadtripCorridor.visible : null,
    onStage ? NO_POIS : poi.pois,
    planner.refuel.offered,
  )

  return (
    // `isolate` keeps the map's internal z-indexes (Leaflet panes, the z-1000
    // locate button) inside this layer so they can never paint over the plan
    // timeline (z-10) or the browse/tab overlays (z-30) above it.
    //
    // --m-map-floor is the top edge of whatever the map ends at: the dock, 62px tall at
    // safe-bottom + 12, or the alternatives bar when the picker puts one over it, which is
    // what --m-stage-lift adds. The round controls sit straight on that floor and add
    // their own 12px, close enough to the thumb to reach one-handed. Everything that reads
    // --bottom-nav-h (the compass, both engines' locate button and base-layer switcher,
    // the overview stack) follows on its own. The band used to float a further 38px up to
    // leave the corner under it to the map credit; the phone map carries no visible credit
    // any more (see mobile.css), so that row would now only be a gap over the dock.
    //
    // The metrics are classes rather than an inline --bottom-nav-h, and the lift is its
    // OWN variable folded into them: the compass band below is identified by being the
    // one element that sets that name inline, and a second one would make that ambiguous.
    <div
      className="absolute inset-0 isolate overflow-hidden bg-[color:var(--m-mapb)] [--m-map-floor:calc(env(safe-area-inset-bottom,0px)+74px+var(--m-stage-lift,0px))] [--bottom-nav-h:var(--m-map-floor)]"
      // A stage bar used to stand over the dock for the whole of the road trip tab, and the
      // floor cleared its 61px plus a gap the year round. It is gone, so the only thing
      // left in that slot is the bar the picker raises while other ways of driving a leg
      // are on offer, and the floor clears that one the same way: its height plus the gap
      // it keeps from the dock, so the round controls land above it rather than on its
      // top edge.
      style={{
        ['--m-stage-lift' as string]: onStage && mapActive && planner.routeAlternatives.open
          ? `${RT_ALT_BAR_LIFT}px`
          : '0px',
      }}
    >
      {/* Measures the safe area for the alternatives frame, see useSafeInsets. Out of the
          flow and invisible, so it takes no room and catches no tap. */}
      <span
        ref={insetProbe}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)]"
      />
      <MapViewAuto
        tripId={planner.tripId}
        dawarichTrack={planner.dawarichTrail.track}
        places={stageMap ? stagePlaces : planner.mapPlaces}
        dayPlaces={onStage ? undefined : planner.dayPlaces}
        route={stageMap ? stageMap.lines : planner.overviewActive ? planner.tripOverview.lines : planner.route}
        routeColors={stageMap ? stageMap.lineColors : planner.overviewActive ? planner.tripOverview.lineColors : undefined}
        accessLines={stageMap ? stageMap.accessLines : undefined}
        // A hit somebody tapped in the search sheet, a stop shown from its sheet, or the
        // stations the fuel search is offering take the camera while their day is on
        // screen; with nothing pending the stage frames itself.
        focusPoints={stageMap
          ? (focusPending ? planner.mapFocusPoints : stageMap.focusPoints)
          : planner.overviewActive ? planner.tripOverview.focusPoints : undefined}
        routeVias={mapVias}
        showTransitRoutes={onStage ? false : planner.transitRoutesShown}
        // The route toggle belongs to one day, so the map needs that day to know
        // which automated transports may ride it (#2019).
        days={planner.days}
        selectedDayId={planner.selectedDayId}
        routeSegments={onStage ? undefined : planner.overviewActive ? planner.tripOverview.segments : planner.routeSegments}
        selectedPlaceId={planner.selectedPlaceId}
        onMarkerClick={onStage ? openStagePin : planner.handleMarkerClick}
        // Tap on empty map = deselect, same contract as desktop.
        onMapClick={planner.handleMapClick}
        // The chip rail names a day at all times on mobile, so a place dropped on
        // the map belongs to it — the desktop map has no such context and passes
        // nothing, which keeps its pool behaviour (#1998).
        onMapContextMenu={e => planner.handleMapContextMenu(e, planner.selectedDayId)}
        // No center/zoom: the map frames itself on the trip's places at mount.
        tileUrl={planner.mapTileUrl}
        fitKey={planner.fitKey}
        dayOrderMap={planner.dayOrderMap}
        reservations={planner.reservations}
        showReservationStats={true}
        visibleConnectionIds={planner.visibleConnections}
        // Transport overlay tap → the mobile transport detail sheet (desktop
        // routes this through mapTransportDetail into the day sidebar instead).
        onReservationClick={(rid: number) => shell.openSheet('transport', { reservationId: rid })}
        pois={pois}
        // On the stage, through the road trip's own door: it recognises a corridor hit by
        // the distance it carries and sends it to the draft sheet with the stop kind, the
        // stay and the position in the chain already worked out. The plan tab has no
        // chain to place anything in, so there it stays the plain place form.
        onPoiClick={onStage
          ? planner.handlePoiClick
          : marker => planner.openAddPlaceFromPoi(marker, planner.selectedDayId)}
        onViewportChange={poi.onViewportChange}
        onMapReady={setGlMap}
        // Other ways of driving the leg the stage asked about, and the one lit up.
        alternativeRoutes={onStage ? planner.alternativeOverlays : undefined}
        activeAlternative={onStage ? planner.highlightedAlternative : undefined}
        // A tap on a road or its time pill only lights it; the bar's confirm takes it. The
        // desk hands `chooseRouteAlternative` in here and previews on hover, but glass has
        // no hover, so the same wiring would save a via on the very first touch of a line.
        // No highlight handler either: a touch fires emulated mouse enter and leave events,
        // and the leave would put out the road the tap has just lit.
        onChooseAlternative={onStage ? planner.setHighlightedAlternative : undefined}
        fitPadding={fitPadding}
      />

      {/* Floating map chrome — only while the map view is front-most. The POI bar
          sits below the day-chip rail (safe-top + 50px + ~42px chip height) and
          takes the full width between the screen margins, so its segments are
          the same size as everything else the thumb aims at on this screen. */}
      {mapActive && !onStage && poiPillEnabled && (
        <div className="pointer-events-none absolute left-4 right-4 z-[25] flex flex-col items-center gap-2 top-[calc(var(--m-safe-top,12px)+96px)]">
          <PoiCategoryPill
            fullWidth
            active={poi.active}
            onToggle={poi.toggle}
            loadingKeys={poi.loadingKeys}
            errorKeys={poi.errorKeys}
            moved={poi.moved}
            onSearchArea={poi.searchArea}
          />
        </div>
      )}

      {/* Compass, GL maps only (Leaflet cannot rotate). Both engines draw the base-layer
          switcher in the bottom left corner, so the compass sits beside it rather than in
          the corner: at `left-3` it started 8px left of the switcher and ran on under it,
          reading as a second button showing through the frosted shell. Same
          --bottom-nav-h band as the locate button's `right: 12`, so the round controls
          still share one line. The left offset is inline because it is computed from the
          switcher's own numbers. */}
      {mapActive && glMap && (
        <div className="pointer-events-none absolute z-[25]" style={{ left: COMPASS_LEFT, bottom: 'calc(var(--bottom-nav-h, 84px) + 12px)' }}>
          <MapCompassPill map={glMap} />
        </div>
      )}

      {/* Whole-trip overview (#1736): the stages stack above their toggle on the right,
          clear of the round-controls band below it and of the base-layer switcher and
          the compass, which both sit bottom left. The offset is Tailwind rather than
          inline because the compass band is identified by being the one element with
          an inline --bottom-nav-h, and a second would make that ambiguous. */}
      {mapActive && !onStage && (!planner.roadtripActive || planner.dawarichEnabled) && (
        <div className="pointer-events-none absolute left-3 right-3 z-[25] flex flex-col items-end gap-2 bottom-[calc(var(--bottom-nav-h,84px)+58px)]">
          {!planner.roadtripActive && planner.overviewActive && (
            <TripRouteOverviewPanel
              overview={planner.tripOverview}
              unit={distanceUnit}
              selectedDayId={planner.selectedDayId}
              onSelectDay={planner.handleSelectDay}
              // Tighter than the desktop card: the map is the whole screen here, so a
              // long day name ellipsizes rather than eating another 80px of it.
              maxWidth={240}
            />
          )}
          {!planner.roadtripActive && (
            <TripRouteOverviewPill active={planner.overviewShown} onToggle={planner.toggleOverview} />
          )}
          {/* Kept in road-trip mode: the recorded route beside the planned one is
              exactly the comparison a drive invites. */}
          {planner.dawarichEnabled && (
            <DawarichTrailPill
              active={planner.dawarichTrailShown}
              status={planner.dawarichTrail.status}
              onToggle={planner.toggleDawarichTrail}
            />
          )}
        </div>
      )}
    </div>
  )
}
