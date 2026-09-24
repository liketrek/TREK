/**
 * GPX writer unit tests. The builder is pure, so everything here runs without a
 * DB or a Nest container. The last block parses its own output back with the very
 * parser the importer uses, which is the closest thing to "a real reader can open
 * this" that does not need a device.
 */
import { describe, it, expect } from 'vitest';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { buildGpx, gpxFilename, type GpxExportPlace, type GpxExportDay } from '../../../src/nest/places/gpx-export.helpers';

const place = (over: Partial<GpxExportPlace> = {}): GpxExportPlace => ({
  name: 'Somewhere', description: null, address: null, lat: 48.8566, lng: 2.3522,
  route_geometry: null, category: null, ...over,
});

const day = (over: Partial<GpxExportDay> = {}): GpxExportDay => ({
  dayNumber: 1, date: '2026-05-01', title: null, points: [], ...over,
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['wpt', 'trkpt', 'rtept', 'trk', 'trkseg', 'rte'].includes(name),
});

describe('buildGpx', () => {
  it('writes a place without geometry as a waypoint, with its category as <sym>', () => {
    const gpx = buildGpx({
      tripTitle: 'Paris',
      places: [place({ name: 'Louvre', description: 'Go early', address: 'Rue de Rivoli', category: 'Museum' })],
      days: [],
    })!;

    expect(gpx).toContain('<wpt lat="48.8566" lon="2.3522">');
    expect(gpx).toContain('<name>Louvre</name>');
    expect(gpx).toContain('<sym>Museum</sym>');
    // Description first, address after: a device usually shows only the first line.
    expect(gpx).toContain('<desc>Go early, Rue de Rivoli</desc>');
  });

  it('writes a place carrying geometry as a track, elevation included', () => {
    const gpx = buildGpx({
      tripTitle: 'Hike',
      places: [place({ name: 'Ridge', route_geometry: JSON.stringify([[47.1, 11.2, 1830], [47.11, 11.21, 1902]]) })],
      days: [],
    })!;

    expect(gpx).toContain('<trkpt lat="47.1" lon="11.2">');
    expect(gpx).toContain('<ele>1830</ele>');
    expect(gpx).toContain('<ele>1902</ele>');
  });

  it('does not also drop a waypoint on the start of a track', () => {
    const gpx = buildGpx({
      tripTitle: 'Hike',
      places: [place({ name: 'Ridge', route_geometry: JSON.stringify([[47.1, 11.2], [47.11, 11.21]]) })],
      days: [],
    })!;

    expect(gpx).not.toContain('<wpt');
  });

  it('writes each planned day as a route of its stops in order', () => {
    const gpx = buildGpx({
      tripTitle: 'Rome',
      places: [],
      days: [day({
        dayNumber: 2, date: '2026-05-02', title: 'Ancient city',
        points: [
          { name: 'Colosseum', lat: 41.89, lng: 12.49 },
          { name: 'Forum', lat: 41.892, lng: 12.485 },
        ],
      })],
    })!;

    expect(gpx).toContain('<name>2. Ancient city</name>');
    const order = [gpx.indexOf('Colosseum'), gpx.indexOf('Forum')];
    expect(order[0]).toBeLessThan(order[1]);
  });

  it('falls back to the date, then the bare number, when a day has no title', () => {
    const dated = buildGpx({ tripTitle: 'T', places: [], days: [day({ dayNumber: 3, points: [{ name: 'A', lat: 1, lng: 1 }, { name: 'B', lat: 2, lng: 2 }] })] })!;
    expect(dated).toContain('<name>3. 2026-05-01</name>');

    const bare = buildGpx({ tripTitle: 'T', places: [], days: [day({ dayNumber: 4, date: null, points: [{ name: 'A', lat: 1, lng: 1 }, { name: 'B', lat: 2, lng: 2 }] })] })!;
    expect(bare).toContain('<name>4</name>');
  });

  it('skips a day with a single stop — one point is not a route', () => {
    const gpx = buildGpx({
      tripTitle: 'T',
      places: [place()],
      days: [day({ points: [{ name: 'Only stop', lat: 1, lng: 1 }] })],
    })!;

    expect(gpx).not.toContain('<rte>');
  });

  it('honours each flag on its own', () => {
    const input = {
      tripTitle: 'T',
      places: [place({ name: 'Point' }), place({ name: 'Line', route_geometry: JSON.stringify([[1, 1], [2, 2]]) })],
      days: [day({ points: [{ name: 'A', lat: 1, lng: 1 }, { name: 'B', lat: 2, lng: 2 }] })],
    };

    const noWpt = buildGpx(input, { waypoints: false })!;
    expect(noWpt).not.toContain('<wpt');
    expect(noWpt).toContain('<trk>');

    const noTrk = buildGpx(input, { tracks: false })!;
    expect(noTrk).not.toContain('<trk>');
    // With tracks off, the geometry place still has coordinates, so it lands as a waypoint.
    expect(noTrk).toContain('<name>Line</name>');

    const noRoutes = buildGpx(input, { dayRoutes: false })!;
    expect(noRoutes).not.toContain('<rte>');
  });

  it('returns null when the selection produced nothing', () => {
    expect(buildGpx({ tripTitle: 'Empty', places: [], days: [] })).toBeNull();
    expect(buildGpx({ tripTitle: 'T', places: [place({ lat: null, lng: null })], days: [] })).toBeNull();
    expect(buildGpx({ tripTitle: 'T', places: [place()], days: [] }, { waypoints: false })).toBeNull();
  });

  it('ignores geometry that is not a usable coordinate list', () => {
    const garbage = ['not json', '{}', '[]', JSON.stringify([['a', 'b']]), JSON.stringify([[1]])];
    for (const route_geometry of garbage) {
      // Falls through to the waypoint branch rather than emitting an empty <trkseg>.
      const gpx = buildGpx({ tripTitle: 'T', places: [place({ route_geometry })], days: [] })!;
      expect(gpx).not.toContain('<trk>');
      expect(gpx).toContain('<wpt');
    }
  });

  it('produces a document the GPX parser reads back', () => {
    const gpx = buildGpx({
      tripTitle: 'Round trip',
      places: [
        place({ name: 'Waypoint', lat: 10.5, lng: -3.25 }),
        place({ name: 'Track', route_geometry: JSON.stringify([[1.5, 2.5], [1.6, 2.6]]) }),
      ],
      days: [day({ points: [{ name: 'A', lat: 3, lng: 4 }, { name: 'B', lat: 5, lng: 6 }] })],
    })!;

    expect(XMLValidator.validate(gpx)).toBe(true);

    const parsed = parser.parse(gpx).gpx;
    expect(parsed['@_version']).toBe('1.1');
    expect(parsed.metadata.name).toBe('Round trip');
    expect(parsed.wpt).toHaveLength(1);
    // Attributes come back as strings — the importer runs them through parseFloat too.
    expect(parsed.wpt[0]['@_lat']).toBe('10.5');
    expect(parsed.trk[0].trkseg[0].trkpt).toHaveLength(2);
    expect(parsed.rte[0].rtept).toHaveLength(2);
  });

  it('escapes markup in names instead of breaking the document', () => {
    const gpx = buildGpx({ tripTitle: 'T', places: [place({ name: 'Bar & Grill <best>' })], days: [] })!;
    expect(XMLValidator.validate(gpx)).toBe(true);
    expect(parser.parse(gpx).gpx.wpt[0].name).toBe('Bar & Grill <best>');
  });
});

describe('gpxFilename', () => {
  it('keeps a plain title readable', () => {
    expect(gpxFilename('Berlin 2026')).toBe('Berlin-2026.gpx');
  });

  it('drops what a filesystem or a header would choke on', () => {
    expect(gpxFilename('Trip: "Rome"/2026 <draft>')).toBe('Trip-Rome-2026-draft.gpx');
  });

  it('falls back when a title leaves nothing behind', () => {
    expect(gpxFilename('///')).toBe('trip.gpx');
    expect(gpxFilename('')).toBe('trip.gpx');
  });

  // Header safety moved into contentDisposition() (#2165) — the filename may
  // keep the title's own script instead of tripping setHeader's Latin-1 check.
  it('keeps a non-ASCII title as typed', () => {
    expect(gpxFilename('沖縄 4泊5日')).toBe('沖縄-4泊5日.gpx');
    // No NFKD any more: the composed é stays composed instead of decaying into
    // 'e' + a combining mark that only looked stripped.
    expect(gpxFilename('Café')).toBe('Café.gpx');
  });

  it('trims on codepoint boundaries, never through the middle of an emoji', () => {
    expect(gpxFilename('\u{1F5FE}'.repeat(70))).toBe('\u{1F5FE}'.repeat(60) + '.gpx');
  });
});
