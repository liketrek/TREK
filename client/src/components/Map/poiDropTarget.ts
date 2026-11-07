// A corridor hit dropped anywhere on the map, for every renderer.
//
// The map takes the drop, not the drawn route: in a GL renderer the line lives in the
// canvas and has no element to aim at, and the coordinate under the pointer says just
// as much once the caller projects it onto the routed geometry. The point goes out on
// the real world, whichever world copy it was dropped on (#2976).

import { onRealWorld } from '../../utils/worldCopy';
import { draggedPoiId } from './markerDrag';

/** Where a point of the container lies, in the renderer's own coordinates. */
type PointAt = (x: number, y: number) => { lat: number; lng: number };

/** Listens for POI drops on `container` and reports each one; returns the cleanup. */
export function bindPoiDropTarget(
  container: HTMLElement,
  pointAt: PointAt,
  onPoiDropOnRoute: (osmId: string, lat: number, lng: number) => void
): () => void {
  const onDragOver = (e: DragEvent) => {
    if (!draggedPoiId(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };
  const onDrop = (e: DragEvent) => {
    const osmId = draggedPoiId(e);
    if (!osmId) return;
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const at = onRealWorld(pointAt(e.clientX - rect.left, e.clientY - rect.top));
    onPoiDropOnRoute(osmId, at.lat, at.lng);
  };
  container.addEventListener('dragover', onDragOver);
  container.addEventListener('drop', onDrop);
  return () => {
    container.removeEventListener('dragover', onDragOver);
    container.removeEventListener('drop', onDrop);
  };
}
