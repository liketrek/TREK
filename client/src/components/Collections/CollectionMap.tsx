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
        // No center/zoom: the map frames itself on the collection's places at mount, and
        // falls back to the world view for a collection with none.
        tileUrl={tileUrl}
        fitKey={pts.length}
      />
    </div>
  )
}
