import type { BookEdge } from '@trek/shared';

import { type Pt, seeded, signedArea } from './shapeDraw';

/**
 * Cut edges: an outline replaced by pinking-shear teeth, scallops, a postage
 * stamp's perforation, a wave, a torn sheet or the soft deckle of handmade
 * paper.
 *
 * ── How it is cut ────────────────────────────────────────────────────────
 *
 * The outline is first flattened into points in millimetres and split at its
 * corners into runs: a rectangle is four, a circle one. Each run gets a whole
 * number of teeth, stretched a little to fit, so a tooth never ends half way
 * along a side and every corner lands on the outline itself. Then each point
 * is pushed inwards along the outline's normal by the profile of the edge.
 *
 * Inwards, always: the cut bites into the shape and never past its frame, so
 * what the editor snaps is still where the shape ends.
 *
 * Millimetres rather than the 0..100 box, because a tooth is a physical size.
 * A stamp's perforation is a few millimetres whatever the stamp, and a frame
 * twice as wide gets twice the holes, not holes twice as wide.
 */

/** The most points an edge draws: a spread-wide strip at a fine edge stays under it. */
const MAX_POINTS = 3000;

/** Under this many degrees between two segments the outline is a curve, past it a corner. */
const CORNER_DEG = 24;

const r2 = (n: number) => Math.round(n * 100) / 100;

/** The outline as points, curves flattened; only the first subpath, which is the outline of the shapes that take an edge. */
export function flattenPath(d: string, step = 0.5): Pt[] {
  const nums = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  const cmds = d.match(/[MLCQZ]/g) ?? [];
  const pts: Pt[] = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  for (const cmd of cmds) {
    if (cmd === 'Z') break;
    if (cmd === 'M' || cmd === 'L') {
      cx = nums[i++];
      cy = nums[i++];
      pts.push([cx, cy]);
      continue;
    }
    const c = nums.slice(i, i + (cmd === 'Q' ? 4 : 6));
    i += c.length;
    const [x, y] = [c[c.length - 2], c[c.length - 1]];
    const chord = Math.hypot(x - cx, y - cy) + Math.hypot(c[0] - cx, c[1] - cy);
    const n = Math.max(4, Math.min(80, Math.ceil(chord / step)));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      if (cmd === 'Q') {
        pts.push([u * u * cx + 2 * u * t * c[0] + t * t * x, u * u * cy + 2 * u * t * c[1] + t * t * y]);
      } else {
        pts.push([
          u * u * u * cx + 3 * u * u * t * c[0] + 3 * u * t * t * c[2] + t * t * t * x,
          u * u * u * cy + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * y,
        ]);
      }
    }
    cx = x;
    cy = y;
  }
  // The closing point repeats the first on most outlines; one is enough.
  const out = pts.filter((p, k) => k === 0 || Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) > 1e-6);
  const first = out[0];
  const last = out[out.length - 1];
  if (first && last && out.length > 1 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-6) out.pop();
  return out;
}

function turnAt(prev: Pt, here: Pt, next: Pt): number {
  const a = Math.atan2(here[1] - prev[1], here[0] - prev[0]);
  const b = Math.atan2(next[1] - here[1], next[0] - here[0]);
  let d = ((b - a) * 180) / Math.PI;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return Math.abs(d);
}

/** The outline split at its corners into runs, each from one corner to the next; a smooth ring is one run. */
export function outlineRuns(ring: readonly Pt[]): Pt[][] {
  const n = ring.length;
  const corners: number[] = [];
  for (let k = 0; k < n; k++) {
    if (turnAt(ring[(k - 1 + n) % n], ring[k], ring[(k + 1) % n]) > CORNER_DEG) corners.push(k);
  }
  if (!corners.length) return [[...ring, ring[0]]];
  return corners.map((start, c) => {
    const end = corners[(c + 1) % corners.length];
    const run: Pt[] = [];
    for (let k = start; ; k = (k + 1) % n) {
      run.push(ring[k]);
      if (k === end && run.length > 1) break;
    }
    return run;
  });
}

/** A run resampled every `step` along its length, both ends kept. */
function resample(run: readonly Pt[], count: number): { pts: Pt[]; length: number } {
  const lengths = [0];
  for (let k = 1; k < run.length; k++) {
    lengths.push(lengths[k - 1] + Math.hypot(run[k][0] - run[k - 1][0], run[k][1] - run[k - 1][1]));
  }
  const length = lengths[lengths.length - 1];
  const pts: Pt[] = [];
  let seg = 1;
  for (let k = 0; k <= count; k++) {
    const s = (length * k) / count;
    while (seg < run.length - 1 && lengths[seg] < s) seg++;
    const s0 = lengths[seg - 1];
    const s1 = lengths[seg];
    const t = s1 > s0 ? (s - s0) / (s1 - s0) : 0;
    const a = run[seg - 1];
    const b = run[seg];
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return { pts, length };
}

/** How far in an edge cuts at a point `t` teeth along (t in 0..1 within one tooth), as a share of its depth. */
type Profile = (t: number, index: number) => number;

/** Smooth noise along a run: values at whole steps, eased between. */
function noise(rnd: () => number, n: number): (x: number) => number {
  const values = Array.from({ length: n + 2 }, () => rnd());
  return (x) => {
    const k = Math.floor(x);
    const f = x - k;
    const e = f * f * (3 - 2 * f);
    return values[k % values.length] * (1 - e) + values[(k + 1) % values.length] * e;
  };
}

interface EdgeSpec {
  /** An irregular edge eases out towards a corner, or each corner grows a spike where two tears meet. */
  eases?: boolean;
  /** Teeth per tooth length: how many points one tooth is drawn with. */
  samples: number;
  /** Depth of the cut, as a share of the edge size. */
  depth: number;
  profile: (rnd: () => number, teeth: number) => Profile;
}

/*
 * Each profile is 0 at the ends of a tooth, so corners stay on the outline,
 * and at most 1 inside it.
 */
const SPECS: Record<Exclude<BookEdge, 'straight'>, EdgeSpec> = {
  // Pinking shears: a point at each end, a valley in the middle.
  zigzag: { samples: 2, depth: 0.5, profile: () => (t) => (Math.abs(t - 0.5) < 0.01 ? 1 : 0) },
  // Half circles bulging out from each end of a tooth, meeting in a valley at its middle.
  scallop: {
    samples: 12,
    depth: 0.5,
    profile: () => (t) => 1 - Math.sqrt(Math.max(0, 1 - (2 * Math.min(t, 1 - t)) ** 2)),
  },
  // The edge runs through a row of round holes: a half circle out of the middle of each tooth.
  perforated: {
    samples: 16,
    depth: 0.3,
    profile: () => (t) => {
      const r = 0.3;
      const u = t - 0.5;
      return Math.abs(u) < r ? Math.sqrt(r * r - u * u) / r : 0;
    },
  },
  wavy: { samples: 12, depth: 0.35, profile: () => (t) => 0.5 - 0.5 * Math.cos(Math.PI * 2 * t) },
  // Torn paper: an uneven slope with sharp little teeth on it.
  torn: {
    eases: true,
    samples: 3,
    depth: 0.8,
    profile: (rnd, teeth) => {
      const slow = noise(rnd, teeth + 4);
      return (t, index) => 0.55 * slow((index + t) / 3) + 0.45 * rnd();
    },
  },
  // Handmade paper: soft, slow, never sharp.
  deckle: {
    eases: true,
    samples: 6,
    depth: 0.5,
    profile: (rnd, teeth) => {
      const slow = noise(rnd, teeth + 4);
      const fine = noise(rnd, teeth * 3 + 6);
      return (t, index) => 0.7 * slow(index + t) + 0.3 * fine((index + t) * 3);
    },
  },
};

/**
 * The outline `d` (millimetres) with its edge cut, `size` millimetres per
 * tooth. `seed` decides how a torn or deckled edge tears; the element id is
 * the usual one, so the same element tears the same way every time.
 */
export function edgedPath(d: string, edge: BookEdge, size: number, seed = 1): string {
  if (edge === 'straight' || size <= 0) return d;
  const ring = flattenPath(d);
  if (ring.length < 3) return d;
  // Inwards is to the right of travel on a ring wound clockwise on screen.
  const inward = signedArea(ring) >= 0 ? 1 : -1;
  const spec = SPECS[edge];
  const rnd = seeded(seed);
  const runs = outlineRuns(ring);
  const perimeter = runs.reduce((sum, run) => sum + resample(run, 1).length, 0);
  // Coarser teeth past the point cap, rather than a path nobody can render.
  const tooth = Math.max(size, (perimeter * spec.samples) / MAX_POINTS);
  const depth = tooth * spec.depth;
  const out: Pt[] = [];
  for (const run of runs) {
    const { length } = resample(run, 1);
    const teeth = Math.max(1, Math.round(length / tooth));
    const { pts } = resample(run, teeth * spec.samples);
    const profile = spec.profile(rnd, teeth);
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[Math.max(0, k - 1)];
      const b = pts[Math.min(pts.length - 1, k + 1)];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = (-(b[1] - a[1]) / len) * inward;
      const ny = ((b[0] - a[0]) / len) * inward;
      const index = Math.floor(k / spec.samples);
      const t = (k % spec.samples) / spec.samples;
      const fromEnd = Math.min(k, pts.length - 1 - k) / spec.samples;
      const ease = spec.eases && runs.length > 1 ? Math.min(1, fromEnd / 1.5) : 1;
      const cut = k === 0 ? 0 : depth * profile(t, index) * ease;
      const p = pts[k];
      out.push([p[0] + nx * cut, p[1] + ny * cut]);
    }
  }
  return `M${out.map(([x, y]) => `${r2(x)} ${r2(y)}`).join('L')}Z`;
}
