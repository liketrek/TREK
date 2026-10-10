/** A photo that knows where it was taken (#1614). */
export interface MapPhoto {
  id: string
  lat: number
  lng: number
  thumbUrl: string
}

/**
 * Grid clustering in screen space, shared by the Leaflet and the GL journey map.
 *
 * The Journey maps have never had clustering, and the library the planner uses
 * hangs off react-leaflet while these maps drive their engines directly.
 * Bucketing by rounded pixel position is a few lines, is deterministic, and is
 * enough for the job: photos of one place collapse into one thumbnail with a
 * count, and pulling the map apart separates them again. `project` is the
 * engine's own lat/lng to container-pixel conversion.
 */
export const PHOTO_CLUSTER_PX = 64

export function clusterPhotos(
  photos: MapPhoto[],
  project: (lat: number, lng: number) => { x: number; y: number },
): { lat: number; lng: number; members: MapPhoto[] }[] {
  const buckets = new Map<string, MapPhoto[]>()
  for (const photo of photos) {
    const pt = project(photo.lat, photo.lng)
    const key = `${Math.round(pt.x / PHOTO_CLUSTER_PX)}:${Math.round(pt.y / PHOTO_CLUSTER_PX)}`
    const list = buckets.get(key)
    if (list) list.push(photo)
    else buckets.set(key, [photo])
  }
  return [...buckets.values()].map(members => ({
    // Anchor on the first member rather than the centroid: the thumbnail shown is
    // that photo's, so the pin should point where that picture was taken.
    lat: members[0].lat,
    lng: members[0].lng,
    members,
  }))
}

export function photoMarkerHtml(thumbUrl: string, count: number): string {
  const badge = count > 1
    ? `<span style="position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#fff;border:1.5px solid rgba(0,0,0,.12);box-shadow:0 1px 4px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#111827;line-height:1;box-sizing:border-box;">${count}</span>` // theme-lint-disable: map marker chrome, drawn over any basemap
    : ''
  return `<div style="position:relative;width:48px;height:48px;border-radius:12px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);background-image:url('${encodeURI(thumbUrl)}');background-size:cover;background-position:center;"></div>${badge}` // theme-lint-disable: map marker chrome, drawn over any basemap
}
