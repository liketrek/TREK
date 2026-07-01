import React from 'react'
import { MapViewAuto } from '../Map/MapViewAuto'
import type { CollectionPlace } from '@trek/shared'
import { mappablePlaces } from '../../pages/collections/collectionsModel'

interface CollectionMapProps {
  places: CollectionPlace[]
  selectedPlaceId: number | null
  onOpenPlace: (id: number) => void
  /** Clicking the map background clears the selection. */
  onDeselect?: () => void
  dark: boolean
}

/**
 * Map view — reuses the trip map stack (MapViewAuto → Leaflet / GL with marker
 * clustering). One of the three list views; clicking a marker selects the place.
 * The parent `.col-mapwrap` supplies the rounded, bordered box + height, so this
 * just fills it.
 */
export default function CollectionMap({ places, selectedPlaceId, onOpenPlace, onDeselect, dark }: CollectionMapProps): React.ReactElement {
  const pts = mappablePlaces(places)
  const center: [number, number] = pts.length > 0
    ? [pts[0].lat as number, pts[0].lng as number]
    : [48.8566, 2.3522]
  const tileUrl = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapViewAuto
        places={pts}
        selectedPlaceId={selectedPlaceId}
        hoverDisabled
        onMarkerClick={onOpenPlace}
        onMapClick={onDeselect ? () => onDeselect() : undefined}
        center={center}
        zoom={pts.length > 0 ? 6 : 3}
        tileUrl={tileUrl}
        fitKey={pts.length}
      />
    </div>
  )
}
