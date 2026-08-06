import { lazy, Suspense } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { MapView } from './MapView'
import ErrorBoundary from '../shared/ErrorBoundary'

// MapLibre/Mapbox pull in a ~230 KB (gzip) GL engine. Lazy-load the GL renderer so
// Leaflet-only installs never download it — it ships only once a GL provider is picked.
const MapViewGL = lazy(() => import('./MapViewGL').then(m => ({ default: m.MapViewGL })))

// Auto-selects the map renderer based on user settings. Keeps the existing
// Leaflet MapView untouched so the Mapbox GL variant can mature iteratively
// behind a toggle. Atlas is not affected — it imports Leaflet directly.
//
// Offline maps: only the Leaflet renderer supports full pre-download (raster
// tiles via sync/tilePrefetcher.ts). GL maps are best-effort offline — their
// vector tiles are cached opportunistically by the Service Worker as you view
// them online (see the GL tile rules in vite.config.js), not prefetched.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MapViewAuto(props: any) {
  const provider = useSettingsStore(s => s.settings.map_provider)
  const token = useSettingsStore(s => s.settings.mapbox_access_token)
  // Fall back to Leaflet when Mapbox is selected but no token is set,
  // so trip planner never shows an empty map due to a missing token.
  const glProvider = provider === 'maplibre-gl' ? 'maplibre-gl'
    : provider === 'mapbox-gl' && token ? 'mapbox-gl'
    : null
  if (glProvider) {
    // Render the previous Leaflet map as the fallback so there's no blank flash
    // while the GL chunk loads on first use.
    return (
      // Outside the Suspense on purpose: Suspense handles the pending promise,
      // a rejected one (chunk gone after a deploy) throws past it. Falling back
      // to Leaflet keeps a usable map instead of an error card.
      <ErrorBoundary boundaryId="map:gl" fallback={<MapView {...props} />}>
        <Suspense fallback={<MapView {...props} />}>
          <MapViewGL {...props} glProvider={glProvider} />
        </Suspense>
      </ErrorBoundary>
    )
  }
  return <MapView {...props} />
}
