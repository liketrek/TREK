import { BOOK_SHAPE_ASPECT, BOOK_SHAPES_MORE, bookPhotoElementSchema, bookShapeElementSchema } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import {
  anticlockwise,
  arcTo,
  clockwise,
  leafAlong,
  seeded,
  seedOf,
  signedArea,
  smoothPath,
  taper,
} from '../../../src/components/Studio/shapeDraw';
import {
  DEFAULT_EDGE_SIZE,
  hasEdge,
  photoClip,
  shapeOutline,
  shapeTile,
} from '../../../src/components/Studio/shapeOutline';
import { FRAME_SHAPES, SHAPE_GROUPS, SHAPE_PATHS } from '../../../src/components/Studio/shapes';
import { MORE_SHAPE_PATHS } from '../../../src/components/Studio/shapes-more';

/**
 * The second shelf of shapes and the tools they are drawn with.
 *
 * shapes.test.ts already holds every shape to the path subset, the 0..100 box
 * and the winding rule; this pins what is new: the proportions recorded in the
 * shared contract match the drawings, the tiles are drawn at them, the
 * hand-cut shapes come out the same every time, and the outline a shape or a
 * photo is drawn with picks up its edge only where an edge is cut.
 */

/** The box a raw path's ink occupies, curves sampled. */
function bounds(path: string) {
  const nums = (path.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const cmds = path.match(/[MLCQZ]/g) ?? [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const hit = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  };
  for (const c of cmds) {
    if (c === 'Z') continue;
    if (c === 'M' || c === 'L') {
      cx = nums[i++];
      cy = nums[i++];
      hit(cx, cy);
      continue;
    }
    const k = c === 'Q' ? 4 : 6;
    const a = nums.slice(i, i + k);
    i += k;
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const u = 1 - t;
      if (c === 'Q') hit(u * u * cx + 2 * u * t * a[0] + t * t * a[2], u * u * cy + 2 * u * t * a[1] + t * t * a[3]);
      else {
        hit(
          u * u * u * cx + 3 * u * u * t * a[0] + 3 * u * t * t * a[2] + t * t * t * a[4],
          u * u * u * cy + 3 * u * u * t * a[1] + 3 * u * t * t * a[3] + t * t * t * a[5]
        );
      }
    }
    cx = a[k - 2];
    cy = a[k - 1];
  }
  return { w: x1 - x0, h: y1 - y0 };
}

describe('the second shelf', () => {
  it('FE-STUDIO-SHAPES2-001: draws every id the contract lists, at the proportions the contract records', () => {
    const off: string[] = [];
    for (const id of BOOK_SHAPES_MORE) {
      expect(MORE_SHAPE_PATHS[id], id).toMatch(/^M/);
      const b = bounds(MORE_SHAPE_PATHS[id]);
      const drawn = b.w / b.h;
      if (Math.abs(drawn - BOOK_SHAPE_ASPECT[id]) > 0.03) off.push(`${id}: ${drawn.toFixed(2)}`);
    }
    expect(off).toEqual([]);
  });

  it('FE-STUDIO-SHAPES2-002: groups every new shape once, and offers the broad ones as photo frames', () => {
    const grouped = SHAPE_GROUPS.flatMap((g) => g.shapes);
    for (const id of BOOK_SHAPES_MORE)
      expect(
        grouped.filter((s) => s === id),
        id
      ).toHaveLength(1);
    for (const id of ['arch-tall', 'stamp-rect', 'frame-notched', 'organic-1'] as const)
      expect(FRAME_SHAPES).toContain(id);
    for (const id of ['laurel', 'coral-1', 'postmark', 'arrow-thin'] as const) expect(FRAME_SHAPES).not.toContain(id);
  });

  it('FE-STUDIO-SHAPES2-003: draws a tile at the shape proportions, and a first-shelf shape in its square', () => {
    const scroll = shapeTile('flourish-scroll');
    expect(scroll.w).toBe(100);
    expect(scroll.h).toBeCloseTo(100 / BOOK_SHAPE_ASPECT['flourish-scroll'], 5);
    const arch = shapeTile('arch-tall');
    expect([arch.w, arch.h]).toEqual([50, 100]);
    expect(shapeTile('heart')).toEqual({ d: SHAPE_PATHS.heart, w: 100, h: 100 });
  });
});

describe('the drawing tools', () => {
  it('FE-STUDIO-SHAPES2-004: winds a ring either way on request and measures it with the sign the tests read', () => {
    const square: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(signedArea(square)).toBe(100);
    expect(signedArea(clockwise([...square].reverse()))).toBe(100);
    expect(signedArea(anticlockwise(square))).toBe(-100);
  });

  it('FE-STUDIO-SHAPES2-005: tears and seeds the same way every time', () => {
    const a = seeded(seedOf('s-abc'));
    const b = seeded(seedOf('s-abc'));
    const run = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(run);
    for (const v of run) expect(v).toBeGreaterThanOrEqual(0);
    expect(seedOf('a')).not.toBe(seedOf('b'));
  });

  it('FE-STUDIO-SHAPES2-006: draws smooth outlines, tapered strokes, leaves and arcs in the path subset', () => {
    const ring: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
    ];
    expect(smoothPath(ring)).toMatch(/^M0 0(C[-\d. ]+){3}Z$/);
    expect(smoothPath(ring, 0.5, new Set([1]))).toContain('C10 0 ');
    const stroke = taper(
      [
        [0, 0],
        [10, 0],
        [20, 0],
      ],
      () => 2
    );
    expect(stroke).toHaveLength(6);
    expect(signedArea(stroke)).toBeGreaterThan(0);
    const pointed = taper(
      [
        [0, 0],
        [10, 0],
      ],
      (t) => (t === 0 ? 0 : 2)
    );
    expect(pointed).toHaveLength(3);
    const tipped = taper(
      [
        [0, 0],
        [10, 0],
      ],
      (t) => (t === 1 ? 0 : 2)
    );
    expect(tipped).toHaveLength(3);
    expect(signedArea(leafAlong([0, 0], [20, 0], 6, 0.4))).toBeGreaterThan(0);
    expect(arcTo(0, 0, 10, 0, 180).match(/C/g)).toHaveLength(2);
  });
});

describe('the outline a shape is drawn with', () => {
  it('FE-STUDIO-SHAPES2-007: cuts an edge along the shapes that take one and keeps the drawn outline elsewhere', () => {
    const frame = { x: 0, y: 0, w: 60, h: 40 };
    const rect = bookShapeElementSchema.parse({ id: 's1', kind: 'shape', frame, edge: 'zigzag' });
    const heart = bookShapeElementSchema.parse({ id: 's2', kind: 'shape', frame, shape: 'heart', edge: 'zigzag' });
    expect(hasEdge(rect, rect.shape)).toBe(true);
    expect(hasEdge(heart, heart.shape)).toBe(false);
    expect(hasEdge({ edge: 'straight' }, 'rect')).toBe(false);
    expect(shapeOutline(rect, 60, 40).match(/L/g)?.length).toBeGreaterThan(20);
    expect(shapeOutline(heart, 60, 40)).not.toMatch(/L.*L.*L.*L.*L.*L.*L.*L.*L/);
    const rounded = shapeOutline({ ...rect, radius: 8, edge: 'wavy' }, 60, 40);
    expect(rounded).toMatch(/^M[\d.]+ [\d.]+L/);
    expect(DEFAULT_EDGE_SIZE).toBe(3);
  });

  it('FE-STUDIO-SHAPES2-008: gives a photo a 0..1 clip for a mask or an edge, and none for the plain rectangle', () => {
    const frame = { x: 0, y: 0, w: 60, h: 40 };
    const plain = bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame });
    expect(photoClip(plain, 60, 40)).toBeNull();
    expect(photoClip({ ...plain, mask: 'rect' }, 60, 40)).toBeNull();
    const masked = photoClip({ ...plain, mask: 'arch-tall' }, 60, 40);
    const stamp = photoClip({ ...plain, edge: 'perforated', edgeSize: 2 }, 60, 40);
    for (const clip of [masked, stamp]) {
      const nums = (clip?.match(/-?\d*\.?\d+/g) ?? []).map(Number);
      expect(nums.length).toBeGreaterThan(4);
      expect(Math.min(...nums)).toBeGreaterThanOrEqual(-0.001);
      expect(Math.max(...nums)).toBeLessThanOrEqual(1.001);
    }
    expect(photoClip({ ...plain, edge: 'perforated' }, 0, 40)).toBeNull();
    const edgedArch = photoClip({ ...plain, mask: 'arch-tall', edge: 'scallop' }, 60, 40);
    expect(edgedArch).not.toBe(masked);
  });
});
