// FE-COMP-LOCMARKERGL-001 to FE-COMP-LOCMARKERGL-016
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { attachLocationMarker } from './locationMarkerMapbox'
import type { GeoPosition } from '../../hooks/useGeolocation'

const SOURCE_ID = 'trek-location-accuracy'

type FeatureCollection = {
  type: 'FeatureCollection'
  features: { geometry: { type: string; coordinates: number[][][] } }[]
}

// Minimal mapbox-gl stand-in: sources/layers live in plain maps so the tests can
// assert what the handle added and removed, and `loaded` is switchable to drive
// the "map not ready yet" branch.
function fakeMap({ loaded = true }: { loaded?: boolean } = {}) {
  const sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>()
  const layers = new Map<string, unknown>()
  const once = vi.fn()
  return {
    _sources: sources,
    _layers: layers,
    once,
    loaded: () => loaded,
    getSource: (id: string) => sources.get(id),
    addSource: vi.fn((id: string) => { sources.set(id, { setData: vi.fn() }) }),
    addLayer: vi.fn((layer: { id: string }) => { layers.set(layer.id, layer) }),
    getLayer: (id: string) => layers.get(id),
    removeLayer: vi.fn((id: string) => { layers.delete(id) }),
    removeSource: vi.fn((id: string) => { sources.delete(id) }),
    // Fires the handler the marker registered for the given event.
    fire: (event: string) => {
      const call = once.mock.calls.find(c => c[0] === event)
      ;(call?.[1] as (() => void) | undefined)?.()
    },
  }
}

type FakeMarker = {
  setLngLat: ReturnType<typeof vi.fn>
  addTo: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
  getElement: () => HTMLElement
  _el: HTMLElement
}

let markers: FakeMarker[] = []

// A marker that mirrors mapbox's DOM contract: addTo appends the element (so
// `getElement().parentElement` becomes truthy), remove detaches it again.
const FakeMarkerCtor = vi.fn(function (options?: { element?: HTMLElement }) {
  const el = options?.element ?? document.createElement('div')
  const marker: FakeMarker = {
    _el: el,
    setLngLat: vi.fn(() => marker),
    addTo: vi.fn(() => { document.body.appendChild(el); return marker }),
    remove: vi.fn(() => { el.remove() }),
    getElement: () => el,
  }
  markers.push(marker)
  return marker
}) as unknown as new (options?: { element?: HTMLElement; anchor?: string }) => unknown

function position(over: Partial<GeoPosition> = {}): GeoPosition {
  return { lat: 48.2, lng: 16.37, accuracy: 20, heading: null, speed: null, timestamp: 1 , ...over } as GeoPosition
}

function lastData(map: ReturnType<typeof fakeMap>): FeatureCollection | undefined {
  const src = map._sources.get(SOURCE_ID)
  const calls = src?.setData.mock.calls ?? []
  return calls[calls.length - 1]?.[0] as FeatureCollection | undefined
}

function attach(map: ReturnType<typeof fakeMap>) {
  return attachLocationMarker(map as never, FakeMarkerCtor as never)
}

beforeEach(() => {
  markers = []
  vi.clearAllMocks()
  document.getElementById('trek-location-style')?.remove()
  document.body.innerHTML = ''
})

describe('attachLocationMarker', () => {
  it('FE-COMP-LOCMARKERGL-001: injects the pulse keyframes exactly once per document', () => {
    attach(fakeMap())
    attach(fakeMap())
    const styles = document.querySelectorAll('#trek-location-style')
    expect(styles).toHaveLength(1)
    expect(styles[0].textContent).toContain('@keyframes trek-location-pulse')
  })

  it('FE-COMP-LOCMARKERGL-002: builds a marker element with a pulse, a heading cone and a dot', () => {
    attach(fakeMap())
    const root = markers[0]._el
    expect(root.children).toHaveLength(3)
    // The cone starts hidden — there is no heading until the first fix.
    expect((root.children[1] as HTMLElement).style.display).toBe('none')
  })

  it('FE-COMP-LOCMARKERGL-003: adds the accuracy source and fill layer when the map is already loaded', () => {
    const map = fakeMap({ loaded: true })
    attach(map)
    expect(map.addSource).toHaveBeenCalledWith(SOURCE_ID, expect.objectContaining({ type: 'geojson' }))
    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: SOURCE_ID, type: 'fill' }))
  })

  it('FE-COMP-LOCMARKERGL-004: defers the layer to the load event when the map is not ready', () => {
    const map = fakeMap({ loaded: false })
    attach(map)
    expect(map.addSource).not.toHaveBeenCalled()
    expect(map.once).toHaveBeenCalledWith('load', expect.any(Function))

    map.fire('load')
    expect(map.addSource).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-LOCMARKERGL-005: does not re-add the layer when the source already exists', () => {
    const map = fakeMap({ loaded: true })
    attach(map)
    map.addSource.mockClear()
    map.addLayer.mockClear()
    // A second marker on the same map (e.g. a remount) must reuse the source.
    attach(map)
    expect(map.addSource).not.toHaveBeenCalled()
    expect(map.addLayer).not.toHaveBeenCalled()
  })

  it('FE-COMP-LOCMARKERGL-006: swallows an addSource failure instead of breaking the map', () => {
    const map = fakeMap({ loaded: true })
    map.addSource.mockImplementation(() => { throw new Error('style not loaded') })
    expect(() => attach(map)).not.toThrow()
    expect(map.addLayer).not.toHaveBeenCalled()
  })

  it('FE-COMP-LOCMARKERGL-007: the first update positions the marker and adds it to the map', () => {
    const map = fakeMap()
    attach(map).update(position({ lat: 10, lng: 20 }))
    expect(markers[0].setLngLat).toHaveBeenCalledWith([20, 10])
    expect(markers[0].addTo).toHaveBeenCalledWith(map)
  })

  it('FE-COMP-LOCMARKERGL-008: a follow-up update moves the marker without re-adding it', () => {
    const handle = attach(fakeMap())
    handle.update(position())
    handle.update(position({ lat: 11, lng: 21 }))
    expect(markers[0].addTo).toHaveBeenCalledTimes(1)
    expect(markers[0].setLngLat).toHaveBeenLastCalledWith([21, 11])
  })

  it('FE-COMP-LOCMARKERGL-009: a heading shows the cone and rotates it', () => {
    const handle = attach(fakeMap())
    handle.update(position({ heading: 135 }))
    const cone = markers[0]._el.children[1] as HTMLElement
    expect(cone.style.display).toBe('block')
    expect(cone.style.transform).toContain('rotate(135deg)')
  })

  it('FE-COMP-LOCMARKERGL-010: a null or NaN heading hides the cone again', () => {
    const handle = attach(fakeMap())
    const cone = markers[0]._el.children[1] as HTMLElement
    handle.update(position({ heading: 90 }))
    expect(cone.style.display).toBe('block')

    handle.update(position({ heading: null }))
    expect(cone.style.display).toBe('none')

    handle.update(position({ heading: 90 }))
    handle.update(position({ heading: NaN }))
    expect(cone.style.display).toBe('none')
  })

  it('FE-COMP-LOCMARKERGL-011: an accuracy radius becomes a 48-segment geodesic ring', () => {
    const map = fakeMap()
    attach(map).update(position({ lat: 48, lng: 16, accuracy: 100 }))
    const data = lastData(map)!
    expect(data.features).toHaveLength(1)
    const ring = data.features[0].geometry.coordinates[0]
    // 48 segments produces 49 points, with the ring closed back on itself.
    expect(ring).toHaveLength(49)
    expect(ring[0][0]).toBeCloseTo(ring[48][0], 9)
    expect(ring[0][1]).toBeCloseTo(ring[48][1], 9)
    // 100 m at this latitude is well under a hundredth of a degree from the fix.
    ring.forEach(([lng, lat]) => {
      expect(Math.abs(lat - 48)).toBeLessThan(0.01)
      expect(Math.abs(lng - 16)).toBeLessThan(0.01)
    })
  })

  it('FE-COMP-LOCMARKERGL-012: a sub-metre or missing accuracy clears the ring', () => {
    const map = fakeMap()
    const handle = attach(map)
    handle.update(position({ accuracy: 0.5 }))
    expect(lastData(map)!.features).toHaveLength(0)

    handle.update(position({ accuracy: 0 }))
    expect(lastData(map)!.features).toHaveLength(0)
  })

  it('FE-COMP-LOCMARKERGL-013: update(null) removes the marker and empties the accuracy ring', () => {
    const map = fakeMap()
    const handle = attach(map)
    handle.update(position({ accuracy: 80 }))
    expect(lastData(map)!.features).toHaveLength(1)

    handle.update(null)
    expect(markers[0].remove).toHaveBeenCalled()
    expect(lastData(map)!.features).toHaveLength(0)
  })

  it('FE-COMP-LOCMARKERGL-014: an update before the source exists does not throw', () => {
    const map = fakeMap({ loaded: false })
    const handle = attach(map)
    expect(() => handle.update(position({ accuracy: 50 }))).not.toThrow()
    expect(() => handle.update(null)).not.toThrow()
    expect(markers[0].setLngLat).toHaveBeenCalled()
  })

  it('FE-COMP-LOCMARKERGL-015: destroy removes the marker, the layer and the source', () => {
    const map = fakeMap()
    const handle = attach(map)
    handle.update(position())
    handle.destroy()
    expect(markers[0].remove).toHaveBeenCalled()
    expect(map.removeLayer).toHaveBeenCalledWith(SOURCE_ID)
    expect(map.removeSource).toHaveBeenCalledWith(SOURCE_ID)
  })

  it('FE-COMP-LOCMARKERGL-016: destroy survives a torn-down map and a throwing marker', () => {
    const map = fakeMap()
    const handle = attach(map)
    markers[0].remove.mockImplementation(() => { throw new Error('marker gone') })
    map.removeLayer.mockImplementation(() => { throw new Error('style gone') })
    expect(() => handle.destroy()).not.toThrow()
    // The source removal is in the same try block, so it never ran.
    expect(map.removeSource).not.toHaveBeenCalled()
  })
})
