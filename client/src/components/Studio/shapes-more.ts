import type { BOOK_SHAPES_MORE } from '@trek/shared';

import {
  type Pt,
  anticlockwise,
  arcPoints,
  arcTo,
  clockwise,
  fmt,
  onCircle,
  polyPath,
  seeded,
  smoothPath,
} from './shapeDraw';
import { K, circle, roundRect, scallop } from './shapePrimitives';
import { CUTOUT_PATHS } from './shapes-cutouts';
import { ORNAMENT_PATHS } from './shapes-ornaments';

/**
 * The second shelf of the shape table (book-shapes-more.ts lists the ids).
 *
 * Each is drawn at the size its arithmetic is easiest in and normalised to
 * the 0..100 box by the table, like every other shape. What a shape looks
 * like at its natural proportions is in `BOOK_SHAPE_ASPECT` (shared), which is
 * what the panel places it at and what its tile is drawn in.
 *
 * The rules of the first shelf hold here too (see shapes.ts): one fill, every
 * part wound clockwise so overlapping parts join, holes only in the shapes
 * listed in `HOLED_SHAPES`, and nothing thin enough to vanish in print.
 */

type MoreId = (typeof BOOK_SHAPES_MORE)[number];
type Own = Exclude<MoreId, keyof typeof CUTOUT_PATHS | keyof typeof ORNAMENT_PATHS>;

/** A semicircle over a base line, left foot to right foot, as cubics: the head of an arch. */
function head(x0: number, x1: number, y: number): string {
  const r = (x1 - x0) / 2;
  const c = x0 + r;
  return `C${x0} ${y - r * K} ${c - r * K} ${y - r} ${c} ${y - r}C${c + r * K} ${y - r} ${x1} ${y - r * K} ${x1} ${y}`;
}

/** A half ring over a base line: one band of a rainbow. */
function band(cx: number, base: number, outer: number, inner: number): string {
  return `M${cx - outer} ${base}${arcTo(cx, base, outer, 180, 360)}L${cx + inner} ${base}${arcTo(cx, base, inner, 360, 180)}Z`;
}

/**
 * A perforated outline, as a sheet of stamps is torn: the edge runs through a
 * row of round holes, so it bites a half circle out every `pitch`.
 */
function perforate(ring: readonly Pt[], pitch: number, radius: number): string {
  const out: Pt[] = [];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const holes = Math.max(1, Math.round(len / pitch));
    const step = len / holes;
    const ux = (b[0] - a[0]) / len;
    const uy = (b[1] - a[1]) / len;
    // Inward is to the right of the direction of travel on a clockwise ring.
    const nx = -uy;
    const ny = ux;
    out.push(a);
    for (let h = 0; h < holes; h++) {
      const mid = step * (h + 0.5);
      for (let s = 0; s <= 8; s++) {
        const ang = Math.PI * (s / 8);
        const along = mid - radius * Math.cos(ang);
        const depth = radius * Math.sin(ang);
        out.push([a[0] + ux * along + nx * depth, a[1] + uy * along + ny * depth]);
      }
    }
  }
  return polyPath(out);
}

/** A ring of points around a circle, for edges cut along one. */
const circleRing = (cx: number, cy: number, r: number, n: number) => arcPoints([cx, cy], r, [-90, 270], n).slice(0, n);

/** A stamp cut round: a disc whose edge runs through a ring of holes. */
// One hole on every side of a fine polygon: the pitch is the side itself.
const perforatedDisc = (holes: number) => perforate(circleRing(50, 50, 50, holes), Infinity, 2.9);

/** An arrow bent along a circle (its centre and radius): a band between two arcs with a head at the end. */
function arcArrow(
  [cx, cy, r]: [number, number, number],
  thick: number,
  [a0, a1]: [number, number],
  head: { length: number; wing: number }
): string {
  const ro = r + thick / 2;
  const ri = r - thick / 2;
  const dir = Math.sign(a1 - a0);
  // The head starts short of the end of the arc and points along it.
  const aEnd = a1 - (dir * ((head.length / r) * 180)) / Math.PI;
  const wing = thick * head.wing;
  const at = (rad: number, deg: number) => fmt(onCircle(cx, cy, rad, deg));
  return (
    `M${at(ro, a0)}${arcTo(cx, cy, ro, a0, aEnd)}L${at(r + wing, aEnd)}L${at(r, a1)}L${at(r - wing, aEnd)}` +
    `L${at(ri, aEnd)}${arcTo(cx, cy, ri, aEnd, a0)}Z`
  );
}

/** A spiky outline, irregular on purpose: what a shout looks like in a comic. */
function shout(): string {
  const rnd = seeded(7);
  const pts: Pt[] = [];
  const spikes = 13;
  for (let i = 0; i < spikes; i++) {
    const a = -90 + (360 / spikes) * i;
    // The spike at about seven o'clock is the tail, long and pointing down.
    const tail = i === 8;
    const outer = tail ? 66 : 47 + rnd() * 7;
    pts.push(onCircle(50, 50, outer, a + (tail ? -6 : 0)));
    pts.push(onCircle(50, 50, 33 + rnd() * 5, a + 360 / spikes / 2));
  }
  return polyPath(clockwise(pts));
}

/** A torn strip of paper: straight-ish ends, both long edges torn. */
function tornStrip(): string {
  const rnd = seeded(23);
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let x = 0; x <= 200; x += 5) {
    top.push([x, 4 + rnd() * 6 + (rnd() < 0.2 ? 3 : 0)]);
    bottom.push([x, 46 - rnd() * 6 - (rnd() < 0.2 ? 3 : 0)]);
  }
  return polyPath(clockwise([...top, ...bottom.reverse()]));
}

/** A band whose two long edges are the same wave, so it keeps one width. */
function wavyBand(): string {
  const pts: Pt[] = [];
  const wave = (x: number) => 14 * Math.sin((x / 200) * Math.PI * 4);
  for (let x = 0; x <= 200; x += 5) pts.push([x, 20 + wave(x)]);
  for (let x = 200; x >= 0; x -= 5) pts.push([x, 56 + wave(x)]);
  return smoothPath(clockwise(pts), 0, new Set([40, 41, 81]));
}

/** A curved banner: an arc of a band with its ends cut into swallow tails. */
function ribbonArc(): string {
  const cx = 100;
  const cy = 260;
  const ro = 240;
  const ri = 196;
  const mid = (ro + ri) / 2;
  const a0 = 248;
  const a1 = 292;
  const at = (rad: number, deg: number) => fmt(onCircle(cx, cy, rad, deg));
  return (
    `M${at(ro, a0)}${arcTo(cx, cy, ro, a0, a1)}L${at(mid, a1 - 3.5)}L${at(ri, a1)}` +
    `${arcTo(cx, cy, ri, a1, a0)}L${at(mid, a0 + 3.5)}Z`
  );
}

/** A star with its tips and valleys rounded off: softer, friendlier, a sticker's star. */
function roundedStar(points: number, inner: number, round: number): string {
  const pts: Pt[] = [];
  for (let i = 0; i < points * 2; i++) {
    pts.push(onCircle(50, 50, i % 2 === 0 ? 50 : 50 * inner, -90 + (180 / points) * i));
  }
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const here = pts[i];
    const next = pts[(i + 1) % n];
    const f = i % 2 === 0 ? round : round * 0.6;
    const a: Pt = [here[0] + (prev[0] - here[0]) * f, here[1] + (prev[1] - here[1]) * f];
    const b: Pt = [here[0] + (next[0] - here[0]) * f, here[1] + (next[1] - here[1]) * f];
    d += `${i === 0 ? 'M' : 'L'}${fmt(a)}Q${fmt(here)} ${fmt(b)}`;
  }
  return `${d}Z`;
}

/** An eight-ray twinkle: four long rays and four short, every side drawn in. */
function twinkle(): string {
  const tip = (i: number) => onCircle(50, 50, i % 2 === 0 ? 50 : 27, -90 + 45 * i);
  let d = `M${fmt(tip(0))}`;
  for (let i = 0; i < 8; i++) {
    d += `Q${fmt(onCircle(50, 50, 7, -90 + 45 * i + 22.5))} ${fmt(tip(i + 1))}`;
  }
  return `${d}Z`;
}

/** A sun's rays as wedges between gaps, from a small hub, as a sunburst background is printed. */
function sunburst(rays: number): string {
  const pts: Pt[] = [];
  const half = 360 / rays / 4;
  for (let i = 0; i < rays; i++) {
    const a = -90 + (360 / rays) * i;
    pts.push(onCircle(50, 50, 5, a - half * 1.6));
    pts.push(onCircle(50, 50, 50, a - half));
    pts.push(onCircle(50, 50, 50, a + half));
    pts.push(onCircle(50, 50, 5, a + half * 1.6));
  }
  return polyPath(clockwise(pts));
}

/** A rosette: a frilled disc over two tails cut into swallow points. */
function rosette(): string {
  const disc = scallop(18, 0.07);
  // The tails hang from under the disc, splayed, each cut into a V.
  const left = polyPath(
    clockwise([
      [34, 62],
      [52, 70],
      [38, 132],
      [29, 118],
      [17, 124],
    ])
  );
  const right = polyPath(
    clockwise([
      [48, 70],
      [66, 62],
      [83, 124],
      [71, 118],
      [62, 132],
    ])
  );
  return `${disc}${left}${right}`;
}

/** Two hearts, the smaller one tucked in front and tilted, for a page about two people. */
function heartPair(): string {
  const heart = (cx: number, cy: number, s: number, turn: number): string => {
    const raw: Pt[] = [];
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      // The classic heart curve, which has a real point and two round lobes.
      const x = 16 * Math.sin(t) ** 3;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const a = (turn * Math.PI) / 180;
      raw.push([cx + s * (x * Math.cos(a) - y * Math.sin(a)), cy + s * (x * Math.sin(a) + y * Math.cos(a))]);
    }
    return smoothPath(clockwise(raw), 0.2, new Set([0, 24]));
  };
  return `${heart(42, 46, 2.5, -12)}${heart(84, 74, 1.7, 14)}`;
}

/** A plump heart: round lobes, a shallow notch and a soft point. */
const HEART_ROUND =
  'M50 96C44 92 0 68 0 34C0 14 14 2 30 2C40 2 47 8 50 15C53 8 60 2 70 2C86 2 100 14 100 34C100 68 56 92 50 96Z';

/** A rectangle whose sides bow out a little and whose corners are round: an old television. */
const CUSHION =
  'M20 0C40 -4 60 -4 80 0C92 2 98 8 100 20C104 40 104 60 100 80C98 92 92 98 80 100' +
  'C60 104 40 104 20 100C8 98 2 92 0 80C-4 60 -4 40 0 20C2 8 8 2 20 0Z';

const MORE_OWN_PATHS: Record<Own, string> = {
  'arch-tall': `M0 200L0 50${head(0, 100, 50)}L100 200Z`,
  'arch-pointed': 'M0 190L0 86.6C0 50.9 19.1 17.85 50 0C80.9 17.85 100 50.9 100 86.6L100 190Z',
  'arch-double': `M0 160L0 50${head(0, 100, 50)}${head(100, 200, 50)}L200 160Z`,
  'arch-half': `M0 160L0 100C0 ${100 - 100 * K} ${100 - 100 * K} 0 100 0L100 160Z`,
  'arch-rainbow': `${band(100, 100, 100, 76)}${band(100, 100, 68, 44)}${band(100, 100, 36, 12)}`,

  'stamp-rect': perforate(
    [
      [0, 0],
      [100, 0],
      [100, 124],
      [0, 124],
    ],
    11,
    4
  ),
  'stamp-circle': perforatedDisc(34),
  postmark:
    `${circle(50, 50, 50, 50)}${polyPath(anticlockwise(circleRing(50, 50, 43, 48)))}` +
    `${circle(50, 50, 37, 37)}${polyPath(anticlockwise(circleRing(50, 50, 34, 48)))}`,
  rosette: rosette(),
  'scallop-circle': scallop(24, 0.075),
  'badge-shield': 'M0 4Q50 18 100 4L100 52C100 78 76 93 50 100C24 93 0 78 0 52Z',
  'label-tab':
    'M30 0L154 0C157.31 0 160 2.69 160 6L160 74C160 77.31 157.31 80 154 80L30 80L0 54L0 26Z' +
    polyPath(anticlockwise(circleRing(24, 40, 7, 24))),
  'ticket-stub':
    'M0 0L141 0C141 5 145 9 150 9C155 9 159 5 159 0L200 0L200 90L159 90C159 85 155 81 150 81' +
    'C145 81 141 85 141 90L0 90Z',
  'sunburst-12': sunburst(12),
  'sunburst-24': sunburst(24),

  'ribbon-ends':
    'M30 0L170 0L170 40L30 40Z' +
    polyPath(
      clockwise([
        [0, 14],
        [44, 14],
        [44, 54],
        [0, 54],
        [12, 34],
      ])
    ) +
    polyPath(
      clockwise([
        [156, 14],
        [200, 14],
        [188, 34],
        [200, 54],
        [156, 54],
      ])
    ),
  'ribbon-arc': ribbonArc(),
  'wavy-band': wavyBand(),
  'torn-strip': tornStrip(),

  'bubble-shout': shout(),
  'bubble-side': `${roundRect(20, 16, 0, 84, 70)}${polyPath(
    clockwise([
      [24, 36],
      [24, 60],
      [0, 70],
    ])
  )}`,
  'bubble-capsule': `${roundRect(35, 0, 0, 200, 70)}${polyPath(
    clockwise([
      [52, 60],
      [84, 60],
      [40, 96],
    ])
  )}`,

  'arrow-curve': arcArrow([100, 170, 140], 16, [222, 318], { length: 34, wing: 1.55 }),
  'arrow-circle': arcArrow([50, 50, 40], 14, [-70, 225], { length: 18, wing: 1.3 }),
  'arrow-notched': 'M0 25L130 25L130 0L200 50L130 100L130 75L0 75L22 50Z',
  'arrow-thin': 'M0 47L168 47L160 32L200 50L160 68L168 53L0 53Z',

  'heart-round': HEART_ROUND,
  'heart-pair': heartPair(),
  'star-rounded': roundedStar(5, 0.46, 0.2),
  'star-twinkle': twinkle(),
  'flower-8': scallop(8, 0.34),

  'frame-notched':
    'M12 0L88 0C88 6.63 93.37 12 100 12L100 88C93.37 88 88 93.37 88 100L12 100' +
    'C12 93.37 6.63 88 0 88L0 12C6.63 12 12 6.63 12 0Z',
  'frame-chamfer': 'M14 0L86 0L100 14L100 86L86 100L14 100L0 86L0 14Z',
  'frame-cushion': CUSHION,
};

export const MORE_SHAPE_PATHS: Record<MoreId, string> = {
  ...MORE_OWN_PATHS,
  ...CUTOUT_PATHS,
  ...ORNAMENT_PATHS,
};
