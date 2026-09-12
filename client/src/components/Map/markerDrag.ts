/**
 * Dragging a place off the map onto a day in the itinerary (#891).
 *
 * The drop half of this already existed: every day, every row and every gap
 * between rows in the day plan reads a `placeId` and calls onAssignToDay with
 * the position it was dropped at. All that was missing was a second place to
 * pick a place UP from — until now the only one was the row in the places
 * sidebar. This makes a map marker behave exactly like that row.
 *
 * `window.__dragData` is set alongside dataTransfer on purpose, and is not
 * belt-and-braces: browsers hide dataTransfer's contents during `dragover`, so
 * a drop target that wants to know what is coming while it hovers has no other
 * way to look. The day plan reads both (getDragData), and this mirrors what
 * PlacesSidebarRow already does so the two sources are indistinguishable to it.
 *
 * Both renderers get the same treatment through this one helper: Leaflet builds
 * its markers from divIcon HTML and the GL renderers from createElement, but
 * both end up as a real DOM node, which is all HTML5 drag needs.
 */

/** Wire a marker element up as a drag source for `placeId`. */
export function makeMarkerDraggable(el: HTMLElement, placeId: number): () => void {
  el.setAttribute('draggable', 'true')

  const onDragStart = (e: DragEvent) => {
    e.dataTransfer?.setData('placeId', String(placeId))
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
    window.__dragData = { placeId: String(placeId) }
    el.classList.add('marker-dragging')
  }
  const onDragEnd = () => {
    window.__dragData = null
    el.classList.remove('marker-dragging')
  }
  // The map pans on mousedown anywhere on its surface, and a marker sits on that
  // surface. Without this the map slides away under the pointer while the drag
  // is starting, which makes the day plan an impossible target to reach.
  const onMouseDown = (e: MouseEvent) => e.stopPropagation()

  el.addEventListener('dragstart', onDragStart)
  el.addEventListener('dragend', onDragEnd)
  el.addEventListener('mousedown', onMouseDown)

  return () => {
    el.removeAttribute('draggable')
    el.removeEventListener('dragstart', onDragStart)
    el.removeEventListener('dragend', onDragEnd)
    el.removeEventListener('mousedown', onMouseDown)
  }
}

/**
 * Wire a corridor hit up as a drag source, so it can be dropped onto the drive.
 *
 * The same HTML5 drag as `makeMarkerDraggable`, with the OSM id as payload instead of a
 * place id — a corridor hit is not a place yet. The drop target is the map itself rather
 * than the drawn line: a route polyline is a real element only in Leaflet (the GL
 * renderers draw it into the canvas), and the drop coordinate answers "where on the drive"
 * just as well once it is projected onto the routed geometry.
 */
export function makePoiDraggable(el: HTMLElement, osmId: string): () => void {
  el.setAttribute('draggable', 'true')

  const onDragStart = (e: DragEvent) => {
    e.dataTransfer?.setData('poiOsmId', osmId)
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
    window.__dragData = { poiOsmId: osmId }
    el.classList.add('marker-dragging')
    document.body.classList.add('dragging-poi')
  }
  const onDragEnd = () => {
    window.__dragData = null
    el.classList.remove('marker-dragging')
    document.body.classList.remove('dragging-poi')
  }
  // Same reason as above: without this the map pans out from under the pointer as the
  // drag begins, and the route is impossible to aim at.
  const onMouseDown = (e: MouseEvent) => e.stopPropagation()

  el.addEventListener('dragstart', onDragStart)
  el.addEventListener('dragend', onDragEnd)
  el.addEventListener('mousedown', onMouseDown)

  return () => {
    el.removeAttribute('draggable')
    el.removeEventListener('dragstart', onDragStart)
    el.removeEventListener('dragend', onDragEnd)
    el.removeEventListener('mousedown', onMouseDown)
  }
}

/** The OSM id being dragged, when a corridor hit is in flight. */
export function draggedPoiId(e: DragEvent): string | null {
  const fromTransfer = e.dataTransfer?.getData('poiOsmId')
  if (fromTransfer) return fromTransfer
  // dataTransfer is unreadable during dragover, so the window mirror answers instead.
  return window.__dragData?.poiOsmId ?? null
}
