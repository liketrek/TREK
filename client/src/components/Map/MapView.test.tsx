import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import { act, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildPlace, buildReservation } from '../../../tests/helpers/factories'
import { useAuthStore } from '../../store/authStore'
import { CATEGORY_ICON_MAP } from '../shared/categoryIcons'
import * as photoService from '../../services/photoService'

const mapMock = vi.hoisted(() => ({
  panTo: vi.fn(),
  setView: vi.fn(),
  fitBounds: vi.fn(),
  getZoom: vi.fn().mockReturnValue(10),
  on: vi.fn(),
  off: vi.fn(),
  panBy: vi.fn(),
  latLngToContainerPoint: vi.fn(() => ({ x: 0, y: 0, distanceTo: () => 1000 })),
  // Panes: jsdom has none, so keep them in a map the pane tests can read back.
  panes: new Map<string, HTMLElement>(),
  getPane: vi.fn(function (this: void, name: string) { return mapMock.panes.get(name) }),
  createPane: vi.fn(function (this: void, name: string) {
    const el = document.createElement('div')
    mapMock.panes.set(name, el)
    return el
  }),
  getBounds: vi.fn(() => ({ getSouth: () => 47, getWest: () => 1, getNorth: () => 49, getEast: () => 3 })),
  whenReady: vi.fn((cb: () => void) => { cb() }),
}))

// Live-location fixture; tests flip this before rendering.
const geoMock = vi.hoisted(() => ({
  position: null as { lat: number; lng: number; accuracy: number; heading: number | null } | null,
  mode: 'off' as 'off' | 'show' | 'follow',
  error: null as string | null,
  cycleMode: vi.fn(),
  setMode: vi.fn(),
}))

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => geoMock,
}))

// onThumbReady callbacks are captured so a test can play back a photo landing
// after the map already rendered.
const thumbCallbacks = vi.hoisted(() => new Map<string, (thumb: string) => void>())

vi.mock('react-leaflet', () => ({
  // center/zoom are surfaced so tests can assert the camera the map is built with.
  MapContainer: ({ children, center, zoom }: any) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)} data-zoom={zoom}>{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, eventHandlers, position, icon, zIndexOffset }: any) => (
    <div
      data-testid="marker"
      data-lat={position[0]}
      data-lng={position[1]}
      data-zindex={zIndexOffset}
      // The divIcon mock hands its options straight back, so the generated
      // marker HTML is assertable without a real Leaflet.
      data-icon-html={icon?.html ?? ''}
      onClick={() => eventHandlers?.click?.()}
    >
      <button
        data-testid="marker-hover-trigger"
        // A real mouseover never bubbles as a click to the marker, so the
        // hover-simulation must not trigger the marker's click handler.
        onClick={(e: any) => { e.stopPropagation(); eventHandlers?.mouseover?.({ originalEvent: { clientX: 100, clientY: 100 } }) }}
      />
      <button
        data-testid="marker-move-trigger"
        onClick={(e: any) => { e.stopPropagation(); eventHandlers?.mousemove?.({ originalEvent: { clientX: 150, clientY: 160 } }) }}
      />
      <button
        data-testid="marker-out-trigger"
        onClick={(e: any) => { e.stopPropagation(); eventHandlers?.mouseout?.() }}
      />
      {children}
    </div>
  ),
  // pathOptions has to reach the DOM: the style props are what the track-colour
  // feature (#776) actually asserts on, and the real Leaflet only repaints when
  // that object's reference changes.
  // bubblingMouseEvents and pane are surfaced too: a jsdom mock cannot reproduce
  // Leaflet's event propagation or its pane stacking, so the tests assert the
  // options that govern them instead.
  Polyline: ({ positions, pathOptions, eventHandlers, bubblingMouseEvents, pane }: any) => (
    <div
      data-testid="polyline"
      data-points={JSON.stringify(positions)}
      data-path-options={JSON.stringify(pathOptions ?? null)}
      data-bubbling={String(bubblingMouseEvents)}
      data-pane={pane ?? ''}
      onClick={() => eventHandlers?.click?.()}
    />
  ),
  CircleMarker: () => <div data-testid="circle-marker" />,
  Circle: () => <div data-testid="circle" />,
  Tooltip: ({ children }: any) => <>{children}</>,
  useMap: () => mapMock,
  useMapEvents: () => ({}),
}))

vi.mock('react-leaflet-cluster', () => ({
  // The real cluster group calls iconCreateFunction itself; the probe button
  // lets a test invoke it with a chosen child count.
  default: ({ children, iconCreateFunction }: any) => (
    <div data-testid="cluster-group">
      <button
        data-testid="cluster-icon-probe"
        onClick={(e: any) => {
          const count = Number(e.currentTarget.getAttribute('data-count') || 0)
          const icon = iconCreateFunction?.({ getChildCount: () => count })
          e.currentTarget.setAttribute('data-icon-html', icon?.html ?? '')
        }}
      />
      {children}
    </div>
  ),
}))

vi.mock('leaflet', () => {
  const divIcon = vi.fn((options: any) => ({ ...options }))
  const leaflet = {
    divIcon,
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
    latLngBounds: vi.fn(() => ({ isValid: () => true })),
    point: vi.fn((x: number, y: number) => [x, y]),
  }
  return { default: leaflet, ...leaflet }
})

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn((key: string, cb: (thumb: string) => void) => {
    thumbCallbacks.set(key, cb)
    return () => { thumbCallbacks.delete(key) }
  }),
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

const ORIGINAL_WIDTH = window.innerWidth

afterEach(() => {
  vi.clearAllMocks()
  resetAllStores()
  mapMock.panes.clear()
  thumbCallbacks.clear()
  geoMock.position = null
  geoMock.mode = 'off'
  geoMock.error = null
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: ORIGINAL_WIDTH })
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
    // Three per track: casing, the visible line, and the invisible fat one
    // that catches clicks. The casing is always mounted so that toggling a
    // colour never remounts a path into the wrong stacking position.
    expect(screen.getAllByTestId('polyline').length).toBe(3)
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

  // ── Track colours (#776) ──────────────────────────────────────────────────
  // The style has to travel through pathOptions: react-leaflet only calls
  // setStyle when that object's reference changes, so bare color/weight props
  // would freeze at their mount-time value and a recolour would never show.
  const trackOptions = () => screen.getAllByTestId('polyline')
    .map(el => JSON.parse(el.getAttribute('data-path-options') || 'null'))
    .filter(Boolean)

  it('FE-COMP-MAPVIEW-025: a picked route_color beats the category colour', () => {
    const places = [buildMapPlace({
      lat: 48.0, lng: 2.0, route_geometry: '[[48.0,2.0],[49.0,3.0]]',
      category_color: '#00ff00', route_color: '#e11d48',
    })]
    render(<MapView places={places} />)
    expect(trackOptions().some(o => o.color === '#e11d48')).toBe(true)
    expect(trackOptions().some(o => o.color === '#00ff00')).toBe(false)
  })

  it('FE-COMP-MAPVIEW-026: without route_color the category colour still wins', () => {
    const places = [buildMapPlace({
      lat: 48.0, lng: 2.0, route_geometry: '[[48.0,2.0],[49.0,3.0]]',
      category_color: '#00ff00', route_color: null,
    })]
    render(<MapView places={places} />)
    expect(trackOptions().some(o => o.color === '#00ff00')).toBe(true)
  })

  it('FE-COMP-MAPVIEW-027: with neither colour the track keeps the old blue', () => {
    const places = [buildMapPlace({ lat: 48.0, lng: 2.0, route_geometry: '[[48.0,2.0],[49.0,3.0]]' })]
    render(<MapView places={places} />)
    expect(trackOptions().some(o => o.color === '#3b82f6' && o.weight === 3.5 && o.opacity === 0.75)).toBe(true)
    // The casing is mounted but invisible — a track nobody coloured looks
    // exactly as it did before.
    expect(trackOptions().some(o => o.color === '#ffffff' && o.opacity === 0)).toBe(true)
    expect(trackOptions().some(o => o.color === '#ffffff' && o.opacity > 0)).toBe(false)
  })

  it('FE-COMP-MAPVIEW-028: a coloured track gets a white casing underneath', () => {
    const places = [buildMapPlace({
      lat: 48.0, lng: 2.0, route_geometry: '[[48.0,2.0],[49.0,3.0]]', route_color: '#059669',
    })]
    render(<MapView places={places} />)
    expect(trackOptions().some(o => o.color === '#ffffff' && o.weight === 6.5 && o.opacity === 0.7)).toBe(true)
    expect(trackOptions().some(o => o.color === '#059669' && o.opacity === 0.9)).toBe(true)
  })

  it('FE-COMP-MAPVIEW-029: clicking a track selects its place', () => {
    const onMarkerClick = vi.fn()
    const places = [buildMapPlace({
      id: 77, lat: 48.0, lng: 2.0, route_geometry: '[[48.0,2.0],[49.0,3.0]]',
    })]
    render(<MapView places={places} onMarkerClick={onMarkerClick} />)
    const hit = screen.getAllByTestId('polyline')
      .find(el => JSON.parse(el.getAttribute('data-path-options') || '{}').weight === 14)
    fireEvent.click(hit!)
    expect(onMarkerClick).toHaveBeenCalledWith(77)
    // Paths bubble to the map by default and the map click clears the selection
    // this one just made — the mock cannot reproduce that, so assert the option.
    expect(hit!.getAttribute('data-bubbling')).toBe('false')
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

  it('FE-COMP-MAPVIEW-023: a routable reservation not in visibleConnectionIds draws no route', () => {
    const reservation = buildReservation({
      id: 43,
      type: 'flight',
      endpoints: [
        { role: 'from', sequence: 0, name: 'A', code: 'AAA', lat: 1, lng: 2, timezone: null, local_time: null, local_date: null },
        { role: 'to', sequence: 1, name: 'B', code: 'BBB', lat: 3, lng: 4, timezone: null, local_time: null, local_date: null },
      ],
    } as any)
    render(<MapView reservations={[reservation]} visibleConnectionIds={[]} />)
    expect(screen.queryByTestId('polyline')).not.toBeInTheDocument()
  })

  it('FE-COMP-MAPVIEW-024: a routable reservation in visibleConnectionIds draws its route', () => {
    const reservation = buildReservation({
      id: 42,
      type: 'flight',
      endpoints: [
        { role: 'from', sequence: 0, name: 'A', code: 'AAA', lat: 1, lng: 2, timezone: null, local_time: null, local_date: null },
        { role: 'to', sequence: 1, name: 'B', code: 'BBB', lat: 3, lng: 4, timezone: null, local_time: null, local_date: null },
      ],
    } as any)
    render(<MapView reservations={[reservation]} visibleConnectionIds={[42]} />)
    expect(screen.getAllByTestId('polyline').length).toBeGreaterThan(0)
  })

  it('FE-COMP-MAPVIEW-073: a category icon that throws leaves the marker circle intact', () => {
    // Icon components come from a lookup table a plugin can extend; one that
    // throws must not take the whole map down, only its own glyph.
    const key = '__ExplodingIcon'
    CATEGORY_ICON_MAP[key] = (() => { throw new Error('icon blew up') }) as unknown as typeof CATEGORY_ICON_MAP['MapPin']
    try {
      render(<MapView places={[buildMapPlace({ id: 5, lat: 48, lng: 2, category_icon: key })]} />)
      const html = screen.getByTestId('marker').getAttribute('data-icon-html') || ''
      expect(html).toContain('border-radius:50%')
      expect(html).not.toContain('<svg')
    } finally {
      delete CATEGORY_ICON_MAP[key]
    }
  })
})

// ── FE-COMP-MAPVIEW-030 onwards ───────────────────────────────────────────────

const leafletMock = async () => ((await import('leaflet')).default) as unknown as {
  divIcon: ReturnType<typeof vi.fn>
  latLngBounds: ReturnType<typeof vi.fn>
}

const iconHtmlOf = (el: HTMLElement) => el.getAttribute('data-icon-html') || ''
const markersWithZ = (z: string) => screen.queryAllByTestId('marker').filter(m => m.getAttribute('data-zindex') === z)
const handlerFor = (event: string) => mapMock.on.mock.calls.find(c => c[0] === event)?.[1] as (() => void) | undefined

function buildPoi(overrides: Record<string, any> = {}) {
  return {
    osm_id: 'node/1',
    name: 'Café Central',
    lat: 48.21,
    lng: 16.36,
    category: 'cafe',
    poi_type: 'cafe',
    address: null,
    website: null,
    phone: null,
    opening_hours: null,
    cuisine: null,
    source: 'openstreetmap',
    ...overrides,
  }
}

describe('MapView clusters and badges', () => {
  it('FE-COMP-MAPVIEW-030: the cluster icon grows with the number of markers it hides', () => {
    render(<MapView places={[buildMapPlace({ id: 1, lat: 48, lng: 2 })]} />)
    const probe = screen.getByTestId('cluster-icon-probe')

    const iconFor = (count: number) => {
      probe.setAttribute('data-count', String(count))
      fireEvent.click(probe)
      return probe.getAttribute('data-icon-html') || ''
    }

    expect(iconFor(4)).toContain('width:36px')
    expect(iconFor(4)).toContain('<span>4</span>')
    expect(iconFor(20)).toContain('width:42px')
    expect(iconFor(120)).toContain('width:48px')
  })

  it('FE-COMP-MAPVIEW-031: a place on one day gets a single order badge', () => {
    render(<MapView places={[buildMapPlace({ id: 3, lat: 48, lng: 2 })]} dayOrderMap={{ 3: [2] }} />)
    const html = iconHtmlOf(screen.getAllByTestId('marker')[0])
    expect(html).toContain('>2</span>')
    expect(html).toContain('height:18px')
  })

  it('FE-COMP-MAPVIEW-032: a place visited on several days gets a wider combined badge', () => {
    render(<MapView places={[buildMapPlace({ id: 4, lat: 48, lng: 2 })]} dayOrderMap={{ 4: [1, 3] }} />)
    const html = iconHtmlOf(screen.getAllByTestId('marker')[0])
    expect(html).toContain('>1 · 3</span>')
    expect(html).toContain('height:16px')
  })
})

describe('MapView explore POIs', () => {
  it('FE-COMP-MAPVIEW-033: renders a pin per POI in its category colour with a name tooltip', () => {
    render(<MapView pois={[buildPoi()]} />)
    const poiMarker = markersWithZ('500')[0]
    expect(poiMarker).toBeTruthy()
    expect(iconHtmlOf(poiMarker)).toContain('#B45309') // cafe
    expect(poiMarker.textContent).toContain('Café Central')
  })

  it('FE-COMP-MAPVIEW-034: clicking a POI hands the whole POI back to the caller', () => {
    const onPoiClick = vi.fn()
    const poi = buildPoi({ osm_id: 'node/7' })
    render(<MapView pois={[poi]} onPoiClick={onPoiClick} />)
    fireEvent.click(markersWithZ('500')[0])
    expect(onPoiClick).toHaveBeenCalledWith(poi)
  })

  it('FE-COMP-MAPVIEW-035: an unknown POI category falls back to grey and draws no glyph', () => {
    render(<MapView pois={[buildPoi({ osm_id: 'node/8', category: 'not-a-category' })]} />)
    const html = iconHtmlOf(markersWithZ('500')[0])
    expect(html).toContain('#6b7280')
    expect(html).not.toContain('<svg')
  })

  it('FE-COMP-MAPVIEW-036: POIs of one category share a single cached icon', async () => {
    const L = await leafletMock()
    render(<MapView pois={[
      buildPoi({ osm_id: 'node/10', category: 'museum' }),
      buildPoi({ osm_id: 'node/11', category: 'museum', lat: 48.3 }),
    ]} />)
    const poiIcons = L.divIcon.mock.calls.filter(c => JSON.stringify((c[0] as { iconSize: number[] }).iconSize) === '[26,26]')
    expect(markersWithZ('500')).toHaveLength(2)
    expect(poiIcons).toHaveLength(1)
  })
})

describe('MapView plugin route vias', () => {
  const via = (overrides: Record<string, any> = {}) => ({ lat: 48.5, lng: 2.5, tone: 'default', ...overrides })

  it('FE-COMP-MAPVIEW-037: draws a tone dot for each via point', () => {
    render(<MapView routeVias={[via({ tone: 'success' }), via({ tone: 'danger', lat: 48.7 })]} />)
    const vias = markersWithZ('800')
    expect(vias).toHaveLength(2)
    expect(iconHtmlOf(vias[0])).toContain('#10b981')
    expect(iconHtmlOf(vias[1])).toContain('#ef4444')
  })

  it('FE-COMP-MAPVIEW-038: an unknown tone falls back to the default indigo', () => {
    render(<MapView routeVias={[via({ tone: 'chartreuse' })]} />)
    expect(iconHtmlOf(markersWithZ('800')[0])).toContain('#4F46E5')
  })

  it('FE-COMP-MAPVIEW-039: vias of the same tone share one cached icon', async () => {
    const L = await leafletMock()
    render(<MapView routeVias={[via({ tone: 'warn' }), via({ tone: 'warn', lat: 48.9 })]} />)
    const viaIcons = L.divIcon.mock.calls.filter(c => JSON.stringify((c[0] as { iconSize: number[] }).iconSize) === '[13,13]')
    expect(markersWithZ('800')).toHaveLength(2)
    expect(viaIcons).toHaveLength(1)
  })

  it('FE-COMP-MAPVIEW-040: a via tooltip joins its label and its dwell time', () => {
    render(<MapView routeVias={[via({ label: 'Supercharger', dwellSeconds: 5400 })]} />)
    expect(markersWithZ('800')[0].textContent).toContain('Supercharger · 1 h 30 min')
  })

  it('FE-COMP-MAPVIEW-041: a dwell under an hour is shown in minutes alone', () => {
    render(<MapView routeVias={[via({ dwellSeconds: 1500 })]} />)
    expect(markersWithZ('800')[0].textContent).toContain('25 min')
  })

  it('FE-COMP-MAPVIEW-042: a bare via carries no tooltip at all', () => {
    render(<MapView routeVias={[via()]} />)
    expect(markersWithZ('800')[0].textContent).toBe('')
  })

  it('FE-COMP-MAPVIEW-074: a via with a label but no dwell shows the label alone', () => {
    render(<MapView routeVias={[via({ label: 'Rest area' })]} />)
    expect(markersWithZ('800')[0].textContent).toBe('Rest area')
  })
})

describe('MapView map event wiring', () => {
  it('FE-COMP-MAPVIEW-043: reports the viewport bbox once the map is ready and again on every move', () => {
    const onViewportChange = vi.fn()
    render(<MapView onViewportChange={onViewportChange} />)
    expect(onViewportChange).toHaveBeenCalledWith({ south: 47, west: 1, north: 49, east: 3 })

    const moveend = handlerFor('moveend')
    const zoomend = handlerFor('zoomend')
    expect(moveend).toBeTypeOf('function')
    moveend!()
    zoomend!()
    expect(onViewportChange).toHaveBeenCalledTimes(3)
  })

  it('FE-COMP-MAPVIEW-044: no viewport callback means no listeners at all', () => {
    render(<MapView />)
    expect(mapMock.on.mock.calls.some(c => c[0] === 'moveend')).toBe(false)
  })

  it('FE-COMP-MAPVIEW-045: unmounting detaches the viewport listeners', () => {
    const { unmount } = render(<MapView onViewportChange={vi.fn()} />)
    unmount()
    expect(mapMock.off).toHaveBeenCalledWith('moveend', expect.any(Function))
    expect(mapMock.off).toHaveBeenCalledWith('zoomend', expect.any(Function))
  })

  it('FE-COMP-MAPVIEW-046: a map-click handler is attached and detached again', () => {
    const onMapClick = vi.fn()
    const { unmount } = render(<MapView onMapClick={onMapClick} />)
    expect(mapMock.on).toHaveBeenCalledWith('click', onMapClick)
    unmount()
    expect(mapMock.off).toHaveBeenCalledWith('click', onMapClick)
  })

  it('FE-COMP-MAPVIEW-047: without a click handler nothing is bound', () => {
    render(<MapView onMapClick={null} />)
    expect(mapMock.on.mock.calls.some(c => c[0] === 'click')).toBe(false)
  })

  it('FE-COMP-MAPVIEW-048: a context-menu handler is attached and detached again', () => {
    const onMapContextMenu = vi.fn()
    const { unmount } = render(<MapView onMapContextMenu={onMapContextMenu} />)
    expect(mapMock.on).toHaveBeenCalledWith('contextmenu', onMapContextMenu)
    unmount()
    expect(mapMock.off).toHaveBeenCalledWith('contextmenu', onMapContextMenu)
  })

  it('FE-COMP-MAPVIEW-049: changing the center prop moves the camera there', () => {
    const places = [buildMapPlace({ id: 1, lat: 48, lng: 2 })]
    const { rerender } = render(<MapView places={places} center={[48, 2]} zoom={9} />)
    mapMock.setView.mockClear()

    rerender(<MapView places={places} center={[35.01, 135.76]} zoom={11} />)
    expect(mapMock.setView).toHaveBeenCalledWith([35.01, 135.76], 11)

    // The same center again must not re-issue the camera move.
    mapMock.setView.mockClear()
    rerender(<MapView places={places} center={[35.01, 135.76]} zoom={11} />)
    expect(mapMock.setView).not.toHaveBeenCalled()
  })
})

describe('MapView track casing pane (#776)', () => {
  it('FE-COMP-MAPVIEW-050: creates the casing pane under the overlay pane and draws casings into it', () => {
    render(<MapView places={[buildMapPlace({
      id: 1, lat: 48, lng: 2, route_geometry: '[[48.0,2.0],[49.0,3.0]]', route_color: '#059669',
    })]} />)

    expect(mapMock.createPane).toHaveBeenCalledWith('trek-track-casing')
    expect(mapMock.panes.get('trek-track-casing')!.style.zIndex).toBe('398')

    const casing = screen.getAllByTestId('polyline')
      .find(el => JSON.parse(el.getAttribute('data-path-options') || '{}').weight === 6.5)
    expect(casing!.getAttribute('data-pane')).toBe('trek-track-casing')
  })

  it('FE-COMP-MAPVIEW-072: a renderer without pane support still draws every track', () => {
    const paneless = mapMock as unknown as Record<string, unknown>
    const { getPane, createPane } = paneless
    delete paneless.getPane
    delete paneless.createPane
    try {
      render(<MapView places={[buildMapPlace({
        id: 1, lat: 48, lng: 2, route_geometry: '[[48.0,2.0],[49.0,3.0]]',
      })]} />)
      // Casing, line and hit area are all mounted — just in insertion order.
      expect(screen.getAllByTestId('polyline')).toHaveLength(3)
      const casing = screen.getAllByTestId('polyline')
        .find(el => JSON.parse(el.getAttribute('data-path-options') || '{}').weight === 6.5)
      expect(casing!.getAttribute('data-pane')).toBe('')
    } finally {
      paneless.getPane = getPane
      paneless.createPane = createPane
    }
  })
})

describe('MapView selection panning (#921)', () => {
  it('FE-COMP-MAPVIEW-051: pans to the padding-corrected point when the map can project', () => {
    const projectable = mapMock as unknown as Record<string, unknown>
    const add = vi.fn(() => ({ x: 5, y: 6 }))
    projectable.project = vi.fn(() => ({ add }))
    projectable.unproject = vi.fn(() => [49, 4])
    try {
      const places = [buildMapPlace({ id: 8, lat: 48, lng: 2 })]
      const { rerender } = render(<MapView places={places} selectedPlaceId={null} />)
      rerender(<MapView places={places} selectedPlaceId={8} />)

      expect(projectable.project).toHaveBeenCalledWith([48, 2])
      // The offset is half the difference between the two padding corners.
      expect(add).toHaveBeenCalledWith([0, 0])
      expect(mapMock.panTo).toHaveBeenCalledWith([49, 4], { animate: true })
    } finally {
      delete projectable.project
      delete projectable.unproject
    }
  })

  it('FE-COMP-MAPVIEW-052: falls back to a plain pan when the map cannot project', () => {
    const places = [buildMapPlace({ id: 9, lat: 48, lng: 2 })]
    const { rerender } = render(<MapView places={places} selectedPlaceId={null} />)
    rerender(<MapView places={places} selectedPlaceId={9} />)
    expect(mapMock.panTo).toHaveBeenCalledWith([48, 2], { animate: true })
  })

  it('FE-COMP-MAPVIEW-053: a selected place without coordinates is not panned to', () => {
    const places = [buildMapPlace({ id: 10, lat: null, lng: null })]
    const { rerender } = render(<MapView places={places} selectedPlaceId={null} />)
    rerender(<MapView places={places} selectedPlaceId={10} />)
    expect(mapMock.panTo).not.toHaveBeenCalled()
  })
})

describe('MapView hover card', () => {
  const place = () => buildMapPlace({ id: 12, name: 'Eiffel Tower', lat: 48.85, lng: 2.29 })

  it('FE-COMP-MAPVIEW-054: mousemove keeps the card following the cursor', () => {
    render(<MapView places={[place()]} />)
    fireEvent.click(screen.getByTestId('marker-move-trigger'))
    const card = screen.getByTestId('tooltip')
    expect(card.textContent).toContain('Eiffel Tower')
    expect(card.style.left).toBe('164px') // 150 + 14
    expect(card.style.top).toBe('150px')  // 160 - 10
  })

  it('FE-COMP-MAPVIEW-055: mouseout clears the card', () => {
    render(<MapView places={[place()]} />)
    fireEvent.click(screen.getByTestId('marker-hover-trigger'))
    expect(screen.getByTestId('tooltip')).toBeTruthy()

    fireEvent.click(screen.getByTestId('marker-out-trigger'))
    expect(screen.queryByTestId('tooltip')).toBeNull()
  })

  it('FE-COMP-MAPVIEW-056: scrolling the page drops the card so it cannot get orphaned', () => {
    render(<MapView places={[place()]} />)
    fireEvent.click(screen.getByTestId('marker-hover-trigger'))
    expect(screen.getByTestId('tooltip')).toBeTruthy()

    fireEvent.scroll(window)
    expect(screen.queryByTestId('tooltip')).toBeNull()
  })

  it('FE-COMP-MAPVIEW-057: hoverDisabled suppresses the card entirely', () => {
    render(<MapView places={[place()]} hoverDisabled />)
    fireEvent.click(screen.getByTestId('marker-hover-trigger'))
    fireEvent.click(screen.getByTestId('marker-move-trigger'))
    expect(screen.queryByTestId('tooltip')).toBeNull()
  })
})

describe('MapView live location', () => {
  const fix = (over: Record<string, any> = {}) => ({ lat: 48.2, lng: 16.37, accuracy: 25, heading: null, ...over })

  it('FE-COMP-MAPVIEW-058: no fix means no dot, circle or heading cone', () => {
    render(<MapView />)
    expect(screen.queryByTestId('circle-marker')).toBeNull()
    expect(screen.queryByTestId('circle')).toBeNull()
  })

  it('FE-COMP-MAPVIEW-059: a fix draws the blue dot and its accuracy circle', () => {
    geoMock.position = fix()
    geoMock.mode = 'show'
    render(<MapView />)
    expect(screen.getByTestId('circle-marker')).toBeTruthy()
    expect(screen.getByTestId('circle')).toBeTruthy()
  })

  it('FE-COMP-MAPVIEW-060: a city-level fix draws the dot but no accuracy circle', () => {
    geoMock.position = fix({ accuracy: 900 })
    geoMock.mode = 'show'
    render(<MapView />)
    expect(screen.getByTestId('circle-marker')).toBeTruthy()
    expect(screen.queryByTestId('circle')).toBeNull()
  })

  it('FE-COMP-MAPVIEW-061: a compass heading adds a rotated cone marker', () => {
    geoMock.position = fix({ heading: 135 })
    geoMock.mode = 'show'
    render(<MapView />)
    const cone = screen.getAllByTestId('marker').find(m => iconHtmlOf(m).includes('rotate(135deg)'))
    expect(cone).toBeTruthy()
  })

  it('FE-COMP-MAPVIEW-062: show mode recentres once and then leaves the camera alone', () => {
    geoMock.position = fix()
    geoMock.mode = 'show'
    const { rerender } = render(<MapView />)
    expect(mapMock.setView).toHaveBeenCalledWith([48.2, 16.37], 15)

    mapMock.setView.mockClear()
    geoMock.position = fix({ lat: 48.25 })
    // A prop change forces the re-render the new fix would otherwise not cause.
    rerender(<MapView hoverDisabled />)
    expect(mapMock.setView).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEW-063: follow mode recentres on every fix at navigation zoom', () => {
    geoMock.position = fix()
    geoMock.mode = 'follow'
    render(<MapView />)
    expect(mapMock.setView).toHaveBeenCalledWith([48.2, 16.37], 16, { animate: true, duration: 0.35 })
  })

  it('FE-COMP-MAPVIEW-064: a mobile viewport gets the location button, desktop does not', () => {
    render(<MapView />)
    expect(screen.queryByRole('button', { name: 'Show my location' })).toBeNull()

    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 420 })
    geoMock.mode = 'show'
    render(<MapView />)
    fireEvent.click(screen.getByRole('button', { name: 'Follow my location' }))
    expect(geoMock.cycleMode).toHaveBeenCalled()
  })
})

describe('MapView bounds fitting', () => {
  /*
   * The day fit used to compensate for the day panel twice: once through the
   * padding, and again 300ms later with panBy([0, 150]) (#1348). On a route
   * running north to south the fit is height-bound, so the northernmost stop
   * lands exactly on the top padding line and the nudge then pushed it off the
   * canvas — the map framed everything and then drifted upwards (#1982).
   *
   * So this case is the inverse of what it used to assert: the padding does the
   * work, and nothing moves the camera afterwards.
   */
  it('FE-COMP-MAPVIEW-065: a day-detail fit reserves the panel in its padding and then leaves the camera alone (#1348, #1982)', async () => {
    const places = [
      buildMapPlace({ id: 1, lat: 48, lng: 2 }),
      buildMapPlace({ id: 2, lat: 48.2, lng: 2.2 }),
    ]
    const { rerender } = render(<MapView places={places} dayPlaces={places} fitKey={1} hasDayDetail />)
    rerender(<MapView places={places} dayPlaces={places} fitKey={2} hasDayDetail />)

    expect(mapMock.fitBounds).toHaveBeenCalled()
    const calls = mapMock.fitBounds.mock.calls
    const opts = calls[calls.length - 1]?.[1] as { paddingBottomRight?: [number, number] }
    expect(opts?.paddingBottomRight?.[1]).toBe(280)

    // Long enough that the old 300ms nudge would have fired by now.
    await new Promise(r => setTimeout(r, 600))
    expect(mapMock.panBy).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEW-065b: reserves only the small margin when no day panel is open (#1982)', () => {
    const places = [
      buildMapPlace({ id: 1, lat: 48, lng: 2 }),
      buildMapPlace({ id: 2, lat: 48.2, lng: 2.2 }),
    ]
    const { rerender } = render(<MapView places={places} dayPlaces={places} fitKey={1} />)
    rerender(<MapView places={places} dayPlaces={places} fitKey={2} />)

    const calls = mapMock.fitBounds.mock.calls
    const opts = calls[calls.length - 1]?.[1] as { paddingBottomRight?: [number, number] }
    expect(opts?.paddingBottomRight?.[1]).toBe(60)
  })

  it('FE-COMP-MAPVIEW-066: a fitKey that never changed is not re-fitted', async () => {
    const L = await leafletMock()
    L.latLngBounds.mockClear()
    render(<MapView places={[buildMapPlace({ id: 1, lat: 48, lng: 2 })]} fitKey={-1} />)
    expect(L.latLngBounds).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEW-067: an invalid bounds object is ignored instead of throwing', async () => {
    const L = await leafletMock()
    L.latLngBounds.mockImplementationOnce(() => ({ isValid: () => false }))
    const places = [buildMapPlace({ id: 1, lat: 48, lng: 2 })]
    const { rerender } = render(<MapView places={places} fitKey={1} />)
    mapMock.fitBounds.mockClear()
    rerender(<MapView places={places} fitKey={2} />)
    expect(mapMock.fitBounds).not.toHaveBeenCalled()
  })
})

describe('MapView photo thumbnails', () => {
  const THUMB = 'data:image/jpeg;base64,THUMBDATA'

  it('FE-COMP-MAPVIEW-068: a photo that arrives after mount is folded into the marker icon', async () => {
    render(<MapView places={[buildMapPlace({ id: 21, lat: 48, lng: 2, google_place_id: 'gp-21' })]} />)
    const deliver = thumbCallbacks.get('gp-21')
    expect(deliver).toBeTypeOf('function')

    // Two deliveries in one frame collapse into a single re-render.
    act(() => { deliver!(THUMB); deliver!(THUMB) })
    await waitFor(() => expect(iconHtmlOf(screen.getAllByTestId('marker')[0])).toContain(THUMB))
  })

  it('FE-COMP-MAPVIEW-069: re-delivering the same thumb does not change the icon', async () => {
    render(<MapView places={[buildMapPlace({ id: 22, lat: 48, lng: 2, google_place_id: 'gp-22' })]} />)
    const deliver = thumbCallbacks.get('gp-22')!
    act(() => { deliver(THUMB) })
    await waitFor(() => expect(iconHtmlOf(screen.getAllByTestId('marker')[0])).toContain(THUMB))

    const before = iconHtmlOf(screen.getAllByTestId('marker')[0])
    act(() => { deliver(THUMB) })
    await waitFor(() => expect(iconHtmlOf(screen.getAllByTestId('marker')[0])).toBe(before))
  })

  it('FE-COMP-MAPVIEW-075: an unchanged batch keeps the previous photo state object', () => {
    // Same case as above, but with the batching frame under the test's control so
    // the "nothing changed" path in the state updater really runs before teardown.
    const frames: FrameRequestCallback[] = []
    const flush = () => { frames.splice(0).forEach(cb => cb(0)) }
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => { frames.length = 0 })
    try {
      render(<MapView places={[buildMapPlace({ id: 24, lat: 48, lng: 2, google_place_id: 'gp-24' })]} />)
      const deliver = thumbCallbacks.get('gp-24')!

      act(() => { deliver(THUMB) })
      act(flush)
      const withThumb = iconHtmlOf(screen.getAllByTestId('marker')[0])
      expect(withThumb).toContain(THUMB)

      act(() => { deliver(THUMB) })
      act(flush)
      expect(iconHtmlOf(screen.getAllByTestId('marker')[0])).toBe(withThumb)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('FE-COMP-MAPVIEW-070: a place with a custom uploaded image is never auto-fetched', () => {
    render(<MapView places={[buildMapPlace({ id: 23, lat: 48, lng: 2, image_url: '/uploads/places/mine.jpg' })]} />)
    expect(thumbCallbacks.size).toBe(0)
    expect(vi.mocked(photoService.fetchPhoto)).not.toHaveBeenCalled()
    expect(iconHtmlOf(screen.getAllByTestId('marker')[0])).toContain('/uploads/places/mine.jpg')
  })

  it('FE-COMP-MAPVIEW-076: a place with neither provider id nor coordinates has no cache key and is skipped', () => {
    render(<MapView places={[
      buildMapPlace({ id: 25, lat: null, lng: null, image_url: 'https://example.com/a.jpg' }),
      buildMapPlace({ id: 26, lat: null, lng: null, image_url: 'https://example.com/b.jpg' }),
    ]} />)
    expect(thumbCallbacks.size).toBe(0)
    expect(vi.mocked(photoService.fetchPhoto)).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEW-071: photos are not fetched at all when the feature is off', () => {
    useAuthStore.setState({ placesPhotosEnabled: false })
    render(<MapView places={[buildMapPlace({ id: 24, lat: 48, lng: 2, google_place_id: 'gp-24' })]} />)
    expect(thumbCallbacks.size).toBe(0)
    expect(vi.mocked(photoService.fetchPhoto)).not.toHaveBeenCalled()
  })
})

// The marker HTML is a hand-built string handed to L.divIcon, i.e. innerHTML.
// Two of its interpolations carry values a user controls.
describe('MapView — untrusted values in the marker HTML', () => {
  const iconHtml = () => screen.getAllByTestId('marker').map(el => el.getAttribute('data-icon-html') || '').join('')

  it('FE-COMP-MAPVIEW-072: a category colour that is not a hex value is dropped, not escaped', () => {
    // Escaping alone would stop the attribute breakout but still leave a working
    // CSS value, so the colour is allow-listed and anything else falls back.
    render(<MapView places={[buildMapPlace({
      lat: 48, lng: 2, category_color: 'red" onmouseover="alert(1)',
    })]} />)
    expect(iconHtml()).not.toContain('onmouseover')
    expect(iconHtml()).toContain('#6b7280')
  })

  it('FE-COMP-MAPVIEW-073: a CSS url() in the category colour never reaches the style attribute', () => {
    render(<MapView places={[buildMapPlace({ lat: 48, lng: 2, category_color: 'url(https://evil.example/px)' })]} />)
    expect(iconHtml()).not.toContain('evil.example')
  })

  it('FE-COMP-MAPVIEW-074: an image_url that passes the /uploads/ prefix check is still escaped', () => {
    // The prefix check only looks at the start of the string, so a payload can
    // satisfy it and then break out of the src="…" attribute.
    render(<MapView places={[buildMapPlace({
      lat: 48, lng: 2, image_url: '/uploads/x" onerror="alert(1)" y="',
    })]} />)
    expect(iconHtml()).not.toContain('onerror="alert(1)"')
    expect(iconHtml()).toContain('&quot;')
  })

  it('FE-COMP-MAPVIEW-075: an ordinary hex colour is passed through untouched', () => {
    render(<MapView places={[buildMapPlace({ lat: 48, lng: 2, category_color: '#00ff00' })]} />)
    expect(iconHtml()).toContain('#00ff00')
  })
})
