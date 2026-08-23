import React from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render } from '../../../tests/helpers/render'
import { act, waitFor } from '@testing-library/react'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildPlace } from '../../../tests/helpers/factories'
import { server } from '../../../tests/helpers/msw/server'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'
import maplibregl from 'maplibre-gl'
import { DEFAULT_MAP_ZOOM } from '../../constants/mapDefaults'
import type { GeoPosition, TrackingMode } from '../../hooks/useGeolocation'
import type { PluginMapLayer, PluginMapLayerFeature, PluginMapMarker } from '../../api/client'
import type { Poi } from './poiCategories'
import type { RouteVia } from '../../types'

// Stable fake map so fitBounds call counts survive re-renders. The canvas
// container is a single element so listeners registered by the component are
// reachable from tests via dispatchEvent.
const glCanvasContainer = vi.hoisted(() => document.createElement('div'))
const glMap = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  loaded: vi.fn().mockReturnValue(true),
  fitBounds: vi.fn(),
  flyTo: vi.fn(),
  jumpTo: vi.fn(),
  getZoom: vi.fn().mockReturnValue(10),
  addControl: vi.fn(),
  removeControl: vi.fn(),
  remove: vi.fn(),
  addSource: vi.fn(),
  getSource: vi.fn().mockReturnValue(null),
  addLayer: vi.fn(),
  setLayoutProperty: vi.fn(),
  getStyle: vi.fn().mockReturnValue({ layers: [] }),
  isStyleLoaded: vi.fn().mockReturnValue(true),
  getCanvasContainer: vi.fn(() => glCanvasContainer),
  getLayer: vi.fn().mockReturnValue(null),
  queryRenderedFeatures: vi.fn().mockReturnValue([]),
  querySourceFeatures: vi.fn().mockReturnValue([]),
  unproject: vi.fn(() => ({ lng: 2.3522, lat: 48.8566 })),
  getBounds: vi.fn(() => ({ getSouth: () => 0, getWest: () => 0, getNorth: () => 1, getEast: () => 1 })),
  easeTo: vi.fn(),
  getCanvas: vi.fn(() => document.createElement('canvas')),
  getBearing: vi.fn(() => 0),
  setTerrain: vi.fn(),
  setConfigProperty: vi.fn(),
  queryTerrainElevation: vi.fn((): number | null => null),
}))

const glBounds = vi.hoisted(() => {
  const state = {
    instances: [] as Array<{ extend: ReturnType<typeof vi.fn> }>,
  }
  return {
    get instances() { return state.instances },
    clear: () => { state.instances = [] },
    create: () => {
      const bounds = {
        extend: vi.fn(() => bounds),
      }
      state.instances.push(bounds)
      return bounds
    },
  }
})

// Markers and popups are created through the mocked GL constructors, so the
// tests can reach the very instances the component built (their DOM element,
// the coordinates they were placed at, the popup content they were given).
interface FakeMarker {
  element: HTMLElement
  lngLat: number[] | null
  setLngLat: (ll: number[]) => FakeMarker
  getLngLat: () => { lng: number; lat: number }
  addTo: (map: unknown) => FakeMarker
  remove: () => void
  getElement: () => HTMLElement
}

interface FakePopup {
  setLngLat: (ll: unknown) => FakePopup
  setHTML: (html: string) => FakePopup
  setText: (text: string) => FakePopup
  setDOMContent: (node: HTMLElement) => FakePopup
  addTo: (map: unknown) => FakePopup
  remove: () => void
}

const glMarkers = vi.hoisted(() => {
  const created: FakeMarker[] = []
  return {
    get created() { return created },
    clear: () => { created.length = 0 },
    make: (opts?: { element?: HTMLElement }): FakeMarker => {
      const element = opts?.element ?? document.createElement('div')
      const marker: FakeMarker = {
        element,
        lngLat: null,
        setLngLat: vi.fn((ll: number[]) => { marker.lngLat = ll; return marker }),
        getLngLat: vi.fn(() => ({ lng: Number(marker.lngLat?.[0] ?? 0), lat: Number(marker.lngLat?.[1] ?? 0) })),
        addTo: vi.fn((_map: unknown) => marker),
        remove: vi.fn(),
        getElement: vi.fn(() => element),
      }
      created.push(marker)
      return marker
    },
  }
})

const glPopup = vi.hoisted((): FakePopup => {
  const popup: FakePopup = {
    setLngLat: vi.fn((_ll: unknown) => popup),
    setHTML: vi.fn((_html: string) => popup),
    setText: vi.fn((_text: string) => popup),
    setDOMContent: vi.fn((_node: HTMLElement) => popup),
    addTo: vi.fn((_map: unknown) => popup),
    remove: vi.fn(),
  }
  return popup
})

vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(function () {
      return glMap
    }),
    Marker: vi.fn(function (opts?: { element?: HTMLElement }) {
      return glMarkers.make(opts)
    }),
    LngLatBounds: vi.fn(function () {
      return glBounds.create()
    }),
    NavigationControl: vi.fn(),
    Popup: vi.fn(function () {
      return glPopup
    }),
  },
}))
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(function () {
      return glMap
    }),
    Marker: vi.fn(function (opts?: { element?: HTMLElement }) {
      return glMarkers.make(opts)
    }),
    LngLatBounds: vi.fn(function () {
      return glBounds.create()
    }),
    NavigationControl: vi.fn(),
    Popup: vi.fn(function () {
      return glPopup
    }),
  },
}))
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}))

vi.mock('./mapboxSetup', () => ({
  isStandardFamily: vi.fn(() => false),
  supportsCustom3d: vi.fn(() => false),
  wantsTerrain: vi.fn(() => false),
  addCustom3dBuildings: vi.fn(),
  addTerrainAndSky: vi.fn(),
}))

const locationMarker = vi.hoisted(() => ({ update: vi.fn(), destroy: vi.fn() }))

vi.mock('./locationMarkerMapbox', () => ({
  attachLocationMarker: vi.fn(() => locationMarker),
}))

const reservationOverlay = vi.hoisted(() => ({
  update: vi.fn((_reservations: unknown, _opts: unknown, _routes: unknown) => {}),
  destroy: vi.fn(),
}))

vi.mock('./reservationsMapbox', () => ({
  ReservationMapboxOverlay: vi.fn(function () {
    return reservationOverlay
  }),
}))

const geoStub = vi.hoisted(() => ({
  position: null as GeoPosition | null,
  mode: 'off' as TrackingMode,
  error: null as string | null,
  cycleMode: vi.fn(async () => {}),
  setMode: vi.fn((_m: TrackingMode | ((prev: TrackingMode) => TrackingMode)) => {}),
}))

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(() => geoStub),
}))

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
  getAllThumbs: vi.fn(() => ({})),
}))

import mapboxgl from 'mapbox-gl'
import { MapViewGL as MapViewGLWithEngine } from './MapViewGL'

// The engine is a prop now, not a module import — that is what keeps mapbox-gl and
// maplibre-gl in separate chunks. This shim preserves the suite's existing call
// shape and makes the same choice glLazy.tsx makes in production, so the vi.mock
// factories below still stand in for the right SDK.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MapViewGL(props: any) {
  return <MapViewGLWithEngine {...props} gl={props.glProvider === 'maplibre-gl' ? maplibregl : mapboxgl} />
}
import * as mapboxSetup from './mapboxSetup'
import * as photoService from '../../services/photoService'
import { ReservationMapboxOverlay } from './reservationsMapbox'

function buildMapPlace(overrides: Record<string, any> = {}) {
  return {
    ...buildPlace(),
    category_name: null,
    category_color: null,
    category_icon: null,
    ...overrides,
  } as any
}

beforeEach(() => {
  glMap.on.mockImplementation(() => glMap)
  glMap.off.mockImplementation(() => glMap)
  glMap.once.mockImplementation(() => glMap)
  glMap.loaded.mockReturnValue(true)
  glMap.getSource.mockReturnValue(null)
  glMap.getLayer.mockReturnValue(null)
  glMap.queryRenderedFeatures.mockReturnValue([])
  glMap.querySourceFeatures.mockReturnValue([])
  glMap.getCanvas.mockImplementation(() => document.createElement('canvas'))
  glMap.getBearing.mockReturnValue(0)
  glMap.queryTerrainElevation.mockReturnValue(null)
  glMarkers.clear()
  // clearAllMocks() wipes call history but keeps implementations, so anything a
  // test overrides with mockReturnValue has to be put back here.
  vi.mocked(mapboxSetup.isStandardFamily).mockReturnValue(false)
  vi.mocked(mapboxSetup.supportsCustom3d).mockReturnValue(false)
  vi.mocked(mapboxSetup.wantsTerrain).mockReturnValue(false)
  vi.mocked(photoService.getCached).mockReturnValue(undefined)
  vi.mocked(photoService.isLoading).mockReturnValue(false)
  vi.mocked(photoService.onThumbReady).mockReturnValue(() => {})
  vi.mocked(photoService.getAllThumbs).mockReturnValue({})
  geoStub.position = null
  geoStub.mode = 'off'
  geoStub.error = null
  useSettingsStore.setState({
    settings: {
      ...useSettingsStore.getState().settings,
      map_provider: 'mapbox-gl',
      mapbox_access_token: 'pk.test_token',
      mapbox_style: 'mapbox://styles/mapbox/streets-v12',
      mapbox_3d_enabled: false,
    },
  } as any)
})

afterEach(() => {
  vi.clearAllMocks()
  glBounds.clear()
  resetAllStores()
})

describe('MapViewGL', () => {
  it('FE-COMP-MAPVIEWGL-001: opening place inspector does not refit bounds (issue #921)', async () => {
    const places = [
      buildMapPlace({ id: 1, lat: 48.8584, lng: 2.2945 }),
      buildMapPlace({ id: 2, lat: 48.86, lng: 2.337 }),
    ]

    const { rerender } = render(
      <MapViewGL places={places} fitKey={1} selectedPlaceId={null} hasInspector={false} />,
    )
    await act(async () => {})
    const after_initial = glMap.fitBounds.mock.calls.length

    // Selecting a place flips hasInspector → paddingOpts memo changes.
    // fitBounds must NOT fire again (this was the bug).
    rerender(
      <MapViewGL places={places} fitKey={1} selectedPlaceId={1} hasInspector={true} />,
    )
    await act(async () => {})
    expect(glMap.fitBounds).toHaveBeenCalledTimes(after_initial)
  })

  it('FE-COMP-MAPVIEWGL-002: closing inspector does not refit bounds (issue #921)', async () => {
    const places = [
      buildMapPlace({ id: 1, lat: 48.8584, lng: 2.2945 }),
    ]

    const { rerender } = render(
      <MapViewGL places={places} fitKey={1} selectedPlaceId={1} hasInspector={true} />,
    )
    await act(async () => {})
    const after_initial = glMap.fitBounds.mock.calls.length

    // Closing inspector (X button) clears selectedPlaceId → hasInspector=false → new paddingOpts.
    rerender(
      <MapViewGL places={places} fitKey={1} selectedPlaceId={null} hasInspector={false} />,
    )
    await act(async () => {})
    expect(glMap.fitBounds).toHaveBeenCalledTimes(after_initial)
  })

  it('FE-COMP-MAPVIEWGL-003: bumping fitKey triggers a new fitBounds call', async () => {
    const places = [
      buildMapPlace({ id: 1, lat: 48.8584, lng: 2.2945 }),
    ]

    const { rerender } = render(<MapViewGL places={places} fitKey={1} />)
    await act(async () => {})
    const after_first = glMap.fitBounds.mock.calls.length

    rerender(<MapViewGL places={places} fitKey={2} />)
    await act(async () => {})
    expect(glMap.fitBounds.mock.calls.length).toBeGreaterThan(after_first)
  })

  it('FE-COMP-MAPVIEWGL-004: renders with the MapLibre provider and no token', async () => {
    const mapboxgl = (await import('mapbox-gl')).default
    const maplibregl = (await import('maplibre-gl')).default
    useSettingsStore.setState({
      settings: {
        ...useSettingsStore.getState().settings,
        map_provider: 'maplibre-gl',
        mapbox_access_token: '', // MapLibre/OpenFreeMap is tokenless — must not short-circuit
        maplibre_style: 'https://tiles.openfreemap.org/styles/liberty',
      },
    } as any)
    const places = [buildMapPlace({ id: 1, lat: 48.8584, lng: 2.2945 })]

    render(<MapViewGL places={places} fitKey={1} glProvider="maplibre-gl" />)
    await act(async () => {})

    // The MapLibre engine builds the map even without a token; Mapbox is not used.
    expect(maplibregl.Map).toHaveBeenCalled()
    expect(mapboxgl.Map).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-014: MapLibre maps disable the around-center mouse rotate (#1545)', async () => {
    const mapboxgl = (await import('mapbox-gl')).default
    const maplibregl = (await import('maplibre-gl')).default
    useSettingsStore.setState({
      settings: {
        ...useSettingsStore.getState().settings,
        map_provider: 'maplibre-gl',
        mapbox_access_token: '',
        maplibre_style: 'https://tiles.openfreemap.org/styles/liberty',
      },
    } as any)
    const places = [buildMapPlace({ id: 1, lat: 48.8584, lng: 2.2945 })]

    render(<MapViewGL places={places} fitKey={1} glProvider="maplibre-gl" />)
    await act(async () => {})
    // MapLibre 5's around-center rotate reverses direction at a drifting
    // mid-screen line, so the map must opt out of it.
    expect((maplibregl.Map as any).mock.calls[0][0]).toMatchObject({ aroundCenter: false })

    vi.clearAllMocks()
    useSettingsStore.setState({
      settings: {
        ...useSettingsStore.getState().settings,
        map_provider: 'mapbox-gl',
        mapbox_access_token: 'pk.test_token',
      },
    } as any)
    render(<MapViewGL places={places} fitKey={1} glProvider="mapbox-gl" />)
    await act(async () => {})
    // mapbox-gl has no such option — it must not receive the stray key.
    expect((mapboxgl.Map as any).mock.calls[0][0]).not.toHaveProperty('aroundCenter')
  })

  it('FE-COMP-MAPVIEWGL-005: adds the clustered place source + layers so markers group on zoom-out (#1385)', async () => {
    glMap.on.mockImplementation((event: string, handlerOrLayer: unknown) => {
      if (event === 'load' && typeof handlerOrLayer === 'function') (handlerOrLayer as () => void)()
      return glMap
    })
    useSettingsStore.setState({
      settings: {
        ...useSettingsStore.getState().settings,
        map_provider: 'maplibre-gl',
        mapbox_access_token: '',
        maplibre_style: 'https://tiles.openfreemap.org/styles/liberty',
      },
    } as any)

    render(<MapViewGL places={[buildMapPlace({ id: 1, lat: 48.8584, lng: 2.2945 })]} fitKey={1} glProvider="maplibre-gl" />)
    await act(async () => {})

    expect(glMap.addSource).toHaveBeenCalledWith('trip-place-clusters', expect.objectContaining({
      type: 'geojson',
      cluster: true,
      clusterRadius: 30,
      clusterMaxZoom: 10,
    }))
    expect(glMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'trip-place-clusters-circle' }))
    expect(glMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'trip-place-clusters-count' }))
  })

  function touchEvent(type: string, touches: Array<{ clientX: number; clientY: number }>) {
    const ev = new Event(type, { bubbles: true })
    Object.defineProperty(ev, 'touches', { value: touches })
    return ev
  }

  it('FE-COMP-MAPVIEWGL-006: touch long-press opens Add-Place at the held position (#1398)', async () => {
    vi.useFakeTimers()
    try {
      const onContext = vi.fn()
      render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} />)
      await act(async () => {})
      act(() => {
        glCanvasContainer.dispatchEvent(touchEvent('touchstart', [{ clientX: 30, clientY: 40 }]))
        vi.advanceTimersByTime(650)
      })
      expect(onContext).toHaveBeenCalledTimes(1)
      expect(onContext.mock.calls[0][0].latlng).toEqual({ lat: 48.8566, lng: 2.3522 })
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-MAPVIEWGL-007: a moving finger (pan) cancels the long-press (#1398)', async () => {
    vi.useFakeTimers()
    try {
      const onContext = vi.fn()
      render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} />)
      await act(async () => {})
      act(() => {
        glCanvasContainer.dispatchEvent(touchEvent('touchstart', [{ clientX: 30, clientY: 40 }]))
        glCanvasContainer.dispatchEvent(touchEvent('touchmove', [{ clientX: 60, clientY: 90 }]))
        vi.advanceTimersByTime(650)
      })
      expect(onContext).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-MAPVIEWGL-008: a second finger (pinch) cancels the long-press (#1398)', async () => {
    vi.useFakeTimers()
    try {
      const onContext = vi.fn()
      render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} />)
      await act(async () => {})
      act(() => {
        glCanvasContainer.dispatchEvent(touchEvent('touchstart', [{ clientX: 30, clientY: 40 }]))
        glCanvasContainer.dispatchEvent(touchEvent('touchstart', [{ clientX: 30, clientY: 40 }, { clientX: 80, clientY: 40 }]))
        vi.advanceTimersByTime(650)
      })
      expect(onContext).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-MAPVIEWGL-009: a plain right-click (map contextmenu event) opens Add-Place, deduped (#1398)', async () => {
    const onContext = vi.fn()
    render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} />)
    await act(async () => {})
    const handler = glMap.on.mock.calls.find(c => c[0] === 'contextmenu')?.[1] as (e: unknown) => void
    expect(handler).toBeTypeOf('function')
    act(() => {
      handler({ lngLat: { lat: 48.8566, lng: 2.3522 }, originalEvent: new MouseEvent('contextmenu') })
      // Android long-press fires the native contextmenu on top of our timer —
      // a second event inside the dedupe window must not open a second form.
      handler({ lngLat: { lat: 48.8566, lng: 2.3522 }, originalEvent: new MouseEvent('contextmenu') })
    })
    expect(onContext).toHaveBeenCalledTimes(1)
    expect(onContext.mock.calls[0][0].latlng).toEqual({ lat: 48.8566, lng: 2.3522 })
  })

  it('FE-COMP-MAPVIEWGL-012: a right-button rotate/pitch drag does not open Add-Place on release (#1398)', async () => {
    const onContext = vi.fn()
    render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} />)
    await act(async () => {})
    const handler = glMap.on.mock.calls.find(c => c[0] === 'contextmenu')?.[1] as (e: unknown) => void
    act(() => {
      // mapbox-gl (unlike maplibre) still emits contextmenu after a right-drag
      // on Windows — the movement guard must drop it.
      glCanvasContainer.dispatchEvent(new MouseEvent('mousedown', { button: 2, clientX: 10, clientY: 10, bubbles: true }))
      handler({ lngLat: { lat: 1, lng: 2 }, originalEvent: new MouseEvent('contextmenu', { clientX: 140, clientY: 90 }) })
    })
    expect(onContext).not.toHaveBeenCalled()
    // ...while a stationary right-click still fires.
    act(() => {
      glCanvasContainer.dispatchEvent(new MouseEvent('mousedown', { button: 2, clientX: 10, clientY: 10, bubbles: true }))
      handler({ lngLat: { lat: 1, lng: 2 }, originalEvent: new MouseEvent('contextmenu', { clientX: 11, clientY: 10 }) })
    })
    expect(onContext).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-MAPVIEWGL-013: a stale long-press suppression never swallows a later real tap (#1398)', async () => {
    vi.useFakeTimers()
    try {
      const onContext = vi.fn()
      const onMapClick = vi.fn()
      render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} onMapClick={onMapClick} />)
      await act(async () => {})
      // Long-press fires (arms the suppression), but no click follows.
      act(() => {
        glCanvasContainer.dispatchEvent(touchEvent('touchstart', [{ clientX: 30, clientY: 40 }]))
        vi.advanceTimersByTime(650)
      })
      expect(onContext).toHaveBeenCalledTimes(1)
      // The NEXT gesture starts fresh: its tap must reach the map click handler.
      const clickHandler = glMap.on.mock.calls.find(c => c[0] === 'click')?.[1] as (e: unknown) => void
      act(() => {
        glCanvasContainer.dispatchEvent(touchEvent('touchstart', [{ clientX: 80, clientY: 90 }]))
        glCanvasContainer.dispatchEvent(touchEvent('touchend', []))
        clickHandler({ lngLat: { lat: 3, lng: 4 }, originalEvent: { target: glCanvasContainer } })
      })
      expect(onMapClick).toHaveBeenCalledWith({ latlng: { lat: 3, lng: 4 } })
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-MAPVIEWGL-010: middle-click still opens Add-Place (#1398 regression guard)', async () => {
    const onContext = vi.fn()
    render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} />)
    await act(async () => {})
    act(() => {
      glCanvasContainer.dispatchEvent(new MouseEvent('mousedown', { button: 1, bubbles: true }))
    })
    expect(onContext).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-MAPVIEWGL-011: clicking a marker clears the hover card; movestart clears + suppresses it (#1404)', async () => {
    // Markers are only reconciled once the style has loaded — fire 'load' like GL-005 does.
    glMap.on.mockImplementation((event: string, handlerOrLayer: unknown) => {
      if (event === 'load' && typeof handlerOrLayer === 'function') (handlerOrLayer as () => void)()
      return glMap
    })
    const mapboxgl = (await import('mapbox-gl')).default
    const places = [buildMapPlace({ id: 7, lat: 48.8584, lng: 2.2945, name: 'Tour Eiffel' })]
    const { queryByTestId } = render(<MapViewGL places={places} fitKey={1} onMarkerClick={vi.fn()} />)
    await act(async () => {})

    const markerCall = (mapboxgl.Marker as unknown as ReturnType<typeof vi.fn>).mock.calls
      .find(c => c[0]?.element)
    expect(markerCall).toBeTruthy()
    const el = markerCall![0].element as HTMLElement

    // hover shows the card
    act(() => { el.dispatchEvent(new MouseEvent('mouseenter', { clientX: 10, clientY: 10 })) })
    expect(queryByTestId('tooltip')).toBeTruthy()

    // click clears it (the flyTo that follows moves the marker away, no mouseleave will come)
    act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: false })) })
    expect(queryByTestId('tooltip')).toBeNull()

    // hover again, then camera movement clears + suppresses
    act(() => { el.dispatchEvent(new MouseEvent('mouseenter', { clientX: 10, clientY: 10 })) })
    expect(queryByTestId('tooltip')).toBeTruthy()
    const moveStart = glMap.on.mock.calls.find(c => c[0] === 'movestart')?.[1] as () => void
    const moveEnds = glMap.on.mock.calls.filter(c => c[0] === 'moveend').map(c => c[1] as () => void)
    act(() => { moveStart() })
    expect(queryByTestId('tooltip')).toBeNull()
    // while the camera is moving, a re-fired mouseenter must not bring it back
    act(() => { el.dispatchEvent(new MouseEvent('mouseenter', { clientX: 10, clientY: 10 })) })
    expect(queryByTestId('tooltip')).toBeNull()
    // after the move ends, hover works again
    act(() => { moveEnds.forEach(fn => fn()) })
    act(() => { el.dispatchEvent(new MouseEvent('mouseenter', { clientX: 10, clientY: 10 })) })
    expect(queryByTestId('tooltip')).toBeTruthy()
  })

  // The map opens already framed on its places, so these exercise the fits that happen
  // afterwards — picking a day bumps fitKey.
  it('FE-COMP-MAPVIEWGL-014: fits bounds immediately even when MapLibre loaded() is false', async () => {
    glMap.loaded.mockReturnValue(false)
    const places = [
      buildMapPlace({ id: 1, lat: 35.38, lng: 136.94 }),
      buildMapPlace({ id: 2, lat: 35.42, lng: 136.76 }),
    ]

    const { rerender } = render(
      <MapViewGL places={places} dayPlaces={places} fitKey={1} glProvider="maplibre-gl" />,
    )
    await act(async () => {})

    rerender(<MapViewGL places={places} dayPlaces={places} fitKey={2} glProvider="maplibre-gl" />)
    await act(async () => {})

    expect(glMap.fitBounds).toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-015: fits MapLibre bounds to route geometry when it arrives after a day fit', async () => {
    const dayPlaces = [
      buildMapPlace({ id: 1, lat: 35.38, lng: 136.94 }),
      buildMapPlace({ id: 2, lat: 35.42, lng: 136.76 }),
    ]
    // The day's route is drawn as straight lines in the same batch as the fit, then
    // upgraded to the real road geometry — which detours well outside the markers.
    const straightLines: [number, number][][] = [[[35.38, 136.94], [35.42, 136.76]]]
    const roadGeometry: [number, number][][] = [[[35.38, 136.94], [35.72, 137.51], [35.42, 136.76]]]

    const { rerender } = render(
      <MapViewGL
        places={dayPlaces}
        dayPlaces={dayPlaces}
        route={straightLines}
        fitKey={1}
        glProvider="maplibre-gl"
      />,
    )
    await act(async () => {})

    // Pick a day: fits the markers, with only the straight-line route to go on so far.
    rerender(
      <MapViewGL
        places={dayPlaces}
        dayPlaces={dayPlaces}
        route={straightLines}
        fitKey={2}
        glProvider="maplibre-gl"
      />,
    )
    await act(async () => {})
    const afterDayFit = glMap.fitBounds.mock.calls.length
    expect(afterDayFit).toBeGreaterThan(0)

    // The real geometry lands a moment later and the fit widens to take it in.
    rerender(
      <MapViewGL
        places={dayPlaces}
        dayPlaces={dayPlaces}
        route={roadGeometry}
        fitKey={2}
        glProvider="maplibre-gl"
      />,
    )
    await act(async () => {})

    expect(glMap.fitBounds.mock.calls.length).toBeGreaterThan(afterDayFit)
    const latestBounds = glBounds.instances[glBounds.instances.length - 1]
    expect(latestBounds.extend).toHaveBeenCalledWith([137.51, 35.72])
  })

  describe('opening camera', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapOptions = () => (maplibregl.Map as any).mock.calls.at(-1)[0]

    it('FE-COMP-MAPVIEWGL-017: builds the map framed on the places, in [lng, lat] order', async () => {
      const places = [
        buildMapPlace({ id: 1, lat: 35.01, lng: 135.76 }),  // Kyoto
        buildMapPlace({ id: 2, lat: 34.69, lng: 135.5 }),   // Osaka
      ]

      render(<MapViewGL places={places} glProvider="maplibre-gl" />)
      await act(async () => {})

      const { center, zoom } = mapOptions()
      // GL takes [lng, lat] — the swap is the easiest thing to get backwards here.
      expect(center[0]).toBeCloseTo(135.63, 1)
      expect(center[1]).toBeCloseTo(34.85, 1)
      // Framed on two cities ~30km apart: regional, not the world and not street level.
      expect(zoom).toBeGreaterThan(6)
      expect(zoom).toBeLessThan(12)
    })

    it('FE-COMP-MAPVIEWGL-020: does not jump to the default centre on mount, undoing the framing', async () => {
      const places = [buildMapPlace({ id: 1, lat: 35.01, lng: 135.76 })]

      render(<MapViewGL places={places} glProvider="maplibre-gl" />)
      await act(async () => {})

      // The centre prop is the world-view default nobody passed. Jumping to it on mount would
      // throw away the camera the map was just built with and land on Null Island at zoom 2.
      expect(glMap.jumpTo).not.toHaveBeenCalled()
    })

    it('FE-COMP-MAPVIEWGL-018: does not fit on mount when it opened already framed', async () => {
      const places = [buildMapPlace({ id: 1, lat: 35.01, lng: 135.76 })]

      const { rerender } = render(<MapViewGL places={places} fitKey={1} glProvider="maplibre-gl" />)
      await act(async () => {})

      // Fitting would only re-do the framing, and its maxZoom would overrule the gentler
      // zoom a lone place opens at.
      expect(glMap.fitBounds).not.toHaveBeenCalled()

      // Picking a day still fits, as always.
      rerender(<MapViewGL places={places} fitKey={2} glProvider="maplibre-gl" />)
      await act(async () => {})
      expect(glMap.fitBounds).toHaveBeenCalled()
    })

    it('FE-COMP-MAPVIEWGL-019: falls back to the world view when no place has coordinates', async () => {
      render(
        <MapViewGL
          places={[buildMapPlace({ id: 1, lat: null, lng: null })]}
          glProvider="maplibre-gl"
        />,
      )
      await act(async () => {})

      const { center, zoom } = mapOptions()
      expect(center).toEqual([0, 0])
      expect(zoom).toBe(DEFAULT_MAP_ZOOM)
    })
  })

  it('FE-COMP-MAPVIEWGL-016: leaves the camera alone when a route appears long after the fit', async () => {
    const dayPlaces = [
      buildMapPlace({ id: 1, lat: 35.38, lng: 136.94 }),
      buildMapPlace({ id: 2, lat: 35.42, lng: 136.76 }),
    ]

    const { rerender } = render(
      <MapViewGL
        places={dayPlaces}
        dayPlaces={dayPlaces}
        route={null}
        fitKey={1}
        glProvider="maplibre-gl"
      />,
    )
    await act(async () => {})

    // Pick a day with the route toggle off: no route is pending for this fit.
    rerender(
      <MapViewGL
        places={dayPlaces}
        dayPlaces={dayPlaces}
        route={null}
        fitKey={2}
        glProvider="maplibre-gl"
      />,
    )
    await act(async () => {})
    const afterDayFit = glMap.fitBounds.mock.calls.length
    expect(afterDayFit).toBeGreaterThan(0)

    // Much later the user pans away and turns the route on. That is not the geometry this
    // fit was waiting for, so the camera must stay put.
    rerender(
      <MapViewGL
        places={dayPlaces}
        dayPlaces={dayPlaces}
        route={[[[35.38, 136.94], [35.72, 137.51], [35.42, 136.76]]]}
        fitKey={2}
        glProvider="maplibre-gl"
      />,
    )
    await act(async () => {})

    expect(glMap.fitBounds.mock.calls.length).toBe(afterDayFit)
  })
// ── Track colours (#776) ──────────────────────────────────────────────────
  // The gpx layer paints from a per-feature property, so what matters is the
  // GeoJSON handed to setData. getSource returns null by default in this suite,
  // which makes the effect bail out — the source has to be stubbed per test.
  const gpxFeatures = () => {
    const gpxSource = { setData: vi.fn() }
    glMap.getSource.mockImplementation((id: string) => (id === 'trip-gpx' ? gpxSource : null))
    return () => {
      const calls = gpxSource.setData.mock.calls
      return calls.length ? (calls[calls.length - 1][0]?.features ?? []) : []
    }
  }

  it('FE-COMP-MAPVIEWGL-021: a picked route_color reaches the feature, casing on', async () => {
    const features = gpxFeatures()
    const places = [buildMapPlace({
      id: 5, lat: 48, lng: 2, route_geometry: '[[48.0,2.0],[49.0,3.0]]',
      category_color: '#00ff00', route_color: '#e11d48',
    })]
    render(<MapViewGL places={places} fitKey={1} glProvider="maplibre-gl" />)
    await act(async () => {})
    expect(features()[0]?.properties).toMatchObject({ color: '#e11d48', cased: true, place_id: 5 })
  })

  it('FE-COMP-MAPVIEWGL-022: without a pick it stays on the category colour and skips the casing', async () => {
    const features = gpxFeatures()
    const places = [buildMapPlace({
      id: 6, lat: 48, lng: 2, route_geometry: '[[48.0,2.0],[49.0,3.0]]',
      category_color: '#00ff00',
    })]
    render(<MapViewGL places={places} fitKey={1} glProvider="maplibre-gl" />)
    await act(async () => {})
    expect(features()[0]?.properties).toMatchObject({ color: '#00ff00', cased: false })
  })

  // ── Shared helpers for the effects below ──────────────────────────────────
  // Nothing beyond the bare map is wired up until the style reports 'load', so
  // most of the overlay work only runs once that handler has fired.
  function loadOnAttach() {
    glMap.on.mockImplementation((event: string, handlerOrLayer: unknown) => {
      if (event === 'load' && typeof handlerOrLayer === 'function') (handlerOrLayer as () => void)()
      return glMap
    })
  }

  // Layer-scoped listeners are registered as (event, layerId, handler);
  // map-level ones as (event, handler).
  const layerHandler = (event: string, layerId: string) =>
    glMap.on.mock.calls.find(c => c[0] === event && c[1] === layerId)?.[2] as (e?: unknown) => void
  const mapHandler = (event: string) =>
    glMap.on.mock.calls.find(c => c[0] === event && typeof c[1] === 'function')?.[1] as (e?: unknown) => void

  interface GeoFeature {
    properties: Record<string, unknown>
    geometry: { type: string; coordinates: number[] | number[][] | number[][][] }
  }
  const geoSource = () => ({ setData: vi.fn((_data: unknown) => {}) })
  function lastData(src: ReturnType<typeof geoSource>): { features: GeoFeature[] } {
    const calls = vi.mocked(src.setData).mock.calls
    return calls[calls.length - 1][0] as { features: GeoFeature[] }
  }

  // jsdom drives requestAnimationFrame off a timer, so the marker reconcile and
  // the batched photo updates only land after a short tick.
  const flushFrames = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 40)) })

  it('FE-COMP-MAPVIEWGL-023: draws a photo marker for an uploaded image and a category pin otherwise', async () => {
    loadOnAttach()
    const places = [
      buildMapPlace({ id: 11, lat: 48.11, lng: 2.11, image_url: '/uploads/places/eiffel.jpg' }),
      buildMapPlace({ id: 12, lat: 48.12, lng: 2.12, category_color: '#ff0000', category_icon: 'Utensils' }),
    ]

    render(<MapViewGL places={places} fitKey={1} dayOrderMap={{ 11: [2], 12: [1, 3] }} />)
    await act(async () => {})

    const photoMarker = glMarkers.created[0].element
    expect(photoMarker.querySelector('img')?.getAttribute('src')).toBe('/uploads/places/eiffel.jpg')
    expect(photoMarker.textContent).toContain('2')

    const pinMarker = glMarkers.created[1].element
    expect(pinMarker.querySelector('img')).toBeNull()
    expect(pinMarker.querySelector('svg')).toBeTruthy()
    expect(pinMarker.innerHTML).toContain('#ff0000')
    // A place that appears on several days lists all of them in one badge.
    expect(pinMarker.textContent).toContain('1 · 3')
    expect(glMarkers.created[1].lngLat).toEqual([2.12, 48.12])
  })

  // The Leaflet twin of this is FE-COMP-MAPVIEW-074. Both renderers build their
  // marker as an HTML string, so both need the escape pinned — otherwise it can
  // be dropped from one of them without a single test going red.
  it('FE-COMP-MAPVIEWGL-023b: an image_url that passes the prefix check is still escaped', async () => {
    loadOnAttach()
    render(<MapViewGL places={[buildMapPlace({
      id: 13, lat: 48.13, lng: 2.13, image_url: '/uploads/x" onerror="alert(1)" y="',
    })]} fitKey={1} />)
    await act(async () => {})

    const marker = glMarkers.created[0].element
    expect(marker.innerHTML).not.toContain('onerror="alert(1)"')
    expect(marker.innerHTML).toContain('&quot;')
    // The escape must not break the ordinary case: the src still resolves.
    expect(marker.querySelector('img')?.getAttribute('src')).toBe('/uploads/x" onerror="alert(1)" y="')
  })

  it('FE-COMP-MAPVIEWGL-024: the hover card shows name, category and address and follows the cursor', async () => {
    loadOnAttach()
    const places = [buildMapPlace({
      id: 21, lat: 48.86, lng: 2.33, name: 'Louvre', address: 'Rue de Rivoli',
      category_name: 'Museum', category_color: '#6366f1', category_icon: 'Landmark',
    })]

    const { getByTestId, queryByTestId } = render(<MapViewGL places={places} fitKey={1} />)
    await act(async () => {})
    const el = glMarkers.created[0].element

    act(() => { el.dispatchEvent(new MouseEvent('mouseenter', { clientX: 40, clientY: 60 })) })
    const card = getByTestId('tooltip')
    expect(card.textContent).toContain('Louvre')
    expect(card.textContent).toContain('Museum')
    expect(card.textContent).toContain('Rue de Rivoli')
    expect(card.style.left).toBe('54px')

    act(() => { el.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 120 })) })
    expect(getByTestId('tooltip').style.left).toBe('114px')

    // The card is position:fixed, so a page scroll would leave it stranded.
    act(() => { window.dispatchEvent(new Event('scroll')) })
    expect(queryByTestId('tooltip')).toBeNull()
  })

  it('FE-COMP-MAPVIEWGL-025: mouseleave clears the card and hoverDisabled suppresses it entirely', async () => {
    loadOnAttach()
    const places = [buildMapPlace({ id: 22, lat: 48.86, lng: 2.33 })]

    const { queryByTestId } = render(<MapViewGL places={places} fitKey={1} />)
    await act(async () => {})
    const el = glMarkers.created[0].element
    act(() => { el.dispatchEvent(new MouseEvent('mouseenter', { clientX: 10, clientY: 10 })) })
    expect(queryByTestId('tooltip')).toBeTruthy()
    act(() => { el.dispatchEvent(new MouseEvent('mouseleave')) })
    expect(queryByTestId('tooltip')).toBeNull()

    glMarkers.clear()
    const disabled = render(<MapViewGL places={places} fitKey={1} hoverDisabled />)
    await act(async () => {})
    const disabledEl = glMarkers.created[0].element
    act(() => {
      disabledEl.dispatchEvent(new MouseEvent('mouseenter', { clientX: 10, clientY: 10 }))
      disabledEl.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 20 }))
      disabledEl.dispatchEvent(new MouseEvent('mouseleave'))
    })
    expect(disabled.queryByTestId('tooltip')).toBeNull()
  })

  it('FE-COMP-MAPVIEWGL-026: a place that disappears takes its marker and hover card with it', async () => {
    loadOnAttach()
    const kept = buildMapPlace({ id: 31, lat: 48.31, lng: 2.31 })
    const dropped = buildMapPlace({ id: 32, lat: 48.32, lng: 2.32 })

    const { rerender, queryByTestId } = render(<MapViewGL places={[kept, dropped]} fitKey={1} />)
    await act(async () => {})
    const droppedEl = glMarkers.created[1].element
    act(() => { droppedEl.dispatchEvent(new MouseEvent('mouseenter', { clientX: 10, clientY: 10 })) })
    expect(queryByTestId('tooltip')).toBeTruthy()

    rerender(<MapViewGL places={[kept]} fitKey={1} />)
    await act(async () => {})
    // Removing the marker under the cursor never fires mouseleave, so the card
    // has to be dropped by the reconcile itself.
    expect(queryByTestId('tooltip')).toBeNull()
  })

  it('FE-COMP-MAPVIEWGL-067: hovering does not rebuild the markers under the cursor (#1404)', async () => {
    loadOnAttach()
    const places = [
      buildMapPlace({ id: 41, lat: 48.41, lng: 2.41 }),
      buildMapPlace({ id: 42, lat: 48.42, lng: 2.42 }),
    ]

    const { queryByTestId } = render(<MapViewGL places={places} fitKey={1} />)
    await act(async () => {})
    const before = glMarkers.created.length
    const el = glMarkers.created[0].element

    act(() => { el.dispatchEvent(new MouseEvent('mouseenter', { clientX: 10, clientY: 10 })) })
    await act(async () => {})

    // The hover card is component state, so it re-renders MapViewGL. The omitted
    // collection props have to keep their identity across that render — a fresh
    // `[]`/`{}` default would re-run the reconcile effects and recreate every
    // marker, and a marker recreated under the pointer never fires mouseleave.
    expect(queryByTestId('tooltip')).toBeTruthy()
    expect(glMarkers.created).toHaveLength(before)
  })

  it.each([
    ['mapbox-gl', () => mapboxgl.Popup],
    ['maplibre-gl', () => maplibregl.Popup],
  ] as const)('FE-COMP-MAPVIEWGL-068: the %s hover card clears its marker without a tail', async (provider, popupOf) => {
    loadOnAttach()
    const { unmount } = render(<MapViewGL places={[]} fitKey={1} glProvider={provider} />)
    await act(async () => {})

    // The tail is hidden in index.css, and it used to contribute 10px of the
    // gap itself — the offset has to make those up or the card sits on top of
    // the marker it describes.
    const options = (popupOf() as unknown as { mock: { calls: [Record<string, unknown>][] } }).mock.calls[0]?.[0]
    expect(options).toMatchObject({ className: 'trek-map-popup', offset: 26, closeButton: false })
    // Leaves the map listeners attached otherwise, and the next case reads them
    // back out of the same mock.
    unmount()
  })

  it('FE-COMP-MAPVIEWGL-027: clicking a GPX track selects its place unless a marker or cluster is on top', async () => {
    loadOnAttach()
    const onMarkerClick = vi.fn()
    render(
      <MapViewGL
        places={[buildMapPlace({ id: 41, lat: 48, lng: 2, route_geometry: '[[48,2],[49,3]]' })]}
        fitKey={1}
        onMarkerClick={onMarkerClick}
      />,
    )
    await act(async () => {})
    const selectTrack = layerHandler('click', 'trip-gpx-hit')
    expect(selectTrack).toBeTypeOf('function')

    const trackEvent = (target: HTMLElement) => ({
      point: { x: 10, y: 10 },
      originalEvent: { target },
      features: [{ properties: { place_id: 41 } }],
    })
    act(() => { selectTrack(trackEvent(document.createElement('div'))) })
    expect(onMarkerClick).toHaveBeenCalledWith(41)

    const markerEl = document.createElement('div')
    markerEl.className = 'mapboxgl-marker'
    act(() => { selectTrack(trackEvent(markerEl)) })
    expect(onMarkerClick).toHaveBeenCalledTimes(1)

    // A cluster bubble sitting over the line owns the click (zoom-to-expand).
    glMap.getLayer.mockReturnValue({ id: 'trip-place-clusters-circle' })
    glMap.queryRenderedFeatures.mockReturnValue([{ properties: { cluster_id: 3 } }])
    act(() => { selectTrack(trackEvent(document.createElement('div'))) })
    expect(onMarkerClick).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-MAPVIEWGL-028: hovering a track turns the cursor into a pointer', async () => {
    loadOnAttach()
    const canvas = document.createElement('canvas')
    glMap.getCanvas.mockReturnValue(canvas)
    render(<MapViewGL places={[buildMapPlace({ id: 42, lat: 48, lng: 2 })]} fitKey={1} />)
    await act(async () => {})

    act(() => { layerHandler('mouseenter', 'trip-gpx-hit')() })
    expect(canvas.style.cursor).toBe('pointer')
    act(() => { layerHandler('mouseleave', 'trip-gpx-hit')() })
    expect(canvas.style.cursor).toBe('')

    act(() => { layerHandler('mouseenter', 'trip-place-clusters-circle')() })
    expect(canvas.style.cursor).toBe('pointer')
    act(() => { layerHandler('mouseleave', 'trip-place-clusters-circle')() })
    expect(canvas.style.cursor).toBe('')
  })

  it('FE-COMP-MAPVIEWGL-029: clicking a cluster bubble eases in to its expansion zoom', async () => {
    loadOnAttach()
    render(<MapViewGL places={[buildMapPlace({ id: 43, lat: 48, lng: 2 })]} fitKey={1} />)
    await act(async () => {})
    const zoomToCluster = layerHandler('click', 'trip-place-clusters-circle')
    expect(zoomToCluster).toBeTypeOf('function')

    const clusterFeature = { properties: { cluster_id: 7 }, geometry: { coordinates: [2, 48] } }
    glMap.queryRenderedFeatures.mockReturnValue([clusterFeature])
    const clusterSource: { getClusterExpansionZoom: (id: number, cb: (err: Error | null, zoom: number) => void) => number | Promise<number> | undefined } = {
      getClusterExpansionZoom: vi.fn((_id: number, cb: (err: Error | null, zoom: number) => void) => { cb(null, 12); return undefined }),
    }
    glMap.getSource.mockImplementation((id: string) => (id === 'trip-place-clusters' ? clusterSource : null))

    act(() => { zoomToCluster({ point: { x: 5, y: 5 } }) })
    expect(glMap.easeTo).toHaveBeenCalledWith({ center: [2, 48], zoom: 12, duration: 350 })

    // maplibre resolves the zoom as a promise instead of a callback.
    glMap.easeTo.mockClear()
    clusterSource.getClusterExpansionZoom = vi.fn(() => Promise.resolve(9))
    await act(async () => { zoomToCluster({ point: { x: 5, y: 5 } }) })
    expect(glMap.easeTo).toHaveBeenCalledWith({ center: [2, 48], zoom: 9, duration: 350 })

    // Older SDKs return the zoom straight from the call.
    glMap.easeTo.mockClear()
    glMap.queryRenderedFeatures.mockReturnValue([clusterFeature])
    clusterSource.getClusterExpansionZoom = vi.fn(() => 14)
    act(() => { zoomToCluster({ point: { x: 5, y: 5 } }) })
    expect(glMap.easeTo).toHaveBeenCalledWith({ center: [2, 48], zoom: 14, duration: 350 })

    // A failed expansion lookup leaves the camera where it is.
    glMap.easeTo.mockClear()
    clusterSource.getClusterExpansionZoom = vi.fn((_id: number, cb: (err: Error | null, zoom: number) => void) => {
      cb(new Error('cluster gone'), 0)
      return undefined
    })
    act(() => { zoomToCluster({ point: { x: 5, y: 5 } }) })
    expect(glMap.easeTo).not.toHaveBeenCalled()

    // A click that hits no cluster is a no-op.
    glMap.queryRenderedFeatures.mockReturnValue([])
    act(() => { zoomToCluster({ point: { x: 5, y: 5 } }) })
    expect(glMap.easeTo).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-030: a labelled plugin layer feature answers a click with a plain-text popup', async () => {
    loadOnAttach()
    render(<MapViewGL places={[]} fitKey={1} />)
    await act(async () => {})
    const showLabel = layerHandler('click', 'trek-plugin-layers-fill')
    expect(showLabel).toBeTypeOf('function')

    act(() => { showLabel({ lngLat: { lng: 2, lat: 48 }, features: [{ properties: { label: 'Charging corridor' } }] }) })
    expect(glPopup.setText).toHaveBeenCalledWith('Charging corridor')

    // Unlabelled features stay inert.
    vi.mocked(glPopup.setText).mockClear()
    act(() => { showLabel({ lngLat: { lng: 2, lat: 48 }, features: [{ properties: { label: '' } }] }) })
    expect(glPopup.setText).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-031: a map click on a marker, a cluster or a track never drops a new place', async () => {
    loadOnAttach()
    const onMapClick = vi.fn()
    render(<MapViewGL places={[]} fitKey={1} onMapClick={onMapClick} />)
    await act(async () => {})
    const click = mapHandler('click')

    const markerEl = document.createElement('div')
    markerEl.className = 'maplibregl-marker'
    act(() => { click({ point: { x: 1, y: 1 }, lngLat: { lat: 1, lng: 2 }, originalEvent: { target: markerEl } }) })
    expect(onMapClick).not.toHaveBeenCalled()

    glMap.getLayer.mockImplementation((id: string) => (id === 'trip-place-clusters-circle' ? { id } : null))
    glMap.queryRenderedFeatures.mockReturnValue([{ properties: { cluster_id: 1 } }])
    act(() => { click({ point: { x: 1, y: 1 }, lngLat: { lat: 1, lng: 2 }, originalEvent: { target: glCanvasContainer } }) })
    expect(onMapClick).not.toHaveBeenCalled()

    glMap.getLayer.mockImplementation((id: string) => (id === 'trip-gpx-hit' ? { id } : null))
    glMap.queryRenderedFeatures.mockImplementation((_point: unknown, opts: { layers: string[] }) => (
      opts.layers.includes('trip-gpx-hit') ? [{ properties: { place_id: 9 } }] : []
    ))
    act(() => { click({ point: { x: 1, y: 1 }, lngLat: { lat: 1, lng: 2 }, originalEvent: { target: glCanvasContainer } }) })
    expect(onMapClick).not.toHaveBeenCalled()

    glMap.getLayer.mockReturnValue(null)
    act(() => { click({ point: { x: 1, y: 1 }, lngLat: { lat: 1, lng: 2 }, originalEvent: { target: glCanvasContainer } }) })
    expect(onMapClick).toHaveBeenCalledWith({ latlng: { lat: 1, lng: 2 } })
  })

  it('FE-COMP-MAPVIEWGL-032: the tap that ends a long-press is swallowed exactly once (#1398)', async () => {
    vi.useFakeTimers()
    try {
      const onContext = vi.fn()
      const onMapClick = vi.fn()
      render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} onMapClick={onMapClick} />)
      await act(async () => {})
      const click = mapHandler('click')

      act(() => {
        glCanvasContainer.dispatchEvent(touchEvent('touchstart', [{ clientX: 30, clientY: 40 }]))
        vi.advanceTimersByTime(650)
      })
      expect(onContext).toHaveBeenCalledTimes(1)

      act(() => { click({ point: { x: 1, y: 1 }, lngLat: { lat: 1, lng: 2 }, originalEvent: { target: glCanvasContainer } }) })
      expect(onMapClick).not.toHaveBeenCalled()
      // The flag is consumed, so the next click is a real one again.
      act(() => { click({ point: { x: 1, y: 1 }, lngLat: { lat: 1, lng: 2 }, originalEvent: { target: glCanvasContainer } }) })
      expect(onMapClick).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-MAPVIEWGL-033: a left-click is not an Add-Place gesture and only middle auxclick is suppressed', async () => {
    const onContext = vi.fn()
    render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} />)
    await act(async () => {})

    act(() => { glCanvasContainer.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true })) })
    expect(onContext).not.toHaveBeenCalled()

    const middle = new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true })
    act(() => { glCanvasContainer.dispatchEvent(middle) })
    expect(middle.defaultPrevented).toBe(true)

    const right = new MouseEvent('auxclick', { button: 2, bubbles: true, cancelable: true })
    act(() => { glCanvasContainer.dispatchEvent(right) })
    expect(right.defaultPrevented).toBe(false)
  })

  it('FE-COMP-MAPVIEWGL-034: a long-press that starts on a marker never opens Add-Place', async () => {
    vi.useFakeTimers()
    const markerEl = document.createElement('div')
    markerEl.className = 'mapboxgl-marker'
    glCanvasContainer.appendChild(markerEl)
    try {
      const onContext = vi.fn()
      render(<MapViewGL places={[]} fitKey={1} onMapContextMenu={onContext} />)
      await act(async () => {})
      act(() => {
        markerEl.dispatchEvent(touchEvent('touchstart', [{ clientX: 30, clientY: 40 }]))
        vi.advanceTimersByTime(650)
      })
      expect(onContext).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
      markerEl.remove()
    }
  })

  it('FE-COMP-MAPVIEWGL-035: panning the map by hand drops follow mode but leaves the other modes alone', async () => {
    render(<MapViewGL places={[]} fitKey={1} />)
    await act(async () => {})

    act(() => { mapHandler('dragstart')() })
    expect(geoStub.setMode).toHaveBeenCalledTimes(1)
    const updater = geoStub.setMode.mock.calls[0][0] as (prev: TrackingMode) => TrackingMode
    expect(updater('follow')).toBe('show')
    expect(updater('show')).toBe('show')
    expect(updater('off')).toBe('off')
  })

  it('FE-COMP-MAPVIEWGL-036: with 3D on it injects terrain plus buildings and pins markers to the DEM', async () => {
    loadOnAttach()
    vi.mocked(mapboxSetup.wantsTerrain).mockReturnValue(true)
    vi.mocked(mapboxSetup.supportsCustom3d).mockReturnValue(true)
    useSettingsStore.setState({
      settings: {
        ...useSettingsStore.getState().settings,
        mapbox_style: 'mapbox://styles/mapbox/satellite-v9',
        mapbox_3d_enabled: true,
      },
    } as any)
    glMap.queryTerrainElevation.mockReturnValue(120)

    render(<MapViewGL places={[buildMapPlace({ id: 51, lat: 48.5, lng: 2.5 })]} fitKey={1} />)
    await act(async () => {})

    expect(mapboxSetup.addTerrainAndSky).toHaveBeenCalledWith(glMap)
    expect(mapboxSetup.addCustom3dBuildings).toHaveBeenCalledWith(glMap, false)

    const marker = glMarkers.created[glMarkers.created.length - 1]
    act(() => { mapHandler('render')() })
    expect(vi.mocked(marker.setLngLat)).toHaveBeenLastCalledWith([2.5, 48.5, 120])

    // ~12 Hz throttle: a second frame straight away must not re-project.
    const callsAfterFirstFrame = vi.mocked(marker.setLngLat).mock.calls.length
    act(() => { mapHandler('render')() })
    expect(vi.mocked(marker.setLngLat).mock.calls.length).toBe(callsAfterFirstFrame)
  })

  it('FE-COMP-MAPVIEWGL-037: markers stay put while the terrain DEM is still streaming in', async () => {
    loadOnAttach()
    useSettingsStore.setState({
      settings: { ...useSettingsStore.getState().settings, mapbox_3d_enabled: true },
    } as any)
    glMap.queryTerrainElevation.mockImplementation(() => { throw new Error('terrain not ready') })

    render(<MapViewGL places={[buildMapPlace({ id: 52, lat: 48.5, lng: 2.5 })]} fitKey={1} />)
    await act(async () => {})
    const marker = glMarkers.created[glMarkers.created.length - 1]
    const before = vi.mocked(marker.setLngLat).mock.calls.length

    act(() => { mapHandler('render')() })
    expect(vi.mocked(marker.setLngLat).mock.calls.length).toBe(before)
  })

  it('FE-COMP-MAPVIEWGL-038: the Standard style is flattened and pinned to the UI label language (#1299)', async () => {
    loadOnAttach()
    vi.mocked(mapboxSetup.isStandardFamily).mockReturnValue(true)
    useSettingsStore.setState({
      settings: {
        ...useSettingsStore.getState().settings,
        mapbox_style: 'mapbox://styles/mapbox/standard',
        mapbox_3d_enabled: true,
        language: 'zh',
      },
    } as any)

    render(<MapViewGL places={[buildMapPlace({ id: 53, lat: 48, lng: 2 })]} fitKey={1} />)
    await act(async () => {})

    // Standard's own DEM would lift the buildings off the sea-level markers.
    expect(glMap.setTerrain).toHaveBeenCalledWith(null)
    expect(glMap.setConfigProperty).toHaveBeenCalledWith('basemap', 'language', 'zh-Hans')
    // It ships its own 3D, so nothing extra is injected.
    expect(mapboxSetup.addTerrainAndSky).not.toHaveBeenCalled()
    expect(mapboxSetup.addCustom3dBuildings).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-039: a fix attaches the blue dot and follow mode eases the camera onto it', async () => {
    const position: GeoPosition = { lat: 48.86, lng: 2.35, accuracy: 12, heading: 90, speed: null, timestamp: 1 }
    geoStub.position = position
    geoStub.mode = 'follow'

    render(<MapViewGL places={[]} fitKey={1} />)
    await act(async () => {})

    expect(locationMarker.update).toHaveBeenCalledWith(position)
    expect(glMap.easeTo).toHaveBeenCalledWith({ center: [2.35, 48.86], bearing: 90, zoom: 16, duration: 350 })
  })

  it('FE-COMP-MAPVIEWGL-040: the dot waits for the style, follows tracking changes and is destroyed on unmount', async () => {
    glMap.loaded.mockReturnValue(false)
    geoStub.position = { lat: 48.86, lng: 2.35, accuracy: 12, heading: null, speed: null, timestamp: 1 }
    geoStub.mode = 'show'

    const { rerender, unmount } = render(<MapViewGL places={[]} fitKey={1} />)
    await act(async () => {})
    expect(locationMarker.update).not.toHaveBeenCalled()

    const apply = glMap.once.mock.calls.find(c => c[0] === 'load')?.[1] as () => void
    act(() => { apply() })
    expect(locationMarker.update).toHaveBeenCalledTimes(1)
    // 'show' means the dot stays but the camera does not chase it.
    expect(glMap.easeTo).not.toHaveBeenCalled()

    geoStub.mode = 'off'
    rerender(<MapViewGL places={[]} fitKey={1} />)
    await act(async () => {})
    expect(locationMarker.update).toHaveBeenLastCalledWith(null)

    unmount()
    expect(locationMarker.destroy).toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-041: the reservation overlay reports endpoint clicks back to the caller', async () => {
    loadOnAttach()
    const onReservationClick = vi.fn()
    render(
      <MapViewGL places={[]} fitKey={1} reservations={[]} showReservationStats onReservationClick={onReservationClick} />,
    )
    await act(async () => {})

    const options = reservationOverlay.update.mock.calls[0][1] as {
      showConnections: boolean
      showStats: boolean
      onEndpointClick: (id: number) => void
    }
    expect(options.showConnections).toBe(true)
    expect(options.showStats).toBe(true)
    options.onEndpointClick(77)
    expect(onReservationClick).toHaveBeenCalledWith(77)
  })

  it('FE-COMP-MAPVIEWGL-042: explore POIs get their own pin, hover popup and click callback', async () => {
    loadOnAttach()
    const basePoi: Poi = {
      osm_id: 'n1', name: 'Café de Flore', lat: 48.854, lng: 2.332, category: 'cafe',
      poi_type: 'cafe', address: null, website: null, phone: null, opening_hours: null,
      cuisine: null, source: 'openstreetmap',
    }
    const unknownPoi: Poi = { ...basePoi, osm_id: 'n2', name: 'Spaceport', category: 'spaceport' }
    const onPoiClick = vi.fn()

    render(<MapViewGL places={[]} fitKey={1} pois={[basePoi, unknownPoi]} onPoiClick={onPoiClick} />)
    await act(async () => {})

    expect(glMarkers.created).toHaveLength(2)
    const el = glMarkers.created[0].element
    expect(el.innerHTML).toContain('#B45309')

    act(() => { el.dispatchEvent(new MouseEvent('mouseenter')) })
    expect(glPopup.setLngLat).toHaveBeenCalledWith([2.332, 48.854])
    expect(glPopup.setHTML).toHaveBeenCalledWith(expect.stringContaining('Café de Flore'))
    expect(glPopup.addTo).toHaveBeenCalledWith(glMap)

    vi.mocked(glPopup.remove).mockClear()
    act(() => { el.dispatchEvent(new MouseEvent('mouseleave')) })
    expect(glPopup.remove).toHaveBeenCalled()

    act(() => { el.dispatchEvent(new MouseEvent('click')) })
    expect(onPoiClick).toHaveBeenCalledWith(basePoi)

    // An unknown category falls back to the neutral grey pin without an icon.
    expect(glMarkers.created[1].element.innerHTML).toContain('#6b7280')
  })

  it('FE-COMP-MAPVIEWGL-043: plugin markers render as tone dots with a text-only popup', async () => {
    loadOnAttach()
    const markers: PluginMapMarker[] = [
      { pluginId: 'ev', id: 'm1', lat: 48.5, lng: 2.5, tone: 'success', label: 'Fastned', popupText: '150 kW', url: 'https://example.com/c' },
      { pluginId: 'ev', id: 'm2', lat: 48.6, lng: 2.6, tone: 'default' },
    ]
    server.use(
      http.get('/api/map-markers/:tripId', () => HttpResponse.json({ markers })),
      http.get('/api/map-layers/:tripId', () => HttpResponse.json({ layers: [] })),
    )

    render(<MapViewGL places={[]} fitKey={1} tripId={4} />)
    await waitFor(() => expect(glMarkers.created).toHaveLength(2))

    expect(glMarkers.created[0].element.innerHTML).toContain('#10b981')
    act(() => { glMarkers.created[0].element.dispatchEvent(new MouseEvent('click')) })
    const box = vi.mocked(glPopup.setDOMContent).mock.calls[0][0]
    expect(box.textContent).toContain('Fastned')
    expect(box.textContent).toContain('150 kW')
    expect(box.querySelector('a')?.getAttribute('href')).toBe('https://example.com/c')

    // A bare marker carries no popup at all.
    vi.mocked(glPopup.setDOMContent).mockClear()
    act(() => { glMarkers.created[1].element.dispatchEvent(new MouseEvent('click')) })
    expect(glPopup.setDOMContent).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-044: plugin layer features become one geojson source with closed rings', async () => {
    loadOnAttach()
    const features: PluginMapLayerFeature[] = [
      { type: 'polyline', points: [[48, 2], [49, 3]], tone: 'warn', width: 4, dash: 'dash', opacity: 0.6, fill: false },
      { type: 'polygon', points: [[48, 2], [48, 3], [49, 3]], tone: 'danger', width: 2, dash: 'solid', opacity: 0.8, fill: true },
      { type: 'circle', center: [48, 2], radiusM: 1000, tone: 'nonsense' as PluginMapLayerFeature['tone'], width: 2, dash: 'dot', opacity: 0.4, fill: false },
      { type: 'polyline', tone: 'default', width: 2, dash: 'solid', opacity: 1, fill: false },
    ]
    const layers: PluginMapLayer[] = [{ pluginId: 'ev', id: 'corridor', features }]
    server.use(
      http.get('/api/map-markers/:tripId', () => HttpResponse.json({ markers: [] })),
      http.get('/api/map-layers/:tripId', () => HttpResponse.json({ layers })),
    )
    const pluginSource = geoSource()

    render(<MapViewGL places={[]} fitKey={1} tripId={4} />)
    glMap.getSource.mockImplementation((id: string) => (id === 'trek-plugin-layers' ? pluginSource : null))
    await waitFor(() => expect(lastData(pluginSource).features).toHaveLength(3))

    const [line, polygon, circle] = lastData(pluginSource).features
    expect(line.geometry).toEqual({ type: 'LineString', coordinates: [[2, 48], [3, 49]] })
    expect(line.properties).toMatchObject({ id: 'ev:corridor:0', color: '#f59e0b', dash: 'dash', fillOpacity: 0 })

    const ring = polygon.geometry.coordinates[0] as unknown as number[][]
    expect(ring[0]).toEqual(ring[ring.length - 1])
    // A filled shape never drowns the basemap.
    expect(polygon.properties.fillOpacity).toBe(0.25)

    // A metric circle is approximated as a polygon, since GL circles size in pixels.
    const circleRing = circle.geometry.coordinates[0] as unknown as number[][]
    expect(circleRing).toHaveLength(65)
    expect(circleRing[0][0]).toBeCloseTo(2 + 1000 / (111320 * Math.cos(48 * Math.PI / 180)), 4)
    // Unknown tones fall back to the default indigo.
    expect(circle.properties.color).toBe('#4F46E5')
  })

  it('FE-COMP-MAPVIEWGL-045: failing plugin contributions leave the core map untouched', async () => {
    loadOnAttach()
    server.use(
      http.get('/api/map-markers/:tripId', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
      http.get('/api/map-layers/:tripId', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    )
    const pluginSource = geoSource()

    const { rerender } = render(<MapViewGL places={[]} fitKey={1} tripId={4} />)
    glMap.getSource.mockImplementation((id: string) => (id === 'trek-plugin-layers' ? pluginSource : null))
    await act(async () => {})
    expect(glMarkers.created).toHaveLength(0)

    // Dropping the trip clears whatever was there.
    rerender(<MapViewGL places={[]} fitKey={1} />)
    await act(async () => {})
    expect(lastData(pluginSource).features).toHaveLength(0)
  })

  it('FE-COMP-MAPVIEWGL-046: plugin route via points show their label and dwell time on tap', async () => {
    loadOnAttach()
    const routeVias: RouteVia[] = [
      { lat: 48.5, lng: 2.5, tone: 'success', label: 'Fastned', dwellSeconds: 4500 },
      { lat: 48.6, lng: 2.6, tone: 'warn', dwellSeconds: 900 },
      { lat: 48.7, lng: 2.7, tone: 'default' },
    ]

    render(<MapViewGL places={[]} fitKey={1} routeVias={routeVias} />)
    await act(async () => {})
    expect(glMarkers.created).toHaveLength(3)

    act(() => { glMarkers.created[0].element.dispatchEvent(new MouseEvent('click')) })
    expect(glPopup.setText).toHaveBeenCalledWith('Fastned · 1 h 15 min')

    act(() => { glMarkers.created[1].element.dispatchEvent(new MouseEvent('click')) })
    expect(glPopup.setText).toHaveBeenLastCalledWith('15 min')

    // Neither label nor dwell time: nothing to show, so the dot stays inert.
    act(() => { glMarkers.created[2].element.dispatchEvent(new MouseEvent('click')) })
    expect(glPopup.setText).toHaveBeenCalledTimes(2)
  })

  it('FE-COMP-MAPVIEWGL-047: only the unclustered leaves of the cluster source get a rich marker (#1385)', async () => {
    loadOnAttach()
    const clusterSource = geoSource()
    glMap.getSource.mockImplementation((id: string) => (id === 'trip-place-clusters' ? clusterSource : null))
    glMap.querySourceFeatures.mockReturnValue([
      { properties: { placeId: 61 } },
      { properties: { placeId: '62' } },   // vector-tile encoders hand ids back as strings
      { properties: { placeId: 62 } },     // …and can repeat them
      { properties: { placeId: 999 } },    // no longer in the trip
      { properties: { placeId: 'nope' } },
      { properties: {} },
    ])
    const places = [
      buildMapPlace({ id: 61, lat: 48.1, lng: 2.1 }),
      buildMapPlace({ id: 62, lat: 48.2, lng: 2.2 }),
      buildMapPlace({ id: 63, lat: 48.3, lng: 2.3 }),
    ]

    render(<MapViewGL places={places} fitKey={1} />)
    await flushFrames()

    const source = lastData(clusterSource)
    expect(source.features).toHaveLength(3)
    expect(source.features[0].properties.placeId).toBe(61)
    expect(source.features[0].geometry.coordinates).toEqual([2.1, 48.1])

    const drawn = glMarkers.created.map(m => m.lngLat)
    expect(drawn).toContainEqual([2.1, 48.1])
    expect(drawn).toContainEqual([2.2, 48.2])
    // 63 is inside a cluster bubble, so no HTML marker is drawn for it.
    expect(drawn).not.toContainEqual([2.3, 48.3])
  })

  it('FE-COMP-MAPVIEWGL-048: the day route becomes one LineString per drawn segment', async () => {
    const routeSource = geoSource()
    glMap.getSource.mockImplementation((id: string) => (id === 'trip-route' ? routeSource : null))

    render(<MapViewGL places={[]} fitKey={1} route={[[[48, 2], [49, 3]], [[50, 4]]]} />)
    await act(async () => {})

    const { features } = lastData(routeSource)
    // A one-point segment is not a line.
    expect(features).toHaveLength(1)
    expect(features[0].geometry.coordinates).toEqual([[2, 48], [3, 49]])
  })

  it('FE-COMP-MAPVIEWGL-049: unusable GPX geometry is skipped instead of breaking the layer', async () => {
    const gpxSource = geoSource()
    glMap.getSource.mockImplementation((id: string) => (id === 'trip-gpx' ? gpxSource : null))
    const places = [
      buildMapPlace({ id: 71, lat: 48, lng: 2, route_geometry: null }),
      buildMapPlace({ id: 72, lat: 48, lng: 2, route_geometry: '[[48,2]]' }),
      buildMapPlace({ id: 73, lat: 48, lng: 2, route_geometry: 'not json at all' }),
      buildMapPlace({ id: 74, lat: 48, lng: 2, route_geometry: '[[48,2],[49,3]]' }),
    ]

    render(<MapViewGL places={places} fitKey={1} />)
    await act(async () => {})

    const { features } = lastData(gpxSource)
    expect(features).toHaveLength(1)
    expect(features[0].properties.place_id).toBe(74)
  })

  it('FE-COMP-MAPVIEWGL-050: without a Mapbox token it shows the settings hint and touches no camera', async () => {
    const mapboxgl = (await import('mapbox-gl')).default
    useSettingsStore.setState({
      settings: { ...useSettingsStore.getState().settings, mapbox_access_token: '' },
    } as any)
    const places = [buildMapPlace({ id: 81, lat: 48, lng: 2 })]

    const { container, rerender } = render(<MapViewGL places={places} fitKey={1} center={[1, 2]} />)
    await act(async () => {})
    expect(container.textContent).toContain('No Mapbox access token configured')
    expect(container.textContent).toContain('Settings → Map → Mapbox GL')
    expect(mapboxgl.Map).not.toHaveBeenCalled()

    rerender(<MapViewGL places={places} fitKey={2} center={[10, 20]} />)
    await act(async () => {})
    expect(glMap.fitBounds).not.toHaveBeenCalled()
    expect(glMap.jumpTo).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-051: a later centre prop change jumps the camera in [lng, lat] order', async () => {
    const { rerender } = render(<MapViewGL places={[]} fitKey={1} center={[48, 2]} zoom={9} />)
    await act(async () => {})
    expect(glMap.jumpTo).not.toHaveBeenCalled()

    rerender(<MapViewGL places={[]} fitKey={1} center={[35.68, 139.69]} zoom={9} />)
    await act(async () => {})
    expect(glMap.jumpTo).toHaveBeenCalledWith({ center: [139.69, 35.68], zoom: 9 })
  })

  it('FE-COMP-MAPVIEWGL-052: a fit that throws before the style is ready is retried on load', async () => {
    const places = [
      buildMapPlace({ id: 82, lat: 48.1, lng: 2.1 }),
      buildMapPlace({ id: 83, lat: 48.2, lng: 2.2 }),
    ]
    const { rerender } = render(<MapViewGL places={places} fitKey={1} />)
    await act(async () => {})

    glMap.fitBounds.mockImplementationOnce(() => { throw new Error('style not ready') })
    rerender(<MapViewGL places={places} fitKey={2} />)
    await act(async () => {})
    expect(glMap.fitBounds).toHaveBeenCalledTimes(1)

    const retry = glMap.once.mock.calls.find(c => c[0] === 'load')?.[1] as () => void
    expect(retry).toBeTypeOf('function')
    act(() => { retry() })
    expect(glMap.fitBounds).toHaveBeenCalledTimes(2)
  })

  it('FE-COMP-MAPVIEWGL-053: on a phone it shows the location FAB, uses mobile padding and hides the hover card', async () => {
    loadOnAttach()
    const original = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 420 })
    try {
      const places = [
        buildMapPlace({ id: 84, lat: 48.1, lng: 2.1 }),
        buildMapPlace({ id: 85, lat: 48.2, lng: 2.2 }),
      ]
      const { rerender, getByRole, queryByTestId } = render(<MapViewGL places={places} fitKey={1} hasDayDetail />)
      await act(async () => {})
      expect(getByRole('button', { name: 'Show my location' })).toBeTruthy()

      act(() => { glMarkers.created[0].element.dispatchEvent(new MouseEvent('mouseenter', { clientX: 5, clientY: 5 })) })
      expect(queryByTestId('tooltip')).toBeNull()

      rerender(<MapViewGL places={places} fitKey={2} hasDayDetail />)
      await act(async () => {})
      const fitOptions = glMap.fitBounds.mock.calls[0][1] as { padding: Record<string, number> }
      expect(fitOptions.padding).toEqual({ top: 40, right: 20, bottom: 40, left: 20 })
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: original })
    }
  })

  it('FE-COMP-MAPVIEWGL-054: desktop padding leaves room for the side panels and the inspector', async () => {
    const places = [
      buildMapPlace({ id: 86, lat: 48.1, lng: 2.1 }),
      buildMapPlace({ id: 87, lat: 48.2, lng: 2.2 }),
    ]
    const { rerender } = render(<MapViewGL places={places} fitKey={1} leftWidth={300} rightWidth={360} hasInspector />)
    await act(async () => {})

    rerender(<MapViewGL places={places} fitKey={2} leftWidth={300} rightWidth={360} hasInspector />)
    await act(async () => {})
    const fitOptions = glMap.fitBounds.mock.calls[0][1] as { padding: Record<string, number>; maxZoom: number }
    expect(fitOptions.padding).toEqual({ top: 60, right: 400, bottom: 320, left: 340 })
    expect(fitOptions.maxZoom).toBe(15)
  })

  it('FE-COMP-MAPVIEWGL-055: cached thumbs paint the marker while a custom upload is never re-fetched (#1136)', async () => {
    loadOnAttach()
    const thumbListeners: Record<string, (thumb: string) => void> = {}
    vi.mocked(photoService.getCached).mockImplementation((key: string) => (
      key === 'gp-1'
        ? ({ thumbDataUrl: 'data:image/png;base64,AAA' } as unknown as ReturnType<typeof photoService.getCached>)
        : undefined
    ))
    vi.mocked(photoService.onThumbReady).mockImplementation((key: string, fn: (thumb: string) => void) => {
      thumbListeners[key] = fn
      return () => {}
    })
    const places = [
      buildMapPlace({ id: 91, lat: 48.1, lng: 2.1, google_place_id: 'gp-1' }),
      buildMapPlace({ id: 92, lat: 48.2, lng: 2.2, osm_id: 'osm-2', name: 'Bar' }),
      buildMapPlace({ id: 93, lat: 48.3, lng: 2.3, image_url: '/uploads/places/own.jpg' }),
    ]

    render(<MapViewGL places={places} fitKey={1} />)
    await flushFrames()

    // Only the place without a cached photo and without a custom image is fetched.
    expect(photoService.fetchPhoto).toHaveBeenCalledTimes(1)
    expect(photoService.fetchPhoto).toHaveBeenCalledWith('osm-2', 'osm-2', 48.2, 2.2, 'Bar')

    const srcs = () => glMarkers.created.map(m => m.element.querySelector('img')?.getAttribute('src'))
    expect(srcs()).toContain('data:image/png;base64,AAA')
    expect(srcs()).toContain('/uploads/places/own.jpg')

    await act(async () => {
      thumbListeners['osm-2']?.('data:image/png;base64,BBB')
      await new Promise(resolve => setTimeout(resolve, 40))
    })
    expect(srcs()).toContain('data:image/png;base64,BBB')
  })

  it('FE-COMP-MAPVIEWGL-056: an in-flight photo is not requested twice and the proxy url is used as the id', async () => {
    vi.mocked(photoService.isLoading).mockImplementation((key: string) => key === 'osm-loading')
    const places = [
      buildMapPlace({ id: 94, lat: 48.4, lng: 2.4, osm_id: 'osm-loading' }),
      buildMapPlace({ id: 95, lat: 48.5, lng: 2.5, osm_id: 'osm-5', image_url: '/api/maps/place-photo/abc', name: 'Museum' }),
    ]

    render(<MapViewGL places={places} fitKey={1} />)
    await act(async () => {})

    expect(photoService.fetchPhoto).toHaveBeenCalledTimes(1)
    expect(photoService.fetchPhoto).toHaveBeenCalledWith('osm-5', '/api/maps/place-photo/abc', 48.5, 2.5, 'Museum')
  })

  it('FE-COMP-MAPVIEWGL-066: a place with neither provider id nor coordinates has no cache key and is skipped', async () => {
    render(<MapViewGL places={[
      buildMapPlace({ id: 98, lat: null, lng: null, image_url: 'https://example.com/a.jpg' }),
      buildMapPlace({ id: 99, lat: null, lng: null, image_url: 'https://example.com/b.jpg' }),
    ]} fitKey={1} />)
    await act(async () => {})

    expect(photoService.fetchPhoto).not.toHaveBeenCalled()
    expect(photoService.onThumbReady).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-057: no photos are fetched when place photos are switched off', async () => {
    useAuthStore.setState({ placesPhotosEnabled: false })

    render(<MapViewGL places={[buildMapPlace({ id: 96, lat: 48, lng: 2, osm_id: 'osm-6' })]} fitKey={1} />)
    await act(async () => {})

    expect(photoService.fetchPhoto).not.toHaveBeenCalled()
    expect(photoService.onThumbReady).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-058: unmounting unsubscribes the thumb listeners and drops the map', async () => {
    const dispose = vi.fn()
    const thumbListeners: Record<string, (thumb: string) => void> = {}
    vi.mocked(photoService.onThumbReady).mockImplementation((key: string, fn: (thumb: string) => void) => {
      thumbListeners[key] = fn
      return dispose
    })
    glMap.remove.mockImplementation(() => { throw new Error('context already lost') })

    const { unmount } = render(<MapViewGL places={[buildMapPlace({ id: 97, lat: 48, lng: 2, osm_id: 'osm-7' })]} fitKey={1} />)
    await act(async () => {})
    // A thumb arriving just before unmount leaves a frame scheduled.
    act(() => { thumbListeners['osm-7']?.('data:image/png;base64,CCC') })

    expect(() => unmount()).not.toThrow()
    expect(dispose).toHaveBeenCalled()
    expect(glMap.remove).toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-069: unmounting lets go of the window debug handle', async () => {
    const { unmount } = render(<MapViewGL places={[]} fitKey={1} />)
    await act(async () => {})
    expect((window as any).__trek_map).toBe(glMap)
    unmount()
    // Otherwise every style switch keeps its torn-down map reachable from window.
    expect((window as any).__trek_map).toBeUndefined()
  })

  it('FE-COMP-MAPVIEWGL-059: pan and zoom report the visible bbox for the POI explore pill', async () => {
    const onViewportChange = vi.fn()
    render(<MapViewGL places={[]} fitKey={1} onViewportChange={onViewportChange} />)
    await act(async () => {})

    act(() => { mapHandler('moveend')() })
    expect(onViewportChange).toHaveBeenCalledWith({ south: 0, west: 0, north: 1, east: 1 })
  })

  it('FE-COMP-MAPVIEWGL-060: a new POI or via set replaces the previous overlay markers', async () => {
    loadOnAttach()
    const poi: Poi = {
      osm_id: 'n1', name: 'Café', lat: 48.85, lng: 2.33, category: 'cafe', poi_type: 'cafe',
      address: null, website: null, phone: null, opening_hours: null, cuisine: null, source: 'openstreetmap',
    }
    const via: RouteVia = { lat: 48.5, lng: 2.5, tone: 'default' }

    const { rerender } = render(<MapViewGL places={[]} fitKey={1} pois={[poi]} routeVias={[via]} />)
    await act(async () => {})
    const first = [...glMarkers.created]
    expect(first).toHaveLength(2)

    rerender(
      <MapViewGL
        places={[]}
        fitKey={1}
        pois={[{ ...poi, osm_id: 'n2', lat: 48.9 }]}
        routeVias={[{ ...via, lat: 48.6 }]}
      />,
    )
    await act(async () => {})
    first.forEach(marker => expect(vi.mocked(marker.remove)).toHaveBeenCalled())
    expect(glMarkers.created.length).toBeGreaterThan(first.length)
  })

  it('FE-COMP-MAPVIEWGL-061: plugin markers are torn down when the trip loses them', async () => {
    loadOnAttach()
    server.use(
      http.get('/api/map-markers/:tripId', ({ params }) => HttpResponse.json({
        markers: params.tripId === '4'
          ? [{ pluginId: 'ev', id: 'm1', lat: 48.5, lng: 2.5, tone: 'default' } as PluginMapMarker]
          : [],
      })),
      http.get('/api/map-layers/:tripId', () => HttpResponse.json({ layers: [] })),
    )

    const { rerender } = render(<MapViewGL places={[]} fitKey={1} tripId={4} />)
    await waitFor(() => expect(glMarkers.created).toHaveLength(1))
    const stale = glMarkers.created[0]

    rerender(<MapViewGL places={[]} fitKey={1} tripId={5} />)
    await waitFor(() => expect(vi.mocked(stale.remove)).toHaveBeenCalled())
  })

  it('FE-COMP-MAPVIEWGL-062: selecting a day-only place flies there; one without coordinates does not', async () => {
    const dayPlace = buildMapPlace({ id: 101, lat: 35.68, lng: 139.69 })
    const broken = buildMapPlace({ id: 102, lat: null, lng: null })

    const { rerender } = render(
      <MapViewGL places={[broken]} dayPlaces={[dayPlace]} fitKey={1} selectedPlaceId={null} />,
    )
    await act(async () => {})

    rerender(<MapViewGL places={[broken]} dayPlaces={[dayPlace]} fitKey={1} selectedPlaceId={101} />)
    await act(async () => {})
    expect(glMap.flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: [139.69, 35.68], zoom: 14 }))

    glMap.flyTo.mockClear()
    rerender(<MapViewGL places={[broken]} dayPlaces={[dayPlace]} fitKey={1} selectedPlaceId={102} />)
    await act(async () => {})
    expect(glMap.flyTo).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-063: tracking without a fix yet does not attach the blue dot', async () => {
    geoStub.mode = 'show'
    geoStub.position = null

    render(<MapViewGL places={[]} fitKey={1} />)
    await act(async () => {})

    expect(locationMarker.update).not.toHaveBeenCalled()
  })

  it('FE-COMP-MAPVIEWGL-064: the overlay gets the endpoint callback already at construction time', async () => {
    loadOnAttach()
    const onReservationClick = vi.fn()
    render(<MapViewGL places={[]} fitKey={1} reservations={[]} onReservationClick={onReservationClick} />)
    await act(async () => {})

    const ctorOptions = vi.mocked(ReservationMapboxOverlay).mock.calls[0][1] as unknown as {
      showEndpointLabels: boolean
      onEndpointClick: (id: number) => void
    }
    expect(ctorOptions.showEndpointLabels).toBe(false)
    ctorOptions.onEndpointClick(42)
    expect(onReservationClick).toHaveBeenCalledWith(42)
  })

  it('FE-COMP-MAPVIEWGL-065: unmounting mid-reconcile cancels the scheduled frame and detaches the listeners', async () => {
    loadOnAttach()
    const clusterSource = geoSource()
    glMap.getSource.mockImplementation((id: string) => (id === 'trip-place-clusters' ? clusterSource : null))

    const { unmount } = render(<MapViewGL places={[buildMapPlace({ id: 111, lat: 48, lng: 2 })]} fitKey={1} />)
    unmount()
    await flushFrames()

    expect(glMap.off).toHaveBeenCalledWith('moveend', expect.any(Function))
    expect(glMap.off).toHaveBeenCalledWith('zoomend', expect.any(Function))
  })
})
