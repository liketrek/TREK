/**
 * IO-02: a KML or KMZ file read for the lines a Tours import stores. Each line
 * becomes one row in the shape the GPX import hands its persistence, named
 * after its placemark or, without a name, after the file as a GPX track is;
 * a KMZ is unpacked first, and what the file holds besides is counted.
 */
import { createGeometryNamer } from '../../../../src/nest/place-import/geometry-names';
import { KmlReadError } from '../../../../src/nest/place-import/place-import.types';
import { KmlProvider } from '../../../../src/nest/place-import/providers/kml.provider';
import { buildPlaceImportService } from '../../../helpers/place-import';

import archiver from 'archiver';
import { PassThrough } from 'stream';
import { describe, expect, it } from 'vitest';

const KML = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark><name>Coast</name><description>Windy</description>
    <LineString><altitudeMode>absolute</altitudeMode><coordinates>11,48,5 11.01,48.01,9</coordinates></LineString>
  </Placemark>
  <Placemark><LineString><coordinates>12,49 12.01,49.01</coordinates></LineString></Placemark>
  <Placemark><LineString><coordinates>13,50 13.01,50.01</coordinates></LineString></Placemark>
  <Placemark><name>Hut</name><Point><coordinates>12,49</coordinates></Point></Placemark>
</Document></kml>`;

/** A KMZ archive holding these entries. */
async function kmz(entries: Record<string, string>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const output = new PassThrough();
  output.on('data', (chunk: Buffer) => chunks.push(chunk));
  const archive = archiver('zip', { zlib: { level: 1 } });
  archive.pipe(output);
  for (const [name, content] of Object.entries(entries)) archive.append(Buffer.from(content), { name });
  await archive.finalize();
  return Buffer.concat(chunks);
}

describe('KmlProvider.readTracks', () => {
  const provider = new KmlProvider();

  it('KML-TRACKS-001: makes a row of each line, starting where it starts, and counts the pin left out', async () => {
    const read = await provider.readTracks(Buffer.from(KML), 'alps.kml');
    expect(read.tracks).toEqual([
      {
        name: 'Coast',
        lat: 48,
        lng: 11,
        description: 'Windy',
        routeGeometry: JSON.stringify([
          [48, 11, 5],
          [48.01, 11.01, 9],
        ]),
      },
      { name: 'alps', lat: 49, lng: 12, description: null, routeGeometry: '[[49,12],[49.01,12.01]]' },
      { name: 'alps 2', lat: 50, lng: 13, description: null, routeGeometry: '[[50,13],[50.01,13.01]]' },
    ]);
    expect(read.leftOut).toEqual({ points: 1, areas: 0, other: 0 });
  });

  it('KML-TRACKS-002: unpacks a KMZ by its extension and reads its doc.kml', async () => {
    const archive = await kmz({ 'files/notes.kml': '<kml/>', 'doc.kml': KML, 'files/photo.jpg': 'jpeg' });
    const read = await provider.readTracks(archive, 'Alps.KMZ');
    expect(read.tracks.map((track) => track.name)).toEqual(['Coast', 'Alps', 'Alps 2']);
  });

  it('KML-TRACKS-003: an archive without a KML file is refused with its reason', async () => {
    const archive = await kmz({ 'photo.jpg': 'jpeg' });
    await expect(provider.readTracks(archive, 'trip.kmz')).rejects.toBeInstanceOf(KmlReadError);
    await expect(provider.readTracks(archive, 'trip.kmz')).rejects.toMatchObject({ reason: 'archive_without_kml' });
  });

  it('KML-TRACKS-004: the facade hands the call to the provider', async () => {
    const read = await buildPlaceImportService().readMapFileTracks(Buffer.from(KML), 'alps.kml');
    expect(read.tracks).toHaveLength(3);
  });
});

describe('createGeometryNamer', () => {
  it('GEO-NAME-001: keeps a line its own name and numbers the unnamed ones after the file', () => {
    const name = createGeometryNamer('walks/harbour.gpx');
    expect([name('Pier', 'Track'), name(null, 'Track'), name(null, 'Track')]).toEqual([
      'Pier',
      'walks/harbour',
      'walks/harbour 2',
    ]);
  });

  it('GEO-NAME-002: without a file name falls back to the label it is given', () => {
    const name = createGeometryNamer('  ');
    expect([name(null, 'KML Track'), name(null, 'KML Track')]).toEqual(['KML Track', 'KML Track 2']);
    expect(createGeometryNamer('.kml')(null, 'Track')).toBe('.kml');
  });
});
