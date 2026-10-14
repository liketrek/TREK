/**
 * Warms the browser cache with every tile a flyover along a route will ask for, so the
 * 3D replay draws from cache instead of loading the landscape in front of the camera.
 */

export interface TileTemplate {
  /** A `{z}/{x}/{y}` URL template; `{s}` subdomains are resolved before this. */
  url: string;
  minzoom: number;
  maxzoom: number;
}

interface LatLng {
  lat: number;
  lng: number;
}

/** How far around the route each zoom reaches, in tiles: wide when coarse, tight when fine. */
const RING_BY_ZOOM: Record<number, number> = { 9: 1, 10: 1, 11: 2, 12: 2, 13: 1, 14: 1, 15: 1 };
const ZOOMS = [9, 10, 11, 12, 13, 14, 15];
const CONCURRENCY = 8;

function tileOf(point: LatLng, z: number): [number, number] {
  const n = 2 ** z;
  const x = Math.floor(((point.lng + 180) / 360) * n);
  const rad = (point.lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
  return [Math.min(n - 1, Math.max(0, x)), Math.min(n - 1, Math.max(0, y))];
}

/** The tiles within `ring` of a centre tile; x wraps round the antimeridian, y stops at the poles. */
function ringAround([cx, cy]: [number, number], ring: number, z: number): Array<[number, number, number]> {
  const n = 2 ** z;
  const tiles: Array<[number, number, number]> = [];
  for (let dx = -ring; dx <= ring; dx++) {
    for (let dy = -ring; dy <= ring; dy++) {
      const y = cy + dy;
      if (y >= 0 && y < n) tiles.push([z, (cx + dx + n) % n, y]);
    }
  }
  return tiles;
}

/** Every tile within the ring of a point on the route, per zoom, without duplicates. */
export function corridorTiles(
  points: readonly LatLng[],
  zooms: readonly number[] = ZOOMS
): Array<[number, number, number]> {
  const seen = new Set<string>();
  const tiles: Array<[number, number, number]> = [];
  for (const z of zooms) {
    const ring = RING_BY_ZOOM[z] ?? 1;
    for (const point of points) {
      for (const tile of ringAround(tileOf(point, z), ring, z)) {
        const key = tile.join('/');
        if (seen.has(key)) continue;
        seen.add(key);
        tiles.push(tile);
      }
    }
  }
  return tiles;
}

export function tileUrls(templates: readonly TileTemplate[], tiles: ReadonlyArray<[number, number, number]>): string[] {
  const urls: string[] = [];
  for (const template of templates) {
    for (const [z, x, y] of tiles) {
      if (z < template.minzoom) continue;
      // Past a source's last zoom the map overzooms the deepest tile, so fetch that one.
      const shift = Math.max(0, z - template.maxzoom);
      const zz = z - shift;
      urls.push(
        template.url
          .replace('{z}', String(zz))
          .replace('{x}', String(x >> shift))
          .replace('{y}', String(y >> shift))
      );
    }
  }
  return [...new Set(urls)];
}

/** Fetches the URLs a few at a time and reports progress from 0 to 1. A failed tile is skipped, not retried. */
export async function prefetchTiles(
  urls: readonly string[],
  signal: AbortSignal,
  onProgress: (share: number) => void
): Promise<void> {
  let done = 0;
  let next = 0;
  const total = urls.length || 1;
  onProgress(urls.length ? 0 : 1);
  const worker = async () => {
    while (next < urls.length && !signal.aborted) {
      const url = urls[next++];
      try {
        await fetch(url, { signal, mode: 'cors', cache: 'force-cache' });
      } catch {
        // A missing tile only means the map loads that one itself later.
      }
      done++;
      onProgress(done / total);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}
