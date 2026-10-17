import {
  decodeUtf8WithWarning,
  extractKmlPlacemarkNodes,
  KMZ_DECOMPRESSED_SIZE_LIMIT,
  parseKmlPointCoordinates,
  parsePlacemarkNode,
  readKmlDocument,
  sanitizeKmlDescription,
  unpackKmzToKml,
} from '../../../../src/nest/place-import/kml.codec';
import { buildCategoryNameLookup, resolveCategoryIdForFolder } from '../../../../src/nest/places/places.helpers';

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('kmlImportUtils', () => {
  it('sanitizes HTML descriptions with br to newline', () => {
    const input = 'Line 1<br>Line <b>2</b> &amp; more';
    const output = sanitizeKmlDescription(input);
    expect(output).toBe('Line 1\nLine 2 & more');
  });

  it('unwraps CDATA sections before stripping tags', () => {
    const input = '<![CDATA[Great spot<br>for photos <b>and</b> skyline.]]>';
    expect(sanitizeKmlDescription(input)).toBe('Great spot\nfor photos and skyline.');
  });

  it('parses KML coordinate order lng,lat,alt', () => {
    const parsed = parseKmlPointCoordinates('13.4050,52.5200,15');
    expect(parsed).toEqual({ lat: 52.52, lng: 13.405 });
  });

  it('extracts placemarks from nested folders', () => {
    const root = {
      Document: {
        Folder: {
          name: 'Parent',
          Folder: {
            name: 'Child',
            Placemark: { name: 'Nested', Point: { coordinates: '13.4,52.5,0' } },
          },
        },
      },
    };

    const nodes = extractKmlPlacemarkNodes(root);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].folderName).toBe('Child');

    const parsed = parsePlacemarkNode(nodes[0]);
    expect(parsed.name).toBe('Nested');
    expect(parsed.lat).toBe(52.5);
    expect(parsed.lng).toBe(13.4);
  });

  it('builds exact case-insensitive category lookup', () => {
    const lookup = buildCategoryNameLookup([
      { id: 3, name: 'Museums' },
      { id: 4, name: 'Parks' },
    ]);

    expect(resolveCategoryIdForFolder('museums', lookup)).toBe(3);
    expect(resolveCategoryIdForFolder('Museum', lookup)).toBeNull();
    expect(resolveCategoryIdForFolder('parks', lookup)).toBe(4);
  });

  it('decodes non-BMP decimal HTML entities (emoji)', () => {
    // &#128512; = U+1F600 = 😀 — requires String.fromCodePoint, not fromCharCode
    expect(sanitizeKmlDescription('&#128512;')).toBe('😀');
  });

  it('decodes non-BMP hex HTML entities (emoji)', () => {
    // &#x1F600; = U+1F600 = 😀
    expect(sanitizeKmlDescription('&#x1F600;')).toBe('😀');
  });

  it('does not produce [object Object] when description is a parsed object with #text', () => {
    // fast-xml-parser can return an object for mixed-content nodes when stopNodes
    // is not configured; the fallback in asTrimmedString must extract #text.
    const result = sanitizeKmlDescription({ '#text': 'Hello <b>world</b>' } as any);
    expect(result).not.toBe('[object Object]');
    expect(result).toBe('Hello world');
  });

  it('returns null when description object has no #text', () => {
    expect(sanitizeKmlDescription({ i: 'bold' } as any)).toBeNull();
  });

  it('returns warning for non-UTF8 payload', () => {
    const buffer = Buffer.concat([
      Buffer.from('<?xml version="1.0"?><kml><Document><Placemark><name>Caf'),
      Buffer.from([0xe9]),
      Buffer.from('</name></Placemark></Document></kml>'),
    ]);

    const decoded = decodeUtf8WithWarning(buffer);
    expect(decoded.warning).toContain('not valid UTF-8');
    expect(decoded.text).toContain('<kml>');
  });
});

const KMZ_FIXTURE = path.join(__dirname, '../../../fixtures/test.kmz');

describe('unpackKmzToKml', () => {
  it('extracts the KML entry from a valid KMZ', async () => {
    const kmzBuffer = fs.readFileSync(KMZ_FIXTURE);
    const kmlBuffer = await unpackKmzToKml(kmzBuffer);
    expect(kmlBuffer.length).toBeGreaterThan(0);
    expect(kmlBuffer.toString('utf-8')).toContain('<kml');
  });

  it('rejects a KMZ whose KML entry exceeds the decompressed size limit', async () => {
    const kmzBuffer = fs.readFileSync(KMZ_FIXTURE);
    // test.kmz contains a KML with uncompressedSize 634 — set limit to 1 byte
    await expect(unpackKmzToKml(kmzBuffer, 1)).rejects.toThrow('exceeds the maximum allowed decompressed size');
  });

  it('rejects a KMZ that contains no KML file', async () => {
    // Craft a minimal ZIP containing only a non-KML entry using raw ZIP bytes
    // We use the test GPX fixture (a real file) re-zipped via Node's zlib/archiver
    // Simplest: a KMZ whose only file has a .txt extension
    const Archiver = await import('archiver');
    const archiver = Archiver.default;
    const { PassThrough } = await import('stream');

    const chunks: Buffer[] = [];
    const output = new PassThrough();
    output.on('data', (chunk) => chunks.push(chunk));

    const archive = archiver('zip', { zlib: { level: 1 } });
    archive.pipe(output);
    archive.append(Buffer.from('not a kml'), { name: 'data.txt' });
    await archive.finalize();

    const zipBuffer = Buffer.concat(chunks);
    await expect(unpackKmzToKml(zipBuffer)).rejects.toThrow('does not contain a KML file');
  });

  it('rejects a buffer that is not a valid ZIP archive', async () => {
    await expect(unpackKmzToKml(Buffer.from('this is not a zip'))).rejects.toThrow('Invalid KMZ archive');
  });

  it('exports KMZ_DECOMPRESSED_SIZE_LIMIT as 50 MB', () => {
    expect(KMZ_DECOMPRESSED_SIZE_LIMIT).toBe(50 * 1024 * 1024);
  });
});

describe('readKmlDocument', () => {
  it('reads every placemark (a level before its folders) and counts them in the summary', () => {
    const kml = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Folder><name>Food</name>
      <Placemark><name>Cafe</name><Point><coordinates>13.4,52.5,0</coordinates></Point></Placemark></Folder>
      <Placemark><name>Walk</name><LineString><coordinates>13.4,52.5 13.5,52.6</coordinates></LineString></Placemark>
      </Document></kml>`;
    const read = readKmlDocument(Buffer.from(kml, 'utf-8'));
    expect(read.summary).toMatchObject({
      totalPlacemarks: 2,
      createdCount: 0,
      skippedCount: 0,
      warnings: [],
      errors: [],
    });
    expect(read.placemarks.map((p) => [p.name, p.folderName, p.routeGeometry !== null])).toEqual([
      ['Walk', null, true],
      ['Cafe', 'Food', false],
    ]);
  });

  it('refuses a document that is not well-formed XML with the route message', () => {
    expect(() => readKmlDocument(Buffer.from('<kml><Placemark></kml>', 'utf-8'))).toThrow(
      'Malformed KML: invalid XML structure',
    );
  });

  it('keeps reading a file that is not valid UTF-8 and says so in the summary', () => {
    const bytes = Buffer.concat([
      Buffer.from('<kml><Placemark><name>'),
      Buffer.from([0xff]),
      Buffer.from('</name></Placemark></kml>'),
    ]);
    expect(readKmlDocument(bytes).summary.warnings).toEqual([
      'The uploaded file is not valid UTF-8. Some characters may be shown incorrectly.',
    ]);
  });
});
