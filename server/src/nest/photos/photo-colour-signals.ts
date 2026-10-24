/**
 * What a photo's colours and edges say about where words and frames can go,
 * for the assistant's book design (journey-studio-wp13.md 5.1): its main
 * colours, where it is busy and where calm, and where its detail gathers.
 * Pure arithmetic on the RGBA pixels the measurement already decoded and
 * scaled (photo-signals-runner.ts), run in the same worker thread.
 *
 * None of this sees what is in a photo: the salient point is the centroid of
 * the edges, not a face or a subject, and the palette is colour clustering,
 * not taste.
 */

/** Clusters the palette is made of at most. */
const PALETTE_SIZE = 5;
/** Pixels the clustering looks at at most; a larger picture is sampled evenly. */
const MAX_SAMPLES = 6000;
/** Rounds of k-means after the start from the histogram. */
const ROUNDS = 6;
/** A cluster holding less of the picture than this is left out of the palette. */
const MIN_SHARE = 0.02;
/** Two starting colours at least this far apart (RGB distance), so the palette is not five shades of one sky. */
const MIN_START_DISTANCE = 48;
/** The busy grid's cells per side. */
const GRID = 8;
/** Mean Laplacian magnitude per step of the busy grid's 0..15 scale: 45 and more is 15. */
const BUSY_STEP = 3;

export interface ColourSignals {
  /** Up to five `#rrggbb:share`, most of the picture first; null for a picture with no pixels to read. */
  palette: string[] | null;
  /** 8 x 8 cells, row by row, one hex digit each: 0 calm to f busy. */
  busy: string | null;
  /** The edge-energy centroid, 0..1 of the width and the height; null for a picture without edges. */
  salX: number | null;
  salY: number | null;
}

type Rgb = [number, number, number];

const hex2 = (v: number) =>
  Math.max(0, Math.min(255, Math.round(v)))
    .toString(16)
    .padStart(2, '0');

const distance2 = (a: Rgb, b: Rgb) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/** Every n-th pixel's colour, n chosen so at most MAX_SAMPLES are read. */
function samples(data: Uint8Array, total: number): Rgb[] {
  const stride = Math.max(1, Math.floor(total / MAX_SAMPLES));
  const out: Rgb[] = [];
  for (let i = 0; i < total; i += stride) {
    const o = i * 4;
    out.push([data[o], data[o + 1], data[o + 2]]);
  }
  return out;
}

/** The starting colours: the fullest 4-bit histogram bins, each far enough from the ones before it. */
function startColours(pixels: readonly Rgb[]): Rgb[] {
  const counts = new Map<number, number>();
  for (const [r, g, b] of pixels) {
    const bin = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    counts.set(bin, (counts.get(bin) ?? 0) + 1);
  }
  const bins = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const starts: Rgb[] = [];
  for (const [bin] of bins) {
    const colour: Rgb = [((bin >> 8) & 15) * 16 + 8, ((bin >> 4) & 15) * 16 + 8, (bin & 15) * 16 + 8];
    if (starts.every((s) => distance2(s, colour) >= MIN_START_DISTANCE ** 2)) starts.push(colour);
    if (starts.length === PALETTE_SIZE) break;
  }
  return starts;
}

/** The index of the centre nearest to a colour. */
function nearest(centres: readonly Rgb[], colour: Rgb): number {
  let best = 0;
  let bestDistance = Infinity;
  centres.forEach((centre, i) => {
    const d = distance2(centre, colour);
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}

/** A few rounds of k-means from the histogram's colours; deterministic for the same pixels. */
export function paletteOf(data: Uint8Array, width: number, height: number): string[] | null {
  const pixels = samples(data, width * height);
  if (pixels.length === 0) return null;
  const centres = startColours(pixels);
  let members = new Array<number>(centres.length).fill(0);
  for (let round = 0; round <= ROUNDS; round++) {
    const sums = centres.map((): Rgb => [0, 0, 0]);
    members = new Array<number>(centres.length).fill(0);
    for (const colour of pixels) {
      const at = nearest(centres, colour);
      const sum = sums[at];
      sum[0] += colour[0];
      sum[1] += colour[1];
      sum[2] += colour[2];
      members[at] += 1;
    }
    // The last round only counts: the centres stay where the counting found them.
    if (round === ROUNDS) break;
    sums.forEach((sum, i) => {
      const n = members[i];
      if (n > 0) centres[i] = [sum[0] / n, sum[1] / n, sum[2] / n];
    });
  }
  return centres
    .map((centre, i) => ({ centre, share: members[i] / pixels.length, i }))
    .filter((c) => c.share >= MIN_SHARE)
    .sort((a, b) => b.share - a.share || a.i - b.i)
    .map((c) => `#${hex2(c.centre[0])}${hex2(c.centre[1])}${hex2(c.centre[2])}:${c.share.toFixed(2)}`);
}

/**
 * The busy grid and the salient point from one pass of the grey Laplacian:
 * each cell's mean magnitude on a 0..15 scale, and the centroid of all of it.
 * The caller hands in at least 3 x 3 pixels.
 */
export function edgeSignals(data: Uint8Array, width: number, height: number): Omit<ColourSignals, 'palette'> {
  const grey = new Float32Array(width * height);
  for (let i = 0; i < grey.length; i++) {
    const o = i * 4;
    grey[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  const at = (k: number) => grey[k];
  const sums = new Array<number>(GRID * GRID).fill(0);
  const counts = new Array<number>(GRID * GRID).fill(0);
  let energy = 0;
  let sx = 0;
  let sy = 0;
  for (let row = 1; row < height - 1; row++) {
    const cellRow = Math.min(GRID - 1, Math.floor((row * GRID) / height));
    for (let col = 1; col < width - 1; col++) {
      const i = row * width + col;
      const lap = Math.abs(at(i - 1) + at(i + 1) + at(i - width) + at(i + width) - 4 * at(i));
      const cell = cellRow * GRID + Math.min(GRID - 1, Math.floor((col * GRID) / width));
      sums[cell] += lap;
      counts[cell] += 1;
      energy += lap;
      sx += lap * ((col + 0.5) / width);
      sy += lap * ((row + 0.5) / height);
    }
  }
  const busy = sums
    .map((sum, cell) => {
      const n = counts[cell];
      const level = n > 0 ? Math.min(15, Math.round(sum / n / BUSY_STEP)) : 0;
      return level.toString(16);
    })
    .join('');
  if (energy <= 0) return { busy, salX: null, salY: null };
  return { busy, salX: round3(sx / energy), salY: round3(sy / energy) };
}

const round3 = (v: number) => Math.round(v * 1000) / 1000;

/** Everything above, for one decoded and scaled picture. */
export function colourSignals(data: Uint8Array, width: number, height: number): ColourSignals {
  return { palette: paletteOf(data, width, height), ...edgeSignals(data, width, height) };
}
