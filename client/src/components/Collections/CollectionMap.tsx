import React, { useMemo } from 'react'
import { MapViewAuto } from '../Map/MapViewAuto'
import type { CollectionPlace } from '@trek/shared'
import { mappablePlaces, withMarkerCategory } from '../../pages/collections/collectionsModel'
import { useTileUrl } from '../../hooks/useTileUrl'
import { OFM_DARK, OFM_POSITRON } from '../../constants/mapDefaults'
import type { ViewportPadding } from '../../utils/mapViewport'

interface CollectionMapProps {
  places: CollectionPlace[]
  selectedPlaceId: number | null
  onOpenPlace: (id: number) => void
  /** Clicking the map background clears the selection. */
  onDeselect?: () => void
  dark: boolean
  /** A control bar floats over the top of the map (the desktop panel's), so the frame starts below it. */
  underBar?: boolean
}

/** How far a pin reaches from its point: half a selected pin (44 px) and the rating badge on its corner. */
const PIN_REACH = 26
/** What every edge keeps clear: a pin's reach and a little air, so no pin touches the frame. */
const EDGE = PIN_REACH + 14
/** The desktop panel's control bar: 12 px off the top edge and at most 40 px tall. */
const TOP_BAR = 52
/** The round controls in the bottom corners (satellite, locate): 12 px off the edge and 42 px tall. */
const BOTTOM_CONTROLS = 54
/**
 * Half the side of the square framed around a lone place, in degrees: about 11 km
 * from north to south, so a list of one opens on its town rather than on the street
 * the closest fit would zoom to.
 */
const LONE_PLACE_SPAN = 0.05

/** What the frame keeps clear of pins, in map pixels per edge. */
function framePadding(underBar: boolean): ViewportPadding {
  const top = (underBar ? TOP_BAR : 0) + EDGE
  return { top, right: EDGE, bottom: BOTTOM_CONTROLS + PIN_REACH, left: EDGE } // rtl-lint-disable: pixels of the map, not sides of the text
}

/**
 * The coordinates the map frames. A lone place, or several on one spot, has no extent
 * to fit, so a small square around it stands in.
 */
function framePoints(places: CollectionPlace[]): [number, number][] {
  const points = places.flatMap(p => (
    typeof p.lat === 'number' && typeof p.lng === 'number' ? [[p.lat, p.lng] as [number, number]] : []
  ))
  if (points.length === 0) return points
  const [lat, lng] = points[0]
  if (points.some(([a, b]) => a !== lat || b !== lng)) return points
  return [
    [Math.max(-90, lat - LONE_PLACE_SPAN), lng - LONE_PLACE_SPAN],
    [Math.min(90, lat + LONE_PLACE_SPAN), lng + LONE_PLACE_SPAN],
  ]
}

/**
 * Map view: reuses the trip map stack (MapViewAuto → Leaflet / GL with marker
 * clustering). One of the three list views; clicking a marker selects the place.
 * The parent `.col-mapwrap` supplies the rounded, bordered box + height, so this
 * just fills it.
 *
 * The map frames every place itself, through the renderers' focus props. Their
 * opening camera is framed for the browser window, and this map is a box a fraction
 * of that size (the desktop split, the phone's card), so it opened zoomed in on the
 * middle of the list with most places outside; and the count it used to key the fit
 * on never changed between two lists of eight. The frame is fitted in the map's own
 * box instead, clear of the edges and of the controls floating over it, and lands
 * while the map is built rather than flying in.
 */
export default function CollectionMap({ places, selectedPlaceId, onOpenPlace, onDeselect, dark, underBar = false }: CollectionMapProps): React.ReactElement {
  const pts = useMemo(() => mappablePlaces(places).map(withMarkerCategory), [places])
  const tileUrl = useTileUrl(dark ? OFM_DARK : OFM_POSITRON)
  const focusPoints = useMemo(() => framePoints(pts), [pts])
  // The places as a set: another list, a filter or a new place frames again, while a
  // reload, another sort order or an edited note leaves a map the user moved alone.
  const focusKey = useMemo(() => pts.map(p => p.id).sort((a, b) => a - b).join(','), [pts])

  return (
    // The map's own controls stand on --bottom-nav-h to clear the phone's tab bar on a
    // full-screen map. This one ends above the tab bar, so they belong on its bottom edge,
    // where the frame's bottom padding keeps the pins out from under them.
    <div className="[--bottom-nav-h:0px]" style={{ width: '100%', height: '100%' }}>
      <MapViewAuto
        places={pts}
        selectedPlaceId={selectedPlaceId}
        // Hover was off here, so a wall of round photos gave no way to tell what any of
        // them were without clicking. The trip map has said what a marker is all along;
        // this one adds the rating, because "which of these did I like" is exactly the
        // question a small picture cannot answer.
        onMarkerClick={onOpenPlace}
        onMapClick={onDeselect ? () => onDeselect() : undefined}
        tileUrl={tileUrl}
        focusPoints={focusPoints}
        focusKey={focusKey}
        fitPadding={framePadding(underBar)}
      />
    </div>
  )
}
