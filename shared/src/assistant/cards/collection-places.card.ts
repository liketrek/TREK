import { COLLECTION_STATUSES } from '../../collection/collection.schema';
import { idSchema } from '../../common/primitives.schema';
import {
  cardCountSchema,
  cardFileKeySchema,
  cardHexColorSchema,
  cardLatSchema,
  cardLngSchema,
  cardPhotoKeySchema,
  cardText,
} from './card-parts';

import { z } from 'zod';

/**
 * Saved places of the collections as the chat shows them: a list's head with
 * its colour, size and people, its places as its rows (status, labels, rating,
 * whether the trip has the place already), and what a held change does to
 * them. A saved place's id is its own and never a trip place's: the one link
 * to the trip is `inTripPlaceId`.
 */

const statusSchema = z.enum(COLLECTION_STATUSES);

/** The fields of a saved place a change can touch, each named on the card by its label. */
export const COLLECTION_CARD_FIELDS = [
  'name',
  'address',
  'coordinates',
  'description',
  'notes',
  'category',
  'link',
  'photo',
] as const;

/** What a change does to a label of a list; `none` on an answer. */
export const COLLECTION_LABEL_CHANGES = ['none', 'add', 'rename', 'remove'] as const;

/** A list as a card names it: its colour dot, its size and how many share it. `id` null: the list a change creates. */
export const collectionCardListSchema = z.object({
  id: idSchema.nullable(),
  name: cardText(120),
  color: cardHexColorSchema.nullable(),
  placeCount: cardCountSchema.nullable(),
  /** Accepted members besides the owner. */
  memberCount: cardCountSchema,
  /** Places per status, only where the whole list was read. */
  counts: z.object({ idea: cardCountSchema, want: cardCountSchema, visited: cardCountSchema }).nullable(),
});
export type CollectionCardList = z.infer<typeof collectionCardListSchema>;

export const collectionCardLabelSchema = z.object({
  id: idSchema.nullable(),
  name: cardText(60),
  color: cardHexColorSchema.nullable(),
  /** How many places of its list carry it, where the whole list was read. */
  places: cardCountSchema.nullable(),
  change: z.enum(COLLECTION_LABEL_CHANGES),
  before: z.object({ name: cardText(60), color: cardHexColorSchema.nullable() }).nullable(),
});
export type CollectionCardLabel = z.infer<typeof collectionCardLabelSchema>;

/** What a held change does to one saved place. */
export const collectionCardDeltaSchema = z.object({
  status: z.object({ from: statusSchema.nullable(), to: statusSchema }).nullable(),
  /** The user's own vote; `to: null` takes it away. */
  rating: z.object({ to: z.number().int().min(1).max(5).nullable() }).nullable(),
  labelsAdded: z.array(idSchema).max(10),
  labelsRemoved: z.array(idSchema).max(10),
  fields: z.array(z.enum(COLLECTION_CARD_FIELDS)).max(8),
  movedTo: collectionCardListSchema.nullable(),
  removed: z.boolean(),
});
export type CollectionCardDelta = z.infer<typeof collectionCardDeltaSchema>;

export const collectionCardPlaceSchema = z.object({
  /** The saved place's own id; null before a save is applied. */
  id: idSchema.nullable(),
  listId: idSchema.nullable(),
  name: cardText(120),
  address: cardText(200).nullable(),
  lat: cardLatSchema.nullable(),
  lng: cardLngSchema.nullable(),
  category: z
    .object({ name: cardText(60), icon: cardText(40).nullable(), color: cardHexColorSchema.nullable() })
    .nullable(),
  status: statusSchema,
  labelIds: z.array(idSchema).max(10),
  rating: z.number().min(1).max(5).nullable(),
  ratingCount: cardCountSchema,
  /** The Google place id the photo proxy finds its picture by. */
  googlePlaceId: cardPhotoKeySchema.nullable(),
  osmId: cardText(40).nullable(),
  /** The file name of its own uploaded photo; the client builds `/uploads/places/<key>`. */
  imageKey: cardFileKeySchema.nullable(),
  /** The same place in the chat's trip, by its provider id or the trip place it was saved from. */
  inTripPlaceId: idSchema.nullable(),
  /** The lists that hold the place already (a save's warning). */
  savedIn: z.array(z.object({ listId: idSchema, name: cardText(120), status: statusSchema })).max(3),
  delta: collectionCardDeltaSchema.nullable(),
});
export type CollectionCardPlace = z.infer<typeof collectionCardPlaceSchema>;

/** What an applied change of several places did, from the tool's answer. */
export const collectionCardOutcomeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('duplicate'), name: cardText(120) }),
  z.object({
    type: z.literal('copied'),
    copied: cardCountSchema,
    skipped: cardCountSchema,
    skippedNames: z.array(cardText(120)).max(5),
  }),
  z.object({ type: z.literal('statusSet'), updated: cardCountSchema, found: cardCountSchema }),
]);
export type CollectionCardOutcome = z.infer<typeof collectionCardOutcomeSchema>;

export const collectionPlacesCardSchema = z.object({
  kind: z.literal('collectionPlaces'),
  /** Null when the places sit in several lists. */
  list: collectionCardListSchema.nullable(),
  places: z.array(collectionCardPlaceSchema).max(8),
  more: cardCountSchema,
  /** Only the labels the shown places carry or the change names. */
  labels: z.array(collectionCardLabelSchema).max(24),
  outcome: collectionCardOutcomeSchema.nullable(),
  /** A status set on a trip place in every list that holds it. */
  everyList: z.boolean(),
  /** A copy into a trip other than the chat's. */
  otherTrip: z.boolean(),
});
export type CollectionPlacesCard = z.infer<typeof collectionPlacesCardSchema>;
