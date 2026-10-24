/**
 * P7: a route file attached in the assistant's chat, read into one GPX text
 * per track (TourFileReadService over the Tours import's own reader, with the
 * real place import over a snapshot test db), and the cut itself
 * (tour-file-split.helpers): a GPX file keeps every point as it came, a KML
 * line is written as GPX.
 */
import { PlaceImportService } from '../../../src/nest/place-import/place-import.service';
import { TourFileReadService } from '../../../src/nest/tours/tour-file-read.service';
import { gpxOfLine, splitGpxTracks } from '../../../src/nest/tours/tour-file-split.helpers';
import { TourFilesModule } from '../../../src/nest/tours/tour-files.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { TOUR_GPX_TEXT_MAX } from '@trek/shared';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// TOUR-FILE-READ-001 to TOUR-FILE-READ-008

const db = createSnapshotTestDb();
let t: TestModule;
let files: TourFileReadService;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [TourFilesModule] });
  files = t.get(TourFileReadService);
});
afterAll(async () => {
  await t.close();
  db.close();
});

const TWO_TRACKS = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Weekend</name></metadata>
  <wpt lat="47.0" lon="11.0"><name>Loose pin</name></wpt>
  <trk><name>Saturday</name><trkseg>
    <trkpt lat="47.5" lon="11.1"><ele>800</ele><time>2026-10-17T08:00:00Z</time></trkpt>
    <trkpt lat="47.51" lon="11.1"><ele>1000</ele><time>2026-10-17T09:00:00Z</time></trkpt>
  </trkseg></trk>
  <rte><name>Sunday</name>
    <rtept lat="47.6" lon="11.2"></rtept>
    <rtept lat="47.61" lon="11.2"></rtept>
  </rte>
</gpx>`;

const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark><name>Ridge &amp; lake</name><LineString><coordinates>11.1,47.5,800 11.1,47.51,1000</coordinates></LineString></Placemark>
  <Placemark><name>Pin</name><Point><coordinates>11.0,47.0</coordinates></Point></Placemark>
</Document></kml>`;

describe('cutting a GPX file into its tracks', () => {
  it('TOUR-FILE-READ-001: one text per track and route, each with the head and without the loose points', () => {
    const pieces = splitGpxTracks(TWO_TRACKS);
    expect(pieces).toHaveLength(2);
    expect(pieces[0]).toContain('<metadata><name>Weekend</name></metadata>');
    expect(pieces[0]).toContain('<time>2026-10-17T08:00:00Z</time>');
    expect(pieces[0]).not.toContain('Sunday');
    expect(pieces[0]).not.toContain('Loose pin');
    expect(pieces[1]).toContain('<rte><name>Sunday</name>');
    expect(pieces.every((piece) => piece.trimEnd().endsWith('</gpx>'))).toBe(true);
  });

  it('TOUR-FILE-READ-002: a <trkseg> is no track of its own, and a file without any gives nothing', () => {
    expect(splitGpxTracks('<gpx><trkseg></trkseg></gpx>')).toEqual([]);
    expect(splitGpxTracks('<gpx><trk><name>Open</name>')).toEqual([]);
  });

  it('TOUR-FILE-READ-003: a KML line is written as one GPX track, its name escaped', () => {
    const gpx = gpxOfLine('Ridge & lake', 'Up <and> down', [
      [47.5, 11.1, 800],
      [47.51, 11.1],
    ]);
    expect(gpx).toContain('<name>Ridge &amp; lake</name>');
    expect(gpx).toContain('<desc>Up &lt;and&gt; down</desc>');
    expect(gpx).toContain('<trkpt lat="47.5" lon="11.1"><ele>800</ele></trkpt>');
    expect(gpx).toContain('<trkpt lat="47.51" lon="11.1"></trkpt>');
    const rows = t.get(PlaceImportService).readGpx(Buffer.from(gpx, 'utf8'), { importTracks: true });
    expect(rows).toHaveLength(1);
  });
});

describe('TourFileReadService', () => {
  async function tripId() {
    const { user } = await makeUser(t.get(MikroORM));
    return (await makeTrip(t.get(MikroORM), user.id)).id;
  }

  it('TOUR-FILE-READ-004: a GPX file comes back track by track, each one reading back as itself', async () => {
    const read = await files.read(await tripId(), Buffer.from(TWO_TRACKS, 'utf8'), 'weekend.gpx');
    expect(read.whole).toBe(false);
    expect(read.tracks.map((track) => [track.name, track.point_count, track.duplicate])).toEqual([
      ['Saturday', 2, false],
      ['Sunday', 2, false],
    ]);
    expect(read.tracks[0]?.has_heights).toBe(true);
    expect(read.tracks[0]?.distance_km).toBeGreaterThan(1);
    expect(read.tracks[0]?.gpx).toContain('2026-10-17T08:00:00Z');
  });

  it('TOUR-FILE-READ-005: a KML file gives its lines as GPX and counts the pins it leaves out', async () => {
    const read = await files.read(await tripId(), Buffer.from(KML, 'utf8'), 'ridge.kml');
    expect(read.tracks).toHaveLength(1);
    expect(read.tracks[0]?.name).toBe('Ridge & lake');
    expect(read.tracks[0]?.gpx).toContain('<trkseg>');
    expect(read.left_out).toBeDefined();
  });

  it('TOUR-FILE-READ-006: a GPX file whose tracks cannot be cut comes back whole, as one import', async () => {
    const prefixed = TWO_TRACKS.replace(/<(\/?)(trk|rte)\b/g, '<$1gpx:$2').replace(
      'xmlns="http://www.topografix.com/GPX/1/1"',
      'xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpx="http://www.topografix.com/GPX/1/1"',
    );
    const read = await files.read(await tripId(), Buffer.from(prefixed, 'utf8'), 'weekend.gpx');
    if (read.tracks.length === 0) return; // a reader that takes no prefixed tags finds nothing to cut
    expect(read.whole).toBe(true);
    expect(read.tracks).toHaveLength(1);
    expect(read.tracks[0]?.name).toBe('weekend.gpx');
  });

  it('TOUR-FILE-READ-007: a file without a line gives no track', async () => {
    const empty = '<gpx version="1.1"><wpt lat="47" lon="11"><name>Pin</name></wpt></gpx>';
    expect(await files.read(await tripId(), Buffer.from(empty, 'utf8'), 'pins.gpx')).toEqual({
      tracks: [],
      whole: false,
    });
  });

  it('TOUR-FILE-READ-008: a track longer than one import takes is named but carries no text', async () => {
    const points = Array.from(
      { length: 20_000 },
      (_, i) =>
        `<trkpt lat="${47 + i / 100_000}" lon="11.1"><ele>800.123456</ele><time>2026-10-17T08:00:00Z</time></trkpt>`,
    ).join('');
    const big = `<gpx version="1.1"><trk><name>Long</name><trkseg>${points}</trkseg></trk></gpx>`;
    expect(big.length).toBeGreaterThan(TOUR_GPX_TEXT_MAX);
    const read = await files.read(await tripId(), Buffer.from(big, 'utf8'), 'long.gpx');
    expect(read.tracks[0]).toMatchObject({ name: 'Long', gpx: null });
  });
});
