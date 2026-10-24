import { type Pt, clockwise, leafAlong, onCircle, smoothPath, taper } from './shapeDraw';

/**
 * Ornaments a title is set between: a scroll, a laurel wreath, a fleuron and
 * a corner flourish. Each is drawn as swelling strokes and leaves, wound alike
 * so the parts join into one fill.
 *
 * The strokes taper to a point rather than ending square, and nothing in them
 * is thinner than about one unit in a hundred, which at the size a divider is
 * set (60 mm and up) is a line a printer still holds.
 */

/** A spiral's centre line, from its outer end inwards, `turns` times round. */
interface Spiral {
  /** The centre it winds round. */
  at: Pt;
  /** The radius it starts at and the one it ends at. */
  from: number;
  to: number;
  /** Where it starts, in degrees clockwise from three o'clock. */
  deg: number;
  turns: number;
  /** 1 winds clockwise, -1 the other way. */
  dir: 1 | -1;
}

function spiral({ at: [cx, cy], from: r0, to: r1, deg: deg0, turns, dir }: Spiral): Pt[] {
  const n = Math.round(24 * turns);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return onCircle(cx, cy, r0 + (r1 - r0) * t, deg0 + dir * 360 * turns * t);
  });
}

/** A stroke that swells in the middle and thins to both ends, the way a pen draws a flourish. */
const swell =
  (thick: number, end = 0.9) =>
  (t: number) =>
    end + (thick - end) * Math.sin(Math.PI * t) ** 0.9;

/** One half of the scroll, drawn to the right of the middle; the left is its mirror. */
function scrollHalf(dir: 1 | -1): string[] {
  const x = (v: number) => 100 + dir * v;
  const arm: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    arm.push([x(9 + t * 64), 20 - 7 * Math.sin(t * Math.PI)]);
  }
  const curl = spiral({ at: [x(82), 22], from: 9, to: 2.5, deg: 270, turns: 0.85, dir });
  const line = [...arm, ...curl.slice(1)];
  const leaf = leafAlong([x(40), 16], [x(54), 4], 6, 0.6 * dir);
  return [smoothPath(taper(line, swell(4.2)), 0.05), smoothPath(leaf)];
}

/** A horizontal scroll: a lozenge in the middle and an arm curling away to each side. */
function flourishScroll(): string {
  const lozenge: Pt[] = [
    [100, 13],
    [108, 20],
    [100, 27],
    [92, 20],
  ];
  return [smoothPath(lozenge, 0.6, new Set([0, 1, 2, 3])), ...scrollHalf(1), ...scrollHalf(-1)].join('');
}

/** One branch of a laurel: a stem round the circle with paired leaves leaning forwards. */
function laurelBranch(dir: 1 | -1): string[] {
  const cx = 100;
  const cy = 96;
  const r = 82;
  const from = dir === 1 ? 98 : 82;
  const to = dir === 1 ? 228 : -48;
  const stem: Pt[] = Array.from({ length: 31 }, (_, i) => onCircle(cx, cy, r, from + ((to - from) * i) / 30));
  const parts = [smoothPath(taper(stem, (t) => 3.6 - t * 2.4))];
  const leaves = 9;
  for (let i = 0; i < leaves; i++) {
    const deg = from + ((to - from) * (i + 0.6)) / (leaves + 0.4);
    const at = onCircle(cx, cy, r, deg);
    const size = 30 - i * 1.4;
    // Each leaf leans along the stem, one outside the circle and one inside it.
    const ahead = deg + dir * 14;
    parts.push(smoothPath(leafAlong(at, onCircle(cx, cy, r + size * 0.62, ahead), size * 0.36, 0.3)));
    if (i < leaves - 1)
      parts.push(smoothPath(leafAlong(at, onCircle(cx, cy, r - size * 0.55, ahead), size * 0.32, -0.3)));
  }
  // A last leaf at the very tip, along the stem.
  const tip = onCircle(cx, cy, r, to);
  parts.push(smoothPath(leafAlong(tip, onCircle(cx, cy, r, to + dir * 12), 9, 0)));
  return parts;
}

/** A laurel wreath, open at the top, its two branches crossing at the foot. */
const laurel = () => [...laurelBranch(1), ...laurelBranch(-1)].join('');

/** The Aldus leaf: a heart-shaped leaf on a stem that curls back on itself. */
function fleuron(): string {
  const leaf: Pt[] = [];
  const turn = (-32 * Math.PI) / 180;
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const hx = 16 * Math.sin(t) ** 3;
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    leaf.push([
      96 + 3.2 * (hx * Math.cos(turn) - hy * Math.sin(turn)),
      62 + 3.2 * (hx * Math.sin(turn) + hy * Math.cos(turn)),
    ]);
  }
  // The stem leaves from the notch of the heart, arches up and curls back.
  const notch = leaf[0];
  const stem: Pt[] = [
    ...Array.from({ length: 14 }, (_, i) => {
      const t = i / 13;
      return [notch[0] + (36 - notch[0]) * t, notch[1] + (22 - notch[1]) * t - Math.sin(t * Math.PI) * 12] as Pt;
    }),
    ...spiral({ at: [26, 34], from: 12, to: 3, deg: 270, turns: 0.9, dir: -1 }).slice(1),
  ];
  return smoothPath(clockwise(leaf), 0.15, new Set([0, 24])) + smoothPath(taper(stem, swell(6, 1.4)), 0.05);
}

/** A corner: two arms along the edges from a curl in the corner, each ending in a small scroll. */
function cornerFlourish(): string {
  const arm = (flip: boolean): string[] => {
    const p = ([a, b]: Pt): Pt => (flip ? [b, a] : [a, b]);
    const line: Pt[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      line.push(p([18 + t * 64, 10 + 5 * Math.sin(t * Math.PI)]));
    }
    const curl = spiral({ at: [90, 18], from: 8, to: 2.4, deg: 270, turns: 0.8, dir: 1 }).map(p);
    const leaf = leafAlong(p([44, 13]), p([56, 27]), 6, 0.4);
    return [smoothPath(taper([...line, ...curl.slice(1)], swell(4)), 0.05), smoothPath(leaf)];
  };
  const knot = spiral({ at: [17, 17], from: 10, to: 3, deg: 225, turns: 0.9, dir: 1 });
  return [...arm(false), ...arm(true), smoothPath(taper(knot, swell(4.4, 1.2)), 0.05)].join('');
}

export const ORNAMENT_PATHS = {
  'flourish-scroll': flourishScroll(),
  laurel: laurel(),
  fleuron: fleuron(),
  'corner-flourish': cornerFlourish(),
} as const;
