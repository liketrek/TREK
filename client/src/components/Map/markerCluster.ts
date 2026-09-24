import L from 'leaflet'
import { STACK_RADIUS_PX } from './coincidentPlaces'

/** Up to here the map is an overview, where stops merge to keep the world readable. */
export const CLUSTER_UNTIL_ZOOM = 9
/** The overview radius, in pixels at the current zoom. */
export const CLUSTER_RADIUS_PX = 20

/**
 * The cluster group the planner and the public share page both draw places with,
 * so a shared link clusters a trip the way the planner does (#2343).
 */
export const CLUSTER_OPTIONS = {
  chunkedLoading: true,
  chunkInterval: 30,
  chunkDelay: 0,
  /**
   * Pixels at the current zoom, so ordinary stops still come apart by zooming in.
   * From the day zooms upwards only the width of a pin counts: stops sharing one
   * coordinate cannot be separated by any zoom, and a cluster is the only thing
   * that can fan them apart again. There is deliberately no `disableClusteringAtZoom`
   * here — it redefines the group's own maximum zoom, which is what the spiderfy
   * branch is measured against.
   *
   * A whole pin's third is affordable precisely because the fold is reversible here:
   * what comes out of it is a counted bubble the user can click open. The GL renderer
   * has no fan to offer and folds far tighter — see `COINCIDENT_RADIUS_PX`.
   */
  maxClusterRadius: (zoom: number) => (zoom < CLUSTER_UNTIL_ZOOM ? CLUSTER_RADIUS_PX : STACK_RADIUS_PX),
  spiderfyOnMaxZoom: true,
  // The default legs put four 36px pins barely a pin apart and six of them back on
  // top of each other, which is the stack the fan is there to undo.
  spiderfyDistanceMultiplier: 1.6,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  animate: false,
}

/** The part of a cluster group that `revealInCluster` reads. */
export interface ClusterGroupLike {
  getVisibleParent?: (marker: unknown) => unknown
}

/**
 * Fan open the bubble a stop is hidden inside, if it is in one.
 *
 * Picking a stop from the places rail used to raise its pin out of the stack with a
 * z-index. A stop sharing its coordinates now sits in a cluster instead and has no pin
 * of its own to raise, so the bubble has to open for the selection to be visible at all.
 * Deliberately not `zoomToShowLayer`: the zoom belongs to the day fit, and the selection
 * only ever pans.
 */
export function revealInCluster(group: ClusterGroupLike | null | undefined, marker: unknown): boolean {
  if (!group || !marker || typeof group.getVisibleParent !== 'function') return false
  const parent = group.getVisibleParent(marker) as { spiderfy?: () => void } | null
  if (!parent || parent === marker || typeof parent.spiderfy !== 'function') return false
  parent.spiderfy()
  return true
}

/** The part of a Leaflet cluster this factory reads. */
export interface ClusterLike {
  getChildCount: () => number
}

/** A count bubble sized by its count, styled by `.marker-cluster-custom` in index.css. */
export function createClusterIcon(cluster: ClusterLike) {
  const count = cluster.getChildCount()
  const size = count < 10 ? 36 : count < 50 ? 42 : 48
  return L.divIcon({
    html: `<div class="marker-cluster-custom" style="width:${size}px;height:${size}px;"><span>${count}</span></div>`,
    className: 'marker-cluster-wrapper',
    iconSize: L.point(size, size),
  })
}
