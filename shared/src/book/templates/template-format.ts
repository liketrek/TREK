import { BOOK_COVER_ARCHETYPES, type BookCoverArchetype } from '../book-archetypes';
import { MAX_PAINT_STOPS, bookPaintSchema, type BookPaint } from '../book-paint.schema';
import { MAX_SPREAD_ELEMENTS, type BookElement } from '../book.schema';
import { MAX_STICKER_SLOTS } from '../stickers/sticker-types';
import { BOOK_COLOR_TOKENS, type BookColorToken } from '../theme/book-theme.schema';

import { z } from 'zod';

/**
 * Decorated templates: whole pages somebody designed, with the pictures and
 * the words left out, that any page of any book can be laid out on.
 *
 * ── The shape ─────────────────────────────────────────────────────────────
 *
 * The same as the auto layout's drawn templates (auto/auto-templates.data.ts):
 * full elements of the document, so a template is drawn in the Studio and read
 * back out of the book (server/scripts/extract-decorated-templates.cjs), and
 * every number that is a measure is a fraction of the page it was drawn on.
 *
 * - A frame's x and w are fractions of one page's width, y and h of its
 *   height; an inner spread runs from 0 to 2 across. An edge at or past the
 *   trim is a bleed and lands on the bleed of whatever page it is laid on.
 * - Every other length (a type size in points, a stroke, a radius, a border,
 *   a shadow's offset, an outline, a cut edge) is a fraction of the page's
 *   shorter side, so the type keeps its measure when the page only grows
 *   wider or only taller.
 * - An element marked `keep`, a turned one and a sticker keep their
 *   proportions: their width and height come from the shorter side too, and
 *   their centre lands where the frame puts it. A circle stays a circle on a
 *   landscape book, and a title set up the spine stays along it.
 *
 * ── What a template adds to the elements ────────────────────────────────
 *
 * - `role`: what a page's content takes the element. `photo:1` takes the
 *   page's first picture and so on; `title`, `subtitle`, `date`, `body` and
 *   `caption` take its words (a date mark, a badge, takes the date as its
 *   numeral and month); `map` takes its map. An element without a role is
 *   the design and is laid as drawn. `fillPhoto` fills a text's letters with
 *   the picture a photo role took, and `on` names the colour a text is set
 *   on, so a theme whose colours would not read there sets it in ink or
 *   paper, or on a band of one when neither reads.
 * - Elements that share the document's `group` are one lockup (a title with
 *   its date line, a badge with its words, a stamp with its postmark), laid
 *   as one group of the page that is picked and moved as one.
 * - The theme links the document already has (`token`, `strokeToken`,
 *   `accentToken`, `fontRole`, a page's `backgroundToken`), kept on the laid
 *   elements, so the page follows the next theme too.
 * - `tint`: links for the colours the document keeps no link for (a photo's
 *   border, a text's outline, a pattern's two colours, a sticker's slots).
 *   They take the book theme's colours when the template is laid and are not
 *   kept: a person recolouring a sticker later owns that colour.
 *
 * Nothing here is a document field, so laying a template writes an ordinary
 * page that every reader of the format already reads.
 */

/** The words a template's texts can take, by what they say. */
export const BOOK_TEMPLATE_TEXT_ROLES = ['title', 'subtitle', 'date', 'body', 'caption'] as const;
export type BookTemplateTextRole = (typeof BOOK_TEMPLATE_TEXT_ROLES)[number];

/** A photo frame's place in the order the page's pictures are poured in, from 1. */
export type BookTemplatePhotoRole = `photo:${number}`;
export type BookTemplateRole = BookTemplateTextRole | BookTemplatePhotoRole | 'map';

/** The most photo frames one template pours into. */
export const MAX_TEMPLATE_PHOTOS = 12;

const PHOTO_ROLE = /^photo:([1-9][0-9]?)$/;

/** The place a photo role pours from, 1 for `photo:1`; null for any other role. */
export function templatePhotoIndex(role: string | undefined): number | null {
  const n = role ? PHOTO_ROLE.exec(role)?.[1] : undefined;
  return n === undefined ? null : Number(n);
}

/** Colour links a template sets when it is laid, for the colours the document links nowhere. */
export interface BookTemplateTint {
  /** A photo's border, its hard shadow (a text's too) and its cutout. */
  border?: BookColorToken;
  shadow?: BookColorToken;
  cutout?: BookColorToken;
  /** A text's outline, its marker band and the solid fill of its letters. */
  outline?: BookColorToken;
  highlight?: BookColorToken;
  fill?: BookColorToken;
  /** A drawn line. */
  stroke?: BookColorToken;
  /** A pattern paint's figure and ground, a gradient's stops in order (null keeps one as drawn). */
  fg?: BookColorToken;
  bg?: BookColorToken;
  stops?: readonly (BookColorToken | null)[];
  /** A sticker's colour slots in order, null keeping a slot's drawn colour. */
  colors?: readonly (BookColorToken | null)[];
}

/** One element of a template: a document element in fractions, with what the template adds to it. */
export type BookTemplateElement = BookElement & {
  role?: BookTemplateRole;
  tint?: BookTemplateTint;
  keep?: true;
  /** A text whose letters are filled with the picture this photo role takes; without one they keep their colour. */
  fillPhoto?: BookTemplatePhotoRole;
  /**
   * The colour a text is laid on: a band, a block, a badge. Its colour stays
   * as drawn while it reads there in the book's theme at the size it is fitted
   * to, else it takes whichever of ink and paper reads better, on a band of
   * the other when neither does.
   */
  on?: BookColorToken;
};

/** Which pages a template is for: one page (the cover, the first, the last, the back) or a double spread. */
export const BOOK_TEMPLATE_KINDS = ['single', 'inner'] as const;
export type BookTemplateKind = (typeof BOOK_TEMPLATE_KINDS)[number];

export interface BookDecoratedTemplate {
  /** Unique across both template sets, the built-in layouts of book-layouts.ts included. */
  id: string;
  /** What the Studio calls it. */
  labelKey: string;
  kind: BookTemplateKind;
  /** The look it belongs to: a cover is one of the archetypes, a spread is set in the manner of one. */
  archetype: BookCoverArchetype;
  /** English words for a model and a search: what is on it and what it suits. */
  tags: readonly string[];
  /** One sentence of what it looks like, for a model choosing one it cannot see. */
  descr: string;
  background: string | null;
  backgroundToken?: BookColorToken;
  backgroundPaint?: BookPaint;
  /** Links for a pattern or gradient page's colours, as an element's `tint` takes them. */
  backgroundTint?: BookTemplateTint;
  /** Back to front, as a page paints them. */
  elements: readonly BookTemplateElement[];
}

/*
 * ── The contract, for the extract script and the specs ──────────────────
 *
 * The element fields themselves are the document's and are held to its
 * contract once the template is laid on a page (template-lay.ts): in
 * fractions they are not millimetres yet, so they cannot be parsed as the
 * document parses them. What is held here is what the template adds.
 */

const token = z.enum(BOOK_COLOR_TOKENS);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');
/** A fraction of a page; an inner spread runs to 2, and a bleeding edge a little past. */
const fraction = z.number().finite().min(-0.5).max(2.5);
const extent = z.number().finite().positive().max(2.5);

export const bookTemplateRoleSchema = z.union([
  z.enum([...BOOK_TEMPLATE_TEXT_ROLES, 'map']),
  z
    .string()
    .regex(PHOTO_ROLE, 'expected photo:n')
    .refine((r) => (templatePhotoIndex(r) ?? 0) <= MAX_TEMPLATE_PHOTOS, `at most photo:${MAX_TEMPLATE_PHOTOS}`),
]);

export const bookTemplateTintSchema = z.strictObject({
  border: token.optional(),
  shadow: token.optional(),
  cutout: token.optional(),
  outline: token.optional(),
  highlight: token.optional(),
  fill: token.optional(),
  stroke: token.optional(),
  fg: token.optional(),
  bg: token.optional(),
  stops: z.array(token.nullable()).max(MAX_PAINT_STOPS).optional(),
  colors: z.array(token.nullable()).max(MAX_STICKER_SLOTS).optional(),
});

export const bookTemplateElementSchema = z.looseObject({
  id: z.string().min(1).max(40),
  kind: z.string().min(1),
  frame: z.strictObject({ x: fraction, y: fraction, w: extent, h: extent }),
  role: bookTemplateRoleSchema.optional(),
  tint: bookTemplateTintSchema.optional(),
  keep: z.literal(true).optional(),
  fillPhoto: z.string().regex(PHOTO_ROLE, 'expected photo:n').optional(),
  on: token.optional(),
});

export const bookDecoratedTemplateSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]{2,39}$/, 'expected a lower-case id'),
  labelKey: z.string().regex(/^studio\.templates\.name\.[a-zA-Z0-9]+$/),
  kind: z.enum(BOOK_TEMPLATE_KINDS),
  archetype: z.enum(BOOK_COVER_ARCHETYPES),
  tags: z
    .array(z.string().regex(/^[a-z][a-z0-9-]*$/))
    .min(1)
    .max(12),
  descr: z.string().min(10).max(240),
  background: hex.nullable(),
  backgroundToken: token.optional(),
  backgroundPaint: bookPaintSchema.optional(),
  backgroundTint: bookTemplateTintSchema.optional(),
  elements: z.array(bookTemplateElementSchema).min(1).max(MAX_SPREAD_ELEMENTS),
});

/** The roles a template's elements carry, in paint order. */
export function templateRoles(tpl: Pick<BookDecoratedTemplate, 'elements'>): BookTemplateRole[] {
  return tpl.elements.flatMap((e) => (e.role ? [e.role] : []));
}

/** How many pictures a template pours: its photo frames that take one. */
export function templatePhotoSlots(tpl: Pick<BookDecoratedTemplate, 'elements'>): number {
  return tpl.elements.filter((e) => e.kind === 'photo' && templatePhotoIndex(e.role) !== null).length;
}
