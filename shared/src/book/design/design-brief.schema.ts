import { BOOK_COVER_ARCHETYPES, type BookCoverArchetype } from '../book-archetypes';
import { bookPageOpSchema } from '../book-ops.schema';
import { bookLockupIdSchema } from '../book-text-ops.schema';
import { MAX_SPREADS } from '../book.schema';
import { BOOK_THEME_DECORATIONS, BOOK_THEME_IDS } from '../theme/book-theme.schema';

import { z } from 'zod';

/**
 * The art direction of a whole-book design, as `design_book` takes it beside
 * the older directives: the brief (how lively the book is, how much it is
 * decorated, whether photos gather in collages, which theme it is set in), the
 * cover's archetype and lockup, and per-page overrides of the beat or the
 * layout. Every field is optional: a design asked for none of them is
 * composed exactly as before.
 *
 * Each value carries a line on what it does, because the tool schema is all a
 * model reads of it; the lines for the archetypes are also the prompt's index
 * (assistant-book-recipes.prompt.ts on the server), so the two never differ.
 */

/** How lively a book is. Calm is the engine as it always was. */
export const BOOK_DESIGN_ENERGIES = ['calm', 'lively', 'loud'] as const;
export type BookDesignEnergy = (typeof BOOK_DESIGN_ENERGIES)[number];

/** One line on each cover archetype (book-archetypes.ts), for the schema and the prompt. */
export const BOOK_COVER_ARCHETYPE_LINES: Readonly<Record<BookCoverArchetype, string>> = {
  'spine-band': 'a photo to the bleed, a coloured band on the spine side carrying the title',
  'poster-pop': 'a two-tone colour block, a heavy two-line title, a turned inset photo in a white border, stickers',
  cutout: 'a saturated page, cut-out leaves and blobs in two tones round a bordered portrait photo',
  postcard: 'a pastel page, a landmark drawing at its centre, a display serif title and a script line',
  'grid-badge': 'four photos in a grid with a white cross, a round title badge at its centre',
  'minimal-serif': 'a white page, a large photo with a hairline, a very large thin serif title and a sun ornament',
  'stamp-collage': 'photos in arches and stamps over a checker band, a round postmark',
};

/** The pages a lively or loud book is made of besides the calm ones (design-lively.ts). */
export const BOOK_DESIGN_LIVELY_BEATS = ['collage', 'script-overlay', 'grid-badge', 'stamp-row', 'two-tone'] as const;
export type BookDesignLivelyBeat = (typeof BOOK_DESIGN_LIVELY_BEATS)[number];

/** The beats a page override may ask for: the lively ones and the photo beats a page is recomposed into. */
export const BOOK_DESIGN_OVERRIDE_BEATS = [...BOOK_DESIGN_LIVELY_BEATS, 'hero', 'duo', 'trio', 'grid'] as const;
export type BookDesignOverrideBeat = (typeof BOOK_DESIGN_OVERRIDE_BEATS)[number];

const archetypeLines = BOOK_COVER_ARCHETYPES.map((a) => `${a} (${BOOK_COVER_ARCHETYPE_LINES[a]})`).join(', ');

export const bookDesignBriefSchema = z
  .strictObject({
    energy: z
      .enum(BOOK_DESIGN_ENERGIES)
      .describe(
        "calm keeps whitespace and the grid, prints turned 2 degrees at most or the theme's own turn; lively makes some pages collages, script overlays, badges, stamp rows and two-tone splits, prints turned 3 to 7 degrees; loud turns them 4 to 10.",
      )
      .optional(),
    decoration: z
      .enum(BOOK_THEME_DECORATIONS)
      .describe(
        "Stickers from the theme's motifs per spread: none, light 1 to 2, rich 3 to 6; left out, the theme's own for a lively or loud book and none for a calm one.",
      )
      .optional(),
    collage: z
      .boolean()
      .describe('Set groups of photos as collages of turned, framed prints; in a calm book its grids only.')
      .optional(),
    theme: z
      .enum(BOOK_THEME_IDS)
      .describe('A built-in theme by id, as style lists them; it takes the place of style.')
      .optional(),
  })
  .describe('The art direction, decided before the pages.');
export type BookDesignBrief = z.infer<typeof bookDesignBriefSchema>;

export const bookCoverArchetypeSchema = z.enum(BOOK_COVER_ARCHETYPES).describe(`A composed cover: ${archetypeLines}.`);

/** The cover title as a lockup of the Studio's Text styles shelf. */
export const bookCoverLockupSchema = bookLockupIdSchema.describe(
  "The cover title set as this lockup, an id add_lockup takes; the archetype's own when left out.",
);

/**
 * A layout a page override asks for: any template the `layout` operation of
 * the page edit takes, checked by that operation's own schema, so a layout the
 * engine learns there is one an override may name.
 */
const overrideTemplateSchema = z
  .string()
  .max(40)
  .refine((id) => bookPageOpSchema.safeParse({ op: 'layout', template: id }).success, {
    message: 'not a layout list_book_layouts names',
  })
  .describe('A double page layout by id, as list_book_layouts lists them.');

export const bookDesignPageOverrideSchema = z
  .strictObject({
    index: z
      .number()
      .int()
      .min(2)
      .max(MAX_SPREADS - 1)
      .describe('The page by its index in the plan design_book answered; the cover is 0.'),
    beat: z
      .enum(BOOK_DESIGN_OVERRIDE_BEATS)
      .describe(
        'Recompose the page from its photos: collage (turned framed prints), script-overlay (one photo across the spread under a giant script word), grid-badge (a photo grid round a title badge), stamp-row (photos as stamps with a postmark), two-tone (a colour page with the title beside a photo), hero, duo, trio or grid.',
      )
      .optional(),
    template: overrideTemplateSchema.optional(),
  })
  .refine((v) => v.beat !== undefined || v.template !== undefined, { message: 'give a beat or a template' });
export type BookDesignPageOverride = z.infer<typeof bookDesignPageOverrideSchema>;

/** At most this many pages overridden in one design. */
export const MAX_BOOK_DESIGN_OVERRIDES = 40;
