import type { BookFrame } from '@trek/shared'
import { attributionFor } from './mapTiles'

/**
 * Which map sources this instance can actually offer.
 *
 * TREK already knows: an admin has configured a tile template, and possibly a
 * Mapbox token and style, for the planner and Atlas. Studio reads the same
 * settings rather than asking again — a second place to paste a token is a
 * second place for it to be wrong.
 *
 * A source with nothing behind it is not offered. Showing "Mapbox" to someone
 * with no token produces an element that renders grey, and no message anywhere
 * explains why.
 */

export interface MapSourceOption {
  /**
   * What this option is called in the panel.
   *
   * Not the same thing as `source`: relief and the instance's own tiles are
   * both raster grids and the renderer draws them identically, so they share a
   * `source` and differ only in where the pictures come from. Widening the
   * contract's enum to tell them apart would mean a document an older build
   * cannot read, for a distinction only the panel cares about.
   */
  id: 'vector' | 'tiles' | 'static' | 'relief' | 'satellite'
  /** What goes into the document. */
  source: 'vector' | 'tiles' | 'static'
  /** i18n key for the name. */
  labelKey: string
  /** The tile template or static URL to freeze into the element. */
  url: string
  attribution: string
}

/** Which option a placed element came from, matched back by what it stored. */
export function sourceIdOf(el: { source: string; tileUrl: string }, options: MapSourceOption[]): string {
  const exact = options.find(o => o.source === el.source && o.url === el.tileUrl)
  return exact?.id ?? el.source
}

/**
 * NASA's shaded relief, and why it is the one worth printing.
 *
 * ── What it looks like ───────────────────────────────────────────────────
 *
 * Land in its own colours with the terrain shaded into it, sea rendered dark
 * with the depth showing through, and no roads, no borders and no labels. It
 * is the look printed travel books have used for decades, and it is the one
 * the street map underneath a planner can never be: a street map is a working
 * document, and enlarged onto a page it reads as a screenshot.
 *
 * ── Why this source rather than a better-known one ───────────────────────
 *
 * Because a book gets printed, and possibly sold. Mapbox's own documentation
 * says to contact them before printing an exported map; Esri's imagery is
 * licensed for use with ArcGIS and not for commercial work; the OSM tile
 * server's policy forbids bulk fetching, which is what covering a page at
 * print resolution is. This is US government imagery: the service's own
 * capabilities document answers both questions in two lines, `<ows:Fees>none`
 * and `<ows:AccessConstraints>none`, and no account or token exists to get
 * wrong.
 *
 * ── Its one limit, stated rather than discovered ─────────────────────────
 *
 * Level 8, about 600 metres to the pixel. A journey across a country or a
 * continent is exactly what it is for; a weekend inside one city is not, and
 * for that the instance's own tiles are still the better answer.
 *
 * Note the path is `{z}/{y}/{x}` — WMTS names its axes row then column, the
 * reverse of the slippy convention. The substitution is by name, so the order
 * in the template is all that matters.
 */
const RELIEF_TILES = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'
  + '/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8'
  + '/{z}/{y}/{x}.jpeg'

/**
 * Real satellite imagery, and the answer to what relief cannot do.
 *
 * Relief stops at about 600 metres to the pixel, which is a continent's worth
 * of detail: it draws Europe beautifully and a fortnight in the Netherlands as
 * a green smudge. This is the same picture at ten metres — cloud-free Sentinel-2,
 * composited by EOX from a year of passes, so there is no weather in the way and
 * no seams between scenes.
 *
 * ── Why the 2016 layer specifically ──────────────────────────────────────
 *
 * EOX publish a layer per year, and only this one is usable in a book somebody
 * might sell: the service's own capabilities document releases it under CC BY
 * 4.0, while 2018 onwards are CC BY-NC-SA, which rules out a printed product.
 * The imagery being a decade old costs nothing here — a coastline, a mountain
 * range and a desert do not move, and the map is a backdrop for a route rather
 * than a survey.
 *
 * Attribution is not optional under that licence, which is why it travels into
 * the document with the source.
 */
const SATELLITE_TILES = 'https://tiles.maps.eox.at/wmts/1.0.0'
  + '/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'

/**
 * What a book may be made of.
 *
 * ── Why the planner's own tiles are not on this list ─────────────────────
 *
 * They are a street map, and a street map enlarged onto a page reads as a
 * screenshot of a working document rather than as an illustration — which is
 * the whole difference between the reference books and what this drew before.
 * Worse, covering a page at print resolution means fetching a few hundred tiles
 * at once, and the OSM tile server's usage policy names exactly that as
 * something not to do. Mapbox is off the list for a different reason: its own
 * documentation says to contact them before printing an exported map, so it
 * cannot be offered as a thing to put in a book somebody might sell.
 *
 * What is left is the three that are honestly printable: outlines drawn from
 * boundaries this server already ships, NASA's relief, and Sentinel-2.
 *
 * ── But a book that already uses one keeps working ───────────────────────
 *
 * Removing an option must not remove a page. An element placed with the
 * instance's tiles or with Mapbox still renders exactly as it did, and its own
 * source is added back to the list below so the panel can show it as the chosen
 * one — otherwise the map would draw correctly while the panel claimed it was
 * something else, and one stray click would silently convert it.
 */
export function useMapSources(
  frame: BookFrame,
  points: { lat: number; lng: number }[],
  /** What the element being inspected already uses, so it stays reachable. */
  current?: { source: string; tileUrl: string },
): MapSourceOption[] {
  // Through the same normaliser the planner's map uses: a template saved
  // before OSM dropped its shards still names a host that no longer exists.
  const out: MapSourceOption[] = [
    { id: 'vector', source: 'vector', labelKey: 'journey.studio.mapSourceVector', url: '', attribution: '' },
    {
      id: 'relief',
      source: 'tiles',
      labelKey: 'journey.studio.mapSourceRelief',
      url: RELIEF_TILES,
      attribution: attributionFor(RELIEF_TILES),
    },
    {
      id: 'satellite',
      source: 'tiles',
      labelKey: 'journey.studio.mapSourceSatellite',
      url: SATELLITE_TILES,
      attribution: attributionFor(SATELLITE_TILES),
    },
  ]

  /*
   * The one the element is already on, when it is not one of the three above.
   * Listed last, so the recommended sources read as the answer and this reads
   * as what happens to be in place.
   */
  if (current && !out.some(o => o.source === current.source && o.url === current.tileUrl)) {
    if (current.source === 'tiles' && current.tileUrl) {
      out.push({
        id: 'tiles',
        source: 'tiles',
        labelKey: 'journey.studio.mapSourceTiles',
        url: current.tileUrl,
        attribution: attributionFor(current.tileUrl),
      })
    }
    if (current.source === 'static' && current.tileUrl) {
      out.push({
        id: 'static',
        source: 'static',
        labelKey: 'journey.studio.mapSourceStatic',
        url: current.tileUrl,
        attribution: attributionFor(current.tileUrl),
      })
    }
  }

  return out
}
