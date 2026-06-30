import React from 'react'
import { MapViewAuto } from '../Map/MapViewAuto'
import type { CollectionPlace } from '@trek/shared'
import { mappablePlaces } from '../../pages/collections/collectionsModel'

interface CollectionMapProps {
  places: CollectionPlace[]
  selectedPlaceId: number | null
  onOpenPlace: (id: number) => void
  dark: boolean
}

/**
 * Map view — reuses the trip map stack (MapViewAuto → Leaflet / GL with marker
 * clustering). One of the three list views; clicking a marker selects the place.
 */
export default function CollectionMap({ places, selectedPlaceId, onOpenPlace, dark }: CollectionMapProps): React.ReactElement {
  const pts = mappablePlaces(places)
  const center: [number, number] = pts.length > 0
    ? [pts[0].lat as number, pts[0].lng as number]
    : [48.8566, 2.3522]
  const tileUrl = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <div className="rounded-xl overflow-hidden border border-edge" style={{ height: 'calc(100vh - var(--nav-h) - 180px)', minHeight: 360 }}>
      <MapViewAuto
        places={pts}
        selectedPlaceId={selectedPlaceId}
        onMarkerClick={onOpenPlace}
        center={center}
        zoom={pts.length > 0 ? 6 : 3}
        tileUrl={tileUrl}
        fitKey={pts.length}
      />
    </div>
  )
}
