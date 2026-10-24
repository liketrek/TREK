import { type Pt, clockwise, leafAlong, onCircle, polyPath, seeded, smoothPath, taper } from './shapeDraw';
import { circle } from './shapePrimitives';

/**
 * Paper cut-outs, in the manner of the late Matisse: leaves, coral, weed,
 * wonky stars and a sun with flames for rays, and three not-quite circles.
 *
 * They are drawn from a few numbers and a fixed seed rather than traced, so
 * every one is asymmetric the way a hand with scissors is, and the same on
 * every machine. A cut-out reads by its silhouette, so each is one fill with
 * no inner lines; the parts of the coral and the weed overlap and are wound
 * alike, which joins them.
 */

/** A closed outline from a radius at each angle, angles in degrees clockwise from the top. */
function polar(n: number, radius: (deg: number, i: number) => number, cx = 50, cy = 50): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const deg = (360 / n) * i;
    return onCircle(cx, cy, radius(deg, i), deg - 90);
  });
}

/** A circle that wanders: a few slow waves added to its radius. */
function organic(seed: number, amount: number): string {
  const rnd = seeded(seed);
  const waves = [2, 3, 5].map((k, i) => ({ k, a: amount * [1, 0.55, 0.3][i], p: rnd() * Math.PI * 2 }));
  const pts = polar(28, (deg) => {
    const t = (deg * Math.PI) / 180;
    return 50 * (1 + waves.reduce((sum, w) => sum + w.a * Math.sin(w.k * t + w.p), 0));
  });
  return smoothPath(clockwise(pts));
}

/** Five points cut by hand: tips of different lengths, sides that bow, nothing quite regular. */
function organicStar(): string {
  const rnd = seeded(11);
  const pts: Pt[] = [];
  const sharp = new Set<number>();
  for (let i = 0; i < 5; i++) {
    const tipDeg = 72 * i + (rnd() - 0.5) * 10;
    const valleyDeg = 72 * i + 36 + (rnd() - 0.5) * 8;
    sharp.add(pts.length);
    pts.push(onCircle(50, 50, 44 + rnd() * 8, tipDeg - 90));
    // A point either side of the valley, pushed out, bows the sides.
    pts.push(onCircle(50, 50, 30 + rnd() * 3, valleyDeg - 104));
    pts.push(onCircle(50, 50, 19 + rnd() * 4, valleyDeg - 90));
    pts.push(onCircle(50, 50, 30 + rnd() * 3, valleyDeg - 76));
  }
  return smoothPath(clockwise(pts), 0.35, sharp);
}

/** A disc with flames for rays, each one leaning the same way, as a cut sun does. */
function sunCutout(): string {
  const rnd = seeded(5);
  const rays = 14;
  const pts: Pt[] = [];
  const sharp = new Set<number>();
  for (let i = 0; i < rays; i++) {
    const a = (360 / rays) * i;
    pts.push(onCircle(50, 50, 31 + rnd() * 2, a - 90));
    pts.push(onCircle(50, 50, 40, a + 360 / rays / 2 - 96));
    sharp.add(pts.length);
    pts.push(onCircle(50, 50, 46 + rnd() * 4, a + 360 / rays / 2 - 84));
  }
  return smoothPath(clockwise(pts), 0.15, sharp);
}

/** A long willow leaf on a curving midrib, its stem left on. */
function leafLong(): string {
  const spine: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const u = 1 - t;
    // A quadratic from the stem to the tip, bowed to one side.
    spine.push([u * u * 34 + 2 * u * t * 58 + t * t * 44, u * u * 200 + 2 * u * t * 110 + t * t * 0]);
  }
  const width = (t: number) => (t < 0.07 ? 4 : 44 * Math.sin(Math.PI * ((t - 0.07) / 0.93) ** 1.15) ** 0.9 + 1.2);
  return smoothPath(taper(spine, width), 0.1);
}

/** An oak leaf: a midrib with rounded lobes, the two sides out of step. */
function leafOak(): string {
  const n = 80;
  const sideA: Pt[] = [];
  const sideB: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = 200 - t * 200;
    const stem = t < 0.08;
    const env = stem ? 3 : 46 * Math.sin(Math.PI * ((t - 0.08) / 0.92) ** 0.85) ** 0.75 + 1;
    const lobe = (phase: number) => (stem ? 1 : 0.55 + 0.45 * Math.abs(Math.cos(Math.PI * 4.5 * t + phase)) ** 0.6);
    sideA.push([50 - env * lobe(0), y]);
    sideB.push([50 + env * lobe(0.9), y]);
  }
  return smoothPath(clockwise([...sideA, ...sideB.reverse()]));
}

/** A palmette: five fingers fanned from one stem, the outer ones shorter. */
function leafPalm(): string {
  const pts: Pt[] = [];
  const base: Pt = [100, 150];
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const deg = 200 + u * 140;
    const finger = Math.abs(Math.sin(Math.PI * 5 * u)) ** 0.55;
    const reach = 0.72 + 0.28 * Math.sin(Math.PI * u);
    pts.push(onCircle(base[0], base[1], 38 + 108 * finger * reach, deg));
  }
  // The stem, out of the bottom of the fan.
  pts.push([108, 156], [106, 200], [96, 200], [93, 156]);
  return polyPath(clockwise(pts.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100] as Pt)));
}

/** A monstera leaf: a broad heart with its slits cut in from the edge towards the midrib. */
function leafMonstera(): string {
  const pts: Pt[] = [];
  const slits = [62, 92, 122, 238, 268, 298];
  const steps = 240;
  for (let i = 0; i < steps; i++) {
    const deg = (360 / steps) * i;
    const t = (deg * Math.PI) / 180;
    // The heart curve, with its notch at the top where the stalk joins.
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const edge: Pt = [50 + x * 3, 48 - y * 3];
    const slit = slits.find((s) => Math.abs(deg - s) < 0.75);
    if (slit !== undefined) {
      // In towards the middle and back out: a cut two scissor strokes wide.
      pts.push(edge);
      pts.push([50 + (edge[0] - 50) * 0.42, 52 + (edge[1] - 52) * 0.42]);
    } else {
      pts.push(edge);
    }
  }
  return polyPath(clockwise(pts.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100] as Pt)));
}

interface Branch {
  from: Pt;
  deg: number;
  length: number;
  width: number;
}

/**
 * Coral, grown: stubby branches with round ends, splitting into two or three
 * that lean apart, from a few stems at the foot. Seeded, so the same coral
 * every time.
 */
function coral(seed: number, depth: number, spread: number, stems: number): string {
  const rnd = seeded(seed);
  const parts: string[] = [];
  const grow = (b: Branch, level: number) => {
    const bend = (rnd() - 0.5) * 24;
    const spine: Pt[] = [];
    for (let i = 0; i <= 8; i++) spine.push(onCircle(b.from[0], b.from[1], b.length * (i / 8), b.deg + bend * (i / 8)));
    const tipWidth = b.width * 0.82;
    parts.push(smoothPath(taper(spine, (t) => b.width + (tipWidth - b.width) * t)));
    const end = spine[spine.length - 1];
    // A round end, the way scissors cut a finger of paper.
    parts.push(circle(end[0], end[1], tipWidth / 2, tipWidth / 2));
    if (level >= depth) return;
    const kids = rnd() < 0.4 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const lean = (k - (kids - 1) / 2) * spread + (rnd() - 0.5) * 14;
      const next = {
        from: end,
        deg: b.deg + bend + lean,
        length: b.length * (0.74 + rnd() * 0.2),
        width: tipWidth * 0.9,
      };
      grow(next, level + 1);
    }
  };
  for (let i = 0; i < stems; i++) {
    const deg = -90 + (i - (stems - 1) / 2) * 30 + (rnd() - 0.5) * 8;
    grow({ from: [100 + (i - (stems - 1) / 2) * 8, 200], deg, length: 48 + rnd() * 10, width: 19 }, 0);
  }
  return parts.join('');
}

/** A frond of weed: a swaying stem with blades along it, alternately left and right. */
function seaweed(): string {
  const spine: Pt[] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    spine.push([50 + 12 * Math.sin(t * Math.PI * 2.2), 200 - t * 196]);
  }
  const parts = [smoothPath(taper(spine, (t) => 9 - t * 6))];
  for (let i = 3; i < 28; i += 3) {
    const at = spine[i];
    const side = i % 2 === 0 ? 1 : -1;
    const tip: Pt = [at[0] + side * (34 - i * 0.6), at[1] - 26 + i * 0.2];
    parts.push(smoothPath(leafAlong(at, tip, 13 - i * 0.2, 0.4 * side)));
  }
  return parts.join('');
}

export const CUTOUT_PATHS = {
  'leaf-palm': leafPalm(),
  'leaf-oak': leafOak(),
  'leaf-long': leafLong(),
  'leaf-monstera': leafMonstera(),
  'coral-1': coral(3, 3, 40, 2),
  'coral-2': coral(19, 3, 34, 3),
  seaweed: seaweed(),
  'star-organic': organicStar(),
  'sun-cutout': sunCutout(),
  'organic-1': organic(2, 0.07),
  'organic-2': organic(9, 0.09),
  'organic-3': organic(31, 0.06),
} as const;
