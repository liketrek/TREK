import { Suspense, useState } from 'react'
import { AlertTriangle, Clock, CloudOff, Info } from 'lucide-react'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { MapView } from './MapView'
import ErrorBoundary from '../shared/ErrorBoundary'
import { MapViewGLMapbox, MapViewGLMaplibre } from './glLazy'
import { useGlRenderer } from './glSupport'
import { useRoadtripHazards } from './useRoadtripHazards'
import { useTranslation } from '../../i18n/TranslationContext'
import type { MapViewAutoProps, MapViewProps } from './mapViewContract'
import { useNetworkMode } from '../../hooks/useNetworkMode'
import { useIsDark } from '../../hooks/useIsDark'
import { OFM_POSITRON } from '../../constants/mapDefaults'
import { glWorksOffline, leafletWorksOffline, offlineStyleFor } from './offlineBasemap'
import { tileCacheActive } from '../../native/tileCache'

// Auto-selects the map renderer based on user settings. Keeps the existing
// Leaflet MapView untouched so the Mapbox GL variant can mature iteratively
// behind a toggle. Atlas is not affected — it imports Leaflet directly.
//
// Offline maps: "prepare for offline" stores the OpenFreeMap basemap for every
// trip, whatever the provider (sync/tilePrefetcher.ts). Offline, a map whose own
// basemap cannot be drawn from storage (Mapbox, another OpenFreeMap style, a
// raster template the device cannot serve) switches to that stored basemap,
// with the same markers, routes and tracks, and says so with a small pill. It
// switches back once the connection returns. See offlineBasemap.ts.
export function MapViewAuto(props: MapViewAutoProps) {
  const { t } = useTranslation()
  const hazards = useRoadtripHazards(props.tripId, !!props.clusterLoosely)
  // `dawarichTrack` arrives as a prop rather than being fetched here: the pill
  // that switches it on lives at page level and needs the load status, so the
  // fetch sits in useTripPlanner and both shells read the same one.
  // The one cast between what callers pass and what the renderers type: pins
  // without trip_id (see MapViewAutoProps). Neither renderer reads trip_id.
  const mapProps = { ...props, hazards: hazards.feed?.hazards } as MapViewProps
  const provider = useSettingsStore(s => s.settings.map_provider)
  const token = useSettingsStore(s => s.settings.mapbox_access_token)
  // Fall back to Leaflet when Mapbox is selected but no token is set, or when the
  // browser has no WebGL2 (both GL engines need it), so the trip planner never
  // shows an empty map or one that fails to start.
  const configuredGl = useGlRenderer(provider, token)
  const maplibreStyle = useSettingsStore(s => s.settings.maplibre_style)
  const { offline } = useNetworkMode()
  const dark = useIsDark()
  const offlineStyle = offlineStyleFor(dark)
  // In the iOS app with its tile store, a Mapbox map keeps what was viewed for 30
  // days, so offline it stays Mapbox, and the pill offers the stored trip region
  // instead for the places never looked at. Everywhere else a basemap with
  // nothing stored is swapped for the stored one straight away.
  const nativeStore = tileCacheActive()
  const [preferStored, setPreferStored] = useState(false)
  const mapboxKept = configuredGl === 'mapbox-gl' && nativeStore
  const glFallback = !!configuredGl && offline && !glWorksOffline(configuredGl, maplibreStyle) && (!mapboxKept || preferStored)
  const glProvider = glFallback ? 'maplibre-gl' : configuredGl
  const leafletFallback = !configuredGl && offline && !leafletWorksOffline(mapProps.tileUrl ?? OFM_POSITRON, nativeIosWithoutStore(nativeStore))
  if (leafletFallback) mapProps.tileUrl = offlineStyle
  const pill = offline && mapboxKept
    ? (
      <OfflineBasemapPill
        label={preferStored ? t('map.offlineBasemap') : t('map.offlineShowStored')}
        pressed={preferStored}
        onToggle={() => setPreferStored(v => !v)}
      />
    )
    : (glFallback || leafletFallback) && <OfflineBasemapPill label={t('map.offlineBasemap')} />
  // One chunk per engine: picking the binding here is what keeps mapbox-gl and
  // maplibre-gl out of each other's downloads.
  const MapViewGL = glProvider === 'maplibre-gl' ? MapViewGLMaplibre : MapViewGLMapbox
  if (glProvider) {
    // Render the previous Leaflet map as the fallback so there's no blank flash
    // while the GL chunk loads on first use.
    return (
      // Outside the Suspense on purpose: Suspense handles the pending promise,
      // a rejected one (chunk gone after a deploy) throws past it. Falling back
      // to Leaflet keeps a usable map instead of an error card.
      // resetKeys: with two engine chunks, a failure under one provider must not
      // keep showing Leaflet after the user switches to the other.
      <>
        <ErrorBoundary boundaryId="map:gl" resetKeys={[glProvider]} fallback={<MapView {...mapProps} />}>
          <Suspense fallback={<MapView {...mapProps} />}>
            <MapViewGL {...mapProps} glProvider={glProvider} styleOverride={glFallback ? offlineStyle : undefined} />
          </Suspense>
        </ErrorBoundary>
        {pill}
      </>
    )
  }
  return (
    <>
      <MapView {...mapProps} />
      {pill}
    </>
  )
}

/** A raster template cannot be served offline in the iOS app unless it has its tile store. */
function nativeIosWithoutStore(nativeStore: boolean): boolean | undefined {
  return nativeStore ? false : undefined
}

const PILL = 'absolute left-1/2 z-[5] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-edge bg-surface-card px-3 py-1 text-caption font-semibold text-content-secondary shadow-sm backdrop-blur-md bottom-[calc(var(--bottom-nav-h,0px)+12px)]'

/**
 * Says the map on screen is the stored offline basemap, not the user's own. With
 * onToggle it is a switch between the user's map (as far as it was viewed and
 * stored) and the stored trip region.
 */
function OfflineBasemapPill({ label, pressed, onToggle }: { label: string; pressed?: boolean; onToggle?: () => void }) {
  if (onToggle) {
    return (
      <button type="button" onClick={onToggle} aria-pressed={pressed} className={`${PILL} pointer-events-auto`}>
        <CloudOff size={13} strokeWidth={2.2} aria-hidden="true" />
        {label}
      </button>
    )
  }
  return (
    <div role="status" className={`${PILL} pointer-events-none`}>
      <CloudOff size={13} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </div>
  )
}
