import { z } from 'zod';

/**
 * The photo look: what a picture wears beyond its crop, mask and frame style.
 *
 * - `border`: a band of one colour along the inside of the frame, `width`
 *   millimetres deep, following the mask when the picture is cut to a shape
 *   (the 3 to 6 mm white border of a postcard print).
 * - `shadow`: a hard copy of the picture's outline in one colour, offset by
 *   `dx`/`dy` millimetres and drawn behind it at `alpha`. No blur, so it prints
 *   as vector like everything else on the page.
 * - `zoom`: 1 to 4 times the crop the fit gives, centred on the focal point,
 *   so the focal point keeps meaning what it meant.
 * - `flipX`: the picture mirrored left to right inside its frame; the frame,
 *   the mask and the border stay as they are.
 * - `adjust`: brightness, contrast, saturation and warmth, each -1 to 1 with 0
 *   as shot. Drawn as filters, so the picture prints as a raster.
 * - `duotone`: the picture's tones mapped from `dark` to `light`, also a
 *   filter and also raster in print.
 * - `cutout`: a die-cut edge, the outline of the mask (or of the rounded
 *   rectangle) grown by `width` millimetres and filled behind the picture: the
 *   sticker look.
 *
 * Every field is optional and null means off, so a document from before them
 * reads as it always did and an older reader that drops them still draws the
 * picture. A value the reader cannot read falls back to off rather than
 * failing the photo or its page.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');

/** The zoom range, against the crop the fit gives on its own. */
export const PHOTO_ZOOM = { min: 1, max: 4 } as const;
/** How deep a border or a cutout may be, in millimetres. */
export const PHOTO_EDGE_MAX = 30;
/** How far a hard shadow may fall, in millimetres either way. */
export const PHOTO_SHADOW_REACH = 30;

type ObjectFactory = typeof z.object | typeof z.strictObject;

/**
 * The parts, built once for the document (plain objects, which drop a field
 * they do not know, as the rest of the document does) and once for the
 * operations (strict, as every operation is), so the two cannot drift.
 */
function lookSchemas(obj: ObjectFactory) {
  const edge = obj({ width: z.number().min(0.1).max(PHOTO_EDGE_MAX), color: hex });
  const reach = z.number().finite().min(-PHOTO_SHADOW_REACH).max(PHOTO_SHADOW_REACH);
  const signed = z.number().min(-1).max(1).optional();
  return {
    edge,
    shadow: obj({ dx: reach, dy: reach, color: hex, alpha: z.number().min(0).max(1) }),
    zoom: z.number().min(PHOTO_ZOOM.min).max(PHOTO_ZOOM.max),
    adjust: obj({ brightness: signed, contrast: signed, saturation: signed, warmth: signed }),
    duotone: obj({ dark: hex, light: hex }),
  };
}

const doc = lookSchemas(z.object);

export const bookPhotoEdgeSchema = doc.edge;
export const bookPhotoShadowSchema = doc.shadow;
export const bookPhotoAdjustSchema = doc.adjust;
export const bookPhotoDuotoneSchema = doc.duotone;
export type BookPhotoEdge = z.infer<typeof bookPhotoEdgeSchema>;
export type BookPhotoShadow = z.infer<typeof bookPhotoShadowSchema>;
export type BookPhotoAdjust = z.infer<typeof bookPhotoAdjustSchema>;
export type BookPhotoDuotone = z.infer<typeof bookPhotoDuotoneSchema>;

/** Optional, null for off, and off again when the stored value cannot be read. */
const field = <T extends z.ZodType>(schema: T) => schema.nullable().optional().catch(undefined);

/** The fields a photo element carries, spread into its schema in book.schema.ts. */
export const BOOK_PHOTO_LOOK_FIELDS = {
  border: field(doc.edge),
  shadow: field(doc.shadow),
  zoom: doc.zoom.optional().catch(undefined),
  flipX: z.boolean().optional().catch(undefined),
  adjust: field(doc.adjust),
  duotone: field(doc.duotone),
  cutout: field(doc.edge),
};

/** The names of the look fields, for the operations that take any of them. */
export const BOOK_PHOTO_LOOK_KEYS = Object.keys(BOOK_PHOTO_LOOK_FIELDS) as (keyof typeof BOOK_PHOTO_LOOK_FIELDS)[];

const ops = lookSchemas(z.strictObject);

/**
 * The look fields as the `style` operation takes them. Short descriptions on
 * purpose: the page edit's tool schema is held under a size ceiling.
 */
export const BOOK_PHOTO_LOOK_PROPS = {
  border: ops.edge.nullable().optional().describe('A band inside the frame edge, width mm; null removes it.'),
  shadow: ops.shadow.nullable().optional().describe('A hard offset shadow, dx/dy mm, alpha 0..1; null removes it.'),
  zoom: ops.zoom.optional().describe('1 to 4 times the crop, about the focal point.'),
  flipX: z.boolean().optional().describe('Mirror the picture left to right.'),
  adjust: ops.adjust
    .nullable()
    .optional()
    .describe('Each -1..1, 0 or left out is as shot; prints as raster. null resets.'),
  duotone: ops.duotone.nullable().optional().describe('Tones mapped from dark to light; prints as raster.'),
  cutout: ops.edge.nullable().optional().describe('A die-cut edge grown width mm around the shape, behind the photo.'),
};
