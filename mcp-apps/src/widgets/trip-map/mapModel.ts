/** Web Mercator in world pixels, as raster tile servers cut it: 256 px tiles, 2^zoom of them a side. */
const TILE_SIZE = 256;
const MAX_LAT = 85.05112878;
/** The zoom a lone place opens at: a few streets around it. */
const SINGLE_PLACE_ZOOM = 14;
/** The room left around the outermost places when the view fits them. */
const FIT_PADDING = 32;

export interface MapView {
  zoom: number;
  /** The view's centre, in world pixels at its zoom. */
  cx: number;
  cy: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Where a coordinate falls at a zoom, in world pixels. */
export function project({ lat, lng }: LatLng, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
  const sin = Math.sin((clamped * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/** The deepest zoom up to maxZoom at which every place fits the box, centred on them. */
export function fitView(points: LatLng[], width: number, height: number, maxZoom: number): MapView {
  if (points.length === 0) return { zoom: 1, cx: TILE_SIZE, cy: TILE_SIZE };
  const zoomFor = (zoom: number) => {
    const projected = points.map((p) => project(p, zoom));
    const xs = projected.map((p) => p.x);
    const ys = projected.map((p) => p.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  };
  const top = points.length === 1 ? Math.min(SINGLE_PLACE_ZOOM, maxZoom) : maxZoom;
  for (let zoom = top; zoom > 0; zoom -= 1) {
    const box = zoomFor(zoom);
    const fits = box.maxX - box.minX <= width - 2 * FIT_PADDING && box.maxY - box.minY <= height - 2 * FIT_PADDING;
    if (fits) return { zoom, cx: (box.minX + box.maxX) / 2, cy: (box.minY + box.maxY) / 2 };
  }
  const box = zoomFor(0);
  return { zoom: 0, cx: (box.minX + box.maxX) / 2, cy: (box.minY + box.maxY) / 2 };
}

/** The view one zoom step in or out, about the same centre and within the provider's range. */
export function zoomBy(view: MapView, step: 1 | -1, maxZoom: number): MapView {
  const zoom = Math.max(0, Math.min(maxZoom, view.zoom + step));
  const factor = 2 ** (zoom - view.zoom);
  return { zoom, cx: view.cx * factor, cy: view.cy * factor };
}

export interface VisibleTile {
  key: string;
  url: string;
  left: number;
  top: number;
}

/** The tiles that cover a box of the given size, each with where it goes in the box. Columns wrap around the globe. */
export function visibleTiles(view: MapView, width: number, height: number, template: string): VisibleTile[] {
  const count = 2 ** view.zoom;
  const originX = view.cx - width / 2;
  const originY = view.cy - height / 2;
  const tiles: VisibleTile[] = [];
  for (let ty = Math.floor(originY / TILE_SIZE); ty * TILE_SIZE < originY + height; ty += 1) {
    if (ty < 0 || ty >= count) continue;
    for (let tx = Math.floor(originX / TILE_SIZE); tx * TILE_SIZE < originX + width; tx += 1) {
      const wrapped = ((tx % count) + count) % count;
      tiles.push({
        key: `${view.zoom}/${tx}/${ty}`,
        url: template.replace('{z}', String(view.zoom)).replace('{x}', String(wrapped)).replace('{y}', String(ty)),
        left: tx * TILE_SIZE - originX,
        top: ty * TILE_SIZE - originY,
      });
    }
  }
  return tiles;
}

/** Where a place sits in a box of the given size. */
export function screenPoint(
  point: LatLng,
  view: MapView,
  width: number,
  height: number
): { left: number; top: number } {
  const { x, y } = project(point, view.zoom);
  return { left: x - view.cx + width / 2, top: y - view.cy + height / 2 };
}
