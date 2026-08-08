import { describe, it, expect } from 'vitest';
import {
  buildCategoryNameLookup,
  decodeUtf8WithWarning,
  extractKmlPlacemarkNodes,
  parseKmlPointCoordinates,
  parsePlacemarkNode,
  resolveCategoryIdForFolder,
  sanitizeKmlDescription,
} from '../../../../src/nest/places/kml-import.helpers';

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
