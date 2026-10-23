import { idSchema } from '../../common/primitives.schema';

import { z } from 'zod';

/**
 * The pieces every card of the assistant chat is built from. A kind uses
 * these, `idSchema` and its domain's own enums, nothing else, so every card
 * bounds its text the same way and none of them carries a URL or a path: a
 * picture travels as a key the client turns into TREK's own address.
 */

/** One line of text, clipped and masked by the server before it is sent. */
export const cardText = (max: number) => z.string().min(1).max(max);

export const cardLatSchema = z.number().min(-90).max(90);
export const cardLngSchema = z.number().min(-180).max(180);

/** A point of a line to draw, `[lat, lng]` at five decimals; single points are `{ lat, lng }` objects. */
export type CardPoint = [number, number];
// Re-typed on the way out: server and client compile without strictNullChecks, where an inferred tuple
// makes every item optional and no longer fits a `[number, number]`.
export const cardPointSchema = z.tuple([cardLatSchema, cardLngSchema]).transform(([lat, lng]): CardPoint => [lat, lng]);

export const cardDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const cardClockSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const cardInstantSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

/** A colour the data carries (a member's, a category's); the client draws it through safeHexColor. */
export const cardHexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const cardCurrencySchema = z.string().regex(/^[A-Z]{3}$/);
export const cardMoneySchema = z.object({ amount: z.number().min(-1e9).max(1e9), currency: cardCurrencySchema });
export const cardCountSchema = z.number().int().min(0).max(1_000_000);

/** A stored file name (an avatar, a place image): the client builds TREK's own path. Never a URL, never a path. */
export const cardFileKeySchema = z.string().regex(/^(?!.*\.\.)[A-Za-z0-9][\w.-]{0,199}$/);

/** A Google place id for TREK's photo proxy, like a found place's photo key without `coords:`. */
export const cardPhotoKeySchema = z.string().regex(/^[\w-]{1,200}$/);

/** A traveller as a card shows them: the client compares `id` with the signed-in user, so no card says "me". */
export const cardPersonSchema = z.object({
  id: idSchema,
  name: cardText(80),
  avatarKey: cardFileKeySchema.nullable(),
});

/** A trip day: its id for links, its number or date for words. */
export const cardDaySchema = z.object({
  id: idSchema.nullable(),
  number: z.number().int().min(1).max(999).nullable(),
  date: cardDateSchema.nullable(),
});

/** The most one card may weigh, as JSON text; a heavier one is not sent at all. */
export const MAX_CARD_CHARS = 24_000;

export type CardMoney = z.infer<typeof cardMoneySchema>;
export type CardPerson = z.infer<typeof cardPersonSchema>;
export type CardDay = z.infer<typeof cardDaySchema>;
