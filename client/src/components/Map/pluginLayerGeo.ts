import type { PluginMapLayer } from '../../api/client';

/** The plugin tone palette, shared by the GL layers and markers. */
export const PLUGIN_TONE_COLORS: Record<string, string> = {
  default: '#4F46E5',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
};

// GL circle layers size in screen pixels, so a metric circle has to become a
// polygon. Equirectangular approximation — plenty for a display-only overlay.
function circleToRing(center: [number, number], radiusM: number): [number, number][] {
  const [lat, lng] = center;
  const dLat = radiusM / 111_320;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLng = radiusM / (111_320 * Math.max(0.01, Math.abs(cos)));
  const ring: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    ring.push([lng + Math.cos(a) * dLng, lat + Math.sin(a) * dLat]);
  }
  return ring;
}

interface PluginLayerGeoFeature {
  type: 'Feature';
  properties: {
    id: string;
    color: string;
    width: number;
    opacity: number;
    dash: string;
    fillOpacity: number;
    label: string;
  };
  geometry: { type: 'LineString'; coordinates: number[][] } | { type: 'Polygon'; coordinates: number[][][] };
}

/** The plugins' vector layers as one GeoJSON source for the GL map. */
export function buildPluginLayerData(layers: PluginMapLayer[]) {
  const features = layers.flatMap((layer) =>
    layer.features.flatMap((f, i): PluginLayerGeoFeature[] => {
      const color = PLUGIN_TONE_COLORS[f.tone] ?? PLUGIN_TONE_COLORS.default;
      const properties = {
        id: `${layer.pluginId}:${layer.id}:${i}`,
        color,
        width: f.width,
        opacity: f.opacity,
        dash: f.dash,
        fillOpacity: f.fill ? Math.min(0.25, f.opacity) : 0,
        label: f.label || '',
      };
      if (f.type === 'polyline' && f.points) {
        return [
          {
            type: 'Feature' as const,
            properties,
            geometry: { type: 'LineString' as const, coordinates: f.points.map(([lat, lng]) => [lng, lat]) },
          },
        ];
      }
      if (f.type === 'polygon' && f.points) {
        const ring = f.points.map(([lat, lng]) => [lng, lat]);
        if (ring.length && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]))
          ring.push(ring[0]);
        return [{ type: 'Feature' as const, properties, geometry: { type: 'Polygon' as const, coordinates: [ring] } }];
      }
      if (f.type === 'circle' && f.center && f.radiusM) {
        return [
          {
            type: 'Feature' as const,
            properties,
            geometry: { type: 'Polygon' as const, coordinates: [circleToRing(f.center, f.radiusM)] },
          },
        ];
      }
      return [];
    })
  );
  return { type: 'FeatureCollection' as const, features };
}
