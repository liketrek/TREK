/**
 * A KML or KMZ map file (Google My Maps, Google Earth), read through kml.codec
 * into its placemarks. The file type is the upload's extension, as it has
 * always been; anything else is refused with the route's own message.
 */
import { readKmlDocument, unpackKmzToKml } from '../kml.codec';
import type { KmlDocumentRead } from '../place-import.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KmlProvider {
  async readMapFile(fileBuffer: Buffer, filename: string): Promise<KmlDocumentRead> {
    const ext = filename.toLowerCase().split('.').pop();
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
}
