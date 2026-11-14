/**
 * KML out (#1866): a trip's places or a list's as pins for Google My Maps.
 * The document is read back through TREK's own KML reader, so what is written
 * is what an importer finds. KML-EXPORT-001 to KML-EXPORT-007.
 */
import { readKmlDocument, writeKmlPins } from '../../../../src/nest/place-import/kml.codec';
import type { ExportedCollectionFile } from '../../../../src/nest/place-import/providers/collection-gpx.provider';
import { exportFilename, type GpxExportPlace } from '../../../../src/nest/place-import/providers/gpx.provider';
import { KmlProvider } from '../../../../src/nest/place-import/providers/kml.provider';

import { describe, expect, it } from 'vitest';

const provider = new KmlProvider();

const tripPlace = (over: Partial<GpxExportPlace>): GpxExportPlace => ({
  name: 'Septime',
  description: null,
  address: null,
  lat: 48.853,
  lng: 2.381,
  route_geometry: null,
  category: null,
  ...over,
});

const listFile = (places: Array<Partial<ExportedCollectionFile['places'][number]>>): ExportedCollectionFile => ({
  format: 'trek.collection',
  version: 1,
  name: 'Paris & more',
  description: null,
  color: null,
  icon: null,
  exported_at: '2026-11-13T10:00:00.000Z',
  labels: [],
  places: places.map((place) => ({ name: 'Spot', lat: null, lng: null, ...place })),
});

describe('writeKmlPins', () => {
  it('KML-EXPORT-001: writes a KML 2.2 document of pins, longitude first, in the schema order', () => {
    const kml = writeKmlPins('Paris', [
      {
        name: 'Septime',
        lat: 48.8530001234,
        lng: 2.381,
        address: '80 Rue de Charonne',
        phone: '+33 1 43 67 38 29',
        description: 'Natural wine',
        data: [{ name: 'category', value: 'Restaurant' }],
      },
    ]);
    expect(kml).toContain('<kml xmlns="http://www.opengis.net/kml/2.2">');
    expect(kml).toContain('<name>Paris</name>');
    expect(kml).toContain('<coordinates>2.381,48.8530001</coordinates>');
    expect(kml).toContain('<Data name="category">');
    const order = ['<name>Septime', '<address>', '<phoneNumber>', '<description>', '<ExtendedData>', '<Point>'];
    const at = order.map((tag) => kml.indexOf(tag));
    expect(at.every((index) => index >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it('KML-EXPORT-002: leaves out what a pin lacks and escapes markup', () => {
    const kml = writeKmlPins('A <b>trip</b>', [{ name: 'Fish & Chips', lat: 51.5, lng: -0.12 }]);
    expect(kml).toContain('Fish &amp; Chips');
    expect(kml).toContain('A &lt;b&gt;trip&lt;/b&gt;');
    for (const tag of ['<address>', '<phoneNumber>', '<description>', '<ExtendedData>']) {
      expect(kml).not.toContain(tag);
    }
  });
});

describe('KmlProvider: a trip as pins', () => {
  it('KML-EXPORT-003: every place with coordinates is a pin an importer reads back, a place with a line at its start', () => {
    const kml = provider.writeTrip('Paris', [
      tripPlace({ name: 'Septime', description: 'Book ahead', address: '80 Rue de Charonne', category: 'Restaurant' }),
      tripPlace({ name: 'Canal walk', lat: 48.87, lng: 2.36, route_geometry: '[[48.87,2.36],[48.88,2.37]]' }),
      tripPlace({ name: 'Somewhere', lat: null, lng: null }),
    ]);
    expect(kml).not.toBeNull();
    const { placemarks } = readKmlDocument(Buffer.from(kml ?? '', 'utf8'));
    expect(placemarks.map((p) => [p.name, p.lat, p.lng])).toEqual([
      ['Septime', 48.853, 2.381],
      ['Canal walk', 48.87, 2.36],
    ]);
    expect(placemarks[0]?.description).toBe('Book ahead');
    expect(kml).toContain('<address>80 Rue de Charonne</address>');
    expect(kml).toContain('<value>Restaurant</value>');
  });

  it('KML-EXPORT-004: a trip without any place with coordinates has nothing to write', () => {
    expect(provider.writeTrip('Paris', [tripPlace({ lat: null, lng: null })])).toBeNull();
    expect(provider.writeTrip('Paris', [])).toBeNull();
  });

  it('KML-EXPORT-005: the file is named like the GPX export, as .kml', () => {
    expect(provider.tripFilename('Trip: "Rome"/2026')).toBe('Trip-Rome-2026.kml');
    expect(provider.tripFilename('///')).toBe('trip.kml');
    expect(exportFilename('Ridge', 'gpx', 'tour')).toBe('Ridge.gpx');
  });
});

describe('KmlProvider: a list as pins', () => {
  it('KML-EXPORT-006: pins carry the address, phone, notes and the list fields, the rest is counted', () => {
    const result = provider.writeCollection(
      listFile([
        {
          name: 'Septime',
          lat: 48.853,
          lng: 2.381,
          address: '80 Rue de Charonne',
          phone: '+33 1 43 67 38 29',
          description: 'Natural wine',
          notes: 'Ask for the counter',
          category: 'Restaurant',
          status: 'revisit',
          labels: ['Dinner', 'Late'],
          website: 'https://septime-charonne.fr',
        },
        { name: 'No pin' },
      ]),
    );
    expect(result).toMatchObject({ name: 'Paris & more', pins: 1, omitted: 1 });
    const { placemarks } = readKmlDocument(Buffer.from(result.kml, 'utf8'));
    expect(placemarks).toHaveLength(1);
    expect(placemarks[0]?.description).toBe('Natural wine\n\nAsk for the counter');
    expect(result.kml).toContain('<name>Paris &amp; more</name>');
    expect(result.kml).toContain('<phoneNumber>+33 1 43 67 38 29</phoneNumber>');
    for (const value of ['Restaurant', 'revisit', 'Dinner, Late', 'https://septime-charonne.fr']) {
      expect(result.kml).toContain(`<value>${value}</value>`);
    }
  });

  it('KML-EXPORT-007: a list without coordinates still answers, with nothing in it and every place counted', () => {
    const result = provider.writeCollection(listFile([{ name: 'A' }, { name: 'B' }]));
    expect(result).toMatchObject({ pins: 0, omitted: 2 });
    expect(readKmlDocument(Buffer.from(result.kml, 'utf8')).placemarks).toEqual([]);
  });
});
