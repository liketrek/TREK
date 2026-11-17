import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

import { frameLng } from '../../utils/lngFrame';
import { computeMapViewport, TILE_SIZE_RASTER } from '../../utils/mapViewport';
import { useLngFrame } from './lngFrameContext';
import type { OpeningFrame } from './openingView';

/**
 * Leaflet measures its container on window resizes only. The touch shell on a
 * wide window resizes the map without one: the trip's plan pane opens and
 * closes beside it, and a foldable folds. Without a fresh measure the map kept
 * its old size, with grey bands or tiles cut off at the old edge.
 */
export default function ContainerResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    // Leaflet's default keeps the centre where it was, so what the map framed stays
    // in the middle of the room it now has.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/** Reports where the map looks after every move, so a remount can come back to it. */
export function MapCameraSnapshot({ onChange }: { onChange: (center: [number, number], zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const save = () => {
      const center = map.getCenter();
      onChange([center.lat, center.lng], map.getZoom());
    };
    map.whenReady(save);
    map.on('moveend zoomend', save);
    return () => {
      map.off('moveend zoomend', save);
    };
  }, [map, onChange]);
  return null;
}

/**
 * The map opens framed on the trip's places, a frame worked out before the
 * map exists and so for the window's size. Where the map is much smaller
 * than the window (the plan beside it on an iPad or an unfolded foldable),
 * that frame is too close and the day runs off the map. Once the map knows
 * its size, the frame is worked out again for it. A map that opened anywhere
 * else (a camera kept from before a remount) is left where it is.
 */
export function OpeningFrameFit({ frame }: { frame: OpeningFrame }) {
  const map = useMap();
  const lngFrame = useLngFrame();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const { x, y } = map.getSize();
    if (x <= 0 || y <= 0) return;
    if (Math.abs(x - frame.width) <= frame.width * 0.1 && Math.abs(y - frame.height) <= frame.height * 0.1) return;
    const at = map.getCenter();
    const opened =
      Math.abs(map.getZoom() - frame.zoom) < 0.01 &&
      Math.abs(at.lat - frame.center[0]) < 1e-6 &&
      Math.abs(at.lng - frame.center[1]) < 1e-6;
    if (!opened) return;
    const view = computeMapViewport(frame.points, {
      tileSize: TILE_SIZE_RASTER,
      padding: frame.padding,
      wrapsWorld: frame.wrapsWorld,
      width: x,
      height: y,
    });
    // A whole zoom level, as Leaflet snaps to them, and the one that fits rather than the nearest.
    if (view)
      map.setView([view.center[0], frameLng(lngFrame, view.center[1])], Math.floor(view.zoom), { animate: false });
  }, [map, lngFrame, frame]);
  return null;
}
