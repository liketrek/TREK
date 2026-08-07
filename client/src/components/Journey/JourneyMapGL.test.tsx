// FE-COMP-JMAPGL-001 to FE-COMP-JMAPGL-026

type Spy = ReturnType<typeof vi.fn>

interface MarkerStub {
  element: HTMLElement
  lngLat: [number, number]
  setLngLat: Spy
  addTo: Spy
  remove: Spy
  getElement: Spy
  getLngLat: Spy
}

interface PopupStub {
  options: Record<string, unknown>
  element: HTMLElement
  setLngLat: Spy
  setHTML: Spy
  setOffset: Spy
  getElement: Spy
  addTo: Spy
  remove: Spy
}

interface BoundsStub {
  points: [number, number][]
  extend: Spy
  getCenter: Spy
}

const gl = vi.hoisted(() => {
  const map = {
    on: vi.fn(),
    remove: vi.fn(),
    resize: vi.fn(),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    getZoom: vi.fn(() => 10),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: vi.fn((): unknown => null),
    setTerrain: vi.fn(),
    setConfigProperty: vi.fn(),
  }
  const markers: MarkerStub[] = []
  const popups: PopupStub[] = []
  const boundsList: BoundsStub[] = []

  function createMarker(options: { element?: HTMLElement }): MarkerStub {
    const marker: MarkerStub = {
      element: options?.element ?? document.createElement('div'),
      lngLat: [0, 0],
      setLngLat: vi.fn((ll: [number, number]) => { marker.lngLat = ll; return marker }),
      addTo: vi.fn(() => marker),
      remove: vi.fn(),
      getElement: vi.fn(() => marker.element),
      getLngLat: vi.fn(() => marker.lngLat),
    }
    markers.push(marker)
    return marker
  }

  function createPopup(options: Record<string, unknown>): PopupStub {
    const popup: PopupStub = {
      options: options ?? {},
      element: document.createElement('div'),
      setLngLat: vi.fn(() => popup),
      setHTML: vi.fn(() => popup),
      setOffset: vi.fn(() => popup),
      getElement: vi.fn(() => popup.element),
      addTo: vi.fn(() => popup),
      remove: vi.fn(),
    }
    popups.push(popup)
    return popup
  }

  function createBounds(): BoundsStub {
    const bounds: BoundsStub = {
      points: [],
      extend: vi.fn((p: [number, number]) => { bounds.points.push(p); return bounds }),
      getCenter: vi.fn(() => ({ lng: 5, lat: 45 })),
    }
    boundsList.push(bounds)
    return bounds
  }

  return { map, markers, popups, boundsList, createMarker, createPopup, createBounds }
})

const glModule = vi.hoisted(() => () => ({
  default: {
    accessToken: '',
    Map: vi.fn(function () { return gl.map }),
    Marker: vi.fn(function (options: { element?: HTMLElement }) { return gl.createMarker(options) }),
    Popup: vi.fn(function (options: Record<string, unknown>) { return gl.createPopup(options) }),
    LngLatBounds: vi.fn(function () { return gl.createBounds() }),
  },
}))

vi.mock('mapbox-gl', glModule)
vi.mock('maplibre-gl', glModule)
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}))

vi.mock('../Map/mapboxSetup', () => ({
  isStandardFamily: vi.fn(() => false),
  supportsCustom3d: vi.fn(() => false),
  wantsTerrain: vi.fn(() => false),
  addCustom3dBuildings: vi.fn(),
  addTerrainAndSky: vi.fn(),
}))

import React from 'react'
import mapboxgl from 'mapbox-gl'
import maplibregl from 'maplibre-gl'
import { render, screen, act } from '../../../tests/helpers/render'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import { isStandardFamily, supportsCustom3d, wantsTerrain, addCustom3dBuildings, addTerrainAndSky } from '../Map/mapboxSetup'
import JourneyMapGLWithEngine from './JourneyMapGL'
import type { JourneyMapGLHandle } from './JourneyMapGL'

// The engine is a prop now, not a module import — that is what keeps mapbox-gl and
// maplibre-gl in separate chunks. This shim preserves the suite's existing call
// shape and makes the same choice glLazy.tsx makes in production, so the vi.mock
// factories below still stand in for the right SDK.
const JourneyMapGL = React.forwardRef(function JourneyMapGLShim(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: any
) {
  return (
    <JourneyMapGLWithEngine
      ref={ref}
      {...props}
      gl={props.glProvider === 'maplibre-gl' ? maplibregl : mapboxgl}
    />
  )
})

const entries = [
  { id: 'e1', lat: 48.8566, lng: 2.3522, title: 'Louvre', location_name: 'Paris, France', entry_date: '2025-06-01', dayColor: '#ff0055', dayLabel: 2 },
  { id: 'e2', lat: 52.52, lng: 13.405, title: 'Museumsinsel', location_name: 'Berlin, Germany', entry_date: '2025-06-02' },
]

const singleEntry = [entries[0]]

function withToken(extra: Record<string, unknown> = {}) {
  seedStore(useSettingsStore, {
    settings: { ...useSettingsStore.getState().settings, mapbox_access_token: 'pk.test_token', ...extra },
  })
}

function mapOptions(): Record<string, unknown> {
  const call = vi.mocked(mapboxgl.Map).mock.calls[0]
  return call[0] as unknown as Record<string, unknown>
}

function popupHtml(index = 0): string {
  return String(gl.popups[index].setHTML.mock.calls[0][0])
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  gl.markers.length = 0
  gl.popups.length = 0
  gl.boundsList.length = 0
  gl.map.on.mockImplementation((event: string, handler: () => void) => {
    if (event === 'load') handler()
    return gl.map
  })
  gl.map.getZoom.mockReturnValue(10)
  gl.map.getSource.mockReturnValue(null)
  vi.mocked(isStandardFamily).mockReturnValue(false)
  vi.mocked(supportsCustom3d).mockReturnValue(false)
  vi.mocked(wantsTerrain).mockReturnValue(false)
  document.getElementById('trek-journey-popup-style')?.remove()
})

describe('JourneyMapGL', () => {
  it('FE-COMP-JMAPGL-001: mapbox without a token shows the settings hint instead of a map', () => {
    render(<JourneyMapGL checkins={[]} entries={entries} />)
    expect(screen.getByText(/No Mapbox access token configured/)).toBeInTheDocument()
    expect(screen.getByText('Settings → Map → Mapbox GL')).toBeInTheDocument()
    expect(mapboxgl.Map).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-002: a configured token builds the map and is handed to the sdk', () => {
    withToken()
    render(<JourneyMapGL checkins={[]} entries={entries} />)
    expect(mapboxgl.accessToken).toBe('pk.test_token')
    expect(mapboxgl.Map).toHaveBeenCalledTimes(1)
    expect(mapOptions()).toMatchObject({ style: 'mapbox://styles/mapbox/standard', attributionControl: true })
  })

  it('FE-COMP-JMAPGL-003: maplibre needs no token and opts out of the around-center rotate', () => {
    render(<JourneyMapGL checkins={[]} entries={entries} glProvider="maplibre-gl" />)
    expect(maplibregl.Map).toHaveBeenCalledTimes(1)
    const options = vi.mocked(maplibregl.Map).mock.calls[0][0] as unknown as Record<string, unknown>
    expect(options.aroundCenter).toBe(false)
    // projection is a mapbox-only option
    expect(options).not.toHaveProperty('projection')
  })

  it('FE-COMP-JMAPGL-004: quality mode turns on the globe projection and antialiasing', () => {
    withToken({ mapbox_quality_mode: true })
    render(<JourneyMapGL checkins={[]} entries={entries} />)
    expect(mapOptions()).toMatchObject({ projection: 'globe', antialias: true })
  })

  it('FE-COMP-JMAPGL-005: entries become bottom-anchored pins carrying their day colour and label', () => {
    withToken()
    render(<JourneyMapGL checkins={[]} entries={entries} />)

    expect(gl.markers).toHaveLength(2)
    expect(vi.mocked(mapboxgl.Marker).mock.calls[0][0]).toMatchObject({ anchor: 'bottom' })
    expect(gl.markers[0].setLngLat).toHaveBeenCalledWith([2.3522, 48.8566])
    const svg = gl.markers[0].element.innerHTML
    expect(svg).toContain('#ff0055')
    expect(svg).toContain('>2<')
    // the second entry has no explicit day meta and falls back to the neutral defaults
    expect(gl.markers[1].element.innerHTML).toContain('#52525B')
    expect(gl.markers[1].element.innerHTML).toContain('>1<')
  })

  it('FE-COMP-JMAPGL-006: entries without coordinates never reach the map', () => {
    withToken()
    render(
      <JourneyMapGL
        checkins={[]}
        entries={[{ id: 'nope', lat: 0, lng: 0, title: 'Null Island', entry_date: '2025-06-01' }]}
      />,
    )
    expect(gl.markers).toHaveLength(0)
    expect(gl.map.fitBounds).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-007: two or more entries add the dashed route source and layer', () => {
    withToken()
    render(<JourneyMapGL checkins={[]} entries={entries} />)

    expect(gl.map.addSource).toHaveBeenCalledWith('journey-route', expect.objectContaining({ type: 'geojson' }))
    const source = vi.mocked(gl.map.addSource).mock.calls[0][1] as { data: { geometry: { coordinates: number[][] } } }
    expect(source.data.geometry.coordinates).toEqual([[2.3522, 48.8566], [13.405, 52.52]])
    expect(gl.map.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'journey-route-line',
      source: 'journey-route',
    }))
  })

  it('FE-COMP-JMAPGL-008: an existing route source is updated instead of re-added', () => {
    withToken()
    const setData = vi.fn()
    gl.map.getSource.mockReturnValue({ setData })

    render(<JourneyMapGL checkins={[]} entries={entries} />)

    expect(gl.map.addSource).not.toHaveBeenCalled()
    expect(setData).toHaveBeenCalledWith(expect.objectContaining({ type: 'Feature' }))
  })

  it('FE-COMP-JMAPGL-009: a single entry draws no route line', () => {
    withToken()
    render(<JourneyMapGL checkins={[]} entries={singleEntry} />)
    expect(gl.map.addSource).not.toHaveBeenCalled()
    expect(gl.map.addLayer).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-010: the camera fits entries and trail with the requested bottom padding', () => {
    withToken()
    render(
      <JourneyMapGL
        checkins={[]}
        entries={entries}
        trail={[{ lat: 50, lng: 8 }]}
        paddingBottom={200}
        fullScreen
      />,
    )

    expect(gl.boundsList[0].points).toEqual([[2.3522, 48.8566], [13.405, 52.52], [8, 50]])
    expect(gl.map.fitBounds).toHaveBeenCalledWith(gl.boundsList[0], expect.objectContaining({
      padding: { top: 50, bottom: 200, left: 50, right: 50 },
      maxZoom: 16,
      pitch: 45,
      duration: 0,
    }))
    // fullScreen + 3D also tilts the opening camera
    expect(mapOptions()).toMatchObject({ pitch: 45, center: { lng: 5, lat: 45 }, zoom: 2 })
  })

  it('FE-COMP-JMAPGL-011: with nothing to show the map opens on the world view', () => {
    withToken()
    render(<JourneyMapGL checkins={[]} entries={[]} />)
    expect(mapOptions()).toMatchObject({ center: [0, 30], zoom: 1 })
    expect(gl.map.fitBounds).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-012: clicking a pin reports the entry id and stops the map from handling it', () => {
    withToken()
    const onMarkerClick = vi.fn()
    render(<JourneyMapGL checkins={[]} entries={entries} onMarkerClick={onMarkerClick} />)

    const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
    const stopPropagation = vi.spyOn(ev, 'stopPropagation')
    act(() => { gl.markers[1].element.dispatchEvent(ev) })

    expect(onMarkerClick).toHaveBeenCalledWith('e2')
    expect(stopPropagation).toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-013: highlightMarker enlarges the pin and opens a two-line popup', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)

    act(() => { ref.current!.highlightMarker('e1') })

    const inner = gl.markers[0].element.querySelector('.trek-journey-marker-inner') as HTMLElement
    expect(inner.style.transform).toBe('scale(1.2)')
    expect(gl.markers[0].element.style.zIndex).toBe('1000')

    expect(gl.popups).toHaveLength(1)
    expect(gl.popups[0].setLngLat).toHaveBeenCalledWith([2.3522, 48.8566])
    expect(gl.popups[0].addTo).toHaveBeenCalledWith(gl.map)
    const html = popupHtml()
    expect(html).toContain('>Louvre<')
    expect(html).toContain('trek-journey-popup-place')
    expect(html).toContain('trek-journey-popup-sep')
  })

  it('FE-COMP-JMAPGL-014: the popup falls back to the location name when the entry has no title', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(
      <JourneyMapGL
        ref={ref}
        checkins={[]}
        entries={[{ id: 'e1', lat: 1, lng: 2, title: null, location_name: 'Reykjavík', entry_date: '2025-06-01' }]}
      />,
    )

    act(() => { ref.current!.highlightMarker('e1') })

    const html = popupHtml()
    expect(html).toContain('>Reykjavík<')
    // the location moved to the title line, so there is no place chip left below
    expect(html).not.toContain('trek-journey-popup-place')
    expect(html).not.toContain('trek-journey-popup-sep')
  })

  it('FE-COMP-JMAPGL-015: an entry with neither title nor place still gets a heading', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(
      <JourneyMapGL
        ref={ref}
        checkins={[]}
        entries={[{ id: 'e1', lat: 1, lng: 2, entry_date: '' }]}
      />,
    )

    act(() => { ref.current!.highlightMarker('e1') })

    const html = popupHtml()
    expect(html).toContain('>Entry<')
    // empty entry_date yields no subline at all
    expect(html).not.toContain('trek-journey-popup-sub')
  })

  it('FE-COMP-JMAPGL-016: an unparseable entry date is passed through verbatim', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(
      <JourneyMapGL
        ref={ref}
        checkins={[]}
        entries={[{ id: 'e1', lat: 1, lng: 2, title: 'Somewhere', entry_date: 'sometime' }]}
      />,
    )

    act(() => { ref.current!.highlightMarker('e1') })
    expect(popupHtml()).toContain('>sometime<')
  })

  it('FE-COMP-JMAPGL-017: popup text is html-escaped', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(
      <JourneyMapGL
        ref={ref}
        checkins={[]}
        entries={[{ id: 'e1', lat: 1, lng: 2, title: '<img src=x onerror="alert(1)">', location_name: "Tom & Jerry's", entry_date: '2025-06-01' }]}
      />,
    )

    act(() => { ref.current!.highlightMarker('e1') })

    const html = popupHtml()
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    expect(html).toContain('Tom &amp; Jerry&#39;s')
  })

  it('FE-COMP-JMAPGL-018: highlighting a second pin reuses the popup and resets the first pin', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} dark />)

    act(() => { ref.current!.highlightMarker('e1') })
    act(() => { ref.current!.highlightMarker('e2') })

    // only one popup instance is ever constructed
    expect(gl.popups).toHaveLength(1)
    expect(gl.popups[0].setLngLat).toHaveBeenCalledWith([13.405, 52.52])
    expect(gl.popups[0].setOffset).toHaveBeenCalledWith([0, -46])
    expect(gl.popups[0].element.classList.contains('trek-dark')).toBe(true)

    const firstInner = gl.markers[0].element.querySelector('.trek-journey-marker-inner') as HTMLElement
    expect(firstInner.style.transform).toBe('scale(1)')
    expect(gl.markers[0].element.style.zIndex).toBe('0')
  })

  it('FE-COMP-JMAPGL-019: dark mode tags the popup class on creation', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} dark />)
    act(() => { ref.current!.highlightMarker('e1') })
    expect(gl.popups[0].options.className).toBe('trek-journey-popup trek-dark')
  })

  it('FE-COMP-JMAPGL-020: highlightMarker(null) closes the popup', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)
    act(() => { ref.current!.highlightMarker('e1') })
    act(() => { ref.current!.highlightMarker(null) })
    expect(gl.popups[0].remove).toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-021: highlighting an unknown id changes nothing', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)
    act(() => { ref.current!.highlightMarker('ghost') })
    expect(gl.popups).toHaveLength(0)
    expect(gl.markers[0].element.style.zIndex).toBe('')
  })

  it('FE-COMP-JMAPGL-022: the popup stylesheet is injected exactly once', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)
    act(() => { ref.current!.highlightMarker('e1') })
    act(() => { ref.current!.highlightMarker('e2') })
    expect(document.querySelectorAll('#trek-journey-popup-style')).toHaveLength(1)
  })

  it('FE-COMP-JMAPGL-023: focusMarker flies in with the 3D pitch and a zoom floor of 14', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)

    act(() => { ref.current!.focusMarker('e2') })

    expect(gl.map.flyTo).toHaveBeenCalledWith({
      center: [13.405, 52.52],
      zoom: 14,
      pitch: 45,
      duration: 600,
    })
  })

  it('FE-COMP-JMAPGL-024: with 3D disabled the camera stays flat', () => {
    withToken({ mapbox_3d_enabled: false })
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)

    act(() => { ref.current!.focusMarker('e1') })

    expect(gl.map.flyTo).toHaveBeenCalledWith(expect.objectContaining({ pitch: 0 }))
    expect(addCustom3dBuildings).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-025: focusMarker swallows sdk errors while the map is not ready', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)
    gl.map.getZoom.mockImplementationOnce(() => { throw new Error('not ready') })

    expect(() => act(() => { ref.current!.focusMarker('e1') })).not.toThrow()
    expect(gl.map.flyTo).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-026: focusMarker on an unknown id is a no-op', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)
    act(() => { ref.current!.focusMarker('ghost') })
    expect(gl.map.flyTo).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-027: invalidateSize resizes the gl canvas', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)
    act(() => { ref.current!.invalidateSize() })
    expect(gl.map.resize).toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-028: the activeMarkerId prop highlights and flies after the settle delay', () => {
    vi.useFakeTimers()
    try {
      withToken()
      render(<JourneyMapGL checkins={[]} entries={entries} activeMarkerId="e2" />)
      expect(gl.map.flyTo).not.toHaveBeenCalled()

      act(() => { vi.advanceTimersByTime(60) })

      expect(gl.popups).toHaveLength(1)
      expect(gl.map.flyTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [13.405, 52.52],
        zoom: 12,
        duration: 500,
      }))
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-JMAPGL-029: an activeMarkerId with no pin leaves the camera alone', () => {
    vi.useFakeTimers()
    try {
      withToken()
      render(<JourneyMapGL checkins={[]} entries={entries} activeMarkerId="ghost" />)
      act(() => { vi.advanceTimersByTime(60) })
      expect(gl.map.flyTo).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-COMP-JMAPGL-030: 3D styles get terrain, sky and custom buildings on load', () => {
    withToken({ mapbox_style: 'mapbox://styles/mapbox/outdoors-v12' })
    vi.mocked(wantsTerrain).mockReturnValue(true)
    vi.mocked(supportsCustom3d).mockReturnValue(true)

    render(<JourneyMapGL checkins={[]} entries={entries} dark />)

    expect(addTerrainAndSky).toHaveBeenCalledWith(gl.map)
    expect(addCustom3dBuildings).toHaveBeenCalledWith(gl.map, true)
    // only the Standard style needs its built-in DEM flattened
    expect(gl.map.setTerrain).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-031: the Standard basemap is flattened and pinned to the ui language', () => {
    withToken({ language: 'gr' })
    vi.mocked(isStandardFamily).mockReturnValue(true)

    render(<JourneyMapGL checkins={[]} entries={entries} />)

    expect(gl.map.setTerrain).toHaveBeenCalledWith(null)
    expect(gl.map.setConfigProperty).toHaveBeenCalledWith('basemap', 'language', 'el')
    expect(addTerrainAndSky).not.toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-031b: switching the ui language repins the labels without rebuilding the map', () => {
    withToken({ language: 'gr' })
    vi.mocked(isStandardFamily).mockReturnValue(true)

    render(<JourneyMapGL checkins={[]} entries={entries} />)
    const builds = vi.mocked(mapboxgl.Map).mock.calls.length
    gl.map.setConfigProperty.mockClear()

    act(() => { withToken({ language: 'fr' }) })

    expect(gl.map.setConfigProperty).toHaveBeenCalledWith('basemap', 'language', 'fr')
    expect(vi.mocked(mapboxgl.Map).mock.calls).toHaveLength(builds)
  })

  it('FE-COMP-JMAPGL-032: sdk failures while configuring the basemap do not break the load', () => {
    withToken()
    vi.mocked(isStandardFamily).mockReturnValue(true)
    gl.map.setTerrain.mockImplementationOnce(() => { throw new Error('no terrain') })
    gl.map.setConfigProperty.mockImplementationOnce(() => { throw new Error('unsupported') })

    expect(() => render(<JourneyMapGL checkins={[]} entries={entries} />)).not.toThrow()
    expect(gl.markers).toHaveLength(2)
  })

  it('FE-COMP-JMAPGL-033: an empty bounds fit is swallowed', () => {
    withToken()
    gl.map.fitBounds.mockImplementationOnce(() => { throw new Error('empty bounds') })
    expect(() => render(<JourneyMapGL checkins={[]} entries={entries} />)).not.toThrow()
  })

  it('FE-COMP-JMAPGL-034: unmounting removes the pins, the popup and the map', () => {
    withToken()
    const ref = React.createRef<JourneyMapGLHandle>()
    const { unmount } = render(<JourneyMapGL ref={ref} checkins={[]} entries={entries} />)
    act(() => { ref.current!.highlightMarker('e1') })

    unmount()

    expect(gl.markers[0].remove).toHaveBeenCalled()
    expect(gl.markers[1].remove).toHaveBeenCalled()
    expect(gl.popups[0].remove).toHaveBeenCalled()
    expect(gl.map.remove).toHaveBeenCalled()
  })

  it('FE-COMP-JMAPGL-035: height 9999 stretches the wrapper to its container', () => {
    withToken()
    const { container } = render(<JourneyMapGL checkins={[]} entries={entries} height={9999} />)
    expect((container.firstChild as HTMLElement).style.height).toBe('100%')
  })

  it('FE-COMP-JMAPGL-036: the token placeholder honours the height prop', () => {
    const { container } = render(<JourneyMapGL checkins={[]} entries={entries} height={9999} />)
    expect((container.firstChild as HTMLElement).style.height).toBe('100%')
  })
})
