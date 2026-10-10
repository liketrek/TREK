/**
 * PlaceImportService: the facade the importing domains call. Each read and
 * write reaches its provider, the KML/KMZ upload is dispatched by extension,
 * and a directions link's named stops are placed through the geocoder the
 * caller hands in, a failed or missing answer costing only that stop.
 */
import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, afterEach } from 'vitest';

const { mockCheckSsrf } = vi.hoisted(() => ({ mockCheckSsrf: vi.fn(async (_url: string) => ({ allowed: true })) }));
vi.mock('../../../../src/utils/ssrfGuard', () => ({
  checkSsrf: mockCheckSsrf,
  safeFetchFollow: vi.fn(),
  SsrfBlockedError: class SsrfBlockedError extends Error {},
}));

import { buildPlaceImportService } from '../../../helpers/place-import';
import { gpxGeometryParser, gpxTextParser, createGpxParser, writeGpx } from '../../../../src/nest/place-import/gpx.codec';
import { COLLECTION_FILE_FORMAT, COLLECTION_FILE_VERSION } from '@trek/shared';

const KMZ_FIXTURE = path.join(__dirname, '../../../fixtures/test.kmz');

afterEach(() => {
  vi.unstubAllGlobals();
  mockCheckSsrf.mockReset();
  mockCheckSsrf.mockResolvedValue({ allowed: true });
});

describe('PlaceImportService: directions', () => {
  const ROUTE = 'https://www.google.com/maps/dir/Berlin/52.52,13.405/Dresden/Prague/';

  it('places named stops through the geocoder it is handed, coordinates as they stand', async () => {
    const geocode = vi.fn(async (q: string) => (q === 'Berlin' ? { lat: 52.5, lng: 13.4 } : q === 'Dresden' ? null : Promise.reject(new Error('down'))));
    const out = await buildPlaceImportService().readGoogleDirections(ROUTE, geocode);
    expect(geocode).toHaveBeenCalledTimes(3);
    expect(out).toEqual({
      places: [
        { name: 'Berlin', lat: 52.5, lng: 13.4, notes: null, googleFtid: null },
        { name: '52.52000, 13.40500', lat: 52.52, lng: 13.405, notes: null, googleFtid: null },
      ],
      unplaceable: 2,
    });
  });

  it('refuses a route of which fewer than two stops could be placed', async () => {
    const out = await buildPlaceImportService().readGoogleDirections('https://www.google.com/maps/dir/A/B/', async () => null);
    expect(out).toEqual({ error: 'None of the stops in that link could be placed on the map.', status: 400 });
  });

  it('hands a provider refusal straight back without geocoding', async () => {
    mockCheckSsrf.mockResolvedValueOnce({ allowed: false });
    const geocode = vi.fn();
    expect(await buildPlaceImportService().readGoogleDirections(ROUTE, geocode)).toEqual({ error: 'URL is not allowed', status: 400 });
    expect(geocode).not.toHaveBeenCalled();
  });
});

describe('PlaceImportService: files and lists', () => {
  const svc = buildPlaceImportService();

  it('dispatches a map upload by its extension, and refuses anything else', async () => {
    const kml = Buffer.from('<kml><Placemark><name>A</name><Point><coordinates>13.4,52.5</coordinates></Point></Placemark></kml>');
    expect((await svc.readMapFile(kml, 'trip.KML')).placemarks).toHaveLength(1);
    expect((await svc.readMapFile(fs.readFileSync(KMZ_FIXTURE), 'trip.kmz')).summary.totalPlacemarks).toBeGreaterThan(0);
    await expect(svc.readMapFile(kml, 'trip.txt')).rejects.toThrow('Unsupported map file format: .txt. Please upload a .kml or .kmz file.');
  });

  it('reads a trip GPX and writes one back under a filename', () => {
    const gpx = Buffer.from('<gpx><wpt lat="1" lon="2"><name>Here</name></wpt></gpx>');
    expect(svc.readGpx(gpx)).toEqual([{ lat: 1, lng: 2, name: 'Here', description: null }]);
    const doc = svc.writeTripGpx({ tripTitle: 'T', places: [{ name: 'Here', description: null, address: null, lat: 1, lng: 2, route_geometry: null, category: null }], days: [] });
    expect(doc).toContain('<wpt lat="1" lon="2">');
    expect(svc.tripGpxFilename('My Trip')).toBe('My-Trip.gpx');
  });

  it('writes a list as GPX and reads it back', () => {
    const exported = svc.writeCollectionGpx({
      format: COLLECTION_FILE_FORMAT,
      version: COLLECTION_FILE_VERSION,
      name: 'Coffee',
      exported_at: '2026-01-01T00:00:00.000Z',
      places: [{ name: 'Bar', lat: 1, lng: 2 }],
    } as never);
    expect(exported.waypoints).toBe(1);
    expect(svc.readCollectionGpx(exported.gpx, 'coffee.gpx').file.places[0]).toMatchObject({ name: 'Bar', lat: 1, lng: 2 });
  });

  it('answers a blocked list link before fetching anything', async () => {
    mockCheckSsrf.mockResolvedValue({ allowed: false });
    expect(await svc.readGoogleList('https://www.google.com/maps/placelists/list/x')).toEqual({ error: 'URL is not allowed', status: 400 });
    expect(await svc.readNaverList('https://map.naver.com/p/favorite/myPlace/folder/x')).toEqual({ error: 'URL is not allowed', status: 400 });
  });
});

describe('gpx.codec', () => {
  it('reads the same document two ways: geometry parses values, text keeps them', () => {
    const xml = '<gpx><wpt lat="1" lon="2"><name>007</name><link href="a"/><link href="b"/></wpt></gpx>';
    const geometry = gpxGeometryParser.parse(xml).gpx.wpt[0];
    const text = gpxTextParser.parse(xml).gpx.wpt[0];
    expect(geometry.name).toBe(7);
    expect(text.name).toBe('007');
    // `link` repeats only for the list reader.
    expect(Array.isArray(text.link)).toBe(true);
    expect(Array.isArray(createGpxParser('geometry').parse('<gpx><wpt><link href="a"/></wpt></gpx>').gpx.wpt[0].link)).toBe(false);
  });

  it('writes one envelope: namespaces after the default one, empty element lists left out', () => {
    const doc = writeGpx({ namespaces: { trek: 'https://trek.example/gpx' }, metadata: { name: 'X' }, wpt: [], trk: [{ name: 'T' }] });
    expect(doc).toContain('xmlns="http://www.topografix.com/GPX/1/1" xmlns:trek="https://trek.example/gpx" xmlns:xsi=');
    expect(doc).not.toContain('<wpt');
    expect(doc).toContain('<trk>');
  });
});
