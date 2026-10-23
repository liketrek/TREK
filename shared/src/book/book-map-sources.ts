/**
 * The imagery a book map may be drawn on, besides the bundled outlines.
 *
 * Two sources, chosen because they are honestly printable in a book somebody
 * might sell, and moved here from the Studio
 * (client/src/components/Studio/mapSources.ts) so the server's design tool
 * places the same tiles and the same credit the Travel panel does.
 *
 * - Relief: NASA's Blue Marble shaded relief and bathymetry through GIBS. US
 *   government imagery whose capabilities document says `<ows:Fees>none` and
 *   `<ows:AccessConstraints>none`. Level 8 at most, about 600 metres to the
 *   pixel: a country or a continent, not a city. The path is `{z}/{y}/{x}`
 *   because WMTS names its axes row then column.
 * - Satellite: EOX's Sentinel-2 cloudless mosaic, the 2016 layer, the one the
 *   service releases under CC BY 4.0 (later years are non-commercial).
 *   Attribution is part of the licence, so it travels into the document.
 *
 * Constants, not settings: the planner's own street tiles are not offered for
 * print at all (bulk fetching is against the OSM tile policy), so nothing here
 * depends on how an instance is configured.
 */

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
const RELIEF_LAYER = 'BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8';
const EOX = 'https://tiles.maps.eox.at/wmts/1.0.0';

export const BOOK_RELIEF_TILES = `${GIBS}/${RELIEF_LAYER}/{z}/{y}/{x}.jpeg`;
export const BOOK_SATELLITE_TILES = `${EOX}/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg`;

/** A map source the engine can place: the tile template and the credit the licence asks for. */
export interface BookMapSource {
  url: string;
  attribution: string;
}

export const BOOK_MAP_SOURCES: Record<'relief' | 'satellite', BookMapSource> = {
  relief: { url: BOOK_RELIEF_TILES, attribution: 'NASA EOSDIS GIBS' },
  satellite: { url: BOOK_SATELLITE_TILES, attribution: 'Sentinel-2 cloudless © EOX (CC BY 4.0)' },
};
