/**
 * The raster tiles the map view draws: the user's https template with Leaflet's
 * placeholders resolved, or OpenStreetMap's tiles for anything it cannot use.
 */
import { OSM_TILES, rasterTiles, tileOrigin } from '../../../../src/nest/mcp-apps/map-tiles.helpers';

import { describe, expect, it } from 'vitest';

describe('rasterTiles', () => {
  it('MAPTILES-001: keeps an https template, pins the {s} shard and drops the {r} marker', () => {
    expect(rasterTiles('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png')).toEqual({
      url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors © CARTO',
      max_zoom: 19,
    });
    expect(rasterTiles(' https://tiles.example.org/{z}/{x}/{y}.png ')).toEqual({
      ...OSM_TILES,
      url: 'https://tiles.example.org/{z}/{x}/{y}.png',
    });
  });

  it('MAPTILES-002: falls back to OpenStreetMap for an unset, plain-http, keyed, partial or broken template', () => {
    for (const template of [
      undefined,
      '',
      42,
      'http://tiles.example.org/{z}/{x}/{y}.png',
      'https://tiles.example.org/{z}/{x}/{y}.png?key={apikey}',
      'https://tiles.example.org/{z}/{x}.png',
      'mapbox://styles/mapbox/streets-v12',
      'https://exa mple/{z}/{x}/{y}',
    ]) {
      expect(rasterTiles(template), String(template)).toEqual(OSM_TILES);
    }
  });

  it('MAPTILES-003: names the origin the tiles load from', () => {
    expect(tileOrigin(OSM_TILES)).toBe('https://tile.openstreetmap.org');
    expect(tileOrigin(rasterTiles('https://{s}.basemaps.cartocdn.com/x/{z}/{x}/{y}.png'))).toBe(
      'https://a.basemaps.cartocdn.com',
    );
  });
});
