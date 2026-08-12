import React from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render } from '../../../tests/helpers/render'
import { act } from '@testing-library/react'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildPlace } from '../../../tests/helpers/factories'
import { useSettingsStore } from '../../store/settingsStore'
import maplibregl from 'maplibre-gl'
import { DEFAULT_MAP_ZOOM } from '../../constants/mapDefaults'

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

vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(function () {
      return glMap
    }),
    Marker: vi.fn(function () {
      return {
        setLngLat: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
        getElement: vi.fn(() => document.createElement('div')),
      }
    }),
    LngLatBounds: vi.fn(function () {
      return glBounds.create()
    }),
    NavigationControl: vi.fn(),
    Popup: vi.fn(function () {
      return {
        setLngLat: vi.fn().mockReturnThis(),
        setHTML: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
      }
    }),
  },
}))
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(function () {
      return glMap
    }),
    Marker: vi.fn(function () {
      return {
        setLngLat: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
        getElement: vi.fn(() => document.createElement('div')),
      }
    }),
    LngLatBounds: vi.fn(function () {
      return glBounds.create()
    }),
    NavigationControl: vi.fn(),
    Popup: vi.fn(function () {
      return {
        setLngLat: vi.fn().mockReturnThis(),
        setHTML: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn(),
      }
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

vi.mock('./locationMarkerMapbox', () => ({
  attachLocationMarker: vi.fn(() => ({ update: vi.fn() })),
}))

vi.mock('./reservationsMapbox', () => ({
  ReservationMapboxOverlay: vi.fn(function () {
    return { update: vi.fn(), destroy: vi.fn() }
  }),
}))

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(() => ({
    position: null,
    mode: 'off',
    error: null,
    cycleMode: vi.fn(),
    setMode: vi.fn(),
  })),
}))

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
  getAllThumbs: vi.fn(() => ({})),
}))

import { MapViewGL } from './MapViewGL'

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
})
