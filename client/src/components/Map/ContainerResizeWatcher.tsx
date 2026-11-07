import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

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
