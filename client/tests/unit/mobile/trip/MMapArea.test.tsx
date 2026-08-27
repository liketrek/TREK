import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../helpers/render'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { CompassMap } from '../../../../src/components/Map/MapCompassPill'
import { useSettingsStore } from '../../../../src/store/settingsStore'

// FE-MOB-MAPAREA-001 to FE-MOB-MAPAREA-007

const mocks = vi.hoisted(() => ({
  poi: {} as Record<string, unknown>,
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

import MMapArea from '../../../../src/mobile/screens/trip/map/MMapArea'

const COMPASS: CompassMap = {
  getBearing: () => 0,
  on: vi.fn(),
  off: vi.fn(),
  easeTo: vi.fn(),
}

function renderArea(shellOver: Partial<MTripShellApi> = {}, plannerOver: Partial<TripPlanner> = {}) {
  const planner = buildPlanner(plannerOver)
  const shell = buildShell({ view: 'map', ...shellOver })
  return { planner, shell, ...render(<MMapArea planner={planner} shell={shell} />) }
}

/** The compass wrapper is the only element carrying an inline bottom offset. */
const compassBand = (container: HTMLElement) =>
  container.querySelector('[style*="--bottom-nav-h"]') as HTMLElement | null

beforeEach(() => {
  mocks.glMap = COMPASS
  mocks.poi = {
    active: new Set<string>(), pois: [], loadingKeys: new Set<string>(), errorKeys: new Set<string>(),
    moved: false, toggle: vi.fn(), searchArea: vi.fn(), onViewportChange: vi.fn(),
  }
  useSettingsStore.setState(s => ({ settings: { ...s.settings, map_poi_pill_enabled: true } }))
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
    expect(compassBand(container)?.className).toContain('left-3')
  })

  it('FE-MOB-MAPAREA-003: the map layer floats those controls a dock gap above the dock', () => {
    const { container } = renderArea()

    // The dock is 62px tall at safe-bottom + 12; the controls add their own 12.
    expect((container.firstElementChild as HTMLElement).className)
      .toContain('[--bottom-nav-h:calc(env(safe-area-inset-bottom,0px)+74px)]')
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
    const { container } = renderArea({ view: 'plan' })

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
})
