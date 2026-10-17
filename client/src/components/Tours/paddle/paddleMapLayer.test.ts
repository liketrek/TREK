// FE-PADDLE-MAP-001 to FE-PADDLE-MAP-017: the paddle objects as the planner maps draw them, one model for Leaflet and GL.
import { describe, expect, it } from 'vitest';

import {
  type PaddleFeature,
  type PaddleGeometry,
  type PaddleObstacleKind,
  paddleObstacleKindSchema,
  type RelatedObstacle,
} from '@trek/shared';

import { OBSTACLE_GLYPH, PADDLE_GLYPH_PATHS, paddleGlyphSvg } from './paddleGlyphPaths';
import {
  isAreaOnly,
  isPaddleItemSelected,
  markerSize,
  PADDLE_AREA_MIN_ZOOM,
  paddleItemsAtZoom,
  type PaddleMapItem,
  paddleMapItems,
  type PaddleMapRelation,
  paddleMarkerHtml,
  paddleMarkerImageId,
  paddleMarkerSvg,
  selectedPaddleKey,
} from './paddleMapLayer';
import { paddleKindPaint, type PaddlePaint } from './paddlePaint';

const KINDS = paddleObstacleKindSchema.options;
const RELATIONS: readonly PaddleMapRelation[] = ['on_route', 'near', 'area'];
/** Test colours standing in for the theme tokens (styles/paddle.css), distinct so each can be told apart. */
const PAINT: PaddlePaint = {
  obstacle: '#334155',
  access: '#4338ca',
  landing: '#0f766e',
  portage: '#9a6233',
  rapids: '#d97706',
  gap: '#dc2626',
  disc: '#ffffff',
  shadow: 'rgba(15, 23, 42, 0.35)',
};
const { obstacle: SLATE, access: INDIGO, landing: TEAL, portage: BROWN } = PAINT;

const point = (lng: number, lat: number): PaddleGeometry => ({ type: 'Point', coordinates: [lng, lat] });

function feature(ref: string, kind: PaddleObstacleKind, geometry: PaddleGeometry = point(12.1, 49.1)): PaddleFeature {
  return { ref, kind, group_key: null, name: null, geometry, tags: {}, tag_hash: ref, region_id: 'oberpfalz' };
}

function related(entry: PaddleFeature, relation: RelatedObstacle['relation']): RelatedObstacle {
  return { feature: entry, relation, distanceM: relation === 'on_route' ? 0 : 80, alongM: 1200 };
}

/** One object as the map draws it, standing to the route as `relation` says. */
function item(relation: PaddleMapRelation, kind: PaddleObstacleKind = 'weir', ref = 'way/1'): PaddleMapItem {
  const entry = feature(ref, kind);
  const [made] = paddleMapItems([entry], relation === 'area' ? [] : [related(entry, relation)], PAINT);
  return made;
}

/** The marker markup as Leaflet's divIcon puts it on the page. */
function parseHtml(html: string): Element {
  const host = document.createElement('div');
  host.innerHTML = html;
  const marker = host.firstElementChild;
  if (!marker || host.children.length !== 1) throw new Error(`not one marker element: ${html}`);
  return marker;
}

/** An image as a GL map decodes it: well-formed XML or nothing. */
function parseSvg(svg: string): Element {
  const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
  if (root.localName !== 'svg') throw new Error(`not well-formed SVG: ${svg}`);
  return root;
}

function pathsOf(svg: Element): Array<string | null> {
  return Array.from(svg.getElementsByTagName('path'), (path) => path.getAttribute('d'));
}

function htmlLook(html: string) {
  const marker = parseHtml(html);
  const glyph = marker.querySelector('svg');
  return {
    style: marker.getAttribute('style') ?? '',
    glyph: glyph?.getAttribute('width') ?? null,
    stroke: glyph?.getAttribute('stroke') ?? null,
    paths: pathsOf(marker),
  };
}

function svgLook(svg: string) {
  const root = parseSvg(svg);
  const disc = root.getElementsByTagName('circle').item(0);
  const glyph = root.getElementsByTagName('svg').item(0);
  return {
    size: root.getAttribute('width'),
    opacity: root.getAttribute('opacity'),
    r: disc?.getAttribute('r') ?? null,
    ring: disc?.getAttribute('stroke-width') ?? null,
    dash: disc?.getAttribute('stroke-dasharray') ?? null,
    glyph: glyph?.getAttribute('width') ?? null,
    x: glyph?.getAttribute('x') ?? null,
  };
}

describe('paddle map layer', () => {
  it('FE-PADDLE-MAP-001: sorts every kind into one of four distinct colours by what the object is', () => {
    const kindsIn = (color: string) => KINDS.filter((kind) => paddleKindPaint(kind, PAINT) === color);
    expect(kindsIn(SLATE)).toEqual(['weir', 'dam', 'lock', 'lock_gate', 'waterfall', 'rapids', 'hazard']);
    expect(kindsIn(INDIGO)).toEqual(['access']);
    expect(kindsIn(TEAL)).toEqual(['put_in', 'egress', 'slipway']);
    expect(kindsIn(BROWN)).toEqual(['portage']);
    expect(new Set([SLATE, INDIGO, TEAL, BROWN]).size).toBe(4);
  });

  it('FE-PADDLE-MAP-002: draws every kind with a glyph of well-formed paths, sharing one where the paddler meets the same thing', () => {
    const glyphs = new Set(KINDS.map((kind) => OBSTACLE_GLYPH[kind]));
    expect(glyphs).toEqual(new Set(Object.keys(PADDLE_GLYPH_PATHS)));
    expect(OBSTACLE_GLYPH.lock_gate).toBe('lock');
    expect(OBSTACLE_GLYPH.slipway).toBe('put_in');
    expect(OBSTACLE_GLYPH.egress).toBe('take_out');
    for (const glyph of glyphs) {
      expect(PADDLE_GLYPH_PATHS[glyph].length, glyph).toBeGreaterThan(0);
      expect(pathsOf(parseSvg(paddleGlyphSvg(glyph, 24, SLATE))), glyph).toEqual(PADDLE_GLYPH_PATHS[glyph]);
    }
    for (const d of Object.values(PADDLE_GLYPH_PATHS).flat()) expect(d).toMatch(/^M/);
  });

  it('FE-PADDLE-MAP-003: places a point where it is, as the route relates it, and the rest of the area quietly', () => {
    const weir = feature('node/1', 'weir', point(12.1, 49.1));
    const slipway = feature('node/2', 'slipway', point(12.2, 49.2));
    const gate = feature('node/3', 'lock_gate', point(12.3, 49.3));
    const elsewhere = feature('node/4', 'dam', point(13.1, 50.1));
    const items = paddleMapItems(
      [weir, slipway, gate],
      [related(gate, 'near'), related(weir, 'on_route'), related(elsewhere, 'on_route')],
      PAINT
    );
    expect(items).toEqual([
      {
        feature: weir,
        relation: 'on_route',
        color: SLATE,
        disc: PAINT.disc,
        shadow: PAINT.shadow,
        glyph: 'weir',
        marker: [49.1, 12.1],
        line: null,
      },
      {
        feature: slipway,
        relation: 'area',
        color: TEAL,
        disc: PAINT.disc,
        shadow: PAINT.shadow,
        glyph: 'put_in',
        marker: [49.2, 12.2],
        line: null,
      },
      {
        feature: gate,
        relation: 'near',
        color: SLATE,
        disc: PAINT.disc,
        shadow: PAINT.shadow,
        glyph: 'lock',
        marker: [49.3, 12.3],
        line: null,
      },
    ]);
    expect(items[0].feature).toBe(weir);
    expect(paddleMapItems([], [related(weir, 'on_route')], PAINT)).toEqual([]);
  });

  it('FE-PADDLE-MAP-004: turns a line into [lat, lng] pairs and sets its marker halfway along', () => {
    const weir = feature('way/1', 'weir', {
      type: 'LineString',
      coordinates: [
        [12.1, 49.1],
        [12.2, 49.2],
        [12.3, 49.3],
      ],
    });
    const carry = feature('way/2', 'portage', {
      type: 'LineString',
      coordinates: [
        [12.1, 49.1],
        [12.2, 49.2],
        [12.3, 49.3],
        [12.4, 49.4],
      ],
    });
    const [crossing, portage] = paddleMapItems([weir, carry], [], PAINT);
    expect(crossing.line).toEqual([
      [49.1, 12.1],
      [49.2, 12.2],
      [49.3, 12.3],
    ]);
    expect(crossing.marker).toEqual([49.2, 12.2]);
    expect(portage.marker).toEqual([49.3, 12.3]);
    expect(portage).toMatchObject({ relation: 'area', color: BROWN, glyph: 'portage' });
  });

  it('FE-PADDLE-MAP-005: outlines an area by its outer ring, and puts a shape that came without points at the origin', () => {
    const lake = feature('way/1', 'access', {
      type: 'Polygon',
      coordinates: [
        [
          [12.1, 49.1],
          [12.2, 49.1],
          [12.2, 49.2],
          [12.1, 49.2],
          [12.1, 49.1],
        ],
        [
          [12.14, 49.14],
          [12.16, 49.14],
          [12.16, 49.16],
          [12.14, 49.14],
        ],
      ],
    });
    const noRing = feature('way/2', 'access', { type: 'Polygon', coordinates: [] });
    const noLine = feature('way/3', 'weir', { type: 'LineString', coordinates: [] });
    const [area, ringless, lineless] = paddleMapItems([lake, noRing, noLine], [], PAINT);
    expect(area.line).toEqual([
      [49.1, 12.1],
      [49.1, 12.2],
      [49.2, 12.2],
      [49.2, 12.1],
      [49.1, 12.1],
    ]);
    expect(area.marker).toEqual([49.2, 12.2]);
    expect(area.color).toBe(INDIGO);
    expect(ringless).toMatchObject({ line: [], marker: [0, 0] });
    expect(lineless).toMatchObject({ line: [], marker: [0, 0] });
  });

  describe('at a zoom', () => {
    const onRoute = item('on_route', 'weir', 'way/1');
    const near = item('near', 'lock', 'way/2');
    const quiet = item('area', 'put_in', 'node/3');
    const picked = item('area', 'access', 'way/4');
    const all = [onRoute, near, quiet, picked];
    const refs = (items: readonly PaddleMapItem[]) => items.map((entry) => entry.feature.ref);

    it('FE-PADDLE-MAP-006: counts only an unpicked object off the route as one of the quiet ones of the area', () => {
      expect(isAreaOnly(quiet, null)).toBe(true);
      expect(isAreaOnly(quiet, 'way/4')).toBe(true);
      expect(isAreaOnly(picked, 'way/4')).toBe(false);
      expect(isAreaOnly(onRoute, null)).toBe(false);
      expect(isAreaOnly(near, null)).toBe(false);
    });

    it('FE-PADDLE-MAP-007: keeps an overview to the route and the picked object, and shows the whole area from the threshold on', () => {
      expect(refs(paddleItemsAtZoom(all, PADDLE_AREA_MIN_ZOOM - 1, null))).toEqual(['way/1', 'way/2']);
      expect(refs(paddleItemsAtZoom(all, PADDLE_AREA_MIN_ZOOM - 0.5, 'way/4'))).toEqual(['way/1', 'way/2', 'way/4']);
      const zoomedIn = paddleItemsAtZoom(all, PADDLE_AREA_MIN_ZOOM, null);
      expect(refs(zoomedIn)).toEqual(['way/1', 'way/2', 'node/3', 'way/4']);
      expect(zoomedIn).not.toBe(all);
      expect(paddleItemsAtZoom([], PADDLE_AREA_MIN_ZOOM - 1, 'way/4')).toEqual([]);
    });
  });

  it('FE-PADDLE-MAP-008: sizes a marker by how it stands to the route, and a picked one largest of all', () => {
    expect(RELATIONS.map((relation) => markerSize(relation, false))).toEqual([30, 26, 22]);
    expect(RELATIONS.map((relation) => markerSize(relation, true))).toEqual([36, 36, 36]);
  });

  it('FE-PADDLE-MAP-009: draws a Leaflet marker solid on the route, dashed near it and faded in the area', () => {
    const onRoute = htmlLook(paddleMarkerHtml(item('on_route'), false));
    expect(onRoute.style).toContain('width:30px;height:30px;');
    expect(onRoute.style).toContain(`border:2px solid ${SLATE};`);
    expect(onRoute.style).toMatch(/opacity:1$/);
    expect(onRoute).toMatchObject({ glyph: '17', stroke: SLATE, paths: PADDLE_GLYPH_PATHS.weir });

    const near = htmlLook(paddleMarkerHtml(item('near', 'lock'), false));
    expect(near.style).toContain('width:26px;height:26px;');
    expect(near.style).toContain(`border:2px dashed ${SLATE};`);
    expect(near.style).toMatch(/opacity:1$/);
    expect(near).toMatchObject({ glyph: '15', stroke: SLATE, paths: PADDLE_GLYPH_PATHS.lock });

    const quiet = htmlLook(paddleMarkerHtml(item('area', 'put_in'), false));
    expect(quiet.style).toContain('width:22px;height:22px;');
    expect(quiet.style).toContain(`border:2px solid ${TEAL};`);
    expect(quiet.style).toMatch(/opacity:0\.6$/);
    expect(quiet).toMatchObject({ glyph: '13', stroke: TEAL, paths: PADDLE_GLYPH_PATHS.put_in });
  });

  it('FE-PADDLE-MAP-010: draws a picked Leaflet marker larger, with a heavier solid ring and at full strength', () => {
    for (const relation of RELATIONS) {
      const picked = htmlLook(paddleMarkerHtml(item(relation, 'access'), true));
      expect(picked.style, relation).toContain('width:36px;height:36px;');
      expect(picked.style, relation).toContain(`border:3px solid ${INDIGO};`);
      expect(picked.style, relation).toMatch(/opacity:1$/);
      expect(picked.glyph, relation).toBe('21');
    }
  });

  it('FE-PADDLE-MAP-011: draws the GL image of a marker at twice its size, the ring dashed near the route and faded in the area', () => {
    const onRoute = svgLook(paddleMarkerSvg(item('on_route'), false));
    const near = svgLook(paddleMarkerSvg(item('near', 'lock'), false));
    const quiet = svgLook(paddleMarkerSvg(item('area', 'put_in'), false));
    expect(onRoute).toEqual({ size: '60', opacity: '1', r: '26', ring: '4', dash: null, glyph: '35', x: '12.5' });
    expect(near).toEqual({ size: '52', opacity: '1', r: '22', ring: '4', dash: '6 5', glyph: '30', x: '11' });
    expect(quiet).toEqual({ size: '44', opacity: '0.6', r: '18', ring: '4', dash: null, glyph: '26', x: '9' });

    const weir = parseSvg(paddleMarkerSvg(item('on_route'), false));
    expect(weir.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(weir.getElementsByTagName('circle').item(0)?.getAttribute('stroke')).toBe(SLATE);
    expect(weir.getElementsByTagName('svg').item(0)?.getAttribute('stroke')).toBe(SLATE);
    expect(pathsOf(weir)).toEqual(PADDLE_GLYPH_PATHS.weir);
  });

  it('FE-PADDLE-MAP-012: draws a picked GL image larger and solid, every look at twice the size of its Leaflet twin', () => {
    const picked = { size: '72', opacity: '1', r: '31', ring: '6', dash: null, glyph: '42', x: '15' };
    for (const relation of RELATIONS) {
      expect(svgLook(paddleMarkerSvg(item(relation), true)), relation).toEqual(picked);
      for (const selected of [false, true]) {
        const { size } = svgLook(paddleMarkerSvg(item(relation), selected));
        expect(size, relation).toBe(String(markerSize(relation, selected) * 2));
      }
    }
  });

  it('FE-PADDLE-MAP-013: names one GL image per look, which two kinds that look alike share', () => {
    expect(paddleMarkerImageId(item('on_route'), false)).toBe('trek-paddle-weir-334155ffffff-on_route');
    expect(paddleMarkerImageId(item('on_route'), true)).toBe('trek-paddle-weir-334155ffffff-on_route-sel');
    expect(paddleMarkerImageId(item('near', 'egress'), false)).toBe('trek-paddle-take_out-0f766effffff-near');

    const slipway = item('area', 'slipway');
    const putIn = item('area', 'put_in', 'node/9');
    expect(paddleMarkerImageId(slipway, false)).toBe(paddleMarkerImageId(putIn, false));
    expect(paddleMarkerSvg(slipway, false)).toBe(paddleMarkerSvg(putIn, false));

    const looks = RELATIONS.flatMap((relation) =>
      [false, true].map((selected) => paddleMarkerImageId(item(relation), selected))
    );
    expect(new Set(looks).size).toBe(6);
  });

  it('FE-PADDLE-MAP-014: renders a glyph as standalone SVG in the size and colour it is asked for', () => {
    const glyph = parseSvg(paddleGlyphSvg('lock', 20, INDIGO));
    expect(glyph.getAttribute('width')).toBe('20');
    expect(glyph.getAttribute('height')).toBe('20');
    expect(glyph.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(glyph.getAttribute('fill')).toBe('none');
    expect(glyph.getAttribute('stroke')).toBe(INDIGO);
    expect(pathsOf(glyph)).toEqual(PADDLE_GLYPH_PATHS.lock);
  });

  it('FE-PADDLE-MAP-015: hands the map no part of the object data, so a hostile name in OSM cannot reach the markup', () => {
    const hostile = '<img src=x onerror=alert(1)>';
    const entry = { ...feature('way/1', 'weir'), name: hostile, tags: { name: hostile, note: hostile } };
    const [drawn] = paddleMapItems([entry], [related(entry, 'near')], PAINT);
    const markup = [false, true].flatMap((selected) => [
      paddleMarkerHtml(drawn, selected),
      paddleMarkerSvg(drawn, selected),
      paddleMarkerImageId(drawn, selected),
    ]);
    for (const text of markup) expect(text).not.toContain('onerror');
    expect(parseHtml(paddleMarkerHtml(drawn, true)).querySelector('img')).toBeNull();
  });
});

describe('the selected lock (PAD-06)', () => {
  const chamber = { ...feature('way/7', 'lock'), group_key: 'lock:node/3' };
  const gate = { ...feature('node/3', 'lock_gate'), group_key: 'lock:node/3' };
  const weir = feature('node/9', 'weir');
  const items = paddleMapItems([chamber, gate, weir], [], PAINT);

  it('FE-PADDLE-MAP-016: the key of the selected object is its lock, or its own ref, and nothing without a selection', () => {
    expect(selectedPaddleKey([chamber, gate, weir], 'way/7')).toBe('lock:node/3');
    expect(selectedPaddleKey([chamber, gate, weir], 'node/9')).toBe('node/9');
    expect(selectedPaddleKey([chamber, gate, weir], 'node/404')).toBeNull();
    expect(selectedPaddleKey([chamber, gate, weir], null)).toBeNull();
  });

  it('FE-PADDLE-MAP-017: every part of a selected lock shows as selected, another object does not', () => {
    const selected = items.filter((item) => isPaddleItemSelected(item, 'way/7', 'lock:node/3'));
    expect(selected.map((item) => item.feature.ref)).toEqual(['way/7', 'node/3']);
    expect(items.filter((item) => isPaddleItemSelected(item, 'node/9', 'node/9')).map((i) => i.feature.ref)).toEqual([
      'node/9',
    ]);
    expect(items.some((item) => isPaddleItemSelected(item, null, null))).toBe(false);
  });
});
