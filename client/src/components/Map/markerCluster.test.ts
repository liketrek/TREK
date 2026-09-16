/**
 * What the shared cluster options do to stops that share a coordinate (#2344).
 *
 * Nothing is mocked: the behaviour under test is leaflet.markercluster's own. The
 * library's single answer to markers no zoom can separate is to fan them out on click,
 * and whether that can fire at all is decided entirely by this option block — which is
 * why the block is worth a test of its own rather than a snapshot in a component suite.
 */
import { describe, it, expect, afterEach } from 'vitest'
import L from 'leaflet'
import 'leaflet.markercluster'
import { CLUSTER_OPTIONS, CLUSTER_RADIUS_PX, CLUSTER_UNTIL_ZOOM, revealInCluster } from './markerCluster'
import { COINCIDENT_RADIUS_PX, STACK_RADIUS_PX } from './coincidentPlaces'
import { MAP_MAX_ZOOM } from '../../constants/mapDefaults'

/**
 * `leaflet.markercluster` ships no types and we do not depend on
 * `@types/leaflet.markercluster`, so the factory and the two internals these tests read
 * back are named here rather than pulling a package in.
 */
type Group = L.Layer & {
  _maxZoom: number
  addLayers: (layers: L.Marker[]) => Group
  getVisibleParent: (marker: L.Marker) => L.Layer | null
}
const markerClusterGroup = (L as unknown as { markerClusterGroup: (options: unknown) => Group }).markerClusterGroup

const containers: HTMLElement[] = []

function mapAt(zoom: number, maxZoom = MAP_MAX_ZOOM): L.Map {
  const el = document.createElement('div')
  Object.defineProperty(el, 'clientWidth', { value: 800 })
  Object.defineProperty(el, 'clientHeight', { value: 600 })
  document.body.appendChild(el)
  containers.push(el)
  return L.map(el, { center: [48.8584, 2.2945], zoom, maxZoom })
}

/** A group already on the map, holding a marker per coordinate. */
function stopsOn(map: L.Map, coords: [number, number][]) {
  const group = markerClusterGroup(CLUSTER_OPTIONS)
  group.addTo(map)
  const markers = coords.map(coord => L.marker(coord))
  group.addLayers(markers)
  return { group, markers }
}

const HOTEL: [number, number] = [48.8584, 2.2945]
// ~300 m east: two ordinary neighbouring stops in a city day plan.
const NEARBY: [number, number] = [48.8584, 2.2986]

afterEach(() => { for (const el of containers.splice(0)) el.remove() })

describe('the shared cluster options', () => {
  it('MARKERCLUSTER-001: cluster by the overview radius in the overview, by a pin width above it', () => {
    const radius = CLUSTER_OPTIONS.maxClusterRadius
    expect(radius(0)).toBe(CLUSTER_RADIUS_PX)
    expect(radius(CLUSTER_UNTIL_ZOOM - 1)).toBe(CLUSTER_RADIUS_PX)
    expect(radius(CLUSTER_UNTIL_ZOOM)).toBe(STACK_RADIUS_PX)
    expect(radius(MAP_MAX_ZOOM)).toBe(STACK_RADIUS_PX)
    // Wider than what the GL renderer folds at, and meant to stay wider: a bubble here
    // hands the stops in it back on a click, where a folded GL pin is simply gone.
    expect(STACK_RADIUS_PX).toBeGreaterThan(COINCIDENT_RADIUS_PX)
  })

  it('MARKERCLUSTER-002: carry no clustering cutoff at all, not even an undefined one', () => {
    // The library guards on `!== null`, so the key spelled with `undefined` gives the
    // group a NaN maximum zoom, builds no grid at all and throws on the first marker.
    expect('disableClusteringAtZoom' in CLUSTER_OPTIONS).toBe(false)
  })

  it('MARKERCLUSTER-003: take their maximum zoom from the map, which is what makes the fan reachable', () => {
    expect(stopsOn(mapAt(14), []).group._maxZoom).toBe(MAP_MAX_ZOOM)
  })

  it('MARKERCLUSTER-004: follow a mount site that lowers its own ceiling, silently', () => {
    // Nothing throws and nothing warns: a map mounted with a lower ceiling simply moves
    // the zoom at which a stack can still be fanned open.
    expect(stopsOn(mapAt(14, 15), []).group._maxZoom).toBe(15)
  })

  it('MARKERCLUSTER-005: keep stops on one coordinate in a bubble at a day zoom, and fan them open', () => {
    const map = mapAt(16)
    const { group, markers } = stopsOn(map, [HOTEL, HOTEL, HOTEL])
    const bubble = group.getVisibleParent(markers[0])
    expect(bubble).not.toBe(markers[0])
    expect(group.getVisibleParent(markers[2])).toBe(bubble)

    expect(revealInCluster(group, markers[0])).toBe(true)
    const spread = markers.map(marker => `${marker.getLatLng().lat},${marker.getLatLng().lng}`)
    expect(new Set(spread).size).toBe(3)
  })

  it('MARKERCLUSTER-006: leave neighbouring stops alone at a day zoom, as they are today', () => {
    const map = mapAt(16)
    const { group, markers } = stopsOn(map, [HOTEL, NEARBY])
    expect(group.getVisibleParent(markers[0])).toBe(markers[0])
    expect(group.getVisibleParent(markers[1])).toBe(markers[1])
  })

  it('MARKERCLUSTER-007: still merge those same stops in the overview the radius was tuned for', () => {
    const map = mapAt(5)
    const { group, markers } = stopsOn(map, [HOTEL, NEARBY])
    expect(group.getVisibleParent(markers[0])).not.toBe(markers[0])
    expect(group.getVisibleParent(markers[0])).toBe(group.getVisibleParent(markers[1]))
  })
})

describe('reaching a stop inside a bubble', () => {
  it('MARKERCLUSTER-008: does nothing when there is no group, no marker or no bubble to open', () => {
    expect(revealInCluster(null, {})).toBe(false)
    expect(revealInCluster({ getVisibleParent: () => null }, null)).toBe(false)
    expect(revealInCluster({}, {})).toBe(false)
    expect(revealInCluster({ getVisibleParent: () => null }, {})).toBe(false)
    const marker = {}
    // A stop with a pin of its own is its own visible parent: nothing to fan.
    expect(revealInCluster({ getVisibleParent: () => marker }, marker)).toBe(false)
    // And a parent from a group that cannot spiderfy is left alone rather than called.
    expect(revealInCluster({ getVisibleParent: () => ({}) }, {})).toBe(false)
  })
})
