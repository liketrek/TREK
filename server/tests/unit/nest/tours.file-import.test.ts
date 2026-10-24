/**
 * IO-02: the file a Tours import reads. A GPX file goes through the GPX reader
 * without its waypoints, as it always did; a KML or KMZ file, by its
 * extension, through the KML reader for its lines and what it leaves out. A
 * file that cannot be read is a 400 that names its reason, and a file without
 * a line answers GPX's body as before and a format-named one with a code.
 */
import type { PlaceImportService } from '../../../src/nest/place-import/place-import.service';
import { KmlReadError } from '../../../src/nest/place-import/place-import.types';
import { noTrackFound, readTourFile } from '../../../src/nest/tours/tour-file-import.helpers';
import { buildPlaceImportService } from '../../helpers/place-import';
import { HttpException } from '@nestjs/common';

import { describe, expect, it, vi } from 'vitest';

const GPX = Buffer.from(`<gpx><wpt lat="1" lon="2"><name>Hut</name></wpt>
  <trk><trkseg><trkpt lat="48" lon="11"/><trkpt lat="48.01" lon="11.01"/></trkseg></trk></gpx>`);
const KML = Buffer.from(`<kml><Placemark><name>Coast</name>
  <LineString><coordinates>11,48 11.01,48.01</coordinates></LineString></Placemark>
  <Placemark><Polygon/></Placemark></kml>`);

describe('readTourFile', () => {
  it('TOUR-FILE-001: reads a GPX file for its tracks, never its waypoints, and counts nothing left out', async () => {
    const read = await readTourFile(buildPlaceImportService(), GPX, 'ridge.gpx');
    expect(read.rows.map((row) => row.name)).toEqual(['ridge']);
    expect(read.leftOut).toBeUndefined();
  });

  it('TOUR-FILE-002: reads a file without a known extension, or without a name, as GPX as before', async () => {
    expect((await readTourFile(buildPlaceImportService(), GPX, 'track.xml')).rows).toHaveLength(1);
    expect((await readTourFile(buildPlaceImportService(), GPX, undefined)).rows).toHaveLength(1);
  });

  it('TOUR-FILE-003: reads a KML file for its lines and says what it held besides', async () => {
    const read = await readTourFile(buildPlaceImportService(), KML, 'coast.KML');
    expect(read.rows.map((row) => row.name)).toEqual(['Coast']);
    expect(read.leftOut).toEqual({ points: 0, areas: 1, other: 0 });
  });

  it('TOUR-FILE-004: a file it cannot read is a 400 carrying the reason as its code', async () => {
    let error: unknown;
    try {
      await readTourFile(buildPlaceImportService(), Buffer.from('not a zip'), 'trip.kmz');
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(400);
    expect((error as HttpException).getResponse()).toEqual({ error: 'Invalid KMZ archive.', code: 'archive_invalid' });
  });

  it('TOUR-FILE-005: any other failure passes through as it is', async () => {
    const placeImport = {
      readMapFileTracks: vi.fn().mockRejectedValue(new Error('disk gone')),
    } as unknown as PlaceImportService;
    await expect(readTourFile(placeImport, KML, 'coast.kml')).rejects.toThrow('disk gone');
    const refused = { readMapFileTracks: vi.fn().mockRejectedValue(new KmlReadError('archive_too_large', 'Too big')) };
    await expect(readTourFile(refused as unknown as PlaceImportService, KML, 'x.kmz')).rejects.toMatchObject({
      code: 'tour_file_unreadable',
      message: 'Too big',
    });
  });
});

describe('noTrackFound', () => {
  it('TOUR-FILE-006: answers a GPX file with the body the route has always sent', () => {
    const error = noTrackFound('ridge.gpx');
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toEqual({ error: 'No track or route found in GPX file' });
    expect(noTrackFound(undefined).getResponse()).toEqual({ error: 'No track or route found in GPX file' });
  });

  it('TOUR-FILE-007: names the format of a KML or KMZ file and carries the code', () => {
    expect(noTrackFound('pins.kml').getResponse()).toEqual({ error: 'No line found in KML file', code: 'no_track' });
    expect(noTrackFound('pins.kmz').getResponse()).toEqual({ error: 'No line found in KMZ file', code: 'no_track' });
  });
});
