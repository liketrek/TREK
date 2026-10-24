import {
  decodeUtf8WithWarning,
  extractKmlPlacemarkNodes,
  kmlLineGeometry,
  KMZ_DECOMPRESSED_SIZE_LIMIT,
  parseKmlPointCoordinates,
  parsePlacemarkNode,
  readKmlDocument,
  readKmlLines,
  readKmzEntryCapped,
  sanitizeKmlDescription,
  unpackKmzToKml,
} from '../../../../src/nest/place-import/kml.codec';
import { KmlReadError } from '../../../../src/nest/place-import/place-import.types';
import { buildCategoryNameLookup, resolveCategoryIdForFolder } from '../../../../src/nest/places/places.helpers';

import fs from 'fs';
import path from 'path';
import { PassThrough, Readable } from 'stream';
import unzipper, { type Entry } from 'unzipper';
import { describe, it, expect, vi } from 'vitest';

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

const kml = (body: string) =>
  Buffer.from(`<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"
  xmlns:gx="http://www.google.com/kml/ext/2.2"><Document>${body}</Document></kml>`);

/** An archive entry whose stream yields these chunks, or fails after them. */
const fakeEntry = (chunks: Buffer[], fail?: Error) => ({
  stream: () => {
    const out = new PassThrough();
    for (const chunk of chunks) out.write(chunk);
    if (fail) setImmediate(() => out.destroy(fail));
    else out.end();
    return out as unknown as Entry;
  },
});

describe('readKmlLines (IO-02)', () => {
  it('KML-LINES-001: reads every LineString and gx:Track in document order, each a line of its own', () => {
    const read = readKmlLines(
      kml(`<Placemark><name>Coast</name><description>Along the &amp; sea</description>
        <LineString><coordinates>11,48 11.01,48.01</coordinates></LineString></Placemark>
        <Folder><name>Recorded</name><Placemark><name>Morning</name><gx:Track><altitudeMode>absolute</altitudeMode>
          <when>2026-01-01T08:00:00Z</when><when>2026-01-01T08:05:00Z</when>
          <gx:coord>12 49 400</gx:coord><gx:coord>12.01 49.01 420.5</gx:coord></gx:Track></Placemark></Folder>`),
    );
    expect(read.lines).toEqual([
      {
        name: 'Coast',
        description: 'Along the & sea',
        geometry: [
          [48, 11],
          [48.01, 11.01],
        ],
      },
      {
        name: 'Morning',
        description: null,
        geometry: [
          [49, 12, 400],
          [49.01, 12.01, 420.5],
        ],
      },
    ]);
    expect(read.leftOut).toEqual({ points: 0, areas: 0, other: 0 });
    expect(read.warnings).toEqual([]);
  });

  it('KML-LINES-002: keeps the lines of one placemark apart and numbers them, never joins them', () => {
    const read = readKmlLines(
      kml(`<Placemark><name>Ferry day</name><MultiGeometry>
        <LineString><coordinates>11,48 11.01,48.01</coordinates></LineString>
        <MultiGeometry><LineString><coordinates>11.5,48.5 11.51,48.51</coordinates></LineString>
          <Point><coordinates>11.5,48.5</coordinates></Point></MultiGeometry>
      </MultiGeometry></Placemark>
      <Placemark><gx:MultiTrack><altitudeMode>absolute</altitudeMode>
        <gx:Track><gx:coord>12 49 1</gx:coord><gx:coord>12.1 49.1 2</gx:coord></gx:Track>
        <gx:Track><gx:coord>13 50 3</gx:coord><gx:coord>13.1 50.1 4</gx:coord></gx:Track></gx:MultiTrack></Placemark>`),
    );
    expect(read.lines.map((line) => [line.name, line.geometry.length, line.geometry[0]])).toEqual([
      ['Ferry day (1/2)', 2, [48, 11]],
      ['Ferry day (2/2)', 2, [48.5, 11.5]],
      [null, 2, [49, 12, 1]],
      [null, 2, [50, 13, 3]],
    ]);
    expect(read.leftOut).toEqual({ points: 1, areas: 0, other: 0 });
  });

  it('KML-LINES-003: counts what it leaves out: pins, areas, models, overlays, links, empty and short ones', () => {
    const read = readKmlLines(
      kml(`<Placemark><name>Hut</name><Point><coordinates>11,48</coordinates></Point></Placemark>
        <Placemark><Polygon><outerBoundaryIs><LinearRing><coordinates>1,1 2,2 3,1 1,1</coordinates></LinearRing>
          </outerBoundaryIs></Polygon></Placemark>
        <Placemark><Model><Link><href>house.dae</href></Link></Model></Placemark>
        <Placemark><name>Nothing</name></Placemark>
        <Placemark><LineString><coordinates>11,48</coordinates></LineString></Placemark>
        <Placemark><gx:Track><gx:coord>12 49 1</gx:coord></gx:Track></Placemark>
        <NetworkLink><Link><href>https://example.test/more.kml</href></Link></NetworkLink>
        <Folder><GroundOverlay><Icon><href>map.png</href></Icon></GroundOverlay><ScreenOverlay/></Folder>`),
    );
    expect(read.lines).toEqual([]);
    // other: the model, the empty placemark, the short line, the short track, the link and two overlays.
    expect(read.leftOut).toEqual({ points: 1, areas: 1, other: 7 });
  });

  it('KML-LINES-004: says when the file is not valid UTF-8, as the place import does', () => {
    const bytes = Buffer.concat([
      Buffer.from('<kml><Placemark><name>'),
      Buffer.from([0xff]),
      Buffer.from('</name><LineString><coordinates>1,1 2,2</coordinates></LineString></Placemark></kml>'),
    ]);
    const read = readKmlLines(bytes);
    expect(read.lines).toHaveLength(1);
    expect(read.warnings).toEqual(['The uploaded file is not valid UTF-8. Some characters may be shown incorrectly.']);
  });

  it('KML-LINES-005: refuses a document that is not well-formed XML with the reason malformed', () => {
    let error: unknown;
    try {
      readKmlLines(Buffer.from('<kml><Placemark></kml>'));
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(KmlReadError);
    expect(error).toMatchObject({ reason: 'malformed', message: 'Malformed KML: invalid XML structure' });
  });
});

describe('kmlLineGeometry (IO-02): heights only where they are heights', () => {
  const points = (...eles: Array<number | null>) => eles.map((ele, i) => ({ lat: 47 + i, lng: 11, ele }));

  it('KML-HEIGHTS-001: keeps the heights of an absolute line, also when they are 0', () => {
    expect(kmlLineGeometry(points(0, 0), 'absolute')).toEqual([
      [47, 11, 0],
      [48, 11, 0],
    ]);
  });

  it('KML-HEIGHTS-002: drops them under any other altitude mode', () => {
    for (const mode of ['clampToGround', 'relativeToGround', 'clampToSeaFloor']) {
      expect(kmlLineGeometry(points(400, 420), mode)).toEqual([
        [47, 11],
        [48, 11],
      ]);
    }
  });

  it('KML-HEIGHTS-003: without a mode keeps them unless every one is 0, the placeholder Google My Maps writes', () => {
    expect(kmlLineGeometry(points(0, 0, 0), null)).toEqual([
      [47, 11],
      [48, 11],
      [49, 11],
    ]);
    expect(kmlLineGeometry(points(0, 12), null)).toEqual([
      [47, 11, 0],
      [48, 11, 12],
    ]);
  });

  it('KML-HEIGHTS-004: a line with a point lacking its height keeps none', () => {
    expect(kmlLineGeometry(points(400, null), 'absolute')).toEqual([
      [47, 11],
      [48, 11],
    ]);
  });

  it('KML-HEIGHTS-005: an altitude mode around the lines is inherited by them', () => {
    const read = readKmlLines(
      kml(`<Placemark><MultiGeometry><altitudeMode>clampToGround</altitudeMode>
        <LineString><coordinates>11,48,300 11.01,48.01,310</coordinates></LineString></MultiGeometry></Placemark>`),
    );
    expect(read.lines[0]?.geometry).toEqual([
      [48, 11],
      [48.01, 11.01],
    ]);
  });
});

describe('KMZ unpacking limits (IO-02)', () => {
  it('KMZ-CAP-001: counts the bytes it inflates and stops past the limit, whatever the header claims', async () => {
    const entry = fakeEntry([Buffer.alloc(6, 'a'), Buffer.alloc(6, 'b')]);
    await expect(readKmzEntryCapped(entry, 10)).rejects.toMatchObject({ reason: 'archive_too_large' });
    expect((await readKmzEntryCapped(entry, 12)).toString()).toBe('aaaaaabbbbbb');
  });

  it('KMZ-CAP-002: names the reason for each archive it cannot read', async () => {
    await expect(unpackKmzToKml(Buffer.from('this is not a zip'))).rejects.toMatchObject({ reason: 'archive_invalid' });
    await expect(unpackKmzToKml(fs.readFileSync(KMZ_FIXTURE), 1)).rejects.toMatchObject({
      reason: 'archive_too_large',
    });
  });

  it('KMZ-CAP-003: a KML entry that breaks while it inflates is an invalid archive', async () => {
    const broken = { path: 'doc.kml', uncompressedSize: 10, ...fakeEntry([Buffer.from('<kml>')], new Error('bad')) };
    const open = vi.spyOn(unzipper.Open, 'buffer').mockResolvedValueOnce({ files: [broken] } as never);
    await expect(unpackKmzToKml(Buffer.from('zip'))).rejects.toMatchObject({
      reason: 'archive_invalid',
      message: 'Invalid KMZ archive.',
    });
    open.mockRestore();
  });

  it('KMZ-CAP-004: reads only the KML entry of an archive, never the files beside it', async () => {
    const image = { path: 'files/photo.jpg', uncompressedSize: 1, stream: vi.fn() };
    const doc = { path: 'doc.kml', uncompressedSize: 5, ...fakeEntry([Buffer.from('<kml/>')]) };
    const open = vi.spyOn(unzipper.Open, 'buffer').mockResolvedValueOnce({ files: [image, doc] } as never);
    expect((await unpackKmzToKml(Buffer.from('zip'))).toString()).toBe('<kml/>');
    expect(image.stream).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('KMZ-CAP-005: takes chunks that come as plain byte arrays', async () => {
    const chunks = [new Uint8Array([60, 107]), Buffer.from('ml/>')];
    const entry = { stream: () => Readable.from(chunks) as unknown as Entry };
    expect((await readKmzEntryCapped(entry, 10)).toString()).toBe('<kml/>');
  });
});
