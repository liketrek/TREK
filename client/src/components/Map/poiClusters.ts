import type { Poi } from './poiCategories'

export const POI_CLUSTER_RADIUS = 48
export const POI_CLUSTER_MAX_ZOOM = 8
export const POI_CLUSTER_DETAIL_ZOOM = 18
export interface PoiCluster { pois: Poi[]; lat: number; lng: number }

export function clusterPois(pois: Poi[], project: (poi: Poi) => { x: number; y: number }, zoom = 0): PoiCluster[] {
  const groups: (PoiCluster & { x: number; y: number })[] = []
  const cells = new Map<string, number[]>()
  const unique = new Map(pois.map(poi => [poi.osm_id, poi]))
  if (zoom > POI_CLUSTER_MAX_ZOOM) return [...unique.values()].map(poi => ({ pois: [poi], lat: poi.lat, lng: poi.lng }))
  for (const poi of [...unique.values()].sort((a, b) => a.osm_id.localeCompare(b.osm_id))) {
    const point = project(poi)
    const cx = Math.floor(point.x / POI_CLUSTER_RADIUS), cy = Math.floor(point.y / POI_CLUSTER_RADIUS)
    let closest: typeof groups[number] | undefined
    let distance = POI_CLUSTER_RADIUS
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
      for (const index of cells.get(`${x},${y}`) ?? []) {
        const group = groups[index]
        const gap = Math.hypot(point.x - group.x, point.y - group.y)
        if (gap < distance) { closest = group; distance = gap }
      }
    }
    if (closest) closest.pois.push(poi)
    else {
      const key = `${cx},${cy}`
      const indices = cells.get(key) ?? []
      indices.push(groups.length)
      cells.set(key, indices)
      groups.push({ pois: [poi], lat: poi.lat, lng: poi.lng, ...point })
    }
  }
  return groups.map(group => ({
    pois: group.pois,
    lat: group.pois.reduce((sum, poi) => sum + poi.lat, 0) / group.pois.length,
    lng: group.lng + group.pois.reduce((sum, poi) => sum + ((poi.lng - group.lng + 540) % 360 - 180), 0) / group.pois.length,
  }))
}

export function poiClusterMarkup(count: number): string {
  return `<span data-poi-cluster="${count}" style="box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:3px solid var(--bg-card);background:var(--accent);color:var(--accent-text);box-shadow:var(--shadow-md);font-family:var(--font-system);font-size:calc(13px * var(--fs-scale-caption,1));font-weight:600;cursor:pointer;">${count}</span>`
}

export function poiClusterList(pois: Poi[], select: (poi: Poi) => void): HTMLElement {
  const list = document.createElement('div')
  list.className = 'flex max-h-64 flex-col gap-1 overflow-y-auto p-1'
  for (const poi of pois) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'rounded-lg px-3 py-2 text-start text-caption font-medium text-content hover:bg-surface-hover focus-visible:bg-surface-hover'
    button.textContent = poi.name
    button.addEventListener('click', event => { event.stopPropagation(); select(poi) })
    list.append(button)
  }
  return list
}
