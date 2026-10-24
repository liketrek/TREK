import { useEffect } from 'react';

import type { FerrataBbox } from '@trek/shared';

import { type FerrataGlMap, useFerrataMapLayerGL } from '../../Ferratas/useFerrataLayerGL';
import type { FerrataMapLayer } from '../../Ferratas/useFerrataMapLayer';
import { rasterTileZoom } from '../../Map/glRasterLayers';
import type { TerrainGl } from './useTerrainMap';

/**
 * The via ferrata layer on the 3D terrain map, the same layer the flat map
 * draws: the visible area, with the zoom on the raster tile scale, goes out
 * through `onViewportChange` once the map has loaded and after every move, and the lines are drawn by the shared GL
 * hook. MapLibre's map answers every call that hook makes, so it is handed
 * over as the GL map type the hook is written against.
 */
export function useTerrainFerratas(
  gl: TerrainGl | null,
  layer: FerrataMapLayer | undefined,
  onViewportChange: ((bbox: FerrataBbox, zoom: number) => void) | undefined
) {
  useEffect(() => {
    if (!gl || !onViewportChange) return;
    const map = gl.map;
    const emit = () => {
      const bounds = map.getBounds();
      onViewportChange(
        {
          south: bounds.getSouth(),
          west: bounds.getWest(),
          north: bounds.getNorth(),
          east: bounds.getEast(),
        },
        rasterTileZoom(map.getZoom())
      );
    };
    map.on('moveend', emit);
    if (map.loaded()) emit();
    else map.on('load', emit);
    return () => {
      map.off('moveend', emit);
      map.off('load', emit);
    };
  }, [gl, onViewportChange]);

  // Wider lines than the flat map's: seen at a slant over the hillshade, the thin ones get lost.
  useFerrataMapLayerGL(gl ? (gl.map as unknown as FerrataGlMap) : null, layer, 'terrain');
}
