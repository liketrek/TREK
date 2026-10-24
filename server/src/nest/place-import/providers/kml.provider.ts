/**
 * A KML or KMZ map file (Google My Maps, Google Earth), read through kml.codec
 * into its placemarks. The file type is the upload's extension, as it has
 * always been; anything else is refused with the route's own message.
 *
 * The Tours import reads the same file for its lines (IO-02): each one a row
 * the GPX import's persistence takes as it takes a track, named the way a GPX
 * track without a name is.
 */
import { createGeometryNamer } from '../geometry-names';
import { readKmlDocument, readKmlLines, unpackKmzToKml } from '../kml.codec';
import type { KmlDocumentRead, KmlTracksRead, PreparedGpxPlace } from '../place-import.types';
import { Injectable } from '@nestjs/common';

const extensionOf = (filename: string) => filename.toLowerCase().split('.').pop();

@Injectable()
export class KmlProvider {
  async readMapFile(fileBuffer: Buffer, filename: string): Promise<KmlDocumentRead> {
    const ext = extensionOf(filename);
    if (ext === 'kmz') return this.readKmz(fileBuffer);
    if (ext === 'kml') return this.readKml(fileBuffer);
    throw new Error(`Unsupported map file format: .${ext}. Please upload a .kml or .kmz file.`);
  }

  async readKmz(kmzBuffer: Buffer): Promise<KmlDocumentRead> {
    return this.readKml(await unpackKmzToKml(kmzBuffer));
  }

  readKml(fileBuffer: Buffer): KmlDocumentRead {
    return readKmlDocument(fileBuffer);
  }

  /** The lines of a .kml or, by its extension, a .kmz file as tour rows, and what the file holds besides. */
  async readTracks(fileBuffer: Buffer, filename: string): Promise<KmlTracksRead> {
    const kml = extensionOf(filename) === 'kmz' ? await unpackKmzToKml(fileBuffer) : fileBuffer;
    const { lines, leftOut } = readKmlLines(kml);
    const nameOf = createGeometryNamer(filename);
    const tracks = lines.map((line): PreparedGpxPlace => {
      // A line has at least two points, so its start is always there.
      const [lat, lng] = line.geometry[0];
      return {
        name: nameOf(line.name, 'KML Track'),
        lat,
        lng,
        description: line.description,
        routeGeometry: JSON.stringify(line.geometry),
      };
    });
    return { tracks, leftOut };
  }
}
