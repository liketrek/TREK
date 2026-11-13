/**
 * A KML or KMZ map file (Google My Maps, Google Earth), read through kml.codec
 * into its placemarks. The file type is the upload's extension, as it has
 * always been; anything else is refused with the route's own message.
 *
 * The Tours import reads the same file for its lines (IO-02): each one a row
 * the GPX import's persistence takes as it takes a track, named the way a GPX
 * track without a name is.
 *
 * Out, a trip's places or a list's become pins for Google My Maps (#1866). A
 * list of places is what Google Maps keeps, so every place with coordinates is
 * one pin, a place with a line included at its start; the lines themselves
 * leave as GPX.
 */
import { createGeometryNamer } from '../geometry-names';
import { readKmlDocument, readKmlLines, unpackKmzToKml, writeKmlPins, type KmlPinOut } from '../kml.codec';
import type { KmlDocumentRead, KmlTracksRead, PreparedGpxPlace } from '../place-import.types';
import { textOf, xmlText } from '../xml-text';
import type { ExportedCollectionFile } from './collection-gpx.provider';
import { exportFilename, type GpxExportPlace } from './gpx.provider';
import { Injectable } from '@nestjs/common';
import type { CollectionKmlExport } from '@trek/shared';

const extensionOf = (filename: string) => filename.toLowerCase().split('.').pop();

/** The text under a pin's name: what the place says about itself, then the notes, each on lines of their own. */
function pinDescription(...parts: Array<string | null | undefined>): string | undefined {
  return textOf(
    parts
      .map((part) => part?.trim())
      .filter(Boolean)
      .join('\n\n'),
  );
}

/** Named values as Google My Maps shows them in its table; an empty one is left out. */
function pinData(entries: Array<[string, string | null | undefined]>): KmlPinOut['data'] {
  return entries.flatMap(([name, value]) => {
    const text = textOf(value);
    return text ? [{ name, value: text }] : [];
  });
}

/** A trip's place as a pin, or nothing for one without coordinates. */
function tripPin(place: GpxExportPlace): KmlPinOut | null {
  if (place.lat == null || place.lng == null) return null;
  return {
    name: xmlText(place.name),
    lat: place.lat,
    lng: place.lng,
    address: textOf(place.address),
    description: pinDescription(place.description),
    data: pinData([['category', place.category]]),
  };
}

/** A list's place as a pin, or nothing for one without coordinates. */
function listPin(place: ExportedCollectionFile['places'][number]): KmlPinOut | null {
  if (place.lat == null || place.lng == null) return null;
  return {
    name: xmlText(place.name),
    lat: place.lat,
    lng: place.lng,
    address: textOf(place.address),
    phone: textOf(place.phone),
    description: pinDescription(place.description, place.notes),
    data: pinData([
      ['category', place.category],
      ['status', place.status],
      ['labels', place.labels?.join(', ')],
      ['website', place.website],
    ]),
  };
}

const isPin = (pin: KmlPinOut | null): pin is KmlPinOut => pin !== null;

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

  /** A trip's places as pins; null when none has coordinates, so the caller refuses instead of handing over nothing. */
  writeTrip(tripTitle: string, places: GpxExportPlace[]): string | null {
    const pins = places.map(tripPin).filter(isPin);
    return pins.length ? writeKmlPins(xmlText(tripTitle), pins) : null;
  }

  tripFilename(tripTitle: string): string {
    return exportFilename(tripTitle, 'kml');
  }

  /** A list as pins, written from the list file the JSON export returns, so it carries no more than that file. */
  writeCollection(file: ExportedCollectionFile): CollectionKmlExport {
    const pins = file.places.map(listPin).filter(isPin);
    return {
      name: file.name,
      kml: writeKmlPins(xmlText(file.name), pins),
      pins: pins.length,
      omitted: file.places.length - pins.length,
    };
  }
}
