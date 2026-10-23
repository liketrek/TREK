import { COLLECTION_STATUSES } from '../../collection/collection.schema';
import { cardCountSchema, cardHexColorSchema, cardPersonSchema, cardText } from './card-parts';
import { collectionCardListSchema } from './collection-places.card';

import { z } from 'zod';

/**
 * The lists a user keeps, as the chat shows them: each with its colour, size
 * and people, an incoming invite with whom it came from, the lists a place is
 * saved in with its status in each, and what a held change does to a list.
 */

/** What a change does to a list; `none` on an answer. */
export const COLLECTION_LIST_CHANGES = [
  'none',
  'add',
  'update',
  'remove',
  'join',
  'decline',
  'withdraw',
  'order',
] as const;

export const collectionListRowSchema = collectionCardListSchema.extend({
  /** The place's status in this list (a lookup of where a place is saved). */
  status: z.enum(COLLECTION_STATUSES).nullable(),
  /** Who sent an incoming invite, or whom a withdrawn one was for. */
  person: cardPersonSchema.nullable(),
  /** An invite the user has not answered yet. */
  invite: z.boolean(),
  change: z.enum(COLLECTION_LIST_CHANGES),
  before: z.object({ name: cardText(120), color: cardHexColorSchema.nullable() }).nullable(),
});
export type CollectionListRow = z.infer<typeof collectionListRowSchema>;

export const collectionListsCardSchema = z.object({
  kind: z.literal('collectionLists'),
  lists: z.array(collectionListRowSchema).max(12),
  more: cardCountSchema,
  /** The place a lookup asked about, as it was asked. */
  place: cardText(120).nullable(),
});
export type CollectionListsCard = z.infer<typeof collectionListsCardSchema>;
