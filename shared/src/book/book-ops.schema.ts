import { idSchema } from '../common/primitives.schema';
import {
  BOOK_ELEMENT_EDIT_OP_SCHEMAS,
  BOOK_ELEMENT_OP_SCHEMAS,
  TEXT_STYLE_FIELDS,
  bindingNamesItsSource,
  bookAddOpInSchema,
} from './book-element-ops.schema';
import { BOOK_GROUP_OP_SCHEMAS } from './book-group-ops.schema';
import {
  BOOK_BINDING_HINT,
  bookFontIdSchema,
  bookFrameStyleSchema,
  bookPagePresetSchema,
  bookPhotoFilterSchema,
  bookPhotoFitSchema,
  bookPhotoMaskSchema,
} from './book-op-enums';
import { bookElementIdSchema, bookGridIdSchema, bookSpreadIdSchema } from './book-op-ids';
import { bookPaintInSchema } from './book-paint.schema';
import {
  MAX_BOOK_TITLE,
  MAX_SPREADS,
  MAX_SPREAD_ELEMENTS,
  bookBadgeElementSchema,
  bookCountriesElementSchema,
  bookIconElementSchema,
  bookLayoutSchema,
  bookLineElementSchema,
  bookListElementSchema,
  bookMapElementSchema,
  bookPageNumbersSchema,
  bookPageSetupSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookSpreadSchema,
  bookStatsElementSchema,
  bookStickerElementSchema,
  bookTextElementSchema,
} from './book.schema';
import { PHOTO_PICK } from './photo-pick';
import { isBookTemplateId } from './templates/template-catalogue';

import { z } from 'zod';

/**
 * Edits to a book, as the assistant's book tools take them and as a chat card
 * carries them.
 *
 * One page per call, a bounded list of operations on it, every field bounded,
 * nothing open: the tool arguments are what a model sends, and a shape that
 * accepts any object accepts whatever it imagines. The fields come from the
 * document's own schema (book.schema.ts) with its defaults taken off, so an
 * operation that does not name a field leaves that field as it is rather than
 * resetting it.
 *
 * Units are the document's: millimetres from the top-left of the spread, a
 * double spread twice the page width with the fold at one page width.
 */

export { bookElementIdSchema, bookGridIdSchema, bookSpreadIdSchema };

export const BOOK_OP_LIMITS = {
  /** Operations in one `edit_book_page` call. */
  opsPerCall: 20,
  /** Pages one call adds or deletes. */
  pagesPerCall: 10,
  /** Words one text operation sets. */
  text: 2000,
  /** Words one caption sets. */
  caption: 300,
  /** Elements one `remove` takes off a page. */
  removePerOp: 30,
  /** Findings one answer carries. */
  findings: 40,
} as const;

/**
 * A layout of either set, built-in or decorated: which one fits is the page's
 * question, answered when the operation runs. A string checked against the
 * catalogue rather than an enum, so the decorated set's ids stay out of the
 * tool schema; `list_book_layouts` names them.
 */
export const bookAnyTemplateIdSchema = z
  .string()
  .max(40)
  .refine(isBookTemplateId, { message: 'no such layout; list_book_layouts names them' })
  .describe('A layout id from list_book_layouts: a built-in or a decorated template, of the page kind it lists.');

const text = bookTextElementSchema.shape;

/** A position in millimetres, inside the bounds the document takes. */
const mmIn = z.number().finite().min(-10000).max(10000);
/** A size the document keeps after rounding to hundredths: anything under that rounds to 0, which no frame may be. */
const sizeIn = z.number().finite().min(0.01).max(10000);
const unit01 = z.number().min(0).max(1);

const has = (value: object, keys: readonly string[]) =>
  keys.some((k) => (value as Record<string, unknown>)[k] !== undefined);

const LOOK_KEYS = ['fit', 'focalX', 'focalY', 'mask', 'frameStyle', 'filter', 'radius'] as const;
const FRAME_KEYS = ['x', 'y', 'w', 'h', 'rotation'] as const;
const LAYOUT_KEYS = ['template', 'grid', 'saved', 'auto'] as const;

/** The operations on a page as a whole, the first of `bookPageOpSchema`'s. */
const PAGE_OP_SCHEMAS = [
  /**
   * Lay the page out again: a built-in layout, a photo grid, one of the book's
   * own layouts, or `auto`, the Studio's "this page again" from the entry the
   * page was made from.
   */
  z
    .strictObject({
      op: z.literal('layout'),
      template: bookAnyTemplateIdSchema.optional(),
      grid: bookGridIdSchema.optional(),
      saved: z.string().min(1).max(40).optional(),
      auto: z.literal(true).optional(),
    })
    .refine((v) => LAYOUT_KEYS.filter((k) => v[k] !== undefined).length === 1, {
      message: 'give exactly one of template, grid, saved or auto',
    }),
  /** Put a gallery photo into a frame: by element id, by its place among the page's frames, or a new frame. */
  z.strictObject({
    op: z.literal('place_photo'),
    photoId: idSchema,
    target: z.union([
      z.strictObject({ elementId: bookElementIdSchema }),
      z.strictObject({
        slot: z
          .number()
          .int()
          .min(0)
          .max(MAX_SPREAD_ELEMENTS - 1),
      }),
      z.literal('new'),
    ]),
    fit: bookPhotoFitSchema.optional(),
    focalX: unit01.optional(),
    focalY: unit01.optional(),
  }),
  /** How a placed photo looks: the crop (fit and focal point) and the look around it. */
  z
    .strictObject({
      op: z.literal('photo_look'),
      elementId: bookElementIdSchema,
      fit: bookPhotoFitSchema.optional(),
      focalX: unit01.optional(),
      focalY: unit01.optional(),
      mask: bookPhotoMaskSchema.optional(),
      frameStyle: bookFrameStyleSchema.optional(),
      filter: bookPhotoFilterSchema.optional(),
      radius: z.number().finite().min(0).max(500).optional(),
    })
    .refine((v) => has(v, LOOK_KEYS), { message: 'name at least one of the look fields' }),
  /** Exchange the pictures of two frames; the frames stay where they are. */
  z
    .strictObject({ op: z.literal('swap_photos'), a: bookElementIdSchema, b: bookElementIdSchema })
    .refine((v) => v.a !== v.b, { message: 'a and b must be two different frames' }),
  /**
   * Set or create a text. Addressed by element id, or by the role it plays on the
   * page (the largest type is the heading, the longest of the rest the body, the
   * next the meta line); a role the page has no text for creates one.
   */
  z
    .strictObject({
      op: z.literal('text'),
      elementId: bookElementIdSchema.optional(),
      role: z
        .enum(['heading', 'body', 'meta'])
        .describe('heading is the largest type on the page, body the longest of the rest, meta the next.')
        .optional(),
      text: z.string().max(BOOK_OP_LIMITS.text).optional(),
      binding: text.binding.unwrap().describe(`${BOOK_BINDING_HINT} Null unbinds.`).optional(),
      ...TEXT_STYLE_FIELDS,
    })
    .refine((v) => v.elementId !== undefined || v.role !== undefined, { message: 'name an elementId or a role' })
    .refine((v) => bindingNamesItsSource(v.binding), {
      message: 'an entry binding needs its entryId and a photo.caption binding its photoId',
      path: ['binding'],
    }),
  /** A caption under a photo, bound to the photo's caption in the journey unless words are given. */
  z.strictObject({
    op: z.literal('caption'),
    photoElementId: bookElementIdSchema,
    text: z.string().max(BOOK_OP_LIMITS.caption).optional(),
  }),
  /** Move, resize or turn an element. */
  z
    .strictObject({
      op: z.literal('frame'),
      elementId: bookElementIdSchema,
      x: mmIn.optional(),
      y: mmIn.optional(),
      w: sizeIn.optional(),
      h: sizeIn.optional(),
      rotation: z.number().finite().min(-360).max(360).optional(),
    })
    .refine((v) => has(v, FRAME_KEYS), { message: 'name at least one of x, y, w, h or rotation' }),
  /** Take elements off the page: parked by default (kept with the page, back on the next layout), or deleted. */
  z.strictObject({
    op: z.literal('remove'),
    elementIds: z.array(bookElementIdSchema).min(1).max(BOOK_OP_LIMITS.removePerOp),
    park: z.boolean().default(true),
  }),
  /** The page colour or paint; null is the paper. Exactly one of the two. */
  z
    .strictObject({
      op: z.literal('background'),
      color: bookSpreadSchema.shape.background.unwrap().optional(),
      paint: bookPaintInSchema.nullable().optional(),
    })
    .refine((v) => (v.color === undefined) !== (v.paint === undefined), { message: 'give the color or the paint' }),
] as const;

/** One edit of one page, as the engine runs it. Discriminated on `op`. */
const bookPageOpUnion = z.discriminatedUnion('op', [
  ...PAGE_OP_SCHEMAS,
  ...BOOK_ELEMENT_OP_SCHEMAS,
  ...BOOK_GROUP_OP_SCHEMAS,
]);
type BookPageOpUnion = typeof bookPageOpUnion;
/** The operations under a name of their own, for the same reason as `BookElementSchema` (book.schema.ts). */
export interface BookPageOpSchema extends BookPageOpUnion {
  readonly options: BookPageOpUnion['options'];
}
export const bookPageOpSchema: BookPageOpSchema = bookPageOpUnion;
export type BookPageOp = z.infer<typeof bookPageOpSchema>;

/**
 * The same operations as the book tools take them: `add` names what the
 * element is and `style` its look, so no look field is described twice in the
 * schema every MCP client loads. Each parses into a `BookPageOp`.
 */
const bookPageOpInUnion = z.discriminatedUnion('op', [
  ...PAGE_OP_SCHEMAS,
  bookAddOpInSchema,
  ...BOOK_ELEMENT_EDIT_OP_SCHEMAS,
  ...BOOK_GROUP_OP_SCHEMAS,
]);
type BookPageOpInUnion = typeof bookPageOpInUnion;
export interface BookPageOpInSchema extends BookPageOpInUnion {
  readonly options: BookPageOpInUnion['options'];
}
const bookPageOpInSchema: BookPageOpInSchema = bookPageOpInUnion;
export type BookPageOpInput = z.input<typeof bookPageOpSchema>;

/*
 * ── Tool arguments ──────────────────────────────────────────────────────
 *
 * Plain shapes, so a `*.mcp.ts` spreads them after its own `journeyId`
 * (`inputSchema: { journeyId: idSchema, ...editBookPageArgs }`) and holds no
 * `z.` of its own. Each also exists as a strict `*RequestSchema`, which is what
 * `contracts:open` measures: none of them may hold an open shape.
 */

const returnPrevious = z.boolean().optional();
/** Refuses the write (409) unless the book is still at this version; the assistant's undo sets it. */
const expectedVersion = z.number().int().nonnegative().optional();

export const editBookPageArgs = {
  spreadId: bookSpreadIdSchema,
  ops: z.array(bookPageOpInSchema).min(1).max(BOOK_OP_LIMITS.opsPerCall),
  returnPrevious,
};
export const addBookPagesArgs = {
  /** The new pages go after this one, kept inside the covers. */
  afterSpreadId: bookSpreadIdSchema,
  count: z.number().int().min(1).max(BOOK_OP_LIMITS.pagesPerCall).optional(),
  /** A double-spread layout, built-in or decorated; a single-page one is refused when the page is laid. */
  template: bookAnyTemplateIdSchema.optional(),
  entryId: idSchema.optional(),
};
export const moveBookPageArgs = {
  spreadId: bookSpreadIdSchema,
  toIndex: z
    .number()
    .int()
    .min(0)
    .max(MAX_SPREADS - 1),
  expectedVersion,
};
export const deleteBookPagesArgs = {
  spreadIds: z.array(bookSpreadIdSchema).min(1).max(BOOK_OP_LIMITS.pagesPerCall),
  returnPrevious,
  expectedVersion,
};
export const setBookCoverArgs = {
  /** A single-page layout, built-in or decorated; a double-spread one is refused when the cover is laid. */
  template: bookAnyTemplateIdSchema.optional(),
  photoId: idSchema.optional(),
  title: z.string().max(MAX_BOOK_TITLE).optional(),
  subtitle: z.string().max(MAX_BOOK_TITLE).optional(),
  returnPrevious,
};
export const createBookArgs = {
  title: z.string().max(MAX_BOOK_TITLE).optional(),
  preset: bookPagePresetSchema.optional(),
};
/**
 * A page as it was before a write, for the assistant's undo: `index` is where
 * it goes back when it is gone, a page still in the book is replaced where it is.
 */
export const bookPreviousSpreadSchema = z.object({
  index: z
    .number()
    .int()
    .min(0)
    .max(MAX_SPREADS - 1),
  spread: bookSpreadSchema,
});
export type BookPreviousSpread = z.infer<typeof bookPreviousSpreadSchema>;

/**
 * A page as a write left it, for the assistant's undo: its id and a digest of
 * the page as the book stores it, which the write answered under
 * `page_digests` (with `returnPrevious`). A null digest names a page the
 * write took out of the book.
 */
export const bookPageDigestSchema = z.strictObject({
  spreadId: bookSpreadIdSchema,
  digest: z
    .string()
    .regex(/^[0-9a-f]{16}$/)
    .nullable(),
});
export type BookPageDigest = z.infer<typeof bookPageDigestSchema>;

/**
 * The pages a write answered under `previous_spreads`, put back in one call
 * (several deleted pages are one undo), lowest index first. The book must
 * still be at `expectedVersion`. Every page `expectedPages` names must still
 * be as its digest says, and only when they name every page put back with a
 * digest do they replace the version, so a later save to another page does
 * not hold the undo back; a page put back that they leave out or name as
 * gone keeps the version's check.
 */
/*
 * ── A page as restore_book_page takes it back ───────────────────────────
 *
 * The same page as `bookPreviousSpreadSchema`, written so its schema states
 * each field once: what every element has, then what each kind adds, and no
 * defaults, since the page comes back whole as the change answered it. A page
 * holds two lists of elements (placed and parked), and spelled out kind by
 * kind the tool's schema, which every client loads with tools/list, outgrew
 * its size. It takes the same values: restoreBookPage parses the page again as
 * a spread, which sets every default, before it puts it back.
 */
const ELEMENT_BASE = {
  id: true,
  frame: true,
  rotation: true,
  opacity: true,
  locked: true,
  group: true,
  hidden: true,
} as const;

/** An element's fields with their defaults left to the spread's own parse. */
function restoredFields(schema: z.ZodObject): z.ZodObject {
  const shape = Object.entries(schema.shape).map(([key, field]) => [
    key,
    field instanceof z.ZodDefault ? (field.unwrap() as z.ZodType).optional() : field,
  ]);
  return z.object(Object.fromEntries(shape) as z.ZodRawShape);
}
const TRAVEL_TYPE = {
  font: true,
  color: true,
  accent: true,
  textScale: true,
  weight: true,
  stale: true,
  token: true,
  accentToken: true,
  fontRole: true,
} as const;
const kindIn = (schema: z.ZodObject) => restoredFields(schema.omit(ELEMENT_BASE));
const travelIn = (schema: z.ZodObject) => restoredFields(schema.omit({ ...ELEMENT_BASE, ...TRAVEL_TYPE }));
// Each union says what it holds: a described union stays one part of the intersection instead of
// zod writing the shared fields out into every kind again.
const restoredElementIn = z.intersection(
  restoredFields(bookPhotoElementSchema.pick(ELEMENT_BASE)),
  z
    .union([
      kindIn(bookPhotoElementSchema),
      kindIn(bookTextElementSchema),
      kindIn(bookShapeElementSchema),
      kindIn(bookIconElementSchema),
      kindIn(bookStickerElementSchema),
      kindIn(bookLineElementSchema),
      z.intersection(
        restoredFields(bookMapElementSchema.pick(TRAVEL_TYPE)),
        z
          .union([
            travelIn(bookMapElementSchema),
            travelIn(bookStatsElementSchema),
            travelIn(bookCountriesElementSchema),
            travelIn(bookBadgeElementSchema),
            travelIn(bookListElementSchema),
          ])
          .describe('A travel element: the type the five share, then its own fields.'),
      ),
    ])
    .describe("What the element's kind adds to the fields every element has."),
);
const restoredElementsIn = z.array(restoredElementIn).max(MAX_SPREAD_ELEMENTS).optional();
const restoredPageIn = z.object({
  index: bookPreviousSpreadSchema.shape.index,
  spread: z.object({
    ...restoredFields(bookSpreadSchema.omit({ id: true, elements: true, parked: true })).shape,
    id: bookSpreadSchema.shape.id,
    elements: restoredElementsIn,
    parked: restoredElementsIn,
  }),
});

export const restoreBookPageArgs = {
  pages: z.array(restoredPageIn).min(1).max(BOOK_OP_LIMITS.pagesPerCall),
  expectedVersion: z.number().int().nonnegative(),
  expectedPages: z.array(bookPageDigestSchema).min(1).max(BOOK_OP_LIMITS.pagesPerCall).optional(),
};
/** A design draft's id, as `design_book` answers it. */
export const bookDesignIdSchema = z.string().regex(/^[\w-]{1,40}$/);

export const describeBookPageArgs = { spreadId: bookSpreadIdSchema, designId: bookDesignIdSchema.optional() };
export const listBookLayoutsArgs = {
  role: z.enum(['inner', 'single']).describe('inner for double pages, single for the cover and back.').optional(),
};
export const suggestBookPhotosArgs = {
  entryId: idSchema.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  purpose: z
    .enum(['page', 'cover'])
    .describe(
      'cover prefers wide or square pictures with enough pixels for a whole cover (2400 px on the long edge); page is for an inner page.',
    )
    .optional(),
  limit: z.number().int().min(1).max(PHOTO_PICK.maxLimit).optional(),
};

const pageNumbers = bookPageNumbersSchema.shape;

/**
 * The page format and the page numbers, as the Studio's setup sets them.
 * Elements are not rescaled when the size changes, as in the Studio; the
 * answer carries `previous_setup` to set it back.
 */
export const setBookSetupArgs = {
  preset: bookPagePresetSchema.optional(),
  pageWidth: z.number().finite().min(60).max(500).optional(),
  pageHeight: z.number().finite().min(60).max(500).optional(),
  bleed: z.number().finite().min(0).max(20).optional(),
  safe: z.number().finite().min(0).max(50).optional(),
  pageNumbers: z
    .strictObject({
      show: pageNumbers.show.unwrap().optional(),
      startAt: pageNumbers.startAt.unwrap().optional(),
      position: pageNumbers.position
        .unwrap()
        .describe('outer edge, inner edge by the fold, or centre of the foot.')
        .optional(),
      margin: z.number().finite().min(0).max(60).optional(),
      size: pageNumbers.size.unwrap().optional(),
      autoColor: pageNumbers.autoColor.unwrap().optional(),
      color: pageNumbers.color.unwrap().optional(),
      font: bookFontIdSchema.optional(),
    })
    .optional(),
  /** The assistant's undo sets the setup back only while the book is still at the version the change left. */
  expectedVersion,
};
/** A copy of an inner page, with new ids, right after it. */
export const duplicateBookPageArgs = { spreadId: bookSpreadIdSchema };
/** Keep a page's arrangement as one of the book's own layouts. */
export const saveBookLayoutArgs = { spreadId: bookSpreadIdSchema, name: z.string().trim().min(1).max(60).optional() };
/** Take one of the book's own layouts away; the answer carries it in `previous_layout`. */
export const removeBookLayoutArgs = { layoutId: z.string().min(1).max(40), expectedVersion };

export const editBookPageRequestSchema = z.strictObject(editBookPageArgs);
export const addBookPagesRequestSchema = z.strictObject(addBookPagesArgs);
export const moveBookPageRequestSchema = z.strictObject(moveBookPageArgs);
export const deleteBookPagesRequestSchema = z.strictObject(deleteBookPagesArgs);
export const setBookCoverRequestSchema = z.strictObject(setBookCoverArgs);
export const createBookRequestSchema = z.strictObject(createBookArgs);
export const restoreBookPageRequestSchema = z.strictObject(restoreBookPageArgs);
export const describeBookPageRequestSchema = z.strictObject(describeBookPageArgs);
export const listBookLayoutsRequestSchema = z.strictObject(listBookLayoutsArgs);
export const suggestBookPhotosRequestSchema = z.strictObject(suggestBookPhotosArgs);
export const setBookSetupRequestSchema = z.strictObject(setBookSetupArgs);
export const duplicateBookPageRequestSchema = z.strictObject(duplicateBookPageArgs);
export const saveBookLayoutRequestSchema = z.strictObject(saveBookLayoutArgs);
export const removeBookLayoutRequestSchema = z.strictObject(removeBookLayoutArgs);

export type EditBookPageRequest = z.infer<typeof editBookPageRequestSchema>;
export type AddBookPagesRequest = z.infer<typeof addBookPagesRequestSchema>;
export type MoveBookPageRequest = z.infer<typeof moveBookPageRequestSchema>;
export type DeleteBookPagesRequest = z.infer<typeof deleteBookPagesRequestSchema>;
export type SetBookCoverRequest = z.infer<typeof setBookCoverRequestSchema>;
export type CreateBookRequest = z.infer<typeof createBookRequestSchema>;
export type RestoreBookPageRequest = z.infer<typeof restoreBookPageRequestSchema>;
export type SuggestBookPhotosRequest = z.infer<typeof suggestBookPhotosRequestSchema>;
export type SetBookSetupRequest = z.infer<typeof setBookSetupRequestSchema>;
export type DuplicateBookPageRequest = z.infer<typeof duplicateBookPageRequestSchema>;
export type SaveBookLayoutRequest = z.infer<typeof saveBookLayoutRequestSchema>;
export type RemoveBookLayoutRequest = z.infer<typeof removeBookLayoutRequestSchema>;

/*
 * ── Answers ─────────────────────────────────────────────────────────────
 *
 * What the tools answer with, for the server's tests and the assistant's card
 * builders. A summary of a page rather than the page: a book reaches megabytes
 * and a tool answer is cut at 40 000 characters.
 */

export const BOOK_FINDING_CODES = [
  'overlap',
  'fold',
  'trim',
  'empty_frame',
  'low_dpi',
  'focal_cut',
  'text_overflow',
  'parked',
  'hidden_photo',
  'not_in_gallery',
  'text_on_busy',
  'contrast_low',
  'small_text',
  'crowded',
  'off_grid',
  'font_mix',
  'palette_drift',
  'repeat_layout',
  'raster_effect',
  'hairline',
  'edge_unused',
  'curve_overflow',
  'effect_heavy',
  'flat_cover',
  'weak_hierarchy',
  'off_theme',
  'energy_mismatch',
] as const;
export type BookFindingCode = (typeof BOOK_FINDING_CODES)[number];

/** `severe` is what the assistant fixes before it proposes; `warn` it should mention; `info` is context. */
export const bookFindingSchema = z.object({
  code: z.enum(BOOK_FINDING_CODES),
  severity: z.enum(['severe', 'warn', 'info']),
  elementIds: z.array(z.string()).max(8),
  message: z.string().max(300),
});
export type BookFinding = z.infer<typeof bookFindingSchema>;

/** One page as `get_book` lists it and a write answers with it. */
export const bookSpreadSummarySchema = z.object({
  index: z.number().int().nonnegative(),
  id: z.string(),
  role: bookSpreadSchema.shape.role.unwrap(),
  entryId: z.number().int().nullable(),
  background: z.string().nullable(),
  photoIds: z.array(z.number().int()),
  /** The first 60 characters of each text, in paint order. */
  texts: z.array(z.string().max(60)),
  elements: z.number().int().nonnegative(),
  emptyFrames: z.number().int().nonnegative(),
  parked: z.number().int().nonnegative(),
});
export type BookSpreadSummary = z.infer<typeof bookSpreadSummarySchema>;

/** `get_book`: the book without its document. */
export const bookOverviewSchema = z.object({
  exists: z.boolean(),
  version: z.number().int().nonnegative().nullable(),
  title: z.string(),
  page: bookPageSetupSchema.pick({ preset: true, pageWidth: true, pageHeight: true, bleed: true, safe: true }),
  spreads: z.array(bookSpreadSummarySchema),
  layouts: z.array(z.object({ id: z.string(), name: z.string(), role: z.enum(['inner', 'single']) })),
});
export type BookOverview = z.infer<typeof bookOverviewSchema>;

/** One element as `describe_book_page` lists it, back to front. */
export const bookElementSummarySchema = z.object({
  id: z.string(),
  kind: z.string(),
  frame: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  rotation: z.number(),
  locked: z.boolean(),
  photoId: z.number().int().nullable().optional(),
  text: z.string().max(80).optional(),
  binding: z.string().optional(),
  /** The group it is in, its layer name, and whether it is hidden; absent when not. */
  group: z.string().optional(),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
});
export type BookElementSummary = z.infer<typeof bookElementSummarySchema>;

/** `describe_book_page`: the words a model without eyes checks a page by. */
export const bookPageDescriptionSchema = z.object({
  spreadId: z.string(),
  index: z.number().int().nonnegative(),
  role: bookSpreadSchema.shape.role.unwrap(),
  text: z.string(),
  findings: z.array(bookFindingSchema).max(BOOK_OP_LIMITS.findings),
  elements: z.array(bookElementSummarySchema),
});
export type BookPageDescription = z.infer<typeof bookPageDescriptionSchema>;

/**
 * What a book write answers. `dropped` names the elements whose content left
 * the page (a layout, a hard remove). `previous_spreads` and `page_digests`
 * only when the call asked with `returnPrevious`; `from_index` only from a
 * move, where the page stood before it, so a move can be taken back.
 */
export const bookWriteResultSchema = z.object({
  version: z.number().int().nonnegative(),
  spread_ids: z.array(z.string()),
  pages: z.array(bookSpreadSummarySchema),
  findings: z.array(bookFindingSchema).max(BOOK_OP_LIMITS.findings),
  dropped: z.array(z.string()).max(MAX_SPREAD_ELEMENTS * 2),
  previous_spreads: z.array(bookPreviousSpreadSchema).optional(),
  /** The pages the write touched as it left them, for an undo that checks only those (`expectedPages`). */
  page_digests: z.array(bookPageDigestSchema).max(MAX_SPREADS).optional(),
  from_index: z.number().int().nonnegative().optional(),
  /** From `set_book_setup`: the setup as it was, to set it back. */
  previous_setup: bookPageSetupSchema.optional(),
  /** From `remove_book_layout`: the layout as it was, to put it back. */
  previous_layout: bookLayoutSchema.optional(),
  /** From `save_book_layout`: the new layout's id, to take it away again. */
  layout_id: z.string().max(40).optional(),
  /** From `set_book_theme`: the revision the book was kept as before it, null for a book that was new. */
  revision_id: z.number().int().positive().nullable().optional(),
});
export type BookWriteResult = z.infer<typeof bookWriteResultSchema>;
