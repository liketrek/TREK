import { idSchema } from '../common/primitives.schema';
import { BOOK_EDGE_PROPS, LINE_PROPS, bookLinePointsInSchema } from './book-line-ops.schema';
import {
  BOOK_BINDING_HINT,
  bookBadgeStyleSchema,
  bookBadgeVariantSchema,
  bookCountriesLayoutSchema,
  bookCountryLookSchema,
  bookFontIdSchema,
  bookFrameStyleSchema,
  bookIconNameSchema,
  bookListLayoutSchema,
  bookMapClipSchema,
  bookMapSourceSchema,
  bookMapStyleSchema,
  bookMetricSchema,
  bookPhotoFilterSchema,
  bookPhotoFitSchema,
  bookPhotoMaskSchema,
  bookPinStyleSchema,
  bookRouteArcSchema,
  bookRouteDashSchema,
  bookRouteStyleSchema,
  bookShapeGradientSchema,
  bookShapeIdRefSchema,
  bookShapeIdSchema,
  bookStatsLayoutSchema,
  bookStatsLookSchema,
  bookStrokeStyleSchema,
  bookTextAlignSchema,
  bookTypesetFontSchema,
  bookWeightSchema,
} from './book-op-enums';
import { bookElementIdSchema, bookGridIdSchema, bookSpreadIdSchema } from './book-op-ids';
import { bookPaintInSchema } from './book-paint.schema';
import { BOOK_PHOTO_LOOK_PROPS } from './book-photo-look.schema';
import { bookStickerIdSchema } from './book-sticker';
import { TEXT_EFFECT_PROPS, bookAddLockupOpSchema } from './book-text-ops.schema';
import {
  MAX_BOOK_COUNTRIES,
  bookBadgeElementSchema,
  bookCountriesElementSchema,
  bookIconElementSchema,
  bookListElementSchema,
  bookMapElementSchema,
  bookShapeElementSchema,
  bookStatsElementSchema,
  bookStickerElementSchema,
  bookTextElementSchema,
} from './book.schema';
import { THEMED_ICON_IN, THEMED_SHAPE_IN, THEMED_TEXT_IN, THEMED_TYPESET_IN } from './theme/book-theme.schema';

import { z } from 'zod';

/**
 * The element operations of a book page: create any of the ten kinds, style
 * one, arrange, align, distribute, lock, duplicate, fill, copy from another
 * page, refresh the travel figures, drop in a photo grid, set a lockup. They join the page
 * operations of book-ops.schema.ts, so `edit_book_page` takes them and the one
 * engine (`applyBookOps`) runs them; nothing else implements them.
 *
 * Same rules as the other operations: strict objects, the fields taken from the
 * document's own shapes with their defaults removed (an omitted field leaves
 * the element as it is), every string, array and number bounded. The enums
 * carry a line each on what their values mean (book-op-enums.ts), since the
 * tool schema is all a model reads of them.
 */

/** A position in millimetres, inside the bounds the document takes. */
const mmIn = z.number().finite().min(-10000).max(10000);
/** A size the document keeps after rounding to hundredths. */
const sizeIn = z.number().finite().min(0.01).max(10000);
const unit01 = z.number().min(0).max(1);
const ids30 = z.array(bookElementIdSchema).min(1).max(30);

export const bookFrameInSchema = z.strictObject({ x: mmIn, y: mmIn, w: sizeIn, h: sizeIn });

const text = bookTextElementSchema.shape;
const shape = bookShapeElementSchema.shape;
const icon = bookIconElementSchema.shape;
const sticker = bookStickerElementSchema.shape;
const map = bookMapElementSchema.shape;
const stats = bookStatsElementSchema.shape;
const countries = bookCountriesElementSchema.shape;
const badge = bookBadgeElementSchema.shape;
const list = bookListElementSchema.shape;

/** What every kind has: how see-through it is. */
const COMMON = { opacity: unit01.optional() };

/** What the travel kinds share with text: they are typeset. */
const TYPESET = {
  font: bookTypesetFontSchema.optional(),
  color: map.color.unwrap().optional(),
  accent: map.accent.unwrap().optional(),
  textScale: map.textScale.unwrap().optional(),
  weight: map.weight.unwrap().optional(),
  ...THEMED_TYPESET_IN,
};

// The page edit's photo_look says in full what each of these means; `style` points there.
const AS_PHOTO_LOOK = 'As photo_look takes it.';
const PHOTO_PROPS = {
  ...COMMON,
  fit: bookPhotoFitSchema.describe(AS_PHOTO_LOOK).optional(),
  focalX: unit01.optional(),
  focalY: unit01.optional(),
  mask: bookPhotoMaskSchema.describe(AS_PHOTO_LOOK).optional(),
  frameStyle: bookFrameStyleSchema.describe(AS_PHOTO_LOOK).optional(),
  filter: bookPhotoFilterSchema.describe(AS_PHOTO_LOOK).optional(),
  radius: z.number().finite().min(0).max(500).optional(),
  ...BOOK_EDGE_PROPS,
};
/** How a text is set, each field left as it is when not named: the style op's and the page edit's text op's. */
export const TEXT_STYLE_FIELDS = {
  font: bookFontIdSchema.optional(),
  size: text.size.unwrap().optional(),
  weight: bookWeightSchema.optional(),
  italic: text.italic.unwrap().optional(),
  align: bookTextAlignSchema.optional(),
  leading: text.leading.unwrap().optional(),
  tracking: text.tracking.unwrap().optional(),
  color: text.color.unwrap().optional(),
};
/** A text's look for `style` and `add`: its setting, its theme links and its effects (book-text-ops.schema.ts). */
const TEXT_PROPS = {
  ...COMMON,
  ...TEXT_STYLE_FIELDS,
  // The text operation says what each face and weight is; here they point there, so the schema says it once.
  font: bookFontIdSchema.describe('A typeface id, as the text operation lists them.').optional(),
  weight: bookWeightSchema.describe('100 to 900, as for the text operation.').optional(),
  ...THEMED_TEXT_IN,
  ...TEXT_EFFECT_PROPS,
};
const SHAPE_PROPS = {
  ...COMMON,
  fill: shape.fill.unwrap().optional(),
  gradient: bookShapeGradientSchema.optional(),
  /** Overrides fill and gradient when given; null takes the fill away. A plain fill or gradient clears it. */
  paint: bookPaintInSchema.describe('A paint, as background takes it; null takes the fill away.').nullable().optional(),
  stroke: shape.stroke.unwrap().optional(),
  strokeWidth: z.number().finite().min(0).max(20).optional(),
  strokeStyle: bookStrokeStyleSchema.optional(),
  radius: z.number().finite().min(0).max(500).optional(),
  ...BOOK_EDGE_PROPS,
  ...THEMED_SHAPE_IN,
};
const ICON_PROPS = {
  ...COMMON,
  ...THEMED_ICON_IN,
  color: icon.color.unwrap().optional(),
  lineWidth: icon.lineWidth.unwrap().optional(),
};
const STICKER_PROPS = {
  ...COMMON,
  colors: sticker.colors
    .unwrap()
    .describe(
      "The sticker's colour slots in order, as list_book_assets names them; fewer than its slots keeps the rest at their own colour, an empty list puts them all back.",
    )
    .optional(),
  flipX: sticker.flipX.unwrap().describe('Mirror the drawing left to right.').optional(),
};
const MAP_PROPS = {
  ...COMMON,
  ...TYPESET,
  style: bookMapStyleSchema.optional(),
  showLand: map.showLand.unwrap().optional(),
  showRoute: map.showRoute.unwrap().optional(),
  showPins: map.showPins.unwrap().optional(),
  showLabels: map.showLabels.unwrap().optional(),
  routeStyle: bookRouteStyleSchema.optional(),
  routeArc: bookRouteArcSchema.optional(),
  routeDash: bookRouteDashSchema.optional(),
  pinStyle: bookPinStyleSchema.optional(),
  clip: bookMapClipSchema.optional(),
  fitPadding: map.fitPadding.unwrap().optional(),
  fitToCountries: map.fitToCountries.unwrap().optional(),
};
const STATS_PROPS = {
  ...COMMON,
  ...TYPESET,
  layout: bookStatsLayoutSchema.optional(),
  look: bookStatsLookSchema.optional(),
  showIcons: stats.showIcons.unwrap().optional(),
  units: stats.units.unwrap().describe('Kilometres (metric) or miles (imperial).').optional(),
};
const COUNTRIES_PROPS = {
  ...COMMON,
  ...TYPESET,
  layout: bookCountriesLayoutSchema.optional(),
  look: bookCountryLookSchema.optional(),
  showOutline: countries.showOutline.unwrap().optional(),
  showFlag: countries.showFlag.unwrap().optional(),
  showName: countries.showName.unwrap().optional(),
  align: countries.align.unwrap().describe('How the names sit in the frame.').optional(),
};
const BADGE_PROPS = {
  ...COMMON,
  ...TYPESET,
  style: bookBadgeStyleSchema.optional(),
  showIcon: badge.showIcon.unwrap().optional(),
  showLabel: badge.showLabel.unwrap().optional(),
  autoColor: badge.autoColor.unwrap().optional(),
  autoIconColor: badge.autoIconColor.unwrap().optional(),
  iconColor: badge.iconColor.unwrap().optional(),
};
const LIST_PROPS = {
  ...COMMON,
  ...TYPESET,
  layout: bookListLayoutSchema.optional(),
  showMarks: list.showMarks.unwrap().optional(),
  proLabel: z.string().max(80).optional(),
  conLabel: z.string().max(80).optional(),
};
const METRICS = z.array(bookMetricSchema).min(1).max(7);

/**
 * The look of an element, per kind, for `style`. Values the journey owns (a
 * map's stops, a stat's figures, a country's name) are not props: the engine
 * resolves them from the journey, exactly as the Travel panel does.
 */
export const bookElementPropsSchema = z.discriminatedUnion('kind', [
  // The photo look only here, not on `add`: a new frame is styled after it exists, and the field list stays out of the add schema twice over.
  z.strictObject({ kind: z.literal('photo'), ...PHOTO_PROPS, ...BOOK_PHOTO_LOOK_PROPS }),
  z.strictObject({ kind: z.literal('text'), ...TEXT_PROPS }),
  z.strictObject({ kind: z.literal('shape'), shape: bookShapeIdRefSchema.optional(), ...SHAPE_PROPS }),
  z.strictObject({ kind: z.literal('icon'), ...ICON_PROPS }),
  z.strictObject({ kind: z.literal('sticker'), ...STICKER_PROPS }),
  z.strictObject({ kind: z.literal('map'), ...MAP_PROPS }),
  z.strictObject({ kind: z.literal('stats'), metrics: METRICS.optional(), ...STATS_PROPS }),
  z.strictObject({ kind: z.literal('countries'), ...COUNTRIES_PROPS }),
  z.strictObject({ kind: z.literal('badge'), ...BADGE_PROPS }),
  z.strictObject({ kind: z.literal('list'), ...LIST_PROPS }),
  z.strictObject({ kind: z.literal('line'), ...LINE_PROPS }),
]);
export type BookElementProps = z.infer<typeof bookElementPropsSchema>;

/** The Studio's text presets: heading, subheading, body, caption and the large quotation mark. */
export const BOOK_TEXT_PRESETS = ['heading', 'subheading', 'body', 'caption', 'quote'] as const;

/**
 * An entry's words need the entry and a photo's caption needs the photo: a
 * binding that names neither reads nothing, and the ids it names are checked
 * against the journey when the engine runs. The `text` op and `add` text share it.
 */
export function bindingNamesItsSource(
  b: { source: string; entryId?: number; photoId?: number } | null | undefined,
): boolean {
  if (!b) return true;
  if (b.source.startsWith('entry.') && b.entryId === undefined) return false;
  return b.source !== 'photo.caption' || b.photoId !== undefined;
}

/** A binding that names its own source: an entry's words carry the entry id, a caption the photo id. */
const bindingIn = text.binding
  .unwrap()
  .unwrap()
  .refine(bindingNamesItsSource, { message: 'an entry binding needs its entryId, a photo binding its photoId' })
  .describe(BOOK_BINDING_HINT);
const iso2 = z.string().regex(/^[A-Za-z]{2}$/);
const listItem = z.strictObject({
  text: z.string().max(400),
  tone: z
    .enum(['pro', 'con', 'plain'])
    .describe('pro or con sets the line in that column with its mark; plain has none.'),
});

/**
 * Where a map is of: the whole journey or one trip, the two scopes a stored map
 * can say (its `tripId`). A map of some entries' stops would be stale the moment
 * it was placed and widened to the journey by the first refresh.
 */
const mapScope = z.union([z.literal('journey'), z.strictObject({ tripId: idSchema })]);

/*
 * What a new element is, kind by kind: where its content comes from. A text
 * needs its words or a binding (the engine has no translated sample words); a
 * list needs an entry (its pros and cons) or its lines.
 */
const textContent = {
  preset: z
    .enum(BOOK_TEXT_PRESETS)
    .describe('A Studio text preset: heading, subheading, body, caption, or quote (the large quotation mark).')
    .optional(),
  text: z.string().max(2000).optional(),
  binding: bindingIn.describe('Words read from the journey, bound as the text operation binds them.').optional(),
};
const hasWords = (v: { text?: string; binding?: unknown }) => v.text !== undefined || v.binding !== undefined;
const WORDS_NEEDED = { message: 'give the words or a binding' };
const listContent = { entryId: idSchema.optional(), items: z.array(listItem).max(60).optional() };
const oneListSource = (v: { entryId?: number; items?: unknown[] }) =>
  (v.entryId === undefined) !== (v.items === undefined);
const ONE_LIST_SOURCE = { message: 'give an entryId or the items, not both' };
const NEW_CONTENT = {
  photo: { photoId: idSchema.optional() },
  shape: { shape: bookShapeIdSchema },
  icon: { name: bookIconNameSchema },
  sticker: { stickerId: bookStickerIdSchema },
  map: { scope: mapScope, source: bookMapSourceSchema.optional() },
  stats: { metrics: METRICS },
  countries: { codes: z.array(iso2).max(MAX_BOOK_COUNTRIES).optional() },
  badge: {
    variant: bookBadgeVariantSchema,
    entryId: idSchema.optional(),
    code: z.string().max(24).optional(),
    text: z.string().max(200).optional(),
    sub: z.string().max(200).optional(),
  },
  line: { points: bookLinePointsInSchema.optional() },
};

/**
 * What to create with its look, as the engine runs `add`: the content and any
 * field `style` takes for the kind. A change kept in an assistant card holds
 * its operations in this form, so it reads whichever way it was written.
 */
export const bookNewElementSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('photo'), ...NEW_CONTENT.photo, ...PHOTO_PROPS }),
  z.strictObject({ kind: z.literal('text'), ...textContent, ...TEXT_PROPS }).refine(hasWords, WORDS_NEEDED),
  z.strictObject({ kind: z.literal('shape'), ...NEW_CONTENT.shape, ...SHAPE_PROPS }),
  z.strictObject({ kind: z.literal('icon'), ...NEW_CONTENT.icon, ...ICON_PROPS }),
  z.strictObject({ kind: z.literal('sticker'), ...NEW_CONTENT.sticker, ...STICKER_PROPS }),
  z.strictObject({ kind: z.literal('map'), ...NEW_CONTENT.map, ...MAP_PROPS }),
  z.strictObject({ kind: z.literal('stats'), ...NEW_CONTENT.stats, ...STATS_PROPS }),
  z.strictObject({ kind: z.literal('countries'), ...NEW_CONTENT.countries, ...COUNTRIES_PROPS }),
  z.strictObject({ kind: z.literal('badge'), ...NEW_CONTENT.badge, ...BADGE_PROPS }),
  z.strictObject({ kind: z.literal('list'), ...listContent, ...LIST_PROPS }).refine(oneListSource, ONE_LIST_SOURCE),
  z.strictObject({ kind: z.literal('line'), ...LINE_PROPS }),
]);
export type BookNewElement = z.infer<typeof bookNewElementSchema>;

/**
 * What the book tools take for a new element: its kind and content only. Its
 * look is `style`'s, every field described there once; this keeps the page
 * edit's tool schema, which every MCP client loads, within its size.
 */
const bookNewElementInSchema = z
  .discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('photo'), ...NEW_CONTENT.photo }),
    z.strictObject({ kind: z.literal('text'), ...textContent }).refine(hasWords, WORDS_NEEDED),
    z.strictObject({ kind: z.literal('shape'), ...NEW_CONTENT.shape }),
    z.strictObject({ kind: z.literal('icon'), ...NEW_CONTENT.icon }),
    z.strictObject({ kind: z.literal('sticker'), ...NEW_CONTENT.sticker }),
    z.strictObject({ kind: z.literal('map'), ...NEW_CONTENT.map }),
    z.strictObject({ kind: z.literal('stats'), ...NEW_CONTENT.stats }),
    z.strictObject({ kind: z.literal('countries'), ...NEW_CONTENT.countries }),
    z.strictObject({ kind: z.literal('badge'), ...NEW_CONTENT.badge }),
    z.strictObject({ kind: z.literal('list'), ...listContent }).refine(oneListSource, ONE_LIST_SOURCE),
    z.strictObject({ kind: z.literal('line'), ...NEW_CONTENT.line }),
  ])
  .describe(
    'The kind and its content. Its look (colours, type, effects, the crop of a photo) is set with style: give the element an id here and style it by that id in the same call.',
  );

const hasProps = (set: Record<string, unknown>) => Object.keys(set).some((k) => k !== 'kind' && set[k] !== undefined);

const ADD_FIELDS = {
  frame: bookFrameInSchema.optional(),
  rotation: z.number().finite().min(-360).max(360).optional(),
  id: bookElementIdSchema
    .describe('An id of your own for the new element, unused on the page, so later operations of the call can name it.')
    .optional(),
};
/** Create an element; the frame defaults to the Studio panel's size, centred on the page. */
const bookAddOpSchema = z.strictObject({ op: z.literal('add'), element: bookNewElementSchema, ...ADD_FIELDS });
/** `add` as the book tools take it (book-ops.schema.ts joins it into their operations). */
export const bookAddOpInSchema = z.strictObject({
  op: z.literal('add'),
  element: bookNewElementInSchema,
  ...ADD_FIELDS,
});

/**
 * The element operations but `add`, which the engine's and the tools' unions
 * each take in their own form (book-ops.schema.ts).
 */
export const BOOK_ELEMENT_EDIT_OP_SCHEMAS = [
  /** Restyle an element; `set.kind` must be the element's kind. */
  z
    .strictObject({ op: z.literal('style'), elementId: bookElementIdSchema, set: bookElementPropsSchema })
    .refine((v) => hasProps(v.set), { message: 'name at least one field to set', path: ['set'] }),
  /** Move elements in the paint order, keeping their order among themselves. */
  z.strictObject({
    op: z.literal('arrange'),
    elementIds: ids30,
    to: z
      .enum(['front', 'forward', 'backward', 'back'])
      .describe('front and back go to either end of the paint order; forward and backward one step.'),
  }),
  /** Line elements up on an edge or a centre line of the selection, their page, or its safe area. */
  z.strictObject({
    op: z.literal('align'),
    elementIds: ids30,
    edge: z
      .enum(['left', 'center', 'right', 'top', 'middle', 'bottom'])
      .describe('The edge or centre line the elements line up on.'),
    to: z
      .enum(['selection', 'page', 'safe'])
      .describe('Line up within the selection, the page, or its safe area.')
      .default('selection'),
  }),
  /** Space three or more elements evenly, or by a fixed gap in millimetres. */
  z.strictObject({
    op: z.literal('distribute'),
    elementIds: z.array(bookElementIdSchema).min(3).max(30),
    axis: z.enum(['horizontal', 'vertical']).describe('Space them out across the page or down it.'),
    gap: z.number().finite().min(0).max(200).optional(),
  }),
  /** Lock or unlock elements: the one operation a locked element accepts. */
  z.strictObject({ op: z.literal('lock'), elementIds: ids30, locked: z.boolean() }),
  /** Copies with new ids, offset by `dx`/`dy` millimetres (4 each by default), painted on top. */
  z.strictObject({
    op: z.literal('duplicate'),
    elementIds: ids30,
    dx: z.number().finite().min(-500).max(500).optional(),
    dy: z.number().finite().min(-500).max(500).optional(),
  }),
  /** The Studio's fill: a photo to the bleed of its page or the spread, unturned, cover, at the back. */
  z.strictObject({
    op: z.literal('fill'),
    elementId: bookElementIdSchema,
    scope: z.enum(['page', 'spread']).describe('Fill its own page to the bleed, or both pages of the spread.'),
  }),
  /** Copy elements of another page onto this one, with new ids; photos are checked against the gallery. */
  z.strictObject({ op: z.literal('copy_from'), spreadId: bookSpreadIdSchema, elementIds: ids30 }),
  /** Bring travel figures up to date with the journey: the named elements, or every one on the page. */
  z.strictObject({ op: z.literal('refresh_travel'), elementIds: ids30.optional() }),
  /** A photo grid as empty frames in a box, the page's safe area by default. */
  z.strictObject({
    op: z.literal('add_grid'),
    grid: bookGridIdSchema.describe('A grid id, as layout takes it.'),
    box: bookFrameInSchema.optional(),
  }),
  /** A lockup: a set title, badge, postmark, quote, caption or chapter mark (book-text-ops.schema.ts). */
  bookAddLockupOpSchema,
] as const;

/** Every element operation as the engine runs it, joined into `bookPageOpSchema`. */
export const BOOK_ELEMENT_OP_SCHEMAS = [bookAddOpSchema, ...BOOK_ELEMENT_EDIT_OP_SCHEMAS] as const;
