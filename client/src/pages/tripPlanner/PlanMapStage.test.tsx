// FE-PAGE-PLANNER-MAPSTAGE-001 to FE-PAGE-PLANNER-MAPSTAGE-010
//
// The plan tab's map and its floating controls, rendered on their own. The map
// and the pills are stubs that record their props, so each mode the stage
// switches between (day route, road trip, trip overview) is read off directly.
import React from 'react'
import { render, screen } from '../../../tests/helpers/render'
import { buildTrip, buildPlace, buildReservation } from '../../../tests/helpers/factories'
import { PlanMapStage, type PlanMapStageProps } from './PlanMapStage'

type Recorded = Record<string, unknown> & Record<`on${string}`, (...args: unknown[]) => unknown>
const captured = vi.hoisted(() => ({} as Record<string, Record<string, unknown>>))
const stub = vi.hoisted(() => (name: string, testId: string) => (props: Record<string, unknown>) => {
  captured[name] = props
  return React.createElement('div', { 'data-testid': testId })
})
vi.mock('../../components/Map/MapViewAuto', () => ({ MapViewAuto: stub('map', 'map-view') }))
vi.mock('../../components/Map/MapCompassPill', () => ({ MapCompassPill: stub('compass', 'compass-pill') }))
vi.mock('../../components/Map/PoiCategoryPill', () => ({ default: stub('poiPill', 'poi-pill') }))
vi.mock('../../components/Map/TripRouteOverview', () => ({
  TripRouteOverviewPill: stub('overviewPill', 'overview-pill'),
  TripRouteOverviewPanel: stub('overviewPanel', 'overview-panel'),
}))
vi.mock('../../components/Map/DawarichTrailPill', () => ({ DawarichTrailPill: stub('dawarichPill', 'dawarich-pill') }))
vi.mock('../../components/Roadtrip/RoadtripAlternativesBar', () => ({ default: stub('alternativesBar', 'alternatives-bar') }))

function recorded(name: string): Recorded {
  return captured[name] as Recorded
}

const trip = buildTrip({ id: 12 })
const place = buildPlace({ id: 4 })
const flight = buildReservation({ id: 70, trip_id: 12 })

// The fixture holds what the stage reads; the hook's full types do not matter here.
function stageProps(overrides: Partial<Record<keyof PlanMapStageProps, unknown>> = {}): PlanMapStageProps {
  const base: Partial<Record<keyof PlanMapStageProps, unknown>> = {
    tripId: 12, trip, can: () => true, days: [], reservations: [flight], isMobile: false,
    selectedDayId: 3, selectedPlaceId: null, selectedPlace: null, showDayDetail: null, handleSelectDay: vi.fn(),
    mapPlaces: ['day places'], dayPlaces: [], dayOrderMap: {}, mapTileUrl: 'tiles', fitKey: 1,
    mapLocked: false, toggleMapLocked: vi.fn(), mapFocusPoints: ['day focus'],
    route: ['day route'], routeWalking: ['walking'], routeSegments: ['day segments'], routeVias: ['day vias'], transitRoutesShown: true,
    handleMarkerClick: vi.fn(), handleMapClick: vi.fn(), handleMapContextMenu: vi.fn(), handlePoiClick: vi.fn(),
    visibleConnections: ['day connections'], setMapTransportDetail: vi.fn(), openBookingDetail: vi.fn(),
    roadtripActive: false, roadtripMapPlaces: ['stops'], roadtripMapLines: ['drive'], roadtripLineColors: ['red'],
    roadtripMapVias: ['drive vias'], roadtripRoutes: { accessLines: ['access'], segments: ['drive segments'] },
    roadtripConnections: ['rides'], roadtripVias: { byDay: { 3: [] } },
    dayBoundaryControls: ['boundaries'], dropPoiOnRoute: vi.fn(), addRoadtripVia: vi.fn(), moveRoadtripVia: vi.fn(), removeRoadtripVia: vi.fn(),
    routeAlternatives: { open: null, close: vi.fn() }, alternativeOverlays: ['overlays'], highlightedAlternative: null,
    chooseRouteAlternative: vi.fn(), setHighlightedAlternative: vi.fn(),
    overviewActive: false, overviewShown: false, toggleOverview: vi.fn(),
    tripOverview: { lines: ['overview'], lineColors: ['blue'], segments: ['overview segments'], focusPoints: ['overview focus'] },
    dawarichEnabled: false, dawarichTrail: { track: ['recorded'], status: 'idle' }, dawarichHiddenDates: ['2025-06-02'],
    dawarichTrailShown: false, toggleDawarichTrail: vi.fn(),
    mobileSidebarOpen: null, showPlaceForm: false, showMembersModal: false, showReservationModal: false,
    poi: { categories: { core: [], plugin: [] }, active: [], toggle: vi.fn(), loadingKeys: [], errorKeys: [], moved: false, searchArea: vi.fn() },
    tourMap: { captureViewport: vi.fn() },
    leftPanelPx: 320, rightPanelPx: 0, mapInsetLeft: 330, mapInsetRight: 0,
    glMap: null, setGlMap: vi.fn(), poiPillEnabled: true, mapPois: ['pois'], distanceUnit: 'metric',
  }
  return { ...base, ...overrides } as unknown as PlanMapStageProps
}

function renderStage(overrides: Partial<Record<keyof PlanMapStageProps, unknown>> = {}) {
  const props = stageProps(overrides)
  return { props, ...render(<PlanMapStage {...props} />) }
}

beforeEach(() => {
  for (const key of Object.keys(captured)) delete captured[key]
})

describe('PlanMapStage', () => {
  it('FE-PAGE-PLANNER-MAPSTAGE-001: on an ordinary day the map draws that day', () => {
    renderStage()
    const map = recorded('map')

    expect(map).toMatchObject({
      places: ['day places'], route: ['day route'], routeColors: undefined, routeWalking: ['walking'],
      routeSegments: ['day segments'], routeVias: ['day vias'], focusPoints: ['day focus'],
      visibleConnectionIds: ['day connections'], dayBoundaryControls: undefined, accessLines: undefined,
      roadtripVias: undefined, onPoiDropOnRoute: undefined, onRouteClick: undefined, clusterLoosely: false,
      followSelection: true, leftWidth: 320, rightWidth: 0, hasInspector: false, hasDayDetail: false,
      dawarichTrack: ['recorded'], dawarichHiddenDates: ['2025-06-02'], pois: ['pois'], tileUrl: 'tiles',
    })
    expect(screen.getByTestId('overview-pill')).toBeInTheDocument()
    expect(screen.queryByTestId('overview-panel')).toBeNull()
    expect(screen.queryByTestId('dawarich-pill')).toBeNull()
    expect(screen.queryByTestId('alternatives-bar')).toBeNull()
  })

  it('FE-PAGE-PLANNER-MAPSTAGE-002: in road trip mode the map draws the drive and edits it', () => {
    const { props } = renderStage({ roadtripActive: true })
    const map = recorded('map')

    expect(map).toMatchObject({
      places: ['stops'], route: ['drive'], routeColors: ['red'], routeWalking: undefined,
      routeSegments: ['drive segments'], routeVias: ['drive vias'], dayBoundaryControls: ['boundaries'],
      accessLines: ['access'], visibleConnectionIds: ['rides'], roadtripVias: { 3: [] }, clusterLoosely: true,
    })
    expect(map.onPoiDropOnRoute).toBe(props.dropPoiOnRoute)
    expect(map.onRouteClick).toBe(props.addRoadtripVia)
    expect(map.onMoveVia).toBe(props.moveRoadtripVia)
    expect(map.onRemoveVia).toBe(props.removeRoadtripVia)
    // The overview belongs to the plan, so the whole stack goes while it is the only thing in it.
    expect(screen.queryByTestId('overview-pill')).toBeNull()
  })

  it('FE-PAGE-PLANNER-MAPSTAGE-003: without the day right the drive cannot be edited from the map', () => {
    const can = vi.fn((action: string) => action !== 'day_edit')
    renderStage({ roadtripActive: true, can })
    const map = recorded('map')

    expect(can).toHaveBeenCalledWith('day_edit', trip)
    expect(map.onRouteClick).toBeUndefined()
    expect(map.onMoveVia).toBeUndefined()
    expect(map.onRemoveVia).toBeUndefined()
  })

  it('FE-PAGE-PLANNER-MAPSTAGE-004: the trip overview replaces the day route and opens its panel', () => {
    const { props } = renderStage({ overviewActive: true, overviewShown: true })
    const map = recorded('map')

    expect(map).toMatchObject({
      route: ['overview'], routeColors: ['blue'], routeSegments: ['overview segments'],
      focusPoints: ['overview focus'], routeWalking: undefined,
    })
    expect(recorded('overviewPanel')).toMatchObject({ overview: props.tripOverview, unit: 'metric', selectedDayId: 3 })
    recorded('overviewPanel').onSelectDay(5)
    expect(props.handleSelectDay).toHaveBeenCalledWith(5)
    expect(recorded('overviewPill')).toMatchObject({ active: true, onToggle: props.toggleOverview })
  })

  it('FE-PAGE-PLANNER-MAPSTAGE-005: the recorded trail stays beside the drive in road trip mode', () => {
    const { props } = renderStage({ roadtripActive: true, dawarichEnabled: true, dawarichTrailShown: true, mapInsetRight: 290 })

    expect(recorded('dawarichPill')).toMatchObject({ active: true, status: 'idle', onToggle: props.toggleDawarichTrail })
    expect(screen.queryByTestId('overview-pill')).toBeNull()
    const stack = screen.getByTestId('dawarich-pill').parentElement as HTMLElement
    expect(stack.style.right).toBe('304px')
    expect(stack.style.left).toBe('')
  })

  it('FE-PAGE-PLANNER-MAPSTAGE-006: an open choice of routes shows the alternatives bar over the map', async () => {
    const open = { dayId: 3 }
    const { props } = renderStage({ routeAlternatives: { open, close: vi.fn() } })

    expect(await screen.findByTestId('alternatives-bar')).toBeInTheDocument()
    expect(recorded('alternativesBar')).toMatchObject({
      open,
      overlays: ['overlays'],
      onChoose: props.chooseRouteAlternative,
      onClose: (props.routeAlternatives as { close: unknown }).close,
      onHighlight: props.setHighlightedAlternative,
    })
  })

  it('FE-PAGE-PLANNER-MAPSTAGE-007: a booking clicked on the map opens where the layout shows bookings', () => {
    const desktop = renderStage()
    recorded('map').onReservationClick(999)
    expect(desktop.props.openBookingDetail).not.toHaveBeenCalled()
    recorded('map').onReservationClick(70)
    expect(desktop.props.openBookingDetail).toHaveBeenCalledWith(flight)
    expect(desktop.props.setMapTransportDetail).not.toHaveBeenCalled()
    desktop.unmount()

    const phone = renderStage({ isMobile: true, mapLocked: true })
    expect(recorded('map')).toMatchObject({ followSelection: true, onToggleFollow: undefined })
    recorded('map').onReservationClick(70)
    expect(phone.props.setMapTransportDetail).toHaveBeenCalledWith(flight)
    expect(phone.props.openBookingDetail).not.toHaveBeenCalled()
  })

  it('FE-PAGE-PLANNER-MAPSTAGE-008: the compass appears once the map hands itself over', () => {
    const { props, rerender } = renderStage({ poiPillEnabled: false })
    expect(screen.queryByTestId('compass-pill')).toBeNull()
    expect(screen.queryByTestId('poi-pill')).toBeNull()
    expect(recorded('map').onMapReady).toBe(props.setGlMap)

    const glMap = { getBearing: () => 0 }
    rerender(<PlanMapStage {...stageProps({ poiPillEnabled: false, glMap })} />)
    // The desktop cluster and the phone's own centre-top copy.
    expect(screen.getAllByTestId('compass-pill')).toHaveLength(2)
    expect(recorded('compass').map).toBe(glMap)
  })

  it('FE-PAGE-PLANNER-MAPSTAGE-009: the phone POI pill steps aside for drawers and dialogs', () => {
    const { rerender } = renderStage()
    const portal = screen.getByTestId('mobile-poi-category-pill')
    expect(portal.parentElement).toBe(document.body)
    expect(portal).toContainElement(screen.getAllByTestId('poi-pill')[1])

    for (const cover of [{ mobileSidebarOpen: 'left' }, { showPlaceForm: true }, { showMembersModal: true }, { showReservationModal: true }]) {
      rerender(<PlanMapStage {...stageProps(cover)} />)
      expect(screen.queryByTestId('mobile-poi-category-pill')).toBeNull()
    }
  })

  it('FE-PAGE-PLANNER-MAPSTAGE-010: the top cluster is centred on the corridor between the panels', () => {
    const { props, container } = renderStage({ mapInsetLeft: 330, mapInsetRight: 290, selectedPlace: place, showDayDetail: { id: 3 } })
    const cluster = container.querySelector('div[style*="translateX(-50%)"][style*="z-index: 25"]') as HTMLElement

    // As the browser normalizes it: half the corridor past the left inset, and no wider than the corridor.
    expect(cluster.style.left).toBe('calc(330px + 0.5 * (100% - 330px - 290px))')
    expect(cluster.style.maxWidth).toBe('calc(100% - 644px)')
    expect(recorded('map')).toMatchObject({ hasInspector: true, hasDayDetail: false, selectedPlace: place })
    const poi = props.poi as unknown as Record<string, unknown>
    expect(recorded('poiPill')).toMatchObject({
      categories: poi.categories, active: poi.active, onToggle: poi.toggle,
      loadingKeys: poi.loadingKeys, errorKeys: poi.errorKeys, moved: false, onSearchArea: poi.searchArea,
    })
  })
})
