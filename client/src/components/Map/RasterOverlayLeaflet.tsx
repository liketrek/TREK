import { TileLayer } from 'react-leaflet';
import { FerrataMapLayerLeaflet } from '../Ferratas/FerrataLayerLeaflet';
import type { FerrataMapLayer } from '../Ferratas/useFerrataMapLayer';
import { PaddleLayerLeaflet } from '../Tours/paddle/PaddleLayerLeaflet';
import type { PaddleMapLayer } from '../Tours/paddle/paddleMapLayer';
import type { MapRasterOverlay } from './mapRasterOverlay';

/** Over the basemap's tiles (z-index 1) and every basemap raster, under the route's own panes. */
const OVERLAY_Z_INDEX = 300;

/** The overlays on the Leaflet map: a tile layer each while it is on, nothing while it is off. */
function RasterOverlaysLeaflet({ overlays }: { overlays?: readonly MapRasterOverlay[] }) {
  return (
    <>
      {overlays
        ?.filter((overlay) => overlay.active)
        .map((overlay) => (
          <TileLayer
            key={overlay.id}
            url={overlay.url}
            attribution={overlay.attribution}
            minZoom={overlay.minZoom}
            maxNativeZoom={overlay.maxZoom}
            maxZoom={22}
            zIndex={OVERLAY_Z_INDEX}
            eventHandlers={{ tileerror: overlay.onTileError, tileload: overlay.onTileLoad }}
          />
        ))}
    </>
  );
}

/** The tour planner's layers on the Leaflet map: the via ferratas, the raster overlays its type offers and the paddle obstacles. */
export function TourMapLayersLeaflet({
  ferrataLayer,
  overlays,
  paddle,
}: {
  ferrataLayer?: FerrataMapLayer;
  overlays?: readonly MapRasterOverlay[];
  paddle?: PaddleMapLayer;
}) {
  return (
    <>
      <FerrataMapLayerLeaflet layer={ferrataLayer} />
      <RasterOverlaysLeaflet overlays={overlays} />
      <PaddleLayerLeaflet layer={paddle} />
    </>
  );
}
