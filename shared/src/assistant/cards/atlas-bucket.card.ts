import { idSchema } from '../../common/primitives.schema';
import { atlasCountryCodeSchema, atlasRegionCodeSchema, atlasTallySchema } from './atlas-country.card';
import { cardCountSchema, cardDateSchema, cardText } from './card-parts';

import { z } from 'zod';

/** When a wish is planned for: a year, a month or a day ("2027", "2027-05", "2027-05-14"). */
export const atlasTargetDateSchema = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/);

/** One wish of the bucket list. Never its coordinates: the card names it, the Atlas places it. */
export const atlasBucketEntrySchema = z.object({
  /** Null on a wish that is still to be added. */
  id: idSchema.nullable(),
  name: cardText(120),
  /** Null without a country, and for a legacy alpha-3 code (the card shows a star then). */
  countryCode: atlasCountryCodeSchema.nullable(),
  regionCode: atlasRegionCodeSchema.nullable(),
  targetDate: atlasTargetDateSchema.nullable(),
  notes: cardText(200).nullable(),
  /** The day the wish came true. */
  reachedOn: cardDateSchema.nullable(),
  reachedFrom: z.enum(['manual', 'dawarich']).nullable(),
});

/** What an add, a change or a removal does to the bucket list. */
export const atlasBucketChangeSchema = z.object({
  op: z.enum(['add', 'update', 'remove']),
  /** The wish as it is: set on a change and a removal. */
  before: atlasBucketEntrySchema.nullable(),
  /** The same wish is on the list already, so the add will be refused. */
  duplicate: z.boolean(),
  /** How many wishes the list holds. */
  wishes: atlasTallySchema.nullable(),
});

/**
 * Wishes of the bucket list: the open ones first, soonest first, then the ones
 * that came true. An answer shows the list; a change card shows the one wish
 * it adds, changes or removes (`items[0]`).
 */
export const atlasBucketCardSchema = z.object({
  kind: z.literal('atlasBucket'),
  items: z.array(atlasBucketEntrySchema).min(1).max(12),
  more: cardCountSchema,
  change: atlasBucketChangeSchema.nullable(),
});
export type AtlasBucketCard = z.infer<typeof atlasBucketCardSchema>;
export type AtlasBucketEntry = z.infer<typeof atlasBucketEntrySchema>;
export type AtlasBucketChange = z.infer<typeof atlasBucketChangeSchema>;
