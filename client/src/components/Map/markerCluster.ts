import L from 'leaflet'

/**
 * The cluster group the planner and the public share page both draw places with,
 * so a shared link clusters a trip the way the planner does (#2343).
 */
export const CLUSTER_OPTIONS = {
  chunkedLoading: true,
  chunkInterval: 30,
  chunkDelay: 0,
  // Pixels at the current zoom, so ordinary stops still come apart by zooming in.
  maxClusterRadius: 20,
  disableClusteringAtZoom: 9,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  animate: false,
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
