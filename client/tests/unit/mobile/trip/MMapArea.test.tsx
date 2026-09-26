import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../helpers/render'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { buildAssignment, buildPlace } from '../../../helpers/factories'
import type { AccessSpur, RoadtripDay } from '@trek/shared/roadtrip'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { CompassMap } from '../../../../src/components/Map/MapCompassPill'
import { MAP_LAYER_SWITCHER_INSET, MAP_ROUND_CONTROL_SIZE } from '../../../../src/components/Map/MapLayerSwitcher'
import { useSettingsStore } from '../../../../src/store/settingsStore'
import { useTripStore } from '../../../../src/store/tripStore'
import { seedStore } from '../../../helpers/store'
import type { Day, Place, Reservation } from '../../../../src/types'
import { visibleRouteReservations, type RouteVisibilityOptions } from '../../../../src/utils/reservationRoutes'
import type { AlternativeOverlay } from '../../../../src/components/Roadtrip/alternativeOverlays'
import type { LegAlternatives } from '../../../../src/components/Roadtrip/useRouteAlternatives'
import { openLeg } from '../../../helpers/legAlternatives'
import { RT_ALT_BAR_LIFT } from '../../../../src/mobile/screens/trip/roadtrip/useMRtAlternatives'
import { corePoiCategories, pluginPoiCategories } from '../../../../src/components/Map/usePoiCategories'

// FE-MOB-MAPAREA-001 to FE-MOB-MAPAREA-045
//
// The stage's pins come out of the trip store rather than the planner's map list, so the
// stage fixtures seed the store and leave `mapPlaces` to stand for what the plan tab shows.

const mocks = vi.hoisted(() => ({
  poi: {} as Record<string, unknown>,
  /** The traveller's road trip preferences, read per trip by the area. */
  prefs: {} as Record<string, unknown>,
  /** Handed to onMapReady, standing in for a GL map that can rotate. */
  glMap: null as CompassMap | null,
  /** Last props the area handed the renderer, so its callbacks can be fired. */
  props: {} as Record<string, unknown>,
}))

// The real renderer boots Leaflet/MapLibre; the area only ever hands it props.
vi.mock('../../../../src/components/Map/MapViewAuto', () => ({
  MapViewAuto: (props: Record<string, unknown>) => {
    mocks.props = props
    ;(props.onMapReady as ((map: CompassMap | null) => void) | undefined)?.(mocks.glMap)
    return <div data-testid="map-renderer" />
  },
}))

vi.mock('../../../../src/components/Map/usePoiExplore', () => ({
  usePoiExplore: () => mocks.poi,
}))

vi.mock('../../../../src/hooks/useRoadtripSettings', () => ({
  useRoadtripSettings: (select: (p: Record<string, unknown>) => unknown) => select(mocks.prefs),
}))

import MMapArea from '../../../../src/mobile/screens/trip/map/MMapArea'

const COMPASS: CompassMap = {
  getBearing: () => 0,
  on: vi.fn(),
  off: vi.fn(),
  easeTo: vi.fn(),
}

function renderArea(shellOver: Partial<MTripShellApi> = {}, plannerOver: Partial<TripPlanner> = {}) {
  const planner = buildPlanner(plannerOver)
  // `mapFront` is what the floating chrome keys off since the map became one
  // instance shared by the plan tab and the road trip tab. `view` alone no longer
  // says whether the map is the front layer.
  const shell = buildShell({ view: 'map', mapFront: true, ...shellOver })
  return { planner, shell, ...render(<MMapArea planner={planner} shell={shell} />) }
}

/** The compass wrapper is the only element carrying an inline bottom offset. */
const compassBand = (container: HTMLElement) =>
  container.querySelector('[style*="--bottom-nav-h"]') as HTMLElement | null

/** One stage of a drive: two stops on day 1, one of them reached down a short spur. */
function stageDay(): RoadtripDay {
  return {
    dayId: 3, dayNumber: 1, date: '2026-05-01', title: null,
    stops: [
      {
        assignmentId: 31, ownerDayId: 3, ownerIndex: 0, placeId: 11, name: 'Hamburg',
        lat: 53.55, lng: 9.99, time: null, dwellMinutes: null,
        legMode: null, incomingLegMode: null, stopType: null,
      },
      {
        assignmentId: 32, ownerDayId: 3, ownerIndex: 1, placeId: 12, name: 'Lübeck',
        lat: 53.87, lng: 10.69, time: null, dwellMinutes: null,
        legMode: null, incomingLegMode: null, stopType: null,
      },
    ],
    legs: [], legVias: [[]], geometry: [], distance: 0, duration: 0,
    schedule: { entries: [], warnings: [] }, driveWarnings: [], dayWarning: null,
  } as unknown as RoadtripDay
}

/** The planner carrying that stage, plus a place from another day the stage leaves off. */
function stagePlanner(selectedDayId: number | null): TripPlanner {
  const base = buildPlanner()
  const spur: AccessSpur = { line: [[53.87, 10.69], [53.871, 10.692]], meters: 180, stopKey: '53.87000,10.69000,,' }
  seedStore(useTripStore, { places: [buildPlace({ id: 11 }), buildPlace({ id: 12 }), buildPlace({ id: 99 })] })
  return buildPlanner({
    selectedDayId,
    mapPlaces: [buildPlace({ id: 11 }), buildPlace({ id: 12 }), buildPlace({ id: 99 })],
    // The stored visits, which are what the all days view draws: 99 is on no day.
    storedAssignments: {
      '3': [
        buildAssignment({ day_id: 3, place: buildPlace({ id: 11 }) }),
        buildAssignment({ day_id: 3, place: buildPlace({ id: 12 }) }),
      ],
    },
    roadtripRoutes: {
      ...base.roadtripRoutes,
      days: [stageDay()],
      lines: [[[53.55, 9.99], [53.87, 10.69]]],
      lineDays: [1],
      accessLines: [spur],
    },
  } as unknown as Partial<TripPlanner>)
}

/**
 * Two routed days. Lübeck is passed on the day before the stage, and the stage itself is a
 * loop that leaves Hamburg in the morning and comes back to it at night.
 */
function drivePlanner(selectedDayId: number | null, over: Partial<TripPlanner> = {}): TripPlanner {
  const base = stagePlanner(selectedDayId)
  const stage = stageDay()
  const [hamburg, luebeck] = stage.stops
  const before = { ...stage, dayId: 2, dayNumber: 1, stops: [{ ...luebeck, assignmentId: 21, ownerDayId: 2, ownerIndex: 0 }] }
  const loop = { ...stage, dayNumber: 2, stops: [hamburg, luebeck, { ...hamburg, assignmentId: 33, ownerIndex: 2 }] }
  return {
    ...base,
    roadtripRoutes: { ...base.roadtripRoutes, days: [before, loop], lineDays: [2] },
    ...over,
  } as TripPlanner
}

/** The shell with the road trip map in front. */
const stageShell = () => buildShell({ view: 'map', mapFront: true, trTab: 'roadtrip', rtView: 'map' })

/** The pin handler the area last handed the renderer. */
const tapPin = (placeId?: number) => (mocks.props.onMarkerClick as (id?: number) => void)(placeId)

/** What the area handed the renderer that a fresh copy would make it draw again. */
const DRAWN = ['places', 'route', 'routeColors', 'accessLines', 'focusPoints'] as const

/** A picker open on leg 0 of day 3, with or without roads back yet. */
function withPicker(overlays: AlternativeOverlay[], over: Partial<TripPlanner> = {}): Partial<TripPlanner> {
  const base = buildPlanner()
  const open: LegAlternatives = openLeg({ dayId: 3, drive: { kind: 'leg', index: 0 }, loading: overlays.length === 0 })
  return {
    routeAlternatives: { ...base.routeAlternatives, open },
    alternativeOverlays: overlays,
    ...over,
  } as Partial<TripPlanner>
}

/** Two offered roads, as far as the map area reads them. */
const OFFERS = [
  { index: 0, coordinates: [[53.55, 9.99], [53.87, 10.69]], color: 'blue', label: '1 h', note: 'Current' },
  { index: 1, coordinates: [[53.55, 9.99], [53.7, 10.2], [53.87, 10.69]], color: 'pale', label: '1 h 10 min', note: '' },
] as unknown as AlternativeOverlay[]

/** The probe the area reads the safe area off, answering like a phone with a notch. */
function notchedPhone(top: string, bottom: string) {
  const real = window.getComputedStyle.bind(window)
  return vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => (
    el.className.toString().includes('safe-area-inset-top')
      ? ({ paddingTop: top, paddingBottom: bottom } as CSSStyleDeclaration)
      : real(el, pseudo)
  ))
}

afterEach(() => {
  vi.restoreAllMocks()
})

beforeEach(() => {
  mocks.glMap = COMPASS
  mocks.prefs = {}
  mocks.poi = {
    categories: { core: corePoiCategories(key => key), plugin: [] },
    active: new Set<string>(), pois: [], loadingKeys: new Set<string>(), errorKeys: new Set<string>(),
    moved: false, toggle: vi.fn(), searchArea: vi.fn(), onViewportChange: vi.fn(),
  }
  useSettingsStore.setState(s => ({ settings: { ...s.settings, map_poi_pill_enabled: true } }))
  seedStore(useTripStore, { places: [], placesFilter: 'all', placesCategoryFilter: new Set<string>() })
})

describe('MMapArea', () => {
  it('FE-MOB-MAPAREA-001: the POI bar takes the full width between the screen margins', () => {
    renderArea()

    const segment = screen.getAllByRole('button')[0]
    expect(segment.style.flexGrow).toBe('1')
  })

  it('FE-MOB-MAPAREA-002: the compass rides the same bottom offset as the locate button', () => {
    const { container } = renderArea()

    // LocationButton hard-codes `right: 12` off the same variable, so matching
    // the offset here is what keeps the two round controls on one line.
    expect(compassBand(container)?.style.bottom).toBe('calc(var(--bottom-nav-h, 84px) + 12px)')
    // Beside the base-layer switcher both engines draw in the corner: its inset, its
    // size and one gap. In the corner itself it lay under the switcher's frosted shell.
    expect(compassBand(container)?.style.left).toBe(`${MAP_LAYER_SWITCHER_INSET + MAP_ROUND_CONTROL_SIZE + 8}px`)
    expect(compassBand(container)?.className).not.toContain('left-3')
  })

  it('FE-MOB-MAPAREA-003: the map layer stands those controls on the dock, with no credit row under them', () => {
    const { container } = renderArea()
    const layer = container.firstElementChild as HTMLElement

    // The floor is the dock's top edge: 62px tall at safe-bottom + 12, raised by the stage lift.
    expect(layer.className)
      .toContain('[--m-map-floor:calc(env(safe-area-inset-bottom,0px)+74px+var(--m-stage-lift,0px))]')
    // The band sits on that floor and the controls add their own 12 on top. It used to float
    // a further 38px up to leave the corner under it to the credit; the phone map shows none,
    // so that row would only be a gap over the dock.
    expect(layer.className).toContain('[--bottom-nav-h:var(--m-map-floor)]')
    expect(layer.className).not.toContain('38px')
    // No lift off the stage: the plan tab has no bar in that band.
    expect(layer.style.getPropertyValue('--m-stage-lift')).toBe('0px')
  })

  it('FE-MOB-MAPAREA-013: on the stage nothing stands over the dock, so the floor stays on it', () => {
    const { container } = renderArea({ trTab: 'roadtrip', mapFront: true })

    // A 61px stage bar used to hold this slot whenever the map was up, and the floor rose
    // 76px to clear it. It is gone, so the road trip tab lifts nothing by itself; only the
    // picker's bar still raises the floor (FE-MOB-MAPAREA-030).
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--m-stage-lift')).toBe('0px')
  })

  it('FE-MOB-MAPAREA-014: behind the chain there is no bar to clear, so nothing lifts', () => {
    const { container } = renderArea({ trTab: 'roadtrip', mapFront: false })

    expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--m-stage-lift')).toBe('0px')
  })

  it('FE-MOB-MAPAREA-004: a renderer that cannot rotate gets no compass', () => {
    mocks.glMap = null
    const { container } = renderArea()

    expect(compassBand(container)).toBeNull()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('FE-MOB-MAPAREA-005: turning the POI bar off leaves the compass alone', () => {
    useSettingsStore.setState(s => ({ settings: { ...s.settings, map_poi_pill_enabled: false } }))
    const { container } = renderArea()

    expect(screen.queryByLabelText('Cafés')).not.toBeInTheDocument()
    expect(compassBand(container)).not.toBeNull()
  })

  it('FE-MOB-MAPAREA-006: no floating chrome while the timeline covers the map', () => {
    const { container } = renderArea({ view: 'plan', mapFront: false })

    expect(screen.queryByLabelText('Cafés')).not.toBeInTheDocument()
    expect(compassBand(container)).toBeNull()
    // The renderer itself stays mounted so tiles and markers keep their warmth.
    expect(screen.getByTestId('map-renderer')).toBeInTheDocument()
  })

  it('FE-MOB-MAPAREA-007: a transport overlay tap opens the mobile transport sheet', () => {
    const { shell } = renderArea()

    ;(mocks.props.onReservationClick as (id: number) => void)(7)

    expect(shell.openSheet).toHaveBeenCalledWith('transport', { reservationId: 7 })
  })
  it('FE-MOB-MAPAREA-008: on the stage the pins are the search and the fuel offers, and nothing else', () => {
    const corridorHit = { osm_id: 'c1', name: 'Shell', lat: 53.5, lng: 9.8, category: 'fuel' }
    const offered = { osm_id: 'r1', name: 'Aral', lat: 53.4, lng: 9.7, category: 'fuel' }
    mocks.poi = { ...mocks.poi, pois: [{ osm_id: 'e1', name: 'Café', lat: 53.3, lng: 9.6, category: 'cafe' }] }
    const base = buildPlanner()
    renderArea({ trTab: 'roadtrip' }, {
      roadtripCorridor: { ...base.roadtripCorridor, visible: [corridorHit] },
      refuel: { ...base.refuel, offered: [offered] },
    } as unknown as Partial<TripPlanner>)

    const ids = (mocks.props.pois as Array<{ osm_id: string }>).map(p => p.osm_id)
    expect(ids).toEqual(expect.arrayContaining(['c1', 'r1']))
    // "What is around this piece of map" is a different question from "what is on the
    // way", and its bar is off this tab, so its pins would be pins nobody could clear.
    expect(ids).not.toContain('e1')
    expect(screen.queryByLabelText('Cafés')).not.toBeInTheDocument()
  })

  it('FE-MOB-MAPAREA-009: off the stage a corridor hit is not drawn at all', () => {
    const base = buildPlanner()
    renderArea({ trTab: 'plan' }, {
      roadtripCorridor: { ...base.roadtripCorridor, visible: [{ osm_id: 'c1', lat: 53.5, lng: 9.8, category: 'fuel' }] },
    } as unknown as Partial<TripPlanner>)

    // A pin with no route under it cannot explain where on the drive it sits.
    expect((mocks.props.pois as Array<{ osm_id: string }>).map(p => p.osm_id)).not.toContain('c1')
  })

  it('FE-MOB-MAPAREA-010: a pin tapped on the stage goes through the road trip door', () => {
    const { planner } = renderArea({ trTab: 'roadtrip' })

    const marker = { osm_id: 'c1', name: 'Shell', lat: 53.5, lng: 9.8, category: 'fuel', alongKm: 82 }
    ;(mocks.props.onPoiClick as (m: unknown) => void)(marker)

    expect(planner.handlePoiClick).toHaveBeenCalledWith(marker)
    expect(planner.openAddPlaceFromPoi).not.toHaveBeenCalled()
  })

  it('FE-MOB-MAPAREA-011: on the plan tab it stays the plain place form, carrying the day', () => {
    const { planner } = renderArea({ trTab: 'plan' }, { selectedDayId: 5 })

    const marker = { osm_id: 'e1', name: 'Café', lat: 53.3, lng: 9.6, category: 'cafe' }
    ;(mocks.props.onPoiClick as (m: unknown) => void)(marker)

    expect(planner.openAddPlaceFromPoi).toHaveBeenCalledWith(marker, 5)
    expect(planner.handlePoiClick).not.toHaveBeenCalled()
  })

  it('FE-MOB-MAPAREA-045: a plugin POI is drawn from the search and tapped into the place form like any other', () => {
    const trailhead = {
      osm_id: 'plugin:trail-finder:th-1', name: 'Trailhead', lat: 53.3, lng: 9.6, category: 'plugin:trail-finder/trailheads',
      source: 'plugin:trail-finder', pluginId: 'trail-finder', icon: 'Signpost', color: '#2f855a',
      details: [{ label: 'Length', value: '12 km' }],
    }
    mocks.poi = { ...mocks.poi, pois: [trailhead] }
    const { planner } = renderArea({ trTab: 'plan' }, { selectedDayId: 5 })

    // Handed to the renderer whole, so the pin and the hover card can read its look and rows.
    expect(mocks.props.pois).toEqual([trailhead])
    ;(mocks.props.onPoiClick as (m: unknown) => void)(trailhead)
    expect(planner.openAddPlaceFromPoi).toHaveBeenCalledWith(trailhead, 5)
  })

  it('FE-MOB-MAPAREA-012: a focused hit takes the camera; with nothing pending the stage frames itself', () => {
    const focused = renderArea({ trTab: 'roadtrip' }, { mapFocusPoints: [[53.5, 9.8]] })
    expect(mocks.props.focusPoints).toEqual([[53.5, 9.8]])
    focused.unmount()

    renderArea({ trTab: 'roadtrip' })
    // The stage's own points, which is an array either way: going array → undefined →
    // array is two dependency changes, and the second throws away the traveller's pan.
    expect(Array.isArray(mocks.props.focusPoints)).toBe(true)
  })

  it('FE-MOB-MAPAREA-015: the compass never takes the base-layer switcher\'s slot, on either tab', () => {
    for (const shellOver of [{ trTab: 'plan' }, { trTab: 'roadtrip', mapFront: true }] as Partial<MTripShellApi>[]) {
      const { container, unmount } = renderArea(shellOver)

      expect(parseFloat(compassBand(container)?.style.left ?? '0'))
        .toBeGreaterThanOrEqual(MAP_LAYER_SWITCHER_INSET + MAP_ROUND_CONTROL_SIZE)
      // With the renderer mocked, the compass is still the one element in this layer
      // that sets --bottom-nav-h inline; its left offset joined the same style object.
      expect(container.querySelectorAll('[style*="--bottom-nav-h"]')).toHaveLength(1)
      unmount()
    }
  })

  it('FE-MOB-MAPAREA-016: a re-render with nothing new on the stage hands the map the same drawing', () => {
    const planner = stagePlanner(3)
    const shell = buildShell({ view: 'map', mapFront: true, trTab: 'roadtrip' })
    const { rerender } = render(<MMapArea planner={planner} shell={shell} />)
    const first = { ...mocks.props }

    // The stage really is what is drawn, so the identities below are about something.
    expect((first.places as Array<{ id: number }>).map(p => p.id)).toEqual([11, 12])
    expect(first.route).toHaveLength(1)
    expect(first.accessLines).toHaveLength(1)
    expect(first.focusPoints).toEqual([[53.55, 9.99], [53.87, 10.69]])

    // The shell re-renders on every store write, a satellite tap included. Fresh arrays
    // here would refit the camera over the traveller's pan and set the map's sources
    // again, which is also what kept the style too busy to draw the imagery.
    rerender(<MMapArea planner={planner} shell={shell} />)

    for (const key of DRAWN) expect(mocks.props[key]).toBe(first[key])
  })

  it('FE-MOB-MAPAREA-017: the all days view keeps its day colours between renders too', () => {
    mocks.prefs = { roadtrip_day_colors: true }
    const planner = stagePlanner(null)
    const shell = buildShell({ view: 'map', mapFront: true, trTab: 'roadtrip' })
    const { rerender } = render(<MMapArea planner={planner} shell={shell} />)
    const first = { ...mocks.props }

    // One colour per line, worked out per call, so without the memo a new array each time.
    expect(first.routeColors).toHaveLength(1)
    // Still an array with no stage, which FE-MOB-MAPAREA-012 depends on.
    expect(Array.isArray(first.focusPoints)).toBe(true)

    rerender(<MMapArea planner={planner} shell={shell} />)

    for (const key of DRAWN) expect(mocks.props[key]).toBe(first[key])
  })

  it('FE-MOB-MAPAREA-018: what is kept still follows the stage, the day colours and the places', () => {
    const planner = stagePlanner(3)
    const shell = buildShell({ view: 'map', mapFront: true, trTab: 'roadtrip' })
    const { rerender } = render(<MMapArea planner={planner} shell={shell} />)
    expect(mocks.props.routeColors).toBeUndefined()

    // Kept on its inputs, not frozen: each one below has to reach the map, or a memo
    // missing it would leave the traveller looking at a stage they already left.
    mocks.prefs = { roadtrip_day_colors: true }
    rerender(<MMapArea planner={planner} shell={shell} />)
    expect(mocks.props.routeColors).toHaveLength(1)

    // The store is where the stage reads its places from, and a store write re-renders the area.
    const renamed = buildPlace({ id: 12, name: 'Travemünde' })
    const stored = useTripStore.getState().places
    act(() => { useTripStore.setState({ places: [stored[0], renamed, stored[2]] }) })
    expect(mocks.props.places).toContain(renamed)

    const allDays = { ...planner, selectedDayId: null }
    rerender(<MMapArea planner={allDays} shell={shell} />)
    expect((mocks.props.places as Place[]).map(p => p.id)).toEqual([11, 12])
    expect(mocks.props.places).toContain(renamed)
    expect(mocks.props.focusPoints).toEqual([])

    // Off the tab the stage hands nothing through, so the plan tab frames itself again.
    rerender(<MMapArea planner={allDays} shell={{ ...shell, trTab: 'plan' }} />)
    expect(mocks.props.accessLines).toBeUndefined()
    expect(mocks.props.focusPoints).toBeUndefined()
    expect(mocks.props.places).toBe(allDays.mapPlaces)
  })

  it('FE-MOB-MAPAREA-019: a pin on the stage opens its stop on this card, never the place inspector', () => {
    const planner = drivePlanner(3)
    const shell = stageShell()
    render(<MMapArea planner={planner} shell={shell} />)

    // Lübeck is also a stop the day before; the stage on screen is the one it opens on.
    tapPin(12)
    expect(shell.openSheet).toHaveBeenLastCalledWith('rtstop', { dayId: 3, assignmentId: 32 })
    // Hamburg is left in the morning and come back to at night: the pin opens the first visit.
    tapPin(11)
    expect(shell.openSheet).toHaveBeenLastCalledWith('rtstop', { dayId: 3, assignmentId: 31 })

    // The planner's selection is what the place inspector opens off, so it is never moved.
    expect(planner.handleMarkerClick).not.toHaveBeenCalled()
    expect(planner.setSelectedPlaceId).not.toHaveBeenCalled()
    expect(planner.selectAssignment).not.toHaveBeenCalled()
  })

  it('FE-MOB-MAPAREA-020: over the whole drive a pin opens its first routed visit, and a place no day stops at gets the inspector', () => {
    const planner = drivePlanner(null)
    const shell = stageShell()
    render(<MMapArea planner={planner} shell={shell} />)

    tapPin(12)
    expect(shell.openSheet).toHaveBeenLastCalledWith('rtstop', { dayId: 2, assignmentId: 21 })
    tapPin(11)
    expect(shell.openSheet).toHaveBeenLastCalledWith('rtstop', { dayId: 3, assignmentId: 31 })

    tapPin(99)
    expect(planner.handleMarkerClick).toHaveBeenCalledWith(99)
    expect(shell.openSheet).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-MAPAREA-021: a picked day with no stage to show searches the whole drive, and falls back the same way', () => {
    // A quiet day the routing round has no card for.
    const quiet = drivePlanner(7)
    const shell = stageShell()
    const { unmount } = render(<MMapArea planner={quiet} shell={shell} />)
    tapPin(12)
    expect(shell.openSheet).toHaveBeenLastCalledWith('rtstop', { dayId: 2, assignmentId: 21 })
    tapPin(99)
    expect(quiet.handleMarkerClick).toHaveBeenCalledWith(99)
    unmount()

    // Still routing: a day is picked, nothing has come back yet, and the inspector is all there is.
    const base = drivePlanner(3)
    const routing = { ...base, roadtripRoutes: { ...base.roadtripRoutes, days: [], loading: true } } as TripPlanner
    const waiting = stageShell()
    render(<MMapArea planner={routing} shell={waiting} />)
    tapPin(11)
    expect(routing.handleMarkerClick).toHaveBeenCalledWith(11)
    expect(waiting.openSheet).not.toHaveBeenCalled()
    // A handler called without a place clears the way the planner's own does.
    tapPin(undefined)
    expect(routing.handleMarkerClick).toHaveBeenLastCalledWith(undefined)
  })

  it('FE-MOB-MAPAREA-022: the plan tab keeps the planner\'s own marker door, map tap and selection', () => {
    const planner = drivePlanner(3, { selectedPlaceId: 12 })
    const shell = buildShell({ view: 'map', mapFront: true, trTab: 'plan' })
    render(<MMapArea planner={planner} shell={shell} />)

    expect(mocks.props.onMarkerClick).toBe(planner.handleMarkerClick)
    expect(mocks.props.onMapClick).toBe(planner.handleMapClick)
    expect(mocks.props.selectedPlaceId).toBe(12)

    tapPin(12)
    expect(planner.handleMarkerClick).toHaveBeenCalledWith(12)
    expect(shell.openSheet).not.toHaveBeenCalled()
  })

  it('FE-MOB-MAPAREA-023: the stage\'s pin handler keeps its identity across renders and reads the latest stage', () => {
    const planner = drivePlanner(3)
    const shell = stageShell()
    const { rerender } = render(<MMapArea planner={planner} shell={shell} />)
    const first = mocks.props.onMarkerClick

    // New planner and shell objects, the way the shell hands them over on every store write.
    // Leaflet rebuilds every marker when this identity moves.
    rerender(<MMapArea planner={{ ...planner }} shell={stageShell()} />)
    expect(mocks.props.onMarkerClick).toBe(first)

    // Swiped to the day before: the same handler now answers for that stage and that shell.
    const next = stageShell()
    rerender(<MMapArea planner={{ ...planner, selectedDayId: 2 }} shell={next} />)
    expect(mocks.props.onMarkerClick).toBe(first)
    tapPin(12)
    expect(next.openSheet).toHaveBeenCalledWith('rtstop', { dayId: 2, assignmentId: 21 })
    expect(shell.openSheet).not.toHaveBeenCalled()
  })

  it('FE-MOB-MAPAREA-024: stage pins are the stops of its chain, whatever the plan tab\'s declutter and filters hide', () => {
    // A pump hidden from the day lists, and a category filter set in the places browser.
    const pump = buildPlace({ id: 12, stop_type: 'fuel', category_id: 3 } as Partial<Place>)
    seedStore(useTripStore, { placesFilter: 'unplanned', placesCategoryFilter: new Set(['9']) })
    const planner = stagePlanner(3)
    seedStore(useTripStore, { places: [buildPlace({ id: 11, category_id: 4 }), pump, buildPlace({ id: 99 })] })
    // The plan tab's list after "all days" twice and a chip tap: its declutter still names
    // the day before, so it carries none of this stage's places.
    const decluttered = { ...planner, mapPlaces: [buildPlace({ id: 99 })] } as TripPlanner
    render(<MMapArea planner={decluttered} shell={stageShell()} />)

    expect((mocks.props.places as Place[]).map(p => p.id)).toEqual([11, 12])

    // A place without a position has nowhere to stand, on the stage as anywhere else.
    act(() => {
      useTripStore.setState({ places: [buildPlace({ id: 11 }), { ...pump, lat: null, lng: null } as unknown as Place] })
    })
    expect((mocks.props.places as Place[]).map(p => p.id)).toEqual([11])
  })

  it('FE-MOB-MAPAREA-025: a shown point holds the camera on its own day only, and a day change hands the frame back', () => {
    const planner = drivePlanner(3)
    const shell = stageShell()
    const point: [number, number][] = [[50, 8]]
    const { rerender } = render(<MMapArea planner={{ ...planner, mapFocusPoints: point }} shell={shell} />)
    expect(mocks.props.focusPoints).toBe(point)

    // The planner keeps the point until its next routing round. The swipe frames its stage anyway.
    rerender(<MMapArea planner={{ ...planner, selectedDayId: 2, mapFocusPoints: point }} shell={shell} />)
    expect(mocks.props.focusPoints).toEqual([[53.87, 10.69]])

    // Coming back does not bring the old point back: the camera belongs to the stage now.
    rerender(<MMapArea planner={{ ...planner, selectedDayId: 3, mapFocusPoints: point }} shell={shell} />)
    expect(mocks.props.focusPoints).not.toBe(point)
    expect(mocks.props.focusPoints).toEqual(expect.arrayContaining([[53.55, 9.99], [53.87, 10.69]]))

    // A new point arriving together with its day, as Show on map from another card does, is held.
    const shown: [number, number][] = [[53.87, 10.69]]
    rerender(<MMapArea planner={{ ...planner, selectedDayId: 2, mapFocusPoints: shown }} shell={shell} />)
    expect(mocks.props.focusPoints).toBe(shown)
  })

  it('FE-MOB-MAPAREA-036: a stage keeps its own night pause and drops the other days', () => {
    // A night pause is the moon pill where a travel day ends. The markers are built from
    // the whole drive, so day 1 used to carry day 2's pill as well, in the middle of a map
    // that draws day 1 only. `stagePlanner(3)` is day 1 of the drive (stageDay).
    const own = { lat: 53.87, lng: 10.69, tone: 'default' as const, nightPause: { day: 1, atPlace: false } }
    const other = { lat: 53.55, lng: 9.99, tone: 'default' as const, nightPause: { day: 2, atPlace: false } }
    const plain = { lat: 53.6, lng: 10.2, tone: 'default' as const, label: 'Rest stop' }
    const vias = [own, other, plain]

    const stage = renderArea(
      { trTab: 'roadtrip', mapFront: true },
      { ...stagePlanner(3), roadtripMapVias: vias } as unknown as Partial<TripPlanner>,
    )
    // Its own night and everything that is not one; day 2's pill stays off this map.
    expect(mocks.props.routeVias).toEqual([own, plain])
    stage.unmount()

    // Off a stage the list is left alone: in the all-days view every night belongs to a
    // line that is actually drawn.
    renderArea({ trTab: 'plan' }, { routeVias: vias })
    expect(mocks.props.routeVias).toBe(vias)
  })

  it('FE-MOB-MAPAREA-026: the map layer carries no credit corner on either tab', () => {
    const plan = renderArea()
    const planLayer = plan.container.firstElementChild as HTMLElement
    // The phone map shows no credit at all now (mobile.css), so the class that used to
    // place one is gone rather than left behind pointing at nothing.
    expect(planLayer.classList.contains('m-credit-corner')).toBe(false)
    plan.unmount()

    const { container } = renderArea({ trTab: 'roadtrip', mapFront: true })
    const stageLayer = container.firstElementChild as HTMLElement
    expect(stageLayer.classList.contains('m-credit-corner')).toBe(false)
  })

  it('FE-MOB-MAPAREA-028: on the stage the map draws the offered roads, and a tap on one only lights it', () => {
    const { planner } = renderArea(
      { trTab: 'roadtrip', rtView: 'map' },
      withPicker(OFFERS, { highlightedAlternative: 1 }),
    )

    expect(mocks.props.alternativeRoutes).toBe(planner.alternativeOverlays)
    expect(mocks.props.activeAlternative).toBe(1)

    ;(mocks.props.onChooseAlternative as (index: number) => void)(0)
    // Glass has no hover to preview with, so the desk's click that takes a road would save a
    // via on the first touch. The bar's confirm is what takes it here.
    expect(planner.setHighlightedAlternative).toHaveBeenCalledWith(0)
    expect(planner.chooseRouteAlternative).not.toHaveBeenCalled()
    // A touch fires emulated enter and leave events, and the leave would put the road out.
    expect(mocks.props.onHighlightAlternative).toBeUndefined()
  })

  it('FE-MOB-MAPAREA-029: the plan tab draws no offered roads and frames nothing for them', () => {
    renderArea({ trTab: 'plan' }, withPicker(OFFERS, { highlightedAlternative: 1 }))

    expect(mocks.props.alternativeRoutes).toBeUndefined()
    expect(mocks.props.activeAlternative).toBeUndefined()
    expect(mocks.props.onChooseAlternative).toBeUndefined()
    expect(mocks.props.fitPadding).toBeUndefined()
  })

  it('FE-MOB-MAPAREA-030: with the picker open the floor clears its taller bar, and the compass is still the one inline --bottom-nav-h', () => {
    const { container, unmount } = renderArea({ trTab: 'roadtrip', mapFront: true }, withPicker([]))
    const layer = container.firstElementChild as HTMLElement

    // 174px of bar and the stage bar's 15px gap, as soon as the question is asked.
    expect(layer.style.getPropertyValue('--m-stage-lift')).toBe(`${RT_ALT_BAR_LIFT}px`)
    expect(layer.style.getPropertyValue('--m-stage-lift')).toBe('189px')
    expect(layer.getAttribute('style')).not.toContain('--bottom-nav-h')
    expect(container.querySelectorAll('[style*="--bottom-nav-h"]')).toHaveLength(1)
    expect(compassBand(container)).not.toBeNull()
    unmount()

    // Behind the chain the bar is not on screen, so nothing lifts.
    const behind = renderArea({ trTab: 'roadtrip', mapFront: false }, withPicker([]))
    expect((behind.container.firstElementChild as HTMLElement).style.getPropertyValue('--m-stage-lift')).toBe('0px')
  })

  it('FE-MOB-MAPAREA-031: the offered roads are framed between the day chips and the bar, once they are there', () => {
    const shell = stageShell()
    const asking = buildPlanner(withPicker([]))
    const { rerender } = render(<MMapArea planner={asking} shell={shell} />)
    // Nothing to frame while the router is asked: a padding handed over now would refit
    // the stage into a smaller frame just before the answer moves the camera again.
    expect(mocks.props.fitPadding).toBeUndefined()

    const answered = { ...asking, ...withPicker(OFFERS) } as TripPlanner
    rerender(<MMapArea planner={answered} shell={shell} />)
    // Top: 12 of --m-safe-top, the rail's 50 offset and 42 height, a 12 gap. Bottom: the
    // dock's 74 and the bar's lift. The sides keep the phone's 20.
    expect(mocks.props.fitPadding).toEqual({ top: 116, right: 20, bottom: 74 + RT_ALT_BAR_LIFT, left: 20 })
    const first = mocks.props.fitPadding

    // Kept between renders, for the reason the stage data is.
    rerender(<MMapArea planner={{ ...answered }} shell={shell} />)
    expect(mocks.props.fitPadding).toBe(first)

    // Closed, the stage frames itself with the engines' own margins again.
    rerender(<MMapArea planner={{ ...answered, ...withPicker([]), routeAlternatives: buildPlanner().routeAlternatives }} shell={shell} />)
    expect(mocks.props.fitPadding).toBeUndefined()
  })

  it('FE-MOB-MAPAREA-032: on a phone with a notch the frame moves in by the safe area, and follows a turn of the phone', () => {
    const style = notchedPhone('59px', '34px')
    renderArea({ trTab: 'roadtrip', rtView: 'map' }, withPicker(OFFERS))

    expect(mocks.props.fitPadding).toEqual({ top: 59 + 116, right: 20, bottom: 34 + 74 + RT_ALT_BAR_LIFT, left: 20 })

    // Turned sideways the insets go to the edges, and the frame lets go of them.
    style.mockRestore()
    notchedPhone('0px', '21px')
    act(() => { window.dispatchEvent(new Event('resize')) })
    expect(mocks.props.fitPadding).toEqual({ top: 116, right: 20, bottom: 21 + 74 + RT_ALT_BAR_LIFT, left: 20 })
  })

  it('FE-MOB-MAPAREA-027: the layer sets only the lift inline, so the compass stays the one inline --bottom-nav-h', () => {
    for (const shellOver of [{ trTab: 'plan' }, { trTab: 'roadtrip', mapFront: true }] as Partial<MTripShellApi>[]) {
      const { container, unmount } = renderArea(shellOver)
      const inline = (container.firstElementChild as HTMLElement).getAttribute('style') ?? ''

      // The floor and the band are classes: a second element naming --bottom-nav-h inline
      // would leave nothing to tell the compass band apart by.
      expect(inline).toContain('--m-stage-lift')
      expect(inline).not.toContain('--bottom-nav-h')
      expect(inline).not.toContain('--m-map-floor')
      expect(inline).not.toContain('--m-credit')
      expect(container.querySelectorAll('[style*="--bottom-nav-h"]')).toHaveLength(1)
      expect(compassBand(container)).not.toBeNull()
      unmount()
    }
  })

  it('FE-MOB-MAPAREA-033: a point the planner hands back once offers or roads close does not take the camera again', () => {
    const planner = drivePlanner(2)
    const shell = stageShell()
    const view = (dayId: number, mapFocusPoints: [number, number][], alternativeFocusPoints: [number, number][] = []) =>
      <MMapArea planner={{ ...planner, selectedDayId: dayId, mapFocusPoints, alternativeFocusPoints }} shell={shell} />
    const point: [number, number][] = [[50, 8]]
    const { rerender } = render(view(2, point))
    expect(mocks.props.focusPoints).toBe(point)

    // Swiped on: the planner still keeps the point from day 2, and this stage frames itself.
    rerender(view(3, point))
    const stageFrame = mocks.props.focusPoints
    expect(stageFrame).not.toBe(point)

    // The fuel offers take the camera, and closing them hands the same point back. The chips
    // still say day 3, so flying to day 2's stop would leave the map on a stage nobody picked.
    const offers: [number, number][] = [[53.4, 9.7]]
    rerender(view(3, offers))
    expect(mocks.props.focusPoints).toBe(offers)
    rerender(view(3, point))
    expect(mocks.props.focusPoints).toBe(stageFrame)

    // On its own day as well: the roads for a leg, cancelled, give the frame back to the stage.
    const shown: [number, number][] = [[53.87, 10.69]]
    rerender(view(3, shown))
    expect(mocks.props.focusPoints).toBe(shown)
    const roads: [number, number][] = [[53.55, 9.99], [53.7, 10.2], [53.87, 10.69]]
    rerender(view(3, roads, roads))
    expect(mocks.props.focusPoints).toBe(roads)
    rerender(view(3, shown))
    expect(mocks.props.focusPoints).toBe(stageFrame)

    // And every time after: a second round of offers is new, the point behind it is not.
    const again: [number, number][] = [[53.3, 9.6]]
    rerender(view(3, again))
    expect(mocks.props.focusPoints).toBe(again)
    rerender(view(3, shown))
    expect(mocks.props.focusPoints).toBe(stageFrame)
  })

  it('FE-MOB-MAPAREA-034: fuel offers asked over an open picker give the camera back to its roads when they close', () => {
    const planner = drivePlanner(3)
    const shell = stageShell()
    const roads: [number, number][] = [[53.55, 9.99], [53.7, 10.2], [53.87, 10.69]]
    const view = (mapFocusPoints: [number, number][], alternativeFocusPoints: [number, number][]) =>
      <MMapArea planner={{ ...planner, mapFocusPoints, alternativeFocusPoints }} shell={shell} />
    const { rerender } = render(view(roads, roads))
    expect(mocks.props.focusPoints).toBe(roads)

    const offers: [number, number][] = [[53.4, 9.7]]
    rerender(view(offers, roads))
    expect(mocks.props.focusPoints).toBe(offers)

    // The picker is still open and still asking about its leg, so its roads are framed again.
    rerender(view(roads, roads))
    expect(mocks.props.focusPoints).toBe(roads)

    // Closed, nothing is pending and the stage frames itself.
    const closed: [number, number][] = []
    rerender(view(closed, closed))
    expect(mocks.props.focusPoints).toEqual([[53.55, 9.99], [53.87, 10.69], [53.55, 9.99]])
  })

  it('FE-MOB-MAPAREA-035: the all days view pins every stored visit, a booked night and a hidden service stop included', () => {
    const hotel = buildPlace({ id: 20 })
    const pump = buildPlace({ id: 21, stop_type: 'fuel' } as Partial<Place>)
    const base = drivePlanner(null)
    // The places browser on 'unplanned' with a category picked, which empties the plan tab's map.
    seedStore(useTripStore, {
      places: [buildPlace({ id: 11 }), hotel, pump, buildPlace({ id: 99 })],
      placesFilter: 'unplanned',
      placesCategoryFilter: new Set(['9']),
    })
    const planner = {
      ...base,
      mapPlaces: [],
      // The planner's planned list on a phone: its day lists leave the booked night and the
      // hidden pump out, so it is not what the drive the routing round draws stops at.
      roadtripMapPlaces: [buildPlace({ id: 11 })],
      storedAssignments: {
        '3': [
          buildAssignment({ day_id: 3, place: buildPlace({ id: 11 }) }),
          buildAssignment({ day_id: 3, place: pump }),
        ],
        '4': [buildAssignment({ day_id: 4, place: hotel, accommodation_id: 5 })],
      },
    } as TripPlanner
    render(<MMapArea planner={planner} shell={stageShell()} />)

    expect((mocks.props.places as Place[]).map(p => p.id)).toEqual([11, 20, 21])
    expect(mocks.props.places).not.toBe(planner.roadtripMapPlaces)
  })

  it('FE-MOB-MAPAREA-037: on the stage a seamed ride draws as its booking, whether or not it was toggled on', () => {
    // The ride's own leg carries no geometry (carrierLeg), so the booking's arc is the
    // only thing that joins the two terminals on the map. The planner folds the seamed
    // bookings into `roadtripConnections`; the stage has to read that list, not the
    // plan tab's toggles, or the road ends at the departure gate and picks up again at
    // the arrival with nothing between.
    const base = stagePlanner(3)
    const [hamburg] = stageDay().stops
    const terminal = (role: 'departure' | 'arrival') => ({
      ...hamburg,
      assignmentId: role === 'departure' ? -3000000140 : -3000000141,
      placeId: -70,
      name: role === 'departure' ? 'Hamburg Airport' : 'Munich Airport',
      carrier: { reservationId: 70, type: 'flight', role, title: 'LH 2020', code: null, at: null },
    })
    const seamed = { ...stageDay(), stops: [hamburg, terminal('departure'), terminal('arrival')] } as unknown as RoadtripDay
    const planner = {
      ...base,
      roadtripRoutes: { ...base.roadtripRoutes, days: [seamed] },
      visibleConnections: [],
      roadtripConnections: [70],
    } as TripPlanner
    const shell = stageShell()
    const { rerender } = render(<MMapArea planner={planner} shell={shell} />)

    expect(mocks.props.visibleConnectionIds).toEqual([70])
    // A seamed ride joins the road whatever day it was booked on, so the stage does not
    // hold bookings to the selected day the way the plan map does.
    expect(mocks.props.scopeConnectionsToDay).toBe(false)

    // The plan tab keeps the traveller's own toggles, as the desktop does off road trip mode.
    rerender(<MMapArea planner={planner} shell={{ ...shell, trTab: 'plan' }} />)
    expect(mocks.props.visibleConnectionIds).toBe(planner.visibleConnections)
    expect(mocks.props.visibleConnectionIds).toEqual([])
    expect(mocks.props.scopeConnectionsToDay).toBe(true)
  })
})

/**
 * #2456: the phone map is one day's picture. A day chip frames the day, draws its route
 * and drops the other days' pins (MTripShell.selectDayOnMap), and the automated
 * transports ride the day since #2019. A booking switched on through its own toggle
 * ("On map") stayed on every day's map, though, because the per-booking branch of
 * visibleRouteReservations is trip-wide.
 *
 * The renderer is mocked here, so what it WOULD draw is worked out the way both engines
 * work it out: MapView and MapViewGL hand their own props to visibleRouteReservations.
 * The whole prop bag goes in, so a day-scoping option added to the renderers under the
 * util's own name is picked up as well as a filtered id list is.
 */
describe('MMapArea booking routes on the day-scoped plan map (#2456)', () => {
  const DAYS = [
    { id: 10, trip_id: 1, day_number: 1, date: '2026-05-01' },
    { id: 11, trip_id: 1, day_number: 2, date: '2026-05-02' },
    { id: 12, trip_id: 1, day_number: 3, date: '2026-05-03' },
  ] as Day[]

  function flight(over: Partial<Reservation> = {}): Reservation {
    return {
      id: 7, trip_id: 1, type: 'flight', title: 'FRA → LIS', status: 'confirmed',
      day_id: 10, end_day_id: 10,
      reservation_time: '2026-05-01T09:00', reservation_end_time: '2026-05-01T11:00',
      endpoints: [
        { role: 'from', sequence: 0, name: 'Frankfurt', code: 'FRA', lat: 50.03, lng: 8.57, timezone: null, local_time: null, local_date: null },
        { role: 'to', sequence: 1, name: 'Lisbon', code: 'LIS', lat: 38.77, lng: -9.13, timezone: null, local_time: null, local_date: null },
      ],
      ...over,
    } as unknown as Reservation
  }

  /** The plan tab's map in front, a booking switched on, and the given day on the chips. */
  function renderPlanMap(selectedDayId: number | null, booking: Reservation = flight()) {
    const planner = buildPlanner({
      days: DAYS,
      selectedDayId,
      reservations: [booking],
      visibleConnections: [booking.id],
      transitRoutesShown: false,
    } as unknown as Partial<TripPlanner>)
    render(<MMapArea planner={planner} shell={buildShell({ view: 'map', mapFront: true, trTab: 'plan' })} />)
  }

  /** The booking ids either renderer would draw a route for, from the props it was handed. */
  const drawnBookingIds = () => visibleRouteReservations(
    (mocks.props.reservations as Reservation[]) ?? [],
    mocks.props as unknown as RouteVisibilityOptions,
  ).map(r => r.id)

  it('FE-MOB-MAPAREA-038: a booking switched on for day 1 is not drawn on the map of day 3', () => {
    renderPlanMap(12)

    expect(drawnBookingIds()).toEqual([])
  })

  it('FE-MOB-MAPAREA-039: the booking stays drawn on the day it runs on', () => {
    renderPlanMap(10)

    expect(drawnBookingIds()).toEqual([7])
  })

  it('FE-MOB-MAPAREA-040: an overnight booking is drawn on both of its days and on no other', () => {
    const overnight = flight({ day_id: 10, end_day_id: 11 })

    renderPlanMap(11, overnight)
    expect(drawnBookingIds()).toEqual([7])

    renderPlanMap(12, overnight)
    expect(drawnBookingIds()).toEqual([])
  })

  it('FE-MOB-MAPAREA-041: the all days view keeps every switched-on booking', () => {
    renderPlanMap(null)

    expect(drawnBookingIds()).toEqual([7])
  })

  it('FE-MOB-MAPAREA-042: a booking bound to no day keeps drawing on every day', () => {
    renderPlanMap(12, flight({ day_id: null, end_day_id: null }))

    expect(drawnBookingIds()).toEqual([7])
  })
})

describe('MMapArea and a booked night at the edge of the stage', () => {
  it('FE-MOB-MAPAREA-043: a pin at the hotel opens its stored stop, never the bookend in front of it, else the inspector', () => {
    const base = drivePlanner(3)
    const [before, loop] = base.roadtripRoutes.days
    const hotel = (placeId: number) => ({
      ...loop.stops[0],
      assignmentId: -6_000_000_006,
      placeId,
      ownerIndex: 0,
      stopType: 'hotel',
      bookend: { phase: 'morning', accommodationId: 5, reservationId: null, checkingOut: false, checkingIn: false, checkOut: null },
    })
    const withBookend = (placeId: number) => ({
      ...base,
      roadtripRoutes: { ...base.roadtripRoutes, days: [before, { ...loop, stops: [hotel(placeId), ...loop.stops] }] },
    }) as TripPlanner
    const shell = stageShell()
    const { unmount } = render(<MMapArea planner={withBookend(11)} shell={shell} />)
    tapPin(11)
    expect(shell.openSheet).toHaveBeenLastCalledWith('rtstop', { dayId: 3, assignmentId: 31 })
    unmount()

    // A hotel the drive has as its bookend only: the road trip has no stop to open.
    const only = withBookend(99)
    const other = stageShell()
    render(<MMapArea planner={only} shell={other} />)
    tapPin(99)
    expect(other.openSheet).not.toHaveBeenCalled()
    expect(only.handleMarkerClick).toHaveBeenCalledWith(99)
  })

  it('FE-MOB-MAPAREA-044: the POI bar offers the plugin categories after its divider, without shrinking a segment', () => {
    const plugin = pluginPoiCategories([{
      id: 'trail-finder', name: 'Trail finder', type: 'integration', icon: null,
      poiCategories: [{ id: 'trailheads', label: 'Trailheads', icon: 'Signpost', color: '#2f855a' }],
    }], 'en')
    mocks.poi = { ...mocks.poi, categories: { core: corePoiCategories(key => key), plugin } }
    renderArea()

    const divider = screen.getByRole('separator')
    const trailheads = screen.getByRole('button', { name: 'Trailheads' })
    expect(divider.nextElementSibling).toBe(trailheads)
    expect(trailheads.style.minWidth).toBe('34px')
    expect((divider.parentElement as HTMLElement).style.overflowX).toBe('auto')
    trailheads.click()
    expect(mocks.poi.toggle).toHaveBeenCalledWith('plugin:trail-finder/trailheads')
  })
})
