import { CALM_ART } from './design-art';
import { BOOK_DESIGN_LIVELY_BEATS, type BookDesignLivelyBeat } from './design-brief.schema';
import type { ComposeCtx } from './design-compose';
import {
  composeCollage,
  composeGridBadge,
  composeScriptOverlay,
  composeStampRow,
  composeTwoTone,
} from './design-lively';
import type { BookDesignBeat, PlannedSpread } from './design-pacing';
import { designRng } from './design-random';
import type { Composed } from './design-spreads';

/**
 * Where a lively or loud book is lively: about two in five of its hero and
 * grid spreads become one of the lively beats (design-lively.ts), evenly
 * spread through the book from an offset the seed picks, the first of them
 * always among them, so a book with one such spread has one lively page. A
 * hero becomes a script overlay or a two-tone split, a grid a collage, a
 * badge grid or a stamp row; with `collage` asked for, every grid that
 * changes is a collage. A calm book asked for collages turns two in five of
 * its grids into collages and changes nothing else. The pacing is planned on the calm beats
 * first and keeps their rhythm: a lively page counts as the beat it took the
 * place of.
 */

/** The share of hero and grid spreads a lively book turns into lively ones. */
const LIVELY_SHARE = 0.4;

/** Where the count of eligible spreads starts, by the seed: each a place where the share turns one, so the first does. */
const OFFSETS = [2, 4] as const;

/** The beat a lively spread stands for in the book's rhythm: a hero's or a grid's. */
const STANDS_FOR: Readonly<Record<BookDesignLivelyBeat, BookDesignBeat>> = {
  'script-overlay': 'hero',
  'two-tone': 'hero',
  collage: 'grid',
  'grid-badge': 'grid',
  'stamp-row': 'grid',
};

/** Whether a beat is one of the lively ones. */
export const isLivelyBeat = (beat: BookDesignBeat): beat is BookDesignLivelyBeat =>
  (BOOK_DESIGN_LIVELY_BEATS as readonly string[]).includes(beat);

/** The beat as the rhythm counts it. */
export const rhythmBeat = (beat: BookDesignBeat): BookDesignBeat => (isLivelyBeat(beat) ? STANDS_FOR[beat] : beat);

/** How many hero and grid spreads the book has passed, across its chapters. */
interface LivelyCount {
  seen: number;
}

/** The lively beat a hero or a grid becomes, by the seed. */
function livelyFor(c: ComposeCtx, plan: PlannedSpread, at: number): BookDesignBeat {
  const art = c.art ?? CALM_ART;
  const rng = designRng(art.seed, `beat:${at}`);
  if (plan.beat === 'hero') {
    const script = c.look.theme.fonts.script !== null;
    return script && rng.chance(0.5) ? 'script-overlay' : 'two-tone';
  }
  if (art.collage) return 'collage';
  return rng.pick(['collage', 'grid-badge', 'stamp-row'] as const) ?? 'collage';
}

/**
 * A chapter's plan with two in five of the book's hero and grid spreads made
 * lively; the plan as it is for a calm book, but for the grids it asked to
 * have as collages.
 */
export function livelyPlans(c: ComposeCtx, plans: readonly PlannedSpread[], count: LivelyCount): PlannedSpread[] {
  const art = c.art ?? CALM_ART;
  const calm = art.energy === 'calm';
  if (calm && !art.collage) return [...plans];
  const offset = designRng(art.seed, 'beat:offset').pick(OFFSETS) ?? OFFSETS[0];
  return plans.map((plan) => {
    const grid = plan.beat === 'grid' && plan.photos.length >= 4;
    // A calm book's heroes stay heroes: only its grids gather as the collages it asked for.
    const eligible = grid || (!calm && plan.beat === 'hero' && plan.entry !== null);
    if (!eligible) return plan;
    const i = count.seen + offset;
    count.seen += 1;
    const turns = Math.floor((i + 1) * LIVELY_SHARE) > Math.floor(i * LIVELY_SHARE);
    return turns ? { ...plan, beat: livelyFor(c, plan, count.seen) } : plan;
  });
}

/**
 * A lively spread, composed: null for a beat that is not lively, or one whose
 * photos or entry it lacks, which the caller composes as before.
 */
export function composeLively(c: ComposeCtx, plan: PlannedSpread, hand: 'left' | 'right', at: number): Composed | null {
  if (!isLivelyBeat(plan.beat)) return null;
  const rng = designRng((c.art ?? CALM_ART).seed, `${plan.beat}:${at}`);
  const entry = plan.entry ?? plan.chapter.entries[0] ?? null;
  const [first] = plan.photos;
  switch (plan.beat) {
    case 'collage':
      return plan.photos.length ? composeCollage(c, plan.photos, hand, rng) : null;
    case 'grid-badge':
      return plan.photos.length >= 2 ? composeGridBadge(c, plan.photos, entry, hand, rng) : null;
    case 'stamp-row':
      return plan.photos.length ? composeStampRow(c, plan.photos, entry, hand, rng) : null;
    case 'script-overlay':
      return entry && first ? composeScriptOverlay(c, entry, first, hand, rng) : null;
    case 'two-tone':
      return entry && first ? composeTwoTone(c, entry, first, hand, rng) : null;
  }
}
