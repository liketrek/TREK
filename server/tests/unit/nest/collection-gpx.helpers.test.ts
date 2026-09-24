/**
 * A list as GPX and back (#2301). Pure helpers, so no DB and no container.
 *
 * The fixtures under tests/fixtures/gpx are modelled on what the apps people
 * keep places in actually write: OsmAnd favourites, Organic Maps, gpx.studio,
 * a Garmin handheld, a Windows tool that adds a BOM and CRLF, and one hostile
 * document. The round trip at the end is the promise the TREK extension makes.
 */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { XMLValidator } from 'fast-xml-parser';
import { COLLECTION_GPX_NAMESPACE, MAX_COLLECTION_FILE_BYTES, type CollectionFilePlace } from '@trek/shared';
import {
  CollectionGpxError,
  MAX_GPX_ELEMENTS,
  collectionFileToGpx,
  gpxToCollectionFile,
  type ExportedCollectionFile,
} from '../../../src/nest/collections/collection-gpx.helpers';

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, '../../fixtures/gpx', name), 'utf8');

const listFile = (over: Partial<ExportedCollectionFile> = {}): ExportedCollectionFile => ({
  format: 'trek.collection', version: 1, name: 'Lisbon', places: [], ...over,
});

const place = (over: Partial<CollectionFilePlace> = {}): CollectionFilePlace => ({
  name: 'Somewhere', lat: 38.7071, lng: -9.1459, status: 'idea', ...over,
});

/** The refusal a document gets, or a failure when it is read. */
function refusal(source: string): string {
  try {
    gpxToCollectionFile(source);
  } catch (err) {
    expect(err).toBeInstanceOf(CollectionGpxError);
    return (err as CollectionGpxError).code;
  }
  throw new Error('expected the document to be refused');
}

const wptDoc = (body: string, rootAttrs = '') =>
  `<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"${rootAttrs}>${body}</gpx>`;

describe('collectionFileToGpx', () => {
  it('GPX-COLL-001: writes each place as a waypoint in the order GPX 1.1 prescribes', () => {
    const { gpx, waypoints, omitted } = collectionFileToGpx(listFile({
      places: [place({
        name: 'Time Out Market', description: 'Market hall', notes: 'Before noon',
        address: 'Av. 24 de Julho 49', website: 'https://timeoutmarket.com/', category: 'Restaurant',
      })],
    }));

    expect(XMLValidator.validate(gpx)).toBe(true);
    expect({ waypoints, omitted }).toEqual({ waypoints: 1, omitted: 0 });
    expect(gpx).toContain('<wpt lat="38.7071" lon="-9.1459">');
    // name, cmt, desc, link, type, extensions: the xsd sequence, which strict readers enforce.
    const order = ['<name>', '<cmt>', '<desc>', '<link ', '<type>', '<extensions>'].map(tag => gpx.indexOf(tag, gpx.indexOf('<wpt')));
    expect(order.every((at, i) => at > -1 && (i === 0 || at > order[i - 1]))).toBe(true);
    // Other apps show <desc>; the address rides under the description so they show it too.
    expect(gpx).toContain('<desc>Market hall\n\nAv. 24 de Julho 49</desc>');
    expect(gpx).toContain('<cmt>Before noon</cmt>');
    expect(gpx).toContain('<link href="https://timeoutmarket.com/"/>');
    expect(gpx).toContain('<type>Restaurant</type>');
  });

  it('GPX-COLL-002: carries what GPX has no element for in the TREK namespace', () => {
    const { gpx } = collectionFileToGpx(listFile({
      color: '#ef4444', icon: 'Utensils', description: 'Three days',
      labels: [{ name: 'Must see', color: '#ff0000' }],
      places: [place({
        address: 'Rua 1', phone: '+351 1', status: 'want', price: 12.5, currency: 'EUR',
        labels: ['Must see'], links: [{ url: 'https://menu.example', label: 'Menu' }, { url: 'https://bare.example' }],
      })],
    }));

    expect(gpx).toContain(`xmlns:trek="${COLLECTION_GPX_NAMESPACE}"`);
    for (const line of [
      '<trek:address>Rua 1</trek:address>', '<trek:phone>+351 1</trek:phone>', '<trek:status>want</trek:status>',
      '<trek:price>12.5</trek:price>', '<trek:currency>EUR</trek:currency>', '<trek:label>Must see</trek:label>',
      '<trek:link href="https://menu.example">Menu</trek:link>', '<trek:link href="https://bare.example"/>',
      '<trek:color>#ef4444</trek:color>', '<trek:icon>Utensils</trek:icon>', '<trek:label color="#ff0000">Must see</trek:label>',
    ]) expect(gpx, line).toContain(line);
    expect(gpx).toContain('<metadata>\n    <name>Lisbon</name>\n    <desc>Three days</desc>');
  });

  it('GPX-COLL-003: leaves out a place without coordinates and says how many', () => {
    const result = collectionFileToGpx(listFile({
      places: [place({ name: 'Here' }), place({ name: 'Nowhere', lat: null, lng: null }), place({ name: 'Half', lng: null })],
    }));

    expect(result).toMatchObject({ name: 'Lisbon', waypoints: 1, omitted: 2 });
    expect(result.gpx).toContain('<name>Here</name>');
    expect(result.gpx).not.toContain('Nowhere');
  });

  it('GPX-COLL-004: writes a list with no coordinates at all as a valid, empty GPX', () => {
    const result = collectionFileToGpx(listFile({ places: [place({ lat: null, lng: null })] }));
    expect(result).toMatchObject({ waypoints: 0, omitted: 1 });
    expect(XMLValidator.validate(result.gpx)).toBe(true);
    expect(result.gpx).not.toContain('<wpt');
  });

  it('GPX-COLL-005: escapes markup and drops the characters XML cannot hold', () => {
    const { gpx } = collectionFileToGpx(listFile({
      name: 'Fish & Chips <best>',
      places: [place({ name: 'A "quoted" & <tagged> place\u0001\u0008', description: "Bob's \u000bnotes" })],
    }));

    expect(XMLValidator.validate(gpx)).toBe(true);
    expect(gpx).toContain('<name>Fish &amp; Chips &lt;best&gt;</name>');
    const back = gpxToCollectionFile(gpx).file;
    expect(back.name).toBe('Fish & Chips <best>');
    expect(back.places[0]).toMatchObject({ name: 'A "quoted" & <tagged> place', description: "Bob's notes" });
  });

  it('GPX-COLL-006: never writes a link a reader should not follow', () => {
    const { gpx } = collectionFileToGpx(listFile({
      places: [place({ website: 'javascript:alert(1)', links: [{ url: 'ftp://files.example' }] })],
    }));
    expect(gpx).not.toContain('javascript:');
    expect(gpx).not.toContain('ftp://');
  });
});

describe('gpxToCollectionFile: what other apps write', () => {
  it('GPX-COLL-010: OsmAnd favourites, with <type> as the group and the address in its namespace', () => {
    const { file, skipped, track_points } = gpxToCollectionFile(fixture('osmand-favourites.gpx'), 'favourites.gpx');

    expect({ skipped, track_points }).toEqual({ skipped: 0, track_points: 0 });
    expect(file.name).toBe('favorites');
    expect(file.places).toHaveLength(3);
    expect(file.places[0]).toMatchObject({
      name: 'Time Out Market', lat: 38.7071037, lng: -9.1459227, category: 'Restaurant',
      description: 'Go before noon, the queues start at one', address: 'Av. 24 de Julho 49, 1200-479 Lisboa',
    });
    expect(file.places[1]).toMatchObject({ name: 'Miradouro de Santa Luzia', category: 'Viewpoints' });
    // A numeric character reference is text like any other.
    expect(file.places[2]).toMatchObject({ name: 'Pastéis de Belém', description: 'Pastéis warm from the oven' });
    // OsmAnd's icon and colour are its own business, not TREK labels or statuses.
    expect(file.places[0]).toMatchObject({ status: 'idea' });
    expect(file.places[0]).not.toHaveProperty('labels', expect.arrayContaining([expect.anything()]));
  });

  it('GPX-COLL-011: Organic Maps, with CDATA, entities, a script link and a track', () => {
    const { file, skipped, track_points } = gpxToCollectionFile(fixture('organic-maps.gpx'));

    expect(file).toMatchObject({ name: 'Kyoto & Nara', description: 'Temples, gardens and where to eat between them' });
    expect(file.places.map(p => (p as CollectionFilePlace).name)).toEqual(['伏見稲荷大社', 'Kinkaku-ji', 'Nara Park']);
    expect(file.places[1]).toMatchObject({
      description: 'Golden Pavilion. Buy tickets at the gate & walk the garden loop clockwise.',
      website: 'https://www.shokoku-ji.jp/kinkakuji/',
    });
    // The javascript: link is gone; the park is not.
    expect(file.places[2]).not.toHaveProperty('website');
    expect({ skipped, track_points }).toEqual({ skipped: 0, track_points: 5 });
  });

  it('GPX-COLL-012: gpx.studio, waypoints beside a track of two segments', () => {
    const { file, track_points } = gpxToCollectionFile(fixture('gpx-studio.gpx'));

    // The metadata name, not the author's name nested under it.
    expect(file.name).toBe('Sintra loop');
    expect(file.places).toHaveLength(2);
    expect(file.places[0]).toMatchObject({ name: 'Pena Palace', category: 'Flag, Blue' });
    expect(track_points).toBe(8);
  });

  it('GPX-COLL-013: a Garmin handheld, with <sym>, twin <cmt>, bad waypoints and a route', () => {
    const { file, skipped, track_points } = gpxToCollectionFile(fixture('garmin-sym.gpx'), 'C:\\GPS\\Innsbruck.gpx');

    // No name in the document, so the file name it came in.
    expect(file.name).toBe('Innsbruck');
    expect(file.places.map(p => (p as CollectionFilePlace).name)).toEqual(['007', 'Goldenes Dachl', 'Waypoint 5', 'Triumphpforte']);
    // A name of digits stays the text it was.
    expect(file.places[0]).toMatchObject({ category: 'Parking Area', description: 'Parking at the old town' });
    // Garmin writes <cmt> and <desc> alike; the copy is not kept twice.
    expect(file.places[0]).not.toHaveProperty('notes');
    expect(file.places[1]).toMatchObject({ notes: 'Built 1500', website: 'https://www.innsbruck.info/' });
    // Past the pole and without a latitude: skipped, not guessed.
    expect(skipped).toBe(2);
    // The route's unnamed bend; its named points are places, the repeated one only once.
    expect(track_points).toBe(1);
  });

  it('GPX-COLL-014: a file with a byte-order mark and CRLF line endings', () => {
    const raw = fixture('bom-crlf.gpx');
    // The fixture must really be what it claims, or this case tests nothing.
    expect(raw.charCodeAt(0)).toBe(0xfeff);
    expect(raw).toContain('\r\n');

    const { file } = gpxToCollectionFile(raw);
    expect(file.name).toBe('Wien');
    expect(file.places).toHaveLength(2);
    expect((file.places[0] as CollectionFilePlace).description).toBe('South tower first,\nthe north tower has the bell');
  });

  it('GPX-COLL-015: GPX 1.0 keeps the name on the root and a link as <url>', () => {
    const { file } = gpxToCollectionFile(
      '<gpx version="1.0" creator="old"><name>Old file</name><wpt lat="1" lon="2"><name>A</name>'
      + '<url>https://a.example</url><urlname>A site</urlname></wpt></gpx>',
    );
    expect(file.name).toBe('Old file');
    expect(file.places[0]).toMatchObject({ website: 'https://a.example' });
  });
});

describe('gpxToCollectionFile: what it refuses', () => {
  it('GPX-COLL-020: a DOCTYPE, before anything is expanded or fetched', () => {
    expect(refusal(fixture('hostile-doctype.gpx'))).toBe('unreadable');
    expect(refusal(wptDoc('<wpt lat="1" lon="1"><name>x</name></wpt>').replace('<gpx', '<!ENTITY a "b"><gpx'))).toBe('unreadable');
  });

  it('GPX-COLL-021: a file that is not XML, not well-formed, or not GPX', () => {
    expect(refusal('{"format":"trek.collection"}')).toBe('unreadable');
    expect(refusal('<gpx><wpt lat="1" lon="2"><name>x</wpt></gpx>')).toBe('unreadable');
    expect(refusal('<?xml version="1.0"?><kml><Document/></kml>')).toBe('not-gpx');
  });

  it('GPX-COLL-022: a file past the size limit, counted in bytes', () => {
    // Three bytes a character: under the limit in characters, over it in bytes.
    const wide = '€'.repeat(Math.floor(MAX_COLLECTION_FILE_BYTES / 2));
    expect(wide.length).toBeLessThan(MAX_COLLECTION_FILE_BYTES);
    expect(refusal(wptDoc(`<desc>${wide}</desc>`))).toBe('too-large');
  });

  it('GPX-COLL-023: a file opening more elements than any real GPX has', () => {
    expect(refusal(wptDoc('<a/>'.repeat(MAX_GPX_ELEMENTS + 1)))).toBe('unreadable');
  });

  it('GPX-COLL-024: a file with more places than a list may hold', () => {
    const many = Array.from({ length: 1001 }, (_, i) => `<wpt lat="1" lon="${i / 10}"/>`).join('');
    expect(refusal(wptDoc(many))).toBe('too-many-places');
  });

  it('GPX-COLL-025: an empty GPX reads as a list of nothing, not as an error', () => {
    expect(gpxToCollectionFile('<gpx/>', 'empty.gpx').file).toMatchObject({ name: 'empty', places: [] });
  });
});

describe('gpxToCollectionFile: one bad field costs that field', () => {
  it('GPX-COLL-030: drops what the contract refuses and keeps the place', () => {
    const { file, skipped } = gpxToCollectionFile(wptDoc(
      `<wpt lat="1" lon="2"><name>${'n'.repeat(600)}</name><desc>${'d'.repeat(6000)}</desc>`
      + '<type>Museum</type></wpt>',
    ));
    expect(skipped).toBe(0);
    const only = file.places[0] as CollectionFilePlace;
    expect(only.name).toHaveLength(500);
    expect(only).not.toHaveProperty('description');
    expect(only.category).toBe('Museum');
  });

  it('GPX-COLL-031: reads the TREK extension by namespace, whatever the prefix', () => {
    const body = '<wpt lat="1" lon="2"><name>A</name><extensions><t:status>visited</t:status><trek:status>want</trek:status></extensions></wpt>';
    const ours = gpxToCollectionFile(wptDoc(body, ` xmlns:t="${COLLECTION_GPX_NAMESPACE}" xmlns:trek="https://elsewhere.example"`));
    expect(ours.file.places[0]).toMatchObject({ status: 'visited' });
    // Without the namespace bound, `trek:` is just somebody else's prefix.
    const theirs = gpxToCollectionFile(wptDoc(body, ' xmlns:trek="https://elsewhere.example"'));
    expect(theirs.file.places[0]).toMatchObject({ status: 'idea' });
  });

  it('GPX-COLL-032: an unknown status, a price that is not a number and a bad label cost only themselves', () => {
    const { file } = gpxToCollectionFile(wptDoc(
      '<wpt lat="1" lon="2"><name>A</name><extensions><trek:status>loved</trek:status><trek:price>cheap</trek:price>'
      + `<trek:label>Ok</trek:label><trek:label>${'x'.repeat(61)}</trek:label><trek:phone>+1</trek:phone></extensions></wpt>`,
      ` xmlns:trek="${COLLECTION_GPX_NAMESPACE}"`,
    ));
    expect(file.places[0]).toMatchObject({ status: 'idea', labels: ['Ok'], phone: '+1' });
    expect(file.places[0]).not.toHaveProperty('price');
  });
});

describe('a GPX made by TREK comes back as the same list (#2301)', () => {
  it('GPX-COLL-040: every field of every place, and the list around them', () => {
    const places: CollectionFilePlace[] = [
      {
        name: 'Time Out Market', description: 'Market hall\nwith two floors', notes: 'Before noon',
        lat: 38.70710371234, lng: -9.14592271234, address: 'Av. 24 de Julho 49', phone: '+351 210 606 040',
        website: 'https://timeoutmarket.com/', category: 'Restaurant', status: 'want', price: 12.5, currency: 'EUR',
        image_url: 'https://example.com/market.jpg', google_place_id: 'ChIJ123', google_ftid: '0x1:0x2', osm_id: 'node/1',
        labels: ['Must see', 'Rainy day'], links: [{ url: 'https://menu.example/', label: 'Menu' }],
      },
      { name: 'Address only', lat: 38.7, lng: -9.1, address: 'Rua 2', status: 'visited' },
      { name: 'Bare', lat: 0, lng: 0, status: 'idea' },
    ];
    const original = listFile({
      name: 'Lisbon', description: 'Three days', color: '#ef4444', icon: 'Utensils', exported_at: '2026-09-19T10:00:00.000Z',
      labels: [{ name: 'Must see', color: '#ff0000' }, { name: 'Rainy day', color: null }],
      places,
    });

    const { file } = gpxToCollectionFile(collectionFileToGpx(original).gpx);

    expect(file).toMatchObject({ name: 'Lisbon', description: 'Three days', color: '#ef4444', icon: 'Utensils' });
    expect(file.labels).toEqual([{ name: 'Must see', color: '#ff0000' }, { name: 'Rainy day' }]);
    const back = file.places as CollectionFilePlace[];
    expect(back).toHaveLength(3);
    // Seven decimals is what the writer keeps, about a centimetre.
    expect(back[0].lat).toBeCloseTo(places[0].lat!, 7);
    expect(back[0].lng).toBeCloseTo(places[0].lng!, 7);
    expect({ ...back[0], lat: 0, lng: 0 }).toEqual({ ...places[0], lat: 0, lng: 0 });
    // The address that was also written under the description does not come back into it.
    expect(back[1]).toEqual(places[1]);
    expect(back[2]).toEqual(places[2]);
  });
});
