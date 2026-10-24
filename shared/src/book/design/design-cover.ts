import type { BookCoverArchetype } from '../book-archetypes';
import { groupElements } from '../book-groups';
import { solveBookTextFit } from '../book-text-fit';
import type { BookElement, BookSpread } from '../book.schema';
import { frameOf, scrimEl, type ComposeCtx } from './design-compose';
import { gridBadge, stampCollage } from './design-cover-collage';
import { postcard, posterPop } from './design-cover-graphic';
import {
  addLockup,
  bleedPhoto,
  coverKit,
  type CoverDraft,
  type CoverKit,
  type CoverMaterial,
} from './design-cover-kit';
import { cutout, minimalSerif, spineBand } from './design-cover-photo';
import { titleWords, type CoverWords } from './design-cover-words';
import { paperBackground } from './design-style';

/**
 * The composed covers: `cover.archetype` picks one of seven composers, each
 * building its archetype from the book's own material (its photos, its words,
 * its theme's colours, faces and motifs, the lockups) with the seed's
 * variation, deterministic for one seed. A cover without an archetype is the
 * engine's own (design-framing.ts), untouched.
 */

const COMPOSERS: Readonly<Record<BookCoverArchetype, (k: CoverKit) => CoverDraft>> = {
  'spine-band': spineBand,
  'poster-pop': posterPop,
  cutout,
  postcard,
  'grid-badge': gridBadge,
  'minimal-serif': minimalSerif,
  'stamp-collage': stampCollage,
};

/** A draft as the cover page: on its ground, each lockup one group. */
function coverSpread(c: ComposeCtx, draft: CoverDraft): BookSpread {
  const paper = paperBackground(c.look);
  const background = draft.background && draft.background !== c.look.paper ? draft.background : paper;
  let spread: BookSpread = {
    id: c.newId('sp'),
    role: 'cover',
    background,
    elements: draft.elements,
    parked: [],
    entryId: null,
  };
  for (const ids of draft.groups) spread = groupElements(spread, ids, c.newId('g'));
  return spread;
}

/**
 * A composed cover's title held to the display size `type.display` asks for,
 * when it asks: set no larger, and said in the notes when the box the cover
 * sets it in holds less, since a band, a badge or a stamp sizes the title to
 * itself. Nothing changes for a design that leaves `type.display` out.
 */
function displayTier(c: ComposeCtx, draft: CoverDraft, words: CoverWords, what: string): CoverDraft {
  const title = titleWords(words.ownTitle, words.title).words.trim();
  if (c.directives.type?.display === undefined || !title) return draft;
  const most = c.look.sizes.display;
  let short = 0;
  const elements = draft.elements.map((e) => {
    if (e.kind !== 'text' || e.text.trim() !== title) return e;
    if (e.size > most) {
      const capped = { ...e, fitMax: most };
      return { ...capped, size: solveBookTextFit(capped, most) };
    }
    if (e.size < most - 1) short = Math.max(short, e.size);
    return e;
  });
  if (short) {
    c.notes.push(
      `the ${what} cover sets its title as large as its box holds, ${short} pt, under the ${most} pt type.display asks for`,
    );
  }
  return { ...draft, elements };
}

/** The cover of an archetype, composed from the book's photos and entries. */
export function composeArchetypeCover(
  c: ComposeCtx,
  archetype: BookCoverArchetype,
  words: CoverWords,
  material: CoverMaterial,
): BookSpread {
  if (c.directives.cover?.template) {
    c.notes.push(`the ${archetype} cover is composed for its archetype, so cover.template is left out`);
  }
  const draft = COMPOSERS[archetype](coverKit(c, archetype, words, material));
  return coverSpread(c, displayTier(c, draft, words, archetype));
}

/**
 * The engine's own cover with its title set as a lockup: the photo to the
 * bleed, a scrim over its foot and the lockup on the scrim, or the lockup alone
 * in the middle of the paper.
 */
export function lockupCover(c: ComposeCtx, words: CoverWords, material: CoverMaterial): BookSpread {
  const k = coverKit(c, 'lockup', words, material);
  if (c.directives.cover?.template) {
    c.notes.push(`the cover sets its title as the lockup ${k.lockup ?? ''}, so cover.template is left out`);
  }
  const { W, H, b, m } = k;
  const draft: CoverDraft = { elements: [], groups: [] };
  const photo = k.photos[0];
  const top = H * 0.56;
  if (photo) {
    const scrim: BookElement = scrimEl(c, frameOf(-b, top, W + b * 2, H - top + b));
    draft.elements.push(bleedPhoto(k, photo), scrim);
  }
  const box = photo ? frameOf(m, top + m * 0.4, W - m * 2, H - top - m * 1.4) : frameOf(m, H * 0.3, W - m * 2, H * 0.4);
  addLockup(k, draft, { box, ground: photo ? c.look.scrim : c.look.paper, fallback: 'poster-stack' });
  return coverSpread(c, displayTier(c, draft, words, `${k.lockup ?? 'poster-stack'} lockup`));
}
