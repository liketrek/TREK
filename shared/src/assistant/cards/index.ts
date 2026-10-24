import { ATLAS_CARD_SCHEMAS } from './atlas.contract';
import { BOOK_DESIGN_CARD_SCHEMAS } from './book-design.contract';
import { BOOK_CARD_SCHEMAS } from './book.contract';
import { BOOKING_CARD_SCHEMAS } from './booking.contract';
import { BUDGET_CARD_SCHEMAS } from './budget.contract';
import { COLLAB_CARD_SCHEMAS } from './collab.contract';
import { COLLECTION_CARD_SCHEMAS } from './collection.contract';
import { HOME_CARD_SCHEMAS } from './home.contract';
import { JOURNEY_CARD_SCHEMAS } from './journey.contract';
import { PACKING_CARD_SCHEMAS } from './packing.contract';
import { ROADTRIP_CARD_SCHEMAS } from './roadtrip.contract';
import { TOUR_CARD_SCHEMAS } from './tour.contract';
import { VACAY_CARD_SCHEMAS } from './vacay.contract';

import { z } from 'zod';

export * from './card-parts';
export * from './atlas.contract';
export * from './book.contract';
export * from './book-design.contract';
export * from './booking.contract';
export * from './budget.contract';
export * from './collab.contract';
export * from './collection.contract';
export * from './home.contract';
export * from './journey.contract';
export * from './packing.contract';
export * from './roadtrip.contract';
export * from './tour.contract';
export * from './vacay.contract';

/**
 * The cards of the assistant chat: one per tool call, drawn beside an answer
 * (a read's result) or inside a change card (what a held write will do, and
 * what it did once applied). Each part of TREK owns its kinds in its
 * `<pkg>.contract.ts`; the server builds every card from the tool's own
 * answer and checks it against this union before it is sent.
 */
const trekCardUnion = z.discriminatedUnion('kind', [
  ...TOUR_CARD_SCHEMAS,
  ...ROADTRIP_CARD_SCHEMAS,
  ...BUDGET_CARD_SCHEMAS,
  ...BOOKING_CARD_SCHEMAS,
  ...COLLAB_CARD_SCHEMAS,
  ...COLLECTION_CARD_SCHEMAS,
  ...ATLAS_CARD_SCHEMAS,
  ...VACAY_CARD_SCHEMAS,
  ...JOURNEY_CARD_SCHEMAS,
  ...PACKING_CARD_SCHEMAS,
  ...BOOK_CARD_SCHEMAS,
  ...BOOK_DESIGN_CARD_SCHEMAS,
  ...HOME_CARD_SCHEMAS,
]);
type TrekCardUnion = typeof trekCardUnion;
/**
 * The card union under a name of its own: the message, part and thread
 * schemas that hold cards then refer to it instead of spelling out every kind
 * again, which made the server's typecheck run out of memory. The one member
 * keeps the interface from being empty; it is the union's own.
 */
export interface TrekCardSchema extends TrekCardUnion {
  readonly options: TrekCardUnion['options'];
}
export const trekCardSchema: TrekCardSchema = trekCardUnion;
export type TrekCard = z.infer<typeof trekCardSchema>;
export type TrekCardKind = TrekCard['kind'];
export type TrekCardOf<K extends TrekCardKind> = Extract<TrekCard, { kind: K }>;

/**
 * How a stored or streamed card is read. A kind this build does not know, a
 * missing field or a value past a bound reads as null and the card is left
 * out, never the message around it: a newer server may write kinds an older
 * client or a rolled back server has not heard of (verified with zod 4.6.5).
 * Keys a kind does not declare are dropped, so a field added later reads too.
 */
export const storedTrekCardSchema = trekCardSchema.nullable().catch(null);

/** The card of one tool call, under that call's id: a read's, or a held or applied write's. */
export const assistantCardSchema = z.object({
  toolCallId: z.string().min(1).max(64),
  card: storedTrekCardSchema,
});
export type AssistantCard = z.infer<typeof assistantCardSchema>;

/** The same as the server writes it: a card the union refuses is a bug in its builder, never a silent null. */
export const assistantCardWriteSchema = assistantCardSchema.extend({ card: trekCardSchema.nullable() });
