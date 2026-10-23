import { idSchema } from '../../common/primitives.schema';
import { bookFontIdSchema, bookMetricSchema, bookPagePresetSchema } from '../book-op-enums';
import { bookCoverTemplateIdSchema } from '../book-ops.schema';
import { MAX_BOOK_TITLE } from '../book.schema';

import { z } from 'zod';

/**
 * What the person wants of a whole-book design, as the assistant's
 * `design_book` takes it. The model maps free words ("calm, lots of white",
 * "like a magazine", "only Portugal") to these fields; the engine takes no free
 * text it would have to interpret. Every field is optional and bounded.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const pageCount = z.number().int().min(1).max(146);
const ids300 = z.array(idSchema).max(300);
const ids200 = z.array(idSchema).max(200);

export const BOOK_DESIGN_STYLES = ['classic', 'minimal', 'editorial', 'journal', 'bold', 'scrapbook'] as const;
export type BookDesignStyle = (typeof BOOK_DESIGN_STYLES)[number];

export const bookDesignDirectivesSchema = z.strictObject({
  style: z
    .enum(BOOK_DESIGN_STYLES)
    .describe(
      'The look: classic (white, sans, one warm accent), minimal (white, Inter, grey), editorial (cream, Playfair over Garamond), journal (warm paper, framed photos), bold (black paper, Bebas caps, strong accent), scrapbook (cream paper, MuseoModerno headings, polaroids turned a little).',
    )
    .default('classic'),
  /** Photos per spread: airy 1 to 2, balanced 2 to 4, rich 4 to 6. */
  density: z
    .enum(['airy', 'balanced', 'rich'])
    .describe('Photos per spread: airy 1 to 2, balanced 2 to 4, rich 4 to 6.')
    .default('balanced'),
  /** Inner spreads, the covers and the first and last page not counted. */
  pages: z.strictObject({ min: pageCount.optional(), max: pageCount.optional() }).optional(),
  scope: z.strictObject({ entryIds: ids200.optional(), from: isoDate.optional(), to: isoDate.optional() }).optional(),
  chapters: z
    .enum(['entry', 'day', 'place'])
    .describe('What a chapter is: one journal entry, one day or one place.')
    .default('entry'),
  photos: z
    .strictObject({
      /** best: the photo-pick groups' best, near duplicates and blurry ones left out; all: every photo. */
      pick: z
        .enum(['best', 'all'])
        .describe('best leaves out near duplicates and blurry shots; all takes every photo.')
        .default('best'),
      perChapterMax: z.number().int().min(1).max(24).optional(),
      include: ids300.optional(),
      exclude: ids300.optional(),
      coverPhotoId: idSchema.optional(),
    })
    .optional(),
  cover: z
    .strictObject({
      template: bookCoverTemplateIdSchema.optional(),
      title: z.string().max(MAX_BOOK_TITLE).optional(),
      subtitle: z.string().max(MAX_BOOK_TITLE).optional(),
    })
    .optional(),
  type: z
    .strictObject({
      heading: bookFontIdSchema.optional(),
      body: bookFontIdSchema.optional(),
      /** Every type size at once, 1 the style's own: under 1 a quieter book, up to 2.5 a poster. */
      scale: z
        .number()
        .min(0.8)
        .max(2.5)
        .describe('Every type size at once: 1 as the style sets it, 2.5 a poster.')
        .optional(),
      /**
       * The cover title as a multiple of the heading size, on top of `scale`:
       * 1, the default, sets it as every book so far was set; 6.5 takes the
       * 28 pt heading to about 180 pt, a title that fills the cover, so the
       * cover grows without the rest of the book. Words that would not fit
       * the cover are set smaller.
       */
      display: z
        .number()
        .min(1)
        .max(6.5)
        .describe(
          'The cover title as a multiple of the heading size: 1 as before, up to 6.5 (about 180 pt) for a title that fills the cover.',
        )
        .optional(),
    })
    .optional(),
  /** The book's colours: taken from the photos, ink only, or given; the style's own when absent. */
  palette: z
    .union([
      z
        .enum(['from_photos', 'ink'])
        .describe('from_photos takes the accent from the pictures; ink sets every colour in the ink.'),
      z.strictObject({ paper: hex, ink: hex, accent: hex }),
    ])
    .optional(),
  text: z
    .strictObject({
      captions: z
        .enum(['none', 'entry', 'photo'])
        .describe('Words under the pictures: none, the entry title, or each photo caption.')
        .default('entry'),
      story: z
        .enum(['full', 'excerpt', 'none'])
        .describe('The entry story in full, cut to excerptChars, or left out.')
        .default('full'),
      excerptChars: z.number().int().min(80).max(1200).optional(),
    })
    .optional(),
  travel: z
    .strictObject({
      summary: z.boolean().default(true),
      countries: z.boolean().default(true),
      chapterMaps: z.boolean().default(false),
      dayBadges: z.boolean().default(true),
      metrics: z.array(bookMetricSchema).min(1).max(7).optional(),
    })
    .optional(),
  /** What stays: pages holding a locked element, also hand-made pages, or nothing (a fresh book). */
  keep: z
    .enum(['nothing', 'locked', 'edited'])
    .describe('What stays: nothing, pages holding a locked element, or also the pages made by hand.')
    .default('locked'),
  /** Only honoured for a blank or a new book. */
  preset: bookPagePresetSchema.optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
});
export type BookDesignDirectives = z.infer<typeof bookDesignDirectivesSchema>;
export type BookDesignDirectivesInput = z.input<typeof bookDesignDirectivesSchema>;
