import { describe, expect, it } from 'vitest';
import { OFM_DARK, OFM_POSITRON } from '../../constants/mapDefaults';
import { isOfflineForbiddenTemplate } from '../../utils/tileUrl';
import { glWorksOffline, leafletWorksOffline, offlineStyleFor } from './offlineBasemap';

describe('offlineBasemap', () => {
  it('picks the stored style for the colour scheme', () => {
    expect(offlineStyleFor(false)).toBe(OFM_POSITRON);
    expect(offlineStyleFor(true)).toBe(OFM_DARK);
  });

  it('knows OpenStreetMap standard tiles may not be stored, sharded or not', () => {
    expect(isOfflineForbiddenTemplate('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')).toBe(true);
    expect(isOfflineForbiddenTemplate('https://tile.openstreetmap.org/{z}/{x}/{y}.png')).toBe(true);
    expect(isOfflineForbiddenTemplate('https://tile.openstreetmap.de/{z}/{x}/{y}.png')).toBe(false);
    expect(isOfflineForbiddenTemplate('not a url')).toBe(false);
  });

  it('lets only MapLibre on a stored style draw offline as configured', () => {
    expect(glWorksOffline('maplibre-gl', OFM_POSITRON)).toBe(true);
    expect(glWorksOffline('maplibre-gl', OFM_DARK)).toBe(true);
    // The default MapLibre style is Liberty, whose sprite and glyphs are not stored.
    expect(glWorksOffline('maplibre-gl', '')).toBe(false);
    expect(glWorksOffline('mapbox-gl', OFM_POSITRON)).toBe(false);
  });

  it('keeps a stored raster template on the web, never in the iOS app or for OSM', () => {
    expect(leafletWorksOffline(OFM_POSITRON, true)).toBe(true);
    expect(leafletWorksOffline('https://tiles.openfreemap.org/styles/liberty', false)).toBe(false);
    expect(leafletWorksOffline('https://tiles.example.com/{z}/{x}/{y}.png', false)).toBe(true);
    expect(leafletWorksOffline('https://tiles.example.com/{z}/{x}/{y}.png', true)).toBe(false);
    expect(leafletWorksOffline('https://tile.openstreetmap.org/{z}/{x}/{y}.png', false)).toBe(false);
  });
});
