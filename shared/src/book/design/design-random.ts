/**
 * The design engine's seeded variation: which edge a band sits on, how far a
 * print is turned, which sticker a page takes. Never random: the same seed and
 * the same key give the same numbers on every run and on every machine, so a
 * design is reproducible and another `seed` gives another, equally valid one.
 *
 * FNV-1a over the seed and a key that names the decision, then mulberry32. Not
 * for anything that has to be unpredictable: it only spreads choices evenly.
 */

export interface DesignRng {
  /** The next number in [0, 1). */
  next(): number;
  /** A number in [lo, hi). */
  range(lo: number, hi: number): number;
  /** A whole number from lo to hi, both included. */
  int(lo: number, hi: number): number;
  /** One item of a list, or undefined for an empty one. */
  pick<T>(list: readonly T[]): T | undefined;
  /** The list in a shuffled order, the list itself left as it is. */
  shuffle<T>(list: readonly T[]): T[];
  /** True with probability p. */
  chance(p: number): boolean;
  /** 1 or -1. */
  sign(): 1 | -1;
}

function hash(seed: number, key: string): number {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** The numbers of one decision of a design, from its seed and a key naming the decision. */
export function designRng(seed: number, key: string): DesignRng {
  let state = hash(seed, key);
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: DesignRng = {
    next,
    range: (lo, hi) => lo + (hi - lo) * next(),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (list) => (list.length ? list[Math.floor(next() * list.length)] : undefined),
    shuffle: (list) => {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const held = out[i] as (typeof out)[number];
        out[i] = out[j] as (typeof out)[number];
        out[j] = held;
      }
      return out;
    },
    chance: (p) => next() < p,
    sign: () => (next() < 0.5 ? -1 : 1),
  };
  return rng;
}
