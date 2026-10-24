import { TRACK_COLOR_FALLBACK } from '@trek/shared';
import type mapboxgl from 'mapbox-gl';
import type { Place } from '../../types';
import { parseRenderableRouteGeometry } from '../../utils/routeGeometry';
import { hasManualTrackColor, resolveTrackColor, TRACK_CASING_COLOR } from './trackColors';

const SOURCE_ID = 'trip-gpx';
/** The invisible fat line that takes a click on a track. */
export const GPX_HIT_LAYER_ID = 'trip-gpx-hit';
const SELECTED_CASING_LAYER_ID = 'trip-gpx-selected-casing';
const SELECTED_LAYER_ID = 'trip-gpx-selected';

const ROUND = { 'line-cap': 'round', 'line-join': 'round' } as const;
const NO_TRACK = ['==', ['get', 'place_id'], -1] as mapboxgl.FilterSpecification;

/**
 * The tracks of the vector map, as the Leaflet map draws them (TrackLines): a
 * rim under the tracks that carry a picked colour, the lines, the picked
 * track on top wider with a light rim (PR1-08), and an invisible fat line that
 * takes the click. Added once with the style; whoever adds it wires the click.
 */
export function addGpxTrackLayers(map: mapboxgl.Map): void {
  map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  // Casing under the tracks that carry a picked colour (#776): legible on satellite and dark styles.
  // Untouched tracks are filtered out, so they look exactly as they did before.
  map.addLayer({
    id: 'trip-gpx-casing',
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', ['get', 'cased'], true],
    paint: { 'line-color': TRACK_CASING_COLOR, 'line-width': 6.5, 'line-opacity': 0.7 },
    layout: ROUND,
  });
  map.addLayer({
    id: 'trip-gpx-line',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-color': ['coalesce', ['get', 'color'], TRACK_COLOR_FALLBACK],
      'line-width': 3.5,
      'line-opacity': ['case', ['==', ['get', 'cased'], true], 0.9, 0.75],
    },
    layout: ROUND,
  });
  // The filter follows the selection (selectGpxTrack); until something is picked it matches no track.
  map.addLayer({
    id: SELECTED_CASING_LAYER_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: NO_TRACK,
    paint: { 'line-color': TRACK_CASING_COLOR, 'line-width': 9, 'line-opacity': 0.95 },
    layout: ROUND,
  });
  map.addLayer({
    id: SELECTED_LAYER_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: NO_TRACK,
    paint: { 'line-color': ['coalesce', ['get', 'color'], TRACK_COLOR_FALLBACK], 'line-width': 5.5 },
    layout: ROUND,
  });
  // 3.5px is not a target, and the start markers cluster below zoom 11, so without this a track
  // is unreachable at the very zoom where you compare walks side by side.
  map.addLayer({
    id: GPX_HIT_LAYER_ID,
    type: 'line',
    source: SOURCE_ID,
    paint: { 'line-color': TRACK_CASING_COLOR, 'line-width': 14, 'line-opacity': 0 },
    layout: ROUND,
  });
}

/** Whether the track layers are there yet (they come with the style). */
export function hasGpxTrackLayers(map: mapboxgl.Map): boolean {
  return !!map.getSource(SOURCE_ID);
}

/** The places' tracks into the source, each with its colour and whether it carries a rim. */
export function setGpxTracks(map: mapboxgl.Map, places: readonly Place[]): void {
  const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!src) return;
  const features = places.flatMap((place) => {
    const coords = parseRenderableRouteGeometry(place.route_geometry);
    if (!coords) return [];
    return [
      {
        type: 'Feature' as const,
        properties: { color: resolveTrackColor(place), cased: hasManualTrackColor(place), place_id: place.id },
        geometry: { type: 'LineString' as const, coordinates: coords.map(([lat, lng]) => [lng, lat]) },
      },
    ];
  });
  src.setData({ type: 'FeatureCollection', features });
}

/** PR1-08: the picked place's track stands out; none picked, none does. */
export function selectGpxTrack(map: mapboxgl.Map, placeId: number | null): void {
  if (typeof map.getLayer !== 'function') return;
  const filter = ['==', ['get', 'place_id'], placeId ?? -1] as mapboxgl.FilterSpecification;
  for (const id of [SELECTED_CASING_LAYER_ID, SELECTED_LAYER_ID]) {
    if (map.getLayer(id)) map.setFilter(id, filter);
  }
}
