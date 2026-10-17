import type { Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useMemo, useState } from 'react';
import type { DistanceIndexedProfileSample } from '../../../utils/routeGeometry';
import { corridorPoints, loadedTemplates } from './terrainLayers';
import { corridorTiles, prefetchTiles, tileUrls } from './terrainPrefetch';

/**
 * The corridor around the route, warmed up front so the flyover never waits on a tile.
 * Returns the share already in the browser cache: 0 until the style knows its tile URLs,
 * 1 once the flyover can run from the cache (or there is no corridor to load).
 */
export function useTerrainPrefetch(
  map: MapLibreMap | null,
  styleGeneration: number,
  samples: DistanceIndexedProfileSample[]
): number {
  const points = useMemo(() => corridorPoints(samples), [samples]);
  // One run per route and loaded style; a progress report from an older run never shows.
  const run = useMemo(() => ({ points, styleGeneration }), [points, styleGeneration]);
  const [progress, setProgress] = useState<{ run: typeof run | null; share: number }>({ run: null, share: 0 });

  useEffect(() => {
    if (!map || run.styleGeneration === 0 || !run.points.length) return;
    const controller = new AbortController();
    const urls = tileUrls(loadedTemplates(map), corridorTiles(run.points));
    void prefetchTiles(urls, controller.signal, (share) => {
      if (!controller.signal.aborted) setProgress({ run, share });
    });
    return () => controller.abort();
  }, [map, run]);

  if (styleGeneration === 0) return 0;
  if (!points.length) return 1;
  return progress.run === run ? progress.share : 0;
}
