import { getRegionGeoGz, getRegionGeoJson } from '../../../src/nest/atlas/atlas-geo';

import { describe, it, expect } from 'vitest';
import zlib from 'zlib';

// The admin-1 regions behind the Atlas region layer and region lookups, read from the
// committed geoBoundaries files (server/assets/atlas/admin1/<ISO_A2>.geojson.gz), so these
// double as a guard that the bundle ships current sub-national data (#1119).

type RegionFeature = { properties: { iso_a2: string; iso_3166_2: string; name: string } };
type RegionGeo = { type: string; features: RegionFeature[] };

const regionGeo = (codes: string[]) => JSON.parse(getRegionGeoJson(codes).toString('utf8')) as RegionGeo;
const countriesOf = (geo: RegionGeo) => new Set(geo.features.map((f) => f.properties.iso_a2));

describe('getRegionGeoJson', () => {
  it('ATLAS-SVC-017: returns an empty FeatureCollection for a country with no admin-1 features', () => {
    expect(regionGeo(['ZZ'])).toEqual({ type: 'FeatureCollection', features: [] });
  });

  it('ATLAS-SVC-018: returns the current geoBoundaries regions for a country, case-insensitively', () => {
    const result = regionGeo(['no']);

    expect(result.type).toBe('FeatureCollection');
    expect(result.features.length).toBeGreaterThan(0);
    expect(countriesOf(result)).toEqual(new Set(['NO']));

    const names = result.features.map((f) => f.properties.name);
    const codes = result.features.map((f) => f.properties.iso_3166_2);
    // Post-2020 reform is present…
    expect(codes).toContain('NO-34'); // Innlandet
    expect(codes).toContain('NO-46'); // Vestland
    // …and the merged-away pre-2020 counties are gone (the original #1119 bug).
    expect(names).not.toContain('Oppland');
    expect(names).not.toContain('Hordaland');
    expect(names).not.toContain('Sogn og Fjordane');
  });

  it('ATLAS-SVC-048: joins several countries into one FeatureCollection, each once, skipping unknown codes', () => {
    const result = regionGeo(['DE', 'zz', 'FR', 'de']);
    expect(countriesOf(result)).toEqual(new Set(['DE', 'FR']));
    expect(result.features.length).toBe(regionGeo(['DE']).features.length + regionGeo(['FR']).features.length);
  });
});

describe('getRegionGeoGz', () => {
  it("ATLAS-SVC-049: returns the country's gzipped FeatureCollection, case-insensitively", async () => {
    const gz = await getRegionGeoGz('no');
    expect(gz).toBeInstanceOf(Buffer);
    const geo = JSON.parse(zlib.gunzipSync(gz ?? Buffer.alloc(0)).toString('utf8')) as RegionGeo;
    expect(geo.type).toBe('FeatureCollection');
    expect(countriesOf(geo)).toEqual(new Set(['NO']));
  });

  it('ATLAS-SVC-050: returns null for a country without regions and for anything that is not a two-letter code', async () => {
    const codes = ['ZZ', 'NOR', '', '../admin0', '..', 'N/'];
    expect(await Promise.all(codes.map((code) => getRegionGeoGz(code)))).toEqual(codes.map(() => null));
  });
});
