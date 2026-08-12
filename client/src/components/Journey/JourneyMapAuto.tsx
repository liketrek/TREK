import { Suspense, useImperativeHandle, useRef, type Ref } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import JourneyMap, { type JourneyMapHandle } from './JourneyMap'
import ErrorBoundary from '../shared/ErrorBoundary'
import type { JourneyMapGLHandle } from './JourneyMapGL'

import { JourneyMapGLMapbox, JourneyMapGLMaplibre } from '../Map/glLazy'
import type { JourneyTrack } from '@trek/shared'

// Unified handle — both providers expose the same three methods.
export type JourneyMapAutoHandle = JourneyMapHandle

interface MapEntry {
  id: string
  lat: number
  lng: number
  title?: string | null
  location_name?: string | null
  mood?: string | null
  entry_date: string
  dayColor?: string
  dayLabel?: number
}

interface Props {
  ref?: Ref<JourneyMapAutoHandle>
  checkins: unknown[]
  entries: MapEntry[]
  trail?: { lat: number; lng: number }[]
  tracks?: JourneyTrack[]
  height?: number
  dark?: boolean
  activeMarkerId?: string | null
  onMarkerClick?: (id: string, type?: string) => void
  fullScreen?: boolean
  paddingBottom?: number
}

function JourneyMapAuto({ ref, ...props }: Props) {
  const provider = useSettingsStore(s => s.settings.map_provider)
  const token = useSettingsStore(s => s.settings.mapbox_access_token)
  const leafletRef = useRef<JourneyMapHandle>(null)
  const glRef = useRef<JourneyMapGLHandle>(null)

  // Fall back to Leaflet when the user selected Mapbox GL but hasn't
  // supplied a token yet. MapLibre/OpenFreeMap is tokenless.
  const useGL = provider === 'maplibre-gl' || (provider === 'mapbox-gl' && !!token)
  const glProvider = provider === 'maplibre-gl' ? 'maplibre-gl' : 'mapbox-gl'

  useImperativeHandle(ref, () => ({
    highlightMarker: (id) => (useGL ? glRef.current : leafletRef.current)?.highlightMarker(id),
    focusMarker: (id) => (useGL ? glRef.current : leafletRef.current)?.focusMarker(id),
    invalidateSize: () => (useGL ? glRef.current : leafletRef.current)?.invalidateSize(),
  }), [useGL])

  // One chunk per engine — see MapViewAuto.
  const JourneyMapGL = glProvider === 'maplibre-gl' ? JourneyMapGLMaplibre : JourneyMapGLMapbox
  if (useGL) {
    return (
      // See MapViewAuto: the boundary has to sit outside the Suspense to catch a
      // chunk that never arrives.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <ErrorBoundary boundaryId="journey-map:gl" resetKeys={[glProvider]} fallback={<JourneyMap ref={leafletRef} {...(props as any)} />}>
        <Suspense fallback={null}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <JourneyMapGL ref={glRef} {...(props as any)} glProvider={glProvider} />
        </Suspense>
      </ErrorBoundary>
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <JourneyMap ref={leafletRef} {...(props as any)} />
}

export default JourneyMapAuto
