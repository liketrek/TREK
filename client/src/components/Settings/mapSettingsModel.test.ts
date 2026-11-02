// FE-MAP-MODEL-001 to FE-MAP-MODEL-004
import { describe, expect, it } from 'vitest';
import { AMAP_ROAD, AMAP_SATELLITE } from '../../constants/mapDefaults';
import { MAP_PRESETS, mapboxOffered, mapPresetsFor } from './mapSettingsModel';

const urls = (list: { url: string }[]) => list.map((p) => p.url);

describe('mapPresetsFor', () => {
  it('FE-MAP-MODEL-001: a self-hosted install offers every preset, Amap included', () => {
    expect(mapPresetsFor(false, false)).toEqual(MAP_PRESETS);
  });

  it('FE-MAP-MODEL-002: a managed install offers Amap only where the operator set it up', () => {
    const without = urls(mapPresetsFor(true, false));
    expect(without).not.toContain(AMAP_ROAD);
    expect(without).not.toContain(AMAP_SATELLITE);
    expect(without).toHaveLength(MAP_PRESETS.length - 2);
    expect(mapPresetsFor(true, true)).toEqual(MAP_PRESETS);
  });
});

describe('mapboxOffered', () => {
  it('FE-MAP-MODEL-003: a self-hosted install always offers Mapbox, the token field follows', () => {
    expect(mapboxOffered(false, null)).toBe(true);
    expect(mapboxOffered(false, '')).toBe(true);
  });

  it('FE-MAP-MODEL-004: a managed install offers Mapbox only with the operator token', () => {
    expect(mapboxOffered(true, undefined)).toBe(false);
    expect(mapboxOffered(true, '')).toBe(false);
    expect(mapboxOffered(true, 'pk.operator')).toBe(true);
  });
});
