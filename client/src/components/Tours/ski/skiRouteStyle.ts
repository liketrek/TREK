import type { SkiColourScheme, SkiRunDifficulty, SkiSegmentKind } from '@trek/shared';

/**
 * SKI-02: the paint of a ski tour's stretches on the planner map. Runs carry
 * the colour of their grade as the slopes are marked where they are: in
 * Europe novice green, easy blue, intermediate red, advanced black, expert
 * orange and freeride yellow; in North America green for novice and easy,
 * blue for intermediate, black for advanced and the double black beyond.
 * Lifts are drawn dark, cross-country trails violet, links and crossings
 * grey, summer paths amber. Data colours, the same in every theme, as the map
 * under them is.
 */

const EUROPE: Record<SkiRunDifficulty, string> = {
  novice: '#2e9e3b',
  easy: '#2949ca',
  intermediate: '#d51e1e',
  advanced: '#202020',
  expert: '#f37300',
  freeride: '#e0b800',
  extreme: '#e0b800',
};

const NORTH_AMERICA: Record<SkiRunDifficulty, string> = {
  novice: '#2e9e3b',
  easy: '#2e9e3b',
  intermediate: '#2949ca',
  advanced: '#202020',
  expert: '#000000',
  freeride: '#000000',
  extreme: '#000000',
};

const WAYS: Partial<Record<SkiSegmentKind | 'summer', string>> = {
  lift: '#1f2937',
  rail: '#1f2937',
  lift_down: '#1f2937',
  nordic: '#7c3aed',
  skitour: '#b45309',
  hike: '#db2777',
  link: '#6b7280',
  crossing: '#6b7280',
  walk: '#6b7280',
  summer: '#d97706',
};

/** A run of no known grade, and anything else not named above. */
const UNGRADED = '#475569';

/** The colour a stretch of a ski tour is drawn in. */
export function skiPaintOf(ski: {
  kind: SkiSegmentKind | 'summer';
  difficulty: SkiRunDifficulty | null;
  scheme?: SkiColourScheme;
}): string {
  const graded = ski.kind === 'run' || ski.kind === 'area' || ski.kind === 'connection';
  if (graded && ski.difficulty) return (ski.scheme === 'north_america' ? NORTH_AMERICA : EUROPE)[ski.difficulty];
  return WAYS[ski.kind] ?? UNGRADED;
}
