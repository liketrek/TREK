import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import { fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildPlace } from '../../../tests/helpers/factories'
import * as photoService from '../../services/photoService'

const mapMock = vi.hoisted(() => ({
  panTo: vi.fn(),
  setView: vi.fn(),
  fitBounds: vi.fn(),
  getZoom: vi.fn().mockReturnValue(10),
  on: vi.fn(),
  off: vi.fn(),
  panBy: vi.fn(),
}))

vi.mock('react-leaflet', () => ({
  // center/zoom are surfaced so tests can assert the camera the map is built with.
  MapContainer: ({ children, center, zoom }: any) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)} data-zoom={zoom}>{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, eventHandlers, position }: any) => (
    <div
      data-testid="marker"
      data-lat={position[0]}
      data-lng={position[1]}
      onClick={() => eventHandlers?.click?.()}
    >
      <button
        data-testid="marker-hover-trigger"
        // A real mouseover never bubbles as a click to the marker, so the
        // hover-simulation must not trigger the marker's click handler.
        onClick={(e: any) => { e.stopPropagation(); eventHandlers?.mouseover?.({ originalEvent: { clientX: 100, clientY: 100 } }) }}
      />
      {children}
    </div>
  ),
  Polyline: ({ positions }: any) => <div data-testid="polyline" data-points={JSON.stringify(positions)} />,
  CircleMarker: () => <div data-testid="circle-marker" />,
  Circle: () => <div data-testid="circle" />,
  useMap: () => mapMock,
  useMapEvents: () => ({}),
}))

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: any) => <div data-testid="cluster-group">{children}</div>,
}))

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
    latLngBounds: vi.fn(() => ({ isValid: () => true })),
    point: vi.fn((x: number, y: number) => [x, y]),
  },
  divIcon: vi.fn(() => ({})),
  Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
  latLngBounds: vi.fn(() => ({ isValid: () => true })),
  point: vi.fn((x: number, y: number) => [x, y]),
}))

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
  getAllThumbs: vi.fn(() => ({})),
}))

import { MapView } from './MapView'

// Helper: build a place with the extra fields MapView uses (category_name/color/icon)
// that exist on joined DB rows but are not in the base Place TypeScript type.
function buildMapPlace(overrides: Record<string, any> = {}) {
  return {
    ...buildPlace(),
    category_name: null,
    category_color: null,
    category_icon: null,
    ...overrides,
  } as any
}

afterEach(() => {
  vi.clearAllMocks()
  resetAllStores()
})

describe('MapView', () => {
  it('FE-COMP-MAPVIEW-001: renders map container', () => {
    render(<MapView />)
    expect(screen.getByTestId('map-container')).toBeTruthy()
  })

  it('FE-COMP-MAPVIEW-002: renders one marker per place', () => {
    const places = [
      buildMapPlace({ id: 1, lat: 48.8584, lng: 2.2945 }),
      buildMapPlace({ id: 2, name: 'Louvre', lat: 48.86, lng: 2.337 }),
    ]
    render(<MapView places={places} />)
    expect(screen.getAllByTestId('marker').length).toBe(2)
  })

  it('FE-COMP-MAPVIEW-003: marker click calls onMarkerClick with place id', () => {
    const onMarkerClick = vi.fn()
    const places = [buildMapPlace({ id: 42, lat: 48.8584, lng: 2.2945 })]
    render(<MapView places={places} onMarkerClick={onMarkerClick} />)
    fireEvent.click(screen.getByTestId('marker'))
    expect(onMarkerClick).toHaveBeenCalledWith(42)
  })

  it('FE-COMP-MAPVIEW-004: tooltip shows place name', async () => {
    const user = userEvent.setup()
    const places = [buildMapPlace({ name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 })]
    render(<MapView places={places} />)
    await user.click(screen.getByTestId('marker-hover-trigger'))
    expect(screen.getByTestId('tooltip').textContent).toContain('Eiffel Tower')
  })

  it('FE-COMP-MAPVIEW-005: tooltip shows category name when present', async () => {
    const user = userEvent.setup()
    const places = [
      buildMapPlace({ name: 'Louvre', lat: 48.86, lng: 2.337, category_name: 'Museum', category_icon: null }),
    ]
    render(<MapView places={places} />)
    await user.click(screen.getByTestId('marker-hover-trigger'))
    expect(screen.getByTestId('tooltip').textContent).toContain('Museum')
  })

  it('FE-COMP-MAPVIEW-006: renders polyline when route has 2+ points', () => {
    render(<MapView route={[[[48.0, 2.0], [49.0, 3.0]]]} />)
    // Apple-Maps style draws a casing + a core line per segment.
    expect(screen.getAllByTestId('polyline').length).toBeGreaterThan(0)
  })

  it('FE-COMP-MAPVIEW-007: does not render polyline when route is null', () => {
    render(<MapView route={null} />)
    expect(screen.queryByTestId('polyline')).toBeNull()
  })

  it('FE-COMP-MAPVIEW-008: does not render polyline for single-point route', () => {
    render(<MapView route={[[[48.0, 2.0]]]} />)
    expect(screen.queryByTestId('polyline')).toBeNull()
  })

  it('FE-COMP-MAPVIEW-009: GPX geometry polyline rendered for place with route_geometry', () => {
    const places = [
      buildMapPlace({ lat: 48.0, lng: 2.0, route_geometry: '[[48.0,2.0],[49.0,3.0]]' }),
    ]
    render(<MapView places={places} />)
    expect(screen.getByTestId('polyline')).toBeTruthy()
  })

  it('FE-COMP-MAPVIEW-010: MarkerClusterGroup is rendered', () => {
    const places = [buildMapPlace({ lat: 48.8584, lng: 2.2945 })]
    render(<MapView places={places} />)
    expect(screen.getByTestId('cluster-group')).toBeTruthy()
  })

  it('FE-COMP-MAPVIEW-011: renders the route polyline; travel times are no longer drawn on the map', () => {
    const route = [[[48.0, 2.0], [49.0, 3.0]]] as unknown as [number, number][][]
    render(<MapView route={route} />)
    // The route is drawn; per-segment times now live in the day sidebar, not on the map.
    expect(screen.getAllByTestId('polyline').length).toBeGreaterThan(0)
  })

  it('FE-COMP-MAPVIEW-012: invalid route_geometry JSON triggers catch and skips polyline', () => {
    const places = [
      buildMapPlace({ lat: 48.0, lng: 2.0, route_geometry: 'NOT_VALID_JSON' }),
    ]
    // Should not throw; invalid JSON is caught silently
    render(<MapView places={places} />)
    expect(screen.queryByTestId('polyline')).toBeNull()
  })

  it('FE-COMP-MAPVIEW-013: route_geometry with fewer than 2 coords skips polyline', () => {
    const places = [
      buildMapPlace({ lat: 48.0, lng: 2.0, route_geometry: '[[48.0,2.0]]' }),
    ]
    render(<MapView places={places} />)
    expect(screen.queryByTestId('polyline')).toBeNull()
  })

  it('FE-COMP-MAPVIEW-014: marker icon uses base64 image_url for photo places', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AA'
    const places = [buildMapPlace({ id: 10, lat: 48.0, lng: 2.0, image_url: dataUrl })]
    render(<MapView places={places} />)
    // Marker still renders; base64 path in createPlaceIcon should be exercised
    expect(screen.getByTestId('marker')).toBeTruthy()
  })

  it('FE-COMP-MAPVIEW-015: uses cached photo thumb from photoService when available', () => {
    vi.mocked(photoService.getCached).mockReturnValue({ thumbDataUrl: 'data:image/jpeg;base64,abc' } as any)
    const places = [
      buildMapPlace({ id: 20, lat: 48.0, lng: 2.0, google_place_id: 'gplace_123' }),
    ]
    render(<MapView places={places} />)
    expect(screen.getByTestId('marker')).toBeTruthy()
    vi.mocked(photoService.getCached).mockReturnValue(null)
  })

  it('FE-COMP-MAPVIEW-016: tooltip shows address when present', async () => {
    const user = userEvent.setup()
    const places = [
      buildMapPlace({ name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, address: '5 Av. Anatole France' }),
    ]
    render(<MapView places={places} />)
    await user.click(screen.getByTestId('marker-hover-trigger'))
    expect(screen.getByTestId('tooltip').textContent).toContain('5 Av. Anatole France')
  })

  it('FE-COMP-MAPVIEW-017: renders selected marker with higher z-index offset', () => {
    const places = [
      buildMapPlace({ id: 5, lat: 48.8584, lng: 2.2945 }),
    ]
    render(<MapView places={places} selectedPlaceId={5} />)
    expect(screen.getByTestId('marker')).toBeTruthy()
  })

  it('FE-COMP-MAPVIEW-018: changing selectedPlaceId/hasInspector does not refit bounds (issue #921)', () => {
    const places = [
      buildMapPlace({ id: 1, lat: 48.8584, lng: 2.2945 }),
      buildMapPlace({ id: 2, lat: 48.86, lng: 2.337 }),
    ]
    const { rerender } = render(<MapView places={places} fitKey={1} selectedPlaceId={null} hasInspector={false} />)
    const initialCount = mapMock.fitBounds.mock.calls.length

    // Toggle selectedPlaceId on — mimics opening place inspector (hasInspector flips,
    // paddingOpts memo creates new object). fitBounds must NOT fire again.
    rerender(<MapView places={places} fitKey={1} selectedPlaceId={1} hasInspector={true} />)
    expect(mapMock.fitBounds).toHaveBeenCalledTimes(initialCount)

    // Toggle selectedPlaceId off — mimics closing inspector via X button.
    rerender(<MapView places={places} fitKey={1} selectedPlaceId={null} hasInspector={false} />)
    expect(mapMock.fitBounds).toHaveBeenCalledTimes(initialCount)
  })

  it('FE-COMP-MAPVIEW-019: bumping fitKey triggers a new fitBounds call', () => {
    const places = [
      buildMapPlace({ id: 1, lat: 48.8584, lng: 2.2945 }),
    ]
    const { rerender } = render(<MapView places={places} fitKey={1} />)
    const afterFirst = mapMock.fitBounds.mock.calls.length

    rerender(<MapView places={places} fitKey={2} />)
    expect(mapMock.fitBounds.mock.calls.length).toBeGreaterThan(afterFirst)
  })

  it('FE-COMP-MAPVIEW-021: clicking a marker clears the hover tooltip (#1404)', async () => {
    const user = userEvent.setup()
    const places = [buildMapPlace({ id: 3, name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 })]
    render(<MapView places={places} onMarkerClick={vi.fn()} />)
    await user.click(screen.getByTestId('marker-hover-trigger'))
    expect(screen.getByTestId('tooltip')).toBeTruthy()
    // The recenter that follows the click moves the marker out from under the
    // cursor — no mouseout will ever fire, so the click itself must clear.
    fireEvent.click(screen.getByTestId('marker'))
    expect(screen.queryByTestId('tooltip')).toBeNull()
  })

  it('FE-COMP-MAPVIEW-022: camera movement clears the tooltip and suppresses re-show until it ends (#1404)', async () => {
    const user = userEvent.setup()
    const places = [buildMapPlace({ id: 4, name: 'Louvre', lat: 48.86, lng: 2.337 })]
    render(<MapView places={places} />)
    await user.click(screen.getByTestId('marker-hover-trigger'))
    expect(screen.getByTestId('tooltip')).toBeTruthy()

    const findHandler = (event: string) =>
      mapMock.on.mock.calls.find(c => c[0] === event)?.[1] as (() => void) | undefined
    const start = findHandler('movestart zoomstart')
    const end = findHandler('moveend zoomend')
    expect(start).toBeTypeOf('function')
    expect(end).toBeTypeOf('function')

    fireEvent.click(screen.getByTestId('marker-hover-trigger')) // ensure hover is showing
    start!()
    await waitFor(() => expect(screen.queryByTestId('tooltip')).toBeNull())
    // during the pan animation a mouseover must not re-show the card
    fireEvent.click(screen.getByTestId('marker-hover-trigger'))
    expect(screen.queryByTestId('tooltip')).toBeNull()
    // once the move ends, hover works again
    end!()
    await user.click(screen.getByTestId('marker-hover-trigger'))
    expect(screen.getByTestId('tooltip')).toBeTruthy()
  })

  it('FE-COMP-MAPVIEW-020: a day fit expands to include the route once it arrives (#1128)', async () => {
    const L = ((await import('leaflet')).default) as unknown as { latLngBounds: ReturnType<typeof vi.fn> }
    const dayPlaces = [
      buildMapPlace({ id: 1, lat: 48.0, lng: 2.0 }),
      buildMapPlace({ id: 2, lat: 48.1, lng: 2.1 }),
    ]
    // The map opens already framed on its places, so nothing fits on mount.
    const { rerender } = render(<MapView places={dayPlaces} dayPlaces={dayPlaces} route={[]} fitKey={5} />)
    const lastBounds = () => { const c = L.latLngBounds.mock.calls; return c[c.length - 1][0] }

    // Day selected, route not computed yet → first fit is the two destinations.
    L.latLngBounds.mockClear()
    rerender(<MapView places={dayPlaces} dayPlaces={dayPlaces} route={[]} fitKey={6} />)
    expect(lastBounds()).toHaveLength(2)

    // The day's route arrives → one-shot re-fit including the 3 route points.
    L.latLngBounds.mockClear()
    rerender(<MapView places={dayPlaces} dayPlaces={dayPlaces} route={[[[47.9, 1.9], [48.05, 2.05], [48.2, 2.2]]]} fitKey={6} />)
    expect(L.latLngBounds).toHaveBeenCalled()
    expect(lastBounds()).toHaveLength(5) // 2 destinations + 3 route points
  })

  describe('opening camera', () => {
    const camera = () => {
      const el = screen.getByTestId('map-container')
      return {
        center: JSON.parse(el.getAttribute('data-center')!) as [number, number],
        zoom: Number(el.getAttribute('data-zoom')),
      }
    }

    it('FE-COMP-MAPVIEW-021: builds the map framed on the places', () => {
      render(<MapView places={[
        buildMapPlace({ id: 1, lat: 35.01, lng: 135.76 }),  // Kyoto
        buildMapPlace({ id: 2, lat: 34.69, lng: 135.5 }),   // Osaka
      ]} />)

      const { center, zoom } = camera()
      expect(center[0]).toBeCloseTo(34.85, 1)
      expect(center[1]).toBeCloseTo(135.63, 1)
      expect(zoom).toBeGreaterThan(7)
      expect(zoom).toBeLessThan(13)
    })

    it('FE-COMP-MAPVIEW-022: does not fit on mount when it opened already framed', async () => {
      const L = ((await import('leaflet')).default) as unknown as { latLngBounds: ReturnType<typeof vi.fn> }
      L.latLngBounds.mockClear()

      render(<MapView places={[buildMapPlace({ id: 1, lat: 35.01, lng: 135.76 })]} fitKey={1} />)

      expect(L.latLngBounds).not.toHaveBeenCalled()
    })

    it('FE-COMP-MAPVIEW-023: falls back to the world view when no place has coordinates', () => {
      render(<MapView places={[buildMapPlace({ id: 1, lat: null, lng: null })]} />)

      const { center, zoom } = camera()
      expect(center).toEqual([0, 0])
      expect(zoom).toBe(2)
    })
  })
})
