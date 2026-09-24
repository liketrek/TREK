import { useEffect } from 'react'
import type { Map } from 'mapbox-gl'
import type { GeoJSONSource } from 'mapbox-gl'
import type { DawarichTrack } from '@trek/shared'
import { DAWARICH_TRAIL_CASING, trailGeoJson, trailSegments } from './dawarichTrail'

/**
 * The recorded route on the GL renderer — the imperative twin of
 * `DawarichTrailLayer`.
 *
 * The ids start with `trek-` because `applySatellite` finds the first layer
 * whose id carries one of TREK's own prefixes and inserts the satellite tile
 * beneath it. A layer named `dawarich-trail` would end up *under* the
 * satellite image and simply not be there when someone switched basemap on.
 *
 * Everything is rebuilt on `style.load`, because the whole GL map is torn down
 * and reassembled when the provider, the style or the token changes, and a
 * source added outside that effect does not survive it.
 */
const SOURCE = 'trek-dawarich-trail'
const CASING_LAYER = 'trek-dawarich-trail-casing'
const LINE_LAYER = 'trek-dawarich-trail-line'

export function useDawarichTrailGL(
  map: Map | null,
  ready: boolean,
  track: DawarichTrack | null | undefined,
  selectedDate?: string | null,
  /** Insert beneath this layer, so the planned route stays on top. */
  beforeId?: string,
  /** Local dates whose day is folded away in the day plan. */
  hiddenDates?: ReadonlySet<string> | null,
): void {
  useEffect(() => {
    if (!map || !ready) return

    const data = trailGeoJson(trailSegments(track ?? null, selectedDate, hiddenDates))

    // `isStyleLoaded()` does not mean "the style has loaded". It is false while
    // any source still has tiles in flight, which is the usual state right after
    // someone switches the overlay on and the map is still filling in. Giving up
    // there left the line undrawn until something rebuilt the style, which in
    // practice meant reloading the page. `idle` is the map saying everything it
    // was fetching has arrived, so the draw waits for it once and tries again.
    let waiting = false
    const draw = () => {
      if (!map.isStyleLoaded()) {
        if (!waiting) {
          waiting = true
          map.once('idle', retry)
        }
        return
      }
      const existing = map.getSource(SOURCE) as GeoJSONSource | undefined
      if (existing) {
        // setData rather than remove-and-add: a rebuilt source flickers, and a
        // refresh every two minutes would flicker every two minutes.
        existing.setData(data as never)
        return
      }
      map.addSource(SOURCE, { type: 'geojson', data: data as never })
      const anchor = beforeId && map.getLayer(beforeId) ? beforeId : undefined
      map.addLayer(
        {
          id: CASING_LAYER,
          type: 'line',
          source: SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          // theme-lint-disable — map paint
          paint: { 'line-color': DAWARICH_TRAIL_CASING, 'line-width': 6, 'line-opacity': 0.55 },
        },
        anchor,
      )
      map.addLayer(
        {
          id: LINE_LAYER,
          type: 'line',
          source: SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            // Per-day colour off the feature, with the same fallback the GPX
            // layer uses when a feature somehow carries none.
            'line-color': ['coalesce', ['get', 'color'], DAWARICH_TRAIL_CASING],
            'line-width': 3,
            'line-opacity': 0.85,
            // Dashed, so the recording is distinguishable from the planned
            // route without relying on colour alone.
            'line-dasharray': [2, 1.6],
          },
        },
        anchor,
      )
    }

    const retry = () => {
      waiting = false
      draw()
    }

    draw()
    map.on('style.load', draw)
    return () => {
      map.off('style.load', draw)
      map.off('idle', retry)
      for (const layer of [LINE_LAYER, CASING_LAYER]) {
        if (map.getLayer(layer)) map.removeLayer(layer)
      }
      if (map.getSource(SOURCE)) map.removeSource(SOURCE)
    }
  }, [map, ready, track, selectedDate, beforeId, hiddenDates])
}
